import { kv } from "@vercel/kv";
import { OAuthTokenEntry, OAuthState } from "../types";

const TOKEN_PREFIX = "token:";
const STATE_PREFIX = "state:";
const STATE_TTL_S = 10 * 60; // 10 minutes

export async function storeToken(
  username: string,
  entry: OAuthTokenEntry
): Promise<void> {
  await kv.set(`${TOKEN_PREFIX}${username.toLowerCase()}`, entry);
  console.log(`[auth] Token stored for "${username}"`);
}

export async function getToken(username: string): Promise<string | null> {
  const entry = await kv.get<OAuthTokenEntry>(
    `${TOKEN_PREFIX}${username.toLowerCase()}`
  );
  return entry?.accessToken ?? null;
}

export async function removeToken(username: string): Promise<void> {
  await kv.del(`${TOKEN_PREFIX}${username.toLowerCase()}`);
  console.log(`[auth] Token removed for "${username}"`);
}

export async function hasToken(username: string): Promise<boolean> {
  const val = await kv.exists(`${TOKEN_PREFIX}${username.toLowerCase()}`);
  return val === 1;
}

export async function storeState(state: string): Promise<void> {
  const entry: OAuthState = { state, createdAt: Date.now() };
  await kv.set(`${STATE_PREFIX}${state}`, entry, { ex: STATE_TTL_S });
}

export async function validateAndConsumeState(state: string): Promise<boolean> {
  const entry = await kv.get<OAuthState>(`${STATE_PREFIX}${state}`);
  if (!entry) return false;
  await kv.del(`${STATE_PREFIX}${state}`);
  return true;
}
