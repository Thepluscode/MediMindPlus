const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure metro to handle web platform properly
config.resolver.platforms = ['ios', 'android', 'web'];

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.jsx', 'web.ts', 'web.tsx'];

module.exports = config;
