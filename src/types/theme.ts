export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColorId =
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'sky'
  | 'amber'
  | 'teal'
  | 'fuchsia';

export interface AccentColorOption {
  id: AccentColorId;
  name: string;
  hex: string;
  lightBg: string;
  gradient: string;
  description: string;
}

export const ACCENT_COLORS: AccentColorOption[] = [
  {
    id: 'indigo',
    name: 'Indigo',
    hex: '#6366f1',
    lightBg: '#eef2ff',
    gradient: 'from-indigo-500 to-indigo-700',
    description: 'Classic & Professional',
  },
  {
    id: 'violet',
    name: 'Violet',
    hex: '#8b5cf6',
    lightBg: '#f5f3ff',
    gradient: 'from-violet-500 to-purple-700',
    description: 'Electric & Creative',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    hex: '#0ea5e9',
    lightBg: '#f0f9ff',
    gradient: 'from-sky-400 to-blue-600',
    description: 'Clean & Modern Ocean',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    hex: '#10b981',
    lightBg: '#ecfdf5',
    gradient: 'from-emerald-400 to-teal-600',
    description: 'Fresh & Vibrant Jade',
  },
  {
    id: 'rose',
    name: 'Rose',
    hex: '#f43f5e',
    lightBg: '#fff1f2',
    gradient: 'from-rose-400 to-pink-600',
    description: 'Bold & Radiant Ruby',
  },
  {
    id: 'amber',
    name: 'Amber',
    hex: '#f59e0b',
    lightBg: '#fffbeb',
    gradient: 'from-amber-400 to-orange-600',
    description: 'Warm Sunset & Energetic',
  },
  {
    id: 'teal',
    name: 'Teal',
    hex: '#14b8a6',
    lightBg: '#f0fdfa',
    gradient: 'from-teal-400 to-emerald-600',
    description: 'Deep Aqua & Balanced',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    hex: '#d946ef',
    lightBg: '#fdf4ff',
    gradient: 'from-fuchsia-400 to-pink-600',
    description: 'Vivid & Playful Berry',
  },
];
