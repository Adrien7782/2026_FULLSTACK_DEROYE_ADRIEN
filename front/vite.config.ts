import * as http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    // Le proxy Vite utilise follow-redirects (bufferise tout le body, limite 10 Mo).
    // prependListener s'exécute avant connect ET avant le proxy — aucun buffering.
    {
      name: "stream-upload-proxy",
      configureServer(server) {
        server.httpServer?.prependListener(
          "request",
          (req: IncomingMessage, res: ServerResponse) => {
            if (req.method !== "POST" || req.url !== "/api/admin/media") return;

            const proxyReq = http.request(
              {
                hostname: "localhost",
                port: 3000,
                path: "/api/admin/media",
                method: "POST",
                headers: { ...req.headers, host: "localhost:3000" },
              },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
                proxyRes.pipe(res);
              },
            );

            proxyReq.on("error", () => res.destroy());
            req.pipe(proxyReq);
          },
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/docs": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
