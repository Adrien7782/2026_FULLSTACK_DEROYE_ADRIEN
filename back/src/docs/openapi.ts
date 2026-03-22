export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "StreamAdy API",
    version: "1.0.0",
    description:
      "V1 API — authentication, users, media catalog, streaming, interactions (favorites, watchlist, ratings, playback), suggestions workflow and admin management.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "System", description: "Technical endpoints for platform health and docs." },
    { name: "Auth", description: "Registration, login, session rotation and logout." },
    { name: "Users", description: "Authenticated user profile management and public profiles." },
    { name: "Media", description: "Catalog listing, filters, home feed, media detail, streaming and ratings." },
    { name: "Interactions", description: "Favorites, watchlist, ratings, playback progress and history." },
    { name: "Suggestions", description: "Suggestion workflow — users propose films, admins process them." },
    { name: "Admin", description: "Administration — media CRUD, suggestion management, user role management." },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "HTTP-only session cookie set on login/register.",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          message: { type: "string" },
          details: {},
        },
      },
      SessionUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          firstName: { type: "string", nullable: true },
          lastName: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true },
          isLikesPrivate: { type: "boolean" },
          role: { type: "string", enum: ["standard", "admin"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MediaCard: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          catalogIndex: { type: "integer" },
          slug: { type: "string" },
          title: { type: "string" },
          synopsis: { type: "string" },
          type: { type: "string", enum: ["film", "series"] },
          status: { type: "string", enum: ["draft", "published", "archived"] },
          releaseYear: { type: "integer", nullable: true },
          durationMinutes: { type: "integer", nullable: true },
          hasVideo: { type: "boolean" },
          hasPoster: { type: "boolean" },
          hasBackdrop: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          genres: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                slug: { type: "string" },
              },
            },
          },
        },
      },
      SuggestionStatus: {
        type: "string",
        enum: ["pending", "accepted", "refused", "processed"],
      },
      SuggestionItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          synopsis: { type: "string", nullable: true },
          adminNote: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/SuggestionStatus" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          media: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string" },
              slug: { type: "string" },
              title: { type: "string" },
            },
          },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    // ── System ────────────────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["System"],
        summary: "Check API and database availability",
        security: [],
        responses: {
          "200": { description: "API is healthy — returns service name, database status and timestamp" },
        },
      },
    },
    "/docs/openapi.json": {
      get: {
        tags: ["System"],
        summary: "Retrieve the OpenAPI document in JSON",
        security: [],
        responses: { "200": { description: "OpenAPI JSON document" } },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new standard user and open a session",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", minLength: 3, maxLength: 30 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  firstName: { type: "string", nullable: true },
                  lastName: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered — session cookie set" },
          "400": { description: "Validation error" },
          "409": { description: "Username or email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with username and password",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Authenticated session created — session cookie set" },
          "400": { description: "Validation error" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate the current session token",
        responses: {
          "200": { description: "Session rotated — new cookie set" },
          "401": { description: "Missing or invalid session" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout from the current device session",
        responses: {
          "200": { description: "Session closed — cookie cleared" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout from all active sessions",
        responses: {
          "200": { description: "All sessions closed" },
          "401": { description: "Authentication required" },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    "/api/users/by/{username}": {
      get: {
        tags: ["Users"],
        summary: "Get a public user profile by username",
        security: [],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Public profile returned (id, username, avatarUrl, createdAt)" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user profile",
        responses: {
          "200": { description: "Current user and session returned" },
          "401": { description: "Authentication required" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update the authenticated user profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  firstName: { type: "string", nullable: true },
                  lastName: { type: "string", nullable: true },
                  avatarUrl: { type: "string", nullable: true },
                  isLikesPrivate: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "409": { description: "Username or email already taken" },
        },
      },
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    "/api/media": {
      get: {
        tags: ["Media"],
        summary: "List catalog media with title search, genre filter, status filter and cursor pagination",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["film", "series"], default: "film" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "genre", in: "query", schema: { type: "string", description: "Genre slug" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["published", "draft", "all"] } },
          { name: "cursor", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Catalog page returned — includes items, pageInfo and active filters" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/media/home": {
      get: {
        tags: ["Media"],
        summary: "Home feed — spotlight media, recent additions, genre highlights",
        responses: {
          "200": { description: "Home catalog payload returned" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/media/genres": {
      get: {
        tags: ["Media"],
        summary: "List available genres for the requested media type",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["film", "series"], default: "film" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["published", "draft", "all"] } },
        ],
        responses: { "200": { description: "Genre list with mediaCount returned" } },
      },
    },
    "/api/media/{slug}": {
      get: {
        tags: ["Media"],
        summary: "Retrieve a published media detail page by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Media detail and related items returned" },
          "401": { description: "Authentication required" },
          "404": { description: "Media not found" },
        },
      },
    },
    "/api/media/{slug}/poster": {
      get: {
        tags: ["Media"],
        summary: "Return the poster asset for a published media",
        security: [],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Poster image returned" },
          "404": { description: "Poster or media not found" },
        },
      },
    },
    "/api/media/{slug}/stream": {
      get: {
        tags: ["Media"],
        summary: "Stream a published local video file with HTTP Range support",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "Range", in: "header", schema: { type: "string", example: "bytes=0-1048575" } },
        ],
        responses: {
          "200": { description: "Full video file returned" },
          "206": { description: "Partial video chunk returned" },
          "401": { description: "Authentication required" },
          "404": { description: "Video or media not found" },
        },
      },
    },
    "/api/media/{slug}/ratings": {
      get: {
        tags: ["Media"],
        summary: "List all user ratings for a media",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Ratings list returned — each entry has userId, username, avatarUrl, value (1-5), updatedAt",
          },
          "401": { description: "Authentication required" },
          "404": { description: "Media not found" },
        },
      },
    },

    // ── Interactions ──────────────────────────────────────────────────────────
    "/api/me/favorites/{mediaId}": {
      get: {
        tags: ["Interactions"],
        summary: "Check if a media is in the user's favorites",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { favorited: boolean }" },
          "401": { description: "Authentication required" },
        },
      },
      post: {
        tags: ["Interactions"],
        summary: "Toggle a media in the user's favorites (add if absent, remove if present)",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { favorited: boolean } with the new state" },
          "401": { description: "Authentication required" },
          "404": { description: "Media not found" },
        },
      },
    },
    "/api/me/favorites": {
      get: {
        tags: ["Interactions"],
        summary: "List all favorites for the authenticated user",
        responses: {
          "200": { description: "Array of favorite media items with favoritedAt timestamp" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/me/watchlist/{mediaId}": {
      get: {
        tags: ["Interactions"],
        summary: "Check if a media is in the user's watchlist",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { inWatchlist: boolean }" },
          "401": { description: "Authentication required" },
        },
      },
      post: {
        tags: ["Interactions"],
        summary: "Toggle a media in the user's watchlist",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { inWatchlist: boolean } with the new state" },
          "401": { description: "Authentication required" },
          "404": { description: "Media not found" },
        },
      },
    },
    "/api/me/watchlist": {
      get: {
        tags: ["Interactions"],
        summary: "List all watchlist entries for the authenticated user",
        responses: {
          "200": { description: "Array of watchlist media items with addedAt timestamp" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/me/ratings/{mediaId}": {
      get: {
        tags: ["Interactions"],
        summary: "Get the authenticated user's rating for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { value: number | null }" },
          "401": { description: "Authentication required" },
        },
      },
      put: {
        tags: ["Interactions"],
        summary: "Create or update a rating (1–5) for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["value"],
                properties: { value: { type: "integer", minimum: 1, maximum: 5 } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rating saved — returns { value: number }" },
          "400": { description: "Validation error (value out of 1-5 range)" },
          "401": { description: "Authentication required" },
          "404": { description: "Media not found" },
        },
      },
      delete: {
        tags: ["Interactions"],
        summary: "Delete the authenticated user's rating for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Rating deleted" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/me/ratings/{mediaId}/average": {
      get: {
        tags: ["Interactions"],
        summary: "Get the average rating and count for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { average: number | null, count: number }" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/me/playback/{mediaId}": {
      get: {
        tags: ["Interactions"],
        summary: "Get the last playback position for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Returns { positionSeconds, durationSeconds, completed }" },
          "401": { description: "Authentication required" },
          "404": { description: "No playback record found" },
        },
      },
      put: {
        tags: ["Interactions"],
        summary: "Save or update the playback position for a media",
        parameters: [{ name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["positionSeconds"],
                properties: {
                  positionSeconds: { type: "number", minimum: 0 },
                  durationSeconds: { type: "number", minimum: 0, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "204": { description: "Playback position saved" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/me/history": {
      get: {
        tags: ["Interactions"],
        summary: "List the authenticated user's watch history",
        responses: {
          "200": {
            description:
              "Array of history entries sorted by watchedAt desc — includes positionSeconds, durationSeconds, completed",
          },
          "401": { description: "Authentication required" },
        },
      },
    },

    // ── Suggestions ───────────────────────────────────────────────────────────
    "/api/suggestions": {
      get: {
        tags: ["Suggestions"],
        summary: "List the authenticated user's own suggestions",
        responses: {
          "200": { description: "Array of SuggestionItem returned" },
          "401": { description: "Authentication required" },
        },
      },
      post: {
        tags: ["Suggestions"],
        summary: "Submit a new film suggestion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  synopsis: { type: "string", maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Suggestion created — returns { suggestion: SuggestionItem }" },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/suggestions/{id}": {
      delete: {
        tags: ["Suggestions"],
        summary: "Cancel a pending suggestion (only the author can cancel, and only if still pending)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Suggestion cancelled" },
          "401": { description: "Authentication required" },
          "403": { description: "Not the author or suggestion is not in pending state" },
          "404": { description: "Suggestion not found" },
        },
      },
    },

    // ── Admin ──────────────────────────────────────────────────────────────────
    "/api/admin/suggestions": {
      get: {
        tags: ["Admin"],
        summary: "List all suggestions with optional status filter (admin only)",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "accepted", "refused", "processed"] },
          },
        ],
        responses: {
          "200": { description: "Array of AdminSuggestionItem (includes user info)" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
        },
      },
    },
    "/api/admin/suggestions/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a suggestion status, adminNote and optionally link a media (admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["accepted", "refused", "processed"] },
                  adminNote: { type: "string", nullable: true },
                  mediaId: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Suggestion updated — returns { suggestion: AdminSuggestionItem }" },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
          "404": { description: "Suggestion not found" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users with interaction counts (admin only)",
        responses: {
          "200": { description: "Array of AdminUser with _count of favorites, ratings, suggestions" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
        },
      },
    },
    "/api/admin/users/{id}/role": {
      patch: {
        tags: ["Admin"],
        summary: "Change a user's role (admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { type: "string", enum: ["standard", "admin"] } },
              },
            },
          },
        },
        responses: {
          "200": { description: "User role updated" },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/media": {
      get: {
        tags: ["Admin"],
        summary: "List all media with optional status filter (admin only)",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["draft", "published", "archived"] },
          },
        ],
        responses: {
          "200": { description: "Array of AdminMediaItem with _count of favorites and ratings" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new film by referencing local files or by uploading managed copies (admin only)",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "synopsis"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  synopsis: { type: "string", maxLength: 2000 },
                  releaseYear: { type: "integer", minimum: 1888, maximum: 2100 },
                  durationMinutes: { type: "integer", minimum: 1, maximum: 999 },
                  status: { type: "string", enum: ["draft", "published"], default: "published" },
                  genreIds: { type: "string", description: "JSON-encoded array of genre UUIDs" },
                  videoSourceMode: { type: "string", enum: ["reference", "upload"], default: "reference" },
                  posterSourceMode: { type: "string", enum: ["reference", "upload"], default: "reference" },
                  videoPath: { type: "string" },
                  posterPath: { type: "string" },
                  video: { type: "string", format: "binary" },
                  poster: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Media created — returns { media }" },
          "400": { description: "Validation error or invalid file type/size" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
          "413": { description: "File too large" },
        },
      },
    },
    "/api/admin/media/validate-path": {
      post: {
        tags: ["Admin"],
        summary: "Validate that a local video or poster path can be read by the backend",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["path", "kind"],
                properties: {
                  path: { type: "string" },
                  kind: { type: "string", enum: ["video", "poster"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Returns { found, message, normalizedPath }" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
        },
      },
    },
    "/api/admin/media/{slug}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete a media by slug and remove its associated files (admin only)",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Media and associated files deleted" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin role required" },
          "404": { description: "Media not found" },
        },
      },
    },
  },
} as const;
