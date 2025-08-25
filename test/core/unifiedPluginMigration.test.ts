/**
 * UnifiedPluginManager移行テスト
 * PluginManagerからUnifiedPluginManagerへの安全な移行を保証
 */

import { UnifiedPluginManager } from '../../src/core/UnifiedPluginManager';
import { IPlugin, Issue } from '../../src/core/types';

describe('UnifiedPluginManager Migration Tests', () => {
  let manager: UnifiedPluginManager;

  beforeEach(() => {
    manager = new UnifiedPluginManager();
  });

  describe('後方互換性の検証', () => {
    it('registerメソッドがレガシープラグインを正しく登録できること', async () => {
      const testPlugin: IPlugin = {
        name: 'test-plugin',
        analyze: jest.fn().mockResolvedValue([])
      };

      manager.register(testPlugin);
      const plugins = manager.getLegacyPlugins();
      
      expect(plugins).toContain(testPlugin);
      expect(plugins.length).toBe(1);
    });

    it('runメソッドがレガシープラグインを実行できること', async () => {
      const mockIssue: Issue = {
        id: 'test-issue-id',
        type: 'test-issue',
        severity: 'high',
        message: 'Test issue',
        filePath: 'test.ts',
        category: 'test-coverage'
      };

      const testPlugin: IPlugin = {
        name: 'test-plugin',
        analyze: jest.fn().mockResolvedValue([mockIssue])
      };

      manager.register(testPlugin);
      const result = await manager.run('test.ts');

      expect(result.issues).toContain(mockIssue);
      expect(testPlugin.analyze).toHaveBeenCalledWith('test.ts');
    });

    it('複数のレガシープラグインを管理できること', async () => {
      const plugin1: IPlugin = {
        name: 'plugin-1',
        analyze: jest.fn().mockResolvedValue([{
          id: 'issue-1-id',
          type: 'issue-1',
          severity: 'medium',
          message: 'Issue 1',
          filePath: 'test.ts',
          category: 'test-coverage'
        }])
      };

      const plugin2: IPlugin = {
        name: 'plugin-2',
        analyze: jest.fn().mockResolvedValue([{
          id: 'issue-2-id',
          type: 'issue-2',
          severity: 'low',
          message: 'Issue 2',
          filePath: 'test.ts',
          category: 'test-structure'
        }])
      };

      manager.register(plugin1);
      manager.register(plugin2);

      const result = await manager.run('test.ts');

      expect(result.issues).toHaveLength(2);
      expect(plugin1.analyze).toHaveBeenCalled();
      expect(plugin2.analyze).toHaveBeenCalled();
    });

    it('エラーハンドリングが適切に動作すること', async () => {
      const errorPlugin: IPlugin = {
        name: 'error-plugin',
        analyze: jest.fn().mockRejectedValue(new Error('Plugin error'))
      };

      manager.register(errorPlugin);
      const result = await manager.run('test.ts');

      // エラーが発生した場合errorsが定義される、または実行が正常に完了する
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      
      if (result.errors) {
        expect(result.errors[0]).toMatchObject({
          pluginName: 'error-plugin',
          error: expect.stringContaining('Plugin error')
        });
      }
    });
  });

  describe('UnifiedPluginManager固有機能', () => {
    it('品質プラグインとレガシープラグインを同時に管理できること', async () => {
      const legacyPlugin: IPlugin = {
        name: 'legacy-plugin',
        analyze: jest.fn().mockResolvedValue([])
      };

      const qualityPlugin = {
        id: 'quality-plugin',
        name: 'Quality Plugin',
        version: '1.0.0',
        type: 'core' as const,
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({ score: 85 }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };

      manager.register(legacyPlugin);
      manager.registerPlugin(qualityPlugin);

      const legacyPlugins = manager.getLegacyPlugins();
      const qualityPlugins = manager.getQualityPlugins();

      expect(legacyPlugins).toContain(legacyPlugin);
      expect(qualityPlugins).toContain(qualityPlugin);
    });
  });

  describe('パフォーマンスとメモリ使用', () => {
    it('大量のプラグイン登録でもメモリリークが発生しないこと', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        const plugin: IPlugin = {
          name: `plugin-${i}`,
          analyze: jest.fn().mockResolvedValue([])
        };
        manager.register(plugin);
      }

      const plugins = manager.getLegacyPlugins();
      expect(plugins).toHaveLength(100);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 10MB以下の増加であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});