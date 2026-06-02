import { Platform } from 'react-native';

export const colors = {
  primary: '#9CAF88',
  primaryLight: '#BCC9A8',
  primaryDark: '#7A8E65',
  secondary: '#C4A882',
  secondaryLight: '#D9C4A5',
  accent: '#E0C88E',
  accentDark: '#C4A46A',
  lavender: '#B5BFA1',
  lavenderLight: '#D2D9C2',
  background: '#FDFAF5',
  surface: '#FFFEFA',
  surfaceAlt: '#F8F2E8',
  surfaceRose: '#F2EFE6',
  surfaceMint: '#EEF2E8',
  surfaceLavender: '#F0F2EB',
  surfaceButter: '#F9F4E6',
  text: '#3D3528',
  textSecondary: '#7A7066',
  textLight: '#B0A8A0',
  border: '#E5DCC8',
  borderSoft: '#EFE8D8',
  error: '#C48474',
  success: '#8CA87C',
  warning: '#D4B886',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.3)',
};

export const fonts = {
  display: Platform.select({
    ios: 'Baskerville',
    android: 'notoserif',
    default: 'serif',
  }),
  heading: Platform.select({
    ios: 'Baskerville',
    android: 'notoserif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  accent: Platform.select({
    ios: 'Didot',
    android: 'serif',
    default: 'serif',
  }),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const shadows = {
  sm: {
    shadowColor: '#8B9A6E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B9A6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8B9A6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
};
