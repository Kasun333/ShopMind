const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure web is included in platforms
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Add aliases for web compatibility
config.resolver.alias = {
  // Mock the entire Stripe React Native package for web
  '@stripe/stripe-react-native': path.resolve(__dirname, 'web-mocks/stripe-react-native-web.js'),
  // Mock specific problematic modules
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'web-mocks/codegenNativeCommands.js'),
};

// Configure resolver for better web compatibility
config.resolver.resolverMainFields = ['browser', 'main', 'module'];

module.exports = config;