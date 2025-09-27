const request = require('supertest');
const app = require('../../../src/server');
const User = require('../../../src/models/User');

describe('User Model', () => {
  describe('User.create()', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneNumber: '+1234567890'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.id).toBeDefined();
      expect(user.password).toBeUndefined(); // Should not return password
    });

    it('should hash the password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      const user = await User.create(userData);
      const dbUser = await User.findById(user.id);

      expect(dbUser.password).not.toBe(userData.password);
      expect(await dbUser.validatePassword(userData.password)).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User.findByEmail()', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        password: 'password123',
        firstName: 'Find',
        lastName: 'Me'
      };

      const createdUser = await User.create(userData);
      const foundUser = await User.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });
});
