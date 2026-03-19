import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const apiProxyTarget = process.env.VITE_PROXY_API_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [
    // Dev-only middleware to ensure JS modules are served with a proper Content-Type
    {
      name: "fix-js-mime-dev-middleware",
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          try {
            if (!req || !req.url) return next();
            const url = req.url.split("?")[0];
            // Only attempt to fix JS-like module requests in dev
            if (url.endsWith(".js") || url.includes("/deps/") || url.includes("react_jsx-dev-runtime") || url.includes("react-dom_client")) {
              const ct = res.getHeader && res.getHeader("content-type");
              if (!ct) {
                res.setHeader && res.setHeader("content-type", "application/javascript; charset=utf-8");
              }
            }
          } catch (e) {
            // ignore middleware errors and continue
          }
          return next();
        });
      },
    },
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      // Legacy admin API paths fallback to /api/admin/*
      "/admin": {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (requestPath) => `/api${requestPath}`,
      },
    },
    hmr: {
      overlay: false,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
