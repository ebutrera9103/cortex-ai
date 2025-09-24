import {
  ICortexService,
  ICortexStorageAdapter,
  CortexContext,
  StorageAdapterError,
  CortexServerConfig,
} from '@cortex/core';

export class CortexServer implements ICortexService {
  constructor(
    private readonly storageAdapter: ICortexStorageAdapter,
    private readonly config: CortexServerConfig = {}
  ) {
    if (!storageAdapter) {
      throw new Error('A storage adapter must be provided.');
    }
  }

  public async getMemory<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    try {
      return await this.storageAdapter.get<T>(tenantId, contextId);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to get memory for ${contextId}`,
        err as Error
      );
    }
  }

  public async setMemory<T>(
    tenantId: string,
    contextId: string,
    data: T,
    metadataOptions?: Partial<
      Omit<
        CortexContext<T>['metadata'],
        'createdAt' | 'updatedAt' | 'sizeBytes' | 'version'
      >
    >
  ): Promise<CortexContext<T>> {
    const now = new Date().toISOString();
    const existingContext = await this.getMemory<T>(tenantId, contextId);
    const version = (existingContext?.metadata.version || 0) + 1;

    const context: CortexContext<T> = {
      tenantId,
      contextId,
      data,
      metadata: {
        ...metadataOptions,
        ttl: metadataOptions?.ttl ?? this.config.defaultTtlSeconds,
        createdAt: existingContext?.metadata.createdAt || now,
        updatedAt: now,
        version,
        sizeBytes: Buffer.from(JSON.stringify(data)).byteLength,
      },
    };

    try {
      return await this.storageAdapter.set(context);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to set memory for ${contextId}`,
        err as Error
      );
    }
  }

  public async deleteMemory(
    tenantId: string,
    contextId: string
  ): Promise<void> {
    try {
      await this.storageAdapter.delete(tenantId, contextId);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to delete memory for ${contextId}`,
        err as Error
      );
    }
  }
}
