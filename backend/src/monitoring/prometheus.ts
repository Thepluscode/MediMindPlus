import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';
import logger from '../utils/logger';

// Create a Registry to register the metrics
export const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'medimindplus_'
});

// ============================================================================
// CUSTOM METRICS FOR MEDIMINDPLUS
// ============================================================================

// HTTP Request Duration
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // Response time buckets in seconds
});

// HTTP Request Counter
export const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// ============================================================================
// REVOLUTIONARY FEATURES METRICS
// ============================================================================

// Feature 1: Virtual Health Twin
export const virtualHealthTwinCreations = new promClient.Counter({
  name: 'virtual_health_twin_creations_total',
  help: 'Total number of virtual health twins created'
});

export const healthTwinSimulations = new promClient.Counter({
  name: 'health_twin_simulations_total',
  help: 'Total number of health twin simulations run',
  labelNames: ['intervention_type']
});

// Feature 2: Mental Health Crisis Prevention
export const mentalHealthAssessments = new promClient.Counter({
  name: 'mental_health_assessments_total',
  help: 'Total number of mental health crisis assessments performed'
});

export const highRiskAlerts = new promClient.Counter({
  name: 'mental_health_high_risk_alerts_total',
  help: 'Total number of high-risk mental health alerts triggered'
});

export const crisisRiskScoreGauge = new promClient.Gauge({
  name: 'mental_health_crisis_risk_score',
  help: 'Current crisis risk score (0-100)',
  labelNames: ['user_id']
});

// Feature 3: Multi-Omics Integration
export const genomicDataUploads = new promClient.Counter({
  name: 'genomic_data_uploads_total',
  help: 'Total number of genomic data files uploaded'
});

export const microbiomeKitOrders = new promClient.Counter({
  name: 'microbiome_kit_orders_total',
  help: 'Total number of microbiome test kits ordered'
});

export const personalizedNutritionPlans = new promClient.Counter({
  name: 'personalized_nutrition_plans_generated_total',
  help: 'Total number of personalized nutrition plans generated'
});

// Feature 4: Longevity Optimization
export const biologicalAgeCalculations = new promClient.Counter({
  name: 'biological_age_calculations_total',
  help: 'Total number of biological age calculations'
});

export const biologicalAgeGauge = new promClient.Gauge({
  name: 'biological_age_years',
  help: 'User biological age in years',
  labelNames: ['user_id']
});

export const longevityInterventions = new promClient.Counter({
  name: 'longevity_interventions_started_total',
  help: 'Total number of longevity interventions started',
  labelNames: ['intervention_type']
});

// Feature 5: Employer Health Dashboard
export const employerDashboardViews = new promClient.Counter({
  name: 'employer_dashboard_views_total',
  help: 'Total number of employer dashboard views',
  labelNames: ['employer_id']
});

export const employeeHealthScore = new promClient.Gauge({
  name: 'employee_avg_health_score',
  help: 'Average health score for employer',
  labelNames: ['employer_id']
});

export const burnoutRiskGauge = new promClient.Gauge({
  name: 'employee_burnout_risk',
  help: 'Employee burnout risk percentage',
  labelNames: ['employer_id']
});

// Feature 6: Provider Performance Analytics
export const providerPerformanceChecks = new promClient.Counter({
  name: 'provider_performance_checks_total',
  help: 'Total number of provider performance evaluations'
});

export const providerSatisfactionScore = new promClient.Gauge({
  name: 'provider_patient_satisfaction_score',
  help: 'Provider patient satisfaction score (0-100)',
  labelNames: ['provider_id']
});

export const diagnosticAccuracyScore = new promClient.Gauge({
  name: 'provider_diagnostic_accuracy_score',
  help: 'Provider diagnostic accuracy score (0-100)',
  labelNames: ['provider_id']
});

// Feature 7: Federated Learning
export const federatedLearningContributions = new promClient.Counter({
  name: 'federated_learning_contributions_total',
  help: 'Total number of federated learning model contributions'
});

export const federatedModelAccuracy = new promClient.Gauge({
  name: 'federated_model_accuracy',
  help: 'Federated learning model accuracy',
  labelNames: ['model_name']
});

// Feature 8: Predictive Insurance
export const insurancePremiumCalculations = new promClient.Counter({
  name: 'insurance_premium_calculations_total',
  help: 'Total number of insurance premium calculations'
});

export const avgPremiumDiscount = new promClient.Gauge({
  name: 'insurance_avg_premium_discount_percent',
  help: 'Average premium discount percentage for users'
});

// Feature 9: Drug Discovery
export const drugCandidateSearches = new promClient.Counter({
  name: 'drug_candidate_searches_total',
  help: 'Total number of drug candidate searches',
  labelNames: ['disease']
});

export const trialMatchingRequests = new promClient.Counter({
  name: 'trial_matching_requests_total',
  help: 'Total number of clinical trial matching requests'
});

// Feature 10: Pandemic Early Warning
export const pandemicAlertsIssued = new promClient.Counter({
  name: 'pandemic_alerts_issued_total',
  help: 'Total number of pandemic early warning alerts issued',
  labelNames: ['alert_level']
});

export const symptomClusterDetections = new promClient.Counter({
  name: 'pandemic_symptom_clusters_detected_total',
  help: 'Total number of unusual symptom clusters detected'
});

// Feature 11: Health Educator
export const courseEnrollments = new promClient.Counter({
  name: 'health_education_enrollments_total',
  help: 'Total number of course enrollments',
  labelNames: ['category']
});

export const courseCompletions = new promClient.Counter({
  name: 'health_education_completions_total',
  help: 'Total number of course completions',
  labelNames: ['category']
});

export const cmeCreditsIssued = new promClient.Counter({
  name: 'health_education_cme_credits_issued_total',
  help: 'Total CME credits issued'
});

// Feature 12: Data Marketplace
export const dataListings = new promClient.Counter({
  name: 'data_marketplace_listings_total',
  help: 'Total number of data marketplace listings',
  labelNames: ['data_type']
});

export const dataPurchases = new promClient.Counter({
  name: 'data_marketplace_purchases_total',
  help: 'Total number of data purchases',
  labelNames: ['data_type']
});

export const dataMarketplaceRevenue = new promClient.Counter({
  name: 'data_marketplace_revenue_usd',
  help: 'Total revenue from data marketplace in USD'
});

// ============================================================================
// BUSINESS METRICS
// ============================================================================

export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  labelNames: ['role']
});

export const monthlyRecurringRevenue = new promClient.Gauge({
  name: 'monthly_recurring_revenue_usd',
  help: 'Monthly recurring revenue in USD'
});

export const apiErrorRate = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(virtualHealthTwinCreations);
register.registerMetric(healthTwinSimulations);
register.registerMetric(mentalHealthAssessments);
register.registerMetric(highRiskAlerts);
register.registerMetric(crisisRiskScoreGauge);
register.registerMetric(genomicDataUploads);
register.registerMetric(microbiomeKitOrders);
register.registerMetric(personalizedNutritionPlans);
register.registerMetric(biologicalAgeCalculations);
register.registerMetric(biologicalAgeGauge);
register.registerMetric(longevityInterventions);
register.registerMetric(employerDashboardViews);
register.registerMetric(employeeHealthScore);
register.registerMetric(burnoutRiskGauge);
register.registerMetric(providerPerformanceChecks);
register.registerMetric(providerSatisfactionScore);
register.registerMetric(diagnosticAccuracyScore);
register.registerMetric(federatedLearningContributions);
register.registerMetric(federatedModelAccuracy);
register.registerMetric(insurancePremiumCalculations);
register.registerMetric(avgPremiumDiscount);
register.registerMetric(drugCandidateSearches);
register.registerMetric(trialMatchingRequests);
register.registerMetric(pandemicAlertsIssued);
register.registerMetric(symptomClusterDetections);
register.registerMetric(courseEnrollments);
register.registerMetric(courseCompletions);
register.registerMetric(cmeCreditsIssued);
register.registerMetric(dataListings);
register.registerMetric(dataPurchases);
register.registerMetric(dataMarketplaceRevenue);
register.registerMetric(activeUsers);
register.registerMetric(monthlyRecurringRevenue);
register.registerMetric(apiErrorRate);

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Track request completion
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record request duration
    httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);

    // Increment request counter
    httpRequestCounter.labels(method, route, statusCode.toString()).inc();

    // Track errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      apiErrorRate.labels(route, errorType).inc();
    }
  });

  next();
};

/**
 * Endpoint to expose metrics for Prometheus scraping
 */
export const metricsEndpoint = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to track revolutionary feature usage
 */
export const trackFeatureUsage = (featureName: string, metadata?: Record<string, string>) => {
  switch (featureName) {
    case 'virtual_health_twin_created':
      virtualHealthTwinCreations.inc();
      break;
    case 'health_twin_simulation':
      healthTwinSimulations.labels(metadata?.intervention_type || 'unknown').inc();
      break;
    case 'mental_health_assessment':
      mentalHealthAssessments.inc();
      break;
    case 'high_risk_alert':
      highRiskAlerts.inc();
      break;
    case 'genomic_upload':
      genomicDataUploads.inc();
      break;
    case 'microbiome_kit_order':
      microbiomeKitOrders.inc();
      break;
    case 'nutrition_plan_generated':
      personalizedNutritionPlans.inc();
      break;
    case 'biological_age_calculated':
      biologicalAgeCalculations.inc();
      break;
    case 'longevity_intervention_started':
      longevityInterventions.labels(metadata?.intervention_type || 'unknown').inc();
      break;
    case 'employer_dashboard_viewed':
      employerDashboardViews.labels(metadata?.employer_id || 'unknown').inc();
      break;
    case 'provider_performance_checked':
      providerPerformanceChecks.inc();
      break;
    case 'federated_learning_contribution':
      federatedLearningContributions.inc();
      break;
    case 'insurance_premium_calculated':
      insurancePremiumCalculations.inc();
      break;
    case 'drug_candidate_search':
      drugCandidateSearches.labels(metadata?.disease || 'unknown').inc();
      break;
    case 'trial_matching_requested':
      trialMatchingRequests.inc();
      break;
    case 'pandemic_alert_issued':
      pandemicAlertsIssued.labels(metadata?.alert_level || 'unknown').inc();
      break;
    case 'symptom_cluster_detected':
      symptomClusterDetections.inc();
      break;
    case 'course_enrollment':
      courseEnrollments.labels(metadata?.category || 'unknown').inc();
      break;
    case 'course_completion':
      courseCompletions.labels(metadata?.category || 'unknown').inc();
      break;
    case 'cme_credits_issued':
      cmeCreditsIssued.inc();
      break;
    case 'data_listing_created':
      dataListings.labels(metadata?.data_type || 'unknown').inc();
      break;
    case 'data_purchased':
      dataPurchases.labels(metadata?.data_type || 'unknown').inc();
      break;
    case 'marketplace_revenue':
      dataMarketplaceRevenue.inc(parseFloat(metadata?.amount || '0'));
      break;
    default:
      logger.warn('Unknown feature tracking', { service: 'prometheus', featureName });
  }
};

/**
 * Update user gauge metrics
 */
export const updateGaugeMetric = (metricName: string, value: number, labels?: Record<string, string>) => {
  switch (metricName) {
    case 'crisis_risk_score':
      crisisRiskScoreGauge.labels(labels?.user_id || 'unknown').set(value);
      break;
    case 'biological_age':
      biologicalAgeGauge.labels(labels?.user_id || 'unknown').set(value);
      break;
    case 'employee_health_score':
      employeeHealthScore.labels(labels?.employer_id || 'unknown').set(value);
      break;
    case 'burnout_risk':
      burnoutRiskGauge.labels(labels?.employer_id || 'unknown').set(value);
      break;
    case 'provider_satisfaction':
      providerSatisfactionScore.labels(labels?.provider_id || 'unknown').set(value);
      break;
    case 'diagnostic_accuracy':
      diagnosticAccuracyScore.labels(labels?.provider_id || 'unknown').set(value);
      break;
    case 'federated_model_accuracy':
      federatedModelAccuracy.labels(labels?.model_name || 'unknown').set(value);
      break;
    case 'avg_premium_discount':
      avgPremiumDiscount.set(value);
      break;
    case 'active_users':
      activeUsers.labels(labels?.role || 'unknown').set(value);
      break;
    case 'mrr':
      monthlyRecurringRevenue.set(value);
      break;
    default:
      logger.warn('Unknown gauge metric', { service: 'prometheus', metricName });
  }
};

export default {
  register,
  metricsMiddleware,
  metricsEndpoint,
  trackFeatureUsage,
  updateGaugeMetric
};
