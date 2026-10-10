import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ToolDefinition } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

interface ComingSoonModalProps {
  tool: ToolDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onExploreWorkingTools: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  tool,
  isOpen,
  onClose,
  onExploreWorkingTools,
}) => {
  if (!tool) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tool.name}
      description="Feature Status & Architecture Roadmap"
      maxWidth="md"
    >
      <div className="space-y-5 text-center">
        {/* Tool Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
          <DynamicIcon name={tool.iconName} className="w-8 h-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Coming Soon</span>
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">
            Under Active Client-Side Development
          </h4>
        </div>

        {/* Explanation */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>{tool.comingSoonReason || 'This advanced feature requires heavy server-side processing engines or external cloud APIs. Because PDFKit prioritizes 100% user privacy by never uploading your documents to a remote server, we are actively porting this functionality to local client-side WebAssembly.'}</p>
        </div>

        {/* Privacy Highlight */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold block">Privacy First Guarantee</span>
            We refuse to provide fake or unsecured server wrappers that compromise your confidential documents.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onExploreWorkingTools();
            }}
            className="w-full sm:w-auto"
          >
            Explore Available Tools
          </Button>
        </div>
      </div>
    </Modal>
  );
};
