interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  expiresAt: number;
}

export class TtlCache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 3000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  public set(key: string, value: T, customTtlMs?: number): void {
    const now = Date.now();
    const ttl = customTtlMs ?? this.defaultTtlMs;
    this.store.set(key, {
      value,
      cachedAt: now,
      expiresAt: now + ttl,
    });
  }

  public get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public getWithMetadata(key: string): { value: T; cachedAt: number; isStale: boolean } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    const isStale = now > entry.expiresAt;
    return {
      value: entry.value,
      cachedAt: entry.cachedAt,
      isStale,
    };
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}
