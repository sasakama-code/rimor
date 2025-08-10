/**
 * MetricsCalculator テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト (t_wada推奨)
 */

import { MetricsCalculator } from '../../../src/analyzers/structure-analysis/metrics-calculator';
import { 
  ProjectMetrics,
  ComplexityMetrics,
  MaintainabilityMetrics,
  TestabilityMetrics,
  DocumentationMetrics
} from '../../../src/analyzers/types';
import * as fs from 'fs';
import * as glob from 'glob';

jest.mock('fs');
jest.mock('glob');

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = glob as jest.Mocked<typeof glob>;

  beforeEach(() => {
    calculator = new MetricsCalculator();
    jest.clearAllMocks();
  });

  describe('calculateProjectMetrics', () => {
    it('プロジェクト全体のメトリクスを計算する', async () => {
      // Arrange
      const mockFiles = [
        '/project/src/index.ts',
        '/project/src/utils.ts',
        '/project/test/index.test.ts'
      ];

      (mockGlob.sync as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(`
        function calculateSum(a: number, b: number): number {
          if (a > 0) {
            if (b > 0) {
              return a + b;
            }
          }
          return 0;
        }
      `);

      // Act
      const result = await calculator.calculateProjectMetrics('/project');

      // Assert
      expect(result).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.maintainability).toBeDefined();
      expect(result.testability).toBeDefined();
      expect(result.documentation).toBeDefined();
    });
  });

  describe('calculateComplexity', () => {
    it('サイクロマティック複雑度を計算する', () => {
      // Arrange
      const code = `
        function example(x: number): string {
          if (x > 10) {
            if (x > 20) {
              return 'high';
            } else {
              return 'medium';
            }
          } else if (x > 0) {
            return 'low';
          }
          return 'zero';
        }
      `;

      // Act
      const complexity = calculator.calculateCyclomaticComplexity(code);

      // Assert
      expect(complexity).toBeGreaterThan(1); // 複数の分岐があるため
    });

    it('ネストの深さを計算する', () => {
      // Arrange
      const code = `
        function deepNest() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  return true;
                }
              }
            }
          }
        }
      `;

      // Act
      const depth = calculator.calculateNestingDepth(code);

      // Assert
      expect(depth).toBe(4);
    });
  });

  describe('calculateMaintainability', () => {
    it('保守性インデックスを計算する', () => {
      // Arrange
      const code = `
        // This function calculates the sum
        function sum(a: number, b: number): number {
          return a + b;
        }
        
        // This function calculates the product
        function multiply(a: number, b: number): number {
          return a * b;
        }
      `;

      // Act
      const maintainability = calculator.calculateMaintainabilityIndex(code);

      // Assert
      expect(maintainability).toBeGreaterThan(0);
      expect(maintainability).toBeLessThanOrEqual(100);
    });

    it('コード重複を検出する', () => {
      // Arrange
      const files = new Map([
        ['file1.ts', 'function getData() { return fetch("/api/data"); }'],
        ['file2.ts', 'function getData() { return fetch("/api/data"); }'],
        ['file3.ts', 'function getUser() { return fetch("/api/user"); }']
      ]);

      // Act
      const duplication = calculator.detectCodeDuplication(files);

      // Assert
      expect(duplication.percentage).toBeGreaterThan(0);
      expect(duplication.locations).toContain('file1.ts');
      expect(duplication.locations).toContain('file2.ts');
    });
  });

  describe('calculateTestability', () => {
    it('テストカバレッジ可能性を評価する', () => {
      // Arrange
      const sourceFiles = [
        '/project/src/user.ts',
        '/project/src/order.ts',
        '/project/src/product.ts'
      ];
      const testFiles = [
        '/project/test/user.test.ts',
        '/project/test/order.test.ts'
      ];

      // Act
      const testability = calculator.calculateTestability(sourceFiles, testFiles);

      // Assert
      expect(testability.coverage).toBeCloseTo(0.67, 2); // 2/3ファイルがテスト済み
      expect(testability.untestedFiles).toContain('/project/src/product.ts');
    });

    it('テスト可能性スコアを計算する', () => {
      // Arrange
      const code = `
        export class UserService {
          constructor(private db: Database, private logger: Logger) {}
          
          async getUser(id: string) {
            return this.db.findOne(id);
          }
          
          private validateUser(user: User) {
            // 複雑な検証ロジック
          }
        }
      `;

      // Act
      const score = calculator.calculateTestabilityScore(code);

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateDocumentation', () => {
    it('ドキュメント化率を計算する', () => {
      // Arrange
      const code = `
        /**
         * Calculates the sum of two numbers
         * @param a First number
         * @param b Second number
         * @returns The sum
         */
        function sum(a: number, b: number): number {
          return a + b;
        }
        
        function multiply(a: number, b: number): number {
          return a * b;
        }
      `;

      // Act
      const coverage = calculator.calculateDocumentationCoverage(code);

      // Assert
      expect(coverage).toBeCloseTo(0.5, 2); // 2関数中1つがドキュメント化
    });

    it('コメント密度を計算する', () => {
      // Arrange
      const code = `
        // This is a comment
        const x = 1;
        // Another comment
        const y = 2;
        const z = 3;
      `;

      // Act
      const density = calculator.calculateCommentDensity(code);

      // Assert
      expect(density).toBeCloseTo(0.4, 1); // 5行中2行がコメント
    });
  });

  describe('generateMetricsReport', () => {
    it('メトリクスの総合レポートを生成する', () => {
      // Arrange
      const metrics: ProjectMetrics = {
        complexity: {
          average: 3.5,
          max: 10,
          distribution: { low: 5, medium: 3, high: 2, veryHigh: 1 }
        },
        maintainability: {
          index: 75,
          averageFileSize: 150,
          duplication: 5.2,
          codeSmells: []
        },
        testability: {
          score: 80,
          coverage: 0.75,
          avgDependencies: 2.5,
          avgMethodLength: 15
        },
        documentation: {
          coverage: 0.6,
          commentRatio: 0.15,
          missingDocs: ['function1', 'class2']
        }
      } as ProjectMetrics;

      // Act
      const report = calculator.generateMetricsReport(metrics);

      // Assert
      expect(report).toContain('Project Metrics Report');
      expect(report).toContain('Complexity');
      expect(report).toContain('Maintainability');
      expect(report).toContain('Testability');
      expect(report).toContain('Documentation');
    });
  });
});