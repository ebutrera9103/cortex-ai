import { CortexContext, ICortexStorageAdapter } from '@cortex-ai/core';

export class InMemoryStorageAdapter implements ICortexStorageAdapter {
  private readonly storage = new Map<string, Map<string, CortexContext<any>>>();

  public async connect(): Promise<void> {
    return Promise.resolve();
  }
  public async disconnect(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }

  public async get<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    const context = this.storage.get(tenantId)?.get(contextId);
    return context || null;
  }

  public async set<T>(context: CortexContext<T>): Promise<CortexContext<T>> {
    if (!this.storage.has(context.tenantId)) {
      this.storage.set(context.tenantId, new Map<string, CortexContext<any>>());
    }
    this.storage.get(context.tenantId)!.set(context.contextId, context);
    return context;
  }

  public async delete(tenantId: string, contextId: string): Promise<void> {
    this.storage.get(tenantId)?.delete(contextId);
    return Promise.resolve();
  }
}
