// 환경 변수 래퍼
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL as string;
export const BASE_URL = (import.meta.env.VITE_BASE_URL as string) || window.location.origin;

// 안전한 경로 결합
export function withBase(path: string) {
  if (!path.startsWith('/')) return path;
  const base = BASE_URL?.replace(/\/$/, '') || '';
  return `${base}${path}`;
}

