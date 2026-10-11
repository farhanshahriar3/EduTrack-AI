import {
  Student,
  StudentDetail,
  PaginatedResponse,
  Department,
  AcademicTerm,
  Course,
  Enrollment,
  Grade,
  FullAnalyticsReport,
  AcademicSupportInsight,
  User,
  AuditLog,
  GradingPolicy
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('edutrack_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    let errorData = null;
    try {
      errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = response.statusText || `HTTP ${response.status}`;
    }

    if (response.status === 401) {
      // Clear token on authentication failure
      localStorage.removeItem('edutrack_token');
      localStorage.removeItem('edutrack_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data: {
    email: string;
    full_name: string;
    password: string;
    role: 'TEACHER' | 'STUDENT';
    department_id?: number;
    phone?: string;
    current_semester?: number;
  }) => {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCurrentUser: async () => {
    return request<User>('/auth/me');
  },

  updateCurrentUser: async (data: { email?: string; full_name?: string; password?: string; phone?: string }) => {
    return request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('edutrack_token');
      localStorage.removeItem('edutrack_user');
    }
  },

  // Students
  getStudents: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    department_id?: number;
    semester?: number;
    academic_status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page.toString());
    if (params.page_size) q.set('page_size', params.page_size.toString());
    if (params.search) q.set('search', params.search);
    if (params.department_id) q.set('department_id', params.department_id.toString());
    if (params.semester) q.set('semester', params.semester.toString());
    if (params.academic_status) q.set('academic_status', params.academic_status);
    if (params.sort_by) q.set('sort_by', params.sort_by);
    if (params.sort_order) q.set('sort_order', params.sort_order);

    return request<PaginatedResponse<Student>>(`/students?${q.toString()}`);
  },

  getStudentById: async (id: number) => {
    return request<StudentDetail>(`/students/${id}`);
  },

  createStudent: async (data: Partial<Student> & { create_user_account?: boolean; password?: string }) => {
    return request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStudent: async (id: number, data: Partial<Student>) => {
    return request<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  archiveStudent: async (id: number) => {
    return request<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Departments, Terms & Courses
  getDepartments: async () => {
    return request<Department[]>('/departments');
  },

  createDepartment: async (data: { code: string; name: string; description?: string }) => {
    return request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTerms: async () => {
    return request<AcademicTerm[]>('/terms');
  },

  createTerm: async (data: { code: string; name: string; start_date: string; end_date: string; is_current: boolean }) => {
    return request<AcademicTerm>('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCourses: async (department_id?: number) => {
    const q = department_id ? `?department_id=${department_id}` : '';
    return request<Course[]>(`/courses${q}`);
  },

  createCourse: async (data: { code: string; title: string; department_id: number; credits: number; description?: string }) => {
    return request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEnrollments: async (params: { student_id?: number; term_id?: number; course_id?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.student_id) q.set('student_id', params.student_id.toString());
    if (params.term_id) q.set('term_id', params.term_id.toString());
    if (params.course_id) q.set('course_id', params.course_id.toString());
    return request<Enrollment[]>(`/enrollments?${q.toString()}`);
  },

  createEnrollment: async (data: { student_id: number; course_id: number; term_id: number; status?: string }) => {
    return request<Enrollment>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Grades
  recordGrade: async (data: { enrollment_id: number; numeric_score: number; letter_grade?: string; grade_points?: number; counts_in_gpa?: boolean }) => {
    return request<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateGrade: async (grade_id: number, data: { numeric_score?: number; letter_grade?: string; grade_points?: number }) => {
    return request<Grade>(`/grades/${grade_id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getAnalyticsOverview: async () => {
    return request<FullAnalyticsReport>('/analytics/overview');
  },

  // Machine Learning & Support
  getMLHealth: async () => {
    return request<any>('/ml/health');
  },

  getStudentInsights: async () => {
    return request<AcademicSupportInsight[]>('/ml/student-insights');
  },

  getSingleStudentInsight: async (studentId: number) => {
    return request<AcademicSupportInsight>(`/ml/student-insights/${studentId}`);
  },

  // CSV
  previewCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/imports/preview', {
      method: 'POST',
      body: formData,
    });
  },

  confirmCsvImport: async (records: any[]) => {
    return request<any>('/imports/confirm', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  getExportStudentsUrl: (filters: { search?: string; department_id?: number; semester?: number; academic_status?: string } = {}) => {
    const q = new URLSearchParams();
    if (filters.search) q.set('search', filters.search);
    if (filters.department_id) q.set('department_id', filters.department_id.toString());
    if (filters.semester) q.set('semester', filters.semester.toString());
    if (filters.academic_status) q.set('academic_status', filters.academic_status);
    return `${API_BASE}/exports/students?${q.toString()}`;
  },

  // Users
  getUsers: async (role?: string) => {
    const q = role ? `?role=${role}` : '';
    return request<User[]>(`/users${q}`);
  },

  createUser: async (data: { email: string; full_name: string; role: string; password: string }) => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (id: number, data: Partial<User> & { password?: string }) => {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Audit Logs
  getAuditLogs: async (page = 1, page_size = 20, action?: string) => {
    const q = new URLSearchParams({ page: page.toString(), page_size: page_size.toString() });
    if (action) q.set('action', action);
    return request<PaginatedResponse<AuditLog>>(`/audit-logs?${q.toString()}`);
  },

  // Settings & Policy
  getGradingPolicy: async () => {
    return request<GradingPolicy>('/settings/policy');
  },

  updateGradingPolicy: async (data: Partial<GradingPolicy>) => {
    return request<GradingPolicy>('/settings/policy', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
