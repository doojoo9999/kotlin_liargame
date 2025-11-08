import { memo, useCallback } from 'react';
import { useGameStore, type CellState } from '@/store/gameStore';

const stateLabel: Record<CellState, string> = {
  blank: '비어 있음',
  filled: '채움',
  x: 'X 표시'
};

const nextState: Record<CellState, CellState> = {
  blank: 'filled',
  filled: 'x',
  x: 'blank'
};

const cellStyle: Record<CellState, string> = {
  blank: 'bg-slate-900 hover:bg-slate-800 text-transparent',
  filled: 'bg-primary text-primary-foreground',
  x: 'bg-slate-900 text-rose-300'
};

const PuzzleCanvas = memo(() => {
  const { grid, updateCell } = useGameStore((state) => ({
    grid: state.grid,
    updateCell: state.updateCell
  }));

  const handleCellClick = useCallback(
    (index: number) => {
      const current = grid.cells[index];
      if (typeof current === 'undefined') return;
      updateCell(index, nextState[current]);
    },
    [grid.cells, updateCell]
  );

  if (!grid.id || grid.cells.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
        퍼즐 데이터를 불러오고 있습니다…
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="puzzle-canvas">
      <div
        className="grid gap-px rounded-lg border border-slate-800 bg-slate-800 p-2"
        style={{
          gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))`
        }}
        role="grid"
        aria-label="퍼즐 캔버스"
      >
        {grid.cells.map((cell, index) => (
          <button
            key={`${grid.id}-${index}`}
            type="button"
            className={`${cellStyle[cell]} flex aspect-square items-center justify-center text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70`}
            onClick={() => handleCellClick(index)}
            aria-label={`${Math.floor(index / grid.width) + 1}행 ${index % grid.width + 1}열 ${stateLabel[cell]}`}
            role="gridcell"
            data-cell-state={cell}
            data-testid={`puzzle-cell-${index}`}
          >
            {cell === 'x' ? '×' : cell === 'filled' ? '■' : '·'}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        클릭할 때마다 `빈 칸 → 채움 → X` 순으로 토글되며, 모든 입력은 3초마다 자동 저장됩니다.
      </p>
    </div>
  );
});

PuzzleCanvas.displayName = 'PuzzleCanvas';

export default PuzzleCanvas;
