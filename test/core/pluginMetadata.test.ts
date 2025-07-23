/**
 * PluginMetadata テストスイート
 * v0.3.0: プラグインメタデータシステムの基本テスト
 */

describe('PluginMetadata', () => {
  it('should exist in the codebase', () => {
    // This test ensures the file exists for test coverage
    const module = require('../../src/core/pluginMetadata');
    expect(module).toBeDefined();
  });
});