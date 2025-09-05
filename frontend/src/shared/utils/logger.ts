// Minimal logger stub (Step1)
export const logger = {
  info: (...args: any[]) => console.log('[info]', ...args),
  error: (...args: any[]) => console.error('[error]', ...args),
  warn: (...args: any[]) => console.warn('[warn]', ...args),
  debug: (...args: any[]) => console.debug('[debug]', ...args),
  // aliases used elsewhere
  debugLog: (...args: any[]) => console.debug('[debug]', ...args),
  errorLog: (...args: any[]) => console.error('[error]', ...args),
  infoLog: (...args: any[]) => console.log('[info]', ...args),
};
export default logger;
