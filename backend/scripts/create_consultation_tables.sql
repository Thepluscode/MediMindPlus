-- Create consultation tables
-- This script creates all tables needed for video consultations

-- 1. Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Professional info
    license_number VARCHAR(255) NOT NULL,
    license_state VARCHAR(255) NOT NULL,
    license_expiry DATE NOT NULL,
    npi_number VARCHAR(255),
    dea_number VARCHAR(255),

    -- Specializations
    specialty VARCHAR(255) NOT NULL CHECK (specialty IN (
        'PRIMARY_CARE', 'CARDIOLOGY', 'ENDOCRINOLOGY', 'PSYCHIATRY',
        'DERMATOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'PEDIATRICS',
        'OBSTETRICS', 'EMERGENCY_MEDICINE', 'INTERNAL_MEDICINE',
        'FAMILY_MEDICINE', 'OTHER'
    )),

    subspecialties JSONB,
    years_experience INTEGER NOT NULL,

    -- Availability
    accepting_patients BOOLEAN DEFAULT TRUE,
    availability_schedule JSONB,
    consultation_fee INTEGER,
    consultation_duration_minutes INTEGER DEFAULT 30,

    -- Ratings
    rating DECIMAL(3,2) DEFAULT 0,
    total_consultations INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- Bio
    bio TEXT,
    profile_image_url VARCHAR(255),
    languages JSONB,

    -- Insurance
    accepted_insurance JSONB,

    -- Status
    status VARCHAR(255) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    verification_status VARCHAR(255) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_specialty_accepting_status
    ON providers(specialty, accepting_patients, status);
CREATE INDEX IF NOT EXISTS idx_providers_verification_status
    ON providers(verification_status);

-- 2. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    -- Scheduling
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Status
    status VARCHAR(255) DEFAULT 'SCHEDULED' NOT NULL CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),

    cancellation_reason TEXT,
    cancelled_by VARCHAR(255) CHECK (cancelled_by IN ('PATIENT', 'PROVIDER', 'SYSTEM')),

    -- Type
    consultation_type VARCHAR(255) NOT NULL CHECK (consultation_type IN (
        'ROUTINE_CHECKUP', 'FOLLOW_UP', 'URGENT_CARE', 'MENTAL_HEALTH',
        'PRESCRIPTION_REFILL', 'SECOND_OPINION', 'OTHER'
    )),

    -- Reason and notes
    reason_for_visit TEXT NOT NULL,
    patient_notes TEXT,
    provider_notes TEXT,
    diagnosis_codes JSONB,
    treatment_plan JSONB,

    -- Video session
    twilio_room_sid VARCHAR(255) UNIQUE,
    twilio_room_name VARCHAR(255) UNIQUE,
    video_started_at TIMESTAMPTZ,
    video_ended_at TIMESTAMPTZ,
    video_duration_seconds INTEGER,

    -- Vitals during consultation
    vitals_snapshot JSONB,
    vitals_shared BOOLEAN DEFAULT FALSE,

    -- Payment
    amount_charged INTEGER,
    payment_status VARCHAR(255) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    payment_intent_id VARCHAR(255),

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    follow_up_consultation_id UUID REFERENCES consultations(id),

    -- Prescription
    prescription_issued BOOLEAN DEFAULT FALSE,

    -- Recording & consent
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_consent BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient_scheduled
    ON consultations(patient_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_consultations_provider_scheduled
    ON consultations(provider_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_consultations_status_scheduled
    ON consultations(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_start
    ON consultations(scheduled_start);

-- 3. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    -- Medication details
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(255) NOT NULL,
    form VARCHAR(255) NOT NULL,
    route VARCHAR(255) NOT NULL,

    -- Instructions
    frequency VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    refills_allowed INTEGER DEFAULT 0,
    refills_remaining INTEGER,

    -- Duration
    duration_days INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,

    -- Pharmacy
    pharmacy_name VARCHAR(255),
    pharmacy_phone VARCHAR(255),
    pharmacy_address TEXT,

    -- Status
    status VARCHAR(255) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SENT_TO_PHARMACY', 'READY_FOR_PICKUP', 'DISPENSED', 'CANCELLED'
    )),

    -- E-prescription
    erx_id VARCHAR(255),
    sent_to_pharmacy_at TIMESTAMPTZ,

    -- Safety
    warnings JSONB,
    requires_monitoring BOOLEAN DEFAULT FALSE,
    monitoring_instructions TEXT,

    -- Regulatory
    controlled_substance BOOLEAN DEFAULT FALSE,
    dea_schedule VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status
    ON prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation
    ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status
    ON prescriptions(status);

-- 4. Provider Availability Table
CREATE TABLE IF NOT EXISTS provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    day_of_week VARCHAR(255) NOT NULL CHECK (day_of_week IN (
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
    )),

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,

    -- Specific date overrides
    specific_date DATE,
    is_recurring BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_day
    ON provider_availability(provider_id, day_of_week, is_available);

-- 5. Consultation Reviews Table
CREATE TABLE IF NOT EXISTS consultation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    consultation_id UUID NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    -- Ratings (1-5 stars)
    overall_rating INTEGER NOT NULL,
    communication_rating INTEGER,
    professionalism_rating INTEGER,
    care_quality_rating INTEGER,
    wait_time_rating INTEGER,

    -- Review
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT TRUE,

    -- Response
    provider_response TEXT,
    provider_responded_at TIMESTAMPTZ,

    -- Moderation
    is_verified BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_reviews_provider_visible
    ON consultation_reviews(provider_id, is_visible);

-- 6. Consultation Messages Table
CREATE TABLE IF NOT EXISTS consultation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(255) NOT NULL CHECK (sender_type IN ('PATIENT', 'PROVIDER')),

    message TEXT NOT NULL,
    attachments JSONB,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation_created
    ON consultation_messages(consultation_id, created_at);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Consultation tables created successfully!';
END $$;
