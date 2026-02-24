/**
 * Revolutionary Features Type Definitions
 * Comprehensive TypeScript interfaces for billion-dollar healthcare features
 * MediMindPlus Platform - 2025
 */

// ========================================
// 1. VIRTUAL HEALTH TWIN
// ========================================

export interface VirtualHealthTwin {
  id: string;
  userId: string;
  version: string;
  lastUpdated: Date;
  biologicalAge: number;
  chronologicalAge: number;

  // Core physiological models
  cardiovascularModel: CardiovascularModel;
  metabolicModel: MetabolicModel;
  neurologicalModel: NeurologicalModel;
  immuneModel: ImmuneSystemModel;
  musculoskeletalModel: MusculoskeletalModel;
  endocrineModel: EndocrineModel;

  // Predictive capabilities
  treatmentPredictions: TreatmentPrediction[];
  lifestyleImpactModels: LifestyleImpactModel[];
  diseaseProgressionModels: DiseaseProgressionModel[];

  // Simulation results
  simulations: HealthSimulation[];
  accuracy: number;
  confidence: number;
}

export interface CardiovascularModel {
  restingHeartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  heartRateVariability: number;
  cardiacOutput: number;
  vascularAge: number;
  atherosklerosisRisk: number;
  strokeRisk: number;
  heartAttackRisk: number;
  arterialStiffness: number;
  endothelialFunction: number;
}

export interface MetabolicModel {
  basalMetabolicRate: number;
  insulinSensitivity: number;
  glucoseRegulation: number;
  lipidProfile: {
    totalCholesterol: number;
    ldl: number;
    hdl: number;
    triglycerides: number;
  };
  diabetesRisk: number;
  metabolicAge: number;
  mitochondrialFunction: number;
}

export interface NeurologicalModel {
  cognitiveReserve: number;
  brainAge: number;
  neuroplasticity: number;
  alzheimerRisk: number;
  parkinsonRisk: number;
  strokeRisk: number;
  mentalHealthScore: number;
  stressResilience: number;
}

export interface ImmuneSystemModel {
  immuneAge: number;
  inflammationMarkers: number;
  antibodyResponse: number;
  tcellFunction: number;
  autoimmunRisk: number;
  infectionSusceptibility: number;
  vaccineEffectiveness: number;
}

export interface MusculoskeletalModel {
  boneDensity: number;
  musclemass: number;
  flexibility: number;
  osteoporosisRisk: number;
  arthritisRisk: number;
  injuryRisk: number;
  mobilityScore: number;
}

export interface EndocrineModel {
  thyroidFunction: number;
  adrenalFunction: number;
  hormonalBalance: number;
  reproductiveHealth: number;
  stressHormones: {
    cortisol: number;
    adrenaline: number;
  };
}

export interface TreatmentPrediction {
  treatmentId: string;
  treatmentName: string;
  treatmentType: 'medication' | 'therapy' | 'surgery' | 'lifestyle';
  predictedEffectiveness: number;
  predictedSideEffects: SideEffectPrediction[];
  recoveryTimeline: RecoveryPhase[];
  optimalDosage?: number;
  confidence: number;
}

export interface SideEffectPrediction {
  effect: string;
  probability: number;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  onset: string;
  duration: string;
}

export interface RecoveryPhase {
  phase: string;
  duration: string;
  expectedOutcomes: string[];
  milestones: string[];
}

export interface LifestyleImpactModel {
  intervention: string;
  category: 'diet' | 'exercise' | 'sleep' | 'stress' | 'social';
  predictedImpact: {
    cardiovascular: number;
    metabolic: number;
    neurological: number;
    immune: number;
    overall: number;
  };
  timeline: TimelineImpact[];
  adherenceDifficulty: 'easy' | 'moderate' | 'challenging';
  confidence: number;
}

export interface TimelineImpact {
  timepoint: string; // e.g., "1 week", "1 month", "3 months"
  expectedChanges: Record<string, number>;
  measurableMarkers: string[];
}

export interface DiseaseProgressionModel {
  disease: string;
  currentStage: string;
  predictedProgression: ProgressionStage[];
  preventionOpportunities: PreventionOpportunity[];
  riskScore: number;
  geneticContribution: number;
  environmentalContribution: number;
  lifestyleContribution: number;
}

export interface ProgressionStage {
  stage: string;
  probabilityByYear: Array<{ year: number; probability: number }>;
  symptoms: string[];
  interventionOpportunities: string[];
}

export interface PreventionOpportunity {
  intervention: string;
  riskReduction: number;
  costEffectiveness: string;
  evidence: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthSimulation {
  id: string;
  scenarioName: string;
  parameters: Record<string, any>;
  predictions: SimulationPrediction[];
  timestamp: Date;
  accuracy: number;
}

export interface SimulationPrediction {
  timepoint: string;
  predictedMetrics: Record<string, number>;
  healthScore: number;
  riskFactors: string[];
}

// ========================================
// 2. AI MENTAL HEALTH CRISIS PREVENTION
// ========================================

export interface MentalHealthCrisisPredictor {
  id: string;
  userId: string;
  assessmentDate: Date;

  // Core metrics
  crisisRiskScore: number; // 0-100
  suicideRiskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'severe' | 'extreme';
  depressionSeverity: number;
  anxietySeverity: number;
  stressLevel: number;

  // Predictive signals
  earlyWarningSignals: EarlyWarningSignal[];
  behavioralPatterns: BehavioralPattern[];
  linguisticMarkers: LinguisticMarker[];
  physiologicalMarkers: PhysiologicalMarker[];
  socialMarkers: SocialConnectednessMarker[];

  // Interventions
  recommendedInterventions: MentalHealthIntervention[];
  emergencyContacts: EmergencyContact[];
  safetyPlan: SafetyPlan;

  // Timeline
  predictionHorizon: string; // e.g., "3 months", "6 months"
  confidenceScore: number;
}

export interface EarlyWarningSignal {
  signal: string;
  category: 'behavioral' | 'cognitive' | 'emotional' | 'physical' | 'social';
  severity: number;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  firstDetected: Date;
  frequency: number;
  context: string;
}

export interface BehavioralPattern {
  pattern: string;
  description: string;
  frequency: string;
  concernLevel: 'low' | 'moderate' | 'high';
  comparedToBaseline: number; // percentage deviation
  examples: string[];
}

export interface LinguisticMarker {
  marker: string;
  category: 'word_choice' | 'sentiment' | 'syntax' | 'content_themes';
  score: number;
  interpretation: string;
  examples: string[];
}

export interface PhysiologicalMarker {
  metric: string;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  deviation: number;
  clinicalSignificance: string;
}

export interface SocialConnectednessMarker {
  metric: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  isolationRisk: number;
  socialSupportQuality: number;
}

export interface MentalHealthIntervention {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  category: 'therapy' | 'medication' | 'lifestyle' | 'emergency' | 'community';
  title: string;
  description: string;
  urgency: 'low' | 'moderate' | 'high' | 'emergency';
  expectedOutcome: string;
  resources: InterventionResource[];
  timeline: string;
}

export interface InterventionResource {
  name: string;
  type: 'hotline' | 'therapist' | 'app' | 'article' | 'video' | 'exercise';
  url?: string;
  phoneNumber?: string;
  availability: string;
  cost: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notificationPreference: string;
  priority: number;
}

export interface SafetyPlan {
  warningSignsPersonalized: string[];
  copingStrategies: string[];
  socialDistractors: string[];
  professionalContacts: string[];
  emergencyNumbers: string[];
  environmentSafety: string[];
  reasonsForLiving: string[];
}

// ========================================
// 3. GENOMIC-MICROBIOME-LIFESTYLE INTEGRATION
// ========================================

export interface MultiOmicsProfile {
  id: string;
  userId: string;
  lastUpdated: Date;

  // Genomic data
  genomicProfile: GenomicProfile;

  // Microbiome data
  microbiomeProfile: MicrobiomeProfile;

  // Lifestyle data
  lifestyleProfile: LifestyleProfile;

  // Integrated insights
  integratedInsights: IntegratedHealthInsight[];
  personalizedRecommendations: PersonalizedRecommendation[];
  diseaseRisks: DiseaseRisk[];

  // Optimization targets
  nutritionPlan: PersonalizedNutritionPlan;
  supplementPlan: PersonalizedSupplementPlan;
  exercisePlan: PersonalizedExercisePlan;

  confidence: number;
}

export interface GenomicProfile {
  sequencingDate: Date;
  sequencingType: '23andMe' | 'AncestryDNA' | 'WGS' | 'WES' | 'custom';
  totalVariants: number;

  // Key genetic variants
  pharmacogenomics: PharmacogenomicVariant[];
  diseaseRiskVariants: GeneticVariant[];
  traitVariants: GeneticVariant[];
  carrierStatus: CarrierStatusResult[];

  // Ancestry
  ancestry: AncestryResult;

  // Polygenic risk scores
  polygenicRiskScores: PolygenicRiskScore[];
}

export interface PharmacogenomicVariant {
  gene: string;
  variant: string;
  drug: string;
  effect: string;
  recommendation: string;
  evidenceLevel: string;
  sources: string[];
}

export interface GeneticVariant {
  rsId: string;
  gene: string;
  chromosome: string;
  position: number;
  genotype: string;
  effect: string;
  magnitude: number;
  repute: 'good' | 'neutral' | 'bad';
  trait: string;
}

export interface CarrierStatusResult {
  condition: string;
  carrierStatus: 'positive' | 'negative';
  inheritancePattern: string;
  riskToOffspring: number;
  recommendation: string;
}

export interface AncestryResult {
  populations: Array<{
    population: string;
    percentage: number;
  }>;
  maternalHaplogroup: string;
  paternalHaplogroup: string;
  neanderthalVariants: number;
}

export interface PolygenicRiskScore {
  trait: string;
  score: number;
  percentile: number;
  category: 'low' | 'average' | 'elevated' | 'high';
  interpretation: string;
}

export interface MicrobiomeProfile {
  sampleDate: Date;
  sampleType: 'stool' | 'saliva' | 'skin' | 'nasal';

  // Diversity metrics
  alphaMetrics: {
    shannon: number;
    simpson: number;
    chao1: number;
  };
  betaDiversity: string;

  // Bacterial composition
  phylum: TaxonomicAbundance[];
  genus: TaxonomicAbundance[];
  species: TaxonomicAbundance[];

  // Functional analysis
  metabolicPathways: MetabolicPathway[];
  shortChainFattyAcids: SCFAProfile;

  // Health associations
  gutBrainAxis: GutBrainAxisScore;
  immuneFunction: MicrobiomeImmuneScore;
  metabolicHealth: MicrobiomeMetabolicScore;

  // Balance assessment
  beneficialBacteria: number;
  potentialPathogens: number;
  overallBalance: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface TaxonomicAbundance {
  name: string;
  relativeAbundance: number;
  role: 'beneficial' | 'neutral' | 'potentially_harmful';
  functions: string[];
}

export interface MetabolicPathway {
  pathway: string;
  abundance: number;
  healthImpact: string;
  keyOrganisms: string[];
}

export interface SCFAProfile {
  butyrate: number;
  acetate: number;
  propionate: number;
  totalSCFA: number;
  ratio: string;
}

export interface GutBrainAxisScore {
  score: number;
  interpretation: string;
  moodImpact: string;
  cognitionImpact: string;
  recommendations: string[];
}

export interface MicrobiomeImmuneScore {
  score: number;
  immunomodulation: string;
  inflammationStatus: string;
  recommendations: string[];
}

export interface MicrobiomeMetabolicScore {
  score: number;
  glucoseMetabolism: string;
  lipidMetabolism: string;
  recommendations: string[];
}

export interface LifestyleProfile {
  diet: DietaryProfile;
  exercise: ExerciseProfile;
  sleep: SleepProfile;
  stress: StressProfile;
  environment: EnvironmentalProfile;
}

export interface DietaryProfile {
  calorieIntake: number;
  macronutrients: {
    protein: number;
    carbohydrates: number;
    fats: number;
  };
  micronutrients: Record<string, number>;
  dietaryPatterns: string[];
  foodSensitivities: string[];
  hydration: number;
}

export interface ExerciseProfile {
  weeklyMinutes: number;
  types: string[];
  intensity: Record<string, number>;
  consistency: number;
  vo2max: number;
  strengththraining: number;
}

export interface SleepProfile {
  averageDuration: number;
  quality: number;
  consistency: number;
  sleepDebt: number;
  circadianAlignment: number;
}

export interface StressProfile {
  chronicStressLevel: number;
  acuteStressors: string[];
  copingMechanisms: string[];
  resilience: number;
  hrvBaseline: number;
}

export interface EnvironmentalProfile {
  airQuality: number;
  waterQuality: number;
  toxinExposure: string[];
  sunExposure: number;
  socialConnections: number;
}

export interface IntegratedHealthInsight {
  id: string;
  title: string;
  description: string;
  category: 'gene-microbiome' | 'gene-lifestyle' | 'microbiome-lifestyle' | 'all';
  evidenceLevel: 'high' | 'moderate' | 'emerging';
  actionable: boolean;
  recommendations: string[];
}

export interface PersonalizedRecommendation {
  id: string;
  category: 'nutrition' | 'exercise' | 'supplement' | 'lifestyle' | 'medical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  rationale: string;
  geneticBasis: string;
  microbiomeBasis: string;
  lifestyleBasis: string;
  expectedBenefit: string;
  implementationGuide: string;
  confidence: number;
}

export interface DiseaseRisk {
  disease: string;
  overallRisk: number;
  geneticContribution: number;
  microbiomeContribution: number;
  lifestyleContribution: number;
  modifiableRisk: number;
  recommendations: string[];
  preventionStrategy: string;
}

export interface PersonalizedNutritionPlan {
  calorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
  micronutrientFocus: string[];
  foodsToEmphasize: FoodRecommendation[];
  foodsToLimit: string[];
  mealTiming: MealTimingGuide;
  rationale: string;
}

export interface FoodRecommendation {
  food: string;
  frequency: string;
  portion: string;
  benefit: string;
  geneticReason?: string;
  microbiomeReason?: string;
}

export interface MealTimingGuide {
  breakfastWindow: string;
  lunchWindow: string;
  dinnerWindow: string;
  fastingWindow: string;
  rationale: string;
}

export interface PersonalizedSupplementPlan {
  supplements: SupplementRecommendation[];
  totalMonthlyCost: number;
  priorityOrder: string[];
}

export interface SupplementRecommendation {
  supplement: string;
  dosage: string;
  timing: string;
  reason: string;
  geneticBasis?: string;
  microbiomeBasis?: string;
  deficiencyRisk: number;
  expectedBenefit: string;
  cost: number;
  brand?: string;
}

export interface PersonalizedExercisePlan {
  weeklyGoals: {
    cardioMinutes: number;
    strengthSessions: number;
    flexibilityMinutes: number;
    restDays: number;
  };
  optimalExerciseTypes: string[];
  intensityGuidance: string;
  recoveryNeeds: string;
  injuryPrevention: string[];
  geneticOptimization: string;
}

// ========================================
// 4. LONGEVITY OPTIMIZATION PLATFORM
// ========================================

export interface LongevityProfile {
  id: string;
  userId: string;
  lastUpdated: Date;

  // Core longevity metrics
  biologicalAge: number;
  chronologicalAge: number;
  ageingRate: number;
  predictedHealthspan: number;
  predictedLifespan: number;

  // Biomarkers of aging
  hallmarksOfAging: HallmarksOfAging;
  bloodBiomarkers: BloodBiomarker[];
  epigeneticAge: EpigeneticAge;

  // Longevity interventions
  currentInterventions: LongevityIntervention[];
  recommendedInterventions: LongevityIntervention[];

  // Progress tracking
  longevityScore: number;
  trendsOverTime: LongevityTrend[];

  // Research insights
  cuttingEdgeTherapies: CuttingEdgeTherapy[];
}

export interface HallmarksOfAging {
  genomicInstability: number;
  telomereAttrition: number;
  epigeneticAlterations: number;
  lossOfProteostasis: number;
  deregulatedNutrientSensing: number;
  mitochondrialDysfunction: number;
  cellularSenescence: number;
  stemCellExhaustion: number;
  alteredIntercellularCommunication: number;
  disabledMacroautophagy: number;
  chronicInflammation: number;
  dysbiosis: number;
}

export interface BloodBiomarker {
  name: string;
  value: number;
  unit: string;
  optimalRange: { min: number; max: number };
  longevityImplication: string;
  interpretation: string;
}

export interface EpigeneticAge {
  horvathAge: number;
  hanumAge: number;
  phenoAge: number;
  grimAge: number;
  dunedinPACE: number;
  interpretation: string;
}

export interface LongevityIntervention {
  id: string;
  name: string;
  category: 'pharmaceutical' | 'supplement' | 'lifestyle' | 'advanced_therapy';
  description: string;
  mechanism: string;
  evidenceLevel: 'preclinical' | 'early_clinical' | 'established' | 'gold_standard';
  potentialBenefit: string;
  risks: string[];
  cost: number;
  availability: string;
  protocol: InterventionProtocol;
  monitoring: string[];
  personalizedScore: number;
}

export interface InterventionProtocol {
  dosage?: string;
  frequency: string;
  timing: string;
  duration: string;
  combinationsWith: string[];
  contraindications: string[];
}

export interface LongevityTrend {
  date: Date;
  biologicalAge: number;
  longevityScore: number;
  keyMetrics: Record<string, number>;
  interventionsActive: string[];
}

export interface CuttingEdgeTherapy {
  name: string;
  description: string;
  stage: 'research' | 'clinical_trials' | 'early_access' | 'available';
  mechanism: string;
  potentialImpact: string;
  timeline: string;
  cost: string;
  availability: string;
  eligibilityCriteria: string[];
}

// ========================================
// 5. EMPLOYER HEALTH COMMAND CENTER
// ========================================

export interface EmployerHealthDashboard {
  employerId: string;
  companyName: string;
  employeeCount: number;
  lastUpdated: Date;

  // Aggregate health metrics
  overallHealthScore: number;
  riskDistribution: RiskDistribution;
  chronicConditionPrevalence: ConditionPrevalence[];

  // Financial impact
  healthcareCosts: HealthcareCostMetrics;
  productivityMetrics: ProductivityMetrics;
  roiAnalysis: ROIAnalysis;

  // Population insights
  demographicBreakdown: DemographicBreakdown;
  engagementMetrics: EngagementMetrics;
  programEffectiveness: ProgramEffectiveness[];

  // Predictive analytics
  futureRiskPredictions: FutureRiskPrediction[];
  costProjections: CostProjection[];
  interventionOpportunities: InterventionOpportunity[];

  // Compliance and privacy
  privacyCompliance: PrivacyCompliance;
  aggregationLevel: 'company' | 'department' | 'team';
}

export interface RiskDistribution {
  low: number;
  moderate: number;
  high: number;
  critical: number;
  breakdown: RiskBreakdown[];
}

export interface RiskBreakdown {
  category: string;
  count: number;
  percentage: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface ConditionPrevalence {
  condition: string;
  prevalence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  costImpact: number;
  productivityImpact: string;
}

export interface HealthcareCostMetrics {
  totalAnnualCost: number;
  costPerEmployee: number;
  preventableCosts: number;
  highCostClaimants: number;
  costByCategory: Record<string, number>;
  yearOverYearChange: number;
  benchmarkComparison: BenchmarkComparison;
}

export interface BenchmarkComparison {
  industryAverage: number;
  yourCompany: number;
  percentile: number;
  potentialSavings: number;
}

export interface ProductivityMetrics {
  averageSickDays: number;
  presenteeismRate: number;
  absenteeismCost: number;
  productivityLoss: number;
  mentalHealthImpact: number;
  workplaceInjuries: number;
}

export interface ROIAnalysis {
  programInvestment: number;
  measuredSavings: number;
  roi: number;
  paybackPeriod: string;
  intangibleBenefits: string[];
}

export interface DemographicBreakdown {
  ageDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
}

export interface EngagementMetrics {
  platformAdoptionRate: number;
  activeUsers: number;
  averageSessionDuration: number;
  featureUtilization: Record<string, number>;
  programParticipation: Record<string, number>;
  satisfactionScore: number;
}

export interface ProgramEffectiveness {
  programName: string;
  participation: number;
  completion: number;
  healthOutcomeImprovement: number;
  costSavings: number;
  engagement: number;
  recommendations: string[];
}

export interface FutureRiskPrediction {
  riskType: string;
  currentCount: number;
  predicted6Month: number;
  predicted12Month: number;
  predicted24Month: number;
  preventionOpportunities: string[];
  potentialCostAvoidance: number;
}

export interface CostProjection {
  year: number;
  projectedCost: number;
  costWithInterventions: number;
  potentialSavings: number;
  confidence: number;
}

export interface InterventionOpportunity {
  id: string;
  title: string;
  targetPopulation: string;
  estimatedImpact: {
    healthImprovement: string;
    costSavings: number;
    productivityGain: string;
  };
  implementation: {
    cost: number;
    timeline: string;
    resources: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PrivacyCompliance {
  deidentificationLevel: string;
  minimumGroupSize: number;
  dataRetentionPolicy: string;
  employeeConsent: number; // percentage
  regulatoryCompliance: string[];
}

// ========================================
// 6. HEALTHCARE PROVIDER PERFORMANCE INTELLIGENCE
// ========================================

export interface ProviderPerformanceProfile {
  providerId: string;
  providerName: string;
  specialty: string;
  lastUpdated: Date;

  // Performance metrics
  qualityMetrics: QualityMetrics;
  efficiencyMetrics: EfficiencyMetrics;
  patientOutcomes: PatientOutcomeMetrics;
  financialPerformance: FinancialPerformance;

  // Comparative analysis
  peerComparison: PeerComparison;
  benchmarks: Benchmark[];

  // Improvement opportunities
  improvementAreas: ImprovementArea[];
  bestPractices: BestPractice[];

  // Error prevention
  errorAnalysis: ErrorAnalysis;
  safetyScore: number;
}

export interface QualityMetrics {
  overallQualityScore: number;
  clinicalOutcomes: number;
  patientSafety: number;
  evidenceBasedPractice: number;
  appropriateness: number;
  effectiveness: number;
  trends: MetricTrend[];
}

export interface MetricTrend {
  metric: string;
  values: Array<{ date: Date; value: number }>;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EfficiencyMetrics {
  patientThroughput: number;
  averageVisitDuration: number;
  documentationTime: number;
  noShowRate: number;
  cancellationRate: number;
  utilizationRate: number;
  referralPatterns: ReferralPattern[];
}

export interface ReferralPattern {
  specialty: string;
  referralRate: number;
  appropriateness: number;
  followUpCompliance: number;
}

export interface PatientOutcomeMetrics {
  overallOutcomeScore: number;
  readmissionRate: number;
  complicationRate: number;
  mortalityRate: number;
  functionalImprovement: number;
  qualityOfLifeImprovement: number;
  patientSatisfaction: number;
}

export interface FinancialPerformance {
  revenuePerVisit: number;
  collectionRate: number;
  denialRate: number;
  codingAccuracy: number;
  missedBillingOpportunities: number;
  potentialRevenueIncrease: number;
  costEfficiency: number;
}

export interface PeerComparison {
  percentileRanking: number;
  comparisonGroup: string;
  topPerformers: PerformanceGap[];
  areasForImprovement: PerformanceGap[];
}

export interface PerformanceGap {
  metric: string;
  yourScore: number;
  peerAverage: number;
  topQuartile: number;
  gap: number;
  improvementPotential: string;
}

export interface Benchmark {
  metric: string;
  target: number;
  current: number;
  status: 'below' | 'meeting' | 'exceeding';
  source: string;
}

export interface ImprovementArea {
  area: string;
  currentPerformance: number;
  targetPerformance: number;
  potentialImpact: string;
  recommendations: string[];
  resources: string[];
  estimatedTimeframe: string;
}

export interface BestPractice {
  practice: string;
  description: string;
  evidence: string;
  implementationGuide: string;
  expectedBenefit: string;
  adoptionRate: number;
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorsByType: ErrorByType[];
  nearMisses: number;
  rootCauseAnalysis: RootCauseAnalysis[];
  preventionStrategies: string[];
  systemicIssues: string[];
}

export interface ErrorByType {
  errorType: string;
  count: number;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  trend: 'increasing' | 'stable' | 'decreasing';
  commonScenarios: string[];
}

export interface RootCauseAnalysis {
  error: string;
  rootCauses: string[];
  contributingFactors: string[];
  preventionRecommendations: string[];
  systemChangesNeeded: string[];
}

// ========================================
// 7. GLOBAL AI HEALTH NETWORK (FEDERATED LEARNING)
// ========================================

export interface FederatedHealthNetwork {
  networkId: string;
  networkName: string;
  participatingInstitutions: number;
  totalPatients: number;
  lastSyncDate: Date;

  // Network health
  networkHealth: NetworkHealth;

  // Models
  globalModels: GlobalAIModel[];
  localModels: LocalAIModel[];

  // Performance
  modelPerformance: ModelPerformance;

  // Contributions
  contributionMetrics: ContributionMetrics;
  dataQuality: DataQualityMetrics;

  // Privacy and security
  privacyMetrics: PrivacyMetrics;
  encryptionStatus: EncryptionStatus;
}

export interface NetworkHealth {
  status: 'healthy' | 'degraded' | 'critical';
  activeNodes: number;
  syncLatency: number;
  dataFreshness: number;
  consensusRate: number;
}

export interface GlobalAIModel {
  modelId: string;
  modelName: string;
  modelType: string;
  version: string;
  accuracy: number;
  participants: number;
  trainingRounds: number;
  lastUpdate: Date;
  performance: Record<string, number>;
}

export interface LocalAIModel {
  modelId: string;
  localVersion: string;
  lastSync: Date;
  localAccuracy: number;
  localDataPoints: number;
  contributionWeight: number;
}

export interface ModelPerformance {
  overallAccuracy: number;
  precison: number;
  recall: number;
  f1Score: number;
  auc: number;
  performanceByDemographic: Record<string, number>;
  fairnessMetrics: FairnessMetrics;
}

export interface FairnessMetrics {
  demographicParity: number;
  equalOpportunity: number;
  equalizdOdds: number;
  biasDetected: string[];
  mitigationStrategies: string[];
}

export interface ContributionMetrics {
  dataPointsContributed: number;
  modelUpdatesContributed: number;
  qualityScore: number;
  diversityScore: number;
  contributionRank: number;
  rewards: RewardMetrics;
}

export interface RewardMetrics {
  creditsEarned: number;
  premiumAccess: string[];
  recognitionLevel: string;
  benefits: string[];
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  representativeness: number;
  overallScore: number;
}

export interface PrivacyMetrics {
  differentialPrivacyLevel: number;
  privacyBudget: number;
  reidentificationRisk: number;
  dataLeakageScore: number;
  complianceStatus: Record<string, boolean>;
}

export interface EncryptionStatus {
  encryptionMethod: string;
  keyStrength: number;
  dataInTransit: boolean;
  dataAtRest: boolean;
  homomorphicEncryption: boolean;
}

// ========================================
// 8. PREDICTIVE HEALTH INSURANCE PLATFORM
// ========================================

export interface PredictiveInsuranceProfile {
  policyId: string;
  userId: string;
  policyType: 'individual' | 'family' | 'employer';
  effectiveDate: Date;

  // Risk assessment
  dynamicRiskScore: number;
  riskTrend: 'improving' | 'stable' | 'increasing';
  riskFactors: RiskFactor[];

  // Premium calculation
  basePremium: number;
  riskAdjustment: number;
  wellnessDiscount: number;
  finalPremium: number;
  savingsVsTraditional: number;

  // Wellness incentives
  wellnessPrograms: WellnessProgram[];
  earnedRewards: EarnedReward[];
  potentialSavings: number;

  // Prevention focus
  preventionPlan: PreventionPlan;
  earlyInterventions: EarlyIntervention[];

  // Claims prediction
  predictedClaims: ClaimPrediction[];
  preventableCosts: number;
}

export interface RiskFactor {
  factor: string;
  category: 'modifiable' | 'non-modifiable';
  impact: number;
  trend: 'improving' | 'stable' | 'worsening';
  interventionAvailable: boolean;
  interventions: string[];
}

export interface WellnessProgram {
  programId: string;
  name: string;
  category: 'fitness' | 'nutrition' | 'mental_health' | 'preventive_care';
  participation: 'enrolled' | 'completed' | 'in_progress';
  incentive: number;
  deadline?: Date;
  progress: number;
}

export interface EarnedReward {
  rewardId: string;
  achievement: string;
  date: Date;
  value: number;
  type: 'premium_reduction' | 'cash' | 'gift_card' | 'service';
}

export interface PreventionPlan {
  priorityScreenings: Screening[];
  vaccinationSchedule: Vaccination[];
  lifestyleGoals: LifestyleGoal[];
  monitoringSchedule: MonitoringSchedule[];
}

export interface Screening {
  screening: string;
  dueDate: Date;
  importance: 'routine' | 'recommended' | 'critical';
  covered: boolean;
  location: string;
}

export interface Vaccination {
  vaccine: string;
  dueDate: Date;
  status: 'due' | 'overdue' | 'completed';
  covered: boolean;
}

export interface LifestyleGoal {
  goal: string;
  target: string;
  current: string;
  deadline: Date;
  incentive: number;
}

export interface MonitoringSchedule {
  metric: string;
  frequency: string;
  lastCheck: Date;
  nextCheck: Date;
  method: string;
}

export interface EarlyIntervention {
  condition: string;
  riskLevel: number;
  intervention: string;
  timing: string;
  costSavings: number;
  covered: boolean;
}

export interface ClaimPrediction {
  predictedCondition: string;
  probability: number;
  predictedCost: number;
  preventable: boolean;
  preventionCost: number;
  netSavings: number;
  recommendedActions: string[];
}

// Additional supporting types for all features

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}
