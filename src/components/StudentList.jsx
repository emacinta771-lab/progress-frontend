import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../services/api';
import TeacherNav from './TeacherNav';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      setStudents(response.data.students || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) { fetchStudents(); return; }
    try {
      const response = await studentAPI.search(searchTerm);
      setStudents(response.data.students || []);
    } catch { setError('Search failed'); }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await studentAPI.delete(studentId);
      fetchStudents();
    } catch { setError('Failed to delete student'); }
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
            <Link to="/add-student"
              className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium">
              + Add Student
            </Link>
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
                        <button onClick={() => handleDelete(student.student_id)}
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
    </div>
  );
};

export default StudentList;