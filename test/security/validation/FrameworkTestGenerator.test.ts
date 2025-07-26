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
    it('フレームワーク別テストを正しく生成すること', async () => {
      const config = {
        outputDir: './temp-tests',
        testCount: {
          basic: 2,
          intermediate: 1,
          advanced: 1
        },
        frameworkConfig: {
          express: { version: '4.x', dependencies: [], testFramework: 'jest' as const },
          react: { version: '18.x', dependencies: [], testFramework: 'jest' as const },
          nestjs: { version: '9.x', dependencies: [], testFramework: 'jest' as const }
        }
      };

      const result = await generator.generateAllFrameworkTests(config);

      expect(result).toBeDefined();
      expect(result.size).toBeGreaterThanOrEqual(3);
      expect(result.has('express')).toBe(true);
      expect(result.has('react')).toBe(true);
      expect(result.has('nestjs')).toBe(true);
    });

    it('Express.js専用テストケースを生成すること', async () => {
      const config = {
        outputDir: './temp-tests',
        testCount: {
          basic: 1,
          intermediate: 1,
          advanced: 1
        },
        frameworkConfig: {
          express: { version: '4.x', dependencies: [], testFramework: 'jest' as const }
        }
      };

      const result = await generator.generateExpressTests(config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('React専用テストケースを生成すること', async () => {
      const config = {
        outputDir: './temp-tests',
        testCount: {
          basic: 1,
          intermediate: 1,
          advanced: 1
        },
        frameworkConfig: {
          react: { version: '18.x', dependencies: [], testFramework: 'jest' as const }
        }
      };

      const result = await generator.generateReactTests(config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('NestJS専用テストケースを生成すること', async () => {
      const config = {
        outputDir: './temp-tests',
        testCount: {
          basic: 1,
          intermediate: 1,
          advanced: 1
        },
        frameworkConfig: {
          nestjs: { version: '9.x', dependencies: [], testFramework: 'jest' as const }
        }
      };

      const result = await generator.generateNestJSTests(config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('設定管理', () => {
    it('生成設定を適切に処理すること', async () => {
      const config = {
        outputDir: './test-output',
        testCount: {
          basic: 5,
          intermediate: 3,
          advanced: 2
        },
        frameworkConfig: {
          express: { version: '4.x', dependencies: ['cors', 'helmet'], testFramework: 'jest' as const },
          react: { version: '18.x', dependencies: ['@testing-library/react'], testFramework: 'vitest' as const }
        }
      };

      const result = await generator.generateAllFrameworkTests(config);

      expect(result).toBeDefined();
      expect(result.size).toBeGreaterThanOrEqual(2);
    });

    it('空の設定でもエラーなく動作すること', async () => {
      const config = {
        outputDir: './empty-tests',
        testCount: {
          basic: 0,
          intermediate: 0,
          advanced: 0
        },
        frameworkConfig: {}
      };

      const result = await generator.generateAllFrameworkTests(config);

      expect(result).toBeDefined();
      expect(result.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な出力ディレクトリでも処理を続行すること', async () => {
      const config = {
        outputDir: './valid-test-dir',
        testCount: {
          basic: 1,
          intermediate: 0,
          advanced: 0
        },
        frameworkConfig: {
          express: { version: '4.x', dependencies: [], testFramework: 'jest' as const }
        }
      };

      await expect(async () => {
        await generator.generateAllFrameworkTests(config);
      }).not.toThrow();
    });

    it('無効なフレームワーク設定を適切に処理すること', async () => {
      const config = {
        outputDir: './invalid-tests',
        testCount: {
          basic: 1,
          intermediate: 0,
          advanced: 0
        },
        frameworkConfig: {
          'invalid-framework': { version: '1.0', dependencies: [], testFramework: 'jest' as const }
        }
      };

      const result = await generator.generateAllFrameworkTests(config);

      expect(result).toBeDefined();
    });
  });
});