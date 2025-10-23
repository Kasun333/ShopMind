// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Winter runtime to prevent import errors
// This must be done before any expo imports
global.__ExpoImportMetaRegistry = {};

jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({
  installGlobal: jest.fn(),
  getValue: jest.fn(),
}), { virtual: true });

// Suppress act() warnings for animations
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global mocks
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ products: [] }),
    ok: true,
    status: 200,
  })
);

global.Alert = {
  alert: jest.fn(),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
});