import React from 'react';
import { ToolDefinition } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { Badge } from '../common/Badge';
import { ArrowRight, Lock } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: (tool: ToolDefinition) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div
      onClick={() => onClick(tool)}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft hover:shadow-soft-lg hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-300 cursor-pointer text-left overflow-hidden hover:-translate-y-1"
    >
      {/* Glow highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div>
        {/* Top row: Icon & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <DynamicIcon name={tool.iconName} className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge type="Free" size="sm" />
            {!tool.isWorking && <Badge type="Coming Soon" size="sm" />}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      {/* Bottom Action Indicator */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
        {tool.isWorking ? (
          <span className="text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Open Tool</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Coming Soon</span>
          </span>
        )}

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 capitalize">
          {tool.category}
        </span>
      </div>
    </div>
  );
};
