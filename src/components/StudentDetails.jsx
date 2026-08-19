import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';

const formatValue = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const buildStudentProfileDocument = (student) => {
  const fullName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(' ');

  const profileFields = [
    ['LIN Code', student.lin_code || student.student_code || student.student_id || 'N/A'],
    ['Student ID', student.student_id || 'N/A'],
    ['Full Name', fullName || 'N/A'],
    ['Date of Birth', student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : 'N/A'],
    ['Age', student.age || 'N/A'],
    ['Gender', formatValue(student.gender)],
    ['Village', formatValue(student.village)],
    ['Location', formatValue(student.location)],
    ['District', formatValue(student.district)],
    ['Division', formatValue(student.division)],
    ['Traditional Authority', formatValue(student.traditional_authority)],
    ['Religious Denomination', formatValue(student.religious_denomination)],
    ['Orphan Status', formatValue(student.orphan_status)],
    ['Special Needs', student.special_needs ? formatValue(student.special_needs_description, 'Yes') : 'No'],
    ['ECD Attendance', formatValue(student.ecd_attendance)],
    ['Current Standard', student.current_standard ? `Standard ${student.current_standard}` : 'N/A'],
    ['Class', formatValue(student.current_class)],
    ['Academic Year', formatValue(student.academic_year)],
    ['Enrollment Status', formatValue(student.enrollment_status)],
    ['Parent / Guardian Name', formatValue(student.parent_name)],
    ['Parent / Guardian Phone', formatValue(student.parent_phone)],
    ['Relationship', formatValue(student.parent_relationship)],
    ['Parent Email', formatValue(student.parent_email)],
    ['Parent Occupation', formatValue(student.parent_occupation)],
    ['Parent Village', formatValue(student.parent_village)],
    ['Submission Date', student.submission_date ? new Date(student.submission_date).toLocaleDateString('en-GB') : 'N/A'],
    ['Notes', formatValue(student.notes)],
  ];

  const rows = profileFields.map(([label, value]) => `
    <tr>
      <th>${label}</th>
      <td>${value}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Student Profile - ${fullName || 'Learner'}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .page {
            width: 100%;
            min-height: 100vh;
            padding: 18px 20px 10px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: end;
            border-bottom: 2px solid #003C43;
            padding-bottom: 10px;
            margin-bottom: 18px;
          }

          h1 {
            margin: 0;
            font-size: 28px;
            color: #003C43;
          }

          .subtitle {
            margin: 4px 0 0;
            color: #4b5563;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .summary {
            text-align: right;
            font-size: 12px;
            color: #4b5563;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
          }

          th {
            width: 30%;
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
          }

          td {
            background: #ffffff;
          }

          .highlight {
            background: #e7f3f4;
            font-weight: 700;
          }

          @media print {
            body { margin: 0; }
            .page { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div>
              <h1>Child Profile</h1>
              <p class="subtitle">Student Record</p>
            </div>
            <div class="summary">
              <div>Generated:</div>
              <strong>${new Date().toLocaleDateString('en-GB')}</strong>
            </div>
          </div>

          <table>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
};

const StudentDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getById(studentId);
      setStudent(response.data.student);
      setError('');
    } catch (err) {
      setError('Failed to fetch student details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.delete(studentId);
        navigate('/students');
      } catch (err) {
        setError('Failed to delete student');
      }
    }
  };

  const handlePrintProfile = () => {
    if (!student) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      setError('Pop-up blocked. Allow pop-ups to print the child profile.');
      return;
    }

    printWindow.document.write(buildStudentProfileDocument(student));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading student details...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">{error || 'Student not found'}</p>
        <Link to="/students" className="text-[#135D66] hover:underline mt-2 inline-block">
          ← Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Student Details</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintProfile}
            className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition"
          >
            Print PDF
          </button>
          <Link
            to={`/students/${studentId}/edit`}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Delete
          </button>
          <Link
            to="/students"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Student Code</h3>
            <p className="text-lg font-medium">{student.student_code || student.student_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Full Name</h3>
            <p className="text-lg font-medium">{student.first_name} {student.middle_name || ''} {student.last_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Date of Birth</h3>
            <p className="text-lg">{new Date(student.date_of_birth).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Gender</h3>
            <p className="text-lg">{student.gender}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Phone</h3>
            <p className="text-lg">{student.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Current Standard</h3>
            <p className="text-lg font-medium">Standard {student.current_standard} {student.current_class}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Academic Year</h3>
            <p className="text-lg">{student.academic_year}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Enrollment Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block
              ${student.enrollment_status === 'Active' ? 'bg-green-100 text-green-700' :
                student.enrollment_status === 'Graduated' ? 'bg-blue-100 text-blue-700' :
                student.enrollment_status === 'Transferred' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'}`}
            >
              {student.enrollment_status || 'Active'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">District</h3>
            <p className="text-lg">{student.district}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Village</h3>
            <p className="text-lg">{student.village || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-[#003C43] mb-4">Parent/Guardian Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Name</h3>
            <p>{student.parent_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Phone</h3>
            <p>{student.parent_phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Relationship</h3>
            <p>{student.parent_relationship}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Email</h3>
            <p>{student.parent_email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-[#003C43] mb-4">Fee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Total Fees</h3>
            <p className="text-xl font-bold">MK {parseFloat(student.total_fees || 0).toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Amount Paid</h3>
            <p className="text-xl font-bold text-green-600">MK {parseFloat(student.amount_paid || 0).toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Outstanding Balance</h3>
            <p className={`text-xl font-bold ${student.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              MK {parseFloat(student.outstanding_balance || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;