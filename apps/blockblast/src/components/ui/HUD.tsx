import { Flame, RotateCcw, RefreshCw } from 'lucide-react';
import { useHUD as useHUDState } from '../../stores/useGameStore';

interface HUDProps {
  onReset: () => void;
  onRefresh: () => void;
}

export const HUD = ({ onReset, onRefresh }: HUDProps) => {
  const { score, combo, comboMax, status } = useHUDState();

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-glow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
          <p className="text-lg font-semibold text-slate-50">{status === 'playing' ? 'In Progress' : 'Game Over'}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl bg-highlight/40 px-3 py-2 text-sm font-semibold text-slate-50 transition hover:bg-highlight/60"
          >
            <RefreshCw size={16} className="inline-block" /> Refresh Tray
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl bg-blue-500/80 px-3 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-blue-500"
          >
            <RotateCcw size={16} className="inline-block" /> Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center md:grid-cols-4">
        <div className="rounded-xl bg-panel/60 p-3 shadow-inner">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p>
          <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-panel/60 p-3 shadow-inner">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Combo</p>
          <p className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-300">
            <Flame size={18} />x{combo}
          </p>
        </div>
        <div className="rounded-xl bg-panel/60 p-3 shadow-inner">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Combo</p>
          <p className="text-2xl font-bold text-emerald-200">x{comboMax}</p>
        </div>
        <div className="rounded-xl bg-panel/60 p-3 shadow-inner">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Board</p>
          <p className="text-2xl font-bold text-slate-100">16x16</p>
        </div>
      </div>
    </div>
  );
};
