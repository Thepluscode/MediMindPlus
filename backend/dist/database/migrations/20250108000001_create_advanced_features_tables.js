"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
/**
 * Advanced Features Database Migrations
 * Creates tables for: Stroke Detection, BCI Monitoring, Microbiome Analysis,
 * Medical Copilot, Athletic Performance, and Wearable Devices
 */
async function up(knex) {
    // ============================================================================
    // STROKE DETECTION TABLES
    // ============================================================================
    await knex.schema.createTable('stroke_analyses', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('scan_type', 50).notNullable(); // ct_head_noncontrast, ct_angiography, etc.
        table.boolean('stroke_detected').notNullable();
        table.string('stroke_type', 50); // Ischemic, Hemorrhagic, TIA
        table.decimal('confidence', 5, 2).notNullable();
        table.string('time_since_onset', 50);
        table.boolean('treatment_eligible');
        table.string('affected_region', 255);
        table.string('infarct_volume', 50);
        table.jsonb('location').notNullable(); // hemisphere, territory, specific_areas
        table.jsonb('vessel_occlusion').notNullable();
        table.jsonb('recommendations').notNullable();
        table.jsonb('prognosis').notNullable();
        table.jsonb('clinical_context');
        table.integer('processing_time_ms');
        table.timestamps(true, true);
        table.index('patient_id');
        table.index('created_at');
    });
    await knex.schema.createTable('stroke_scan_images', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('analysis_id').notNullable().references('id').inTable('stroke_analyses').onDelete('CASCADE');
        table.string('file_name', 255).notNullable();
        table.string('file_path', 512).notNullable();
        table.string('file_type', 50).notNullable(); // DICOM, NIfTI, PNG, etc.
        table.bigInteger('file_size');
        table.jsonb('metadata'); // DICOM tags, dimensions, etc.
        table.timestamps(true, true);
        table.index('analysis_id');
    });
    // ============================================================================
    // BCI MENTAL HEALTH TABLES
    // ============================================================================
    await knex.schema.createTable('bci_sessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('device_type', 100); // Muse, NeuroSky, Emotiv, etc.
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time');
        table.string('status', 50).notNullable().defaultTo('active'); // active, paused, complete
        table.integer('duration_seconds');
        table.integer('data_points_collected');
        table.timestamps(true, true);
        table.index('user_id');
        table.index(['user_id', 'start_time']);
    });
    await knex.schema.createTable('bci_metrics', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('session_id').references('id').inTable('bci_sessions').onDelete('SET NULL');
        table.integer('overall_score');
        table.jsonb('depression_severity').notNullable();
        table.jsonb('anxiety_level').notNullable();
        table.jsonb('stress_pattern').notNullable();
        table.jsonb('cognitive_performance').notNullable();
        table.jsonb('sleep_brain_analysis').notNullable();
        table.jsonb('brainwave_patterns').notNullable(); // delta, theta, alpha, beta, gamma
        table.timestamp('measured_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('measured_at');
    });
    await knex.schema.createTable('bci_interventions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('type', 100).notNullable(); // Neurofeedback, Meditation, etc.
        table.string('target', 255).notNullable();
        table.string('protocol', 255).notNullable();
        table.string('frequency', 100);
        table.text('expected_outcome');
        table.timestamp('started_at').notNullable();
        table.timestamp('completed_at');
        table.string('status', 50).defaultTo('active'); // active, completed, abandoned
        table.jsonb('progress_data');
        table.timestamps(true, true);
        table.index('user_id');
    });
    await knex.schema.createTable('bci_early_warnings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('condition', 255).notNullable();
        table.decimal('probability', 5, 2).notNullable();
        table.string('timeframe', 100).notNullable();
        table.jsonb('indicators').notNullable();
        table.string('severity', 50).notNullable(); // low, moderate, high, critical
        table.boolean('acknowledged').defaultTo(false);
        table.timestamp('issued_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index(['user_id', 'acknowledged']);
    });
    // ============================================================================
    // MICROBIOME ANALYSIS TABLES
    // ============================================================================
    await knex.schema.createTable('microbiome_kits', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('kit_number', 100).unique().notNullable();
        table.string('status', 50).notNullable().defaultTo('ordered'); // ordered, shipped, delivered, collected, in_lab, complete
        table.timestamp('ordered_at').notNullable();
        table.timestamp('shipped_at');
        table.timestamp('delivered_at');
        table.timestamp('collected_at');
        table.timestamp('received_at_lab');
        table.timestamp('analysis_complete_at');
        table.string('tracking_number', 100);
        table.jsonb('shipping_address').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('kit_number');
    });
    await knex.schema.createTable('microbiome_results', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('kit_id').notNullable().references('id').inTable('microbiome_kits').onDelete('CASCADE');
        table.integer('diversity_score').notNullable();
        table.string('balance_rating', 50).notNullable(); // Poor, Fair, Good, Excellent
        table.jsonb('detected_conditions').notNullable();
        table.jsonb('bacterial_composition').notNullable();
        table.jsonb('recommendations').notNullable();
        table.text('lab_notes');
        table.timestamp('analyzed_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('kit_id');
    });
    await knex.schema.createTable('probiotic_orders', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('microbiome_result_id').references('id').inTable('microbiome_results').onDelete('SET NULL');
        table.string('formula_id', 100).notNullable();
        table.string('formula_name', 255).notNullable();
        table.jsonb('strains').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.string('subscription_status', 50); // active, paused, cancelled
        table.timestamp('ordered_at').notNullable();
        table.timestamp('next_shipment_date');
        table.timestamps(true, true);
        table.index('user_id');
    });
    // ============================================================================
    // MEDICAL COPILOT TABLES
    // ============================================================================
    await knex.schema.createTable('copilot_sessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('session_type', 100).notNullable(); // office_visit, telehealth, hospital_round, emergency
        table.string('status', 50).notNullable().defaultTo('active'); // active, paused, complete
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time');
        table.boolean('transcription_active').defaultTo(false);
        table.integer('duration_seconds');
        table.timestamps(true, true);
        table.index('provider_id');
        table.index('patient_id');
        table.index(['provider_id', 'start_time']);
    });
    await knex.schema.createTable('clinical_notes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('session_id').notNullable().references('id').inTable('copilot_sessions').onDelete('CASCADE');
        table.string('note_status', 50).notNullable().defaultTo('draft'); // draft, pending_review, signed, amended
        table.text('chief_complaint');
        table.text('history_present_illness');
        table.jsonb('physical_exam').notNullable();
        table.jsonb('assessment').notNullable();
        table.jsonb('plan').notNullable();
        table.jsonb('billing_codes').notNullable();
        table.jsonb('clinical_decision_support');
        table.integer('time_saved_minutes');
        table.timestamp('signed_at');
        table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
        table.boolean('synced_to_ehr').defaultTo(false);
        table.timestamp('ehr_sync_at');
        table.timestamps(true, true);
        table.index('session_id');
    });
    await knex.schema.createTable('copilot_audio_chunks', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('session_id').notNullable().references('id').inTable('copilot_sessions').onDelete('CASCADE');
        table.integer('chunk_number').notNullable();
        table.string('file_path', 512).notNullable();
        table.bigInteger('file_size');
        table.text('transcription');
        table.timestamp('uploaded_at').notNullable();
        table.timestamps(true, true);
        table.index('session_id');
        table.unique(['session_id', 'chunk_number']);
    });
    // ============================================================================
    // ATHLETIC PERFORMANCE TABLES
    // ============================================================================
    await knex.schema.createTable('athlete_profiles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('sport', 100).notNullable();
        table.string('position', 100);
        table.string('skill_level', 50); // amateur, collegiate, professional, elite
        table.integer('years_experience');
        table.decimal('height_cm', 5, 2);
        table.decimal('weight_kg', 5, 2);
        table.date('birth_date');
        table.jsonb('baseline_metrics');
        table.timestamps(true, true);
        table.index('user_id');
    });
    await knex.schema.createTable('athletic_metrics', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('performance_score');
        table.integer('readiness_score');
        table.string('injury_risk', 50); // Low, Moderate, High, Critical
        table.string('optimal_training_load', 50);
        table.jsonb('hrv_data').notNullable();
        table.jsonb('cognitive_performance').notNullable();
        table.jsonb('recovery_metrics').notNullable();
        table.timestamp('measured_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('measured_at');
    });
    await knex.schema.createTable('decision_analyses', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('game_situation').notNullable();
        table.jsonb('options').notNullable();
        table.string('recommended_action', 255);
        table.jsonb('context');
        table.timestamp('analyzed_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
    });
    await knex.schema.createTable('injury_risk_predictions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('injury_type', 100).notNullable();
        table.decimal('probability', 5, 2).notNullable();
        table.string('timeframe', 100).notNullable();
        table.jsonb('contributing_factors').notNullable();
        table.jsonb('prevention_recommendations').notNullable();
        table.timestamp('predicted_at').notNullable();
        table.timestamps(true, true);
        table.index('user_id');
    });
    // ============================================================================
    // WEARABLE DEVICES TABLES
    // ============================================================================
    await knex.schema.createTable('wearable_devices', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('device_type', 100).notNullable(); // Smartwatch, Fitness Tracker, etc.
        table.string('manufacturer', 100).notNullable();
        table.string('model_name', 255).notNullable();
        table.string('serial_number', 100);
        table.string('firmware_version', 50);
        table.string('status', 50).notNullable().defaultTo('connected'); // connected, syncing, disconnected, error
        table.integer('battery_level');
        table.timestamp('last_sync').notNullable();
        table.integer('data_points_today').defaultTo(0);
        table.jsonb('capabilities').notNullable(); // array of capabilities
        table.text('auth_token_encrypted');
        table.string('external_device_id', 255);
        table.jsonb('settings');
        table.timestamps(true, true);
        table.index('user_id');
        table.index(['user_id', 'status']);
    });
    await knex.schema.createTable('biometric_data', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('device_id').references('id').inTable('wearable_devices').onDelete('SET NULL');
        table.string('data_type', 100).notNullable(); // heart_rate, steps, sleep, hrv, etc.
        table.decimal('value', 12, 4).notNullable();
        table.string('unit', 50).notNullable(); // bpm, steps, hours, ms, etc.
        table.timestamp('timestamp').notNullable();
        table.string('source', 100).notNullable();
        table.jsonb('metadata'); // activity_state, confidence, etc.
        table.timestamps(true, true);
        table.index('user_id');
        table.index(['user_id', 'data_type', 'timestamp']);
        table.index('timestamp');
    });
    await knex.schema.createTable('data_quality_issues', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('device_id').notNullable().references('id').inTable('wearable_devices').onDelete('CASCADE');
        table.string('issue_type', 100).notNullable();
        table.text('description').notNullable();
        table.string('severity', 50).notNullable(); // low, moderate, high
        table.timestamp('detected_at').notNullable();
        table.timestamp('resolved_at');
        table.boolean('acknowledged').defaultTo(false);
        table.timestamps(true, true);
        table.index('device_id');
        table.index(['device_id', 'resolved_at']);
    });
    // ============================================================================
    // LIQUID BIOPSY TABLES
    // ============================================================================
    await knex.schema.createTable('liquid_biopsy_tests', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('test_type', 100).notNullable(); // ctDNA, CTC, Exosome, etc.
        table.string('status', 50).notNullable().defaultTo('ordered'); // ordered, sample_collected, in_lab, complete
        table.timestamp('ordered_at').notNullable();
        table.timestamp('sample_collected_at');
        table.timestamp('received_at_lab');
        table.timestamp('completed_at');
        table.string('lab_order_number', 100);
        table.jsonb('test_results');
        table.timestamps(true, true);
        table.index('user_id');
    });
    // ============================================================================
    // SUBSCRIPTION & USAGE TRACKING
    // ============================================================================
    await knex.schema.createTable('feature_usage_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('feature_type', 100).notNullable(); // stroke_detection, bci_monitoring, etc.
        table.string('action', 100).notNullable(); // scan_uploaded, analysis_complete, etc.
        table.jsonb('metadata');
        table.timestamp('used_at').notNullable();
        table.index('user_id');
        table.index(['user_id', 'feature_type']);
        table.index('used_at');
    });
}
async function down(knex) {
    // Drop tables in reverse order to respect foreign key constraints
    await knex.schema.dropTableIfExists('feature_usage_logs');
    await knex.schema.dropTableIfExists('liquid_biopsy_tests');
    await knex.schema.dropTableIfExists('data_quality_issues');
    await knex.schema.dropTableIfExists('biometric_data');
    await knex.schema.dropTableIfExists('wearable_devices');
    await knex.schema.dropTableIfExists('injury_risk_predictions');
    await knex.schema.dropTableIfExists('decision_analyses');
    await knex.schema.dropTableIfExists('athletic_metrics');
    await knex.schema.dropTableIfExists('athlete_profiles');
    await knex.schema.dropTableIfExists('copilot_audio_chunks');
    await knex.schema.dropTableIfExists('clinical_notes');
    await knex.schema.dropTableIfExists('copilot_sessions');
    await knex.schema.dropTableIfExists('probiotic_orders');
    await knex.schema.dropTableIfExists('microbiome_results');
    await knex.schema.dropTableIfExists('microbiome_kits');
    await knex.schema.dropTableIfExists('bci_early_warnings');
    await knex.schema.dropTableIfExists('bci_interventions');
    await knex.schema.dropTableIfExists('bci_metrics');
    await knex.schema.dropTableIfExists('bci_sessions');
    await knex.schema.dropTableIfExists('stroke_scan_images');
    await knex.schema.dropTableIfExists('stroke_analyses');
}
