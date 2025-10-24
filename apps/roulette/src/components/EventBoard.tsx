import type {CSSProperties} from 'react';
import type {ResolvedEvent, StageDefinition} from '../types';
import './EventBoard.css';

interface EventBoardProps {
  stage: StageDefinition;
  events: ResolvedEvent[];
  eventsEnabled: boolean;
  onReroll: (index: number) => void;
  onRefresh: () => void;
  onToggleEvents: () => void;
  disabled: boolean;
}

export function EventBoard({
  stage,
  events,
  eventsEnabled,
  onReroll,
  onRefresh,
  onToggleEvents,
  disabled,
}: EventBoardProps) {
  const toggleLabel = eventsEnabled ? '이벤트 비활성화' : '이벤트 활성화';

  return (
    <section className="panel event-panel">
      <header className="panel__header">
        <h2>이벤트 카드</h2>
        <div className="panel__actions">
          <button type="button" className="btn ghost" onClick={onToggleEvents} disabled={disabled}>
            {toggleLabel}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={onRefresh}
            disabled={disabled || !eventsEnabled}
          >
            전체 새로뽑기
          </button>
        </div>
      </header>
      <div className="event-grid">
        {!eventsEnabled ? (
          <p className="empty-state">이벤트 모드가 꺼졌습니다. 순수 룰렛으로 진행합니다.</p>
        ) : events.length === 0 ? (
          <p className="empty-state">참가자를 추가하면 이벤트가 표시됩니다.</p>
        ) : (
          events.map((event, index) => (
            <article
              key={`${event.card.id}-${index}`}
              className="event-card"
              style={
                {
                  '--event-accent': stage.palette.accent,
                } as CSSProperties
              }
            >
              <div className="event-card__header">
                <h3>{event.card.title}</h3>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => onReroll(index)}
                  disabled={disabled || !eventsEnabled}
                >
                  교체
                </button>
              </div>
              <p className="event-card__description">{event.card.description}</p>
              <footer>{event.summary}</footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
