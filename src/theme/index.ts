export type ThemeMode = 'dark' | 'light';

export const DarkColors = {
  primary: '#94A3B8',      // Sophisticated Slate Gray
  secondary: '#1E1E22',
  accent: '#5EEAD4',
  background: '#0A0A0C',
  card: 'rgba(28, 28, 32, 0.75)',
  text: '#FFFFFF',
  textLight: '#A0A8B8',
  error: '#FF5252',
  errorText: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.12)',
  shadow: '#000000',
  white: '#FFFFFF',
};

export const LightColors = {
  primary: '#475569',      // Deeper Slate Gray
  secondary: '#F1F5F9',
  accent: '#14B8A6',
  background: '#FFFFFF',   // Pure White
  card: 'rgba(255, 255, 255, 0.9)',
  text: '#0F172A',         // Slate 900
  textLight: '#64748B',    // Slate 500
  error: '#EF4444',
  errorText: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.06)',
  shadow: '#000000',
  white: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 10,
  md: 18,
  lg: 28,
  xl: 36,
  xxl: 52,
};

export const getTypography = (colors: typeof DarkColors) => ({
  header: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subheader: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.9,
  },
  caption: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500' as const,
  },
  button: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
});

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const getTheme = (mode: ThemeMode) => {
  const colors = mode === 'dark' ? DarkColors : LightColors;
  return {
    colors,
    spacing: Spacing,
    typography: getTypography(colors),
    shadows: Shadows,
    borderRadius: {
      sm: 14,
      md: 22,
      lg: 32,
      full: 999,
    },
    mode,
  };
};

// Default export for backward compatibility
export const Theme = getTheme('dark');
