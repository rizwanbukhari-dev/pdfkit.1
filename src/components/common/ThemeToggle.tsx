import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, Palette, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ACCENT_COLORS, ThemeMode, AccentColorId } from '../../types/theme';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { mode, resolvedMode, accentColor, activeColorConfig, setMode, setAccentColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const modeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'system',
      label: 'System',
      icon: <Monitor className="w-4 h-4 text-slate-400" />,
    },
  ];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 active:scale-95 shadow-xs ${className}`}
        title="Theme & Accent Colors"
        aria-label="Theme and color appearance settings"
        aria-expanded={isOpen}
      >
        {/* Current Mode Icon */}
        <div className="relative flex items-center justify-center">
          {resolvedMode === 'dark' ? (
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-400 transition-transform duration-300 rotate-0" />
          ) : (
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500 transition-transform duration-300 rotate-0" />
          )}

          {/* Color Indicator Badge */}
          <span
            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs transition-colors"
            style={{ backgroundColor: activeColorConfig.hex }}
            title={`Active Accent: ${activeColorConfig.name}`}
          />
        </div>

        {/* Optional text on larger screens */}
        <span className="hidden xl:inline text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
          {activeColorConfig.name}
        </span>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute -right-12 sm:right-0 mt-2.5 w-76 sm:w-84 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Appearance & Theme
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Customize mode & accent colors
                </p>
              </div>
            </div>

            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: activeColorConfig.lightBg,
                borderColor: `${activeColorConfig.hex}40`,
                color: activeColorConfig.hex,
              }}
            >
              {activeColorConfig.name}
            </span>
          </div>

          {/* Mode Switch (Light / Dark / System) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
              {modeOptions.map((opt) => {
                const isSelected = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200/50 dark:border-slate-700/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Accent Color
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                8 vibrant styles
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ACCENT_COLORS.map((color) => {
                const isSelected = accentColor === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setAccentColor(color.id)}
                    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 shadow-xs ring-2 ring-brand-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700/60'
                    }`}
                    title={`${color.name} — ${color.description}`}
                  >
                    {/* Color Swatch Circle */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-sm animate-in zoom-in-50 duration-150" />
                      )}
                    </div>

                    {/* Color Label */}
                    <span
                      className={`text-[10px] font-semibold text-center leading-tight truncate w-full ${
                        isSelected
                          ? 'text-slate-900 dark:text-white font-bold'
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`}
                    >
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Theme Preview */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  App Preview:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  Active
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-600 text-white shadow-xs">
                  Button
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-center text-slate-400 dark:text-slate-500">
              Applies instantly across buttons, highlights, tools & badges
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
