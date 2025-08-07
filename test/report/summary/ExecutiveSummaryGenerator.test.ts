/**
 * ExecutiveSummaryGenerator テスト
 * v0.9.0 - Phase 5-2: エグゼクティブサマリー生成のテスト
 * TDD Red Phase - 失敗するテストを最初に書く
 */

import { ExecutiveSummaryGenerator } from '../../../src/report/summary/ExecutiveSummaryGenerator';
import { ReportDimensionCalculator } from '../../../src/report/dimensions/ReportDimensionCalculator';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  ExecutiveSummary,
  ReportDimension,
  DetailedIssue,
  AIActionableRisk
} from '../../../src/nist/types/unified-analysis-result';

describe('ExecutiveSummaryGenerator', () => {
  let generator: ExecutiveSummaryGenerator;
  let dimensionCalculator: ReportDimensionCalculator;

  beforeEach(() => {
    dimensionCalculator = new ReportDimensionCalculator();
    generator = new ExecutiveSummaryGenerator(dimensionCalculator);
  });

  describe('generateSummary', () => {
    it('総合スコアとグレードを正しく計算できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.HIGH, title: 'High risk issue' },
        { riskLevel: RiskLevel.MEDIUM, title: 'Medium risk issue' }
      ]);

      // Act
      const summary = generator.generateSummary(analysisResult);

      // Assert
      expect(summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallScore).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(summary.overallGrade);
    });

    it('グレードを正しく判定できる', () => {
      // Arrange & Act & Assert
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 50, expectedGrade: 'F' }
      ];

      testCases.forEach(({ score, expectedGrade }) => {
        const result = createMockAnalysisResultWithScore(score);
        const summary = generator.generateSummary(result);
        expect(summary.overallScore).toBe(score);
        expect(summary.overallGrade).toBe(expectedGrade);
      });
    });

    it('ディメンションを含むサマリーを生成できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.CRITICAL, title: 'Critical issue' }
      ]);

      // Act
      const summary = generator.generateSummary(analysisResult);

      // Assert
      expect(summary.dimensions).toHaveLength(2); // テスト意図実現度とセキュリティリスク
      expect(summary.dimensions[0].name).toBe('テスト意図実現度');
      expect(summary.dimensions[1].name).toBe('セキュリティリスク');
    });

    it('統計情報を正しく集計できる', () => {
      // Arrange
      const issues = [
        { riskLevel: RiskLevel.CRITICAL, title: 'Issue 1' },
        { riskLevel: RiskLevel.CRITICAL, title: 'Issue 2' },
        { riskLevel: RiskLevel.HIGH, title: 'Issue 3' },
        { riskLevel: RiskLevel.MEDIUM, title: 'Issue 4' },
        { riskLevel: RiskLevel.LOW, title: 'Issue 5' }
      ];
      const analysisResult = createMockAnalysisResult(issues);

      // Act
      const summary = generator.generateSummary(analysisResult);

      // Assert
      expect(summary.statistics.totalFiles).toBe(10);
      expect(summary.statistics.totalTests).toBe(50);
      expect(summary.statistics.riskCounts[RiskLevel.CRITICAL]).toBe(2);
      expect(summary.statistics.riskCounts[RiskLevel.HIGH]).toBe(1);
      expect(summary.statistics.riskCounts[RiskLevel.MEDIUM]).toBe(1);
      expect(summary.statistics.riskCounts[RiskLevel.LOW]).toBe(1);
      expect(summary.statistics.riskCounts[RiskLevel.MINIMAL]).toBe(0);
    });

    it('重み付き平均で総合スコアを計算できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.MEDIUM, title: 'Test issue' }
      ]);
      
      // カスタム重みを設定（テスト意図: 0.7, セキュリティ: 0.3）
      const config = { weights: { testIntent: 0.7, security: 0.3 } };
      generator.setConfig(config);

      // Act
      const summary = generator.generateSummary(analysisResult);

      // Assert
      // ディメンションの重み付き平均が総合スコアになることを確認
      const expectedScore = Math.round(
        summary.dimensions[0].score * 0.7 +
        summary.dimensions[1].score * 0.3
      );
      expect(summary.overallScore).toBe(expectedScore);
    });

    it('既存のサマリーをマージできる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult([]);
      const existingSummary: ExecutiveSummary = {
        overallScore: 80,
        overallGrade: 'B',
        dimensions: [],
        statistics: {
          totalFiles: 5,
          totalTests: 25,
          riskCounts: {
            [RiskLevel.CRITICAL]: 1,
            [RiskLevel.HIGH]: 2,
            [RiskLevel.MEDIUM]: 3,
            [RiskLevel.LOW]: 4,
            [RiskLevel.MINIMAL]: 5
          }
        }
      };

      // Act
      const newSummary = generator.mergeSummary(analysisResult, existingSummary);

      // Assert
      expect(newSummary.statistics.totalFiles).toBe(15); // 10 + 5
      expect(newSummary.statistics.totalTests).toBe(75); // 50 + 25
      expect(newSummary.dimensions).toHaveLength(2);
    });

    it('空の分析結果でも正しく処理できる', () => {
      // Arrange
      const analysisResult = createMockAnalysisResult([]);

      // Act
      const summary = generator.generateSummary(analysisResult);

      // Assert
      expect(summary.overallScore).toBe(100); // リスクがない場合は満点
      expect(summary.overallGrade).toBe('A');
      expect(summary.dimensions).toHaveLength(2);
      expect(summary.statistics.riskCounts[RiskLevel.CRITICAL]).toBe(0);
    });
  });

  describe('calculateOverallScore', () => {
    it('ディメンションから総合スコアを計算できる', () => {
      // Arrange
      const dimensions: ReportDimension[] = [
        {
          name: 'テスト意図実現度',
          score: 80,
          weight: 0.6,
          impact: 48,
          breakdown: []
        },
        {
          name: 'セキュリティリスク',
          score: 90,
          weight: 0.4,
          impact: 36,
          breakdown: []
        }
      ];

      // Act
      const overallScore = generator.calculateOverallScore(dimensions);

      // Assert
      expect(overallScore).toBe(84); // 80 * 0.6 + 90 * 0.4 = 84
    });
  });

  describe('determineGrade', () => {
    it('スコアから適切なグレードを判定できる', () => {
      // Arrange & Act & Assert
      expect(generator.determineGrade(95)).toBe('A');
      expect(generator.determineGrade(90)).toBe('A');
      expect(generator.determineGrade(89)).toBe('B');
      expect(generator.determineGrade(80)).toBe('B');
      expect(generator.determineGrade(79)).toBe('C');
      expect(generator.determineGrade(70)).toBe('C');
      expect(generator.determineGrade(69)).toBe('D');
      expect(generator.determineGrade(60)).toBe('D');
      expect(generator.determineGrade(59)).toBe('F');
      expect(generator.determineGrade(0)).toBe('F');
    });
  });
});

// ヘルパー関数
function createMockAnalysisResult(
  issues: Array<{ riskLevel: RiskLevel; title: string }>
): UnifiedAnalysisResult {
  const detailedIssues: DetailedIssue[] = issues.map((issue, index) => ({
    filePath: `/test/file${index}.ts`,
    startLine: index * 10,
    endLine: index * 10 + 5,
    riskLevel: issue.riskLevel,
    title: issue.title,
    description: `Description for ${issue.title}`,
    contextSnippet: 'test code snippet'
  }));

  const riskCounts = Object.values(RiskLevel).reduce((counts, level) => {
    counts[level] = issues.filter(i => i.riskLevel === level).length;
    return counts;
  }, {} as Record<RiskLevel, number>);

  return {
    schemaVersion: '1.0' as const,
    summary: {
      overallScore: 75,
      overallGrade: 'C',
      dimensions: [],
      statistics: {
        totalFiles: 10,
        totalTests: 50,
        riskCounts
      }
    },
    detailedIssues,
    aiKeyRisks: []
  };
}

function createMockAnalysisResultWithScore(targetScore: number): UnifiedAnalysisResult {
  // 重み付き平均を考慮して、正確なスコアを生成
  // 総合スコア = テスト意図実現度 * 0.5 + セキュリティリスク * 0.5
  // テスト関連のissueのみを生成（セキュリティは100点固定）
  // targetScore = testScore * 0.5 + 100 * 0.5
  // testScore = (targetScore - 50) * 2
  
  const testScore = (targetScore - 50) * 2;
  const deduction = 100 - testScore;
  const issues = [];
  
  if (deduction <= 0) {
    // 減点なし（スコア100）
    return createMockAnalysisResult([]);
  }
  
  // 減点値に基づいて適切なリスクレベルと数を生成
  let remainingDeduction = deduction;
  
  // CRITICAL: -30点
  while (remainingDeduction >= 30) {
    issues.push({ riskLevel: RiskLevel.CRITICAL, title: `Test Critical ${issues.length + 1}` });
    remainingDeduction -= 30;
  }
  
  // HIGH: -20点
  if (remainingDeduction >= 20) {
    issues.push({ riskLevel: RiskLevel.HIGH, title: `Test High ${issues.length + 1}` });
    remainingDeduction -= 20;
  }
  
  // MEDIUM: -15点
  if (remainingDeduction >= 15) {
    issues.push({ riskLevel: RiskLevel.MEDIUM, title: `Test Medium ${issues.length + 1}` });
    remainingDeduction -= 15;
  }
  
  // LOW: -5点
  if (remainingDeduction >= 5) {
    const lowCount = Math.floor(remainingDeduction / 5);
    for (let i = 0; i < lowCount; i++) {
      issues.push({ riskLevel: RiskLevel.LOW, title: `Test Low ${issues.length + 1}` });
    }
  }

  return createMockAnalysisResult(issues);
}