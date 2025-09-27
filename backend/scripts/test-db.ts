import knex from '../src/config/knex';
import logger from '../src/utils/logger';

async function testDatabaseConnection() {
  try {
    logger.info('Testing database connection...');
    
    // Initialize Knex
    await knex.initialize();
    
    // Test connection
    const result = await knex.getKnex().raw('SELECT 1+1 as result');
    logger.info('Database connection test successful');
    logger.info(`Test query result: ${JSON.stringify(result.rows[0])}`);
    
    // Test migrations
    logger.info('Running migrations...');
    await knex.migrate();
    
    // Test seeds
    logger.info('Running seeds...');
    await knex.seed();
    
    // Query some test data
    const users = await knex.getKnex()('users').select('*');
    logger.info(`Found ${users.length} users in the database`);
    
    // Query health profiles
    const healthProfiles = await knex.getKnex()('health_profiles').select('*');
    logger.info(`Found ${healthProfiles.length} health profiles in the database`);
    
    // Query vital signs
    const vitalSigns = await knex.getKnex()('vital_signs').select('*');
    logger.info(`Found ${vitalSigns.length} vital signs records in the database`);
    
    logger.info('Database setup and test completed successfully!');
  } catch (error) {
    logger.error('Database test failed:', error);
    process.exit(1);
  } finally {
    await knex.close();
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();
