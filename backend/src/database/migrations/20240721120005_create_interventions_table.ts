import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('interventions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to users table
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    
    // Reference to AI predictions (nullable)
    table.uuid('prediction_id')
      .references('id')
      .inTable('ai_predictions')
      .onDelete('SET NULL');
    
    // Intervention details
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.enum('type', ['lifestyle', 'medical', 'monitoring', 'therapeutic', 'preventive']).notNullable();
    table.string('category'); // e.g., 'diet', 'exercise', 'medication'
    
    // Status and priority
    table.enum('status', [
      'pending', 
      'in_progress', 
      'completed', 
      'dismissed',
      'snoozed',
      'failed'
    ]).defaultTo('pending');
    
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    
    // Time tracking
    table.timestamp('start_date');
    table.timestamp('target_date');
    table.timestamp('completed_at');
    
    // Progress tracking
    table.jsonb('progress_metrics'); // Key-value pairs of metrics
    table.integer('progress_percent').defaultTo(0);
    
    // Additional metadata
    table.string('assigned_to'); // Could be a user ID or role
    table.jsonb('attachments'); // References to files or resources
    
    // User and provider notes
    table.text('user_notes');
    table.text('provider_notes');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for efficient queries
    table.index(['user_id', 'status', 'priority']);
    table.index(['prediction_id']);
    table.index(['target_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('interventions');
}
