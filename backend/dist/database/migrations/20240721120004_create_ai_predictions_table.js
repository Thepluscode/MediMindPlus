"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('ai_predictions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        // Reference to users table
        table.uuid('user_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
            .notNullable();
        // Model information
        table.string('model_name').notNullable();
        table.string('model_version').notNullable();
        // Prediction results
        table.jsonb('disease_risks'); // Key-value pairs of disease names and risk scores
        table.decimal('overall_risk_score', 4, 3); // 0.000 to 1.000
        table.decimal('confidence_level', 4, 3); // 0.000 to 1.000
        // Analysis
        table.jsonb('risk_factors'); // Array of identified risk factors
        table.jsonb('feature_importance'); // Feature importance scores
        table.jsonb('input_data_summary'); // Summary of input data used
        // Metadata
        table.string('status').defaultTo('completed'); // 'processing', 'completed', 'failed'
        table.text('error_message'); // Error details if prediction failed
        // Timestamps
        table.timestamp('prediction_date').notNullable();
        table.timestamps(true, true);
        // Indexes for efficient queries
        table.index(['user_id', 'prediction_date']);
        table.index(['model_name', 'model_version']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('ai_predictions');
}
