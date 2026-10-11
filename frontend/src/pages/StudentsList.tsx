import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const StudentsList: React.FC = () => {
  const { isAdmin, isTeacher } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch Departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  // Fetch Students Query
  const { data, isLoading } = useQuery({
    queryKey: [
      'students',
      page,
      pageSize,
      search,
      departmentId,
      semester,
      status,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      api.getStudents({
        page,
        page_size: pageSize,
        search: search || undefined,
        department_id: departmentId,
        semester: semester,
        academic_status: status || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  // Delete/Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.archiveStudent(id),
    onSuccess: () => {
      toast.success('Student Archived', 'Student record has been successfully archived.');
      setDeleteStudentId(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toast.error('Archive Failed', err.message);
    },
  });

  // CSV Import Preview Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setIsImporting(true);
      try {
        const preview = await api.previewCsv(file);
        setPreviewData(preview);
      } catch (err: any) {
        toast.error('CSV Preview Error', err.message);
        setPreviewData(null);
      } finally {
        setIsImporting(false);
      }
    }
  };

  // CSV Import Confirmation Handler
  const handleConfirmImport = async () => {
    if (!previewData || !previewData.valid_records || previewData.valid_records.length === 0) return;
    setIsImporting(true);
    try {
      const res = await api.confirmCsvImport(previewData.valid_records);
      toast.success('Import Successful', res.message);
      setIsImportModalOpen(false);
      setImportFile(null);
      setPreviewData(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      toast.error('Import Failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle Sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, manage student registrations, and view academic histories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(isAdmin || isTeacher) && (
            <a
              href={api.getExportStudentsUrl({
                search: search || undefined,
                department_id: departmentId,
                semester: semester,
                academic_status: status || undefined,
              })}
              download="edutrack_students.csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export CSV
            </a>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Import CSV
              </button>

              <Link
                to="/students/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={departmentId || ''}
            onChange={(e) => {
              setDepartmentId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <select
            value={semester || ''}
            onChange={(e) => {
              setSemester(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="GRADUATED">Graduated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Student Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('registration_id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Registration ID <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Full Name <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Semester</th>
                <th
                  onClick={() => handleSort('cumulative_gpa')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Cumulative GPA <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Credits</th>
                <th className="py-3.5 px-4">Academic Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No students match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                data?.items?.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      <Link to={`/students/${student.id}`} className="hover:underline">
                        {student.registration_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {student.department_name} ({student.department_code})
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      Sem {student.current_semester}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {Number(student.cumulative_gpa).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {student.completed_credits} hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={student.academic_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/students/${student.id}`}
                          title="View Profile Dossier"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteStudentId(student.id)}
                            title="Archive Student"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-4 py-3 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {data?.total || 0} students</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {data?.page || 1} of {data?.total_pages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.total_pages}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Archiving Student */}
      <Modal
        isOpen={deleteStudentId !== null}
        onClose={() => setDeleteStudentId(null)}
        title="Confirm Student Archival"
        description="Are you sure you want to archive this student record? The student will be marked as Withdrawn and deactivated."
      >
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setDeleteStudentId(null)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteStudentId && archiveMutation.mutate(deleteStudentId)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm"
          >
            Archive Student
          </button>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setPreviewData(null);
        }}
        title="Import Students from CSV"
        description="Upload a CSV spreadsheet with registration_id, first_name, last_name, email, department_code, enrollment_date, current_semester, academic_status."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">
                {importFile ? importFile.name : 'Click to select CSV file'}
              </p>
              <p className="text-xs text-slate-400">Strict schema validation & formula injection defenses</p>
            </label>
          </div>

          {/* Import Summary & Preview */}
          {previewData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <span className="font-semibold text-slate-700">
                  Total Rows: {previewData.total_rows}
                </span>
                <span className="font-semibold text-emerald-600">
                  Valid Rows: {previewData.valid_count}
                </span>
                <span className="font-semibold text-rose-600">
                  Error Rows: {previewData.error_count}
                </span>
              </div>

              {previewData.errors?.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1.5 text-xs text-rose-800">
                  <p className="font-bold">Validation Issues Found:</p>
                  {previewData.errors.map((err: any, idx: number) => (
                    <div key={idx}>
                      Row {err.row} ({err.registration_id}): {err.errors.join(', ')}
                    </div>
                  ))}
                </div>
              )}

              {previewData.valid_count > 0 && (
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportFile(null);
                      setPreviewData(null);
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : `Confirm Import (${previewData.valid_count} Records)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
