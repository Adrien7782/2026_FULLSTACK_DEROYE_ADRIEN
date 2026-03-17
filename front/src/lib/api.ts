const API_ORIGIN = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_BASE_URL = `${API_ORIGIN}/api`;

export type UserRole = "standard" | "admin";

export type HealthResponse = {
  ok: boolean;
  service: string;
  database: string;
  timestamp: string;
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isLikesPrivate: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type SessionInfo = {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = {
  message: string;
  user: SessionUser;
  session: SessionInfo;
};

export type CurrentUserPayload = {
  user: SessionUser;
  session: SessionInfo;
};

export type ApiMessage = {
  message: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type UpdateProfileInput = {
  username?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isLikesPrivate?: boolean;
};

type ApiErrorBody = {
  message?: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export const getApiOrigin = () => API_ORIGIN;

export const getApiBaseUrl = () => API_BASE_URL;

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiErrorBody)
    : null;

  if (!response.ok) {
    throw new ApiClientError(
      payload?.message ?? "API request failed",
      response.status,
      payload?.details,
    );
  }

  return payload as T;
};

export const getHealth = async () => {
  const response = await fetch(`${API_ORIGIN}/health`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiClientError("Failed to fetch health status", response.status);
  }

  return (await response.json()) as HealthResponse;
};

export const registerUser = (input: RegisterInput) =>
  request<AuthPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const loginUser = (input: LoginInput) =>
  request<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const refreshSession = () =>
  request<AuthPayload>("/auth/refresh", {
    method: "POST",
  });

export const logoutUser = () =>
  request<ApiMessage>("/auth/logout", {
    method: "POST",
  });

export const logoutAllSessions = () =>
  request<ApiMessage>("/auth/logout-all", {
    method: "POST",
  });

export const getCurrentUser = () =>
  request<CurrentUserPayload>("/users/me", {
    method: "GET",
  });

export const updateCurrentUser = (input: UpdateProfileInput) =>
  request<AuthPayload>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
