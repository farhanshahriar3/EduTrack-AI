import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Search, Edit3, CheckCircle2, AlertCircle, BookOpen, User } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { Enrollment } from '../types';

export const GradesManagement: React.FC = () => {
  const { isAdmin, isTeacher } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedTermId, setSelectedTermId] = useState<number | undefined>(undefined);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');

  // Grade Modal State
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [numericScore, setNumericScore] = useState<string>('');
  const [letterGrade, setLetterGrade] = useState<string>('');
  const [countsInGpa, setCountsInGpa] = useState<boolean>(true);

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.getTerms(),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.getCourses(),
  });

  const { data: policy } = useQuery({
    queryKey: ['gradingPolicy'],
    queryFn: () => api.getGradingPolicy(),
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments', selectedTermId, selectedCourseId],
    queryFn: () =>
      api.getEnrollments({
        term_id: selectedTermId,
        course_id: selectedCourseId,
      }),
  });

  // Automatically calculate expected letter grade from numeric score based on policy
  const calculatePreview = (scoreStr: string) => {
    const score = parseFloat(scoreStr);
    if (isNaN(score) || !policy?.scale_config) return { letter: 'F', points: 0.0 };

    const sortedScales = Object.entries(policy.scale_config).sort(
      (a: any, b: any) => b[1].min_score - a[1].min_score
    );

    for (const [letter, details] of sortedScales as any) {
      if (score >= details.min_score) {
        return { letter, points: details.points };
      }
    }
    return { letter: 'F', points: 0.0 };
  };

  const previewGrade = calculatePreview(numericScore);

  const gradeMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (activeEnrollment?.grade) {
        return api.updateGrade(activeEnrollment.grade.id, {
          numeric_score: Number(numericScore),
          letter_grade: letterGrade || previewGrade.letter,
          grade_points: previewGrade.points,
        });
      } else {
        return api.recordGrade({
          enrollment_id: activeEnrollment!.id,
          numeric_score: Number(numericScore),
          letter_grade: letterGrade || previewGrade.letter,
          grade_points: previewGrade.points,
          counts_in_gpa: countsInGpa,
        });
      }
    },
    onSuccess: (data) => {
      toast.success(
        'Grade Recorded',
        `Awarded grade ${data.letter_grade} (${data.numeric_score}%) successfully.`
      );
      setActiveEnrollment(null);
      setNumericScore('');
      setLetterGrade('');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
    onError: (err: any) => {
      toast.error('Grade Submission Failed', err.message);
    },
  });

  const handleOpenGradeModal = (enr: Enrollment) => {
    setActiveEnrollment(enr);
    if (enr.grade) {
      setNumericScore(enr.grade.numeric_score.toString());
      setLetterGrade(enr.grade.letter_grade);
      setCountsInGpa(enr.grade.counts_in_gpa);
    } else {
      setNumericScore('85');
      setLetterGrade('');
      setCountsInGpa(true);
    }
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnrollment) return;
    gradeMutation.mutate({});
  };

  const filteredEnrollments = enrollments?.filter((enr) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      enr.student_name?.toLowerCase().includes(s) ||
      enr.registration_id?.toLowerCase().includes(s) ||
      enr.course_code?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Grade Management</h2>
        <p className="text-xs text-slate-500 mt-1">
          Input and verify student assessment scores under the institutional grading scale.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={selectedTermId || ''}
            onChange={(e) => setSelectedTermId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="">All Academic Terms</option>
            {terms?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="">All Courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrollments & Grades Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Academic Term</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Numeric Score</th>
                <th className="py-3 px-4">Letter Grade</th>
                <th className="py-3 px-4">Grade Points</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Loading student enrollments...
                  </td>
                </tr>
              ) : filteredEnrollments?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No enrollments found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEnrollments?.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{enr.student_name}</p>
                        <p className="font-mono text-xs text-blue-600">{enr.registration_id}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                          {enr.course_code}
                        </span>
                        <span className="text-xs text-slate-600">{enr.course_title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{enr.term_code}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{enr.credits} hrs</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {enr.grade ? `${enr.grade.numeric_score}%` : <span className="text-amber-600 font-normal">Pending</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {enr.grade ? (
                        <span
                          className={`inline-block font-bold text-sm px-2 py-0.5 rounded ${
                            enr.grade.is_passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {enr.grade.letter_grade}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {enr.grade ? Number(enr.grade.grade_points).toFixed(1) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenGradeModal(enr)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        {enr.grade ? 'Edit Grade' : 'Assign Grade'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Grade Modal */}
      <Modal
        isOpen={activeEnrollment !== null}
        onClose={() => setActiveEnrollment(null)}
        title={activeEnrollment?.grade ? 'Update Student Grade' : 'Assign Assessment Grade'}
        description={`For ${activeEnrollment?.student_name} (${activeEnrollment?.registration_id}) in ${activeEnrollment?.course_code}.`}
      >
        <form onSubmit={handleSubmitGrade} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numeric Assessment Score (0.00 to 100.00%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              required
              value={numericScore}
              onChange={(e) => setNumericScore(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Real-time policy translation preview */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-900">Grading Policy Translation:</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Scale: {policy?.name} (Min Pass: {policy?.pass_min_points} pts)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-blue-900">{previewGrade.letter}</span>
              <p className="text-[11px] font-semibold text-blue-600">
                {previewGrade.points.toFixed(1)} Grade Points
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="counts_in_gpa"
              checked={countsInGpa}
              onChange={(e) => setCountsInGpa(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="counts_in_gpa" className="text-xs font-semibold text-slate-700">
              Count in Cumulative & Semester GPA calculation
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveEnrollment(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
            >
              {gradeMutation.isPending ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
