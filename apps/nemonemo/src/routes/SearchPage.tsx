import { useState } from 'react';
import { usePuzzleList } from '@/features/daily/usePuzzleList';

const SearchPage = () => {
  const [status, setStatus] = useState<'APPROVED' | 'OFFICIAL'>('APPROVED');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePuzzleList(status);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">퍼즐 탐색</h1>
          <p className="text-sm text-slate-400">필터와 정렬 옵션이 여기에 자리잡을 예정입니다.</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        {data?.pages.flatMap((page) => page.items).map((item) => (
          <article key={item.id} className="rounded border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-xs text-slate-400">{item.tags.join(', ')}</p>
            <p className="mt-2 text-xs text-slate-500">{item.difficultyCategory ?? '난이도 미정'}</p>
          </article>
        ))}
      </div>

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
