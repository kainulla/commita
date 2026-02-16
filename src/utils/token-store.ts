import { OAuthTokenEntry, OAuthState } from "../types";

// Maps GitHub username (lowercase) → OAuth token
const tokens = new Map<string, OAuthTokenEntry>();

// Pending OAuth states for CSRF protection (state → timestamp)
const pendingStates = new Map<string, OAuthState>();

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function storeToken(username: string, entry: OAuthTokenEntry): void {
  tokens.set(username.toLowerCase(), entry);
  console.log(`[auth] Token stored for "${username}"`);
}

export function getToken(username: string): string | null {
  const entry = tokens.get(username.toLowerCase());
  return entry?.accessToken ?? null;
}

export function removeToken(username: string): void {
  tokens.delete(username.toLowerCase());
  console.log(`[auth] Token removed for "${username}"`);
}

export function hasToken(username: string): boolean {
  return tokens.has(username.toLowerCase());
}

export function storeState(state: string): void {
  // Clean expired states
  const now = Date.now();
  for (const [s, entry] of pendingStates) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      pendingStates.delete(s);
    }
  }
  pendingStates.set(state, { state, createdAt: now });
}

export function validateAndConsumeState(state: string): boolean {
  const entry = pendingStates.get(state);
  if (!entry) return false;
  pendingStates.delete(state);
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return false;
  return true;
}
