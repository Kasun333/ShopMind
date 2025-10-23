module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic modules
    '^expo$': '<rootDir>/__mocks__/expo.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-av$': '<rootDir>/__mocks__/expo-av.js',
    '^expo-location$': '<rootDir>/__mocks__/expo-location.js',
    '^@stripe/stripe-react-native$': '<rootDir>/__mocks__/stripe-react-native.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^react-native/Libraries/Animated/Animated$': '<rootDir>/__mocks__/Animated.js',
  },
  setupFiles: ['<rootDir>/jest.init.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  fakeTimers: {
    enableGlobally: true,
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/expo/src/winter/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
};