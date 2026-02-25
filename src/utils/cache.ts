import { redis } from "./redis";

const CACHE_PREFIX = "cache:";

export class Cache<T> {
  private ttlSeconds: number;

  constructor(ttlSeconds: number = 3600) {
    this.ttlSeconds = ttlSeconds;
  }

  async get(key: string): Promise<T | null> {
    const data = await redis.get<T>(`${CACHE_PREFIX}${key}`);
    return data ?? null;
  }

  async set(key: string, data: T): Promise<void> {
    await redis.set(`${CACHE_PREFIX}${key}`, data, { ex: this.ttlSeconds });
  }
}
