import { 
  WeightConfig, 
  DEFAULT_WEIGHTS,
  DimensionType,
  GradeType
} from './types';
import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';

/**
 * 重み管理システム
 * プラグイン、ディメンション、ファイルタイプ別の重み付け設定を管理
 */
export class WeightsManager {
  private static readonly CONFIG_FILENAMES = [
    'rimor.config.json',
    '.rimorrc.json',
    '.rimorrc'
  ];

  /**
   * 指定ディレクトリから重み設定を読み込み
   * @param configDir 設定ファイルのディレクトリ
   * @returns 重み設定
   */
  async loadWeights(configDir: string): Promise<WeightConfig> {
    try {
      const configPath = await this.findConfigFile(configDir);
      
      if (!configPath) {
        return DEFAULT_WEIGHTS;
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      // scoring.weights セクションから重み設定を抽出
      const weightConfig = config.scoring?.weights;
      
      if (!weightConfig) {
        return DEFAULT_WEIGHTS;
      }

      return this.mergeWithDefaults(weightConfig);
      
    } catch (error) {
      // テスト環境では警告を抑制
      if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
        console.warn(`重み設定の読み込みでエラーが発生しました: ${error}`);
      }
      return DEFAULT_WEIGHTS;
    }
  }

  /**
   * 重み設定を設定ファイルに保存
   * @param configDir 設定ファイルのディレクトリ
   * @param weights 保存する重み設定
   */
  async saveWeights(configDir: string, weights: WeightConfig): Promise<void> {
    const configPath = path.join(configDir, 'rimor.config.json');
    
    let existingConfig = {};
    
    // 既存の設定ファイルがある場合は読み込み
    if (fs.existsSync(configPath)) {
      try {
        const existingContent = fs.readFileSync(configPath, 'utf-8');
        existingConfig = JSON.parse(existingContent);
      } catch (error) {
        // テスト環境では警告を抑制
        if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
          console.warn(`既存設定ファイルの読み込みでエラー: ${error}`);
        }
      }
    }

    // 重み設定を統合
    const updatedConfig = {
      ...existingConfig,
      scoring: {
        ...(existingConfig as any).scoring,
        weights: weights
      }
    };

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
  }

  /**
   * ファイルパスに基づいてファイルタイプ重みを取得
   * @param filePath ファイルパス
   * @param weights 重み設定
   * @returns ファイルタイプ重み（マッチしない場合は1.0）
   */
  getFileTypeWeight(filePath: string, weights: WeightConfig): number {
    if (!weights.fileTypes) {
      return 1.0;
    }

    let maxWeight = 1.0;

    // 全パターンをチェックし、マッチするもののうち最大の重みを返す
    for (const [pattern, weight] of Object.entries(weights.fileTypes)) {
      if (minimatch(filePath, pattern)) {
        maxWeight = Math.max(maxWeight, weight);
      }
    }

    return maxWeight;
  }

  /**
   * 重み設定の妥当性を検証
   * @param weights 検証する重み設定
   * @returns 検証結果
   */
  validateWeights(weights: WeightConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // プラグイン重みの検証
    for (const [pluginId, weight] of Object.entries(weights.plugins)) {
      if (typeof weight !== 'number' || weight <= 0) {
        errors.push(`プラグイン重み "${pluginId}" は正の値である必要があります`);
      } else if (weight > 5.0) {
        warnings.push(`プラグイン重み "${pluginId}" (${weight}) は高すぎる可能性があります`);
      } else if (weight < 0.1) {
        warnings.push(`プラグイン重み "${pluginId}" (${weight}) は低すぎる可能性があります`);
      }
    }

    // ディメンション重みの検証
    const requiredDimensions: DimensionType[] = [
      'completeness', 'correctness', 'maintainability', 'performance', 'security'
    ];

    for (const dimension of requiredDimensions) {
      const weight = weights.dimensions[dimension];
      
      if (typeof weight !== 'number') {
        errors.push(`ディメンション重み "${dimension}" が定義されていません`);
      } else if (weight <= 0) {
        errors.push(`ディメンション重み "${dimension}" は正の値である必要があります`);
      } else if (weight > 5.0) {
        warnings.push(`ディメンション重み "${dimension}" (${weight}) は高すぎる可能性があります`);
      } else if (weight < 0.1) {
        warnings.push(`ディメンション重み "${dimension}" (${weight}) は低すぎる可能性があります`);
      }
    }

    // ディメンション重みのバランス確認
    const dimensionWeights = Object.values(weights.dimensions).filter(w => typeof w === 'number');
    if (dimensionWeights.length > 1) {
      const max = Math.max(...dimensionWeights);
      const min = Math.min(...dimensionWeights);
      
      if (max / min > 10) {
        warnings.push(`ディメンション重みの格差が大きすぎます (最大/最小: ${(max/min).toFixed(1)})`);
        suggestions.push('ディメンション重みをより均等に調整することを検討してください');
      }
    }

    // ファイルタイプ重みの検証
    if (weights.fileTypes) {
      for (const [pattern, weight] of Object.entries(weights.fileTypes)) {
        if (typeof weight !== 'number' || weight <= 0) {
          errors.push(`ファイルタイプ重み "${pattern}" は正の値である必要があります`);
        } else if (weight > 3.0) {
          warnings.push(`ファイルタイプ重み "${pattern}" (${weight}) は高すぎる可能性があります`);
        }
      }
    }

    // 最適化提案
    if (errors.length === 0 && warnings.length === 0) {
      // 正確性重視の提案
      if (weights.dimensions.correctness < 1.2) {
        suggestions.push('正確性は品質の核心です。correctnessの重みを1.2以上に設定することをお勧めします');
      }
      
      // セキュリティ重要性の提案
      if (weights.dimensions.security < 1.0) {
        suggestions.push('セキュリティテストの重要性を考慮し、securityの重みを1.0以上に設定することをお勧めします');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * プロジェクト分析結果に基づいて最適化された重みを提案
   * @param projectStats プロジェクト統計情報
   * @returns 最適化された重み設定
   */
  async getOptimizedWeights(projectStats: {
    totalFiles: number;
    pluginUsage: Record<string, number>;
    dimensionImportance: Record<DimensionType, number>;
  }): Promise<WeightConfig> {
    const optimizedWeights: WeightConfig = {
      plugins: {},
      dimensions: { ...DEFAULT_WEIGHTS.dimensions }
    };

    // プラグイン使用頻度に基づく重み調整
    for (const [pluginId, usage] of Object.entries(projectStats.pluginUsage)) {
      if (usage > 0.8) {
        optimizedWeights.plugins[pluginId] = 1.5; // 高頻度使用
      } else if (usage > 0.5) {
        optimizedWeights.plugins[pluginId] = 1.2; // 中頻度使用
      } else if (usage > 0.2) {
        optimizedWeights.plugins[pluginId] = 1.0; // 低頻度使用
      } else {
        optimizedWeights.plugins[pluginId] = 0.8; // 稀な使用
      }
    }

    // ディメンション重要度に基づく重み調整
    for (const [dimension, importance] of Object.entries(projectStats.dimensionImportance)) {
      const baseDimensionWeight = DEFAULT_WEIGHTS.dimensions[dimension as DimensionType];
      
      if (importance > 0.8) {
        optimizedWeights.dimensions[dimension as DimensionType] = baseDimensionWeight * 1.5;
      } else if (importance > 0.6) {
        optimizedWeights.dimensions[dimension as DimensionType] = baseDimensionWeight * 1.2;
      } else if (importance > 0.4) {
        optimizedWeights.dimensions[dimension as DimensionType] = baseDimensionWeight * 1.0;
      } else {
        optimizedWeights.dimensions[dimension as DimensionType] = baseDimensionWeight * 0.8;
      }
    }

    // プロジェクトサイズに基づく調整
    if (projectStats.totalFiles > 500) {
      // 大規模プロジェクトでは保守性を重視
      optimizedWeights.dimensions.maintainability *= 1.2;
    } else if (projectStats.totalFiles < 50) {
      // 小規模プロジェクトでは完全性を重視
      optimizedWeights.dimensions.completeness *= 1.3;
    }

    return optimizedWeights;
  }

  /**
   * 重み設定のプリセットを生成
   * @param preset プリセット名
   * @returns プリセット重み設定
   */
  generatePresetWeights(preset: 'strict' | 'balanced' | 'performance' | 'legacy'): WeightConfig {
    const baseWeights = { ...DEFAULT_WEIGHTS };

    switch (preset) {
      case 'strict':
        return {
          plugins: {},
          dimensions: {
            completeness: 1.5,
            correctness: 2.0,
            maintainability: 1.2,
            performance: 0.8,
            security: 1.8
          }
        };

      case 'balanced':
        return {
          plugins: {},
          dimensions: {
            completeness: 1.0,
            correctness: 1.2,
            maintainability: 1.0,
            performance: 0.8,
            security: 1.0
          }
        };

      case 'performance':
        return {
          plugins: {},
          dimensions: {
            completeness: 0.8,
            correctness: 1.2,
            maintainability: 1.3,
            performance: 1.5,
            security: 1.0
          }
        };

      case 'legacy':
        return {
          plugins: {},
          dimensions: {
            completeness: 1.2,
            correctness: 1.0,
            maintainability: 0.6,
            performance: 0.4,
            security: 0.8
          }
        };

      default:
        return baseWeights;
    }
  }

  /**
   * 重み設定の統計情報を生成
   * @param weights 重み設定
   * @returns 統計情報
   */
  generateWeightStats(weights: WeightConfig): {
    pluginWeightStats: {
      count: number;
      average: number;
      max: number;
      min: number;
    };
    dimensionWeightStats: {
      average: number;
      max: number;
      min: number;
      balance: number; // 0-1、1に近いほどバランスが良い
    };
    fileTypeCount: number;
  } {
    // プラグイン重み統計
    const pluginWeights = Object.values(weights.plugins);
    const pluginStats = {
      count: pluginWeights.length,
      average: pluginWeights.length > 0 ? pluginWeights.reduce((sum, w) => sum + w, 0) / pluginWeights.length : 0,
      max: pluginWeights.length > 0 ? Math.max(...pluginWeights) : 0,
      min: pluginWeights.length > 0 ? Math.min(...pluginWeights) : 0
    };

    // ディメンション重み統計
    const dimensionWeights = Object.values(weights.dimensions);
    const dimensionAvg = dimensionWeights.reduce((sum, w) => sum + w, 0) / dimensionWeights.length;
    const dimensionMax = Math.max(...dimensionWeights);
    const dimensionMin = Math.min(...dimensionWeights);
    
    // バランス指標：標準偏差の逆数（正規化）
    const variance = dimensionWeights.reduce((sum, w) => sum + Math.pow(w - dimensionAvg, 2), 0) / dimensionWeights.length;
    const stdDev = Math.sqrt(variance);
    const balance = Math.max(0, 1 - (stdDev / dimensionAvg));

    return {
      pluginWeightStats: pluginStats,
      dimensionWeightStats: {
        average: dimensionAvg,
        max: dimensionMax,
        min: dimensionMin,
        balance
      },
      fileTypeCount: weights.fileTypes ? Object.keys(weights.fileTypes).length : 0
    };
  }

  // === プライベートメソッド ===

  /**
   * 設定ファイルを検索
   */
  private async findConfigFile(startDir: string): Promise<string | null> {
    let currentDir = path.resolve(startDir);
    const rootDir = path.parse(currentDir).root;

    while (currentDir !== rootDir) {
      for (const filename of WeightsManager.CONFIG_FILENAMES) {
        const configPath = path.join(currentDir, filename);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * ユーザー設定をデフォルト値とマージ
   */
  private mergeWithDefaults(userWeights: Partial<WeightConfig>): WeightConfig {
    const merged: WeightConfig = {
      plugins: { ...DEFAULT_WEIGHTS.plugins },
      dimensions: { ...DEFAULT_WEIGHTS.dimensions },
      fileTypes: { ...DEFAULT_WEIGHTS.fileTypes }
    };

    // プラグイン重みのマージ
    if (userWeights.plugins) {
      for (const [pluginId, weight] of Object.entries(userWeights.plugins)) {
        if (typeof weight === 'number' && weight > 0) {
          merged.plugins[pluginId] = weight;
        }
      }
    }

    // ディメンション重みのマージ
    if (userWeights.dimensions) {
      for (const [dimension, weight] of Object.entries(userWeights.dimensions)) {
        if (typeof weight === 'number' && weight > 0) {
          merged.dimensions[dimension as DimensionType] = weight;
        }
      }
    }

    // ファイルタイプ重みのマージ
    if (userWeights.fileTypes) {
      merged.fileTypes = { ...merged.fileTypes };
      for (const [pattern, weight] of Object.entries(userWeights.fileTypes)) {
        if (typeof weight === 'number' && weight > 0) {
          merged.fileTypes[pattern] = weight;
        }
      }
    }

    return merged;
  }
}