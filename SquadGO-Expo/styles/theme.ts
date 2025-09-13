import { useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    background: Record<string, string>;
    surface: Record<string, string>;
    text: Record<string, string>;
    border: Record<string, string>;
    states: Record<string, string>;
  };
  gradients: Record<string, string[]>;
  typography: any;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, any>;
  glassmorphism: Record<string, any>;
  animations: Record<string, any>;
  components: Record<string, any>;
}

const lightColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  accent: {
    blue: '#0ea5e9',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    neon: '#00ff88',
  },
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    card: '#ffffff',
    elevated: '#f1f5f9',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    elevated: '#f1f5f9',
  },
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#3b82f6',
  },
  states: {
    hover: 'rgba(59, 130, 246, 0.1)',
    active: 'rgba(59, 130, 246, 0.2)',
    disabled: 'rgba(148, 163, 184, 0.5)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

const darkColors = {
  primary: {
    50: '#1e3a8a',
    100: '#1e40af',
    200: '#1d4ed8',
    300: '#2563eb',
    400: '#3b82f6',
    500: '#60a5fa',
    600: '#93c5fd',
    700: '#bfdbfe',
    800: '#dbeafe',
    900: '#eff6ff',
  },
  secondary: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc',
  },
  accent: {
    blue: '#0ea5e9',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    neon: '#00ff88',
  },
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    card: '#1e293b',
    elevated: '#334155',
  },
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    elevated: '#475569',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: '#60a5fa',
  },
  states: {
    hover: 'rgba(96, 165, 250, 0.1)',
    active: 'rgba(96, 165, 250, 0.2)',
    disabled: 'rgba(148, 163, 184, 0.3)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

export const createTheme = (mode: ThemeMode): Theme => {
  const colors = mode === 'light' ? lightColors : darkColors;
  
  return {
    mode,
    colors,
    gradients: {
      primary: mode === 'light' ? ['#3b82f6', '#1d4ed8'] : ['#60a5fa', '#3b82f6'],
      secondary: mode === 'light' ? ['#64748b', '#334155'] : ['#94a3b8', '#64748b'],
      gaming: ['#d946ef', '#9333ea', '#7c3aed'],
      neon: ['#00ff88', '#00d4ff', '#ff0080'],
      sunset: ['#ff7e5f', '#feb47b', '#ff6b6b'],
      ocean: ['#667eea', '#764ba2', '#667eea'],
      forest: ['#134e5e', '#71b280', '#134e5e'],
      aurora: ['#a8edea', '#fed6e3', '#d299c2'],
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
        '6xl': 60,
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
    },
    spacing: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
      20: 80,
      24: 96,
      32: 128,
      40: 160,
      48: 192,
      56: 224,
      64: 256,
    },
    borderRadius: {
      none: 0,
      sm: 4,
      base: 8,
      md: 12,
      lg: 16,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
      full: 9999,
    },
    shadows: {
      none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      sm: {
        shadowColor: mode === 'light' ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: mode === 'light' ? 0.05 : 0.3,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: mode === 'light' ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: mode === 'light' ? 0.1 : 0.4,
        shadowRadius: 6,
        elevation: 6,
      },
      lg: {
        shadowColor: mode === 'light' ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: mode === 'light' ? 0.15 : 0.5,
        shadowRadius: 15,
        elevation: 15,
      },
      xl: {
        shadowColor: mode === 'light' ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: mode === 'light' ? 0.25 : 0.6,
        shadowRadius: 25,
        elevation: 25,
      },
    },
    glassmorphism: {
      light: {
        backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: mode === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
      },
      medium: {
        backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(15px)',
        borderWidth: 1,
        borderColor: mode === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)',
      },
      strong: {
        backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        borderWidth: 1,
        borderColor: mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
      },
    },
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
        slower: 800,
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: '#0ea5e9',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
        },
        secondary: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#374151',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
        },
        gaming: {
          backgroundColor: '#d946ef',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
        },
      },
      card: {
        default: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: mode === 'light' ? '#e2e8f0' : '#374151',
        },
        elevated: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#334155',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: mode === 'light' ? 0.1 : 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        },
      },
      input: {
        default: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          borderWidth: 1,
          borderColor: mode === 'light' ? '#e2e8f0' : '#374151',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          color: mode === 'light' ? '#0f172a' : '#f8fafc',
        },
        focused: {
          borderColor: '#60a5fa',
          shadowColor: '#60a5fa',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        },
      },
    },
  };
};

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
export const theme = darkTheme;

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(darkTheme);
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setCurrentTheme(newMode === 'light' ? lightTheme : darkTheme);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    setCurrentTheme(newMode === 'light' ? lightTheme : darkTheme);
  };

  return {
    currentTheme,
    mode,
    toggleTheme,
    setThemeMode,
    lightTheme,
    darkTheme,
  };
};

export default theme;