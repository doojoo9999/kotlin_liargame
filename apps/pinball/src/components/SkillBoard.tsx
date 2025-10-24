import type {Participant, ResolvedSkill} from '../types'

interface SkillBoardProps {
  skills: ResolvedSkill[]
  enabled: boolean
  participants: Participant[]
  onToggleEnabled: () => void
  onRedraw: () => void
}

const rarityLabel: Record<ResolvedSkill['rarity'], string> = {
  common: '일반',
  rare: '희귀',
}

export function SkillBoard({
  skills,
  enabled,
  participants,
  onToggleEnabled,
  onRedraw,
}: SkillBoardProps) {
  const participantById = new Map(participants.map((participant) => [participant.id, participant]))

  return (
    <section className="panel skill-panel">
      <header className="panel-header">
        <div>
          <h2>스킬 이벤트</h2>
          <p>한 라운드마다 무작위 스킬을 적용해 변수를 만들어 보세요.</p>
        </div>
        <div className="panel-actions">
          <label className="toggle">
            <input
              checked={enabled}
              onChange={onToggleEnabled}
              type="checkbox"
            />
            <span>활성화</span>
          </label>
          <button
            className="ghost-button"
            disabled={!enabled}
            onClick={onRedraw}
            type="button"
          >
            스킬 새로고침
          </button>
        </div>
      </header>

      <div className={`skill-grid ${skills.length ? '' : 'is-empty'}`}>
        {enabled && skills.length > 0 ? (
          skills.map((skill) => {
            const target = skill.targetParticipantId
              ? participantById.get(skill.targetParticipantId)
              : null
            return (
              <article
                className={`skill-card skill-card--${skill.rarity}`}
                key={skill.id}
              >
                <header>
                  <span className="skill-rarity">{rarityLabel[skill.rarity]}</span>
                  <h3>{skill.name}</h3>
                </header>
                <p className="skill-summary">{skill.summary}</p>
                <p className="skill-description">{skill.description}</p>
                {target ? (
                  <div className="skill-target">
                    대상: <strong>{target.name}</strong>
                  </div>
                ) : null}
              </article>
            )
          })
        ) : (
          <div className="skill-empty">
            {enabled ? '적용 가능한 참가자가 없어 스킬을 선택할 수 없습니다.' : '비활성화됨'}
          </div>
        )}
      </div>
    </section>
  )
}
