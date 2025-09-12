export function ScoreBoardV2() {
  | 'LIAR_ELIMINATED'
  return (
    <div className="rounded border bg-card p-3">
      <div className="font-semibold mb-2">점수판</div>
      <div className="grid grid-cols-2 gap-2">
export interface ScoreChange { playerId: PlayerID; delta: number }
          <div key={e.id} className="flex items-center justify-between text-sm">
            <span>{e.nickname}</span>
            <span className="font-semibold">{e.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
  return changes

