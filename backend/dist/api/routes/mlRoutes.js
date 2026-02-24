"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validateRequest_1 = require("../../middleware/validateRequest");
const MLController_1 = __importDefault(require("../../controllers/MLController"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/ml/health
 * @desc    Check ML service health
 * @access  Private
 */
router.get('/health', MLController_1.default.getHealth);
/**
 * @route   POST /api/ml/analyze
 * @desc    Analyze patient data and get risk prediction
 * @access  Private
 */
router.post('/analyze', [
    (0, express_validator_1.body)('user_id').isString().notEmpty(),
    (0, express_validator_1.body)('age').isInt({ min: 0, max: 120 }),
    (0, express_validator_1.body)('gender').isIn(['male', 'female', 'other']),
    (0, express_validator_1.body)('bmi').isNumeric(),
    // Add more validation as needed
], validateRequest_1.validateRequest, MLController_1.default.analyzePatient);
/**
 * @route   POST /api/ml/analyze-voice
 * @desc    Analyze voice data for health insights
 * @access  Private
 */
router.post('/analyze-voice', [
    (0, express_validator_1.body)('audio').isObject(),
    (0, express_validator_1.body)('metadata').optional().isObject()
], validateRequest_1.validateRequest, MLController_1.default.analyzeVoice);
exports.default = router;
