import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

/**
 * Thin BFF: proxies `/api/*` to the Spring backend and, once the frontend is built, serves it as a
 * single-page app. In dev, `npm run dev` (Vite) proxies `/api` directly instead — this server only
 * matters for a production-style run (`npm run build && npm run server:start`).
 */

const PORT = Number(process.env.PORT ?? 3000);
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

const app = express();

app.use(
  createProxyMiddleware({
    // `pathFilter` (not `app.use("/api", ...)`) so Express doesn't strip the `/api` prefix from
    // `req.url` before the proxy sees it — the backend's routes are mounted at `/api` too.
    pathFilter: "/api",
    target: BACKEND_URL,
    changeOrigin: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "UP" });
});

app.use(express.static(distDir));

// SPA fallback: any other GET that isn't a real file falls through to index.html so React Router
// can handle the route client-side. Express 5 dropped bare `*` route patterns, so this is a
// path-less middleware instead of `app.get('*', ...)`.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`PR Tracker BFF listening on :${PORT}, proxying /api to ${BACKEND_URL}`);
});
