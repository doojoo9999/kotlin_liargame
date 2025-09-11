import {useGameStoreV2} from '@/stores/gameStoreV2'
import {applyServerTimeRemaining, estimateClockOffset} from '@/utils/timeSync'

/**
 * Minimal timer synchronization service placeholder.
 * In a real implementation, backend events would supply phase + remainingSeconds + serverTimestamp.
 */
class TimerService {
  private offset = 0
  private listeners: Array<() => void> = []

  setServerSnapshot(phase: string, remainingSeconds: number, serverNow: number) {
    this.offset = estimateClockOffset(serverNow)
    const adjusted = applyServerTimeRemaining(remainingSeconds, this.offset)
    // Clamp and apply
    useGameStoreV2.setState(s => ({ timeRemaining: adjusted > 0 ? adjusted : 0, phase: s.phase }))
    this.emit()
  }

  onUpdate(fn: () => void) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l!==fn) } }

  getOffset() { return this.offset }

  private emit() { this.listeners.forEach(l => l()) }
}

export const timerService = new TimerService()

