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
// Core API (account/wallets, accounts, phones, gifting) lives on a DIFFERENT
// host per docs §6. We expose it under a same-origin /coreapi prefix that maps
// to the upstream's /v2 base, mirroring the /api and /idp proxying.
const CORE_SANDBOX = 'https://api-sandbox.cashtoken.africa';

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
      // /coreapi/* -> {CORE_SANDBOX}/v2/*
      '/coreapi': {
        target: CORE_SANDBOX,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/coreapi/, '/v2'),
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
