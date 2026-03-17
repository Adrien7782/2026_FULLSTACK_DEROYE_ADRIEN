const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").trim();
const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";
const HEALTH_URL = API_ORIGIN ? `${API_ORIGIN}/health` : "/health";
const DOCS_URL = API_ORIGIN ? `${API_ORIGIN}/docs` : "/docs";

export type UserRole = "standard" | "admin";
export type MediaType = "film" | "series";

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

export type MediaGenre = {
  id: string;
  name: string;
  slug: string;
};

export type MediaCardItem = {
  id: string;
  catalogIndex: number;
  slug: string;
  title: string;
  synopsis: string;
  type: MediaType;
  releaseYear: number | null;
  durationMinutes: number | null;
  hasVideo: boolean;
  hasPoster: boolean;
  hasBackdrop: boolean;
  createdAt: string;
  genres: MediaGenre[];
};

export type CatalogGenre = {
  id: string;
  name: string;
  slug: string;
  mediaCount: number;
};

export type CatalogListResponse = {
  items: MediaCardItem[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: number | null;
    limit: number;
  };
  filters: {
    type: MediaType;
    search: string | null;
    genre: string | null;
  };
};

export type CatalogHomeResponse = {
  spotlight: MediaCardItem | null;
  recent: MediaCardItem[];
  genres: CatalogGenre[];
};

export type MediaDetailResponse = {
  item: MediaCardItem & {
    updatedAt: string;
    stats: {
      genreCount: number;
      catalogPosition: number;
    };
  };
  related: MediaCardItem[];
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

export type ListMediaParams = {
  type?: MediaType;
  search?: string;
  genre?: string;
  cursor?: number | null;
  limit?: number;
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

export const getDocsUrl = () => DOCS_URL;

export const getMediaPosterUrl = (slug: string) =>
  `${API_BASE_URL}/media/${encodeURIComponent(slug)}/poster`;

export const getMediaStreamUrl = (slug: string) =>
  `${API_BASE_URL}/media/${encodeURIComponent(slug)}/stream`;

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

const buildSearchParams = (params: Record<string, string | number | null | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      searchParams.set(key, String(value));
    }
  }

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
};

export const getHealth = async () => {
  const response = await fetch(HEALTH_URL, {
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

export const getCatalogHome = () =>
  request<CatalogHomeResponse>("/media/home", {
    method: "GET",
  });

export const listCatalogMedia = (params: ListMediaParams = {}) =>
  request<CatalogListResponse>(
    `/media${buildSearchParams({
      type: params.type ?? "film",
      search: params.search,
      genre: params.genre,
      cursor: params.cursor,
      limit: params.limit,
    })}`,
    {
      method: "GET",
    },
  );

export const listCatalogGenres = (type: MediaType = "film") =>
  request<{ items: CatalogGenre[] }>(
    `/media/genres${buildSearchParams({
      type,
    })}`,
    {
      method: "GET",
    },
  );

export const getMediaDetail = (slug: string) =>
  request<MediaDetailResponse>(`/media/${slug}`, {
    method: "GET",
  });
