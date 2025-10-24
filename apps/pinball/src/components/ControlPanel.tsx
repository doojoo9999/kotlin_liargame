import type {WinCondition} from '../types'

interface ControlPanelProps {
  winCondition: WinCondition
  onChangeWinCondition: (mode: WinCondition) => void
  onStart: () => void
  onReset: () => void
  isRunning: boolean
  canStart: boolean
}

export function ControlPanel({
  winCondition,
  onChangeWinCondition,
  onStart,
  onReset,
  isRunning,
  canStart,
}: ControlPanelProps) {
  return (
    <section className="panel control-panel">
      <header className="panel-header">
        <h2>라운드 제어</h2>
      </header>
      <div className="control-grid">
        <div className="control-group">
          <span className="control-label">승리 조건</span>
          <div className="segment-control">
            <button
              className={winCondition === 'last-survivor' ? 'is-active' : ''}
              onClick={() => onChangeWinCondition('last-survivor')}
              type="button"
            >
              최후의 생존
            </button>
            <button
              className={winCondition === 'first-drop' ? 'is-active' : ''}
              onClick={() => onChangeWinCondition('first-drop')}
              type="button"
            >
              첫 낙하
            </button>
          </div>
        </div>
        <div className="control-actions">
          <button
            className="secondary-button"
            disabled={isRunning}
            onClick={onReset}
            type="button"
          >
            초기화
          </button>
          <button
            className="primary-button"
            disabled={!canStart || isRunning}
            onClick={onStart}
            type="button"
          >
            {isRunning ? '진행 중…' : '라운드 시작'}
          </button>
        </div>
      </div>
    </section>
  )
}
