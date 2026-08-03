import React, { useState, useEffect } from 'react';
import { gradeAPI } from '../services/api';

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradeAPI.getAll();
      setGrades(response.data.grades || []);
    } catch (err) {
      setError('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading grades...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Grade Management</h1>
        <button className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition">
          + Enter Grades
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
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Student</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Subject</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Score</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Grade</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Term</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Academic Year</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No grades found
                </td>
              </tr>
            ) : (
              grades.map((grade) => (
                <tr key={grade.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">
                    {grade.first_name} {grade.last_name}
                  </td>
                  <td className="p-3">{grade.subject}</td>
                  <td className="p-3 font-medium">{grade.score}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${grade.grade === 'A' ? 'bg-green-100 text-green-700' :
                        grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                        grade.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        grade.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}
                    >
                      {grade.grade}
                    </span>
                  </td>
                  <td className="p-3">{grade.term}</td>
                  <td className="p-3">{grade.academic_year}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeManagement;