import { UnifiedAnalysisEngine } from '../../src/core/engine';
import { IPluginManager, PluginExecutionResult } from '../../src/core/interfaces/IPluginManager';
import { AnalysisOptions } from '../../src/core/interfaces/IAnalysisEngine';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CacheManager } from '../../src/core/cacheManager';
import { PerformanceMonitor } from '../../src/core/performanceMonitor';

// モックプラグインマネージャー
class MockPluginManager implements IPluginManager {
  private mockResults: PluginExecutionResult[] = [];
  
  setMockResults(results: PluginExecutionResult[]): void {
    this.mockResults = results;
  }
  
  async runAll(filePath: string): Promise<PluginExecutionResult[]> {
    return this.mockResults;
  }
  
  register = jest.fn();
  unregister = jest.fn();
  getPlugins = jest.fn(() => []);
  getPlugin = jest.fn(() => undefined);
  run = jest.fn(async () => ({ pluginId: 'test', issues: [], executionTime: 0 }));
  setEnabled = jest.fn();
}

describe('UnifiedAnalysisEngine', () => {
  const testDir = './test-fixtures-engine';
  let mockPluginManager: MockPluginManager;
  let engine: UnifiedAnalysisEngine;
  let mockCacheManagerInstance: any;
  let mockPerformanceMonitorInstance: any;
  
  beforeEach(async () => {
    // テストディレクトリ作成
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    
    // モック設定
    mockPluginManager = new MockPluginManager();
    
    // CacheManagerのモック
    mockCacheManagerInstance = {
      invalidateAll: jest.fn(),
    };
    jest.spyOn(CacheManager, 'getInstance').mockReturnValue(mockCacheManagerInstance);
    
    // PerformanceMonitorのモック
    mockPerformanceMonitorInstance = {
      startSession: jest.fn(),
      endSession: jest.fn(() => ({ summary: { totalFiles: 2 } })),
    };
    jest.spyOn(PerformanceMonitor, 'getInstance').mockReturnValue(mockPerformanceMonitorInstance);
    
    // エンジンインスタンスをモック設定後に作成
    engine = new UnifiedAnalysisEngine(mockPluginManager);
  });
  
  afterEach(async () => {
    // クリーンアップ
    await fs.rm(testDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });
  
  describe('analyze', () => {
    it('should analyze single file successfully', async () => {
      const testFile = path.join(testDir, 'src', 'test.ts');
      await fs.writeFile(testFile, 'export const test = 1;');
      
      mockPluginManager.setMockResults([{
        pluginId: 'test-plugin',
        issues: [{
          type: 'test-issue',
          severity: 'error',
          message: 'Test issue'
        }],
        executionTime: 10
      }]);
      
      const result = await engine.analyze(testFile);
      
      expect(result.totalFiles).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('test-issue');
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });
    
    it('should analyze directory recursively', async () => {
      await fs.writeFile(path.join(testDir, 'src', 'file1.ts'), 'export const a = 1;');
      await fs.writeFile(path.join(testDir, 'src', 'file2.js'), 'export const b = 2;');
      await fs.mkdir(path.join(testDir, 'src', 'nested'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'src', 'nested', 'file3.tsx'), 'export const c = 3;');
      
      mockPluginManager.setMockResults([{
        pluginId: 'test-plugin',
        issues: [],
        executionTime: 5
      }]);
      
      const result = await engine.analyze(testDir);
      
      expect(result.totalFiles).toBe(3);
      expect(result.issues).toHaveLength(0);
    });
    
    it('should handle non-existent path gracefully', async () => {
      const result = await engine.analyze('./non-existent-path');
      
      expect(result.totalFiles).toBe(0);
      expect(result.issues).toHaveLength(0);
    });
    
    it('should exclude specified patterns', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'node_modules', 'lib.js'), 'module.exports = {};');
      await fs.writeFile(path.join(testDir, 'src', 'app.ts'), 'export const app = 1;');
      
      const options: AnalysisOptions = {
        excludePatterns: ['node_modules']
      };
      
      const result = await engine.analyze(testDir, options);
      
      expect(result.totalFiles).toBe(1); // node_modulesのファイルは除外される
    });
    
    it('should include only specified patterns', async () => {
      await fs.writeFile(path.join(testDir, 'src', 'app.ts'), 'export const app = 1;');
      await fs.writeFile(path.join(testDir, 'src', 'test.spec.ts'), 'test("app", () => {});');
      await fs.writeFile(path.join(testDir, 'src', 'README.md'), '# Readme');
      
      const options: AnalysisOptions = {
        includePatterns: ['*.spec.ts']
      };
      
      const result = await engine.analyze(testDir, options);
      
      expect(result.totalFiles).toBe(1); // .spec.tsファイルのみ
    });
    
    it('should use cache when cache option is enabled', async () => {
      await fs.writeFile(path.join(testDir, 'src', 'cached.ts'), 'export const cached = 1;');
      
      const options: AnalysisOptions = { cache: true };
      
      const result = await engine.analyze(testDir, options);
      
      expect(result.metadata?.cacheUtilized).toBe(true);
      expect(mockPerformanceMonitorInstance.startSession).toHaveBeenCalled();
      expect(mockPerformanceMonitorInstance.endSession).toHaveBeenCalled();
    });
    
    it('should analyze in parallel when parallel option is enabled', async () => {
      // 複数ファイル作成
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(path.join(testDir, 'src', `file${i}.ts`), `export const var${i} = ${i};`);
      }
      
      const options: AnalysisOptions = { 
        parallel: true,
        concurrency: 4
      };
      
      const result = await engine.analyze(testDir, options);
      
      expect(result.totalFiles).toBe(10);
      expect(result.metadata?.parallelProcessed).toBe(true);
    });
  });
  
  describe('generateAST', () => {
    it('should generate AST for TypeScript file', async () => {
      const testFile = path.join(testDir, 'src', 'ast-test.ts');
      const content = 'export function hello() { return "world"; }';
      await fs.writeFile(testFile, content);
      
      const astInfo = await engine.generateAST(testFile);
      
      expect(astInfo).toBeDefined();
      expect(astInfo.type).toBe('program');
      expect(astInfo.text).toContain('hello');
    });
    
    it('should read latest file content for AST generation', async () => {
      const testFile = path.join(testDir, 'src', 'cached-ast.ts');
      await fs.writeFile(testFile, 'export const cached = true;');
      
      // 最初の呼び出し
      const ast1 = await engine.generateAST(testFile);
      expect(ast1.text).toContain('cached = true');
      
      // ファイル内容を変更
      await fs.writeFile(testFile, 'export const changed = false;');
      
      // 2回目の呼び出し（新しい内容を読み込む）
      const ast2 = await engine.generateAST(testFile);
      
      // 新しい内容が反映されていることを確認
      expect(ast2.type).toBe('program');
      expect(ast2.text).toContain('changed = false');
    });
    
    it('should handle file read errors', async () => {
      await expect(engine.generateAST('./non-existent-file.ts')).rejects.toThrow();
    });
  });
  
  describe('clearCache', () => {
    it('should clear all caches', async () => {
      const testFile = path.join(testDir, 'src', 'cache-clear.ts');
      await fs.writeFile(testFile, 'export const test = 1;');
      
      // ASTキャッシュに追加
      await engine.generateAST(testFile);
      
      // キャッシュクリア
      await engine.clearCache();
      
      // ファイル内容を変更
      await fs.writeFile(testFile, 'export const updated = 2;');
      
      // 新しい内容が読み込まれることを確認
      const ast = await engine.generateAST(testFile);
      expect(ast.text).toContain('updated');
      
      // CacheManagerのinvalidateAllが呼ばれたことを確認
      expect(mockCacheManagerInstance.invalidateAll).toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle plugin manager errors gracefully', async () => {
      const testFile = path.join(testDir, 'src', 'error.ts');
      await fs.writeFile(testFile, 'export const error = true;');
      
      // エラーを投げるように設定
      mockPluginManager.runAll = jest.fn().mockRejectedValue(new Error('Plugin error'));
      
      await expect(engine.analyze(testFile)).rejects.toThrow('Plugin error');
    });
    
    it('should cleanup worker pool on error', async () => {
      const testFile = path.join(testDir, 'src', 'worker-error.ts');
      await fs.writeFile(testFile, 'export const test = 1;');
      
      // WorkerPoolのモック
      const mockTerminate = jest.fn();
      jest.doMock('../../src/core/workerPool', () => ({
        WorkerPool: jest.fn().mockImplementation(() => ({
          initialize: jest.fn(),
          terminate: mockTerminate
        }))
      }));
      
      // エラーを発生させる
      mockPluginManager.runAll = jest.fn().mockRejectedValue(new Error('Analysis failed'));
      
      const options: AnalysisOptions = { parallel: true };
      
      try {
        await engine.analyze(testFile, options);
      } catch (error) {
        // エラーは期待される
      }
      
      // workerPoolがundefinedになっていることを確認
      expect((engine as any).workerPool).toBeUndefined();
    });
  });
  
  describe('file filtering', () => {
    it('should analyze only analyzable files', async () => {
      await fs.writeFile(path.join(testDir, 'src', 'code.ts'), 'export const code = 1;');
      await fs.writeFile(path.join(testDir, 'src', 'README.md'), '# Documentation');
      await fs.writeFile(path.join(testDir, 'src', 'image.png'), Buffer.from('fake-image'));
      
      const result = await engine.analyze(testDir);
      
      expect(result.totalFiles).toBe(1); // .tsファイルのみ
    });
    
    it('should handle custom include patterns with regex', async () => {
      await fs.writeFile(path.join(testDir, 'src', 'component.tsx'), 'export const Component = () => null;');
      await fs.writeFile(path.join(testDir, 'src', 'util.ts'), 'export const util = 1;');
      await fs.writeFile(path.join(testDir, 'src', 'test.spec.ts'), 'test("util", () => {});');
      
      const options: AnalysisOptions = {
        includePatterns: ['*.spec.*', '*.tsx']
      };
      
      const result = await engine.analyze(testDir, options);
      
      expect(result.totalFiles).toBe(2); // .spec.tsと.tsxファイル
    });
  });
});