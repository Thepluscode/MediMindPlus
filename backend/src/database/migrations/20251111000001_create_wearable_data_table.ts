import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wearable_data', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Reference to users table
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();

    // Data source (Apple Health, Fitbit, Garmin, Samsung Health, etc.)
    table.enum('source', [
      'APPLE_HEALTH',
      'FITBIT',
      'GARMIN',
      'SAMSUNG_HEALTH',
      'GOOGLE_FIT',
      'WHOOP',
      'OURA',
      'OTHER'
    ]).notNullable();

    // Data type classification
    table.enum('data_type', [
      'VITALS',           // Heart rate, BP, blood glucose, O2 sat, respiratory rate, body temp
      'ACTIVITY',         // Steps, distance, calories, active minutes
      'BODY_METRICS',     // Weight, height, BMI, body fat percentage
      'SLEEP',            // Sleep duration, quality, stages
      'NUTRITION',        // Calories, macros, water intake
      'MENTAL_HEALTH',    // Stress, mood, mindfulness minutes
      'REPRODUCTIVE',     // Cycle tracking, fertility
      'OTHER'
    ]).notNullable();

    // Structured data payload (JSONB for flexible querying)
    table.jsonb('data').notNullable();

    // Device metadata
    table.string('device_model');
    table.string('device_os');
    table.string('app_version');

    // Timestamps
    table.timestamp('recorded_at').notNullable(); // When the data was recorded by the device
    table.timestamp('synced_at').notNullable().defaultTo(knex.fn.now()); // When it was synced to backend
    table.timestamps(true, true); // created_at, updated_at

    // Indexes for efficient time-series and filtering queries
    table.index(['user_id', 'data_type', 'recorded_at']); // Primary query pattern
    table.index(['user_id', 'source', 'synced_at']); // Track sync status by source
    table.index(['recorded_at']); // Time-based cleanup queries
    table.index(['synced_at']); // Recent data queries

    // GIN index on JSONB data for faster JSON queries
    table.index('data', 'wearable_data_jsonb_idx', 'GIN');
  });

  // Create materialized view for latest vitals (performance optimization)
  await knex.raw(`
    CREATE MATERIALIZED VIEW latest_vital_signs AS
    SELECT DISTINCT ON (user_id)
      user_id,
      data,
      recorded_at,
      source
    FROM wearable_data
    WHERE data_type = 'VITALS'
    ORDER BY user_id, recorded_at DESC;

    CREATE UNIQUE INDEX latest_vital_signs_user_idx ON latest_vital_signs (user_id);
  `);

  // Create function to refresh materialized view
  await knex.raw(`
    CREATE OR REPLACE FUNCTION refresh_latest_vital_signs()
    RETURNS trigger AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY latest_vital_signs;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to auto-refresh view when vitals are inserted
  await knex.raw(`
    CREATE TRIGGER refresh_vitals_view
    AFTER INSERT OR UPDATE ON wearable_data
    FOR EACH STATEMENT
    WHEN (pg_trigger_depth() = 0)
    EXECUTE FUNCTION refresh_latest_vital_signs();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger and function
  await knex.raw('DROP TRIGGER IF EXISTS refresh_vitals_view ON wearable_data');
  await knex.raw('DROP FUNCTION IF EXISTS refresh_latest_vital_signs');

  // Drop materialized view
  await knex.raw('DROP MATERIALIZED VIEW IF EXISTS latest_vital_signs');

  // Drop table
  await knex.schema.dropTableIfExists('wearable_data');
}
