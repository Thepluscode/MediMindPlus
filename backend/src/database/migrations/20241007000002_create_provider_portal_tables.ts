import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add role field to users table if not exists
  await knex.schema.alterTable('users', (table) => {
    table.string('role').defaultTo('patient'); // patient, provider, admin, researcher
    table.string('provider_type').nullable(); // physician, nurse_practitioner, physician_assistant
    table.string('specialty').nullable(); // Internal Medicine, Cardiology, etc.
    table.string('license_number').nullable();
    table.jsonb('provider_metadata').defaultTo('{}');
  });

  // Provider-Patient Relationships Table
  await knex.schema.createTable('provider_patient_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('relationship_type').notNullable(); // primary, consulting, referred
    table.boolean('is_active').defaultTo(true);
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamp('ended_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('provider_id');
    table.index('patient_id');
    table.index(['provider_id', 'patient_id']);
    table.index('is_active');
  });

  // Patient Risk Assessments Table
  await knex.schema.createTable('patient_risk_assessments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('risk_category').notNullable(); // Cardiovascular, Diabetes, Cancer, Cognitive, etc.
    table.integer('risk_score').notNullable(); // 0-100
    table.string('risk_level').notNullable(); // critical, high, moderate, low
    table.string('predicted_event').nullable();
    table.string('timeframe').nullable(); // e.g., "6-12 months"
    table.jsonb('key_factors').defaultTo('[]'); // Array of contributing factors
    table.jsonb('recommended_actions').defaultTo('[]'); // Array of recommended interventions
    table.jsonb('wearable_data').defaultTo('{}'); // Latest wearable metrics
    table.string('assessment_version').notNullable(); // ML model version
    table.float('confidence_score').nullable(); // 0-1
    table.timestamp('assessed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('patient_id');
    table.index('risk_category');
    table.index('risk_level');
    table.index('assessed_at');
  });

  // Clinical Alerts Table
  await knex.schema.createTable('clinical_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('provider_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('alert_type').notNullable(); // Critical Risk, Lab Result, Abnormal Finding, etc.
    table.string('priority').notNullable(); // critical, high, medium, low
    table.text('message').notNullable();
    table.jsonb('alert_data').defaultTo('{}'); // Additional context
    table.string('status').defaultTo('new'); // new, acknowledged, resolved, dismissed
    table.uuid('acknowledged_by').nullable().references('id').inTable('users');
    table.timestamp('acknowledged_at').nullable();
    table.uuid('resolved_by').nullable().references('id').inTable('users');
    table.timestamp('resolved_at').nullable();
    table.text('resolution_notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('patient_id');
    table.index('provider_id');
    table.index('priority');
    table.index('status');
    table.index('created_at');
  });

  // Appointments Table
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('appointment_type').notNullable(); // Follow-up, Consultation, Annual, etc.
    table.timestamp('scheduled_start').notNullable();
    table.timestamp('scheduled_end').notNullable();
    table.string('status').defaultTo('scheduled'); // scheduled, confirmed, completed, cancelled, no_show
    table.text('reason').nullable();
    table.text('notes').nullable();
    table.string('location').nullable(); // Office, Telehealth, etc.
    table.jsonb('visit_data').defaultTo('{}'); // Visit details, vitals taken, etc.
    table.uuid('cancelled_by').nullable().references('id').inTable('users');
    table.timestamp('cancelled_at').nullable();
    table.text('cancellation_reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('patient_id');
    table.index('provider_id');
    table.index('scheduled_start');
    table.index('status');
  });

  // Provider Stats Cache Table (for dashboard performance)
  await knex.schema.createTable('provider_stats_cache', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_patients').defaultTo(0);
    table.integer('active_patients').defaultTo(0);
    table.integer('high_risk_alerts').defaultTo(0);
    table.integer('pending_reviews').defaultTo(0);
    table.float('avg_engagement').defaultTo(0);
    table.integer('predictions_this_week').defaultTo(0);
    table.jsonb('additional_stats').defaultTo('{}');
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('provider_id');
    table.unique('provider_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('provider_stats_cache');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('clinical_alerts');
  await knex.schema.dropTableIfExists('patient_risk_assessments');
  await knex.schema.dropTableIfExists('provider_patient_assignments');

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('role');
    table.dropColumn('provider_type');
    table.dropColumn('specialty');
    table.dropColumn('license_number');
    table.dropColumn('provider_metadata');
  });
}
