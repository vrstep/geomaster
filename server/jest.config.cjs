/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the ESM preset provided by ts-jest
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Map the .js extensions in your imports back to .ts files so Jest can find them
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Tell ts-jest to use ESM mode
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // Ensure Jest looks for these extensions
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};