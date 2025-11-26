import { RotateCcw } from 'lucide-react';
import { PALETTE } from '../../styles/theme';
import clsx from 'clsx';
import type { BlockInstance } from '../../utils/grid';

interface TrayPanelProps {
  blocks: BlockInstance[];
  activeBlockId: string | null;
  onSelect: (id: string) => void;
  onRotate: (id: string) => void;
  placeableBlocks?: Set<string>;
}

const BlockPreview = ({ block, active, onSelect, onRotate, placeable }: { block: BlockInstance; active: boolean; onSelect: () => void; onRotate: () => void; placeable: boolean }) => {
  const BOX_SIZE = 4;
  const columns = BOX_SIZE;
  const rows = BOX_SIZE;
  const shapeRows = block.shape.length;
  const shapeCols = block.shape[0].length;
  const offsetX = Math.floor((BOX_SIZE - shapeCols) / 2);
  const offsetY = Math.floor((BOX_SIZE - shapeRows) / 2);

  const normalizedCells = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => {
      const sx = x - offsetX;
      const sy = y - offsetY;
      return sx >= 0 && sx < shapeCols && sy >= 0 && sy < shapeRows ? block.shape[sy][sx] : 0;
    })
  );

  return (
    <div
      className={clsx(
        'relative rounded-2xl border px-3 py-2 transition',
        active ? 'border-blue-400 bg-blue-500/10 shadow-glow' : 'border-white/10 bg-panel/60 hover:border-white/20',
        !placeable ? 'opacity-60 saturate-75' : ''
      )}
      title={placeable ? 'Placeable' : 'No moves for this shape'}
    >
      <button type="button" className="absolute right-2 top-2 rounded-md bg-white/10 p-1 text-slate-200" onClick={onRotate}>
        <RotateCcw size={14} />
      </button>
      <button type="button" className="block w-full" onClick={onSelect}>
        <div
          className="grid gap-1 rounded-xl border border-white/5 bg-black/20 p-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(10px, 1fr))`
          }}
        >
          {normalizedCells.map((row, y) =>
            row.map((value, x) => (
              <span
                key={`${block.id}-${x}-${y}`}
                className={clsx('aspect-square rounded-md border border-white/5', value ? 'shadow-[0_6px_12px_rgba(0,0,0,0.25)]' : '')}
                style={{
                  backgroundColor: value ? PALETTE[block.color] : 'transparent',
                  opacity: value ? 0.9 : 1
                }}
              />
            ))
          )}
        </div>
        {!placeable ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
            No moves
          </span>
        ) : null}
      </button>
    </div>
  );
};

export const TrayPanel = ({ blocks, activeBlockId, onSelect, onRotate, placeableBlocks }: TrayPanelProps) => (
  <div className="glass-panel rounded-2xl p-4 shadow-glow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tray</p>
        <p className="text-lg font-semibold text-white">Pick a block</p>
      </div>
    </div>
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      {blocks.map((block) => (
        <BlockPreview
          key={block.id}
          block={block}
          active={block.id === activeBlockId}
          placeable={placeableBlocks ? placeableBlocks.has(block.id) : true}
          onSelect={() => onSelect(block.id)}
          onRotate={() => onRotate(block.id)}
        />
      ))}
    </div>
  </div>
);
