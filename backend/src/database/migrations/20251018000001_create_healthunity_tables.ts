import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Symptom assessments table for AI diagnostics
  await knex.schema.createTable('symptom_assessments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('symptoms').notNullable(); // JSON array of symptoms
    table.text('ai_assessment').nullable(); // AI-generated assessment
    table.string('urgency_level', 20).nullable(); // emergency, urgent, routine
    table.string('recommended_action', 100).nullable();
    table.uuid('consultation_id').nullable(); // If referred to consultation
    table.text('conversation_history').nullable(); // JSON of chatbot conversation
    table.timestamp('assessed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'assessed_at']);
    table.index(['urgency_level']);
  });

  // Epidemic tracking table
  await knex.schema.createTable('epidemic_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable(); // Nullable for anonymous reporting
    table.string('disease_category', 100).notNullable(); // AIDS, COVID, Mental Health, etc.
    table.text('symptoms').notNullable(); // JSON array
    table.string('location', 255).nullable(); // lat,lng or location string
    table.string('region', 100).nullable();
    table.string('country', 100).nullable();
    table.boolean('is_anonymous').defaultTo(true);
    table.string('severity', 20).nullable(); // mild, moderate, severe
    table.timestamp('symptom_onset').nullable();
    table.timestamp('reported_at').defaultTo(knex.fn.now());
    table.boolean('verified').defaultTo(false);
    table.text('metadata').nullable(); // JSON for additional data
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['disease_category', 'reported_at']);
    table.index(['region', 'country']);
    table.index(['reported_at']);
  });

  // Mental health tracking table
  await knex.schema.createTable('mental_health_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('mood_score').nullable(); // 1-10 scale
    table.integer('anxiety_level').nullable(); // 1-10 scale
    table.integer('stress_level').nullable(); // 1-10 scale
    table.integer('depression_score').nullable(); // PHQ-9 score
    table.text('activities').nullable(); // JSON array of activities
    table.decimal('sleep_hours', 4, 2).nullable();
    table.integer('sleep_quality').nullable(); // 1-10 scale
    table.text('journal_entry').nullable();
    table.text('ai_insights').nullable(); // AI-generated insights
    table.boolean('crisis_flag').defaultTo(false);
    table.timestamp('tracked_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'tracked_at']);
    table.index(['crisis_flag']);
  });

  // Community alerts table
  await knex.schema.createTable('community_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('alert_type', 50).notNullable(); // epidemic_outbreak, mental_health_crisis, etc.
    table.string('disease_category', 100).nullable();
    table.string('severity', 20).notNullable(); // low, medium, high, critical
    table.string('region', 100).notNullable();
    table.string('country', 100).notNullable();
    table.text('title').notNullable();
    table.text('description').notNullable();
    table.text('recommended_actions').nullable(); // JSON array
    table.text('resources').nullable(); // JSON array of resources
    table.integer('affected_count').defaultTo(0);
    table.timestamp('alert_start').defaultTo(knex.fn.now());
    table.timestamp('alert_end').nullable();
    table.string('status', 20).defaultTo('active'); // active, resolved, expired
    table.uuid('created_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['region', 'country', 'status']);
    table.index(['alert_type', 'severity']);
    table.index(['status', 'alert_start']);
  });

  // Community forums table
  await knex.schema.createTable('community_forums', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.string('category', 100).notNullable(); // support, education, discussion
    table.string('topic', 100).nullable(); // AIDS, mental_health, refugee_support, etc.
    table.string('language', 10).defaultTo('en');
    table.boolean('is_moderated').defaultTo(true);
    table.boolean('is_public').defaultTo(true);
    table.integer('member_count').defaultTo(0);
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['category', 'topic']);
    table.index(['language']);
  });

  // Forum posts table
  await knex.schema.createTable('forum_posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('forum_id').notNullable().references('id').inTable('community_forums').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('parent_post_id').nullable().references('id').inTable('forum_posts').onDelete('CASCADE');
    table.text('title').nullable();
    table.text('content').notNullable();
    table.boolean('is_anonymous').defaultTo(false);
    table.integer('upvotes').defaultTo(0);
    table.integer('downvotes').defaultTo(0);
    table.boolean('is_pinned').defaultTo(false);
    table.boolean('is_locked').defaultTo(false);
    table.boolean('is_flagged').defaultTo(false);
    table.string('moderation_status', 20).defaultTo('approved'); // pending, approved, rejected
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['forum_id', 'created_at']);
    table.index(['user_id']);
    table.index(['parent_post_id']);
  });

  // Medical ID table (for emergencies and refugee scenarios)
  await knex.schema.createTable('medical_ids', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('global_id').notNullable().unique(); // Blockchain-based global ID
    table.text('emergency_contacts').notNullable(); // JSON array
    table.string('blood_type').nullable();
    table.text('allergies').nullable(); // JSON array
    table.text('chronic_conditions').nullable(); // JSON array
    table.text('current_medications').nullable(); // JSON array
    table.text('immunizations').nullable(); // JSON array
    table.text('emergency_notes').nullable();
    table.string('organ_donor', 20).nullable(); // yes, no, unspecified
    table.text('advance_directives').nullable();
    table.string('qr_code_url').nullable();
    table.string('blockchain_hash').nullable(); // For tamper-proofing
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['global_id']);
  });

  // Multilingual content table
  await knex.schema.createTable('multilingual_content', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('content_type', 50).notNullable(); // article, alert, resource, ui_text
    table.string('content_key', 200).notNullable(); // Unique identifier for the content
    table.string('language', 10).notNullable();
    table.text('title').nullable();
    table.text('content').notNullable();
    table.text('metadata').nullable(); // JSON for additional data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['content_key', 'language']);
    table.index(['content_type', 'language']);
  });

  // Enhanced telemedicine sessions (extends existing consultations)
  await knex.schema.createTable('telemedicine_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('consultation_id').notNullable(); // Links to existing consultation
    table.string('session_type', 30).notNullable(); // video, audio, multi-party
    table.text('participants').notNullable(); // JSON array of participant IDs
    table.string('primary_language', 10).notNullable();
    table.text('interpreter_languages').nullable(); // JSON array
    table.boolean('ai_transcription_enabled').defaultTo(true);
    table.text('transcription_text').nullable();
    table.text('ai_summary').nullable();
    table.string('webrtc_session_id').nullable();
    table.text('webrtc_config').nullable(); // JSON
    table.text('recording_urls').nullable(); // JSON array
    table.boolean('is_recording').defaultTo(false);
    table.integer('quality_rating').nullable(); // 1-5 stars
    table.text('technical_issues').nullable(); // JSON array
    table.timestamp('started_at').nullable();
    table.timestamp('ended_at').nullable();
    table.integer('duration_seconds').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['consultation_id']);
    table.index(['started_at']);
  });

  // Patient education resources
  await knex.schema.createTable('education_resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 300).notNullable();
    table.string('category', 100).notNullable(); // prevention, treatment, awareness
    table.string('topic', 100).notNullable(); // AIDS, mental_health, general_wellness
    table.string('resource_type', 50).notNullable(); // article, video, interactive, pdf
    table.text('content').nullable();
    table.string('url').nullable();
    table.text('thumbnail_url').nullable();
    table.text('languages').notNullable(); // JSON array of supported languages
    table.string('difficulty_level', 20).nullable(); // basic, intermediate, advanced
    table.text('tags').nullable(); // JSON array
    table.boolean('is_verified').defaultTo(false);
    table.uuid('verified_by').nullable();
    table.integer('view_count').defaultTo(0);
    table.decimal('average_rating', 3, 2).nullable();
    table.timestamp('published_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['category', 'topic']);
    table.index(['resource_type']);
    table.index(['published_at']);
  });

  // User resource interactions
  await knex.schema.createTable('resource_interactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('resource_id').notNullable().references('id').inTable('education_resources').onDelete('CASCADE');
    table.string('interaction_type', 30).notNullable(); // view, complete, bookmark, rate
    table.integer('rating').nullable(); // 1-5 stars
    table.integer('progress_percentage').nullable();
    table.integer('time_spent_seconds').nullable();
    table.timestamp('interacted_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'resource_id']);
    table.index(['resource_id', 'interaction_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('resource_interactions');
  await knex.schema.dropTableIfExists('education_resources');
  await knex.schema.dropTableIfExists('telemedicine_sessions');
  await knex.schema.dropTableIfExists('multilingual_content');
  await knex.schema.dropTableIfExists('medical_ids');
  await knex.schema.dropTableIfExists('forum_posts');
  await knex.schema.dropTableIfExists('community_forums');
  await knex.schema.dropTableIfExists('community_alerts');
  await knex.schema.dropTableIfExists('mental_health_tracking');
  await knex.schema.dropTableIfExists('epidemic_tracking');
  await knex.schema.dropTableIfExists('symptom_assessments');
}
