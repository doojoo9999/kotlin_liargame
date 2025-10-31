import { useState } from 'react';
import { useCreateMultiplayerSession } from '@/features/multiplayer/useMultiplayerSessions';

const modes = [
  { value: 'COOP', label: '협력' },
  { value: 'VERSUS', label: '대결' },
  { value: 'RELAY', label: '릴레이' }
] as const;

const MultiplayerLobbyPage = () => {
  const [mode, setMode] = useState<typeof modes[number]['value']>('COOP');
  const [puzzleId, setPuzzleId] = useState('11111111-1111-1111-1111-111111111111');
  const mutation = useCreateMultiplayerSession();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">멀티플레이어 로비</h1>
        <p className="text-sm text-slate-400">실시간 협동, 대결, 릴레이 모드를 선택하고 친구들을 초대하세요.</p>
      </header>

      <div className="rounded border border-slate-800 bg-slate-900/40 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-200">모드 선택</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              {modes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-200">퍼즐 ID</span>
            <input
              value={puzzleId}
              onChange={(event) => setPuzzleId(event.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
        </div>
        <button
          onClick={() => mutation.mutate({ mode, puzzleId })}
          className="mt-4 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? '세션 생성 중…' : '세션 생성'}
        </button>
      </div>
    </div>
  );
};

export default MultiplayerLobbyPage;
