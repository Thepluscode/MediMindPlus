const { db } = require('../../src/config/database');
const redis = require('../../src/config/redis');

// Global test setup
beforeAll(async () => {
  // Run migrations
  await db.migrate.latest();
  
  // Clear Redis
  await redis.flushdb();
});

afterAll(async () => {
  // Rollback migrations
  await db.migrate.rollback();
  
  // Close connections
  await db.destroy();
  await redis.quit();
});

beforeEach(async () => {
  // Clear all tables before each test
  await db.raw(`
    TRUNCATE TABLE 
      users, 
      health_profiles, 
      vital_signs, 
      lab_results, 
      genetic_data, 
      sensor_data, 
      ai_predictions, 
      interventions, 
      notifications 
    CASCADE
  `);
});
