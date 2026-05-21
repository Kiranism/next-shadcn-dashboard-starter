/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/sanity.test.js',
    '**/__tests__/services/**/*.test.ts',
    '**/__tests__/adapters/**/*.test.ts',
    '**/__tests__/widgets/**/*.test.ts',
    '**/__tests__/integration/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/public/$1',
    '^lru-cache$': '<rootDir>/test/__mocks__/lru-cache.js',
    '^lru-cache/(.*)$': '<rootDir>/test/__mocks__/lru-cache.js',
    '^@asamuzakjp/css-color$': '<rootDir>/test/__mocks__/css-color.js',
    '^@asamuzakjp/css-color/(.*)$': '<rootDir>/test/__mocks__/css-color.js',
    '^@asamuzakjp/css-color/dist/cjs/index.cjs$': '<rootDir>/test/__mocks__/css-color.js',
    '^https-proxy-agent$': '<rootDir>/test/__mocks__/https-proxy-agent.js'
  }
};

