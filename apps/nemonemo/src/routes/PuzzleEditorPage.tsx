import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PuzzleContentStyle } from '@/features/daily/usePuzzleDetail';
import { apiClient } from '@/lib/api/client';
import { useNotificationStore } from '@/store/notificationStore';

type Cell = 'filled' | 'blank';

const gridSizes = [5, 10, 15, 20, 25, 30, 40, 50];

const emptyGrid = (width: number, height: number): Cell[] =>
  Array.from({ length: width * height }, () => 'blank');

const toPayloadGrid = (cells: Cell[], width: number, height: number): string[] => {
  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = '';
    for (let x = 0; x < width; x += 1) {
      const cell = cells[y * width + x];
      row += cell === 'filled' ? '#' : '.';
    }
    rows.push(row);
  }
  return rows;
};

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => Boolean(tag));

const PuzzleEditorPage = () => {
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(15);
  const [cells, setCells] = useState<Cell[]>(() => emptyGrid(15, 15));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('tutorial');
  const [contentStyle, setContentStyle] = useState<PuzzleContentStyle>('GENERIC_PIXEL');
  const pushToast = useNotificationStore((state) => state.pushToast);

  const editorGrid = useMemo(() => cells, [cells]);

  const resetGrid = (nextWidth: number, nextHeight: number) => {
    setCells(emptyGrid(nextWidth, nextHeight));
  };

  const toggleCell = (index: number) => {
    setCells((prev) => {
      const next = [...prev];
      next[index] = prev[index] === 'filled' ? 'blank' : 'filled';
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        width,
        height,
        grid: toPayloadGrid(editorGrid, width, height),
        tags: parseTags(tags),
        seriesId: null,
        contentStyle
      };
      const { data } = await apiClient.post('/puzzles', payload);
      return data;
    },
    onSuccess: () => {
      pushToast({ title: '퍼즐 업로드 성공', description: '검증 큐에 퍼즐이 등록되었습니다.' });
      setTitle('');
      setDescription('');
      setTags('tutorial');
      resetGrid(width, height);
    },
    onError: (error: unknown) => {
      console.error('Failed to upload puzzle', error);
      pushToast({ title: '업로드 실패', description: '입력 값을 다시 확인해 주세요.' });
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">퍼즐 에디터</h1>
        <p className="text-sm text-slate-400">
          좌측에서 셀을 클릭해 픽셀 아트를 그린 뒤, 우측에 메타데이터를 입력하면 즉시 업로드할 수
          있습니다. (추후 대칭/이미지 도구가 추가될 예정입니다.)
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-[2fr,1fr]"
      >
        <section className="space-y-4">
          <div className="flex gap-4 text-sm">
            <label className="grid gap-1">
              <span className="text-slate-300">가로</span>
              <select
                value={width}
                onChange={(event) => {
                  const size = Number(event.target.value);
                  setWidth(size);
                  resetGrid(size, height);
                }}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5"
              >
                {gridSizes.map((size) => (
                  <option key={`w-${size}`} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-slate-300">세로</span>
              <select
                value={height}
                onChange={(event) => {
                  const size = Number(event.target.value);
                  setHeight(size);
                  resetGrid(width, size);
                }}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5"
              >
                {gridSizes.map((size) => (
                  <option key={`h-${size}`} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => resetGrid(width, height)}
              className="self-end rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-primary"
            >
              그리드 초기화
            </button>
          </div>
          <div
            className="grid gap-px rounded-lg border border-slate-800 bg-slate-800 p-2"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
          >
            {editorGrid.map((cell, index) => (
              <button
                key={index}
                type="button"
                className={`aspect-square text-xs font-semibold transition ${
                  cell === 'filled'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-900 text-slate-900 hover:bg-slate-800'
                }`}
                onClick={() => toggleCell(index)}
                aria-label={`${Math.floor(index / width) + 1}행 ${index % width + 1}열 ${
                  cell === 'filled' ? '채움' : '비움'
                }`}
              >
                {cell === 'filled' ? '■' : '·'}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-200">제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={120}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-primary"
              placeholder="작품명을 입력하세요"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-200">설명</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-primary"
              placeholder="이 퍼즐에 대한 설명을 적어주세요"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-200">태그 (쉼표 구분)</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-primary"
              placeholder="tutorial, heart, pixel"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-200">스타일</span>
            <select
              value={contentStyle}
              onChange={(event) => setContentStyle(event.target.value as PuzzleContentStyle)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="GENERIC_PIXEL">일반 픽셀 아트</option>
              <option value="LETTERFORM">문자 형태</option>
              <option value="SYMBOLIC">심볼/아이콘</option>
              <option value="CLI_ASCII">ASCII</option>
              <option value="MIXED">혼합</option>
            </select>
          </label>

          <button
            className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            type="submit"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? '업로드 중…' : '업로드 큐에 제출'}
          </button>
          <p className="text-xs text-slate-500">
            제출 시 서버가 유일해·난이도를 자동 계산하며, 중복 체크섬이 존재하면 409 오류로 반려됩니다.
          </p>
        </section>
      </form>
    </div>
  );
};

export default PuzzleEditorPage;
