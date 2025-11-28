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
import { preloadAssets } from './game/managers/assets';
import { bindPauseResume } from './game/managers/pause';
import { ASSET_MANIFEST } from './assets/manifest';

const App = () => {
  const logic = useGameLogic();
  const { lowSpec, showHints, colorblindMode, controlMode, rotationEnabled } = usePreferences();
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);
  const combo = useGameStore((state) => state.combo);
  const comboMax = useGameStore((state) => state.comboMax);
  const grid = useGameStore((state) => state.grid);
  const tray = useGameStore((state) => state.tray);
  const paused = useGameStore((state) => state.paused);
  const setPaused = useGameStore((state) => state.setPaused);
  const { play } = useAudio();
  const { entries, loading, error, refresh, submitScore } = useLeaderboard();
  const { best: personalBest, updateBest } = usePersonalBest();
  const haptics = useHaptics();
  const lastSubmittedScore = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [lastChanceActive, setLastChanceActive] = useState(false);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const feverLevel = useMemo(() => Math.min(1, combo / 6), [combo]);
  const openSlots = useMemo(() => countAvailablePlacements(grid, tray, 6), [grid, tray]);
  const fillRatio = useMemo(() => countFilledCells(grid) / (GRID_SIZE * GRID_SIZE), [grid]);
  const dangerLevel = useMemo(
    () => Math.max(0, Math.min(1, Math.max((3 - openSlots) / 3, (fillRatio - 0.7) / 0.25))),
    [fillRatio, openSlots]
  );
  const rival = useMemo(() => entries.find((entry) => !entry.isSelf), [entries]);
  const dangerLevelRef = useRef(0);
  const placeableBlocks = logic.placeableBlocks;
  const [comboFlashKey, setComboFlashKey] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    preloadAssets(ASSET_MANIFEST)
      .then(() => {
        if (mounted) setAssetsReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Asset preload failed', err);
        setAssetError('에셋 로딩에 실패했어요. 새로고침 후 다시 시도해주세요.');
        setAssetsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = bindPauseResume({
      onPause: () => setPaused(true),
      onResume: () => setPaused(false)
    });
    return cleanup;
  }, [setPaused]);

  const handlePlacement = useCallback(
    (cell: { x: number; y: number }) => {
      if (paused) return;
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
    [haptics, logic, paused, play]
  );

  const dragBind = useDragDrop({
    controlMode,
    enabled: !paused,
    boundsRef: boardRef,
    invertX: true,
    invertY: true,
    onStart: (cell, [blockId]) => {
      if (typeof blockId !== 'string') return;
      if (!cell.inside) {
        logic.clearGhost();
      }
      if (logic.activeBlockId !== blockId) {
        logic.pickBlock(blockId);
        play('pick');
        haptics.microTick();
      }
    },
    onMove: (cell, [blockId]) => {
      if (paused) return;
      const id = typeof blockId === 'string' ? blockId : logic.activeBlockId;
      if (!id) return;
      if (!cell.inside) return;
      logic.previewPlacement(id, cell.x, cell.y);
      haptics.microTick();
    },
    onRelease: (cell, [blockId]) => {
      if (paused) return;
      const id = typeof blockId === 'string' ? blockId : logic.activeBlockId;
      if (!id) return;
      if (!cell.inside) {
        logic.clearGhost();
        return;
      }
      if (logic.activeBlockId !== id) {
        logic.pickBlock(id);
      }
      handlePlacement(cell);
    }
  });

  useEffect(() => {
    if (status === 'gameover') {
      play('gameover');
    }
  }, [play, status]);

  useEffect(() => {
    if (combo > 1) {
      setComboFlashKey(Date.now());
    }
  }, [combo]);

  useEffect(() => {
    if (!comboFlashKey) return;
    const timer = setTimeout(() => setComboFlashKey(null), 900);
    return () => clearTimeout(timer);
  }, [comboFlashKey]);

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

  if (!assetsReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface text-slate-100">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">Preparing assets</div>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-300" />
        <p className="mt-4 text-sm text-slate-400">
          사운드와 텍스처를 불러오는 중입니다. 잠시만 기다려 주세요.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-surface text-slate-100 ${lastChanceActive ? 'last-chance' : ''}`}
      style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom, 1.5rem))' }}
    >
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
      <header className="flex flex-col gap-3 px-6 pb-4 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Stellive Labs</p>
            <h1 className="text-3xl font-bold text-white">Block Blast (Web)</h1>
            <p className="text-sm text-slate-400">Top-down orthographic · static board</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 shadow-inner">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Score</span>
              <span className="text-lg font-semibold text-white">{score.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 shadow-inner">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Best</span>
              <span className="text-lg font-semibold text-emerald-200">{(personalBest ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 shadow-inner">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Combo</span>
              <span className="text-lg font-semibold text-amber-200">x{combo}</span>
            </div>
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/20"
              onClick={() => {
                const el = document.getElementById('settings');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Settings
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">Alpha build</span>
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">
            {GRID_SIZE}x{GRID_SIZE} grid
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Locked camera · no pan</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Safe touch zone</span>
          {paused ? (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200">일시정지 (탭 전환)</span>
          ) : null}
        </div>
      </header>

      {assetError ? (
        <div className="mx-6 mb-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {assetError}
        </div>
      ) : null}

      <Tutorial />

      <main className="grid grid-cols-1 gap-6 px-6 pb-24 lg:grid-cols-[2fr_1fr]">
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
          <div className="relative aspect-square sm:aspect-[4/3]">
            <GameScene
              logic={logic}
              showGhost={showHints}
              lowSpec={lowSpec}
              trayBlock={logic.findBlock(logic.activeBlockId)}
              usePatterns={colorblindMode}
              feverLevel={feverLevel}
              paused={paused}
            />
            <div
              {...dragBind()}
              ref={boardRef}
              className="absolute inset-0"
              style={{ pointerEvents: logic.activeBlockId && !paused ? 'auto' : 'none' }}
            />
            {comboFlashKey ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  key={comboFlashKey}
                  className="rounded-3xl border border-amber-200/40 bg-amber-200/10 px-6 py-3 text-xl font-semibold text-amber-100 shadow-[0_0_0_12px_rgba(251,191,36,0.08)]"
                  style={{ animation: 'comboPop 0.8s ease-out forwards' }}
                >
                  Combo x{combo}!
                </div>
              </div>
            ) : null}
            {comboFlashKey ? (
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{ animation: 'screenFlash 0.5s ease-out' }}
              />
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <HUD onReset={logic.reset} onRefresh={logic.refreshTray} />
          <TrayPanel
            blocks={logic.tray}
            activeBlockId={logic.activeBlockId}
            placeableBlocks={placeableBlocks}
            rotationEnabled={rotationEnabled}
            dragBind={dragBind}
            onSelect={(id) => {
              logic.clearGhost();
              logic.pickBlock(id);
              play('pick');
              haptics.microTick();
            }}
            onRotate={(id) => {
              if (!rotationEnabled) return;
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
