export interface AssetManifest {
  textures?: string[];
  sounds?: string[];
}

const loadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof Image === 'undefined') {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });

const loadAudio = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof Audio === 'undefined') {
      resolve();
      return;
    }
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve();
    audio.onerror = reject;
    audio.src = src;
    // Some browsers require load() to start fetch
    if (typeof audio.load === 'function') {
      audio.load();
    }
  });

// Preloads lightweight assets up front so the game can start without hitching.
export const preloadAssets = async (manifest: AssetManifest) => {
  const tasks: Array<Promise<void>> = [];
  manifest.textures?.forEach((src) => tasks.push(loadImage(src)));
  manifest.sounds?.forEach((src) => tasks.push(loadAudio(src)));
  if (tasks.length === 0) return;
  await Promise.all(tasks);
};
