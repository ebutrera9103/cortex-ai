export interface CortexServerConfig {
  defaultTtlSeconds?: number;
}

/**
 * The core context object that is stored and retrieved.
 * This is the internal "entity" of the system.
 * @template T The shape of the data being stored.
 */
export interface CortexContext<T = Record<string, any>> {
  readonly tenantId: string;
  readonly contextId: string;
  readonly data: T;
  readonly metadata: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
    readonly ttl?: number;
    readonly tags?: string[];
    readonly sizeBytes: number;
  };
}

/**
 * Defines the public contract for the Cortex Memory Service.
 */
export interface ICortexService {
  getMemory<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null>;
  setMemory<T>(
    tenantId: string,
    contextId: string,
    options: SetMemoryOptions<T>
  ): Promise<CortexContext<T>>;
  deleteMemory(tenantId: string, contextId: string): Promise<void>;
}

/**
 * Service Configuration
 */
export interface CortexServerConfig {
  defaultTtlSeconds?: number;
}

/**
 * The options object for the `setMemory` method.
 * This is the public-facing "DTO" for creating or updating a context.
 * @template T The shape of the data being stored.
 */
export interface SetMemoryOptions<T> {
  data: T;
  metadata?: Partial<
    Omit<
      CortexContext<T>['metadata'],
      'createdAt' | 'updatedAt' | 'sizeBytes' | 'version'
    >
  >;
}

/**
 * Defines the public contract for a storage adapter.
 */
export interface ICortexStorageAdapter {
  get<T>(tenantId: string, contextId: string): Promise<CortexContext<T> | null>;
  set<T>(context: CortexContext<T>): Promise<CortexContext<T>>;
  delete(tenantId: string, contextId: string): Promise<void>;
}
