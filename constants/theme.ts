import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    tertiary: '#059669',
    error: '#dc2626',
    surface: '#ffffff',
    background: '#f8fafc',
    onSurface: '#1e293b',
    onBackground: '#0f172a',
    onSurfaceVariant: '#64748b',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    tertiary: '#10b981',
    error: '#ef4444',
    surface: '#1e293b',
    background: '#0f172a',
    onSurface: '#f1f5f9',
    onBackground: '#f8fafc',
    onSurfaceVariant: '#94a3b8',
  },
};