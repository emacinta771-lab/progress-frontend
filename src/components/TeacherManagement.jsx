import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherData, setTeacherData] = useState({
    teacher_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    salary: ''
  });
  const [loginData, setLoginData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAll();
      setTeachers(response.data.teachers || []);
    } catch (err) {
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTeacherData({
      teacher_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      salary: ''
    });
    setFormError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTeacherData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openLoginModal = (teacher) => {
    setSelectedTeacher(teacher);
    const defaultUsername = `${teacher.first_name.toLowerCase()}.${teacher.last_name.toLowerCase()}`.replace(/\s+/g, '.');
    setLoginData({
      username: defaultUsername || teacher.teacher_id,
      email: teacher.email || '',
      password: generatePassword(),
      confirm_password: ''
    });
    setLoginError('');
    setLoginSuccess('');
    setShowLoginModal(true);
  };

  const handleCreateTeacher = async () => {
    setFormError('');

    if (!teacherData.teacher_id || !teacherData.first_name || !teacherData.last_name || !teacherData.email) {
      setFormError('Teacher ID, first name, last name and email are required.');
      return;
    }

    try {
      setSaving(true);
      const response = await teacherAPI.create({
        ...teacherData,
        salary: teacherData.salary ? Number(teacherData.salary) : 0
      });

      if (response.data.success) {
        resetForm();
        setShowAddModal(false);
        fetchTeachers();
      } else {
        setFormError(response.data.error || 'Failed to create teacher');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTeacherLogin = async () => {
    setLoginError('');
    setLoginSuccess('');

    if (!loginData.password || !loginData.username || !loginData.email) {
      setLoginError('Username, email, and password are required.');
      return;
    }

    if (loginData.password !== loginData.confirm_password) {
      setLoginError('Passwords do not match.');
      return;
    }

    try {
      setCreatingLogin(true);
      const response = await teacherAPI.createLogin({
        teacher_id: selectedTeacher.teacher_id,
        username: loginData.username,
        email: loginData.email,
        password: loginData.password
      });

      if (response.data.success) {
        setLoginSuccess('Teacher login created successfully.');
        fetchTeachers();
        setTimeout(() => {
          setShowLoginModal(false);
          setSelectedTeacher(null);
        }, 1500);
      } else {
        setLoginError(response.data.error || 'Failed to create teacher login');
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Failed to create teacher login');
    } finally {
      setCreatingLogin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Teachers</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition"
        >
          + Add Teacher
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-600">ID</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Phone</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Specialization</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No teachers found
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-mono text-sm">{teacher.teacher_id}</td>
                  <td className="p-3 font-medium">{teacher.first_name} {teacher.last_name}</td>
                  <td className="p-3 text-sm">{teacher.email}</td>
                  <td className="p-3 text-sm">{teacher.phone || 'N/A'}</td>
                  <td className="p-3 text-sm">{teacher.specialization || 'N/A'}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {teacher.user_id ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          Login Created
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openLoginModal(teacher)}
                          className="px-2 py-1 rounded-full bg-[#135D66] text-white text-xs hover:bg-[#0e4a52] transition"
                        >
                          Create Login
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Add Teacher</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Teacher ID</span>
                <input
                  name="teacher_id"
                  value={teacherData.teacher_id}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="TCH-001"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">First Name</span>
                <input
                  name="first_name"
                  value={teacherData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="First name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Last Name</span>
                <input
                  name="last_name"
                  value={teacherData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="Last name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={teacherData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="name@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  name="phone"
                  value={teacherData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="Phone number"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Specialization</span>
                <input
                  name="specialization"
                  value={teacherData.specialization}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="Subject or department"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Qualification</span>
                <input
                  name="qualification"
                  value={teacherData.qualification}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="Qualification"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Salary</span>
                <input
                  type="number"
                  min="0"
                  name="salary"
                  value={teacherData.salary}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                  placeholder="Salary"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTeacher}
                disabled={saving}
                className="rounded-lg bg-[#135D66] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e4a52] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Create Teacher Login</h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setSelectedTeacher(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {loginError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {loginError}
              </div>
            )}
            {loginSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {loginSuccess}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Username</span>
                <input
                  name="username"
                  value={loginData.username}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="text"
                  name="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono focus:border-[#135D66] focus:outline-none"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Confirm Password</span>
                <input
                  type="password"
                  name="confirm_password"
                  value={loginData.confirm_password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#135D66] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setSelectedTeacher(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTeacherLogin}
                disabled={creatingLogin}
                className="rounded-lg bg-[#135D66] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e4a52] disabled:opacity-50"
              >
                {creatingLogin ? 'Creating...' : 'Create Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;