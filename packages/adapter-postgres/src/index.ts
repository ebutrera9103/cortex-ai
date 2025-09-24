import type { CortexContext, ICortexStorageAdapter } from '@cortex-ai/core';
import type { Pool } from 'pg';

export class PostgresStorageAdapter implements ICortexStorageAdapter {
  constructor(private readonly pgPool: Pool) {
    if (!pgPool) {
      throw new Error('A node-postgres Pool instance must be provided.');
    }
  }

  /**
   * Initializes the database table if it doesn't exist.
   * A developer should run this once when their application starts.
   */
  public async init(): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS cortex_contexts (
          tenant_id TEXT NOT NULL,
          context_id TEXT NOT NULL,
          data JSONB NOT NULL,
          PRIMARY KEY (tenant_id, context_id)
        );
      `);
    } finally {
      client.release();
    }
  }

  public async connect(): Promise<void> {
    return Promise.resolve();
  }

  public async disconnect(): Promise<void> {
    await this.pgPool.end();
  }

  public async get<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    const client = await this.pgPool.connect();
    try {
      const res = await client.query(
        'SELECT data FROM cortex_contexts WHERE tenant_id = $1 AND context_id = $2',
        [tenantId, contextId]
      );
      return res.rows[0] ? (res.rows[0].data as CortexContext<T>) : null;
    } finally {
      client.release();
    }
  }

  public async set<T>(context: CortexContext<T>): Promise<CortexContext<T>> {
    const client = await this.pgPool.connect();
    try {
      await client.query(
        `
        INSERT INTO cortex_contexts (tenant_id, context_id, data)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, context_id)
        DO UPDATE SET data = $3;
        `,
        [context.tenantId, context.contextId, context]
      );
      return context;
    } finally {
      client.release();
    }
  }

  public async delete(tenantId: string, contextId: string): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query(
        'DELETE FROM cortex_contexts WHERE tenant_id = $1 AND context_id = $2',
        [tenantId, contextId]
      );
    } finally {
      client.release();
    }
  }
}
