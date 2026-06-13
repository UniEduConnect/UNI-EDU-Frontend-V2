import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Backend origin. The UNI-EDU backend does not send CORS headers, so in dev we
// proxy /api through Vite (same-origin to the browser) instead of calling it
// cross-origin. Override with VITE_BACKEND_ORIGIN if the backend URL changes.
const BACKEND_ORIGIN =
  process.env.VITE_BACKEND_ORIGIN ||
  // Local backend (dotnet run on :5115). Override with VITE_BACKEND_ORIGIN to
  // target the deployed load balancer instead.
  "http://localhost:5115";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Browser calls same-origin "/api/..."; Vite forwards to the backend.
      "/api": {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
