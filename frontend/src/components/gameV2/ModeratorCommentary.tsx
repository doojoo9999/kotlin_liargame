import React from 'react'
import type {GamePhase} from '@/types/backendTypes'
import {useGameStoreV2} from '@/stores/gameStoreV2'

export function ModeratorCommentary() {
  // Use individual selectors with useCallback to prevent infinite loops
  const phase = useGameStoreV2(React.useCallback(s => s.phase, []))
  const timeRemaining = useGameStoreV2(React.useCallback(s => s.timeRemaining, []))
  const gameData = useGameStoreV2(React.useCallback(s => s.gameData, []))

  const { msg, tone } = React.useMemo(() => {
    const accused = gameData.accusedPlayer
    const guess = gameData.guessAttempt
    if (gameData.victoryAchieved) return { msg: '게임이 종료되었습니다. 최종 승자를 확인하세요.', tone: 'critical' }
    switch (phase) {
      case 'WAITING_FOR_PLAYERS':
        return { msg: '플레이어가 모이면 게임을 시작할 수 있습니다.', tone: 'info' }
      case 'SPEECH':
        return { msg: '순서대로 힌트를 주세요. 정답 노출은 피하세요.', tone: timeRemaining <= 10 ? 'warning' : 'info' }
      case 'VOTING_FOR_LIAR':
        return { msg: accused ? `지목된 플레이어를 확신하나요? (${accused})` : '가장 의심되는 플레이어에게 투표하세요.', tone: timeRemaining <= 10 ? 'warning' : 'info' }
      case 'DEFENDING':
        return { msg: accused ? '변론을 주의 깊게 듣고 판단하세요.' : '지목 결과를 대기 중...', tone: 'info' }
      case 'VOTING_FOR_SURVIVAL':
        return { msg: '생존 투표로 최종 제거 대상을 결정합니다.', tone: timeRemaining <= 10 ? 'warning' : 'info' }
      case 'GUESSING_WORD':
        return { msg: guess ? '추측이 제출되었습니다. 결과를 기다리세요.' : '라이어는 제한 시간 내 단어를 추측하세요.', tone: timeRemaining <= 10 ? 'warning' : 'info' }
      case 'GAME_OVER':
        return { msg: '라운드 결과를 확인하고 다음 라운드를 준비하세요.', tone: 'success' }
      default:
        return { msg: '진행 정보를 수집 중...', tone: 'info' }
    }
  }, [phase, timeRemaining, gameData])

  const toneStyle: Record<string,string> = {
    info: 'from-blue-50 to-indigo-50 border-blue-100',
    warning: 'from-amber-50 to-yellow-50 border-amber-200',
    critical: 'from-red-50 to-rose-50 border-red-200',
    success: 'from-emerald-50 to-green-50 border-emerald-200'
  }

  return (
    <div className={`p-4 rounded-lg bg-gradient-to-r border text-sm ${toneStyle[tone]||toneStyle.info}`} aria-live="polite">
      {msg}
      {timeRemaining > 0 && ['SPEECH', 'VOTING_FOR_LIAR', 'DEFENDING', 'VOTING_FOR_SURVIVAL', 'GUESSING_WORD'].includes(phase) && (
        <span className="ml-2 text-xs text-muted-foreground">(남은 시간 {timeRemaining}s)</span>
      )}
    </div>
  )
}
