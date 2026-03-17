export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "StreamAdy API",
    version: "0.3.0",
    description: "Phase 2 API document for authentication, users and media catalog.",
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
    { name: "Users", description: "Authenticated user profile management." },
    { name: "Media", description: "Catalog listing, filters, home feed and media detail." },
    { name: "Suggestions", description: "Suggestion workflow module placeholder." },
    { name: "Admin", description: "Administration module placeholder." },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Check API and database availability",
        responses: {
          "200": {
            description: "API is healthy",
          },
        },
      },
    },
    "/docs/openapi.json": {
      get: {
        tags: ["System"],
        summary: "Retrieve the OpenAPI document",
        responses: {
          "200": {
            description: "OpenAPI JSON document",
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new standard user and open a session",
        responses: {
          "201": {
            description: "User registered",
          },
          "409": {
            description: "Username or email already exists",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with username and password",
        responses: {
          "200": {
            description: "Authenticated session created",
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate the current session token",
        responses: {
          "200": {
            description: "Session rotated",
          },
          "401": {
            description: "Missing or invalid session",
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout from the current device session",
        responses: {
          "200": {
            description: "Session closed",
          },
        },
      },
    },
    "/api/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout from all active sessions",
        responses: {
          "200": {
            description: "All sessions closed",
          },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user profile",
        responses: {
          "200": {
            description: "Current user returned",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update the authenticated user profile",
        responses: {
          "200": {
            description: "Profile updated",
          },
          "409": {
            description: "Username or email already exists",
          },
        },
      },
    },
    "/api/media": {
      get: {
        tags: ["Media"],
        summary: "List published catalog media with title search, genre filter and cursor pagination",
        responses: {
          "200": {
            description: "Catalog page returned",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
    },
    "/api/media/home": {
      get: {
        tags: ["Media"],
        summary: "Return the home feed with spotlight media, recent additions and genre highlights",
        responses: {
          "200": {
            description: "Home catalog payload returned",
          },
        },
      },
    },
    "/api/media/genres": {
      get: {
        tags: ["Media"],
        summary: "List available genres for the requested media type",
        responses: {
          "200": {
            description: "Genre list returned",
          },
        },
      },
    },
    "/api/media/{slug}": {
      get: {
        tags: ["Media"],
        summary: "Retrieve a published media detail page by slug",
        responses: {
          "200": {
            description: "Media detail returned",
          },
          "404": {
            description: "Media not found",
          },
        },
      },
    },
    "/api/suggestions": {
      get: {
        tags: ["Suggestions"],
        summary: "Suggestions module placeholder protected by authentication",
        responses: {
          "200": {
            description: "Suggestions module scaffold is available",
          },
        },
      },
    },
    "/api/admin": {
      get: {
        tags: ["Admin"],
        summary: "Admin module placeholder protected by admin authorization",
        responses: {
          "200": {
            description: "Admin module scaffold is available",
          },
          "403": {
            description: "Admin role required",
          },
        },
      },
    },
  },
} as const;
