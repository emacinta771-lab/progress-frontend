import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import TeacherNav from './TeacherNav';

// ── helpers ───────────────────────────────────────────────────────────────────
const val = (v, fallback = 'N/A') =>
  v === null || v === undefined || v === '' ? fallback : String(v);

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const fmtMoney = (n) =>
  `MK ${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

// ── print document ────────────────────────────────────────────────────────────
const buildPrintDocument = (student) => {
  const fullName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean).join(' ');

  const section = (title, rows) => `
    <div class="section">
      <div class="section-title">${title}</div>
      <table>
        <tbody>
          ${rows.map(([label, value]) => `
            <tr>
              <th>${label}</th>
              <td>${value}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Profile — ${fullName}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10.5px; color: #1f2937; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2.5px solid #003C43; padding-bottom: 8px; margin-bottom: 12px; }
    .school-name { font-size: 20px; font-weight: 900; color: #003C43; letter-spacing: 0.02em; }
    .doc-title { font-size: 10px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.08em; }
    .meta { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.6; }
    .student-name { font-size: 15px; font-weight: 700; color: #003C43; margin-bottom: 2px; }
    .lin-badge { display: inline-block; background: #e7f3f4; border: 1px solid #135D66; color: #003C43; font-family: monospace; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 10px; }
    .sections { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .section { break-inside: avoid; }
    .section-title { font-size: 9.5px; font-weight: 900; color: #003C43; text-transform: uppercase; letter-spacing: 0.1em; background: #e7f3f4; border-left: 3px solid #003C43; padding: 3px 7px; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 4px 7px; text-align: left; vertical-align: top; }
    th { width: 44%; background: #f9fafb; color: #374151; font-weight: 700; font-size: 9.5px; }
    td { font-size: 10px; color: #1f2937; }
    .full-width { grid-column: 1 / -1; }
    .footer { border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school-name">Student Profile</div>
      <div class="doc-title">Official Learner Record</div>
    </div>
    <div class="meta">
      <div>Generated: <strong>${new Date().toLocaleDateString('en-GB')}</strong></div>
      <div>Academic Year: <strong>${val(student.academic_year)}</strong></div>
    </div>
  </div>

  <div class="student-name">${fullName}</div>
  <div class="lin-badge">LIN: ${val(student.lin_code || student.student_code)}</div>

  <div class="sections">
    ${section('Identification', [
      ['LIN Code',          val(student.lin_code || student.student_code)],
      ['Student ID',        val(student.student_id)],
      ['Submission Date',   fmtDate(student.submission_date)],
      ['Enrollment Status', val(student.enrollment_status)],
    ])}
    ${section('Personal Details', [
      ['Full Name',   fullName || 'N/A'],
      ['Date of Birth', fmtDate(student.date_of_birth)],
      ['Age',         val(student.age)],
      ['Sex',         val(student.gender)],
    ])}
    ${section('Location', [
      ['Village / Location', val(student.village || student.location)],
      ['District',           val(student.district)],
      ['Division',           val(student.division)],
      ['T/A',                val(student.traditional_authority)],
    ])}
    ${section('Background & ECD', [
      ['Religious Denomination', val(student.religious_denomination)],
      ['Orphan Status',          val(student.orphan_status)],
      ['Special Needs',          student.special_needs ? val(student.special_needs_description, 'Yes') : 'No'],
      ['ECD Attendance',         val(student.ecd_attendance)],
    ])}
    ${section('Academic', [
      ['Standard',       student.current_standard ? `Standard ${student.current_standard}` : 'N/A'],
      ['Class',          val(student.current_class)],
      ['Academic Year',  val(student.academic_year)],
      ['Enrolled Date',  fmtDate(student.enrollment_date)],
    ])}
    ${section('Parent / Guardian', [
      ['Name',         val(student.parent_name)],
      ['Phone',        val(student.parent_phone)],
      ['Relationship', val(student.parent_relationship)],
      ['Email',        val(student.parent_email)],
      ['Occupation',   val(student.parent_occupation)],
      ['Village',      val(student.parent_village)],
    ])}
    ${section('Emergency Contact', [
      ['Name',         val(student.emergency_contact_name)],
      ['Phone',        val(student.emergency_contact_phone)],
      ['Relationship', val(student.emergency_contact_relationship)],
    ])}
    ${section('Finance', [
      ['Total Fees',       fmtMoney(student.total_fees)],
      ['Amount Paid',      fmtMoney(student.amount_paid)],
      ['Outstanding',      fmtMoney(student.outstanding_balance)],
      ['Payment Plan',     val(student.fee_payment_plan)],
      ['Scholarship',      val(student.scholarship_type)],
      ['Financial Hold',   student.financial_hold ? 'Yes' : 'No'],
    ])}
    <div class="section full-width">
      <div class="section-title">Notes</div>
      <table><tbody>
        <tr><td style="min-height:40px">${val(student.notes, '—')}</td></tr>
      </tbody></table>
    </div>
  </div>

  <div class="footer">
    <span>This document is auto-generated from the School Management System</span>
    <span>Printed: ${new Date().toLocaleString('en-GB')}</span>
  </div>
</body>
</html>`;
};

// ── Field row component ───────────────────────────────────────────────────────
const Row = ({ label, value, mono, highlight }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0 py-2 border-b border-gray-50 last:border-0">
    <span className="w-full sm:w-44 shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-0.5">
      {label}
    </span>
    <span className={`text-sm ${highlight ? 'font-bold text-[#003C43]' : 'text-gray-800'} ${mono ? 'font-mono' : ''}`}>
      {value || <span className="text-gray-300">—</span>}
    </span>
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
      <h2 className="text-xs font-bold text-[#003C43] uppercase tracking-widest">{title}</h2>
    </div>
    <div className="px-5 py-3">{children}</div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    Active:      'bg-green-50 text-green-700 border-green-200',
    Graduated:   'bg-blue-50 text-blue-700 border-blue-200',
    Transferred: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Inactive:    'bg-red-50 text-red-700 border-red-200',
    Suspended:   'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status || 'Active'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const StudentDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStudent(); }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getById(studentId);
      setStudent(res.data.student);
      setError('');
    } catch {
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this student permanently? This cannot be undone.')) return;
    try {
      await studentAPI.delete(studentId);
      navigate('/my-students');
    } catch {
      setError('Failed to delete student.');
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { setError('Pop-ups are blocked. Please allow pop-ups to download.'); return; }
    win.document.write(buildPrintDocument(student));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#135D66] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading student details...</p>
        </div>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !student) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 text-sm">{error || 'Student not found.'}</p>
          <Link to="/my-students" className="text-[#135D66] text-sm hover:underline mt-3 inline-block">
            Back to Students
          </Link>
        </div>
      </div>
    </div>
  );

  const fullName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean).join(' ');

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Page header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Student Profile</p>
            <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono text-xs bg-[#e7f3f4] border border-[#135D66]/30 text-[#003C43] px-2 py-0.5 rounded font-semibold">
                {student.lin_code || student.student_code || student.student_id}
              </span>
              <Badge status={student.enrollment_status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint}
              className="px-4 py-2 bg-[#003C43] hover:bg-[#135D66] text-white text-xs font-semibold rounded-lg transition">
              Download / Print
            </button>
            <Link to={`/students/${studentId}/edit`}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition">
              Edit
            </Link>
            <button onClick={handleDelete}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition">
              Delete
            </button>
            <Link to="/my-students"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 transition">
              Back
            </Link>
          </div>
        </div>

        {/* 2-column grid for sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Identification */}
          <Section title="Identification">
            <Row label="LIN Code"        value={val(student.lin_code || student.student_code)} mono highlight />
            <Row label="Student ID"      value={val(student.student_id)} mono />
            <Row label="Submission Date" value={fmtDate(student.submission_date)} />
          </Section>

          {/* Personal Details */}
          <Section title="Personal Details">
            <Row label="Full Name"     value={fullName} highlight />
            <Row label="Date of Birth" value={fmtDate(student.date_of_birth)} />
            <Row label="Age"           value={val(student.age)} />
            <Row label="Sex"           value={val(student.gender)} />
          </Section>

          {/* Location */}
          <Section title="Location">
            <Row label="Village / Location"  value={val(student.village || student.location)} />
            <Row label="District of Origin"  value={val(student.district)} />
            <Row label="Division"            value={val(student.division)} />
            <Row label="Traditional Auth."   value={val(student.traditional_authority)} />
          </Section>

          {/* Background & ECD */}
          <Section title="Background & ECD">
            <Row label="Religious Denomination" value={val(student.religious_denomination)} />
            <Row label="Orphan Status"           value={val(student.orphan_status)} />
            <Row label="Special Needs"
              value={student.special_needs
                ? val(student.special_needs_description, 'Yes')
                : 'No'} />
            <Row label="ECD Attendance" value={val(student.ecd_attendance)} />
          </Section>

          {/* Academic */}
          <Section title="Academic">
            <Row label="Standard"         value={student.current_standard ? `Standard ${student.current_standard}` : 'N/A'} />
            <Row label="Class"            value={val(student.current_class)} />
            <Row label="Academic Year"    value={val(student.academic_year)} />
            <Row label="Enrollment Date"  value={fmtDate(student.enrollment_date)} />
            <Row label="Status"           value={<Badge status={student.enrollment_status} />} />
          </Section>

          {/* Parent / Guardian */}
          <Section title="Parent / Guardian">
            <Row label="Full Name"    value={val(student.parent_name)} highlight />
            <Row label="Phone"        value={val(student.parent_phone)} />
            <Row label="Relationship" value={val(student.parent_relationship)} />
            <Row label="Email"        value={val(student.parent_email)} />
            <Row label="Occupation"   value={val(student.parent_occupation)} />
            <Row label="Village"      value={val(student.parent_village)} />
          </Section>

          {/* Emergency Contact */}
          <Section title="Emergency Contact">
            <Row label="Name"         value={val(student.emergency_contact_name)} />
            <Row label="Phone"        value={val(student.emergency_contact_phone)} />
            <Row label="Relationship" value={val(student.emergency_contact_relationship)} />
          </Section>

          {/* Finance — read-only for teachers */}
          <Section title="Finance (Read Only)">
            <Row label="Total Fees"    value={fmtMoney(student.total_fees)} />
            <Row label="Amount Paid"   value={fmtMoney(student.amount_paid)} />
            <Row label="Outstanding"
              value={
                <span className={Number(student.outstanding_balance) > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {fmtMoney(student.outstanding_balance)}
                </span>
              } />
            <Row label="Payment Plan"  value={val(student.fee_payment_plan)} />
            <Row label="Scholarship"   value={val(student.scholarship_type)} />
          </Section>

        </div>

        {/* Notes — full width */}
        {student.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-700 leading-relaxed">{student.notes}</p>
          </Section>
        )}

      </div>
    </div>
  );
};

export default StudentDetails;
