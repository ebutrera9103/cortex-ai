import { CortexContext } from '@cortex-ai/core';
import { InMemoryStorageAdapter } from '.';

describe('InMemoryStorageAdapter', () => {
  let adapter: InMemoryStorageAdapter;

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter();
  });

  it('connect resolves', async () => {
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  it('disconnect clears storage', async () => {
    const context: CortexContext = {
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {
        createdAt: '',
        updatedAt: '',
        version: 0,
        sizeBytes: 0,
      },
    };
    await adapter.set(context);
    await adapter.disconnect();
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toBeNull();
  });

  it('set stores context', async () => {
    const context: CortexContext = {
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {
        createdAt: '',
        updatedAt: '',
        version: 0,
        sizeBytes: 0,
      },
    };
    await adapter.set(context);
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toEqual(context);
  });

  it('get returns null if not found', async () => {
    const result = await adapter.get('tenant', 'notfound');
    expect(result).toBeNull();
  });

  it('delete removes context', async () => {
    const context: CortexContext = {
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {
        createdAt: '',
        updatedAt: '',
        version: 0,
        sizeBytes: 0,
      },
    };
    await adapter.set(context);
    await adapter.delete('tenant', 'ctx');
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toBeNull();
  });
});
