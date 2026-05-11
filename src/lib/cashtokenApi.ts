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

// Always use relative paths. Routing to the real upstream is handled by:
//   - dev:  Vite proxy in vite.config.ts
//   - prod: Vercel rewrites in vercel.json
// If you ever deploy somewhere without a rewriting infrastructure, set
// VITE_CASHTOKEN_API_BASE to the absolute URL and you'll need CORS allowed.
const API_BASE: string =
  (import.meta.env.VITE_CASHTOKEN_API_BASE as string | undefined) || '';

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
    const message =
      payload?.errorMessage ||
      payload?.errorDescription ||
      payload?.message ||
      `Request failed (${res.status})`;
    throw new CashtokenApiError(
      res.status,
      message,
      payload?.errorCode,
      payload?.errorDescription,
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
