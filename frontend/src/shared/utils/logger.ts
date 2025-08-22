

const LOG_PREFIX = '[Junie]';

const log = (level: 'log' | 'info' | 'warn' | 'error', ...args: unknown[]) => {
    console[level](`${LOG_PREFIX} [${level.toUpperCase()}]`, ...args);
};

const debugLog = (...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.log(`${LOG_PREFIX} [DEBUG]`, ...args);
    }
};

export const logger = {
    log: (...args: unknown[]) => log('log', ...args),
    infoLog: (...args: unknown[]) => log('info', ...args),
    warnLog: (...args: unknown[]) => log('warn', ...args),
    errorLog: (...args: unknown[]) => log('error', ...args),
    debugLog,
};
