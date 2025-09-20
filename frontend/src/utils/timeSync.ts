/**
 * Estimate the clock offset between server and client clocks.
 * Positive value means the server clock is ahead of the client.
 * @param serverNowMs Milliseconds timestamp reported by server (Date.now() on server)
 * @param clientNowMs Optional client timestamp (defaults to Date.now())
 */
export function estimateClockOffset(serverNowMs: number, clientNowMs: number = Date.now()): number {
  return serverNowMs - clientNowMs
}

/**
 * Apply the clock offset to a server-reported remaining time (in seconds)
 * If the server is ahead (positive offset), we subtract that many whole seconds locally
 * so the local timer finishes in sync. If the server is behind (negative offset), this will
 * effectively extend the local remaining time.
 * @param serverRemainingSeconds Remaining time in seconds as reported by server
 * @param offsetMs Offset from estimateClockOffset (serverNow - clientNow)
 */
export function applyServerTimeRemaining(serverRemainingSeconds: number, offsetMs: number): number {
  const adjustSeconds = Math.floor(offsetMs / 1000)
  const adjusted = serverRemainingSeconds - adjustSeconds
  return adjusted < 0 ? 0 : adjusted
}
