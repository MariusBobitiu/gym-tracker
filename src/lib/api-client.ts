import { API_BASE_URL_OVERRIDE } from "@/lib/api-base-url";
import { Env } from "@/lib/env";
import {
  getSecureItem,
  getStorageItem,
  SECURE_STORAGE_KEYS,
  STORAGE_KEYS,
  secureStorage,
} from "@/lib/storage";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  status: number;
  headers: Headers;
};

export type ApiError = {
  statusCode?: number;
  message: string;
  details?: unknown;
};

export type ApiFailure<E = ApiError> = {
  ok: false;
  error: E;
  status: number;
  headers?: Headers;
};

export type ApiResult<T, E = ApiError> = ApiSuccess<T> | ApiFailure<E>;

export type ApiRequestOptions<TBody = unknown> = {
  method?: string;
  headers?: HeadersInit;
  body?: TBody;
  signal?: AbortSignal;
  auth?: boolean;
  parse?: (response: Response) => Promise<unknown>;
};

type ApiClientConfig = {
  baseUrl: string;
  headers?: HeadersInit;
  getToken?: () => string | null;
};

type ApiClient = {
  request: <T, E = ApiError>(path: string, options?: ApiRequestOptions) => Promise<ApiResult<T, E>>;
};

const API_BASE_URL = (__DEV__ && API_BASE_URL_OVERRIDE) || Env.EXPO_PUBLIC_API_URL || "";
let hasWarnedMissingBaseUrl = false;

type UnauthorizedHandler = (statusCode: number) => void;
type RefreshHandler = (token: string | null) => Promise<string | null>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshHandler: RefreshHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

function getAccessToken(): string | null {
  const secureToken = secureStorage ? getSecureItem(SECURE_STORAGE_KEYS.authToken) : null;
  const token = secureToken ?? getStorageItem(STORAGE_KEYS.token);
  // Use the raw JWT/string as-is; do not base64-encode before sending.
  return token?.access ?? null;
}

function buildUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl && !hasWarnedMissingBaseUrl) {
    hasWarnedMissingBaseUrl = true;
    console.warn("Missing EXPO_PUBLIC_API_URL; API requests may not reach the backend.");
  }
  if (!baseUrl) return path;
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${normalizedBase}${normalizedPath}`;
  return url;
}

function resolveBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === null || body === undefined) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof ArrayBuffer ||
    body instanceof Blob
  ) {
    if (body instanceof FormData) {
      headers.delete("Content-Type");
    }
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

function buildError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = String((payload as { message?: string }).message ?? "Request failed");
    return { message, statusCode: status, details: payload };
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return { message: payload, statusCode: status, details: payload };
  }

  return { message: "Request failed", statusCode: status };
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return {
    async request<T, E = ApiError>(
      path: string,
      options: ApiRequestOptions = {}
    ): Promise<ApiResult<T, E>> {
      const url = buildUrl(config.baseUrl, path);
      const headers = new Headers(config.headers);
      const { method = "GET", body, signal, auth = true, parse } = options;

      if (auth && config.getToken) {
        const token = config.getToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      if (options.headers) {
        for (const [key, value] of new Headers(options.headers)) {
          headers.set(key, value);
        }
      }

      const resolvedBody = resolveBody(body, headers);

      async function executeRequest(requestHeaders: Headers): Promise<Response> {
        return fetch(url, {
          method,
          headers: requestHeaders,
          body: resolvedBody,
          signal,
        });
      }

      try {
        let response = await executeRequest(headers);

        const status = response.status;
        const contentType = response.headers.get("content-type") ?? "";
        let payload: unknown = null;

        if (parse) {
          payload = await parse(response);
        } else if (status !== 204) {
          if (contentType.includes("application/json")) {
            payload = await response.json().catch(() => null);
          } else {
            payload = await response.text().catch(() => null);
          }
        }

        if (response.ok) {
          return { ok: true, data: payload as T, status, headers: response.headers };
        }

        if (auth && status === 401 && refreshHandler) {
          const refreshedToken = await refreshHandler(config.getToken?.() ?? null);
          if (refreshedToken) {
            const retryHeaders = new Headers(headers);
            retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
            response = await executeRequest(retryHeaders);

            const retryStatus = response.status;
            const retryContentType = response.headers.get("content-type") ?? "";
            let retryPayload: unknown = null;

            if (parse) {
              retryPayload = await parse(response);
            } else if (retryStatus !== 204) {
              if (retryContentType.includes("application/json")) {
                retryPayload = await response.json().catch(() => null);
              } else {
                retryPayload = await response.text().catch(() => null);
              }
            }

            if (response.ok) {
              return {
                ok: true,
                data: retryPayload as T,
                status: retryStatus,
                headers: response.headers,
              };
            }

            if (retryStatus === 401 && unauthorizedHandler) {
              unauthorizedHandler(retryStatus);
            }

            return {
              ok: false,
              error: buildError(retryStatus, retryPayload) as E,
              status: retryStatus,
              headers: response.headers,
            };
          }
        }

        if (auth && status === 401 && unauthorizedHandler) {
          unauthorizedHandler(status);
        }

        return {
          ok: false,
          error: buildError(status, payload) as E,
          status,
          headers: response.headers,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Network request failed";
        return { ok: false, error: { message, statusCode: 0 } as E, status: 0 };
      }
    },
  };
}

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  headers: { Accept: "application/json" },
  getToken: getAccessToken,
});

export const request = apiClient.request;
