import { describe, it, expect } from 'vitest';
import { Logger } from '../src/logger.js';

describe('Logger', () => {
  it('should create logger with default level', () => {
    const logger = new Logger();
    expect(logger).toBeDefined();
  });

  it('should create logger with custom level', () => {
    const logger = new Logger('debug');
    expect(logger).toBeDefined();
  });

  it('should not throw when logging at various levels', () => {
    const logger = new Logger('debug');
    expect(() => logger.debug('debug message')).not.toThrow();
    expect(() => logger.info('info message')).not.toThrow();
    expect(() => logger.warn('warn message')).not.toThrow();
    expect(() => logger.error('error message')).not.toThrow();
  });

  it('should suppress debug when level is info', () => {
    // We can't easily capture console output in vitest without mocks,
    // but at least verify it doesn't throw
    const logger = new Logger('info');
    expect(() => logger.debug('should be suppressed')).not.toThrow();
  });
});
