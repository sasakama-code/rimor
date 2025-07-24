import { WeightsManager } from '../../src/scoring/weights';
import { 
  WeightConfig, 
  DEFAULT_WEIGHTS,
  DimensionType
} from '../../src/scoring/types';
import { ConfigLoader } from '../../src/core/config';
import path from 'path';
import fs from 'fs';

describe('WeightsManager', () => {
  let weightsManager: WeightsManager;
  const testConfigDir = path.join(__dirname, '../fixtures/config');

  beforeEach(() => {
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

  describe('loadWeights', () => {
    test('should load default weights when no config file exists', async () => {
      const weights = await weightsManager.loadWeights('/nonexistent/path');
      
      expect(weights).toEqual(DEFAULT_WEIGHTS);
    });

    test('should load weights from valid config file', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const customConfig = {
        scoring: {
          weights: {
            plugins: {
              'test-existence': 2.0,
              'assertion-quality': 1.5
            },
            dimensions: {
              completeness: 2.0,
              correctness: 1.8,
              maintainability: 1.2,
              performance: 0.8,
              security: 1.0
            },
            fileTypes: {
              '*.critical.test.ts': 2.0,
              '*.integration.test.ts': 1.5
            }
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

      const weights = await weightsManager.loadWeights(testConfigDir);
      
      expect(weights.plugins['test-existence']).toBe(2.0);
      expect(weights.plugins['assertion-quality']).toBe(1.5);
      expect(weights.dimensions.completeness).toBe(2.0);
      expect(weights.dimensions.correctness).toBe(1.8);
      expect(weights.fileTypes?.['*.critical.test.ts']).toBe(2.0);
    });

    test('should merge custom weights with defaults', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const partialConfig = {
        scoring: {
          weights: {
            plugins: {
              'custom-plugin': 1.5
            },
            dimensions: {
              correctness: 2.0
              // 他のディメンションは指定しない
            }
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

      const weights = await weightsManager.loadWeights(testConfigDir);
      
      // カスタム設定が適用される
      expect(weights.plugins['custom-plugin']).toBe(1.5);
      expect(weights.dimensions.correctness).toBe(2.0);
      
      // デフォルト値が維持される
      expect(weights.dimensions.completeness).toBe(DEFAULT_WEIGHTS.dimensions.completeness);
      expect(weights.dimensions.maintainability).toBe(DEFAULT_WEIGHTS.dimensions.maintainability);
    });

    test('should handle invalid config file gracefully', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      fs.writeFileSync(configPath, 'invalid json content');

      const weights = await weightsManager.loadWeights(testConfigDir);
      
      expect(weights).toEqual(DEFAULT_WEIGHTS);
    });

    test('should validate weight values and reject invalid ones', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const invalidConfig = {
        scoring: {
          weights: {
            plugins: {
              'invalid-plugin': -1.0, // 負の値は無効
              'zero-plugin': 0,       // ゼロは無効
              'valid-plugin': 1.5
            },
            dimensions: {
              completeness: -0.5, // 負の値は無効
              correctness: 1.5
            }
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      const weights = await weightsManager.loadWeights(testConfigDir);
      
      // 有効な値のみ適用される
      expect(weights.plugins['valid-plugin']).toBe(1.5);
      expect(weights.dimensions.correctness).toBe(1.5);
      
      // 無効な値はデフォルトが使用される
      expect(weights.plugins['invalid-plugin']).toBeUndefined();
      expect(weights.plugins['zero-plugin']).toBeUndefined();
      expect(weights.dimensions.completeness).toBe(DEFAULT_WEIGHTS.dimensions.completeness);
    });
  });

  describe('saveWeights', () => {
    test('should save weights to config file', async () => {
      const customWeights: WeightConfig = {
        plugins: {
          'test-plugin': 1.5,
          'another-plugin': 2.0
        },
        dimensions: {
          completeness: 1.2,
          correctness: 1.8,
          maintainability: 1.0,
          performance: 0.6,
          security: 1.4
        },
        fileTypes: {
          '*.important.test.ts': 2.0
        }
      };

      await weightsManager.saveWeights(testConfigDir, customWeights);

      const configPath = path.join(testConfigDir, 'rimor.config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(savedConfig.scoring.weights).toEqual(customWeights);
    });

    test('should merge with existing config file', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const existingConfig = {
        excludePatterns: ['node_modules/**'],
        plugins: {
          'test-existence': { enabled: true }
        },
        output: {
          format: 'json' as const
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));

      const newWeights: WeightConfig = {
        plugins: { 'new-plugin': 1.5 },
        dimensions: {
          completeness: 1.1,
          correctness: 1.2,
          maintainability: 1.3,
          performance: 1.4,
          security: 1.5
        }
      };

      await weightsManager.saveWeights(testConfigDir, newWeights);

      const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // 既存設定が保持される
      expect(updatedConfig.excludePatterns).toEqual(existingConfig.excludePatterns);
      expect(updatedConfig.plugins).toEqual(existingConfig.plugins);
      expect(updatedConfig.output).toEqual(existingConfig.output);
      
      // 重み設定が追加される
      expect(updatedConfig.scoring.weights).toEqual(newWeights);
    });
  });

  describe('getFileTypeWeight', () => {
    test('should return weight for matching file pattern', () => {
      const weights: WeightConfig = {
        plugins: {},
        dimensions: DEFAULT_WEIGHTS.dimensions,
        fileTypes: {
          '**/*critical*.test.ts': 2.0,
          '**/*integration*.test.ts': 1.5,
          '**/important/**/*.test.ts': 1.8
        }
      };

      expect(weightsManager.getFileTypeWeight('src/api/critical.test.ts', weights)).toBe(2.0);
      expect(weightsManager.getFileTypeWeight('test/integration.test.ts', weights)).toBe(1.5);
      expect(weightsManager.getFileTypeWeight('src/important/user.test.ts', weights)).toBe(1.8);
      expect(weightsManager.getFileTypeWeight('src/normal.test.ts', weights)).toBe(1.0); // デフォルト
    });

    test('should handle multiple matching patterns and return highest weight', () => {
      const weights: WeightConfig = {
        plugins: {},
        dimensions: DEFAULT_WEIGHTS.dimensions,
        fileTypes: {
          '**/*.test.ts': 1.2,
          '**/*critical*': 2.0,
          '**/important/**/*': 1.5
        }
      };

      // 複数パターンにマッチする場合は最大重みを返す
      expect(weightsManager.getFileTypeWeight('src/important/critical.test.ts', weights)).toBe(2.0);
    });

    test('should return default weight when no patterns match', () => {
      const weights: WeightConfig = {
        plugins: {},
        dimensions: DEFAULT_WEIGHTS.dimensions,
        fileTypes: {
          '*.special.test.ts': 2.0
        }
      };

      expect(weightsManager.getFileTypeWeight('src/normal.test.ts', weights)).toBe(1.0);
    });
  });

  describe('validateWeights', () => {
    test('should validate correct weight configuration', () => {
      const validWeights: WeightConfig = {
        plugins: {
          'test-plugin': 1.5,
          'another-plugin': 0.8
        },
        dimensions: {
          completeness: 1.0,
          correctness: 2.0,
          maintainability: 0.5,
          performance: 0.3,
          security: 1.2
        },
        fileTypes: {
          '*.test.ts': 1.1
        }
      };

      const result = weightsManager.validateWeights(validWeights);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid plugin weights', () => {
      const invalidWeights: WeightConfig = {
        plugins: {
          'negative-plugin': -1.0,
          'zero-plugin': 0,
          'valid-plugin': 1.5
        },
        dimensions: DEFAULT_WEIGHTS.dimensions
      };

      const result = weightsManager.validateWeights(invalidWeights);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('プラグイン重み "negative-plugin" は正の値である必要があります');
      expect(result.errors).toContain('プラグイン重み "zero-plugin" は正の値である必要があります');
    });

    test('should detect invalid dimension weights', () => {
      const invalidWeights: WeightConfig = {
        plugins: {},
        dimensions: {
          completeness: -0.5,
          correctness: 0,
          maintainability: 1.0,
          performance: 1.0,
          security: 1.0
        }
      };

      const result = weightsManager.validateWeights(invalidWeights);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ディメンション重み "completeness" は正の値である必要があります');
      expect(result.errors).toContain('ディメンション重み "correctness" は正の値である必要があります');
    });

    test('should detect missing required dimensions', () => {
      const incompleteWeights: WeightConfig = {
        plugins: {},
        dimensions: {
          completeness: 1.0,
          correctness: 1.0
          // maintainability, performance, security が不足
        } as any
      };

      const result = weightsManager.validateWeights(incompleteWeights);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('maintainability'))).toBe(true);
      expect(result.errors.some(error => error.includes('performance'))).toBe(true);
      expect(result.errors.some(error => error.includes('security'))).toBe(true);
    });

    test('should provide helpful warnings for extreme weights', () => {
      const extremeWeights: WeightConfig = {
        plugins: {
          'high-plugin': 10.0,  // 非常に高い
          'low-plugin': 0.01    // 非常に低い
        },
        dimensions: {
          completeness: 0.05,   // 非常に低い
          correctness: 15.0,    // 非常に高い
          maintainability: 1.0,
          performance: 1.0,
          security: 1.0
        }
      };

      const result = weightsManager.validateWeights(extremeWeights);
      
      expect(result.isValid).toBe(true); // 技術的には有効
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning => warning.includes('高すぎる可能性'))).toBe(true);
      expect(result.warnings.some(warning => warning.includes('低すぎる可能性'))).toBe(true);
    });
  });

  describe('getOptimizedWeights', () => {
    test('should suggest optimized weights based on project analysis', async () => {
      const projectStats = {
        totalFiles: 100,
        pluginUsage: {
          'test-existence': 0.9,    // 90%のファイルで実行
          'assertion-quality': 0.7, // 70%のファイルで実行
          'test-structure': 0.3     // 30%のファイルで実行
        },
        dimensionImportance: {
          completeness: 0.8,
          correctness: 0.9,
          maintainability: 0.6,
          performance: 0.4,
          security: 0.5
        }
      };

      const optimized = await weightsManager.getOptimizedWeights(projectStats);
      
      // 使用頻度の高いプラグインの重みが高くなることを確認
      expect(optimized.plugins['test-existence']).toBeGreaterThan(optimized.plugins['test-structure']);
      
      // 重要度の高いディメンションの重みが高くなることを確認
      expect(optimized.dimensions.correctness).toBeGreaterThan(optimized.dimensions.performance);
      expect(optimized.dimensions.completeness).toBeGreaterThan(optimized.dimensions.maintainability);
    });

    test('should handle edge cases in project stats', async () => {
      const edgeStats = {
        totalFiles: 0,
        pluginUsage: {},
        dimensionImportance: {
          completeness: 0,
          correctness: 0,
          maintainability: 0,
          performance: 0,
          security: 0
        }
      };

      const optimized = await weightsManager.getOptimizedWeights(edgeStats);
      
      // エッジケースでもデフォルト値に近い適切な重みが返されることを確認
      expect(optimized.dimensions.correctness).toBeGreaterThan(0);
      expect(optimized.dimensions.completeness).toBeGreaterThan(0);
    });
  });

  describe('Integration with ConfigLoader', () => {
    test('should integrate with existing config system', async () => {
      const configPath = path.join(testConfigDir, 'rimor.config.json');
      const fullConfig = {
        excludePatterns: ['node_modules/**'],
        plugins: {
          'test-existence': { enabled: true }
        },
        output: {
          format: 'text' as const,
          verbose: false
        },
        scoring: {
          weights: {
            plugins: {
              'test-existence': 1.5
            },
            dimensions: {
              completeness: 1.2,
              correctness: 1.8,
              maintainability: 1.0,
              performance: 0.8,
              security: 1.1
            }
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));

      const weights = await weightsManager.loadWeights(testConfigDir);
      
      expect(weights.plugins['test-existence']).toBe(1.5);
      expect(weights.dimensions.correctness).toBe(1.8);
    });
  });
});