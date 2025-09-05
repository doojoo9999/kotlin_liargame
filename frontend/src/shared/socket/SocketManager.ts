// Minimal SocketManager stub for Step 1 (syntax/config stabilization)
// Provides subscribe/publish signatures used by ChatDebugInfo.

export interface Subscription {
  destination: string;
  callback: (message: unknown) => void;
}

class SimpleSocketManager {
  private subscriptions: Subscription[] = [];

  async subscribe(destination: string, callback: (message: unknown) => void): Promise<void> {
    this.subscriptions.push({ destination, callback });
    // Simulate async subscription
    return Promise.resolve();
  }

  async publish(destination: string, body: string): Promise<void> {
    // Immediately echo back to any matching subscription for debug visibility.
    const payload = { destination, body, timestamp: Date.now() };
    this.subscriptions
      .filter(s => s.destination === destination)
      .forEach(s => {
        try { s.callback(payload); } catch { /* swallow for stub */ }
      });
    return Promise.resolve();
  }
}

export const socketManager = new SimpleSocketManager();

