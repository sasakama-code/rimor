/**
 * Intent Analysis Performance Test
 * v0.9.0 - テスト意図分析のパフォーマンステスト
 * TDD Red Phase - 失敗するテストを先に作成
 */

import { TreeSitterParser } from '../../../src/intent-analysis/TreeSitterParser';
import { TestIntentExtractor } from '../../../src/intent-analysis/TestIntentExtractor';
import { IntentAnalyzeCommand } from '../../../src/cli/commands/intent-analyze';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Intent Analysis Performance', () => {
  let tempDir: string;
  
  beforeAll(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = path.join(os.tmpdir(), 'rimor-perf-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterAll(async () => {
    // 一時ディレクトリをクリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('処理速度の要件', () => {
    it('100個のテストファイルを1秒以内に処理できること', async () => {
      // Arrange: 100個のダミーテストファイルを作成
      const fileCount = 100;
      const testFiles: string[] = [];
      
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `test${i}.test.ts`);
        const content = `
          describe('TestSuite${i}', () => {
            it('should test something ${i}', () => {
              const result = calculateSomething(${i});
              expect(result).toBe(${i * 2});
            });
            
            it('should handle error case ${i}', () => {
              expect(() => calculateWithError(${i})).toThrow();
            });
          });
        `;
        await fs.writeFile(filePath, content);
        testFiles.push(filePath);
      }
      
      // Act: パフォーマンスを測定
      const startTime = performance.now();
      
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      const results = [];
      
      for (const file of testFiles) {
        const ast = await parser.parseFile(file);
        const intent = await extractor.extractIntent(file, ast);
        const actual = await extractor.analyzeActualTest(file, ast);
        const result = await extractor.evaluateRealization(intent, actual);
        results.push(result);
      }
      
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000; // 秒に変換
      const filesPerSecond = fileCount / processingTime;
      
      // Assert: 100 files/sec以上であること
      console.log(`処理速度: ${filesPerSecond.toFixed(2)} files/sec`);
      expect(filesPerSecond).toBeGreaterThanOrEqual(100);
    });
    
    it('並列処理で500個のテストファイルを効率的に処理できること', async () => {
      // Arrange: 500個のダミーテストファイルを作成
      const fileCount = 500;
      
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `parallel-test${i}.test.ts`);
        const content = `
          describe('ParallelTestSuite${i}', () => {
            it('should test in parallel ${i}', () => {
              const result = process(${i});
              expect(result).toBeDefined();
            });
          });
        `;
        await fs.writeFile(filePath, content);
      }
      
      // Act: 並列処理でパフォーマンスを測定
      const startTime = performance.now();
      
      // Workerのテストは環境依存のため、直接分析を実行
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      const results = [];
      
      // 簡易並列シミュレーション（Promise.all使用）
      const batchSize = 50;
      for (let i = 0; i < fileCount; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, fileCount); j++) {
          const filePath = path.join(tempDir, `parallel-test${j}.test.ts`);
          batch.push((async () => {
            const ast = await parser.parseFile(filePath);
            const intent = await extractor.extractIntent(filePath, ast);
            const actual = await extractor.analyzeActualTest(filePath, ast);
            return extractor.evaluateRealization(intent, actual);
          })());
        }
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
      }
      
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000; // 秒に変換
      const filesPerSecond = fileCount / processingTime;
      
      // Assert: 並列処理で高速に処理できること
      console.log(`並列処理速度: ${filesPerSecond.toFixed(2)} files/sec`);
      expect(filesPerSecond).toBeGreaterThanOrEqual(100);
    });
  });
  
  describe('メモリ効率の要件', () => {
    it('大量のファイル処理でもメモリ使用量が適切であること', async () => {
      // Arrange: メモリ使用量の初期値を記録
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Act: 200個のファイルを処理
      const fileCount = 200;
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `memory-test${i}.test.ts`);
        const content = `
          describe('MemoryTest${i}', () => {
            it('should not leak memory ${i}', () => {
              const data = new Array(1000).fill(${i});
              expect(data.length).toBe(1000);
            });
          });
        `;
        await fs.writeFile(filePath, content);
      }
      
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `memory-test${i}.test.ts`);
        const ast = await parser.parseFile(filePath);
        await extractor.extractIntent(filePath, ast);
      }
      
      // ガベージコレクションを強制実行
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB単位
      
      // Assert: メモリ増加が妥当な範囲内であること
      console.log(`メモリ増加: ${memoryIncrease.toFixed(2)} MB`);
      expect(memoryIncrease).toBeLessThan(100); // 100MB未満
    });
  });
  
  describe('最適化の効果測定', () => {
    it('キャッシュ機構により2回目の処理が高速化されること', async () => {
      // Arrange: テストファイルを作成
      const testFile = path.join(tempDir, 'cache-test.test.ts');
      const content = `
        describe('CacheTest', () => {
          it('should benefit from caching', () => {
            expect(true).toBe(true);
          });
        });
      `;
      await fs.writeFile(testFile, content);
      
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      
      // Act: 1回目の処理時間を測定
      const firstStart = performance.now();
      await parser.parseFile(testFile);
      const firstEnd = performance.now();
      const firstTime = firstEnd - firstStart;
      
      // Act: 2回目の処理時間を測定（キャッシュが効くはず）
      const secondStart = performance.now();
      await parser.parseFile(testFile);
      const secondEnd = performance.now();
      const secondTime = secondEnd - secondStart;
      
      // Assert: 2回目は1回目より高速であること
      console.log(`1回目: ${firstTime.toFixed(2)}ms, 2回目: ${secondTime.toFixed(2)}ms`);
      console.log(`高速化率: ${((firstTime - secondTime) / firstTime * 100).toFixed(2)}%`);
      
      // キャッシュ統計を表示
      const cacheStats = parser.getCacheStats();
      console.log(`キャッシュ統計: ヒット=${cacheStats.hits}, ミス=${cacheStats.misses}, ヒット率=${(cacheStats.hitRate * 100).toFixed(2)}%`);
      
      // キャッシュが実装されたので、2回目は高速化されるはず
      expect(secondTime).toBeLessThan(firstTime * 0.5); // 50%以上高速化
    });
  });
});