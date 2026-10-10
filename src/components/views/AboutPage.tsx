import React from 'react';
import { ShieldCheck, Cpu, Zap, Lock, Users, Sparkles, Heart } from 'lucide-react';
import { Button } from '../common/Button';
import { DeveloperWatermark } from '../common/DeveloperWatermark';

interface AboutPageProps {
  onExploreTools: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onExploreTools }) => {
  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About PDFKit</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Empowering Everyday Document Productivity
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          PDFKit is an easy-to-use collection of PDF and document tools designed to help students,
          teachers, office workers, digital service centers, and businesses manage documents quickly.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Accessible to Everyone</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            No steep learning curve, no registration paywalls, and no complicated software installations. Just open and work.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">100% In-Browser Privacy</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your confidential files are processed locally inside your web browser. Documents never touch external cloud servers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Instant High Performance</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Powered by modern WebAssembly and native HTML5 Canvas rendering for zero-latency execution.
          </p>
        </div>
      </div>

      {/* Developer Credit & Story */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Architected & Maintained by Rizwan Bukhari
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          PDFKit was created to solve a widespread problem: most online document conversion websites
          are cluttered with deceptive ads, force costly subscription plans, or quietly upload sensitive
          personal PDFs to unknown third-party servers.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Our vision is to provide clean, fast, completely trustworthy document utilities that anyone
          can use safely from mobile phones, laptops, and digital service kiosks worldwide.
        </p>

        <div className="pt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={onExploreTools}>
            Explore All Tools
          </Button>
        </div>
      </div>

      {/* Developer Watermark Showcase */}
      <DeveloperWatermark variant="banner" />
    </div>
  );
};
