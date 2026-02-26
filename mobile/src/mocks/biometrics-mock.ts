// Mock for react-native-biometrics on web
export default {
  isSensorAvailable: async () => ({ available: false }),
  simplePrompt: async () => ({ success: false }),
  createKeys: async () => ({ publicKey: '' }),
};
