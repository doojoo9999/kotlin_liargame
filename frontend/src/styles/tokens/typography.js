// Design tokens: Typography system
// Based on existing Pretendard font from gameTheme.js

export const fontFamily = {
  primary: '"Pretendard", "Noto Sans KR", sans-serif',
  secondary: '"Pretendard", "Noto Sans KR", sans-serif',
  mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
}

export const fontWeight = {
  thin: 100,
  extraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900
}

export const fontSize = {
  // Base scale (px to rem conversion)
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem'     // 128px
}

export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
}

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
}

// Semantic typography tokens
export const typography = {
  // Headings
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extraBold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.primary
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.primary
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  h5: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  h6: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },

  // Body text
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },

  // UI components
  buttonLarge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.primary
  },
  button: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.primary
  },
  buttonSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wider,
    fontFamily: fontFamily.primary
  },

  // Labels and captions
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.primary
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.primary
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    fontFamily: fontFamily.primary,
    textTransform: 'uppercase'
  },

  // Game-specific typography (adapted from gameTheme.js)
  gameTitle: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.primary,
    background: 'linear-gradient(45deg, #6366f1, #ec4899)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  },
  gameSubtitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  playerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  chatMessage: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.primary
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wider,
    fontFamily: fontFamily.primary,
    textTransform: 'uppercase'
  },

  // Code/monospace
  code: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.mono
  }
}

export default typography