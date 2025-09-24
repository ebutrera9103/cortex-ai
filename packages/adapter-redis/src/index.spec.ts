import { RedisStorageAdapter } from '.';

describe('RedisStorageAdapter', () => {
  let redisClient: any;
  let adapter: RedisStorageAdapter;

  beforeEach(() => {
    redisClient = {
      connect: jest.fn(),
      quit: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hdel: jest.fn(),
    };
    adapter = new RedisStorageAdapter(redisClient);
  });

  it('connect calls redis connect', async () => {
    await adapter.connect();
    expect(redisClient.connect).toHaveBeenCalled();
  });

  it('disconnect calls redis quit', async () => {
    await adapter.disconnect();
    expect(redisClient.quit).toHaveBeenCalled();
  });

  it('get returns context if data exists', async () => {
    const stored = JSON.stringify({
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {
        createdAt: '2025-09-24T00:00:00Z',
        updatedAt: '2025-09-24T00:00:00Z',
        version: 1,
        sizeBytes: 20,
      },
    });
    redisClient.hget.mockResolvedValue(stored);

    const result = await adapter.get('tenant', 'ctx');
    expect(result).toEqual(JSON.parse(stored));
    expect(redisClient.hget).toHaveBeenCalledWith(
      'cortex:tenant:tenant',
      'ctx'
    );
  });

  it('get returns null if no data', async () => {
    redisClient.hget.mockResolvedValue(null);
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toBeNull();
    expect(redisClient.hget).toHaveBeenCalledWith(
      'cortex:tenant:tenant',
      'ctx'
    );
  });

  it('set stores context as JSON', async () => {
    const context = {
      tenantId: 'tenant',
      contextId: 'ctx',
      data: { foo: 'bar' },
      metadata: {
        createdAt: '2025-09-24T00:00:00Z',
        updatedAt: '2025-09-24T00:00:00Z',
        version: 1,
        sizeBytes: 20,
      },
    };
    redisClient.hset.mockResolvedValue(1);

    const result = await adapter.set(context);
    expect(result).toEqual(context);
    expect(redisClient.hset).toHaveBeenCalledWith(
      'cortex:tenant:tenant',
      'ctx',
      JSON.stringify(context)
    );
  });

  it('delete removes context', async () => {
    redisClient.hdel.mockResolvedValue(1);
    await expect(adapter.delete('tenant', 'ctx')).resolves.toBeUndefined();
    expect(redisClient.hdel).toHaveBeenCalledWith(
      'cortex:tenant:tenant',
      'ctx'
    );
  });
});
