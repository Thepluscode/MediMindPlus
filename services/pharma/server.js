/**
 * Pharma Research Data Service
 * Handles $10M/study revenue stream for early detection cohorts
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('redis');

const app = express();
const PORT = process.env.PORT || 8003;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Larger limit for research data

// Rate limiting for research API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Database connections
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const analyticsDb = new Pool({
  connectionString: process.env.ANALYTICS_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});

redis.connect().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'pharma-research-api',
    timestamp: new Date().toISOString(),
    revenue_model: '$10M/study for early detection cohorts'
  });
});

// Pharma Research APIs

/**
 * Clinical Trial Matching API
 * Matches patients to clinical trials based on health predictions
 */
app.post('/api/v1/trial-matching', async (req, res) => {
  try {
    const { study_id, inclusion_criteria, exclusion_criteria, pharma_partner } = req.body;

    // Validate pharma partner
    const validPartners = ['Pfizer', 'Roche', 'Novartis', 'Merck', 'GSK', 'AstraZeneca', 'Sanofi'];
    if (!validPartners.includes(pharma_partner)) {
      return res.status(400).json({ error: 'Invalid pharma partner' });
    }

    // Find matching participants based on AI predictions
    const matchingParticipants = await findMatchingParticipants(inclusion_criteria, exclusion_criteria);
    
    // Store study data
    await analyticsDb.query(
      'INSERT INTO clinical_studies (study_id, pharma_partner, participants_matched, created_at) VALUES ($1, $2, $3, NOW())',
      [study_id, pharma_partner, matchingParticipants.length]
    );

    // Calculate study value
    const studyValue = calculateStudyValue(matchingParticipants.length, inclusion_criteria);

    res.json({
      study_id,
      pharma_partner,
      matching_results: {
        total_matches: matchingParticipants.length,
        high_confidence_matches: matchingParticipants.filter(p => p.confidence > 0.8).length,
        geographic_distribution: calculateGeographicDistribution(matchingParticipants),
        demographic_breakdown: calculateDemographicBreakdown(matchingParticipants)
      },
      study_economics: {
        estimated_value: studyValue,
        cost_per_participant: Math.round(studyValue / matchingParticipants.length),
        timeline_acceleration: '6-12 months faster recruitment',
        quality_score: calculateQualityScore(matchingParticipants)
      },
      early_detection_insights: {
        pre_symptomatic_participants: matchingParticipants.filter(p => p.stage === 'pre-symptomatic').length,
        biomarker_availability: matchingParticipants.filter(p => p.biomarkers_available).length,
        longitudinal_data_years: calculateAverageDataHistory(matchingParticipants)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trial matching error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Biomarker Discovery API
 * Provides early-stage biomarker data for drug development
 */
app.post('/api/v1/biomarker-discovery', async (req, res) => {
  try {
    const { research_question, target_condition, sample_size, pharma_partner } = req.body;

    // Generate biomarker insights from multi-omics data
    const biomarkerData = await generateBiomarkerInsights(target_condition, sample_size);
    
    // Store research request
    await analyticsDb.query(
      'INSERT INTO biomarker_studies (pharma_partner, target_condition, sample_size, created_at) VALUES ($1, $2, $3, NOW())',
      [pharma_partner, target_condition, sample_size]
    );

    // Calculate research value
    const researchValue = calculateResearchValue(biomarkerData, sample_size);

    res.json({
      research_id: `bio_${Date.now()}`,
      pharma_partner,
      biomarker_insights: {
        novel_biomarkers: biomarkerData.novel_biomarkers,
        validation_cohort_size: biomarkerData.validation_cohort_size,
        predictive_accuracy: biomarkerData.predictive_accuracy,
        time_to_detection: biomarkerData.time_to_detection,
        multi_omics_data: {
          voice_biomarkers: biomarkerData.voice_biomarkers,
          digital_biomarkers: biomarkerData.digital_biomarkers,
          behavioral_patterns: biomarkerData.behavioral_patterns
        }
      },
      commercial_potential: {
        estimated_value: researchValue,
        market_size: calculateMarketSize(target_condition),
        competitive_advantage: 'First-to-market early detection',
        regulatory_pathway: determineRegulatoryPathway(target_condition)
      },
      data_quality: {
        longitudinal_depth: '3-5 years average',
        data_completeness: '95%+',
        real_world_evidence: true,
        fda_compliance: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Biomarker discovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Real-World Evidence API
 * Provides post-market surveillance and effectiveness data
 */
app.get('/api/v1/real-world-evidence/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    const { timeframe = '12m', cohort_size = 10000 } = req.query;

    // Generate real-world evidence from platform data
    const rweData = await generateRealWorldEvidence(condition, timeframe, cohort_size);
    
    // Calculate evidence value
    const evidenceValue = calculateEvidenceValue(rweData);

    res.json({
      condition,
      study_parameters: {
        timeframe,
        cohort_size: parseInt(cohort_size),
        data_sources: ['smartphone_sensors', 'voice_analysis', 'behavioral_data', 'clinical_outcomes']
      },
      real_world_outcomes: {
        effectiveness_metrics: rweData.effectiveness_metrics,
        safety_profile: rweData.safety_profile,
        patient_reported_outcomes: rweData.patient_reported_outcomes,
        healthcare_utilization: rweData.healthcare_utilization
      },
      comparative_effectiveness: {
        vs_standard_care: rweData.vs_standard_care,
        cost_effectiveness: rweData.cost_effectiveness,
        quality_adjusted_outcomes: rweData.quality_adjusted_outcomes
      },
      regulatory_value: {
        estimated_value: evidenceValue,
        regulatory_submissions: rweData.regulatory_submissions,
        market_access_support: true,
        payer_evidence: rweData.payer_evidence
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Real-world evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function findMatchingParticipants(inclusionCriteria, exclusionCriteria) {
  // Simulate AI-powered participant matching
  const participants = [];
  const targetSize = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 participants
  
  for (let i = 0; i < targetSize; i++) {
    participants.push({
      participant_id: `p_${i}`,
      confidence: 0.6 + Math.random() * 0.4, // 60-100% confidence
      stage: Math.random() > 0.7 ? 'pre-symptomatic' : 'early-stage',
      biomarkers_available: Math.random() > 0.3,
      geographic_region: ['North America', 'Europe', 'Asia-Pacific'][Math.floor(Math.random() * 3)],
      age_group: ['18-35', '36-50', '51-65', '65+'][Math.floor(Math.random() * 4)],
      data_history_years: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return participants;
}

function calculateStudyValue(participantCount, inclusionCriteria) {
  // Base value: $10M for standard study
  let baseValue = 10000000;
  
  // Adjust based on participant count and criteria complexity
  const participantMultiplier = Math.min(2.0, participantCount / 1000);
  const complexityMultiplier = inclusionCriteria.length * 0.1 + 1;
  
  return Math.round(baseValue * participantMultiplier * complexityMultiplier);
}

async function generateBiomarkerInsights(targetCondition, sampleSize) {
  // Simulate biomarker discovery from multi-omics data
  return {
    novel_biomarkers: Math.floor(Math.random() * 10) + 5, // 5-15 novel biomarkers
    validation_cohort_size: sampleSize,
    predictive_accuracy: 0.75 + Math.random() * 0.2, // 75-95% accuracy
    time_to_detection: `${Math.floor(Math.random() * 36) + 12} months earlier`, // 12-48 months
    voice_biomarkers: Math.floor(Math.random() * 5) + 2,
    digital_biomarkers: Math.floor(Math.random() * 8) + 3,
    behavioral_patterns: Math.floor(Math.random() * 6) + 2
  };
}

function calculateResearchValue(biomarkerData, sampleSize) {
  // Calculate value based on biomarker novelty and sample size
  const baseValue = 15000000; // $15M base value
  const biomarkerMultiplier = biomarkerData.novel_biomarkers * 0.1 + 1;
  const sampleMultiplier = Math.min(2.0, sampleSize / 5000);
  
  return Math.round(baseValue * biomarkerMultiplier * sampleMultiplier);
}

async function generateRealWorldEvidence(condition, timeframe, cohortSize) {
  // Simulate real-world evidence generation
  return {
    effectiveness_metrics: {
      primary_endpoint_improvement: `${Math.floor(Math.random() * 30) + 10}%`,
      secondary_endpoints_met: Math.floor(Math.random() * 5) + 3,
      patient_satisfaction: 0.8 + Math.random() * 0.15
    },
    safety_profile: {
      adverse_events_rate: Math.random() * 0.05, // 0-5%
      serious_adverse_events: Math.random() * 0.01, // 0-1%
      discontinuation_rate: Math.random() * 0.1 // 0-10%
    },
    vs_standard_care: {
      relative_effectiveness: `${Math.floor(Math.random() * 40) + 20}% better`,
      cost_reduction: `$${Math.floor(Math.random() * 5000) + 2000} per patient`,
      time_to_benefit: `${Math.floor(Math.random() * 6) + 1} months`
    },
    regulatory_submissions: Math.floor(Math.random() * 3) + 1,
    payer_evidence: {
      cost_effectiveness_ratio: Math.floor(Math.random() * 50000) + 25000,
      budget_impact: 'Neutral to positive',
      coverage_recommendation: 'Favorable'
    }
  };
}

function calculateGeographicDistribution(participants) {
  const regions = {};
  participants.forEach(p => {
    regions[p.geographic_region] = (regions[p.geographic_region] || 0) + 1;
  });
  return regions;
}

function calculateDemographicBreakdown(participants) {
  const demographics = {};
  participants.forEach(p => {
    demographics[p.age_group] = (demographics[p.age_group] || 0) + 1;
  });
  return demographics;
}

function calculateQualityScore(participants) {
  const avgConfidence = participants.reduce((sum, p) => sum + p.confidence, 0) / participants.length;
  const biomarkerAvailability = participants.filter(p => p.biomarkers_available).length / participants.length;
  return ((avgConfidence + biomarkerAvailability) / 2 * 100).toFixed(1);
}

function calculateAverageDataHistory(participants) {
  const avgHistory = participants.reduce((sum, p) => sum + p.data_history_years, 0) / participants.length;
  return avgHistory.toFixed(1);
}

function calculateMarketSize(condition) {
  // Simulate market size calculation
  const marketSizes = {
    'diabetes': '$50B',
    'cardiovascular': '$75B',
    'cancer': '$100B',
    'alzheimers': '$30B',
    'default': '$25B'
  };
  return marketSizes[condition.toLowerCase()] || marketSizes.default;
}

function determineRegulatoryPathway(condition) {
  // Determine optimal regulatory pathway
  const pathways = {
    'cancer': 'FDA Breakthrough Therapy',
    'diabetes': 'FDA 510(k) Clearance',
    'cardiovascular': 'FDA De Novo Pathway',
    'default': 'FDA 510(k) Clearance'
  };
  return pathways[condition.toLowerCase()] || pathways.default;
}

function calculateEvidenceValue(rweData) {
  // Calculate value of real-world evidence
  const baseValue = 8000000; // $8M base value
  const effectivenessMultiplier = parseFloat(rweData.effectiveness_metrics.primary_endpoint_improvement) / 100 + 1;
  const safetyMultiplier = (1 - rweData.safety_profile.adverse_events_rate) + 0.5;
  
  return Math.round(baseValue * effectivenessMultiplier * safetyMultiplier);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔬 Pharma Research API Service running on port ${PORT}`);
  console.log(`💰 Revenue Model: $10M/study for early detection cohorts`);
  console.log(`🎯 Target: Pfizer, Roche, Novartis, Merck partnerships`);
});

module.exports = app;
