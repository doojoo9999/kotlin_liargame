import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import PuzzleCanvas from '@/components/game/PuzzleCanvas';
import { usePuzzleDetail } from '@/features/daily/usePuzzleDetail';
import { usePlaySession } from '@/features/play/usePlaySession';
import { usePlayApi } from '@/features/play/PlayApiContext';
import { useGameStore } from '@/store/gameStore';
import { useNotificationStore } from '@/store/notificationStore';

type PlayResult = {
  puzzleId: string;
  playId: string;
  score: number;
  elapsedMs: number;
  comboBonus: number;
  perfectClear: boolean;
  leaderboardRank?: number | null;
};

const toSolutionRows = (cells: ('blank' | 'filled' | 'x')[], width: number, height: number) => {
  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    const start = y * width;
    const slice = cells.slice(start, start + width);
    rows.push(slice.map((cell) => (cell === 'filled' ? '#' : '.')).join(''));
  }
  return rows;
};

const PuzzlePlayPage = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const { data, isLoading } = usePuzzleDetail(puzzleId);
  const {
    status: playStatus,
    playId,
    autosaveState,
    lastSavedAt,
    forceAutosave
  } = usePlaySession(puzzleId);
  const {
    grid,
    loadGrid,
    undo,
    redo,
    session,
    mistakes,
    hintsUsed,
    combo
  } = useGameStore((state) => ({
    grid: state.grid,
    loadGrid: state.loadGrid,
    undo: state.undo,
    redo: state.redo,
    session: state.session,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    combo: state.combo
  }));
  const pushToast = useNotificationStore((state) => state.pushToast);
  const playApi = usePlayApi();
  const [manualSavePending, setManualSavePending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [result, setResult] = useState<PlayResult | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [data?.id]);

  const handleManualSave = async () => {
    if (!puzzleId || manualSavePending || playStatus !== 'ready') {
      return;
    }
    setManualSavePending(true);
    try {
      await forceAutosave();
      pushToast({ title: '진행 상황 저장', description: '현재 진행도가 안전하게 저장되었습니다.' });
    } catch (error) {
      console.error('Manual autosave failed', error);
      pushToast({ title: '저장 실패', description: '네트워크 상태를 확인해 주세요.' });
    } finally {
      setManualSavePending(false);
    }
  };

  const handleSubmit = async () => {
    if (!session.playId || submitPending || playStatus !== 'ready') {
      return;
    }
    setSubmitPending(true);
    try {
      const payload = {
        solution: toSolutionRows(grid.cells, grid.width, grid.height),
        elapsedMs: Date.now() - startTimeRef.current,
        mistakes,
        usedHints: hintsUsed,
        undoCount: Math.max(0, grid.history.length - 1),
        comboCount: combo
      };
      const { data: submitResult } = await playApi.post<PlayResult>(`/plays/${session.playId}/submit`, payload);
      setResult(submitResult);
      pushToast({ title: '정답 제출 완료', description: '점수가 반영되었습니다.' });
    } catch (error) {
      console.error('Submit failed', error);
      pushToast({ title: '제출 실패', description: '정답을 다시 확인해 주세요.' });
    } finally {
      setSubmitPending(false);
    }
  };

  useEffect(() => {
    if (!data) return;
    const cells = Array.from({ length: data.width * data.height }, () => 'blank' as const);
    loadGrid({ id: data.id, width: data.width, height: data.height, cells });
    pushToast({ title: `${data.title} 로딩 완료`, description: '자동 저장이 활성화되었습니다.' });
  }, [data, loadGrid, pushToast]);

  if (isLoading) {
    return <p className="text-sm text-slate-400">퍼즐 데이터를 불러오는 중입니다…</p>;
  }

  if (!data) {
    return <p className="text-sm text-rose-400">퍼즐을 찾을 수 없습니다.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <p className="text-sm text-slate-400">{data.description ?? '설명이 제공되지 않았습니다.'}</p>
            <p className="mt-1 text-xs text-slate-500">
              세션 상태: {playStatus === 'ready' ? '진행 중' : playStatus === 'starting' ? '준비 중' : playStatus === 'error' ? '오류' : '대기'}
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            {data.width} × {data.height}
          </div>
        </header>
        <PuzzleCanvas
          rowHints={data.hints.rows}
          colHints={data.hints.cols}
          width={data.width}
          height={data.height}
        />
        {result && (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <p className="font-semibold text-sm text-emerald-300">
              최종 점수 {result.score.toLocaleString()}점
            </p>
            <p className="mt-1">플레이 시간: {(result.elapsedMs / 1000).toFixed(1)}초</p>
            <p>콤보 보너스: {result.comboBonus}</p>
            {result.leaderboardRank && <p>리더보드 순위: {result.leaderboardRank}위</p>}
            <p>{result.perfectClear ? '퍼펙트 클리어 달성!' : '다음에는 퍼펙트에 도전해 보세요.'}</p>
          </div>
        )}
      </section>

      <aside className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div>
          <h2 className="text-lg font-semibold">힌트 요약</h2>
          <p className="text-xs text-slate-400">행 힌트 {data.hints.rows.length}개, 열 힌트 {data.hints.cols.length}개</p>
        </div>
        <div className="grid gap-3 text-xs text-slate-400">
          <div>
            <h3 className="text-sm font-medium text-slate-200">퍼즐 정보</h3>
            <ul className="mt-2 space-y-1">
              <li>태그: {(data.tags ?? []).join(', ') || '없음'}</li>
              <li>콘텐츠 스타일: {data.contentStyle ?? '미분류'}</li>
              <li>평균 시간: {Math.round((data.statistics.averageTimeMs ?? 0) / 1000)}초</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-200">통계</h3>
            <ul className="mt-2 space-y-1">
              <li>플레이: {data.statistics.playCount.toLocaleString()}</li>
              <li>클리어: {data.statistics.clearCount.toLocaleString()}</li>
            </ul>
          </div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
          <p data-testid="autosave-indicator">
            자동 저장 상태: {autosaveState === 'saving' ? '저장 중…' : autosaveState === 'error' ? '오류' : '대기 중'}
          </p>
          <p className="mt-1">
            마지막 저장:{' '}
            {lastSavedAt
              ? new Date(lastSavedAt).toLocaleTimeString()
              : '아직 저장 내역 없음'}
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              className="flex-1 rounded border border-slate-700 px-3 py-2 text-xs hover:border-primary"
            >
              실행 취소
            </button>
            <button
              type="button"
              onClick={redo}
              className="flex-1 rounded border border-slate-700 px-3 py-2 text-xs hover:border-primary"
            >
              다시 실행
            </button>
          </div>
          <button
            className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={manualSavePending || playStatus !== 'ready'}
            onClick={handleManualSave}
            data-testid="manual-save"
          >
            {manualSavePending ? '수동 저장 중…' : '수동 저장'}
          </button>
          <button
            className="rounded bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitPending || playStatus !== 'ready' || !playId}
          >
            {submitPending ? '제출 중…' : '정답 제출'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PuzzlePlayPage;
