// シンプルなjest設定（ts-jestの問題回避用）
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          sourceMap: false,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  maxWorkers: 1,
  cache: false,
};
