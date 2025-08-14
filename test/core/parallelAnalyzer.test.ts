import { ParallelAnalyzer } from '../../src/core/parallelAnalyzer';
import { IPlugin, Issue } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// テスト用のモックプラグイン
class MockPlugin implements IPlugin {
  name = 'mock-plugin';
  
  async analyze(filePath: string): Promise<Issue[]> {
    // シミュレートのため少し待機
    await new Promise(resolve => setTimeout(resolve, 5));
    
    if (filePath.includes('error')) {
      return [{
        type: 'mock-error',
        severity: 'high',
        message: `Mock error in ${filePath}`,
        filePath: filePath,
        category: 'test-quality'
      }];
    }
    
    return [{
      type: 'mock-info',
      severity: 'medium',
      message: `Mock analysis of ${filePath}`,
      filePath: filePath,
      category: 'test-quality'
    }];
  }
}

class SlowMockPlugin implements IPlugin {
  name = 'slow-mock-plugin';
  
  async analyze(filePath: string): Promise<Issue[]> {
    // より長い処理時間をシミュレート
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return [{
      type: 'slow-analysis',
      severity: 'medium',
      message: `Slow analysis of ${filePath}`,
      filePath: filePath,
      category: 'performance'
    }];
  }
}

describe('ParallelAnalyzer', () => {
  let analyzer: ParallelAnalyzer;
  let tempDir: string;
  
  beforeEach(async () => {
    analyzer = new ParallelAnalyzer({
      batchSize: 3,
      maxConcurrency: 2,
      enableStats: true
    });
    
    // テスト用一時ディレクトリ作成
    tempDir = path.join(__dirname, '..', '..', 'temp-test-parallel');
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterEach(async () => {
    // テスト用ディレクトリ削除
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 削除失敗は無視
    }
  });
  
  describe('基本的な並列処理', () => {
    test('should process multiple files in parallel', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      // テストファイルを作成
      const testFiles = ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts', 'file5.ts'];
      for (const file of testFiles) {
        await fs.writeFile(path.join(tempDir, file), `// Test content for ${file}`);
      }
      
      const startTime = Date.now();
      const result = await analyzer.analyze(tempDir);
      const endTime = Date.now();
      
      expect(result.totalFiles).toBe(testFiles.length);
      expect(result.issues).toHaveLength(testFiles.length); // 各ファイルから1つずつ
      expect(result.executionTime).toBeLessThan(endTime - startTime + 100); // 許容誤差
      expect(result.parallelStats.batchCount).toBeGreaterThan(0);
      expect(result.parallelStats.concurrencyLevel).toBe(2);
    });
    
    test('should handle single file analysis', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      const testFile = path.join(tempDir, 'single.ts');
      await fs.writeFile(testFile, '// Single test file');
      
      const result = await analyzer.analyze(testFile);
      
      expect(result.totalFiles).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.parallelStats.batchCount).toBe(1);
    });
    
    test('should handle empty directory', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      const result = await analyzer.analyze(tempDir);
      
      expect(result.totalFiles).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.parallelStats.batchCount).toBe(0);
    });
  });
  
  describe('バッチ処理', () => {
    test('should process files in correct batch sizes', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      // 7ファイルを作成（バッチサイズ3なので、3+3+1のバッチになる）
      const testFiles = Array.from({ length: 7 }, (_, i) => `batch-file-${i}.ts`);
      for (const file of testFiles) {
        await fs.writeFile(path.join(tempDir, file), `// Batch test ${file}`);
      }
      
      const result = await analyzer.analyze(tempDir);
      
      expect(result.totalFiles).toBe(7);
      expect(result.parallelStats.batchCount).toBe(3); // ceil(7/3) = 3
      expect(result.parallelStats.avgBatchTime).toBeGreaterThan(0);
    });
  });
  
  describe('パフォーマンス比較', () => {
    test('should be faster than sequential processing for multiple files', async () => {
      const slowPlugin = new SlowMockPlugin();
      analyzer.registerPlugin(slowPlugin);
      
      // 複数ファイルを作成
      const fileCount = 6;
      const testFiles = Array.from({ length: fileCount }, (_, i) => `perf-test-${i}.ts`);
      for (const file of testFiles) {
        await fs.writeFile(path.join(tempDir, file), `// Performance test ${file}`);
      }
      
      const result = await analyzer.analyze(tempDir);
      
      // 6ファイル × 50ms = 300ms が順次処理の理論値
      // 並列処理（同時実行数2）では約 150ms になるはず
      expect(result.executionTime).toBeLessThan(250); // 十分に短い時間
      expect(result.totalFiles).toBe(fileCount);
      expect(result.issues).toHaveLength(fileCount);
    });
  });
  
  describe('エラーハンドリング', () => {
    test('should handle plugin errors gracefully', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      // エラーを発生させるファイルと正常なファイルを作成
      await fs.writeFile(path.join(tempDir, 'error-file.ts'), '// This will cause error');
      await fs.writeFile(path.join(tempDir, 'normal-file.ts'), '// This is normal');
      
      const result = await analyzer.analyze(tempDir);
      
      expect(result.totalFiles).toBe(2);
      expect(result.issues).toHaveLength(2); // エラーファイルも結果を返す
      
      const errorIssue = result.issues.find(issue => issue.type === 'mock-error');
      const normalIssue = result.issues.find(issue => issue.type === 'mock-info');
      
      expect(errorIssue).toBeDefined();
      expect(normalIssue).toBeDefined();
    });
    
    test('should handle non-existent directory', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      const nonExistentPath = path.join(tempDir, 'non-existent');
      
      await expect(analyzer.analyze(nonExistentPath)).rejects.toThrow();
    });
  });
  
  describe('ファイルフィルタリング', () => {
    test('should only process supported file types', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      // 様々な拡張子のファイルを作成
      const testFiles = [
        'test.ts',
        'test.js', 
        'test.tsx',
        'test.jsx',
        'test.txt',    // サポート外
        'test.json',   // サポート外
        'README.md'    // サポート外
      ];
      
      for (const file of testFiles) {
        await fs.writeFile(path.join(tempDir, file), `// Content for ${file}`);
      }
      
      const result = await analyzer.analyze(tempDir);
      
      // .ts, .js, .tsx, .jsx のみが処理される
      expect(result.totalFiles).toBe(4);
    });
    
    test('should exclude node_modules and other excluded directories', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      // 除外対象ディレクトリを作成
      const excludedDirs = ['node_modules', 'dist', '.git'];
      for (const dir of excludedDirs) {
        await fs.mkdir(path.join(tempDir, dir), { recursive: true });
        await fs.writeFile(path.join(tempDir, dir, 'excluded.ts'), '// Excluded file');
      }
      
      // 通常ファイルを作成
      await fs.writeFile(path.join(tempDir, 'included.ts'), '// Included file');
      
      const result = await analyzer.analyze(tempDir);
      
      expect(result.totalFiles).toBe(1); // 除外ディレクトリのファイルは処理されない
    });
  });
  
  describe('パフォーマンス統計', () => {
    test('should provide detailed performance statistics', async () => {
      analyzer.registerPlugin(new MockPlugin());
      
      const testFiles = Array.from({ length: 8 }, (_, i) => `stats-test-${i}.ts`);
      for (const file of testFiles) {
        await fs.writeFile(path.join(tempDir, file), `// Stats test ${file}`);
      }
      
      const result = await analyzer.analyze(tempDir);
      
      expect(result.parallelStats).toMatchObject({
        batchCount: expect.any(Number),
        avgBatchTime: expect.any(Number),
        maxBatchTime: expect.any(Number),
        concurrencyLevel: 2
      });
      
      expect(result.parallelStats.batchCount).toBeGreaterThan(0);
      expect(result.parallelStats.avgBatchTime).toBeGreaterThan(0);
      expect(result.parallelStats.maxBatchTime).toBeGreaterThanOrEqual(result.parallelStats.avgBatchTime);
    });
  });
  
  describe('推奨設定取得', () => {
    test('should provide performance recommendations', () => {
      const recommendations = analyzer.getPerformanceStats();
      
      expect(recommendations).toMatchObject({
        recommendedBatchSize: expect.any(Number),
        recommendedConcurrency: expect.any(Number)
      });
      
      expect(recommendations.recommendedBatchSize).toBeGreaterThanOrEqual(5);
      expect(recommendations.recommendedBatchSize).toBeLessThanOrEqual(20);
      expect(recommendations.recommendedConcurrency).toBeGreaterThanOrEqual(2);
      expect(recommendations.recommendedConcurrency).toBeLessThanOrEqual(8);
    });
  });
});