const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // CI環境での非同期ハンドル問題解決
  forceExit: process.env.CI === 'true',
  detectOpenHandles: process.env.CI !== 'true', // ローカル開発時のみ検出
  testTimeout: process.env.CI === 'true' ? 30000 : 10000, // CI環境では30秒、ローカルは10秒
  maxWorkers: process.env.CI === 'true' ? 2 : '50%', // CI環境ではワーカー数制限
};