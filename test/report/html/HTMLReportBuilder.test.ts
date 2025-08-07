/**
 * HTMLReportBuilder テスト
 * v0.9.0 - Phase 5-3: HTMLレポート生成のテスト
 * TDD Red Phase - 失敗するテストを最初に書く
 */

import { HTMLReportBuilder } from '../../../src/report/html/HTMLReportBuilder';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  ExecutiveSummary,
  DetailedIssue
} from '../../../src/nist/types/unified-analysis-result';

describe('HTMLReportBuilder', () => {
  let builder: HTMLReportBuilder;

  beforeEach(() => {
    builder = new HTMLReportBuilder();
  });

  describe('buildHTMLReport', () => {
    it('基本的なHTMLレポートを生成できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</html>');
    });

    it('エグゼクティブサマリーを含む', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('エグゼクティブサマリー');
      expect(html).toContain('総合スコア');
      expect(html).toContain('75'); // overallScore
      expect(html).toContain('グレード: C'); // overallGrade
    });

    it('リスクレベル別の統計を表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('リスク分布');
      expect(html).toContain('CRITICAL: 2');
      expect(html).toContain('HIGH: 1');
      expect(html).toContain('MEDIUM: 1');
    });

    it('詳細な問題リストを表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('検出された問題');
      expect(html).toContain('Critical issue 1');
      expect(html).toContain('/test/file0.ts');
      expect(html).toContain('行:</strong> 0-5');
    });

    it('リスクレベルに応じた色分けをする', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('badge-critical'); // CRITICALの色
      expect(html).toContain('badge-high');     // HIGHの色
      expect(html).toContain('badge-medium');   // MEDIUMの色
      expect(html).toContain('badge-low');      // LOWの色
    });

    it('Chart.js用のデータを生成する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const chartData = builder.generateChartData(analysisResult);

      // Assert
      expect(chartData).toHaveProperty('labels');
      expect(chartData).toHaveProperty('datasets');
      expect(chartData.labels).toContain('CRITICAL');
      expect(chartData.labels).toContain('HIGH');
      expect(chartData.datasets[0].data).toEqual([2, 1, 1, 1, 0]);
    });

    it('ディメンション別スコアを表示する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('評価ディメンション');
      expect(html).toContain('テスト意図実現度');
      expect(html).toContain('セキュリティリスク');
      expect(html).toContain('重み: 0.5');
    });

    it('レポートの見方ガイドを含む', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('レポートの見方');
      expect(html).toContain('総合スコアは100点満点');
      expect(html).toContain('A: 90-100');
    });

    it('フィルタリング用のHTML要素を生成する', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('id="risk-filter"');
      expect(html).toContain('option value="ALL"');
      expect(html).toContain('option value="CRITICAL"');
      expect(html).toContain('data-risk-level');
    });

    it('空の分析結果でも正しく処理できる', () => {
      // Arrange
      const analysisResult = createEmptyAnalysisResult();

      // Act
      const html = builder.buildHTMLReport(analysisResult);

      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('問題は検出されませんでした');
      expect(html).toContain('総合スコア');
      expect(html).toContain('100');
    });
  });

  describe('generateChartData', () => {
    it('Chart.js形式のデータを生成できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult();

      // Act
      const data = builder.generateChartData(analysisResult);

      // Assert
      expect(data).toEqual({
        labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
        datasets: [{
          label: 'リスク件数',
          data: [2, 1, 1, 1, 0],
          backgroundColor: [
            '#dc3545', // CRITICAL - red
            '#fd7e14', // HIGH - orange
            '#ffc107', // MEDIUM - yellow
            '#28a745', // LOW - green
            '#6c757d'  // MINIMAL - gray
          ]
        }]
      });
    });
  });
});

// ヘルパー関数
function createMockAnalysisResult(): UnifiedAnalysisResult {
  const detailedIssues: DetailedIssue[] = [
    {
      filePath: '/test/file0.ts',
      startLine: 0,
      endLine: 5,
      riskLevel: RiskLevel.CRITICAL,
      title: 'Critical issue 1',
      description: 'Critical security vulnerability',
      contextSnippet: 'code snippet'
    },
    {
      filePath: '/test/file1.ts',
      startLine: 10,
      endLine: 15,
      riskLevel: RiskLevel.CRITICAL,
      title: 'Critical issue 2',
      description: 'Another critical issue',
      contextSnippet: 'code snippet'
    },
    {
      filePath: '/test/file2.ts',
      startLine: 20,
      endLine: 25,
      riskLevel: RiskLevel.HIGH,
      title: 'High risk issue',
      description: 'High priority issue',
      contextSnippet: 'code snippet'
    },
    {
      filePath: '/test/file3.ts',
      startLine: 30,
      endLine: 35,
      riskLevel: RiskLevel.MEDIUM,
      title: 'Medium risk issue',
      description: 'Medium priority issue',
      contextSnippet: 'code snippet'
    },
    {
      filePath: '/test/file4.ts',
      startLine: 40,
      endLine: 45,
      riskLevel: RiskLevel.LOW,
      title: 'Low risk issue',
      description: 'Low priority issue',
      contextSnippet: 'code snippet'
    }
  ];

  return {
    schemaVersion: '1.0' as const,
    summary: {
      overallScore: 75,
      overallGrade: 'C',
      dimensions: [
        {
          name: 'テスト意図実現度',
          score: 70,
          weight: 0.5,
          impact: 35,
          breakdown: []
        },
        {
          name: 'セキュリティリスク',
          score: 80,
          weight: 0.5,
          impact: 40,
          breakdown: []
        }
      ],
      statistics: {
        totalFiles: 10,
        totalTests: 50,
        riskCounts: {
          [RiskLevel.CRITICAL]: 2,
          [RiskLevel.HIGH]: 1,
          [RiskLevel.MEDIUM]: 1,
          [RiskLevel.LOW]: 1,
          [RiskLevel.MINIMAL]: 0
        }
      }
    },
    detailedIssues,
    aiKeyRisks: []
  };
}

function createEmptyAnalysisResult(): UnifiedAnalysisResult {
  return {
    schemaVersion: '1.0' as const,
    summary: {
      overallScore: 100,
      overallGrade: 'A',
      dimensions: [],
      statistics: {
        totalFiles: 10,
        totalTests: 50,
        riskCounts: {
          [RiskLevel.CRITICAL]: 0,
          [RiskLevel.HIGH]: 0,
          [RiskLevel.MEDIUM]: 0,
          [RiskLevel.LOW]: 0,
          [RiskLevel.MINIMAL]: 0
        }
      }
    },
    detailedIssues: [],
    aiKeyRisks: []
  };
}