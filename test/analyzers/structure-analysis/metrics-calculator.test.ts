/**
 * MetricsCalculator 実質的品質テスト
 * Issue #66: ビジネス価値を提供する実際のテスト
 * 
 * TDD RED段階: 失敗するテストを先に作成
 * SOLID原則: 単一責任のテスト
 * DRY原則: テストヘルパーの共通化
 */

import { MetricsCalculator } from '../../../src/analyzers/structure-analysis/metrics-calculator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('MetricsCalculator - 実質的品質保証', () => {
  let calculator: MetricsCalculator;
  let testProjectPath: string;

  beforeEach(() => {
    calculator = new MetricsCalculator();
    // テスト用一時ディレクトリ作成
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-test-'));
  });

  afterEach(() => {
    // クリーンアップ
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  describe('サイクロマティック複雑度の正確な計算', () => {
    it('単純な関数の複雑度を正しく計算する', () => {
      const simpleCode = `
        function add(a, b) {
          return a + b;
        }
      `;
      
      const complexity = calculator.calculateCyclomaticComplexity(simpleCode);
      
      expect(complexity).toBe(1); // 分岐なしは複雑度1
      expect(complexity).toBeGreaterThan(0);
      expect(typeof complexity).toBe('number');
    });

    it('条件分岐を含む関数の複雑度を正しく計算する', () => {
      const conditionalCode = `
        function processUser(user) {
          if (!user) {
            return null;
          }
          
          if (user.age < 18) {
            return 'minor';
          } else if (user.age >= 65) {
            return 'senior';
          } else {
            return 'adult';
          }
        }
      `;
      
      const complexity = calculator.calculateCyclomaticComplexity(conditionalCode);
      
      expect(complexity).toBe(4); // 1 + 3条件分岐
      expect(complexity).toBeGreaterThan(1);
      expect(complexity).toBeLessThan(10); // 適切な範囲内
    });

    it('ループと例外処理を含む複雑なコードの複雑度を計算する', () => {
      const complexCode = `
        async function processData(items) {
          try {
            for (const item of items) {
              if (item.type === 'A') {
                while (item.count > 0) {
                  item.count--;
                }
              } else if (item.type === 'B') {
                switch (item.status) {
                  case 'active':
                    handleActive(item);
                    break;
                  case 'inactive':
                    handleInactive(item);
                    break;
                  default:
                    handleDefault(item);
                }
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
      `;
      
      const complexity = calculator.calculateCyclomaticComplexity(complexCode);
      
      expect(complexity).toBeGreaterThan(5); // 複数の制御フロー
      expect(complexity).toBeLessThan(20); // 過度に複雑ではない
      expect(Number.isInteger(complexity)).toBe(true);
    });

    it('三項演算子と論理演算子の複雑度を正しくカウントする', () => {
      const operatorCode = `
        function validate(value, options) {
          const result = value ? 'valid' : 'invalid';
          const hasPermission = user.isAdmin || user.hasRole('editor');
          const isValid = value && value.length > 0 && value.length < 100;
          return isValid ? result : null;
        }
      `;
      
      const complexity = calculator.calculateCyclomaticComplexity(operatorCode);
      
      expect(complexity).toBeGreaterThan(4); // 複数の論理分岐
      expect(complexity).toEqual(expect.any(Number));
      // 各演算子が正しくカウントされているか
      const ternaryCount = (operatorCode.match(/\?/g) || []).length;
      const orCount = (operatorCode.match(/\|\|/g) || []).length;
      const andCount = (operatorCode.match(/&&/g) || []).length;
      expect(complexity).toBeGreaterThanOrEqual(1 + ternaryCount + orCount + andCount);
    });
  });

  describe('ネストの深さ分析', () => {
    it('フラットなコードのネスト深度を正しく測定する', () => {
      const flatCode = `
        function process() {
          const a = 1;
          const b = 2;
          return a + b;
        }
      `;
      
      const depth = calculator.calculateNestingDepth(flatCode);
      
      expect(depth).toBe(1); // 関数本体のみ
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(3);
    });

    it('深くネストされたコードの深度を正確に測定する', () => {
      const nestedCode = `
        function outer() {
          if (condition1) {
            for (let i = 0; i < 10; i++) {
              if (condition2) {
                while (true) {
                  if (condition3) {
                    // 深いネスト
                  }
                }
              }
            }
          }
        }
      `;
      
      const depth = calculator.calculateNestingDepth(nestedCode);
      
      expect(depth).toBe(6); // 6レベルのネスト
      expect(depth).toBeGreaterThan(4);
      expect(depth).toBeLessThanOrEqual(10); // 過度に深くない
    });

    it('複雑な構造でも正しくネスト深度を計算する', () => {
      const complexStructure = `
        class MyClass {
          constructor() {
            this.data = {
              nested: {
                value: 1
              }
            };
          }
          
          method() {
            try {
              if (this.data) {
                return this.process();
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      `;
      
      const depth = calculator.calculateNestingDepth(complexStructure);
      
      expect(depth).toBeGreaterThan(2);
      expect(depth).toBeLessThan(8);
      expect(Number.isInteger(depth)).toBe(true);
      expect(depth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('プロジェクトメトリクスの統合計算', () => {
    beforeEach(() => {
      // テストプロジェクト構造を作成
      fs.mkdirSync(path.join(testProjectPath, 'src'), { recursive: true });
      fs.mkdirSync(path.join(testProjectPath, 'test'), { recursive: true });
      
      // ソースファイル作成
      fs.writeFileSync(
        path.join(testProjectPath, 'src', 'index.ts'),
        `
          export function main() {
            if (process.env.NODE_ENV === 'production') {
              console.log('Production mode');
            }
          }
        `
      );
      
      // テストファイル作成
      fs.writeFileSync(
        path.join(testProjectPath, 'test', 'index.test.ts'),
        `
          describe('main', () => {
            it('should work', () => {
              expect(true).toBe(true);
            });
          });
        `
      );
    });

    it('プロジェクト全体のメトリクスを正しく計算する', async () => {
      const metrics = await calculator.calculateProjectMetrics(testProjectPath);
      
      expect(metrics).toBeDefined();
      expect(metrics.complexity).toBeDefined();
      expect(metrics.maintainability).toBeDefined();
      expect(metrics.testability).toBeDefined();
      expect(metrics.documentation).toBeDefined();
      
      // 各メトリクスが妥当な範囲内か
      expect(metrics.complexity.averageCyclomaticComplexity).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainability.maintainabilityIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainability.maintainabilityIndex).toBeLessThanOrEqual(100);
    });

    it('複雑なプロジェクトでもメトリクスを安定して計算する', async () => {
      // 複雑なコードを追加
      fs.writeFileSync(
        path.join(testProjectPath, 'src', 'complex.ts'),
        `
          export class ComplexService {
            async process(data: any[]) {
              for (const item of data) {
                if (item.type === 'A') {
                  try {
                    await this.handleA(item);
                  } catch (e) {
                    console.error(e);
                  }
                } else if (item.type === 'B') {
                  await this.handleB(item);
                }
              }
            }
          }
        `
      );
      
      const metrics = await calculator.calculateProjectMetrics(testProjectPath);
      
      expect(metrics.complexity.averageCyclomaticComplexity).toBeGreaterThan(1);
      expect(metrics.complexity.maxComplexity).toBeGreaterThanOrEqual(metrics.complexity.averageCyclomaticComplexity);
      expect(metrics.testability.testCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.testability.testCoverage).toBeLessThanOrEqual(1);
    });

    it('エラーケースでも適切にハンドリングする', async () => {
      const invalidPath = '/non/existent/path';
      
      const metrics = await calculator.calculateProjectMetrics(invalidPath);
      
      // エラー時でも基本的な構造を返す
      expect(metrics).toBeDefined();
      expect(metrics.complexity).toBeDefined();
      expect(metrics.complexity.averageCyclomaticComplexity).toBe(0); // ファイルがない場合は0
    });
  });

  describe('パフォーマンスと効率性', () => {
    it('大きなファイルでも適切な時間内に処理を完了する', () => {
      const largeCode = Array(1000).fill('if (x) { y++; }').join('\n');
      
      const startTime = Date.now();
      const complexity = calculator.calculateCyclomaticComplexity(largeCode);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
      expect(complexity).toBeGreaterThan(1000); // 多くの分岐を正しくカウント
      expect(complexity).toBeLessThan(2000); // 妥当な範囲内
    });

    it('メモリ効率的に処理する', () => {
      const veryLargeCode = Array(10000).fill('function f() { return 1; }').join('\n');
      
      // メモリ使用量が爆発しないことを確認
      const memBefore = process.memoryUsage().heapUsed;
      calculator.calculateNestingDepth(veryLargeCode);
      const memAfter = process.memoryUsage().heapUsed;
      
      const memoryIncrease = memAfter - memBefore;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB以内の増加
    });
  });
});