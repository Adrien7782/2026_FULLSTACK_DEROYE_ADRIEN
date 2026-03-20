const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").trim();
const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";
const HEALTH_URL = API_ORIGIN ? `${API_ORIGIN}/health` : "/health";
const DOCS_URL = API_ORIGIN ? `${API_ORIGIN}/docs` : "/docs";
export const UPLOAD_MAX_VIDEO_MB = Number(import.meta.env.VITE_UPLOAD_MAX_VIDEO_MB ?? 15360);
export const UPLOAD_MAX_IMAGE_MB = Number(import.meta.env.VITE_UPLOAD_MAX_IMAGE_MB ?? 10);

// Le proxy Vite utilise follow-redirects (limite 10 Mo hardcodée).
// En dev, l'upload multipart va directement au backend pour éviter ce buffer.
const UPLOAD_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000/api"
  : API_BASE_URL;

export type UserRole = "standard" | "admin";
export type MediaType = "film" | "series";
export type MediaStatus = "draft" | "published" | "archived";

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
  status: MediaStatus;
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
    status?: "published" | "draft" | "all" | null;
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
  status?: "published" | "draft" | "all";
  cursor?: number | null;
  limit?: number;
};

export type PathValidationKind = "video" | "poster";

export type PathValidationResponse = {
  found: boolean;
  message: string;
  normalizedPath?: string | null;
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

export const getUploadTooLargeMessage = () =>
  `Fichier trop volumineux. Limites: ${UPLOAD_MAX_VIDEO_MB} Mo pour la video et ${UPLOAD_MAX_IMAGE_MB} Mo pour l'affiche.`;

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
      status: params.status,
      cursor: params.cursor,
      limit: params.limit,
    })}`,
    {
      method: "GET",
    },
  );

export const listCatalogGenres = (
  type: MediaType = "film",
  status?: "published" | "draft" | "all",
) =>
  request<{ items: CatalogGenre[] }>(
    `/media/genres${buildSearchParams({
      type,
      status,
    })}`,
    {
      method: "GET",
    },
  );

export const getMediaDetail = (slug: string) =>
  request<MediaDetailResponse>(`/media/${slug}`, {
    method: "GET",
  });

export const validateMediaPath = (path: string, kind: PathValidationKind) =>
  request<PathValidationResponse>("/admin/media/validate-path", {
    method: "POST",
    body: JSON.stringify({ path, kind }),
  });

export type CreateMediaResult = {
  media: MediaCardItem & { updatedAt: string };
};

export const createMediaWithProgress = (
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<CreateMediaResult> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        if (xhr.responseText) body = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        /* réponse non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as CreateMediaResult);
      } else {
        const fallbackMessage =
          xhr.status === 413 ? getUploadTooLargeMessage() : "Upload echoue";

        reject(
          new ApiClientError(
            (body["message"] as string | undefined) ?? fallbackMessage,
            xhr.status,
            body["details"],
          ),
        );
      }
    };

    xhr.onerror = () => reject(new ApiClientError("Erreur reseau pendant l'upload", 0));
    xhr.onabort = () => reject(new ApiClientError("Upload annule", 0));

    xhr.open("POST", `${UPLOAD_BASE_URL}/admin/media`);
    xhr.send(formData);
  });

// ─── Interactions (favoris, watchlist, notes, playback) ─────────────────────

export type MediaListItem = {
  id: string;
  slug: string;
  title: string;
  type: MediaType;
  releaseYear: number | null;
  durationMinutes: number | null;
  posterPath: string | null;
  status: string;
};

export type FavoriteItem = MediaListItem & { favoritedAt: string };
export type WatchlistEntry = MediaListItem & { addedAt: string };
export type HistoryEntry = MediaListItem & {
  hasPoster: boolean;
  positionSeconds: number;
  durationSeconds: number | null;
  completed: boolean;
  watchedAt: string;
};

export const toggleFavorite = (mediaId: string) =>
  request<{ favorited: boolean }>(`/me/favorites/${mediaId}`, { method: "POST" });

export const listFavorites = () =>
  request<{ items: FavoriteItem[] }>("/me/favorites", { method: "GET" });

export const getFavoriteStatus = (mediaId: string) =>
  request<{ favorited: boolean }>(`/me/favorites/${mediaId}`, { method: "GET" });

export const toggleWatchlist = (mediaId: string) =>
  request<{ inWatchlist: boolean }>(`/me/watchlist/${mediaId}`, { method: "POST" });

export const listWatchlist = () =>
  request<{ items: WatchlistEntry[] }>("/me/watchlist", { method: "GET" });

export const getWatchlistStatus = (mediaId: string) =>
  request<{ inWatchlist: boolean }>(`/me/watchlist/${mediaId}`, { method: "GET" });

export const upsertRating = (mediaId: string, value: number) =>
  request<{ value: number }>(`/me/ratings/${mediaId}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });

export const deleteRating = (mediaId: string) =>
  request<void>(`/me/ratings/${mediaId}`, { method: "DELETE" });

export const getRating = (mediaId: string) =>
  request<{ value: number | null }>(`/me/ratings/${mediaId}`, { method: "GET" });

export const getMediaAverageRating = (mediaId: string) =>
  request<{ average: number | null; count: number }>(`/me/ratings/${mediaId}/average`, {
    method: "GET",
  });

export const savePlayback = (
  mediaId: string,
  positionSeconds: number,
  durationSeconds?: number,
) =>
  request<void>(`/me/playback/${mediaId}`, {
    method: "PUT",
    body: JSON.stringify({ positionSeconds, durationSeconds }),
  });

export const getPlayback = (mediaId: string) =>
  request<{ positionSeconds: number; durationSeconds: number | null; completed: boolean }>(
    `/me/playback/${mediaId}`,
    { method: "GET" },
  );

export const listHistory = () =>
  request<{ items: HistoryEntry[] }>("/me/history", { method: "GET" });
