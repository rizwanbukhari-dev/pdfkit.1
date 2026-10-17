import React, { useState } from 'react';
import { Download, CheckCircle2, ArrowDownToLine, Loader2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';

interface InstallButtonProps {
  variant?: 'header' | 'drawer' | 'compact' | 'icon-only';
  className?: string;
  onInstalled?: () => void;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'header',
  className = '',
  onInstalled,
}) => {
  const { isInstalled, promptInstall, openInstallModal, isIOS } = usePWAInstall();
  const [isLoading, setIsLoading] = useState(false);

  // If already installed:
  // In the header, hide the button so the interface remains clean and uncrowded
  if (isInstalled && (variant === 'header' || variant === 'compact' || variant === 'icon-only')) {
    return null;
  }

  // If already installed and in the drawer:
  if (isInstalled && variant === 'drawer') {
    return (
      <div
        className={`w-full px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-sm font-semibold select-none ${className}`}
        aria-label="PDFKit App is Installed"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>PDFKit App Installed</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
          Ready
        </span>
      </div>
    );
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // On iOS Safari, beforeinstallprompt is never supported by Apple; directly open guide
    if (isIOS) {
      openInstallModal();
      return;
    }

    setIsLoading(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onInstalled?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Header desktop/tablet button
  if (variant === 'header') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`group relative inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-95 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 shadow-sm hover:shadow ${className}`}
        aria-label="Install PDFKit as a Web App"
        title="Install PDFKit as a standalone desktop or mobile app"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
        ) : (
          <ArrowDownToLine className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:translate-y-0.5 transition-transform" />
        )}
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // Drawer / Mobile Menu full width button
  if (variant === 'drawer') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all flex items-center justify-between group ${className}`}
        aria-label="Install PDFKit App on your device"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
          <div className="text-left">
            <div className="leading-tight">Install PDFKit App</div>
            <div className="text-[11px] text-white/80 font-normal">Add to home screen for 1-click access</div>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-white/20 text-white">
          Free
        </span>
      </button>
    );
  }

  // Icon only (for very narrow header spaces if needed)
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`p-2.5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all ${className}`}
        aria-label="Install PDFKit App"
        title="Install PDFKit App"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowDownToLine className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Default compact
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all active:scale-95 ${className}`}
      aria-label="Install App"
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
      <span>Install</span>
    </button>
  );
};
