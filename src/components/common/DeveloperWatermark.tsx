import React from 'react';
import { Sparkles, CheckCircle2, ArrowUpRight, ExternalLink, Code2 } from 'lucide-react';
import { LinkedInIcon, GitHubIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons';

interface DeveloperWatermarkProps {
  className?: string;
  variant?: 'card' | 'banner' | 'compact';
}

export const DeveloperWatermark: React.FC<DeveloperWatermarkProps> = ({
  className = '',
  variant = 'card',
}) => {
  // 1. BANNER VARIANT (Full wide horizontal showcase for Footers, About, and Contact pages)
  if (variant === 'banner') {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-slate-200/90 dark:border-slate-800 shadow-soft-lg ${className}`}
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-gradient-to-br from-brand-500/10 via-pink-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header Row: Watermark Signature */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-3.5">
              {/* Monogram Seal */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-brand-500/30">
                  RB
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-white text-emerald-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                    Verified Creator Watermark
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Built by{' '}
                  <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Rizwan Bukhari
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for document engineering & collaboration</span>
            </div>
          </div>

          {/* Separated Social Profiles Grid (Distinct & Beautifully Branded) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. INSTAGRAM (Distinct Iconic Sunset Card) */}
            <a
              href="https://www.instagram.com/rizwanbukhari.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-4 rounded-2xl border border-pink-200/90 dark:border-pink-900/60 bg-gradient-to-br from-pink-50/70 via-rose-50/30 to-amber-50/20 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-slate-900 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/15 hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shadow-pink-500/25 group-hover:scale-105 transition-transform">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100/80 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                  Instagram
                </span>
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>@rizwanbukhari.dev</span>
                  <ArrowUpRight className="w-4 h-4 text-pink-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                  Follow on Instagram
                </p>
              </div>
            </a>

            {/* 2. GITHUB (Distinct Sleek Monospace Tech Card) */}
            <a
              href="https://github.com/rizwanbukhari-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-4 rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-gradient-to-br from-slate-100/80 via-white to-slate-200/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/15 hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/25 group-hover:scale-105 transition-transform">
                  <GitHubIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  GitHub
                </span>
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>@rizwanbukhari-dev</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Explore Repos & Code
                </p>
              </div>
            </a>

            {/* 3. LINKEDIN (Distinct Official Professional Blue Card) */}
            <a
              href="https://www.linkedin.com/in/rizwan-bukahri-dev-9a9bba441/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-4 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-indigo-50/20 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/15 hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <LinkedInIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  LinkedIn
                </span>
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Rizwan Bukhari-dev</span>
                  <ArrowUpRight className="w-4 h-4 text-[#0A66C2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Connect on LinkedIn
                </p>
              </div>
            </a>

            {/* 4. WHATSAPP (Distinct Official WhatsApp Green Card) */}
            <a
              href="https://wa.me/916005320065"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-green-50/20 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/15 hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  WhatsApp
                </span>
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>+91 6005320065</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Chat on WhatsApp
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT WATERMARK SEAL (Sleek pill / badge)
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-soft backdrop-blur-sm ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400">Watermark:</span>
        <span className="text-xs font-extrabold bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
          Rizwan Bukhari
        </span>
        <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
        <div className="flex items-center gap-1.5">
          <a
            href="https://www.instagram.com/rizwanbukhari.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram: @rizwanbukhari.dev"
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform"
          >
            <InstagramIcon className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://github.com/rizwanbukhari-dev"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: @rizwanbukhari-dev"
            className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <GitHubIcon className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.linkedin.com/in/rizwan-bukahri-dev-9a9bba441/"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn: Rizwan Bukhari-dev"
            className="w-5 h-5 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:scale-110 transition-transform"
          >
            <LinkedInIcon className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://wa.me/916005320065"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp: +91 6005320065"
            className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform"
          >
            <WhatsAppIcon className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. DEFAULT CARD VARIANT (Vertical stacked card with stylish signature & separated links)
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stylish Watermark Seal Card */}
      <div className="relative group w-full">
        {/* Glowing holographic aura */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-600 via-pink-500 to-indigo-600 rounded-2xl blur opacity-35 group-hover:opacity-80 transition duration-500" />

        <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-3">
            {/* Monogram Badge */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/30 shrink-0">
              RB
            </div>

            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                  Developer Signature
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 fill-brand-100 dark:fill-brand-950 shrink-0" />
              </div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
                <span>Built by </span>
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  Rizwan Bukhari
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separated Social Profile Badges */}
      <div className="space-y-2 pt-1 text-left">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
          Connect Directly
        </span>

        <div className="flex flex-col gap-2">
          {/* 1. INSTAGRAM (Distinct Sunset Card) */}
          <a
            href="https://www.instagram.com/rizwanbukhari.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group/insta flex items-center justify-between p-2.5 px-3 rounded-xl border border-pink-200/90 dark:border-pink-900/50 bg-gradient-to-r from-pink-50/70 to-rose-50/40 dark:from-pink-950/30 dark:to-slate-900 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-md hover:shadow-pink-500/15 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-sm">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Instagram</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">
                    Follow
                  </span>
                </div>
                <div className="text-[11px] font-mono text-pink-600 dark:text-pink-400 truncate">
                  @rizwanbukhari.dev
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-pink-500 group-hover/insta:translate-x-0.5 group-hover/insta:-translate-y-0.5 transition-transform shrink-0" />
          </a>

          {/* 2. GITHUB (Distinct Sleek Monospace Card) */}
          <a
            href="https://github.com/rizwanbukhari-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group/git flex items-center justify-between p-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-100/90 to-white dark:from-slate-900 dark:to-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:shadow-slate-500/15 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                <GitHubIcon className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>GitHub</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    Code
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                  @rizwanbukhari-dev
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover/git:translate-x-0.5 group-hover/git:-translate-y-0.5 transition-transform shrink-0" />
          </a>

          {/* 3. LINKEDIN (Distinct Official Professional Blue Card) */}
          <a
            href="https://www.linkedin.com/in/rizwan-bukahri-dev-9a9bba441/"
            target="_blank"
            rel="noopener noreferrer"
            className="group/in flex items-center justify-between p-2.5 px-3 rounded-xl border border-blue-200/90 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/70 to-sky-50/40 dark:from-blue-950/30 dark:to-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/15 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-sm">
                <LinkedInIcon className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>LinkedIn</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Connect
                  </span>
                </div>
                <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate">
                  Rizwan Bukhari-dev
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#0A66C2] group-hover/in:translate-x-0.5 group-hover/in:-translate-y-0.5 transition-transform shrink-0" />
          </a>

          {/* 4. WHATSAPP (Distinct Official WhatsApp Green Card) */}
          <a
            href="https://wa.me/916005320065"
            target="_blank"
            rel="noopener noreferrer"
            className="group/wa flex items-center justify-between p-2.5 px-3 rounded-xl border border-emerald-200/90 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/15 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                <WhatsAppIcon className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>WhatsApp</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    Chat
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  +91 6005320065
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover/wa:translate-x-0.5 group-hover/wa:-translate-y-0.5 transition-transform shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
