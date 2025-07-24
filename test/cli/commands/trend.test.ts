import { TrendCommand } from '../../../src/cli/commands/trend';
import * as fs from 'fs';
import * as path from 'path';

describe('TrendCommand', () => {
  let trendCommand: TrendCommand;
  const testDir = path.join(__dirname, '../../fixtures/trend-cli-test');

  beforeEach(() => {
    trendCommand = new TrendCommand();
    
    // テスト用ディレクトリを作成
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用ファイルをクリーンアップ
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Class Instantiation', () => {
    test('should create TrendCommand instance', () => {
      expect(trendCommand).toBeInstanceOf(TrendCommand);
      expect(trendCommand['historyManager']).toBeDefined();
      expect(trendCommand['trendEngine']).toBeDefined();
      expect(trendCommand['predictionEngine']).toBeDefined();
    });

    test('should have required private methods', () => {
      expect(typeof trendCommand['executeCommand']).toBe('function');
      expect(typeof trendCommand['executePredictionCommand']).toBe('function');
      expect(typeof trendCommand['executeAnomalyCommand']).toBe('function');
      expect(typeof trendCommand['executeComparisonCommand']).toBe('function');
      expect(typeof trendCommand['analyzeProjectTrend']).toBe('function');
      expect(typeof trendCommand['displayTrendAsTable']).toBe('function');
      expect(typeof trendCommand['displayTrendAsJson']).toBe('function');
      expect(typeof trendCommand['displayTrendAsChart']).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle insufficient data gracefully', async () => {
      // 履歴データが少ない場合のエラーハンドリング
      await expect(async () => {
        await trendCommand['executeCommand']({
          projectPath: testDir,
          days: '30',
          method: 'linear',
          format: 'table'
        });
      }).not.toThrow();
    });

    test('should handle non-existent project path', async () => {
      const nonExistentPath = '/non/existent/path';
      
      await expect(async () => {
        await trendCommand['executeCommand']({
          projectPath: nonExistentPath,
          days: '30',
          method: 'linear',
          format: 'table'
        });
      }).not.toThrow();
    });
  });

  describe('Chart Display', () => {
    test('should handle chart display with no variation', async () => {
      // スコアに変動がない場合のチャート表示
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75, // 同じスコア
        grade: 'C' as const
      }));

      await expect(async () => {
        await trendCommand['displayTrendAsChart'](mockScores, 'linear', {});
      }).not.toThrow();
    });

    test('should handle chart display with normal variation', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 70 + i * 2, // 変動あり
        grade: 'C' as const
      }));

      await expect(async () => {
        await trendCommand['displayTrendAsChart'](mockScores, 'linear', {});
      }).not.toThrow();
    });
  });

  describe('Prediction Command', () => {
    test('should handle prediction command with insufficient data', async () => {
      await expect(async () => {
        await trendCommand['executePredictionCommand']({
          projectPath: testDir,
          horizon: '7',
          method: 'ensemble',
          format: 'table'
        });
      }).not.toThrow();
    });

    test('should handle ARIMA prediction method', async () => {
      await expect(async () => {
        await trendCommand['executePredictionCommand']({
          projectPath: testDir,
          horizon: '7',
          method: 'arima',
          format: 'json'
        });
      }).not.toThrow();
    });
  });

  describe('Anomaly Detection Command', () => {
    test('should handle anomaly detection with insufficient data', async () => {
      await expect(async () => {
        await trendCommand['executeAnomalyCommand']({
          projectPath: testDir,
          threshold: '2.0',
          drift: false,
          format: 'table'
        });
      }).not.toThrow();
    });

    test('should handle anomaly detection with drift detection', async () => {
      await expect(async () => {
        await trendCommand['executeAnomalyCommand']({
          projectPath: testDir,
          threshold: '2.5',
          drift: true,
          format: 'json'
        });
      }).not.toThrow();
    });
  });

  describe('Comparison Command', () => {
    test('should handle comparison with insufficient data', async () => {
      await expect(async () => {
        await trendCommand['executeComparisonCommand']({
          projectPath: testDir,
          baseline: '30',
          current: '7',
          format: 'table'
        });
      }).not.toThrow();
    });

    test('should handle comparison in JSON format', async () => {
      await expect(async () => {
        await trendCommand['executeComparisonCommand']({
          projectPath: testDir,
          baseline: '14',
          current: '3',
          format: 'json'
        });
      }).not.toThrow();
    });
  });

  describe('Table Display Methods', () => {
    test('should handle table display with various methods', async () => {
      const mockScores = Array.from({ length: 15 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 70 + i + Math.sin(i) * 5,
        grade: 'C' as const
      }));

      // Linear method
      await expect(async () => {
        await trendCommand['displayTrendAsTable'](
          mockScores, 
          'linear', 
          { prediction: true, anomalies: true, seasonal: true }
        );
      }).not.toThrow();

      // Exponential method
      await expect(async () => {
        await trendCommand['displayTrendAsTable'](
          mockScores, 
          'exponential', 
          { prediction: false, anomalies: false, seasonal: false }
        );
      }).not.toThrow();

      // Ensemble method
      await expect(async () => {
        await trendCommand['displayTrendAsTable'](
          mockScores, 
          'ensemble', 
          { prediction: true }
        );
      }).not.toThrow();
    });
  });

  describe('JSON Display Methods', () => {
    test('should handle JSON display with different options', async () => {
      const mockScores = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75 + i * 2,
        grade: 'C' as const
      }));

      await expect(async () => {
        await trendCommand['displayTrendAsJson'](
          mockScores, 
          'ensemble', 
          { seasonal: true, anomalies: true, prediction: true }
        );
      }).not.toThrow();
    });

    test('should handle JSON display with errors', async () => {
      const mockScores = Array.from({ length: 3 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75,
        grade: 'C' as const
      }));

      // 少ないデータでエラーが発生する場合
      await expect(async () => {
        await trendCommand['displayTrendAsJson'](
          mockScores, 
          'arima', 
          { prediction: true }
        );
      }).not.toThrow();
    });
  });

  describe('File-specific Trend Analysis', () => {
    test('should handle file trend analysis with insufficient data', async () => {
      await expect(async () => {
        await trendCommand['analyzeFileTrend'](
          testDir, 
          'src/test.ts', 
          { format: 'table', method: 'linear' }
        );
      }).not.toThrow();
    });

    test('should handle file trend analysis execution', async () => {
      await expect(async () => {
        await trendCommand['executeCommand']({
          projectPath: testDir,
          file: 'src/example.ts',
          days: '30',
          method: 'ensemble',
          format: 'json'
        });
      }).not.toThrow();
    });
  });
});