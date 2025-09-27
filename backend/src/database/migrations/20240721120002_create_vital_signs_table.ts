import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('vital_signs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to users table
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    
    // Vital sign measurements
    table.integer('heart_rate'); // BPM
    table.integer('systolic_bp'); // mmHg
    table.integer('diastolic_bp'); // mmHg
    table.decimal('temperature', 4, 2); // Celsius
    table.integer('respiratory_rate'); // breaths per minute
    table.decimal('oxygen_saturation', 4, 2); // percentage
    table.decimal('blood_glucose', 5, 2); // mg/dL
    
    // Metadata
    table.enum('measurement_source', ['manual', 'device', 'app']);
    table.string('device_id');
    table.text('notes');
    
    // Timestamps
    table.timestamp('measured_at').notNullable();
    table.timestamps(true, true);
    
    // Indexes for efficient time-series queries
    table.index(['user_id', 'measured_at']);
    table.index(['measured_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vital_signs');
}
