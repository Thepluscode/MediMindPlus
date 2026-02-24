"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
class MLService {
    constructor(client) {
        // Handle singleton pattern
        if (MLService.instance && !client) {
            return MLService.instance;
        }
        // Initialize client with provided instance or create new one
        this.client = client || axios_1.default.create({
            baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8001',
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
        });
        // Initialize logger
        this.logger = logger_1.default.child({ service: 'MLService' });
        // Set up request/response interceptors
        this.setupInterceptors();
        // Update singleton instance if needed
        if (!MLService.instance || client) {
            MLService.instance = this;
        }
    }
    /**
     * Set up Axios interceptors for request/response handling
     */
    setupInterceptors() {
        // Add request interceptor for logging
        this.client.interceptors.request.use((config) => {
            var _a;
            this.logger.info(`ML Service Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            var _a, _b;
            this.logger.error('ML Service Request Error:', {
                message: error.message,
                url: (_a = error.config) === null || _a === void 0 ? void 0 : _a.url,
                method: (_b = error.config) === null || _b === void 0 ? void 0 : _b.method,
            });
            return Promise.reject(error);
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            return response;
        }, (error) => {
            var _a, _b, _c, _d;
            this.logger.error('ML Service Response Error:', {
                message: error.message,
                status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
                url: (_c = error.config) === null || _c === void 0 ? void 0 : _c.url,
                method: (_d = error.config) === null || _d === void 0 ? void 0 : _d.method,
            });
            return Promise.reject(error);
        });
    }
    static getInstance() {
        if (!MLService.instance) {
            MLService.instance = new MLService();
        }
        return MLService.instance;
    }
    async getHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data.status === 'healthy';
        }
        catch (error) {
            logger_1.default.error('Error checking ML service health:', error);
            return false;
        }
    }
    async analyzePatient(patientData) {
        try {
            const response = await this.client.post('/predict', patientData);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error analyzing patient with ML service:', error);
            throw new Error('Failed to analyze patient data with ML service');
        }
    }
    async analyzeVoice(audioData) {
        try {
            const response = await this.client.post('/analyze-voice', audioData);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error analyzing voice with ML service:', error);
            throw new Error('Failed to analyze voice data');
        }
    }
}
exports.MLService = MLService;
exports.default = MLService.getInstance();
