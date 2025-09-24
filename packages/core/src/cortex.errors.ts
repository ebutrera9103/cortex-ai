/**
 * The base error class for all errors thrown by the Cortex AI library.
 */
export class CortexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CortexError';
  }
}

/**
 * Thrown when an error occurs within a storage adapter during a database operation.
 * The `cause` property will contain the original error from the database driver.
 */
export class StorageAdapterError extends CortexError {
  public readonly cause: Error;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'StorageAdapterError';
    this.cause = cause instanceof Error ? cause : new Error(String(cause));
  }
}

/**
 * Thrown when the input provided to a server method is invalid (e.g., an empty string).
 * This error occurs before any database operation is attempted.
 */
export class InvalidInputError extends CortexError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}
