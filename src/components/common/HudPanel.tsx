import React from 'react';
import { cn } from '@/lib/utils';

interface HudPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function HudPanel({
  title,
  children,
  className,
  headerRight,
  onFullscreen,
  isFullscreen,
}: HudPanelProps) {
  return (
    <div
      className={cn(
        'relative bg-slate-900/80 border border-cyan-500/30 rounded-sm overflow-hidden',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
        <h3 className="text-cyan-300 text-sm font-bold tracking-wider uppercase">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {headerRight}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="text-cyan-400 hover:text-cyan-200 text-xs transition-colors"
            >
              {isFullscreen ? '退出' : '全屏'}
            </button>
          )}
        </div>
      </div>

      <div className="p-3">{children}</div>

      <div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        style={{ width: '100%', animation: 'scan-line 3s linear infinite' }}
      />
    </div>
  );
}
