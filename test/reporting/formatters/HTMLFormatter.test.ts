/**
 * HTMLFormatter テスト
 * v0.9.0 - Issue #64: 旧HTMLReportBuilderのテストケースを統合
 * TDD RED→GREEN→REFACTOR手法に従って実装
 * 
 * SOLID原則: 単一責任（HTML形式の生成）の検証
 * DRY原則: BaseFormatterの共通ロジック活用の確認
 */

import { HTMLFormatter } from '../../../src/reporting/formatters/HTMLFormatter';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  ExecutiveSummary,
  DetailedIssue
} from '../../../src/nist/types/unified-analysis-result';

describe('HTMLFormatter', () => {
  let formatter: HTMLFormatter;
  
  beforeEach(() => {
    formatter = new HTMLFormatter();
  });

  /**
   * モックデータ生成ヘルパー
   */
  function createMockAnalysisResult(): UnifiedAnalysisResult {
    return {
      summary: {
        overallScore: 75,
        overallGrade: 'C',
        statistics: {
          totalFiles: 10,
          totalTests: 50,
          riskCounts: {
            CRITICAL: 2,
            HIGH: 1,
            MEDIUM: 1,
            LOW: 1,
            MINIMAL: 0
          }
        },
        dimensions: [
          {
            name: 'testIntent',
            score: 70,
            weight: 0.5,
            impact: 'positive' as any,
            breakdown: []
          },
          {
            name: 'security',
            score: 80,
            weight: 0.5,
            impact: 'positive' as any,
            breakdown: []
          }
        ]
      },
      aiKeyRisks: [],
      detailedIssues: [
        {
          riskLevel: RiskLevel.CRITICAL,
          title: 'Critical issue 1',
          description: 'Test critical issue',
          filePath: '/test/file0.ts',
          startLine: 0,
          endLine: 5,
          contextSnippet: 'function analyze() { ... }'
        },
        {
          riskLevel: RiskLevel.HIGH,
          title: 'High security issue',
          description: 'Security vulnerability detected',
          filePath: '/test/file1.ts',
          startLine: 10,
          endLine: 15,
          contextSnippet: 'const password = "hardcoded";'
        },
        {
          riskLevel: RiskLevel.MEDIUM,
          title: 'Medium quality issue',
          description: 'Quality needs improvement',
          filePath: '/test/file2.ts',
          startLine: 20,
          endLine: 25
        },
        {
          riskLevel: RiskLevel.LOW,
          title: 'Low priority issue',
          description: 'Minor improvement needed',
          filePath: '/test/file3.ts',
          startLine: 30,
          endLine: 35
        }
      ],
      schemaVersion: '1.0' as const
    };
  }

  describe('format', () => {
    test('基本的なHTMLレポートを生成できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</html>');
    });

    test('エグゼクティブサマリーを含む', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('エグゼクティブサマリー');
      expect(html).toContain('総合スコア');
      expect(html).toContain('75'); // overallScore
      expect(html).toContain('グレード: C'); // overallGrade
    });

    test('リスクレベル別の統計を表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('リスク分布');
      expect(html).toContain('CRITICAL: 2');
      expect(html).toContain('HIGH: 1');
      expect(html).toContain('MEDIUM: 1');
      expect(html).toContain('LOW: 1');
    });

    test('詳細な問題リストを表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('検出された問題');
      expect(html).toContain('Critical issue 1');
      expect(html).toContain('/test/file0.ts');
      expect(html).toContain('0-5');
    });

    test('リスクレベルに応じた色分けをする', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      // CSSスタイルでの色定義を確認
      expect(html).toContain('#dc3545'); // CRITICAL - red
      expect(html).toContain('#fd7e14'); // HIGH - orange
      expect(html).toContain('#ffc107'); // MEDIUM - yellow
      expect(html).toContain('#28a745'); // LOW - green
    });

    test('ディメンション別スコアを表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('評価ディメンション');
      expect(html).toContain('testIntent');
      expect(html).toContain('security');
      expect(html).toContain('重み: 0.5');
      expect(html).toContain('スコア: 70');
      expect(html).toContain('スコア: 80');
    });

    test('空の分析結果でも正しく処理できる', () => {
      // Arrange
      const emptyResult: UnifiedAnalysisResult = {
        summary: {
          overallScore: 0,
          overallGrade: 'F',
          statistics: {
            totalFiles: 0,
            totalTests: 0,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 0,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          },
          dimensions: []
        },
        aiKeyRisks: [],
        detailedIssues: [],
        schemaVersion: '1.0' as const
      };
      
      // Act
      const html = formatter.format(emptyResult);
      
      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('問題は検出されませんでした');
    });

    test('Bootstrap CSSクラスを使用する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('class="container');
      expect(html).toContain('class="card');
      expect(html).toContain('class="badge');
      expect(html).toContain('table');
    });

    test('レスポンシブデザインのメタタグを含む', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
      expect(html).toContain('initial-scale=1.0');
    });

    test('フィルタリング機能用のデータ属性を含む', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();
      
      // Act
      const html = formatter.format(analysisResult);
      
      // Assert
      expect(html).toContain('data-risk-level="CRITICAL"');
      expect(html).toContain('data-risk-level="HIGH"');
      expect(html).toContain('data-risk-level="MEDIUM"');
      expect(html).toContain('data-risk-level="LOW"');
    });
  });

  describe('BaseFormatterとの統合', () => {
    test('BaseFormatterのvalidateメソッドを継承している', () => {
      // Arrange
      const invalidResult = null as any;
      
      // Act & Assert
      expect(() => formatter.format(invalidResult)).toThrow();
    });

    test('formatの名前プロパティが正しく設定されている', () => {
      // Assert
      expect(formatter.name).toBe('html');
    });
  });

  describe('パフォーマンス', () => {
    test('大量の問題を含むレポートも高速に生成できる', () => {
      // Arrange
      const largeResult = createMockAnalysisResult();
      // 1000個の問題を追加
      for (let i = 0; i < 1000; i++) {
        largeResult.detailedIssues.push({
          riskLevel: RiskLevel.LOW,
          title: `Issue ${i}`,
          description: `Description ${i}`,
          filePath: `/test/file${i}.ts`,
          startLine: i,
          endLine: i + 5
        });
      }
      
      // Act
      const startTime = Date.now();
      const html = formatter.format(largeResult);
      const duration = Date.now() - startTime;
      
      // Assert
      expect(html).toBeDefined();
      expect(duration).toBeLessThan(1000); // 1秒以内に生成
    });
  });
});