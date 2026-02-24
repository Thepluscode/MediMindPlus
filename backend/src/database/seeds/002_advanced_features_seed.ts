/**
 * Advanced Features Seed Data
 * MediMindPlus - Enterprise Health Platform
 *
 * Seeds mock data for testing advanced features including:
 * - Wearable devices
 * - Biometric data
 * - BCI sessions and metrics
 * - Microbiome kits and results
 * - Athletic metrics
 * - Stroke analyses
 */

import { Knex } from 'knex';
import logger from '../../utils/logger';

export async function seed(knex: Knex): Promise<void> {
  // Assume we have at least one user with ID from previous seed
  // For demo purposes, we'll use a mock user ID
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'; // Replace with actual user ID

  // ============================================================================
  // WEARABLE DEVICES
  // ============================================================================

  await knex('wearable_devices').del();
  await knex('wearable_devices').insert([
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      device_type: 'Apple Watch Series 8',
      manufacturer: 'Apple',
      name: 'Apple Watch Series 8',
      status: 'connected',
      battery_level: 87,
      last_sync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      capabilities: JSON.stringify(['heart_rate', 'steps', 'sleep', 'hrv', 'ecg', 'activity']),
      firmware_version: '9.5.2',
      auth_token: 'mock_apple_watch_token_1234',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440002',
      user_id: mockUserId,
      device_type: 'Fitbit Charge 5',
      manufacturer: 'Fitbit',
      name: 'Fitbit Charge 5',
      status: 'connected',
      battery_level: 65,
      last_sync: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      capabilities: JSON.stringify(['heart_rate', 'steps', 'sleep', 'stress', 'activity']),
      firmware_version: '1.180.51',
      auth_token: 'mock_fitbit_token_5678',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
      user_id: mockUserId,
      device_type: 'Oura Ring Gen 3',
      manufacturer: 'Oura',
      name: 'Oura Ring Gen 3',
      status: 'connected',
      battery_level: 42,
      last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      capabilities: JSON.stringify(['heart_rate', 'hrv', 'sleep', 'temperature', 'activity']),
      firmware_version: '2.1.5',
      auth_token: 'mock_oura_token_9012',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // ============================================================================
  // BIOMETRIC DATA (Last 24 hours of heart rate data)
  // ============================================================================

  await knex('biometric_data').del();

  const biometricData = [];
  const now = Date.now();
  const deviceId = '650e8400-e29b-41d4-a716-446655440001';

  // Generate heart rate data (every 5 minutes for last 24 hours)
  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(now - i * 5 * 60 * 1000);
    const baseHeartRate = 72;
    const variation = Math.sin(i / 12) * 10 + Math.random() * 8;

    biometricData.push({
      id: `${650 + i}e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
      user_id: mockUserId,
      device_id: deviceId,
      data_type: 'heart_rate',
      value: baseHeartRate + variation,
      unit: 'bpm',
      timestamp,
      source: 'Apple Watch Series 8',
      metadata: JSON.stringify({ accuracy: 'high', confidence: 0.95 }),
      created_at: timestamp,
    });
  }

  // Generate steps data (every hour for last 24 hours)
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    const steps = Math.floor(Math.random() * 500) + 200;

    biometricData.push({
      id: `${750 + i}e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`,
      user_id: mockUserId,
      device_id: deviceId,
      data_type: 'steps',
      value: steps,
      unit: 'count',
      timestamp,
      source: 'Apple Watch Series 8',
      metadata: JSON.stringify({ hourly: true }),
      created_at: timestamp,
    });
  }

  // Generate sleep data (last night)
  const sleepStart = new Date(now - 8 * 60 * 60 * 1000);
  biometricData.push({
    id: '850e8400-e29b-41d4-a716-446655440001',
    user_id: mockUserId,
    device_id: deviceId,
    data_type: 'sleep',
    value: 7.5,
    unit: 'hours',
    timestamp: sleepStart,
    source: 'Apple Watch Series 8',
    metadata: JSON.stringify({
      deep_sleep: 2.1,
      rem_sleep: 1.8,
      light_sleep: 3.6,
      quality: 'Good',
    }),
    created_at: sleepStart,
  });

  // Generate HRV data
  biometricData.push({
    id: '850e8400-e29b-41d4-a716-446655440002',
    user_id: mockUserId,
    device_id: deviceId,
    data_type: 'hrv',
    value: 65,
    unit: 'ms',
    timestamp: new Date(now - 10 * 60 * 1000),
    source: 'Apple Watch Series 8',
    metadata: JSON.stringify({ quality: 'high' }),
    created_at: new Date(),
  });

  await knex('biometric_data').insert(biometricData);

  // ============================================================================
  // BCI SESSIONS & METRICS
  // ============================================================================

  await knex('bci_sessions').del();
  await knex('bci_sessions').insert([
    {
      id: '950e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      session_type: 'meditation',
      duration_seconds: 1200, // 20 minutes
      status: 'completed',
      started_at: new Date(now - 2 * 60 * 60 * 1000),
      ended_at: new Date(now - 2 * 60 * 60 * 1000 + 1200 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  await knex('bci_metrics').del();
  await knex('bci_metrics').insert([
    {
      id: 'a50e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      session_id: '950e8400-e29b-41d4-a716-446655440001',
      timestamp: new Date(now - 2 * 60 * 60 * 1000),
      brainwave_data: JSON.stringify({
        alpha: { value: 12.5, range: '8-13 Hz', dominance: 0.35 },
        beta: { value: 18.2, range: '13-30 Hz', dominance: 0.25 },
        theta: { value: 6.8, range: '4-8 Hz', dominance: 0.20 },
        delta: { value: 2.1, range: '0.5-4 Hz', dominance: 0.10 },
        gamma: { value: 35.6, range: '30-100 Hz', dominance: 0.10 },
      }),
      mental_state: JSON.stringify({
        focus_level: 78,
        stress_level: 23,
        relaxation: 82,
        meditation_depth: 'Deep',
        cognitive_load: 'Low',
      }),
      attention_score: 78,
      stress_level: 23,
      meditation_depth: 82,
      cognitive_load: 35,
      mental_fatigue: 18,
      emotional_valence: 0.65,
      arousal_level: 0.42,
      device_info: JSON.stringify({
        device_type: 'Muse S',
        electrode_quality: 'Good',
        sampling_rate: '256 Hz',
      }),
      created_at: new Date(),
    },
  ]);

  // ============================================================================
  // MICROBIOME KITS & RESULTS
  // ============================================================================

  await knex('microbiome_kits').del();
  await knex('microbiome_kits').insert([
    {
      id: 'b50e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      kit_id: 'KIT-2025-ABC123',
      status: 'results_ready',
      test_type: 'comprehensive',
      ordered_date: new Date(now - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      shipped_date: new Date(now - 42 * 24 * 60 * 60 * 1000),
      received_date: new Date(now - 35 * 24 * 60 * 60 * 1000),
      sample_collected_date: new Date(now - 34 * 24 * 60 * 60 * 1000),
      returned_date: new Date(now - 32 * 24 * 60 * 60 * 1000),
      results_date: new Date(now - 14 * 24 * 60 * 60 * 1000),
      shipping_address: JSON.stringify({
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
      }),
      tracking_number: 'USPS-1234567890',
      price: 199.00,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  await knex('microbiome_results').del();
  await knex('microbiome_results').insert([
    {
      id: 'c50e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      kit_id: 'b50e8400-e29b-41d4-a716-446655440001',
      analysis_date: new Date(now - 14 * 24 * 60 * 60 * 1000),
      diversity_score: 8.2,
      composition: JSON.stringify({
        bacteroidetes: 52.3,
        firmicutes: 38.1,
        proteobacteria: 5.4,
        actinobacteria: 3.2,
        other: 1.0,
      }),
      species_detected: JSON.stringify([
        { name: 'Bacteroides fragilis', abundance: 12.5, category: 'beneficial' },
        { name: 'Faecalibacterium prausnitzii', abundance: 8.3, category: 'beneficial' },
        { name: 'Akkermansia muciniphila', abundance: 3.2, category: 'beneficial' },
        { name: 'Bifidobacterium longum', abundance: 2.1, category: 'beneficial' },
      ]),
      health_insights: JSON.stringify({
        gut_health_score: 82,
        digestive_health: 'Good',
        immune_function: 'Strong',
        inflammation_markers: 'Low',
        metabolic_health: 'Excellent',
      }),
      disease_risk: JSON.stringify({
        ibd: 'Low',
        diabetes: 'Low',
        obesity: 'Low',
        cardiovascular: 'Low',
      }),
      dietary_recommendations: JSON.stringify([
        'Increase prebiotic fiber intake',
        'Include fermented foods',
        'Reduce processed foods',
        'Maintain diverse plant-based diet',
      ]),
      probiotic_recommendations: JSON.stringify([
        {
          strain: 'Lactobacillus acidophilus',
          dosage: '10 billion CFU',
          frequency: 'Daily',
        },
        {
          strain: 'Bifidobacterium bifidum',
          dosage: '5 billion CFU',
          frequency: 'Daily',
        },
      ]),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // ============================================================================
  // ATHLETIC PERFORMANCE METRICS
  // ============================================================================

  await knex('athletic_metrics').del();
  await knex('athletic_metrics').insert([
    {
      id: 'd50e8400-e29b-41d4-a716-446655440001',
      user_id: mockUserId,
      timestamp: new Date(),
      sport: 'Basketball',
      session_type: 'Game',
      performance_data: JSON.stringify({
        points_scored: 24,
        assists: 7,
        rebounds: 5,
        steals: 3,
        blocks: 1,
        turnovers: 2,
        minutes_played: 32,
      }),
      biometric_data: JSON.stringify({
        avg_heart_rate: 152,
        max_heart_rate: 182,
        hrv: 45,
        vo2_max: 58.3,
        lactate_threshold: 165,
      }),
      decision_quality: 87.5,
      reaction_time: 0.18,
      cognitive_performance: JSON.stringify({
        decision_speed: 'Fast',
        accuracy: 87.5,
        situational_awareness: 92,
        pattern_recognition: 85,
      }),
      fatigue_level: 6.2,
      recovery_score: 78,
      injury_risk: 15,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // ============================================================================
  // STROKE ANALYSES
  // ============================================================================

  await knex('stroke_analyses').del();
  await knex('stroke_analyses').insert([
    {
      id: 'e50e8400-e29b-41d4-a716-446655440001',
      patient_id: mockUserId,
      scan_type: 'ct_head_noncontrast',
      stroke_detected: true,
      confidence: 0.92,
      stroke_type: 'Ischemic',
      location: JSON.stringify({
        hemisphere: 'Left',
        lobe: 'Frontal',
        specific_region: 'Middle Cerebral Artery Territory',
        coordinates: { x: 45.2, y: 32.8, z: 15.6 },
      }),
      vessel_occlusion: JSON.stringify({
        vessel_name: 'Middle Cerebral Artery',
        occlusion_percentage: 85,
        clot_burden_score: 8,
        collateral_flow: 'Good',
      }),
      volume_ml: 32.5,
      core_infarct_volume: 18.2,
      penumbra_volume: 42.8,
      mismatch_ratio: 2.35,
      nihss_predicted: 14,
      aspects_score: 7,
      recommendations: JSON.stringify({
        treatment: 'IV tPA + Thrombectomy',
        time_window: 'Within window',
        considerations: ['Monitor blood pressure', 'Immediate thrombectomy'],
      }),
      prognosis: JSON.stringify({
        modified_rankin_score_predicted: 2,
        recovery_likelihood: 'Good',
        estimated_recovery_time: '4-6 months',
      }),
      image_urls: JSON.stringify(['/uploads/medical-scans/scan_mock_001.dcm']),
      clinical_context: JSON.stringify({
        symptom_onset: new Date(now - 2 * 60 * 60 * 1000),
        current_time: new Date(),
        symptoms: ['right-sided weakness', 'aphasia'],
        risk_factors: ['hypertension', 'smoking'],
      }),
      analyzed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  logger.info('Advanced features seed data inserted successfully', { service: 'advanced-features-seed' });
}
