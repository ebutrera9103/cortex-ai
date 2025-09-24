import { MongoDbStorageAdapter } from '.';

describe('MongoDBStorageAdapter', () => {
  let db: any;
  let collection: any;
  let adapter: MongoDbStorageAdapter;

  beforeEach(() => {
    collection = {
      findOne: jest.fn(),
      replaceOne: jest.fn(),
      deleteOne: jest.fn(),
      createIndex: jest.fn(),
    };
    db = {
      collection: jest.fn().mockReturnValue(collection),
    };
    adapter = new MongoDbStorageAdapter(db);
  });

  it('creates index on init', async () => {
    await adapter.init();
    expect(collection.createIndex).toHaveBeenCalledWith({
      'context.tenantId': 1,
    });
  });

  it('connect resolves', async () => {
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  it('disconnect resolves', async () => {
    await expect(adapter.disconnect()).resolves.toBeUndefined();
  });

  it('get returns context if found', async () => {
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
    collection.findOne.mockResolvedValue({ context });
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toEqual(context);
    expect(collection.findOne).toHaveBeenCalledWith({ _id: 'tenant::ctx' });
  });

  it('get returns null if not found', async () => {
    collection.findOne.mockResolvedValue(null);
    const result = await adapter.get('tenant', 'ctx');
    expect(result).toBeNull();
    expect(collection.findOne).toHaveBeenCalledWith({ _id: 'tenant::ctx' });
  });

  it('set saves context', async () => {
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
    collection.replaceOne.mockResolvedValue({ acknowledged: true });
    const result = await adapter.set(context);
    expect(result).toEqual(context);
    expect(collection.replaceOne).toHaveBeenCalledWith(
      { _id: 'tenant::ctx' },
      { context },
      { upsert: true }
    );
  });

  it('delete removes context', async () => {
    collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    await expect(adapter.delete('tenant', 'ctx')).resolves.toBeUndefined();
    expect(collection.deleteOne).toHaveBeenCalledWith({ _id: 'tenant::ctx' });
  });
});
