import { 
  FileScore, 
  DirectoryScore, 
  ProjectScore,
  PluginResult,
  DimensionScore,
  WeightConfig,
  DEFAULT_WEIGHTS,
  DimensionType,
  AggregatedScore
} from './types';
import { GradeCalculator } from './grades';
import { QualityScore } from '../core/types';
import { errorHandler, ErrorType } from '../utils/errorHandler';

/**
 * v0.4.0 品質スコア算出器のコア計算エンジン
 * ファイル、ディレクトリ、プロジェクトレベルでの包括的なスコア計算
 */
export class ScoreCalculatorV2 {
  private gradeCalculator: GradeCalculator;

  constructor() {
    this.gradeCalculator = new GradeCalculator();
  }

  /**
   * ファイル単位のスコア算出
   * @param file ファイルパス
   * @param pluginResults プラグイン実行結果
   * @param weights 重み付け設定（オプション）
   * @returns ファイルスコア
   */
  calculateFileScore(
    file: string,
    pluginResults: PluginResult[],
    weights: WeightConfig = DEFAULT_WEIGHTS
  ): FileScore {
    try {
      // 入力検証
      if (!file || typeof file !== 'string') {
        throw new Error('ファイルパスが無効です');
      }

      if (!Array.isArray(pluginResults)) {
        throw new Error('プラグイン結果が配列ではありません');
      }

      if (pluginResults.length === 0) {
        return this.createEmptyFileScore(file);
      }

      // 大量のプラグイン結果の警告
      if (pluginResults.length > 100) {
        errorHandler.handleWarning(
          `ファイル ${file} のプラグイン結果が多数: ${pluginResults.length}件`,
          { 
            filePath: file, 
            resultCount: pluginResults.length,
            threshold: 100
          },
          'calculateFileScore'
        );
      }

      // プラグイン結果の検証
      const validPluginResults = pluginResults.filter((result, index) => {
        if (!result || typeof result !== 'object') {
          errorHandler.handleWarning(
            `ファイル ${file} の無効なプラグイン結果をスキップ: インデックス ${index}`,
            { 
              filePath: file, 
              index,
              resultType: typeof result
            },
            'calculateFileScore'
          );
          return false;
        }
        
        if (typeof result.score !== 'number' || isNaN(result.score)) {
          errorHandler.handleWarning(
            `ファイル ${file} の無効なスコア値をスキップ: ${result.pluginId}`,
            { 
              filePath: file, 
              pluginId: result.pluginId,
              scoreType: typeof result.score,
              scoreValue: result.score
            },
            'calculateFileScore'
          );
          return false;
        }
        
        return true;
      });

      if (validPluginResults.length === 0) {
        errorHandler.handleWarning(
          `ファイル ${file} に有効なプラグイン結果がありません`,
          { 
            filePath: file, 
            originalResultCount: pluginResults.length,
            validResultCount: 0
          },
          'calculateFileScore'
        );
        return this.createEmptyFileScore(file);
      }

      // 1. 各プラグインのスコアを重み付きで集約
      const overallScore = this.calculateWeightedOverallScore(validPluginResults, weights);

      // 2. ディメンション別スコアを計算
      const dimensions = this.calculateDimensionScores(validPluginResults, weights);

      // 3. プラグインスコア情報を整理
      const pluginScores: { [pluginId: string]: { score: number; weight: number; issues: any[] } } = {};
      
      for (const result of validPluginResults) {
        try {
          pluginScores[result.pluginId] = {
            score: typeof result.score === 'number' ? result.score : 0,
            weight: typeof result.weight === 'number' ? result.weight : 1.0,
            issues: Array.isArray(result.issues) ? result.issues : []
          };
        } catch (error) {
          errorHandler.handleWarning(
            `プラグイン ${result.pluginId} の情報整理でエラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
            { 
              pluginId: result.pluginId,
              error: error instanceof Error ? error.message : '不明なエラー',
              filePath: file
            },
            'calculateFileScore'
          );
        }
      }

      // 4. グレード判定
      const grade = this.gradeCalculator.calculateGrade(overallScore);

      return {
        filePath: file,
        overallScore: this.normalizeScore(overallScore),
        dimensions,
        grade,
        weights,
        metadata: {
          analysisTime: Date.now(),
          pluginResults: validPluginResults,
          issueCount: validPluginResults.reduce((count, result) => {
            try {
              return count + (Array.isArray(result.issues) ? result.issues.length : 0);
            } catch {
              return count;
            }
          }, 0)
        },
        pluginScores
      };
      
    } catch (error) {
      console.error(`ファイル ${file} のスコア計算でエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
      
      // エラー時のフォールバック
      return this.createEmptyFileScore(file);
    }
  }

  /**
   * ディレクトリ単位のスコア算出
   * @param directory ディレクトリパス
   * @param fileScores ファイルスコアの配列
   * @returns ディレクトリスコア
   */
  calculateDirectoryScore(
    directory: string,
    fileScores: FileScore[]
  ): DirectoryScore {
    if (fileScores.length === 0) {
      return this.createEmptyDirectoryScore(directory);
    }

    // 1. 平均スコアとファイル数を計算
    const scores = fileScores.map(f => f.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const overallScore = averageScore; // ディレクトリスコア = 平均スコア

    // 2. ディメンション別の集約
    const dimensions = this.aggregateDimensions(fileScores);

    // 3. グレード判定
    const grade = this.gradeCalculator.calculateGrade(overallScore);

    return {
      directoryPath: directory,
      overallScore: this.normalizeScore(overallScore),
      grade,
      fileCount: fileScores.length,
      fileScores,
      dimensionScores: {
        completeness: dimensions.completeness.score,
        correctness: dimensions.correctness.score,
        maintainability: dimensions.maintainability.score,
        performance: dimensions.performance.score,
        security: dimensions.security.score
      },
      // レガシーサポート
      averageScore: this.normalizeScore(averageScore),
      dimensions
    };
  }

  /**
   * プロジェクト全体のスコア算出
   * @param directoryScores ディレクトリスコアの配列
   * @returns プロジェクトスコア
   */
  calculateProjectScore(
    directoryScores: DirectoryScore[],
    weights: WeightConfig
  ): ProjectScore {
    if (directoryScores.length === 0) {
      return this.createEmptyProjectScore('.');
    }

    // 1. 全ファイルを収集してプロジェクト統計を計算
    const allFileScores: FileScore[] = [];
    for (const dirScore of directoryScores) {
      allFileScores.push(...dirScore.fileScores);
    }

    const totalFiles = allFileScores.length;
    const allScores = allFileScores.map(f => f.overallScore);
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / totalFiles;

    // 2. ディレクトリ数に基づく重み付き平均でプロジェクトスコアを計算
    const weightedScore = this.calculateDirectoryWeightedScore(directoryScores);

    // 3. ディメンション別の集約
    const dimensions = this.aggregateDimensions(allFileScores);

    // 4. グレード分布を計算
    const distribution = this.gradeCalculator.calculateGradeDistribution(allScores);

    // 5. プロジェクトグレード判定
    const grade = this.gradeCalculator.calculateGrade(weightedScore);

    return {
      projectPath: '.',
      overallScore: this.normalizeScore(weightedScore),
      grade,
      totalFiles,
      totalDirectories: directoryScores.length,
      fileScores: allFileScores,
      directoryScores,
      weights,
      metadata: {
        generatedAt: new Date(),
        executionTime: Date.now() - (Date.now() - 100), // 仮の実行時間
        pluginCount: this.getPluginCount(allFileScores),
        issueCount: this.getIssueCount(allFileScores)
      },
      // レガシーサポート
      averageScore: this.normalizeScore(averageScore),
      dimensions,
      distribution
    };
  }

  /**
   * QualityScoreの配列をAggregatedScoreに集約
   * 既存システムとの後方互換性のため
   */
  aggregateScores(
    scores: QualityScore[],
    weights?: WeightConfig
  ): AggregatedScore {
    if (scores.length === 0) {
      return {
        score: 0,
        confidence: 0,
        metadata: {
          aggregatedFrom: 0,
          totalWeight: 0,
          algorithm: 'weighted-average'
        }
      };
    }

    const weightConfig = weights || DEFAULT_WEIGHTS;
    const weightValues = scores.map(score => score.confidence || 0);
    const totalWeight = weightValues.reduce((sum, weight) => sum + (weight || 0), 0);

    if (totalWeight === 0) {
      return {
        score: 0,
        confidence: 0,
        metadata: {
          aggregatedFrom: scores.length,
          totalWeight: 0,
          algorithm: 'weighted-average'
        }
      };
    }

    // 加重平均によるスコア計算
    const aggregatedScore = scores.reduce((sum, score, index) => {
      return sum + (score.overall * (weightValues[index] || 0));
    }, 0) / (totalWeight || 1);

    // 信頼度の平均
    const avgConfidence = scores.reduce((sum, score) => sum + (score.confidence || 0), 0) / scores.length;

    return {
      score: this.normalizeScore(aggregatedScore),
      confidence: avgConfidence,
      metadata: {
        aggregatedFrom: scores.length,
        totalWeight,
        algorithm: 'weighted-average'
      }
    };
  }

  // === プライベートメソッド ===

  /**
   * 重み付き総合スコアを計算（ディメンション重みを考慮）
   */
  private calculateWeightedOverallScore(
    pluginResults: PluginResult[], 
    weights: WeightConfig
  ): number {
    // ディメンション別にプラグインを分類し、各ディメンションの重み付きスコアを計算
    const dimensionScores: { [dimension: string]: number } = {};
    const dimensionWeights: { [dimension: string]: number } = {};

    // 各ディメンションのスコアを計算
    for (const dimension of Object.keys(weights.dimensions) as DimensionType[]) {
      const relevantPlugins = pluginResults.filter(result => 
        this.isPluginRelevantToDimension(result, dimension)
      );

      if (relevantPlugins.length > 0) {
        let dimensionWeightedScore = 0;
        let dimensionTotalWeight = 0;

        for (const plugin of relevantPlugins) {
          const pluginWeight = weights.plugins[plugin.pluginId] || plugin.weight || 1.0;
          dimensionWeightedScore += plugin.score * pluginWeight;
          dimensionTotalWeight += pluginWeight;
        }

        dimensionScores[dimension] = dimensionTotalWeight > 0 ? dimensionWeightedScore / dimensionTotalWeight : 0;
        dimensionWeights[dimension] = weights.dimensions[dimension];
      }
    }

    // ディメンション重みを適用して最終スコアを計算
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const weight = dimensionWeights[dimension];
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  /**
   * ディメンション別スコアを計算
   */
  private calculateDimensionScores(
    pluginResults: PluginResult[],
    weights: WeightConfig
  ): FileScore['dimensions'] {
    const dimensions: FileScore['dimensions'] = {
      completeness: this.createEmptyDimensionScore(),
      correctness: this.createEmptyDimensionScore(),
      maintainability: this.createEmptyDimensionScore(),
      performance: this.createEmptyDimensionScore(),
      security: this.createEmptyDimensionScore()
    };

    // 各ディメンションにプラグイン結果を振り分け
    for (const dimension of Object.keys(dimensions) as DimensionType[]) {
      const relevantPlugins = pluginResults.filter(result => 
        this.isPluginRelevantToDimension(result, dimension)
      );

      if (relevantPlugins.length > 0) {
        dimensions[dimension] = this.calculateSingleDimensionScore(
          relevantPlugins, 
          dimension, 
          weights
        );
      }
    }

    return dimensions;
  }

  /**
   * 単一ディメンションのスコアを計算
   */
  private calculateSingleDimensionScore(
    relevantPlugins: PluginResult[],
    dimension: DimensionType,
    weights: WeightConfig
  ): DimensionScore {
    const dimensionWeight = weights.dimensions[dimension];
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const contributors: { pluginId: string; contribution: number }[] = [];

    for (const plugin of relevantPlugins) {
      const pluginWeight = weights.plugins[plugin.pluginId] || plugin.weight || 1.0;
      const contribution = plugin.score * pluginWeight;
      
      totalWeightedScore += contribution;
      totalWeight += pluginWeight;
      contributors.push({
        pluginId: plugin.pluginId,
        contribution: pluginWeight
      });
    }

    const value = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      score: this.normalizeScore(value),
      weight: dimensionWeight,
      issues: relevantPlugins.flatMap(p => p.issues || []),
      contributors,
      details: `${relevantPlugins.length} plugins contributed to ${dimension} score`
    };
  }

  /**
   * プラグインがディメンションに関連するかを判定
   */
  private isPluginRelevantToDimension(plugin: PluginResult, dimension: DimensionType): boolean {
    // プラグインのメタデータにディメンション情報がある場合
    if (plugin.metadata?.dimensions) {
      return plugin.metadata.dimensions.includes(dimension);
    }

    // プラグイン名/IDベースの推定（フォールバック）
    const pluginName = plugin.pluginName.toLowerCase();
    const pluginId = plugin.pluginId.toLowerCase();

    const isSpecificToOtherDimension = this.isPluginSpecificToAnyDimension(plugin);

    switch (dimension) {
      case 'completeness':
        if (pluginName.includes('existence') || pluginName.includes('coverage') || 
            pluginId.includes('test-existence') || pluginId.includes('completeness')) {
          return true;
        }
        // 他の特定ディメンションに属さない場合は、completenessに含める（デフォルト）
        return !isSpecificToOtherDimension;
      case 'correctness':
        return pluginName.includes('assertion') || pluginName.includes('correctness') ||
               pluginId.includes('assertion') || pluginId.includes('correctness');
      case 'maintainability':
        return pluginName.includes('structure') || pluginName.includes('maintainability') ||
               pluginId.includes('structure') || pluginId.includes('maintainability');
      case 'performance':
        return pluginName.includes('performance') || pluginId.includes('performance');
      case 'security':
        return pluginName.includes('security') || pluginId.includes('security');
      default:
        return !isSpecificToOtherDimension; // 不明な場合はデフォルトディメンションに適用
    }
  }

  /**
   * プラグインが特定のディメンションに属するかを判定
   */
  private isPluginSpecificToAnyDimension(plugin: PluginResult): boolean {
    const pluginName = plugin.pluginName.toLowerCase();
    const pluginId = plugin.pluginId.toLowerCase();

    return pluginName.includes('assertion') || pluginName.includes('correctness') ||
           pluginName.includes('structure') || pluginName.includes('maintainability') ||
           pluginName.includes('performance') || pluginName.includes('security') ||
           pluginId.includes('assertion') || pluginId.includes('correctness') ||
           pluginId.includes('structure') || pluginId.includes('maintainability') ||
           pluginId.includes('performance') || pluginId.includes('security');
  }

  /**
   * ファイルスコア配列からディメンションを集約
   */
  private aggregateDimensions(fileScores: FileScore[]): FileScore['dimensions'] {
    if (fileScores.length === 0) {
      return {
        completeness: this.createEmptyDimensionScore(),
        correctness: this.createEmptyDimensionScore(),
        maintainability: this.createEmptyDimensionScore(),
        performance: this.createEmptyDimensionScore(),
        security: this.createEmptyDimensionScore()
      };
    }

    const dimensions: FileScore['dimensions'] = {
      completeness: this.createEmptyDimensionScore(),
      correctness: this.createEmptyDimensionScore(),
      maintainability: this.createEmptyDimensionScore(),
      performance: this.createEmptyDimensionScore(),
      security: this.createEmptyDimensionScore()
    };

    // 各ディメンションの平均値を計算
    for (const dimension of Object.keys(dimensions) as DimensionType[]) {
      const dimensionValues = fileScores.map(f => f.dimensions[dimension].score);
      const averageValue = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;
      
      // 重みは最初のファイルから取得（通常は同じ）
      const weight = fileScores[0].dimensions[dimension].weight;

      dimensions[dimension] = {
        score: this.normalizeScore(averageValue),
        weight,
        issues: [],
        contributors: [],
        details: `Aggregated from ${fileScores.length} files`
      };
    }

    return dimensions;
  }

  /**
   * ディレクトリ重み付きスコアを計算
   */
  private calculateDirectoryWeightedScore(directoryScores: DirectoryScore[]): number {
    let totalWeightedScore = 0;
    let totalFiles = 0;

    for (const dirScore of directoryScores) {
      // ファイル数をウェイトとして使用
      totalWeightedScore += dirScore.overallScore * dirScore.fileCount;
      totalFiles += dirScore.fileCount;
    }

    return totalFiles > 0 ? totalWeightedScore / totalFiles : 0;
  }

  /**
   * スコアを正規化（0-100の範囲、小数点第1位）
   */
  private normalizeScore(score: number): number {
    const clamped = Math.max(0, Math.min(100, score));
    return Math.round(clamped * 10) / 10;
  }

  /**
   * 空のファイルスコアを作成
   */
  private createEmptyFileScore(filePath: string): FileScore {
    const emptyWeights = { plugins: {}, dimensions: { completeness: 1, correctness: 1, maintainability: 1, performance: 1, security: 1 } };
    return {
      filePath,
      overallScore: 0,
      dimensions: {
        completeness: this.createEmptyDimensionScore(),
        correctness: this.createEmptyDimensionScore(),
        maintainability: this.createEmptyDimensionScore(),
        performance: this.createEmptyDimensionScore(),
        security: this.createEmptyDimensionScore()
      },
      grade: 'F',
      weights: emptyWeights,
      metadata: {
        analysisTime: 0,
        pluginResults: [],
        issueCount: 0
      },
      pluginScores: {}
    };
  }

  /**
   * 空のディレクトリスコアを作成
   */
  private createEmptyDirectoryScore(directoryPath: string): DirectoryScore {
    return {
      directoryPath,
      overallScore: 0,
      grade: 'F',
      fileCount: 0,
      fileScores: [],
      dimensionScores: {
        completeness: 0,
        correctness: 0,
        maintainability: 0,
        performance: 0,
        security: 0
      },
      // レガシーサポート
      averageScore: 0,
      dimensions: {
        completeness: this.createEmptyDimensionScore(),
        correctness: this.createEmptyDimensionScore(),
        maintainability: this.createEmptyDimensionScore(),
        performance: this.createEmptyDimensionScore(),
        security: this.createEmptyDimensionScore()
      }
    };
  }

  /**
   * 空のプロジェクトスコアを作成
   */
  private createEmptyProjectScore(projectPath: string): ProjectScore {
    const emptyWeights = { plugins: {}, dimensions: { completeness: 1, correctness: 1, maintainability: 1, performance: 1, security: 1 } };
    return {
      projectPath,
      overallScore: 0,
      grade: 'F',
      totalFiles: 0,
      totalDirectories: 0,
      fileScores: [],
      directoryScores: [],
      weights: emptyWeights,
      metadata: {
        generatedAt: new Date(),
        executionTime: 0,
        pluginCount: 0,
        issueCount: 0
      },
      // レガシーサポート
      averageScore: 0,
      dimensions: {
        completeness: this.createEmptyDimensionScore(),
        correctness: this.createEmptyDimensionScore(),
        maintainability: this.createEmptyDimensionScore(),
        performance: this.createEmptyDimensionScore(),
        security: this.createEmptyDimensionScore()
      },
      distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    };
  }

  /**
   * 空のディメンションスコアを作成
   */
  private createEmptyDimensionScore(): DimensionScore {
    return {
      score: 0,
      weight: 1.0,
      issues: [],
      contributors: [],
      details: 'No data available'
    };
  }

  /**
   * プラグイン数を取得
   */
  private getPluginCount(fileScores: FileScore[]): number {
    const pluginIds = new Set<string>();
    fileScores.forEach(file => {
      if (file.pluginScores) {
        Object.keys(file.pluginScores).forEach(id => pluginIds.add(id));
      }
    });
    return pluginIds.size;
  }

  /**
   * 課題数を取得
   */
  private getIssueCount(fileScores: FileScore[]): number {
    return fileScores.reduce((total, file) => {
      return total + Object.values(file.dimensions)
        .reduce((dimTotal, dim) => dimTotal + dim.issues.length, 0);
    }, 0);
  }
}