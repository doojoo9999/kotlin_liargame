import type React from 'react';
import { useAudioPref, usePreferences, type SoundTheme, type ControlMode } from '../../stores/useGameStore';

export const Settings = () => {
  const { muted, toggleMute, soundTheme, setSoundTheme } = useAudioPref();
  const { lowSpec, showHints, colorblindMode, controlMode, rotationEnabled, toggleLowSpec, toggleHints, toggleColorblind, setControlMode, toggleRotation } = usePreferences();

  return (
    <div id="settings" className="glass-panel rounded-2xl p-4">
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
            <p className="font-semibold">Sound Theme</p>
            <p className="text-xs text-slate-400">Pick a tactile ASMR profile</p>
          </div>
          <select
            className="rounded-md bg-slate-800 px-2 py-1 text-xs"
            value={soundTheme}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value as SoundTheme;
              setSoundTheme(value);
            }}
          >
            <option value="classic">Classic</option>
            <option value="jelly">Jelly</option>
            <option value="wood">Wood</option>
            <option value="glass">Glass</option>
          </select>
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
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">Colorblind-friendly patterns</p>
            <p className="text-xs text-slate-400">Add subtle textures on blocks</p>
          </div>
          <input type="checkbox" checked={colorblindMode} onChange={() => toggleColorblind()} />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">블럭 회전</p>
            <p className="text-xs text-slate-400">트레이에서 회전 버튼 표시/비표시</p>
          </div>
          <input type="checkbox" checked={rotationEnabled} onChange={() => toggleRotation()} />
        </label>
        <label className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
          <div>
            <p className="font-semibold">Adaptive controls</p>
            <p className="text-xs text-slate-400">Offset placement for finger coverage</p>
          </div>
          <select
            className="rounded-md bg-slate-800 px-2 py-1 text-xs"
            value={controlMode}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value as ControlMode;
              setControlMode(value);
            }}
          >
            <option value="standard">1:1 모드</option>
            <option value="offset">오프셋 모드</option>
            <option value="auto">오토 오프셋</option>
          </select>
        </label>
      </div>
    </div>
  );
};
