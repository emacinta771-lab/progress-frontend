import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Attendance Management</h1>
        <button className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition">
          + Take Attendance
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-500">Today's Attendance</p>
        <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Student</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Code</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Class</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Check In</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Check Out</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No attendance records for today
                </td>
              </tr>
            ) : (
              attendance.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">
                    {record.first_name} {record.last_name}
                  </td>
                  <td className="p-3 text-sm">{record.student_code}</td>
                  <td className="p-3">Std {record.current_standard}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${record.status === 'Present' ? 'bg-green-100 text-green-700' :
                        record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                        record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{record.check_in_time || '--:--'}</td>
                  <td className="p-3 text-sm">{record.check_out_time || '--:--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManagement;