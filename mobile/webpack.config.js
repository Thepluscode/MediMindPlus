const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@stripe/stripe-react-native',
          'react-native',
          '@react-native'
        ]
      }
    },
    argv
  );

  // Add resolve configuration
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      // Mock native-only modules for web
      '@stripe/stripe-react-native': require.resolve('./src/mocks/stripe-mock.ts'),
      'react-native-biometrics': require.resolve('./src/mocks/biometrics-mock.ts'),
      'react-native-health': require.resolve('./src/mocks/health-mock.ts'),
      'react-native-ble-plx': require.resolve('./src/mocks/ble-mock.ts'),
      '@react-native-voice/voice': require.resolve('./src/mocks/voice-mock.ts'),
    },
    fallback: {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
      zlib: false,
    }
  };

  //  Ignore warnings about missing exports
  config.ignoreWarnings = [
    /export .* was not found/,
    /Can't resolve/,
  ];

  return config;
};
