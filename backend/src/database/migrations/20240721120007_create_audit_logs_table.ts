import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to users table (if applicable)
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    
    // Action details
    table.string('action').notNullable(); // 'create', 'read', 'update', 'delete', 'login', 'logout', etc.
    table.string('resource_type').notNullable(); // 'user', 'health_profile', 'vital_signs', etc.
    table.uuid('resource_id'); // ID of the affected resource
    
    // Data changes
    table.jsonb('old_values'); // Previous values for updates
    table.jsonb('new_values'); // New values for creates/updates
    
    // Request context
    table.string('ip_address');
    table.string('user_agent');
    table.string('session_id');
    
    // Operation result
    table.enum('result', ['success', 'failure', 'unauthorized', 'forbidden', 'not_found']);
    table.text('error_message');
    
    // Performance metrics
    table.integer('duration_ms'); // Request duration in milliseconds
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for efficient queries
    table.index(['user_id', 'created_at']);
    table.index(['action', 'resource_type', 'created_at']);
    table.index(['resource_type', 'resource_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}
