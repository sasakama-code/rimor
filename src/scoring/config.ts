import { 
  WeightConfig, 
  DEFAULT_WEIGHTS,
  GRADE_THRESHOLDS,
  GradeType
} from './types';
import { WeightsManager } from './weights';
import fs from 'fs';
import path from 'path';

/**
 * スコアリング設定の完全な構造
 */
export interface ScoringConfig {
  enabled: boolean;
  weights: WeightConfig;
  gradeThresholds: Record<GradeType, number>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}

/**
 * 設定バリデーション結果
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * スコアリング設定管理システム
 * rimor.config.json との統合とスコアリング専用設定の管理
 */
export class ScoringConfigManager {
  private weightsManager: WeightsManager;

  constructor() {
    this.weightsManager = new WeightsManager();
  }

  /**
   * スコアリング設定を読み込み
   * @param configDir 設定ディレクトリ
   * @returns スコアリング設定
   */
  async loadScoringConfig(configDir: string): Promise<ScoringConfig> {
    try {
      // ディレクトリパスのセキュリティ検証
      if (!this.isSecurePath(configDir)) {
        // テスト環境では警告を抑制
        if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
          console.warn('設定ディレクトリのパスが安全でないため、デフォルト設定を使用します');
        }
        return this.getDefaultScoringConfig();
      }

      const configPath = await this.findConfigFile(configDir);
      
      if (!configPath) {
        return this.getDefaultScoringConfig();
      }

      // 設定ファイルパスのセキュリティ検証
      if (!this.isSecurePath(configPath)) {
        console.warn('設定ファイルのパスが安全でないため、デフォルト設定を使用します');
        return this.getDefaultScoringConfig();
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      
      // ファイルサイズ制限（1MB）
      if (configContent.length > 1024 * 1024) {
        console.warn('設定ファイルが大きすぎるため、デフォルト設定を使用します');
        return this.getDefaultScoringConfig();
      }

      const config = this.secureJsonParse(configContent);
      
      const scoringSection = config.scoring;
      
      if (!scoringSection) {
        return this.getDefaultScoringConfig();
      }

      return this.buildScoringConfig(scoringSection);
      
    } catch (error) {
      console.warn(`スコアリング設定の読み込みでエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      return this.getDefaultScoringConfig();
    }
  }

  /**
   * スコアリング設定を保存
   * @param configDir 設定ディレクトリ
   * @param scoringConfig スコアリング設定
   */
  async saveScoringConfig(configDir: string, scoringConfig: ScoringConfig): Promise<void> {
    // ディレクトリパスのセキュリティ検証
    if (!this.isSecurePath(configDir)) {
      throw new Error('設定ディレクトリのパスが安全ではありません');
    }

    const configPath = path.join(configDir, 'rimor.config.json');
    
    // 設定ファイルパスのセキュリティ検証
    if (!this.isSecurePath(configPath)) {
      throw new Error('設定ファイルのパスが安全ではありません');
    }

    // 設定の妥当性検証
    const validation = this.validateScoringConfig(scoringConfig);
    if (!validation.isValid) {
      throw new Error(`設定が無効です: ${validation.errors.join(', ')}`);
    }
    
    let existingConfig = {};
    
    // 既存の設定ファイルがある場合は読み込み
    if (fs.existsSync(configPath)) {
      try {
        const existingContent = fs.readFileSync(configPath, 'utf-8');
        
        // ファイルサイズ制限（1MB）
        if (existingContent.length > 1024 * 1024) {
          console.warn('既存設定ファイルが大きすぎるため、新規作成します');
          existingConfig = {};
        } else {
          existingConfig = this.secureJsonParse(existingContent);
        }
      } catch (error) {
        console.warn(`既存設定ファイルの読み込みでエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
        existingConfig = {};
      }
    }

    // スコアリング設定を統合
    const updatedConfig = {
      ...existingConfig,
      scoring: scoringConfig
    };

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // JSON出力のサイズ制限
    const configJson = JSON.stringify(updatedConfig, null, 2);
    if (configJson.length > 1024 * 1024) {
      throw new Error('設定ファイルが制限サイズを超過しています');
    }

    fs.writeFileSync(configPath, configJson);
  }

  /**
   * プリセット設定を生成
   * @param preset プリセット名
   * @returns プリセットスコアリング設定
   */
  generatePresetConfig(preset: 'strict' | 'balanced' | 'performance' | 'legacy'): ScoringConfig {
    const weights = this.weightsManager.generatePresetWeights(preset);
    
    const gradeThresholds = this.generatePresetGradeThresholds(preset);
    
    const options = this.generatePresetOptions(preset);

    return {
      enabled: true,
      weights,
      gradeThresholds,
      options
    };
  }

  /**
   * スコアリング設定の妥当性を検証
   * @param config スコアリング設定
   * @returns 検証結果
   */
  validateScoringConfig(config: ScoringConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 必須フィールドの確認
    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled フィールドはboolean型である必要があります');
    }

    if (!config.weights) {
      errors.push('weights フィールドが必要です');
    } else {
      // 重み設定の検証
      const weightValidation = this.weightsManager.validateWeights(config.weights);
      errors.push(...weightValidation.errors);
      warnings.push(...weightValidation.warnings);
      suggestions.push(...weightValidation.suggestions);
    }

    if (!config.gradeThresholds) {
      errors.push('gradeThresholds フィールドが必要です');
    } else {
      // グレード閾値の検証
      const gradeValidation = this.validateGradeThresholds(config.gradeThresholds);
      errors.push(...gradeValidation.errors);
      warnings.push(...gradeValidation.warnings);
      suggestions.push(...gradeValidation.suggestions);
    }

    // オプション設定の検証
    if (config.options) {
      const optionValidation = this.validateOptions(config.options);
      warnings.push(...optionValidation.warnings);
      suggestions.push(...optionValidation.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * レガシー設定から新設定への移行
   * @param legacyConfig レガシー設定
   * @returns 新しいスコアリング設定
   */
  migrateFromLegacyConfig(legacyConfig: any): ScoringConfig {
    const weights: WeightConfig = {
      plugins: {},
      dimensions: { ...DEFAULT_WEIGHTS.dimensions }
    };

    // レガシープラグイン設定の変換
    if (legacyConfig.plugins) {
      for (const [pluginId, pluginConfig] of Object.entries(legacyConfig.plugins)) {
        if (typeof pluginConfig === 'object' && (pluginConfig as any).weight) {
          weights.plugins[pluginId] = (pluginConfig as any).weight;
        }
      }
    }

    // レガシー品質設定の変換
    let gradeThresholds: Record<GradeType, number> = { ...GRADE_THRESHOLDS };
    
    if (legacyConfig.quality?.thresholds) {
      const legacy = legacyConfig.quality.thresholds;
      gradeThresholds = {
        A: legacy.excellent || 90,
        B: legacy.good || 80,
        C: legacy.acceptable || 70,
        D: legacy.poor || 60,
        F: 0
      };
    }

    // strictMode の変換
    if (legacyConfig.quality?.strictMode) {
      // 厳格モードの場合は重みを調整
      weights.dimensions.correctness *= 1.5;
      weights.dimensions.security *= 1.3;
      
      // 閾値も厳しく
      gradeThresholds.A = Math.max(gradeThresholds.A, 95) as any;
      gradeThresholds.B = Math.max(gradeThresholds.B, 85) as any;
    }

    return {
      enabled: true,
      weights,
      gradeThresholds,
      options: {
        enableTrends: false, // レガシーではトレンド機能なし
        enablePredictions: false,
        cacheResults: true,
        reportFormat: 'summary'
      }
    };
  }

  /**
   * 設定の最適化提案を生成
   * @param currentConfig 現在の設定
   * @param projectStats プロジェクト統計
   * @returns 最適化された設定
   */
  async generateOptimizedConfig(
    currentConfig: ScoringConfig,
    projectStats: {
      totalFiles: number;
      averageScore: number;
      pluginUsage: Record<string, number>;
      dimensionImportance: Record<string, number>;
      gradeDistribution: Record<GradeType, number>;
    }
  ): Promise<ScoringConfig> {
    // 重みの最適化
    const optimizedWeights = await this.weightsManager.getOptimizedWeights({
      totalFiles: projectStats.totalFiles,
      pluginUsage: projectStats.pluginUsage,
      dimensionImportance: projectStats.dimensionImportance as any
    });

    // グレード閾値の最適化
    const optimizedThresholds = this.optimizeGradeThresholds(
      currentConfig.gradeThresholds,
      projectStats.gradeDistribution,
      projectStats.averageScore
    );

    return {
      ...currentConfig,
      weights: optimizedWeights,
      gradeThresholds: optimizedThresholds
    };
  }

  // === プライベートメソッド ===

  /**
   * パス検証によるセキュリティチェック
   * パストラバーサル攻撃を防ぐための検証
   */
  private isSecurePath(inputPath: string): boolean {
    try {
      const resolvedPath = path.resolve(inputPath);
      const normalizedPath = path.normalize(inputPath);
      
      // パストラバーサル攻撃の検出
      if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
        return false;
      }
      
      // 絶対パスの制限（プロジェクトルート配下のみ許可）
      const cwd = process.cwd();
      if (!resolvedPath.startsWith(cwd)) {
        return false;
      }
      
      // 危険なファイル名パターンの検出
      const dangerousPatterns = [
        /\/etc\//, /\/proc\//, /\/sys\//, /\/dev\//,  // システムディレクトリ
        /\.\.\//, /~\//, /\$\{/, /\$\(/,             // シェル/環境変数
        /\x00/, /\x01-\x1f/                          // 制御文字
      ];
      
      return !dangerousPatterns.some(pattern => pattern.test(resolvedPath));
    } catch {
      return false;
    }
  }

  /**
   * JSON設定の安全な解析
   * セキュリティリスクのある値を検出・無害化
   */
  private secureJsonParse(content: string): any {
    try {
      // 基本的なJSON解析
      const parsed = JSON.parse(content);
      
      // オブジェクトでない場合は拒否
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('設定ファイルはオブジェクト形式である必要があります');
      }
      
      // 危険なプロパティの除去
      return this.sanitizeConfigObject(parsed);
    } catch (error) {
      throw new Error(`設定ファイルの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 設定オブジェクトの無害化
   */
  private sanitizeConfigObject(obj: any, depth = 0): any {
    // 循環参照・深すぎるネストの防止
    if (depth > 10) {
      throw new Error('設定ファイルの構造が複雑すぎます');
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }
    
    // 配列の処理
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeConfigObject(item, depth + 1));
    }
    
    const sanitized: any = {};
    const allowedKeys = new Set([
      'scoring', 'enabled', 'weights', 'gradeThresholds', 'options',
      'plugins', 'dimensions', 'enableTrends', 'enablePredictions',
      'cacheResults', 'reportFormat', 'A', 'B', 'C', 'D', 'F',
      'excludePatterns', 'output'
    ]);
    
    for (const [key, value] of Object.entries(obj)) {
      // キー名の検証
      if (typeof key !== 'string' || key.length > 100) {
        continue; // 危険なキーは無視
      }
      
      // 危険なキーパターンの検出
      if (key.startsWith('__') || key.includes('constructor') || key.includes('prototype')) {
        continue;
      }
      
      // 許可されたキーのみ処理（設定の文脈外では制限）
      if (depth === 0 || allowedKeys.has(key) || key.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
        sanitized[key] = this.sanitizeConfigObject(value, depth + 1);
      }
    }
    
    return sanitized;
  }

  /**
   * 値の無害化
   */
  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // 文字列長の制限
      if (value.length > 1000) {
        return value.substring(0, 1000);
      }
      
      // 危険なパターンの除去
      return value.replace(/[<>'"&\x00-\x1f]/g, '');
    }
    
    if (typeof value === 'number') {
      // 数値の範囲制限
      if (!Number.isFinite(value)) {
        return 0;
      }
      return Math.max(-10000, Math.min(10000, value));
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    // その他の型は無視
    return null;
  }

  /**
   * デフォルトスコアリング設定を取得
   */
  private getDefaultScoringConfig(): ScoringConfig {
    return {
      enabled: true,
      weights: DEFAULT_WEIGHTS,
      gradeThresholds: { ...GRADE_THRESHOLDS },
      options: {
        enableTrends: true,
        enablePredictions: false,
        cacheResults: true,
        reportFormat: 'detailed'
      }
    };
  }

  /**
   * 設定ファイルを検索
   */
  private async findConfigFile(startDir: string): Promise<string | null> {
    const configFilenames = ['rimor.config.json', '.rimorrc.json', '.rimorrc'];
    let currentDir = path.resolve(startDir);
    const rootDir = path.parse(currentDir).root;
    const projectRoot = process.cwd();

    // 最大検索階層を制限（無限ループ防止）
    let maxLevels = 10;

    while (currentDir !== rootDir && maxLevels > 0) {
      // セキュリティ: プロジェクトルート配下のみ検索
      if (!currentDir.startsWith(projectRoot)) {
        break;
      }

      for (const filename of configFilenames) {
        const configPath = path.join(currentDir, filename);
        
        // パスのセキュリティ検証
        if (this.isSecurePath(configPath) && fs.existsSync(configPath)) {
          // ファイルの基本チェック
          try {
            const stats = fs.statSync(configPath);
            // 通常ファイル・サイズ制限（1MB）・読み取り権限の確認
            if (stats.isFile() && stats.size < 1024 * 1024) {
              return configPath;
            }
          } catch (error) {
            // ファイル情報取得エラーは無視して次へ
            continue;
          }
        }
      }
      currentDir = path.dirname(currentDir);
      maxLevels--;
    }

    return null;
  }

  /**
   * 設定ファイルからスコアリング設定を構築
   */
  private buildScoringConfig(scoringSection: any): ScoringConfig {
    const config: ScoringConfig = {
      enabled: scoringSection.enabled !== false, // デフォルトtrue
      weights: DEFAULT_WEIGHTS,
      gradeThresholds: { ...GRADE_THRESHOLDS }
    };

    // 重み設定の処理
    if (scoringSection.weights) {
      config.weights = this.weightsManager['mergeWithDefaults'](scoringSection.weights);
    }

    // グレード閾値の処理
    if (scoringSection.gradeThresholds) {
      config.gradeThresholds = this.sanitizeGradeThresholds(scoringSection.gradeThresholds);
    }

    // オプション設定の処理
    if (scoringSection.options) {
      config.options = {
        enableTrends: scoringSection.options.enableTrends !== false,
        enablePredictions: scoringSection.options.enablePredictions === true,
        cacheResults: scoringSection.options.cacheResults !== false,
        reportFormat: scoringSection.options.reportFormat || 'detailed'
      };
    }

    return config;
  }

  /**
   * プリセット用グレード閾値を生成
   */
  private generatePresetGradeThresholds(preset: string): Record<GradeType, number> {
    switch (preset) {
      case 'strict':
        return { A: 95, B: 85, C: 75, D: 65, F: 0 };
      case 'balanced':
        return { A: 90, B: 80, C: 70, D: 60, F: 0 };
      case 'performance':
        return { A: 88, B: 78, C: 68, D: 58, F: 0 };
      case 'legacy':
        return { A: 85, B: 75, C: 65, D: 55, F: 0 };
      default:
        return { ...GRADE_THRESHOLDS };
    }
  }

  /**
   * プリセット用オプションを生成
   */
  private generatePresetOptions(preset: string): ScoringConfig['options'] {
    switch (preset) {
      case 'strict':
        return {
          enableTrends: true,
          enablePredictions: true,
          cacheResults: true,
          reportFormat: 'detailed'
        };
      case 'performance':
        return {
          enableTrends: false,
          enablePredictions: false,
          cacheResults: true,
          reportFormat: 'minimal'
        };
      case 'legacy':
        return {
          enableTrends: false,
          enablePredictions: false,
          cacheResults: false,
          reportFormat: 'summary'
        };
      default:
        return {
          enableTrends: true,
          enablePredictions: false,
          cacheResults: true,
          reportFormat: 'detailed'
        };
    }
  }

  /**
   * グレード閾値の妥当性を検証
   */
  private validateGradeThresholds(thresholds: Record<GradeType, number>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 必須グレードの確認
    const requiredGrades: GradeType[] = ['A', 'B', 'C', 'D', 'F'];
    for (const grade of requiredGrades) {
      if (!(grade in thresholds) || typeof thresholds[grade] !== 'number') {
        errors.push(`グレード "${grade}" の閾値が定義されていません`);
      }
    }

    if (errors.length === 0) {
      // 値の範囲確認
      for (const [grade, threshold] of Object.entries(thresholds)) {
        if (threshold < 0 || threshold > 100) {
          errors.push(`グレード "${grade}" の閾値 (${threshold}) は0-100の範囲である必要があります`);
        }
      }

      // 順序確認（A > B > C > D > F）
      if (thresholds.A <= thresholds.B || 
          thresholds.B <= thresholds.C || 
          thresholds.C <= thresholds.D || 
          thresholds.D <= thresholds.F) {
        errors.push('グレード閾値の順序が正しくありません (A > B > C > D > F である必要があります)');
      }

      // 間隔の警告
      const gaps = [
        thresholds.A - thresholds.B,
        thresholds.B - thresholds.C,
        thresholds.C - thresholds.D,
        thresholds.D - thresholds.F
      ];

      if (gaps.some(gap => gap < 5)) {
        warnings.push('グレード間の差が小さすぎる可能性があります（5点未満）');
        suggestions.push('グレード間により明確な差をつけることを検討してください');
      }

      if (gaps.some(gap => gap > 20)) {
        warnings.push('グレード間の差が大きすぎる可能性があります（20点超）');
        suggestions.push('グレード間の差をより均等にすることを検討してください');
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  /**
   * オプション設定の妥当性を検証
   */
  private validateOptions(options: ScoringConfig['options']): ConfigValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (options?.reportFormat && !['detailed', 'summary', 'minimal'].includes(options.reportFormat)) {
      warnings.push(`不明なレポート形式: ${options.reportFormat}`);
      suggestions.push('reportFormatは "detailed", "summary", "minimal" のいずれかを指定してください');
    }

    if (options?.enablePredictions && !options?.enableTrends) {
      warnings.push('予測機能を有効にする場合、トレンド機能も有効にすることをお勧めします');
    }

    return { isValid: true, errors: [], warnings, suggestions };
  }

  /**
   * グレード閾値を正常化
   */
  private sanitizeGradeThresholds(thresholds: any): Record<GradeType, number> {
    const sanitized: Record<GradeType, number> = { ...GRADE_THRESHOLDS };

    const grades: GradeType[] = ['A', 'B', 'C', 'D', 'F'];
    for (const grade of grades) {
      if (typeof thresholds[grade] === 'number') {
        sanitized[grade] = Math.max(0, Math.min(100, thresholds[grade]));
      }
    }

    return sanitized;
  }

  /**
   * グレード閾値を最適化
   */
  private optimizeGradeThresholds(
    current: Record<GradeType, number>,
    distribution: Record<GradeType, number>,
    averageScore: number
  ): Record<GradeType, number> {
    const optimized = { ...current };
    
    // 平均スコアに基づく調整
    if (averageScore > 85) {
      // 平均が高い場合は基準を厳しく
      optimized.A = Math.min(optimized.A + 2, 95);
      optimized.B = Math.min(optimized.B + 2, optimized.A - 5);
    } else if (averageScore < 70) {
      // 平均が低い場合は基準を緩く
      optimized.A = Math.max(optimized.A - 2, 85);
      optimized.B = Math.max(optimized.B - 2, optimized.A - 15);
    }

    // 分布に基づく調整（極端な偏りを修正）
    const totalFiles = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (totalFiles > 0) {
      const aRatio = distribution.A / totalFiles;
      const fRatio = distribution.F / totalFiles;

      if (aRatio > 0.5) {
        // A評価が多すぎる場合は基準を厳しく
        optimized.A += 3;
      } else if (fRatio > 0.3) {
        // F評価が多すぎる場合は基準を緩く
        optimized.A -= 2;
        optimized.B -= 2;
      }
    }

    return optimized;
  }
}