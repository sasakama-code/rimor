import { CoverageSummary, CoverageThresholds } from './CoverageAnalyzer';
import { QualityScore, Improvement, ImprovementType, ImprovementPriority } from '../../core/types';

export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityIssue {
  type: 'coverage' | 'structure' | 'completeness';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affectedMetric?: string;
  currentValue?: number;
  targetValue?: number;
}

/**
 * TestQualityEvaluator
 * 
 * カバレッジデータに基づいてテスト品質を評価し、具体的なスコアと
 * 改善提案を生成するクラス
 * 
 * 責任:
 * - カバレッジ基準による品質スコア計算
 * - グレード評価（A-F）
 * - 品質問題の特定
 * - 改善提案の生成
 */
export class TestQualityEvaluator {
  private readonly defaultThresholds: CoverageThresholds = {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 70
  };

  // 各メトリクスの重み付け（合計100%）
  private readonly weights = {
    lines: 0.3,
    statements: 0.25,
    functions: 0.25,
    branches: 0.2
  };

  /**
   * カバレッジ基準でスコアを計算
   */
  calculateCoverageScore(coverage: CoverageSummary): number {
    return this.calculateWeightedScore(coverage);
  }

  /**
   * 重み付きスコア計算
   */
  calculateWeightedScore(coverage: CoverageSummary): number {
    const lineScore = this.calculateMetricScore(coverage.lines.pct, this.defaultThresholds.lines);
    const statementScore = this.calculateMetricScore(coverage.statements.pct, this.defaultThresholds.statements);
    const functionScore = this.calculateMetricScore(coverage.functions.pct, this.defaultThresholds.functions);
    const branchScore = this.calculateMetricScore(coverage.branches.pct, this.defaultThresholds.branches);

    const weightedScore = 
      lineScore * this.weights.lines +
      statementScore * this.weights.statements +
      functionScore * this.weights.functions +
      branchScore * this.weights.branches;

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * 総合的なテスト品質評価
   */
  evaluateTestQuality(coverage: CoverageSummary): QualityScore {
    const overallScore = this.calculateCoverageScore(coverage);
    
    // 信頼度は最低カバレッジに基づいて計算
    const minCoverage = Math.min(
      coverage.lines.pct,
      coverage.statements.pct,
      coverage.functions.pct,
      coverage.branches.pct
    );
    const confidence = Math.min(1.0, minCoverage / 80); // 80%基準で信頼度計算

    return {
      overall: overallScore,
      dimensions: {
        completeness: this.calculateCompletenessScore(coverage),
        correctness: this.calculateCorrectnessScore(coverage),
        maintainability: this.calculateMaintainabilityScore(coverage)
      },
      confidence: Math.max(0.1, confidence) // 最低0.1の信頼度を保証
    };
  }

  /**
   * 品質グレードの生成
   */
  generateQualityGrade(score: number): QualityGrade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * 品質問題の特定
   */
  identifyQualityIssues(coverage: CoverageSummary): string[] {
    const issues: string[] = [];

    // 行カバレッジの問題
    if (coverage.lines.pct < this.defaultThresholds.lines) {
      issues.push(`行カバレッジが基準値${this.defaultThresholds.lines}%を下回っています (現在: ${coverage.lines.pct}%)`);
    }

    // ステートメントカバレッジの問題
    if (coverage.statements.pct < this.defaultThresholds.statements) {
      issues.push(`ステートメントカバレッジが基準値${this.defaultThresholds.statements}%を下回っています (現在: ${coverage.statements.pct}%)`);
    }

    // 関数カバレッジの問題
    if (coverage.functions.pct < this.defaultThresholds.functions) {
      issues.push(`関数カバレッジが基準値${this.defaultThresholds.functions}%を下回っています (現在: ${coverage.functions.pct}%)`);
    }

    // 分岐カバレッジの問題（特に重要）
    if (coverage.branches.pct < this.defaultThresholds.branches) {
      const severity = coverage.branches.pct < 50 ? 'CRITICAL' : 'HIGH';
      issues.push(`[${severity}] 分岐カバレッジが基準値${this.defaultThresholds.branches}%を大幅に下回っています (現在: ${coverage.branches.pct}%)`);
    }

    // 極めて低いカバレッジの警告
    const minCoverage = Math.min(coverage.lines.pct, coverage.statements.pct, coverage.functions.pct, coverage.branches.pct);
    if (minCoverage < 30) {
      issues.push(`[CRITICAL] 一部のメトリクスで極めて低いカバレッジが検出されました (最低: ${minCoverage}%)`);
    }

    return issues;
  }

  /**
   * 改善提案の生成
   */
  generateImprovementSuggestions(coverage: CoverageSummary): Improvement[] {
    const suggestions: Improvement[] = [];

    // 行カバレッジ改善
    if (coverage.lines.pct < this.defaultThresholds.lines) {
      suggestions.push(this.createImprovement(
        'line-coverage',
        this.getSeverityForCoverage(coverage.lines.pct),
        'add-test',
        '行カバレッジの向上',
        `現在${coverage.lines.pct}%の行カバレッジを${this.defaultThresholds.lines}%以上に改善してください。未実行の行をテストでカバーしてください。`,
        { file: 'unknown', line: 1, column: 1 },
        0.8
      ));
    }

    // 分岐カバレッジ改善
    if (coverage.branches.pct < this.defaultThresholds.branches) {
      suggestions.push(this.createImprovement(
        'branch-coverage',
        this.getSeverityForCoverage(coverage.branches.pct),
        'add-test',
        '分岐カバレッジの向上',
        `現在${coverage.branches.pct}%の分岐カバレッジを${this.defaultThresholds.branches}%以上に改善してください。if文、switch文、三項演算子などの全ての分岐をテストしてください。`,
        { file: 'unknown', line: 1, column: 1 },
        0.9
      ));
    }

    // 関数カバレッジ改善
    if (coverage.functions.pct < this.defaultThresholds.functions) {
      suggestions.push(this.createImprovement(
        'function-coverage',
        this.getSeverityForCoverage(coverage.functions.pct),
        'add-test',
        '関数カバレッジの向上',
        `現在${coverage.functions.pct}%の関数カバレッジを${this.defaultThresholds.functions}%以上に改善してください。未テストの関数にテストケースを追加してください。`,
        { file: 'unknown', line: 1, column: 1 },
        0.7
      ));
    }

    return suggestions;
  }

  /**
   * 単一メトリクスのスコア計算
   * issue #80で指摘された問題を修正: より厳しい評価基準を適用
   */
  private calculateMetricScore(actualPct: number, threshold: number): number {
    if (actualPct >= threshold) {
      // 基準値以上の場合、70-100点の範囲でスコア計算
      return 70 + (actualPct - threshold) / (100 - threshold) * 30;
    } else {
      // 基準値未満の場合、0-70点の範囲でスコア計算
      // さらに厳しく評価：60%程度で45-50点となるように調整
      const baseScore = (actualPct / threshold) * 70;
      
      // 60%以下の場合はさらにペナルティを適用
      if (actualPct <= 60) {
        return baseScore * 0.75; // 25%減点
      }
      
      return baseScore;
    }
  }

  /**
   * 完全性スコア計算
   */
  private calculateCompletenessScore(coverage: CoverageSummary): number {
    // 行カバレッジと関数カバレッジを重視
    return (coverage.lines.pct * 0.6 + coverage.functions.pct * 0.4);
  }

  /**
   * 正確性スコア計算
   */
  private calculateCorrectnessScore(coverage: CoverageSummary): number {
    // 分岐カバレッジを重視（条件分岐の網羅性）
    return coverage.branches.pct * 0.8 + coverage.statements.pct * 0.2;
  }

  /**
   * 保守性スコア計算
   */
  private calculateMaintainabilityScore(coverage: CoverageSummary): number {
    // 全体的なバランスを重視
    return (coverage.lines.pct + coverage.statements.pct + coverage.functions.pct + coverage.branches.pct) / 4;
  }

  /**
   * カバレッジに基づく重要度判定
   */
  private getSeverityForCoverage(pct: number): ImprovementPriority {
    if (pct < 30) return 'critical';
    if (pct < 50) return 'high';
    if (pct < 70) return 'medium';
    return 'low';
  }

  /**
   * 改善提案オブジェクトの作成
   */
  private createImprovement(
    id: string,
    priority: ImprovementPriority,
    type: ImprovementType,
    title: string,
    description: string,
    location: { file: string; line: number; column: number },
    impact: number
  ): Improvement {
    return {
      id,
      priority,
      type,
      title,
      description,
      location,
      impact
    };
  }
}