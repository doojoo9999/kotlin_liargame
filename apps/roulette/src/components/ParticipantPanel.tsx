import {useEffect, useState} from 'react';
import {Participant} from '../types';
import {formatParticipantsForTextarea} from '../utils/participants';
import './ParticipantPanel.css';

interface ParticipantPanelProps {
  participants: Participant[];
  onReplaceParticipants: (text: string) => void;
  onUpdateParticipant: (id: string, updates: Partial<Pick<Participant, 'baseWeight' | 'isActive'>>) => void;
  onRemoveParticipant: (id: string) => void;
  onResetScores: () => void;
}

export function ParticipantPanel({
  participants,
  onReplaceParticipants,
  onUpdateParticipant,
  onRemoveParticipant,
  onResetScores,
}: ParticipantPanelProps) {
  const [draft, setDraft] = useState(() => formatParticipantsForTextarea(participants));

  useEffect(() => {
    setDraft(formatParticipantsForTextarea(participants));
  }, [participants]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onReplaceParticipants(draft);
  };

  return (
    <section className="panel participants-panel">
      <header className="panel__header">
        <h2>Participants</h2>
        <p className="panel__hint">
          Use <code>Name/weight</code> or <code>Name*count</code>. Weight range {`0.5 – 3`}x.
        </p>
      </header>
      <form className="participant-form" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Streamer/1.2&#10;Guest/0.8&#10;Editor*2"
        />
        <div className="participant-form__actions">
          <button type="submit" className="btn primary">
            Apply List
          </button>
          <button type="button" className="btn ghost" onClick={onResetScores}>
            Reset Scores
          </button>
        </div>
      </form>

      <div className="participant-table">
        {participants.length === 0 ? (
          <p className="empty-state">Add contenders to get spinning.</p>
        ) : (
          participants.map((participant) => (
            <div className="participant-row" key={participant.id}>
              <div className="participant-row__identity">
                <span
                  className="participant-color"
                  style={{
                    background: `hsl(${participant.colorHue}deg 85% 55%)`,
                  }}
                />
                <div>
                  <strong>{participant.name}</strong>
                  <div className="meta">
                    <span>{participant.points} pts</span>
                    {participant.streak > 1 && <span>{participant.streak}× streak</span>}
                  </div>
                </div>
              </div>
              <div className="participant-row__controls">
                <label>
                  <span>Weight {participant.baseWeight.toFixed(2)}x</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={participant.baseWeight}
                    onChange={(event) =>
                      onUpdateParticipant(participant.id, {
                        baseWeight: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={participant.isActive}
                    onChange={(event) =>
                      onUpdateParticipant(participant.id, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                  <span>{participant.isActive ? 'Active' : 'Benched'}</span>
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onRemoveParticipant(participant.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

