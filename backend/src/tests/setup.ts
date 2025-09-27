import { AppDataSource } from '../config/data-source';
import { clearDatabase, closeTestConnection } from './test-utils';

// Global test setup
beforeAll(async () => {
  // Initialize test database connection
  await AppDataSource.initialize();
  
  // Run migrations for test database
  await AppDataSource.runMigrations();
});

// Clean up after each test
afterEach(async () => {
  // Clear all test data
  await clearDatabase();
});

// Clean up after all tests
afterAll(async () => {
  // Close the database connection
  await closeTestConnection();
});

// Set test timeout to 30 seconds
jest.setTimeout(30000);
