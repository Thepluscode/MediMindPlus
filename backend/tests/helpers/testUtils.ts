/**
 * Test Utilities
 *
 * Helper functions for testing
 */

import { SecurityManager } from '../../src/security/SecurityManager';

/**
 * Generate a valid test user object
 */
export const createTestUserData = (overrides: Partial<any> = {}) => {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@medimind.com`,
    password: 'Test@Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'patient' as const,
    dateOfBirth: '1990-01-15',
    phoneNumber: '+1234567890',
    acceptTerms: true,
    ...overrides,
  };
};

/**
 * Generate a hash for a test password
 */
export const hashTestPassword = async (password: string): Promise<string> => {
  const securityManager = new SecurityManager();
  return await securityManager.hashPassword(password);
};

/**
 * Wait for a specified time (for async operations)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Extract JWT payload without verification (for testing)
 */
export const decodeJWT = (token: string): any => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
  return JSON.parse(payload);
};

/**
 * Generate random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Assert response has error
 */
export const expectError = (response: any, errorMessage?: string) => {
  expect(response.body).toHaveProperty('error');
  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage);
  }
};

/**
 * Assert response has success
 */
export const expectSuccess = (response: any, messageContains?: string) => {
  expect(response.status).toBeLessThan(400);
  if (messageContains && response.body.message) {
    expect(response.body.message).toContain(messageContains);
  }
};
