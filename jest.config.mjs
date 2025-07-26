import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    ...tsJestTransformCfg,
  },
  // CI環境での非同期ハンドル問題解決
  forceExit: true, // メモリリークを防ぐため常に有効
  detectOpenHandles: false, // メモリ使用量削減のため無効
  testTimeout: process.env.CI === 'true' ? 60000 : 10000, // CI環境では60秒、ローカルは10秒
  maxWorkers: 1, // メモリ使用量制限のため常に1ワーカー
  // runInBand設定はpackage.jsonのコマンドラインオプションで指定
  
  // CI環境でのメモリ最適化
  cache: false, // キャッシュを無効化してメモリ使用量削減
  clearMocks: true, // テスト後にモックをクリア
  restoreMocks: true, // テスト実行ごとにモック状態をクリア
  resetMocks: true, // 各テスト実行前にモックをリセット
  resetModules: true, // 各テスト実行前にモジュールキャッシュをクリア
  
  // メモリ使用量最適化
  logHeapUsage: process.env.CI === 'true',
  
  // テスト環境変数の確実な設定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // CI環境でのモジュール解決強化
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^chalk$': '<rootDir>/__mocks__/chalk.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // CI環境対応のため基本設定のみ
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|#ansi-styles|.*\\.mjs$))'
  ],
};