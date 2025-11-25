import { useCallback, useEffect, useRef } from 'react';
import { GameScene } from './components/canvas/GameScene';
import { HUD } from './components/ui/HUD';
import { TrayPanel } from './components/ui/TrayPanel';
import { Leaderboard } from './components/ui/Leaderboard';
import { Settings } from './components/ui/Settings';
import { Tutorial } from './components/ui/Tutorial';
import { GameOver } from './components/ui/GameOver';
import { useGameStore } from './stores/useGameStore';
import { useGameLogic } from './hooks/useGameLogic';
import { useAudio } from './hooks/useAudio';
import { useDragDrop } from './hooks/useDragDrop';
import { useLeaderboard } from './hooks/useLeaderboard';
import { usePreferences } from './stores/useGameStore';

const App = () => {
  const logic = useGameLogic();
  const { lowSpec, showHints } = usePreferences();
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);
  const comboMax = useGameStore((state) => state.comboMax);
  const { play } = useAudio();
  const { entries, loading, error, refresh, submitScore } = useLeaderboard();
  const lastSubmittedScore = useRef<number | null>(null);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  }, []);

  const handlePlacement = useCallback(
    (cell: { x: number; y: number }) => {
      if (!logic.activeBlockId) return;
      const result = logic.attemptPlacement(logic.activeBlockId, cell.x, cell.y);
      if (!result.success) {
        play('invalid');
        vibrate(40);
        return;
      }
      play('drop');
      if (result.linesCleared > 0) {
        play('clear');
        if (result.combo > 1) play('combo');
        vibrate([20, 40]);
      } else {
        vibrate(15);
      }
    },
    [logic, play, vibrate]
  );

  const dragBind = useDragDrop({
    onMove: (cell) => logic.activeBlockId && logic.previewPlacement(logic.activeBlockId, cell.x, cell.y),
    onRelease: (cell) => handlePlacement(cell)
  });

  useEffect(() => {
    if (status === 'gameover') {
      play('gameover');
    }
  }, [play, status]);

  useEffect(() => {
    if (status === 'gameover' && lastSubmittedScore.current !== score) {
      lastSubmittedScore.current = score;
      submitScore(score, comboMax);
    }
    if (status === 'playing') {
      lastSubmittedScore.current = null;
    }
  }, [comboMax, score, status, submitScore]);

  return (
    <div className="min-h-screen bg-surface text-slate-100">
      <header className="flex flex-col gap-2 px-6 pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Stellive Labs</p>
          <h1 className="text-3xl font-bold text-white">Block Blast (Web)</h1>
          <p className="text-sm text-slate-400">Three.js + R3F sandbox with Zustand state</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">Alpha build</span>
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">16x16 grid</span>
        </div>
      </header>

      <Tutorial />

      <main className="grid grid-cols-1 gap-6 px-6 pb-10 lg:grid-cols-[2fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl shadow-glow">
          <div className="grid-overlay pointer-events-none absolute inset-0" />
          <div className="relative aspect-[4/3]">
            <GameScene logic={logic} showGhost={showHints} lowSpec={lowSpec} trayBlock={logic.findBlock(logic.activeBlockId)} />
            <div
              {...dragBind()}
              className="absolute inset-0"
              style={{ pointerEvents: logic.activeBlockId ? 'auto' : 'none' }}
            />
          </div>
        </section>

        <section className="space-y-4">
          <HUD onReset={logic.reset} onRefresh={logic.refreshTray} />
          <TrayPanel
            blocks={logic.tray}
            activeBlockId={logic.activeBlockId}
            onSelect={(id) => {
              logic.pickBlock(id);
              play('pick');
              vibrate(10);
            }}
            onRotate={(id) => {
              logic.rotateBlock(id);
              play('pick');
            }}
          />
          <Settings />
          <Leaderboard entries={entries} loading={loading} error={error} onRefresh={refresh} />
        </section>
      </main>

      {status === 'gameover' ? <GameOver score={score} comboMax={comboMax} onRestart={logic.reset} /> : null}
    </div>
  );
};

export default App;
