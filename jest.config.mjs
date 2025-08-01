import { createDefaultEsmPreset, TS_EXT_TO_TREAT_AS_ESM, ESM_TS_TRANSFORM_PATTERN } from "ts-jest";

const tsJestTransformCfg = createDefaultEsmPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
  transform: {
    ...tsJestTransformCfg,
    [ESM_TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  // CI環境での非同期ハンドル問題解決
  forceExit: true, // メモリリークを防ぐため常に有効
  detectOpenHandles: false, // メモリ使用量削減のため無効
  testTimeout: process.env.CI === 'true' ? 30000 : 10000, // CI環境では30秒、ローカルは10秒
  maxWorkers: 1, // メモリ使用量制限のため常に1ワーカー
  // runInBand設定はpackage.jsonのコマンドラインオプションで指定
  
  // CI環境でのメモリ最適化
  cache: false, // キャッシュを無効化してメモリ使用量削減
  clearMocks: true, // テスト後にモックをクリア
  restoreMocks: true, // テスト実行ごとにモック状態をクリア
  resetMocks: true, // 各テスト実行前にモックをリセット
  resetModules: true, // 各テスト実行前にモジュールキャッシュをクリア
  
  // CI環境でのファイルハンドル管理強化
  openHandlesTimeout: process.env.CI === 'true' ? 0 : 1000, // CI環境では即座にクローズ
  
  // メモリ使用量最適化
  logHeapUsage: process.env.CI === 'true',
  workerIdleMemoryLimit: '256MB', // ワーカーのアイドル時メモリ制限
  
  // ハッシュ計算最適化
  haste: {
    computeSha1: false // ハッシュ計算を無効化してメモリ削減
  },
  
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
  
  // 監査用サンプルテストファイルを除外
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
    'docs/self-audit/scripts/empty-tests',
    'docs/self-audit/scripts/invalid-tests',
    'docs/self-audit/scripts/temp-tests',
    'docs/self-audit/scripts/test-output',
    'docs/self-audit/scripts/valid-test-dir',
    'empty-tests',
    'invalid-tests',
    'temp-tests',
    'test-output',
    'valid-test-dir',
    'test-accuracy-data'
  ],
  
  // AI Error Reporterの設定（CI環境でも有効化）
  reporters: process.env.DISABLE_AI_REPORTER === 'true' ? [
    'default'
  ] : [
    'default',
    ['<rootDir>/dist/testing/jest-ai-reporter.js', {
      outputPath: process.env.CI === 'true' ? '.rimor/reports/test-errors-ai.md' : 'test-errors-ai.md',
      enableConsoleOutput: process.env.CI !== 'true' // CI環境ではコンソール出力を無効化
    }]
  ],
};