import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// Per v2_technical_api_documentation.md §"Base URLs & Environments":
//   - VAS API (BASE_URL): https://vasapi-sandbox.cashtoken.africa
//     Hosts /idp/* (proxied to upstream IDP) AND /api/*.
//   - IDP direct host:    https://id-sandbox.cashtoken.africa
//     Only used directly for /oauth/token/introspect.
// All /idp/* and /api/* calls in this app should target the VAS API host.
const VAS_SANDBOX = 'https://vasapi-sandbox.cashtoken.africa';

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Same-origin proxy avoids CORS in dev. Browser hits /idp/* and /api/*,
    // Vite forwards verbatim to the VAS API sandbox.
    proxy: {
      '/idp': {
        target: VAS_SANDBOX,
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: VAS_SANDBOX,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
