import { RotateCcw } from 'lucide-react';
import { PALETTE } from '../../styles/theme';
import clsx from 'clsx';
import type { BlockInstance } from '../../utils/grid';
import type { useDragDrop } from '../../hooks/useDragDrop';

interface TrayPanelProps {
  blocks: BlockInstance[];
  activeBlockId: string | null;
  onSelect: (id: string) => void;
  onRotate: (id: string) => void;
  placeableBlocks?: Set<string>;
  dragBind?: ReturnType<typeof useDragDrop>;
  rotationEnabled?: boolean;
}

const BlockPreview = ({ block, active, onSelect, onRotate, placeable, dragBind, rotationEnabled = true }: { block: BlockInstance; active: boolean; onSelect: () => void; onRotate: () => void; placeable: boolean; dragBind?: ReturnType<typeof useDragDrop>; rotationEnabled?: boolean }) => {
  const shapeRows = block.shape.length;
  const shapeCols = block.shape[0].length;
  const maxDim = Math.max(shapeRows, shapeCols, 1);
  const gridWidthPct = (shapeCols / maxDim) * 100;
  const gridHeightPct = (shapeRows / maxDim) * 100;

  return (
    <div
      {...(dragBind ? dragBind(block.id) : {})}
      className={clsx(
        'relative rounded-2xl border px-3 py-2 transition',
        active ? 'border-blue-400 bg-blue-500/10 shadow-glow' : 'border-white/10 bg-panel/60 hover:border-white/20',
        !placeable ? 'opacity-60 saturate-75' : ''
      )}
      title={placeable ? 'Placeable' : 'No moves for this shape'}
      style={{ minHeight: 172 }}
    >
      {rotationEnabled ? (
        <button type="button" className="absolute right-2 top-2 rounded-md bg-white/10 p-1 text-slate-200" onClick={onRotate}>
          <RotateCcw size={14} />
        </button>
      ) : null}
      <button type="button" className="block w-full" onClick={onSelect}>
        <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(148,187,233,0.08),transparent_55%),rgba(0,0,0,0.25)] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="grid"
              style={{
                width: `${gridWidthPct}%`,
                height: `${gridHeightPct}%`,
                gridTemplateColumns: `repeat(${shapeCols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${shapeRows}, minmax(0, 1fr))`,
                gap: '6%'
              }}
            >
              {block.shape.map((row, y) =>
                row.map((value, x) => (
                  <span
                    key={`${block.id}-${x}-${y}`}
                    className={clsx(
                      'block h-full w-full rounded-md transition',
                      value ? 'shadow-[0_6px_16px_rgba(0,0,0,0.28)]' : 'opacity-0'
                    )}
                    style={{ backgroundColor: value ? PALETTE[block.color] : 'transparent', opacity: value ? 0.95 : 0 }}
                  />
                ))
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/12" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/0" />
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

export const TrayPanel = ({ blocks, activeBlockId, onSelect, onRotate, placeableBlocks, dragBind, rotationEnabled = true }: TrayPanelProps) => (
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
          dragBind={dragBind}
          rotationEnabled={rotationEnabled}
        />
      ))}
    </div>
  </div>
);
