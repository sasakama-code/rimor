/**
 * CodeContextUtils テスト
 * 実装の正確性を検証するための意味のあるテスト
 */

import { CodeContextUtils } from '../../../src/analyzers/code-analysis/utils';

describe('CodeContextUtils', () => {
  let utils: CodeContextUtils;

  beforeEach(() => {
    utils = new CodeContextUtils();
  });

  describe('calculateComplexityScore', () => {
    it('McCabe複雑度を正しく計算する', () => {
      const complexCode = `
        function example(x) {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (i % 2 === 0) {
                console.log(i);
              }
            }
          } else {
            while (x < 0) {
              x++;
            }
          }
          return x > 0 ? 'positive' : 'negative';
        }
      `;
      
      const complexity = utils.calculateComplexityScore(complexCode);
      expect(complexity).toBeGreaterThan(0);
      expect(typeof complexity).toBe('number');
    });

    it('単純なコードは低い複雑度', () => {
      const simpleCode = 'const x = 42;\nreturn x;';
      const complexity = utils.calculateComplexityScore(simpleCode);
      expect(complexity).toBeLessThan(5);
    });

    it('ネストレベルが複雑度に反映される', () => {
      const nestedCode = `
        function nested() {
          if (true) {
            if (true) {
              if (true) {
                return 'deep';
              }
            }
          }
        }
      `;
      
      const simpleCode = 'function simple() { return "simple"; }';
      
      expect(utils.calculateComplexityScore(nestedCode))
        .toBeGreaterThan(utils.calculateComplexityScore(simpleCode));
    });
  });

  describe('calculateQualityMetrics', () => {
    it('品質指標を正しく計算する', () => {
      const code = `
        // This is a comment
        const value = 42;
        
        function calculate(x) {
          if (x > 0) {
            return x * 2;
          }
          return 0;
        }
      `;
      
      const metrics = utils.calculateQualityMetrics(code, 'javascript');
      
      expect(metrics).toHaveProperty('linesOfCode');
      expect(metrics).toHaveProperty('commentRatio');
      expect(metrics).toHaveProperty('complexity');
      expect(metrics).toHaveProperty('maintainabilityIndex');
      
      expect(typeof metrics.linesOfCode).toBe('number');
      expect(typeof metrics.commentRatio).toBe('number');
      expect(typeof metrics.complexity).toBe('number');
      expect(typeof metrics.maintainabilityIndex).toBe('number');
      
      expect(metrics.linesOfCode).toBeGreaterThan(0);
      expect(metrics.commentRatio).toBeGreaterThan(0);
    });

    it('空のコードでも正しく処理する', () => {
      const metrics = utils.calculateQualityMetrics('', 'javascript');
      expect(metrics.linesOfCode).toBe(0);
      expect(metrics.commentRatio).toBe(0);
    });
  });

  describe('estimateTestCoverage', () => {
    it('テストファイルがない場合は0を返す', () => {
      const code = 'function test() { return true; }';
      const coverage = utils.estimateTestCoverage(code, []);
      expect(coverage).toBe(0);
    });

    it('テストファイルがある場合は推定値を返す', () => {
      const code = 'function test() { return true; }';
      const testFiles = ['test.spec.js'];
      const coverage = utils.estimateTestCoverage(code, testFiles);
      expect(coverage).toBeGreaterThan(0);
      expect(coverage).toBeLessThanOrEqual(1);
    });

    it('関数がない場合は基準値を返す', () => {
      const code = 'const x = 42;';
      const testFiles = ['test.spec.js'];
      const coverage = utils.estimateTestCoverage(code, testFiles);
      expect(coverage).toBe(0.5);
    });
  });

  describe('calculateImportanceScore', () => {
    it('エクスポートが多いほど重要度が高い', () => {
      const exportCode = `
        export class MyClass {}
        export function myFunction() {}
        export const myConstant = 42;
      `;
      const simpleCode = 'const x = 42;';
      
      const importantScore = utils.calculateImportanceScore(exportCode, 'test.ts', 0);
      const simpleScore = utils.calculateImportanceScore(simpleCode, 'test.ts', 0);
      
      expect(importantScore).toBeGreaterThan(simpleScore);
    });

    it('ファイル名で重要度が調整される', () => {
      const code = 'const x = 42;';
      
      const indexScore = utils.calculateImportanceScore(code, 'index.ts', 0);
      const utilScore = utils.calculateImportanceScore(code, 'util.ts', 0);
      const regularScore = utils.calculateImportanceScore(code, 'regular.ts', 0);
      
      expect(indexScore).toBeGreaterThan(regularScore);
      expect(utilScore).toBeGreaterThan(regularScore);
    });
  });

  describe('calculateReadabilityScore', () => {
    it('適切な行長は高いスコアを得る', () => {
      const goodCode = [
        'const shortLine = true;',
        'function calculate(x) {',
        '  return x * 2;',
        '}'
      ].join('\n');
      
      const score = utils.calculateReadabilityScore(goodCode);
      expect(score).toBeGreaterThan(0.5);
    });

    it('長すぎる行は低いスコアになる', () => {
      const longLineCode = 'const veryLongLineOfCodeThatExceedsTheRecommendedMaximumLineLengthAndShouldBeAvoidedForBetterReadability = true;';
      const shortLineCode = 'const short = true;';
      
      const longScore = utils.calculateReadabilityScore(longLineCode);
      const shortScore = utils.calculateReadabilityScore(shortLineCode);
      
      expect(shortScore).toBeGreaterThanOrEqual(longScore);
    });
  });

  describe('calculateSecurityRiskScore', () => {
    it('eval()の使用でリスクスコアが上がる', () => {
      const riskyCode = 'eval("dangerous code");';
      const safeCode = 'const safe = "safe code";';
      
      const riskyScore = utils.calculateSecurityRiskScore(riskyCode);
      const safeScore = utils.calculateSecurityRiskScore(safeCode);
      
      expect(riskyScore).toBeGreaterThan(safeScore);
      expect(riskyScore).toBeGreaterThan(0);
    });

    it('複数のリスクパターンが累積される', () => {
      const multiRiskCode = `
        eval("dangerous");
        document.write("xss");
        const password = "hardcoded";
      `;
      const singleRiskCode = 'eval("dangerous");';
      
      const multiScore = utils.calculateSecurityRiskScore(multiRiskCode);
      const singleScore = utils.calculateSecurityRiskScore(singleRiskCode);
      
      expect(multiScore).toBeGreaterThan(singleScore);
    });
  });

  describe('detectPerformanceIssues', () => {
    it('ネストしたループを検出する', () => {
      const nestedLoopCode = `
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            console.log(i, j);
          }
        }
      `;
      
      const issues = utils.detectPerformanceIssues(nestedLoopCode);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('ネストしたループ'))).toBe(true);
    });

    it('同期ファイル操作を検出する', () => {
      const syncCode = 'const data = fs.readFileSync("file.txt");';
      const issues = utils.detectPerformanceIssues(syncCode);
      
      expect(issues.some(issue => issue.includes('同期的なファイル操作'))).toBe(true);
    });
  });

  describe('detectBestPracticeViolations', () => {
    it('varの使用を検出する', () => {
      const varCode = 'var x = 42;';
      const violations = utils.detectBestPracticeViolations(varCode, 'javascript');
      
      expect(violations.some(v => v.includes('var'))).toBe(true);
    });

    it('==の使用を検出する', () => {
      const loosEqualityCode = 'if (x == y) { return true; }';
      const violations = utils.detectBestPracticeViolations(loosEqualityCode, 'javascript');
      
      expect(violations.some(v => v.includes('厳密等価演算子'))).toBe(true);
    });
  });

  describe('analyzeFileSize', () => {
    it('ファイルサイズ情報を正確に計算する', () => {
      const code = [
        '// This is a comment',
        'const x = 42;',
        '',
        'function test() {',
        '  return x;',
        '}'
      ].join('\n');
      
      const analysis = utils.analyzeFileSize(code);
      
      expect(analysis).toHaveProperty('bytes');
      expect(analysis).toHaveProperty('lines');
      expect(analysis).toHaveProperty('codeLines');
      expect(analysis).toHaveProperty('commentLines');
      expect(analysis).toHaveProperty('emptyLines');
      
      expect(analysis.lines).toBe(6);
      expect(analysis.commentLines).toBe(1);
      expect(analysis.emptyLines).toBe(1);
      expect(analysis.codeLines).toBe(4);
      expect(analysis.bytes).toBeGreaterThan(0);
    });
  });

  describe('buildDependencyGraph', () => {
    it('依存関係グラフを正しく構築する', () => {
      const files = [
        { path: 'a.ts', imports: ['b.ts', 'c.ts'] },
        { path: 'b.ts', imports: ['c.ts'] },
        { path: 'c.ts', imports: [] }
      ];
      
      const graph = utils.buildDependencyGraph(files);
      
      expect(graph.size).toBe(3);
      expect(graph.get('a.ts')).toEqual(['b.ts', 'c.ts']);
      expect(graph.get('b.ts')).toEqual(['c.ts']);
      expect(graph.get('c.ts')).toEqual([]);
    });
  });
});