import { useAudioPref, usePreferences } from '../../stores/useGameStore';

export const Settings = () => {
  const { muted, toggleMute } = useAudioPref();
  const { lowSpec, showHints, toggleLowSpec, toggleHints } = usePreferences();

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Settings</p>
      <div className="mt-3 space-y-3 text-sm text-slate-100">
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">Sound</p>
            <p className="text-xs text-slate-400">Toggle all sound effects</p>
          </div>
          <input type="checkbox" checked={!muted} onChange={() => toggleMute()} />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">Low-spec mode</p>
            <p className="text-xs text-slate-400">Turn off fog & heavy effects</p>
          </div>
          <input type="checkbox" checked={lowSpec} onChange={() => toggleLowSpec()} />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">Ghost hints</p>
            <p className="text-xs text-slate-400">Show green/red previews while aiming</p>
          </div>
          <input type="checkbox" checked={showHints} onChange={() => toggleHints()} />
        </label>
      </div>
    </div>
  );
};
