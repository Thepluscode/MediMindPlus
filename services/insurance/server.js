/**
 * Insurance Partner Integration Service
 * Handles $20/member/month revenue stream for 5M+ insured users
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('redis');

const app = express();
const PORT = process.env.PORT || 8002;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for enterprise API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
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
    service: 'insurance-api',
    timestamp: new Date().toISOString(),
    revenue_model: '$20/member/month'
  });
});

// Insurance Partner APIs

/**
 * Real-time Risk Scoring API
 * Provides 3-5 year disease prediction for insurance underwriting
 */
app.post('/api/v1/risk-assessment', async (req, res) => {
  try {
    const { member_id, health_data, insurance_partner } = req.body;

    // Validate insurance partner
    if (!['UnitedHealthcare', 'Aetna', 'Anthem', 'Cigna', 'Humana'].includes(insurance_partner)) {
      return res.status(400).json({ error: 'Invalid insurance partner' });
    }

    // Calculate risk score using AI predictions
    const riskScore = await calculateRiskScore(member_id, health_data);
    
    // Store analytics data
    await analyticsDb.query(
      'INSERT INTO risk_assessments (member_id, insurance_partner, risk_score, created_at) VALUES ($1, $2, $3, NOW())',
      [member_id, insurance_partner, riskScore.overall_risk]
    );

    // Cache result for 24 hours
    await redis.setEx(`risk:${member_id}`, 86400, JSON.stringify(riskScore));

    res.json({
      member_id,
      risk_assessment: {
        overall_risk: riskScore.overall_risk,
        cardiovascular_risk: riskScore.cardiovascular_risk,
        diabetes_risk: riskScore.diabetes_risk,
        cancer_risk: riskScore.cancer_risk,
        prediction_horizon: '3-5 years',
        confidence: riskScore.confidence,
        recommendations: riskScore.recommendations
      },
      cost_savings_potential: calculateCostSavings(riskScore),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Population Health Analytics API
 * Provides aggregate insights for insurance portfolio management
 */
app.get('/api/v1/population-health/:partner', async (req, res) => {
  try {
    const { partner } = req.params;
    const { timeframe = '30d' } = req.query;

    // Get population health metrics
    const metrics = await analyticsDb.query(`
      SELECT 
        COUNT(*) as total_members,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_score > 0.7 THEN 1 END) as high_risk_members,
        COUNT(CASE WHEN risk_score < 0.3 THEN 1 END) as low_risk_members,
        SUM(estimated_cost_savings) as total_cost_savings
      FROM risk_assessments 
      WHERE insurance_partner = $1 
      AND created_at > NOW() - INTERVAL '${timeframe}'
    `, [partner]);

    const populationData = metrics.rows[0];

    // Calculate ROI for insurance partner
    const monthlyRevenue = populationData.total_members * 20; // $20/member/month
    const roi = (populationData.total_cost_savings / monthlyRevenue) * 100;

    res.json({
      insurance_partner: partner,
      timeframe,
      population_metrics: {
        total_members: parseInt(populationData.total_members),
        average_risk_score: parseFloat(populationData.avg_risk_score || 0).toFixed(3),
        high_risk_members: parseInt(populationData.high_risk_members || 0),
        low_risk_members: parseInt(populationData.low_risk_members || 0),
        risk_distribution: {
          low: parseInt(populationData.low_risk_members || 0),
          medium: parseInt(populationData.total_members) - parseInt(populationData.high_risk_members || 0) - parseInt(populationData.low_risk_members || 0),
          high: parseInt(populationData.high_risk_members || 0)
        }
      },
      financial_impact: {
        monthly_revenue: monthlyRevenue,
        estimated_cost_savings: parseFloat(populationData.total_cost_savings || 0),
        roi_percentage: roi.toFixed(2),
        cost_per_member: 20
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Population health error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Member Enrollment API
 * Handles new member onboarding for insurance partners
 */
app.post('/api/v1/enroll-member', async (req, res) => {
  try {
    const { member_id, insurance_partner, member_data, plan_type } = req.body;

    // Validate enrollment data
    if (!member_id || !insurance_partner || !member_data) {
      return res.status(400).json({ error: 'Missing required enrollment data' });
    }

    // Store member enrollment
    await db.query(`
      INSERT INTO insurance_members (
        member_id, insurance_partner, plan_type, 
        enrolled_at, status, monthly_fee
      ) VALUES ($1, $2, $3, NOW(), 'active', 20)
      ON CONFLICT (member_id) DO UPDATE SET
        insurance_partner = $2, plan_type = $3, status = 'active'
    `, [member_id, insurance_partner, plan_type]);

    // Initialize member health profile
    await initializeMemberProfile(member_id, member_data);

    res.json({
      member_id,
      enrollment_status: 'success',
      monthly_fee: 20,
      services_included: [
        '3-5 year disease prediction',
        'Real-time health monitoring',
        'Personalized health recommendations',
        'Early intervention alerts',
        'Population health insights'
      ],
      estimated_annual_savings: 600, // $600+ per member savings
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Member enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function calculateRiskScore(memberId, healthData) {
  // Simulate AI-powered risk calculation
  // In production, this would call the ML service
  const baseRisk = Math.random() * 0.5; // 0-50% base risk
  
  // Adjust based on health data
  let riskAdjustment = 0;
  if (healthData.age > 50) riskAdjustment += 0.1;
  if (healthData.bmi > 30) riskAdjustment += 0.15;
  if (healthData.smoking) riskAdjustment += 0.2;
  if (healthData.family_history) riskAdjustment += 0.1;

  const overallRisk = Math.min(0.95, baseRisk + riskAdjustment);

  return {
    overall_risk: parseFloat(overallRisk.toFixed(3)),
    cardiovascular_risk: parseFloat((overallRisk * 0.8).toFixed(3)),
    diabetes_risk: parseFloat((overallRisk * 0.6).toFixed(3)),
    cancer_risk: parseFloat((overallRisk * 0.4).toFixed(3)),
    confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    recommendations: generateRecommendations(overallRisk)
  };
}

function calculateCostSavings(riskScore) {
  // Calculate potential cost savings based on early intervention
  const baseSavings = 600; // $600 base savings per member
  const riskMultiplier = riskScore.overall_risk * 2; // Higher risk = higher savings potential
  
  return {
    estimated_annual_savings: Math.round(baseSavings * (1 + riskMultiplier)),
    early_intervention_value: Math.round(baseSavings * 0.5),
    prevention_value: Math.round(baseSavings * 0.3),
    reduced_claims_value: Math.round(baseSavings * 0.2)
  };
}

function generateRecommendations(riskScore) {
  const recommendations = [];
  
  if (riskScore > 0.7) {
    recommendations.push('Schedule immediate physician consultation');
    recommendations.push('Consider comprehensive health screening');
  } else if (riskScore > 0.4) {
    recommendations.push('Increase preventive care frequency');
    recommendations.push('Implement lifestyle modification program');
  } else {
    recommendations.push('Continue current health maintenance');
    recommendations.push('Annual preventive screening recommended');
  }
  
  return recommendations;
}

async function initializeMemberProfile(memberId, memberData) {
  // Initialize member health profile in the system
  await db.query(`
    INSERT INTO member_profiles (
      member_id, age, gender, baseline_health_data, created_at
    ) VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (member_id) DO UPDATE SET
      age = $2, gender = $3, baseline_health_data = $4
  `, [memberId, memberData.age, memberData.gender, JSON.stringify(memberData)]);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Insurance API Service running on port ${PORT}`);
  console.log(`💰 Revenue Model: $20/member/month for 5M+ users = $100M/month potential`);
  console.log(`🎯 Target: UnitedHealthcare, Aetna, Anthem partnerships`);
});

module.exports = app;
