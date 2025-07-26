/**
 * FrameworkTestGenerator.test.ts
 * フレームワークテストジェネレーターのテスト
 * 自動テスト生成システムの包括的テスト
 */

import { FrameworkTestGenerator } from '../../../src/security/validation/FrameworkTestGenerator';

describe('FrameworkTestGenerator - フレームワークテストジェネレーター', () => {
  let generator: FrameworkTestGenerator;

  beforeEach(() => {
    generator = new FrameworkTestGenerator();
  });

  describe('基本的なテスト生成', () => {
    it('Jestテストを正しく生成すること', async () => {
      const config = {
        framework: 'jest',
        targetFunction: 'validateInput',
        securityLevel: 'high'
      };

      const result = await generator.generateTests(config);

      expect(result).toBeDefined();
      expect(result.framework).toBe('jest');
      expect(result.testCode).toContain('describe');
      expect(result.testCode).toContain('expect');
      expect(result.securityTests.length).toBeGreaterThan(0);
    });

    it('セキュリティテストケースを適切に生成すること', async () => {
      const config = {
        framework: 'jest',
        targetFunction: 'sanitizeHtml',
        securityLevel: 'critical'
      };

      const result = await generator.generateTests(config);

      expect(result.securityTests).toContain('xss-protection');
      expect(result.securityTests).toContain('html-injection');
      expect(result.testCode).toContain('<script>');
      expect(result.testCode).toContain('malicious');
    });

    it('複数のフレームワークをサポートすること', async () => {
      const frameworks = ['jest', 'mocha', 'vitest'];
      
      for (const framework of frameworks) {
        const config = {
          framework,
          targetFunction: 'testFunction',
          securityLevel: 'medium'
        };

        const result = await generator.generateTests(config);
        expect(result.framework).toBe(framework);
        expect(result.testCode).toBeDefined();
      }
    });
  });

  describe('セキュリティレベル別生成', () => {
    it('Criticalレベルで包括的なテストを生成すること', async () => {
      const config = {
        framework: 'jest',
        targetFunction: 'processUserData',
        securityLevel: 'critical'
      };

      const result = await generator.generateTests(config);

      expect(result.securityTests.length).toBeGreaterThan(5);
      expect(result.securityTests).toContain('sql-injection');
      expect(result.securityTests).toContain('xss-protection');
      expect(result.securityTests).toContain('csrf-protection');
      expect(result.testCode.split('\n').length).toBeGreaterThan(50);
    });

    it('Lowレベルで基本的なテストを生成すること', async () => {
      const config = {
        framework: 'jest',
        targetFunction: 'formatString',
        securityLevel: 'low'
      };

      const result = await generator.generateTests(config);

      expect(result.securityTests.length).toBeLessThan(4);
      expect(result.testCode.split('\n').length).toBeLessThan(30);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のテスト生成を効率的に処理すること', async () => {
      const configs = Array.from({ length: 20 }, (_, i) => ({
        framework: 'jest',
        targetFunction: `function${i}`,
        securityLevel: 'medium'
      }));

      const startTime = Date.now();
      
      for (const config of configs) {
        await generator.generateTests(config);
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5000); // 5秒以内
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な設定でもクラッシュしないこと', async () => {
      const invalidConfig = {
        framework: 'invalid-framework',
        targetFunction: '',
        securityLevel: 'invalid-level'
      };

      expect(async () => {
        const result = await generator.generateTests(invalidConfig);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('空の入力を適切に処理すること', async () => {
      const emptyConfig = {} as any;

      const result = await generator.generateTests(emptyConfig);
      
      expect(result).toBeDefined();
      expect(result.framework).toBeDefined();
      expect(result.testCode).toBeDefined();
    });
  });
});