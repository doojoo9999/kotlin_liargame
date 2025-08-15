// Design tokens: Colors for white-mode design system
// Adapted from existing gameTheme.js with light theme approach

export const colors = {
  // Primary palette - 인디고 기반
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Primary main
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b'
  },

  // Secondary palette - 핑크 기반
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Secondary main
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724'
  },

  // Success palette - 에메랄드 기반
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Success main
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  },

  // Warning palette - 앰버 기반
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning main
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  // Error palette - 레드 기반
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error main
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },

  // Game-specific colors (adapted to light theme)
  game: {
    liar: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ff4757', // Adapted from original #FF4757
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    citizen: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#5352ed', // Adapted from original #5352ED
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81'
    },
    speaking: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#ff9f43', // Adapted from original #FF9F43
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    voting: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#c44569', // Adapted from original #C44569
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843'
    },
    waiting: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#7fb069', // Adapted from original #7FB069
      600: '#22c55e',
      700: '#16a34a',
      800: '#15803d',
      900: '#166534'
    }
  },

  // Background colors - 화이트 모드
  background: {
    default: '#f8fafc', // 슬레이트 50
    paper: '#ffffff',
    elevated: '#f1f5f9', // 슬레이트 100
    overlay: 'rgba(15, 23, 42, 0.5)' // 반투명 오버레이
  },

  // Surface colors
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    disabled: '#e2e8f0'
  },

  // Text colors
  text: {
    primary: '#1e293b', // 슬레이트 800
    secondary: '#64748b', // 슬레이트 500
    tertiary: '#94a3b8', // 슬레이트 400
    disabled: '#cbd5e1', // 슬레이트 300
    inverse: '#ffffff'
  },

  // Border colors
  border: {
    primary: '#e2e8f0', // 슬레이트 200
    secondary: '#cbd5e1', // 슬레이트 300
    focus: '#6366f1', // Primary 500
    error: '#ef4444' // Error 500
  },

  // Utility colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent'
}

export default colors