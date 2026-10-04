import { MarketDataProvider, MarketSnapshot, ProviderHealth, ProviderOptions } from "../types.js";
import { TtlCache } from "../cache/ttl-cache.js";
import { FreshnessGuard } from "../freshness/freshness-guard.js";

export abstract class BaseMarketDataProvider implements MarketDataProvider {
  public abstract readonly name: string;
  protected options: Required<ProviderOptions>;
  protected cache: TtlCache<MarketSnapshot>;
  
  // Health metrics
  protected totalRequests = 0;
  protected failedRequests = 0;
  protected latencySamples: number[] = [];
  protected lastSuccessfulPoll?: string;
  protected lastErrorMessage?: string;

  constructor(options: ProviderOptions = {}) {
    this.options = {
      timeoutMs: options.timeoutMs ?? 5000,
      maxRetries: options.maxRetries ?? 2,
      cacheTtlMs: options.cacheTtlMs ?? 3000,
      staleThresholdMs: options.staleThresholdMs ?? FreshnessGuard.DEFAULT_MAX_AGE_MS,
      rateLimitBackoffBaseMs: options.rateLimitBackoffBaseMs ?? 500,
    };
    this.cache = new TtlCache<MarketSnapshot>(this.options.cacheTtlMs);
  }

  public async getSnapshot(marketAddress: string): Promise<MarketSnapshot> {
    // 1. Check TTL cache
    const cached = this.cache.get(marketAddress);
    if (cached) {
      // Re-evaluate freshness on cached item
      cached.freshness = FreshnessGuard.evaluate(cached.timestamp, this.options.staleThresholdMs);
      return cached;
    }

    const startTime = Date.now();
    this.totalRequests++;

    try {
      const snapshot = await this.executeWithRetry(() => this.fetchSnapshotFromSource(marketAddress));
      
      // Compute freshness and attach
      snapshot.freshness = FreshnessGuard.evaluate(snapshot.timestamp, this.options.staleThresholdMs);

      // Record successful latency
      const elapsed = Date.now() - startTime;
      this.recordLatency(elapsed);
      this.lastSuccessfulPoll = new Date().toISOString();

      // Cache snapshot
      this.cache.set(marketAddress, snapshot);

      return snapshot;
    } catch (err: any) {
      this.failedRequests++;
      this.lastErrorMessage = err.message || "Unknown error";
      throw err;
    }
  }

  public async getBatchSnapshots(marketAddresses: string[]): Promise<MarketSnapshot[]> {
    const promises = marketAddresses.map((addr) => this.getSnapshot(addr));
    return Promise.all(promises);
  }

  public getHealth(): ProviderHealth {
    const successRate = this.totalRequests === 0 ? 1.0 : (this.totalRequests - this.failedRequests) / this.totalRequests;
    const avgLatency = this.latencySamples.length === 0
      ? 0
      : Math.round(this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length);

    let status: "HEALTHY" | "DEGRADED" | "DOWN" = "HEALTHY";
    if (successRate < 0.70 || avgLatency > 2000) {
      status = "DEGRADED";
    }
    if (successRate < 0.40) {
      status = "DOWN";
    }

    return {
      name: this.name,
      status,
      latencyMs: avgLatency,
      successRate: Math.round(successRate * 100) / 100,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      lastSuccessfulPoll: this.lastSuccessfulPoll,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  protected abstract fetchSnapshotFromSource(marketAddress: string): Promise<MarketSnapshot>;

  /**
   * Exponential backoff retry handler with timeout support
   */
  protected async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (attempt <= this.options.maxRetries) {
      try {
        return await this.withTimeout(fn(), this.options.timeoutMs);
      } catch (err: any) {
        attempt++;
        if (attempt > this.options.maxRetries) {
          throw err;
        }
        // Exponential backoff with jitter
        const backoff = this.options.rateLimitBackoffBaseMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw new Error(`[${this.name}]: Maximum retries exceeded.`);
  }

  protected withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[${this.name}]: Request timed out after ${ms}ms.`));
      }, ms);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private recordLatency(ms: number): void {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 50) {
      this.latencySamples.shift();
    }
  }
}
