import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Shield, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, pageSize, actionFilter],
    queryFn: () => api.getAuditLogs(page, pageSize, actionFilter || undefined),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Security Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable administrative audit trail tracking user authentication, student modifications, and CSV exports.
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 shadow-xs focus:outline-hidden"
        >
          <option value="">All Audit Actions</option>
          <option value="USER_LOGIN">User Logins</option>
          <option value="STUDENT_CREATE">Student Creations</option>
          <option value="STUDENT_UPDATE">Student Updates</option>
          <option value="STUDENT_ARCHIVE">Student Archivals</option>
          <option value="GRADE_RECORD">Grade Records</option>
          <option value="CSV_IMPORT_CONFIRM">CSV Imports</option>
          <option value="CSV_EXPORT">CSV Exports</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Details / Metadata</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    No audit events recorded for the selected filter.
                  </td>
                </tr>
              ) : (
                data?.items?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {log.user_email || 'System / Automated'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-xs text-slate-500">
            Total recorded events: {data?.total || 0}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {data?.page || 1} of {data?.total_pages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.total_pages}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
