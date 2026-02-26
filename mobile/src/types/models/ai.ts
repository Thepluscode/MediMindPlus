export interface AIPrediction {
  id: string;
  userId: string;
  modelName: string;
  modelVersion: string;
  diseaseRisks: {
    cardiovascular_disease: number;
    diabetes_type2: number;
    hypertension: number;
    stroke: number;
    [key: string]: number;
  };
  overallRiskScore: number;
  confidenceLevel: number;
  riskFactors: string[];
  featureImportance: {
    systolic_bp: number;
    diastolic_bp: number;
    family_history: number;
    bmi: number;
    age: number;
    [key: string]: number;
  };
  inputDataSummary: {
    vital_signs_count: number;
    lab_results_count: number;
    genetic_markers_count: number;
    days_of_data: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  predictionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecommendation {
  id: string;
  userId: string;
  predictionId: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'medical';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  startDate: string;
  targetDate?: string;
  progressPercent: number;
  progressMetrics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceAnalysisResponse {
  transcription: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  healthIndicators: {
    symptomMentions: Array<{
      symptom: string;
      context: string;
      confidence: number;
    }>;
    potentialConditions: Array<{
      condition: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  timestamp: string;
}

export interface RiskPredictions {
  cardiovascular_disease: number;
  diabetes_type2: number;
  cancer_breast: number;
  cancer_lung: number;
  [key: string]: number;
}

export interface AIPredictionState {
  predictions: AIPrediction[];
  currentPrediction: AIPrediction | null;
  recommendations: HealthRecommendation[];
  isLoading: boolean;
  error: string | null;
}

export interface AIPredictionsState {
  predictions: RiskPredictions;
  voiceAnalysis: Partial<VoiceAnalysisResponse>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
