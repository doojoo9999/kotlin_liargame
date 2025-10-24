import {useMemo, useState} from 'react'
import type {Participant} from '../types'
import {participantColor} from '../utils/colors'
import {parseParticipantInput} from '../utils/participants'

interface ParticipantPanelProps {
  participants: Participant[]
  onAddParticipants: (entries: {name: string; count: number}[]) => void
  onUpdateParticipant: (
    participantId: string,
    updates: Partial<Pick<Participant, 'entryCount' | 'isActive'>>,
  ) => void
  onRemoveParticipant: (participantId: string) => void
  onClearParticipants: () => void
}

export function ParticipantPanel({
  participants,
  onAddParticipants,
  onUpdateParticipant,
  onRemoveParticipant,
  onClearParticipants,
}: ParticipantPanelProps) {
  const [input, setInput] = useState('')

  const totalEntries = useMemo(
    () =>
      participants
        .filter((participant) => participant.isActive)
        .reduce((sum, participant) => sum + Math.max(0, participant.entryCount), 0),
    [participants],
  )

  const handleAdd = () => {
    const parsed = parseParticipantInput(input)
    if (!parsed.length) return
    onAddParticipants(parsed)
    setInput('')
  }

  return (
    <section className="panel participant-panel">
      <header className="panel-header">
        <div>
          <h2>참가자</h2>
          <p>쉼표 또는 줄바꿈으로 구분하고, `이름 * 3` 형태로 중복 입력이 가능합니다.</p>
        </div>
        <button
          className="ghost-button"
          disabled={!participants.length}
          onClick={onClearParticipants}
          type="button"
        >
          전체 삭제
        </button>
      </header>

      <div className="input-stack">
        <textarea
          aria-label="참가자 입력"
          className="participant-input"
          onChange={(event) => setInput(event.target.value)}
          placeholder="예: 지수, 민재*2, 하린"
          value={input}
        />
        <button
          className="primary-button"
          onClick={handleAdd}
          type="button"
        >
          참가자 추가
        </button>
      </div>

      <ul className="participant-list">
        {participants.map((participant) => (
          <li
            className="participant-item"
            key={participant.id}
          >
            <span
              className="color-chip"
              style={{background: participantColor(participant.colorHue)}}
            />
            <div className="participant-info">
              <strong>{participant.name}</strong>
              <label className="participant-entry">
                볼 수
                <input
                  min={1}
                  onChange={(event) =>
                    onUpdateParticipant(participant.id, {
                      entryCount: Number(event.target.value),
                    })
                  }
                  type="number"
                  value={participant.entryCount}
                />
              </label>
            </div>
            <div className="participant-actions">
              <label className="toggle">
                <input
                  checked={participant.isActive}
                  onChange={(event) =>
                    onUpdateParticipant(participant.id, {isActive: event.target.checked})
                  }
                  type="checkbox"
                />
                <span>활성</span>
              </label>
              <button
                aria-label={`${participant.name} 제거`}
                className="icon-button"
                onClick={() => onRemoveParticipant(participant.id)}
                type="button"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <footer className="panel-footer">
        <strong>활성 참가 수</strong>
        <span>{participants.filter((participant) => participant.isActive).length}명</span>
        <strong>총 볼 개수</strong>
        <span>{totalEntries}개</span>
      </footer>
    </section>
  )
}
