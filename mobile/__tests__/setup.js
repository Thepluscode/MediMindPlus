/**
 * Test setup file for Jest
 * Mocks common dependencies and utilities
 */

// Mock Redux store
jest.mock('../src/store/store', () => ({
  store: {
    getState: () => ({}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

// Mock theme
jest.mock('../src/theme/theme', () => ({
  theme: {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      white: '#FFFFFF',
      black: '#000000',
      background: '#F2F2F7',
      text: '#1C1C1E',
      gray: '#8E8E93',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
}));

// Mock React Native modules that don't exist in test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
