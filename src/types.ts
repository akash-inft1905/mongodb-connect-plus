import { ConnectOptions } from 'mongoose';

export interface RetryOptions {
  maxRetries: number;
  retryInterval: number;
  backoffFactor: number;
}

export interface LoggingOptions {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'simple';
}

export interface ConnectionConfig {
  uri: string;
  options?: ConnectOptions;
  retryOptions?: Partial<RetryOptions>;
  loggingOptions?: Partial<LoggingOptions>;
}

export interface MultiConnectionConfig {
  [key: string]: ConnectionConfig;
}

export interface ConnectionResult {
  success: boolean;
  error?: Error;
  connection?: any;
}

export interface MultiConnectionResult {
  [key: string]: ConnectionResult;
}