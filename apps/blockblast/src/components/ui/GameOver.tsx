import { Sparkles } from 'lucide-react';

interface GameOverProps {
  score: number;
  comboMax?: number;
  onRestart: () => void;
}

export const GameOver = ({ score, comboMax, onRestart }: GameOverProps) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-md">
    <div className="glass-panel max-w-md rounded-3xl p-8 text-center shadow-glow">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
        <Sparkles />
      </div>
      <h2 className="text-2xl font-bold text-white">Game Over</h2>
      <p className="mt-2 text-slate-300">Nice run! Your score</p>
      <p className="mt-2 text-4xl font-extrabold text-white">{score.toLocaleString()}</p>
      {comboMax !== undefined ? (
        <p className="mt-2 text-sm text-slate-400">
          Max combo <span className="font-semibold text-amber-200">x{comboMax}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRestart}
        className="mt-6 w-full rounded-xl bg-blue-500 px-4 py-3 text-base font-semibold text-white shadow-glow hover:bg-blue-400"
      >
        Try Again
      </button>
    </div>
  </div>
);
