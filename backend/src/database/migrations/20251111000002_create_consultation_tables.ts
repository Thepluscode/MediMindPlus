import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Providers table
  await knex.schema.createTable('providers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable()
      .unique();

    // Professional info
    table.string('license_number').notNullable();
    table.string('license_state').notNullable();
    table.date('license_expiry').notNullable();
    table.string('npi_number'); // National Provider Identifier
    table.string('dea_number'); // For prescriptions

    // Specializations
    table.enum('specialty', [
      'PRIMARY_CARE',
      'CARDIOLOGY',
      'ENDOCRINOLOGY',
      'PSYCHIATRY',
      'DERMATOLOGY',
      'NEUROLOGY',
      'ORTHOPEDICS',
      'PEDIATRICS',
      'OBSTETRICS',
      'EMERGENCY_MEDICINE',
      'INTERNAL_MEDICINE',
      'FAMILY_MEDICINE',
      'OTHER'
    ]).notNullable();

    table.jsonb('subspecialties'); // Additional specializations
    table.integer('years_experience').notNullable();

    // Availability
    table.boolean('accepting_patients').defaultTo(true);
    table.jsonb('availability_schedule'); // Weekly schedule
    table.integer('consultation_fee'); // In cents
    table.integer('consultation_duration_minutes').defaultTo(30);

    // Ratings
    table.decimal('rating', 3, 2).defaultTo(0); // 0.00 to 5.00
    table.integer('total_consultations').defaultTo(0);
    table.integer('total_reviews').defaultTo(0);

    // Bio
    table.text('bio');
    table.string('profile_image_url');
    table.jsonb('languages'); // ['English', 'Spanish', etc.]

    // Insurance
    table.jsonb('accepted_insurance'); // Insurance providers

    // Status
    table.enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED']).defaultTo('ACTIVE');
    table.enum('verification_status', ['PENDING', 'VERIFIED', 'REJECTED']).defaultTo('PENDING');

    table.timestamps(true, true);

    table.index(['specialty', 'accepting_patients', 'status']);
    table.index('verification_status');
  });

  // Consultations/Appointments table
  await knex.schema.createTable('consultations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Participants
    table.uuid('patient_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();

    table.uuid('provider_id')
      .references('id')
      .inTable('providers')
      .onDelete('CASCADE')
      .notNullable();

    // Scheduling
    table.timestamp('scheduled_start').notNullable();
    table.timestamp('scheduled_end').notNullable();
    table.timestamp('actual_start');
    table.timestamp('actual_end');

    // Status
    table.enum('status', [
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW'
    ]).defaultTo('SCHEDULED').notNullable();

    table.string('cancellation_reason');
    table.enum('cancelled_by', ['PATIENT', 'PROVIDER', 'SYSTEM']);

    // Type
    table.enum('consultation_type', [
      'ROUTINE_CHECKUP',
      'FOLLOW_UP',
      'URGENT_CARE',
      'MENTAL_HEALTH',
      'PRESCRIPTION_REFILL',
      'SECOND_OPINION',
      'OTHER'
    ]).notNullable();

    // Reason and notes
    table.text('reason_for_visit').notNullable();
    table.text('patient_notes');
    table.text('provider_notes');
    table.jsonb('diagnosis_codes'); // ICD-10 codes
    table.jsonb('treatment_plan');

    // Video session
    table.string('twilio_room_sid').unique();
    table.string('twilio_room_name').unique();
    table.timestamp('video_started_at');
    table.timestamp('video_ended_at');
    table.integer('video_duration_seconds');

    // Vitals during consultation
    table.jsonb('vitals_snapshot'); // Vitals at time of consultation
    table.boolean('vitals_shared').defaultTo(false);

    // Payment
    table.integer('amount_charged'); // In cents
    table.enum('payment_status', ['PENDING', 'PAID', 'REFUNDED', 'FAILED']).defaultTo('PENDING');
    table.string('payment_intent_id'); // Stripe payment intent

    // Follow-up
    table.boolean('follow_up_required').defaultTo(false);
    table.timestamp('follow_up_date');
    table.uuid('follow_up_consultation_id').references('id').inTable('consultations');

    // Prescription
    table.boolean('prescription_issued').defaultTo(false);

    // Recording & consent
    table.boolean('recording_enabled').defaultTo(false);
    table.boolean('recording_consent').defaultTo(false);
    table.string('recording_url');

    table.timestamps(true, true);

    // Indexes
    table.index(['patient_id', 'scheduled_start']);
    table.index(['provider_id', 'scheduled_start']);
    table.index(['status', 'scheduled_start']);
    table.index('scheduled_start');
  });

  // Prescriptions table
  await knex.schema.createTable('prescriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('consultation_id')
      .references('id')
      .inTable('consultations')
      .onDelete('CASCADE')
      .notNullable();

    table.uuid('patient_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();

    table.uuid('provider_id')
      .references('id')
      .inTable('providers')
      .onDelete('CASCADE')
      .notNullable();

    // Medication details
    table.string('medication_name').notNullable();
    table.string('generic_name');
    table.string('dosage').notNullable(); // e.g., "10mg"
    table.string('form').notNullable(); // e.g., "tablet", "capsule"
    table.string('route').notNullable(); // e.g., "oral", "topical"

    // Instructions
    table.string('frequency').notNullable(); // e.g., "twice daily"
    table.text('instructions').notNullable(); // Detailed instructions
    table.integer('quantity').notNullable();
    table.integer('refills_allowed').defaultTo(0);
    table.integer('refills_remaining');

    // Duration
    table.integer('duration_days'); // Treatment duration
    table.date('start_date').notNullable();
    table.date('end_date');

    // Pharmacy
    table.string('pharmacy_name');
    table.string('pharmacy_phone');
    table.string('pharmacy_address');

    // Status
    table.enum('status', [
      'PENDING',
      'SENT_TO_PHARMACY',
      'READY_FOR_PICKUP',
      'DISPENSED',
      'CANCELLED'
    ]).defaultTo('PENDING');

    // E-prescription
    table.string('erx_id'); // Electronic prescription ID
    table.timestamp('sent_to_pharmacy_at');

    // Safety
    table.jsonb('warnings'); // Drug interactions, allergies
    table.boolean('requires_monitoring').defaultTo(false);
    table.text('monitoring_instructions');

    // Regulatory
    table.boolean('controlled_substance').defaultTo(false);
    table.string('dea_schedule'); // Schedule II-V

    table.timestamps(true, true);

    table.index(['patient_id', 'status']);
    table.index(['consultation_id']);
    table.index('status');
  });

  // Provider availability slots
  await knex.schema.createTable('provider_availability', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('provider_id')
      .references('id')
      .inTable('providers')
      .onDelete('CASCADE')
      .notNullable();

    table.enum('day_of_week', [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY'
    ]).notNullable();

    table.time('start_time').notNullable();
    table.time('end_time').notNullable();

    table.boolean('is_available').defaultTo(true);

    // Specific date overrides
    table.date('specific_date'); // For one-time changes
    table.boolean('is_recurring').defaultTo(true);

    table.timestamps(true, true);

    table.index(['provider_id', 'day_of_week', 'is_available']);
  });

  // Consultation reviews
  await knex.schema.createTable('consultation_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('consultation_id')
      .references('id')
      .inTable('consultations')
      .onDelete('CASCADE')
      .notNullable()
      .unique();

    table.uuid('patient_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();

    table.uuid('provider_id')
      .references('id')
      .inTable('providers')
      .onDelete('CASCADE')
      .notNullable();

    // Ratings (1-5 stars)
    table.integer('overall_rating').notNullable();
    table.integer('communication_rating');
    table.integer('professionalism_rating');
    table.integer('care_quality_rating');
    table.integer('wait_time_rating');

    // Review
    table.text('review_text');
    table.boolean('would_recommend').defaultTo(true);

    // Response
    table.text('provider_response');
    table.timestamp('provider_responded_at');

    // Moderation
    table.boolean('is_verified').defaultTo(true);
    table.boolean('is_visible').defaultTo(true);

    table.timestamps(true, true);

    table.index(['provider_id', 'is_visible']);
  });

  // Consultation chat messages (for pre/post consultation messaging)
  await knex.schema.createTable('consultation_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('consultation_id')
      .references('id')
      .inTable('consultations')
      .onDelete('CASCADE')
      .notNullable();

    table.uuid('sender_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();

    table.enum('sender_type', ['PATIENT', 'PROVIDER']).notNullable();

    table.text('message').notNullable();
    table.jsonb('attachments'); // Images, files

    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');

    table.timestamps(true, true);

    table.index(['consultation_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('consultation_messages');
  await knex.schema.dropTableIfExists('consultation_reviews');
  await knex.schema.dropTableIfExists('provider_availability');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('consultations');
  await knex.schema.dropTableIfExists('providers');
}
