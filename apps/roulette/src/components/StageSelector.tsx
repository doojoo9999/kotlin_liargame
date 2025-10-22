import type {CSSProperties} from 'react';
import type {StageDefinition} from '../types';
import './StageSelector.css';

interface StageSelectorProps {
  stages: StageDefinition[];
  activeStageId: StageDefinition['id'];
  onChange: (stageId: StageDefinition['id']) => void;
}

export function StageSelector({ stages, activeStageId, onChange }: StageSelectorProps) {
  return (
    <section className="panel stage-panel">
      <header className="panel__header">
        <h2>무대 선택</h2>
        <p className="panel__hint">테마다운 색상과 이벤트 구성을 고를 수 있습니다.</p>
      </header>
      <div className="stage-grid">
        {stages.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className={`stage-card ${stage.id === activeStageId ? 'active' : ''}`}
            onClick={() => onChange(stage.id)}
            style={
              {
                '--stage-accent': stage.palette.accent,
                '--stage-muted': stage.palette.muted,
              } as CSSProperties
            }
          >
            <div className="stage-card__accent" />
            <div className="stage-card__content">
              <h3>{stage.name}</h3>
              <p>{stage.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
