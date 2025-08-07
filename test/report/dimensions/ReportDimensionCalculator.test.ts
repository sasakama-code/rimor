/**
 * ReportDimensionCalculator テスト
 * v0.9.0 - Phase 5-1: 評価ディメンション計算のテスト
 * TDD Red Phase - 失敗するテストを最初に書く
 */

import { ReportDimensionCalculator } from '../../../src/report/dimensions/ReportDimensionCalculator';
import { 
  UnifiedAnalysisResult,
  RiskLevel,
  ExecutiveSummary,
  ReportDimension,
  ScoreBreakdown,
  DetailedIssue
} from '../../../src/nist/types/unified-analysis-result';

describe('ReportDimensionCalculator', () => {
  let calculator: ReportDimensionCalculator;

  beforeEach(() => {
    calculator = new ReportDimensionCalculator();
  });

  describe('calculateDimensions', () => {
    it('テスト意図実現度ディメンションを計算できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.CRITICAL, title: 'Missing test coverage' },
        { riskLevel: RiskLevel.HIGH, title: 'Incomplete assertion' },
        { riskLevel: RiskLevel.MEDIUM, title: 'Unclear test intent' }
      ]);

      // Act
      const dimensions = calculator.calculateDimensions(analysisResult);

      // Assert
      const testIntentDimension = dimensions.find(d => d.name === 'テスト意図実現度');
      expect(testIntentDimension).toBeDefined();
      expect(testIntentDimension!.score).toBeLessThan(100);
      expect(testIntentDimension!.weight).toBeGreaterThan(0);
      expect(testIntentDimension!.breakdown).toHaveLength(3);
    });

    it('セキュリティリスクディメンションを計算できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.CRITICAL, title: 'SQL Injection vulnerability' },
        { riskLevel: RiskLevel.HIGH, title: 'XSS vulnerability' }
      ]);

      // Act
      const dimensions = calculator.calculateDimensions(analysisResult);

      // Assert
      const securityDimension = dimensions.find(d => d.name === 'セキュリティリスク');
      expect(securityDimension).toBeDefined();
      expect(securityDimension!.score).toBeLessThan(50); // 重大なリスクがあるため低スコア
      expect(securityDimension!.breakdown).toContainEqual(
        expect.objectContaining({
          label: 'クリティカルリスク',
          deduction: expect.any(Number)
        })
      );
    });

    it('スコアの内訳（ScoreBreakdown）を正しく生成できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.CRITICAL, title: 'Issue 1' },
        { riskLevel: RiskLevel.CRITICAL, title: 'Issue 2' },
        { riskLevel: RiskLevel.HIGH, title: 'Issue 3' }
      ]);

      // Act
      const dimensions = calculator.calculateDimensions(analysisResult);
      const testIntentDimension = dimensions.find(d => d.name === 'テスト意図実現度');

      // Assert
      expect(testIntentDimension!.breakdown).toContainEqual(
        expect.objectContaining({
          label: 'CRITICALレベルのリスク',
          calculation: '-30点 x 2件',
          deduction: -60
        })
      );
      expect(testIntentDimension!.breakdown).toContainEqual(
        expect.objectContaining({
          label: 'HIGHレベルのリスク',
          calculation: '-20点 x 1件',
          deduction: -20
        })
      );
    });

    it('重み付けを正しく設定できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([]);
      const config = {
        weights: {
          testIntent: 0.6,
          security: 0.4
        }
      };

      // Act
      calculator.setConfig(config);
      const dimensions = calculator.calculateDimensions(analysisResult);

      // Assert
      const testIntentDimension = dimensions.find(d => d.name === 'テスト意図実現度');
      const securityDimension = dimensions.find(d => d.name === 'セキュリティリスク');
      
      expect(testIntentDimension!.weight).toBe(0.6);
      expect(securityDimension!.weight).toBe(0.4);
    });

    it('総合スコアへの影響度（impact）を正しく計算できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.MEDIUM, title: 'Medium risk' }
      ]);

      // Act
      const dimensions = calculator.calculateDimensions(analysisResult);
      const testIntentDimension = dimensions.find(d => d.name === 'テスト意図実現度');

      // Assert
      // score: 85（MEDIUMリスク1件で-15点）, weight: 0.5（デフォルト）
      expect(testIntentDimension!.score).toBe(85);
      expect(testIntentDimension!.weight).toBe(0.5);
      expect(testIntentDimension!.impact).toBe(42.5); // 85 * 0.5
    });

    it('リスクレベルごとの減点を正しく適用できる', () => {
      // Arrange
      const testCases = [
        { level: RiskLevel.CRITICAL, expectedDeduction: -30 },
        { level: RiskLevel.HIGH, expectedDeduction: -20 },
        { level: RiskLevel.MEDIUM, expectedDeduction: -15 },
        { level: RiskLevel.LOW, expectedDeduction: -5 },
        { level: RiskLevel.MINIMAL, expectedDeduction: 0 }
      ];

      testCases.forEach(({ level, expectedDeduction }) => {
        // Arrange
        const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
          { riskLevel: level, title: `${level} issue` }
        ]);

        // Act
        const dimensions = calculator.calculateDimensions(analysisResult);
        const dimension = dimensions[0];

        // Assert
        const expectedScore = 100 + expectedDeduction;
        expect(dimension.score).toBe(expectedScore);
      });
    });

    it('空の分析結果でも正しく処理できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([]);

      // Act
      const dimensions = calculator.calculateDimensions(analysisResult);

      // Assert
      expect(dimensions).toHaveLength(2); // テスト意図実現度とセキュリティリスク
      dimensions.forEach(dimension => {
        expect(dimension.score).toBe(100); // リスクがない場合は満点
        expect(dimension.breakdown).toHaveLength(0);
      });
    });
  });

  describe('applyCustomWeights', () => {
    it('カスタム重みを適用して再計算できる', () => {
      // Arrange
      const analysisResult: UnifiedAnalysisResult = createMockAnalysisResult([
        { riskLevel: RiskLevel.HIGH, title: 'High risk' }
      ]);
      
      const initialDimensions = calculator.calculateDimensions(analysisResult);
      const customWeights = { 'テスト意図実現度': 0.7, 'セキュリティリスク': 0.3 };

      // Act
      const updatedDimensions = calculator.applyCustomWeights(initialDimensions, customWeights);

      // Assert
      const testIntentDimension = updatedDimensions.find(d => d.name === 'テスト意図実現度');
      const securityDimension = updatedDimensions.find(d => d.name === 'セキュリティリスク');
      
      expect(testIntentDimension!.weight).toBe(0.7);
      expect(securityDimension!.weight).toBe(0.3);
      
      // impactも再計算されることを確認
      expect(testIntentDimension!.impact).toBe(testIntentDimension!.score * 0.7);
      expect(securityDimension!.impact).toBe(securityDimension!.score * 0.3);
    });
  });
});

// ヘルパー関数
function createMockAnalysisResult(issues: Array<{ riskLevel: RiskLevel; title: string }>): UnifiedAnalysisResult {
  const detailedIssues: DetailedIssue[] = issues.map((issue, index) => ({
    filePath: `/test/file${index}.ts`,
    startLine: index * 10,
    endLine: index * 10 + 5,
    riskLevel: issue.riskLevel,
    title: issue.title,
    description: `Description for ${issue.title}`,
    contextSnippet: 'test code snippet'
  }));

  const riskCounts = issues.reduce((counts, issue) => {
    counts[issue.riskLevel] = (counts[issue.riskLevel] || 0) + 1;
    return counts;
  }, {} as Record<RiskLevel, number>);

  // すべてのリスクレベルを0で初期化
  Object.values(RiskLevel).forEach(level => {
    if (!riskCounts[level]) {
      riskCounts[level] = 0;
    }
  });

  return {
    schemaVersion: '1.0' as const,
    summary: {
      overallScore: 75,
      overallGrade: 'B',
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