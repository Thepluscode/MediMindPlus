/**
 * Revolutionary Features API Routes
 * Comprehensive REST API for all 12 billion-dollar features
 */

import { Router } from 'express';
import { RevolutionaryFeaturesController } from '../controllers/RevolutionaryFeaturesController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const controller = new RevolutionaryFeaturesController();

// ========================================
// VIRTUAL HEALTH TWIN
// ========================================

/**
 * @route POST /api/v1/health-twin/create
 * @desc Create or update Virtual Health Twin for user
 * @access Private
 */
router.post(
  '/health-twin/create',
  authenticateToken,
  validateRequest,
  controller.createHealthTwin
);

/**
 * @route GET /api/v1/health-twin/:userId
 * @desc Get Virtual Health Twin for user
 * @access Private
 */
router.get(
  '/health-twin/:userId',
  authenticateToken,
  controller.getHealthTwin
);

/**
 * @route POST /api/v1/health-twin/:userId/simulate
 * @desc Run what-if simulation on Virtual Health Twin
 * @access Private
 */
router.post(
  '/health-twin/:userId/simulate',
  authenticateToken,
  validateRequest,
  controller.runSimulation
);

/**
 * @route GET /api/v1/health-twin/:userId/predictions
 * @desc Get treatment outcome predictions
 * @access Private
 */
router.get(
  '/health-twin/:userId/predictions',
  authenticateToken,
  controller.getTreatmentPredictions
);

/**
 * @route GET /api/v1/health-twin/:userId/lifestyle-impacts
 * @desc Get lifestyle intervention impact models
 * @access Private
 */
router.get(
  '/health-twin/:userId/lifestyle-impacts',
  authenticateToken,
  controller.getLifestyleImpacts
);

// ========================================
// MENTAL HEALTH CRISIS PREVENTION
// ========================================

/**
 * @route GET /api/v1/mental-health/crisis-assessment/:userId
 * @desc Assess mental health crisis risk
 * @access Private
 */
router.get(
  '/mental-health/crisis-assessment/:userId',
  authenticateToken,
  controller.assessCrisisRisk
);

/**
 * @route POST /api/v1/mental-health/intervention
 * @desc Recommend mental health interventions
 * @access Private
 */
router.post(
  '/mental-health/intervention',
  authenticateToken,
  validateRequest,
  controller.recommendIntervention
);

/**
 * @route GET /api/v1/mental-health/safety-plan/:userId
 * @desc Get personalized safety plan
 * @access Private
 */
router.get(
  '/mental-health/safety-plan/:userId',
  authenticateToken,
  controller.getSafetyPlan
);

/**
 * @route POST /api/v1/mental-health/track-progress
 * @desc Track intervention progress
 * @access Private
 */
router.post(
  '/mental-health/track-progress',
  authenticateToken,
  validateRequest,
  controller.trackMentalHealthProgress
);

/**
 * @route POST /api/v1/mental-health/emergency-alert
 * @desc Trigger emergency alert for severe cases
 * @access Private
 */
router.post(
  '/mental-health/emergency-alert',
  authenticateToken,
  validateRequest,
  controller.triggerEmergencyAlert
);

// ========================================
// GENOMIC-MICROBIOME-LIFESTYLE INTEGRATION
// ========================================

/**
 * @route POST /api/v1/omics/integrate
 * @desc Integrate genomic, microbiome, and lifestyle data
 * @access Private
 */
router.post(
  '/omics/integrate',
  authenticateToken,
  validateRequest,
  controller.integrateMultiOmics
);

/**
 * @route GET /api/v1/omics/:userId/profile
 * @desc Get complete multi-omics profile
 * @access Private
 */
router.get(
  '/omics/:userId/profile',
  authenticateToken,
  controller.getMultiOmicsProfile
);

/**
 * @route GET /api/v1/omics/:userId/recommendations
 * @desc Get personalized recommendations
 * @access Private
 */
router.get(
  '/omics/:userId/recommendations',
  authenticateToken,
  controller.getPersonalizedRecommendations
);

/**
 * @route POST /api/v1/omics/microbiome/order-kit
 * @desc Order microbiome testing kit
 * @access Private
 */
router.post(
  '/omics/microbiome/order-kit',
  authenticateToken,
  validateRequest,
  controller.orderMicrobiomeKit
);

/**
 * @route POST /api/v1/omics/genomic/upload
 * @desc Upload genomic data (23andMe, etc.)
 * @access Private
 */
router.post(
  '/omics/genomic/upload',
  authenticateToken,
  validateRequest,
  controller.uploadGenomicData
);

/**
 * @route GET /api/v1/omics/:userId/nutrition-plan
 * @desc Get personalized nutrition plan
 * @access Private
 */
router.get(
  '/omics/:userId/nutrition-plan',
  authenticateToken,
  controller.getPersonalizedNutritionPlan
);

/**
 * @route GET /api/v1/omics/:userId/supplement-plan
 * @desc Get personalized supplement recommendations
 * @access Private
 */
router.get(
  '/omics/:userId/supplement-plan',
  authenticateToken,
  controller.getSupplementPlan
);

// ========================================
// LONGEVITY OPTIMIZATION
// ========================================

/**
 * @route GET /api/v1/longevity/:userId/profile
 * @desc Get longevity optimization profile
 * @access Private
 */
router.get(
  '/longevity/:userId/profile',
  authenticateToken,
  controller.getLongevityProfile
);

/**
 * @route POST /api/v1/longevity/:userId/intervention
 * @desc Track longevity intervention
 * @access Private
 */
router.post(
  '/longevity/:userId/intervention',
  authenticateToken,
  validateRequest,
  controller.trackLongevityIntervention
);

/**
 * @route GET /api/v1/longevity/therapies/cutting-edge
 * @desc Get cutting-edge longevity therapies
 * @access Private
 */
router.get(
  '/longevity/therapies/cutting-edge',
  authenticateToken,
  controller.getCuttingEdgeTherapies
);

/**
 * @route GET /api/v1/longevity/:userId/biological-age
 * @desc Calculate biological age
 * @access Private
 */
router.get(
  '/longevity/:userId/biological-age',
  authenticateToken,
  controller.calculateBiologicalAge
);

/**
 * @route GET /api/v1/longevity/:userId/aging-hallmarks
 * @desc Get hallmarks of aging assessment
 * @access Private
 */
router.get(
  '/longevity/:userId/aging-hallmarks',
  authenticateToken,
  controller.getHallmarksOfAging
);

// ========================================
// EMPLOYER HEALTH COMMAND CENTER
// ========================================

/**
 * @route GET /api/v1/employer/:employerId/dashboard
 * @desc Get comprehensive employer health dashboard
 * @access Private (Employer Admin)
 */
router.get(
  '/employer/:employerId/dashboard',
  authenticateToken,
  controller.getEmployerDashboard
);

/**
 * @route GET /api/v1/employer/:employerId/projections
 * @desc Get cost and risk projections
 * @access Private (Employer Admin)
 */
router.get(
  '/employer/:employerId/projections',
  authenticateToken,
  controller.getCostProjections
);

/**
 * @route POST /api/v1/employer/:employerId/intervention
 * @desc Create intervention opportunity
 * @access Private (Employer Admin)
 */
router.post(
  '/employer/:employerId/intervention',
  authenticateToken,
  validateRequest,
  controller.createIntervention
);

/**
 * @route GET /api/v1/employer/:employerId/executive-summary
 * @desc Get executive summary report
 * @access Private (Employer Admin)
 */
router.get(
  '/employer/:employerId/executive-summary',
  authenticateToken,
  controller.getExecutiveSummary
);

/**
 * @route GET /api/v1/employer/:employerId/roi
 * @desc Get ROI analysis
 * @access Private (Employer Admin)
 */
router.get(
  '/employer/:employerId/roi',
  authenticateToken,
  controller.getROIAnalysis
);

// ========================================
// PROVIDER PERFORMANCE INTELLIGENCE
// ========================================

/**
 * @route GET /api/v1/provider/:providerId/performance
 * @desc Get provider performance metrics
 * @access Private (Provider)
 */
router.get(
  '/provider/:providerId/performance',
  authenticateToken,
  controller.getProviderPerformance
);

/**
 * @route GET /api/v1/provider/:providerId/benchmarks
 * @desc Get peer benchmarking data
 * @access Private (Provider)
 */
router.get(
  '/provider/:providerId/benchmarks',
  authenticateToken,
  controller.getPeerBenchmarks
);

/**
 * @route GET /api/v1/provider/:providerId/errors
 * @desc Get error analysis and prevention recommendations
 * @access Private (Provider)
 */
router.get(
  '/provider/:providerId/errors',
  authenticateToken,
  controller.getErrorAnalysis
);

/**
 * @route GET /api/v1/provider/:providerId/improvement-areas
 * @desc Get improvement opportunities
 * @access Private (Provider)
 */
router.get(
  '/provider/:providerId/improvement-areas',
  authenticateToken,
  controller.getImprovementAreas
);

// ========================================
// FEDERATED LEARNING NETWORK
// ========================================

/**
 * @route POST /api/v1/federated/join-network
 * @desc Join the federated learning network
 * @access Private (Institution)
 */
router.post(
  '/federated/join-network',
  authenticateToken,
  validateRequest,
  controller.joinFederatedNetwork
);

/**
 * @route POST /api/v1/federated/contribute
 * @desc Contribute model update to network
 * @access Private (Institution)
 */
router.post(
  '/federated/contribute',
  authenticateToken,
  validateRequest,
  controller.contributeModelUpdate
);

/**
 * @route GET /api/v1/federated/models/global
 * @desc Get global AI models
 * @access Private
 */
router.get(
  '/federated/models/global',
  authenticateToken,
  controller.getGlobalModels
);

/**
 * @route GET /api/v1/federated/network-health
 * @desc Get network health status
 * @access Private
 */
router.get(
  '/federated/network-health',
  authenticateToken,
  controller.getNetworkHealth
);

// ========================================
// PREDICTIVE INSURANCE
// ========================================

/**
 * @route GET /api/v1/insurance/:userId/risk-assessment
 * @desc Get dynamic risk assessment
 * @access Private
 */
router.get(
  '/insurance/:userId/risk-assessment',
  authenticateToken,
  controller.getRiskAssessment
);

/**
 * @route GET /api/v1/insurance/:userId/premium
 * @desc Calculate personalized premium
 * @access Private
 */
router.get(
  '/insurance/:userId/premium',
  authenticateToken,
  controller.calculatePremium
);

/**
 * @route POST /api/v1/insurance/:userId/wellness-program
 * @desc Enroll in wellness program
 * @access Private
 */
router.post(
  '/insurance/:userId/wellness-program',
  authenticateToken,
  validateRequest,
  controller.enrollWellnessProgram
);

/**
 * @route GET /api/v1/insurance/:userId/prevention-plan
 * @desc Get personalized prevention plan
 * @access Private
 */
router.get(
  '/insurance/:userId/prevention-plan',
  authenticateToken,
  controller.getPreventionPlan
);

// ========================================
// DRUG DISCOVERY
// ========================================

/**
 * @route GET /api/v1/drug-discovery/candidates
 * @desc Get drug candidates in pipeline
 * @access Private (Pharma Partner)
 */
router.get(
  '/drug-discovery/candidates',
  authenticateToken,
  controller.getDrugCandidates
);

/**
 * @route POST /api/v1/drug-discovery/trial-match
 * @desc Match patients to clinical trials
 * @access Private (Pharma Partner)
 */
router.post(
  '/drug-discovery/trial-match',
  authenticateToken,
  validateRequest,
  controller.matchPatientsToTrials
);

/**
 * @route GET /api/v1/drug-discovery/pipeline
 * @desc Get pipeline analysis
 * @access Private (Pharma Partner)
 */
router.get(
  '/drug-discovery/pipeline',
  authenticateToken,
  controller.getPipelineAnalysis
);

/**
 * @route POST /api/v1/drug-discovery/candidate/predict
 * @desc Predict drug candidate success
 * @access Private (Pharma Partner)
 */
router.post(
  '/drug-discovery/candidate/predict',
  authenticateToken,
  validateRequest,
  controller.predictCandidateSuccess
);

// ========================================
// PANDEMIC WARNING SYSTEM
// ========================================

/**
 * @route GET /api/v1/pandemic/threat-level
 * @desc Get current pandemic threat level
 * @access Public
 */
router.get(
  '/pandemic/threat-level',
  controller.getCurrentThreatLevel
);

/**
 * @route GET /api/v1/pandemic/outbreaks
 * @desc Get active outbreaks
 * @access Public
 */
router.get(
  '/pandemic/outbreaks',
  controller.getActiveOutbreaks
);

/**
 * @route POST /api/v1/pandemic/alert
 * @desc Create pandemic alert
 * @access Private (Admin)
 */
router.post(
  '/pandemic/alert',
  authenticateToken,
  validateRequest,
  controller.createPandemicAlert
);

/**
 * @route GET /api/v1/pandemic/predictions
 * @desc Get outbreak predictions
 * @access Private (Government)
 */
router.get(
  '/pandemic/predictions',
  authenticateToken,
  controller.getOutbreakPredictions
);

/**
 * @route GET /api/v1/pandemic/spread-model/:outbreakId
 * @desc Get spread model for outbreak
 * @access Private (Government)
 */
router.get(
  '/pandemic/spread-model/:outbreakId',
  authenticateToken,
  controller.getSpreadModel
);

// ========================================
// HEALTH EDUCATOR
// ========================================

/**
 * @route GET /api/v1/education/courses
 * @desc Get available courses
 * @access Public
 */
router.get(
  '/education/courses',
  controller.getCourses
);

/**
 * @route POST /api/v1/education/enroll
 * @desc Enroll in a course
 * @access Private
 */
router.post(
  '/education/enroll',
  authenticateToken,
  validateRequest,
  controller.enrollCourse
);

/**
 * @route GET /api/v1/education/:learnerId/progress
 * @desc Get learner progress
 * @access Private
 */
router.get(
  '/education/:learnerId/progress',
  authenticateToken,
  controller.getLearnerProgress
);

/**
 * @route GET /api/v1/education/certifications
 * @desc Get available certifications
 * @access Public
 */
router.get(
  '/education/certifications',
  controller.getCertifications
);

/**
 * @route POST /api/v1/education/assessment/adaptive
 * @desc Take adaptive assessment
 * @access Private
 */
router.post(
  '/education/assessment/adaptive',
  authenticateToken,
  validateRequest,
  controller.takeAdaptiveAssessment
);

// ========================================
// DATA MARKETPLACE
// ========================================

/**
 * @route GET /api/v1/marketplace/datasets
 * @desc Browse available datasets
 * @access Private
 */
router.get(
  '/marketplace/datasets',
  authenticateToken,
  controller.browseDatasets
);

/**
 * @route POST /api/v1/marketplace/purchase
 * @desc Purchase dataset
 * @access Private (Buyer)
 */
router.post(
  '/marketplace/purchase',
  authenticateToken,
  validateRequest,
  controller.purchaseDataset
);

/**
 * @route GET /api/v1/marketplace/:userId/earnings
 * @desc Get data earnings for user
 * @access Private
 */
router.get(
  '/marketplace/:userId/earnings',
  authenticateToken,
  controller.getDataEarnings
);

/**
 * @route POST /api/v1/marketplace/consent
 * @desc Manage data sharing consent
 * @access Private
 */
router.post(
  '/marketplace/consent',
  authenticateToken,
  validateRequest,
  controller.manageDataConsent
);

/**
 * @route POST /api/v1/marketplace/list-dataset
 * @desc List dataset for sale
 * @access Private (Provider)
 */
router.post(
  '/marketplace/list-dataset',
  authenticateToken,
  validateRequest,
  controller.listDataset
);

// ========================================
// HEALTH ENDPOINTS
// ========================================

/**
 * @route GET /api/v1/revolutionary/health
 * @desc Health check for revolutionary features
 * @access Public
 */
router.get('/revolutionary/health', (req, res) => {
  res.json({
    status: 'healthy',
    features: {
      virtualHealthTwin: 'active',
      mentalHealthCrisis: 'active',
      multiOmics: 'active',
      longevity: 'active',
      employerDashboard: 'active',
      providerPerformance: 'active',
      federatedLearning: 'active',
      predictiveInsurance: 'active',
      drugDiscovery: 'active',
      pandemicWarning: 'active',
      healthEducator: 'active',
      dataMarketplace: 'active',
    },
    timestamp: new Date(),
  });
});

export default router;
