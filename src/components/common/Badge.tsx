import React from 'react';

interface BadgeProps {
  type?: 'Free' | 'Popular' | 'New' | 'Coming Soon';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type = 'Free', size = 'sm', className = '' }) => {
  const styles = {
    Free: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    Popular: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    New: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    'Coming Soon': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  }[type];

  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border tracking-wide uppercase font-mono ${sizeStyle} ${styles} ${className}`}
    >
      {type === 'Popular' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
      {type === 'Free' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
      {type}
    </span>
  );
};
