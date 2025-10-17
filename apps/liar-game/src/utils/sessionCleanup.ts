// Utility helpers to centralise session cleanup - see docs/error.md for storage stance
const APP_PREFIX = "liargame:";
const STORAGE_KEYS = {
  authToken: "auth-token",
  authStore: "auth-storage",
  websocketSession: `${APP_PREFIX}websocket-session-id`,
  websocketLegacy: "websocket-session-id",
  schemaVersion: `${APP_PREFIX}schemaVersion`,
} as const;

type CleanupReason = "logout" | "session-expired" | "manual";

type CleanupOptions = {
  reason?: CleanupReason;
  disconnectWebsocket?: boolean;
  broadcastEvent?: boolean;
};

const isBrowser = typeof window !== "undefined";

function removeLocalStorageKey(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("[sessionCleanup] Failed to remove localStorage key", key, error);
  }
}

function removePrefixedLocalStorage(prefix: string): void {
  if (!isBrowser) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const itemKey = window.localStorage.key(i);
      if (itemKey && itemKey.startsWith(prefix)) {
        keys.push(itemKey);
      }
    }
    keys.forEach(removeLocalStorageKey);
  } catch (error) {
    console.warn("[sessionCleanup] Failed to inspect localStorage", error);
  }
}

function removePrefixedSessionStorage(prefix: string): void {
  if (!isBrowser) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const itemKey = window.sessionStorage.key(i);
      if (itemKey && itemKey.startsWith(prefix)) {
        keys.push(itemKey);
      }
    }
    keys.forEach((key) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch (error) {
        console.warn("[sessionCleanup] Failed to remove sessionStorage key", key, error);
      }
    });
  } catch (error) {
    console.warn("[sessionCleanup] Failed to inspect sessionStorage", error);
  }
}

export async function clearClientSessionState(options: CleanupOptions = {}): Promise<void> {
  if (!isBrowser) return;

  const {
    reason = "manual",
    disconnectWebsocket = true,
    broadcastEvent = true,
  } = options;

  removeLocalStorageKey(STORAGE_KEYS.authToken);
  removeLocalStorageKey(STORAGE_KEYS.authStore);
  removeLocalStorageKey(STORAGE_KEYS.websocketLegacy);
  removeLocalStorageKey(STORAGE_KEYS.websocketSession);
  removeLocalStorageKey(STORAGE_KEYS.schemaVersion);

  removePrefixedLocalStorage(APP_PREFIX);
  removePrefixedSessionStorage(APP_PREFIX);

  if (disconnectWebsocket) {
    try {
      const { websocketService } = await import("@/services/websocketService");
      websocketService.disconnect();
    } catch (error) {
      console.warn("[sessionCleanup] Failed to disconnect websocketService", error);
    }
  }

  if (broadcastEvent) {
    window.dispatchEvent(
      new CustomEvent("auth-session-expired", { detail: { reason } }),
    );
  }
}

export function resetRealtimeSessionTracking(): void {
  if (!isBrowser) return;
  removeLocalStorageKey(STORAGE_KEYS.websocketLegacy);
  removeLocalStorageKey(STORAGE_KEYS.websocketSession);
}

