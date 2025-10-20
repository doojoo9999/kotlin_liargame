import {CSSProperties, useMemo} from 'react';
import {WheelSegment} from '../utils/wheel';
import {StageDefinition} from '../types';
import './RouletteWheel.css';

interface RouletteWheelProps {
  segments: WheelSegment[];
  rotation: number;
  isSpinning: boolean;
  onSpin: () => void;
  disabled: boolean;
  stage: StageDefinition;
  eventSummaries: string[];
}

const formatAngle = (angle: number) => `${angle.toFixed(3)}deg`;

export function RouletteWheel({
  segments,
  rotation,
  isSpinning,
  onSpin,
  disabled,
  stage,
  eventSummaries,
}: RouletteWheelProps) {
  const gradient = useMemo(() => {
    if (!segments.length) return 'conic-gradient(from -90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.15))';
    const slices = segments.map((segment) => {
      const color = `hsl(${segment.participant.colorHue}deg 85% 55%)`;
      return `${color} ${formatAngle(segment.startAngle)} ${formatAngle(segment.endAngle)}`;
    });
    return `conic-gradient(from -90deg, ${slices.join(', ')})`;
  }, [segments]);

  return (
    <section className="wheel-panel">
      <header className="panel__header">
        <h2>Roulette</h2>
        <p className="panel__hint">Spin to crown up to three winners.</p>
      </header>
      <div className="wheel-stage" style={{ '--stage-accent': stage.palette.accent } as CSSProperties}>
        <div className="wheel-wrap">
          <div
            className={`wheel ${isSpinning ? 'spinning' : ''}`}
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {segments.map((segment) => (
              <div
                key={segment.participant.id}
                className="wheel-label"
                style={{
                  transform: `rotate(${segment.labelAngle}deg) translateY(-45%) rotate(${-segment.labelAngle}deg)`,
                }}
              >
                <span>{segment.participant.name}</span>
              </div>
            ))}
          </div>
          <div className="wheel-center">Spin</div>
          <div className="wheel-pointer" />
        </div>
        <div className="wheel-actions">
          <button type="button" className="btn primary" onClick={onSpin} disabled={disabled}>
            {isSpinning ? 'Spinning…' : 'Spin Round'}
          </button>
          <div className="event-badges">
            {eventSummaries.map((summary, index) => (
              <span key={`${summary}-${index}`} className="event-badge">
                {summary}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
