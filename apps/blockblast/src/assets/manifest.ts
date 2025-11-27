import pickSfx from './sounds/pick.wav';
import dropSfx from './sounds/drop.wav';
import invalidSfx from './sounds/invalid.wav';
import clearSfx from './sounds/clear.wav';
import comboSfx from './sounds/combo.wav';
import gameOverSfx from './sounds/gameover.wav';

export const SOUND_MANIFEST = [pickSfx, dropSfx, invalidSfx, clearSfx, comboSfx, gameOverSfx];

export const ASSET_MANIFEST = {
  sounds: SOUND_MANIFEST,
  textures: [] as string[]
};
