import {Participant, WinnerResult} from '../types';
import './Scoreboard.css';

interface ScoreboardProps {
  participants: Participant[];
  lastResults: WinnerResult[];
  roundCount: number;
}

const placementLabel = ['🥇', '🥈', '🥉'];

export function Scoreboard({ participants, lastResults, roundCount }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const winnerMap = new Map(lastResults.map((result) => [result.participantId, result]));

  return (
    <section className="panel scoreboard-panel">
      <header className="panel__header">
        <h2>Scoreboard</h2>
        <p className="panel__hint">Round {roundCount}</p>
      </header>
      <div className="scoreboard-list">
        {sorted.length === 0 ? (
          <p className="empty-state">Waiting for contenders…</p>
        ) : (
          sorted.map((participant, index) => {
            const result = winnerMap.get(participant.id);
            return (
              <div className={`score-row ${result ? 'highlight' : ''}`} key={participant.id}>
                <div className="score-rank">
                  <span>{index + 1}</span>
                </div>
                <div className="score-name">
                  <strong>{participant.name}</strong>
                  <div className="score-meta">
                    {result && placementLabel[result.placement]}
                    {participant.streak >= 2 && <span>{participant.streak}× streak</span>}
                  </div>
                </div>
                <div className="score-points">
                  <span>{participant.points}</span>
                  {result && result.pointsEarned > 0 && (
                    <small>+{result.pointsEarned}</small>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
