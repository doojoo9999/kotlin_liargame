// Legacy game service placeholder retained for compatibility with legacy imports.
// The application now relies on api/gameApi.ts (gameService). This stub prevents
// TypeScript errors while the legacy implementation remains unused.

export class EnhancedGameService {
  private static instance: EnhancedGameService

  static getInstance(): EnhancedGameService {
    if (!EnhancedGameService.instance) {
      EnhancedGameService.instance = new EnhancedGameService()
    }
    return EnhancedGameService.instance
  }

  private constructor() {}

  async fetchGameState(): Promise<void> {
    return Promise.resolve()
  }

  async submitAction(): Promise<void> {
    return Promise.resolve()
  }
}

export const enhancedGameService = EnhancedGameService.getInstance()
