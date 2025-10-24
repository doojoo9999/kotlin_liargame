export const participantColor = (hue: number, alpha = 0.85) =>
  `hsla(${Math.round(hue % 360)}, 82%, 62%, ${alpha})`

export const participantOutline = (hue: number) =>
  `hsla(${Math.round(hue % 360)}, 90%, 75%, 1)`
