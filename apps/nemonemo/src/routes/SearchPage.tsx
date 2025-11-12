import { Link } from 'react-router-dom';
import { useState } from 'react';
import { usePuzzleList } from '@/features/daily/usePuzzleList';

const SearchPage = () => {
  const [status, setStatus] = useState<'APPROVED' | 'OFFICIAL'>('APPROVED');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePuzzleList(status);
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">퍼즐 탐색</h1>
          <p className="text-sm text-slate-400">난이도와 태그를 확인하고 원하는 작품을 즉시 플레이하세요.</p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'APPROVED' | 'OFFICIAL')}
          className="h-9 rounded border border-slate-700 bg-slate-950 px-3 text-sm"
        >
          <option value="APPROVED">승인됨</option>
          <option value="OFFICIAL">오피셜</option>
        </select>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-500">퍼즐 목록을 불러오는 중입니다…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/puzzles/${item.id}`}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-primary"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{item.difficultyCategory ?? '난이도 미정'}</span>
                <span>{item.playCount.toLocaleString()}회</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {(item.tags ?? []).slice(0, 3).join(', ') || '태그 없음'}
              </p>
            </Link>
          ))}
          {!items.length && (
            <p className="text-sm text-slate-500">검색 결과가 없습니다. 에디터에서 첫 퍼즐을 업로드해 보세요!</p>
          )}
        </div>
      )}

      {hasNextPage && (
        <button
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          className="w-full rounded border border-slate-700 bg-slate-950 py-2 text-sm hover:border-primary disabled:opacity-50"
        >
          {isFetchingNextPage ? '불러오는 중…' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default SearchPage;
