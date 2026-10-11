import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, GraduationCap, Lock, Mail, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: departments } = useQuery({ queryKey: ['registrationDepartments'], queryFn: api.getDepartments });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.register({
        full_name: fullName,
        email,
        password,
        role,
        phone: phone || undefined,
        department_id: role === 'STUDENT' ? Number(departmentId) : undefined,
      });
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to create your account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-lg space-y-7 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600"><GraduationCap /></div>
          <div><h1 className="text-xl font-bold">Create portal account</h1><p className="text-xs text-slate-400">Join your university workspace</p></div>
        </div>
        {error && <div className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-medium text-slate-300">Account type<select value={role} onChange={(e) => setRole(e.target.value as 'STUDENT' | 'TEACHER')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white"><option value="STUDENT">Student</option><option value="TEACHER">Teacher / Faculty</option></select></label>
          <label className="block text-xs font-medium text-slate-300">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" /></label>
          <label className="block text-xs font-medium text-slate-300">University email<div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-white" /></div></label>
          {role === 'STUDENT' && <>
            <label className="block text-xs font-medium text-slate-300">Department<select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white"><option value="">Select your department</option>{(departments || []).map((department) => <option key={department.id} value={department.id}>{department.code} - {department.name}</option>)}</select></label>
            <label className="block text-xs font-medium text-slate-300">Phone (optional)<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" /></label>
          </>}
          <label className="block text-xs font-medium text-slate-300">Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" /></label>
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"><UserPlus className="h-4 w-4" />{submitting ? 'Creating account...' : 'Create account'}<ArrowRight className="h-4 w-4" /></button>
        </form>
        <p className="text-center text-sm text-slate-400">Already registered? <Link to="/login" className="font-semibold text-blue-400">Sign in</Link></p>
      </div>
    </div>
  );
};