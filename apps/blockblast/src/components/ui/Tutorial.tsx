import { Hand } from 'lucide-react';

export const Tutorial = () => (
  <div className="glass-panel mx-6 mb-4 rounded-2xl p-4 text-sm text-slate-200">
    <div className="flex items-center gap-2">
      <Hand size={16} className="text-amber-300" />
      <p className="font-semibold">How to play</p>
    </div>
    <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-400">
      <li>Pick a block from the tray (rotate if needed).</li>
      <li>Hover the board to preview, click to place.</li>
      <li>Clear full rows or columns to score and build combos.</li>
    </ul>
  </div>
);
