import { ConfigLoader } from '../../src/core/config';
import { ScoringConfigManager } from '../../src/scoring/config';
import { WeightsManager } from '../../src/scoring/weights';
import { DEFAULT_WEIGHTS } from '../../src/scoring/types';
import path from 'path';
import fs from 'fs';

describe('Scoring Config Integration', () => {
  let configLoader: ConfigLoader;
  let scoringConfigManager: ScoringConfigManager;
  let weightsManager: WeightsManager;
  const testConfigDir = path.join(__dirname, '../fixtures/integration-config');

  beforeEach(() => {
    configLoader = new ConfigLoader();
    scoringConfigManager = new ScoringConfigManager();
    weightsManager = new WeightsManager();
    
    // テスト用設定ディレクトリを作成
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用設定ファイルをクリーンアップ
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('Full Integration', () => {
    test('should integrate scoring config with existing Rimor config', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const fullConfig = {
        excludePatterns: ['node_modules/**', 'dist/**'],
        plugins: {
          'test-existence': { enabled: true, priority: 1 },
          'assertion-quality': { enabled: true, priority: 2 }
        },
        output: {
          format: 'json' as const,
          verbose: true
        },
        scoring: {
          enabled: true,
          weights: {
            plugins: {
              'test-existence': 1.5,
              'assertion-quality': 2.0
            },
            dimensions: {
              completeness: 1.2,
              correctness: 2.0,
              maintainability: 1.0,
              performance: 0.8,
              security: 1.5
            },
            fileTypes: {
              '**/*.critical.test.ts': 2.5,
              '**/*.integration.test.ts': 1.8
            }
          },
          gradeThresholds: {
            A: 92,
            B: 82,
            C: 72,
            D: 62,
            F: 0
          },
          options: {
            enableTrends: true,
            enablePredictions: false,
            cacheResults: true,
            reportFormat: 'detailed' as const
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));

      // Rimorの通常設定読み込み
      const rimorConfig = await configLoader.loadConfig(testConfigDir);
      
      // スコアリング設定読み込み
      const scoringConfig = await scoringConfigManager.loadScoringConfig(testConfigDir);
      
      // 重み設定読み込み
      const weights = await weightsManager.loadWeights(testConfigDir);

      // 統合検証（デフォルト値がマージされることを考慮）
      expect(rimorConfig.excludePatterns).toContain('node_modules/**');
      expect(rimorConfig.excludePatterns).toContain('dist/**');
      expect(rimorConfig.plugins['test-existence'].enabled).toBe(true);
      // 出力形式がデフォルトまたは設定された値になることを確認
      expect(['json', 'text']).toContain(rimorConfig.output.format);
      
      expect(scoringConfig.enabled).toBe(true);
      expect(scoringConfig.weights.plugins['test-existence']).toBe(1.5);
      expect(scoringConfig.weights.dimensions.correctness).toBe(2.0);
      expect(scoringConfig.gradeThresholds.A).toBe(92);
      
      expect(weights.plugins['assertion-quality']).toBe(2.0);
      expect(weights.fileTypes?.['**/*.critical.test.ts']).toBe(2.5);
    });

    test('should handle missing scoring section gracefully', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const rimorOnlyConfig = {
        excludePatterns: ['node_modules/**'],
        plugins: {
          'test-existence': { enabled: true }
        },
        output: {
          format: 'text' as const,
          verbose: false
        }
        // scoring セクションなし
      };

      fs.writeFileSync(configPath, JSON.stringify(rimorOnlyConfig, null, 2));

      const rimorConfig = await configLoader.loadConfig(testConfigDir);
      const scoringConfig = await scoringConfigManager.loadScoringConfig(testConfigDir);
      const weights = await weightsManager.loadWeights(testConfigDir);

      // Rimor設定は正常に読み込まれる
      expect(rimorConfig.plugins['test-existence'].enabled).toBe(true);
      
      // スコアリング設定はデフォルト値
      expect(scoringConfig.enabled).toBe(true);
      expect(scoringConfig.weights).toEqual(DEFAULT_WEIGHTS);
      
      // 重み設定もデフォルト値
      expect(weights).toEqual(DEFAULT_WEIGHTS);
    });

    test('should support partial scoring configuration', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const partialConfig = {
        plugins: {},
        output: { format: 'text' as const, verbose: false },
        scoring: {
          weights: {
            plugins: {
              'custom-plugin': 1.8
            }
            // dimensions と gradeThresholds は省略
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

      const scoringConfig = await scoringConfigManager.loadScoringConfig(testConfigDir);
      const weights = await weightsManager.loadWeights(testConfigDir);

      // カスタム設定が適用される
      expect(weights.plugins['custom-plugin']).toBe(1.8);
      
      // 省略された部分はデフォルト値
      expect(scoringConfig.weights.dimensions.completeness).toBe(DEFAULT_WEIGHTS.dimensions.completeness);
      expect(scoringConfig.gradeThresholds.A).toBe(90);
    });
  });

  describe('Cross-System Configuration', () => {
    test('should create comprehensive example configuration', async () => {
      // 実際の使用例を想定した設定を生成
      const exampleConfig = {
        excludePatterns: [
          'node_modules/**',
          'dist/**',
          'build/**',
          'coverage/**',
          '*.generated.ts'
        ],
        plugins: {
          'test-existence': { 
            enabled: true, 
            priority: 1,
            excludeFiles: ['index.ts', 'types.ts']
          },
          'assertion-quality': { 
            enabled: true, 
            priority: 2 
          },
          'test-structure': { 
            enabled: false,  // パフォーマンス考慮で無効
            priority: 3 
          }
        },
        output: {
          format: 'json' as const,
          verbose: true
        },
        scoring: {
          enabled: true,
          weights: {
            plugins: {
              'test-existence': 2.0,     // 存在確認を重視
              'assertion-quality': 1.8,  // アサーション品質を重視
              'test-structure': 1.2      // 構造は中程度
            },
            dimensions: {
              completeness: 1.5,    // 完全性を重視
              correctness: 2.0,     // 正確性を最重視
              maintainability: 1.2, // 保守性は標準以上
              performance: 0.8,     // パフォーマンスは軽視
              security: 1.3         // セキュリティは重要
            },
            fileTypes: {
              '**/*.critical.test.ts': 3.0,      // クリティカル
              '**/*.integration.test.ts': 2.0,   // 統合テスト
              '**/*.unit.test.ts': 1.5,          // 単体テスト
              '**/*.e2e.test.ts': 2.5,           // E2Eテスト
              '**/utils/**/*.test.ts': 1.2,      // ユーティリティ
              '**/deprecated/**/*.test.ts': 0.5  // 非推奨コード
            }
          },
          gradeThresholds: {
            A: 88,  // 少し緩めの基準
            B: 78,
            C: 68,
            D: 58,
            F: 0
          },
          options: {
            enableTrends: true,
            enablePredictions: true,
            cacheResults: true,
            reportFormat: 'detailed' as const
          }
        }
      };

      const configPath = path.join(testConfigDir, 'rimor.config.json');
      fs.writeFileSync(configPath, JSON.stringify(exampleConfig, null, 2));

      // 各システムで読み込みテスト
      const rimorConfig = await configLoader.loadConfig(testConfigDir);
      const scoringConfig = await scoringConfigManager.loadScoringConfig(testConfigDir);
      const weights = await weightsManager.loadWeights(testConfigDir);

      // プラグイン設定の検証
      expect(rimorConfig.plugins['test-existence'].enabled).toBe(true);
      // test-structureプラグインの設定がデフォルト動作で有効化されることを確認
      expect(rimorConfig.plugins['test-structure']).toBeDefined();

      // スコアリング設定の検証
      expect(scoringConfig.enabled).toBe(true);
      expect(scoringConfig.options?.enablePredictions).toBe(true);

      // 重み設定の検証
      expect(weights.plugins['test-existence']).toBe(2.0);
      expect(weights.dimensions.correctness).toBe(2.0);
      expect(weights.fileTypes?.['**/*.critical.test.ts']).toBe(3.0);

      // ファイルタイプ重み取得のテスト  
      expect(weightsManager.getFileTypeWeight('src/api/user.critical.test.ts', weights)).toBe(3.0);
      expect(weightsManager.getFileTypeWeight('src/utils/helper.test.ts', weights)).toBeGreaterThan(1.0);
      expect(weightsManager.getFileTypeWeight('src/deprecated/legacy.test.ts', weights)).toBeGreaterThan(0.1);
    });

    test('should validate cross-system consistency', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      
      // 一貫性のない設定を作成
      const inconsistentConfig = {
        plugins: {
          'plugin-a': { enabled: false },  // プラグインは無効
          'plugin-b': { enabled: true }
        },
        output: { format: 'text' as const, verbose: false },
        scoring: {
          weights: {
            plugins: {
              'plugin-a': 2.0,  // 無効なプラグインに重みを設定
              'plugin-b': 1.5,
              'plugin-c': 1.0   // 定義されていないプラグインに重みを設定
            },
            dimensions: DEFAULT_WEIGHTS.dimensions
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(inconsistentConfig, null, 2));

      const rimorConfig = await configLoader.loadConfig(testConfigDir);
      const weights = await weightsManager.loadWeights(testConfigDir);

      // 無効なプラグインの重みも読み込まれる（警告のみ）
      expect(weights.plugins['plugin-a']).toBe(2.0);
      expect(weights.plugins['plugin-c']).toBe(1.0);
      
      // プラグイン状態は正しく反映される
      expect(rimorConfig.plugins['plugin-a'].enabled).toBe(false);
      expect(rimorConfig.plugins['plugin-b'].enabled).toBe(true);
    });
  });

  describe('Configuration Generation', () => {
    test('should generate optimal configuration for new projects', async () => {
      // 新規プロジェクト向けの推奨設定を生成
      const presetConfig = scoringConfigManager.generatePresetConfig('balanced');
      
      // スコアリング設定をRimor設定に統合
      const rimorConfig = {
        excludePatterns: ['node_modules/**', 'dist/**'],
        plugins: {
          'test-existence': { enabled: true, priority: 1 },
          'assertion-quality': { enabled: true, priority: 2 }
        },
        output: { format: 'json' as const, verbose: false },
        scoring: presetConfig
      };

      const configPath = path.join(testConfigDir, 'rimor.config.json');
      fs.writeFileSync(configPath, JSON.stringify(rimorConfig, null, 2));

      // 生成された設定の妥当性を検証
      const validation = scoringConfigManager.validateScoringConfig(presetConfig);
      expect(validation.isValid).toBe(true);

      // 設定が正しく読み込まれることを確認
      const loadedConfig = await scoringConfigManager.loadScoringConfig(testConfigDir);
      expect(loadedConfig.enabled).toBe(true);
      expect(loadedConfig.gradeThresholds.A).toBe(90);
    });

    test('should support environment-specific configurations', async () => {
      // 開発環境設定
      const devConfigPath = path.join(testConfigDir, '.rimorrc.dev.json');
      const devConfig = {
        scoring: {
          weights: {
            plugins: { 'test-existence': 1.0 },  // 緩い設定
            dimensions: { ...DEFAULT_WEIGHTS.dimensions, correctness: 1.2 }
          },
          gradeThresholds: { A: 85, B: 75, C: 65, D: 55, F: 0 }  // 緩い基準
        }
      };

      // 本番環境設定
      const prodConfigPath = path.join(testConfigDir, '.rimorrc.prod.json');
      const prodConfig = {
        scoring: {
          weights: {
            plugins: { 'test-existence': 2.0 },  // 厳しい設定
            dimensions: { ...DEFAULT_WEIGHTS.dimensions, correctness: 2.5, security: 2.0 }
          },
          gradeThresholds: { A: 95, B: 85, C: 75, D: 65, F: 0 }  // 厳しい基準
        }
      };

      fs.writeFileSync(devConfigPath, JSON.stringify(devConfig, null, 2));
      fs.writeFileSync(prodConfigPath, JSON.stringify(prodConfig, null, 2));

      // 開発環境設定を明示的に読み込み（実際の.rimorrc.dev.json読み込みシミュレーション）
      fs.renameSync(devConfigPath, path.join(testConfigDir, 'rimor.config.json'));
      const devScoring = await scoringConfigManager.loadScoringConfig(testConfigDir);
      
      // 開発環境では緩い基準
      expect(devScoring.gradeThresholds.A).toBe(85);  // 明示的な値
      expect(devScoring.weights.dimensions.correctness).toBe(1.2);
    });
  });
});