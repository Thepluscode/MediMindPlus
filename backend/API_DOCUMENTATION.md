# MediMindPlus Backend API Documentation

## Overview

This document provides comprehensive API documentation for the MediMindPlus backend services, a HIPAA-compliant healthcare AI platform.

**Base URL**: `http://localhost:3000/api` (development)
**Production URL**: `https://api.medimindplus.ai/api`

**Authentication**: All protected endpoints require a Bearer token in the Authorization header.

```
Authorization: Bearer <JWT_TOKEN>
```

**Last Updated**: February 7, 2026
**API Version**: v1

---

## Table of Contents

1. [Authentication](#authentication)
2. [Patient Onboarding](#patient-onboarding)
3. [Provider Portal](#provider-portal)
4. [Consultations & Video](#consultations--video)
5. [Payments](#payments)
6. [Health Risk Assessment](#health-risk-assessment)
7. [Wearable Device Data](#wearable-device-data)
8. [Health Alerts](#health-alerts)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [HIPAA Compliance](#hipaa-compliance)

---

## Authentication

### Register

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-15",
  "phone_number": "+1234567890",
  "role": "patient"
}
```

**Roles**: `patient`, `provider`, `admin`

**Response**: `201 Created`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient",
    "is_active": true,
    "created_at": "2026-02-07T12:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

**Validation Rules**:
- Email must be valid and unique
- Password minimum 8 characters, must include uppercase, lowercase, number, special character
- Phone number must be valid E.164 format

---

### Login

Authenticate and receive access tokens.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!"
}
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

**Security Features**:
- Rate limited to 5 attempts per 15 minutes per IP
- Account locked after 5 failed attempts
- All login attempts are audit logged

---

### Refresh Token

Get a new access token using a refresh token.

**Endpoint**: `POST /api/auth/refresh-token`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Token Expiry**:
- Access token: 15 minutes
- Refresh token: 7 days
- Session timeout: 15 minutes of inactivity

---

## Patient Onboarding

All onboarding endpoints require authentication (patient role).

### Get Onboarding Status

Get the current onboarding progress.

**Endpoint**: `GET /api/onboarding/status`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "exists": true,
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "current_step": 3,
    "is_completed": false,
    "profile_data": {},
    "consent_data": {},
    "medical_records_data": {},
    "devices_data": {},
    "goals_data": {},
    "started_at": "2026-02-07T10:00:00Z",
    "created_at": "2026-02-07T10:00:00Z",
    "updated_at": "2026-02-07T12:00:00Z"
  }
}
```

---

### Start Onboarding

Start or resume the onboarding process.

**Endpoint**: `POST /api/onboarding/start`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "current_step": 0,
    "is_completed": false,
    "started_at": "2026-02-07T12:00:00Z"
  }
}
```

---

### Update Step

Update the current onboarding step.

**Endpoint**: `PUT /api/onboarding/step`

**Request Body**:
```json
{
  "step": 3
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "current_step": 3,
    "updated_at": "2026-02-07T12:05:00Z"
  }
}
```

---

### Save Profile Data

Save user health profile information.

**Endpoint**: `PUT /api/onboarding/profile`

**Request Body**:
```json
{
  "name": "John Doe",
  "age": "38",
  "gender": "male",
  "height": 180,
  "weight": 75,
  "medical_history": ["Hypertension", "Type 2 Diabetes"],
  "medications": ["Metformin 500mg", "Lisinopril 10mg"],
  "allergies": ["Penicillin"],
  "family_history": ["Heart Disease (Father)", "Diabetes (Mother)"]
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "profile_data": {
      "name": "John Doe",
      "age": "38",
      "gender": "male",
      "height": 180,
      "weight": 75
    },
    "updated_at": "2026-02-07T12:10:00Z"
  }
}
```

---

### Save Consent Data

Record user consent for data processing (HIPAA requirement).

**Endpoint**: `POST /api/onboarding/consent`

**Request Body**:
```json
{
  "data_processing": true,
  "data_sharing": false,
  "research_participation": true,
  "marketing": false,
  "consent_version": "1.0.0"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "consent_type": "data_processing",
      "consent_given": true,
      "consent_version": "1.0.0",
      "ip_address": "192.168.1.1",
      "consented_at": "2026-02-07T12:15:00Z"
    }
  ]
}
```

---

### Connect Medical Record

Connect to a medical record provider (Epic, Cerner, etc.).

**Endpoint**: `POST /api/onboarding/medical-records`

**Request Body**:
```json
{
  "provider_name": "Epic MyChart",
  "provider_type": "EMR",
  "connection_metadata": {
    "patient_id": "12345",
    "oauth_token": "encrypted_token"
  }
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "provider_name": "Epic MyChart",
    "provider_type": "EMR",
    "connection_status": "pending",
    "created_at": "2026-02-07T12:20:00Z"
  }
}
```

---

### Get Medical Records

Get all connected medical record providers.

**Endpoint**: `GET /api/onboarding/medical-records`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "provider_name": "Epic MyChart",
      "provider_type": "EMR",
      "connection_status": "active",
      "last_sync_at": "2026-02-07T11:00:00Z",
      "connected_at": "2026-02-07T10:00:00Z"
    }
  ]
}
```

---

### Connect Device

Connect a wearable or health device.

**Endpoint**: `POST /api/onboarding/devices`

**Request Body**:
```json
{
  "device_name": "Apple Watch Series 8",
  "device_type": "FITNESS_TRACKER",
  "device_id": "apple_watch_abc123",
  "device_metadata": {
    "model": "Series 8",
    "firmware": "10.0.1"
  },
  "metrics_tracked": ["heart_rate", "steps", "sleep", "blood_oxygen"]
}
```

**Supported Device Types**:
- `FITNESS_TRACKER` - Apple Watch, Fitbit, Garmin
- `BLOOD_PRESSURE_MONITOR` - Omron, Withings
- `GLUCOSE_MONITOR` - Dexcom, FreeStyle Libre
- `PULSE_OXIMETER` - Fingertip pulse ox devices
- `SMART_SCALE` - Withings, QardioBase

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "device_name": "Apple Watch Series 8",
    "device_type": "FITNESS_TRACKER",
    "device_id": "apple_watch_abc123",
    "connection_status": "active",
    "connected_at": "2026-02-07T12:25:00Z"
  }
}
```

---

### Get Connected Devices

Get all connected devices.

**Endpoint**: `GET /api/onboarding/devices`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "device_name": "Apple Watch Series 8",
      "device_type": "FITNESS_TRACKER",
      "connection_status": "active",
      "metrics_tracked": ["heart_rate", "steps", "sleep"],
      "last_data_received_at": "2026-02-07T12:00:00Z"
    }
  ]
}
```

---

### Disconnect Device

Disconnect a device.

**Endpoint**: `DELETE /api/onboarding/devices/:deviceId`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Device disconnected successfully"
}
```

---

### Add Health Goal

Add a health goal.

**Endpoint**: `POST /api/onboarding/goals`

**Request Body**:
```json
{
  "goal_category": "Prevention",
  "goal_name": "Reduce heart disease risk",
  "goal_description": "Lower cholesterol and improve cardiovascular health",
  "target_metrics": {
    "ldl_cholesterol": "< 100 mg/dL",
    "blood_pressure": "< 120/80"
  },
  "target_date": "2027-02-07"
}
```

**Goal Categories**: `Prevention`, `Management`, `Lifestyle`, `Weight`, `Fitness`, `Mental Health`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "goal_category": "Prevention",
    "goal_name": "Reduce heart disease risk",
    "status": "active",
    "progress_percentage": 0,
    "created_at": "2026-02-07T12:30:00Z"
  }
}
```

---

### Get Health Goals

Get all health goals.

**Endpoint**: `GET /api/onboarding/goals`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "goal_category": "Prevention",
      "goal_name": "Reduce heart disease risk",
      "status": "active",
      "progress_percentage": 25,
      "target_date": "2027-02-07"
    }
  ]
}
```

---

### Complete Onboarding

Mark onboarding as complete.

**Endpoint**: `POST /api/onboarding/complete`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "is_completed": true,
    "completed_at": "2026-02-07T12:35:00Z"
  },
  "message": "Onboarding completed successfully! Your AI health companion is now processing your data."
}
```

---

## Provider Portal

All provider endpoints require authentication with `provider` or `admin` role.

### Get Provider Stats

Get dashboard statistics.

**Endpoint**: `GET /api/provider/stats`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "total_patients": 247,
    "active_patients": 189,
    "high_risk_alerts": 12,
    "pending_reviews": 8,
    "avg_engagement": 78,
    "predictions_this_week": 145
  }
}
```

---

### Get Patients

Get all assigned patients with pagination.

**Endpoint**: `GET /api/provider/patients`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search term
- `risk_level` (optional): Filter by risk level (`critical`, `high`, `moderate`, `low`)

**Example**: `GET /api/provider/patients?page=1&limit=20&risk_level=high`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "patient@example.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "date_of_birth": "1965-03-12",
      "risk_score": 92,
      "risk_level": "critical",
      "risk_category": "Cardiovascular",
      "assigned_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 247,
    "pages": 13
  }
}
```

---

### Get High-Risk Patients

Get patients with critical or high risk levels.

**Endpoint**: `GET /api/provider/patients/high-risk`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "date_of_birth": "1965-03-12",
      "risk_score": 92,
      "risk_level": "critical",
      "risk_category": "Cardiovascular",
      "predicted_event": "MI risk",
      "timeframe": "6-12 months",
      "key_factors": ["LDL 187 mg/dL", "BP 158/96", "Family history"],
      "recommended_actions": ["Statin therapy", "BP medication adjustment"]
    }
  ]
}
```

---

### Get Patient Details

Get detailed patient information.

**Endpoint**: `GET /api/provider/patients/:patientId`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "date_of_birth": "1965-03-12",
    "phone_number": "+1234567890",
    "medical_history": ["Hypertension", "High Cholesterol"],
    "current_medications": ["Lisinopril 10mg", "Atorvastatin 20mg"],
    "allergies": ["Penicillin"],
    "recent_vitals": [
      {
        "heart_rate": 82,
        "blood_pressure_systolic": 158,
        "blood_pressure_diastolic": 96,
        "timestamp": "2026-02-07T08:00:00Z"
      }
    ],
    "connected_devices": [
      {
        "device_name": "Apple Watch",
        "device_type": "FITNESS_TRACKER",
        "connection_status": "active"
      }
    ],
    "health_goals": [
      {
        "goal_category": "Prevention",
        "goal_name": "Reduce heart disease risk",
        "status": "active",
        "progress_percentage": 15
      }
    ]
  }
}
```

---

## Consultations & Video

Telemedicine video consultations powered by Twilio.

### Search Providers

Search for available healthcare providers.

**Endpoint**: `GET /api/consultations/providers/search`

**Query Parameters**:
- `specialty` (optional): Filter by medical specialty
- `acceptingPatients` (optional): Filter by accepting new patients (`true`/`false`)
- `minRating` (optional): Minimum rating (1-5)
- `maxFee` (optional): Maximum consultation fee in cents

**Example**: `GET /api/consultations/providers/search?specialty=Cardiology&minRating=4.0`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "first_name": "Dr. Emily",
        "last_name": "Chen",
        "specialty": "Cardiology",
        "rating": 4.8,
        "consultationFee": 15000,
        "acceptingPatients": true,
        "yearsExperience": 12,
        "bio": "Board-certified cardiologist specializing in preventive care"
      }
    ],
    "count": 1
  }
}
```

---

### Get Provider Availability

Get available time slots for a provider.

**Endpoint**: `GET /api/consultations/providers/:providerId/availability`

**Query Parameters**:
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date

**Example**: `GET /api/consultations/providers/123/availability?startDate=2026-02-08&endDate=2026-02-14`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "dateRange": {
      "start": "2026-02-08T00:00:00Z",
      "end": "2026-02-14T23:59:59Z"
    },
    "slots": [
      {
        "start": "2026-02-08T09:00:00Z",
        "end": "2026-02-08T09:30:00Z",
        "available": true
      },
      {
        "start": "2026-02-08T09:30:00Z",
        "end": "2026-02-08T10:00:00Z",
        "available": false
      }
    ],
    "totalSlots": 2
  }
}
```

---

### Book Consultation

Book a new consultation appointment.

**Endpoint**: `POST /api/consultations/book`

**Request Body**:
```json
{
  "providerId": "550e8400-e29b-41d4-a716-446655440000",
  "scheduledStart": "2026-02-08T09:00:00Z",
  "scheduledEnd": "2026-02-08T09:30:00Z",
  "consultationType": "video",
  "reasonForVisit": "Cardiovascular risk discussion",
  "patientNotes": "Recent BP readings have been elevated"
}
```

**Consultation Types**: `video`, `phone`, `in-person`

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Consultation booked successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "patient_id": "550e8400-e29b-41d4-a716-446655440001",
    "provider_id": "550e8400-e29b-41d4-a716-446655440002",
    "scheduled_start": "2026-02-08T09:00:00Z",
    "scheduled_end": "2026-02-08T09:30:00Z",
    "consultation_type": "video",
    "status": "scheduled",
    "reason_for_visit": "Cardiovascular risk discussion",
    "created_at": "2026-02-07T14:30:00Z"
  }
}
```

**Status Values**: `scheduled`, `confirmed`, `in-progress`, `completed`, `cancelled`, `no-show`

---

### Get Patient Consultations

Get all consultations for a patient.

**Endpoint**: `GET /api/consultations/patient/:patientId`

**Query Parameters**:
- `status` (optional): Comma-separated status values

**Example**: `GET /api/consultations/patient/123?status=scheduled,confirmed`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "consultations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "provider_id": "550e8400-e29b-41d4-a716-446655440002",
        "provider_name": "Dr. Emily Chen",
        "scheduled_start": "2026-02-08T09:00:00Z",
        "status": "scheduled",
        "consultation_type": "video"
      }
    ],
    "count": 1
  }
}
```

---

### Get Provider Consultations

Get all consultations for a provider (provider role required).

**Endpoint**: `GET /api/consultations/provider/:providerId`

**Query Parameters**:
- `status` (optional): Comma-separated status values

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "consultations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "patient_id": "550e8400-e29b-41d4-a716-446655440001",
        "patient_name": "John Doe",
        "scheduled_start": "2026-02-08T09:00:00Z",
        "status": "scheduled",
        "reason_for_visit": "Annual checkup"
      }
    ],
    "count": 1
  }
}
```

---

### Get Consultation Details

Get consultation details by ID.

**Endpoint**: `GET /api/consultations/:consultationId`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "patient_id": "550e8400-e29b-41d4-a716-446655440001",
    "provider_id": "550e8400-e29b-41d4-a716-446655440002",
    "scheduled_start": "2026-02-08T09:00:00Z",
    "scheduled_end": "2026-02-08T09:30:00Z",
    "actual_start": null,
    "actual_end": null,
    "status": "scheduled",
    "consultation_type": "video",
    "reason_for_visit": "Cardiovascular risk discussion",
    "patient_notes": "Recent BP readings have been elevated",
    "provider_notes": null,
    "twilio_room_sid": null,
    "created_at": "2026-02-07T14:30:00Z"
  }
}
```

**Authorization**: Patient, provider, or admin only

---

### Generate Video Token

Generate Twilio access token for video session.

**Endpoint**: `POST /api/consultations/:consultationId/video/token`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "roomName": "consultation-550e8400",
    "identity": "patient-550e8400"
  }
}
```

**Token Expiry**: 1 hour

---

### Start Video Consultation

Start a video consultation (provider only).

**Endpoint**: `POST /api/consultations/:consultationId/video/start`

**Request Body**:
```json
{
  "enableRecording": false
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Consultation started"
}
```

**Side Effects**:
- Creates Twilio video room if not exists
- Updates consultation status to `in-progress`
- Records actual start time

---

### End Video Consultation

End a video consultation.

**Endpoint**: `POST /api/consultations/:consultationId/video/end`

**Request Body**:
```json
{
  "notes": "Patient counseled on medication compliance. Follow-up in 3 months."
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Consultation ended successfully"
}
```

**Side Effects**:
- Closes Twilio video room
- Updates consultation status to `completed`
- Records actual end time

---

### Cancel Consultation

Cancel a consultation.

**Endpoint**: `POST /api/consultations/:consultationId/cancel`

**Request Body**:
```json
{
  "reason": "Patient needs to reschedule due to conflict"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Consultation cancelled successfully"
}
```

**Cancellation Policy**:
- Cancellations more than 24 hours in advance: Full refund
- Cancellations less than 24 hours: 50% refund
- No-shows: No refund

---

### Update Consultation Notes

Update consultation notes (provider only).

**Endpoint**: `PUT /api/consultations/:consultationId/notes`

**Request Body**:
```json
{
  "providerNotes": "Patient's BP improved since last visit...",
  "diagnosisCodes": ["I10", "E11.9"],
  "treatmentPlan": "Continue current medications. Follow-up in 3 months."
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Consultation notes updated"
}
```

---

### Mark No-Show

Mark patient as no-show (provider only).

**Endpoint**: `POST /api/consultations/:consultationId/no-show`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Consultation marked as no-show"
}
```

**Side Effects**:
- Updates consultation status to `no-show`
- May trigger patient notification
- No refund issued

---

### Submit Review

Submit consultation review (patient only).

**Endpoint**: `POST /api/consultations/:consultationId/review`

**Request Body**:
```json
{
  "overallRating": 5,
  "communicationRating": 5,
  "professionalismRating": 5,
  "careQualityRating": 4,
  "waitTimeRating": 5,
  "reviewText": "Dr. Chen was thorough and explained everything clearly.",
  "wouldRecommend": true
}
```

**Rating Scale**: 1-5 (required for overallRating, optional for others)

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```

---

### Share Vitals

Share real-time vitals during consultation.

**Endpoint**: `POST /api/consultations/:consultationId/vitals/share`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Vitals shared with provider"
}
```

**Vitals Shared**:
- Heart rate
- Blood pressure
- SpO2
- Temperature
- Last updated timestamp

---

### Twilio Webhook

Webhook for Twilio video events (no authentication required).

**Endpoint**: `POST /api/consultations/twilio-webhook`

**Request Body** (sent by Twilio):
```json
{
  "RoomSid": "RM123...",
  "RoomName": "consultation-550e8400",
  "StatusCallbackEvent": "room-ended"
}
```

**Events Handled**:
- `room-created`
- `room-ended`
- `participant-connected`
- `participant-disconnected`

**Response**: `200 OK`

---

## Payments

Stripe payment processing for consultations.

### Create Payment Intent

Create payment intent for consultation.

**Endpoint**: `POST /api/payments/create-intent`

**Request Body**:
```json
{
  "consultationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "id": "pi_3AbCdEfGhIjKlMnO",
    "amount": 15000,
    "currency": "usd",
    "status": "requires_payment_method",
    "client_secret": "pi_3AbCdEfGhIjKlMnO_secret_xyz..."
  }
}
```

**Amount**: In cents (e.g., 15000 = $150.00)

**Payment Flow**:
1. Backend creates payment intent
2. Frontend uses `client_secret` with Stripe.js
3. Patient completes payment
4. Frontend confirms payment
5. Webhook confirms successful charge

---

### Confirm Payment

Confirm payment completion.

**Endpoint**: `POST /api/payments/confirm`

**Request Body**:
```json
{
  "paymentIntentId": "pi_3AbCdEfGhIjKlMnO"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

**Side Effects**:
- Updates consultation payment status
- Records transaction in audit log
- May trigger provider payout

---

### Process Refund

Process refund for cancelled consultation.

**Endpoint**: `POST /api/payments/refund`

**Request Body**:
```json
{
  "consultationId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Patient requested cancellation"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Refund processed successfully"
}
```

**Refund Policy**:
- Full refund: Cancellation >24 hours in advance
- Partial refund: Cancellation <24 hours
- No refund: No-shows

**Processing Time**: 5-10 business days

---

### Get Payment History

Get payment history for patient.

**Endpoint**: `GET /api/payments/history`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "consultation_id": "550e8400-e29b-41d4-a716-446655440001",
        "amount": 15000,
        "currency": "usd",
        "status": "succeeded",
        "payment_method": "card",
        "created_at": "2026-02-07T14:30:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### Get Provider Earnings

Get provider earnings summary (provider/admin role required).

**Endpoint**: `GET /api/payments/provider/:providerId/earnings`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "totalEarnings": 450000,
    "currentMonth": 45000,
    "lastMonth": 52000,
    "consultationCount": 30,
    "averageConsultationFee": 15000,
    "pendingPayout": 45000,
    "lastPayoutDate": "2026-02-01T00:00:00Z"
  }
}
```

**Platform Fee**: 15% (retained by MediMindPlus)

---

### Stripe Webhook

Stripe webhook endpoint (no authentication, signature verified).

**Endpoint**: `POST /api/payments/webhook`

**Headers**:
```
stripe-signature: t=1234567890,v1=abc...,v0=def...
```

**Events Handled**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

**Response**: `200 OK`
```json
{
  "received": true
}
```

**Webhook Security**:
- Signature verification required
- Replay attack prevention
- Idempotency keys used

---

## Health Risk Assessment

AI-powered disease risk prediction using machine learning models.

### Get Diabetes Risk

Get Type 2 Diabetes risk assessment.

**Endpoint**: `GET /api/health-risk/:userId/diabetes`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "riskScore": 68,
    "riskLevel": "high",
    "confidence": 0.87,
    "factors": [
      {
        "name": "BMI",
        "value": 32.5,
        "impact": "high",
        "description": "BMI in obese range"
      },
      {
        "name": "Age",
        "value": 55,
        "impact": "moderate",
        "description": "Increased risk after age 45"
      },
      {
        "name": "Family History",
        "value": true,
        "impact": "high",
        "description": "Parent with Type 2 Diabetes"
      }
    ],
    "recommendations": [
      "Weight loss of 5-10% can reduce risk by 58%",
      "150 minutes of moderate exercise per week",
      "Consider HbA1c screening every 6 months"
    ],
    "assessedAt": "2026-02-07T14:30:00Z",
    "nextReviewDate": "2026-05-07"
  }
}
```

**Risk Levels**: `low` (0-30), `moderate` (31-60), `high` (61-80), `very-high` (81-100)

**Model**: Random Forest classifier trained on 10,000+ patient records

---

### Get Cardiovascular Risk

Get Cardiovascular disease risk assessment (Framingham Score).

**Endpoint**: `GET /api/health-risk/:userId/cardiovascular`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "riskScore": 42,
    "riskLevel": "moderate",
    "framinghamScore": 18,
    "tenYearRisk": 18.5,
    "factors": [
      {
        "name": "Total Cholesterol",
        "value": 240,
        "unit": "mg/dL",
        "impact": "high",
        "normalRange": "< 200 mg/dL"
      },
      {
        "name": "HDL Cholesterol",
        "value": 35,
        "unit": "mg/dL",
        "impact": "high",
        "normalRange": "> 40 mg/dL"
      },
      {
        "name": "Systolic BP",
        "value": 145,
        "unit": "mmHg",
        "impact": "moderate",
        "normalRange": "< 120 mmHg"
      }
    ],
    "recommendations": [
      "Statin therapy recommended (discuss with physician)",
      "Target LDL < 100 mg/dL",
      "Blood pressure control to < 130/80",
      "Consider stress test or coronary calcium score"
    ],
    "assessedAt": "2026-02-07T14:30:00Z"
  }
}
```

**Framingham Score**: Validated cardiovascular risk calculator

**10-Year Risk Categories**:
- Low: <10%
- Moderate: 10-20%
- High: >20%

---

### Get Hypertension Risk

Get Hypertension risk assessment.

**Endpoint**: `GET /api/health-risk/:userId/hypertension`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "riskScore": 55,
    "riskLevel": "moderate",
    "currentBP": {
      "systolic": 138,
      "diastolic": 88,
      "category": "Stage 1 Hypertension"
    },
    "bpTrend": "increasing",
    "factors": [
      {
        "name": "Average Systolic BP (30 days)",
        "value": 142,
        "impact": "high"
      },
      {
        "name": "BMI",
        "value": 29.5,
        "impact": "moderate"
      },
      {
        "name": "Sodium Intake",
        "value": "high",
        "impact": "moderate"
      }
    ],
    "recommendations": [
      "DASH diet (low sodium, high potassium)",
      "Weight loss of 5-10 pounds can lower BP by 5-20 mmHg",
      "Home BP monitoring 2x daily",
      "Consider antihypertensive medication"
    ],
    "assessedAt": "2026-02-07T14:30:00Z"
  }
}
```

**BP Categories** (ACC/AHA 2017):
- Normal: <120/<80
- Elevated: 120-129/<80
- Stage 1: 130-139/80-89
- Stage 2: ≥140/≥90
- Hypertensive Crisis: >180/>120

---

### Get Mental Health Risk

Get Mental health risk assessment (PHQ-9, GAD-7 scores).

**Endpoint**: `GET /api/health-risk/:userId/mental-health`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "depression": {
      "phq9Score": 12,
      "severity": "Moderate",
      "symptoms": [
        "Little interest or pleasure",
        "Feeling down or hopeless",
        "Trouble sleeping",
        "Feeling tired"
      ]
    },
    "anxiety": {
      "gad7Score": 8,
      "severity": "Mild",
      "symptoms": [
        "Feeling nervous",
        "Worrying too much",
        "Trouble relaxing"
      ]
    },
    "recommendations": [
      "Consider cognitive behavioral therapy (CBT)",
      "Consult with mental health professional",
      "Regular exercise and sleep hygiene",
      "Follow-up screening in 2 weeks"
    ],
    "urgency": "moderate",
    "assessedAt": "2026-02-07T14:30:00Z"
  }
}
```

**PHQ-9 Score Interpretation**:
- 0-4: Minimal depression
- 5-9: Mild depression
- 10-14: Moderate depression
- 15-19: Moderately severe depression
- 20-27: Severe depression

**GAD-7 Score Interpretation**:
- 0-4: Minimal anxiety
- 5-9: Mild anxiety
- 10-14: Moderate anxiety
- 15-21: Severe anxiety

**Crisis Resources**: If PHQ-9 ≥20 or suicidal ideation, immediate crisis hotline referral provided

---

### Get Cancer Screening Recommendations

Get Cancer screening recommendations based on age, gender, risk factors.

**Endpoint**: `GET /api/health-risk/:userId/cancer-screening`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "recommendations": [
      {
        "cancerType": "Colorectal",
        "recommended": true,
        "urgency": "due",
        "method": "Colonoscopy",
        "frequency": "Every 10 years",
        "ageToStart": 45,
        "ageToStop": 75,
        "lastScreening": null,
        "nextDue": "2026-02-07",
        "rationale": "Age 55, average risk"
      },
      {
        "cancerType": "Lung",
        "recommended": true,
        "urgency": "overdue",
        "method": "Low-dose CT",
        "frequency": "Annual",
        "ageToStart": 50,
        "ageToStop": 80,
        "lastScreening": "2024-01-15",
        "nextDue": "2025-01-15",
        "rationale": "30 pack-year smoking history"
      }
    ],
    "highRiskFactors": [
      "30+ pack-year smoking history",
      "Family history of colon cancer"
    ],
    "assessedAt": "2026-02-07T14:30:00Z"
  }
}
```

**Screenings Evaluated**:
- Colorectal (colonoscopy, FIT)
- Lung (low-dose CT)
- Breast (mammogram)
- Cervical (Pap smear, HPV test)
- Prostate (PSA, discussion required)
- Skin (visual exam)

**Guidelines**: USPSTF recommendations

---

### Get Comprehensive Risk Report

Get Comprehensive health risk report (all 5 models).

**Endpoint**: `GET /api/health-risk/:userId/comprehensive`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "overallRiskScore": 62,
    "riskCategory": "high",
    "assessments": {
      "diabetes": {
        "riskScore": 68,
        "riskLevel": "high"
      },
      "cardiovascular": {
        "riskScore": 42,
        "riskLevel": "moderate"
      },
      "hypertension": {
        "riskScore": 55,
        "riskLevel": "moderate"
      },
      "mentalHealth": {
        "depressionScore": 12,
        "anxietyScore": 8,
        "severity": "moderate"
      },
      "cancer": {
        "screeningsRecommended": 2,
        "overdueScreenings": 1
      }
    },
    "topPriorities": [
      {
        "priority": 1,
        "condition": "Lung Cancer Screening",
        "urgency": "overdue",
        "action": "Schedule low-dose CT scan immediately"
      },
      {
        "priority": 2,
        "condition": "Type 2 Diabetes",
        "urgency": "high",
        "action": "HbA1c screening and lifestyle modifications"
      },
      {
        "priority": 3,
        "condition": "Cardiovascular Disease",
        "urgency": "moderate",
        "action": "Lipid panel and statin consideration"
      }
    ],
    "lifestyleRecommendations": [
      "Weight loss of 10-15 pounds",
      "150 minutes moderate exercise weekly",
      "Mediterranean diet",
      "Stress management techniques",
      "Sleep 7-8 hours nightly"
    ],
    "assessedAt": "2026-02-07T14:30:00Z",
    "nextReviewDate": "2026-05-07"
  }
}
```

**Performance**: Cached for 24 hours, refreshes with new data

---

## Wearable Device Data

Endpoints for syncing and retrieving wearable device health data (Apple Watch, Fitbit, etc.).

### Sync Wearable Data

Sync wearable data from device to backend.

**Endpoint**: `POST /api/wearable/:userId/sync`

**Request Body**:
```json
{
  "source": "APPLE_HEALTH",
  "data": {
    "vitals": [
      {
        "type": "heart_rate",
        "value": 72,
        "unit": "bpm",
        "timestamp": "2026-02-07T08:00:00Z"
      },
      {
        "type": "blood_oxygen",
        "value": 98,
        "unit": "%",
        "timestamp": "2026-02-07T08:00:00Z"
      }
    ],
    "activity": {
      "steps": 8432,
      "distance": 6.2,
      "distanceUnit": "km",
      "activeMinutes": 45,
      "caloriesBurned": 2340,
      "date": "2026-02-07"
    },
    "sleep": {
      "bedTime": "2026-02-06T23:00:00Z",
      "wakeTime": "2026-02-07T07:00:00Z",
      "totalMinutes": 420,
      "deepSleepMinutes": 120,
      "remSleepMinutes": 90,
      "lightSleepMinutes": 210,
      "sleepScore": 82
    }
  }
}
```

**Supported Sources**: `APPLE_HEALTH`, `FITBIT`, `GARMIN`, `SAMSUNG_HEALTH`, `GOOGLE_FIT`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Wearable data synced successfully",
  "data": {
    "recordsCreated": 15,
    "vitalsRecords": 10,
    "activityRecords": 1,
    "sleepRecords": 1,
    "syncedAt": "2026-02-07T14:30:00Z"
  }
}
```

---

### Get Health Dashboard

Get comprehensive health dashboard data.

**Endpoint**: `GET /api/wearable/:userId/dashboard`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "date": "2026-02-07",
      "overallScore": 78,
      "trend": "improving"
    },
    "vitals": {
      "heartRate": {
        "current": 72,
        "resting": 65,
        "max24h": 145,
        "min24h": 58,
        "status": "normal"
      },
      "bloodPressure": {
        "systolic": 122,
        "diastolic": 78,
        "status": "normal",
        "lastReading": "2026-02-07T08:00:00Z"
      },
      "oxygenSaturation": {
        "current": 98,
        "avg24h": 97,
        "status": "excellent"
      }
    },
    "activity": {
      "steps": 8432,
      "goal": 10000,
      "percentComplete": 84,
      "activeMinutes": 45,
      "caloriesBurned": 2340,
      "distance": 6.2
    },
    "sleep": {
      "lastNight": {
        "totalHours": 7.5,
        "quality": "good",
        "sleepScore": 82,
        "deepSleepPercent": 28,
        "remSleepPercent": 21
      },
      "weeklyAverage": 7.2
    },
    "streaks": {
      "dailySteps": 12,
      "sleepGoal": 5,
      "activeMinutes": 8
    }
  }
}
```

---

### Get Latest Vital Signs

Get latest vital signs for a user.

**Endpoint**: `GET /api/wearable/:userId/vitals/latest`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "heartRate": {
      "value": 72,
      "unit": "bpm",
      "timestamp": "2026-02-07T14:25:00Z",
      "status": "normal"
    },
    "bloodPressure": {
      "systolic": 122,
      "diastolic": 78,
      "unit": "mmHg",
      "timestamp": "2026-02-07T08:00:00Z",
      "status": "normal"
    },
    "oxygenSaturation": {
      "value": 98,
      "unit": "%",
      "timestamp": "2026-02-07T14:20:00Z",
      "status": "excellent"
    },
    "temperature": {
      "value": 98.2,
      "unit": "°F",
      "timestamp": "2026-02-07T08:00:00Z",
      "status": "normal"
    },
    "respiratoryRate": {
      "value": 16,
      "unit": "breaths/min",
      "timestamp": "2026-02-07T14:00:00Z",
      "status": "normal"
    }
  }
}
```

---

### Get Activity Summary

Get activity summary for a date range.

**Endpoint**: `GET /api/wearable/:userId/activity`

**Query Parameters**:
- `startDate` (optional): ISO 8601 date (default: 7 days ago)
- `endDate` (optional): ISO 8601 date (default: today)

**Example**: `GET /api/wearable/123/activity?startDate=2026-02-01&endDate=2026-02-07`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSteps": 58904,
      "avgStepsPerDay": 8415,
      "totalDistance": 43.4,
      "totalActiveMinutes": 315,
      "totalCalories": 16380,
      "daysActive": 7
    },
    "dailyBreakdown": [
      {
        "date": "2026-02-07",
        "steps": 8432,
        "distance": 6.2,
        "activeMinutes": 45,
        "caloriesBurned": 2340,
        "goalMet": false
      }
    ],
    "trends": {
      "stepsChange": "+12%",
      "activeMinutesChange": "+18%",
      "comparison": "vs previous 7 days"
    }
  }
}
```

---

### Get Body Metrics History

Get body metrics history (weight, BMI, body fat).

**Endpoint**: `GET /api/wearable/:userId/body-metrics`

**Query Parameters**:
- `limit` (optional): Number of records (default: 30)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "current": {
      "weight": 185.4,
      "weightUnit": "lbs",
      "bmi": 28.5,
      "bodyFatPercent": 24.2,
      "leanMass": 140.5,
      "lastUpdated": "2026-02-07T08:00:00Z"
    },
    "history": [
      {
        "date": "2026-02-07",
        "weight": 185.4,
        "bmi": 28.5,
        "bodyFatPercent": 24.2
      },
      {
        "date": "2026-02-06",
        "weight": 185.8,
        "bmi": 28.6,
        "bodyFatPercent": 24.4
      }
    ],
    "trend": {
      "weightChange7Days": -1.2,
      "weightChange30Days": -3.8,
      "direction": "decreasing"
    }
  }
}
```

---

### Get Sleep Data

Get sleep data for a date range.

**Endpoint**: `GET /api/wearable/:userId/sleep`

**Query Parameters**:
- `startDate` (optional): ISO 8601 date (default: 30 days ago)
- `endDate` (optional): ISO 8601 date (default: today)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "avgSleepHours": 7.2,
      "avgSleepScore": 78,
      "totalNights": 30,
      "goodSleepNights": 22
    },
    "sleepHistory": [
      {
        "date": "2026-02-06",
        "bedTime": "2026-02-06T23:00:00Z",
        "wakeTime": "2026-02-07T07:00:00Z",
        "totalMinutes": 420,
        "totalHours": 7.0,
        "deepSleepMinutes": 120,
        "remSleepMinutes": 90,
        "lightSleepMinutes": 210,
        "awakeMinutes": 10,
        "sleepScore": 82,
        "quality": "good"
      }
    ],
    "insights": [
      "You're sleeping 0.5 hours less than your 90-day average",
      "Best sleep quality on weekends",
      "Try going to bed 30 minutes earlier"
    ]
  }
}
```

---

### Get Heart Rate Trends

Get heart rate trends (last 30 days).

**Endpoint**: `GET /api/wearable/:userId/heart-rate/trends`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "current": {
      "resting": 65,
      "avg": 78,
      "max": 145,
      "min": 58
    },
    "trends": {
      "restingHRChange": -2,
      "direction": "improving",
      "comparison": "vs previous 30 days"
    },
    "dailyAverages": [
      {
        "date": "2026-02-07",
        "restingHR": 65,
        "avgHR": 78,
        "maxHR": 145
      }
    ],
    "zones": {
      "resting": 45,
      "light": 120,
      "moderate": 60,
      "vigorous": 15,
      "peak": 5
    },
    "insights": [
      "Your resting heart rate is in the excellent range",
      "Resting HR decreased by 2 bpm this month"
    ]
  }
}
```

---

### Check Wearable Status

Check if user has recent wearable data.

**Endpoint**: `GET /api/wearable/:userId/status`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "connected": true,
    "lastSync": "2026-02-07T14:30:00Z"
  }
}
```

**Connected**: `true` if data received in last 24 hours

---

## Health Alerts

Endpoints for vital signs alerts and notifications.

### Get Recent Alerts

Get recent vital alerts for a user.

**Endpoint**: `GET /api/alerts/:userId/recent`

**Query Parameters**:
- `hours` (optional): Hours to look back (default: 24)

**Example**: `GET /api/alerts/123/recent?hours=48`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "alertType": "HIGH_HEART_RATE",
        "severity": "WARNING",
        "message": "Heart rate elevated to 145 bpm",
        "vitalType": "heart_rate",
        "value": 145,
        "threshold": 120,
        "timestamp": "2026-02-07T10:15:00Z",
        "acknowledged": false
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "alertType": "HIGH_BLOOD_PRESSURE",
        "severity": "CRITICAL",
        "message": "Blood pressure critically high: 180/110",
        "vitalType": "blood_pressure",
        "value": {
          "systolic": 180,
          "diastolic": 110
        },
        "timestamp": "2026-02-07T08:30:00Z",
        "acknowledged": true
      }
    ],
    "count": 2,
    "criticalCount": 1,
    "warningCount": 1
  }
}
```

**Alert Types**:
- `HIGH_HEART_RATE` / `LOW_HEART_RATE`
- `HIGH_BLOOD_PRESSURE` / `LOW_BLOOD_PRESSURE`
- `LOW_OXYGEN_SATURATION`
- `HIGH_TEMPERATURE`
- `IRREGULAR_HEART_RHYTHM`

**Severity Levels**: `INFO`, `WARNING`, `CRITICAL`

---

### Get Critical Alerts

Get only critical alerts for a user.

**Endpoint**: `GET /api/alerts/:userId/critical`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "alertType": "HIGH_BLOOD_PRESSURE",
        "severity": "CRITICAL",
        "message": "Blood pressure critically high: 180/110",
        "timestamp": "2026-02-07T08:30:00Z",
        "acknowledged": false,
        "action": "Seek immediate medical attention"
      }
    ],
    "count": 1
  }
}
```

**Critical Thresholds**:
- Blood Pressure: ≥180/≥110 mmHg
- Heart Rate: ≥180 or ≤40 bpm
- Oxygen Saturation: <90%
- Temperature: ≥103°F

---

### Test Alert System

Test alert system by processing sample vitals.

**Endpoint**: `POST /api/alerts/:userId/test`

**Request Body** (optional, uses defaults if omitted):
```json
{
  "vitals": {
    "heartRate": 150,
    "bloodPressure": {
      "systolic": 160,
      "diastolic": 100
    },
    "oxygenSaturation": 92
  }
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Test alerts generated",
  "data": {
    "testVitals": {
      "heartRate": 150,
      "bloodPressure": {
        "systolic": 160,
        "diastolic": 100
      },
      "oxygenSaturation": 92
    },
    "alertsGenerated": [
      {
        "alertType": "HIGH_HEART_RATE",
        "severity": "WARNING",
        "message": "Heart rate elevated to 150 bpm"
      },
      {
        "alertType": "HIGH_BLOOD_PRESSURE",
        "severity": "WARNING",
        "message": "Blood pressure elevated: 160/100"
      },
      {
        "alertType": "LOW_OXYGEN_SATURATION",
        "severity": "WARNING",
        "message": "Oxygen saturation low: 92%"
      }
    ]
  }
}
```

---

## Error Handling

All errors follow a standardized format implemented in `src/middleware/errorHandler.ts`.

### Error Response Format

All API errors return a consistent structure:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "path": "/api/endpoint",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Development Mode Only** (never exposed in production):
```json
{
  "success": false,
  "error": {
    ...
    "stack": "Error stack trace",
    "details": {
      "field": "email",
      "constraint": "unique_violation"
    }
  }
}
```

---

### HTTP Status Codes

**2xx Success**:
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Request succeeded, no content to return

**4xx Client Errors**:
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded

**5xx Server Errors**:
- `500 Internal Server Error` - Unexpected server error
- `502 Bad Gateway` - External service failure
- `503 Service Unavailable` - Service temporarily unavailable
- `504 Gateway Timeout` - External service timeout

---

### Error Codes

Standardized error codes for programmatic handling:

**Authentication Errors**:
- `UNAUTHORIZED` - Authentication required
- `AUTHENTICATION_ERROR` - Invalid credentials
- `JWT_ERROR` - Invalid token
- `JWT_EXPIRED` - Token expired

**Authorization Errors**:
- `FORBIDDEN` - Access forbidden
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `HIPAA_COMPLIANCE_ERROR` - HIPAA violation attempt

**Validation Errors**:
- `BAD_REQUEST` - Invalid request
- `VALIDATION_ERROR` - Validation failed

**Resource Errors**:
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict

**Rate Limiting**:
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `RATE_LIMIT_ERROR` - Rate limit exceeded (alternative code)

**Server Errors**:
- `INTERNAL_SERVER_ERROR` - Internal error
- `DATABASE_ERROR` - Database operation failed
- `BAD_GATEWAY` - External service error
- `SERVICE_UNAVAILABLE` - Service unavailable
- `GATEWAY_TIMEOUT` - External service timeout
- `EXTERNAL_SERVICE_ERROR` - Third-party service failure

---

### Example Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "message": "providerId and scheduledStart are required",
    "code": "BAD_REQUEST",
    "statusCode": 400,
    "path": "/api/consultations/book",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "AUTHENTICATION_ERROR",
    "statusCode": 401,
    "path": "/api/auth/login",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized access to user health data",
    "code": "FORBIDDEN",
    "statusCode": 403,
    "path": "/api/health-risk/123/diabetes",
    "method": "GET",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": {
    "message": "Route not found: GET /api/nonexistent",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "path": "/api/nonexistent",
    "method": "GET",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

**409 Conflict**:
```json
{
  "success": false,
  "error": {
    "message": "Email already registered",
    "code": "CONFLICT",
    "statusCode": 409,
    "path": "/api/auth/register",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

**422 Validation Error**:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 422,
    "path": "/api/auth/register",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters"
        }
      ]
    }
  }
}
```

**429 Rate Limit**:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_ERROR",
    "statusCode": 429,
    "path": "/api/auth/login",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z",
    "retryAfter": "15 minutes"
  }
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": {
    "message": "Database connection failed",
    "code": "DATABASE_ERROR",
    "statusCode": 500,
    "path": "/api/consultations/book",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z"
  }
}
```

---

### Database Errors

PostgreSQL errors are automatically mapped to appropriate HTTP status codes:

| PostgreSQL Code | Error Type | HTTP Status | Error Code |
|---|---|---|---|
| 23505 | Unique violation | 409 | CONFLICT |
| 23503 | Foreign key violation | 422 | VALIDATION_ERROR |
| 23502 | Not null violation | 422 | VALIDATION_ERROR |
| 42P01 | Undefined table | 500 | DATABASE_ERROR |
| 42703 | Undefined column | 500 | DATABASE_ERROR |
| ECONNREFUSED | Connection refused | 503 | SERVICE_UNAVAILABLE |
| ETIMEDOUT | Timeout | 504 | GATEWAY_TIMEOUT |

---

## Rate Limiting

Rate limiting protects the API from abuse and ensures fair usage.

### Rate Limits

**Authenticated Requests**:
- 1000 requests/hour per user
- 100 requests/10 seconds (burst protection)

**Unauthenticated Requests**:
- 100 requests/hour per IP
- 10 requests/10 seconds (burst protection)

**Authentication Endpoints** (stricter limits):
- `/api/auth/login`: 5 attempts/15 minutes per IP
- `/api/auth/register`: 3 attempts/hour per IP
- `/api/auth/refresh-token`: 20 requests/hour per user

---

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1696687200
```

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

### Rate Limit Exceeded

When rate limit is exceeded, the API returns `429 Too Many Requests`:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_ERROR",
    "statusCode": 429,
    "path": "/api/auth/login",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00Z",
    "retryAfter": "15 minutes"
  }
}
```

**Retry-After Header**: `Retry-After: 900` (seconds)

---

### Best Practices

1. **Implement exponential backoff** when receiving 429 errors
2. **Cache responses** where appropriate
3. **Use webhooks** instead of polling
4. **Batch requests** when possible
5. **Monitor rate limit headers** to avoid hitting limits

---

## HIPAA Compliance

MediMindPlus is fully HIPAA compliant with comprehensive security measures.

### Audit Logging

All PHI access is automatically logged with:
- User ID and role
- Action performed (read, create, update, delete)
- Resource accessed
- Timestamp (ISO 8601)
- IP address
- User agent
- Request ID (for tracing)

**Audit Log Retention**: 7 years (HIPAA requirement)

**Example Audit Log Entry**:
```json
{
  "timestamp": "2026-02-07T14:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "userRole": "provider",
  "action": "READ",
  "resource": "/api/health-risk/123/diabetes",
  "method": "GET",
  "statusCode": 200,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "phi": true
}
```

---

### Data Encryption

**In Transit**:
- TLS 1.3 only
- Perfect Forward Secrecy (PFS)
- HSTS enabled

**At Rest**:
- AES-256-GCM encryption
- All PHI fields encrypted in database
- Encryption keys rotated every 90 days
- Keys stored in AWS KMS / Azure Key Vault

---

### Access Control

**Role-Based Access Control (RBAC)**:
- `patient` - Own data only
- `provider` - Assigned patients only
- `admin` - System administration (no PHI access without audit)

**Minimum Necessary Rule**:
- APIs return only the minimum data required
- Sensitive fields (SSN, full DOB) require explicit permission

**Session Management**:
- Session timeout: 15 minutes of inactivity
- Automatic logout after 1 hour
- Concurrent session limit: 3 devices

---

### Consent Management

Explicit consent required for:
- Data processing
- Data sharing with providers
- Research participation
- Marketing communications

**Consent Records Include**:
- Consent type
- Consent given (true/false)
- Version of Terms & Privacy Policy
- Timestamp (ISO 8601)
- IP address
- User agent

**Consent Withdrawal**: Users can withdraw consent at any time via `/api/settings/consent`

---

### Data Minimization

APIs enforce data minimization:
- Only collect necessary PHI
- Only return necessary PHI
- Automatic data retention policies:
  - Consultation notes: 7 years
  - Audit logs: 7 years
  - Inactive accounts: Deleted after 3 years
  - Deleted account data: Purged after 30 days

---

### Security Headers

All responses include security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

### PHI Sanitization

Error messages automatically sanitize PHI:
- Passwords → `[REDACTED]`
- Tokens → `[REDACTED]`
- SSN patterns → `[REDACTED]`
- Credit card patterns → `[REDACTED]`
- Medical record numbers → `[REDACTED]`

**Example**:
```json
{
  "error": {
    "message": "Invalid [REDACTED]: patient@example.com"
  }
}
```

---

### Breach Notification

In the event of a breach:
1. **Immediate**: Internal incident response team notified
2. **Within 24 hours**: Preliminary investigation
3. **Within 60 days**: Affected individuals notified
4. **Within 60 days**: HHS Office for Civil Rights notified
5. **If >500 affected**: Media notification

**Breach Hotline**: 1-800-XXX-XXXX (24/7)

---

## Versioning

**Current API Version**: v1

**Version Header** (optional):
```
X-API-Version: 1
```

**Deprecation Policy**:
- New API versions released as needed
- Old versions supported for minimum 12 months after deprecation announcement
- Deprecation warnings returned in `Deprecation` header:
  ```
  Deprecation: true
  Sunset: Sat, 31 Dec 2027 23:59:59 GMT
  Link: <https://docs.medimindplus.ai/api/v2>; rel="successor-version"
  ```

**Breaking Changes**:
- Require new major version (v2, v3, etc.)
- Non-breaking changes added to current version

---

## Support

For API support, please contact:

**Email**: api-support@medimindplus.ai
**Documentation**: https://docs.medimindplus.ai
**Status Page**: https://status.medimindplus.ai
**Developer Portal**: https://developers.medimindplus.ai

**Business Hours**: Monday-Friday, 9 AM - 6 PM EST
**Emergency Support**: 24/7 for critical issues

**SLA**: 99.9% uptime guarantee

---

## Additional Resources

- **Error Handling Guide**: `docs/ERROR_HANDLING.md`
- **Integration Tests**: `tests/integration/README.md`
- **HIPAA Compliance Docs**: `compliance/hipaa/`
- **OpenAPI Specification**: `docs/openapi.yaml` (coming soon)
- **Postman Collection**: `docs/MediMindPlus.postman_collection.json` (coming soon)

---

**Document Version**: 2.0
**Last Updated**: February 7, 2026
**Maintained By**: MediMindPlus Engineering Team
