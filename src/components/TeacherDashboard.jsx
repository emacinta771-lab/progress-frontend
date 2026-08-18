import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

// ── helpers ──────────────────────────────────────────────────────────────────
const initials = (s) => {
  if (!s) return '?';
  const p = s.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0][0].toUpperCase();
};
const avatarColor = (name = '') => {
  const palette = ['bg-teal-500','bg-indigo-500','bg-violet-500','bg-sky-500','bg-rose-500','bg-amber-500','bg-emerald-500','bg-orange-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
};
const statusStyle = (s) => {
  switch (s) {
    case 'Active':      return 'bg-green-50 text-green-700 border-green-200';
    case 'Graduated':   return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Transferred': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:            return 'bg-red-50 text-red-700 border-red-200';
  }
};
const fmt = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ── Field component ───────────────────────────────────────────────────────────
const Field = ({ label, value, highlight }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-sm font-medium ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value || 'N/A'}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [allStudents, setAllStudents]       = useState([]);
  const [search, setSearch]                 = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showInfo, setShowInfo]             = useState(false);
  const [showEdit, setShowEdit]             = useState(false);
  const [editData, setEditData]             = useState({});
  const [saving, setSaving]                 = useState(false);
  const [toast, setToast]                   = useState(null);
  const [editError, setEditError]           = useState('');
  const [listOpen, setListOpen]             = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([studentAPI.getStats(), studentAPI.getAll()]);
      setStats(sRes.data.stats);
      setAllStudents(stRes.data.students || []);
    } catch { showToast('error', 'Failed to load data.'); }
    finally { setLoading(false); }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      (s.lin_code || s.student_code || '').toLowerCase().includes(q) ||
      (s.parent_name || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q)
    );
  }, [allStudents, search]);

  const openInfo = (s) => { setSelectedStudent(s); setShowInfo(true); };

  const openEdit = (s) => {
    setSelectedStudent(s);
    setEditData({
      lin_code:          s.lin_code || s.student_code || '',
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      middle_name: s.middle_name || '',
      date_of_birth: s.date_of_birth || '',
      gender: s.gender || 'Male',
      phone: s.phone || '',
      village: s.village || '',
      traditional_authority: s.traditional_authority || '',
      district: s.district || '',
      division: s.division || '',
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
      parent_email: s.parent_email || '',
      parent_occupation: s.parent_occupation || '',
      parent_relationship: s.parent_relationship || 'Father',
      parent_village: s.parent_village || '',
      current_standard: s.current_standard || 1,
      current_class: s.current_class || 'A',
      academic_year: s.academic_year || '',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      emergency_contact_relationship: s.emergency_contact_relationship || '',
      total_fees: s.total_fees || 0,
      fee_payment_plan: s.fee_payment_plan || 'Full',
      scholarship_type: s.scholarship_type || 'None',
      has_uniform: s.has_uniform || false,
      has_textbooks: s.has_textbooks || false,
      meals_program: s.meals_program || 'None',
      enrollment_status: s.enrollment_status || 'Active',
      notes: s.notes || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editData.lin_code?.trim()) {
      setEditError('LIN Code is required. A student cannot be saved without a LIN Code.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await studentAPI.update(selectedStudent.student_id, {
        ...editData,
        student_code:     editData.lin_code.trim(),  // keep student_code in sync
        current_standard: parseInt(editData.current_standard),
        total_fees:       parseFloat(editData.total_fees) || 0,
      });
      showToast('success', 'Student updated successfully.');
      setShowEdit(false);
      await load();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update student.');
    } finally { setSaving(false); }
  };

  const navItems = [
    { title: 'Dashboard',  path: '/teacher-dashboard', icon: '📊' },
    { title: 'Students',   path: '/my-students',        icon: '👨‍🎓' },
    { title: 'Attendance', path: '/attendance',          icon: '📋' },
    { title: 'Grades',     path: '/grades',              icon: '✏️' },
    { title: 'Add Student',path: '/add-student',         icon: '➕' },
    { title: 'My Class',   path: '/my-class',            icon: '👨‍🏫' },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#135D66] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#003C43] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">👋 Welcome back, {user?.first_name || 'Teacher'}</h1>
            <p className="text-white/60 text-xs mt-0.5">Teacher Dashboard · Academic Year 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-full transition">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-[#135D66] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition
                  ${window.location.pathname === item.path ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <span>{item.icon}</span><span>{item.title}</span>
              </Link>
            ))}
          </div>
          <span className="text-xs text-white/50 hidden md:block">{user?.first_name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: stats?.total_students ?? 0,     icon: '👨‍🎓', color: 'text-indigo-600' },
            { label: 'Present Today',  value: 32,                             icon: '✅',   color: 'text-green-600' },
            { label: 'Absent Today',   value: 5,                              icon: '❌',   color: 'text-red-500' },
            { label: 'My Classes',     value: 3,                              icon: '📚',   color: 'text-teal-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Students — collapsible */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Clickable header — always visible */}
          <button
            type="button"
            onClick={() => setListOpen(o => !o)}
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/60 transition text-left"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-800">My Students</h2>
              <span className="text-xs bg-[#135D66]/10 text-[#135D66] border border-[#135D66]/20 px-2 py-0.5 rounded-full font-medium">
                {allStudents.length} total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/add-student"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#135D66] hover:bg-[#0e4a52] text-white text-xs font-semibold rounded-lg transition whitespace-nowrap">
                + Add Student
              </Link>
              <span className={`text-gray-400 transition-transform duration-300 ${listOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>

          {/* Collapsible body */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${listOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {/* Search + view-all row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <div className="relative w-full sm:w-60">
                <input type="text" placeholder="Search students…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] bg-white" />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>
              <Link to="/my-students" className="text-xs text-[#135D66] hover:underline font-medium whitespace-nowrap">
                View all →
              </Link>
            </div>

            {visible.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                {search ? 'No students match your search.' : 'No students found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide border-y border-gray-100">
                      <th className="px-5 py-2.5">Student</th>
                      <th className="px-4 py-2.5">LIN Code</th>
                      <th className="px-4 py-2.5">Standard</th>
                      <th className="px-4 py-2.5">Parent</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50/70 transition group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(`${s.first_name} ${s.last_name}`)}`}>
                              {initials(`${s.first_name} ${s.last_name}`)}
                            </div>
                            <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(s.lin_code || s.student_code)
                            ? <span className="font-mono text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded">{s.lin_code || s.student_code}</span>
                            : <span className="text-xs text-red-400 italic">— no LIN</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">Std {s.current_standard}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{s.parent_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle(s.enrollment_status)}`}>
                            {s.enrollment_status}
                          </span>
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openInfo(s)}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
                            Info
                          </button>
                          <button onClick={() => openEdit(s)}
                            className="px-2.5 py-1 text-[11px] font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {search && (
                <p className="px-5 py-2 text-xs text-gray-400 border-t border-gray-100">
                  {visible.length} result{visible.length !== 1 ? 's' : ''} for "{search}"
                </p>
              )}
            </div>
          )}
          </div> {/* end collapsible body */}
        </div>

      </div>

      {/* ── INFO MODAL ──────────────────────────────────────────────────────── */}
      {showInfo && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">👤 Student Profile</h2>
              <button onClick={() => setShowInfo(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile strip */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${avatarColor(`${selectedStudent.first_name} ${selectedStudent.last_name}`)}`}>
                  {initials(`${selectedStudent.first_name} ${selectedStudent.last_name}`)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedStudent.first_name} {selectedStudent.middle_name || ''} {selectedStudent.last_name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                      {selectedStudent.student_code || <span className="text-red-400 italic">No code</span>}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle(selectedStudent.enrollment_status)}`}>
                      {selectedStudent.enrollment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sections */}
              {[
                { title: 'Personal', fields: [
                  { label: 'Date of Birth', value: fmt(selectedStudent.date_of_birth) },
                  { label: 'Gender', value: selectedStudent.gender },
                  { label: 'Phone', value: selectedStudent.phone },
                  { label: 'Village', value: selectedStudent.village },
                  { label: 'District', value: selectedStudent.district },
                  { label: 'Division', value: selectedStudent.division },
                ]},
                { title: 'Parent / Guardian', fields: [
                  { label: 'Name', value: selectedStudent.parent_name },
                  { label: 'Relationship', value: selectedStudent.parent_relationship },
                  { label: 'Phone', value: selectedStudent.parent_phone },
                  { label: 'Email', value: selectedStudent.parent_email },
                  { label: 'Occupation', value: selectedStudent.parent_occupation },
                  { label: 'Village', value: selectedStudent.parent_village },
                ]},
                { title: 'Academic', fields: [
                  { label: 'Standard', value: `Standard ${selectedStudent.current_standard}` },
                  { label: 'Class', value: selectedStudent.current_class },
                  { label: 'Academic Year', value: selectedStudent.academic_year },
                  { label: 'Enrolled', value: fmt(selectedStudent.enrollment_date) },
                ]},
                { title: 'Emergency Contact', fields: [
                  { label: 'Name', value: selectedStudent.emergency_contact_name },
                  { label: 'Phone', value: selectedStudent.emergency_contact_phone },
                  { label: 'Relationship', value: selectedStudent.emergency_contact_relationship },
                ]},
                { title: 'Financials', fields: [
                  { label: 'Total Fees', value: `MK ${(selectedStudent.total_fees || 0).toLocaleString()}` },
                  { label: 'Paid', value: `MK ${(selectedStudent.amount_paid || 0).toLocaleString()}` },
                  { label: 'Outstanding', value: `MK ${(selectedStudent.outstanding_balance || 0).toLocaleString()}`, highlight: selectedStudent.outstanding_balance > 0 },
                  { label: 'Scholarship', value: selectedStudent.scholarship_type },
                ]},
              ].map(section => (
                <div key={section.title}>
                  <h4 className="text-xs font-semibold text-[#135D66] uppercase tracking-wider mb-2 border-b border-[#135D66]/15 pb-1">{section.title}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {section.fields.map(f => <Field key={f.label} label={f.label} value={f.value} highlight={f.highlight} />)}
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowInfo(false)}
                  className="px-5 py-2 bg-[#135D66] hover:bg-[#0e4a52] text-white text-sm font-medium rounded-lg transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {showEdit && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-base font-bold">✏️ Edit Student</h2>
              <button onClick={() => setShowEdit(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">

              {editError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* LIN Code — highlighted as required */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  LIN Code <span className="text-red-500">*</span>
                  <span className="ml-2 font-normal text-amber-600">(Learner ID Number — required)</span>
                </label>
                <input type="text" name="lin_code" value={editData.lin_code} onChange={handleEditChange}
                  placeholder="e.g. LIN-2024-00123"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition
                    ${!editData.lin_code?.trim() ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`} />
              </div>

              {/* Personal */}
              <div>
                <h3 className="text-xs font-semibold text-[#135D66] uppercase tracking-wider border-b border-[#135D66]/15 pb-1 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'First Name *', name: 'first_name', required: true },
                    { label: 'Last Name *',  name: 'last_name',  required: true },
                    { label: 'Middle Name',  name: 'middle_name' },
                    { label: 'Phone',        name: 'phone' },
                    { label: 'Village',      name: 'village' },
                    { label: 'District *',   name: 'district', required: true },
                    { label: 'Division',     name: 'division' },
                    { label: 'T/A',          name: 'traditional_authority' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                      <input type="text" name={f.name} value={editData[f.name]} onChange={handleEditChange} required={f.required}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
                    <input type="date" name="date_of_birth" value={editData.date_of_birth} onChange={handleEditChange} required
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                    <select name="gender" value={editData.gender} onChange={handleEditChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition">
                      <option>Male</option><option>Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parent */}
              <div>
                <h3 className="text-xs font-semibold text-[#135D66] uppercase tracking-wider border-b border-[#135D66]/15 pb-1 mb-3">Parent / Guardian</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Parent Name *',  name: 'parent_name',  required: true },
                    { label: 'Parent Phone *', name: 'parent_phone', required: true },
                    { label: 'Parent Email',   name: 'parent_email', type: 'email' },
                    { label: 'Occupation',     name: 'parent_occupation' },
                    { label: 'Parent Village', name: 'parent_village' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                      <input type={f.type || 'text'} name={f.name} value={editData[f.name]} onChange={handleEditChange} required={f.required}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Relationship *</label>
                    <select name="parent_relationship" value={editData.parent_relationship} onChange={handleEditChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition">
                      {['Father','Mother','Guardian','Grandparent','Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic */}
              <div>
                <h3 className="text-xs font-semibold text-[#135D66] uppercase tracking-wider border-b border-[#135D66]/15 pb-1 mb-3">Academic</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Standard *</label>
                    <select name="current_standard" value={editData.current_standard} onChange={handleEditChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Standard {n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                    <select name="current_class" value={editData.current_class} onChange={handleEditChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition">
                      {['A','B','C','D'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year *</label>
                    <input type="text" name="academic_year" value={editData.academic_year} onChange={handleEditChange} required
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Enrollment Status</label>
                    <select name="enrollment_status" value={editData.enrollment_status} onChange={handleEditChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition">
                      {['Active','Inactive','Graduated','Transferred','Suspended'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency */}
              <div>
                <h3 className="text-xs font-semibold text-[#135D66] uppercase tracking-wider border-b border-[#135D66]/15 pb-1 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Name *',         name: 'emergency_contact_name',  required: true },
                    { label: 'Phone *',        name: 'emergency_contact_phone', required: true },
                    { label: 'Relationship',   name: 'emergency_contact_relationship' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                      <input type="text" name={f.name} value={editData[f.name]} onChange={handleEditChange} required={f.required}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea name="notes" value={editData.notes} onChange={handleEditChange} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition resize-none"
                  placeholder="Additional notes…" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-[#135D66] hover:bg-[#0e4a52] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
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
