import {Participant, WinnerResult} from '../types';
import './ResultsPanel.css';

interface ResultsPanelProps {
  participants: Participant[];
  results: WinnerResult[];
}

const medalLabels = ['First', 'Second', 'Third'];

export function ResultsPanel({ participants, results }: ResultsPanelProps) {
  if (!results.length) {
    return null;
  }

  const lookup = new Map(participants.map((participant) => [participant.id, participant]));

  return (
    <section className="panel results-panel">
      <header className="panel__header">
        <h2>Last Spin</h2>
      </header>
      <div className="results-grid">
        {results.map((result) => {
          const participant = lookup.get(result.participantId);
          if (!participant) return null;

          return (
            <article className={`result-card placement-${result.placement}`} key={participant.id}>
              <span className="result-medal">{medalLabels[result.placement]}</span>
              <strong>{participant.name}</strong>
              <span className="result-points">+{result.pointsEarned} pts</span>
              {result.streak >= 2 && <span className="result-streak">{result.streak}× streak!</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
