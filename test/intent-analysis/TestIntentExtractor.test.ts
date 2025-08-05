/**
 * TestIntentExtractor テスト
 * TDDアプローチ: Red → Green → Refactor
 */

import { TestIntentExtractor } from '../../src/intent-analysis/TestIntentExtractor';
import { TreeSitterParser, SupportedLanguage } from '../../src/intent-analysis/TreeSitterParser';
import { TestType, TestIntent, ActualTestAnalysis, RiskLevel, GapType } from '../../src/intent-analysis/ITestIntentAnalyzer';

describe('TestIntentExtractor', () => {
  let extractor: TestIntentExtractor;
  let parser: TreeSitterParser;

  beforeEach(() => {
    parser = TreeSitterParser.getInstance();
    extractor = new TestIntentExtractor(parser);
  });

  describe('extractIntent', () => {
    // TDD: Red - 最初の失敗するテスト
    it('単純なテストケースから意図を抽出できる', async () => {
      const testCode = `
        describe('Calculator', () => {
          it('should add two numbers correctly', () => {
            const result = add(2, 3);
            expect(result).toBe(5);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const intent = await extractor.extractIntent('test.js', ast);

      expect(intent.description).toBe('should add two numbers correctly');
      expect(intent.targetMethod).toBe('add');
      expect(intent.testType).toBe(TestType.UNIT);
      expect(intent.expectedBehavior).toContain('正しく2つの数値を加算する');
    });

    // YAGNI原則に従い、最小限のテストケースから開始
    it('describeブロックからコンテキストを取得できる', async () => {
      const testCode = `
        describe('UserService', () => {
          it('creates a new user', () => {
            const user = userService.create({ name: 'John' });
            expect(user.id).toBeDefined();
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const intent = await extractor.extractIntent('test.js', ast);

      expect(intent.description).toBe('creates a new user');
      expect(intent.targetMethod).toBe('create');
      expect(intent.scenario?.when).toContain('UserService');
    });

    // エラーケースのテスト（Defensive Programming）
    it('テスト記述がない場合は適切に処理する', async () => {
      const testCode = `
        describe('EmptyTest', () => {
          it('', () => {
            // 空のテスト
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const intent = await extractor.extractIntent('test.js', ast);

      expect(intent.description).toBe('不明なテスト');
      expect(intent.testType).toBe(TestType.UNKNOWN);
    });
  });

  describe('analyzeActualTest', () => {
    it('実際のテストコードから分析情報を抽出できる', async () => {
      const testCode = `
        describe('Calculator', () => {
          it('should add two numbers correctly', () => {
            const result = add(2, 3);
            expect(result).toBe(5);
            expect(result).toBeGreaterThan(0);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const analysis = await extractor.analyzeActualTest('test.js', ast);

      expect(analysis.actualTargetMethods).toContain('add');
      expect(analysis.assertions).toHaveLength(2);
      expect(analysis.assertions[0].type).toBe('toBe');
      expect(analysis.assertions[0].expected).toBe('5');
      expect(analysis.complexity).toBeGreaterThan(0);
    });

    it('アサーションがない場合も正しく処理できる', async () => {
      const testCode = `
        it('empty test', () => {
          // No assertions
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const analysis = await extractor.analyzeActualTest('test.js', ast);

      expect(analysis.actualTargetMethods).toHaveLength(0);
      expect(analysis.assertions).toHaveLength(0);
      expect(analysis.complexity).toBe(1); // 最小複雑度
    });
  });

  describe('evaluateRealization', () => {
    it('意図と実装のギャップを評価できる', async () => {
      const intent: TestIntent = {
        description: 'should add two numbers correctly',
        targetMethod: 'add',
        testType: TestType.UNIT,
        expectedBehavior: ['正しく2つの数値を加算する'],
        coverageScope: {
          happyPath: true,
          errorCases: false,
          edgeCases: false,
          boundaryValues: false
        }
      };

      const actual: ActualTestAnalysis = {
        actualTargetMethods: ['add'],
        assertions: [
          {
            type: 'toBe',
            expected: '5',
            actual: 'result',
            location: { line: 4, column: 10 }
          }
        ],
        actualCoverage: {
          happyPath: true,
          errorCases: false,
          edgeCases: false,
          boundaryValues: false
        },
        complexity: 1
      };

      const result = await extractor.evaluateRealization(intent, actual);

      expect(result.intent).toBe(intent);
      expect(result.actual).toBe(actual);
      expect(result.realizationScore).toBeGreaterThan(80); // 高いスコア（ギャップが少ない）
      expect(result.gaps).toHaveLength(0); // ギャップなし
      expect(result.riskLevel).toBe(RiskLevel.MINIMAL);
    });

    it('ギャップがある場合を正しく検出できる', async () => {
      const intent: TestIntent = {
        description: 'should handle errors properly',
        targetMethod: 'divide',
        testType: TestType.UNIT,
        expectedBehavior: ['エラーケースを適切に処理する'],
        coverageScope: {
          happyPath: true,
          errorCases: true,
          edgeCases: true,
          boundaryValues: false
        }
      };

      const actual: ActualTestAnalysis = {
        actualTargetMethods: ['divide'],
        assertions: [
          {
            type: 'toBe',
            expected: '2',
            actual: 'result',
            location: { line: 4, column: 10 }
          }
        ],
        actualCoverage: {
          happyPath: true,
          errorCases: false, // エラーケースが不足
          edgeCases: false,  // エッジケースが不足
          boundaryValues: false
        },
        complexity: 1
      };

      const result = await extractor.evaluateRealization(intent, actual);

      expect(result.realizationScore).toBeLessThan(80); // 期待より低いスコア
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.gaps.some(gap => gap.type === GapType.MISSING_ERROR_CASE)).toBe(true);
      expect(result.gaps.some(gap => gap.type === GapType.MISSING_EDGE_CASE)).toBe(true);
      expect(result.riskLevel).toBe(RiskLevel.HIGH); // エラーケース不足はHIGHリスク
    });
  });
});