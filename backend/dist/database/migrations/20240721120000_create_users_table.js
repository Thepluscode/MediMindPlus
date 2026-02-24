"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.date('date_of_birth');
        table.enum('gender', ['male', 'female', 'other']);
        table.string('phone_number');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_email_verified').defaultTo(false);
        table.string('verification_token');
        table.string('password_reset_token');
        table.timestamp('password_reset_expires');
        table.timestamp('last_login');
        table.timestamps(true, true);
        // Add indexes for frequently queried fields
        table.index(['email']);
        table.index(['is_active']);
        table.index(['is_email_verified']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('users');
}
