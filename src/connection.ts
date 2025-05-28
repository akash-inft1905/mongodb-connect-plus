import mongoose from 'mongoose';
import { ConnectionConfig, ConnectionResult, MultiConnectionConfig, MultiConnectionResult, RetryOptions } from './types';
import { Logger } from './logger';

const defaultRetryOptions: RetryOptions = {
  maxRetries: 5,
  retryInterval: 5000,
  backoffFactor: 1.5
};

export class MongoDBConnection {
  private logger: Logger;
  private connections: Map<string, mongoose.Connection> = new Map();

  constructor() {
    this.logger = new Logger();
  }

  private validatePoolOptions(options?: mongoose.ConnectOptions): mongoose.ConnectOptions {
    if (!options) return {};
    
    const validatedOptions = { ...options };
    
    // Ensure minPoolSize is not greater than maxPoolSize
    if (validatedOptions.minPoolSize && validatedOptions.maxPoolSize) {
      if (validatedOptions.minPoolSize > validatedOptions.maxPoolSize) {
        this.logger.warn('minPoolSize cannot be greater than maxPoolSize. Adjusting values...');
        validatedOptions.minPoolSize = Math.floor(validatedOptions.maxPoolSize / 2);
      }
    }

    return validatedOptions;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async attemptConnection(
    uri: string,
    options: mongoose.ConnectOptions,
    retryOptions: RetryOptions,
    attempt: number = 1
  ): Promise<ConnectionResult> {
    try {
      const validatedOptions = this.validatePoolOptions(options);
      const connection = await mongoose.createConnection(uri, validatedOptions);
      this.logger.info(`Successfully connected to MongoDB at ${uri}`);
      return { success: true, connection };
    } catch (error) {
      if (attempt < retryOptions.maxRetries) {
        const waitTime = retryOptions.retryInterval * Math.pow(retryOptions.backoffFactor, attempt - 1);
        this.logger.warn(`Connection attempt ${attempt} failed. Retrying in ${waitTime}ms...`);
        await this.wait(waitTime);
        return this.attemptConnection(uri, options, retryOptions, attempt + 1);
      }
      this.logger.error(`Failed to connect to MongoDB after ${retryOptions.maxRetries} attempts`);
      return { success: false, error: error as Error };
    }
  }

  async connect(config: ConnectionConfig): Promise<ConnectionResult> {
    const retryOptions = { ...defaultRetryOptions, ...config.retryOptions };
    const options = {
      ...this.validatePoolOptions(config.options),
      maxPoolSize: config.options?.maxPoolSize || 10,
      minPoolSize: config.options?.minPoolSize || 2,
      serverSelectionTimeoutMS: config.options?.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: config.options?.socketTimeoutMS || 45000,
    };

    return this.attemptConnection(config.uri, options, retryOptions);
  }

  async connectMultiple(configs: MultiConnectionConfig): Promise<MultiConnectionResult> {
    const results: MultiConnectionResult = {};
    
    for (const [key, config] of Object.entries(configs)) {
      results[key] = await this.connect(config);
      if (results[key].success && results[key].connection) {
        this.connections.set(key, results[key].connection);
      }
    }

    return results;
  }

  getConnection(key: string): mongoose.Connection | undefined {
    return this.connections.get(key);
  }

  async disconnect(key?: string): Promise<void> {
    if (key) {
      const connection = this.connections.get(key);
      if (connection) {
        await connection.close();
        this.connections.delete(key);
        this.logger.info(`Disconnected from MongoDB connection: ${key}`);
      }
    } else {
      for (const [key, connection] of this.connections.entries()) {
        await connection.close();
        this.logger.info(`Disconnected from MongoDB connection: ${key}`);
      }
      this.connections.clear();
    }
  }
}