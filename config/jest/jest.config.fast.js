/**
 * Jest設定 - 高速テスト実行用
 * CI/CDやローカル開発での高速フィードバック用
 */

/** @type {import("jest").Config} **/
module.exports = {
  rootDir: '../..',
  testEnvironment: "node",
  
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        sourceMap: false,
        inlineSourceMap: false
      },
      // Issue #120対応: 絶対パス除去設定
      isolatedModules: true
    }]
  },
  
  // 高速化設定
  cache: true,
  cacheDirectory: '<rootDir>/.cache/jest',
  collectCoverage: false,
  
  
  // タイムアウトを短縮
  testTimeout: 10000,
  
  // 並列実行制御
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: false,
  
  // AIレポーターを無効化
  reporters: ['default'],
  
  // パフォーマンステストを除外
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/test/performance/',
    '/test/integration/',
    '/test/e2e/',
    '/.rimor/'
  ],
  
  // メモリ使用量を制限
  workerIdleMemoryLimit: '512MB',
  
  // モック設定
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/config/jest/jest.setup.js'],
  
  // モジュール解決
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 詳細出力を抑制
  verbose: false,
  silent: false,
  
  // ファイル監視設定
  watchPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/.cache/',
    '<rootDir>/.rimor/'
  ]
};