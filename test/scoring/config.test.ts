import { ScoringConfigManager } from '../../src/scoring/config';
import { DEFAULT_WEIGHTS } from '../../src/scoring/types';
import path from 'path';
import fs from 'fs';

describe('ScoringConfigManager', () => {
  let configManager: ScoringConfigManager;
  const testConfigDir = path.join(__dirname, '../fixtures/scoring-config');

  beforeEach(() => {
    configManager = new ScoringConfigManager();
    
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

  describe('loadScoringConfig', () => {
    test('should load default scoring config when no file exists', async () => {
      const config = await configManager.loadScoringConfig('/nonexistent/path');
      
      expect(config.weights).toEqual(DEFAULT_WEIGHTS);
      expect(config.enabled).toBe(true);
      expect(config.gradeThresholds).toBeDefined();
    });

    test('should load scoring config from rimor.config.json', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const rimorConfig = {
        excludePatterns: ['node_modules/**'],
        plugins: {},
        output: { format: 'text', verbose: false },
        scoring: {
          enabled: true,
          weights: {
            plugins: { 'test-plugin': 2.0 },
            dimensions: {
              completeness: 1.5,
              correctness: 2.0,
              maintainability: 1.0,
              performance: 0.5,
              security: 1.2
            }
          },
          gradeThresholds: {
            A: 95,
            B: 85,
            C: 75,
            D: 65,
            F: 0
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(rimorConfig, null, 2));

      const config = await configManager.loadScoringConfig(testConfigDir);
      
      expect(config.enabled).toBe(true);
      expect(config.weights.plugins['test-plugin']).toBe(2.0);
      expect(config.weights.dimensions.correctness).toBe(2.0);
      expect(config.gradeThresholds.A).toBe(95);
    });

    test('should handle multiple config file formats', async () => {
      // .rimorrc.json形式をテスト
      const configPath = path.join(testConfigDir, '.rimorrc.json');
      const config = {
        scoring: {
          weights: {
            plugins: { 'custom-plugin': 1.8 },
            dimensions: DEFAULT_WEIGHTS.dimensions
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = await configManager.loadScoringConfig(testConfigDir);
      
      expect(result.weights.plugins['custom-plugin']).toBe(1.8);
    });

    test('should validate and sanitize invalid config values', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const invalidConfig = {
        scoring: {
          weights: {
            plugins: {
              'valid-plugin': 1.5,
              'invalid-plugin': -1.0,  // 無効な負の値
              'zero-plugin': 0         // 無効なゼロ値
            },
            dimensions: {
              completeness: 2.0,
              correctness: -0.5,       // 無効な負の値
              maintainability: 1.0,
              performance: 0,          // 無効なゼロ値
              security: 1.0
            }
          },
          gradeThresholds: {
            A: 110,  // 無効な範囲外値
            B: 80,
            C: 70,
            D: 60,
            F: -10   // 無効な負の値
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      const config = await configManager.loadScoringConfig(testConfigDir);
      
      // 有効な値のみ適用される
      expect(config.weights.plugins['valid-plugin']).toBe(1.5);
      expect(config.weights.dimensions.completeness).toBe(2.0);
      expect(config.weights.dimensions.maintainability).toBe(1.0);
      
      // 無効な値はデフォルトが使用される
      expect(config.weights.plugins['invalid-plugin']).toBeUndefined();
      expect(config.weights.plugins['zero-plugin']).toBeUndefined();
      expect(config.weights.dimensions.correctness).toBe(DEFAULT_WEIGHTS.dimensions.correctness);
      expect(config.weights.dimensions.performance).toBe(DEFAULT_WEIGHTS.dimensions.performance);
      
      // グレード閾値の検証
      expect(config.gradeThresholds.A).toBe(100); // 上限でクランプ
      expect(config.gradeThresholds.F).toBe(0);   // 下限でクランプ
    });
  });

  describe('saveScoringConfig', () => {
    test('should save scoring config to rimor.config.json', async () => {
      const scoringConfig = {
        enabled: true,
        weights: {
          plugins: { 'new-plugin': 1.7 },
          dimensions: {
            completeness: 1.3,
            correctness: 1.9,
            maintainability: 1.1,
            performance: 0.7,
            security: 1.4
          }
        },
        gradeThresholds: {
          A: 92,
          B: 82,
          C: 72,
          D: 62,
          F: 0
        }
      };

      await configManager.saveScoringConfig(testConfigDir, scoringConfig);

      const configPath = path.join(testConfigDir, 'rimor.config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(savedConfig.scoring).toEqual(scoringConfig);
    });

    test('should merge with existing rimor.config.json', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const existingConfig = {
        excludePatterns: ['dist/**'],
        plugins: {
          'existing-plugin': { enabled: true }
        },
        output: { format: 'json', verbose: true }
      };

      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));

      const newScoringConfig = {
        enabled: true,
        weights: DEFAULT_WEIGHTS,
        gradeThresholds: { A: 90, B: 80, C: 70, D: 60, F: 0 }
      };

      await configManager.saveScoringConfig(testConfigDir, newScoringConfig);

      const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // 既存設定が保持される
      expect(updatedConfig.excludePatterns).toEqual(existingConfig.excludePatterns);
      expect(updatedConfig.plugins).toEqual(existingConfig.plugins);
      expect(updatedConfig.output).toEqual(existingConfig.output);
      
      // スコアリング設定が追加される
      expect(updatedConfig.scoring).toEqual(newScoringConfig);
    });
  });

  describe('generatePresetConfig', () => {
    test('should generate strict preset configuration', () => {
      const strict = configManager.generatePresetConfig('strict');
      
      expect(strict.weights.dimensions.correctness).toBeGreaterThan(DEFAULT_WEIGHTS.dimensions.correctness);
      expect(strict.weights.dimensions.security).toBeGreaterThan(DEFAULT_WEIGHTS.dimensions.security);
      expect(strict.gradeThresholds.A).toBeGreaterThan(90);
      expect(strict.gradeThresholds.C).toBeGreaterThan(70);
    });

    test('should generate balanced preset configuration', () => {
      const balanced = configManager.generatePresetConfig('balanced');
      
      // バランス型は全体的に均等な重み
      const dimensions = balanced.weights.dimensions;
      const values = Object.values(dimensions);
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      expect(max / min).toBeLessThan(2.0); // 最大と最小の比率が2未満
      expect(balanced.gradeThresholds).toEqual({
        A: 90, B: 80, C: 70, D: 60, F: 0
      });
    });

    test('should generate performance preset configuration', () => {
      const performance = configManager.generatePresetConfig('performance');
      
      expect(performance.weights.dimensions.performance).toBeGreaterThan(DEFAULT_WEIGHTS.dimensions.performance);
      expect(performance.weights.dimensions.maintainability).toBeGreaterThan(DEFAULT_WEIGHTS.dimensions.maintainability);
      // パフォーマンス重視では一部の重みが軽くなる
      expect(performance.weights.dimensions.completeness).toBeLessThanOrEqual(DEFAULT_WEIGHTS.dimensions.completeness);
    });

    test('should generate legacy preset configuration', () => {
      const legacy = configManager.generatePresetConfig('legacy');
      
      // レガシープロジェクト向けは基準が緩い
      expect(legacy.gradeThresholds.A).toBeLessThan(90);
      expect(legacy.gradeThresholds.C).toBeLessThan(70);
      expect(legacy.weights.dimensions.maintainability).toBeLessThan(DEFAULT_WEIGHTS.dimensions.maintainability);
    });

    test('should handle unknown preset by returning default', () => {
      const unknown = configManager.generatePresetConfig('unknown' as any);
      
      expect(unknown.weights).toEqual(DEFAULT_WEIGHTS);
      expect(unknown.gradeThresholds).toEqual({
        A: 90, B: 80, C: 70, D: 60, F: 0
      });
    });
  });

  describe('validateScoringConfig', () => {
    test('should validate complete and correct configuration', () => {
      const validConfig = {
        enabled: true,
        weights: {
          plugins: { 'test-plugin': 1.5 },
          dimensions: {
            completeness: 1.0,
            correctness: 1.5,
            maintainability: 0.8,
            performance: 0.6,
            security: 1.2
          }
        },
        gradeThresholds: {
          A: 90, B: 82, C: 74, D: 66, F: 0  // より均等な間隔
        }
      };

      const result = configManager.validateScoringConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // 警告があっても構わない（最適化提案等）
    });

    test('should detect invalid grade thresholds order', () => {
      const invalidConfig = {
        enabled: true,
        weights: DEFAULT_WEIGHTS,
        gradeThresholds: {
          A: 85,  // A < B は無効
          B: 90,
          C: 70,
          D: 60,
          F: 0
        }
      };

      const result = configManager.validateScoringConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('グレード閾値の順序'))).toBe(true);
    });

    test('should detect missing required fields', () => {
      const incompleteConfig = {
        enabled: true,
        weights: {
          plugins: {},
          dimensions: {
            completeness: 1.0
            // 他のディメンションが不足
          }
        }
        // gradeThresholdsが不足
      } as any;

      const result = configManager.validateScoringConfig(incompleteConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide optimization suggestions', () => {
      const suboptimalConfig = {
        enabled: true,
        weights: {
          plugins: {},
          dimensions: {
            completeness: 0.1,  // 非常に低い
            correctness: 10.0,  // 非常に高い
            maintainability: 1.0,
            performance: 1.0,
            security: 1.0
          }
        },
        gradeThresholds: {
          A: 95,  // 非常に厳しい
          B: 94,  // 範囲が狭い
          C: 70,
          D: 60,
          F: 0
        }
      };

      const result = configManager.validateScoringConfig(suboptimalConfig);
      
      expect(result.isValid).toBe(true); // 技術的には有効
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('migrateFromLegacyConfig', () => {
    test('should migrate from old config format', () => {
      const legacyConfig = {
        plugins: {
          'test-existence': { 
            enabled: true, 
            weight: 2.0 
          },
          'assertion-quality': { 
            enabled: true, 
            weight: 1.5 
          }
        },
        quality: {
          strictMode: true,
          thresholds: {
            excellent: 95,
            good: 85,
            acceptable: 75,
            poor: 65
          }
        }
      };

      const migrated = configManager.migrateFromLegacyConfig(legacyConfig);
      
      expect(migrated.weights.plugins['test-existence']).toBe(2.0);
      expect(migrated.weights.plugins['assertion-quality']).toBe(1.5);
      expect(migrated.gradeThresholds.A).toBe(95);
      expect(migrated.gradeThresholds.B).toBe(85);
      expect(migrated.gradeThresholds.C).toBe(75);
      expect(migrated.gradeThresholds.D).toBe(65);
    });

    test('should handle partial legacy config', () => {
      const partialLegacy = {
        plugins: {
          'some-plugin': { weight: 1.8 }
        }
        // quality設定なし
      };

      const migrated = configManager.migrateFromLegacyConfig(partialLegacy);
      
      expect(migrated.weights.plugins['some-plugin']).toBe(1.8);
      // デフォルト値が他の部分に適用される
      expect(migrated.gradeThresholds.A).toBe(90);
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end with config loading and saving', async () => {
      // 1. プリセット設定を生成
      const strictConfig = configManager.generatePresetConfig('strict');
      
      // 2. 設定を保存
      await configManager.saveScoringConfig(testConfigDir, strictConfig);
      
      // 3. 設定を読み込み
      const loadedConfig = await configManager.loadScoringConfig(testConfigDir);
      
      // 4. 設定が正しく保存・読み込みされることを確認
      expect(loadedConfig.weights.dimensions.correctness)
        .toBeCloseTo(strictConfig.weights.dimensions.correctness, 2);
      expect(loadedConfig.gradeThresholds).toEqual(strictConfig.gradeThresholds);
    });

    test('should handle config evolution gracefully', async () => {
      // 古いバージョンの設定ファイルを作成
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const oldVersionConfig = {
        version: '0.2.0',
        plugins: {},
        output: { format: 'text' },
        // scoring セクションなし
      };

      fs.writeFileSync(configPath, JSON.stringify(oldVersionConfig, null, 2));

      // 新しい設定システムで読み込み
      const config = await configManager.loadScoringConfig(testConfigDir);
      
      // デフォルト値で補完されることを確認
      expect(config.weights).toEqual(DEFAULT_WEIGHTS);
      expect(config.enabled).toBe(true);
    });
  });
});