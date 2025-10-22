import {useMemo, useState} from 'react';
import type {Participant} from '../types';
import {PARTICIPANT_ENTRY_REGEX} from '../utils/participants';
import './ParticipantPanel.css';

interface ParticipantPanelProps {
  participants: Participant[];
  onAddEntries: (text: string) => void;
  onUpdateParticipant: (
    id: string,
    updates: Partial<Pick<Participant, 'entryCount' | 'isActive'>>,
  ) => void;
  onRemoveParticipant: (id: string) => void;
  onClearParticipants: () => void;
}

export function ParticipantPanel({
  participants,
  onAddEntries,
  onUpdateParticipant,
  onRemoveParticipant,
  onClearParticipants,
}: ParticipantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalTickets = useMemo(
    () =>
      participants
        .filter((participant) => participant.isActive)
        .reduce((sum, participant) => sum + participant.entryCount, 0),
    [participants],
  );

  const handleClear = () => {
    onClearParticipants();
    setInputValue('');
    setErrorMessage(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const raw = inputValue.trim();
    if (!raw) {
      setErrorMessage(null);
      return;
    }

    const tokens = raw
      .split(/[\n,]+/g)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const invalid = tokens.find((token) => !PARTICIPANT_ENTRY_REGEX.test(token));
    if (invalid) {
      setErrorMessage('이름만 입력하거나 쉼표로 구분해 주세요.');
      return;
    }

    onAddEntries(raw);
    setInputValue('');
    setErrorMessage(null);
  };

  return (
    <section className="panel participants-panel">
      <header className="panel__header">
        <h2>참가자 관리</h2>
        <p className="panel__hint">
          이름만 입력한 뒤 엔터 또는 쉼표로 구분해 빠르게 추가하세요. 투표 수는 아래에서 조절할 수 있습니다.
        </p>
      </header>

      <form className="participant-form" onSubmit={handleSubmit}>
        <div className="participant-form__input">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="바나나, 딸기, 사과"
            data-testid="participant-input"
          />
          <button type="submit" className="btn primary" data-testid="participant-submit">
            이름 추가
          </button>
        </div>
        <div className="participant-form__actions">
          <span className="participant-form__hint">입력 후 엔터 또는 버튼으로 즉시 추가됩니다.</span>
          <button type="button" className="btn ghost" onClick={handleClear}>
            전체 삭제
          </button>
        </div>
        {errorMessage && <p className="participant-form__error">{errorMessage}</p>}
      </form>

      <div className="participant-table">
        {participants.length === 0 ? (
          <p className="empty-state">이름을 추가한 뒤 룰렛을 돌려보세요.</p>
        ) : (
          participants.map((participant) => (
            <div className="participant-row" key={participant.id} data-testid="participant-row">
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
                    <span>표 {participant.entryCount}장</span>
                    {totalTickets > 0 && (
                      <span>
                        비율{' '}
                        {((participant.entryCount * 100) / totalTickets).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="participant-row__controls">
                <label className="count-input">
                  <span>표 수정</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={participant.entryCount}
                    onChange={(event) =>
                      onUpdateParticipant(participant.id, {
                        entryCount: Math.max(1, Math.round(Number(event.target.value) || 1)),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onRemoveParticipant(participant.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="panel__footer">
        <span>
          총 투표 수: <strong>{totalTickets}</strong>
        </span>
      </footer>
    </section>
  );
}
