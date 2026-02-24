/**
 * Integration Test Setup
 *
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Set test database connection (if different from dev)
process.env.DB_NAME = process.env.TEST_DB_NAME || 'medimind_test';

// Disable external services during tests
process.env.SENTRY_DSN = ''; // Disable Sentry
process.env.ENABLE_SWAGGER = 'false';

// Extend Jest matchers
expect.extend({
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    const pass = jwtRegex.test(received);

    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid JWT`
          : `expected ${received} to be a valid JWT`,
      pass,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeISO8601(received: string) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    const pass = iso8601Regex.test(received);

    return {
      message: () =>
        pass
          ? `expected ${received} not to be an ISO 8601 date`
          : `expected ${received} to be an ISO 8601 date`,
      pass,
    };
  },
});

// Custom TypeScript declarations for extended matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJWT(): R;
      toBeValidUUID(): R;
      toBeISO8601(): R;
    }
  }
}

export {};
