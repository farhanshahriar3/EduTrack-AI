import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  PlusCircle,
  FileSpreadsheet,
  Award,
  BookOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  // Load analytics overview
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsOverview'],
    queryFn: () => api.getAnalyticsOverview(),
    enabled: !isStudent,
  });

  // Load student directory sample
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['dashboardStudents'],
    queryFn: () => api.getStudents({ page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
  });

  // If student role, load their own profile
  const { data: studentSelf, isLoading: studentSelfLoading } = useQuery({
    queryKey: ['studentSelf', user?.student_id],
    queryFn: () => (user?.student_id ? api.getStudentById(user.student_id) : null),
    enabled: isStudent && !!user?.student_id,
  });

  const currentTerm = analytics?.semester_trends?.length
    ? analytics.semester_trends[analytics.semester_trends.length - 1].term_code
    : null;

  const BAR_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#6366f1', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 p-8 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
              <GraduationCap className="h-3.5 w-3.5" />
              {currentTerm ? `Current term: ${currentTerm}` : 'Current academic term'}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {user?.full_name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isStudent
                ? 'Review your current course enrollments, cumulative GPA, and term-by-term academic progress.'
                : 'Monitor real-time institutional metrics, student performance distributions, and ML-assisted support flags.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                to="/students/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                Add Student
              </Link>
            )}
            {(isAdmin || isTeacher) && (
              <Link
                to="/grades"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Award className="h-4 w-4 text-amber-400" />
                Record Grades
              </Link>
            )}
            <Link
              to="/ml-insights"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-all"
            >
              <BrainCircuit className="h-4 w-4 text-sky-400" />
              Support Insights
            </Link>
          </div>
        </div>
      </div>

      {/* Student View Specific Portal */}
      {isStudent && studentSelf && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Cumulative GPA"
              value={Number(studentSelf.cumulative_gpa).toFixed(2)}
              subtitle="Current grading policy"
              icon={Award}
              colorScheme="blue"
            />
            <StatCard
              title="Completed Credits"
              value={`${studentSelf.completed_credits} hrs`}
              subtitle={`Semester ${studentSelf.current_semester} standing`}
              icon={BookOpen}
              colorScheme="indigo"
            />
            <StatCard
              title="Academic Status"
              value={studentSelf.academic_status}
              subtitle={studentSelf.academic_status === 'PROBATION' ? 'Advisor Review Required' : 'Good Academic Standing'}
              icon={GraduationCap}
              colorScheme={studentSelf.academic_status === 'PROBATION' ? 'amber' : 'emerald'}
            />
            <StatCard
              title="Department"
              value={studentSelf.department_code || 'CS'}
              subtitle={studentSelf.department_name || 'Engineering'}
              icon={Building2}
              colorScheme="blue"
            />
          </div>

          {/* Enrolled Courses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900 mb-4">My Enrolled Courses & Grades</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3">Course Code</th>
                    <th className="pb-3">Course Title</th>
                    <th className="pb-3">Term</th>
                    <th className="pb-3">Credits</th>
                    <th className="pb-3">Letter Grade</th>
                    <th className="pb-3">Grade Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSelf.enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-blue-600">{enr.course_code}</td>
                      <td className="py-3 text-slate-700">{enr.course_title}</td>
                      <td className="py-3 text-slate-500">{enr.term_code}</td>
                      <td className="py-3 text-slate-600">{enr.credits}</td>
                      <td className="py-3 font-bold text-slate-900">{enr.grade?.letter_grade || 'In Progress'}</td>
                      <td className="py-3 text-slate-700">{enr.grade?.grade_points !== undefined ? enr.grade.grade_points : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin / Teacher Institutional Metrics */}
      {!isStudent && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Active Students"
              value={analytics?.overview.total_active_students ?? (analyticsLoading ? '...' : 0)}
              subtitle={`Total enrolled: ${analytics?.overview.total_students ?? 0}`}
              icon={Users}
              colorScheme="blue"
            />
            <StatCard
              title="Academic Departments"
              value={analytics?.overview.total_departments ?? (analyticsLoading ? '...' : 0)}
              subtitle={`${analytics?.overview.total_courses ?? 0} active courses`}
              icon={Building2}
              colorScheme="indigo"
            />
            <StatCard
              title="University Average GPA"
              value={analytics?.overview.average_gpa !== undefined ? Number(analytics.overview.average_gpa).toFixed(2) : '...'}
              subtitle="Weighted institutional average"
              icon={GraduationCap}
              colorScheme="emerald"
            />
            <StatCard
              title="Needing Support Review"
              value={analytics?.overview.students_needing_review ?? (analyticsLoading ? '...' : 0)}
              subtitle="GPA < 2.0 or Probation"
              icon={AlertTriangle}
              colorScheme="amber"
            />
          </div>

          {/* Visual Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GPA Distribution Chart */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">GPA Distribution</h3>
                  <p className="text-xs text-slate-500">Active student counts across cumulative GPA brackets</p>
                </div>
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  4.0 Scale
                </span>
              </div>
              <div className="h-64 w-full">
                {analytics?.gpa_distribution ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.gpa_distribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                        formatter={(value: any) => [`${value} students`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {analytics.gpa_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading chart...</div>
                )}
              </div>
            </div>

            {/* Semester-Over-Semester GPA Trends */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Semester Performance Trend</h3>
                  <p className="text-xs text-slate-500">Historical cohort GPA progression across terms</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="h-64 w-full">
                {analytics?.semester_trends ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.semester_trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="term_code" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 4.0]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                        formatter={(value: any) => [Number(value).toFixed(2), 'Term Avg GPA']}
                      />
                      <Line
                        type="monotone"
                        dataKey="average_gpa"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading chart...</div>
                )}
              </div>
            </div>
          </div>

          {/* Department Breakdown & Recent Students */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Performance */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-1">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Department Standings</h3>
              <p className="text-xs text-slate-500 mb-4">Student headcounts & departmental averages</p>
              <div className="space-y-4">
                {analytics?.department_performance?.map((dept) => (
                  <div key={dept.department_code} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{dept.department_name}</p>
                      <p className="text-[11px] text-slate-500">{dept.student_count} registered students</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {Number(dept.average_gpa).toFixed(2)} GPA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Students Table */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Recently Enrolled Students</h3>
                  <p className="text-xs text-slate-500">Latest active records in the university registry</p>
                </div>
                <Link
                  to="/students"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Directory <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3">Student ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentsData?.items?.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-semibold text-blue-600">
                          <Link to={`/students/${student.id}`} className="hover:underline">
                            {student.registration_id}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-800 font-medium">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="py-3 text-slate-500 text-xs">{student.department_name}</td>
                        <td className="py-3">
                          <StatusBadge status={student.academic_status} />
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {Number(student.cumulative_gpa).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
