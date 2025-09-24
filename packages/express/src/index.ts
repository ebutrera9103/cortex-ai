import type { Request, Response, Router, NextFunction } from 'express';
import { Router as createRouter } from 'express';
import type { ICortexService } from '@cortex-ai/core';

export interface CortexMiddlewareConfig {
  apiKeyValidator?: (
    tenantId: string,
    apiKey: string
  ) => Promise<boolean> | boolean;
}

function createAuthMiddleware(config: CortexMiddlewareConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.apiKeyValidator) {
      return next();
    }

    const { tenantId } = req.params;
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-KEY header.' });
    }

    const isValid = await config.apiKeyValidator(tenantId, apiKey);

    if (!isValid) {
      return res.status(403).json({ error: 'Invalid API Key.' });
    }

    next();
  };
}

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

export function createCortexMiddleware(
  cortexService: ICortexService,
  config: CortexMiddlewareConfig = {}
): Router {
  const router = createRouter();
  const authMiddleware = createAuthMiddleware(config);

  router.use('/:tenantId', authMiddleware);

  router.get(
    '/:tenantId/:contextId',
    asyncHandler(async (req: Request, res: Response) => {
      const { tenantId, contextId } = req.params;
      const memory = await cortexService.getMemory(tenantId, contextId);
      if (memory) {
        res.status(200).json(memory);
      } else {
        res.status(404).json({ error: 'Context not found.' });
      }
    })
  );

  router.post(
    '/:tenantId/:contextId',
    asyncHandler(async (req: Request, res: Response) => {
      const { tenantId, contextId } = req.params;
      const data = req.body;
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty.' });
      }
      const memory = await cortexService.setMemory(tenantId, contextId, data);
      res.status(201).json(memory);
    })
  );

  router.delete(
    '/:tenantId/:contextId',
    asyncHandler(async (req: Request, res: Response) => {
      const { tenantId, contextId } = req.params;
      await cortexService.deleteMemory(tenantId, contextId);
      res.status(204).send();
    })
  );

  router.use(
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(`[Cortex Middleware Error] ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  );

  return router;
}
