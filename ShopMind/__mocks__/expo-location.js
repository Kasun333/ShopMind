module.exports = {
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ 
    coords: { latitude: 0, longitude: 0 } 
  })),
};