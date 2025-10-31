import { useState } from 'react';
import { usePuzzleLeaderboard } from '@/features/leaderboard/usePuzzleLeaderboard';

const LeaderboardPage = () => {
  const [puzzleId, setPuzzleId] = useState('11111111-1111-1111-1111-111111111111');
  const { data, isLoading } = usePuzzleLeaderboard(puzzleId, 'NORMAL');

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">리더보드</h1>
        <p className="text-sm text-slate-400">모드와 기간을 선택하여 상위 기록을 살펴보세요.</p>
      </header>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">퍼즐 ID</span>
            <input
              className="w-72 rounded border border-slate-700 bg-slate-950 px-3 py-1"
              value={puzzleId}
              onChange={(event) => setPuzzleId(event.target.value)}
            />
          </div>
        </div>
        <table className="w-full table-fixed">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">참가자</th>
              <th className="px-4 py-3 text-right">점수</th>
              <th className="px-4 py-3 text-right">시간</th>
              <th className="px-4 py-3 text-right">콤보</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  데이터를 불러오는 중입니다…
                </td>
              </tr>
            )}
            {data?.entries.map((entry) => (
              <tr key={entry.subjectKey} className="border-b border-slate-800/60">
                <td className="px-4 py-3">#{entry.rank}</td>
                <td className="px-4 py-3">{entry.nickname ?? entry.subjectKey.slice(0, 8)}</td>
                <td className="px-4 py-3 text-right">{entry.score.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{entry.timeMs ? `${entry.timeMs / 1000}s` : '-'}</td>
                <td className="px-4 py-3 text-right">{entry.combo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
