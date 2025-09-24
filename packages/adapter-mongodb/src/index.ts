import type { CortexContext, ICortexStorageAdapter } from '@cortex-ai/core';
import type { Collection, Db } from 'mongodb';

interface CortexMongoDocument {
  _id: string;
  context: CortexContext<any>;
}

const CORTEX_COLLECTION_NAME = 'cortex_contexts';

export class MongoDbStorageAdapter implements ICortexStorageAdapter {
  private readonly collection: Collection<CortexMongoDocument>;

  constructor(db: Db) {
    if (!db) {
      throw new Error('A MongoDB Db instance must be provided.');
    }
    this.collection = db.collection<CortexMongoDocument>(
      CORTEX_COLLECTION_NAME
    );
  }

  private toMongoId(tenantId: string, contextId: string): string {
    return `${tenantId}::${contextId}`;
  }

  public async init(): Promise<void> {
    await this.collection.createIndex({ 'context.tenantId': 1 });
  }

  public async connect(): Promise<void> {
    return Promise.resolve();
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async get<T>(
    tenantId: string,
    contextId: string
  ): Promise<CortexContext<T> | null> {
    const _id = this.toMongoId(tenantId, contextId);
    const doc = await this.collection.findOne({ _id });

    return doc ? (doc.context as CortexContext<T>) : null;
  }

  public async set<T>(context: CortexContext<T>): Promise<CortexContext<T>> {
    const _id = this.toMongoId(context.tenantId, context.contextId);
    await this.collection.replaceOne({ _id }, { context }, { upsert: true });
    return context;
  }

  public async delete(tenantId: string, contextId: string): Promise<void> {
    const _id = this.toMongoId(tenantId, contextId);
    await this.collection.deleteOne({ _id });
  }
}
