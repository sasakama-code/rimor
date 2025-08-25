/**
 * TestQualityIntegrator
 * 
 * カバレッジデータとテスト存在チェックを統合した
 * 高精度なテスト品質評価システム
 * 
 * Issue #81: カバレッジ統合によるテスト品質評価の改善
 * 
 * 特徴:
 * - 業界標準閾値（80% line, 70% branch）の適用
 * - 3段階評価システム（基礎点30% + カバレッジ点50% + 品質点20%）
 * - A-D グレーディングシステム
 * - Defensive Programming適用
 * 
 * 設計原則:
 * - SOLID原則準拠
 * - DRY原則適用
 * - KISS原則適用
 * - YAGNI原則適用
 */

import { CoverageSummary, CoverageThresholds } from './CoverageAnalyzer';
import { TestQualityEvaluator, QualityGrade } from './TestQualityEvaluator';
import { QualityScore } from '../../core/types';
import { TestFile, ProjectContext } from '../../core/types';

export interface IntegratedQualityMetrics {
  baseScore: number;        // 基礎点（テスト存在など）
  coverageScore: number;    // カバレッジ点
  qualityScore: number;     // テスト品質点
  penalty: number;          // ペナルティ
  finalScore: number;       // 最終スコア
}

/**
 * TestQualityIntegrator
 * 
 * カバレッジとテスト品質を統合評価するクラス
 * t_wadaのTDD手法に基づいて設計・実装
 */
export class TestQualityIntegrator {
  private readonly qualityEvaluator: TestQualityEvaluator;
  
  // 業界標準閾値
  private readonly industryThresholds: CoverageThresholds = {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 70
  };

  // 重み付け設定
  private readonly weights = {
    base: 0.3,      // 基礎点30%
    coverage: 0.5,  // カバレッジ50%
    quality: 0.2    // 品質20%
  };

  constructor() {
    this.qualityEvaluator = new TestQualityEvaluator();
  }

  /**
   * 統合品質評価
   * 
   * @param testFile テストファイル
   * @param coverage カバレッジデータ
   * @param context プロジェクトコンテキスト
   * @returns 統合品質スコア
   */
  evaluateIntegratedQuality(
    testFile: TestFile,
    coverage: CoverageSummary | null,
    context: ProjectContext | null
  ): QualityScore {
    try {
      const metrics = this.calculateIntegratedMetrics(testFile, coverage, context);
      return this.createQualityScore(metrics, coverage);
    } catch (error) {
      return this.createErrorQualityScore(error);
    }
  }

  /**
   * 統合メトリクス計算
   */
  private calculateIntegratedMetrics(
    testFile: TestFile,
    coverage: CoverageSummary | null,
    context: ProjectContext | null
  ): IntegratedQualityMetrics {
    // 基礎点の計算（テスト存在チェック）
    const baseScore = this.calculateBaseScore(testFile);
    
    // カバレッジ点の計算
    const coverageScore = this.calculateCoverageScore(coverage);
    
    // 品質点の計算
    const qualityScore = this.calculateQualityScore(testFile, coverage);
    
    // ペナルティの計算
    const penalty = this.calculatePenalty(coverage);
    
    // 最終スコア計算（重み付け平均）
    const weightedScore = 
      (baseScore * this.weights.base) +
      (coverageScore * this.weights.coverage) +
      (qualityScore * this.weights.quality);
    
    const finalScore = Math.max(0, Math.min(100, weightedScore - penalty));

    return {
      baseScore,
      coverageScore,
      qualityScore,
      penalty,
      finalScore
    };
  }

  /**
   * 基礎点計算（テストの存在と内容）
   */
  private calculateBaseScore(testFile: TestFile): number {
    if (!testFile.content || testFile.content.trim().length === 0) {
      return 0; // テストファイルが存在しない
    }

    if (!this.containsActualTests(testFile.content)) {
      return 15; // ファイルは存在するがテストが含まれていない
    }

    return 30; // テストが存在する（基礎点満点の30点）
  }

  /**
   * カバレッジ点計算（業界標準を考慮）
   */
  private calculateCoverageScore(coverage: CoverageSummary | null): number {
    if (!coverage) {
      return 0; // カバレッジデータが取得できない
    }

    // 各メトリクスの重み付きスコア計算
    const lineScore = this.calculateMetricScore(coverage.lines.pct, this.industryThresholds.lines);
    const statementScore = this.calculateMetricScore(coverage.statements.pct, this.industryThresholds.statements);
    const functionScore = this.calculateMetricScore(coverage.functions.pct, this.industryThresholds.functions);
    const branchScore = this.calculateMetricScore(coverage.branches.pct, this.industryThresholds.branches);

    // TestQualityEvaluatorの重み付けを使用
    const weights = {
      lines: 0.3,
      statements: 0.25,
      functions: 0.25,
      branches: 0.2
    };

    const weightedAverage = 
      lineScore * weights.lines +
      statementScore * weights.statements +
      functionScore * weights.functions +
      branchScore * weights.branches;

    return weightedAverage; // 100点満点で返す
  }

  /**
   * 品質点計算（テストの構造と内容）
   */
  private calculateQualityScore(testFile: TestFile, coverage: CoverageSummary | null): number {
    if (!testFile.content) {
      return 0;
    }

    let score = 0;

    // アサーションの存在チェック
    if (this.containsAssertions(testFile.content)) {
      score += 8; // アサーション存在で8点
    }

    // テストケースの多様性チェック
    const testCaseCount = this.countTestCases(testFile.content);
    if (testCaseCount >= 3) {
      score += 6; // 複数テストケースで6点
    } else if (testCaseCount >= 2) {
      score += 4;
    } else if (testCaseCount >= 1) {
      score += 2;
    }

    // エラーハンドリングテストの存在
    if (this.containsErrorHandlingTests(testFile.content)) {
      score += 4; // エラーハンドリングで4点
    }

    // 説明の充実度
    if (this.hasGoodDescriptions(testFile.content)) {
      score += 2; // 説明の充実で2点
    }

    return Math.min(20, score); // 20点満点
  }

  /**
   * ペナルティ計算（業界基準を大幅に下回る場合）
   */
  private calculatePenalty(coverage: CoverageSummary | null): number {
    if (!coverage) {
      return 10; // カバレッジデータがない場合のペナルティ
    }

    let penalty = 0;

    // 極めて低いカバレッジに対する重いペナルティ
    const minCoverage = Math.min(
      coverage.lines.pct,
      coverage.statements.pct,
      coverage.functions.pct,
      coverage.branches.pct
    );

    if (minCoverage < 30) {
      penalty += 15; // 極めて低いカバレッジ
    } else if (minCoverage < 50) {
      penalty += 10; // 低いカバレッジ
    }

    // 分岐カバレッジが特に低い場合の追加ペナルティ
    if (coverage.branches.pct < 40) {
      penalty += 5; // 分岐カバレッジが極めて低い
    }

    return penalty;
  }

  /**
   * 単一メトリクスのスコア計算
   */
  private calculateMetricScore(actualPct: number, threshold: number): number {
    if (actualPct >= threshold) {
      // 基準値以上の場合は70-100点の範囲
      return 70 + (actualPct - threshold) / (100 - threshold) * 30;
    } else {
      // 基準値未満の場合は0-70点の範囲
      const baseScore = (actualPct / threshold) * 70;
      
      // 60%以下の場合はさらにペナルティ
      if (actualPct <= 60) {
        return baseScore * 0.75; // 25%減点
      }
      
      return baseScore;
    }
  }

  /**
   * グレード計算（A-D評価）
   */
  calculateGrade(score: number): QualityGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  /**
   * QualityScoreオブジェクトの作成
   */
  private createQualityScore(metrics: IntegratedQualityMetrics, coverage: CoverageSummary | null): QualityScore {
    const confidence = this.calculateConfidence(coverage);
    
    return {
      overall: Math.round(metrics.finalScore * 100) / 100,
      dimensions: {
        completeness: Math.round(metrics.baseScore + metrics.coverageScore * 0.6),
        correctness: Math.round(metrics.coverageScore + metrics.qualityScore * 0.5),
        maintainability: Math.round(metrics.qualityScore * 4 + 20) // 20-100の範囲
      },
      confidence: Math.max(0.1, confidence)
    };
  }

  /**
   * エラー時のQualityScore作成
   */
  private createErrorQualityScore(error: unknown): QualityScore {
    return {
      overall: 0,
      dimensions: {
        completeness: 0,
        correctness: 0,
        maintainability: 0
      },
      confidence: 0.1
    };
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(coverage: CoverageSummary | null): number {
    if (!coverage) return 0.3;

    // 最低カバレッジに基づく信頼度
    const minCoverage = Math.min(
      coverage.lines.pct,
      coverage.statements.pct,
      coverage.functions.pct,
      coverage.branches.pct
    );

    return Math.min(1.0, minCoverage / 70 + 0.2); // 70%で信頼度1.0
  }

  // ヘルパーメソッド群

  private containsActualTests(content: string): boolean {
    const testPatterns = [
      /describe\s*\(/,
      /test\s*\(/,
      /it\s*\(/,
      /expect\s*\(/,
      /assert\./,
      /should\./
    ];

    const cleanedContent = this.removeCommentsAndStrings(content);
    return testPatterns.some(pattern => pattern.test(cleanedContent));
  }

  private containsAssertions(content: string): boolean {
    const assertionPatterns = [
      /expect\s*\(/,
      /assert\./,
      /should\./,
      /toEqual/,
      /toBe/,
      /toThrow/
    ];

    return assertionPatterns.some(pattern => pattern.test(content));
  }

  private countTestCases(content: string): number {
    const testCasePatterns = [
      /it\s*\(/g,
      /test\s*\(/g
    ];

    let count = 0;
    testCasePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        count += matches.length;
      }
    });

    return count;
  }

  private containsErrorHandlingTests(content: string): boolean {
    const errorPatterns = [
      /toThrow/,
      /catch/,
      /error/i,
      /exception/i,
      /fail/i
    ];

    return errorPatterns.some(pattern => pattern.test(content));
  }

  private hasGoodDescriptions(content: string): boolean {
    const descriptionPatterns = [
      /describe\s*\(\s*["'`][^"'`]{10,}/,
      /it\s*\(\s*["'`][^"'`]{10,}/
    ];

    return descriptionPatterns.some(pattern => pattern.test(content));
  }

  private removeCommentsAndStrings(content: string): string {
    // 簡易的なコメントと文字列の除去
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // ブロックコメント
      .replace(/\/\/.*$/gm, '') // 行コメント
      .replace(/["'`].*?["'`]/g, ''); // 文字列
  }
}