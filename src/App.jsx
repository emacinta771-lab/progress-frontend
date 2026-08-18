import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/login';
import StudentLogin from './components/studentlogin';
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard Components
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AccountantDashboard from './components/AccountantDashboard';
import StudentDashboard from './components/StudentDashboard';

// Student Management
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import AdminCreateStudent from './components/AdminCreateStudent';
import StudentRegister from './components/StudentRegister';

// User Management
import UserManagement from './components/UserManagement';

// Fee & Payment Management
import FeeManagement from './components/FeeManagement';
import PaymentManagement from './components/PaymentManagement';
import FeeStructure from './components/FeeStructure';

// Attendance & Grades
import AttendanceManagement from './components/AttendanceManagement';
import GradeManagement from './components/GradeManagement';
import MyClass from './components/MyClass';

// Reports
import Reports from './components/Reports';

// Teacher Management
import TeacherManagement from './components/TeacherManagement';

// Settings
import Settings from './components/Settings';
import ReceiptRepository from './components/ReceiptRepository';

import './index.css';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-[#f0f7ff]">
        <Routes>
          {/* ========================================== */}
          {/* PUBLIC ROUTES (No authentication required) */}
          {/* ========================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-register" element={<StudentRegister />} />

          {/* Root path redirects to staff login (default entry point) */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ========================================== */}
          {/* DASHBOARD ROUTES */}
          {/* ========================================== */}

          {/* Default Dashboard - Redirects based on role */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          {/* Teacher Dashboard */}
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute requiredRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Accountant Dashboard */}
          <Route path="/accountant-dashboard" element={
            <ProtectedRoute requiredRoles={['accountant']}>
              <AccountantDashboard />
            </ProtectedRoute>
          } />

          {/* Student Dashboard - Serves both students and parents */}
          <Route path="/student-dashboard" element={
            <ProtectedRoute requiredRoles={['student', 'parent']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* STUDENT MANAGEMENT ROUTES */}
          {/* ========================================== */}

          {/* List all students */}
          <Route path="/students" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'accountant']}>
              <StudentList />
            </ProtectedRoute>
          } />

          {/* Teacher list shortcut */}
          <Route path="/my-students" element={
            <ProtectedRoute requiredRoles={['teacher']}>
              <StudentList />
            </ProtectedRoute>
          } />

          {/* View student details */}
          <Route path="/students/:studentId" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'accountant']}>
              <StudentDetails />
            </ProtectedRoute>
          } />

          {/* Add new student */}
          <Route path="/add-student" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <StudentForm />
            </ProtectedRoute>
          } />

          {/* Edit student */}
          <Route path="/students/:studentId/edit" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <StudentForm />
            </ProtectedRoute>
          } />

          {/* Admin create student account */}
          <Route path="/admin/create-student" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminCreateStudent />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* USER & TEACHER MANAGEMENT ROUTES */}
          {/* ========================================== */}

          {/* User Management (Admin only) */}
          <Route path="/users" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          {/* Teacher Management (Admin only) */}
          <Route path="/teachers" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <TeacherManagement />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* FEE & PAYMENT ROUTES */}
          {/* ========================================== */}

          {/* Payment Management */}
          <Route path="/payments" element={
            <ProtectedRoute requiredRoles={['admin', 'accountant']}>
              <PaymentManagement />
            </ProtectedRoute>
          } />

          {/* Fee Management for specific student */}
          <Route path="/fees/:studentId" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'accountant']}>
              <FeeManagement />
            </ProtectedRoute>
          } />

          {/* Fee Structure */}
          <Route path="/fee-structure" element={
            <ProtectedRoute requiredRoles={['admin', 'accountant']}>
              <FeeStructure />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* ATTENDANCE & GRADE ROUTES */}
          {/* ========================================== */}

          {/* Attendance Management */}
          <Route path="/attendance" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <AttendanceManagement />
            </ProtectedRoute>
          } />

          {/* Grade Management */}
          <Route path="/grades" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <GradeManagement />
            </ProtectedRoute>
          } />

          {/* My Class (Teacher view) */}
          <Route path="/my-class" element={
            <ProtectedRoute requiredRoles={['teacher']}>
              <MyClass />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* REPORTS ROUTES */}
          {/* ========================================== */}
          <Route path="/reports" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'accountant']}>
              <Reports />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* SETTINGS ROUTE */}
          {/* ========================================== */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Receipt repository */}
          <Route path="/receipt-repository" element={
            <ProtectedRoute requiredRoles={['admin', 'accountant']}>
              <ReceiptRepository />
            </ProtectedRoute>
          } />

          {/* ========================================== */}
          {/* FALLBACK ROUTES */}
          {/* ========================================== */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
