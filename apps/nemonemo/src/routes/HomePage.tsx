import { Link } from 'react-router-dom';
import { useDailyPicks } from '@/features/daily/useDailyPicks';
import { usePuzzleList } from '@/features/daily/usePuzzleList';

const HomePage = () => {
  const { data: picks } = useDailyPicks();
  const { data: latest } = usePuzzleList('APPROVED');

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">오늘의 추천</h1>
        <p className="text-sm text-slate-300">
          매일 자정 업데이트되는 큐레이션입니다. 난이도별로 골라 도전해 보세요!
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {picks?.items.map((item) => (
            <Link
              key={item.id}
              to={`/puzzles/${item.id}`}
              className="group rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition hover:border-primary"
            >
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{item.difficultyCategory ?? '알 수 없음'}</span>
                <span>{item.playCount.toLocaleString()} Plays</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
            </Link>
          )) ?? <p className="text-sm text-slate-500">추천 데이터를 불러오는 중입니다…</p>}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">최신 퍼즐</h2>
          <Link to="/search" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {latest?.pages[0]?.items.map((item) => (
            <Link
              to={`/puzzles/${item.id}`}
              key={item.id}
              className="rounded border border-slate-800 bg-slate-900/50 p-3 hover:border-primary"
            >
              <p className="text-sm text-slate-400">{item.difficultyCategory ?? '???'}</p>
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{item.tags.join(', ')}</p>
            </Link>
          )) ?? <p className="text-sm text-slate-500">퍼즐을 불러오는 중입니다…</p>}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
