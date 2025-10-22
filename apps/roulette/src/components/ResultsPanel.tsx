import type {Participant} from '../types';
import './ResultsPanel.css';

interface ResultsPanelProps {
  participants: Participant[];
  winnerId: string | null;
}

const formatShare = (value: number) => `${value.toFixed(1)}%`;

export function ResultsPanel({participants, winnerId}: ResultsPanelProps) {
  if (!winnerId) {
    return (
      <section className="panel results-panel">
        <header className="panel__header">
          <h2>최근 우승자</h2>
        </header>
        <p className="empty-state">아직 스핀 기록이 없습니다.</p>
      </section>
    );
  }

  const winner = participants.find((participant) => participant.id === winnerId);
  if (!winner) {
    return null;
  }

  const totalTickets = participants
    .filter((participant) => participant.isActive)
    .reduce((sum, participant) => sum + participant.entryCount, 0);

  const share = totalTickets > 0 ? (winner.entryCount / totalTickets) * 100 : 0;

  return (
    <section className="panel results-panel">
      <header className="panel__header">
        <h2>최근 우승자</h2>
      </header>
      <article className="result-card placement-0">
        <span className="result-medal">🏆</span>
        <strong>{winner.name}</strong>
        <dl className="result-meta">
          <div>
            <dt>추첨 티켓</dt>
            <dd>{winner.entryCount}장</dd>
          </div>
          <div>
            <dt>총 비율</dt>
            <dd>{formatShare(share)}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
