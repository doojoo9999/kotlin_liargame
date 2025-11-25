import { RotateCcw } from 'lucide-react';
import { PALETTE } from '../../styles/theme';
import clsx from 'clsx';
import type { BlockInstance } from '../../utils/grid';

interface TrayPanelProps {
  blocks: BlockInstance[];
  activeBlockId: string | null;
  onSelect: (id: string) => void;
  onRotate: (id: string) => void;
}

const BlockPreview = ({ block, active, onSelect, onRotate }: { block: BlockInstance; active: boolean; onSelect: () => void; onRotate: () => void }) => {
  const columns = block.shape[0].length;
  return (
    <div
      className={clsx(
        'relative rounded-2xl border px-3 py-2 transition',
        active ? 'border-blue-400 bg-blue-500/10 shadow-glow' : 'border-white/10 bg-panel/60 hover:border-white/20'
      )}
    >
      <button type="button" className="absolute right-2 top-2 rounded-md bg-white/10 p-1 text-slate-200" onClick={onRotate}>
        <RotateCcw size={14} />
      </button>
      <button type="button" className="block w-full" onClick={onSelect}>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(10px, 1fr))`
          }}
        >
          {block.shape.map((row, y) =>
            row.map((value, x) => (
              <span
                key={`${block.id}-${x}-${y}`}
                className="aspect-square rounded-md"
                style={{ backgroundColor: value ? PALETTE[block.color] : 'transparent' }}
              />
            ))
          )}
        </div>
      </button>
    </div>
  );
};

export const TrayPanel = ({ blocks, activeBlockId, onSelect, onRotate }: TrayPanelProps) => (
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
          onSelect={() => onSelect(block.id)}
          onRotate={() => onRotate(block.id)}
        />
      ))}
    </div>
  </div>
);
