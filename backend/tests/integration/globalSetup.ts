/**
 * Global Setup for Integration Tests
 *
 * Runs once before all test suites
 */

import { DatabaseManager } from '../../src/database/DatabaseManager';

export default async function globalSetup() {
  console.log('\n🧪 Setting up integration test environment...\n');

  // Set environment to test
  process.env.NODE_ENV = 'test';

  // Initialize test database
  const databaseManager = new DatabaseManager();

  try {
    await databaseManager.initialize();
    console.log('✅ Test database connected\n');

    // Run migrations if needed
    // await databaseManager.runMigrations();

    await databaseManager.close();
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
  }
}
