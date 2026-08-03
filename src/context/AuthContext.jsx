import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH USER PROFILE
  // ==========================================
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data?.user) {
        setUser(response.data.user);
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // If token is invalid, logout
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // CHECK IF USER IS LOGGED IN ON MOUNT
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // If we have saved user data, set it immediately
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (e) {
          console.error('Error parsing saved user:', e);
          localStorage.removeItem('user');
        }
      }
      
      // Then verify with server
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await authAPI.login(username, password);
      
      if (response.data.success) {
        const { token, user, redirect } = response.data;
        
        // Save token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        setLoading(false);
        
        return { 
          success: true, 
          user, 
          redirect: redirect || '/dashboard' 
        };
      } else {
        const errorMsg = response.data.error || 'Login failed';
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Network error. Please try again.';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  }, []);

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      return { 
        success: true, 
        message: response.data.message || 'Password changed successfully' 
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to change password' 
      };
    }
  };

  // ==========================================
  // REGISTER USER (Admin only)
  // ==========================================
  const registerUser = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message || 'User created successfully'
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to create user' 
      };
    }
  };

  // ==========================================
  // TOGGLE USER STATUS (Admin only)
  // ==========================================
  const toggleUserStatus = async (userId) => {
    try {
      const response = await authAPI.toggleUserStatus(userId);
      return { 
        success: true, 
        is_active: response.data.is_active,
        message: response.data.message || 'User status updated'
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to toggle user status' 
      };
    }
  };

  // ==========================================
  // UPDATE USER (Admin only)
  // ==========================================
  const updateUser = async (userId, userData) => {
    try {
      const response = await authAPI.updateUser(userId, userData);
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message || 'User updated successfully'
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to update user' 
      };
    }
  };

  // ==========================================
  // DELETE USER (Admin only)
  // ==========================================
  const deleteUser = async (userId) => {
    try {
      const response = await authAPI.deleteUser(userId);
      return { 
        success: true, 
        message: response.data.message || 'User deleted successfully'
      };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to delete user' 
      };
    }
  };

  // ==========================================
  // CHECK ROLE HELPERS
  // ==========================================
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isAccountant = user?.role === 'accountant';
  const isStudent = user?.role === 'student' || user?.is_student;
  const isParent = user?.role === 'parent' || user?.is_parent;

  // ==========================================
  // GET DASHBOARD PATH
  // ==========================================
  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    
    const roleMap = {
      admin: '/admin-dashboard',
      teacher: '/teacher-dashboard',
      accountant: '/accountant-dashboard',
      student: '/student-dashboard',
      parent: '/student-dashboard'
    };
    
    return roleMap[user.role] || '/dashboard';
  }, [user]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    registerUser,
    toggleUserStatus,
    updateUser,
    deleteUser,
    hasRole,
    getDashboardPath,
    isAuthenticated: !!user,
    isAdmin,
    isTeacher,
    isAccountant,
    isStudent,
    isParent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;