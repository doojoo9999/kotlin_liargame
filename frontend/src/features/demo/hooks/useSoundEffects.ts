import {useCallback, useEffect, useState} from 'react';

interface SoundEffect {
  id: string;
  src: string;
  volume?: number;
  loop?: boolean;
}

interface SoundEffects {
  vote: SoundEffect;
  timerWarning: SoundEffect;
  timerEnd: SoundEffect;
  notification: SoundEffect;
  success: SoundEffect;
  error: SoundEffect;
  phaseChange: SoundEffect;
  buttonClick: SoundEffect;
  playerJoin: SoundEffect;
  playerLeave: SoundEffect;
}

// Default sound effects configuration
const DEFAULT_SOUNDS: SoundEffects = {
  vote: { id: 'vote', src: '/sounds/vote.mp3', volume: 0.7 },
  timerWarning: { id: 'timerWarning', src: '/sounds/timer-warning.mp3', volume: 0.8 },
  timerEnd: { id: 'timerEnd', src: '/sounds/timer-end.mp3', volume: 0.9 },
  notification: { id: 'notification', src: '/sounds/notification.mp3', volume: 0.6 },
  success: { id: 'success', src: '/sounds/success.mp3', volume: 0.7 },
  error: { id: 'error', src: '/sounds/error.mp3', volume: 0.8 },
  phaseChange: { id: 'phaseChange', src: '/sounds/phase-change.mp3', volume: 0.7 },
  buttonClick: { id: 'buttonClick', src: '/sounds/click.mp3', volume: 0.3 },
  playerJoin: { id: 'playerJoin', src: '/sounds/player-join.mp3', volume: 0.5 },
  playerLeave: { id: 'playerLeave', src: '/sounds/player-leave.mp3', volume: 0.5 }
};

// Fallback to Web Audio API generated sounds
const generateTone = (frequency: number, duration: number, volume: number = 0.3): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const bufferLength = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < bufferLength; i++) {
    const t = i / sampleRate;
    channelData[i] = Math.sin(2 * Math.PI * frequency * t) * volume * Math.exp(-t * 3);
  }

  return buffer;
};

const FALLBACK_SOUNDS = {
  vote: () => generateTone(800, 0.2, 0.3),
  timerWarning: () => generateTone(600, 0.5, 0.4),
  timerEnd: () => generateTone(400, 1, 0.5),
  notification: () => generateTone(1000, 0.3, 0.2),
  success: () => generateTone(1200, 0.4, 0.3),
  error: () => generateTone(300, 0.6, 0.4),
  phaseChange: () => generateTone(900, 0.3, 0.3),
  buttonClick: () => generateTone(1500, 0.1, 0.1),
  playerJoin: () => generateTone(1100, 0.3, 0.2),
  playerLeave: () => generateTone(500, 0.3, 0.2)
};

export const useSoundEffects = (enabled: boolean = true) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [loadedSounds, setLoadedSounds] = useState<Map<string, HTMLAudioElement | AudioBuffer>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio context
  useEffect(() => {
    if (enabled && !audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, [enabled, audioContext]);

  // Preload sound effects
  useEffect(() => {
    if (!enabled || !audioContext) return;

    const loadSounds = async () => {
      setIsLoading(true);
      const soundMap = new Map<string, HTMLAudioElement | AudioBuffer>();

      for (const [key, sound] of Object.entries(DEFAULT_SOUNDS)) {
        try {
          // Try to load actual audio file first
          const audio = new Audio(sound.src);
          audio.volume = sound.volume || 0.5;
          audio.preload = 'auto';
          
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.load();
          });
          
          soundMap.set(key, audio);
        } catch (error) {
          // Fallback to generated sound
          try {
            const fallbackGenerator = FALLBACK_SOUNDS[key as keyof typeof FALLBACK_SOUNDS];
            if (fallbackGenerator) {
              soundMap.set(key, fallbackGenerator());
            }
          } catch (fallbackError) {
            console.warn(`Failed to load or generate sound for ${key}:`, fallbackError);
          }
        }
      }

      setLoadedSounds(soundMap);
      setIsLoading(false);
    };

    loadSounds();
  }, [enabled, audioContext]);

  // Play sound effect
  const playSound = useCallback(async (soundId: keyof SoundEffects, options?: { volume?: number; playbackRate?: number }) => {
    if (!enabled || !audioContext || !loadedSounds.has(soundId)) return;

    try {
      const sound = loadedSounds.get(soundId);
      
      if (sound instanceof HTMLAudioElement) {
        // HTML Audio Element
        if (options?.volume !== undefined) {
          sound.volume = Math.max(0, Math.min(1, options.volume));
        }
        if (options?.playbackRate !== undefined) {
          sound.playbackRate = Math.max(0.5, Math.min(2, options.playbackRate));
        }
        
        sound.currentTime = 0;
        await sound.play();
      } else if (sound instanceof AudioBuffer) {
        // Web Audio API
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = sound;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.value = options?.volume ?? 0.3;
        if (options?.playbackRate !== undefined) {
          source.playbackRate.value = Math.max(0.5, Math.min(2, options.playbackRate));
        }
        
        source.start();
      }
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error);
    }
  }, [enabled, audioContext, loadedSounds]);

  // Play multiple sounds in sequence
  const playSoundSequence = useCallback(async (sounds: Array<{ id: keyof SoundEffects; delay?: number; options?: { volume?: number; playbackRate?: number } }>) => {
    for (const { id, delay = 0, options } of sounds) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      await playSound(id, options);
    }
  }, [playSound]);

  // Pre-defined sound combinations
  const playNotificationSound = useCallback(() => {
    playSound('notification');
  }, [playSound]);

  const playSuccessSound = useCallback(() => {
    playSoundSequence([
      { id: 'success', options: { volume: 0.3 } }
    ]);
  }, [playSoundSequence]);

  const playErrorSound = useCallback(() => {
    playSoundSequence([
      { id: 'error', options: { volume: 0.4 } }
    ]);
  }, [playSoundSequence]);

  const playVoteSound = useCallback(() => {
    playSound('vote', { volume: 0.5 });
  }, [playSound]);

  const playTimerWarning = useCallback(() => {
    playSound('timerWarning', { volume: 0.6 });
  }, [playSound]);

  const playTimerEnd = useCallback(() => {
    playSoundSequence([
      { id: 'timerEnd', options: { volume: 0.8 } }
    ]);
  }, [playSoundSequence]);

  const playPhaseChange = useCallback(() => {
    playSound('phaseChange', { volume: 0.5 });
  }, [playSound]);

  const playButtonClick = useCallback(() => {
    playSound('buttonClick', { volume: 0.2 });
  }, [playSound]);

  const playPlayerJoin = useCallback(() => {
    playSound('playerJoin', { volume: 0.4 });
  }, [playSound]);

  const playPlayerLeave = useCallback(() => {
    playSound('playerLeave', { volume: 0.4 });
  }, [playSound]);

  // Test all sounds
  const testAllSounds = useCallback(async () => {
    const soundIds = Object.keys(DEFAULT_SOUNDS) as Array<keyof SoundEffects>;
    
    for (let i = 0; i < soundIds.length; i++) {
      await playSound(soundIds[i], { volume: 0.3 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [playSound]);

  return {
    // State
    isLoading,
    isEnabled: enabled,
    isReady: !isLoading && loadedSounds.size > 0,
    
    // Basic sound control
    playSound,
    playSoundSequence,
    
    // Specific game sounds
    playNotificationSound,
    playSuccessSound,
    playErrorSound,
    playVoteSound,
    playTimerWarning,
    playTimerEnd,
    playPhaseChange,
    playButtonClick,
    playPlayerJoin,
    playPlayerLeave,
    
    // Utility
    testAllSounds
  };
};