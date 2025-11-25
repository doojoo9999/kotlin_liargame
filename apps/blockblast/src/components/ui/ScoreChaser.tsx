interface ScoreChaserProps {
  score: number;
  personalBest: number;
  rivalName?: string;
  rivalScore?: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const ScoreChaser = ({ score, personalBest, rivalName = 'Friend', rivalScore }: ScoreChaserProps) => {
  const target = Math.max(personalBest, rivalScore ?? 0, score || 1);
  const progress = clamp01(score / (target || 1));

  const bestPos = clamp01(personalBest / (target || 1));
  const rivalPos = rivalScore ? clamp01(rivalScore / (target || 1)) : null;

  const passedRival = rivalScore ? score >= rivalScore : false;
  const passedBest = score >= personalBest && personalBest > 0;

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-inner">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Friend Chaser</p>
          <p className="font-semibold">Push past your rival</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>Best: {personalBest.toLocaleString()}</p>
          {rivalScore ? <p>{rivalName}: {rivalScore.toLocaleString()}</p> : null}
        </div>
      </div>

      <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-300"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />

        <div
          className="absolute -top-1 h-5 w-[2px] bg-amber-300 shadow-glow"
          style={{ left: `${bestPos * 100}%` }}
          title="Your best"
        />
        {rivalPos !== null ? (
          <div
            className="absolute -top-1 h-5 w-[2px] bg-fuchsia-300 shadow-glow"
            style={{ left: `${rivalPos * 100}%` }}
            title={`${rivalName}'s score`}
          />
        ) : null}
        {passedRival ? <span className="absolute -right-2 -top-4 animate-bounce text-lg">🎆</span> : null}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
        <span>{score.toLocaleString()} pts</span>
        <span className={passedRival ? 'text-fuchsia-200' : undefined}>
          {rivalScore ? (passedRival ? 'You passed them!' : `Chasing ${rivalName}`) : 'Set the pace'}
        </span>
        <span className={passedBest ? 'text-amber-200' : undefined}>{passedBest ? 'New personal best!' : 'PR target'}</span>
      </div>
    </div>
  );
};
