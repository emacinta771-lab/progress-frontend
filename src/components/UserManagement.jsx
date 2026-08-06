import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'teacher'
  });

  const allowedCreateRoles = ['admin', 'teacher', 'accountant'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUsers();
      setUsers(response.data.users || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    if (userId === currentUser?.id) {
      setError('You cannot deactivate your own account.');
      return;
    }
    
    try {
      await authAPI.toggleUserStatus(userId);
      setSuccess('User status updated successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle user status');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await authAPI.register(registerData);
      setSuccess('✅ User created successfully!');
      setShowRegister(false);
      setRegisterData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'teacher'
      });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await authAPI.deleteUser(userId);
        setSuccess('✅ User deleted successfully!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setRegisterData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });
    setShowRegister(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = {
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        email: registerData.email,
        role: registerData.role
      };
      
      // Only include password if it's being changed
      if (registerData.password) {
        updateData.password = registerData.password;
      }

      await authAPI.updateUser(editingUser.id, updateData);
      setSuccess('✅ User updated successfully!');
      setShowRegister(false);
      setEditingUser(null);
      setRegisterData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'teacher'
      });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleCancel = () => {
    setShowRegister(false);
    setEditingUser(null);
    setError('');
    setSuccess('');
    setRegisterData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'teacher'
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      teacher: 'bg-blue-100 text-blue-700 border-blue-200',
      accountant: 'bg-green-100 text-green-700 border-green-200',
      student: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      parent: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003C43]">👥 User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setShowRegister(!showRegister)}
          className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
            showRegister 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-[#135D66] text-white hover:bg-[#0e4a52]'
          }`}
        >
          {showRegister ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <span>❌</span> {error}
          </p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
          <p className="text-green-700 text-sm flex items-center gap-2">
            <span>✅</span> {success}
          </p>
        </div>
      )}

      {/* Register/Edit Form */}
      {showRegister && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-[#003C43] mb-4">
            {editingUser ? '✏️ Edit User' : '➕ Create New User'}
          </h3>
          <form onSubmit={editingUser ? handleUpdate : handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username *"
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
              disabled={!!editingUser}
            />
            <input
              type="email"
              placeholder="Email *"
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            />
            <input
              type="password"
              placeholder={editingUser ? "New Password (leave blank to keep current)" : "Password *"}
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required={!editingUser}
            />
            <input
              type="text"
              placeholder="First Name *"
              value={registerData.first_name}
              onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={registerData.last_name}
              onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            />
            <select
              value={registerData.role}
              onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            >
              {allowedCreateRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Username</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Password</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Role</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium text-gray-800">
                    {user.username}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </td>
                  <td className="p-3">{user.first_name} {user.last_name}</td>
                  <td className="p-3 text-sm text-gray-600">{user.email}</td>
                  <td className="p-3 text-sm font-mono text-[#135D66]">{user.password_plain || '••••••••'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${user.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition whitespace-nowrap"
                        disabled={user.id === currentUser?.id}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-3 py-1 text-sm rounded transition whitespace-nowrap
                          ${user.is_active ? 
                            'bg-red-100 text-red-700 hover:bg-red-200' : 
                            'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        disabled={user.id === currentUser?.id}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition whitespace-nowrap"
                        disabled={user.id === currentUser?.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between gap-2 text-sm text-gray-500">
        <span>Total Users: <strong>{users.length}</strong></span>
        <span>Active: <strong className="text-green-600">{users.filter(u => u.is_active).length}</strong></span>
        <span>Inactive: <strong className="text-red-600">{users.filter(u => !u.is_active).length}</strong></span>
        <span>Admins: <strong className="text-purple-600">{users.filter(u => u.role === 'admin').length}</strong></span>
      </div>
    </div>
  );
};

export default UserManagement;