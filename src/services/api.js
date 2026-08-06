import axios from 'axios';

// Prefer explicit VITE_API_URL. Ensure it includes the `/api` suffix.
const DEFAULT_RENDER_API = 'https://progress-backend-sqrr.onrender.com/api';
function ensureApiSuffix(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    // preserve host+protocol and append /api if pathname doesn't include it
    if (u.pathname.endsWith('/api')) return raw.replace(/\/+$/, '');
    return raw.replace(/\/+$/, '') + '/api';
  } catch (e) {
    // raw may be a relative string; fallback to simple check
    return raw.endsWith('/api') ? raw : raw.replace(/\/+$/, '') + '/api';
  }
}

const rawEnvUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawEnvUrl
  ? ensureApiSuffix(rawEnvUrl)
  : (import.meta.env.PROD ? DEFAULT_RENDER_API : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH API
// ==========================================
export const authAPI = {
  // Login user
  login: (username, password) => api.post('/auth/login', { username, password }),
  
  // Register new user (admin only)
  register: (userData) => api.post('/auth/register', userData),
  
  // Register student (self-registration)
  registerStudent: (userData) => api.post('/auth/register-student', userData),
  
  // Create student account (admin only)
  createStudentAccount: (userData) => api.post('/auth/create-student-account', userData),
  
  // Verify student code
  verifyStudent: (studentCode) => api.post('/auth/verify-student', { studentCode }),
  
  // Get current user profile
  getProfile: () => api.get('/auth/me'),
  
  // Change password
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  // Reset password (admin only)
  resetPassword: (studentId, newPassword) => 
    api.post(`/auth/reset-password/${studentId}`, { newPassword }),
  
  // Get all users (admin only)
  getUsers: () => api.get('/auth/users'),
  
  // Get user by ID (admin only)
  getUserById: (userId) => api.get(`/auth/users/${userId}`),
  
  // Update user (admin only)
  updateUser: (userId, data) => api.put(`/auth/users/${userId}`, data),
  
  // Delete user (admin only)
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
  
  // Toggle user status (admin only)
  toggleUserStatus: (userId) => api.put(`/auth/users/${userId}/toggle-status`),
  
  // Deactivate user (admin only)
  deactivateUser: (userId) => api.put(`/auth/users/${userId}/deactivate`),
  
  // Activate user (admin only)
  activateUser: (userId) => api.put(`/auth/users/${userId}/activate`),
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ==========================================
// CREDENTIAL API
// ==========================================
export const credentialAPI = {
  // Get all student credentials
  getAll: () => api.get('/credentials'),
  
  // Get credentials by student ID
  getByStudentId: (studentId) => api.get(`/credentials/student/${studentId}`),
  
  // Create credentials
  create: (data) => api.post('/credentials', data),
  
  // Update credentials
  update: (id, data) => api.put(`/credentials/${id}`, data),
  
  // Delete credentials
  delete: (id) => api.delete(`/credentials/${id}`),
  
  // Get summary
  getSummary: () => api.get('/credentials/summary'),
};

// ==========================================
// STUDENT API
// ==========================================
export const studentAPI = {
  // Get all students
  getAll: () => api.get('/students'),
  
  // Get student by ID
  getById: (id) => api.get(`/students/${id}`),
  
  // Get student by student code
  getByCode: (studentCode) => api.get(`/students/code/${studentCode}`),
  
  // Get student by user ID
  getByUserId: (userId) => api.get(`/students/user/${userId}`),
  
  // Get students by standard
  getByStandard: (standard) => api.get(`/students/standard/${standard}`),
  
  // Get students with outstanding fees
  getOutstandingFees: () => api.get('/students/outstanding-fees'),
  
  // Get students without accounts
  getWithoutAccounts: () => api.get('/students/without-accounts'),
  
  // Get recent students
  getRecent: (limit = 5) => api.get(`/students/recent?limit=${limit}`),
  
  // Get children for parent
  getChildren: (parentId) => api.get(`/students/parent/${parentId}`),
  
  // Create new student
  create: (data) => api.post('/students', data),
  
  // Update student
  update: (id, data) => api.put(`/students/${id}`, data),
  
  // Update student fees only
  updateFees: (id, data) => api.put(`/students/${id}/fees`, data),
  
  // Delete student
  delete: (id) => api.delete(`/students/${id}`),
  
  // Search students
  search: (query) => api.get(`/students/search/${query}`),
  
  // Get student fees
  getFees: (id) => api.get(`/students/${id}/fees`),
  
  // Get fee status
  getFeeStatus: (id) => api.get(`/students/${id}/fees`),
  
  // Record payment
  recordPayment: (id, paymentData) => api.post(`/students/${id}/payments`, paymentData),
  
  // Get payment history
  getPaymentHistory: (id) => api.get(`/students/${id}/payments`),
  
  // Get statistics
  getStats: () => api.get('/students/stats/overview'),
  
  // Get all payments (accountant)
  getAllPayments: (limit = 50, offset = 0) => 
    api.get(`/students/payments/all?limit=${limit}&offset=${offset}`),
  
  // Get payment summary
  getPaymentSummary: () => api.get('/students/payments/summary'),
  
  // Bulk update status
  bulkUpdateStatus: (data) => api.post('/students/bulk-status', data)
};

// ==========================================
// PAYMENT API
// ==========================================
export const paymentAPI = {
  // Get all payments with pagination
  getAllPayments: (limit = 50, offset = 0) => 
    api.get(`/payments/all?limit=${limit}&offset=${offset}`),
  
  // Get recent payments
  getRecentPayments: (limit = 10) => 
    api.get(`/payments/recent?limit=${limit}`),
  
  // Get payment summary
  getPaymentSummary: (period = 'month') => 
    api.get(`/payments/summary?period=${period}`),
  
  // Get payment by ID
  getPaymentById: (id) => 
    api.get(`/payments/${id}`),
  
  // Get payment by receipt number
  getPaymentByReceipt: (receiptNumber) => 
    api.get(`/payments/receipt/${receiptNumber}`),
  
  // Scan receipt (with file upload)
  scanReceipt: (data) => {
    const formData = new FormData();
    formData.append('receipt', data.image);
    if (data.student_id) {
      formData.append('student_id', data.student_id);
    }
    return api.post('/payments/scan-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Record payment (create)
  recordPayment: (studentId, data) => 
    api.post(`/students/${studentId}/payments`, data),
  
  // Create payment directly
  createPayment: (data) => 
    api.post('/payments', data),
  
  // Update payment
  updatePayment: (id, data) => 
    api.put(`/payments/${id}`, data),
  
  // Delete payment
  deletePayment: (id) => 
    api.delete(`/payments/${id}`),
  
  // Generate invoice
  generateInvoice: (studentId) => 
    api.get(`/payments/invoice/${studentId}`),
  
  // Get payment history for student
  getPaymentHistory: (studentId) => 
    api.get(`/students/${studentId}/payments`),
  
  // Get payment stats by standard
  getStatsByStandard: () => 
    api.get('/payments/stats/by-standard')
};

// ==========================================
// RECEIPT REPOSITORY API
// ==========================================
export const receiptAPI = {
  // Upload receipt (student)
  uploadReceipt: (data) => {
    const formData = new FormData();
    formData.append('receipt', data.receipt);
    formData.append('student_id', data.student_id);
    formData.append('student_name', data.student_name || '');
    formData.append('student_code', data.student_code || '');
    
    return api.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Upload receipt with AI-extracted data
  uploadReceiptWithAI: (data) => {
    const formData = new FormData();
    formData.append('receipt', data.receipt);
    formData.append('student_id', data.student_id);
    formData.append('student_name', data.student_name || '');
    formData.append('student_code', data.student_code || '');
    formData.append('amount', data.amount || '');
    formData.append('payment_date', data.payment_date || '');
    formData.append('receipt_number', data.receipt_number || '');
    formData.append('payment_method', data.payment_method || '');
    formData.append('confidence', data.confidence || 0);
    formData.append('ai_analyzed', 'true');
    
    return api.post('/receipts/upload-with-ai', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get all receipts (accountant)
  getAllReceipts: (params = {}) => {
    return api.get('/receipts', { params });
  },
  
  // Get receipt by ID
  getReceiptById: (id) => api.get(`/receipts/${id}`),
  
  // AI Analyze receipt with Gemini Vision
  aiAnalyzeReceipt: (id) => api.post(`/receipts/${id}/ai-analyze`),
  
  // Analyze receipt (legacy)
  analyzeReceipt: (id, data) => api.post(`/receipts/${id}/analyze`, data),
  
  // Verify receipt
  verifyReceipt: (id, data) => api.put(`/receipts/${id}/verify`, data),
  
  // Reject receipt
  rejectReceipt: (id, data) => api.put(`/receipts/${id}/reject`, data),
  
  // Get receipt statistics
  getReceiptStats: () => api.get('/receipts/stats/summary'),
  
  // Delete receipt
  deleteReceipt: (id) => api.delete(`/receipts/${id}`),
};

// ==========================================
// CREDENTIALS API
// ==========================================
export const credentialsAPI = {
  // Get all credentials
  getAll: () => api.get('/credentials'),
  
  // Get credentials by student ID
  getByStudentId: (studentId) => api.get(`/credentials/student/${studentId}`),
  
  // Create credentials
  create: (data) => api.post('/credentials', data),
  
  // Update credentials
  update: (id, data) => api.put(`/credentials/${id}`, data),
  
  // Delete credentials
  delete: (id) => api.delete(`/credentials/${id}`),
  
  // Get summary
  getSummary: () => api.get('/credentials/summary'),
};

// ==========================================
// TEACHER API
// ==========================================
export const teacherAPI = {
  // Get all teachers
  getAll: () => api.get('/teachers'),
  
  // Get teacher by ID
  getById: (id) => api.get(`/teachers/${id}`),
  
  // Create teacher
  create: (data) => api.post('/teachers', data),
  
  // Create teacher login account
  createLogin: (data) => api.post('/auth/create-teacher-account', data),
  
  // Update teacher
  update: (id, data) => api.put(`/teachers/${id}`, data),
  
  // Delete teacher
  delete: (id) => api.delete(`/teachers/${id}`),
  
  // Get teacher's classes
  getClasses: (id) => api.get(`/teachers/${id}/classes`),
  
  // Get teacher's students
  getStudents: (id) => api.get(`/teachers/${id}/students`),
};

// ==========================================
// ATTENDANCE API
// ==========================================
export const attendanceAPI = {
  // Get all attendance records
  getAll: () => api.get('/attendance'),
  
  // Get attendance for a student
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  
  // Get attendance for a class
  getByClass: (classId) => api.get(`/attendance/class/${classId}`),
  
  // Get attendance for a date
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  
  // Record attendance
  record: (data) => api.post('/attendance', data),
  
  // Update attendance
  update: (id, data) => api.put(`/attendance/${id}`, data),
  
  // Get attendance summary
  getSummary: (studentId) => api.get(`/attendance/summary/${studentId}`),
  
  // Get today's attendance
  getToday: () => api.get('/attendance/today'),
};

// ==========================================
// GRADE API
// ==========================================
export const gradeAPI = {
  // Get all grades
  getAll: () => api.get('/grades'),
  
  // Get grades for a student
  getByStudent: (studentId) => api.get(`/grades/student/${studentId}`),
  
  // Get grades for a class
  getByClass: (classId) => api.get(`/grades/class/${classId}`),
  
  // Enter grades
  enterGrades: (data) => api.post('/grades', data),
  
  // Update grade
  update: (id, data) => api.put(`/grades/${id}`, data),
  
  // Get grade summary
  getSummary: (studentId) => api.get(`/grades/summary/${studentId}`),
  
  // Get grade statistics
  getStats: () => api.get('/grades/stats'),
};

// ==========================================
// USER API
// ==========================================
export const userAPI = {
  // Get all users
  getAll: () => api.get('/auth/users'),
  
  // Get user by ID
  getById: (id) => api.get(`/auth/users/${id}`),
  
  // Update user
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  
  // Delete user
  delete: (id) => api.delete(`/auth/users/${id}`),
  
  // Change role
  changeRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
};

// ==========================================
// FEE STRUCTURE API
// ==========================================
export const feeAPI = {
  // Get fee structure
  getFeeStructure: () => api.get('/fee-structure'),
  
  // Update fee structure
  updateFeeStructure: (id, data) => api.put(`/fee-structure/${id}`, data),
  
  // Get fee structure by standard
  getByStandard: (standard) => api.get(`/fee-structure/${standard}`),
  
  // Create fee structure
  create: (data) => api.post('/fee-structure', data),
  
  // Delete fee structure
  delete: (id) => api.delete(`/fee-structure/${id}`),
};

// ==========================================
// REPORT API
// ==========================================
export const reportAPI = {
  // Generate student report
  studentReport: (studentId) => api.get(`/reports/student/${studentId}`),
  
  // Generate class report
  classReport: (classId) => api.get(`/reports/class/${classId}`),
  
  // Generate financial report
  financialReport: (params) => api.get('/reports/financial', { params }),
  
  // Generate attendance report
  attendanceReport: (params) => api.get('/reports/attendance', { params }),
  
  // Generate performance report
  performanceReport: (params) => api.get('/reports/performance', { params }),
  
  // Export report
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

// ==========================================
// DASHBOARD API
// ==========================================
export const dashboardAPI = {
  // Get admin dashboard stats
  getAdminStats: () => api.get('/dashboard/admin'),
  
  // Get teacher dashboard stats
  getTeacherStats: () => api.get('/dashboard/teacher'),
  
  // Get accountant dashboard stats
  getAccountantStats: () => api.get('/dashboard/accountant'),
  
  // Get student dashboard stats
  getStudentStats: (studentId) => api.get(`/dashboard/student/${studentId}`),
  
  // Get parent dashboard stats
  getParentStats: (parentId) => api.get(`/dashboard/parent/${parentId}`),
};

// ==========================================
// NOTIFICATION API
// ==========================================
export const notificationAPI = {
  // Get notifications
  getNotifications: () => api.get('/notifications'),
  
  // Mark notification as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Send notification
  sendNotification: (data) => api.post('/notifications', data),
};

// ==========================================
// DEFAULT EXPORT
// ==========================================
export default api;