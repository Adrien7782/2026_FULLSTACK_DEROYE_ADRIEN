import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../docs/openapi.js";

export const docsRouter = Router();

docsRouter.get("/docs/openapi.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

docsRouter.use("/docs/ui", swaggerUi.serve);
docsRouter.get("/docs/ui", swaggerUi.setup(openApiDocument, {
  customSiteTitle: "StreamAdy API",
  customCss: ".swagger-ui .topbar { display: none }",
}));

docsRouter.get("/docs", (_req, res) => {
  const pathEntries = Object.entries(openApiDocument.paths)
    .map(([path, methods]) => {
      const methodEntries = Object.entries(methods)
        .map(([method, operation]) => {
          const typedOperation = operation as { summary?: string; tags?: string[] };

          return `
            <li>
              <strong>${method.toUpperCase()}</strong>
              <code>${path}</code>
              <span>${typedOperation.summary ?? ""}</span>
            </li>
          `;
        })
        .join("");

      return methodEntries;
    })
    .join("");

  res
    .status(200)
    .type("html")
    .send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>StreamAdy API Docs</title>
          <style>
            :root {
              color-scheme: light dark;
              font-family: system-ui, sans-serif;
            }
            body {
              margin: 0;
              padding: 32px;
              background: #f7f4ee;
              color: #211c1c;
            }
            main {
              max-width: 960px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.88);
              border: 1px solid #ded8cc;
              border-radius: 20px;
              padding: 32px;
              box-shadow: 0 18px 48px rgba(25, 21, 21, 0.08);
            }
            h1, h2 {
              margin-top: 0;
            }
            code {
              background: #f0ece3;
              border-radius: 6px;
              padding: 2px 8px;
            }
            ul {
              padding-left: 18px;
            }
            li {
              margin-bottom: 12px;
            }
            .meta {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 24px;
            }
            .chip {
              border: 1px solid #d8cfbe;
              border-radius: 999px;
              padding: 6px 12px;
              background: #fffaf0;
            }
            .link-row {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-top: 24px;
            }
            a {
              color: #7f3d2a;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>${openApiDocument.info.title}</h1>
            <div class="meta">
              <span class="chip">Version ${openApiDocument.info.version}</span>
              <span class="chip">OpenAPI ${openApiDocument.openapi}</span>
            </div>
            <p>${openApiDocument.info.description}</p>
            <h2>Available Paths</h2>
            <ul>${pathEntries}</ul>
            <div class="link-row">
              <a href="/docs/ui">Swagger UI</a>
              <a href="/docs/openapi.json">OpenAPI JSON</a>
              <a href="/health">Health Check</a>
            </div>
          </main>
        </body>
      </html>
    `);
});
