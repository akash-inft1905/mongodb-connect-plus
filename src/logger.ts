import winston from 'winston';
import { LoggingOptions } from './types';

const defaultLoggingOptions: LoggingOptions = {
  enabled: true,
  level: 'info',
  format: 'simple'
};

export class Logger {
  private logger: winston.Logger;

  constructor(options: Partial<LoggingOptions> = {}) {
    const config = { ...defaultLoggingOptions, ...options };
    
    this.logger = winston.createLogger({
      level: config.level,
      format: config.format === 'json' 
        ? winston.format.json()
        : winston.format.simple(),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
} 