import type {EliminationEvent, Participant, SimulationResult, WinCondition} from '../types'
import {participantColor} from '../utils/colors'

interface ResultsPanelProps {
  log: EliminationEvent[]
  participants: Participant[]
  winCondition: WinCondition
  result: SimulationResult | null
  isRunning: boolean
}

export function ResultsPanel({
  log,
  participants,
  winCondition,
  result,
  isRunning,
}: ResultsPanelProps) {
  const participantById = new Map(participants.map((participant) => [participant.id, participant]))

  const winner =
    result?.winnerParticipantId != null ? participantById.get(result.winnerParticipantId) : null

  return (
    <section className="panel result-panel">
      <header className="panel-header">
        <div>
          <h2>라운드 결과</h2>
          <p>낙하 순서를 기록하고 승자를 표시합니다.</p>
        </div>
      </header>

      <div className="winner-banner">
        {winner ? (
          <>
            <span className="winner-label">
              {winCondition === 'first-drop' ? '첫 낙하 승자' : '최후의 생존자'}
            </span>
            <strong
              className="winner-name"
              style={{background: participantColor(winner.colorHue, 0.4)}}
            >
              {winner.name}
            </strong>
          </>
        ) : (
          <span>{isRunning ? '라운드 진행 중…' : '아직 결과가 없습니다.'}</span>
        )}
      </div>

      <ol className="elimination-log">
        {log.map((entry) => {
          const participant = participantById.get(entry.participantId)
          return (
            <li key={entry.ballId}>
              <span className="order">#{entry.order}</span>
              <span className="name">{participant?.name ?? '???'}</span>
              <span className="reason">
                {entry.reason === 'drain' ? '드레인' : '필드 이탈'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
