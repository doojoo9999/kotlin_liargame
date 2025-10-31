import { useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';

const gridSizes = [10, 15, 20, 25, 30, 40, 50];

const PuzzleEditorPage = () => {
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(15);
  const [title, setTitle] = useState('');
  const pushToast = useNotificationStore((state) => state.pushToast);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushToast({ title: '퍼즐 업로드 요청', description: '검증 큐에 퍼즐이 추가됩니다.' });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">퍼즐 에디터</h1>
        <p className="text-sm text-slate-400">
          그리드 도구, 대칭/회전, 이미지 가져오기 및 테스트 플레이가 이 페이지에 추가될 예정입니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-primary"
            placeholder="작품명을 입력하세요"
          />
        </label>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <label className="grid gap-2">
            <span className="font-medium text-slate-200">가로</span>
            <select
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              {gridSizes.map((size) => (
                <option key={`w-${size}`} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-medium text-slate-200">세로</span>
            <select
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              {gridSizes.map((size) => (
                <option key={`h-${size}`} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          업로드 큐에 제출
        </button>
      </form>
    </div>
  );
};

export default PuzzleEditorPage;
