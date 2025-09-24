import request from 'supertest';
import express from 'express';
import { ICortexService, CortexContext } from '@cortex-ai/core';
import { CortexMiddlewareConfig, createCortexMiddleware } from '.';

describe('createCortexMiddleware', () => {
  let mockService: jest.Mocked<ICortexService>;
  let app: express.Express;

  const tenantId = 'tenant-1';
  const contextId = 'ctx-1';
  const memory: CortexContext<{ foo: string }> = {
    tenantId,
    contextId,
    data: { foo: 'bar' },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      sizeBytes: 15,
    },
  };

  const setupApp = (config: CortexMiddlewareConfig = {}) => {
    mockService = {
      getMemory: jest.fn(),
      setMemory: jest.fn(),
      deleteMemory: jest.fn(),
    };
    app = express();
    app.use(express.json());
    app.use('/', createCortexMiddleware(mockService, config));
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Auth Middleware', () => {
    it('skips auth when no apiKeyValidator is provided', async () => {
      setupApp();
      mockService.getMemory.mockResolvedValue(memory);

      const res = await request(app).get(`/${tenantId}/${contextId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(memory);
    });

    it('rejects when x-api-key is missing', async () => {
      setupApp({
        apiKeyValidator: jest.fn().mockResolvedValue(true),
      });
      const res = await request(app).get(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing X-API-KEY header.');
    });

    it('rejects when apiKeyValidator returns false', async () => {
      setupApp({
        apiKeyValidator: jest.fn().mockResolvedValue(false),
      });
      const res = await request(app)
        .get(`/${tenantId}/${contextId}`)
        .set('x-api-key', 'bad-key');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid API Key.');
    });

    it('calls next when apiKeyValidator returns true', async () => {
      setupApp({
        apiKeyValidator: jest.fn().mockResolvedValue(true),
      });
      mockService.getMemory.mockResolvedValue(memory);

      const res = await request(app)
        .get(`/${tenantId}/${contextId}`)
        .set('x-api-key', 'valid-key');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(memory);
    });
  });

  describe('GET /:tenantId/:contextId', () => {
    beforeEach(() => setupApp());

    it('returns 200 with memory if found', async () => {
      mockService.getMemory.mockResolvedValue(memory);
      const res = await request(app).get(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(memory);
    });

    it('returns 404 if memory not found', async () => {
      mockService.getMemory.mockResolvedValue(null);
      const res = await request(app).get(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Context not found.');
    });

    it('returns 500 on service error', async () => {
      mockService.getMemory.mockRejectedValue(new Error('boom'));
      const res = await request(app).get(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
    });
  });

  describe('POST /:tenantId/:contextId', () => {
    beforeEach(() => setupApp());

    it('returns 400 if body is empty', async () => {
      const res = await request(app).post(`/${tenantId}/${contextId}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Request body cannot be empty.');
    });

    it('returns 201 with created memory', async () => {
      mockService.setMemory.mockResolvedValue(memory);
      const res = await request(app)
        .post(`/${tenantId}/${contextId}`)
        .send({ foo: 'bar' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(memory);
      expect(mockService.setMemory).toHaveBeenCalledWith(tenantId, contextId, {
        foo: 'bar',
      });
    });

    it('returns 500 on service error', async () => {
      mockService.setMemory.mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .post(`/${tenantId}/${contextId}`)
        .send({ foo: 'bar' });
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /:tenantId/:contextId', () => {
    beforeEach(() => setupApp());

    it('returns 204 on success', async () => {
      const res = await request(app).delete(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(204);
      expect(mockService.deleteMemory).toHaveBeenCalledWith(
        tenantId,
        contextId
      );
    });

    it('returns 500 on service error', async () => {
      mockService.deleteMemory.mockRejectedValue(new Error('fail'));
      const res = await request(app).delete(`/${tenantId}/${contextId}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
    });
  });
});
