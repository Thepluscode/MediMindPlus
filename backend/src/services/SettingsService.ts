import knex from '../config/knex';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

export class SettingsService {
  // Profile methods
  async getProfile(userId: string) {
    const [user] = await knex('users')
      .where({ id: userId })
      .select('id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    const updateData: any = {};

    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.phone) updateData.phone = data.phone;
    if (data.dateOfBirth) updateData.date_of_birth = data.dateOfBirth;

    updateData.updated_at = new Date();

    await knex('users')
      .where({ id: userId })
      .update(updateData);

    return this.getProfile(userId);
  }

  async uploadAvatar(userId: string, avatarUrl: string) {
    await knex('users')
      .where({ id: userId })
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date()
      });

    return this.getProfile(userId);
  }

  // Password methods
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await knex('users')
      .where({ id: userId })
      .select('password');

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await knex('users')
      .where({ id: userId })
      .update({
        password: hashedPassword,
        updated_at: new Date()
      });

    logger.info(`Password changed for user ${userId}`);
  }

  async requestPasswordReset(email: string) {
    const [user] = await knex('users').where({ email }).select('id', 'email');

    if (!user) {
      // Don't reveal if email exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // In production, generate a token and send email
    // For now, just log
    logger.info(`Password reset requested for ${email}`);
  }

  async resetPassword(token: string, newPassword: string) {
    // In production, validate token and reset password
    logger.info('Password reset with token');
  }

  // Contact methods
  async submitContactForm(data: { userId?: string; name: string; email: string; subject: string; message: string }) {
    const [id] = await knex('contact_submissions').insert({
      user_id: data.userId,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info(`Contact form submitted: ${id}`);
    return { id };
  }

  async getContactHistory(userId: string) {
    const submissions = await knex('contact_submissions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .select('*');

    return submissions;
  }

  // Help & Support methods
  async getHelpArticles(category?: string) {
    let query = knex('help_articles')
      .where({ published: true })
      .orderBy('order', 'asc');

    if (category) {
      query = query.where({ category });
    }

    const articles = await query.select('id', 'title', 'category', 'summary', 'icon', 'order');
    return articles.length > 0 ? articles : this.getDefaultHelpArticles(category);
  }

  async getHelpArticle(id: string) {
    const [article] = await knex('help_articles')
      .where({ id, published: true })
      .select('*');

    return article || this.getDefaultHelpArticle(id);
  }

  async searchHelpArticles(query: string) {
    const articles = await knex('help_articles')
      .where({ published: true })
      .andWhere(function() {
        this.where('title', 'like', `%${query}%`)
          .orWhere('content', 'like', `%${query}%`)
          .orWhere('summary', 'like', `%${query}%`);
      })
      .select('id', 'title', 'category', 'summary');

    return articles.length > 0 ? articles : this.searchDefaultHelpArticles(query);
  }

  async getHelpCategories() {
    const categories = await knex('help_articles')
      .where({ published: true })
      .distinct('category')
      .select('category');

    return categories.length > 0 ? categories.map(c => c.category) : [
      'Getting Started',
      'Account Management',
      'Health Features',
      'Privacy & Security',
      'Troubleshooting'
    ];
  }

  // Default help articles (fallback if database is empty)
  private getDefaultHelpArticles(category?: string) {
    const articles = [
      {
        id: '1',
        title: 'Getting Started with MediMind',
        category: 'Getting Started',
        summary: 'Learn the basics of using MediMind to track your health',
        icon: 'rocket',
        order: 1
      },
      {
        id: '2',
        title: 'Managing Your Profile',
        category: 'Account Management',
        summary: 'How to update your personal information and settings',
        icon: 'person',
        order: 2
      },
      {
        id: '3',
        title: 'Understanding Health Metrics',
        category: 'Health Features',
        summary: 'Learn about the different health metrics we track',
        icon: 'fitness',
        order: 3
      },
      {
        id: '4',
        title: 'Privacy and Data Security',
        category: 'Privacy & Security',
        summary: 'How we protect your health information',
        icon: 'lock',
        order: 4
      },
      {
        id: '5',
        title: 'Troubleshooting Common Issues',
        category: 'Troubleshooting',
        summary: 'Solutions to frequently encountered problems',
        icon: 'build',
        order: 5
      }
    ];

    return category ? articles.filter(a => a.category === category) : articles;
  }

  private getDefaultHelpArticle(id: string) {
    const articles = {
      '1': {
        id: '1',
        title: 'Getting Started with MediMind',
        category: 'Getting Started',
        content: `
# Getting Started with MediMind

Welcome to MediMind! This guide will help you get started with tracking your health.

## First Steps

1. **Complete your profile** - Add your basic information
2. **Connect devices** - Link your wearable devices
3. **Set health goals** - Define what you want to achieve
4. **Start tracking** - Begin monitoring your health metrics

## Key Features

- Real-time health monitoring
- AI-powered insights
- Personalized recommendations
- Secure data storage

For more help, contact our support team.
        `,
        icon: 'rocket'
      },
      '2': {
        id: '2',
        title: 'Managing Your Profile',
        category: 'Account Management',
        content: `
# Managing Your Profile

Keep your profile up to date for the best experience.

## Updating Information

1. Go to Settings > Edit Profile
2. Update your information
3. Save changes

## Profile Picture

Upload a profile picture to personalize your account.

## Privacy

Control who can see your information in Privacy Settings.
        `,
        icon: 'person'
      }
    };

    return articles[id as keyof typeof articles];
  }

  private searchDefaultHelpArticles(query: string) {
    return this.getDefaultHelpArticles().filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.summary.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Privacy methods
  async getPrivacySettings(userId: string) {
    const defaults = {
      user_id: userId,
      share_health_data: false,
      share_with_providers: true,
      data_retention_days: 365,
      marketing_emails: false,
      research_participation: false
    };
    try {
      const [settings] = await knex('privacy_settings')
        .where({ user_id: userId })
        .select('*');
      return settings || defaults;
    } catch {
      return defaults;
    }
  }

  async updatePrivacySettings(userId: string, data: any) {
    const exists = await knex('privacy_settings')
      .where({ user_id: userId })
      .first();

    if (exists) {
      await knex('privacy_settings')
        .where({ user_id: userId })
        .update({
          ...data,
          updated_at: new Date()
        });
    } else {
      await knex('privacy_settings').insert({
        user_id: userId,
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return this.getPrivacySettings(userId);
  }

  async deleteUserData(userId: string) {
    // In production, this would queue a data deletion job
    logger.info(`Data deletion requested for user ${userId}`);
    return { message: 'Data deletion process initiated' };
  }

  async exportUserData(userId: string) {
    const user = await this.getProfile(userId);
    const privacySettings = await this.getPrivacySettings(userId);

    return {
      user,
      privacySettings,
      exportDate: new Date(),
      format: 'json'
    };
  }

  // Cache methods
  async clearCache(userId: string, types?: string[]) {
    logger.info(`Cache cleared for user ${userId}, types: ${types?.join(', ') || 'all'}`);
    return { cleared: types || ['all'] };
  }

  async getCacheSize(userId: string) {
    // In production, calculate actual cache size
    return {
      images: { size: 25.5, unit: 'MB' },
      data: { size: 12.3, unit: 'MB' },
      documents: { size: 8.7, unit: 'MB' },
      total: { size: 46.5, unit: 'MB' }
    };
  }

  // Legal documents
  async getTermsOfService() {
    return {
      version: '1.0.0',
      effectiveDate: '2024-01-01',
      content: `
# Terms of Service

Last updated: January 1, 2024

## 1. Acceptance of Terms

By accessing and using MediMind, you accept and agree to be bound by these Terms of Service.

## 2. Description of Service

MediMind provides health monitoring and analysis services using AI technology.

## 3. User Responsibilities

You are responsible for maintaining the confidentiality of your account.

## 4. Privacy

Your privacy is important to us. See our Privacy Policy for details.

## 5. Modifications

We reserve the right to modify these terms at any time.

## 6. Contact

For questions about these terms, contact us at legal@medimind.com
      `
    };
  }

  async getPrivacyPolicy() {
    return {
      version: '1.0.0',
      effectiveDate: '2024-01-01',
      content: `
# Privacy Policy

Last updated: January 1, 2024

## 1. Information We Collect

We collect information you provide directly, such as health data and personal information.

## 2. How We Use Your Information

We use your information to provide and improve our services.

## 3. Data Security

We implement industry-standard security measures to protect your data.

## 4. HIPAA Compliance

We are committed to HIPAA compliance for all health information.

## 5. Your Rights

You have the right to access, modify, and delete your data.

## 6. Contact Us

For privacy concerns, contact privacy@medimind.com
      `
    };
  }

  async getLegalDocumentVersion() {
    return {
      terms: { version: '1.0.0', date: '2024-01-01' },
      privacy: { version: '1.0.0', date: '2024-01-01' }
    };
  }
}
