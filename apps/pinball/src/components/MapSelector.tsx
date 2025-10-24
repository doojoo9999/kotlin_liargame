import type {CSSProperties} from 'react'
import type {MapDefinition} from '../types'

const difficultyLabel: Record<MapDefinition['difficulty'], string> = {
  casual: '캐주얼',
  standard: '표준',
  chaos: '카오스',
}

interface MapSelectorProps {
  maps: MapDefinition[]
  activeId: string
  onSelect: (id: string) => void
}

export function MapSelector({maps, activeId, onSelect}: MapSelectorProps) {
  return (
    <section className="panel map-panel">
      <header className="panel-header">
        <div>
          <h2>맵 설정</h2>
          <p>각 맵은 중력과 장애물이 다르게 구성되어 있습니다.</p>
        </div>
      </header>
      <div className="map-grid">
        {maps.map((map) => {
          const isActive = map.id === activeId
          return (
            <button
              className={`map-card ${isActive ? 'is-active' : ''}`}
              key={map.id}
              onClick={() => onSelect(map.id)}
              style={{
                '--accent-color': map.background.accent,
              } as CSSProperties}
              type="button"
            >
              <div className="map-card__header">
                <span className="map-difficulty">{difficultyLabel[map.difficulty]}</span>
                <h3>{map.name}</h3>
              </div>
              <p className="map-description">{map.description}</p>
              <dl className="map-meta">
                <div>
                  <dt>중력</dt>
                  <dd>{map.gravityScale.toFixed(2)}g</dd>
                </div>
                <div>
                  <dt>가로 x 세로</dt>
                  <dd>
                    {map.size.width} × {map.size.height}
                  </dd>
                </div>
                <div>
                  <dt>스폰 슬롯</dt>
                  <dd>{map.spawnSlots.length}개</dd>
                </div>
              </dl>
            </button>
          )
        })}
      </div>
    </section>
  )
}
