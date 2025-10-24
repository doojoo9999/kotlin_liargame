import tokens from '../design-tokens.json' assert {type: 'json'}

export type StelliveDesignTokens = typeof tokens
export type ThemeName = keyof StelliveDesignTokens['themes']

export const stelliveTokens: StelliveDesignTokens = tokens

export const availableThemes = Object.freeze(
  Object.keys(tokens.themes) as ThemeName[]
)

export function getThemeToken(theme: ThemeName = 'light') {
  return stelliveTokens.themes[theme] ?? stelliveTokens.themes.light
}

export function getThemePalette(theme: ThemeName = 'light') {
  return getThemeToken(theme).palette
}

export function withThemeFallback(theme?: ThemeName) {
  if (!theme || !availableThemes.includes(theme)) {
    return 'light'
  }
  return theme
}
