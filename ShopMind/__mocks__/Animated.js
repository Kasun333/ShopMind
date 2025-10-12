const MockAnimated = {
  Value: jest.fn((initialValue) => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    _value: initialValue,
  })),
  View: jest.fn(),
  Text: jest.fn(),
  sequence: jest.fn(() => ({ start: jest.fn() })),
  timing: jest.fn(() => ({ start: jest.fn() })),
  delay: jest.fn(() => ({ start: jest.fn() })),
  parallel: jest.fn(() => ({ start: jest.fn() })),
  stagger: jest.fn(() => ({ start: jest.fn() })),
  loop: jest.fn(() => ({ start: jest.fn() })),
  createAnimatedComponent: (component) => component,
  interpolate: jest.fn(),
  spring: jest.fn(() => ({ start: jest.fn() })),
  decay: jest.fn(() => ({ start: jest.fn() })),
  add: jest.fn(),
  multiply: jest.fn(),
  diffClamp: jest.fn(),
  subtract: jest.fn(),
  divide: jest.fn(),
  modulo: jest.fn(),
  event: jest.fn(),
};

module.exports = MockAnimated;