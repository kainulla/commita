import { Redis } from "@upstash/redis";
import { OAuthTokenEntry, OAuthState } from "../types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TOKEN_PREFIX = "token:";
const STATE_PREFIX = "state:";
const STATE_TTL_S = 10 * 60; // 10 minutes

export async function storeToken(
  username: string,
  entry: OAuthTokenEntry
): Promise<void> {
  await redis.set(`${TOKEN_PREFIX}${username.toLowerCase()}`, entry);
  console.log(`[auth] Token stored for "${username}"`);
}

export async function getToken(username: string): Promise<string | null> {
  const entry = await redis.get<OAuthTokenEntry>(
    `${TOKEN_PREFIX}${username.toLowerCase()}`
  );
  return entry?.accessToken ?? null;
}

export async function removeToken(username: string): Promise<void> {
  await redis.del(`${TOKEN_PREFIX}${username.toLowerCase()}`);
  console.log(`[auth] Token removed for "${username}"`);
}

export async function hasToken(username: string): Promise<boolean> {
  const val = await redis.exists(`${TOKEN_PREFIX}${username.toLowerCase()}`);
  return val === 1;
}

export async function storeState(state: string): Promise<void> {
  const entry: OAuthState = { state, createdAt: Date.now() };
  await redis.set(`${STATE_PREFIX}${state}`, entry, { ex: STATE_TTL_S });
}

export async function validateAndConsumeState(state: string): Promise<boolean> {
  const entry = await redis.get<OAuthState>(`${STATE_PREFIX}${state}`);
  if (!entry) return false;
  await redis.del(`${STATE_PREFIX}${state}`);
  return true;
}
