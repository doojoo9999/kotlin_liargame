import { Fragment, memo, useCallback, useMemo, useState } from 'react';
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

type PuzzleCanvasProps = {
  rowHints: number[][];
  colHints: number[][];
  width: number;
  height: number;
};

const PuzzleCanvas = memo(({ rowHints, colHints, width, height }: PuzzleCanvasProps) => {
  const { grid, updateCell } = useGameStore((state) => ({
    grid: state.grid,
    updateCell: state.updateCell
  }));
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const handleCellClick = useCallback(
    (index: number) => {
      const current = grid.cells[index];
      if (typeof current === 'undefined') return;
      updateCell(index, nextState[current]);
    },
    [grid.cells, updateCell]
  );

  const boardWidth = grid.width || width;
  const boardHeight = grid.height || height;

  const normalizedRowHints = useMemo(
    () =>
      Array.from({ length: boardHeight }, (_, row) => {
        return rowHints[row] ?? [];
      }),
    [boardHeight, rowHints]
  );

  const normalizedColHints = useMemo(
    () =>
      Array.from({ length: boardWidth }, (_, col) => {
        return colHints[col] ?? [];
      }),
    [boardWidth, colHints]
  );

  const rows = useMemo(() => {
    if (grid.cells.length === 0 || !grid.id) return [];
    return Array.from({ length: boardHeight }, (_, row) => {
      const start = row * boardWidth;
      return grid.cells.slice(start, start + boardWidth);
    });
  }, [grid.cells, grid.id, boardHeight, boardWidth]);

  const cellSide = boardWidth > 25 || boardHeight > 25 ? 28 : 40;

  if (!grid.id || grid.cells.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
        퍼즐 데이터를 불러오고 있습니다…
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="puzzle-board">
      <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-inner">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `minmax(4.5rem, auto) repeat(${boardWidth}, minmax(${cellSide}px, 1fr))`,
            gridTemplateRows: `minmax(4.5rem, auto) repeat(${boardHeight}, minmax(${cellSide}px, 1fr))`
          }}
          role="grid"
          aria-label="퍼즐 캔버스"
        >
          <div className="rounded-lg bg-slate-900/20" aria-hidden="true" />
          {normalizedColHints.map((hint, colIndex) => (
            <div
              key={`col-hint-${colIndex}`}
              className={`flex min-h-[4.5rem] flex-col items-center justify-end gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1 text-xs font-mono ${
                hoverCol === colIndex ? 'border-primary/60 text-primary-100' : 'text-slate-300'
              }`}
              onMouseEnter={() => setHoverCol(colIndex)}
              onMouseLeave={() => setHoverCol((prev) => (prev === colIndex ? null : prev))}
              onFocus={() => setHoverCol(colIndex)}
              onBlur={() => setHoverCol((prev) => (prev === colIndex ? null : prev))}
              role="columnheader"
              aria-label={`${colIndex + 1}열 힌트 ${hint.length ? hint.join(' ') : '0'}`}
            >
              {hint.length ? (
                hint
                  .slice()
                  .reverse()
                  .map((value, idx) => (
                    <span key={`col-${colIndex}-hint-${idx}`} className="leading-none">
                      {value}
                    </span>
                  ))
              ) : (
                <span>0</span>
              )}
            </div>
          ))}
          {rows.map((rowCells, rowIndex) => (
            <Fragment key={`row-${rowIndex}`}>
              <div
                className={`flex min-w-[4.5rem] items-center justify-end gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-xs font-mono ${
                  hoverRow === rowIndex ? 'border-primary/60 text-primary-100' : 'text-slate-300'
                }`}
                onMouseEnter={() => setHoverRow(rowIndex)}
                onMouseLeave={() => setHoverRow((prev) => (prev === rowIndex ? null : prev))}
                role="rowheader"
                aria-label={`${rowIndex + 1}행 힌트 ${normalizedRowHints[rowIndex].length ? normalizedRowHints[rowIndex].join(' ') : '0'}`}
              >
                {normalizedRowHints[rowIndex].length ? (
                  normalizedRowHints[rowIndex].map((value, idx) => (
                    <span key={`row-${rowIndex}-hint-${idx}`} className="leading-none">
                      {value}
                    </span>
                  ))
                ) : (
                  <span>0</span>
                )}
              </div>
              {rowCells.map((cell, colIndex) => {
                const globalIndex = rowIndex * boardWidth + colIndex;
                const isActive = hoverRow === rowIndex || hoverCol === colIndex;
                return (
                  <button
                    key={`${grid.id}-${globalIndex}`}
                    type="button"
                    className={`${cellStyle[cell]} relative flex aspect-square items-center justify-center text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70 ${
                      isActive ? 'ring-1 ring-primary/40' : ''
                    }`}
                    style={{ minWidth: cellSide, minHeight: cellSide }}
                    onClick={() => handleCellClick(globalIndex)}
                    onMouseEnter={() => {
                      setHoverRow(rowIndex);
                      setHoverCol(colIndex);
                    }}
                    onMouseLeave={() => {
                      setHoverRow((prev) => (prev === rowIndex ? null : prev));
                      setHoverCol((prev) => (prev === colIndex ? null : prev));
                    }}
                    aria-label={`${rowIndex + 1}행 ${colIndex + 1}열 ${stateLabel[cell]}`}
                    role="gridcell"
                    data-cell-state={cell}
                    data-testid={`puzzle-cell-${globalIndex}`}
                  >
                    {cell === 'x' ? '×' : cell === 'filled' ? '■' : '·'}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        클릭할 때마다 `빈 칸 → 채움 → X` 순으로 토글되며, 모든 입력은 3초마다 자동 저장됩니다.
      </p>
    </div>
  );
});

PuzzleCanvas.displayName = 'PuzzleCanvas';

export default PuzzleCanvas;
