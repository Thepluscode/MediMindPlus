/**
 * Script to run consultation migration directly
 * This bypasses the Knex migration system and runs the SQL directly
 */

import { getKnex } from '../src/config/knex';
import { up } from '../src/database/migrations/20251111000002_create_consultation_tables';

async function runMigration() {
  const knex = getKnex();

  try {
    console.log('Starting consultation tables migration...');

    await up(knex);

    console.log('✅ Consultation tables created successfully!');
    console.log('Tables created:');
    console.log('  - providers');
    console.log('  - consultations');
    console.log('  - prescriptions');
    console.log('  - provider_availability');
    console.log('  - consultation_reviews');
    console.log('  - consultation_messages');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
