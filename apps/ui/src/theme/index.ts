import {stelliveTokens, type ThemeName, withThemeFallback} from '../tokens'

export interface CSSVariableOptions {
  theme?: ThemeName
  prefix?: string
  reducedMotion?: boolean
}

export type CSSVariableMap = Record<string, string>

const MOTION_DURATION_SUFFIXES = new Set(['duration'])

function formatValue(value: unknown, keyPath: string[]): string {
  if (typeof value === 'number' && keyPath.some((segment) => MOTION_DURATION_SUFFIXES.has(segment))) {
    return `${value}ms`
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  return String(value)
}

function appendVariables(
  result: CSSVariableMap,
  prefix: string[],
  value: unknown,
  options: { reducedMotion?: boolean }
) {
  if (value === null || value === undefined) {
    return
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      appendVariables(result, [...prefix, key], nested, options)
    }
    return
  }

  const key = `--${prefix.join('-')}`

  if (options.reducedMotion && key.includes('-motion-duration-')) {
    result[key] = '0ms'
    return
  }

  result[key] = formatValue(value, prefix)
}

export function createCSSVariables({
  theme = 'light',
  prefix = 'stellive',
  reducedMotion = false
}: CSSVariableOptions = {}): CSSVariableMap {
  const resolvedTheme = withThemeFallback(theme)
  const themeTokens = stelliveTokens.themes[resolvedTheme] ?? stelliveTokens.themes.light
  const cssVarMap: CSSVariableMap = {}
  const namespace = (path: string[]) => [prefix, ...path]

  appendVariables(cssVarMap, namespace(['theme', 'name']), resolvedTheme, { reducedMotion })

  const {
    themes,
    typography,
    spacing,
    radii,
    shadows,
    blurs,
    opacity,
    motion,
    zIndex,
    breakpoints,
    gradients,
    elevation,
    componentDefaults
  } = stelliveTokens

  appendVariables(
    cssVarMap,
    namespace(['color']),
    themes[resolvedTheme].palette,
    { reducedMotion }
  )

  appendVariables(cssVarMap, namespace(['typography']), typography, { reducedMotion })
  appendVariables(cssVarMap, namespace(['spacing']), spacing, { reducedMotion })
  appendVariables(cssVarMap, namespace(['radius']), radii, { reducedMotion })
  appendVariables(cssVarMap, namespace(['shadow']), shadows, { reducedMotion })
  appendVariables(cssVarMap, namespace(['blur']), blurs, { reducedMotion })
  appendVariables(cssVarMap, namespace(['opacity']), opacity, { reducedMotion })
  appendVariables(cssVarMap, namespace(['motion']), motion, { reducedMotion })
  appendVariables(cssVarMap, namespace(['z-index']), zIndex, { reducedMotion })
  appendVariables(cssVarMap, namespace(['breakpoint']), breakpoints, { reducedMotion })
  appendVariables(cssVarMap, namespace(['gradient']), gradients, { reducedMotion })
  appendVariables(cssVarMap, namespace(['elevation']), elevation, { reducedMotion })
  appendVariables(cssVarMap, namespace(['component']), componentDefaults, { reducedMotion })

  const semanticAliases: Record<string, unknown> = {
    '--background': themeTokens.palette.background.default,
    '--background-raised': themeTokens.palette.background.raised,
    '--surface': themeTokens.palette.surface.base,
    '--surface-overlay': themeTokens.palette.surface.overlay,
    '--surface-glass': themeTokens.palette.surface.glass,
    '--surface-sunken': themeTokens.palette.surface.sunken,
    '--foreground': themeTokens.palette.text.primary,
    '--foreground-muted': themeTokens.palette.text.muted,
    '--foreground-secondary': themeTokens.palette.text.secondary,
    '--foreground-inverse': themeTokens.palette.text.inverse,
    '--border': themeTokens.palette.border.subtle,
    '--border-strong': themeTokens.palette.border.strong,
    '--border-accent': themeTokens.palette.border.accent,
    '--input': themeTokens.palette.border.subtle,
    '--ring': themeTokens.palette.primary['400'],
    '--primary': themeTokens.palette.primary['500'],
    '--primary-foreground': themeTokens.palette.text.inverse,
    '--secondary': themeTokens.palette.secondary['500'],
    '--secondary-foreground': themeTokens.palette.text.inverse,
    '--accent': themeTokens.palette.accent['500'],
    '--accent-foreground': themeTokens.palette.text.inverse,
    '--muted': themeTokens.palette.neutral['700'],
    '--muted-foreground': themeTokens.palette.text.muted,
    '--card': themeTokens.palette.surface.base,
    '--card-foreground': themeTokens.palette.text.primary,
    '--popover': themeTokens.palette.surface.overlay,
    '--popover-foreground': themeTokens.palette.text.primary,
    '--destructive': themeTokens.palette.danger['500'],
    '--destructive-foreground': themeTokens.palette.text.inverse,
    '--success': themeTokens.palette.success['500'],
    '--success-foreground': themeTokens.palette.text.inverse,
    '--warning': themeTokens.palette.warning['500'],
    '--warning-foreground': themeTokens.palette.text.inverse,
    '--info': themeTokens.palette.info['500'],
    '--info-foreground': themeTokens.palette.text.inverse,
    '--radius': stelliveTokens.radii.lg,
    '--radius-card': stelliveTokens.radii.xl,
    '--radius-pill': stelliveTokens.radii.pill,
    '--shadow-card': stelliveTokens.shadows.md,
    '--shadow-card-strong': stelliveTokens.shadows.lg,
    '--font-family-base': stelliveTokens.typography.families.sans,
    '--blur-card': stelliveTokens.blurs.md,
    '--blur-overlay': stelliveTokens.blurs.lg,
    '--gradient-primary': stelliveTokens.gradients.primary,
    '--gradient-accent': stelliveTokens.gradients.accent,
    '--gradient-secondary': stelliveTokens.gradients.secondary,
    '--gradient-glass': stelliveTokens.gradients.glass
  }

  for (const [alias, value] of Object.entries(semanticAliases)) {
    if (!value) continue
    cssVarMap[alias] = String(value)
  }

  return cssVarMap
}

export interface ThemeStyleOptions extends CSSVariableOptions {
  selector?: string
}

export function createThemeStyle({
  theme = 'light',
  prefix,
  reducedMotion,
  selector = ':root'
}: ThemeStyleOptions = {}): string {
  const variables = createCSSVariables({ theme, prefix, reducedMotion })
  const body = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return `${selector} {\n${body}\n}`
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(stelliveTokens.themes) as ThemeName[]
}
