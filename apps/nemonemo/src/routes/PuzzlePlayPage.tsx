import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PuzzleCanvas from '@/components/game/PuzzleCanvas';
import { usePuzzleDetail } from '@/features/daily/usePuzzleDetail';
import { usePlaySession } from '@/features/play/usePlaySession';
import { useGameStore } from '@/store/gameStore';
import { useNotificationStore } from '@/store/notificationStore';

const PuzzlePlayPage = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const { data, isLoading } = usePuzzleDetail(puzzleId);
  const { status: playStatus, autosaveState, lastSavedAt, forceAutosave } = usePlaySession(puzzleId);
  const loadGrid = useGameStore((state) => state.loadGrid);
  const pushToast = useNotificationStore((state) => state.pushToast);
  const [manualSavePending, setManualSavePending] = useState(false);

  const handleManualSave = async () => {
    if (!puzzleId || manualSavePending) {
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
        <PuzzleCanvas />
      </section>

      <aside className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div>
          <h2 className="text-lg font-semibold">힌트 요약</h2>
          <p className="text-xs text-slate-400">행 힌트 {data.hints.rows.length}개, 열 힌트 {data.hints.cols.length}개</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-200">통계</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>플레이: {data.statistics.playCount.toLocaleString()}</li>
            <li>클리어: {data.statistics.clearCount.toLocaleString()}</li>
            <li>평균 시간: {(data.statistics.averageTimeMs ?? 0) / 1000}s</li>
          </ul>
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
        <div className="grid gap-2">
          <button
            className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={manualSavePending || playStatus !== 'ready'}
            onClick={handleManualSave}
          >
            {manualSavePending ? '수동 저장 중…' : '수동 저장'}
          </button>
          <button className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary">
            힌트 보기
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PuzzlePlayPage;
