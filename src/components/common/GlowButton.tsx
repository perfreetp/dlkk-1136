import React from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className,
}: GlowButtonProps) {
  const variantClasses = {
    primary:
      'border-cyan-400 text-cyan-300 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]',
    success:
      'border-green-400 text-green-300 hover:bg-green-400/20 hover:shadow-[0_0_20px_rgba(46,213,115,0.4)]',
    danger:
      'border-red-400 text-red-300 hover:bg-red-400/20 hover:shadow-[0_0_20px_rgba(255,71,87,0.4)]',
    warning:
      'border-yellow-400 text-yellow-300 hover:bg-yellow-400/20 hover:shadow-[0_0_20px_rgba(255,193,7,0.4)]',
    info:
      'border-purple-400 text-purple-300 hover:bg-purple-400/20 hover:shadow-[0_0_20px_rgba(165,94,234,0.4)]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-5 py-2 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative border-2 bg-slate-900/50 font-bold tracking-wider uppercase',
        'transition-all duration-200 active:translate-y-0.5',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
