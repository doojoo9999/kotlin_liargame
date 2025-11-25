import { useMemo, useRef } from 'react';
import { Howl } from 'howler';
import { useAudioPref, type SoundTheme } from '../stores/useGameStore';
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
  const { muted, toggleMute, soundTheme } = useAudioPref();
  const howls = useRef<Partial<Record<SoundKey, Howl>>>({});

  const themeProfile = useMemo((): Record<SoundTheme, { rate: number; volume: number }> => {
    return {
      classic: { rate: 1, volume: 0.65 },
      jelly: { rate: 0.92, volume: 0.7 },
      wood: { rate: 0.96, volume: 0.8 },
      glass: { rate: 1.1, volume: 0.6 }
    };
  }, []);

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
    if (!howl) return;
    const profile = themeProfile[soundTheme] ?? themeProfile.classic;
    const jitter = 1 + (Math.random() - 0.5) * 0.05;
    howl.rate(profile.rate * jitter);
    howl.volume(profile.volume);
    howl.play();
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
