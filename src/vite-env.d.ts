/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CASHTOKEN_API_BASE?: string;
  readonly VITE_CASHTOKEN_API_KEY?: string;
  readonly VITE_CASHTOKEN_QA_BEARER_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
