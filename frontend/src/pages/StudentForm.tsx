import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

const studentSchema = z.object({
  registration_id: z.string().min(3, 'Registration ID must be at least 3 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department_id: z.coerce.number().min(1, 'Please select a department'),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
  current_semester: z.coerce.number().min(1).max(12),
  academic_status: z.enum(['ACTIVE', 'PROBATION', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN']),
  create_user_account: z.boolean().optional(),
  password: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const StudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const { data: existingStudent, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => (id ? api.getStudentById(Number(id)) : null),
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      registration_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: 1,
      enrollment_date: new Date().toISOString().split('T')[0],
      current_semester: 1,
      academic_status: 'ACTIVE',
      create_user_account: true,
      password: '',
    },
  });

  const createAccountChecked = watch('create_user_account');

  useEffect(() => {
    if (existingStudent) {
      reset({
        registration_id: existingStudent.registration_id,
        first_name: existingStudent.first_name,
        last_name: existingStudent.last_name,
        email: existingStudent.email,
        phone: existingStudent.phone || '',
        department_id: existingStudent.department_id,
        enrollment_date: existingStudent.enrollment_date,
        current_semester: existingStudent.current_semester,
        academic_status: existingStudent.academic_status,
        create_user_account: false,
      });
    }
  }, [existingStudent, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      if (isEditMode && id) {
        return api.updateStudent(Number(id), values);
      }
      return api.createStudent(values);
    },
    onSuccess: (data) => {
      toast.success(
        isEditMode ? 'Student Updated' : 'Student Registered',
        `Successfully saved record for ${data.first_name} ${data.last_name}.`
      );
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      navigate(isEditMode ? `/students/${id}` : '/students');
    },
    onError: (err: any) => {
      toast.error('Submission Failed', err.message);
    },
  });

  const onSubmit = (data: StudentFormValues) => {
    saveMutation.mutate(data);
  };

  if (isEditMode && isStudentLoading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading student information...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/students"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEditMode ? 'Edit Student Record' : 'Register New Student'}
          </h2>
          <p className="text-xs text-slate-500">
            {isEditMode
              ? `Updating academic dossier for ${existingStudent?.registration_id}`
              : 'Add a new verified student profile to the institutional database.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Registration ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Registration ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. STU-2026-042"
                {...register('registration_id')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.registration_id && (
                <p className="mt-1 text-xs text-rose-500">{errors.registration_id.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('department_id')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              >
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-xs text-rose-500">{errors.department_id.message}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                {...register('first_name')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-rose-500">{errors.first_name.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                {...register('last_name')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-rose-500">{errors.last_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="student@edutrack.edu"
                {...register('email')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+1-555-0199"
                {...register('phone')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Enrollment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('enrollment_date')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.enrollment_date && (
                <p className="mt-1 text-xs text-rose-500">{errors.enrollment_date.message}</p>
              )}
            </div>

            {/* Current Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Semester <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={12}
                {...register('current_semester')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
              {errors.current_semester && (
                <p className="mt-1 text-xs text-rose-500">{errors.current_semester.message}</p>
              )}
            </div>

            {/* Academic Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Status <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('academic_status')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Optional User Account Provisioning for new student */}
          {!isEditMode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create_user_account"
                  {...register('create_user_account')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="create_user_account" className="text-xs font-semibold text-slate-700">
                  Provision Student Portal Login Account
                </label>
              </div>

              {createAccountChecked && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Initial Password (Default: Student@2026)
                  </label>
                  <input
                    type="text"
                    placeholder="Student@2026"
                    {...register('password')}
                    className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/students"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting || saveMutation.isPending ? 'Saving...' : isEditMode ? 'Update Record' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
