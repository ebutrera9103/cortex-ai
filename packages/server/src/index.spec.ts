import {
  ICortexStorageAdapter,
  InvalidInputError,
  CortexContext,
  StorageAdapterError,
  SetMemoryOptions,
} from '@cortex-ai/core';
import { CortexServer } from '.';

describe('CortexServer', () => {
  let mockAdapter: jest.Mocked<ICortexStorageAdapter>;
  let server: CortexServer;

  const tenantId = 'tenant-123';
  const contextId = 'ctx-456';

  beforeEach(() => {
    mockAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    server = new CortexServer(mockAdapter, { defaultTtlSeconds: 60 });
  });

  describe('constructor', () => {
    it('throws if storageAdapter is missing', () => {
      expect(() => new CortexServer(undefined as any)).toThrow(
        InvalidInputError
      );
    });

    it('initializes with valid storageAdapter', () => {
      expect(() => new CortexServer(mockAdapter)).not.toThrow();
    });
  });

  describe('getMemory', () => {
    it('throws InvalidInputError for invalid tenantId', async () => {
      await expect(server.getMemory('', contextId)).rejects.toThrow(
        InvalidInputError
      );
    });

    it('throws InvalidInputError for invalid contextId', async () => {
      await expect(server.getMemory(tenantId, ' ')).rejects.toThrow(
        InvalidInputError
      );
    });

    it('returns context from adapter', async () => {
      const ctx: CortexContext<{ foo: string }> = {
        tenantId,
        contextId,
        data: { foo: 'bar' },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          sizeBytes: 10,
        },
      };
      mockAdapter.get.mockResolvedValue(ctx);

      const result = await server.getMemory<{ foo: string }>(
        tenantId,
        contextId
      );
      expect(result).toEqual(ctx);
      expect(mockAdapter.get).toHaveBeenCalledWith(tenantId, contextId);
    });

    it('wraps adapter errors in StorageAdapterError', async () => {
      mockAdapter.get.mockRejectedValue(new Error('boom'));
      await expect(server.getMemory(tenantId, contextId)).rejects.toThrow(
        StorageAdapterError
      );
    });
  });

  describe('setMemory', () => {
    const options: SetMemoryOptions<{ foo: string }> = {
      data: { foo: 'bar' },
      metadata: { tags: ['tag1'] },
    };

    it('throws InvalidInputError for invalid tenantId', async () => {
      await expect(server.setMemory('', contextId, options)).rejects.toThrow(
        InvalidInputError
      );
    });

    it('throws InvalidInputError for invalid contextId', async () => {
      await expect(server.setMemory(tenantId, '', options)).rejects.toThrow(
        InvalidInputError
      );
    });

    it('throws InvalidInputError if options.data is missing', async () => {
      await expect(
        server.setMemory(tenantId, contextId, {} as any)
      ).rejects.toThrow(InvalidInputError);
    });

    it('creates new context when none exists', async () => {
      mockAdapter.get.mockResolvedValue(null);
      mockAdapter.set.mockImplementation(async (ctx) => ctx);

      const result = await server.setMemory(tenantId, contextId, options);

      expect(result.tenantId).toBe(tenantId);
      expect(result.contextId).toBe(contextId);
      expect(result.data).toEqual(options.data);
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.ttl).toBe(60); // from config
      expect(mockAdapter.get).toHaveBeenCalledWith(tenantId, contextId);
      expect(mockAdapter.set).toHaveBeenCalled();
    });

    it('updates existing context with incremented version', async () => {
      const oldCtx: CortexContext<{ foo: string }> = {
        tenantId,
        contextId,
        data: { foo: 'old' },
        metadata: {
          createdAt: 'yesterday',
          updatedAt: 'yesterday',
          version: 2,
          sizeBytes: 5,
        },
      };
      mockAdapter.get.mockResolvedValue(oldCtx);
      mockAdapter.set.mockImplementation(async (ctx) => ctx);

      const result = await server.setMemory(tenantId, contextId, options);

      expect(result.metadata.version).toBe(3);
      expect(result.metadata.createdAt).toBe('yesterday'); // preserved
      expect(result.metadata.updatedAt).not.toBe('yesterday');
    });

    it('propagates InvalidInputError or StorageAdapterError directly', async () => {
      mockAdapter.get.mockRejectedValue(new InvalidInputError('invalid'));
      await expect(
        server.setMemory(tenantId, contextId, options)
      ).rejects.toThrow(InvalidInputError);

      mockAdapter.get.mockRejectedValue(
        new StorageAdapterError('storage fail', new Error())
      );
      await expect(
        server.setMemory(tenantId, contextId, options)
      ).rejects.toThrow(StorageAdapterError);
    });

    it('wraps unknown errors in StorageAdapterError', async () => {
      mockAdapter.get.mockRejectedValue(new Error('unexpected'));
      await expect(
        server.setMemory(tenantId, contextId, options)
      ).rejects.toThrow(StorageAdapterError);
    });
  });

  describe('deleteMemory', () => {
    it('throws InvalidInputError for invalid tenantId', async () => {
      await expect(server.deleteMemory('', contextId)).rejects.toThrow(
        InvalidInputError
      );
    });

    it('throws InvalidInputError for invalid contextId', async () => {
      await expect(server.deleteMemory(tenantId, '')).rejects.toThrow(
        InvalidInputError
      );
    });

    it('calls adapter.delete successfully', async () => {
      await server.deleteMemory(tenantId, contextId);
      expect(mockAdapter.delete).toHaveBeenCalledWith(tenantId, contextId);
    });

    it('wraps adapter errors in StorageAdapterError', async () => {
      mockAdapter.delete.mockRejectedValue(new Error('delete fail'));
      await expect(server.deleteMemory(tenantId, contextId)).rejects.toThrow(
        StorageAdapterError
      );
    });
  });

  describe('_createUpdatedContext (private)', () => {
    it('constructs new context with correct metadata', () => {
      const opts: SetMemoryOptions<{ foo: string }> = { data: { foo: 'bar' } };
      const result = (server as any)._createUpdatedContext(
        tenantId,
        contextId,
        opts,
        null
      );

      expect(result.tenantId).toBe(tenantId);
      expect(result.contextId).toBe(contextId);
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.sizeBytes).toBe(
        Buffer.from(JSON.stringify(opts.data)).byteLength
      );
    });
  });
});
