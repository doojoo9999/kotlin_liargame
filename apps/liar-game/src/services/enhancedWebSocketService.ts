// Legacy enhanced WebSocket service placeholder kept for compatibility.
// The real-time functionality is now handled by unifiedWebSocketService.
// This stub avoids legacy TypeScript errors while we migrate callers.
export interface WebSocketConfig {
  endpoint?: string
}

export class EnhancedWebSocketService {
  private static instance: EnhancedWebSocketService

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private constructor(_config?: WebSocketConfig) {}

  static getInstance(config?: WebSocketConfig): EnhancedWebSocketService {
    if (!EnhancedWebSocketService.instance) {
      EnhancedWebSocketService.instance = new EnhancedWebSocketService(config)
    }
    return EnhancedWebSocketService.instance
  }

  async connect(): Promise<void> {
    return Promise.resolve()
  }

  disconnect(): void {
    // no-op
  }

  isConnected(): boolean {
    return false
  }
}

export const enhancedWebSocketService = EnhancedWebSocketService.getInstance()
export default enhancedWebSocketService
