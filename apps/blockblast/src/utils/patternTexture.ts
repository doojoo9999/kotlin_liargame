import { CanvasTexture, RepeatWrapping, Texture } from 'three';
import type { ThemeColorKey } from '../styles/theme';

type Pattern = 'stripes' | 'dots' | 'waves';

const CACHE = new Map<string, Texture>();

const ensureContext = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
};

const drawStripes = (ctx: CanvasRenderingContext2D, color: string) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 4;
  for (let i = -64; i < 128; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 64, 64);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, 64, 64);
};

const drawDots = (ctx: CanvasRenderingContext2D, color: string) => {
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = 8; y < 64; y += 16) {
    for (let x = 8; x < 64; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, 0, 64, 64);
};

const drawWaves = (ctx: CanvasRenderingContext2D, color: string) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 3;
  for (let y = 10; y < 64; y += 18) {
    ctx.beginPath();
    for (let x = 0; x <= 64; x += 4) {
      const waveY = y + Math.sin((x / 64) * Math.PI * 2) * 4;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, 0, 64, 64);
};

export const PATTERN_BY_COLOR: Record<ThemeColorKey, Pattern> = {
  red: 'stripes',
  orange: 'waves',
  yellow: 'dots',
  green: 'stripes',
  blue: 'waves',
  purple: 'dots',
  pink: 'stripes'
};

export const buildPatternTexture = (color: string, pattern: Pattern): Texture | null => {
  const key = `${color}-${pattern}`;
  if (CACHE.has(key)) return CACHE.get(key)!;
  const ctxBundle = ensureContext();
  if (!ctxBundle || !ctxBundle.ctx) return null;
  const { canvas, ctx } = ctxBundle;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (pattern === 'stripes') drawStripes(ctx, color);
  if (pattern === 'dots') drawDots(ctx, color);
  if (pattern === 'waves') drawWaves(ctx, color);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  CACHE.set(key, texture);
  return texture;
};
