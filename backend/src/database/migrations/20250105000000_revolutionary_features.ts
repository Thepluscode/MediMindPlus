/**
 * Revolutionary Features Database Migration
 * Creates all tables for billion-dollar features
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ========================================
  // VIRTUAL HEALTH TWIN
  // ========================================

  await knex.schema.createTable('virtual_health_twins', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('version', 20).notNullable();
    table.integer('biological_age');
    table.integer('chronological_age');
    table.jsonb('cardiovascular_model');
    table.jsonb('metabolic_model');
    table.jsonb('neurological_model');
    table.jsonb('immune_model');
    table.jsonb('musculoskeletal_model');
    table.jsonb('endocrine_model');
    table.jsonb('treatment_predictions');
    table.jsonb('lifestyle_impact_models');
    table.jsonb('disease_progression_models');
    table.jsonb('simulations');
    table.decimal('accuracy', 5, 2);
    table.decimal('confidence', 5, 2);
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('user_id');
    table.index('last_updated');
  });

  // ========================================
  // MENTAL HEALTH CRISIS PREVENTION
  // ========================================

  await knex.schema.createTable('mental_health_assessments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.integer('crisis_risk_score');
    table.string('suicide_risk_level', 20);
    table.integer('depression_severity');
    table.integer('anxiety_severity');
    table.integer('stress_level');
    table.jsonb('early_warning_signals');
    table.jsonb('behavioral_patterns');
    table.jsonb('linguistic_markers');
    table.jsonb('physiological_markers');
    table.jsonb('social_markers');
    table.jsonb('recommended_interventions');
    table.jsonb('emergency_contacts');
    table.jsonb('safety_plan');
    table.string('prediction_horizon', 50);
    table.decimal('confidence_score', 5, 2);
    table.timestamp('assessment_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('user_id');
    table.index('crisis_risk_score');
    table.index('assessment_date');
  });

  await knex.schema.createTable('mental_health_interventions_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.uuid('assessment_id').references('id').inTable('mental_health_assessments');
    table.string('intervention_id', 100);
    table.string('intervention_type', 50);
    table.string('status', 20);
    table.jsonb('progress_data');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('assessment_id');
  });

  // ========================================
  // MULTI-OMICS INTEGRATION
  // ========================================

  await knex.schema.createTable('multiomics_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.jsonb('genomic_profile');
    table.jsonb('microbiome_profile');
    table.jsonb('lifestyle_profile');
    table.jsonb('integrated_insights');
    table.jsonb('personalized_recommendations');
    table.jsonb('disease_risks');
    table.jsonb('nutrition_plan');
    table.jsonb('supplement_plan');
    table.jsonb('exercise_plan');
    table.decimal('confidence', 5, 2);
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('user_id');
    table.index('last_updated');
  });

  await knex.schema.createTable('microbiome_test_kits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('kit_id', 100).unique().notNullable();
    table.string('status', 50); // ordered, shipped, delivered, sample_received, processing, completed
    table.jsonb('shipping_address');
    table.timestamp('ordered_at').defaultTo(knex.fn.now());
    table.timestamp('shipped_at');
    table.timestamp('delivered_at');
    table.timestamp('sample_received_at');
    table.timestamp('results_ready_at');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('kit_id');
    table.index('status');
  });

  // ========================================
  // LONGEVITY OPTIMIZATION
  // ========================================

  await knex.schema.createTable('longevity_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.decimal('biological_age', 5, 2);
    table.decimal('aging_rate', 5, 2);
    table.integer('predicted_healthspan');
    table.integer('predicted_lifespan');
    table.jsonb('hallmarks_of_aging');
    table.jsonb('blood_biomarkers');
    table.jsonb('epigenetic_age');
    table.jsonb('current_interventions');
    table.jsonb('recommended_interventions');
    table.integer('longevity_score');
    table.jsonb('trends_over_time');
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('user_id');
    table.index('biological_age');
  });

  await knex.schema.createTable('longevity_interventions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('profile_id').references('id').inTable('longevity_profiles');
    table.string('intervention_name', 255);
    table.string('category', 100);
    table.string('dosage', 100);
    table.string('frequency', 100);
    table.string('timing', 100);
    table.timestamp('started_at');
    table.timestamp('ended_at');
    table.jsonb('biomarker_changes');
    table.timestamps(true, true);

    table.index('profile_id');
  });

  // ========================================
  // EMPLOYER HEALTH DASHBOARD
  // ========================================

  await knex.schema.createTable('employer_health_dashboards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employer_id').references('id').inTable('employers').notNullable();
    table.string('company_name', 255);
    table.integer('employee_count');
    table.integer('overall_health_score');
    table.jsonb('risk_distribution');
    table.jsonb('chronic_condition_prevalence');
    table.jsonb('healthcare_costs');
    table.jsonb('productivity_metrics');
    table.jsonb('roi_analysis');
    table.jsonb('demographic_breakdown');
    table.jsonb('engagement_metrics');
    table.jsonb('program_effectiveness');
    table.jsonb('future_risk_predictions');
    table.jsonb('cost_projections');
    table.jsonb('intervention_opportunities');
    table.jsonb('privacy_compliance');
    table.string('aggregation_level', 50);
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('employer_id');
    table.index('last_updated');
  });

  await knex.schema.createTable('employers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('company_name', 255).notNullable();
    table.string('industry', 100);
    table.integer('employee_count');
    table.string('plan_tier', 50);
    table.decimal('monthly_fee', 10, 2);
    table.timestamp('contract_start');
    table.timestamp('contract_end');
    table.timestamps(true, true);
  });

  // ========================================
  // PROVIDER PERFORMANCE
  // ========================================

  await knex.schema.createTable('provider_performance_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('provider_id').references('id').inTable('providers').notNullable();
    table.string('provider_name', 255);
    table.string('specialty', 100);
    table.jsonb('quality_metrics');
    table.jsonb('efficiency_metrics');
    table.jsonb('patient_outcomes');
    table.jsonb('financial_performance');
    table.jsonb('peer_comparison');
    table.jsonb('benchmarks');
    table.jsonb('improvement_areas');
    table.jsonb('best_practices');
    table.jsonb('error_analysis');
    table.integer('safety_score');
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('provider_id');
    table.index('specialty');
  });

  await knex.schema.createTable('providers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('specialty', 100);
    table.string('license_number', 100);
    table.string('npi_number', 20);
    table.timestamps(true, true);
  });

  // ========================================
  // FEDERATED LEARNING NETWORK
  // ========================================

  await knex.schema.createTable('federated_network_nodes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id');
    table.string('institution_name', 255);
    table.string('institution_type', 100);
    table.string('node_type', 50);
    table.jsonb('contribution_metrics');
    table.jsonb('data_quality_metrics');
    table.jsonb('privacy_metrics');
    table.jsonb('rewards');
    table.string('status', 50);
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('last_sync');
    table.timestamps(true, true);

    table.index('institution_id');
    table.index('status');
  });

  await knex.schema.createTable('federated_global_models', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('model_id', 100).unique();
    table.string('model_name', 255);
    table.string('model_type', 100);
    table.string('version', 50);
    table.decimal('accuracy', 5, 2);
    table.integer('participants');
    table.integer('training_rounds');
    table.jsonb('performance');
    table.timestamp('last_update').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('model_id');
  });

  // ========================================
  // PREDICTIVE INSURANCE
  // ========================================

  await knex.schema.createTable('predictive_insurance_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('policy_id', 100);
    table.string('policy_type', 50);
    table.integer('dynamic_risk_score');
    table.string('risk_trend', 50);
    table.jsonb('risk_factors');
    table.decimal('base_premium', 10, 2);
    table.decimal('risk_adjustment', 10, 2);
    table.decimal('wellness_discount', 10, 2);
    table.decimal('final_premium', 10, 2);
    table.jsonb('wellness_programs');
    table.jsonb('earned_rewards');
    table.jsonb('prevention_plan');
    table.jsonb('predicted_claims');
    table.timestamp('effective_date');
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('user_id');
    table.index('policy_id');
  });

  // ========================================
  // DRUG DISCOVERY
  // ========================================

  await knex.schema.createTable('drug_candidates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('candidate_id', 100).unique();
    table.string('name', 255);
    table.specificType('target_disease', 'text[]');
    table.string('mechanism', 500);
    table.string('stage', 50);
    table.string('molecular_structure', 500);
    table.string('target_protein', 255);
    table.decimal('binding_affinity', 10, 2);
    table.decimal('selectivity', 5, 2);
    table.decimal('druglikeness', 5, 2);
    table.decimal('efficacy_prediction', 5, 2);
    table.decimal('safety_score', 5, 2);
    table.jsonb('side_effect_profile');
    table.jsonb('pharmacokinetic_profile');
    table.jsonb('patient_response_predictors');
    table.jsonb('optimal_patient_profile');
    table.timestamp('estimated_approval_date');
    table.decimal('development_cost', 15, 2);
    table.decimal('success_probability', 5, 2);
    table.timestamps(true, true);

    table.index('candidate_id');
    table.index('stage');
  });

  await knex.schema.createTable('clinical_trials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('trial_id', 100).unique();
    table.string('nct_number', 50);
    table.uuid('drug_candidate_id').references('id').inTable('drug_candidates');
    table.string('phase', 10);
    table.string('status', 50);
    table.jsonb('trial_design');
    table.jsonb('endpoints');
    table.specificType('inclusion_criteria', 'text[]');
    table.specificType('exclusion_criteria', 'text[]');
    table.integer('target_enrollment');
    table.integer('current_enrollment');
    table.decimal('enrollment_rate', 5, 2);
    table.timestamp('predicted_completion_date');
    table.integer('eligible_patients');
    table.jsonb('milestones');
    table.jsonb('interim_results');
    table.decimal('success_probability', 5, 2);
    table.timestamps(true, true);

    table.index('trial_id');
    table.index('drug_candidate_id');
    table.index('status');
  });

  // ========================================
  // PANDEMIC WARNING SYSTEM
  // ========================================

  await knex.schema.createTable('pandemic_outbreaks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('outbreak_id', 100).unique();
    table.string('pathogen', 255);
    table.string('location', 255);
    table.integer('case_count');
    table.decimal('growth_rate', 5, 2);
    table.string('severity', 50);
    table.decimal('transmission_rate', 5, 2);
    table.decimal('mortality_rate', 5, 2);
    table.specificType('symptoms_profile', 'text[]');
    table.string('incubation_period', 50);
    table.specificType('detection_method', 'text[]');
    table.decimal('confidence_level', 5, 2);
    table.boolean('official_confirmation');
    table.integer('days_before_official');
    table.specificType('affected_areas', 'text[]');
    table.jsonb('spread_pattern');
    table.jsonb('predicted_spread');
    table.specificType('containment_measures', 'text[]');
    table.decimal('effectiveness', 5, 2);
    table.timestamp('first_detected').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('outbreak_id');
    table.index('location');
    table.index('first_detected');
  });

  await knex.schema.createTable('pandemic_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('alert_id', 100).unique();
    table.string('level', 50);
    table.string('title', 500);
    table.text('description');
    table.specificType('affected_areas', 'text[]');
    table.integer('population');
    table.timestamp('issued').defaultTo(knex.fn.now());
    table.timestamp('expires');
    table.specificType('recommendations', 'text[]');
    table.specificType('resources', 'text[]');
    table.timestamps(true, true);

    table.index('alert_id');
    table.index('level');
  });

  // ========================================
  // HEALTH EDUCATOR
  // ========================================

  await knex.schema.createTable('educational_courses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('course_id', 100).unique();
    table.string('title', 500);
    table.text('description');
    table.string('category', 100);
    table.string('level', 50);
    table.specificType('modules', 'text[]');
    table.string('total_duration', 50);
    table.specificType('language', 'text[]');
    table.jsonb('accessibility');
    table.specificType('learning_objectives', 'text[]');
    table.specificType('competencies', 'text[]');
    table.specificType('prerequisites', 'text[]');
    table.integer('enrollments').defaultTo(0);
    table.decimal('completion_rate', 5, 2);
    table.decimal('rating', 3, 2);
    table.boolean('certificate_available');
    table.decimal('certification_cost', 10, 2);
    table.integer('ceu_credits');
    table.timestamps(true, true);

    table.index('course_id');
    table.index('category');
    table.index('level');
  });

  await knex.schema.createTable('learner_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.string('name', 255);
    table.string('location', 255);
    table.string('role', 100);
    table.string('education_level', 100);
    table.integer('courses_completed').defaultTo(0);
    table.specificType('certifications_earned', 'text[]');
    table.jsonb('skills_acquired');
    table.integer('competency_level');
    table.integer('total_learning_hours').defaultTo(0);
    table.timestamp('last_active');
    table.integer('streak_days').defaultTo(0);
    table.integer('engagement_score');
    table.string('learning_style', 100);
    table.specificType('interests', 'text[]');
    table.specificType('career_goals', 'text[]');
    table.timestamps(true, true);

    table.index('user_id');
  });

  // ========================================
  // DATA MARKETPLACE
  // ========================================

  await knex.schema.createTable('dataset_listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('dataset_id', 100).unique();
    table.string('title', 500);
    table.text('description');
    table.specificType('category', 'text[]');
    table.specificType('data_type', 'text[]');
    table.bigInteger('record_count');
    table.timestamp('date_range_start');
    table.timestamp('date_range_end');
    table.string('update_frequency', 100);
    table.jsonb('data_quality');
    table.jsonb('demographics');
    table.string('deidentification_level', 100);
    table.integer('privacy_score');
    table.string('consent_type', 100);
    table.specificType('geographic_restrictions', 'text[]');
    table.decimal('base_price', 10, 2);
    table.string('pricing_model', 50);
    table.jsonb('volume_discounts');
    table.string('access_type', 50);
    table.boolean('sample_available');
    table.text('documentation');
    table.integer('views').defaultTo(0);
    table.integer('purchases').defaultTo(0);
    table.decimal('rating', 3, 2);
    table.timestamps(true, true);

    table.index('dataset_id');
    table.index(['category', 'data_type']);
  });

  await knex.schema.createTable('data_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('transaction_id', 100).unique();
    table.uuid('dataset_id').references('id').inTable('dataset_listings');
    table.uuid('buyer_id').references('id').inTable('users');
    table.uuid('provider_id').references('id').inTable('users');
    table.decimal('amount', 10, 2);
    table.decimal('provider_revenue', 10, 2);
    table.decimal('platform_fee', 10, 2);
    table.string('license_type', 100);
    table.string('duration', 50);
    table.specificType('usage_restrictions', 'text[]');
    table.boolean('consent_verified');
    table.boolean('privacy_audit');
    table.string('ethics_approval', 255);
    table.string('status', 50);
    table.timestamp('transaction_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index('transaction_id');
    table.index('dataset_id');
    table.index('buyer_id');
    table.index('provider_id');
  });

  // ========================================
  // AUDIT & COMPLIANCE
  // ========================================

  await knex.schema.createTable('feature_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id');
    table.string('feature_name', 100);
    table.string('action', 100);
    table.string('resource', 255);
    table.string('result', 50);
    table.string('ip_address', 50);
    table.jsonb('metadata');
    table.timestamp('timestamp').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('feature_name');
    table.index('timestamp');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('feature_audit_logs');
  await knex.schema.dropTableIfExists('data_transactions');
  await knex.schema.dropTableIfExists('dataset_listings');
  await knex.schema.dropTableIfExists('learner_profiles');
  await knex.schema.dropTableIfExists('educational_courses');
  await knex.schema.dropTableIfExists('pandemic_alerts');
  await knex.schema.dropTableIfExists('pandemic_outbreaks');
  await knex.schema.dropTableIfExists('clinical_trials');
  await knex.schema.dropTableIfExists('drug_candidates');
  await knex.schema.dropTableIfExists('predictive_insurance_profiles');
  await knex.schema.dropTableIfExists('federated_global_models');
  await knex.schema.dropTableIfExists('federated_network_nodes');
  await knex.schema.dropTableIfExists('providers');
  await knex.schema.dropTableIfExists('provider_performance_profiles');
  await knex.schema.dropTableIfExists('employers');
  await knex.schema.dropTableIfExists('employer_health_dashboards');
  await knex.schema.dropTableIfExists('longevity_interventions');
  await knex.schema.dropTableIfExists('longevity_profiles');
  await knex.schema.dropTableIfExists('microbiome_test_kits');
  await knex.schema.dropTableIfExists('multiomics_profiles');
  await knex.schema.dropTableIfExists('mental_health_interventions_tracking');
  await knex.schema.dropTableIfExists('mental_health_assessments');
  await knex.schema.dropTableIfExists('virtual_health_twins');
}
