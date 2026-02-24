/**
 * Test Database Helper
 *
 * Utilities for setting up and tearing down test database
 */

import { DatabaseManager } from '../../src/database/DatabaseManager';

export class TestDatabaseHelper {
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = new DatabaseManager();
  }

  async initialize(): Promise<void> {
    await this.databaseManager.initialize();
  }

  async cleanup(): Promise<void> {
    // Clean up test data in reverse order of dependencies
    const tables = [
      'audit_logs',
      'sessions',
      'patients',
      'providers',
      'users',
    ];

    for (const table of tables) {
      await this.databaseManager.query(
        `DELETE FROM ${table} WHERE email LIKE '%test%' OR email LIKE '%@medimind.com'`,
        []
      );
    }
  }

  async close(): Promise<void> {
    await this.databaseManager.close();
  }

  /**
   * Create a test user
   */
  async createTestUser(userData: any): Promise<any> {
    const result = await this.databaseManager.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.role || 'patient',
        userData.isActive !== undefined ? userData.isActive : true,
        userData.emailVerified || false,
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete a test user by ID
   */
  async deleteTestUser(userId: string): Promise<void> {
    await this.databaseManager.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  /**
   * Get database instance for direct queries
   */
  getDatabase(): DatabaseManager {
    return this.databaseManager;
  }
}
