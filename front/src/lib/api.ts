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
  isPublic: boolean;
  notifyOnNewMedia: boolean;
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
  isPublic?: boolean;
  notifyOnNewMedia?: boolean;
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
    const message =
      response.status === 429
        ? "Trop de requêtes — réessaye dans quelques instants."
        : (payload?.message ?? "API request failed");
    throw new ApiClientError(message, response.status, payload?.details);
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
  genres: Array<{ id: string; name: string; slug: string }>;
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

export type MediaRatingEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  updatedAt: string;
};

export const getMediaRatings = (slug: string) =>
  request<{ ratings: MediaRatingEntry[] }>(`/media/${slug}/ratings`, { method: "GET" });

export type FollowStatus = "none" | "pending" | "accepted";

export type PublicUserProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  isPublic: boolean;
  followerCount: number;
  followingCount: number;
  followStatus: FollowStatus;
  currentRecommendation: {
    comment: string;
    media: { id: string; title: string; slug: string; type: MediaType };
  } | null;
  favorites: Array<{ id: string; title: string; slug: string; type: string; posterPath: string | null }> | null;
};

export type RecommendationItem = {
  id: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
  media: { id: string; title: string; slug: string; type: MediaType; synopsis: string; posterPath: string | null };
};

export type UserSearchResult = {
  id: string;
  username: string;
  avatarUrl: string | null;
  isPublic: boolean;
};

export const getUserPublicProfile = (username: string) =>
  request<{ user: PublicUserProfile }>(`/users/by/${username}`, { method: "GET" });

export const searchUsers = (q: string) =>
  request<{ users: UserSearchResult[] }>(`/users/search?q=${encodeURIComponent(q)}`, { method: "GET" });

// ─── Social ───────────────────────────────────────────────────────────────────

export const followUser = (userId: string) =>
  request<{ follow: { id: string; status: string } }>(`/social/follow/${userId}`, { method: "POST" });

export const unfollowUser = (userId: string) =>
  request<void>(`/social/follow/${userId}`, { method: "DELETE" });

export const getFollowStatus = (userId: string) =>
  request<{ status: FollowStatus }>(`/social/follow-status/${userId}`, { method: "GET" });

export const listFollowers = () =>
  request<{ items: UserSearchResult[] }>("/social/followers", { method: "GET" });

export const listFollowing = () =>
  request<{ items: UserSearchResult[] }>("/social/following", { method: "GET" });

export const acceptFollowRequest = (followId: string) =>
  request<void>(`/social/follow-requests/${followId}/accept`, { method: "PATCH" });

export const refuseFollowRequest = (followId: string) =>
  request<void>(`/social/follow-requests/${followId}/refuse`, { method: "PATCH" });

export const listRecommendations = () =>
  request<{ items: RecommendationItem[] }>("/social/recommendations", { method: "GET" });

export const getMyRecommendation = () =>
  request<{ recommendation: RecommendationItem | null }>("/social/me/recommendation", { method: "GET" });

export const upsertRecommendation = (mediaId: string, comment: string) =>
  request<{ recommendation: RecommendationItem }>(`/social/me/recommendation/${mediaId}`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });

export const deleteRecommendation = () =>
  request<void>("/social/me/recommendation", { method: "DELETE" });

// ─── Suggestions ─────────────────────────────────────────────────────────────

export type SuggestionStatus = "pending" | "accepted" | "refused" | "processed";

export type SuggestionItem = {
  id: string;
  title: string;
  synopsis: string | null;
  adminNote: string | null;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
  media: { id: string; slug: string; title: string } | null;
};

export type AdminSuggestionItem = SuggestionItem & {
  user: { id: string; username: string; avatarUrl: string | null };
};

export const createSuggestion = (title: string, synopsis?: string) =>
  request<{ suggestion: SuggestionItem }>("/suggestions", {
    method: "POST",
    body: JSON.stringify({ title, synopsis }),
  });

export const listMySuggestions = () =>
  request<{ items: SuggestionItem[] }>("/suggestions", { method: "GET" });

export const cancelSuggestion = (id: string) =>
  request<void>(`/suggestions/${id}`, { method: "DELETE" });

export const listAdminSuggestions = (status?: string) =>
  request<{ items: AdminSuggestionItem[] }>(
    `/admin/suggestions${status ? `?status=${status}` : ""}`,
    { method: "GET" },
  );

export const updateSuggestionStatus = (
  id: string,
  status: "accepted" | "refused" | "processed",
  adminNote?: string,
  mediaId?: string,
) =>
  request<{ suggestion: AdminSuggestionItem }>(`/admin/suggestions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote, mediaId }),
  });

// ─── Admin users ─────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  _count: { favorites: number; ratings: number; suggestions: number };
};

export const listAdminUsers = () =>
  request<{ users: AdminUser[] }>("/admin/users", { method: "GET" });

export const updateUserRole = (id: string, role: UserRole) =>
  request<{ user: AdminUser }>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

// ─── Admin media list ─────────────────────────────────────────────────────────

export type AdminMediaItem = {
  id: string;
  slug: string;
  title: string;
  type: MediaType;
  status: string;
  releaseYear: number | null;
  durationMinutes: number | null;
  hasPoster: boolean;
  createdAt: string;
  _count: { favorites: number; ratings: number };
};

export const listAdminMedia = (status?: string) =>
  request<{ items: AdminMediaItem[] }>(
    `/admin/media${status ? `?status=${status}` : ""}`,
    { method: "GET" },
  );

export const deleteMediaBySlug = (slug: string) =>
  request<void>(`/admin/media/${slug}`, { method: "DELETE" });

// ─── Series ──────────────────────────────────────────────────────────────────

export type EpisodeItem = {
  id: string;
  number: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number | null;
  status: MediaStatus;
  hasVideo: boolean;
  createdAt: string;
};

export type SeasonItem = {
  id: string;
  number: number;
  title: string | null;
  synopsis: string | null;
  episodeCount: number;
  episodes: EpisodeItem[];
};

export type SerieDetailResponse = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  type: MediaType;
  status: MediaStatus;
  releaseYear: number | null;
  hasPoster: boolean;
  hasDirPath: boolean;
  createdAt: string;
  updatedAt: string;
  genres: MediaGenre[];
  seasons: SeasonItem[];
};

export type SeriesDirectoryScan = {
  posterRelativePath: string | null;
  seasons: Array<{
    number: number;
    title: string;
    episodes: Array<{ number: number; title: string; relativePath: string }>;
  }>;
};

export const getSerieDetail = (slug: string) =>
  request<SerieDetailResponse>(`/series/${slug}`, { method: "GET" });

export type EpisodeDetail = {
  id: string;
  number: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number | null;
  status: MediaStatus;
  videoPath: string | null;
  season: {
    number: number;
    title: string | null;
    serie: { media: { id: string; slug: string; title: string; status: MediaStatus } };
  };
};

export const getEpisode = (id: string) =>
  request<{ episode: EpisodeDetail }>(`/series/episodes/${id}`, { method: "GET" });

export const getEpisodeProgress = (id: string) =>
  request<{ progress: { positionSeconds: number; durationSeconds: number | null; completed: boolean } | null }>(
    `/series/episodes/${id}/progress`,
    { method: "GET" },
  );

export const saveEpisodeProgress = (
  id: string,
  positionSeconds: number,
  durationSeconds?: number,
  completed?: boolean,
) =>
  request<void>(`/series/episodes/${id}/progress`, {
    method: "POST",
    body: JSON.stringify({ positionSeconds, durationSeconds, completed }),
  });

export const getEpisodeStreamUrl = (id: string) =>
  `${API_BASE_URL}/series/episodes/${id}/stream`;

export const getSerieResume = (slug: string) =>
  request<{ episodeId: string | null }>(`/series/${slug}/resume`, { method: "GET" });

export const createAdminSeries = (formData: FormData) =>
  fetch(`${API_BASE_URL}/admin/series`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? "Erreur");
    }
    return r.json() as Promise<{ serie: { id: string; slug: string; title: string } }>;
  });

export const addAdminSeason = (
  slug: string,
  data: { number: number; title?: string; synopsis?: string },
) =>
  request<{ season: { id: string; number: number; title: string | null } }>(
    `/admin/series/${slug}/seasons`,
    { method: "POST", body: JSON.stringify(data) },
  );

export const addAdminEpisode = (slug: string, seasonNumber: number, formData: FormData) =>
  fetch(`${API_BASE_URL}/admin/series/${slug}/seasons/${seasonNumber}/episodes`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? "Erreur");
    }
    return r.json() as Promise<{ episode: { id: string; number: number; title: string } }>;
  });

export const createFilmByPath = (data: {
  title: string;
  synopsis: string;
  videoPath: string;
  posterPath?: string;
  releaseYear?: number;
  status: "published" | "draft" | "archived";
  genreIds?: string[];
}) =>
  request<CreateMediaResult>("/admin/media", {
    method: "POST",
    body: JSON.stringify(data),
  });

export type FilmDirectoryScan = {
  videoRelativePath: string | null;
  posterRelativePath: string | null;
};

export const scanFilmPath = (dirPath: string) =>
  request<{ scan: FilmDirectoryScan }>("/admin/films/scan-path", {
    method: "POST",
    body: JSON.stringify({ dirPath }),
  });

export const importFilmFromDir = (data: {
  dirPath: string;
  title: string;
  synopsis: string;
  releaseYear?: number;
  status: "published" | "draft" | "archived";
  genreIds?: string[];
}) =>
  request<{ media: MediaCardItem & { updatedAt: string }; scan: FilmDirectoryScan }>(
    "/admin/films/import-from-dir",
    { method: "POST", body: JSON.stringify(data) },
  );

export const updateFilmMeta = (
  slug: string,
  data: {
    title?: string;
    synopsis?: string;
    releaseYear?: number | null;
    status?: "draft" | "published" | "archived";
    genreIds?: string[];
    dirPath?: string;
  },
) =>
  request<{ media: { id: string; slug: string; title: string }; scan: FilmDirectoryScan | null }>(
    `/admin/films/${slug}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );

export const getAdminFilmDirPath = (slug: string) =>
  request<{ filmDirPath: string | null }>(`/admin/films/${slug}`, { method: "GET" });

export const updateSeriesMeta = (
  slug: string,
  data: {
    title?: string;
    synopsis?: string;
    releaseYear?: number | null;
    status?: "draft" | "published" | "archived";
    genreIds?: string[];
  },
) =>
  request<{ serie: { id: string; slug: string; title: string } }>(
    `/admin/series/${slug}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );

export const getAdminPreviewAssetUrl = (relativePath: string) =>
  `${API_BASE_URL}/admin/preview-asset?path=${encodeURIComponent(relativePath)}`;

export const scanSeriesPath = (dirPath: string) =>
  request<{ scan: SeriesDirectoryScan }>("/admin/series/scan-path", {
    method: "POST",
    body: JSON.stringify({ dirPath }),
  });

export const importSeriesFromDir = (data: {
  dirPath: string;
  title: string;
  synopsis: string;
  releaseYear?: number;
  status: "published" | "draft" | "archived";
  genreIds?: string[];
}) =>
  request<{ serie: { id: string; slug: string; title: string }; scan: SeriesDirectoryScan }>(
    "/admin/series/import-from-dir",
    { method: "POST", body: JSON.stringify(data) },
  );

export const refreshSeriesFromDir = (slug: string) =>
  request<{ addedSeasons: number; addedEpisodes: number }>(
    `/admin/series/${slug}/refresh`,
    { method: "POST" },
  );

export const renameSeasonAdmin = (slug: string, seasonNumber: number, title: string) =>
  request<{ season: { id: string; number: number; title: string } }>(
    `/admin/series/${slug}/seasons/${seasonNumber}`,
    { method: "PATCH", body: JSON.stringify({ title }) },
  );

export const renameEpisodeAdmin = (episodeId: string, title: string) =>
  request<{ episode: { id: string; number: number; title: string } }>(
    `/admin/episodes/${episodeId}`,
    { method: "PATCH", body: JSON.stringify({ title }) },
  );

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "suggestion_accepted"
  | "suggestion_refused"
  | "suggestion_processed"
  | "new_episode"
  | "follow_request"
  | "follow_accepted"
  | "new_media"
  | "new_recommendation";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  link: string | null;
  relatedId: string | null;
  createdAt: string;
};

export const listNotifications = () =>
  request<{ items: NotificationItem[]; unreadCount: number }>("/notifications", { method: "GET" });

export const getUnreadCount = () =>
  request<{ count: number }>("/notifications/unread-count", { method: "GET" });

export const markNotificationRead = (id: string) =>
  request<void>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  request<void>("/notifications/read-all", { method: "POST" });
