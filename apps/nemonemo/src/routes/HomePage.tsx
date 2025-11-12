import { Link } from 'react-router-dom';
import { useDailyPicks } from '@/features/daily/useDailyPicks';
import { usePuzzleList } from '@/features/daily/usePuzzleList';

const tutorialBullets = [
  '기본 조작 튜토리얼 퍼즐(하트/스마일/별/음표)을 통해 규칙을 익혀 보세요.',
  '로그인이 없어도 게스트 세션으로 자동 저장됩니다.',
  '에디터에서 직접 픽셀 아트를 그리고 곧바로 업로드할 수 있습니다.'
];

const HomePage = () => {
  const { data: picks, isLoading: picksLoading } = useDailyPicks();
  const { data: latest, isLoading: latestLoading } = usePuzzleList('APPROVED');
  const latestItems = latest?.pages.flatMap((page) => page.items).slice(0, 8) ?? [];

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-primary">Nemonemo Platform</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">오늘 바로 퍼즐을 만들고 플레이하세요</h1>
          <p className="text-sm text-slate-300">
            추천 퍼즐을 고르거나, 직접 픽셀 아트를 업로드하면 검증 후 전 세계 플레이어에게 공개됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/search"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              퍼즐 찾기
            </Link>
            <Link
              to="/editor"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-primary"
            >
              퍼즐 만들기
            </Link>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            {tutorialBullets.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">오늘의 추천</h2>
            <p className="text-sm text-slate-400">매일 자정 갱신되는 큐레이션을 통해 다양한 난이도를 즐겨 보세요.</p>
          </div>
          <Link to="/search" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>
        {picksLoading ? (
          <p className="text-sm text-slate-500">추천 퍼즐을 불러오는 중입니다…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {picks?.items.map((item) => (
              <Link
                key={item.id}
                to={`/puzzles/${item.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-primary"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{item.difficultyCategory ?? '난이도 미정'}</span>
                  <span>{item.playCount.toLocaleString()}회 플레이</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-500">
                  {(item.tags ?? []).slice(0, 3).join(', ') || '태그 없음'}
                </p>
              </Link>
            )) ?? <p className="text-sm text-slate-500">추천 데이터가 없습니다.</p>}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">최신 업로드</h2>
          <Link to="/editor" className="text-sm text-slate-400 hover:text-white">
            나도 업로드하기 →
          </Link>
        </div>
        {latestLoading ? (
          <p className="text-sm text-slate-500">퍼즐을 불러오는 중입니다…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            {latestItems.map((item) => (
              <Link
                key={item.id}
                to={`/puzzles/${item.id}`}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 hover:border-primary"
              >
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  {item.difficultyCategory ?? '???'}
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {(item.tags ?? []).slice(0, 3).join(', ') || '태그 없음'}
                </p>
                <p className="mt-2 text-xs text-slate-500">{item.playCount.toLocaleString()}회 플레이</p>
              </Link>
            ))}
            {!latestItems.length && (
              <p className="text-sm text-slate-500">아직 등록된 퍼즐이 없습니다. 첫 작품을 업로드해 주세요!</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
