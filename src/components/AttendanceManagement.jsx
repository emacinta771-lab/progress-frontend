import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import TeacherNav from './TeacherNav';

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getToday();
      setAttendance(response.data.attendance || []);
    } catch (err) {
      setError('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-sm">Loading attendance...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-[#003C43]">Attendance Management</h1>
            <button className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium">
              + Take Attendance
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide border-y border-gray-100">
                  <th className="px-4 py-2.5 text-left">Student</th>
                  <th className="px-4 py-2.5 text-left">LIN Code</th>
                  <th className="px-4 py-2.5 text-left">Class</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Check In</th>
                  <th className="px-4 py-2.5 text-left">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">No attendance records for today</td></tr>
                ) : attendance.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{record.first_name} {record.last_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{record.student_code}</td>
                    <td className="px-4 py-3 text-gray-600">Std {record.current_standard}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                        ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                          record.status === 'Absent'  ? 'bg-red-50 text-red-700 border-red-200' :
                          record.status === 'Late'    ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{record.check_in_time || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{record.check_out_time || '—'}</td>
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

export default AttendanceManagement;