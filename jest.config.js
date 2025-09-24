/** @type {import('jest').Config} */
module.exports = {
  roots: ['<rootDir>/packages', '<rootDir>/examples'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: ['packages/**/*.ts', '!packages/**/*.d.ts'],
};
