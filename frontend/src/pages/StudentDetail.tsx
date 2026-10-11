import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  ArrowLeft,
  Edit,
  Award,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isTeacher } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [selectedTermId, setSelectedTermId] = useState<number | undefined>(undefined);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.getStudentById(Number(id)),
    enabled: !!id,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.getCourses(),
    enabled: isEnrollModalOpen,
  });

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.getTerms(),
    enabled: isEnrollModalOpen,
  });

  const enrollMutation = useMutation({
    mutationFn: (data: { student_id: number; course_id: number; term_id: number }) =>
      api.createEnrollment(data),
    onSuccess: () => {
      toast.success('Course Enrolled', 'Student enrolled in course successfully.');
      setIsEnrollModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
    onError: (err: any) => {
      toast.error('Enrollment Failed', err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-2">Loading student profile dossier...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <h3 className="text-lg font-bold text-slate-900">Student Record Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">The requested student dossier does not exist.</p>
        <Link
          to="/students"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Directory
        </Link>
      </div>
    );
  }

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedTermId) return;
    enrollMutation.mutate({
      student_id: student.id,
      course_id: selectedCourseId,
      term_id: selectedTermId,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Back & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/students"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 shadow-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {student.first_name} {student.last_name}
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 border border-slate-200">
                {student.registration_id}
              </span>
              <StatusBadge status={student.academic_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.department_name} • Semester {student.current_semester} standing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-slate-500" />
              Enroll in Course
            </button>
          )}

          {isAdmin && (
            <Link
              to={`/students/${student.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase">Email Address</p>
            <p className="text-xs font-semibold text-slate-800 truncate">{student.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase">Cumulative GPA</p>
            <p className="text-sm font-bold text-slate-900">{Number(student.cumulative_gpa).toFixed(2)} / 4.00</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase">Completed Credits</p>
            <p className="text-sm font-bold text-slate-900">{student.completed_credits} Credit Hours</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase">Enrollment Date</p>
            <p className="text-xs font-semibold text-slate-800">{student.enrollment_date}</p>
          </div>
        </div>
      </div>

      {/* Machine Learning Support Diagnostic Card (Faculty Only) */}
      {student.academic_support_summary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Academic Support Indicator
                  <span className="text-[11px] font-normal text-slate-400">
                    ({student.academic_support_summary.model_version})
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Automated statistical advisory indicator evaluated from recent term trajectory & completed credits.
                </p>
              </div>
            </div>

            <RiskBadge
              risk={student.academic_support_summary.risk_level}
              score={Number(student.academic_support_summary.risk_score)}
            />
          </div>

          {/* Observable Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {student.academic_support_summary.contributing_factors.map((f: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-xs space-y-1 ${
                  f.impact === 'NEGATIVE'
                    ? 'border-rose-200 bg-rose-50/50 text-rose-900'
                    : f.impact === 'POSITIVE'
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{f.factor}</span>
                  <span className="font-bold">{f.value}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              <strong>Advisory Safeguard:</strong> {student.academic_support_summary.disclaimer}
            </span>
          </div>
        </div>
      )}

      {/* Semester Progression Chart */}
      {student.semester_history?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Term-by-Term GPA Progression</h3>
              <p className="text-xs text-slate-500">Historical grade point averages across completed semesters</p>
            </div>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={student.semester_history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="term_code" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 4.0]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                  formatter={(val: any) => [Number(val).toFixed(2), 'Semester GPA']}
                />
                <Line
                  type="monotone"
                  dataKey="term_gpa"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Course Enrollments & Grades Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Academic Records & Course Grades</h3>
        <p className="text-xs text-slate-500 mb-4">
          Weighted quality points = Course Credits × Grade Points (Policy GPA: sum(points × credits) / sum(credits))
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3">Course Code</th>
                <th className="pb-3">Course Title</th>
                <th className="pb-3">Academic Term</th>
                <th className="pb-3">Credits</th>
                <th className="pb-3">Score (0-100)</th>
                <th className="pb-3">Letter Grade</th>
                <th className="pb-3">Grade Points</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.enrollments?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No course enrollments registered yet.
                  </td>
                </tr>
              ) : (
                student.enrollments?.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 font-bold text-blue-600">{enr.course_code}</td>
                    <td className="py-3.5 font-medium text-slate-800">{enr.course_title}</td>
                    <td className="py-3.5 text-xs text-slate-600">{enr.term_code}</td>
                    <td className="py-3.5 text-xs text-slate-700">{enr.credits} hrs</td>
                    <td className="py-3.5 font-semibold text-slate-900">
                      {enr.grade ? `${enr.grade.numeric_score}%` : 'Pending'}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {enr.grade ? enr.grade.letter_grade : '-'}
                    </td>
                    <td className="py-3.5 font-bold text-slate-800">
                      {enr.grade ? Number(enr.grade.grade_points).toFixed(1) : '-'}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          enr.grade?.is_passed
                            ? 'bg-emerald-50 text-emerald-700'
                            : enr.grade
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enr.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll in Course Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Student in Course"
        description="Select a registered course and target academic term."
      >
        <form onSubmit={handleEnrollSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course</label>
            <select
              required
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
            >
              <option value="">-- Choose Course --</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title} ({c.credits} Credits)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Academic Term</label>
            <select
              required
              value={selectedTermId || ''}
              onChange={(e) => setSelectedTermId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
            >
              <option value="">-- Choose Term --</option>
              {terms?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrollMutation.isPending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
