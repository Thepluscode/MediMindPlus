import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticate } from '../middleware/authorization';

const router = Router();
const settingsController = new SettingsController();

// Profile routes
router.get('/profile', authenticate, settingsController.getProfile);
router.put('/profile', authenticate, settingsController.updateProfile);
router.post('/profile/avatar', authenticate, settingsController.uploadAvatar);

// Password routes
router.post('/password/change', authenticate, settingsController.changePassword);
router.post('/password/reset-request', settingsController.requestPasswordReset);
router.post('/password/reset', settingsController.resetPassword);

// Contact routes
router.post('/contact', settingsController.submitContactForm);
router.get('/contact/history', authenticate, settingsController.getContactHistory);

// Help & Support routes
router.get('/help/articles', settingsController.getHelpArticles);
router.get('/help/article/:id', settingsController.getHelpArticle);
router.get('/help/search', settingsController.searchHelpArticles);
router.get('/help/categories', settingsController.getHelpCategories);

// Privacy routes
router.get('/privacy/settings', authenticate, settingsController.getPrivacySettings);
router.put('/privacy/settings', authenticate, settingsController.updatePrivacySettings);
router.delete('/privacy/data', authenticate, settingsController.deleteUserData);
router.get('/privacy/export', authenticate, settingsController.exportUserData);

// Cache routes
router.post('/cache/clear', authenticate, settingsController.clearCache);
router.get('/cache/size', authenticate, settingsController.getCacheSize);

// Legal documents
router.get('/legal/terms', settingsController.getTermsOfService);
router.get('/legal/privacy-policy', settingsController.getPrivacyPolicy);

export default router;
