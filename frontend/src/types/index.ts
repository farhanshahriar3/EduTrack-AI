export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type AcademicStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'GRADUATED' | 'WITHDRAWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  student_id?: number | null;
  student_profile?: {
    registration_id: string;
    phone?: string | null;
    department_id: number;
    department_name?: string | null;
    current_semester: number;
    academic_status: AcademicStatus;
  } | null;
  created_at?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  student_count?: number;
  course_count?: number;
  created_at?: string;
}

export interface AcademicTerm {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  department_id: number;
  department_name?: string;
  credits: number;
  instructor_id?: number | null;
  instructor_name?: string | null;
  description?: string;
}

export interface Grade {
  id: number;
  enrollment_id: number;
  letter_grade: string;
  numeric_score: number;
  grade_points: number;
  is_passed: boolean;
  counts_in_gpa: boolean;
  graded_by_user_id?: number;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  term_id: number;
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED' | 'WITHDRAWN';
  course_code?: string;
  course_title?: string;
  credits?: number;
  term_code?: string;
  student_name?: string;
  registration_id?: string;
  grade?: Grade | null;
}

export interface Student {
  id: number;
  user_id?: number | null;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department_id: number;
  department_name?: string;
  department_code?: string;
  enrollment_date: string;
  current_semester: number;
  academic_status: AcademicStatus;
  cumulative_gpa: number;
  completed_credits: number;
  is_archived: boolean;
  created_at?: string;
}

export interface SemesterSummary {
  term_code: string;
  term_name: string;
  term_gpa: number;
  term_credits: number;
  courses_count: number;
}

export interface ContributingFactor {
  factor: string;
  value: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  description: string;
}

export interface AcademicSupportInsight {
  id: number;
  student_id: number;
  student_name?: string;
  registration_id?: string;
  department_name?: string;
  risk_level: RiskLevel;
  risk_score: number;
  model_version: string;
  contributing_factors: ContributingFactor[];
  disclaimer: string;
  calculated_at: string;
}

export interface StudentDetail extends Student {
  enrollments: Enrollment[];
  semester_history: SemesterSummary[];
  academic_support_summary?: AcademicSupportInsight | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalyticsOverview {
  total_students: number;
  total_active_students: number;
  total_departments: number;
  average_gpa: number;
  students_needing_review: number;
  total_courses: number;
  total_enrollments: number;
}

export interface GpaDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface DepartmentPerformanceItem {
  department_name: string;
  department_code: string;
  student_count: number;
  average_gpa: number;
}

export interface SemesterTrendItem {
  term_code: string;
  term_name: string;
  average_gpa: number;
  enrollments_count: number;
}

export interface GradeDistributionItem {
  letter_grade: string;
  count: number;
  percentage: number;
}

export interface FullAnalyticsReport {
  overview: AnalyticsOverview;
  gpa_distribution: GpaDistributionItem[];
  department_performance: DepartmentPerformanceItem[];
  semester_trends: SemesterTrendItem[];
  grade_distribution: GradeDistributionItem[];
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: any;
  ip_address?: string | null;
  created_at: string;
}

export interface GradingPolicy {
  id: number;
  name: string;
  is_active: boolean;
  scale_config: Record<string, { min_score: number; points: number; passed: boolean }>;
  pass_min_points: number;
  probation_gpa_threshold: number;
}
