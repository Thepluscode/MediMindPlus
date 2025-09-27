import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('audit_logs').del();
  await knex('notifications').del();
  await knex('interventions').del();
  await knex('ai_predictions').del();
  await knex('sensor_data').del();
  await knex('vital_signs').del();
  await knex('health_profiles').del();
  await knex('users').del();

  // Hash passwords
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Insert users
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'john.doe@example.com',
      password,
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1985-07-15',
      gender: 'male',
      phone_number: '+1234567890',
      is_active: true,
      is_email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'jane.smith@example.com',
      password,
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1990-03-22',
      gender: 'female',
      phone_number: '+1987654321',
      is_active: true,
      is_email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'admin@medimind.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
      is_email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('users').insert(users);

  // Insert health profiles
  const healthProfiles = [
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      user_id: users[0].id,
      height: 175.5,
      weight: 80.2,
      bmi: 26.1,
      blood_type: 'A+',
      medical_conditions: JSON.stringify(['hypertension', 'migraine']),
      medications: JSON.stringify(['Lisinopril 10mg', 'Propranolol 40mg']),
      allergies: JSON.stringify(['penicillin', 'peanuts']),
      family_history: JSON.stringify({
        cardiovascular_disease: ['father', 'grandfather'],
        diabetes: ['mother']
      }),
      emergency_contact_name: 'Mary Doe',
      emergency_contact_phone: '+1234567891',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: users[1].id,
      height: 165.0,
      weight: 62.5,
      bmi: 22.9,
      blood_type: 'O+',
      medical_conditions: JSON.stringify(['asthma']),
      medications: JSON.stringify(['Ventolin']),
      allergies: JSON.stringify(['aspirin']),
      family_history: JSON.stringify({
        asthma: ['mother'],
        arthritis: ['grandmother']
      }),
      emergency_contact_name: 'Robert Smith',
      emergency_contact_phone: '+1987654322',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('health_profiles').insert(healthProfiles);

  // Insert sample vital signs
  const now = new Date();
  const vitalSigns = [];

  // Generate 30 days of vital signs for John Doe
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    vitalSigns.push({
      user_id: users[0].id,
      heart_rate: 68 + Math.floor(Math.random() * 10),
      systolic_bp: 120 + Math.floor(Math.random() * 20),
      diastolic_bp: 75 + Math.floor(Math.random() * 10),
      temperature: 36.5 + Math.random() * 0.8,
      respiratory_rate: 14 + Math.floor(Math.random() * 6),
      oxygen_saturation: 96 + Math.random() * 3,
      measurement_source: i % 3 === 0 ? 'device' : 'manual',
      device_id: i % 3 === 0 ? 'device-123' : null,
      measured_at: date,
      created_at: date,
      updated_at: date,
    });
  }

  // Generate 30 days of vital signs for Jane Smith
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    vitalSigns.push({
      user_id: users[1].id,
      heart_rate: 72 + Math.floor(Math.random() * 12),
      systolic_bp: 115 + Math.floor(Math.random() * 15),
      diastolic_bp: 70 + Math.floor(Math.random() * 10),
      temperature: 36.3 + Math.random() * 0.7,
      respiratory_rate: 15 + Math.floor(Math.random() * 5),
      oxygen_saturation: 97 + Math.random() * 2,
      measurement_source: i % 2 === 0 ? 'device' : 'manual',
      device_id: i % 2 === 0 ? 'device-456' : null,
      measured_at: date,
      created_at: date,
      updated_at: date,
    });
  }

  await knex('vital_signs').insert(vitalSigns);

  // Insert sample AI predictions
  const predictions = [
    {
      id: '770e8400-e29b-41d4-a716-446655440000',
      user_id: users[0].id,
      model_name: 'cardiovascular_risk_v1',
      model_version: '1.0.0',
      disease_risks: JSON.stringify({
        cardiovascular_disease: 0.65,
        diabetes_type2: 0.42,
        hypertension: 0.78,
        stroke: 0.35
      }),
      overall_risk_score: 0.62,
      confidence_level: 0.85,
      risk_factors: JSON.stringify([
        'elevated_blood_pressure',
        'family_history_cardiovascular_disease',
        'elevated_bmi'
      ]),
      feature_importance: JSON.stringify({
        systolic_bp: 0.28,
        diastolic_bp: 0.25,
        family_history: 0.22,
        bmi: 0.15,
        age: 0.10
      }),
      input_data_summary: JSON.stringify({
        vital_signs_count: 30,
        lab_results_count: 0,
        genetic_markers_count: 0,
        days_of_data: 30
      }),
      status: 'completed',
      prediction_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('ai_predictions').insert(predictions);

  // Insert sample interventions
  const interventions = [
    {
      id: '880e8400-e29b-41d4-a716-446655440000',
      user_id: users[0].id,
      prediction_id: predictions[0].id,
      title: 'Reduce Blood Pressure',
      description: 'Follow a low-sodium diet and exercise for at least 30 minutes daily to help lower blood pressure.',
      type: 'lifestyle',
      category: 'diet',
      status: 'in_progress',
      priority: 'high',
      start_date: new Date(),
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      progress_metrics: {
        weekly_check_ins: 2,
        blood_pressure_readings: 7,
        exercise_minutes: 150,
      },
      progress_percent: 30,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      user_id: users[0].id,
      title: 'Schedule Annual Checkup',
      description: 'Schedule and complete your annual physical examination with your primary care physician.',
      type: 'medical',
      category: 'checkup',
      status: 'pending',
      priority: 'medium',
      target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('interventions').insert(interventions);

  // Insert sample notifications
  const notifications = [
    {
      user_id: users[0].id,
      title: 'Welcome to MediMind!',
      message: 'Thank you for joining MediMind. Complete your health profile to get personalized insights.',
      type: 'system',
      priority: 'normal',
      is_read: true,
      is_sent: true,
      sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: users[0].id,
      title: 'New Health Insight',
      message: 'Your latest health data indicates elevated blood pressure. Consider scheduling a checkup.',
      type: 'health_alert',
      priority: 'high',
      is_read: false,
      is_sent: true,
      action_data: {
        type: 'navigate',
        route: '/insights/blood-pressure',
      },
      sent_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('notifications').insert(notifications);
}

export { seed as _default };
