import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI, studentAPI, teacherAPI } from '../services/api';
import TeacherNav from './TeacherNav';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['', 'Present', 'Absent', 'Late'];

const todayIso = () => new Date().toISOString().split('T')[0];

const normalizeTime = (value) => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

const sortStudents = (students) => [...students].sort((left, right) => {
  if (left.current_standard !== right.current_standard) {
    return Number(left.current_standard) - Number(right.current_standard);
  }

  if ((left.current_class || '') !== (right.current_class || '')) {
    return (left.current_class || '').localeCompare(right.current_class || '');
  }

  return `${left.first_name} ${left.last_name}`.localeCompare(`${right.first_name} ${right.last_name}`);
});

const buildDrafts = (students, records) => {
  const recordsByInternalId = new Map(records.map((record) => [record.student_id, record]));

  return students.reduce((drafts, student) => {
    const existing = recordsByInternalId.get(student.id);
    drafts[student.student_id] = {
      status: existing?.status || '',
      check_in_time: normalizeTime(existing?.check_in_time),
      check_out_time: normalizeTime(existing?.check_out_time),
      notes: existing?.notes || '',
    };
    return drafts;
  }, {});
};

const AttendanceManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draftOverrides, setDraftOverrides] = useState({});
  const [savingStudentId, setSavingStudentId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const attendanceQuery = useQuery({
    queryKey: ['attendance-register', user?.id, user?.role],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [attendanceResponse, studentsResponse] = await Promise.all([
        attendanceAPI.getToday(),
        user.role === 'teacher' ? teacherAPI.getStudents(user.id) : studentAPI.getAll(),
      ]);

      const todayAttendance = attendanceResponse.data.attendance || [];
      const availableStudents = user.role === 'teacher'
        ? sortStudents(studentsResponse.data.students || [])
        : sortStudents((studentsResponse.data.students || []).filter((student) => student.enrollment_status === 'Active'));
      const studentIds = new Set(availableStudents.map((student) => student.id));

      return {
        class_assignment: studentsResponse.data.class_assignment || null,
        students: availableStudents,
        attendance: todayAttendance.filter((record) => studentIds.has(record.student_id)),
      };
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: (payload) => attendanceAPI.record(payload),
    onSuccess: async (_, payload) => {
      setDraftOverrides((prev) => {
        const next = { ...prev };
        delete next[payload.student_id];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ['attendance-register', user?.id, user?.role] });
    },
  });

  const classAssignment = attendanceQuery.data?.class_assignment || null;
  const students = attendanceQuery.data?.students || [];
  const attendance = attendanceQuery.data?.attendance || [];
  const drafts = buildDrafts(students, attendance);

  const handleDraftChange = (studentId, field, value) => {
    setDraftOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = async (student) => {
    const draft = { ...drafts[student.student_id], ...draftOverrides[student.student_id] };

    if (!draft?.status) {
      setMessage({ type: 'error', text: 'Select an attendance status before saving.' });
      return;
    }

    try {
      setSavingStudentId(student.student_id);
      setError('');
      setMessage(null);

      await saveAttendanceMutation.mutateAsync({
        student_id: student.student_id,
        date: todayIso(),
        status: draft.status,
        check_in_time: draft.check_in_time || null,
        check_out_time: draft.check_out_time || null,
        notes: draft.notes?.trim() || null,
      });

      setMessage({ type: 'success', text: `Saved attendance for ${student.first_name} ${student.last_name}.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || `Failed to save attendance for ${student.first_name} ${student.last_name}.`,
      });
    } finally {
      setSavingStudentId('');
    }
  };

  const todayAttendanceCount = attendance.length;
  const isTeacherWithoutClass = user?.role === 'teacher' && !classAssignment?.class_name;

  if (attendanceQuery.isPending) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-sm">Loading attendance...</div>
      </div>
    </div>
  );

  const queryError = attendanceQuery.error?.response?.data?.error || attendanceQuery.error?.message || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-[#003C43]">Attendance Management</h1>
              {classAssignment?.class_name && (
                <p className="text-sm text-gray-500 mt-1">Managing attendance for {classAssignment.class_name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#135D66]">{todayAttendanceCount} saved today</p>
              <p className="text-xs text-gray-400">{students.length} active students</p>
            </div>
          </div>

          {(error || queryError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm text-red-700">{error || queryError}</div>
          )}

          {message && (
            <div className={`border-l-4 p-3 mb-4 rounded text-sm ${message.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Today's Attendance Register</p>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {isTeacherWithoutClass ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm text-gray-600">Set up your class first before taking attendance.</p>
              <Link
                to="/my-class"
                className="mt-4 inline-flex rounded-lg bg-[#135D66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0e4a52]"
              >
                Create My Class
              </Link>
            </div>
          ) : (
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
                    <th className="px-4 py-2.5 text-left">Notes</th>
                    <th className="px-4 py-2.5 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">No active students available for attendance.</td></tr>
                  ) : students.map((student) => {
                    const draft = {
                      status: '',
                      check_in_time: '',
                      check_out_time: '',
                      notes: '',
                      ...(drafts[student.student_id] || {}),
                      ...(draftOverrides[student.student_id] || {}),
                    };

                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{student.lin_code || student.student_code}</td>
                        <td className="px-4 py-3 text-gray-600">Std {student.current_standard}{student.current_class ? ` ${student.current_class}` : ''}</td>
                        <td className="px-4 py-3">
                          <select
                            value={draft.status}
                            onChange={(event) => handleDraftChange(student.student_id, 'status', event.target.value)}
                            className="w-full min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status || 'blank'} value={status}>
                                {status || 'Select status'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={draft.check_in_time}
                            onChange={(event) => handleDraftChange(student.student_id, 'check_in_time', event.target.value)}
                            className="w-full min-w-[110px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={draft.check_out_time}
                            onChange={(event) => handleDraftChange(student.student_id, 'check_out_time', event.target.value)}
                            className="w-full min-w-[110px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={draft.notes}
                            onChange={(event) => handleDraftChange(student.student_id, 'notes', event.target.value)}
                            placeholder="Optional"
                            className="w-full min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSaveAttendance(student)}
                            disabled={savingStudentId === student.student_id}
                            className="rounded-lg bg-[#135D66] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0e4a52] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingStudentId === student.student_id ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;