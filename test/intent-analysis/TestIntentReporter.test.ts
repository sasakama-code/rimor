/**
 * TestIntentReporter Tests
 * v0.9.0 - TDD Red Phase: 失敗するテストを最初に書く
 * t_wadaのTDD推奨手法に従って実装
 */

import { TestIntentReporter } from '../../src/intent-analysis/TestIntentReporter';
import {
  TestRealizationResult,
  TestIntent,
  TestType,
  ActualTestAnalysis,
  IntentRiskLevel,
  GapType,
  Severity
} from '../../src/intent-analysis/ITestIntentAnalyzer';

describe('TestIntentReporter', () => {
  let reporter: TestIntentReporter;

  beforeEach(() => {
    reporter = new TestIntentReporter();
  });

  describe('generateMarkdownReport', () => {
    it('テスト実現度結果をMarkdown形式でレポート生成できる', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({
          file: 'test/example.test.ts',
          description: '加算関数のテスト',
          realizationScore: 85,
          riskLevel: IntentRiskLevel.LOW,
          gaps: [
            {
              type: GapType.MISSING_EDGE_CASE,
              description: 'エッジケースのテストが不足しています',
              severity: Severity.MEDIUM,
              suggestions: ['nullやundefinedの処理をテスト']
            }
          ]
        })
      ];

      // Act
      const markdown = reporter.generateMarkdownReport(results);

      // Assert
      expect(markdown).toContain('# テスト意図実現度監査レポート');
      expect(markdown).toContain('## サマリー');
      expect(markdown).toContain('test/example.test.ts');
      expect(markdown).toContain('加算関数のテスト');
      expect(markdown).toContain('実現度: 85%');
      expect(markdown).toContain('リスクレベル: LOW');
      expect(markdown).toContain('エッジケースのテストが不足しています');
    });

    it('リスクレベルに応じて適切な警告を表示する', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({ riskLevel: IntentRiskLevel.CRITICAL }),
        createMockResult({ riskLevel: IntentRiskLevel.HIGH }),
        createMockResult({ riskLevel: IntentRiskLevel.MEDIUM })
      ];

      // Act
      const markdown = reporter.generateMarkdownReport(results);

      // Assert
      expect(markdown).toContain('⚠️ **警告**: CRITICALレベルのリスクが検出されました');
      expect(markdown).toContain('CRITICALリスク: 1件');
      expect(markdown).toContain('HIGHリスク: 1件');
      expect(markdown).toContain('MEDIUMリスク: 1件');
    });

    it('改善提案を優先度順に表示する', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({
          gaps: [
            {
              type: GapType.MISSING_ASSERTION,
              description: 'アサーションが存在しません',
              severity: Severity.CRITICAL,
              suggestions: ['expect文を追加してください']
            },
            {
              type: GapType.MISSING_ERROR_CASE,
              description: 'エラーケースがテストされていません',
              severity: Severity.HIGH,
              suggestions: ['エラーケースを追加してください']
            }
          ]
        })
      ];

      // Act
      const markdown = reporter.generateMarkdownReport(results);

      // Assert
      expect(markdown).toContain('## 改善提案（優先度順）');
      // CRITICAL が HIGH より先に表示される
      const criticalIndex = markdown.indexOf('アサーションが存在しません');
      const highIndex = markdown.indexOf('エラーケースがテストされていません');
      expect(criticalIndex).toBeLessThan(highIndex);
    });

    it('統計情報を表示する', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({ realizationScore: 90 }),
        createMockResult({ realizationScore: 70 }),
        createMockResult({ realizationScore: 50 })
      ];

      // Act
      const markdown = reporter.generateMarkdownReport(results);

      // Assert
      expect(markdown).toContain('## 統計情報');
      expect(markdown).toContain('分析ファイル数: 3');
      expect(markdown).toContain('平均実現度: 70.0%');
      expect(markdown).toContain('最低実現度: 50%');
      expect(markdown).toContain('最高実現度: 90%');
    });
  });

  describe('generateHTMLReport', () => {
    it('テスト実現度結果をHTML形式でレポート生成できる', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({
          file: 'test/example.test.ts',
          description: '加算関数のテスト',
          realizationScore: 85,
          riskLevel: IntentRiskLevel.LOW
        })
      ];

      // Act
      const html = reporter.generateHTMLReport(results);

      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>テスト意図実現度監査レポート</title>');
      expect(html).toContain('test/example.test.ts');
      expect(html).toContain('加算関数のテスト');
      expect(html).toContain('85%');
    });

    it('リスクレベルに応じて色分けされたバッジを表示する', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({ riskLevel: IntentRiskLevel.CRITICAL }),
        createMockResult({ riskLevel: IntentRiskLevel.LOW })
      ];

      // Act
      const html = reporter.generateHTMLReport(results);

      // Assert
      // CRITICALは赤色
      expect(html).toMatch(/<span[^>]*class="[^"]*critical[^"]*"[^>]*>CRITICAL<\/span>/);
      // LOWは緑色
      expect(html).toMatch(/<span[^>]*class="[^"]*low[^"]*"[^>]*>LOW<\/span>/);
    });

    it('進捗バーで実現度を視覚的に表示する', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({ realizationScore: 75 })
      ];

      // Act
      const html = reporter.generateHTMLReport(results);

      // Assert
      expect(html).toContain('<div class="progress-bar"');
      expect(html).toContain('width: 75%');
    });
  });

  describe('generateSummary', () => {
    it('複数ファイルの結果をサマリーとして生成できる', () => {
      // Arrange
      const results: TestRealizationResult[] = [
        createMockResult({ file: 'test1.test.ts', riskLevel: IntentRiskLevel.HIGH }),
        createMockResult({ file: 'test2.test.ts', riskLevel: IntentRiskLevel.LOW }),
        createMockResult({ file: 'test3.test.ts', riskLevel: IntentRiskLevel.CRITICAL })
      ];

      // Act
      const summary = reporter.generateSummary(results);

      // Assert
      expect(summary.totalFiles).toBe(3);
      expect(summary.criticalRiskCount).toBe(1);
      expect(summary.highRiskCount).toBe(1);
      expect(summary.mediumRiskCount).toBe(0);
      expect(summary.lowRiskCount).toBe(1);
      expect(summary.averageRealizationScore).toBeGreaterThan(0);
    });
  });
});

// テスト用のモックデータ作成ヘルパー
function createMockResult(overrides: any = {}): TestRealizationResult {
  const defaultIntent: TestIntent = {
    description: 'テストの説明',
    targetMethod: 'testMethod',
    testType: TestType.UNIT,
    expectedBehavior: ['正しく動作する'],
    coverageScope: {
      happyPath: true,
      errorCases: false,
      edgeCases: false,
      boundaryValues: false
    }
  };

  const defaultActual: ActualTestAnalysis = {
    actualTargetMethods: ['testMethod'],
    assertions: [],
    actualCoverage: {
      happyPath: true,
      errorCases: false,
      edgeCases: false,
      boundaryValues: false
    },
    complexity: 1
  };

  return {
    intent: overrides.intent || defaultIntent,
    actual: overrides.actual || defaultActual,
    gaps: overrides.gaps || [],
    realizationScore: overrides.realizationScore || 100,
    riskLevel: overrides.riskLevel || IntentRiskLevel.MINIMAL,
    file: overrides.file || 'test.test.ts',
    description: overrides.description || 'テストの説明'
  };
}