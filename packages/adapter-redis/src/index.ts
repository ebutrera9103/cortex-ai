import {
  CortexContext,
  ICortexStorageAdapter,
  StorageAdapterError,
} from '@cortex-ai/core';
import type { Redis } from 'ioredis';

export class RedisStorageAdapter implements ICortexStorageAdapter {
  constructor(private readonly redis: Redis) {
    if (!redis) {
      throw new Error('An ioredis client instance must be provided.');
    }
  }

  // Use a tenant-specific key to store all contexts for that tenant in a Redis Hash.
  private getTenantKey(tenantId: string): string {
    return `cortex:tenant:${tenantId}`;
  }

  public async connect(): Promise<void> {
    if (this.redis.status !== 'ready') {
      try {
        await this.redis.connect();
      } catch (err) {
        throw new StorageAdapterError(
          'Failed to connect to Redis',
          err as Error
        );
      }
    }
  }

  public async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  public async get<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    try {
      const result = await this.redis.hget(
        this.getTenantKey(tenantId),
        contextId
      );
      return result ? (JSON.parse(result) as CortexContext<T>) : null;
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to get context '${contextId}' from Redis`,
        err as Error
      );
    }
  }

  public async set<T>(context: CortexContext<T>): Promise<CortexContext<T>> {
    try {
      const tenantKey = this.getTenantKey(context.tenantId);
      const data = JSON.stringify(context);

      await this.redis.hset(tenantKey, context.contextId, data);

      // A TTL on a context should apply to the entire tenant hash for simplicity.
      // A more complex implementation could manage individual expiry.
      if (context.metadata.ttl) {
        await this.redis.expire(tenantKey, context.metadata.ttl);
      }
      return context;
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to set context '${context.contextId}' in Redis`,
        err as Error
      );
    }
  }

  public async delete(tenantId: string, contextId: string): Promise<void> {
    try {
      await this.redis.hdel(this.getTenantKey(tenantId), contextId);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to delete context '${contextId}' from Redis`,
        err as Error
      );
    }
  }
}
