import { useRef } from 'react';
import { Howl } from 'howler';
import { useAudioPref } from '../stores/useGameStore';
import pickSfx from '../assets/sounds/pick.wav';
import dropSfx from '../assets/sounds/drop.wav';
import invalidSfx from '../assets/sounds/invalid.wav';
import clearSfx from '../assets/sounds/clear.wav';
import comboSfx from '../assets/sounds/combo.wav';
import gameOverSfx from '../assets/sounds/gameover.wav';

type SoundKey = 'pick' | 'drop' | 'invalid' | 'clear' | 'combo' | 'gameover';

const DEFAULT_SOURCES: Record<SoundKey, string[]> = {
  pick: [pickSfx],
  drop: [dropSfx],
  invalid: [invalidSfx],
  clear: [clearSfx],
  combo: [comboSfx],
  gameover: [gameOverSfx]
};

const SOUND_SOURCES: Record<SoundKey, string[]> = { ...DEFAULT_SOURCES };

export const useAudio = () => {
  const { muted, toggleMute } = useAudioPref();
  const howls = useRef<Partial<Record<SoundKey, Howl>>>({});

  const getHowl = (key: SoundKey) => {
    if (howls.current[key]) return howls.current[key]!;
    const sources = SOUND_SOURCES[key];
    if (!sources.length) return null;
    const instance = new Howl({ src: sources, preload: true, volume: 0.6 });
    howls.current[key] = instance;
    return instance;
  };

  const play = (key: SoundKey) => {
    if (muted) return;
    const howl = getHowl(key);
    howl?.play();
  };

  const setSources = (key: SoundKey, sources: string[]) => {
    howls.current[key]?.unload();
    howls.current[key] = undefined;
    SOUND_SOURCES[key] = sources.length ? sources : DEFAULT_SOURCES[key];
  };

  return {
    play,
    muted,
    toggleMute,
    setSources
  };
};
