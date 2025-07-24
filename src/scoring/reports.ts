/**
 * レポート生成システム - v0.4.0 Quality Score Calculator
 * 
 * 品質スコアからサマリー、詳細、トレンド分析レポートを生成
 */

import { 
  ProjectScore, 
  FileScore, 
  DirectoryScore, 
  DimensionScore,
  GradeType 
} from './types';

/**
 * サマリーレポート形式
 */
export interface SummaryReport {
  projectInfo: {
    path: string;
    overallScore: number;
    grade: GradeType;
    totalFiles: number;
    totalDirectories: number;
    generatedAt: Date;
    executionTime: number;
  };
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  topIssues: {
    dimension: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedFiles: number;
  }[];
  recommendations: string[];
  metadata: {
    pluginCount: number;
    issueCount: number;
    averageFileScore: number;
    worstPerformingDimension: string;
    bestPerformingDimension: string;
  };
}

/**
 * 詳細レポート形式
 */
export interface DetailedReport {
  summary: SummaryReport;
  fileDetails: {
    filePath: string;
    score: number;
    grade: GradeType;
    dimensions: {
      name: string;
      score: number;
      weight: number;
      issues: string[];
    }[];
    issues: {
      dimension: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
      line?: number;
    }[];
    suggestions: string[];
  }[];
  directoryDetails: {
    directoryPath: string;
    score: number;
    grade: GradeType;
    fileCount: number;
    dimensionBreakdown: Record<string, number>;
    worstFile: string;
    bestFile: string;
  }[];
}

/**
 * トレンド分析レポート形式
 */
export interface TrendReport {
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvementRate: number; // パーセンテージ
  historicalData: {
    date: Date;
    score: number;
    grade: GradeType;
  }[];
  predictions: {
    nextWeekScore: number;
    nextMonthScore: number;
    confidence: number;
  };
  dimensionTrends: {
    dimension: string;
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
  }[];
  recommendations: string[];
}

/**
 * 履歴データ形式
 */
export interface HistoricalScore {
  date: Date;
  score: number;
  grade: GradeType;
}

/**
 * レポート生成エンジン
 */
export class ReportGenerator {
  /**
   * サマリーレポートを生成
   */
  generateSummaryReport(projectScore: ProjectScore): SummaryReport {
    const dimensionScores = this.calculateDimensionAverages(projectScore.fileScores);
    const gradeDistribution = this.calculateGradeDistribution(projectScore.fileScores);
    const topIssues = this.identifyTopIssues(projectScore.fileScores);
    const recommendations = this.generateRecommendations(projectScore);
    const metadata = this.generateMetadata(projectScore, dimensionScores);

    return {
      projectInfo: {
        path: projectScore.projectPath,
        overallScore: projectScore.overallScore,
        grade: projectScore.grade,
        totalFiles: projectScore.totalFiles,
        totalDirectories: projectScore.totalDirectories,
        generatedAt: projectScore.metadata.generatedAt,
        executionTime: projectScore.metadata.executionTime
      },
      dimensionScores,
      gradeDistribution,
      topIssues,
      recommendations,
      metadata
    };
  }

  /**
   * 詳細レポートを生成
   */
  generateDetailedReport(projectScore: ProjectScore): DetailedReport {
    const summary = this.generateSummaryReport(projectScore);
    
    const fileDetails = projectScore.fileScores.map(fileScore => ({
      filePath: fileScore.filePath,
      score: fileScore.overallScore,
      grade: fileScore.grade,
      dimensions: this.formatDimensionDetails(fileScore.dimensions),
      issues: this.extractFileIssues(fileScore),
      suggestions: this.generateFileSuggestions(fileScore)
    }));

    const directoryDetails = projectScore.directoryScores.map(dirScore => ({
      directoryPath: dirScore.directoryPath,
      score: dirScore.overallScore,
      grade: dirScore.grade,
      fileCount: dirScore.fileCount,
      dimensionBreakdown: dirScore.dimensionScores,
      worstFile: this.findWorstFile(dirScore.fileScores),
      bestFile: this.findBestFile(dirScore.fileScores)
    }));

    return {
      summary,
      fileDetails,
      directoryDetails
    };
  }

  /**
   * トレンド分析レポートを生成
   */
  generateTrendReport(
    currentScore: ProjectScore, 
    historicalScores: HistoricalScore[]
  ): TrendReport {
    // 履歴から最新スコア（現在より1つ前）を取得
    const previousScore = historicalScores.length > 1 ? 
      historicalScores[historicalScores.length - 2].score : 
      (historicalScores.length > 0 ? historicalScores[0].score : currentScore.overallScore);

    const trend = this.analyzeTrend(currentScore.overallScore, historicalScores);
    const improvementRate = this.calculateImprovementRate(currentScore.overallScore, previousScore);
    const predictions = this.generatePredictions(historicalScores, currentScore.overallScore);
    const dimensionTrends = this.analyzeDimensionTrends(currentScore, historicalScores);
    const recommendations = this.generateTrendRecommendations(trend, improvementRate, dimensionTrends);

    return {
      currentScore: currentScore.overallScore,
      previousScore,
      trend,
      improvementRate,
      historicalData: historicalScores,
      predictions,
      dimensionTrends,
      recommendations
    };
  }

  /**
   * ディメンション別平均スコアを計算
   */
  private calculateDimensionAverages(fileScores: FileScore[]): SummaryReport['dimensionScores'] {
    if (fileScores.length === 0) {
      return {
        completeness: 0,
        correctness: 0,
        maintainability: 0,
        performance: 0,
        security: 0
      };
    }

    const totals = fileScores.reduce((acc, file) => {
      acc.completeness += file.dimensions.completeness.score;
      acc.correctness += file.dimensions.correctness.score;
      acc.maintainability += file.dimensions.maintainability.score;
      acc.performance += file.dimensions.performance.score;
      acc.security += file.dimensions.security.score;
      return acc;
    }, {
      completeness: 0,
      correctness: 0,
      maintainability: 0,
      performance: 0,
      security: 0
    });

    const count = fileScores.length;
    return {
      completeness: Math.round(totals.completeness / count),
      correctness: Math.round(totals.correctness / count),
      maintainability: Math.round(totals.maintainability / count),
      performance: Math.round(totals.performance / count),
      security: Math.round(totals.security / count)
    };
  }

  /**
   * グレード分布を計算
   */
  private calculateGradeDistribution(fileScores: FileScore[]): SummaryReport['gradeDistribution'] {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    fileScores.forEach(file => {
      distribution[file.grade]++;
    });

    return distribution;
  }

  /**
   * 主要課題を特定
   */
  private identifyTopIssues(fileScores: FileScore[]): SummaryReport['topIssues'] {
    const issueMap = new Map<string, { count: number; severity: 'high' | 'medium' | 'low' }>();

    fileScores.forEach(file => {
      Object.entries(file.dimensions).forEach(([dimensionName, dimension]) => {
        dimension.issues.forEach(issue => {
          const key = `${dimensionName}:${issue.message}`;
          const existing = issueMap.get(key);
          const severity = this.determineSeverity(issue.severity, dimension.score);
          
          if (existing) {
            existing.count++;
          } else {
            issueMap.set(key, { count: 1, severity });
          }
        });
      });
    });

    return Array.from(issueMap.entries())
      .map(([key, data]) => {
        const [dimension, description] = key.split(':');
        return {
          dimension,
          severity: data.severity,
          description,
          affectedFiles: data.count
        };
      })
      .sort((a, b) => {
        // 重要度でソート: high > medium > low, 影響ファイル数で二次ソート
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        return severityDiff !== 0 ? severityDiff : b.affectedFiles - a.affectedFiles;
      })
      .slice(0, 10); // 上位10件
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(projectScore: ProjectScore): string[] {
    const recommendations: string[] = [];
    const dimensionScores = this.calculateDimensionAverages(projectScore.fileScores);

    // 全体的なスコアに基づく推奨
    if (projectScore.overallScore < 70) {
      recommendations.push('全体的な品質スコアが低いため、テスト戦略の見直しを推奨します');
    }

    // ディメンション別推奨
    Object.entries(dimensionScores).forEach(([dimension, score]) => {
      if (score < 60) {
        switch (dimension) {
          case 'completeness':
            recommendations.push('テストカバレッジの向上を図り、未テストのコードパスを特定して下さい');
            break;
          case 'correctness':
            recommendations.push('アサーションの精度を向上させ、より厳密なテストケースを作成して下さい');
            break;
          case 'maintainability':
            recommendations.push('テストコードのリファクタリングと可読性の改善を検討して下さい');
            break;
          case 'performance':
            recommendations.push('テスト実行時間の最適化とパフォーマンステストの追加を検討して下さい');
            break;
          case 'security':
            recommendations.push('セキュリティテストケースの充実化を図って下さい');
            break;
        }
      }
    });

    // グレード分布に基づく推奨
    const gradeDistribution = this.calculateGradeDistribution(projectScore.fileScores);
    const lowGradeRatio = (gradeDistribution.D + gradeDistribution.F) / projectScore.totalFiles;
    if (lowGradeRatio > 0.3) {
      recommendations.push('30%以上のファイルが低品質です。優先的に改善対象を決めて段階的に取り組んで下さい');
    }

    return recommendations.slice(0, 5); // 最大5件
  }

  /**
   * メタデータを生成
   */
  private generateMetadata(
    projectScore: ProjectScore, 
    dimensionScores: SummaryReport['dimensionScores']
  ): SummaryReport['metadata'] {
    const averageFileScore = projectScore.fileScores.length > 0 ?
      projectScore.fileScores.reduce((sum, file) => sum + file.overallScore, 0) / projectScore.fileScores.length :
      0;

    const dimensionEntries = Object.entries(dimensionScores);
    const worstDimension = dimensionEntries.reduce((worst, current) => 
      current[1] < worst[1] ? current : worst
    );
    const bestDimension = dimensionEntries.reduce((best, current) => 
      current[1] > best[1] ? current : best
    );

    return {
      pluginCount: projectScore.metadata.pluginCount,
      issueCount: projectScore.metadata.issueCount,
      averageFileScore: Math.round(averageFileScore * 100) / 100,
      worstPerformingDimension: worstDimension[0],
      bestPerformingDimension: bestDimension[0]
    };
  }

  /**
   * ディメンション詳細をフォーマット
   */
  private formatDimensionDetails(dimensions: Record<string, DimensionScore>) {
    return Object.entries(dimensions).map(([name, dimension]) => ({
      name,
      score: dimension.score,
      weight: dimension.weight,
      issues: dimension.issues.map(issue => issue.message)
    }));
  }

  /**
   * ファイルの課題を抽出
   */
  private extractFileIssues(fileScore: FileScore) {
    const issues: { dimension: string; severity: 'high' | 'medium' | 'low'; message: string; line?: number }[] = [];

    Object.entries(fileScore.dimensions).forEach(([dimensionName, dimension]) => {
      dimension.issues.forEach(issue => {
        issues.push({
          dimension: dimensionName,
          severity: this.determineSeverity(issue.severity, dimension.score),
          message: issue.message,
          line: issue.line
        });
      });
    });

    return issues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * ファイル別提案を生成
   */
  private generateFileSuggestions(fileScore: FileScore): string[] {
    const suggestions: string[] = [];
    
    Object.entries(fileScore.dimensions).forEach(([dimensionName, dimension]) => {
      if (dimension.score < 60) {
        switch (dimensionName) {
          case 'completeness':
            suggestions.push('このファイルの完全性を向上させるため、テストカバレッジの向上を推奨します');
            break;
          case 'correctness':
            suggestions.push('正確性を向上させるため、アサーションをより具体的かつ網羅的にして下さい');
            break;
          case 'maintainability':
            suggestions.push('テストコードの構造を整理し、重複を削減して下さい');
            break;
          case 'performance':
            suggestions.push('テスト実行時間を最適化して下さい');
            break;
          case 'security':
            suggestions.push('セキュリティ関連のテストケースを追加して下さい');
            break;
        }
      }
    });

    if (fileScore.overallScore < 50) {
      suggestions.push('このファイルは全面的な見直しが必要です');
    }

    return suggestions;
  }

  /**
   * 最悪ファイルを特定
   */
  private findWorstFile(fileScores: FileScore[]): string {
    if (fileScores.length === 0) return '';
    return fileScores.reduce((worst, current) => 
      current.overallScore < worst.overallScore ? current : worst
    ).filePath;
  }

  /**
   * 最良ファイルを特定
   */
  private findBestFile(fileScores: FileScore[]): string {
    if (fileScores.length === 0) return '';
    return fileScores.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    ).filePath;
  }

  /**
   * トレンドを分析
   */
  private analyzeTrend(currentScore: number, historicalScores: HistoricalScore[]): 'improving' | 'declining' | 'stable' {
    if (historicalScores.length < 2) return 'stable';

    const recentScores = historicalScores.slice(-3).map(h => h.score);
    recentScores.push(currentScore);

    let improvingCount = 0;
    let decliningCount = 0;

    for (let i = 1; i < recentScores.length; i++) {
      const change = recentScores[i] - recentScores[i - 1];
      if (change > 2) improvingCount++;
      else if (change < -2) decliningCount++;
    }

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  /**
   * 改善率を計算
   */
  private calculateImprovementRate(currentScore: number, previousScore: number): number {
    if (previousScore === 0) return 0;
    return ((currentScore - previousScore) / previousScore) * 100;
  }

  /**
   * 予測を生成
   */
  private generatePredictions(historicalScores: HistoricalScore[], currentScore: number) {
    // 簡単な線形予測（実際のプロダクションでは機械学習モデルを使用）
    if (historicalScores.length < 3) {
      return {
        nextWeekScore: currentScore,
        nextMonthScore: currentScore,
        confidence: 0.5
      };
    }

    const recentScores = historicalScores.slice(-5).map(h => h.score);
    recentScores.push(currentScore);
    
    const trend = recentScores.slice(1).reduce((sum, score, i) => 
      sum + (score - recentScores[i]), 0) / (recentScores.length - 1);

    return {
      nextWeekScore: Math.max(0, Math.min(100, currentScore + trend)),
      nextMonthScore: Math.max(0, Math.min(100, currentScore + trend * 4)),
      confidence: Math.min(0.8, 0.5 + (recentScores.length * 0.05))
    };
  }

  /**
   * ディメンション別トレンドを分析
   */
  private analyzeDimensionTrends(currentScore: ProjectScore, historicalScores: HistoricalScore[]) {
    // 簡略化された実装（実際は各ディメンションの履歴データが必要）
    const currentDimensions = this.calculateDimensionAverages(currentScore.fileScores);
    
    return Object.entries(currentDimensions).map(([dimension, score]) => ({
      dimension,
      trend: 'stable' as const, // 実装簡略化
      changeRate: 0
    }));
  }

  /**
   * トレンドベース推奨事項を生成
   */
  private generateTrendRecommendations(
    trend: 'improving' | 'declining' | 'stable',
    improvementRate: number,
    dimensionTrends: { dimension: string; trend: string; changeRate: number }[]
  ): string[] {
    const recommendations: string[] = [];

    switch (trend) {
      case 'improving':
        recommendations.push('品質スコアが向上しています。この傾向を維持して下さい');
        if (improvementRate > 10) {
          recommendations.push('急速な改善が見られます。変更内容を他のプロジェクトにも適用することを検討して下さい');
        }
        break;
      case 'declining':
        recommendations.push('品質スコアが低下しています。原因を特定し対策を講じて下さい');
        recommendations.push('最近の変更内容をレビューし、品質劣化の要因を調査して下さい');
        break;
      case 'stable':
        recommendations.push('品質スコアは安定しています。さらなる改善の機会を探して下さい');
        break;
    }

    // 劣化トレンドの場合の追加推奨
    if (trend === 'declining') {
      recommendations.push('品質の劣化が検出されました。優先的に対処することを推奨します');
    }

    return recommendations;
  }

  /**
   * 問題の重要度を判定
   */
  private determineSeverity(originalSeverity: string, dimensionScore: number): 'high' | 'medium' | 'low' {
    if (dimensionScore < 40) return 'high';
    if (dimensionScore < 70) return 'medium';
    return 'low';
  }
}