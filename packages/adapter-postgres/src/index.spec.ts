import { CortexContext } from '@cortex-ai/core';
import { PostgresStorageAdapter } from '.';

describe('PostgresStorageAdapter', () => {
  let pgPool: any;
  let client: any;
  let adapter: PostgresStorageAdapter;

  beforeEach(() => {
    client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pgPool = {
      connect: jest.fn().mockResolvedValue(client),
      end: jest.fn(),
    };

    adapter = new PostgresStorageAdapter(pgPool);
  });

  it('throws if no pgPool provided', () => {
    expect(() => new PostgresStorageAdapter(undefined as any)).toThrow();
  });

  it('init creates table', async () => {
    client.query.mockResolvedValue({});
    await adapter.init();
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS cortex_contexts')
    );
    expect(client.release).toHaveBeenCalled();
  });

  it('connect resolves', async () => {
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  it('disconnect calls pgPool.end', async () => {
    await adapter.disconnect();
    expect(pgPool.end).toHaveBeenCalled();
  });

  it('get returns context if found', async () => {
    const context = {
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {},
    };
    client.query.mockResolvedValue({ rows: [{ data: context }] });

    const result = await adapter.get('tenant', 'ctx');
    expect(result).toEqual(context);
    expect(client.query).toHaveBeenCalledWith(
      'SELECT data FROM cortex_contexts WHERE tenant_id = $1 AND context_id = $2',
      ['tenant', 'ctx']
    );
    expect(client.release).toHaveBeenCalled();
  });

  it('get returns null if not found', async () => {
    client.query.mockResolvedValue({ rows: [] });
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
    client.query.mockResolvedValue({});
    const result = await adapter.set(context);
    expect(result).toEqual(context);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cortex_contexts'),
      ['tenant', 'ctx', context]
    );
    expect(client.release).toHaveBeenCalled();
  });

  it('delete removes context', async () => {
    client.query.mockResolvedValue({});
    await expect(adapter.delete('tenant', 'ctx')).resolves.toBeUndefined();
    expect(client.query).toHaveBeenCalledWith(
      'DELETE FROM cortex_contexts WHERE tenant_id = $1 AND context_id = $2',
      ['tenant', 'ctx']
    );
    expect(client.release).toHaveBeenCalled();
  });
});
