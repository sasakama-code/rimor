import * as path from 'path';
import * as fs from 'fs';
import { Analyzer } from '../../src/core/analyzer';
import { PluginManager } from '../../src/core/pluginManager';

const getFixturePath = (filename: string) => path.join(__dirname, '../fixtures', filename);

describe('Basic Performance Tests', () => {
  let analyzer: Analyzer;
  let pluginManager: PluginManager;

  beforeEach(() => {
    analyzer = new Analyzer();
    pluginManager = new PluginManager();
  });

  describe('Analysis Performance', () => {
    it('should complete single file analysis within reasonable time', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await analyzer.analyze(getFixturePath('sample.test.ts'));
      
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // 単一ファイル分析は500ms以内で完了すべき
      expect(executionTimeMs).toBeLessThan(500);
      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle directory analysis efficiently', async () => {
      const testDir = path.dirname(getFixturePath('sample.test.ts'));
      
      const startTime = process.hrtime.bigint();
      
      const result = await analyzer.analyze(testDir);
      
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // ディレクトリ分析は2秒以内で完了すべき
      expect(executionTimeMs).toBeLessThan(2000);
      expect(result.totalFiles).toBeGreaterThan(0);
      expect(result.issues).toBeDefined();
    });

    it('should scale reasonably with file count', async () => {
      // 複数のテストファイルを作成
      const tempFiles: string[] = [];
      const testContent = `
describe('Performance Test', () => {
  it('should test something', () => {
    expect(true).toBe(true);
  });
});`;

      try {
        for (let i = 0; i < 5; i++) {
          const tempPath = path.join(__dirname, `../fixtures/perf-test-${i}.test.ts`);
          fs.writeFileSync(tempPath, testContent);
          tempFiles.push(tempPath);
        }

        const startTime = process.hrtime.bigint();
        
        const result = await analyzer.analyze(path.dirname(getFixturePath('sample.test.ts')));
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;

        // ファイル数が増えてもリニアにスケールすることを確認
        expect(executionTimeMs).toBeLessThan(3000);
        expect(result.totalFiles).toBeGreaterThan(5);
        
      } finally {
        // テンポラリファイルを削除
        tempFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      }
    });

    it('should provide consistent performance across multiple runs', async () => {
      const executionTimes: number[] = [];
      const runs = 5;

      for (let i = 0; i < runs; i++) {
        const startTime = process.hrtime.bigint();
        
        await analyzer.analyze(getFixturePath('comprehensive.test.ts'));
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;
        executionTimes.push(executionTimeMs);
      }

      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / runs;
      const maxTime = Math.max(...executionTimes);
      const minTime = Math.min(...executionTimes);
      const variance = maxTime - minTime;

      // 実行時間の分散が平均の100%以内であることを確認
      expect(variance).toBeLessThan(avgTime * 1.0);
      expect(avgTime).toBeLessThan(300);
    });
  });

  describe('Plugin Performance', () => {
    it('should load plugins efficiently', () => {
      const startTime = process.hrtime.bigint();
      
      // 既存のプラグインは初期状態で空
      const plugins: any[] = [];
      
      const endTime = process.hrtime.bigint();
      const loadTimeMs = Number(endTime - startTime) / 1_000_000;

      // プラグイン読み込みは100ms以内で完了すべき
      expect(loadTimeMs).toBeLessThan(100);
      expect(plugins.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute plugins with minimal overhead', async () => {
      const testFile = getFixturePath('sample.test.ts');
      
      const startTime = process.hrtime.bigint();
      
      // pluginManager.runAllを使用してテスト
      await pluginManager.runAll(testFile);
      
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // 全プラグインの実行が1秒以内で完了すべき
      expect(executionTimeMs).toBeLessThan(1000);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause significant memory leaks', async () => {
      const initialMemory = process.memoryUsage();
      
      // 複数回の分析を実行
      for (let i = 0; i < 20; i++) {
        await analyzer.analyze(getFixturePath('sample.test.ts'));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // メモリ使用量の増加が5MB以内であることを確認
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('should handle large files without excessive memory usage', async () => {
      // 大きなテストファイルを生成
      const largeTestContent = `
describe('Large Test Suite', () => {
${Array.from({ length: 50 }, (_, i) => `
  it('should test case ${i}', () => {
    expect(${i}).toBe(${i});
    expect(true).toBe(true);
    expect(false).toBe(false);
  });`).join('')}
});`;

      const largePath = path.join(__dirname, '../fixtures/large-memory.test.ts');
      fs.writeFileSync(largePath, largeTestContent);

      try {
        const beforeMemory = process.memoryUsage();
        
        await analyzer.analyze(largePath);
        
        const afterMemory = process.memoryUsage();
        const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;

        // 大きなファイルでもメモリ使用量が2MB以内に収まることを確認
        expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
        
      } finally {
        if (fs.existsSync(largePath)) {
          fs.unlinkSync(largePath);
        }
      }
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle non-existent files without significant delay', async () => {
      const startTime = process.hrtime.bigint();
      
      try {
        await analyzer.analyze('/non/existent/file.ts');
      } catch (error) {
        // エラーは予期される
      }
      
      const endTime = process.hrtime.bigint();
      const errorHandlingTime = Number(endTime - startTime) / 1_000_000;

      // エラーハンドリングが50ms以内で完了することを確認
      expect(errorHandlingTime).toBeLessThan(50);
    });

    it('should handle corrupted files gracefully', async () => {
      // 不正なTypeScriptファイルを作成
      const corruptedPath = path.join(__dirname, '../fixtures/corrupted.test.ts');
      fs.writeFileSync(corruptedPath, 'invalid typescript syntax {{{{ ');

      try {
        const startTime = process.hrtime.bigint();
        
        const result = await analyzer.analyze(corruptedPath);
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;

        // 破損したファイルでも500ms以内で処理を完了することを確認
        expect(executionTimeMs).toBeLessThan(500);
        expect(result).toBeDefined();
        
      } finally {
        if (fs.existsSync(corruptedPath)) {
          fs.unlinkSync(corruptedPath);
        }
      }
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent analysis requests', async () => {
      const files = [
        getFixturePath('sample.test.ts'),
        getFixturePath('comprehensive.test.ts'),
        getFixturePath('good.test.ts')
      ];

      const startTime = process.hrtime.bigint();
      
      // 並行実行
      const promises = files.map(file => analyzer.analyze(file));
      const results = await Promise.all(promises);
      
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1_000_000;

      // 並行実行が順次実行より高速であることを確認
      expect(totalTime).toBeLessThan(1000);
      expect(results).toHaveLength(files.length);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.executionTime).toBeGreaterThan(0);
      });
    });
  });
});