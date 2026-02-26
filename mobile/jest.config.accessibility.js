/**
 * Jest Configuration for Accessibility Tests
 *
 * Simplified configuration that uses babel-preset-expo for transformations.
 */

module.exports = {
  preset: 'react-native',

  // Use babel-preset-expo for transformations
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform ignore patterns - transform React Native and related packages
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@expo|expo|@react-native-community|@testing-library)',
  ],

  // Module name mapper for assets and mocks
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    'expo-linear-gradient': '<rootDir>/__mocks__/expo-linear-gradient.js',
    '@expo/vector-icons': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '@react-native-async-storage/async-storage': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
  },

  // Setup files
  setupFiles: [
    '<rootDir>/node_modules/react-native/jest/setup.js',
    '<rootDir>/__tests__/setup.js',
  ],

  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
  ],

  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,
};
