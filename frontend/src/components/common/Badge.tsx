import React from 'react';
import { AcademicStatus, RiskLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: AcademicStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </Badge>
      );
    case 'PROBATION':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Academic Probation
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Suspended
        </Badge>
      );
    case 'GRADUATED':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Graduated
        </Badge>
      );
    case 'WITHDRAWN':
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Withdrawn
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const RiskBadge: React.FC<{ risk: RiskLevel; score?: number }> = ({ risk, score }) => {
  switch (risk) {
    case 'HIGH':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          High Support Need {score !== undefined ? `(${Math.round(score * 100)}%)` : ''}
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Moderate Review {score !== undefined ? `(${Math.round(score * 100)}%)` : ''}
        </Badge>
      );
    case 'LOW':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          On Track
        </Badge>
      );
    default:
      return <Badge variant="neutral">{risk}</Badge>;
  }
};
