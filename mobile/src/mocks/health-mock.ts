// Mock for react-native-health on web
export default {
  isAvailable: () => Promise.resolve(false),
  initHealthKit: () => Promise.resolve(false),
};
