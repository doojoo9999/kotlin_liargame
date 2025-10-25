import {getAdminHeaderName, getAdminKey} from "./adminAuth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:20021/api/lineage";

export async function request<T>(path: string, options: {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
} = {}): Promise<T> {
  const {method = "GET", body, headers = {}} = options;
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const adminKey = getAdminKey();
  if (adminKey && !requestHeaders[getAdminHeaderName()]) {
    requestHeaders[getAdminHeaderName()] = adminKey;
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${path} failed: ${response.status} ${response.statusText}\n${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      usp.set(key, String(value));
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}
