import type {CSSProperties} from 'react';
import {useMemo} from 'react';
import {buildWheelSegments} from '../utils/wheel';
import type {Participant, StageDefinition} from '../types';
import './RouletteWheel.css';

interface RouletteWheelProps {
  participants: Participant[];
  rotation: number;
  isSpinning: boolean;
  onSpin: () => void;
  disabled: boolean;
  stage: StageDefinition;
  eventSummaries: string[];
}

const RADIUS = 100;

export function RouletteWheel({
  participants,
  rotation,
  isSpinning,
  onSpin,
  disabled,
  stage,
  eventSummaries,
}: RouletteWheelProps) {
  const segments = useMemo(() => buildWheelSegments(participants), [participants]);

  const paths = useMemo(() => {
    if (!segments.length) {
      return [
        {
          id: 'empty',
          path: `M 0 0 L 0 -${RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 0 ${RADIUS} Z`,
          color: 'rgba(255,255,255,0.08)',
        },
      ];
    }

    const computed = segments.map((segment) => {
      const start = (segment.startAngle - 90) * (Math.PI / 180);
      const end = (segment.endAngle - 90) * (Math.PI / 180);
      const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
      const startX = Math.cos(start) * RADIUS;
      const startY = Math.sin(start) * RADIUS;
      const endX = Math.cos(end) * RADIUS;
      const endY = Math.sin(end) * RADIUS;

      return {
        id: segment.participant.id,
        path: [
          'M 0 0',
          `L ${startX.toFixed(3)} ${startY.toFixed(3)}`,
          `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX.toFixed(3)} ${endY.toFixed(3)}`,
          'Z',
        ].join(' '),
        color: `hsl(${segment.participant.colorHue.toFixed(2)}deg, 78%, 58%)`,
      };
    });
    return computed;
  }, [segments]);

  return (
    <section className="wheel-panel">
      <header className="panel__header">
        <h2>룰렛</h2>
        <p className="panel__hint">추첨권 비율에 따라 한 번에 한 명의 우승자가 결정됩니다.</p>
      </header>
      <div className="wheel-stage" style={{ '--stage-accent': stage.palette.accent } as CSSProperties}>
        <div className="wheel-wrap">
          <div
            className={`wheel ${isSpinning ? 'spinning' : ''}`}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <svg
              viewBox={`${-RADIUS} ${-RADIUS} ${RADIUS * 2} ${RADIUS * 2}`}
              preserveAspectRatio="xMidYMid meet"
              data-testid="wheel-svg"
            >
              {paths.map((segment) => (
                <path
                  key={segment.id}
                  d={segment.path}
                  fill={segment.color}
                  stroke="rgba(5,8,14,0.35)"
                  strokeWidth="0.5"
                  data-testid="wheel-segment"
                />
              ))}
            </svg>
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
          <div className="wheel-center">스핀</div>
          <div className="wheel-pointer" />
        </div>
        <div className="wheel-actions">
          <button type="button" className="btn primary" onClick={onSpin} disabled={disabled}>
            {isSpinning ? '스핀 중...' : '룰렛 돌리기'}
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
