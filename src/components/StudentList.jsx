import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      setStudents(response.data.students || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchStudents();
      return;
    }
    try {
      const response = await studentAPI.search(searchTerm);
      setStudents(response.data.students || []);
    } catch (err) {
      setError('Search failed');
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.delete(studentId);
        fetchStudents();
      } catch (err) {
        setError('Failed to delete student');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Students</h1>
        <Link
          to="/add-student"
          className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition"
        >
          + Add Student
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by name, ID, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-transparent"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition"
        >
          Search
        </button>
        <button
          type="button"
          onClick={fetchStudents}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Reset
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Code</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Standard</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Parent</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Balance (MK)</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {student.student_code || student.student_id}
                    </span>
                  </td>
                  <td className="p-3 font-medium">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="p-3">Std {student.current_standard}</td>
                  <td className="p-3 text-sm text-gray-600">{student.parent_name}</td>
                  <td className="p-3 font-medium">
                    {student.outstanding_balance > 0 ? (
                      <span className="text-red-600">
                        {parseFloat(student.outstanding_balance || 0).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600">0.00</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${student.enrollment_status === 'Active' ? 'bg-green-100 text-green-700' :
                        student.enrollment_status === 'Graduated' ? 'bg-blue-100 text-blue-700' :
                        student.enrollment_status === 'Transferred' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}
                    >
                      {student.enrollment_status || 'Active'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/students/${student.student_id}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        View
                      </Link>
                      <Link
                        to={`/students/${student.student_id}/edit`}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(student.student_id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;