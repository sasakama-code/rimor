import * as path from 'path';
import * as fs from 'fs';
import { Analyzer } from '../../src/core/analyzer';

const getFixturePath = (filename: string) => path.join(__dirname, '../fixtures', filename);

describe('Simple Performance Tests', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  describe('Basic Analysis Performance', () => {
    it('should complete single file analysis within reasonable time', async () => {
      const startTime = process.hrtime.bigint();
      
      const result = await analyzer.analyze(getFixturePath('sample.test.ts'));
      
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // 単一ファイル分析は1秒以内で完了すべき
      expect(executionTimeMs).toBeLessThan(1000);
      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    it('should provide execution time statistics', async () => {
      const result = await analyzer.analyze(getFixturePath('comprehensive.test.ts'));
      
      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(1000); // 1秒以内
    });

    it('should handle multiple runs consistently', async () => {
      const executionTimes: number[] = [];
      const runs = 5;

      for (let i = 0; i < runs; i++) {
        const startTime = process.hrtime.bigint();
        
        await analyzer.analyze(getFixturePath('sample.test.ts'));
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;
        executionTimes.push(executionTimeMs);
      }

      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / runs;
      const maxTime = Math.max(...executionTimes);
      const minTime = Math.min(...executionTimes);

      // すべての実行が1秒以内で完了
      expect(maxTime).toBeLessThan(1000);
      expect(minTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(500);
    });
  });

  describe('File Size Performance', () => {
    it('should handle small files efficiently', async () => {
      const smallTestContent = `
describe('Small Test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`;

      const smallPath = path.join(__dirname, '../fixtures/small.test.ts');
      fs.writeFileSync(smallPath, smallTestContent);

      try {
        const startTime = process.hrtime.bigint();
        
        await analyzer.analyze(smallPath);
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;

        // 小さなファイルは100ms以内で処理
        expect(executionTimeMs).toBeLessThan(100);
        
      } finally {
        if (fs.existsSync(smallPath)) {
          fs.unlinkSync(smallPath);
        }
      }
    });

    it('should handle medium files reasonably', async () => {
      const mediumTestContent = `
describe('Medium Test Suite', () => {
${Array.from({ length: 20 }, (_, i) => `
  describe('Group ${i}', () => {
    it('should test ${i}', () => {
      expect(${i}).toBe(${i});
    });
  });`).join('')}
});`;

      const mediumPath = path.join(__dirname, '../fixtures/medium.test.ts');
      fs.writeFileSync(mediumPath, mediumTestContent);

      try {
        const startTime = process.hrtime.bigint();
        
        await analyzer.analyze(mediumPath);
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;

        // 中程度のファイルは500ms以内で処理
        expect(executionTimeMs).toBeLessThan(500);
        
      } finally {
        if (fs.existsSync(mediumPath)) {
          fs.unlinkSync(mediumPath);
        }
      }
    });
  });

  describe('Memory Usage', () => {
    it('should not cause excessive memory growth', async () => {
      const initialMemory = process.memoryUsage();
      
      // 複数回の分析を実行
      for (let i = 0; i < 10; i++) {
        await analyzer.analyze(getFixturePath('sample.test.ts'));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // メモリ使用量の増加が3MB以内であることを確認
      expect(memoryIncrease).toBeLessThan(3 * 1024 * 1024);
    });

    it('should report memory usage efficiently', () => {
      const memBefore = process.memoryUsage();
      
      // アナライザーのインスタンス化
      const testAnalyzer = new Analyzer();
      
      const memAfter = process.memoryUsage();
      const memoryUsed = memAfter.heapUsed - memBefore.heapUsed;

      // インスタンス化によるメモリ使用量が1MB以内
      expect(memoryUsed).toBeLessThan(1024 * 1024);
      expect(testAnalyzer).toBeDefined();
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle non-existent files quickly', async () => {
      const startTime = process.hrtime.bigint();
      
      try {
        await analyzer.analyze('/non/existent/file.ts');
      } catch (error) {
        // エラーは期待される
        expect(error).toBeDefined();
      }
      
      const endTime = process.hrtime.bigint();
      const errorHandlingTime = Number(endTime - startTime) / 1_000_000;

      // エラー処理が100ms以内で完了
      expect(errorHandlingTime).toBeLessThan(100);
    });

    it('should handle invalid syntax gracefully', async () => {
      const invalidPath = path.join(__dirname, '../fixtures/invalid.test.ts');
      fs.writeFileSync(invalidPath, 'invalid syntax {{{{ }');

      try {
        const startTime = process.hrtime.bigint();
        
        const result = await analyzer.analyze(invalidPath);
        
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;

        // 無効な構文でも500ms以内で処理完了
        expect(executionTimeMs).toBeLessThan(500);
        expect(result).toBeDefined();
        
      } finally {
        if (fs.existsSync(invalidPath)) {
          fs.unlinkSync(invalidPath);
        }
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet baseline performance requirements', async () => {
      const benchmarkData = {
        singleFile: 0,
        multipleRuns: [] as number[],
        averageTime: 0
      };

      // 単一ファイルのベンチマーク
      const singleStart = process.hrtime.bigint();
      await analyzer.analyze(getFixturePath('comprehensive.test.ts'));
      const singleEnd = process.hrtime.bigint();
      benchmarkData.singleFile = Number(singleEnd - singleStart) / 1_000_000;

      // 複数実行のベンチマーク
      for (let i = 0; i < 3; i++) {
        const runStart = process.hrtime.bigint();
        await analyzer.analyze(getFixturePath('sample.test.ts'));
        const runEnd = process.hrtime.bigint();
        benchmarkData.multipleRuns.push(Number(runEnd - runStart) / 1_000_000);
      }

      benchmarkData.averageTime = benchmarkData.multipleRuns.reduce((sum, time) => sum + time, 0) / benchmarkData.multipleRuns.length;

      // ベンチマーク結果の検証
      expect(benchmarkData.singleFile).toBeLessThan(800);
      expect(benchmarkData.averageTime).toBeLessThan(400);
      expect(benchmarkData.multipleRuns.every(time => time < 600)).toBe(true);

      // パフォーマンス情報をログ出力（テスト時の参考用）
      console.log('Performance Benchmarks:', benchmarkData);
    });

    it('should scale acceptably with directory analysis', async () => {
      const testDir = path.dirname(getFixturePath('sample.test.ts'));
      
      const startTime = process.hrtime.bigint();
      
      const result = await analyzer.analyze(testDir);
      
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // ディレクトリ分析の性能要件
      expect(executionTimeMs).toBeLessThan(3000); // 3秒以内
      expect(result.totalFiles).toBeGreaterThan(0);
      
      // ファイルあたりの平均処理時間
      const avgTimePerFile = executionTimeMs / result.totalFiles;
      expect(avgTimePerFile).toBeLessThan(300); // ファイルあたり300ms以内

      console.log(`Directory analysis: ${result.totalFiles} files in ${executionTimeMs.toFixed(2)}ms (${avgTimePerFile.toFixed(2)}ms per file)`);
    });
  });
});