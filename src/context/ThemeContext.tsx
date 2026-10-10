import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, AccentColorId, ACCENT_COLORS, AccentColorOption } from '../types/theme';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  accentColor: AccentColorId;
  activeColorConfig: AccentColorOption;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccentColor: (color: AccentColorId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'pdfkit-theme';
const COLOR_STORAGE_KEY = 'pdfkit-accent-color';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored as ThemeMode;
      }
      return 'system';
    }
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColorId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COLOR_STORAGE_KEY) as AccentColorId;
      if (stored && ACCENT_COLORS.some((c) => c.id === stored)) {
        return stored;
      }
    }
    return 'indigo';
  });

  // Calculate resolved mode (light vs dark) based on system preference
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  // Apply dark / light class to root
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedMode === 'dark' ? '#020617' : '#ffffff');
    }
  }, [resolvedMode]);

  // Apply accent color data attribute to root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-color', accentColor);
    localStorage.setItem(COLOR_STORAGE_KEY, accentColor);
  }, [accentColor]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark');
  };

  const setAccentColor = (newColor: AccentColorId) => {
    setAccentColorState(newColor);
  };

  const activeColorConfig = ACCENT_COLORS.find((c) => c.id === accentColor) || ACCENT_COLORS[0];

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        accentColor,
        activeColorConfig,
        setMode,
        toggleMode,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
