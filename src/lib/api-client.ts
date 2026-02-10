import { API_BASE_URL_OVERRIDE } from "@/lib/api-base-url";
import { Env } from "@/lib/env";
import type { AuthConnectionStatus } from "@/lib/auth/auth-store";
import { OfflineAuthError, SignedOutError } from "@/lib/auth/auth-errors";

export { OfflineAuthError, SignedOutError } from "@/lib/auth/auth-errors";

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
  /** If true, ensure valid access token before request and add Authorization. Default true. */
  auth?: boolean;
  parse?: (response: Response) => Promise<unknown>;
};

type ApiClientConfig = {
  baseUrl: string;
  headers?: HeadersInit;
  getToken?: () => string | null;
};

type ApiClient = {
  request: <T, E = ApiError>(
    path: string,
    options?: ApiRequestOptions
  ) => Promise<ApiResult<T, E>>;
};

const API_BASE_URL =
  (__DEV__ && API_BASE_URL_OVERRIDE) || Env.EXPO_PUBLIC_API_URL || "";
let hasWarnedMissingBaseUrl = false;

type UnauthorizedHandler = (statusCode: number) => void;
type RefreshHandler = (token: string | null) => Promise<string | null>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshHandler: RefreshHandler | null = null;

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null
): void {
  unauthorizedHandler = handler;
}

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

let getAuthStoreToken: (() => string | null) | null = null;
/** Set by SessionProvider so API client can read token from auth store without circular import. */
export function setAuthStoreGetters(
  getToken: () => string | null,
  ensureValid: () => Promise<void>,
  getStatus: () => AuthConnectionStatus
): void {
  getAuthStoreToken = getToken;
  ensureValidAccessTokenGlobal = ensureValid;
  getStatusGlobal = getStatus;
}

/** Token getter used when config.getToken is not provided (e.g. before context mounts). */
function getAccessTokenFallback(): string | null {
  return getAuthStoreToken?.() ?? null;
}

let ensureValidAccessTokenGlobal: (() => Promise<void>) | null = null;
let getStatusGlobal: (() => AuthConnectionStatus) | null = null;

function buildUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl && !hasWarnedMissingBaseUrl) {
    hasWarnedMissingBaseUrl = true;
    console.warn(
      "Missing EXPO_PUBLIC_API_URL; API requests may not reach the backend."
    );
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
    const message = String(
      (payload as { message?: string }).message ?? "Request failed"
    );
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

      const getToken = (): string | null =>
        config.getToken?.() ?? getAccessTokenFallback();

      try {
        // 1) If request requires auth, ensure we have a valid access token first (refresh if needed).
        //    Throws OfflineAuthError (network) or SignedOutError (invalid refresh); we rethrow so callers can handle.
        //    Skip if already signed out (e.g., during logout flow).
        if (auth && ensureValidAccessTokenGlobal) {
          const currentStatus = getStatusGlobal?.();
          if (currentStatus === "signedOut") {
            // Already signed out, skip auth check to avoid SignedOutError
            auth = false;
          } else {
            await ensureValidAccessTokenGlobal();
          }
        }

        if (auth) {
          const token = getToken();
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

        async function executeRequest(
          requestHeaders: Headers
        ): Promise<Response> {
          return fetch(url, {
            method,
            headers: requestHeaders,
            body: resolvedBody,
            signal,
          });
        }

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
          return {
            ok: true,
            data: payload as T,
            status,
            headers: response.headers,
          };
        }

        // 2) On 401: attempt refresh once (refresh lock is inside store), then retry request once.
        if (auth && status === 401 && refreshHandler) {
          const refreshedToken = await refreshHandler(getToken());
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

          // Refresh returned null: either offline (signedInOffline) or invalid refresh (signedOut).
          if (getStatusGlobal?.() === "signedInOffline") {
            throw new OfflineAuthError();
          }
          if (unauthorizedHandler) {
            unauthorizedHandler(401);
          }
        }

        if (auth && status === 401 && unauthorizedHandler && !refreshHandler) {
          unauthorizedHandler(status);
        }

        return {
          ok: false,
          error: buildError(status, payload) as E,
          status,
          headers: response.headers,
        };
      } catch (error) {
        if (
          error instanceof OfflineAuthError ||
          error instanceof SignedOutError
        ) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Network request failed";
        return { ok: false, error: { message, statusCode: 0 } as E, status: 0 };
      }
    },
  };
}

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  headers: { Accept: "application/json" },
  getToken: getAccessTokenFallback,
});

export const request = apiClient.request;
