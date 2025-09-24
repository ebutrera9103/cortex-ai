import {
  type ICortexService,
  type ICortexStorageAdapter,
  type CortexContext,
  type CortexServerConfig,
  type SetMemoryOptions,
  StorageAdapterError,
  InvalidInputError,
} from '@cortex-ai/core';

/**
 * The main server class that orchestrates memory operations.
 * It provides a robust, type-safe, and well-documented implementation of the ICortexService.
 */
export class CortexServer implements ICortexService {
  /**
   * Creates an instance of the CortexServer.
   * @param storageAdapter An instance of a class that implements `ICortexStorageAdapter` (e.g., `RedisStorageAdapter`).
   * @param config Optional server configuration, such as a default TTL for contexts.
   */
  constructor(
    private readonly storageAdapter: ICortexStorageAdapter,
    private readonly config: CortexServerConfig = {}
  ) {
    if (!storageAdapter) {
      // Use a specific error type for clearer debugging.
      throw new InvalidInputError(
        'A valid storage adapter must be provided to CortexServer.'
      );
    }
  }

  /**
   * Retrieves a context object from the storage layer.
   * @param tenantId The unique identifier for the tenant. Must be a non-empty string.
   * @param contextId The unique identifier for the context. Must be a non-empty string.
   * @returns A promise that resolves to the CortexContext object or null if not found.
   */
  public async getMemory<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    this._validateIdentifiers(tenantId, contextId);
    try {
      return await this.storageAdapter.get<T>(tenantId, contextId);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to get memory for context '${contextId}'`,
        err
      );
    }
  }

  /**
   * Creates a new context or updates an existing one.
   * This is the method with the corrected signature.
   * @param tenantId The unique identifier for the tenant.
   * @param contextId The unique identifier for the context.
   * @param options The data and optional metadata for the context.
   * @returns A promise that resolves to the newly created or updated CortexContext object.
   */
  public async setMemory<T>(
    tenantId: string,
    contextId: string,
    options: SetMemoryOptions<T>
  ): Promise<CortexContext<T>> {
    this._validateIdentifiers(tenantId, contextId);
    if (options?.data === undefined) {
      throw new InvalidInputError(
        'The `data` property is required in the options object.'
      );
    }

    try {
      const existingContext = await this.storageAdapter.get<T>(
        tenantId,
        contextId
      );
      const newContext = this._createUpdatedContext(
        tenantId,
        contextId,
        options,
        existingContext
      );
      return await this.storageAdapter.set(newContext);
    } catch (err) {
      if (
        err instanceof InvalidInputError ||
        err instanceof StorageAdapterError
      ) {
        throw err;
      }
      throw new StorageAdapterError(
        `Failed to set memory for context '${contextId}'`,
        err
      );
    }
  }

  /**
   * Permanently deletes a context object from the storage layer.
   * @param tenantId The unique identifier for the tenant. Must be a non-empty string.
   * @param contextId The unique identifier for the context. Must be a non-empty string.
   * @returns A promise that resolves when the operation is complete.
   * @throws {InvalidInputError} If `tenantId` or `contextId` are invalid.
   * @throws {StorageAdapterError} If the storage adapter fails during the operation.
   */
  public async deleteMemory(
    tenantId: string,
    contextId: string
  ): Promise<void> {
    this._validateIdentifiers(tenantId, contextId);
    try {
      await this.storageAdapter.delete(tenantId, contextId);
    } catch (err) {
      throw new StorageAdapterError(
        `Failed to delete memory for context '${contextId}'`,
        err
      );
    }
  }

  /**
   * A pure function that constructs the new context object.
   * It handles versioning, timestamps, and merging metadata.
   * This logic is now isolated and easy to unit test.
   */
  private _createUpdatedContext<T>(
    tenantId: string,
    contextId: string,
    options: SetMemoryOptions<T>,
    existingContext: CortexContext<T> | null
  ): CortexContext<T> {
    const now = new Date().toISOString();
    const version = (existingContext?.metadata.version || 0) + 1;

    const context: CortexContext<T> = {
      tenantId,
      contextId,
      data: options.data,
      metadata: {
        ...(options.metadata || {}),
        ttl: options.metadata?.ttl ?? this.config.defaultTtlSeconds,
        createdAt: existingContext?.metadata.createdAt || now,
        updatedAt: now,
        version,
        sizeBytes: Buffer.from(JSON.stringify(options.data)).byteLength,
      },
    };
    return context;
  }

  /**
   * A helper to validate tenant and context identifiers, ensuring they are non-empty strings.
   * This allows us to "fail fast" before making any database calls.
   */
  private _validateIdentifiers(tenantId: string, contextId: string): void {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new InvalidInputError('tenantId must be a non-empty string.');
    }
    if (
      !contextId ||
      typeof contextId !== 'string' ||
      contextId.trim() === ''
    ) {
      throw new InvalidInputError('contextId must be a non-empty string.');
    }
  }
}
