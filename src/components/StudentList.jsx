import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../services/api';
import TeacherNav from './TeacherNav';

const buildStudentTableMarkup = (students) => {
  const rows = students.map((student, index) => {
    const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');
    const dob = student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : 'N/A';
    const age = student.age || 'N/A';
    const classLabel = student.current_standard ? `Std ${student.current_standard}${student.current_class ? ` ${student.current_class}` : ''}` : 'N/A';

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${student.lin_code || student.student_code || student.student_id || 'N/A'}</td>
        <td>${fullName || 'N/A'}</td>
        <td>${dob}</td>
        <td>${age}</td>
        <td>${student.gender || 'N/A'}</td>
        <td>${student.village || 'N/A'}</td>
        <td>${student.district || 'N/A'}</td>
        <td>${classLabel}</td>
        <td>${student.academic_year || 'N/A'}</td>
        <td>${student.parent_name || 'N/A'}</td>
        <td>${student.parent_phone || 'N/A'}</td>
        <td>${student.enrollment_status || 'Active'}</td>
      </tr>
    `;
  }).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>LIN Code</th>
          <th>Name</th>
          <th>DOB</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Village</th>
          <th>District</th>
          <th>Class</th>
          <th>Academic Year</th>
          <th>Parent/Guardian</th>
          <th>Parent Phone</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const buildExportDocument = (students) => {
  const generatedAt = new Date().toLocaleString('en-GB');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Learner List</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #1f2937;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          h1 {
            color: #003C43;
            margin: 0 0 4px;
            font-size: 28px;
          }

          p {
            margin: 0 0 16px;
            color: #4b5563;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            table-layout: fixed;
          }

          th, td {
            border: 1px solid #d1d5db;
            padding: 7px 6px;
            text-align: left;
            word-wrap: break-word;
            vertical-align: top;
          }

          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <h1>Learner List</h1>
        <p>Generated on ${generatedAt}</p>
        ${buildStudentTableMarkup(students)}
      </body>
    </html>
  `;
};

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const triggerFileDownload = (content, mimeType, fileName) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportDocument = () => {
    if (students.length === 0) {
      setError('No learners available to export.');
      return;
    }

    setError('');
    triggerFileDownload(
      buildExportDocument(students),
      'application/msword',
      'learner-list.doc'
    );
  };

  const handleExportPdf = () => {
    if (students.length === 0) {
      setError('No learners available to export.');
      return;
    }

    setError('');
    const exportWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!exportWindow) {
      setError('Pop-up blocked. Allow pop-ups to export the learner list as PDF.');
      return;
    }

    exportWindow.document.write(buildExportDocument(students));
    exportWindow.document.close();
    exportWindow.focus();
    exportWindow.print();
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      setStudents(response.data.students || []);
      setError('');
    } catch {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialStudents = async () => {
      try {
        const response = await studentAPI.getAll();
        if (!active) return;
        setStudents(response.data.students || []);
        setError('');
      } catch {
        if (!active) return;
        setError('Failed to fetch students');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialStudents();
    return () => { active = false; };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) { fetchStudents(); return; }
    try {
      const response = await studentAPI.search(searchTerm);
      setStudents(response.data.students || []);
    } catch { setError('Search failed'); }
  };

  const handleDelete = async (studentId) => {
    setDeleting(true);
    try {
      await studentAPI.delete(studentId);
      setPendingDelete(null);
      fetchStudents();
    } catch { setError('Failed to delete student'); }
    finally { setDeleting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-sm">Loading students...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-lg font-bold text-[#003C43]">All Students</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 text-sm border border-[#135D66]/30 text-[#135D66] rounded-lg hover:bg-[#135D66]/5 transition font-medium"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleExportDocument}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Download Document
              </button>
              <Link to="/add-student"
                className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium">
                + Add Student
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input type="text" placeholder="Search by name, LIN Code..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135D66] transition" />
            <button type="submit"
              className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium">
              Search
            </button>
            <button type="button" onClick={fetchStudents}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
              Reset
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide border-y border-gray-100">
                  <th className="px-4 py-2.5 text-left">LIN Code</th>
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Standard</th>
                  <th className="px-4 py-2.5 text-left">Parent</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">No students found</td></tr>
                ) : students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded">
                        {student.lin_code || student.student_code || student.student_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">Std {student.current_standard}</td>
                    <td className="px-4 py-3 text-gray-500">{student.parent_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                        ${student.enrollment_status === 'Active'      ? 'bg-green-50 text-green-700 border-green-200' :
                          student.enrollment_status === 'Graduated'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          student.enrollment_status === 'Transferred' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'}`}>
                        {student.enrollment_status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/students/${student.student_id}`}
                          className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium">
                          View
                        </Link>
                        <Link to={`/students/${student.student_id}/edit`}
                          className="px-2.5 py-1 text-xs bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition font-medium">
                          Edit
                        </Link>
                        <button onClick={() => setPendingDelete(student)}
                          className="px-2.5 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Delete Student</h2>
              <p className="mt-1 text-sm text-gray-500">
                Are you sure you want to delete {pendingDelete.first_name} {pendingDelete.last_name}?
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete.student_id || String(pendingDelete.id))}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;