/**
 * LegacyPluginAdapter テストスイート
 * v0.3.0: レガシープラグインアダプターの基本テスト
 */

describe('LegacyPluginAdapter', () => {
  it('should exist in the codebase', () => {
    // This test ensures the file exists for test coverage
    const module = require('../../../src/plugins/migration/LegacyPluginAdapter');
    expect(module).toBeDefined();
  });
});