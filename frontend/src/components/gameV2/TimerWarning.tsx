import React from 'react'

export function TimerWarning({ seconds }: { seconds: number }) {
  if (seconds > 10) return null
  const color = seconds <= 5 ? 'text-red-600' : 'text-yellow-600'
  return (
    <div className={`text-sm ${color}`} role="status" aria-live="polite">
      남은 시간 {seconds}초! 서둘러 주세요.
    </div>
  )
}
export function estimateClockOffset(serverNowEpochMs: number): number {
  // 클라이언트-서버 시간차(원격시각 - 로컬시각)
  return serverNowEpochMs - Date.now()
}

export function applyServerTimeRemaining(serverRemainingSec: number, offsetMs: number): number {
  // 단순 보정(향후 드리프트/RTT 반영 가능)
  return Math.max(0, Math.round(serverRemainingSec - offsetMs / 1000))
}

