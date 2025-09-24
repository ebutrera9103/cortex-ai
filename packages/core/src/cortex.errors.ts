export class CortexError extends Error {
  constructor(message: string) { super(message); this.name = 'CortexError'; }
}
export class ContextNotFoundError extends CortexError {
  constructor(tenantId: string, contextId: string) { super(`Context with ID '${contextId}' not found for tenant '${tenantId}'.`); this.name = 'ContextNotFoundError'; }
}
export class StorageAdapterError extends CortexError {
  constructor(message: string, public readonly cause?: Error) { super(message); this.name = 'StorageAdapterError'; }
}
