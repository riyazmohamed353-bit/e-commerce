// Central design system for ReTech AI.
// Everything visual (color, spacing, radius, shadow, type) pulls from here
// so the app reads as one deliberate product instead of default RN styling.

export const colors = {
  // Brand
  primary: '#4F46E5', // indigo
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  accent: '#0EA5A6', // teal accent for AI / smart features
  accentLight: '#E6FBFB',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  // Neutrals
  background: '#F5F6FB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  overlay: 'rgba(17, 24, 39, 0.55)',
  white: '#FFFFFF',
};

export const gradients = {
  primary: ['#4F46E5', '#6366F1'],
  accent: ['#0EA5A6', '#14B8A6'],
  dark: ['#1E1B4B', '#312E81'],
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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  button: { fontSize: 15, fontWeight: '700', color: colors.white },
};

export const shadow = {
  sm: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};

export default { colors, gradients, spacing, radius, typography, shadow };
