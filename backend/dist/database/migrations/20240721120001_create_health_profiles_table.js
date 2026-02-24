"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('health_profiles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        // Reference to users table
        table.uuid('user_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
            .notNullable();
        // Health metrics
        table.decimal('height', 5, 2); // in cm
        table.decimal('weight', 5, 2); // in kg
        table.decimal('bmi', 4, 2);
        table.string('blood_type');
        // Medical information
        table.jsonb('medical_conditions'); // Array of medical conditions
        table.jsonb('medications'); // Array of current medications
        table.jsonb('allergies'); // Array of allergies
        table.jsonb('family_history'); // Family medical history
        // Emergency contact
        table.string('emergency_contact_name');
        table.string('emergency_contact_phone');
        // Timestamps
        table.timestamps(true, true);
        // Indexes
        table.index(['user_id']);
        table.unique(['user_id']); // One-to-one relationship with users
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('health_profiles');
}
