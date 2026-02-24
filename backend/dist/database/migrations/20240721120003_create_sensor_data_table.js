"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('sensor_data', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        // Reference to users table
        table.uuid('user_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
            .notNullable();
        // Sensor type and data
        table.enum('sensor_type', [
            'accelerometer',
            'gyroscope',
            'magnetometer',
            'voice',
            'gait',
            'sleep',
            'activity',
            'heart_rate',
            'blood_pressure',
            'temperature',
            'oxygen',
            'ecg',
            'other'
        ]).notNullable();
        // Raw and processed data
        table.jsonb('data'); // Raw sensor data
        table.jsonb('processed_features'); // Extracted features
        // Metadata
        table.decimal('sampling_rate', 10, 4); // Hz
        table.integer('duration_ms'); // milliseconds
        table.string('device_model');
        table.string('os_version');
        table.string('app_version');
        table.string('session_id'); // Group related sensor data
        // Timestamps
        table.timestamp('recorded_at').notNullable();
        table.timestamps(true, true);
        // Indexes for efficient time-series queries
        table.index(['user_id', 'sensor_type', 'recorded_at']);
        table.index(['session_id']);
        table.index(['recorded_at']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('sensor_data');
}
