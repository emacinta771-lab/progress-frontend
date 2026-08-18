import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradeAPI, studentAPI, teacherAPI } from '../services/api';
import TeacherNav from './TeacherNav';
import { useAuth } from '../context/AuthContext';

const SUBJECT_OPTIONS = ['', 'English', 'Mathematics', 'Science', 'Social Studies', 'Agriculture', 'Chichewa', 'Bible Knowledge'];
const TERM_OPTIONS = ['Term 1', 'Term 2', 'Term 3'];
const ASSESSMENT_OPTIONS = ['Test 1', 'Test 2', 'End of Term Exam'];
const ASSESSMENT_INDEX = {
  'Test 1': 0,
  'Test 2': 1,
  'End of Term Exam': 2,
};
const EMPTY_LIST = [];

// Map between display labels and the integer the DB stores
const termLabelToInt = (label) => {
  const n = parseInt(String(label).replace(/\D/g, ''), 10);
  return isNaN(n) ? 1 : n;
};
const termIntToLabel = (n) => {
  const num = parseInt(n, 10);
  return Number.isNaN(num) ? 'Term 1' : `Term ${num}`;
};

const normalizeAssessmentType = (grade) => {
  if (grade?.assessment_type && ASSESSMENT_INDEX[grade.assessment_type] !== undefined) {
    return grade.assessment_type;
  }

  const noteMatch = String(grade?.notes || '').match(/^\[(Test 1|Test 2|End of Term Exam)\]\s*/i);
  if (noteMatch?.[1]) {
    const normalized = noteMatch[1]
      .replace(/test\s*1/i, 'Test 1')
      .replace(/test\s*2/i, 'Test 2')
      .replace(/end of term exam/i, 'End of Term Exam');
    return normalized;
  }

  return 'End of Term Exam';
};

const normalizeTermLabel = (termValue) => {
  if (typeof termValue === 'number') return `Term ${termValue}`;
  const raw = String(termValue || '').trim();
  if (/^term\s*\d+/i.test(raw)) {
    const n = parseInt(raw.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? 'Term 1' : `Term ${n}`;
  }
  const maybeInt = parseInt(raw, 10);
  return Number.isNaN(maybeInt) ? 'Term 1' : `Term ${maybeInt}`;
};

const renderProgressSvg = (points) => {
  const width = 760;
  const height = 280;
  const padLeft = 56;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 52;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const labels = ASSESSMENT_OPTIONS;

  const coords = labels.map((label, idx) => {
    const x = padLeft + (idx * chartW) / (labels.length - 1);
    const raw = points[label];
    if (raw === null || raw === undefined) return { x, y: null, label, value: null };
    const y = padTop + chartH - (Number(raw) / 100) * chartH;
    return { x, y, label, value: Number(raw) };
  });

  const linePath = coords
    .filter((point) => point.y !== null)
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Learner Progress" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
      <text x="${width / 2}" y="18" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#003C43" font-weight="700">Learner Progress</text>
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="#94a3b8" stroke-width="1"/>
      <line x1="${padLeft}" y1="${padTop + chartH}" x2="${padLeft + chartW}" y2="${padTop + chartH}" stroke="#94a3b8" stroke-width="1"/>
      ${[0, 25, 50, 75, 100].map((tick) => {
        const y = padTop + chartH - (tick / 100) * chartH;
        return `
          <line x1="${padLeft}" y1="${y}" x2="${padLeft + chartW}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748b" font-family="Arial, sans-serif">${tick}</text>
        `;
      }).join('')}
      ${linePath ? `<path d="${linePath}" fill="none" stroke="#0f766e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${coords.map((point) => {
        if (point.y === null) {
          return `
            <text x="${point.x}" y="${padTop + chartH + 18}" text-anchor="middle" font-size="10" fill="#64748b" font-family="Arial, sans-serif">${point.label}</text>
            <text x="${point.x}" y="${padTop + chartH - 8}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="Arial, sans-serif">N/A</text>
          `;
        }
        return `
          <circle cx="${point.x}" cy="${point.y}" r="5" fill="#135D66" stroke="#ffffff" stroke-width="2"/>
          <text x="${point.x}" y="${point.y - 10}" text-anchor="middle" font-size="10" fill="#0f172a" font-family="Arial, sans-serif" font-weight="700">${point.value}</text>
          <text x="${point.x}" y="${padTop + chartH + 18}" text-anchor="middle" font-size="10" fill="#64748b" font-family="Arial, sans-serif">${point.label}</text>
        `;
      }).join('')}
    </svg>
  `;
};
const defaultAcademicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

const sortStudents = (students) => [...students].sort((left, right) => {
  if (left.current_standard !== right.current_standard) {
    return Number(left.current_standard) - Number(right.current_standard);
  }

  if ((left.current_class || '') !== (right.current_class || '')) {
    return (left.current_class || '').localeCompare(right.current_class || '');
  }

  return `${left.first_name} ${left.last_name}`.localeCompare(`${right.first_name} ${right.last_name}`);
});

const scoreToGrade = (score) => {
  const numericScore = Number(score);
  if (Number.isNaN(numericScore)) return '';
  if (numericScore >= 80) return 'A';
  if (numericScore >= 70) return 'B';
  if (numericScore >= 60) return 'C';
  if (numericScore >= 50) return 'D';
  return 'F';
};

const buildDrafts = (students, grades, classAssignment) => {
  const latestGradeByInternalId = new Map();

  grades.forEach((grade) => {
    if (!latestGradeByInternalId.has(grade.student_id)) {
      latestGradeByInternalId.set(grade.student_id, grade);
    }
  });

  return students.reduce((drafts, student) => {
    const existing = latestGradeByInternalId.get(student.id);
    drafts[student.student_id] = {
      subject: existing?.subject || '',
      score: existing?.score ?? '',
      term: existing?.term ? termIntToLabel(existing.term) : 'Term 1',
      assessment_type: normalizeAssessmentType(existing),
      academic_year: existing?.academic_year || classAssignment?.assigned_academic_year || defaultAcademicYear,
      notes: existing?.notes || '',
    };
    return drafts;
  }, {});
};

const GradeManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draftOverrides, setDraftOverrides] = useState({});
  const [savingStudentId, setSavingStudentId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [progressStudentId, setProgressStudentId] = useState('');
  const [progressSubject, setProgressSubject] = useState('');
  const [progressTerm, setProgressTerm] = useState('Term 1');

  const gradesQuery = useQuery({
    queryKey: ['grade-register', user?.id, user?.role],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [gradesResponse, studentsResponse] = await Promise.all([
        gradeAPI.getAll(),
        user.role === 'teacher' ? teacherAPI.getStudents(user.id) : studentAPI.getAll(),
      ]);

      const availableStudents = user.role === 'teacher'
        ? sortStudents(studentsResponse.data.students || [])
        : sortStudents((studentsResponse.data.students || []).filter((student) => student.enrollment_status === 'Active'));
      const classStudents = new Set(availableStudents.map((student) => student.id));

      return {
        class_assignment: studentsResponse.data.class_assignment || null,
        students: availableStudents,
        grades: (gradesResponse.data.grades || []).filter((grade) => classStudents.has(grade.student_id)),
      };
    },
  });

  const saveGradeMutation = useMutation({
    mutationFn: (payload) => gradeAPI.enterGrades(payload),
    onSuccess: async (_, payload) => {
      setDraftOverrides((prev) => {
        const next = { ...prev };
        delete next[payload.student_id];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ['grade-register', user?.id, user?.role] });
    },
  });

  const classAssignment = gradesQuery.data?.class_assignment ?? null;
  const students = gradesQuery.data?.students ?? EMPTY_LIST;
  const grades = gradesQuery.data?.grades ?? EMPTY_LIST;
  const drafts = buildDrafts(students, grades, classAssignment);

  const progressStudent = useMemo(() => {
    if (!progressStudentId) return null;
    return students.find((student) => student.student_id === progressStudentId) || null;
  }, [students, progressStudentId]);

  const progressSeries = useMemo(() => {
    if (!progressStudent || !progressSubject) return null;

    const studentGrades = grades
      .filter((grade) => grade.student_id === progressStudent.id)
      .filter((grade) => grade.subject === progressSubject)
      .filter((grade) => normalizeTermLabel(grade.term) === progressTerm)
      .map((grade) => ({
        ...grade,
        assessment_type: normalizeAssessmentType(grade),
      }))
      .sort((left, right) => new Date(left.created_at || 0) - new Date(right.created_at || 0));

    const buckets = {
      'Test 1': [],
      'Test 2': [],
      'End of Term Exam': [],
    };

    studentGrades.forEach((grade) => {
      const score = Number(grade.score);
      if (!Number.isNaN(score) && buckets[grade.assessment_type]) {
        buckets[grade.assessment_type].push(score);
      }
    });

    const mean = (values) => {
      if (!values.length) return null;
      return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
    };

    const points = {
      'Test 1': mean(buckets['Test 1']),
      'Test 2': mean(buckets['Test 2']),
      'End of Term Exam': mean(buckets['End of Term Exam']),
    };

    const definedScores = Object.values(points).filter((value) => value !== null && value !== undefined);
    const avg = definedScores.length
      ? Number((definedScores.reduce((sum, score) => sum + score, 0) / definedScores.length).toFixed(1))
      : null;

    return {
      points,
      average: avg,
      count: definedScores.length,
    };
  }, [grades, progressStudent, progressSubject, progressTerm]);

  const handleDraftChange = (studentId, field, value) => {
    setDraftOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveGrade = async (student) => {
    const draft = { ...drafts[student.student_id], ...draftOverrides[student.student_id] };

    if (!draft?.subject || draft.score === '') {
      setMessage({ type: 'error', text: 'Select a subject and enter a score before saving.' });
      return;
    }

    if (!draft?.assessment_type) {
      setMessage({ type: 'error', text: 'Select an assessment type before saving.' });
      return;
    }

    const numericScore = Number(draft.score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      setMessage({ type: 'error', text: 'Score must be a number between 0 and 100.' });
      return;
    }

    try {
      setSavingStudentId(student.student_id);
      setError('');
      setMessage(null);

      await saveGradeMutation.mutateAsync({
        student_id: student.student_id,
        subject: draft.subject,
        score: numericScore,
        grade: scoreToGrade(numericScore),
        term: termLabelToInt(draft.term),
        assessment_type: draft.assessment_type,
        academic_year: draft.academic_year,
        notes: draft.notes?.trim() || null,
      });

      setMessage({ type: 'success', text: `Saved grade for ${student.first_name} ${student.last_name}.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || `Failed to save grade for ${student.first_name} ${student.last_name}.`,
      });
    } finally {
      setSavingStudentId('');
    }
  };

  const isTeacherWithoutClass = user?.role === 'teacher' && !classAssignment?.class_name;

  if (gradesQuery.isPending) return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-sm">Loading grades...</div>
      </div>
    </div>
  );

  const queryError = gradesQuery.error?.response?.data?.error || gradesQuery.error?.message || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-[#003C43]">Grade Management</h1>
              {classAssignment?.class_name && (
                <p className="text-sm text-gray-500 mt-1">Managing grades for {classAssignment.class_name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#135D66]">{grades.length} grade entries</p>
              <p className="text-xs text-gray-400">{students.length} students in class</p>
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

          {isTeacherWithoutClass ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm text-gray-600">Set up your class first before entering grades.</p>
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
                    <th className="px-4 py-2.5 text-left">Class</th>
                    <th className="px-4 py-2.5 text-left">Subject</th>
                    <th className="px-4 py-2.5 text-left">Score</th>
                    <th className="px-4 py-2.5 text-left">Grade</th>
                    <th className="px-4 py-2.5 text-left">Assessment</th>
                    <th className="px-4 py-2.5 text-left">Term</th>
                    <th className="px-4 py-2.5 text-left">Academic Year</th>
                    <th className="px-4 py-2.5 text-left">Notes</th>
                    <th className="px-4 py-2.5 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.length === 0 ? (
                    <tr><td colSpan="10" className="text-center py-10 text-gray-400">No active students available for grading.</td></tr>
                  ) : students.map((student) => {
                    const draft = {
                      subject: '',
                      score: '',
                      assessment_type: 'End of Term Exam',
                      term: 'Term 1',
                      academic_year: classAssignment?.assigned_academic_year || defaultAcademicYear,
                      notes: '',
                      ...(drafts[student.student_id] || {}),
                      ...(draftOverrides[student.student_id] || {}),
                    };
                    const computedGrade = scoreToGrade(draft.score);

                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                        <td className="px-4 py-3 text-gray-600">Std {student.current_standard} {student.current_class}</td>
                        <td className="px-4 py-3">
                          <select
                            value={draft.subject}
                            onChange={(event) => handleDraftChange(student.student_id, 'subject', event.target.value)}
                            className="w-full min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          >
                            {SUBJECT_OPTIONS.map((subject) => (
                              <option key={subject || 'blank'} value={subject}>{subject || 'Select subject'}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={draft.score}
                            onChange={(event) => handleDraftChange(student.student_id, 'score', event.target.value)}
                            className="w-full min-w-[90px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {computedGrade || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={draft.assessment_type}
                            onChange={(event) => handleDraftChange(student.student_id, 'assessment_type', event.target.value)}
                            className="w-full min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          >
                            {ASSESSMENT_OPTIONS.map((assessment) => (
                              <option key={assessment} value={assessment}>{assessment}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={draft.term}
                            onChange={(event) => handleDraftChange(student.student_id, 'term', event.target.value)}
                            className="w-full min-w-[110px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          >
                            {TERM_OPTIONS.map((term) => (
                              <option key={term} value={term}>{term}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={draft.academic_year}
                            onChange={(event) => handleDraftChange(student.student_id, 'academic_year', event.target.value)}
                            className="w-full min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={draft.notes}
                            onChange={(event) => handleDraftChange(student.student_id, 'notes', event.target.value)}
                            placeholder="Optional"
                            className="w-full min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(student)}
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

        {!isTeacherWithoutClass && grades.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-[#003C43] mb-4">Recent Saved Grades</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide border-y border-gray-100">
                    <th className="px-4 py-2.5 text-left">Student</th>
                    <th className="px-4 py-2.5 text-left">Subject</th>
                    <th className="px-4 py-2.5 text-left">Score</th>
                    <th className="px-4 py-2.5 text-left">Grade</th>
                    <th className="px-4 py-2.5 text-left">Assessment</th>
                    <th className="px-4 py-2.5 text-left">Term</th>
                    <th className="px-4 py-2.5 text-left">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grades.slice(0, 10).map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{grade.first_name} {grade.last_name}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.subject}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{grade.score}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.grade}</td>
                      <td className="px-4 py-3 text-gray-600">{normalizeAssessmentType(grade)}</td>
                      <td className="px-4 py-3 text-gray-600">{normalizeTermLabel(grade.term)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{grade.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isTeacherWithoutClass && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-base font-bold text-[#003C43]">Learner Progress</h2>
              <div className="text-xs text-gray-500">Track Test 1, Test 2, and End of Term Exam performance</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <select
                value={progressStudentId}
                onChange={(event) => setProgressStudentId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
              >
                <option value="">Select learner</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>

              <select
                value={progressSubject}
                onChange={(event) => setProgressSubject(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
              >
                <option value="">Select subject</option>
                {SUBJECT_OPTIONS.filter(Boolean).map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={progressTerm}
                onChange={(event) => setProgressTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D66]"
              >
                {TERM_OPTIONS.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            {!progressSeries || !progressStudent || !progressSubject ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Select a learner and subject to generate the progress graph.
              </div>
            ) : (
              (() => {
                const graphTitle = 'Learner Progress';
                const graphSvg = renderProgressSvg(progressSeries.points);
                const generatedAt = new Date().toLocaleString('en-GB');
                const subtitle = `${progressStudent.first_name} ${progressStudent.last_name} · ${progressSubject} · ${progressTerm}`;
                const htmlDoc = `
                  <html>
                    <head>
                      <meta charset="utf-8" />
                      <title>${graphTitle}</title>
                      <style>
                        body { font-family: Arial, sans-serif; color: #1f2937; padding: 20px; }
                        h1 { color: #003C43; margin: 0 0 6px; }
                        p { margin: 2px 0; color: #4b5563; font-size: 13px; }
                        .meta { margin-bottom: 14px; }
                        .chart-wrap { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
                      </style>
                    </head>
                    <body>
                      <h1>${graphTitle}</h1>
                      <div class="meta">
                        <p>${subtitle}</p>
                        <p>Generated: ${generatedAt}</p>
                        <p>Average Score: ${progressSeries.average ?? 'N/A'}</p>
                      </div>
                      <div class="chart-wrap">${graphSvg}</div>
                    </body>
                  </html>
                `;

                const downloadDoc = () => {
                  const blob = new Blob([htmlDoc], { type: 'application/msword' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = `learner-progress-${progressStudent.student_id}-${progressSubject.replace(/\s+/g, '-').toLowerCase()}.doc`;
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(url);
                };

                const downloadPdf = () => {
                  const printWindow = window.open('', '_blank', 'width=1000,height=700');
                  if (!printWindow) {
                    setMessage({ type: 'error', text: 'Pop-up blocked. Allow pop-ups to export PDF.' });
                    return;
                  }
                  printWindow.document.write(htmlDoc);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                };

                return (
                  <div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: graphSvg }} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">
                        {subtitle} · Average: <span className="font-semibold text-gray-700">{progressSeries.average ?? 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={downloadDoc}
                          className="px-4 py-2 text-sm border border-[#135D66]/30 text-[#135D66] rounded-lg hover:bg-[#135D66]/5 transition font-medium"
                        >
                          Download Document
                        </button>
                        <button
                          type="button"
                          onClick={downloadPdf}
                          className="px-4 py-2 text-sm bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium"
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeManagement;