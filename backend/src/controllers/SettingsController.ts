import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService';
import { logger } from '../utils/logger';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  // Profile methods
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profile = await this.settingsService.getProfile(userId);
      res.json(profile);
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profile = await this.settingsService.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  };

  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { avatarUrl } = req.body;
      const profile = await this.settingsService.uploadAvatar(userId, avatarUrl);
      res.json(profile);
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  };

  // Password methods
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long' });
        return;
      }

      await this.settingsService.changePassword(userId, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      logger.error('Error changing password:', error);
      if (error.message === 'Current password is incorrect') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to change password' });
      }
    }
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      await this.settingsService.requestPasswordReset(email);
      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      res.status(500).json({ error: 'Failed to request password reset' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      await this.settingsService.resetPassword(token, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      logger.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  };

  // Contact methods
  submitContactForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      const userId = (req as any).user?.id;
      const submission = await this.settingsService.submitContactForm({
        userId,
        name,
        email,
        subject,
        message
      });

      res.json({ message: 'Contact form submitted successfully', id: submission.id });
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      res.status(500).json({ error: 'Failed to submit contact form' });
    }
  };

  getContactHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const history = await this.settingsService.getContactHistory(userId);
      res.json(history);
    } catch (error) {
      logger.error('Error getting contact history:', error);
      res.status(500).json({ error: 'Failed to get contact history' });
    }
  };

  // Help & Support methods
  getHelpArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category } = req.query;
      const articles = await this.settingsService.getHelpArticles(category as string);
      res.json(articles);
    } catch (error) {
      logger.error('Error getting help articles:', error);
      res.status(500).json({ error: 'Failed to get help articles' });
    }
  };

  getHelpArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await this.settingsService.getHelpArticle(id);

      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }

      res.json(article);
    } catch (error) {
      logger.error('Error getting help article:', error);
      res.status(500).json({ error: 'Failed to get help article' });
    }
  };

  searchHelpArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const results = await this.settingsService.searchHelpArticles(q as string);
      res.json(results);
    } catch (error) {
      logger.error('Error searching help articles:', error);
      res.status(500).json({ error: 'Failed to search help articles' });
    }
  };

  getHelpCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.settingsService.getHelpCategories();
      res.json(categories);
    } catch (error) {
      logger.error('Error getting help categories:', error);
      res.status(500).json({ error: 'Failed to get help categories' });
    }
  };

  // Privacy methods
  getPrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const settings = await this.settingsService.getPrivacySettings(userId);
      res.json(settings);
    } catch (error) {
      logger.error('Error getting privacy settings:', error);
      res.status(500).json({ error: 'Failed to get privacy settings' });
    }
  };

  updatePrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const settings = await this.settingsService.updatePrivacySettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      res.status(500).json({ error: 'Failed to update privacy settings' });
    }
  };

  deleteUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.settingsService.deleteUserData(userId);
      res.json({ message: 'User data deletion requested' });
    } catch (error) {
      logger.error('Error deleting user data:', error);
      res.status(500).json({ error: 'Failed to delete user data' });
    }
  };

  exportUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const data = await this.settingsService.exportUserData(userId);
      res.json(data);
    } catch (error) {
      logger.error('Error exporting user data:', error);
      res.status(500).json({ error: 'Failed to export user data' });
    }
  };

  // Cache methods
  clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { types } = req.body;
      await this.settingsService.clearCache(userId, types);
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      logger.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  };

  getCacheSize = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const size = await this.settingsService.getCacheSize(userId);
      res.json(size);
    } catch (error) {
      logger.error('Error getting cache size:', error);
      res.status(500).json({ error: 'Failed to get cache size' });
    }
  };

  // Legal documents
  getTermsOfService = async (req: Request, res: Response): Promise<void> => {
    try {
      const terms = await this.settingsService.getTermsOfService();
      res.json(terms);
    } catch (error) {
      logger.error('Error getting terms of service:', error);
      res.status(500).json({ error: 'Failed to get terms of service' });
    }
  };

  getPrivacyPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await this.settingsService.getPrivacyPolicy();
      res.json(policy);
    } catch (error) {
      logger.error('Error getting privacy policy:', error);
      res.status(500).json({ error: 'Failed to get privacy policy' });
    }
  };

  getLegalDocumentVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const version = await this.settingsService.getLegalDocumentVersion();
      res.json(version);
    } catch (error) {
      logger.error('Error getting legal document version:', error);
      res.status(500).json({ error: 'Failed to get legal document version' });
    }
  };
}
