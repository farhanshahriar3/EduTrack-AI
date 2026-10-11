import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Calendar, Plus, Building2, User, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const CoursesList: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'courses' | 'terms'>('courses');
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // New Course Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDeptId, setCourseDeptId] = useState<number>(1);
  const [courseCredits, setCourseCredits] = useState('3.0');
  const [courseDesc, setCourseDesc] = useState('');

  // New Term Form State
  const [termCode, setTermCode] = useState('');
  const [termName, setTermName] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [termIsCurrent, setTermIsCurrent] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', selectedDeptId],
    queryFn: () => api.getCourses(selectedDeptId),
  });

  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.getTerms(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => api.createCourse(data),
    onSuccess: (newCourse) => {
      toast.success('Course Created', `Course ${newCourse.code} created successfully.`);
      setIsCourseModalOpen(false);
      setCourseCode('');
      setCourseTitle('');
      setCourseDesc('');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      toast.error('Failed to create course', err.message);
    },
  });

  const createTermMutation = useMutation({
    mutationFn: (data: any) => api.createTerm(data),
    onSuccess: (newTerm) => {
      toast.success('Term Created', `Academic term ${newTerm.code} created.`);
      setIsTermModalOpen(false);
      setTermCode('');
      setTermName('');
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (err: any) => {
      toast.error('Failed to create term', err.message);
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate({
      code: courseCode,
      title: courseTitle,
      department_id: courseDeptId,
      credits: Number(courseCredits),
      description: courseDesc,
    });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    createTermMutation.mutate({
      code: termCode,
      name: termName,
      start_date: termStart,
      end_date: termEnd,
      is_current: termIsCurrent,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Courses & Academic Terms
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage course catalog, assigned credit weightings, and university academic calendars.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTermModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Add Term
            </button>
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Course Catalog ({courses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'terms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Academic Terms ({terms?.length || 0})
        </button>
      </div>

      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Department Filter */}
          <div className="flex items-center gap-3">
            <select
              value={selectedDeptId || ''}
              onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coursesLoading ? (
              <p className="text-xs text-slate-400 py-6">Loading course catalog...</p>
            ) : (
              courses?.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {course.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {course.credits} Credits
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h4>
                    {course.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {course.department_name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {course.instructor_name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Term Code</th>
                <th className="py-3 px-4">Term Name</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms?.map((term) => (
                <tr key={term.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{term.code}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{term.name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{term.start_date}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{term.end_date}</td>
                  <td className="py-3.5 px-4">
                    {term.is_current ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active Term
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Past Term</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Add New Course"
        description="Define a new curriculum course offering."
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CS401"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="8.0"
                required
                value={courseCredits}
                onChange={(e) => setCourseCredits(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Cloud Architectures"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={courseDeptId}
              onChange={(e) => setCourseDeptId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
            >
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              placeholder="Course description and prerequisites..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCourseMutation.isPending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
            >
              {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Term Modal */}
      <Modal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        title="Create Academic Term"
        description="Define a new academic semester term."
      >
        <form onSubmit={handleCreateTerm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term Code</label>
              <input
                type="text"
                required
                placeholder="FALL-2026"
                value={termCode}
                onChange={(e) => setTermCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name</label>
              <input
                type="text"
                required
                placeholder="Fall Semester 2026"
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={termStart}
                onChange={(e) => setTermStart(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={termEnd}
                onChange={(e) => setTermEnd(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="term_current"
              checked={termIsCurrent}
              onChange={(e) => setTermIsCurrent(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="term_current" className="text-xs font-semibold text-slate-700">
              Set as current active semester
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTermModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTermMutation.isPending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
            >
              {createTermMutation.isPending ? 'Saving...' : 'Create Term'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
