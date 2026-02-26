import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_models_registry', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('model_name', 255).notNullable().unique();
    table.string('model_type', 100).notNullable();
    table.string('version', 50).notNullable().defaultTo('1.0.0');
    table.text('description').nullable();
    table.string('status', 50).notNullable().defaultTo('active');
    table.float('accuracy').nullable();
    table.jsonb('input_schema').nullable();
    table.jsonb('output_schema').nullable();
    table.string('training_data_hash', 255).nullable();
    table.string('model_file_path', 500).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_models_registry');
}
