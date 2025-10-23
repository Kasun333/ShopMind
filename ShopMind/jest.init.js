// This file runs before all other setup files
// Set up global Expo mocks to prevent winter runtime errors

// Mock the Expo import meta registry
global.__ExpoImportMetaRegistry = new Proxy({}, {
  get: () => ({}),
  set: () => true,
});

// Prevent Expo from trying to use native modules
global.__expo_module_cache__ = {};

// Mock structuredClone if not available (required by Expo winter)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
