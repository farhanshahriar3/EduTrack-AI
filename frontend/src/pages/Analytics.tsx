import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Building2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';

export const Analytics: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['fullAnalyticsReport'],
    queryFn: () => api.getAnalyticsOverview(),
  });

  const BAR_COLORS = ['#3b82f6', '#2563eb', '#1d4ed8', '#10b981', '#059669', '#f59e0b', '#d97706', '#ef4444'];

  if (isLoading) {
    return <div className="py-16 text-center text-xs text-slate-400">Loading university academic analytics...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Analytics & Insights</h2>
        <p className="text-xs text-slate-500 mt-1">
          Institutional analytics, grade distributions, department comparisons, and longitudinal student cohort trends.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Institutional Average GPA"
          value={analytics?.overview.average_gpa !== undefined ? Number(analytics.overview.average_gpa).toFixed(2) : '-'}
          subtitle="All active curriculum students"
          icon={Award}
          colorScheme="blue"
        />
        <StatCard
          title="Total Enrollments"
          value={analytics?.overview.total_enrollments ?? 0}
          subtitle="Course registrations across terms"
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          title="Departments Active"
          value={analytics?.overview.total_departments ?? 0}
          subtitle={`${analytics?.overview.total_courses ?? 0} curriculum courses`}
          icon={Building2}
          colorScheme="emerald"
        />
        <StatCard
          title="Academic Review Alerts"
          value={analytics?.overview.students_needing_review ?? 0}
          subtitle="Students below 2.0 GPA or on probation"
          icon={BarChart3}
          colorScheme="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letter Grade Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grade Distribution (Letter Scale)</h3>
              <p className="text-xs text-slate-500">Frequency of letter grades awarded across all courses</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live DB Data</span>
          </div>
          <div className="h-64 w-full">
            {analytics?.grade_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.grade_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="letter_grade" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                    formatter={(val: any, name: any, item: any) => [`${val} grades (${item.payload.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {analytics.grade_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* GPA Histogram */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">GPA Bracket Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution of cumulative GPAs across 5 standard brackets</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">4.0 Scale</span>
          </div>
          <div className="h-64 w-full">
            {analytics?.gpa_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.gpa_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                    formatter={(val: any, name: any, item: any) => [`${val} students (${item.payload.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Department Standings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Departmental Academic Performance</h3>
        <p className="text-xs text-slate-500 mb-4">Comparative breakdown of enrollment size and grade point averages</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Department Code</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Active Student Count</th>
                <th className="py-3 px-4">Cohort Average GPA</th>
                <th className="py-3 px-4">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.department_performance?.map((dept) => {
                const avgGpa = Number(dept.average_gpa);
                return (
                  <tr key={dept.department_code} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{dept.department_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{dept.department_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{dept.student_count} Students</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{avgGpa.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          avgGpa >= 3.5
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : avgGpa >= 2.5
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {avgGpa >= 3.5 ? 'High Honors Standing' : avgGpa >= 2.5 ? 'Standard Progress' : 'Review Advised'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
