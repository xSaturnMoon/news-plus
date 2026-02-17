export const Colors = {
  primary: '#E3F2FD', // Soft blue
  secondary: '#F1F8E9', // Soft green
  accent: '#FFF3E0', // Soft orange
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#263238',
  textLight: '#546E7A',
  error: '#FFEBEE',
  errorText: '#C62828',
  border: '#ECEFF1',
  shadow: '#000000',
  white: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  header: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subheader: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 18,
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.textLight,
  },
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
};

export const Shadows = {
  light: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
  shadows: Shadows,
  borderRadius: {
    sm: 12,
    md: 20,
    lg: 28,
    full: 999,
  },
};
