"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OnboardingController_1 = require("../controllers/OnboardingController");
const authorization_1 = require("../middleware/authorization");
const router = (0, express_1.Router)();
const controller = new OnboardingController_1.OnboardingController();
// All routes require authentication
router.use(authorization_1.authenticate);
/**
 * @route GET /api/onboarding/status
 * @desc Get current onboarding status
 * @access Patient
 */
router.get('/status', controller.getOnboardingStatus);
/**
 * @route POST /api/onboarding/start
 * @desc Start or resume onboarding process
 * @access Patient
 */
router.post('/start', controller.startOnboarding);
/**
 * @route PUT /api/onboarding/step
 * @desc Update current onboarding step
 * @access Patient
 */
router.put('/step', controller.updateStep);
/**
 * @route PUT /api/onboarding/profile
 * @desc Save profile data
 * @access Patient
 */
router.put('/profile', controller.saveProfile);
/**
 * @route POST /api/onboarding/consent
 * @desc Save consent data
 * @access Patient
 */
router.post('/consent', controller.saveConsent);
/**
 * @route POST /api/onboarding/medical-records
 * @desc Connect medical record provider
 * @access Patient
 */
router.post('/medical-records', controller.connectMedicalRecord);
/**
 * @route GET /api/onboarding/medical-records
 * @desc Get connected medical records
 * @access Patient
 */
router.get('/medical-records', controller.getMedicalRecords);
/**
 * @route POST /api/onboarding/devices
 * @desc Connect a device
 * @access Patient
 */
router.post('/devices', controller.connectDevice);
/**
 * @route GET /api/onboarding/devices
 * @desc Get connected devices
 * @access Patient
 */
router.get('/devices', controller.getDevices);
/**
 * @route DELETE /api/onboarding/devices/:deviceId
 * @desc Disconnect a device
 * @access Patient
 */
router.delete('/devices/:deviceId', controller.disconnectDevice);
/**
 * @route POST /api/onboarding/goals
 * @desc Add a health goal
 * @access Patient
 */
router.post('/goals', controller.addHealthGoal);
/**
 * @route GET /api/onboarding/goals
 * @desc Get health goals
 * @access Patient
 */
router.get('/goals', controller.getHealthGoals);
/**
 * @route POST /api/onboarding/complete
 * @desc Mark onboarding as complete
 * @access Patient
 */
router.post('/complete', controller.completeOnboarding);
exports.default = router;
