// Cashtoken VAS API client — sign-in / sign-out / user-info.
// Spec: API DOCUMENTATION/v2_technical_api_documentation (1).md §1 (auth flow).
//
// Sign-in is a THREE-step flow:
//   1. POST /idp/authenticate/silent-mode    (no auth) → access_token (subject)
//   2. POST /idp/authenticate/otp-challenge  (Bearer step-1 token) → challenge ids
//   3. POST /idp/authenticate/otp            (Bearer step-1 token) → final user access_token
//
// After step 3, the final token replaces the subject token for all subsequent
// authenticated calls (user-info, complete-registration, etc.).

// Routing to the upstream is handled by infrastructure, NOT this client:
//   - dev:  Vite proxy in vite.config.ts (always — env var is ignored in dev)
//   - prod: Vercel rewrites in vercel.json (when env var is unset)
// VITE_CASHTOKEN_API_BASE is honoured only in production builds, for the
// edge case where you deploy somewhere without rewrites and have CORS allowed
// on the upstream. In dev we force the empty base so localhost always goes
// through the proxy (avoids browser CORS).
const API_BASE: string = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_CASHTOKEN_API_BASE as string | undefined) || '';

const API_KEY: string =
  (import.meta.env.VITE_CASHTOKEN_API_KEY as string | undefined) || '';

// ─── Storage keys ────────────────────────────────────────────────────────────
const LS = {
  accessToken:  'cashtoken_access_token',
  refreshToken: 'cashtoken_refresh_token',
  sessionId:    'cashtoken_session_id',
  lastSub:      'cashtoken_last_sub',
  lastSubKind:  'cashtoken_last_sub_kind',
  lastCountry:  'cashtoken_last_country',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export type SubIdentifier = 'email' | 'phone';
export type CountryCode = 'GB' | 'NG' | 'ZA' | 'LR' | string;

export interface OtpChallenge {
  otpChallengeId: string;
  otpChallengeToken: string;
  expiresIn: number;
  medium: 'sms' | 'email' | 'push';
  masked: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  auth_type?: 'otp' | 'passcode' | 'silent';
  created_at?: string;
}

export interface UserInfo {
  ref: string;
  sub?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  meta?: Record<string, unknown>;
}

export class CashtokenApiError extends Error {
  status: number;
  errorCode?: string;
  errorDescription?: string;
  constructor(status: number, message: string, errorCode?: string, errorDescription?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
  }
}

// ─── Low-level request ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    /** Bearer token override (overrides the stored user token). */
    bearerOverride?: string;
    /** When true, require *some* bearer (override or stored). */
    requireBearer?: boolean;
    unwrap?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, bearerOverride, requireBearer = false, unwrap = true } = options;

  const bearer = bearerOverride || localStorage.getItem(LS.accessToken) || '';

  if (requireBearer && !bearer) {
    throw new CashtokenApiError(401, 'Not signed in', 'NO_BEARER');
  }

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  if (API_KEY) headers['x-api-key'] = API_KEY;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON body — leave payload null
  }

  if (!res.ok) {
    // VAS API errors:  { errorMessage, errorDescription, errorCode }
    // Core API errors: { error: { code, message } }
    const message =
      payload?.errorMessage ||
      payload?.errorDescription ||
      payload?.error?.message ||
      payload?.message ||
      `Request failed (${res.status})`;
    throw new CashtokenApiError(
      res.status,
      message,
      payload?.errorCode ?? payload?.error?.code,
      payload?.errorDescription ?? payload?.error?.message,
    );
  }

  if (unwrap && payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

// ─── Session ID (per-device UUID for silent-mode) ────────────────────────────
function ensureSessionId(): string {
  let id = localStorage.getItem(LS.sessionId);
  if (!id) {
    id = (crypto as any).randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(LS.sessionId, id);
  }
  return id;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

// Sub-shape that Postman normalises out of the silent-mode and otp-verify
// responses. The IDP returns the camelCase shape below; we keep snake_case
// to match the docs verbatim.
function pickAuthTokens(raw: any): AuthTokens {
  return {
    access_token: raw?.access_token,
    refresh_token: raw?.refresh_token,
    id_token: raw?.id_token,
    token_type: raw?.token_type,
    expires_in: raw?.expires_in,
    scope: raw?.scope,
    auth_type: raw?.auth_type,
    created_at: raw?.created_at,
  };
}

// POST /idp/authenticate/silent-mode — issues a subject access_token without
// user interaction. Used as both:
//   (a) Step 1 of a fresh OTP sign-in (token used to authenticate steps 2 & 3).
//   (b) "Restore session" on returning visits.
// Auth: none required.
export async function silentSignIn(params: {
  sub: string;
  subIdentifier: SubIdentifier;
  country: CountryCode;
}): Promise<AuthTokens> {
  const raw = await request<any>('/idp/authenticate/silent-mode', {
    method: 'POST',
    body: { ...params, sessionID: ensureSessionId() },
    unwrap: false,
  });
  return pickAuthTokens(raw);
}

// POST /idp/authenticate/otp-challenge — sends OTP to email/phone.
// Auth: Bearer (the subject token from silent-mode).
// Response shape per docs §1.2: { status, message, data: { challenge_id, challenge_token } }.
export async function requestOtpChallenge(params: {
  sub: string;
  subIdentifier: SubIdentifier;
  country: CountryCode;
  preferredDelivery?: 'pull' | 'push';
}, subjectToken: string): Promise<OtpChallenge> {
  const data = await request<any>('/idp/authenticate/otp-challenge', {
    method: 'POST',
    body: params,
    bearerOverride: subjectToken,
    requireBearer: true,
  });
  // Doc shows snake_case (challenge_id, challenge_token); the openapi.yaml
  // example shows camelCase. Accept either to be safe.
  return {
    otpChallengeId:    data?.challenge_id    ?? data?.otpChallengeId,
    otpChallengeToken: data?.challenge_token ?? data?.otpChallengeToken,
    expiresIn:         data?.expires_in      ?? data?.expiresIn ?? 300,
    medium:            data?.medium          ?? 'email',
    masked:            data?.masked          ?? '',
  };
}

// POST /idp/authenticate/otp — exchanges OTP code for the final user token.
// Auth: Bearer (still the subject token from silent-mode).
export async function verifyOtp(params: {
  otpChallengeId: string;
  otpChallengeToken: string;
  otpCode: string;
}, subjectToken: string): Promise<AuthTokens> {
  const raw = await request<any>('/idp/authenticate/otp', {
    method: 'POST',
    body: params,
    bearerOverride: subjectToken,
    requireBearer: true,
    unwrap: false,
  });
  const tokens = pickAuthTokens(raw);
  storeTokens(tokens);            // <-- this is the user token; persist it
  return tokens;
}

// GET /idp/user-info — requires the stored user access_token.
export async function getUserInfo(): Promise<UserInfo> {
  const raw = await request<any>('/idp/user-info', { requireBearer: true });
  // The doc returns a flat profile object; openapi shows the same fields
  // under a slightly different casing. Normalise to the UserInfo shape.
  return {
    ref:       raw?.sub ?? raw?.ref ?? '',
    sub:       raw?.sub,
    name:      raw?.display_name ?? raw?.name,
    firstName: raw?.first_name   ?? raw?.firstName,
    lastName:  raw?.last_name    ?? raw?.lastName,
    email:     raw?.email,
    phone:     raw?.phone_number ?? raw?.phone,
    country:   raw?.country?.code ?? raw?.country,
    meta:      raw,
  };
}

// POST /idp/complete-registration (Bearer) — first-time profile setup.
// The IDP returns snake_case in /idp/user-info but accepts camelCase on input
// (confirmed empirically — snake_case body yields "first_name is not allowed").
export async function completeRegistration(params: {
  type: 'individual' | 'brand';
  country: CountryCode;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'others';
  brandName?: string;
}): Promise<unknown> {
  return request('/idp/complete-registration', {
    method: 'POST',
    body: params,
    requireBearer: true,
    unwrap: false,
  });
}

// Convenience helper for the fresh sign-in flow: silent → otp-challenge.
// Returns both the challenge and the subject token (caller uses the same
// subject token for verifyOtp).
export async function beginSignIn(params: {
  sub: string;
  subIdentifier: SubIdentifier;
  country: CountryCode;
}): Promise<{ challenge: OtpChallenge; subjectToken: string }> {
  const silent = await silentSignIn(params);
  if (!silent.access_token) {
    throw new CashtokenApiError(500, 'Silent-mode did not return an access_token');
  }
  const challenge = await requestOtpChallenge(params, silent.access_token);
  return { challenge, subjectToken: silent.access_token };
}

// ─── Catalog & transactions ──────────────────────────────────────────────────

// Generic shape returned by /api/.../options.json (per docs §2.2).
export interface ServiceFieldOption {
  const: string;        // value to send when ordering
  description: string;  // display name
  icon?: string;        // icon key for mobile UI
  [key: string]: unknown;
}

// Shape captured from /api/uk/gift-card empirically — the endpoint isn't
// documented anywhere in the spec/markdown/Postman. Each brand has multiple
// `products` (denominations: £110, £210, £510, £1010 etc.) and one or more
// design images on Cloudinary.
export interface UkGiftCardDesign {
  id: number;
  image_url: string;
  custom_id?: number;
}

export interface UkGiftCardBrandParams {
  name?: string;
  value?: number;                  // GBP face value
  valueCurrencyCode?: string;      // 'GBP'
  category?: string;               // 'Gift Card'
  subCategory?: string;            // 'E-Commerce & Online Shopping'
  subCategoryCode?: string;        // 'E-Commerce-Online-Shopping'
  brandCode?: string;
  productCode?: string;
  productMoreInfoUrl?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UkGiftCardProduct {
  id: number;
  name: string;
  product_id: number;
  description?: string;
  min_purchase: number;            // GBP minor unit? observed as whole £, e.g. 110 = £110
  max_purchase: number;
  expiration_date?: string;
  brand_params?: UkGiftCardBrandParams;
  status?: string;
  brand_code?: string;
}

export interface UkGiftCard {
  id: number;
  name: string;
  brand_code: string;
  brand_name: string;
  provider_id?: number;
  description?: string;            // HTML
  status?: string;
  gift_card_design?: UkGiftCardDesign[];
  products?: UkGiftCardProduct[];
  gift_card_category?: { name?: string } | null;
  [key: string]: unknown;
}

// Service catalog entry — fields per Service Reference table in docs §13
// and openapi response examples. Treat extras as additive.
export interface ServiceCatalogEntry {
  serviceRef?: string;
  ref?: string;
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface TransactionRecord {
  id?: number | string;
  ref?: string;
  amount?: number;
  currency?: string;
  status?: string;
  type?: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
  service?: { ref?: string; name?: string } | string;
  country?: { ref?: string; code?: string } | string;
  [key: string]: unknown;
}

// GET /api/uk/gift-card — UK voucher catalog. Auth: x-api-key only.
export async function listUkGiftCards(): Promise<UkGiftCard[]> {
  const raw = await request<any>('/api/uk/gift-card');
  // The endpoint may return the array directly OR wrapped in { data: [...] }.
  // request() already unwraps `data` when present, so we should get the array.
  // Defensive guard for either shape:
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.list))  return raw.list;
  return [];
}

// GET /api/countries/:country/services/:service/fields/:field/options.json
// Auth: x-api-key only. Used to list providers, plans, etc.
export async function listServiceFieldOptions(params: {
  country: string;           // 'gb', 'ng' — lowercase per docs §2.1
  service: string;           // 'airtime', 'databundle', 'voucher', etc.
  field: string;             // 'provider.code', 'provider.planId', ...
  query?: Record<string, string | number>;
}): Promise<ServiceFieldOption[]> {
  const { country, service, field, query } = params;
  let path = `/api/countries/${country}/services/${service}/fields/${field}/options.json`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) qs.set(k, String(v));
    path += `?${qs.toString()}`;
  }
  const raw = await request<any>(path);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

// GET /api/countries/:country/services/list — top-level service catalog for a country.
export async function listCountryServices(country: string): Promise<ServiceCatalogEntry[]> {
  const raw = await request<any>(`/api/countries/${country}/services/list`);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

// GET /api/transactions/list — auth: x-api-key + Bearer (user-scoped).
export async function listTransactions(opts: {
  countryCode?: string;   // e.g. 'GB' (uppercase — matches filter format in docs §4.1)
  limit?: number;
  start?: number;
  sort?: string;
} = {}): Promise<TransactionRecord[]> {
  const qs = new URLSearchParams();
  qs.set('start', String(opts.start ?? 0));
  qs.set('limit', String(opts.limit ?? 50));
  qs.set('sort', opts.sort ?? 'createdAt:desc');
  if (opts.countryCode) qs.set('filter', `country.code:${opts.countryCode}`);
  const raw = await request<any>(`/api/transactions/list?${qs.toString()}`, { requireBearer: true });
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

// ─── Orders & payments (unified order flow) ──────────────────────────────────
// Spec: v2_technical_api_documentation §3 (Order Lifecycle & Fulfillment) and
// §15 (Complete Order Flow). All services share this flow:
//   initialize → get-payment-method → set-payment-method → poll summary.
// Auth: /orders/initialize needs Bearer + x-api-key; the rest need x-api-key
// (request() attaches the stored Bearer too, which is harmless).

// Order as returned by /orders/initialize (§3.1.8 sample).
export interface Order {
  ref: string;
  amount?: number;
  fee?: number;
  total?: number;
  status?: string;       // 'pending' | 'processing' | 'successful' | 'failed' | ...
  [key: string]: unknown;
}

// Payment method option (§3.2). `name` is the machine name passed back as
// `option` to set-payment-method (e.g. 'flutterwave-ng', 'reward-wallet').
export interface PaymentMethod {
  id: number;
  ref: string;
  gateway: string;           // e.g. 'cashtoken'
  icon?: string;             // 'pay-with-card' | 'reward-wallet'
  title: string;             // display name
  name: string;              // machine name -> `option`
  enabled: boolean;
  description?: string | null;
  listOrder?: number;
  subtitleType?: 'icon' | 'balance' | string;
  subtitleValue?: string;
  minimumAmount?: number | null;
  maximumAmount?: number | null;   // 0 = unlimited
  mfaLength?: number | null;       // e.g. 4 for reward wallet PIN
  mfaType?: string | null;         // 'PIN'
  mfaLabel?: string | null;
  [key: string]: unknown;
}

// set-payment-method response (§3.3). `continuationLink` present => card flow
// requires opening the gateway (3-D Secure) before the order resolves.
export interface SetPaymentResult {
  ref: string;
  gateway?: string;
  amount?: string | number;
  option?: string;
  continuationLink?: string;
  returnUrl?: string;
  [key: string]: unknown;
}

// Order-init request shape (§3.1). `params`/`request` mirror the docs verbatim.
export interface InitializeOrderInput {
  params: Record<string, unknown>;
  request: {
    requestRef: string;
    serviceRef: string;      // 'airtime' | 'databundle' | 'voucher' | ...
    countryRef: string;      // 'gb' | 'ng' — lowercase per docs
    validation?: boolean;
    addAsBeneficiary?: boolean;
    beneficiaryLabel?: string;
    beneficiaryRef?: string;
    [key: string]: unknown;
  };
}

function newRequestRef(): string {
  return (crypto as any).randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// POST /api/orders/initialize — creates a pending order, returns the order ref.
// Auth: Bearer + x-api-key.
export async function initializeOrder(input: InitializeOrderInput): Promise<Order> {
  const raw = await request<any>('/api/orders/initialize', {
    method: 'POST',
    body: input,
    requireBearer: true,
  });
  // request() unwraps top-level `data`; the order sits at data.order.
  return (raw?.order ?? raw) as Order;
}

// Convenience wrapper for a GB airtime order. Amount is in whole pounds
// (docs §3.1.2 shows amount: 60 for £60, unlike NG's minor units).
export async function initializeUkAirtimeOrder(params: {
  providerCode: string;      // provider.code, e.g. '9457:67'
  amount: number;            // whole GBP
  recipient: string;         // phone/identifier the airtime tops up
}): Promise<Order> {
  return initializeOrder({
    params: {
      provider: { code: params.providerCode },
      amount: params.amount,
      recipient: params.recipient,
    },
    request: {
      requestRef: newRequestRef(),
      serviceRef: 'airtime',
      countryRef: 'gb',
      validation: false,
    },
  });
}

// GET /api/orders/:ref/get-payment-method — available options for an order.
// Auth: x-api-key. Sorted by listOrder for stable display.
export async function getPaymentMethods(orderRef: string): Promise<PaymentMethod[]> {
  const raw = await request<any>(`/api/orders/${orderRef}/get-payment-method`);
  const list: PaymentMethod[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  return [...list].sort((a, b) => (a.listOrder ?? 0) - (b.listOrder ?? 0));
}

// POST /api/orders/:ref/set-payment-method — selects an option and starts payment.
// Card:   { option, gateway, returnUrl }              -> continuationLink
// Wallet: { option, gateway, returnUrl, value: PIN }  -> completes immediately
// Auth: x-api-key.
export async function setPaymentMethod(
  orderRef: string,
  input: { option: string; gateway: string; returnUrl: string; value?: string },
): Promise<SetPaymentResult> {
  return request<SetPaymentResult>(`/api/orders/${orderRef}/set-payment-method`, {
    method: 'POST',
    body: input,
  });
}

// GET /api/orders/:ref/summary — poll after payment to learn the final status.
// Auth: x-api-key.
export async function getOrderSummary(orderRef: string): Promise<Order> {
  const raw = await request<any>(`/api/orders/${orderRef}/summary`);
  return (raw?.order ?? raw) as Order;
}

// Statuses that mean the order is done (one way or the other). Anything else
// (pending/processing/initiated) means keep polling.
export function isTerminalOrderStatus(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return ['successful', 'success', 'completed', 'complete', 'failed', 'failure', 'cancelled', 'canceled', 'declined'].includes(s);
}

export function isSuccessfulOrderStatus(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return ['successful', 'success', 'completed', 'complete'].includes(s);
}

// ─── Account & wallets (Core API) ────────────────────────────────────────────
// Spec: v2_technical_api_documentation §6. The Core API lives on a different
// host (api[-sandbox].cashtoken.africa/v2) than the VAS API. We reach it via a
// same-origin `/coreapi` prefix wired in vite.config.ts (dev proxy) and
// vercel.json (prod rewrite), both mapping /coreapi/* -> {core-host}/v2/*.
// Auth: Bearer token (request() also attaches x-api-key, which is harmless).
const CORE_PREFIX = '/coreapi';

// The wallet response shape isn't sampled anywhere in the spec/Postman, so this
// parser is deliberately tolerant of field-name variants.
export interface WalletRecord {
  ref?: string;
  type?: string;                 // e.g. 'reward', 'main'
  name?: string;
  currency?: string;             // 'GBP', 'NGN', ...
  currencyCode?: string;
  balance?: number | string;
  availableBalance?: number | string;
  ledgerBalance?: number | string;
  amount?: number | string;
  isDefault?: boolean;
  [key: string]: unknown;
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Extract a spendable balance from a wallet, trying the likely field names.
export function walletBalanceOf(w: WalletRecord): number | null {
  return (
    toNumber(w.availableBalance) ??
    toNumber(w.balance) ??
    toNumber(w.amount) ??
    toNumber(w.ledgerBalance)
  );
}

function walletCurrencyOf(w: WalletRecord): string {
  return String(w.currency ?? w.currencyCode ?? '').toUpperCase();
}

// GET /coreapi/account/wallets/ — the signed-in user's wallets. Auth: Bearer.
export async function getAccountWallets(): Promise<WalletRecord[]> {
  const raw = await request<any>(`${CORE_PREFIX}/account/wallets/`, { requireBearer: true });
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.wallets)) return raw.wallets;
  return [];
}

// Convenience: the spendable balance for a preferred currency (defaults to the
// default wallet, else the first wallet). Returns null if none is readable.
export async function getWalletBalance(preferredCurrency?: string): Promise<number | null> {
  const wallets = await getAccountWallets();
  if (wallets.length === 0) return null;
  const want = (preferredCurrency || '').toUpperCase();
  const pick =
    (want && wallets.find((w) => walletCurrencyOf(w) === want)) ||
    wallets.find((w) => w.isDefault) ||
    wallets[0];
  return pick ? walletBalanceOf(pick) : null;
}

// Sign out — client-side state cleanup.
//
// Why no server call: the docs (v2_technical_api_documentation §1, plus the
// Postman collection) define no token-revocation endpoint. The only thing
// the OpenAPI spec offers is `GET /idp/signout` (302 redirect, RP-initiated
// OIDC logout), which expects an OIDC browser session — our app uses the OTP
// token grant, so there's no IDP session cookie to terminate. Tokens expire
// naturally (1h per docs); discarding them locally is the documented pattern.
//
// Async so callers can `await` it if we ever add a server-side step.
export async function signOut(): Promise<void> {
  clearTokens();
  clearRememberedSubject();
  localStorage.removeItem(LS.sessionId);   // force a fresh sessionID next sign-in
}

// ─── Token storage helpers ───────────────────────────────────────────────────
export function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(LS.accessToken, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(LS.refreshToken, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(LS.accessToken);
  localStorage.removeItem(LS.refreshToken);
}

export function hasStoredSession(): boolean {
  return Boolean(localStorage.getItem(LS.accessToken));
}

export function rememberSubject(sub: string, kind: SubIdentifier, country: CountryCode) {
  localStorage.setItem(LS.lastSub, sub);
  localStorage.setItem(LS.lastSubKind, kind);
  localStorage.setItem(LS.lastCountry, country);
}

export function getRememberedSubject():
  | { sub: string; subIdentifier: SubIdentifier; country: CountryCode }
  | null {
  const sub = localStorage.getItem(LS.lastSub);
  const kind = localStorage.getItem(LS.lastSubKind) as SubIdentifier | null;
  const country = localStorage.getItem(LS.lastCountry) as CountryCode | null;
  if (!sub || !kind || !country) return null;
  return { sub, subIdentifier: kind, country };
}

export function clearRememberedSubject() {
  localStorage.removeItem(LS.lastSub);
  localStorage.removeItem(LS.lastSubKind);
  localStorage.removeItem(LS.lastCountry);
}

// Convenient flag the UI can flip after a fresh sign-in if user-info is sparse.
export function userNeedsRegistration(info: UserInfo): boolean {
  return !info.name && !info.firstName && !info.lastName;
}
