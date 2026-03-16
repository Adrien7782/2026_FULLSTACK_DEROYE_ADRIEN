export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "StreamAdy API",
    version: "0.1.0",
    description: "Skeleton OpenAPI document for the StreamAdy backend.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "System", description: "Technical endpoints for platform health and docs." },
    { name: "Auth", description: "Authentication module placeholder." },
    { name: "Users", description: "User management module placeholder." },
    { name: "Media", description: "Media catalog module placeholder." },
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
    "/api/auth": {
      get: {
        tags: ["Auth"],
        summary: "Authentication module placeholder",
        responses: {
          "200": {
            description: "Auth module scaffold is available",
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Users module placeholder",
        responses: {
          "200": {
            description: "Users module scaffold is available",
          },
        },
      },
    },
    "/api/media": {
      get: {
        tags: ["Media"],
        summary: "Media module placeholder",
        responses: {
          "200": {
            description: "Media module scaffold is available",
          },
        },
      },
    },
    "/api/suggestions": {
      get: {
        tags: ["Suggestions"],
        summary: "Suggestions module placeholder",
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
        summary: "Admin module placeholder",
        responses: {
          "200": {
            description: "Admin module scaffold is available",
          },
        },
      },
    },
  },
} as const;
