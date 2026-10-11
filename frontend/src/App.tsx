import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { CoursesList } from './pages/CoursesList';
import { Dashboard } from './pages/Dashboard';
import { GradesManagement } from './pages/GradesManagement';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MLInsights } from './pages/MLInsights';
import { Profile } from './pages/Profile';
import { SettingsPage } from './pages/SettingsPage';
import { StudentDetail } from './pages/StudentDetail';
import { StudentForm } from './pages/StudentForm';
import { StudentsList } from './pages/StudentsList';
import { UsersList } from './pages/UsersList';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading EduTrack...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RoleRoute: React.FC<{ roles: string[] }> = ({ roles }) => {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route path="students/new" element={<StudentForm />} />
          <Route path="students/:id/edit" element={<StudentForm />} />
          <Route path="users" element={<UsersList />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
        <Route path="courses" element={<CoursesList />} />
        <Route element={<RoleRoute roles={['ADMIN', 'TEACHER']} />}>
          <Route path="grades" element={<GradesManagement />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="ml-insights" element={<MLInsights />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;