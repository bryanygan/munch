export const colors = {
  primary: '#f27f0d',
  primaryDim: 'rgba(242, 127, 13, 0.1)',
  backgroundLight: '#f8f7f5',
  backgroundDark: '#221910',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#8e8e93',
  surfaceLight: '#ffffff',
  surfaceDark: 'rgba(34, 25, 16, 0.5)',
  divider: 'rgba(242, 127, 13, 0.1)',
  success: '#10b981',
  danger: '#ef4444',
  cinemaGold: '#f8e7c9',
} as const;

export type ColorKey = keyof typeof colors;
