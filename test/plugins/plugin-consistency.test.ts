/**
 * プラグインシステム一貫性テスト
 * 
 * t_wadaのTDD手法に従い、RED段階として失敗するテストを先に作成
 * これらのテストは実装前に失敗することが期待される
 */

import { BasePlugin } from '../../src/plugins/base/BasePlugin';
import { TestExistencePlugin } from '../../src/plugins/core/TestExistencePlugin';
import { AssertionExistencePlugin } from '../../src/plugins/core/AssertionExistencePlugin';
import { BaseSecurityPlugin } from '../../src/plugins/base/BaseSecurityPlugin';
import { TaintAnalysisPlugin } from '../../src/plugins/security/TaintAnalysisPlugin';
import { SecurityTestPatternPlugin } from '../../src/plugins/security/SecurityTestPatternPlugin';
import { ITestQualityPlugin } from '../../src/core/types';

describe('Plugin System Consistency Tests', () => {
  describe('All plugins should implement ITestQualityPlugin interface', () => {
    test('TestExistencePlugin implements ITestQualityPlugin', () => {
      const plugin = new TestExistencePlugin();
      expect(plugin).toHaveProperty('id');
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('version');
      expect(plugin).toHaveProperty('type');
      expect(plugin).toHaveProperty('isApplicable');
      expect(plugin).toHaveProperty('detectPatterns');
      expect(plugin).toHaveProperty('evaluateQuality');
      expect(plugin).toHaveProperty('suggestImprovements');
    });

    test('AssertionExistencePlugin implements ITestQualityPlugin', () => {
      const plugin = new AssertionExistencePlugin();
      expect(plugin).toHaveProperty('id');
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('version');
      expect(plugin).toHaveProperty('type');
      expect(plugin).toHaveProperty('isApplicable');
      expect(plugin).toHaveProperty('detectPatterns');
      expect(plugin).toHaveProperty('evaluateQuality');
      expect(plugin).toHaveProperty('suggestImprovements');
    });

    test('TaintAnalysisPlugin implements ITestQualityPlugin', () => {
      const plugin = new TaintAnalysisPlugin();
      expect(plugin).toHaveProperty('id');
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('version');
      expect(plugin).toHaveProperty('type');
      expect(plugin).toHaveProperty('isApplicable');
      expect(plugin).toHaveProperty('detectPatterns');
      expect(plugin).toHaveProperty('evaluateQuality');
      expect(plugin).toHaveProperty('suggestImprovements');
    });

    test('SecurityTestPatternPlugin implements ITestQualityPlugin', () => {
      const plugin = new SecurityTestPatternPlugin();
      expect(plugin).toHaveProperty('id');
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('version');
      expect(plugin).toHaveProperty('type');
      expect(plugin).toHaveProperty('isApplicable');
      expect(plugin).toHaveProperty('detectPatterns');
      expect(plugin).toHaveProperty('evaluateQuality');
      expect(plugin).toHaveProperty('suggestImprovements');
    });
  });

  describe('All plugins should extend BasePlugin or its derivatives', () => {
    test('TestExistencePlugin extends BasePlugin', () => {
      const plugin = new TestExistencePlugin();
      expect(plugin instanceof BasePlugin).toBe(true);
    });

    test('AssertionExistencePlugin extends BasePlugin', () => {
      const plugin = new AssertionExistencePlugin();
      expect(plugin instanceof BasePlugin).toBe(true);
    });

    test('TaintAnalysisPlugin extends BaseSecurityPlugin', () => {
      const plugin = new TaintAnalysisPlugin();
      expect(plugin instanceof BaseSecurityPlugin).toBe(true);
      expect(plugin instanceof BasePlugin).toBe(true);
    });

    test('SecurityTestPatternPlugin extends BaseSecurityPlugin', () => {
      const plugin = new SecurityTestPatternPlugin();
      expect(plugin instanceof BaseSecurityPlugin).toBe(true);
      expect(plugin instanceof BasePlugin).toBe(true);
    });
  });

  describe('Naming conventions should be consistent', () => {
    test('All plugin classes should follow PascalCase + Plugin suffix', () => {
      const pluginClasses = [
        'TestExistencePlugin',
        'AssertionExistencePlugin',
        'TaintAnalysisPlugin',
        'SecurityTestPatternPlugin'
      ];

      pluginClasses.forEach(className => {
        // PascalCase check
        expect(className[0]).toEqual(className[0].toUpperCase());
        // Plugin suffix check
        expect(className).toMatch(/Plugin$/);
      });
    });

    test('Plugin IDs should follow kebab-case', () => {
      const plugins = [
        new TestExistencePlugin(),
        new AssertionExistencePlugin(),
        new TaintAnalysisPlugin(),
        new SecurityTestPatternPlugin()
      ];

      plugins.forEach(plugin => {
        expect(plugin.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });
  });

  describe('Helper methods should not be duplicated', () => {
    test('isTestFile should be defined only in BasePlugin', () => {
      const plugin = new TestExistencePlugin();
      // @ts-ignore - accessing protected method for testing
      const isTestFileMethod = plugin.isTestFile;
      
      // BasePluginから継承されていることを確認
      expect(isTestFileMethod).toBeDefined();
      
      // TestExistencePlugin自体には定義されていないことを確認
      const ownProps = Object.getOwnPropertyNames(TestExistencePlugin.prototype);
      expect(ownProps).not.toContain('isTestFile');
    });

    test('removeCommentsAndStrings should be defined only in BasePlugin', () => {
      const plugin = new AssertionExistencePlugin();
      // @ts-ignore - accessing protected method for testing
      const removeMethod = plugin.removeCommentsAndStrings;
      
      // BasePluginから継承されていることを確認
      expect(removeMethod).toBeDefined();
      
      // AssertionExistencePlugin自体には定義されていないことを確認
      const ownProps = Object.getOwnPropertyNames(AssertionExistencePlugin.prototype);
      expect(ownProps).not.toContain('removeCommentsAndStrings');
    });
  });

  describe('Plugin types should be consistent', () => {
    test('Core plugins should have type "core"', () => {
      const corePlugins = [
        new TestExistencePlugin(),
        new AssertionExistencePlugin()
      ];

      corePlugins.forEach(plugin => {
        expect(plugin.type).toBe('core');
      });
    });

    test('Security plugins should have type "security"', () => {
      const securityPlugins = [
        new TaintAnalysisPlugin(),
        new SecurityTestPatternPlugin()
      ];

      securityPlugins.forEach(plugin => {
        expect(plugin.type).toBe('security');
      });
    });
  });

  describe('BaseSecurityPlugin should provide common security methods', () => {
    test('BaseSecurityPlugin should have detectSecurityPatterns method', () => {
      const plugin = new TaintAnalysisPlugin();
      // @ts-ignore - accessing protected method for testing
      expect(plugin.detectSecurityPatterns).toBeDefined();
    });

    test('BaseSecurityPlugin should have evaluateSecurityScore method', () => {
      const plugin = new SecurityTestPatternPlugin();
      // @ts-ignore - accessing protected method for testing
      expect(plugin.evaluateSecurityScore).toBeDefined();
    });
  });
});