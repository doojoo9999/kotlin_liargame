import {getAdminHeaderName, getAdminKey} from "./adminAuth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:20021/api/lineage";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
    public readonly errorCode?: string,
    public readonly userFriendlyMessage?: string,
    public readonly serverMessage?: string,
    public readonly path?: string,
    public readonly method?: HttpMethod,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
    const responseText = await response.text();
    let parsedBody: unknown;
    let userFriendlyMessage: string | undefined;
    let serverMessage: string | undefined;
    let errorCode: string | undefined;

    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText);
        if (typeof (parsedBody as any)?.userFriendlyMessage === "string") {
          userFriendlyMessage = ((parsedBody as any).userFriendlyMessage as string).trim();
        }
        if (typeof (parsedBody as any)?.message === "string") {
          serverMessage = ((parsedBody as any).message as string).trim();
        }
        if (typeof (parsedBody as any)?.errorCode === "string") {
          errorCode = ((parsedBody as any).errorCode as string).trim();
        }
      } catch {
        // Ignore JSON parse errors – we'll fall back to the raw response text.
      }
    }

    const message = userFriendlyMessage
      || serverMessage
      || `API ${method} ${path} failed: ${response.status} ${response.statusText}`;

    throw new ApiError(
      message,
      response.status,
      response.statusText,
      responseText,
      errorCode,
      userFriendlyMessage,
      serverMessage,
      path,
      method,
    );
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
