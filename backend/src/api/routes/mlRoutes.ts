import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest';
import MLController from '../../controllers/MLController';

const router = Router();

/**
 * @route   GET /api/ml/health
 * @desc    Check ML service health
 * @access  Private
 */
router.get('/health', MLController.getHealth);

/**
 * @route   POST /api/ml/analyze
 * @desc    Analyze patient data and get risk prediction
 * @access  Private
 */
router.post(
  '/analyze',
  [
    body('user_id').isString().notEmpty(),
    body('age').isInt({ min: 0, max: 120 }),
    body('gender').isIn(['male', 'female', 'other']),
    body('bmi').isNumeric(),
    // Add more validation as needed
  ],
  validateRequest,
  MLController.analyzePatient
);

/**
 * @route   POST /api/ml/analyze-voice
 * @desc    Analyze voice data for health insights
 * @access  Private
 */
router.post(
  '/analyze-voice',
  [
    body('audio').isObject(),
    body('metadata').optional().isObject()
  ],
  validateRequest,
  MLController.analyzeVoice
);

export default router;
