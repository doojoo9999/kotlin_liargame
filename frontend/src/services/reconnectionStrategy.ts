// Exponential backoff reconnection strategy (stub)
export interface ReconnectOptions {
  baseDelay?: number; // ms
  maxDelay?: number; // ms
  factor?: number;
  maxAttempts?: number;
}

export class ReconnectStrategy {
  private attempts = 0;
  constructor(private opts: ReconnectOptions = {}) {}
  nextDelay(): number {
    const base = this.opts.baseDelay ?? 1000;
    const factor = this.opts.factor ?? 2;
    const max = this.opts.maxDelay ?? 30000;
    const delay = Math.min(base * Math.pow(factor, this.attempts), max);
    this.attempts += 1;
    return delay;
  }
  reset() { this.attempts = 0; }
  canRetry(): boolean {
    if (!this.opts.maxAttempts) return true;
    return this.attempts < this.opts.maxAttempts;
  }
}

