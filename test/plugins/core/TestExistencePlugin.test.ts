/**
 * TestExistencePlugin テスト
 * 
 * TDD RED段階: BasePluginを継承したTestExistencePluginのテスト
 * 既存のtestExistence.tsの機能を維持しつつ、新しいアーキテクチャに移行
 */

import { TestExistencePlugin } from '../../../src/plugins/core/TestExistencePlugin';
import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement } from '../../../src/core/types';
import { TestQualityIntegrator } from '../../../src/analyzers/coverage/TestQualityIntegrator';
import { CoverageAnalyzer } from '../../../src/analyzers/coverage/CoverageAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

// モック設定
jest.mock('../../../src/analyzers/coverage/TestQualityIntegrator');
jest.mock('../../../src/analyzers/coverage/CoverageAnalyzer');

const MockTestQualityIntegrator = TestQualityIntegrator as jest.MockedClass<typeof TestQualityIntegrator>;
const MockCoverageAnalyzer = CoverageAnalyzer as jest.MockedClass<typeof CoverageAnalyzer>;

describe('TestExistencePlugin', () => {
  let plugin: TestExistencePlugin;
  let mockQualityIntegrator: jest.Mocked<TestQualityIntegrator>;
  let mockCoverageAnalyzer: jest.Mocked<CoverageAnalyzer>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQualityIntegrator = new MockTestQualityIntegrator() as jest.Mocked<TestQualityIntegrator>;
    mockCoverageAnalyzer = new MockCoverageAnalyzer() as jest.Mocked<CoverageAnalyzer>;
    
    plugin = new TestExistencePlugin();
    (plugin as any).qualityIntegrator = mockQualityIntegrator;
    (plugin as any).coverageAnalyzer = mockCoverageAnalyzer;
  });

  describe('Plugin Interface Compliance', () => {
    test('should have correct plugin metadata', () => {
      expect(plugin.id).toBe('test-existence');
      expect(plugin.name).toBe('Test File Existence Checker');
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plugin.type).toBe('core');
    });

    test('should implement ITestQualityPlugin interface', () => {
      expect(plugin.isApplicable).toBeDefined();
      expect(plugin.detectPatterns).toBeDefined();
      expect(plugin.evaluateQuality).toBeDefined();
      expect(plugin.suggestImprovements).toBeDefined();
    });
  });

  describe('isApplicable', () => {
    test('should always return true for core plugin', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          name: 'test-project',
          version: '1.0.0'
        },
        testFramework: 'jest'
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });
  });

  describe('detectPatterns', () => {
    test('should detect missing test file', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: ''
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        patternId: 'missing-test-file',
        patternName: 'Missing Test File',
        severity: 'high',
        confidence: 0.9
      });
    });

    test('should not detect issues when test file exists', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: 'describe("Component", () => { test("exists", () => {}); });'
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(0);
    });

    test('should detect test file without actual tests', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: '// Empty test file\n'
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        patternId: 'empty-test-file',
        patternName: 'Empty Test File',
        severity: 'medium',
        confidence: 0.8
      });
    });
  });

  describe('evaluateQuality', () => {
    test('should return low score for missing test file', () => {
      const patterns: DetectionResult[] = [{
        patternId: 'missing-test-file',
        patternName: 'Missing Test File',
        severity: 'high',
        confidence: 0.9,
        location: {
          file: '/test/project/src/component.ts',
          line: 1,
          column: 1
        }
      }];

      // TestQualityIntegratorのモックを設定
      const expectedScore: QualityScore = {
        overall: 0,
        dimensions: {
          completeness: 0,
          correctness: 0,
          maintainability: 0
        },
        breakdown: {
          completeness: 0,
          correctness: 0
        },
        confidence: 0.9
      };
      mockQualityIntegrator.evaluateIntegratedQuality.mockReturnValue(expectedScore);

      const score = plugin.evaluateQuality(patterns);

      // missing-test-file: completeness = 0, coverage = 0, overall = (0 + 0) / 2 = 0
      expect(score.overall).toBeCloseTo(0, 1);
      expect(score.breakdown?.completeness).toBeCloseTo(0, 1);
    });

    test('should return high score when no issues detected', () => {
      const patterns: DetectionResult[] = [];

      // TestQualityIntegratorのモックを設定
      const expectedScore: QualityScore = {
        overall: 100,
        dimensions: {
          completeness: 100,
          correctness: 100,
          maintainability: 100
        },
        breakdown: {
          completeness: 100,
          correctness: 100
        },
        confidence: 0.8
      };
      mockQualityIntegrator.evaluateIntegratedQuality.mockReturnValue(expectedScore);

      const score = plugin.evaluateQuality(patterns);

      // 問題なし: completeness = 100, coverage = 100, overall = (100 + 100) / 2 = 100
      expect(score.overall).toBeCloseTo(100, 1);
      expect(score.breakdown?.completeness).toBeCloseTo(100, 1);
    });

    test('should return medium score for empty test file', () => {
      const patterns: DetectionResult[] = [{
        patternId: 'empty-test-file',
        patternName: 'Empty Test File',
        severity: 'medium',
        confidence: 0.8,
        location: {
          file: '/test/project/src/component.test.ts',
          line: 1,
          column: 1
        }
      }];

      // TestQualityIntegratorのモックを設定
      const expectedScore: QualityScore = {
        overall: 50,
        dimensions: {
          completeness: 50,
          correctness: 50,
          maintainability: 50
        },
        breakdown: {
          completeness: 50,
          correctness: 50
        },
        confidence: 0.8
      };
      mockQualityIntegrator.evaluateIntegratedQuality.mockReturnValue(expectedScore);

      const score = plugin.evaluateQuality(patterns);

      // empty-test-file: completeness = 50, coverage = 50, overall = (50 + 50) / 2 = 50
      expect(score.overall).toBeCloseTo(50, 1);
      expect(score.breakdown?.completeness).toBeCloseTo(50, 1);
    });
  });

  describe('suggestImprovements', () => {
    test('should suggest creating test file for missing tests', () => {
      const evaluation: QualityScore = {
        overall: 30,
        breakdown: {
          completeness: 0,
          correctness: 100,
          maintainability: 80
        },
        dimensions: {
          completeness: 0,
          correctness: 1.0,
          maintainability: 0.8
        },
        confidence: 0.9
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(1);
      expect(improvements[0]).toMatchObject({
        priority: 'high',
        type: 'add-test',
        category: 'test-creation',
        title: expect.stringContaining('Create missing test file'),
        estimatedImpact: expect.any(Number)
      });
    });

    test('should suggest adding tests for empty test file', () => {
      const evaluation: QualityScore = {
        overall: 60,
        breakdown: {
          completeness: 50,
          correctness: 100,
          maintainability: 80
        },
        dimensions: {
          completeness: 0.5,
          correctness: 1.0,
          maintainability: 0.8
        },
        confidence: 0.8
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(1);
      expect(improvements[0]).toMatchObject({
        priority: 'medium',
        type: 'improve-coverage',
        category: 'test-improvement',
        title: expect.stringContaining('Add test cases'),
        estimatedImpact: expect.any(Number)
      });
    });

    test('should return no improvements for good quality', () => {
      const evaluation: QualityScore = {
        overall: 95,
        breakdown: {
          completeness: 100,
          correctness: 100,
          maintainability: 90
        },
        dimensions: {
          completeness: 1.0,
          correctness: 1.0,
          maintainability: 0.9
        },
        confidence: 1
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(0);
    });
  });

  describe('Legacy compatibility', () => {
    test('should maintain backward compatibility with existing analyze method', async () => {
      // レガシーメソッドとの互換性確認
      // @ts-ignore - testing legacy compatibility
      if (plugin.analyze) {
        const issues = await plugin.analyze('/test/project/src/component.ts');
        expect(Array.isArray(issues)).toBe(true);
      }
    });
  });
});