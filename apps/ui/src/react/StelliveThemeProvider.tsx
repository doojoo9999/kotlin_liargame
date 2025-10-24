import type {CSSProperties, ElementType, ReactNode} from 'react'
import {useEffect, useLayoutEffect, useMemo} from 'react'
import {createCSSVariables, type CSSVariableMap, type CSSVariableOptions} from '../theme'

type ProviderElement = ElementType<{ style?: CSSProperties; className?: string; children?: ReactNode }>

export interface StelliveThemeProviderProps extends CSSVariableOptions {
  as?: ProviderElement
  className?: string
  style?: CSSProperties
  children?: ReactNode
  attachToDocument?: boolean
  target?: HTMLElement | null
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function toInlineStyle(variables: CSSVariableMap, style?: CSSProperties) {
  const result: CSSProperties = { ...(style ?? {}) }
  for (const [key, value] of Object.entries(variables)) {
    // CSS custom properties can be assigned directly on the style object
    ;(result as Record<string, string>)[key] = value
  }
  return result
}

function applyToElement(element: HTMLElement, variables: CSSVariableMap) {
  const previousValues: Record<string, string> = {}

  for (const [key, value] of Object.entries(variables)) {
    previousValues[key] = element.style.getPropertyValue(key)
    element.style.setProperty(key, value)
  }

  return () => {
    for (const [key, value] of Object.entries(previousValues)) {
      if (value) {
        element.style.setProperty(key, value)
      } else {
        element.style.removeProperty(key)
      }
    }
  }
}

export function StelliveThemeProvider({
  theme = 'light',
  prefix = 'stellive',
  reducedMotion = false,
  as: Component = 'div',
  className,
  style,
  children,
  attachToDocument = false,
  target
}: StelliveThemeProviderProps) {
  const variables = useMemo(() => createCSSVariables({ theme, prefix, reducedMotion }), [theme, prefix, reducedMotion])

  useIsomorphicLayoutEffect(() => {
    if (!attachToDocument) return undefined
    const element = target ?? (typeof document !== 'undefined' ? document.documentElement : null)
    if (!element) return undefined
    const cleanupVars = applyToElement(element, variables)
    const previousThemeAttr = element.getAttribute('data-stellive-theme')
    element.setAttribute('data-stellive-theme', theme)

    return () => {
      cleanupVars()
      if (previousThemeAttr) {
        element.setAttribute('data-stellive-theme', previousThemeAttr)
      } else {
        element.removeAttribute('data-stellive-theme')
      }
    }
  }, [attachToDocument, target, variables, theme])

  if (attachToDocument) {
    return <>{children}</>
  }

  const inlineStyle = useMemo(() => toInlineStyle(variables, style), [variables, style])

  return (
    <Component className={className} style={inlineStyle}>
      {children}
    </Component>
  )
}
