import { RotateCcw, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../../hooks/useLeaderboard';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const Leaderboard = ({ entries, loading, error, onRefresh }: LeaderboardProps) => (
  <div className="glass-panel rounded-2xl p-4 shadow-inner">
    <div className="flex items-center justify-between text-slate-200">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-300" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leaderboard</p>
          <p className="text-lg font-semibold">Top players</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
      >
        <RotateCcw size={14} />
      </button>
    </div>
    <div className="mt-3 space-y-2 text-sm">
      {loading ? <p className="text-slate-400">Loading...</p> : null}
      {error ? <p className="text-rose-300">불러오기 실패: {error}</p> : null}
      {!loading && !entries.length ? <p className="text-slate-400">점수를 기록해 첫 랭킹을 채워보세요.</p> : null}
      {entries.slice(0, 5).map((entry, idx) => (
        <div
          key={`${entry.name}-${idx}`}
          className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2"
          style={entry.isSelf ? { border: '1px solid rgba(125, 211, 252, 0.4)' } : undefined}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">#{entry.rank ?? idx + 1}</span>
            <span className="font-semibold text-white">{entry.name}</span>
          </div>
          <div className="text-right">
            <span className="block font-semibold text-slate-100">{entry.score.toLocaleString()}</span>
            {entry.comboMax ? <span className="text-[10px] text-slate-500">Max combo x{entry.comboMax}</span> : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);
