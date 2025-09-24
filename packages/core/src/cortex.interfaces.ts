export interface CortexServerConfig {
  defaultTtlSeconds?: number;
}

export interface CortexContext<T = Record<string, any>> {
  contextId: string;
  tenantId: string;
  data: T;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    ttl?: number;
    tags?: string[];
    sizeBytes: number;
    [key: string]: any;
  };
}

export interface ICortexService {
  getMemory<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null>;
  setMemory<T>(
    tenantId: string,
    contextId: string,
    data: T,
    metadata?: Partial<
      Omit<
        CortexContext<T>['metadata'],
        'createdAt' | 'updatedAt' | 'sizeBytes' | 'version'
      >
    >
  ): Promise<CortexContext<T>>;
  deleteMemory(tenantId: string, contextId: string): Promise<void>;
}

export interface ICortexStorageAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get<T>(tenantId: string, contextId: string): Promise<CortexContext<T> | null>;
  set<T>(context: CortexContext<T>): Promise<CortexContext<T>>;
  delete(tenantId: string, contextId: string): Promise<void>;
}
