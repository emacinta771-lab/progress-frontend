import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myStudents, setMyStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [loadingStudentInfo, setLoadingStudentInfo] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getAll()
      ]);
      setStats(statsRes.data.stats);
      setAllStudents(studentsRes.data.students || []);
      setMyStudents(studentsRes.data.students?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { title: 'Dashboard', path: '/teacher-dashboard', icon: '📊' },
    { title: 'Students', path: '/my-students', icon: '👨‍🎓' },
    { title: 'Attendance', path: '/attendance', icon: '📋' },
    { title: 'Grades', path: '/grades', icon: '✏️' },
    { title: 'Add Student', path: '/add-student', icon: '➕' },
    { title: 'My Class', path: '/my-class', icon: '👨‍🏫' }
  ];

  // Search functionality
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim().length === 0) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const filtered = allStudents.filter(student => 
        student.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        student.student_code?.toLowerCase().includes(term.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(term.toLowerCase()) ||
        student.parent_name?.toLowerCase().includes(term.toLowerCase()) ||
        student.district?.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
      
      if (filtered.length === 0) {
        const response = await studentAPI.search(term);
        setSearchResults(response.data.students || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // More Info handler
  const handleMoreInfo = async (student) => {
    setLoadingStudentInfo(true);
    setSelectedStudent(student);
    setShowInfoModal(true);
    
    try {
      const response = await studentAPI.getById(student.student_id);
      if (response.data.student) {
        setSelectedStudent(response.data.student);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoadingStudentInfo(false);
    }
  };

  // Edit student
  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditFormData({
      student_code: student.student_code || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      middle_name: student.middle_name || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || 'Male',
      phone: student.phone || '',
      village: student.village || '',
      traditional_authority: student.traditional_authority || '',
      district: student.district || '',
      division: student.division || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      parent_occupation: student.parent_occupation || '',
      parent_relationship: student.parent_relationship || 'Father',
      parent_village: student.parent_village || '',
      current_standard: student.current_standard || 1,
      current_class: student.current_class || 'A',
      academic_year: student.academic_year || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_phone: student.emergency_contact_phone || '',
      emergency_contact_relationship: student.emergency_contact_relationship || '',
      total_fees: student.total_fees || 0,
      fee_payment_plan: student.fee_payment_plan || 'Full',
      scholarship_type: student.scholarship_type || 'None',
      has_uniform: student.has_uniform || false,
      has_textbooks: student.has_textbooks || false,
      meals_program: student.meals_program || 'None',
      notes: student.notes || '',
      enrollment_status: student.enrollment_status || 'Active'
    });
    setShowEditModal(true);
    setUpdateSuccess('');
    setUpdateError('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const updatedData = {
        ...editFormData,
        current_standard: parseInt(editFormData.current_standard),
        total_fees: parseFloat(editFormData.total_fees) || 0
      };

      await studentAPI.update(editingStudent.student_id, updatedData);
      
      setUpdateSuccess('Student updated successfully!');
      await fetchDashboardData();
      
      if (isSearching) {
        const updatedResults = searchResults.map(s => 
          s.student_id === editingStudent.student_id ? { ...s, ...updatedData } : s
        );
        setSearchResults(updatedResults);
      }
      
      setTimeout(() => {
        setShowEditModal(false);
        setEditingStudent(null);
        setUpdateSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);
      setUpdateError(error.response?.data?.error || 'Failed to update student');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const teacherStats = [
    {
      title: 'My Students',
      value: stats?.total_students || 0,
      icon: '👨‍🎓'
    },
    {
      title: 'Present Today',
      value: '32',
      icon: '✅'
    },
    {
      title: 'Absent Today',
      value: '5',
      icon: '❌'
    },
    {
      title: 'My Classes',
      value: '3',
      icon: '📚'
    }
  ];

  const classSchedule = [
    { subject: 'Mathematics', standard: '3A', time: '08:00 - 09:00', room: 'Room 101' },
    { subject: 'English', standard: '4B', time: '09:15 - 10:15', room: 'Room 102' },
    { subject: 'Science', standard: '5A', time: '10:30 - 11:30', room: 'Room 103' }
  ];

  const displayStudents = isSearching && searchTerm.trim().length > 0 ? searchResults : myStudents;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-12">
      
      {/* Welcome Banner - #003C43 */}
      <div className="bg-[#003C43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              👋 Welcome back, {user?.first_name || 'Teacher'}!
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Teacher Dashboard — Track student records, daily schedules, and grades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse"></span>
              <span>Academic Year 2026</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - #135D66 */}
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
                    ${window.location.pathname === item.path 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/70 hidden md:inline">
                {user?.first_name || 'Teacher'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {teacherStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-3 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  {stat.title}
                </span>
                <span className="text-base">
                  {stat.icon}
                </span>
              </div>
              <div className="mt-1">
                <p className="text-xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span>📅</span> Today's Teaching Schedule
            </h2>
            <span className="text-xs font-medium text-[#003C43] bg-[#135D66]/10 px-2 py-0.5 rounded-full border border-[#135D66]/20">
              3 Classes Today
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Standard</th>
                  <th className="px-4 py-2.5">Time Slot</th>
                  <th className="px-4 py-2.5">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {classSchedule.map((class_, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {class_.subject}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      <span className="inline-block bg-[#135D66]/10 text-[#003C43] text-xs font-medium px-2 py-0.5 rounded border border-[#135D66]/20">
                        Standard {class_.standard}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {class_.time}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {class_.room}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Table with Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">My Students</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="🔍 Search students..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition bg-white"
                />
                {isSearching && searchTerm.trim().length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearching(false);
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Link
                to="/add-student"
                className="text-xs bg-[#135D66] hover:bg-[#0e4a52] text-white px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap flex items-center gap-1"
              >
                ➕ Add Student
              </Link>
              <Link
                to="/my-students"
                className="text-xs text-[#003C43] hover:text-[#135D66] font-medium flex items-center gap-1 hover:underline transition whitespace-nowrap"
              >
                View All →
              </Link>
            </div>
          </div>
          
          {displayStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white">
              {isSearching ? 'No students found matching your search.' : 'No students assigned to your class roster yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Student Code</th>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">Standard</th>
                    <th className="px-4 py-2.5">Parent / Guardian</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {displayStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {student.student_code || student.student_id}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Std {student.current_standard}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">
                        {student.parent_name || 'N/A'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                          ${
                            student.enrollment_status === 'Active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : student.enrollment_status === 'Graduated'
                              ? 'bg-[#135D66]/10 text-[#003C43] border border-[#135D66]/20'
                              : student.enrollment_status === 'Transferred'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {student.enrollment_status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleMoreInfo(student)}
                            className="text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium flex items-center gap-1"
                            title="View more information"
                          >
                            📋 Info
                          </button>
                          <button
                            onClick={() => handleEditClick(student)}
                            className="text-[#135D66] hover:text-[#003C43] transition-colors text-xs font-medium flex items-center gap-1"
                            title="Edit student"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isSearching && searchTerm.trim().length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                  Found {displayStudents.length} student{displayStudents.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* More Info Modal - Header color #135D66 */}
      {showInfoModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>👤</span> Student Information
              </h2>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setSelectedStudent(null);
                }}
                className="text-white/70 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            {loadingStudentInfo ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#135D66] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading student details...</span>
              </div>
            ) : (
              <div className="p-6">
                {/* Student Profile Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-4 border-b border-gray-200 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#135D66]/10 flex items-center justify-center text-3xl text-[#135D66]">
                    {selectedStudent.first_name?.charAt(0)}{selectedStudent.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {selectedStudent.first_name} {selectedStudent.middle_name || ''} {selectedStudent.last_name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        Code: {selectedStudent.student_code || selectedStudent.student_id}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        ID: {selectedStudent.student_id}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedStudent.enrollment_status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : selectedStudent.enrollment_status === 'Graduated'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedStudent.enrollment_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Personal Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(selectedStudent.date_of_birth)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Village</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.village || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Traditional Authority</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.traditional_authority || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">District</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.district || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Division</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.division || 'N/A'}</p>
                  </div>

                  {/* Parent/Guardian Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Parent/Guardian Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Parent Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Relationship</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_relationship || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Parent Phone</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Parent Email</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Parent Occupation</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_occupation || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Parent Village</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.parent_village || 'N/A'}</p>
                  </div>

                  {/* Academic Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Academic Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Current Standard</p>
                    <p className="text-sm font-medium text-gray-800">Standard {selectedStudent.current_standard}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Class</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.current_class || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Academic Year</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.academic_year || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Enrollment Date</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(selectedStudent.enrollment_date)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Performance Level</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.performance_level || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Previous Grade Promoted</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.previous_grade_promoted ? 'Yes' : 'No'}</p>
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Emergency Contact</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Emergency Contact Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.emergency_contact_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Emergency Contact Phone</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.emergency_contact_phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Emergency Contact Relationship</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.emergency_contact_relationship || 'N/A'}</p>
                  </div>

                  {/* Medical Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Medical Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Blood Type</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.blood_type || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Allergies</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.allergies || 'None'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <p className="text-xs text-gray-500">Medical Conditions</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.medical_conditions || 'None'}</p>
                  </div>

                  {/* Financial Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Financial Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total Fees</p>
                    <p className="text-sm font-medium text-gray-800">MK {selectedStudent.total_fees?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-medium text-gray-800">MK {selectedStudent.amount_paid?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Outstanding Balance</p>
                    <p className={`text-sm font-medium ${selectedStudent.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      MK {selectedStudent.outstanding_balance?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Payment Plan</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.fee_payment_plan || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Scholarship</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.scholarship_type || 'None'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Financial Hold</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.financial_hold ? 'Yes' : 'No'}</p>
                  </div>

                  {/* Additional Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Additional Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Has Uniform</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.has_uniform ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Has Textbooks</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.has_textbooks ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Meals Program</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.meals_program || 'None'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.notes || 'No notes'}</p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => {
                      setShowInfoModal(false);
                      setSelectedStudent(null);
                    }}
                    className="px-6 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal - Header color #135D66 */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Student</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                  setUpdateSuccess('');
                  setUpdateError('');
                }}
                className="text-white/70 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="p-6">
              {updateError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                  <p className="text-red-700 text-sm">{updateError}</p>
                </div>
              )}
              
              {updateSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
                  <p className="text-green-700 text-sm">{updateSuccess}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Personal Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student Code</label>
                  <input
                    type="text"
                    name="student_code"
                    value={editFormData.student_code}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={editFormData.first_name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={editFormData.last_name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={editFormData.middle_name}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editFormData.date_of_birth}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Village</label>
                  <input
                    type="text"
                    name="village"
                    value={editFormData.village}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Traditional Authority</label>
                  <input
                    type="text"
                    name="traditional_authority"
                    value={editFormData.traditional_authority}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    name="district"
                    value={editFormData.district}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
                  <input
                    type="text"
                    name="division"
                    value={editFormData.division}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                {/* Parent Information */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Parent/Guardian Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Name *</label>
                  <input
                    type="text"
                    name="parent_name"
                    value={editFormData.parent_name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Phone *</label>
                  <input
                    type="text"
                    name="parent_phone"
                    value={editFormData.parent_phone}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    name="parent_email"
                    value={editFormData.parent_email}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Occupation</label>
                  <input
                    type="text"
                    name="parent_occupation"
                    value={editFormData.parent_occupation}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Relationship *</label>
                  <select
                    name="parent_relationship"
                    value={editFormData.parent_relationship}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Parent Village</label>
                  <input
                    type="text"
                    name="parent_village"
                    value={editFormData.parent_village}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                {/* Academic Information */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Academic Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Standard *</label>
                  <select
                    name="current_standard"
                    value={editFormData.current_standard}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    {[1,2,3,4,5,6,7,8].map(std => (
                      <option key={std} value={std}>Standard {std}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                  <select
                    name="current_class"
                    value={editFormData.current_class}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={editFormData.academic_year}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Enrollment Status</label>
                  <select
                    name="enrollment_status"
                    value={editFormData.enrollment_status}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Emergency Contact</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={editFormData.emergency_contact_name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    value={editFormData.emergency_contact_phone}
                    onChange={handleEditChange}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Contact Relationship</label>
                  <input
                    type="text"
                    name="emergency_contact_relationship"
                    value={editFormData.emergency_contact_relationship}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                {/* Financial Information */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Financial Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Fees (MK)</label>
                  <input
                    type="number"
                    name="total_fees"
                    value={editFormData.total_fees}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Plan</label>
                  <select
                    name="fee_payment_plan"
                    value={editFormData.fee_payment_plan}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Full">Full</option>
                    <option value="Termly">Termly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Installment">Installment</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scholarship</label>
                  <select
                    name="scholarship_type"
                    value={editFormData.scholarship_type}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="None">None</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Church">Church</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Individual">Individual</option>
                    <option value="Merit">Merit</option>
                  </select>
                </div>

                {/* Additional Information */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-[#135D66] border-b border-[#135D66]/20 pb-1 mb-3">Additional Information</h3>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    name="has_uniform"
                    checked={editFormData.has_uniform}
                    onChange={handleEditChange}
                    className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded"
                  />
                  <label className="text-sm text-gray-700">Has Uniform</label>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    name="has_textbooks"
                    checked={editFormData.has_textbooks}
                    onChange={handleEditChange}
                    className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded"
                  />
                  <label className="text-sm text-gray-700">Has Textbooks</label>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Meals Program</label>
                  <select
                    name="meals_program"
                    value={editFormData.meals_program}
                    onChange={handleEditChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="None">None</option>
                    <option value="Full">Full</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditChange}
                    rows="3"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                    setUpdateSuccess('');
                    setUpdateError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {updateLoading ? 'Updating...' : '💾 Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;