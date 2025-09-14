import React from 'react'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {GamePhaseIndicator} from './GamePhaseIndicator'
import {ModeratorCommentary} from './ModeratorCommentary'
import {Card, CardContent} from '@/components/ui/card'
import {WaitingPhase} from './phases/WaitingPhase'
import {HintPhase} from './phases/HintPhase'
import {VotingPhase} from './phases/VotingPhase'
import {DefensePhase} from './phases/DefensePhase'
import {SurvivalVotePhase} from './phases/SurvivalVotePhase'
import {GuessPhase} from './phases/GuessPhase'
import {ResultsPhase} from './phases/ResultsPhase'
import {PlayerStatusPanelV2} from './PlayerStatusPanelV2'
import {ActivityFeedV2} from './ActivityFeedV2'
import {ScoreBoardV2} from './ScoreBoardV2'

export function GameFlowManagerV2() {
  const s = useGameStoreV2()

  // Memoize score board entries to prevent unnecessary recalculations
  const scoreBoardEntries = React.useMemo(() =>
    s.players.map(player => ({
      id: player.id,
      nickname: player.nickname,
      score: s.scores[player.id] || 0,
      isCurrentPlayer: player.id === s.currentPlayer
    })), [s.players, s.scores, s.currentPlayer])

  const mainContent = () => {
    switch (s.phase) {
      case 'WAITING_FOR_PLAYERS': return <WaitingPhase onStart={s.startGame} />
      case 'SPEECH': return <HintPhase onSubmit={s.submitHint} />
      case 'VOTING_FOR_LIAR': return <VotingPhase players={s.players} onVote={s.castVote} />
      case 'DEFENDING': return <DefensePhase accusedNickname={s.players.find(p => p.id === s.gameData.accusedPlayer)?.nickname} />
      case 'VOTING_FOR_SURVIVAL': return <SurvivalVotePhase />
      case 'GUESSING_WORD': return <GuessPhase />
      case 'GAME_OVER': return <ResultsPhase />
      default: return null
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4" aria-label="게임 화면">
      <div className="hidden lg:grid lg:grid-cols-[260px_1fr_300px] gap-4 min-h-[560px]">
        {/* Left Column */}
        <div aria-label="좌측 패널" className="flex flex-col gap-4">
          <PlayerStatusPanelV2 />
        </div>
        {/* Center Column */}
        <div className="flex flex-col gap-4" aria-label="메인 진행 영역">
          <GamePhaseIndicator phase={s.phase} timeRemaining={s.timeRemaining} />
          <ModeratorCommentary />
          <Card className="flex-1">
            <CardContent className="p-4 min-h-[300px]">
              {mainContent()}
            </CardContent>
          </Card>
          <ScoreBoardV2 entries={scoreBoardEntries} />
        </div>
        {/* Right Column */}
        <div aria-label="활동 및 로그" className="flex flex-col gap-4">
          <ActivityFeedV2 />
        </div>
      </div>

      {/* Mobile / Tablet (stacked) */}
      <div className="lg:hidden space-y-4" aria-label="모바일 레이아웃">
        <GamePhaseIndicator phase={s.phase} timeRemaining={s.timeRemaining} />
        <ModeratorCommentary />
        <Card>
          <CardContent className="p-4 space-y-4">
            {mainContent()}
          </CardContent>
        </Card>
        <ScoreBoardV2 entries={scoreBoardEntries} />
        <PlayerStatusPanelV2 />
        <ActivityFeedV2 />
      </div>
    </div>
  )
}
