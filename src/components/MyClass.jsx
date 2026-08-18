import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TeacherNav from './TeacherNav';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../services/api';

const STANDARD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const CLASS_OPTIONS = ['A', 'B', 'C', 'D'];
const defaultAcademicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

const MyClass = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const classQuery = useQuery({
    queryKey: ['teacher-class', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const response = await teacherAPI.getStudents(user.id);
      return response.data;
    },
  });

  const saveClassMutation = useMutation({
    mutationFn: (payload) => teacherAPI.updateClassAssignment(user.id, payload),
    onSuccess: async (response) => {
      setDraft({});
      setError('');
      setMessage(response.data.message || 'Class saved successfully.');
      await queryClient.invalidateQueries({ queryKey: ['teacher-class', user?.id] });
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.error || 'Failed to save your class.');
    },
  });

  const classAssignment = classQuery.data?.class_assignment || null;
  const students = classQuery.data?.students || [];
  const form = {
    assigned_standard: draft.assigned_standard ?? classAssignment?.assigned_standard ?? '',
    assigned_class: draft.assigned_class ?? classAssignment?.assigned_class ?? 'A',
    assigned_academic_year: draft.assigned_academic_year ?? classAssignment?.assigned_academic_year ?? defaultAcademicYear,
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.assigned_standard) {
      setMessage('');
      setError('Choose a standard before saving your class.');
      return;
    }

    try {
      setError('');
      setMessage('');
      await saveClassMutation.mutateAsync({
        assigned_standard: Number(form.assigned_standard),
        assigned_class: form.assigned_class,
        assigned_academic_year: form.assigned_academic_year,
      });
    } catch {
      // handled by mutation callbacks
    }
  };

  if (classQuery.isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TeacherNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500 text-sm">Loading class setup...</div>
        </div>
      </div>
    );
  }

  const queryError = classQuery.error?.response?.data?.error || classQuery.error?.message || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-[#003C43]">My Class</h1>
              <p className="text-sm text-gray-500 mt-1">
                Choose a standard and class section to create the class you will manage for grades and attendance.
              </p>
            </div>
            {classAssignment?.class_name && (
              <span className="inline-flex items-center rounded-full border border-[#135D66]/20 bg-[#135D66]/10 px-3 py-1 text-xs font-semibold text-[#135D66]">
                {classAssignment.class_name}
              </span>
            )}
          </div>

          {(error || queryError) && (
            <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
              {error || queryError}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-lg border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Standard</span>
              <select
                name="assigned_standard"
                value={form.assigned_standard}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
              >
                <option value="">Select standard</option>
                {STANDARD_OPTIONS.map((standard) => (
                  <option key={standard} value={standard}>Standard {standard}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Class Section</span>
              <select
                name="assigned_class"
                value={form.assigned_class}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
              >
                {CLASS_OPTIONS.map((classCode) => (
                  <option key={classCode} value={classCode}>{classCode}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</span>
              <input
                name="assigned_academic_year"
                value={form.assigned_academic_year}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                placeholder="2026/2027"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Saving Standard {form.assigned_standard || '...'} {form.assigned_class} will make that your active class for attendance and grade entry.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveClassMutation.isPending}
              className="rounded-lg bg-[#135D66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e4a52] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveClassMutation.isPending ? 'Saving...' : 'Save My Class'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#003C43]">Class Roster</h2>
              <p className="text-sm text-gray-500 mt-1">
                Students in your current class appear here automatically.
              </p>
            </div>
            {classAssignment?.class_name && (
              <div className="flex gap-2">
                <Link
                  to="/attendance"
                  className="rounded-lg border border-[#135D66]/20 bg-[#135D66]/10 px-4 py-2 text-sm font-semibold text-[#135D66] transition hover:bg-[#135D66]/20"
                >
                  Take Attendance
                </Link>
                <Link
                  to="/grades"
                  className="rounded-lg bg-[#003C43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#135D66]"
                >
                  Enter Grades
                </Link>
              </div>
            )}
          </div>

          {!classAssignment?.class_name ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No class has been assigned yet. Choose a standard above to create your class.
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              {classAssignment.class_name} is saved, but there are no active students in it yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">LIN Code</th>
                    <th className="px-4 py-2.5">Standard</th>
                    <th className="px-4 py-2.5">Parent</th>
                    <th className="px-4 py-2.5">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{student.lin_code || student.student_code}</td>
                      <td className="px-4 py-3 text-gray-600">Standard {student.current_standard} {student.current_class}</td>
                      <td className="px-4 py-3 text-gray-600">{student.parent_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{student.parent_phone || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyClass;