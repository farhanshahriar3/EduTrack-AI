import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.student_profile?.phone || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setPhone(user?.student_profile?.phone || '');
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () => api.updateCurrentUser({ full_name: fullName, email, phone: user?.role === 'STUDENT' ? phone : undefined, password: password || undefined }),
    onSuccess: async () => { setPassword(''); await refreshUser(); toast.success('Profile updated', 'Your portal information has been saved.'); },
    onError: (error: any) => toast.error('Profile update failed', error.message),
  });

  return <div className="max-w-3xl space-y-6">
    <div><h2 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h2><p className="mt-1 text-xs text-slate-500">Manage the personal information used across your university portal.</p></div>
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white"><UserCircle className="h-12 w-12 text-blue-300" /><p className="mt-4 font-semibold">{user?.full_name}</p><p className="text-xs text-slate-400">{user?.role}</p><div className="mt-6 flex gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4" /> Active account</div></div>
      <form onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-xs font-semibold text-slate-700">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
        <label className="block text-xs font-semibold text-slate-700">Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
        {user?.role === 'STUDENT' && <label className="block text-xs font-semibold text-slate-700">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>}
        <label className="block text-xs font-semibold text-slate-700">New password (optional)<input minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep your password" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
        {user?.student_profile && <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs"><div><span className="text-slate-500">Registration ID</span><p className="mt-1 font-semibold">{user.student_profile.registration_id}</p></div><div><span className="text-slate-500">Department</span><p className="mt-1 font-semibold">{user.student_profile.department_name}</p></div><div><span className="text-slate-500">Semester</span><p className="mt-1 font-semibold">{user.student_profile.current_semester}</p></div><div><span className="text-slate-500">Academic status</span><p className="mt-1 font-semibold">{user.student_profile.academic_status}</p></div></div>}
        <div className="flex justify-end border-t border-slate-100 pt-4"><button disabled={updateMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"><Save className="h-4 w-4" />{updateMutation.isPending ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </div>
  </div>;
};