// Mock for expo module to fix winter runtime errors
const actualExpo = jest.requireActual('expo');

module.exports = {
  ...actualExpo,
  __ExpoImportMetaRegistry: {},
  registerRootComponent: jest.fn(),
};
