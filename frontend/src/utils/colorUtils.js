const USER_COLOR_PALETTE = [
  '#1976d2', // Blue
  '#d32f2f', // Red
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#0288d1', // Light Blue
  '#c2185b', // Pink
  '#689f38', // Light Green
  '#e64a19', // Deep Orange
  '#5e35b1', // Deep Purple
  '#0097a7', // Cyan
  '#795548', // Brown
  '#455a64', // Blue Grey
  '#8bc34a', // Lime
  '#ff5722', // Red Orange
  '#9c27b0', // Purple
  '#009688', // Teal
  '#ff9800', // Amber
  '#607d8b', // Blue Grey
  '#4caf50'  // Success Green
]

export const getUserColor = (userId) => {
  if (!userId) return USER_COLOR_PALETTE[0]
  
  const userStr = String(userId)
  let hash = 0
  
  for (let i = 0; i < userStr.length; i++) {
    const char = userStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const colorIndex = Math.abs(hash) % USER_COLOR_PALETTE.length
  return USER_COLOR_PALETTE[colorIndex]
}

export const getColorWithAlpha = (baseColor, alpha) => {
  const hex = baseColor.replace('#', '')
  
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const getUserColorSet = (userId, isDarkMode = false) => {
  const baseColor = getUserColor(userId)
  
  return {
    base: baseColor,
    background: getColorWithAlpha(baseColor, isDarkMode ? 0.15 : 0.1),
    border: getColorWithAlpha(baseColor, isDarkMode ? 0.5 : 0.4),
    text: baseColor,
    textSecondary: getColorWithAlpha(baseColor, isDarkMode ? 0.8 : 0.9)
  }
}

export const getSystemMessageColors = (isDarkMode = false) => {
  const baseColor = isDarkMode ? '#90caf9' : '#1976d2' // Blue variants
  
  return {
    base: baseColor,
    background: getColorWithAlpha(baseColor, isDarkMode ? 0.1 : 0.05),
    border: getColorWithAlpha(baseColor, isDarkMode ? 0.3 : 0.2),
    text: baseColor,
    textSecondary: getColorWithAlpha(baseColor, isDarkMode ? 0.7 : 0.8)
  }
}

export const getAnnouncementColors = (isDarkMode = false) => {
  const baseColor = isDarkMode ? '#ffb74d' : '#f57c00' // Orange variants
  
  return {
    base: baseColor,
    background: getColorWithAlpha(baseColor, isDarkMode ? 0.15 : 0.1),
    border: getColorWithAlpha(baseColor, isDarkMode ? 0.5 : 0.4),
    text: baseColor,
    textSecondary: getColorWithAlpha(baseColor, isDarkMode ? 0.8 : 0.9)
  }
}

export const getContrastRatio = (foreground, background) => {
  const getLuminance = (color) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

export const validateColorAccessibility = (colorSet, backgroundColor = '#ffffff') => {
  const textContrast = getContrastRatio(colorSet.text, backgroundColor)
  const borderContrast = getContrastRatio(colorSet.border, backgroundColor)
  
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return textContrast >= 4.5 && borderContrast >= 3.0
}

export default {
  getUserColor,
  getColorWithAlpha,
  getUserColorSet,
  getSystemMessageColors,
  getAnnouncementColors,
  getContrastRatio,
  validateColorAccessibility
}