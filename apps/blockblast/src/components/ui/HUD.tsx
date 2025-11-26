import { Flame, RotateCcw, RefreshCw } from 'lucide-react';
import { useHUD as useHUDState } from '../../stores/useGameStore';

interface HUDProps {
  onReset: () => void;
  onRefresh: () => void;
}

export const HUD = ({ onReset, onRefresh }: HUDProps) => {
  const { combo, comboMax, status } = useHUDState();

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-glow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
          <p className="text-lg font-semibold text-slate-50">{status === 'playing' ? 'In Progress' : 'Game Over'}</p>
          <p className="text-xs text-slate-500">고정 카메라 · 컴팩트 보드</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-white/5 px-3 py-2 text-sm text-amber-200">
            <Flame size={14} className="mr-1 inline-block" /> x{combo} / Max x{comboMax}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-50 transition hover:border-white/20"
          >
            <RefreshCw size={16} className="inline-block" /> 트레이 새로고침
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl bg-blue-500/80 px-3 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-blue-500"
          >
            <RotateCcw size={16} className="inline-block" /> 리셋
          </button>
        </div>
      </div>
    </div>
  );
};
