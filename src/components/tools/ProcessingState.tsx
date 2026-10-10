import React from 'react';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

interface ProcessingStateProps {
  message?: string;
  step?: string;
  progress?: number;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  message = 'Processing your document...',
  step = 'Optimizing and rendering pages',
  progress,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto py-12 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-lg text-center space-y-6 animate-in fade-in duration-200">
      {/* Animated Spinner with gradient glow */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{message}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{step}</p>
      </div>

      {/* Progress Bar (if available) */}
      {progress !== undefined && (
        <div className="space-y-2">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-semibold">
            {Math.round(progress)}% Completed
          </span>
        </div>
      )}

      {/* Trust message */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Processed locally inside your browser • 100% Secure</span>
      </div>
    </div>
  );
};
