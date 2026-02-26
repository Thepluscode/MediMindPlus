/**
 * Advanced Features Type Definitions
 * MediMindPlus - Enterprise Health Platform
 *
 * Comprehensive TypeScript interfaces for advanced disease detection,
 * BCI monitoring, microbiome analysis, athletic performance, and more.
 */

// ============================================================================
// STROKE DETECTION TYPES
// ============================================================================

export interface VesselOcclusion {
  detected: boolean;
  location: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Complete occlusion';
}

export interface TreatmentRecommendations {
  tpa_eligible: boolean;
  thrombectomy_eligible: boolean;
  urgency: 'ROUTINE' | 'URGENT' | 'IMMEDIATE' | 'EMERGENT';
  next_steps: string[];
}

export interface Prognosis {
  modified_rankin_score_prediction: string;
  functional_outcome: string;
  recovery_timeline: string;
}

export interface StrokeLocation {
  hemisphere: 'Left' | 'Right' | 'Bilateral';
  territory: string;
  specific_areas: string[];
}

export interface StrokeAnalysis {
  stroke_detected: boolean;
  stroke_type: 'Ischemic' | 'Hemorrhagic' | 'TIA' | 'None';
  confidence: number;
  time_since_onset: string;
  treatment_eligible: boolean;
  affected_region: string;
  infarct_volume: string;
  location: StrokeLocation;
  vessel_occlusion: VesselOcclusion;
  recommendations: TreatmentRecommendations;
  prognosis: Prognosis;
}

export interface StrokePerformanceMetrics {
  sensitivity: number;
  specificity: number;
  accuracy: number;
  human_comparison: string;
  processing_time: string;
  false_negatives: number;
  false_positives: number;
}

// ============================================================================
// BCI MENTAL HEALTH TYPES
// ============================================================================

export interface SeverityScore {
  score: number;
  severity: 'None' | 'Minimal' | 'Mild' | 'Moderate' | 'Severe' | 'Extreme';
  trend: 'improving' | 'stable' | 'worsening';
  confidence: number;
}

export interface StressPattern {
  current: number;
  baseline: number;
  peak_times: string[];
  status: 'normal' | 'elevated' | 'high';
}

export interface CognitiveMetrics {
  focus_score: number;
  memory_score: number;
  processing_speed: number;
  mental_fatigue: number;
}

export interface SleepMetrics {
  quality: number;
  deep_sleep_patterns: string;
  rem_efficiency: number;
  sleep_disorders: string;
}

export interface BrainwaveData {
  delta: BrainwavePattern;
  theta: BrainwavePattern;
  alpha: BrainwavePattern;
  beta: BrainwavePattern;
  gamma: BrainwavePattern;
}

export interface BrainwavePattern {
  frequency: string;
  activity: number;
  state: string;
}

export interface NeurofeedbackIntervention {
  type: string;
  target: string;
  protocol: string;
  frequency: string;
  expected_outcome: string;
}

export interface EarlyWarningAlert {
  condition: string;
  probability: number;
  timeframe: string;
  indicators: string[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface BCIMetrics {
  overall_score: number;
  depression_severity: SeverityScore;
  anxiety_level: SeverityScore;
  stress_pattern: StressPattern;
  cognitive_performance: CognitiveMetrics;
  sleep_brain_analysis: SleepMetrics;
  brainwave_patterns: BrainwaveData;
}

// ============================================================================
// MICROBIOME ANALYSIS TYPES
// ============================================================================

export interface ConditionRisk {
  name: string;
  probability: number;
  status: 'low' | 'moderate' | 'high';
}

export interface BacterialProfile {
  name: string;
  percentage: number;
  health: 'poor' | 'fair' | 'good' | 'optimal';
}

export interface ProbioticRecommendation {
  type: string;
  name: string;
  strains: string[];
  benefit: string;
  price: number;
}

export interface DietaryRecommendation {
  type: string;
  foods?: string[];
  changes?: string[];
  benefit: string;
}

export interface MicrobiomeRecommendations {
  probiotics: ProbioticRecommendation[];
  dietary: DietaryRecommendation[];
}

export interface MicrobiomeData {
  diversity_score: number;
  balance_rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  detected_conditions: ConditionRisk[];
  bacterial_composition: BacterialProfile[];
  recommendations: MicrobiomeRecommendations;
}

export interface MicrobiomeTestKit {
  kit_id: string;
  order_date: string;
  status: 'ordered' | 'shipped' | 'delivered' | 'collected' | 'in_lab' | 'complete';
  tracking_number?: string;
  estimated_results: string;
}

// ============================================================================
// MEDICAL COPILOT TYPES
// ============================================================================

export interface PhysicalExam {
  general: string;
  cardiovascular: string;
  respiratory: string;
  neurological?: string;
  musculoskeletal?: string;
  skin?: string;
  vitals: {
    blood_pressure: string;
    heart_rate: string;
    temperature: string;
    respiratory_rate?: string;
    oxygen_saturation?: string;
  };
}

export interface Assessment {
  diagnosis: string;
  icd10: string;
  plan: string;
}

export interface MedicationOrder {
  action: 'start' | 'modify' | 'discontinue';
  drug: string;
  dosage?: string;
  new_dosage?: string;
  frequency?: string;
  reason: string;
}

export interface LabOrder {
  type: 'lab' | 'imaging' | 'procedure';
  tests: string[];
  urgency: 'stat' | 'urgent' | 'routine';
  indication?: string;
}

export interface TreatmentPlan {
  medications: MedicationOrder[];
  orders: LabOrder[];
  follow_up: string;
}

export interface BillingCode {
  code: string;
  description: string;
  estimated_reimbursement: number;
}

export interface ClinicalDecisionSupport {
  type: 'guideline' | 'drug_interaction' | 'allergy_alert' | 'contraindication';
  source: string;
  recommendation: string;
  relevance: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'low' | 'moderate' | 'high';
}

export interface ClinicalNote {
  session_id: string;
  note_status: 'draft' | 'pending_review' | 'signed' | 'amended';
  sections: {
    chief_complaint: string;
    history_present_illness: string;
    physical_exam: PhysicalExam;
    assessment: Assessment[];
    plan: TreatmentPlan;
  };
  billing_codes: BillingCode[];
  clinical_decision_support: ClinicalDecisionSupport[];
  time_saved_minutes: number;
}

export interface CopilotSession {
  session_id: string;
  provider_id: string;
  patient_id: string;
  session_type: 'office_visit' | 'telehealth' | 'hospital_round' | 'emergency';
  status: 'active' | 'paused' | 'complete';
  start_time: string;
  end_time?: string;
  transcription_active: boolean;
}

// ============================================================================
// ATHLETIC PERFORMANCE TYPES
// ============================================================================

export interface HRVData {
  current: number;
  baseline: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  interpretation: string;
}

export interface PerformancePrediction {
  metric: string;
  prediction: string;
  confidence: number;
  factors: string[];
}

export interface InjuryRisk {
  injury_type: string;
  probability: number;
  timeframe: string;
  contributing_factors: string[];
  prevention_recommendations: string[];
}

export interface DecisionOption {
  action: string;
  success_probability: number;
  expected_value: number;
  recommendation: 'Optimal' | 'Good' | 'Suboptimal' | 'Poor';
  analysis: string;
}

export interface DecisionAnalysis {
  game_situation: string;
  options: DecisionOption[];
  recommended_action: string;
}

export interface RecoveryMetrics {
  overall_score: number;
  muscle_soreness: number;
  fatigue_level: number;
  sleep_quality: number;
  readiness_score: number;
}

export interface AthleticMetrics {
  performance_score: number;
  readiness_score: number;
  injury_risk: 'Low' | 'Moderate' | 'High' | 'Critical';
  optimal_training_load: string;
  hrv_data: HRVData;
  cognitive_performance: {
    reaction_time: number;
    baseline: number;
    percentile: number;
    decision_accuracy: number;
  };
  recovery_metrics: RecoveryMetrics;
}

// ============================================================================
// WEARABLE DEVICE TYPES
// ============================================================================

export interface WearableDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'Smartwatch' | 'Fitness Tracker' | 'Smart Ring' | 'Smart Textile' | 'CGM' | 'Blood Pressure Monitor' | 'Smart Scale';
  status: 'connected' | 'syncing' | 'disconnected' | 'error';
  battery: number;
  last_sync: string;
  data_points_today: number;
  capabilities: string[];
  icon: string;
  color: string;
  firmware_version?: string;
  serial_number?: string;
}

export interface BiometricDataPoint {
  timestamp: string;
  data_type: string;
  value: number;
  unit: string;
  source: string;
  metadata?: {
    activity_state?: string;
    device?: string;
    confidence?: number;
  };
}

export interface BiometricTimeSeries {
  user_id: string;
  data_type: string;
  unit: string;
  aggregation: 'raw' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  data_points: BiometricDataPoint[];
  statistics: {
    mean: number;
    median: number;
    std_dev: number;
    percentile_25: number;
    percentile_75: number;
  };
}

export interface RealtimeBiometricData {
  heart_rate: {
    current: number;
    min_today: number;
    max_today: number;
    avg_today: number;
    source: string;
    trend: number[];
    last_update: string;
  };
  steps: {
    current: number;
    goal: number;
    source: string;
    calories: number;
    distance: number;
    active_minutes: number;
  };
  sleep: {
    last_night: number;
    deep_sleep: number;
    light_sleep: number;
    rem_sleep: number;
    awakenings: number;
    quality: number;
    source: string;
  };
  hrv: {
    current: number;
    avg_7day: number;
    trend: string;
    source: string;
    interpretation: string;
  };
  temperature?: {
    current: number;
    deviation: number;
    source: string;
    status: string;
  };
  blood_oxygen?: {
    current: number;
    avg_today: number;
    source: string;
    status: string;
  };
  respiratory_rate?: {
    current: number;
    avg_sleep: number;
    source: string;
    status: string;
  };
}

export interface DataQuality {
  overall_score: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  issues: {
    device: string;
    issue: string;
    severity: 'low' | 'moderate' | 'high';
  }[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface StrokeDetectionRequest {
  patient_id: string;
  scan_type: 'ct_head_noncontrast' | 'ct_angiography' | 'mri_dwi' | 'mri_flair';
  dicom_files: File[];
  clinical_context: {
    symptom_onset: string;
    current_time: string;
    nihss_score?: number;
  };
}

export interface MicrobiomeKitOrderRequest {
  user_id: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  delivery_method: 'standard' | 'express' | 'overnight';
}

export interface CopilotSessionRequest {
  provider_id: string;
  patient_id: string;
  session_type: 'office_visit' | 'telehealth' | 'hospital_round' | 'emergency';
  chief_complaint?: string;
}

export interface WearableDeviceSyncRequest {
  device_id: string;
  force_sync?: boolean;
}

export interface BiometricDataQuery {
  user_id: string;
  data_type: string;
  start_date: string;
  end_date: string;
  aggregation?: 'raw' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// ============================================================================
// HEALTH PREDICTION ENHANCEMENTS
// ============================================================================

export interface MultiModalRiskAssessment {
  condition: string;
  overall_risk: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  contributing_factors: {
    genomic: number;
    biomarker: number;
    lifestyle: number;
    environmental: number;
    wearable_data: number;
  };
  early_detection_timeline: string;
  intervention_recommendations: string[];
}

export interface LiquidBiopsyResults {
  test_id: string;
  test_date: string;
  circulating_tumor_dna: {
    detected: boolean;
    concentration: number;
    mutations: string[];
  };
  circulating_tumor_cells: {
    count: number;
    detected: boolean;
  };
  protein_biomarkers: {
    marker: string;
    value: number;
    reference_range: string;
    status: 'normal' | 'elevated' | 'high';
  }[];
  cancer_detection: {
    detected: boolean;
    cancer_type?: string;
    tissue_of_origin?: string;
    confidence: number;
  };
}

// ============================================================================
// SUBSCRIPTION & PRICING TYPES
// ============================================================================

export interface SubscriptionTier {
  tier: 'Free' | 'Premium' | 'Premium+' | 'Enterprise' | 'Provider';
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  features: {
    disease_detection: boolean;
    stroke_detection_scans?: number;
    bci_monitoring: boolean;
    microbiome_tests_per_year?: number;
    athletic_performance: boolean;
    wearable_devices_limit?: number;
    ai_copilot_access?: boolean;
    priority_support: boolean;
    custom_integrations?: boolean;
  };
}

export interface UsageMetrics {
  user_id: string;
  subscription_tier: string;
  usage_period: {
    start_date: string;
    end_date: string;
  };
  api_calls: number;
  stroke_scans_used: number;
  microbiome_tests_used: number;
  storage_gb: number;
  overage_charges: number;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Stroke Detection
  StrokeAnalysis,
  StrokePerformanceMetrics,

  // BCI Mental Health
  BCIMetrics,
  NeurofeedbackIntervention,
  EarlyWarningAlert,

  // Microbiome
  MicrobiomeData,
  MicrobiomeTestKit,

  // Medical Copilot
  ClinicalNote,
  CopilotSession,

  // Athletic Performance
  AthleticMetrics,
  DecisionAnalysis,

  // Wearables
  WearableDevice,
  RealtimeBiometricData,
  DataQuality,

  // Enhanced Predictions
  MultiModalRiskAssessment,
  LiquidBiopsyResults,

  // Subscriptions
  SubscriptionTier,
  UsageMetrics,
};
