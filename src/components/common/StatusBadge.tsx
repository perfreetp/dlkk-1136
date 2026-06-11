import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  children,
  variant = 'neutral',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const variantClasses = {
    success: 'bg-green-500/20 text-green-400 border-green-500/50',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    danger: 'bg-red-500/20 text-red-400 border-red-500/50',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm',
        variantClasses[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}
