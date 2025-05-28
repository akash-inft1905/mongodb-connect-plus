export * from './logger';
export * from './types';

import { MongoDBConnection } from './connection';
import { ConnectionConfig, LoggingOptions } from './types';

// Create a default instance
const defaultConnection = new MongoDBConnection();

// Export the connection functions
export const connect = (config: ConnectionConfig) => defaultConnection.connect(config);
export const connectMultiple = (configs: Record<string, ConnectionConfig>) => defaultConnection.connectMultiple(configs);
export const getConnection = (key: string) => defaultConnection.getConnection(key);
export const disconnect = (key?: string) => defaultConnection.disconnect(key);

// Export the default instance
export default defaultConnection; 