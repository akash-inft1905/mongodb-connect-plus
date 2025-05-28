export * from './types';
export * from './logger';
export * from './connection';

import { MongoDBConnection } from './connection';

// Create a default instance
const defaultConnection = new MongoDBConnection();

// Export the connection functions
export const connect = (config: any) => defaultConnection.connect(config);
export const connectMultiple = (configs: any) => defaultConnection.connectMultiple(configs);

// Export the default instance
export default defaultConnection; 