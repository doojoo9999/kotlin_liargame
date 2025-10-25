const STORAGE_KEY = "linw:admin-key";
const DEFAULT_HEADER = "X-Lineage-Admin-Key";

export function getAdminHeaderName(): string {
  return import.meta.env.VITE_ADMIN_HEADER_NAME ?? DEFAULT_HEADER;
}

export function getAdminKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setAdminKey(value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, value);
}

export function clearAdminKey(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
