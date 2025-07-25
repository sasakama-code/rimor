const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // CI環境での非同期ハンドル問題解決
  forceExit: true, // メモリリークを防ぐため常に有効
  detectOpenHandles: false, // メモリ使用量削減のため無効
  testTimeout: process.env.CI === 'true' ? 20000 : 10000, // CI環境では20秒、ローカルは10秒
  maxWorkers: 1, // メモリ使用量制限のため常に1ワーカー
  
  // CI環境でのメモリ最適化
  cache: false, // キャッシュを無効化してメモリ使用量削減
  clearMocks: true, // テスト後にモックをクリア
  
  // メモリ使用量最適化
  logHeapUsage: process.env.CI === 'true',
  
  // テスト環境変数の確実な設定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // CI環境でのモジュール解決強化
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // CI環境対応のため基本設定のみ
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
};