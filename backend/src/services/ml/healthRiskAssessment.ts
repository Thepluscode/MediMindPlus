/**
 * AI Health Risk Assessment Service
 * Implements 5 core disease prediction models for MVP
 *
 * Models:
 * 1. Type 2 Diabetes Risk Assessment
 * 2. Cardiovascular Disease Risk (Framingham Score)
 * 3. Hypertension Early Detection
 * 4. Mental Health Risk Assessment (PHQ-9/GAD-7)
 * 5. Cancer Screening Recommendations
 */

import { getKnex } from '../../config/knex';

// Types
export interface UserHealthData {
  userId: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bmi: number;
  weight: number;
  height: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  cholesterol?: {
    total: number;
    hdl: number;
    ldl: number;
  };
  fastingGlucose?: number;
  a1c?: number;
  smokingStatus: 'NEVER' | 'FORMER' | 'CURRENT';
  alcoholConsumption: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY';
  exerciseMinutesPerWeek: number;
  familyHistory: string[];
  medications: string[];
  // Mental health
  phq9Score?: number;
  gad7Score?: number;
  sleepHoursPerNight?: number;
  stressLevel?: number; // 1-10
}

export interface RiskAssessment {
  disease: string;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  probability: number; // 0-1 (probability over timeframe)
  timeframe: string; // e.g., '5 years', '10 years'
  recommendations: string[];
  nextScreening?: Date;
  details: Record<string, any>;
}

export interface ComprehensiveRiskReport {
  userId: string;
  generatedAt: Date;
  overallRiskScore: number;
  assessments: RiskAssessment[];
  topRisks: RiskAssessment[];
  actionableInsights: string[];
  screeningSchedule: ScreeningRecommendation[];
}

export interface ScreeningRecommendation {
  test: string;
  reason: string;
  urgency: 'ROUTINE' | 'SOON' | 'URGENT';
  recommendedDate: Date;
  frequency: string;
}

/**
 * Health Risk Assessment Service
 */
export class HealthRiskAssessmentService {
  private knex = getKnex();
  private healthDataIntegration: any; // Will be imported dynamically

  /**
   * Get user health data from database - now integrates wearable data
   */
  private async getUserHealthData(userId: string): Promise<UserHealthData> {
    // Use the new Health Data Integration service if available
    // This combines wearable data + health profiles for more accurate assessments
    try {
      const { HealthDataIntegrationService } = await import('../integration/HealthDataIntegration');
      const integrationService = new HealthDataIntegrationService();
      return await integrationService.getComprehensiveHealthData(userId);
    } catch (error) {
      // Fallback to legacy method if integration service unavailable
      return this.getLegacyHealthData(userId);
    }
  }

  /**
   * Legacy health data getter (fallback when wearable data not available)
   */
  private async getLegacyHealthData(userId: string): Promise<UserHealthData> {
    // Get user basic info
    const user = await this.knex('users')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Get health profile (assuming a health_profiles table exists)
    const healthProfile = await this.knex('health_profiles')
      .where({ userId })
      .first();

    // Get latest vitals
    const latestVitals = await this.knex('vital_signs')
      .where({ userId })
      .orderBy('recordedDate', 'desc')
      .first();

    // Get lab results
    const latestLabs = await this.knex('lab_results')
      .where({ userId })
      .orderBy('testDate', 'desc')
      .first();

    // Combine data
    return {
      userId,
      age: this.calculateAge(healthProfile?.dateOfBirth || new Date('1990-01-01')),
      gender: healthProfile?.gender || 'OTHER',
      bmi: latestVitals?.bmi || this.calculateBMI(latestVitals?.weight, latestVitals?.height),
      weight: latestVitals?.weight || 70,
      height: latestVitals?.height || 170,
      bloodPressure: latestVitals?.bloodPressure || {
        systolic: 120,
        diastolic: 80
      },
      cholesterol: latestLabs?.cholesterol || {
        total: 180,
        hdl: 50,
        ldl: 100
      },
      fastingGlucose: latestLabs?.fastingGlucose || 95,
      a1c: latestLabs?.a1c || 5.5,
      smokingStatus: healthProfile?.smokingStatus || 'NEVER',
      alcoholConsumption: healthProfile?.alcoholConsumption || 'LIGHT',
      exerciseMinutesPerWeek: healthProfile?.exerciseMinutesPerWeek || 150,
      familyHistory: healthProfile?.familyHistory || [],
      medications: healthProfile?.medications || [],
      phq9Score: healthProfile?.phq9Score,
      gad7Score: healthProfile?.gad7Score,
      sleepHoursPerNight: healthProfile?.sleepHoursPerNight || 7,
      stressLevel: healthProfile?.stressLevel || 5
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calculate BMI
   */
  private calculateBMI(weight: number, height: number): number {
    return weight / ((height / 100) ** 2);
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (score < 25) return 'LOW';
    if (score < 50) return 'MODERATE';
    if (score < 75) return 'HIGH';
    return 'CRITICAL';
  }

  // ============================================================================
  // MODEL 1: Type 2 Diabetes Risk Assessment
  // ============================================================================

  async predictDiabetesRisk(userId: string): Promise<RiskAssessment> {
    const userData = await this.getUserHealthData(userId);

    let riskScore = 0;
    const details: Record<string, any> = {};

    // Age factor (max 20 points)
    if (userData.age >= 45) {
      riskScore += 15;
      details.ageRisk = 'HIGH';
    } else if (userData.age >= 35) {
      riskScore += 10;
      details.ageRisk = 'MODERATE';
    }

    // BMI factor (max 25 points)
    if (userData.bmi >= 30) {
      riskScore += 25;
      details.bmiRisk = 'HIGH';
    } else if (userData.bmi >= 25) {
      riskScore += 15;
      details.bmiRisk = 'MODERATE';
    }

    // Family history (20 points)
    if (userData.familyHistory.includes('diabetes') ||
        userData.familyHistory.includes('type_2_diabetes')) {
      riskScore += 20;
      details.familyHistoryRisk = 'PRESENT';
    }

    // Fasting glucose (20 points)
    if (userData.fastingGlucose && userData.fastingGlucose >= 100) {
      riskScore += userData.fastingGlucose >= 126 ? 20 : 15;
      details.glucoseRisk = 'ELEVATED';
    }

    // A1C (20 points)
    if (userData.a1c && userData.a1c >= 5.7) {
      riskScore += userData.a1c >= 6.5 ? 20 : 15;
      details.a1cRisk = 'ELEVATED';
    }

    // Physical activity (10 points if insufficient)
    if (userData.exerciseMinutesPerWeek < 150) {
      riskScore += 10;
      details.activityRisk = 'INSUFFICIENT';
    }

    // Hypertension (10 points)
    if (userData.bloodPressure && userData.bloodPressure.systolic >= 140) {
      riskScore += 10;
      details.hypertensionRisk = 'PRESENT';
    }

    const finalScore = Math.min(riskScore, 100);
    const probability = this.scoreToProbability(finalScore);

    return {
      disease: 'TYPE_2_DIABETES',
      riskScore: finalScore,
      riskLevel: this.getRiskLevel(finalScore),
      probability,
      timeframe: '5 years',
      recommendations: this.getDiabetesRecommendations(finalScore, userData),
      nextScreening: this.calculateNextScreeningDate(finalScore),
      details
    };
  }

  private getDiabetesRecommendations(score: number, userData: UserHealthData): string[] {
    const recommendations: string[] = [];

    if (score >= 50) {
      recommendations.push('Schedule an appointment with your doctor immediately for diabetes screening');
      recommendations.push('Get A1C and fasting glucose tests within 2 weeks');
    } else if (score >= 25) {
      recommendations.push('Schedule diabetes screening within 3 months');
    }

    if (userData.bmi >= 25) {
      recommendations.push(`Weight management: Current BMI is ${userData.bmi.toFixed(1)}, target BMI < 25`);
      recommendations.push('Aim to lose 5-10% of current body weight');
    }

    if (userData.exerciseMinutesPerWeek < 150) {
      recommendations.push('Increase physical activity to at least 150 minutes per week');
      recommendations.push('Start with 30 minutes of brisk walking 5 days per week');
    }

    recommendations.push('Follow a low-carbohydrate, high-fiber diet');
    recommendations.push('Monitor blood sugar levels regularly');

    return recommendations;
  }

  // ============================================================================
  // MODEL 2: Cardiovascular Disease Risk (Framingham Score)
  // ============================================================================

  async predictCardiovascularRisk(userId: string): Promise<RiskAssessment> {
    const userData = await this.getUserHealthData(userId);

    let riskScore = 0;
    const details: Record<string, any> = {};

    // Age (max 30 points)
    if (userData.age >= 70) {
      riskScore += 30;
    } else if (userData.age >= 60) {
      riskScore += 25;
    } else if (userData.age >= 50) {
      riskScore += 20;
    } else if (userData.age >= 40) {
      riskScore += 15;
    }

    // Total cholesterol (max 20 points)
    if (userData.cholesterol) {
      if (userData.cholesterol.total >= 280) {
        riskScore += 20;
        details.cholesterolRisk = 'HIGH';
      } else if (userData.cholesterol.total >= 240) {
        riskScore += 15;
        details.cholesterolRisk = 'MODERATE';
      }
    }

    // HDL cholesterol (protective - subtract points)
    if (userData.cholesterol && userData.cholesterol.hdl >= 60) {
      riskScore -= 5; // HDL is protective
      details.hdlProtection = 'HIGH';
    } else if (userData.cholesterol && userData.cholesterol.hdl < 40) {
      riskScore += 10;
      details.hdlRisk = 'LOW';
    }

    // Smoking (20 points)
    if (userData.smokingStatus === 'CURRENT') {
      riskScore += 20;
      details.smokingRisk = 'CURRENT_SMOKER';
    } else if (userData.smokingStatus === 'FORMER') {
      riskScore += 5;
      details.smokingRisk = 'FORMER_SMOKER';
    }

    // Blood pressure (20 points)
    if (userData.bloodPressure) {
      if (userData.bloodPressure.systolic >= 160) {
        riskScore += 20;
        details.bpRisk = 'STAGE_2_HYPERTENSION';
      } else if (userData.bloodPressure.systolic >= 140) {
        riskScore += 15;
        details.bpRisk = 'STAGE_1_HYPERTENSION';
      } else if (userData.bloodPressure.systolic >= 130) {
        riskScore += 10;
        details.bpRisk = 'ELEVATED';
      }
    }

    // Diabetes (15 points)
    if (userData.familyHistory.includes('diabetes') ||
        (userData.a1c && userData.a1c >= 6.5)) {
      riskScore += 15;
      details.diabetesRisk = 'PRESENT';
    }

    const finalScore = Math.min(Math.max(riskScore, 0), 100);
    const probability = this.scoreToProbability(finalScore);

    return {
      disease: 'CARDIOVASCULAR_DISEASE',
      riskScore: finalScore,
      riskLevel: this.getRiskLevel(finalScore),
      probability,
      timeframe: '10 years',
      recommendations: this.getCardiovascularRecommendations(finalScore, userData),
      nextScreening: this.calculateNextScreeningDate(finalScore),
      details
    };
  }

  private getCardiovascularRecommendations(score: number, userData: UserHealthData): string[] {
    const recommendations: string[] = [];

    if (score >= 50) {
      recommendations.push('URGENT: Schedule cardiology consultation within 1 week');
      recommendations.push('Get complete cardiovascular workup: ECG, stress test, lipid panel');
    } else if (score >= 25) {
      recommendations.push('Schedule cardiovascular screening within 1 month');
    }

    if (userData.smokingStatus === 'CURRENT') {
      recommendations.push('CRITICAL: Stop smoking immediately - this is your #1 risk factor');
      recommendations.push('Join smoking cessation program');
    }

    if (userData.cholesterol && userData.cholesterol.total >= 240) {
      recommendations.push('Start cholesterol-lowering diet (Mediterranean diet recommended)');
      recommendations.push('Consider statin therapy - discuss with your doctor');
    }

    if (userData.bloodPressure && userData.bloodPressure.systolic >= 140) {
      recommendations.push('Monitor blood pressure daily');
      recommendations.push('Reduce sodium intake to < 2000mg per day');
    }

    recommendations.push('Exercise at least 150 minutes per week (aerobic exercise)');
    recommendations.push('Maintain healthy weight (BMI 18.5-24.9)');
    recommendations.push('Take low-dose aspirin daily (if doctor recommends)');

    return recommendations;
  }

  // ============================================================================
  // MODEL 3: Hypertension Early Detection
  // ============================================================================

  async predictHypertensionRisk(userId: string): Promise<RiskAssessment> {
    const userData = await this.getUserHealthData(userId);

    let riskScore = 0;
    const details: Record<string, any> = {};

    // Current blood pressure readings (max 40 points)
    if (userData.bloodPressure) {
      const systolic = userData.bloodPressure.systolic;
      const diastolic = userData.bloodPressure.diastolic;

      if (systolic >= 180 || diastolic >= 120) {
        riskScore += 40;
        details.currentBP = 'HYPERTENSIVE_CRISIS';
      } else if (systolic >= 140 || diastolic >= 90) {
        riskScore += 30;
        details.currentBP = 'STAGE_2_HYPERTENSION';
      } else if (systolic >= 130 || diastolic >= 80) {
        riskScore += 20;
        details.currentBP = 'STAGE_1_HYPERTENSION';
      } else if (systolic >= 120 || diastolic >= 80) {
        riskScore += 10;
        details.currentBP = 'ELEVATED';
      }
    }

    // Age (15 points)
    if (userData.age >= 65) riskScore += 15;
    else if (userData.age >= 45) riskScore += 10;

    // BMI (15 points)
    if (userData.bmi >= 30) {
      riskScore += 15;
      details.obesityRisk = 'OBESE';
    } else if (userData.bmi >= 25) {
      riskScore += 10;
      details.obesityRisk = 'OVERWEIGHT';
    }

    // Family history (15 points)
    if (userData.familyHistory.includes('hypertension') ||
        userData.familyHistory.includes('cardiovascular')) {
      riskScore += 15;
      details.familyHistoryRisk = 'PRESENT';
    }

    // Lifestyle factors (15 points total)
    if (userData.exerciseMinutesPerWeek < 150) {
      riskScore += 8;
      details.inactivityRisk = 'INSUFFICIENT_EXERCISE';
    }

    if (userData.alcoholConsumption === 'HEAVY' || userData.alcoholConsumption === 'MODERATE') {
      riskScore += 7;
      details.alcoholRisk = 'EXCESSIVE';
    }

    const finalScore = Math.min(riskScore, 100);
    const probability = this.scoreToProbability(finalScore);

    return {
      disease: 'HYPERTENSION',
      riskScore: finalScore,
      riskLevel: this.getRiskLevel(finalScore),
      probability,
      timeframe: '3 years',
      recommendations: this.getHypertensionRecommendations(finalScore, userData),
      nextScreening: this.calculateNextScreeningDate(finalScore),
      details
    };
  }

  private getHypertensionRecommendations(score: number, userData: UserHealthData): string[] {
    const recommendations: string[] = [];

    if (userData.bloodPressure) {
      if (userData.bloodPressure.systolic >= 180) {
        recommendations.push('EMERGENCY: Seek immediate medical attention - hypertensive crisis');
      } else if (userData.bloodPressure.systolic >= 140) {
        recommendations.push('Schedule doctor appointment this week to discuss blood pressure medication');
      }
    }

    recommendations.push('Monitor blood pressure daily at home');
    recommendations.push('Reduce sodium intake to less than 1500mg per day');
    recommendations.push('DASH diet: Focus on fruits, vegetables, whole grains, lean proteins');

    if (userData.bmi >= 25) {
      recommendations.push('Lose weight: Target 5-10% reduction in body weight');
    }

    recommendations.push('Limit alcohol to 1 drink/day (women) or 2 drinks/day (men)');
    recommendations.push('Exercise 30 minutes daily, 5 days per week');
    recommendations.push('Practice stress reduction: meditation, yoga, deep breathing');

    return recommendations;
  }

  // ============================================================================
  // MODEL 4: Mental Health Risk Assessment
  // ============================================================================

  async predictMentalHealthRisk(userId: string): Promise<RiskAssessment> {
    const userData = await this.getUserHealthData(userId);

    let riskScore = 0;
    const details: Record<string, any> = {};

    // PHQ-9 Score (Depression screening) - max 40 points
    if (userData.phq9Score !== undefined) {
      if (userData.phq9Score >= 20) {
        riskScore += 40;
        details.depressionSeverity = 'SEVERE';
      } else if (userData.phq9Score >= 15) {
        riskScore += 30;
        details.depressionSeverity = 'MODERATELY_SEVERE';
      } else if (userData.phq9Score >= 10) {
        riskScore += 20;
        details.depressionSeverity = 'MODERATE';
      } else if (userData.phq9Score >= 5) {
        riskScore += 10;
        details.depressionSeverity = 'MILD';
      }
    }

    // GAD-7 Score (Anxiety screening) - max 30 points
    if (userData.gad7Score !== undefined) {
      if (userData.gad7Score >= 15) {
        riskScore += 30;
        details.anxietySeverity = 'SEVERE';
      } else if (userData.gad7Score >= 10) {
        riskScore += 20;
        details.anxietySeverity = 'MODERATE';
      } else if (userData.gad7Score >= 5) {
        riskScore += 10;
        details.anxietySeverity = 'MILD';
      }
    }

    // Sleep (15 points)
    if (userData.sleepHoursPerNight && userData.sleepHoursPerNight < 6) {
      riskScore += 15;
      details.sleepRisk = 'INSUFFICIENT';
    } else if (userData.sleepHoursPerNight && userData.sleepHoursPerNight < 7) {
      riskScore += 8;
      details.sleepRisk = 'SUBOPTIMAL';
    }

    // Stress level (15 points)
    if (userData.stressLevel && userData.stressLevel >= 8) {
      riskScore += 15;
      details.stressRisk = 'HIGH';
    } else if (userData.stressLevel && userData.stressLevel >= 6) {
      riskScore += 10;
      details.stressRisk = 'MODERATE';
    }

    const finalScore = Math.min(riskScore, 100);
    const probability = this.scoreToProbability(finalScore);

    return {
      disease: 'MENTAL_HEALTH_DISORDER',
      riskScore: finalScore,
      riskLevel: this.getRiskLevel(finalScore),
      probability,
      timeframe: 'Current',
      recommendations: this.getMentalHealthRecommendations(finalScore, userData),
      nextScreening: this.calculateNextScreeningDate(finalScore),
      details
    };
  }

  private getMentalHealthRecommendations(score: number, userData: UserHealthData): string[] {
    const recommendations: string[] = [];

    if (score >= 75) {
      recommendations.push('URGENT: Contact mental health crisis line immediately (988 in US)');
      recommendations.push('Schedule emergency psychiatric evaluation within 24 hours');
      recommendations.push('Do not be alone - reach out to trusted friend or family member');
    } else if (score >= 50) {
      recommendations.push('Schedule appointment with psychiatrist or therapist this week');
      recommendations.push('Consider medication evaluation');
    } else if (score >= 25) {
      recommendations.push('Schedule mental health screening with your doctor');
      recommendations.push('Consider therapy/counseling');
    }

    recommendations.push('Practice daily mindfulness or meditation (10-15 minutes)');
    recommendations.push('Maintain regular sleep schedule (7-9 hours per night)');
    recommendations.push('Exercise 30 minutes daily - proven to reduce depression/anxiety');
    recommendations.push('Limit alcohol and caffeine consumption');
    recommendations.push('Join support group or community activities');

    if (userData.sleepHoursPerNight && userData.sleepHoursPerNight < 7) {
      recommendations.push('Improve sleep hygiene: consistent bedtime, dark room, no screens 1 hour before bed');
    }

    return recommendations;
  }

  // ============================================================================
  // MODEL 5: Cancer Screening Recommendations
  // ============================================================================

  async getCancerScreeningRecommendations(userId: string): Promise<RiskAssessment> {
    const userData = await this.getUserHealthData(userId);

    let riskScore = 0;
    const details: Record<string, any> = {
      recommendedScreenings: []
    };

    // Age-based risk factors
    if (userData.age >= 50) {
      riskScore += 20;
      details.ageRisk = 'INCREASED_SCREENING_RECOMMENDED';
    }

    // Family history (30 points)
    const cancerHistory = userData.familyHistory.filter(h =>
      h.includes('cancer') || h.includes('carcinoma') || h.includes('tumor')
    );
    if (cancerHistory.length > 0) {
      riskScore += 30;
      details.familyHistoryRisk = 'POSITIVE';
      details.cancerTypes = cancerHistory;
    }

    // Smoking (major risk factor)
    if (userData.smokingStatus === 'CURRENT') {
      riskScore += 25;
      details.smokingRisk = 'CURRENT_SMOKER';
      details.recommendedScreenings.push('Lung cancer screening (low-dose CT)');
    } else if (userData.smokingStatus === 'FORMER') {
      riskScore += 15;
      details.smokingRisk = 'FORMER_SMOKER';
    }

    // Gender-specific screenings
    if (userData.gender === 'FEMALE') {
      if (userData.age >= 40) {
        details.recommendedScreenings.push('Mammogram (breast cancer) - annually');
      }
      if (userData.age >= 21) {
        details.recommendedScreenings.push('Pap smear (cervical cancer) - every 3 years');
      }
    }

    if (userData.gender === 'MALE') {
      if (userData.age >= 50) {
        details.recommendedScreenings.push('PSA test (prostate cancer) - discuss with doctor');
      }
    }

    // Universal screenings
    if (userData.age >= 45) {
      details.recommendedScreenings.push('Colonoscopy (colorectal cancer) - every 10 years');
      details.recommendedScreenings.push('Fecal occult blood test - annually');
    }

    if (userData.age >= 55 && userData.smokingStatus !== 'NEVER') {
      details.recommendedScreenings.push('Lung cancer screening - annually');
    }

    // Skin cancer risk
    details.recommendedScreenings.push('Annual skin examination by dermatologist');
    details.recommendedScreenings.push('Monthly self-examination for new or changing moles');

    const finalScore = Math.min(riskScore, 100);

    return {
      disease: 'CANCER',
      riskScore: finalScore,
      riskLevel: this.getRiskLevel(finalScore),
      probability: this.scoreToProbability(finalScore),
      timeframe: 'Lifetime',
      recommendations: this.getCancerPreventionRecommendations(userData),
      nextScreening: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      details
    };
  }

  private getCancerPreventionRecommendations(userData: UserHealthData): string[] {
    const recommendations: string[] = [];

    if (userData.smokingStatus === 'CURRENT') {
      recommendations.push('CRITICAL: Stop smoking - single most important cancer prevention step');
    }

    recommendations.push('Eat diet rich in fruits, vegetables, whole grains');
    recommendations.push('Limit processed meats and red meat consumption');
    recommendations.push('Maintain healthy weight (BMI 18.5-24.9)');
    recommendations.push('Limit alcohol consumption');
    recommendations.push('Protect skin from sun exposure - use SPF 30+ sunscreen daily');
    recommendations.push('Stay physically active - at least 150 minutes per week');
    recommendations.push('Get vaccinated: HPV (cervical cancer), Hepatitis B (liver cancer)');
    recommendations.push('Follow all age-appropriate cancer screening guidelines');

    return recommendations;
  }

  // ============================================================================
  // COMPREHENSIVE RISK REPORT
  // ============================================================================

  async getComprehensiveRiskReport(userId: string): Promise<ComprehensiveRiskReport> {
    // Run all risk assessments in parallel
    const [diabetes, cardiovascular, hypertension, mentalHealth, cancer] = await Promise.all([
      this.predictDiabetesRisk(userId),
      this.predictCardiovascularRisk(userId),
      this.predictHypertensionRisk(userId),
      this.predictMentalHealthRisk(userId),
      this.getCancerScreeningRecommendations(userId)
    ]);

    const assessments = [diabetes, cardiovascular, hypertension, mentalHealth, cancer];

    // Calculate overall risk score (weighted average)
    const overallRiskScore = Math.round(
      assessments.reduce((sum, assessment) => sum + assessment.riskScore, 0) / assessments.length
    );

    // Identify top 3 risks
    const topRisks = assessments
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(assessments);

    // Create screening schedule
    const screeningSchedule = this.generateScreeningSchedule(assessments);

    return {
      userId,
      generatedAt: new Date(),
      overallRiskScore,
      assessments,
      topRisks,
      actionableInsights,
      screeningSchedule
    };
  }

  private generateActionableInsights(assessments: RiskAssessment[]): string[] {
    const insights: string[] = [];

    // Find highest risk
    const highestRisk = assessments.reduce((max, assessment) =>
      assessment.riskScore > max.riskScore ? assessment : max
    );

    if (highestRisk.riskLevel === 'CRITICAL' || highestRisk.riskLevel === 'HIGH') {
      insights.push(`🚨 PRIORITY: ${highestRisk.disease} shows ${highestRisk.riskLevel} risk. Immediate action required.`);
    }

    // Check for multiple moderate risks
    const moderateRisks = assessments.filter(a => a.riskLevel === 'MODERATE' || a.riskLevel === 'HIGH');
    if (moderateRisks.length >= 3) {
      insights.push('⚠️ Multiple health risks detected. Comprehensive lifestyle changes recommended.');
    }

    // Common recommendations across multiple risks
    const allRecommendations = assessments.flatMap(a => a.recommendations);
    const exerciseRecs = allRecommendations.filter(r => r.toLowerCase().includes('exercise'));
    if (exerciseRecs.length >= 3) {
      insights.push('🏃 Exercise is beneficial for multiple identified risks. Start with 30 minutes daily.');
    }

    const weightRecs = allRecommendations.filter(r => r.toLowerCase().includes('weight') || r.toLowerCase().includes('bmi'));
    if (weightRecs.length >= 2) {
      insights.push('⚖️ Weight management would significantly reduce multiple health risks.');
    }

    insights.push('📅 Schedule annual comprehensive health checkup');
    insights.push('📊 Track your vital signs regularly to monitor improvements');

    return insights;
  }

  private generateScreeningSchedule(assessments: RiskAssessment[]): ScreeningRecommendation[] {
    const schedule: ScreeningRecommendation[] = [];

    assessments.forEach(assessment => {
      if (assessment.nextScreening) {
        let urgency: 'ROUTINE' | 'SOON' | 'URGENT' = 'ROUTINE';
        if (assessment.riskLevel === 'CRITICAL') urgency = 'URGENT';
        else if (assessment.riskLevel === 'HIGH') urgency = 'SOON';

        schedule.push({
          test: this.getScreeningTestName(assessment.disease),
          reason: `${assessment.disease} risk score: ${assessment.riskScore}`,
          urgency,
          recommendedDate: assessment.nextScreening,
          frequency: this.getScreeningFrequency(assessment.disease, assessment.riskLevel)
        });
      }
    });

    return schedule.sort((a, b) => {
      const urgencyOrder = { 'URGENT': 0, 'SOON': 1, 'ROUTINE': 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  private getScreeningTestName(disease: string): string {
    const testNames: Record<string, string> = {
      'TYPE_2_DIABETES': 'A1C and Fasting Glucose Test',
      'CARDIOVASCULAR_DISEASE': 'Lipid Panel and ECG',
      'HYPERTENSION': 'Blood Pressure Monitoring',
      'MENTAL_HEALTH_DISORDER': 'PHQ-9 and GAD-7 Assessment',
      'CANCER': 'Age-appropriate Cancer Screenings'
    };
    return testNames[disease] || 'General Health Screening';
  }

  private getScreeningFrequency(disease: string, riskLevel: string): string {
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      return 'Every 3 months';
    } else if (riskLevel === 'MODERATE') {
      return 'Every 6 months';
    }
    return 'Annually';
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Convert risk score (0-100) to probability (0-1)
   * Uses sigmoid function for smooth conversion
   */
  private scoreToProbability(score: number): number {
    // Sigmoid function: 1 / (1 + e^(-k*(x-50)))
    // k = 0.1 for smooth curve
    const k = 0.1;
    const probability = 1 / (1 + Math.exp(-k * (score - 50)));
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Calculate next screening date based on risk score
   */
  private calculateNextScreeningDate(riskScore: number): Date {
    let monthsUntilScreening = 12; // Default: 1 year

    if (riskScore >= 75) {
      monthsUntilScreening = 1; // 1 month for critical risk
    } else if (riskScore >= 50) {
      monthsUntilScreening = 3; // 3 months for high risk
    } else if (riskScore >= 25) {
      monthsUntilScreening = 6; // 6 months for moderate risk
    }

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + monthsUntilScreening);
    return nextDate;
  }
}

export default HealthRiskAssessmentService;