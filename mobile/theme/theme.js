export const colors = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',

  accent: '#7c3aed',
  accentLight: '#ede9fe',

  success: '#16a34a',
  successLight: '#dcfce7',

  warning: '#d97706',
  warningLight: '#fef3c7',

  danger: '#dc2626',
  dangerLight: '#fee2e2',

  background: '#f8fafc',
  surface: '#ffffff',

  border: '#e2e8f0',

  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#64748b',

  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};