import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePuzzleDetail } from '@/features/daily/usePuzzleDetail';
import { useGameStore } from '@/store/gameStore';
import { useNotificationStore } from '@/store/notificationStore';

const PuzzlePlayPage = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const { data, isLoading } = usePuzzleDetail(puzzleId);
  const loadGrid = useGameStore((state) => state.loadGrid);
  const pushToast = useNotificationStore((state) => state.pushToast);

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
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            {data.width} × {data.height}
          </div>
        </header>
        <div className="aspect-square rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-500">캔버스 컴포넌트가 여기에 렌더링될 예정입니다.</p>
        </div>
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
        <div className="grid gap-2">
          <button className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            제출하기
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
