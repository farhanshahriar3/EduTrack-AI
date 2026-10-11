import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Save, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['gradingPolicy'],
    queryFn: () => api.getGradingPolicy(),
  });

  const [policyName, setPolicyName] = useState('');
  const [passMinPoints, setPassMinPoints] = useState('2.00');
  const [probationThreshold, setProbationThreshold] = useState('2.00');

  useEffect(() => {
    if (policy) {
      setPolicyName(policy.name);
      setPassMinPoints(policy.pass_min_points.toString());
      setProbationThreshold(policy.probation_gpa_threshold.toString());
    }
  }, [policy]);

  const updatePolicyMutation = useMutation({
    mutationFn: (data: any) => api.updateGradingPolicy(data),
    onSuccess: (updated) => {
      toast.success('Grading Policy Updated', `Updated policy: ${updated.name}`);
      queryClient.invalidateQueries({ queryKey: ['gradingPolicy'] });
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    updatePolicyMutation.mutate({
      name: policyName,
      scale_config: policy.scale_config,
      pass_min_points: Number(passMinPoints),
      probation_gpa_threshold: Number(probationThreshold),
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading policy configurations...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Institutional Grading Policy</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure university grade point scale, passing standards, and automatic academic probation thresholds.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grading Scale Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Passing Points (Grade Point)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={!isAdmin}
                value={passMinPoints}
                onChange={(e) => setPassMinPoints(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:outline-hidden disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Grades below this threshold are marked unpassed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Probation Cumulative GPA Threshold
              </label>
              <input
                type="number"
                step="0.1"
                disabled={!isAdmin}
                value={probationThreshold}
                onChange={(e) => setProbationThreshold(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:outline-hidden disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Triggers PROBATION status if student GPA falls below.</p>
            </div>
          </div>

          {/* Scale Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Configured Grade Scale Mappings
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Letter Grade</th>
                    <th className="py-2.5 px-3">Minimum Score %</th>
                    <th className="py-2.5 px-3">Grade Points (Quality Points)</th>
                    <th className="py-2.5 px-3">Pass Credit Eligible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policy?.scale_config &&
                    Object.entries(policy.scale_config)
                      .sort((a: any, b: any) => b[1].min_score - a[1].min_score)
                      .map(([letter, details]: any) => (
                        <tr key={letter} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">{letter}</td>
                          <td className="py-2 px-3 text-slate-700">{details.min_score}%</td>
                          <td className="py-2 px-3 font-semibold text-blue-600">
                            {Number(details.points).toFixed(1)}
                          </td>
                          <td className="py-2 px-3">
                            {details.passed ? (
                              <span className="text-emerald-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">No (0 Credits)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={updatePolicyMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updatePolicyMutation.isPending ? 'Saving...' : 'Save Grading Policy'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
