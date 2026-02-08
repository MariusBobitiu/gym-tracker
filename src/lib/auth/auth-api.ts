import {
  request,
  type ApiError,
  type ApiFailure,
  type ApiResult,
  type ApiSuccess,
} from "@/lib/api-client";
import type { TokenType } from "@/lib/storage";
import type { User } from "@/types";

export const AUTH_ENDPOINTS = {
  signup: "/v1/auth/signup",
  login: "/v1/auth/login",
  apple: "/v1/auth/apple",
  refresh: "/v1/auth/refresh",
  me: "/v1/me",
  logout: "/v1/auth/logout",
} as const;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AppleAuthFullName = {
  givenName?: string;
  familyName?: string;
};

export type AppleAuthPayload = {
  identityToken: string;
  authorizationCode: string;
  nonce: string;
  fullName?: AppleAuthFullName;
  email?: string;
};

export type AppleAuthSession = {
  token: TokenType;
  user: User;
};

type LoginResponse =
  | { token: string }
  | { accessToken: string; refreshToken?: string }
  | { token: { access: string; refresh?: string } }
  | { access: string; refresh?: string };

type LoginResult = {
  token: TokenType;
};

function normalizeToken(payload: LoginResponse): TokenType | null {
  if ("token" in payload && typeof payload.token === "string") {
    return { access: payload.token, refresh: "" };
  }

  if ("accessToken" in payload) {
    return { access: payload.accessToken, refresh: payload.refreshToken ?? "" };
  }

  if (
    "token" in payload &&
    typeof payload.token === "object" &&
    payload.token
  ) {
    return {
      access: payload.token.access,
      refresh: payload.token.refresh ?? "",
    };
  }

  if ("access" in payload) {
    return { access: payload.access, refresh: payload.refresh ?? "" };
  }

  return null;
}

function buildTokenFailure(
  status: number,
  details: unknown
): ApiFailure<ApiError> {
  return {
    ok: false,
    status,
    error: {
      statusCode: status,
      message: "Auth token missing from response.",
      details,
    },
  };
}

function buildUserFailure(
  status: number,
  details: unknown
): ApiFailure<ApiError> {
  return {
    ok: false,
    status,
    error: {
      statusCode: status,
      message: "User missing from response.",
      details,
    },
  };
}

export async function login(
  credentials: LoginCredentials
): Promise<ApiResult<LoginResult, ApiError>> {
  const result = await request<LoginResponse>(AUTH_ENDPOINTS.login, {
    method: "POST",
    body: credentials,
    auth: false,
  });

  if (!result.ok) {
    return result;
  }

  const token = normalizeToken(result.data);
  if (!token?.access) {
    return buildTokenFailure(result.status, result.data);
  }

  return {
    ok: true,
    status: result.status,
    headers: result.headers,
    data: { token },
  } satisfies ApiSuccess<LoginResult>;
}

export async function loginWithApple(
  payload: AppleAuthPayload
): Promise<ApiResult<AppleAuthSession, ApiError>> {
  const result = await request<{
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }>(AUTH_ENDPOINTS.apple, {
    method: "POST",
    body: payload,
    auth: false,
  });

  if (!result.ok) {
    return result;
  }

  const accessToken = result.data.accessToken ?? "";
  const refreshToken = result.data.refreshToken ?? "";
  const user = result.data.user ?? null;

  if (!accessToken || !refreshToken) {
    return buildTokenFailure(result.status, result.data);
  }

  if (!user) {
    return buildUserFailure(result.status, result.data);
  }

  return {
    ok: true,
    status: result.status,
    headers: result.headers,
    data: {
      token: {
        access: accessToken,
        refresh: refreshToken,
      },
      user,
    },
  } satisfies ApiSuccess<AppleAuthSession>;
}

export async function register(
  credentials: RegisterCredentials
): Promise<ApiResult<LoginResult | void, ApiError>> {
  const result = await request<LoginResponse | null>(AUTH_ENDPOINTS.signup, {
    method: "POST",
    body: credentials,
    auth: false,
  });

  if (!result.ok) {
    return result;
  }

  if (!result.data) {
    return {
      ok: true,
      status: result.status,
      headers: result.headers,
      data: undefined,
    } satisfies ApiSuccess<void>;
  }

  const token = normalizeToken(result.data);
  if (!token?.access) {
    return buildTokenFailure(result.status, result.data);
  }

  return {
    ok: true,
    status: result.status,
    headers: result.headers,
    data: { token },
  } satisfies ApiSuccess<LoginResult>;
}

export async function refreshSession(
  token: string
): Promise<ApiResult<LoginResult, ApiError>> {
  const result = await request<LoginResponse>(AUTH_ENDPOINTS.refresh, {
    method: "POST",
    body: { token, refreshToken: token, refresh: token },
    auth: false,
  });

  if (!result.ok) {
    console.warn("[auth][refresh] request failed", {
      status: result.status,
      message: result.error.message,
      details: result.error.details,
    });
    return result;
  }

  const refreshed = normalizeToken(result.data);
  if (!refreshed?.access) {
    return buildTokenFailure(result.status, result.data);
  }

  return {
    ok: true,
    status: result.status,
    headers: result.headers,
    data: { token: refreshed },
  } satisfies ApiSuccess<LoginResult>;
}

export async function getMe(
  accessToken?: string
): Promise<ApiResult<User, ApiError>> {
  return request<User>(AUTH_ENDPOINTS.me, {
    auth: !accessToken,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
}

export async function logout(): Promise<ApiResult<void, ApiError>> {
  return request<void>(AUTH_ENDPOINTS.logout, { method: "POST" });
}
