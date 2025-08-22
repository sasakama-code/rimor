/**
 * ベースライン管理システム
 * Phase 3: 継続的改善とベースライン基準の確立
 * 
 * SOLID原則に基づく設計:
 * - Single Responsibility: ベースライン管理に特化
 * - Open/Closed: 新しい比較アルゴリズムや分析方法の追加に開放
 * - Dependency Inversion: 永続化層やファイルシステムへの依存を抽象化
 * 
 * Defensive Programming原則:
 * - 入力検証とセキュリティ対策
 * - 例外安全保証
 * - リソース管理とクリーンアップ
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BenchmarkResult } from './ExternalProjectBenchmarkRunner';

/**
 * ベースライン設定インターフェース
 */
export interface BaselineManagerConfig {
  /** ベースライン保存ディレクトリ */
  baselineDir?: string;
  /** ベースライン保持期間（日数） */
  retentionPeriod?: number;
  /** 圧縮の有効化 */
  compressionEnabled?: boolean;
  /** 自動クリーンアップの有効化 */
  autoCleanup?: boolean;
}

/**
 * ベースラインメタデータ
 */
export interface BaselineMetadata {
  /** ベースライン名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** 作成者 */
  createdBy?: string;
  /** カスタムタイムスタンプ */
  customTimestamp?: string;
  /** タグ */
  tags?: string[];
}

/**
 * ベースラインデータ構造
 */
export interface Baseline {
  /** 一意識別子 */
  id: string;
  /** ベンチマーク結果配列 */
  results: BenchmarkResult[];
  /** 作成日時 */
  createdAt: string;
  /** メタデータ */
  metadata: BaselineMetadata;
  /** 統計情報 */
  statistics: BaselineStatistics;
}

/**
 * ベースライン統計情報
 */
export interface BaselineStatistics {
  /** 平均ファイルあたり実行時間 */
  averageTimePerFile: number;
  /** 5ms/file目標達成率 */
  target5msAchievementRate: number;
  /** プロジェクト数 */
  projectCount: number;
  /** 全体成功率 */
  overallSuccessRate: number;
  /** 平均精度 */
  averageAccuracy: number;
  /** パフォーマンス分布 */
  performanceDistribution: {
    min: number;
    max: number;
    median: number;
    standardDeviation: number;
  };
}

/**
 * プロジェクト比較結果
 */
export interface ProjectComparison {
  /** プロジェクト名 */
  projectName: string;
  /** パフォーマンス改善率（%） */
  performanceImprovement: number;
  /** 精度改善率（%） */
  accuracyImprovement: number;
  /** 5ms/file目標達成状況 */
  target5msStatus: 'improved' | 'maintained' | 'degraded' | 'new';
  /** ベースライン値 */
  baselineMetrics: {
    timePerFile: number;
    accuracy: number;
  };
  /** 現在値 */
  currentMetrics: {
    timePerFile: number;
    accuracy: number;
  };
}

/**
 * ベースライン比較結果
 */
export interface BaselineComparison {
  /** 比較実行日時 */
  comparedAt: string;
  /** ベースラインID */
  baselineId: string;
  /** 全体改善率 */
  overallImprovement: number;
  /** プロジェクト別比較結果 */
  projectComparisons: ProjectComparison[];
  /** 5ms/file目標達成改善 */
  target5msImprovements: {
    improved: string[];    // 新規達成
    maintained: string[];  // 達成継続
    degraded: string[];    // 達成から未達成に
  };
  /** 推奨事項 */
  recommendations: string[];
}

/**
 * 傾向分析結果
 */
export interface TrendAnalysis {
  /** 全体傾向 */
  overallTrend: 'improving' | 'stable' | 'degrading';
  /** パフォーマンス改善率（期間全体） */
  performanceImprovementRate: number;
  /** 精度改善率（期間全体） */
  accuracyImprovementRate: number;
  /** 分析期間 */
  analysisWindow: {
    startDate: string;
    endDate: string;
    baselineCount: number;
  };
  /** プロジェクト別傾向 */
  projectTrends: {
    [projectName: string]: {
      trend: 'improving' | 'stable' | 'degrading';
      improvementRate: number;
    };
  };
}

/**
 * クリーンアップ結果
 */
export interface CleanupResult {
  /** 削除されたファイル数 */
  deletedCount: number;
  /** 解放された容量（バイト） */
  freedSpace: number;
  /** エラーメッセージ */
  errors: string[];
}

/**
 * ベースライン要約情報
 */
export interface BaselineSummary {
  /** ベースラインID */
  id: string;
  /** メタデータ */
  metadata: BaselineMetadata;
  /** 作成日時 */
  createdAt: string;
  /** 統計情報 */
  statistics: BaselineStatistics;
}

/**
 * ベースライン管理システム
 * 継続的改善の基準となるベンチマーク結果を管理
 */
export class BaselineManager {
  private readonly config: Required<BaselineManagerConfig>;
  private readonly validIdPattern = /^[a-f0-9-]{36}$/; // UUID形式の検証

  constructor(config: BaselineManagerConfig = {}) {
    // デフォルト設定の適用（Defensive Programming）
    this.config = {
      baselineDir: config.baselineDir || './.rimor/baselines',
      retentionPeriod: config.retentionPeriod || 90, // 90日間保持
      compressionEnabled: config.compressionEnabled || false,
      autoCleanup: config.autoCleanup || true
    };

    // ディレクトリの確保
    this.ensureBaselineDirectory();
  }

  /**
   * 新しいベースラインを作成
   * 
   * @param results ベンチマーク結果配列
   * @param metadata オプションのメタデータ
   * @returns 作成されたベースラインのID
   */
  async createBaseline(results: BenchmarkResult[], metadata: BaselineMetadata = {}): Promise<string> {
    // 入力検証（Defensive Programming）
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('空の結果配列からベースラインを作成することはできません');
    }

    // 全ての結果が成功していることを確認
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.warn(`警告: ${failedResults.length}個の失敗した結果がベースラインに含まれています`);
    }

    const baselineId = randomUUID();
    const createdAt = metadata.customTimestamp || new Date().toISOString();
    const statistics = this.calculateStatistics(results);

    const baseline: Baseline = {
      id: baselineId,
      results,
      createdAt,
      metadata: {
        name: metadata.name || `baseline-${new Date().toISOString().split('T')[0]}`,
        description: metadata.description || 'Auto-generated baseline',
        createdBy: metadata.createdBy || 'system',
        tags: metadata.tags || [],
        ...metadata
      },
      statistics
    };

    // ベースラインファイルの保存
    await this.saveBaseline(baseline);

    // 自動クリーンアップの実行
    if (this.config.autoCleanup) {
      setImmediate(() => this.cleanup().catch(console.warn));
    }

    return baselineId;
  }

  /**
   * ベースラインを取得
   * 
   * @param baselineId ベースラインID
   * @returns ベースライン（見つからない場合はundefined）
   */
  async getBaseline(baselineId: string): Promise<Baseline | undefined> {
    // セキュリティ検証: パストラバーサル攻撃の防止
    if (!this.isValidBaselineId(baselineId)) {
      return undefined;
    }

    try {
      const baselinePath = this.getBaselinePath(baselineId);
      const baselineData = await fs.readFile(baselinePath, 'utf-8');
      return JSON.parse(baselineData) as Baseline;
    } catch (error) {
      // ファイル読み込み失敗は未定義を返す（セキュア）
      return undefined;
    }
  }

  /**
   * 現在の結果をベースラインと比較
   * 
   * @param currentResults 現在のベンチマーク結果
   * @param baselineId 比較対象のベースラインID
   * @returns 比較結果
   */
  async compareWithBaseline(currentResults: BenchmarkResult[], baselineId: string): Promise<BaselineComparison> {
    const baseline = await this.getBaseline(baselineId);
    if (!baseline) {
      throw new Error(`ベースライン '${baselineId}' が見つかりません`);
    }

    const projectComparisons: ProjectComparison[] = [];
    const target5msImprovements = { improved: [], maintained: [], degraded: [] } as {
      improved: string[];
      maintained: string[];
      degraded: string[];
    };

    // プロジェクトごとの比較
    for (const currentResult of currentResults) {
      const baselineResult = baseline.results.find(r => r.projectName === currentResult.projectName);
      
      if (!baselineResult) {
        // 新しいプロジェクトの場合
        projectComparisons.push({
          projectName: currentResult.projectName,
          performanceImprovement: 0, // 新規のため改善率なし
          accuracyImprovement: 0,
          target5msStatus: 'new',
          baselineMetrics: { timePerFile: 0, accuracy: 0 },
          currentMetrics: {
            timePerFile: currentResult.performance.timePerFile,
            accuracy: currentResult.accuracy.taintTyperSuccessRate
          }
        });
        continue;
      }

      // パフォーマンス改善率の計算
      const performanceImprovement = ((baselineResult.performance.timePerFile - currentResult.performance.timePerFile) / baselineResult.performance.timePerFile) * 100;
      
      // 精度改善率の計算
      const accuracyImprovement = ((currentResult.accuracy.taintTyperSuccessRate - baselineResult.accuracy.taintTyperSuccessRate) / baselineResult.accuracy.taintTyperSuccessRate) * 100;

      // 5ms/file目標達成状況
      let target5msStatus: ProjectComparison['target5msStatus'] = 'maintained';
      if (baselineResult.target5ms.achieved && currentResult.target5ms.achieved) {
        target5msImprovements.maintained.push(currentResult.projectName);
        target5msStatus = 'maintained';
      } else if (!baselineResult.target5ms.achieved && currentResult.target5ms.achieved) {
        target5msImprovements.improved.push(currentResult.projectName);
        target5msStatus = 'improved';
      } else if (baselineResult.target5ms.achieved && !currentResult.target5ms.achieved) {
        target5msImprovements.degraded.push(currentResult.projectName);
        target5msStatus = 'degraded';
      }

      projectComparisons.push({
        projectName: currentResult.projectName,
        performanceImprovement,
        accuracyImprovement,
        target5msStatus,
        baselineMetrics: {
          timePerFile: baselineResult.performance.timePerFile,
          accuracy: baselineResult.accuracy.taintTyperSuccessRate
        },
        currentMetrics: {
          timePerFile: currentResult.performance.timePerFile,
          accuracy: currentResult.accuracy.taintTyperSuccessRate
        }
      });
    }

    // 全体改善率の計算
    const overallImprovement = projectComparisons.reduce((sum, comp) => sum + comp.performanceImprovement, 0) / projectComparisons.length;

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(projectComparisons);

    return {
      comparedAt: new Date().toISOString(),
      baselineId,
      overallImprovement,
      projectComparisons,
      target5msImprovements,
      recommendations
    };
  }

  /**
   * 最適なベースラインを自動選択
   * 
   * @param projectNames 対象プロジェクト名配列
   * @returns 最適なベースラインID
   */
  async selectOptimalBaseline(projectNames: string[]): Promise<string | undefined> {
    const baselines = await this.listBaselines();
    if (baselines.length === 0) return undefined;

    let bestBaseline: BaselineSummary | undefined;
    let bestScore = -Infinity;

    for (const baseline of baselines) {
      // プロジェクトマッチ度の計算
      const matchingProjects = baseline.statistics.projectCount;
      const matchRatio = matchingProjects / Math.max(projectNames.length, matchingProjects);
      
      // スコア計算（5ms/file達成率と精度を重視）
      const score = (baseline.statistics.target5msAchievementRate * 0.4) + 
                   (baseline.statistics.averageAccuracy * 0.3) + 
                   (matchRatio * 0.2) + 
                   ((5 - baseline.statistics.averageTimePerFile) * 0.1); // 低い実行時間を優遇

      if (score > bestScore) {
        bestScore = score;
        bestBaseline = baseline;
      }
    }

    return bestBaseline?.id;
  }

  /**
   * プロジェクトごとの最適ベースラインを選択
   * 
   * @param projectNames プロジェクト名配列
   * @returns プロジェクトごとの最適ベースラインIDのマップ
   */
  async selectOptimalBaselinesPerProject(projectNames: string[]): Promise<{ [projectName: string]: string }> {
    const baselines = await this.listBaselines();
    const optimalBaselines: { [projectName: string]: string } = {};

    for (const projectName of projectNames) {
      let bestBaseline: BaselineSummary | undefined;
      let bestScore = -Infinity;

      for (const baseline of baselines) {
        const fullBaseline = await this.getBaseline(baseline.id);
        if (!fullBaseline) continue;

        const projectResult = fullBaseline.results.find(r => r.projectName === projectName);
        if (!projectResult) continue;

        // プロジェクト固有のスコア計算
        const score = (projectResult.target5ms.achieved ? 40 : 0) + 
                     (projectResult.accuracy.taintTyperSuccessRate * 30) + 
                     ((5 - projectResult.performance.timePerFile) * 30);

        if (score > bestScore) {
          bestScore = score;
          bestBaseline = baseline;
        }
      }

      if (bestBaseline) {
        optimalBaselines[projectName] = bestBaseline.id;
      }
    }

    return optimalBaselines;
  }

  /**
   * ベースライン統計情報を計算
   * 
   * @param baselineId ベースラインID
   * @returns 統計情報
   */
  async calculateBaselineStatistics(baselineId: string): Promise<BaselineStatistics> {
    const baseline = await this.getBaseline(baselineId);
    if (!baseline) {
      throw new Error(`ベースライン '${baselineId}' が見つかりません`);
    }

    return baseline.statistics;
  }

  /**
   * 複数ベースライン間の傾向分析
   * 
   * @param baselineIds 分析対象のベースラインID配列
   * @returns 傾向分析結果
   */
  async analyzeTrends(baselineIds: string[]): Promise<TrendAnalysis> {
    const baselines = await Promise.all(
      baselineIds.map(id => this.getBaseline(id))
    );
    
    const validBaselines = baselines.filter((b): b is Baseline => b !== undefined);
    if (validBaselines.length < 2) {
      throw new Error('傾向分析には最低2つのベースラインが必要です');
    }

    // 時系列順にソート
    validBaselines.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const firstBaseline = validBaselines[0];
    const lastBaseline = validBaselines[validBaselines.length - 1];

    // 全体パフォーマンス改善率
    const performanceImprovementRate = ((firstBaseline.statistics.averageTimePerFile - lastBaseline.statistics.averageTimePerFile) / firstBaseline.statistics.averageTimePerFile) * 100;
    
    // 全体精度改善率
    const accuracyImprovementRate = ((lastBaseline.statistics.averageAccuracy - firstBaseline.statistics.averageAccuracy) / firstBaseline.statistics.averageAccuracy) * 100;

    // 全体傾向の判定
    let overallTrend: TrendAnalysis['overallTrend'] = 'stable';
    const combinedImprovementRate = (performanceImprovementRate + accuracyImprovementRate) / 2;
    
    if (combinedImprovementRate > 5) {
      overallTrend = 'improving';
    } else if (combinedImprovementRate < -5) {
      overallTrend = 'degrading';
    }

    // プロジェクト別傾向分析
    const projectTrends: TrendAnalysis['projectTrends'] = {};
    const projectNamesSet = new Set(validBaselines.flatMap(b => b.results.map(r => r.projectName)));
    const projectNames = Array.from(projectNamesSet);

    for (const projectName of projectNames) {
      const projectResults = validBaselines
        .map(b => b.results.find(r => r.projectName === projectName))
        .filter((r): r is BenchmarkResult => r !== undefined);

      if (projectResults.length >= 2) {
        const firstResult = projectResults[0];
        const lastResult = projectResults[projectResults.length - 1];
        
        const projectImprovementRate = ((firstResult.performance.timePerFile - lastResult.performance.timePerFile) / firstResult.performance.timePerFile) * 100;
        
        let projectTrend: 'improving' | 'stable' | 'degrading' = 'stable';
        if (projectImprovementRate > 10) {
          projectTrend = 'improving';
        } else if (projectImprovementRate < -10) {
          projectTrend = 'degrading';
        }

        projectTrends[projectName] = {
          trend: projectTrend,
          improvementRate: projectImprovementRate
        };
      }
    }

    return {
      overallTrend,
      performanceImprovementRate,
      accuracyImprovementRate,
      analysisWindow: {
        startDate: firstBaseline.createdAt,
        endDate: lastBaseline.createdAt,
        baselineCount: validBaselines.length
      },
      projectTrends
    };
  }

  /**
   * ベースライン一覧を取得
   * 
   * @returns ベースライン要約情報の配列
   */
  async listBaselines(): Promise<BaselineSummary[]> {
    try {
      const files = await fs.readdir(this.config.baselineDir);
      const baselineFiles = files.filter(f => f.endsWith('.json') && this.isValidBaselineId(f.replace('.json', '')));
      
      const summaries: BaselineSummary[] = [];
      for (const file of baselineFiles) {
        const baselineId = file.replace('.json', '');
        const baseline = await this.getBaseline(baselineId);
        if (baseline) {
          summaries.push({
            id: baseline.id,
            metadata: baseline.metadata,
            createdAt: baseline.createdAt,
            statistics: baseline.statistics
          });
        }
      }

      // 作成日時の降順でソート
      return summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * 古いベースラインのクリーンアップ
   * 
   * @returns クリーンアップ結果
   */
  async cleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      freedSpace: 0,
      errors: []
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

      const baselines = await this.listBaselines();
      
      for (const baseline of baselines) {
        const baselineDate = new Date(baseline.createdAt);
        if (baselineDate < cutoffDate) {
          try {
            const baselinePath = this.getBaselinePath(baseline.id);
            const stats = await fs.stat(baselinePath);
            await fs.unlink(baselinePath);
            
            result.deletedCount++;
            result.freedSpace += stats.size;
          } catch (error) {
            result.errors.push(`ベースライン '${baseline.id}' の削除に失敗: ${error}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`クリーンアップ処理中にエラーが発生: ${error}`);
    }

    return result;
  }

  // ===== プライベートメソッド =====

  /**
   * ベースラインディレクトリの確保
   */
  private async ensureBaselineDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.baselineDir, { recursive: true });
    } catch (error) {
      console.warn(`ベースラインディレクトリの作成に失敗: ${error}`);
    }
  }

  /**
   * ベースラインIDの有効性検証
   * セキュリティ対策: パストラバーサル攻撃の防止
   */
  private isValidBaselineId(id: string): boolean {
    return this.validIdPattern.test(id);
  }

  /**
   * ベースラインファイルパスの取得
   */
  private getBaselinePath(baselineId: string): string {
    return path.join(this.config.baselineDir, `${baselineId}.json`);
  }

  /**
   * ベースラインファイルの保存
   */
  private async saveBaseline(baseline: Baseline): Promise<void> {
    const baselinePath = this.getBaselinePath(baseline.id);
    const baselineData = JSON.stringify(baseline, null, 2);
    
    await fs.writeFile(baselinePath, baselineData, 'utf-8');
  }

  /**
   * 統計情報の計算
   */
  private calculateStatistics(results: BenchmarkResult[]): BaselineStatistics {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      // 全て失敗の場合のデフォルト値
      return {
        averageTimePerFile: 0,
        target5msAchievementRate: 0,
        projectCount: results.length,
        overallSuccessRate: 0,
        averageAccuracy: 0,
        performanceDistribution: { min: 0, max: 0, median: 0, standardDeviation: 0 }
      };
    }

    const timesPerFile = successfulResults.map(r => r.performance.timePerFile);
    const accuracyRates = successfulResults.map(r => r.accuracy.taintTyperSuccessRate);
    const target5msAchieved = successfulResults.filter(r => r.target5ms.achieved).length;

    // 基本統計の計算
    const averageTimePerFile = timesPerFile.reduce((sum, time) => sum + time, 0) / timesPerFile.length;
    const averageAccuracy = accuracyRates.reduce((sum, acc) => sum + acc, 0) / accuracyRates.length;
    
    // パフォーマンス分布の計算
    const sortedTimes = [...timesPerFile].sort((a, b) => a - b);
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
    
    // 標準偏差の計算
    const variance = timesPerFile.reduce((sum, time) => sum + Math.pow(time - averageTimePerFile, 2), 0) / timesPerFile.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      averageTimePerFile,
      target5msAchievementRate: target5msAchieved / successfulResults.length,
      projectCount: results.length,
      overallSuccessRate: successfulResults.length / results.length,
      averageAccuracy,
      performanceDistribution: {
        min,
        max,
        median,
        standardDeviation
      }
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(comparisons: ProjectComparison[]): string[] {
    const recommendations: string[] = [];
    
    const improvedProjects = comparisons.filter(c => c.performanceImprovement > 5);
    const degradedProjects = comparisons.filter(c => c.performanceImprovement < -5);
    
    if (improvedProjects.length > degradedProjects.length) {
      recommendations.push('全体的に良好なパフォーマンス改善が見られます。現在の最適化戦略を継続してください。');
    } else if (degradedProjects.length > improvedProjects.length) {
      recommendations.push('複数のプロジェクトでパフォーマンス劣化が検出されています。最新の変更内容を確認してください。');
    }
    
    // 5ms/file目標関連の推奨事項
    const target5msImproved = comparisons.filter(c => c.target5msStatus === 'improved');
    const target5msDegraded = comparisons.filter(c => c.target5msStatus === 'degraded');
    
    if (target5msImproved.length > 0) {
      recommendations.push(`${target5msImproved.map(c => c.projectName).join(', ')} で5ms/file目標が新たに達成されました。`);
    }
    
    if (target5msDegraded.length > 0) {
      recommendations.push(`${target5msDegraded.map(c => c.projectName).join(', ')} で5ms/file目標が未達成になりました。最適化の見直しが必要です。`);
    }
    
    return recommendations;
  }
}