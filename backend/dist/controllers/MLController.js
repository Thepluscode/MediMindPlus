"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLController = void 0;
const MLService_1 = require("../services/MLService");
const logger_1 = require("../utils/logger");
class MLController {
    constructor() {
        this.getHealth = async (req, res) => {
            try {
                const isHealthy = await this.mlService.getHealth();
                if (isHealthy) {
                    res.status(200).json({ status: 'healthy', service: 'ml' });
                }
                else {
                    res.status(503).json({ status: 'unavailable', service: 'ml' });
                }
            }
            catch (error) {
                logger_1.logger.error('Error checking ML service health:', error);
                res.status(500).json({ error: 'Failed to check ML service health' });
            }
        };
        this.analyzePatient = async (req, res) => {
            try {
                const patientData = req.body;
                // Basic validation
                if (!patientData.user_id) {
                    return res.status(400).json({ error: 'User ID is required' });
                }
                // Add any additional validation here
                const result = await this.mlService.analyzePatient(patientData);
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('Error analyzing patient:', error);
                res.status(500).json({ error: 'Failed to analyze patient data' });
            }
        };
        this.analyzeVoice = async (req, res) => {
            try {
                const audioData = req.body;
                if (!audioData) {
                    return res.status(400).json({ error: 'Audio data is required' });
                }
                const result = await this.mlService.analyzeVoice(audioData);
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('Error analyzing voice:', error);
                res.status(500).json({ error: 'Failed to analyze voice data' });
            }
        };
        this.mlService = new MLService_1.MLService();
    }
}
exports.MLController = MLController;
exports.default = new MLController();
