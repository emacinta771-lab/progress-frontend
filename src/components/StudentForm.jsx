import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';

const calcAge = (dob) => {
  if (!dob) return '';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const STEPS = [
  'Identification',
  'Personal Details',
  'Location',
  'Background & ECD',
  'Academic',
  'Parent / Guardian',
  'Emergency Contact',
];

const EMPTY = {
  lin_code: '',
  submission_date: new Date().toISOString().split('T')[0],
  first_name: '',
  last_name: '',
  middle_name: '',
  date_of_birth: '',
  age: '',
  gender: 'Male',
  village: '',
  location: '',
  district: '',
  division: '',
  traditional_authority: '',
  religious_denomination: '',
  orphan_status: 'None',
  special_needs: false,
  special_needs_description: '',
  ecd_attendance: 'No',
  current_standard: 1,
  current_class: 'A',
  academic_year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  enrollment_status: 'Active',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  parent_occupation: '',
  parent_relationship: 'Father',
  parent_village: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  notes: '',
};

// Field wrapper
const F = ({ label, required, error, full, children }) => (
  <div className={full ? 'col-span-2 sm:col-span-2' : 'col-span-2 sm:col-span-1'}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const fieldCls = (err) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition ${
    err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`;

const Inp = ({ name, form, onChange, err, ...rest }) => (
  <input name={name} value={form[name]} onChange={onChange}
    className={fieldCls(err)} {...rest} />
);

const Sel = ({ name, form, onChange, options }) => (
  <select name={name} value={form[name]} onChange={onChange} className={fieldCls(false)}>
    {options.map(o => {
      const val = typeof o === 'object' ? o.value : o;
      const lbl = typeof o === 'object' ? o.label : o;
      return <option key={val} value={val}>{lbl}</option>;
    })}
  </select>
);

const StudentForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    if (form.date_of_birth) {
      setForm(prev => ({ ...prev, age: calcAge(form.date_of_birth) }));
    }
  }, [form.date_of_birth]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 0 && !form.lin_code.trim()) e.lin_code = 'LIN Code is required';
    if (s === 1) {
      if (!form.first_name.trim()) e.first_name = 'First name is required';
      if (!form.last_name.trim())  e.last_name  = 'Surname is required';
      if (!form.date_of_birth)     e.date_of_birth = 'Date of birth is required';
    }
    if (s === 2 && !form.district.trim()) e.district = 'District is required';
    if (s === 5) {
      if (!form.parent_name.trim())  e.parent_name  = 'Parent name is required';
      if (!form.parent_phone.trim()) e.parent_phone = 'Parent phone is required';
    }
    if (s === 6) {
      if (!form.emergency_contact_name.trim())  e.emergency_contact_name  = 'Emergency contact is required';
      if (!form.emergency_contact_phone.trim()) e.emergency_contact_phone = 'Emergency phone is required';
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(6);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const studentId = `STD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await studentAPI.create({
        ...form,
        student_id:              studentId,
        student_code:            form.lin_code.trim(),
        lin_code:                form.lin_code.trim(),
        age:                     form.age ? parseInt(form.age) : calcAge(form.date_of_birth),
        current_standard:        parseInt(form.current_standard),
        total_fees:              0,
        amount_paid:             0,
        outstanding_balance:     0,
        fee_payment_plan:        'Full',
        scholarship_type:        'None',
        has_uniform:             false,
        has_textbooks:           false,
        meals_program:           'None',
        financial_hold:          false,
        enrollment_date:         new Date().toISOString().split('T')[0],
        previous_grade_promoted: true,
        performance_level:       'Satisfactory',
        blood_type:              null,
        allergies:               null,
        medical_conditions:      null,
      });
      showToast('success', 'Student registered successfully!');
      setForm(EMPTY);
      setErrors({});
      setStep(0);
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step panels — all grids use col-span-2/col-span-1 so on mobile everything
  // is full width (grid is 2 cols, F defaults to col-span-2 = full width on
  // mobile via the outer grid being 1 col on xs, 2 on sm)
  const panels = [

    // 0 — Identification
    <div key="id" className="grid grid-cols-2 gap-4">
      <F label="LIN Code" required error={errors.lin_code}>
        <Inp name="lin_code" form={form} onChange={handleChange} err={errors.lin_code}
          placeholder="e.g. LIN-2024-00123" />
      </F>
      <F label="Date of Submission">
        <Inp name="submission_date" form={form} onChange={handleChange} err={false} type="date" />
      </F>
    </div>,

    // 1 — Personal Details
    <div key="personal" className="grid grid-cols-2 gap-4">
      <F label="Surname" required error={errors.last_name}>
        <Inp name="last_name" form={form} onChange={handleChange} err={errors.last_name}
          placeholder="Family name" />
      </F>
      <F label="First Name" required error={errors.first_name}>
        <Inp name="first_name" form={form} onChange={handleChange} err={errors.first_name}
          placeholder="Given name" />
      </F>
      <F label="Middle Name">
        <Inp name="middle_name" form={form} onChange={handleChange} err={false}
          placeholder="Optional" />
      </F>
      <F label="Date of Birth" required error={errors.date_of_birth}>
        <Inp name="date_of_birth" form={form} onChange={handleChange}
          err={errors.date_of_birth} type="date" />
      </F>
      <F label="Age">
        <input value={form.age} readOnly placeholder="Auto-calculated"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
      </F>
      <F label="Sex" required>
        <Sel name="gender" form={form} onChange={handleChange} options={['Male','Female']} />
      </F>
    </div>,

    // 2 — Location
    <div key="location" className="grid grid-cols-2 gap-4">
      <F label="Village / Location">
        <Inp name="village" form={form} onChange={handleChange} err={false}
          placeholder="Village or area" />
      </F>
      <F label="Additional Location">
        <Inp name="location" form={form} onChange={handleChange} err={false}
          placeholder="Zone, neighbourhood" />
      </F>
      <F label="District of Origin" required error={errors.district}>
        <Inp name="district" form={form} onChange={handleChange} err={errors.district}
          placeholder="e.g. Lilongwe" />
      </F>
      <F label="Division">
        <Inp name="division" form={form} onChange={handleChange} err={false}
          placeholder="e.g. Central" />
      </F>
      <F label="Traditional Authority" full>
        <Inp name="traditional_authority" form={form} onChange={handleChange} err={false}
          placeholder="T/A name" />
      </F>
    </div>,

    // 3 — Background & ECD
    <div key="background" className="grid grid-cols-2 gap-4">
      <F label="Religious Denomination">
        <Sel name="religious_denomination" form={form} onChange={handleChange} options={[
          { value: '', label: '-- Select --' },
          'Catholic','CCAP','Anglican','Seventh Day Adventist',
          'Baptist','Pentecostal','Islam','Other Christian',
          'Traditional','None','Other',
        ]} />
      </F>
      <F label="Orphan Status">
        <Sel name="orphan_status" form={form} onChange={handleChange} options={[
          { value: 'None',   label: 'Not an orphan' },
          { value: 'Single', label: 'Single orphan' },
          { value: 'Double', label: 'Double orphan' },
        ]} />
      </F>
      <F label="Special Needs">
        <div className="flex gap-6 pt-1">
          {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="special_needs_radio"
                checked={form.special_needs === opt.val}
                onChange={() => setForm(p => ({ ...p, special_needs: opt.val }))}
                className="w-4 h-4 accent-[#135D66]" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </F>
      {form.special_needs && (
        <F label="Special Needs Description">
          <Inp name="special_needs_description" form={form} onChange={handleChange} err={false}
            placeholder="Describe the special need" />
        </F>
      )}
      <F label="ECD Attendance">
        <div className="flex gap-6 pt-1">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="ecd_attendance" value={opt}
                checked={form.ecd_attendance === opt} onChange={handleChange}
                className="w-4 h-4 accent-[#135D66]" />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      </F>
    </div>,

    // 4 — Academic
    <div key="academic" className="grid grid-cols-2 gap-4">
      <F label="Standard" required>
        <Sel name="current_standard" form={form} onChange={handleChange}
          options={[1,2,3,4,5,6,7,8].map(n => ({ value: n, label: `Standard ${n}` }))} />
      </F>
      <F label="Class">
        <Sel name="current_class" form={form} onChange={handleChange} options={['A','B','C','D']} />
      </F>
      <F label="Academic Year" required>
        <Inp name="academic_year" form={form} onChange={handleChange} err={false}
          placeholder="e.g. 2025/2026" />
      </F>
      <F label="Enrollment Status">
        <Sel name="enrollment_status" form={form} onChange={handleChange}
          options={['Active','Inactive','Suspended']} />
      </F>
    </div>,

    // 5 — Parent / Guardian
    <div key="parent" className="grid grid-cols-2 gap-4">
      <F label="Full Name" required error={errors.parent_name}>
        <Inp name="parent_name" form={form} onChange={handleChange} err={errors.parent_name}
          placeholder="Parent or guardian name" />
      </F>
      <F label="Phone" required error={errors.parent_phone}>
        <Inp name="parent_phone" form={form} onChange={handleChange} err={errors.parent_phone}
          placeholder="+265 888 000 000" />
      </F>
      <F label="Relationship" required>
        <Sel name="parent_relationship" form={form} onChange={handleChange}
          options={['Father','Mother','Guardian','Grandparent','Uncle','Aunt','Other']} />
      </F>
      <F label="Email">
        <Inp name="parent_email" form={form} onChange={handleChange} err={false}
          type="email" placeholder="Optional" />
      </F>
      <F label="Occupation">
        <Inp name="parent_occupation" form={form} onChange={handleChange} err={false}
          placeholder="e.g. Farmer, Teacher" />
      </F>
      <F label="Parent Village">
        <Inp name="parent_village" form={form} onChange={handleChange} err={false} />
      </F>
    </div>,

    // 6 — Emergency Contact
    <div key="emergency" className="grid grid-cols-2 gap-4">
      <F label="Contact Name" required error={errors.emergency_contact_name}>
        <Inp name="emergency_contact_name" form={form} onChange={handleChange}
          err={errors.emergency_contact_name} />
      </F>
      <F label="Contact Phone" required error={errors.emergency_contact_phone}>
        <Inp name="emergency_contact_phone" form={form} onChange={handleChange}
          err={errors.emergency_contact_phone} placeholder="+265 888 000 000" />
      </F>
      <F label="Relationship to Student" full>
        <Inp name="emergency_contact_relationship" form={form} onChange={handleChange} err={false}
          placeholder="e.g. Uncle, Aunt" />
      </F>
      <F label="Notes" full>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
          placeholder="Any additional remarks about this student..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition resize-none bg-white" />
      </F>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
              Student Admission Form
            </h1>
            <p className="text-white/50 text-xs mt-0.5 hidden sm:block">Register a new learner</p>
          </div>
          <button onClick={() => navigate('/teacher-dashboard')}
            className="shrink-0 text-xs border border-white/30 text-white/80 hover:text-white px-3 py-1.5 rounded transition whitespace-nowrap">
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8">

        {/* Step progress — numbers only on mobile, labels on sm+ */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-start min-w-max sm:min-w-0 px-1">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                    ${i < step    ? 'bg-[#135D66] border-[#135D66] text-white'
                    : i === step  ? 'bg-white border-[#135D66] text-[#135D66]'
                    : 'bg-white border-gray-300 text-gray-400'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 text-center w-14 sm:w-16 leading-tight hidden sm:block
                    ${i === step ? 'text-[#135D66] font-semibold' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mt-3 sm:mb-5 transition-colors
                    ${i < step ? 'bg-[#135D66]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Current step label on mobile */}
        <p className="sm:hidden text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">
          Step {step + 1} of {STEPS.length} &mdash; {STEPS[step]}
        </p>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          {/* Card header — hidden on mobile (shown as text above) */}
          <div className="hidden sm:block px-6 py-4 border-b border-gray-100">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-base font-bold text-gray-800 mt-0.5">{STEPS[step]}</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Fields */}
            <div className="px-4 sm:px-6 py-5 sm:py-6">
              {panels[step]}
            </div>

            {/* Navigation bar */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl
              flex items-center justify-between gap-3">
              <button type="button" onClick={back} disabled={step === 0}
                className="px-4 sm:px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg
                  hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition min-w-[72px]">
                Back
              </button>

              <span className="text-xs text-gray-400 tabular-nums shrink-0">
                {step + 1} / {STEPS.length}
              </span>

              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next}
                  className="px-4 sm:px-6 py-2 bg-[#135D66] hover:bg-[#0e4a52] text-white text-sm
                    font-semibold rounded-lg transition min-w-[72px]">
                  Next
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="px-4 sm:px-6 py-2 bg-[#003C43] hover:bg-[#135D66] disabled:opacity-50
                    text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 min-w-[110px] justify-center">
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? 'Saving...' : 'Register'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Fields marked <span className="text-red-500 font-bold">*</span> are required
        </p>

      </div>
    </div>
  );
};

export default StudentForm;
