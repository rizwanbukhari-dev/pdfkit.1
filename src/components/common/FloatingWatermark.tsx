import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronUp, ChevronDown, X, ArrowUpRight } from 'lucide-react';
import { InstagramIcon, GitHubIcon, LinkedInIcon, WhatsAppIcon } from './SocialIcons';

export const FloatingWatermark: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        title="Show Developer Watermark"
        className="fixed bottom-3 right-3 z-40 w-8 h-8 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold shadow-lg hover:scale-110 transition-transform opacity-70 hover:opacity-100"
      >
        RB
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Expanded Floating Popover Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 rounded-3xl p-5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-brand-500/25">
                RB
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                    Official Watermark
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 fill-brand-100 dark:fill-brand-950" />
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Built by{' '}
                  <span className="bg-gradient-to-r from-brand-600 to-violet-600 dark:from-brand-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Rizwan Bukhari
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Separated Distinct Social Badges */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
              Creator Profiles
            </span>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/rizwanbukhari.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2.5 px-3 rounded-xl border border-pink-200/90 dark:border-pink-900/50 bg-gradient-to-r from-pink-50/70 to-rose-50/40 dark:from-pink-950/30 dark:to-slate-900 hover:border-pink-400 dark:hover:border-pink-600 transition-all hover:shadow-md hover:shadow-pink-500/15"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Instagram</div>
                  <div className="text-[11px] font-mono text-pink-600 dark:text-pink-400">
                    @rizwanbukhari.dev
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/rizwanbukhari-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-100/90 to-white dark:from-slate-900 dark:to-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-md hover:shadow-slate-500/15"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                  <GitHubIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">GitHub</div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    @rizwanbukhari-dev
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/rizwan-bukahri-dev-9a9bba441/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2.5 px-3 rounded-xl border border-blue-200/90 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/70 to-sky-50/40 dark:from-blue-950/30 dark:to-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-md hover:shadow-blue-500/15"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <LinkedInIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">LinkedIn</div>
                  <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                    Rizwan Bukhari-dev
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#0A66C2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/916005320065"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2.5 px-3 rounded-xl border border-emerald-200/90 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-md hover:shadow-emerald-500/15"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp</div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    +91 6005320065
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {/* Floating Stylish Pill */}
      <div className="flex items-center gap-1.5 p-1.5 pr-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md hover:shadow-2xl transition-all">
        {/* Avatar / Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/70 dark:to-indigo-950/50 hover:opacity-90 transition-opacity"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
            Built by{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 dark:from-brand-400 dark:to-violet-400 bg-clip-text text-transparent">
              Rizwan Bukhari
            </span>
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Separated Quick Direct Icons */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/rizwanbukhari.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram: @rizwanbukhari.dev"
            className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-115 transition-transform shadow-xs"
          >
            <InstagramIcon className="w-3 h-3" />
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/rizwanbukhari-dev"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: @rizwanbukhari-dev"
            className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-115 transition-transform shadow-xs"
          >
            <GitHubIcon className="w-3 h-3" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/rizwan-bukahri-dev-9a9bba441/"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn: Rizwan Bukhari-dev"
            className="w-6 h-6 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center hover:scale-115 transition-transform shadow-xs"
          >
            <LinkedInIcon className="w-3 h-3" />
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/916005320065"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp: +91 6005320065"
            className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:scale-115 transition-transform shadow-xs"
          >
            <WhatsAppIcon className="w-3 h-3" />
          </a>
        </div>

        {/* Small Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          title="Minimize watermark"
          className="ml-0.5 p-1 rounded-full text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
