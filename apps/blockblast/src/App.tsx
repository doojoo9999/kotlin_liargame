import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { GRID_SIZE } from './styles/theme';
import { countAvailablePlacements, countFilledCells } from './utils/grid';
import { useHaptics } from './hooks/useHaptics';
import { usePersonalBest } from './hooks/usePersonalBest';
import { ScoreChaser } from './components/ui/ScoreChaser';

const App = () => {
  const logic = useGameLogic();
  const { lowSpec, showHints, colorblindMode, controlMode } = usePreferences();
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);
  const combo = useGameStore((state) => state.combo);
  const comboMax = useGameStore((state) => state.comboMax);
  const grid = useGameStore((state) => state.grid);
  const tray = useGameStore((state) => state.tray);
  const { play } = useAudio();
  const { entries, loading, error, refresh, submitScore } = useLeaderboard();
  const { best: personalBest, updateBest } = usePersonalBest();
  const haptics = useHaptics();
  const lastSubmittedScore = useRef<number | null>(null);
  const [lastChanceActive, setLastChanceActive] = useState(false);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);
  const feverLevel = useMemo(() => Math.min(1, combo / 6), [combo]);
  const openSlots = useMemo(() => countAvailablePlacements(grid, tray, 6), [grid, tray]);
  const fillRatio = useMemo(() => countFilledCells(grid) / (GRID_SIZE * GRID_SIZE), [grid]);
  const dangerLevel = useMemo(
    () => Math.max(0, Math.min(1, Math.max((3 - openSlots) / 3, (fillRatio - 0.7) / 0.25))),
    [fillRatio, openSlots]
  );
  const rival = useMemo(() => entries.find((entry) => !entry.isSelf), [entries]);
  const dangerLevelRef = useRef(0);

  const handlePlacement = useCallback(
    (cell: { x: number; y: number }) => {
      if (!logic.activeBlockId) return;
      const result = logic.attemptPlacement(logic.activeBlockId, cell.x, cell.y);
      if (!result.success) {
        play('invalid');
        haptics.invalid();
        return;
      }
      play('drop');
      if (result.linesCleared > 0) {
        play('clear');
        haptics.clear();
        if (result.combo > 1) {
          play('combo');
          haptics.comboWave();
        }
      } else {
        haptics.drop();
      }
      if (result.gameOver) {
        setLastChanceActive(true);
      }
    },
    [haptics, logic, play]
  );

  const dragBind = useDragDrop({
    controlMode,
    onMove: (cell) => {
      if (!logic.activeBlockId) return;
      logic.previewPlacement(logic.activeBlockId, cell.x, cell.y);
      haptics.microTick();
    },
    onRelease: (cell) => handlePlacement(cell)
  });

  useEffect(() => {
    if (status === 'gameover') {
      play('gameover');
    }
  }, [play, status]);

  useEffect(() => {
    if (status === 'gameover') {
      setLastChanceActive(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'gameover' && lastSubmittedScore.current !== score) {
      lastSubmittedScore.current = score;
      submitScore(score, comboMax);
      updateBest(score);
    }
    if (status === 'playing') {
      lastSubmittedScore.current = null;
    }
  }, [comboMax, score, status, submitScore, updateBest]);

  useEffect(() => {
    if (!lastChanceActive) return;
    const off = setTimeout(() => setLastChanceActive(false), 650);
    const show = setTimeout(() => setShowGameOverScreen(true), 520);
    return () => {
      clearTimeout(off);
      clearTimeout(show);
    };
  }, [lastChanceActive]);

  useEffect(() => {
    if (dangerLevel > 0.72 && dangerLevelRef.current <= 0.72) {
      haptics.danger();
    }
    dangerLevelRef.current = dangerLevel;
  }, [dangerLevel, haptics]);

  useEffect(() => {
    if (status === 'playing') {
      setShowGameOverScreen(false);
      setLastChanceActive(false);
    }
  }, [status]);

  return (
    <div className={`min-h-screen bg-surface text-slate-100 ${lastChanceActive ? 'last-chance' : ''}`}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60 blur-3xl transition-all duration-500"
        style={{
          background:
            feverLevel > 0
              ? 'radial-gradient(circle at 30% 20%, rgba(255,159,67,0.35), transparent 45%), radial-gradient(circle at 70% 80%, rgba(148,187,233,0.3), transparent 45%)'
              : 'radial-gradient(circle at 20% 20%, rgba(116, 192, 252, 0.2), transparent 35%)',
          transform: `scale(${1 + feverLevel * 0.1})`
        }}
      />
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
          {dangerLevel > 0 ? (
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-3xl transition-all duration-300"
              style={{
                boxShadow: `0 0 0 999px rgba(248,113,113,${0.08 + dangerLevel * 0.2}) inset`,
                background: `radial-gradient(circle at 50% 50%, rgba(248,113,113,${
                  0.05 + dangerLevel * 0.2
                }), transparent 50%)`
              }}
            />
          ) : null}
          <div className="grid-overlay pointer-events-none absolute inset-0" />
          <div className="relative aspect-[4/3]">
            <GameScene
              logic={logic}
              showGhost={showHints}
              lowSpec={lowSpec}
              trayBlock={logic.findBlock(logic.activeBlockId)}
              usePatterns={colorblindMode}
              feverLevel={feverLevel}
            />
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
              haptics.microTick();
            }}
            onRotate={(id) => {
              logic.rotateBlock(id);
              play('pick');
              haptics.microTick();
            }}
          />
          <ScoreChaser score={score} personalBest={personalBest} rivalName={rival?.name} rivalScore={rival?.score} />
          <Settings />
          <Leaderboard entries={entries} loading={loading} error={error} onRefresh={refresh} />
        </section>
      </main>

      {showGameOverScreen ? <GameOver score={score} comboMax={comboMax} onRestart={logic.reset} /> : null}
    </div>
  );
};

export default App;
