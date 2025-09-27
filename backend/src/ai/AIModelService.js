// backend/ai/AIModelService.js
const tf = require('@tensorflow/tfjs-node');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');
const redis = require('redis');

class AIModelService extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.models = new Map();
        this.modelVersions = new Map();
        this.inferenceQueue = [];
        this.isProcessing = false;
        this.redisClient = redis.createClient(config.redis);
        this.pythonPath = config.pythonPath || 'python3';
        this.modelPath = config.modelPath || './models';
        
        this.diseaseModels = [
            'cardiovascular_disease',
            'diabetes_type2',
            'alzheimer_disease',
            'cancer_breast',
            'cancer_lung',
            'cancer_colorectal',
            'depression',
            'hypertension',
            'stroke',
            'kidney_disease'
        ];
        
        this.initialize();
    }
    
    async initialize() {
        await this.redisClient.connect();
        await this.loadModels();
        await this.startInferenceProcessor();
        
        console.log('AI Model Service initialized');
    }
    
    async loadModels() {
        console.log('Loading AI models...');
        
        for (const diseaseType of this.diseaseModels) {
            try {
                await this.loadDiseaseModel(diseaseType);
            } catch (error) {
                console.error(`Failed to load model for ${diseaseType}:`, error);
                // Load fallback model or use rule-based approach
                await this.loadFallbackModel(diseaseType);
            }
        }
        
        // Load ensemble meta-model
        await this.loadEnsembleModel();
        
        console.log(`Loaded ${this.models.size} AI models`);
    }
    
    async loadDiseaseModel(diseaseType) {
        const modelDir = path.join(this.modelPath, diseaseType);
        const modelFile = path.join(modelDir, 'model.json');
        
        try {
            // Check if TensorFlow.js model exists
            const modelExists = await this.fileExists(modelFile);
            
            if (modelExists) {
                const model = await tf.loadLayersModel(`file://${modelFile}`);
                this.models.set(diseaseType, {
                    model: model,
                    type: 'tensorflow',
                    version: '1.0.0',
                    features: await this.loadFeatureConfig(diseaseType),
                    preprocessing: await this.loadPreprocessingConfig(diseaseType)
                });
                
                console.log(`Loaded TensorFlow model for ${diseaseType}`);
            } else {
                // Load Python model
                await this.loadPythonModel(diseaseType);
            }
        } catch (error) {
            console.error(`Error loading model for ${diseaseType}:`, error);
            throw error;
        }
    }
    
    async loadPythonModel(diseaseType) {
        const modelDir = path.join(this.modelPath, diseaseType);
        const pythonScript = path.join(__dirname, 'python', 'model_loader.py');
        
        const options = {
            mode: 'json',
            pythonPath: this.pythonPath,
            args: [modelDir, diseaseType]
        };
        
        try {
            const results = await new Promise((resolve, reject) => {
                PythonShell.run(pythonScript, options, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            this.models.set(diseaseType, {
                type: 'python',
                modelPath: modelDir,
                version: results[0].version || '1.0.0',
                features: results[0].features,
                preprocessing: results[0].preprocessing
            });
            
            console.log(`Loaded Python model for ${diseaseType}`);
        } catch (error) {
            console.error(`Failed to load Python model for ${diseaseType}:`, error);
            throw error;
        }
    }
    
    async loadFallbackModel(diseaseType) {
        // Load rule-based fallback model
        const ruleBasedModel = new RuleBasedModel(diseaseType);
        
        this.models.set(diseaseType, {
            model: ruleBasedModel,
            type: 'rule_based',
            version: '1.0.0',
            features: ruleBasedModel.getRequiredFeatures(),
            preprocessing: null
        });
        
        console.log(`Loaded fallback rule-based model for ${diseaseType}`);
    }
    
    async loadEnsembleModel() {
        const ensembleConfig = {
            type: 'weighted_ensemble',
            weights: {
                'cardiovascular_disease': 0.25,
                'diabetes_type2': 0.20,
                'cancer_breast': 0.15,
                'cancer_lung': 0.15,
                'alzheimer_disease': 0.10,
                'hypertension': 0.10,
                'stroke': 0.05
            },
            aggregationMethod: 'weighted_average'
        };
        
        this.models.set('ensemble', {
            config: ensembleConfig,
            type: 'ensemble',
            version: '1.0.0'
        });
    }
    
    async loadFeatureConfig(diseaseType) {
        const configPath = path.join(this.modelPath, diseaseType, 'features.json');
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            // Return default feature configuration
            return this.getDefaultFeatureConfig(diseaseType);
        }
    }
    
    async loadPreprocessingConfig(diseaseType) {
        const configPath = path.join(this.modelPath, diseaseType, 'preprocessing.json');
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            return null;
        }
    }
    
    getDefaultFeatureConfig(diseaseType) {
        const baseFeatures = [
            'age', 'gender', 'bmi', 'smoking_status', 'exercise_frequency',
            'family_history', 'medication_count', 'systolic_bp', 'diastolic_bp',
            'heart_rate', 'cholesterol_total', 'hdl_cholesterol', 'ldl_cholesterol',
            'triglycerides', 'glucose_fasting', 'hba1c'
        ];
        
        const diseaseSpecificFeatures = {
            'cardiovascular_disease': ['coronary_calcium_score', 'crp', 'homocysteine'],
            'diabetes_type2': ['insulin_level', 'c_peptide', 'microalbumin'],
            'alzheimer_disease': ['apoe_status', 'tau_protein', 'amyloid_beta'],
            'cancer_breast': ['brca1_status', 'brca2_status', 'mammography_density'],
            'hypertension': ['sodium_intake', 'potassium_level', 'renin_activity']
        };
        
        return {
            required: baseFeatures,
            optional: diseaseSpecificFeatures[diseaseType] || [],
            derived: ['bmi_category', 'age_group', 'risk_factor_count']
        };
    }
    
    async predict(patientData, options = {}) {
        const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const prediction = {
            id: predictionId,
            patientId: patientData.patientId,
            timestamp: new Date(),
            status: 'queued',
            options: options,
            data: patientData,
            results: null,
            error: null
        };
        
        // Add to inference queue
        this.inferenceQueue.push(prediction);
        
        // Cache prediction status
        await this.redisClient.setex(
            `prediction:${predictionId}`,
            3600, // 1 hour TTL
            JSON.stringify({ status: 'queued', timestamp: prediction.timestamp })
        );
        
        this.emit('predictionQueued', prediction);
        
        return predictionId;
    }
    
    async startInferenceProcessor() {
        // Process inference queue every 100ms
        setInterval(async () => {
            if (!this.isProcessing && this.inferenceQueue.length > 0) {
                await this.processInferenceQueue();
            }
        }, 100);
        
        console.log('Inference processor started');
    }
    
    async processInferenceQueue() {
        if (this.inferenceQueue.length === 0) return;
        
        this.isProcessing = true;
        
        // Process up to 10 predictions at once
        const batch = this.inferenceQueue.splice(0, 10);
        
        try {
            await Promise.all(batch.map(prediction => this.processPrediction(prediction)));
        } catch (error) {
            console.error('Error processing inference batch:', error);
        }
        
        this.isProcessing = false;
    }
    
    async processPrediction(prediction) {
        try {
            prediction.status = 'processing';
            
            // Update cache
            await this.redisClient.setex(
                `prediction:${prediction.id}`,
                3600,
                JSON.stringify({ 
                    status: 'processing', 
                    timestamp: new Date(),
                    progress: 0.1 
                })
            );
            
            // Preprocess patient data
            const preprocessedData = await this.preprocessPatientData(prediction.data);
            
            // Update progress
            await this.updatePredictionProgress(prediction.id, 0.3);
            
            // Generate predictions for each disease
            const diseaseRisks = {};
            
            for (const diseaseType of this.diseaseModels) {
                try {
                    const risk = await this.predictDiseaseRisk(diseaseType, preprocessedData);
                    diseaseRisks[diseaseType] = risk;
                } catch (error) {
                    console.error(`Error predicting ${diseaseType}:`, error);
                    diseaseRisks[diseaseType] = {
                        risk_score: 0.0,
                        confidence: 0.0,
                        error: error.message
                    };
                }
            }
            
            // Update progress
            await this.updatePredictionProgress(prediction.id, 0.7);
            
            // Calculate ensemble prediction
            const ensemblePrediction = await this.calculateEnsemblePrediction(diseaseRisks);
            
            // Generate explanations
            const explanations = await this.generateExplanations(preprocessedData, diseaseRisks);
            
            // Update progress
            await this.updatePredictionProgress(prediction.id, 0.9);
            
            // Generate recommendations
            const recommendations = await this.generateRecommendations(diseaseRisks, preprocessedData);
            
            // Compile final results
            const results = {
                diseaseRisks: diseaseRisks,
                overallRisk: ensemblePrediction.overallRisk,
                confidence: ensemblePrediction.confidence,
                explanations: explanations,
                recommendations: recommendations,
                modelVersions: this.getModelVersions(),
                timestamp: new Date()
            };
            
            prediction.results = results;
            prediction.status = 'completed';
            
            // Cache final results
            await this.redisClient.setex(
                `prediction:${prediction.id}`,
                3600 * 24, // 24 hours
                JSON.stringify({
                    status: 'completed',
                    results: results,
                    timestamp: new Date()
                })
            );
            
            // Store in database for audit trail
            await this.storePredictionResults(prediction);
            
            this.emit('predictionCompleted', prediction);
            
        } catch (error) {
            prediction.status = 'failed';
            prediction.error = error.message;
            
            await this.redisClient.setex(
                `prediction:${prediction.id}`,
                3600,
                JSON.stringify({
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date()
                })
            );
            
            this.emit('predictionFailed', prediction);
            console.error(`Prediction ${prediction.id} failed:`, error);
        }
    }
    
    async preprocessPatientData(rawData) {
        const preprocessed = {
            demographics: this.extractDemographics(rawData),
            vitals: this.extractVitals(rawData),
            labResults: this.extractLabResults(rawData),
            lifestyle: this.extractLifestyle(rawData),
            familyHistory: this.extractFamilyHistory(rawData),
            medications: this.extractMedications(rawData),
            geneticMarkers: this.extractGeneticMarkers(rawData)
        };
        
        // Calculate derived features
        preprocessed.derived = this.calculateDerivedFeatures(preprocessed);
        
        // Normalize features
        preprocessed.normalized = this.normalizeFeatures(preprocessed);
        
        return preprocessed;
    }
    
    extractDemographics(data) {
        return {
            age: data.age || 0,
            gender: data.gender || 'unknown',
            race: data.race || 'unknown',
            ethnicity: data.ethnicity || 'unknown'
        };
    }
    
    extractVitals(data) {
        const vitals = data.vitals || {};
        
        return {
            systolic_bp: this.getLatestValue(vitals.blood_pressure_systolic) || 120,
            diastolic_bp: this.getLatestValue(vitals.blood_pressure_diastolic) || 80,
            heart_rate: this.getLatestValue(vitals.heart_rate) || 70,
            temperature: this.getLatestValue(vitals.temperature) || 98.6,
            respiratory_rate: this.getLatestValue(vitals.respiratory_rate) || 16,
            oxygen_saturation: this.getLatestValue(vitals.oxygen_saturation) || 98,
            weight: this.getLatestValue(vitals.weight) || 70,
            height: this.getLatestValue(vitals.height) || 170
        };
    }
    
    extractLabResults(data) {
        const labs = data.labResults || {};
        
        return {
            glucose_fasting: labs.glucose_fasting || 90,
            hba1c: labs.hba1c || 5.5,
            cholesterol_total: labs.cholesterol_total || 180,
            hdl_cholesterol: labs.hdl_cholesterol || 50,
            ldl_cholesterol: labs.ldl_cholesterol || 100,
            triglycerides: labs.triglycerides || 150,
            crp: labs.crp || 1.0,
            vitamin_d: labs.vitamin_d || 30,
            b12: labs.b12 || 300,
            folate: labs.folate || 10
        };
    }
    
    extractLifestyle(data) {
        const lifestyle = data.lifestyle || {};
        
        return {
            smoking_status: lifestyle.smoking_status || 'never',
            alcohol_consumption: lifestyle.alcohol_consumption || 'moderate',
            exercise_frequency: lifestyle.exercise_frequency || 2,
            diet_quality: lifestyle.diet_quality || 'average',
            sleep_duration: lifestyle.sleep_duration || 7,
            stress_level: lifestyle.stress_level || 'moderate'
        };
    }
    
    extractFamilyHistory(data) {
        const family = data.familyHistory || {};
        
        return {
            cardiovascular_disease: family.cardiovascular_disease || false,
            diabetes: family.diabetes || false,
            cancer: family.cancer || false,
            alzheimer: family.alzheimer || false,
            hypertension: family.hypertension || false
        };
    }
    
    extractMedications(data) {
        const medications = data.medications || [];
        
        const medicationCategories = {
            antihypertensive: false,
            diabetes_medication: false,
            cholesterol_medication: false,
            anticoagulant: false,
            antidepressant: false
        };
        
        medications.forEach(med => {
            if (med.category in medicationCategories) {
                medicationCategories[med.category] = true;
            }
        });
        
        return {
            ...medicationCategories,
            medication_count: medications.length
        };
    }
    
    extractGeneticMarkers(data) {
        const genetic = data.geneticMarkers || {};
        
        return {
            apoe_e4: genetic.apoe_e4 || 0,
            brca1: genetic.brca1 || 0,
            brca2: genetic.brca2 || 0,
            mthfr: genetic.mthfr || 0,
            cyp2d6: genetic.cyp2d6 || 0
        };
    }
    
    calculateDerivedFeatures(data) {
        const { demographics, vitals, labResults, lifestyle, familyHistory } = data;
        
        // Calculate BMI
        const bmi = vitals.height > 0 ? 
            vitals.weight / Math.pow(vitals.height / 100, 2) : 25;
        
        // BMI category
        const bmiCategory = bmi < 18.5 ? 'underweight' :
                           bmi < 25 ? 'normal' :
                           bmi < 30 ? 'overweight' : 'obese';
        
        // Age group
        const ageGroup = demographics.age < 30 ? 'young' :
                        demographics.age < 50 ? 'middle' :
                        demographics.age < 65 ? 'older' : 'elderly';
        
        // Cardiovascular risk factors
        const cvRiskFactors = [
            demographics.age > 45,
            demographics.gender === 'male',
            bmi >= 30,
            vitals.systolic_bp >= 140,
            lifestyle.smoking_status !== 'never',
            labResults.cholesterol_total >= 240,
            familyHistory.cardiovascular_disease
        ].filter(Boolean).length;
        
        // Diabetes risk factors
        const diabetesRiskFactors = [
            demographics.age > 45,
            bmi >= 25,
            vitals.systolic_bp >= 140,
            labResults.glucose_fasting >= 100,
            labResults.hba1c >= 5.7,
            familyHistory.diabetes
        ].filter(Boolean).length;
        
        return {
            bmi: bmi,
            bmi_category: bmiCategory,
            age_group: ageGroup,
            cv_risk_factor_count: cvRiskFactors,
            diabetes_risk_factor_count: diabetesRiskFactors,
            pulse_pressure: vitals.systolic_bp - vitals.diastolic_bp,
            ldl_hdl_ratio: labResults.hdl_cholesterol > 0 ? 
                labResults.ldl_cholesterol / labResults.hdl_cholesterol : 2.0
        };
    }
    
    normalizeFeatures(data) {
        // Normalization ranges for different features
        const normalizationRanges = {
            age: [0, 100],
            bmi: [15, 50],
            systolic_bp: [80, 200],
            diastolic_bp: [50, 120],
            heart_rate: [40, 120],
            glucose_fasting: [70, 200],
            cholesterol_total: [100, 400]
        };
        
        const normalized = {};
        
        for (const [key, range] of Object.entries(normalizationRanges)) {
            const value = this.getNestedValue(data, key);
            if (value !== undefined) {
                normalized[key] = this.minMaxNormalize(value, range[0], range[1]);
            }
        }
        
        return normalized;
    }
    
    minMaxNormalize(value, min, max) {
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    getLatestValue(values) {
        if (!Array.isArray(values) || values.length === 0) return null;
        return values[values.length - 1];
    }
    
    async predictDiseaseRisk(diseaseType, preprocessedData) {
        const modelInfo = this.models.get(diseaseType);
        if (!modelInfo) {
            throw new Error(`Model not found for ${diseaseType}`);
        }
        
        switch (modelInfo.type) {
            case 'tensorflow':
                return await this.predictWithTensorFlow(modelInfo, preprocessedData);
            case 'python':
                return await this.predictWithPython(diseaseType, modelInfo, preprocessedData);
            case 'rule_based':
                return await this.predictWithRules(modelInfo.model, preprocessedData);
            default:
                throw new Error(`Unknown model type: ${modelInfo.type}`);
        }
    }
    
    async predictWithTensorFlow(modelInfo, data) {
        try {
            // Prepare input features
            const features = this.prepareFeatures(data, modelInfo.features);
            const inputTensor = tf.tensor2d([features]);
            
            // Make prediction
            const prediction = modelInfo.model.predict(inputTensor);
            const result = await prediction.data();
            
            // Cleanup tensors
            inputTensor.dispose();
            prediction.dispose();
            
            return {
                risk_score: result[0],
                confidence: this.calculateConfidence(result[0]),
                model_version: modelInfo.version
            };
        } catch (error) {
            console.error('TensorFlow prediction error:', error);
            throw error;
        }
    }
    
    async predictWithPython(diseaseType, modelInfo, data) {
        const pythonScript = path.join(__dirname, 'python', 'predict.py');
        
        const options = {
            mode: 'json',
            pythonPath: this.pythonPath,
            args: [
                modelInfo.modelPath,
                diseaseType,
                JSON.stringify(data)
            ]
        };
        
        try {
            const results = await new Promise((resolve, reject) => {
                PythonShell.run(pythonScript, options, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            return results[0];
        } catch (error) {
            console.error('Python prediction error:', error);
            throw error;
        }
    }
    
    async predictWithRules(ruleModel, data) {
        return ruleModel.predict(data);
    }
    
    prepareFeatures(data, featureConfig) {
        const features = [];
        
        for (const featureName of featureConfig.required) {
            const value = this.getNestedValue(data, featureName);
            features.push(value || 0);
        }
        
        return features;
    }
    
    calculateConfidence(riskScore) {
        // Simple confidence calculation based on distance from decision boundary
        const distanceFromBoundary = Math.abs(riskScore - 0.5);
        return Math.min(0.95, 0.5 + distanceFromBoundary);
    }
    
    async calculateEnsemblePrediction(diseaseRisks) {
        const ensembleConfig = this.models.get('ensemble').config;
        
        let weightedSum = 0;
        let totalWeight = 0;
        let confidenceSum = 0;
        
        for (const [disease, weight] of Object.entries(ensembleConfig.weights)) {
            if (diseaseRisks[disease] && !diseaseRisks[disease].error) {
                weightedSum += diseaseRisks[disease].risk_score * weight;
                confidenceSum += diseaseRisks[disease].confidence * weight;
                totalWeight += weight;
            }
        }
        
        return {
            overallRisk: totalWeight > 0 ? weightedSum / totalWeight : 0,
            confidence: totalWeight > 0 ? confidenceSum / totalWeight : 0
        };
    }
    
    async generateExplanations(data, diseaseRisks) {
        const explanations = {};
        
        for (const [disease, risk] of Object.entries(diseaseRisks)) {
            if (risk.error) continue;
            
            explanations[disease] = {
                riskLevel: this.categorizeRisk(risk.risk_score),
                keyFactors: await this.identifyKeyRiskFactors(disease, data),
                interpretation: this.generateRiskInterpretation(disease, risk.risk_score)
            };
        }
        
        return explanations;
    }
    
    categorizeRisk(riskScore) {
        if (riskScore < 0.2) return 'low';
        if (riskScore < 0.5) return 'moderate';
        if (riskScore < 0.8) return 'high';
        return 'very_high';
    }
    
    async identifyKeyRiskFactors(disease, data) {
        // This would use SHAP or similar explainability technique
        // For now, returning rule-based factors
        
        const riskFactors = [];
        const { demographics, vitals, labResults, lifestyle, familyHistory, derived } = data;
        
        switch (disease) {
            case 'cardiovascular_disease':
                if (demographics.age > 45) riskFactors.push('Age over 45');
                if (derived.bmi >= 30) riskFactors.push('Obesity (BMI ≥ 30)');
                if (vitals.systolic_bp >= 140) riskFactors.push('High blood pressure');
                if (lifestyle.smoking_status !== 'never') riskFactors.push('Smoking history');
                if (familyHistory.cardiovascular_disease) riskFactors.push('Family history');
                break;
                
            case 'diabetes_type2':
                if (derived.bmi >= 25) riskFactors.push('Overweight (BMI ≥ 25)');
                if (labResults.glucose_fasting >= 100) riskFactors.push('Elevated fasting glucose');
                if (labResults.hba1c >= 5.7) riskFactors.push('Elevated HbA1c');
                if (familyHistory.diabetes) riskFactors.push('Family history of diabetes');
                break;
        }
        
        return riskFactors.slice(0, 5); // Top 5 factors
    }
    
    generateRiskInterpretation(disease, riskScore) {
        const riskLevel = this.categorizeRisk(riskScore);
        const percentage = Math.round(riskScore * 100);
        
        const interpretations = {
            low: `Your ${percentage}% risk is considered low. Continue maintaining healthy lifestyle habits.`,
            moderate: `Your ${percentage}% risk is moderate. Consider lifestyle modifications and regular monitoring.`,
            high: `Your ${percentage}% risk is high. Recommend consultation with healthcare provider for prevention strategies.`,
            very_high: `Your ${percentage}% risk is very high. Urgent medical consultation recommended for immediate intervention.`
        };
        
        return interpretations[riskLevel];
    }
    
    async generateRecommendations(diseaseRisks, data) {
        const recommendations = [];
        
        for (const [disease, risk] of Object.entries(diseaseRisks)) {
            if (risk.error || risk.risk_score < 0.3) continue;
            
            const diseaseRecommendations = await this.getDiseaseRecommendations(disease, risk.risk_score, data);
            recommendations.push(...diseaseRecommendations);
        }
        
        // Remove duplicates and prioritize
        const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
        return this.prioritizeRecommendations(uniqueRecommendations);
    }
    
    async getDiseaseRecommendations(disease, riskScore, data) {
        const recommendations = [];
        const priority = riskScore > 0.7 ? 'high' : riskScore > 0.5 ? 'medium' : 'low';
        
        const diseaseRecommendations = {
            'cardiovascular_disease': [
                { text: 'Schedule cardiovascular screening', priority: 'high', type: 'medical' },
                { text: 'Adopt Mediterranean diet', priority: 'medium', type: 'lifestyle' },
                { text: 'Increase aerobic exercise to 150 min/week', priority: 'medium', type: 'lifestyle' },
                { text: 'Monitor blood pressure regularly', priority: 'medium', type: 'monitoring' }
            ],
            'diabetes_type2': [
                { text: 'Schedule diabetes screening (HbA1c, fasting glucose)', priority: 'high', type: 'medical' },
                { text: 'Reduce refined carbohydrate intake', priority: 'high', type: 'lifestyle' },
                { text: 'Aim for 5-10% weight loss if overweight', priority: 'medium', type: 'lifestyle' },
                { text: 'Monitor blood glucose levels', priority: 'medium', type: 'monitoring' }
            ]
        };
        
        const baseRecommendations = diseaseRecommendations[disease] || [];
        
        return baseRecommendations.filter(rec => 
            this.shouldIncludeRecommendation(rec, priority, data)
        );
    }
    
    shouldIncludeRecommendation(recommendation, patientPriority, data) {
        // Filter recommendations based on patient's current status and priority
        if (patientPriority === 'high') return true;
        if (patientPriority === 'medium' && recommendation.priority !== 'low') return true;
        return recommendation.priority === 'low';
    }
    
    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            if (seen.has(rec.text)) return false;
            seen.add(rec.text);
            return true;
        });
    }
    
    prioritizeRecommendations(recommendations) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        return recommendations
            .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
            .slice(0, 10); // Top 10 recommendations
    }
    
    getModelVersions() {
        const versions = {};
        for (const [modelName, modelInfo] of this.models.entries()) {
            versions[modelName] = modelInfo.version;
        }
        return versions;
    }
    
    async updatePredictionProgress(predictionId, progress) {
        await this.redisClient.setex(
            `prediction:${predictionId}`,
            3600,
            JSON.stringify({
                status: 'processing',
                progress: progress,
                timestamp: new Date()
            })
        );
    }
    
    async storePredictionResults(prediction) {
        // This would store in the main database
        console.log(`Storing prediction results for ${prediction.id}`);
        // Implementation would depend on your database structure
    }
    
    async getPredictionStatus(predictionId) {
        const cached = await this.redisClient.get(`prediction:${predictionId}`);
        return cached ? JSON.parse(cached) : null;
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Rule-based fallback model
class RuleBasedModel {
    constructor(diseaseType) {
        this.diseaseType = diseaseType;
        this.rules = this.loadRules(diseaseType);
    }
    
    loadRules(diseaseType) {
        const rules = {
            'cardiovascular_disease': [
                { condition: 'age > 65', weight: 0.2 },
                { condition: 'gender == "male"', weight: 0.1 },
                { condition: 'bmi >= 30', weight: 0.15 },
                { condition: 'systolic_bp >= 140', weight: 0.2 },
                { condition: 'smoking_status != "never"', weight: 0.15 },
                { condition: 'cholesterol_total >= 240', weight: 0.1 },
                { condition: 'family_history.cardiovascular_disease', weight: 0.1 }
            ],
            'diabetes_type2': [
                { condition: 'age > 45', weight: 0.15 },
                { condition: 'bmi >= 25', weight: 0.2 },
                { condition: 'glucose_fasting >= 100', weight: 0.25 },
                { condition: 'hba1c >= 5.7', weight: 0.2 },
                { condition: 'family_history.diabetes', weight: 0.2 }
            ]
        };
        
        return rules[diseaseType] || [];
    }
    
    predict(data) {
        let riskScore = 0;
        let applicableRules = 0;
        
        for (const rule of this.rules) {
            if (this.evaluateCondition(rule.condition, data)) {
                riskScore += rule.weight;
                applicableRules++;
            }
        }
        
        // Normalize risk score
        const normalizedRisk = Math.min(1.0, riskScore);
        
        return {
            risk_score: normalizedRisk,
            confidence: applicableRules / this.rules.length,
            model_version: '1.0.0-rule-based'
        };
    }
    
    evaluateCondition(condition, data) {
        // Simple condition evaluator
        try {
            // Replace data references in condition
            const evaluableCondition = condition.replace(/(\w+(?:\.\w+)*)/g, (match) => {
                const value = this.getNestedValue(data, match);
                if (typeof value === 'string') {
                    return `"${value}"`;
                }
                return value !== undefined ? value : 'undefined';
            });
            
            // Evaluate the condition (in production, use a safer evaluator)
            return eval(evaluableCondition);
        } catch (error) {
            console.warn(`Error evaluating condition: ${condition}`, error);
            return false;
        }
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    getRequiredFeatures() {
        return {
            required: [
                'age', 'gender', 'bmi', 'systolic_bp', 'diastolic_bp',
                'smoking_status', 'cholesterol_total', 'glucose_fasting',
                'hba1c', 'family_history'
            ],
            optional: [],
            derived: ['bmi_category']
        };
    }
}

module.exports = { AIModelService, RuleBasedModel };

// backend/ai/FeatureEngineeringService.js
class FeatureEngineeringService {
    constructor() {
        this.featureExtractors = new Map();
        this.setupFeatureExtractors();
    }
    
    setupFeatureExtractors() {
        // Voice feature extractor
        this.featureExtractors.set('voice', new VoiceFeatureExtractor());
        
        // Activity feature extractor
        this.featureExtractors.set('activity', new ActivityFeatureExtractor());
        
        // Sleep feature extractor
        this.featureExtractors.set('sleep', new SleepFeatureExtractor());
        
        // Temporal feature extractor
        this.featureExtractors.set('temporal', new TemporalFeatureExtractor());
    }
    
    async extractFeatures(dataType, rawData) {
        const extractor = this.featureExtractors.get(dataType);
        if (!extractor) {
            throw new Error(`No feature extractor found for ${dataType}`);
        }
        
        return await extractor.extract(rawData);
    }
    
    async extractAllFeatures(patientData) {
        const features = {};
        
        for (const [dataType, extractor] of this.featureExtractors) {
            if (patientData[dataType]) {
                try {
                    features[dataType] = await extractor.extract(patientData[dataType]);
                } catch (error) {
                    console.error(`Error extracting ${dataType} features:`, error);
                    features[dataType] = {};
                }
            }
        }
        
        return features;
    }
}

class VoiceFeatureExtractor {
    async extract(voiceData) {
        // Extract voice biomarkers
        const features = {
            // Fundamental frequency features
            f0_mean: this.calculateMean(voiceData.f0),
            f0_std: this.calculateStd(voiceData.f0),
            f0_range: this.calculateRange(voiceData.f0),
            
            // Jitter and shimmer
            jitter: voiceData.jitter || 0,
            shimmer: voiceData.shimmer || 0,
            
            // Harmonics-to-noise ratio
            hnr: voiceData.hnr || 20,
            
            // Spectral features
            spectral_centroid: voiceData.spectral_centroid || 2000,
            spectral_bandwidth: voiceData.spectral_bandwidth || 1000,
            
            // MFCC features
            mfcc_1: voiceData.mfcc?.[0] || 0,
            mfcc_2: voiceData.mfcc?.[1] || 0,
            mfcc_3: voiceData.mfcc?.[2] || 0,
            
            // Speaking rate and pauses
            speaking_rate: voiceData.speaking_rate || 3,
            pause_ratio: voiceData.pause_ratio || 0.2,
            
            // Voice quality indicators
            breathiness: voiceData.breathiness || 0,
            roughness: voiceData.roughness || 0,
            
            // Emotional indicators
            valence: voiceData.valence || 0.5,
            arousal: voiceData.arousal || 0.5,
            stress_level: voiceData.stress_level || 0.3
        };
        
        return features;
    }
    
    calculateMean(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    calculateStd(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        const mean = this.calculateMean(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    
    calculateRange(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        return Math.max(...values) - Math.min(...values);
    }
}

class ActivityFeatureExtractor {
    async extract(activityData) {
        const features = {
            // Step counting features
            daily_steps: activityData.daily_steps || 0,
            step_consistency: this.calculateStepConsistency(activityData.weekly_steps),
            
            // Activity intensity
            sedentary_time: activityData.sedentary_time || 0,
            light_activity_time: activityData.light_activity_time || 0,
            moderate_activity_time: activityData.moderate_activity_time || 0,
            vigorous_activity_time: activityData.vigorous_activity_time || 0,
            
            // Heart rate during activity
            resting_hr: activityData.resting_hr || 70,
            max_hr: activityData.max_hr || 180,
            hr_variability: activityData.hr_variability || 30,
            
            // Movement patterns
            gait_speed: activityData.gait_speed || 1.2,
            gait_variability: activityData.gait_variability || 0.1,
            balance_score: activityData.balance_score || 0.8,
            
            // Activity timing
            activity_regularity: this.calculateActivityRegularity(activityData.hourly_activity),
            weekend_activity_ratio: activityData.weekend_activity_ratio || 0.8,
            
            // Caloric expenditure
            total_calories: activityData.total_calories || 2000,
            active_calories: activityData.active_calories || 500,
            calories_per_step: activityData.total_calories / Math.max(1, activityData.daily_steps)
        };
        
        return features;
    }
    
    calculateStepConsistency(weeklySteps) {
        if (!Array.isArray(weeklySteps) || weeklySteps.length === 0) return 0;
        const mean = weeklySteps.reduce((sum, steps) => sum + steps, 0) / weeklySteps.length;
        const variance = weeklySteps.reduce((sum, steps) => sum + Math.pow(steps - mean, 2), 0) / weeklySteps.length;
        return 1 / (1 + Math.sqrt(variance) / mean); // Higher consistency = lower CV
    }
    
    calculateActivityRegularity(hourlyActivity) {
        if (!Array.isArray(hourlyActivity) || hourlyActivity.length === 0) return 0;
        // Calculate entropy of hourly activity distribution
        const total = hourlyActivity.reduce((sum, activity) => sum + activity, 0);
        if (total === 0) return 0;
        
        const probabilities = hourlyActivity.map(activity => activity / total);
        const entropy = -probabilities.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);
        
        return 1 - (entropy / Math.log2(hourlyActivity.length)); // Normalized regularity
    }
}

class SleepFeatureExtractor {
    async extract(sleepData) {
        const features = {
            // Sleep duration and timing
            sleep_duration: sleepData.sleep_duration || 7,
            bedtime_hour: sleepData.bedtime_hour || 23,
            wake_time_hour: sleepData.wake_time_hour || 7,
            
            // Sleep quality metrics
            sleep_efficiency: sleepData.sleep_efficiency || 0.85,
            sleep_latency: sleepData.sleep_latency || 15,
            wake_after_sleep_onset: sleepData.wake_after_sleep_onset || 30,
            
            // Sleep stage distribution
            light_sleep_percentage: sleepData.light_sleep_percentage || 0.55,
            deep_sleep_percentage: sleepData.deep_sleep_percentage || 0.20,
            rem_sleep_percentage: sleepData.rem_sleep_percentage || 0.25,
            
            // Sleep consistency
            bedtime_consistency: this.calculateBedtimeConsistency(sleepData.weekly_bedtimes),
            sleep_duration_consistency: this.calculateDurationConsistency(sleepData.weekly_durations),
            
            // Sleep disruption indicators
            awakenings_count: sleepData.awakenings_count || 2,
            longest_wake_period: sleepData.longest_wake_period || 5,
            
            // Heart rate during sleep
            sleep_hr_mean: sleepData.sleep_hr_mean || 60,
            sleep_hr_variability: sleepData.sleep_hr_variability || 5,
            
            // Respiratory indicators
            sleep_respiratory_rate: sleepData.sleep_respiratory_rate || 14,
            respiratory_disturbance_index: sleepData.respiratory_disturbance_index || 0,
            
            // Movement during sleep
            sleep_movement_index: sleepData.sleep_movement_index || 0.1,
            position_changes: sleepData.position_changes || 15,
            
            // Sleep environment
            room_temperature: sleepData.room_temperature || 20,
            ambient_light: sleepData.ambient_light || 0,
            noise_level: sleepData.noise_level || 30
        };
        
        return features;
    }
    
    calculateBedtimeConsistency(weeklyBedtimes) {
        if (!Array.isArray(weeklyBedtimes) || weeklyBedtimes.length === 0) return 0;
        
        // Convert bedtimes to minutes from midnight
        const bedtimeMinutes = weeklyBedtimes.map(time => {
            const hour = parseInt(time.split(':')[0]);
            const minute = parseInt(time.split(':')[1]);
            return hour * 60 + minute;
        });
        
        const std = this.calculateStd(bedtimeMinutes);
        return Math.max(0, 1 - (std / 60)); // Normalize to 0-1 scale
    }
    
    calculateDurationConsistency(weeklyDurations) {
        if (!Array.isArray(weeklyDurations) || weeklyDurations.length === 0) return 0;
        const std = this.calculateStd(weeklyDurations);
        return Math.max(0, 1 - (std / 2)); // Normalize to 0-1 scale
    }
    
    calculateStd(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
}

class TemporalFeatureExtractor {
    async extract(temporalData) {
        const features = {
            // Circadian rhythm indicators
            circadian_regularity: temporalData.circadian_regularity || 0.8,
            melatonin_onset_time: temporalData.melatonin_onset_time || 22,
            core_body_temp_nadir: temporalData.core_body_temp_nadir || 6,
            
            // Weekly patterns
            weekday_weekend_difference: temporalData.weekday_weekend_difference || 0.1,
            monday_effect: temporalData.monday_effect || 0,
            friday_effect: temporalData.friday_effect || 0,
            
            // Seasonal patterns
            seasonal_affective_score: temporalData.seasonal_affective_score || 0,
            daylight_exposure: temporalData.daylight_exposure || 8,
            
            // Activity timing patterns
            morning_activity_ratio: temporalData.morning_activity_ratio || 0.3,
            evening_activity_ratio: temporalData.evening_activity_ratio || 0.3,
            
            // Meal timing
            breakfast_time_regularity: temporalData.breakfast_time_regularity || 0.8,
            dinner_time_regularity: temporalData.dinner_time_regularity || 0.7,
            
            // Social jetlag
            social_jetlag: temporalData.social_jetlag || 1, // Hours
            
            // Chronotype indicators
            chronotype_score: temporalData.chronotype_score || 0, // -2 to +2 (extreme evening to extreme morning)
            
            // Shift work indicators
            shift_work_disorder_risk: temporalData.shift_work_disorder_risk || 0,
            
            // Time zone changes
            recent_timezone_changes: temporalData.recent_timezone_changes || 0
        };
        
        return features;
    }
}

module.exports = {
    FeatureEngineeringService,
    VoiceFeatureExtractor,
    ActivityFeatureExtractor,
    SleepFeatureExtractor,
    TemporalFeatureExtractor
};

// backend/ai/ModelTrainingService.js
class ModelTrainingService {
    constructor(config) {
        this.config = config;
        this.trainingQueue = [];
        this.activeTraining = new Map();
        this.trainingHistory = new Map();
    }
    
    async initiateTraining(trainingConfig) {
        const trainingId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const trainingJob = {
            id: trainingId,
            config: trainingConfig,
            status: 'queued',
            startTime: null,
            endTime: null,
            metrics: {},
            error: null
        };
        
        this.trainingQueue.push(trainingJob);
        this.trainingHistory.set(trainingId, trainingJob);
        
        // Start training if not already running
        if (this.trainingQueue.length === 1) {
            setImmediate(() => this.processTrainingQueue());
        }
        
        return trainingId;
    }
    
    async processTrainingQueue() {
        while (this.trainingQueue.length > 0) {
            const job = this.trainingQueue.shift();
            await this.executeTraining(job);
        }
    }
    
    async executeTraining(job) {
        try {
            job.status = 'running';
            job.startTime = new Date();
            this.activeTraining.set(job.id, job);
            
            console.log(`Starting training job: ${job.id}`);
            
            // Execute Python training script
            const results = await this.runPythonTraining(job);
            
            job.status = 'completed';
            job.endTime = new Date();
            job.metrics = results.metrics;
            
            console.log(`Training completed: ${job.id}`);
            
        } catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            job.error = error.message;
            
            console.error(`Training failed: ${job.id}`, error);
        } finally {
            this.activeTraining.delete(job.id);
        }
    }
    
    async runPythonTraining(job) {
        const pythonScript = path.join(__dirname, 'python', 'train_model.py');
        
        const options = {
            mode: 'json',
            pythonPath: this.config.pythonPath,
            args: [JSON.stringify(job.config)]
        };
        
        return new Promise((resolve, reject) => {
            PythonShell.run(pythonScript, options, (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }
    
    getTrainingStatus(trainingId) {
        return this.trainingHistory.get(trainingId);
    }
    
    getAllTrainingJobs() {
        return Array.from(this.trainingHistory.values());
    }
    
    cancelTraining(trainingId) {
        const job = this.trainingHistory.get(trainingId);
        if (job && job.status === 'queued') {
            job.status = 'cancelled';
            this.trainingQueue = this.trainingQueue.filter(j => j.id !== trainingId);
            return true;
        }
        return false;
    }
}

module.exports = { ModelTrainingService };

// backend/ai/ModelValidationService.js
class ModelValidationService {
    constructor() {
        this.validationMetrics = new Map();
        this.validationThresholds = {
            accuracy: 0.85,
            precision: 0.80,
            recall: 0.80,
            f1_score: 0.80,
            auc_roc: 0.85
        };
    }
    
    async validateModel(modelId, validationData) {
        console.log(`Starting validation for model: ${modelId}`);
        
        try {
            const metrics = await this.calculateValidationMetrics(modelId, validationData);
            const passed = this.checkValidationThresholds(metrics);
            
            const validationResult = {
                modelId: modelId,
                timestamp: new Date(),
                metrics: metrics,
                passed: passed,
                thresholds: this.validationThresholds
            };
            
            this.validationMetrics.set(modelId, validationResult);
            
            return validationResult;
        } catch (error) {
            console.error(`Validation failed for model ${modelId}:`, error);
            throw error;
        }
    }
    
    async calculateValidationMetrics(modelId, validationData) {
        // This would run the model on validation data and calculate metrics
        const pythonScript = path.join(__dirname, 'python', 'validate_model.py');
        
        const options = {
            mode: 'json',
            pythonPath: 'python3',
            args: [modelId, JSON.stringify(validationData)]
        };
        
        return new Promise((resolve, reject) => {
            PythonShell.run(pythonScript, options, (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }
    
    checkValidationThresholds(metrics) {
        for (const [metric, threshold] of Object.entries(this.validationThresholds)) {
            if (metrics[metric] < threshold) {
                return false;
            }
        }
        return true;
    }
    
    getValidationHistory(modelId) {
        return this.validationMetrics.get(modelId);
    }
}

module.exports = { ModelValidationService };