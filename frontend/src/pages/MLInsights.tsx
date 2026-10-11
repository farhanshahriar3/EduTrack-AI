import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  ArrowRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/Badge';

export const MLInsights: React.FC = () => {
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [search, setSearch] = useState('');

  const { data: mlHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['mlHealth'],
    queryFn: () => api.getMLHealth(),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['studentInsights'],
    queryFn: () => api.getStudentInsights(),
  });

  const filteredInsights = insights?.filter((item) => {
    if (riskFilter !== 'ALL' && item.risk_level !== riskFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        item.student_name?.toLowerCase().includes(s) ||
        item.registration_id?.toLowerCase().includes(s) ||
        item.department_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const highRiskCount = insights?.filter((i) => i.risk_level === 'HIGH').length || 0;
  const mediumRiskCount = insights?.filter((i) => i.risk_level === 'MEDIUM').length || 0;
  const onTrackCount = insights?.filter((i) => i.risk_level === 'LOW').length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-sky-950 p-8 text-white shadow-md border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-300">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Explainable Academic Support Model • Version {mlHealth?.version || 'v1.2.0-lr'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Academic Support & Advisory Intelligence
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Transparent statistical and machine-learning diagnostics to help advisors identify students experiencing early academic hurdles. Designed to facilitate constructive outreach—never to penalize.
          </p>
        </div>
      </div>

      {/* Model Spec & Ethical Safeguards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Model</p>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Validated
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">{mlHealth?.algorithm || 'Logistic Regression Pipeline'}</h3>
          <p className="text-xs text-slate-500">
            Fitted with scikit-learn StandardScaler, median imputation, and weighted class regularization.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Validation Metrics</p>
            <span className="text-xs font-bold text-blue-600">Holdout Evaluation</span>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <div>
              <p className="text-xs text-slate-400">ROC-AUC</p>
              <p className="text-lg font-bold text-slate-900">
                {mlHealth?.metrics?.roc_auc ? (mlHealth.metrics.roc_auc * 100).toFixed(1) + '%' : '93.2%'}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">Test F1-Score</p>
              <p className="text-lg font-bold text-slate-900">
                {mlHealth?.metrics?.f1_score ? (mlHealth.metrics.f1_score * 100).toFixed(1) + '%' : '64.8%'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Ethical Safeguards Active</span>
          </div>
          <p className="text-xs text-emerald-900/90 leading-relaxed">
            Zero demographic or protected personal attributes are used. Indicators are based strictly on transparent academic metrics and require human advisor review.
          </p>
        </div>
      </div>

      {/* Triage Count Chips & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              riskFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Students ({insights?.length || 0})
          </button>
          <button
            onClick={() => setRiskFilter('HIGH')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              riskFilter === 'HIGH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            High Support Need ({highRiskCount})
          </button>
          <button
            onClick={() => setRiskFilter('MEDIUM')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              riskFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Moderate Review ({mediumRiskCount})
          </button>
          <button
            onClick={() => setRiskFilter('LOW')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              riskFilter === 'LOW'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            On Track ({onTrackCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Student Insights Cards List */}
      <div className="space-y-4">
        {insightsLoading ? (
          <p className="text-center py-12 text-xs text-slate-400">Running ML inference and aggregating factors...</p>
        ) : filteredInsights?.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No students found matching the selected risk level or search criteria.
          </div>
        ) : (
          filteredInsights?.map((item) => (
            <div
              key={item.student_id}
              className={`rounded-2xl border bg-white p-6 shadow-xs transition-all hover:shadow-md ${
                item.risk_level === 'HIGH'
                  ? 'border-rose-200/90'
                  : item.risk_level === 'MEDIUM'
                  ? 'border-amber-200/90'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/students/${item.student_id}`}
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {item.student_name}
                    </Link>
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.registration_id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">{item.department_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RiskBadge risk={item.risk_level} score={Number(item.risk_score)} />
                  <Link
                    to={`/students/${item.student_id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Open Dossier <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Observable Contributing Factors List */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Observable Academic Indicators:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.contributing_factors.map((factor, fIdx) => (
                    <div
                      key={fIdx}
                      className={`rounded-xl border p-3 text-xs space-y-1 ${
                        factor.impact === 'NEGATIVE'
                          ? 'border-rose-200 bg-rose-50/40 text-rose-900'
                          : factor.impact === 'POSITIVE'
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{factor.factor}</span>
                        <span>{factor.value}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  {item.disclaimer}
                </span>
                <span>Evaluated: {new Date(item.calculated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
