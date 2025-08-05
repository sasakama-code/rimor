/**
 * TestIntentExtractor テスト
 * TDDアプローチ: Red → Green → Refactor
 */

import { TestIntentExtractor } from '../../src/intent-analysis/TestIntentExtractor';
import { TreeSitterParser, SupportedLanguage } from '../../src/intent-analysis/TreeSitterParser';
import { TestType } from '../../src/intent-analysis/ITestIntentAnalyzer';

describe('TestIntentExtractor', () => {
  let extractor: TestIntentExtractor;
  let parser: TreeSitterParser;

  beforeEach(() => {
    parser = new TreeSitterParser();
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
});