import { Platform } from 'react-native';

export const colors = {
  primary: '#D4A5A5',
  primaryLight: '#E4C5C5',
  primaryDark: '#B88888',
  secondary: '#B5C9C7',
  secondaryLight: '#D0E0DE',
  accent: '#E8D5A3',
  accentDark: '#D4B896',
  lavender: '#CFC3E0',
  lavenderLight: '#E4DCF0',
  background: '#FEF9F4',
  surface: '#FFFDF9',
  surfaceAlt: '#FBF0E8',
  surfaceRose: '#FAE8EC',
  surfaceMint: '#EDF5F1',
  surfaceLavender: '#F3EEF9',
  surfaceButter: '#FBF5E4',
  text: '#3D2C2C',
  textSecondary: '#7A6A6A',
  textLight: '#B0A0A0',
  border: '#EAD9C8',
  borderSoft: '#F0E5D8',
  error: '#D48484',
  success: '#8CB89C',
  warning: '#E0C88E',
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
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
};
