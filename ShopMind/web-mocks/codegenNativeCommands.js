// Mock for react-native/Libraries/Utilities/codegenNativeCommands
// This provides a web-compatible fallback for native-only modules

const codegenNativeCommands = (spec) => {
  const commands = {};
  
  // Create mock implementations for all commands in the spec
  Object.keys(spec).forEach(commandName => {
    commands[commandName] = (...args) => {
      console.warn(`Native command '${commandName}' is not available on web platform`);
      return Promise.resolve();
    };
  });
  
  return commands;
};

module.exports = codegenNativeCommands;
module.exports.default = codegenNativeCommands;