import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to users table
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    
    // Notification content
    table.string('title').notNullable();
    table.text('message').notNullable();
    
    // Notification type and category
    table.enum('type', [
      'health_alert', 
      'reminder', 
      'recommendation', 
      'appointment', 
      'system', 
      'achievement',
      'intervention',
      'data_update',
      'security'
    ]).notNullable().defaultTo('system');
    
    // Priority and status
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_sent').defaultTo(false);
    
    // Action and routing
    table.jsonb('action_data'); // { type: 'navigate', route: '/interventions/123' }
    table.string('deep_link'); // For deep linking within the app
    
    // Scheduling and delivery
    table.timestamp('scheduled_for');
    table.timestamp('sent_at');
    table.timestamp('read_at');
    
    // Reference to related entity (optional)
    table.string('reference_type'); // e.g., 'intervention', 'appointment'
    table.uuid('reference_id');
    
    // Metadata
    table.jsonb('metadata'); // Additional data for the notification
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for efficient queries
    table.index(['user_id', 'is_read', 'created_at']);
    table.index(['scheduled_for', 'is_sent']);
    table.index(['reference_type', 'reference_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
