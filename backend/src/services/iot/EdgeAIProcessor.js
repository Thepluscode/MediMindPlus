const tensorflow = require('@tensorflow/tfjs-node');
const logger = require('../../config/logger');
const path = require('path');

class EdgeAIProcessor {
    constructor() {
        this.models = {
            activity: null,
            vitals: null,
            audio: null,
            trend: null
        };
        this.modelPath = path.join(__dirname, '../../../ml-models/edge-ai');
    }
    
    async loadModels() {
        logger.info('Loading Edge AI models...');
        
        try {
            // Load pre-trained models from the ML models directory
            // Note: In a production environment, these models should be trained and deployed separately
            const modelPromises = [
                this.loadModel('activity', 'activity_recognition/model.json'),
                this.loadModel('vitals', 'vitals_analysis/model.json'),
                this.loadModel('audio', 'audio_analysis/model.json'),
                this.loadModel('trend', 'trend_analysis/model.json')
            ];
            
            await Promise.all(modelPromises);
            logger.info('Edge AI models loaded successfully');
            
        } catch (error) {
            logger.error('Error loading Edge AI models:', error);
            // Fallback to rule-based analysis if models fail to load
            logger.warn('Falling back to rule-based analysis');
        }
    }
    
    async loadModel(modelName, modelPath) {
        try {
            const fullPath = path.join(this.modelPath, modelPath);
            this.models[modelName] = await tensorflow.loadLayersModel(`file://${fullPath}`);
            logger.info(`Loaded model: ${modelName}`);
        } catch (error) {
            logger.warn(`Failed to load model ${modelName}:`, error.message);
            this.models[modelName] = null;
        }
    }
    
    async analyzeActivity(data) {
        if (!this.models.activity) {
            return this.ruleBasedActivityAnalysis(data);
        }
        
        try {
            // Prepare input tensor
            const inputTensor = tensorflow.tensor2d([
                [
                    data.accelerometer?.x || 0,
                    data.accelerometer?.y || 0,
                    data.accelerometer?.z || 0,
                    data.magnitude || 0
                ]
            ]);
            
            // Run inference
            const prediction = this.models.activity.predict(inputTensor);
            const probabilities = await prediction.data();
            
            // Cleanup tensors
            inputTensor.dispose();
            prediction.dispose();
            
            const activities = ['sitting', 'standing', 'walking', 'running', 'fall'];
            const maxIndex = probabilities.indexOf(Math.max(...probabilities));
            
            return {
                activity: activities[maxIndex],
                confidence: probabilities[maxIndex],
                probabilities: Object.fromEntries(
                    activities.map((activity, i) => [activity, probabilities[i]])
                )
            };
            
        } catch (error) {
            logger.error('Error in AI activity analysis:', error);
            return this.ruleBasedActivityAnalysis(data);
        }
    }
    
    ruleBasedActivityAnalysis(data) {
        const magnitude = data.magnitude || 0;
        
        if (magnitude > 15) {
            return { activity: 'fall', confidence: 0.8 };
        } else if (magnitude > 8) {
            return { activity: 'running', confidence: 0.7 };
        } else if (magnitude > 3) {
            return { activity: 'walking', confidence: 0.6 };
        } else if (magnitude > 1) {
            return { activity: 'standing', confidence: 0.5 };
        } else {
            return { activity: 'sitting', confidence: 0.6 };
        }
    }
    
    async analyzeVitals(vitals, userId) {
        if (!this.models.vitals) {
            return this.ruleBasedVitalsAnalysis(vitals);
        }
        
        try {
            // Prepare input features
            const features = [
                vitals.heart_rate?.value || 0,
                vitals.blood_pressure_systolic?.value || 0,
                vitals.blood_pressure_diastolic?.value || 0,
                vitals.temperature?.value || 0,
                vitals.oxygen_saturation?.value || 0,
                vitals.respiratory_rate?.value || 0
            ];
            
            const inputTensor = tensorflow.tensor2d([features]);
            const prediction = this.models.vitals.predict(inputTensor);
            const result = await prediction.data();
            
            inputTensor.dispose();
            prediction.dispose();
            
            return {
                overallHealth: result[0],
                cardiovascularRisk: result[1],
                respiratoryHealth: result[2],
                recommendations: this.generateRecommendations(result),
                confidence: Math.min(...result.slice(0, 3))
            };
            
        } catch (error) {
            logger.error('Error in AI vitals analysis:', error);
            return this.ruleBasedVitalsAnalysis(vitals);
        }
    }
    
    ruleBasedVitalsAnalysis(vitals) {
        const issues = [];
        let overallScore = 1.0;
        
        // Check each vital sign
        if (vitals.heart_rate?.value) {
            const hr = vitals.heart_rate.value;
            if (hr < 60 || hr > 100) {
                issues.push('Heart rate outside normal range');
                overallScore *= 0.8;
            }
        }
        
        if (vitals.blood_pressure_systolic?.value && vitals.blood_pressure_diastolic?.value) {
            const sys = vitals.blood_pressure_systolic.value;
            const dia = vitals.blood_pressure_diastolic.value;
            
            if (sys > 140 || dia > 90) {
                issues.push('Elevated blood pressure');
                overallScore *= 0.7;
            }
        }
        
        if (vitals.oxygen_saturation?.value) {
            const spo2 = vitals.oxygen_saturation.value;
            if (spo2 < 95) {
                issues.push('Low oxygen saturation');
                overallScore *= 0.6;
            }
        }
        
        return {
            overallHealth: overallScore,
            cardiovascularRisk: issues.length > 0 ? 0.6 : 0.2,
            respiratoryHealth: vitals.oxygen_saturation?.value > 95 ? 0.9 : 0.5,
            issues: issues,
            recommendations: issues.length > 0 ? ['Consult healthcare provider'] : ['Continue monitoring'],
            confidence: 0.7
        };
    }
    
    async analyzeAudio(data) {
        // Simplified audio analysis - in production, this would use a trained model
        return {
            stressLevel: Math.random() * 0.3, // Low stress simulation
            clarity: 0.8 + Math.random() * 0.2,
            breathingRate: 14 + Math.random() * 6,
            mood: Math.random() > 0.7 ? 'stressed' : 'calm',
            confidence: 0.6
        };
    }
    
    async comprehensiveHealthAnalysis(data) {
        const vitalsAnalysis = await this.analyzeVitals(data.currentVitals, data.userId);
        const trends = await this.analyzeTrends({
            data: data.historicalData,
            userId: data.userId,
            timeframe: '24h'
        });
        
        const alerts = [];
        
        // Check for critical conditions
        if (vitalsAnalysis.cardiovascularRisk > 0.7) {
            alerts.push({
                type: 'high_cardiovascular_risk',
                severity: 'high',
                message: 'Elevated cardiovascular risk detected'
            });
        }
        
        if (trends.significantChanges.length > 0) {
            alerts.push({
                type: 'health_trend_alert',
                severity: 'moderate',
                message: 'Significant health trend changes detected'
            });
        }
        
        return {
            vitalsAnalysis,
            trends,
            alerts,
            overallScore: (vitalsAnalysis.overallHealth + (1 - trends.riskScore)) / 2,
            timestamp: new Date()
        };
    }
    
    async analyzeTrends(data) {
        // Simplified trend analysis - in production, this would use time series analysis
        const significantChanges = [];
        
        if (Math.random() > 0.8) {
            significantChanges.push({
                vital: 'heart_rate',
                change: 'increasing',
                significance: 0.8
            });
        }
        
        return {
            significantChanges,
            riskScore: Math.random() * 0.3,
            trendDirection: 'stable',
            confidence: 0.7
        };
    }
    
    generateRecommendations(analysisResult) {
        const recommendations = [];
        
        if (analysisResult[1] > 0.7) { // High cardiovascular risk
            recommendations.push('Consider cardiovascular screening');
            recommendations.push('Increase physical activity gradually');
        }
        
        if (analysisResult[2] < 0.5) { // Poor respiratory health
            recommendations.push('Monitor breathing patterns');
            recommendations.push('Consider pulmonary function test');
        }
        
        return recommendations;
    }
}

module.exports = EdgeAIProcessor;
