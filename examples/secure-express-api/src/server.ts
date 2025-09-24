import express from 'express';
import Redis from 'ioredis';
import { CortexServer } from '@cortex-ai/server';
import { RedisStorageAdapter } from '@cortex-ai/adapter-redis';
import { createCortexMiddleware } from '@cortex-ai/express';

const validApiKeys: Record<string, string> = {
  'tenant-123': 'api-key-abc',
  'tenant-456': 'api-key-xyz',
};

async function apiKeyValidator(
  tenantId: string,
  apiKey: string
): Promise<boolean> {
  console.log(`Validating API key for tenant: ${tenantId}`);
  const expectedKey = validApiKeys[tenantId];
  return expectedKey === apiKey;
}

const redisClient = new Redis();

redisClient.on('error', (_err) => {
  console.error('Could not connect to Redis. Please ensure it is running.');
  process.exit(1);
});

const storageAdapter = new RedisStorageAdapter(redisClient);

const cortexServer = new CortexServer(storageAdapter, {
  defaultTtlSeconds: 3600,
});

const app = express();
app.use(express.json());

app.use('/cortex', createCortexMiddleware(cortexServer, { apiKeyValidator }));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(
    `✅ Secure cortex server running on http://localhost:${PORT}/cortex`
  );
  console.log(
    '🔑 Valid tenants: tenant-123 (key: api-key-abc), tenant-456 (key: api-key-xyz)'
  );
});
