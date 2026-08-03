import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <button className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </span>
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

export default TeacherManagement;