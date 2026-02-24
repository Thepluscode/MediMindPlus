import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Patient Onboarding Progress Table
  await knex.schema.createTable('patient_onboarding', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('current_step').defaultTo(0);
    table.boolean('is_completed').defaultTo(false);
    table.jsonb('profile_data').defaultTo('{}');
    table.jsonb('consent_data').defaultTo('{}');
    table.jsonb('medical_records_data').defaultTo('{}');
    table.jsonb('devices_data').defaultTo('{}');
    table.jsonb('goals_data').defaultTo('{}');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('is_completed');
  });

  // Medical Record Connections Table
  await knex.schema.createTable('medical_record_connections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('provider_name').notNullable(); // Epic, Cerner, Apple Health, etc.
    table.string('provider_type').notNullable(); // EMR, PHR, DEVICE
    table.string('connection_status').defaultTo('pending'); // pending, active, failed, disconnected
    table.jsonb('connection_metadata').defaultTo('{}'); // OAuth tokens, patient ID, etc.
    table.timestamp('last_sync_at').nullable();
    table.timestamp('connected_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('provider_name');
    table.index('connection_status');
  });

  // Connected Devices Table
  await knex.schema.createTable('connected_devices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('device_name').notNullable(); // Apple Watch, Fitbit, etc.
    table.string('device_type').notNullable(); // FITNESS_TRACKER, MEDICAL_DEVICE, SMART_HOME
    table.string('device_id').notNullable(); // Unique device identifier
    table.string('connection_status').defaultTo('active'); // active, disconnected, error
    table.jsonb('device_metadata').defaultTo('{}'); // Model, firmware version, etc.
    table.jsonb('metrics_tracked').defaultTo('[]'); // Array of metrics this device provides
    table.timestamp('last_data_received_at').nullable();
    table.timestamp('connected_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('device_type');
    table.index('connection_status');
    table.unique(['user_id', 'device_id']);
  });

  // Health Goals Table
  await knex.schema.createTable('health_goals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('goal_category').notNullable(); // Prevention, Wellness, Performance, Management
    table.string('goal_name').notNullable();
    table.text('goal_description').nullable();
    table.string('status').defaultTo('active'); // active, achieved, paused, abandoned
    table.jsonb('target_metrics').defaultTo('{}'); // Specific targets
    table.jsonb('current_progress').defaultTo('{}'); // Current progress data
    table.float('progress_percentage').defaultTo(0);
    table.timestamp('target_date').nullable();
    table.timestamp('achieved_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('goal_category');
    table.index('status');
  });

  // User Consent Records Table
  await knex.schema.createTable('user_consents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('consent_type').notNullable(); // data_processing, data_sharing, research, marketing
    table.boolean('consent_given').notNullable();
    table.string('consent_version').notNullable(); // Version of T&C/Privacy Policy
    table.jsonb('consent_details').defaultTo('{}'); // Specific consent preferences
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamp('consented_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('consent_type');
    table.index(['user_id', 'consent_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_consents');
  await knex.schema.dropTableIfExists('health_goals');
  await knex.schema.dropTableIfExists('connected_devices');
  await knex.schema.dropTableIfExists('medical_record_connections');
  await knex.schema.dropTableIfExists('patient_onboarding');
}
