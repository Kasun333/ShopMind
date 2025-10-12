// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);



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