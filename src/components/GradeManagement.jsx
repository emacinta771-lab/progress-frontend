import React, { useState, useEffect } from 'react';
import { gradeAPI } from '../services/api';
import TeacherNav from './TeacherNav';

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchGrades(); }, []);

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

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-sm">Loading grades...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-[#003C43]">Grade Management</h1>
            <button className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium">
              + Enter Grades
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide border-y border-gray-100">
                  <th className="px-4 py-2.5 text-left">Student</th>
                  <th className="px-4 py-2.5 text-left">Subject</th>
                  <th className="px-4 py-2.5 text-left">Score</th>
                  <th className="px-4 py-2.5 text-left">Grade</th>
                  <th className="px-4 py-2.5 text-left">Term</th>
                  <th className="px-4 py-2.5 text-left">Academic Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grades.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">No grades found</td></tr>
                ) : grades.map(grade => (
                  <tr key={grade.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{grade.first_name} {grade.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{grade.subject}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{grade.score}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                        ${grade.grade === 'A' ? 'bg-green-50 text-green-700 border-green-200' :
                          grade.grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          grade.grade === 'C' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          grade.grade === 'D' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{grade.term}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{grade.academic_year}</td>
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

export default GradeManagement;