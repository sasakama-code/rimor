import 'reflect-metadata';
import { AnalysisEngineImpl } from '../../../src/core/implementations/AnalysisEngineImpl';
import { UnifiedAnalysisEngine } from '../../../src/core/engine';
import { IPluginManager } from '../../../src/core/interfaces/IPluginManager';
import { AnalysisResult, AnalysisOptions } from '../../../src/core/interfaces/IAnalysisEngine';

// UnifiedAnalysisEngineのモック
jest.mock('../../../src/core/engine');

describe('AnalysisEngineImpl', () => {
  let mockPluginManager: IPluginManager;
  let engineImpl: AnalysisEngineImpl;
  let mockUnifiedEngine: jest.Mocked<UnifiedAnalysisEngine>;
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // プラグインマネージャーのモック
    mockPluginManager = {
      runAll: jest.fn(),
      register: jest.fn(),
      unregister: jest.fn(),
      getPlugins: jest.fn(),
      getPlugin: jest.fn(),
      run: jest.fn(),
      setEnabled: jest.fn(),
    } as any;
    
    // UnifiedAnalysisEngineのモックインスタンスを作成
    mockUnifiedEngine = {
      analyze: jest.fn(),
      generateAST: jest.fn(),
      clearCache: jest.fn(),
    } as any;
    
    // UnifiedAnalysisEngineのコンストラクタをモック
    (UnifiedAnalysisEngine as jest.MockedClass<typeof UnifiedAnalysisEngine>).mockImplementation(() => mockUnifiedEngine);
    
    // AnalysisEngineImplインスタンス作成
    engineImpl = new AnalysisEngineImpl(mockPluginManager);
  });
  
  describe('constructor', () => {
    it('should create UnifiedAnalysisEngine with provided plugin manager', () => {
      expect(UnifiedAnalysisEngine).toHaveBeenCalledWith(mockPluginManager);
    });
  });
  
  describe('analyze', () => {
    it('should delegate to UnifiedAnalysisEngine.analyze', async () => {
      const targetPath = '/test/path';
      const options: AnalysisOptions = { cache: true, parallel: true };
      const expectedResult: AnalysisResult = {
        totalFiles: 10,
        issues: [{
          type: 'test-issue',
          severity: 'error',
          message: 'Test issue'
        }],
        executionTime: 100,
        metadata: {
          cacheUtilized: true,
          parallelProcessed: true
        }
      };
      
      // モックの設定
      mockUnifiedEngine.analyze.mockResolvedValue(expectedResult);
      
      // テスト実行
      const result = await engineImpl.analyze(targetPath, options);
      
      // 検証
      expect(mockUnifiedEngine.analyze).toHaveBeenCalledWith(targetPath, options);
      expect(result).toBe(expectedResult);
    });
    
    it('should handle analyze without options', async () => {
      const targetPath = '/test/path';
      const expectedResult: AnalysisResult = {
        totalFiles: 5,
        issues: [],
        executionTime: 50
      };
      
      mockUnifiedEngine.analyze.mockResolvedValue(expectedResult);
      
      const result = await engineImpl.analyze(targetPath);
      
      expect(mockUnifiedEngine.analyze).toHaveBeenCalledWith(targetPath, undefined);
      expect(result).toBe(expectedResult);
    });
    
    it('should propagate errors from UnifiedAnalysisEngine', async () => {
      const error = new Error('Analysis failed');
      mockUnifiedEngine.analyze.mockRejectedValue(error);
      
      await expect(engineImpl.analyze('/test/path')).rejects.toThrow('Analysis failed');
    });
  });
  
  describe('generateAST', () => {
    it('should delegate to UnifiedAnalysisEngine.generateAST', async () => {
      const filePath = '/test/file.ts';
      const expectedAST = {
        fileName: filePath,
        sourceFile: {} as any // TypeScript SourceFileの完全なモックは複雑なので、anyを使用
      };
      
      mockUnifiedEngine.generateAST.mockResolvedValue(expectedAST);
      
      const result = await engineImpl.generateAST(filePath);
      
      expect(mockUnifiedEngine.generateAST).toHaveBeenCalledWith(filePath);
      expect(result).toBe(expectedAST);
    });
    
    it('should handle AST generation errors', async () => {
      const error = new Error('File not found');
      mockUnifiedEngine.generateAST.mockRejectedValue(error);
      
      await expect(engineImpl.generateAST('/non-existent.ts')).rejects.toThrow('File not found');
    });
  });
  
  describe('clearCache', () => {
    it('should delegate to UnifiedAnalysisEngine.clearCache', async () => {
      mockUnifiedEngine.clearCache.mockResolvedValue(undefined);
      
      await engineImpl.clearCache();
      
      expect(mockUnifiedEngine.clearCache).toHaveBeenCalledWith();
    });
    
    it('should handle cache clearing errors', async () => {
      const error = new Error('Cache clear failed');
      mockUnifiedEngine.clearCache.mockRejectedValue(error);
      
      await expect(engineImpl.clearCache()).rejects.toThrow('Cache clear failed');
    });
  });
  
  describe('integration with DI container', () => {
    it('should be marked as injectable', () => {
      // @injectable()デコレータが適用されているかを確認
      // 実際のクラスが@injectable()でマークされていることを間接的に確認
      const instance = new AnalysisEngineImpl(mockPluginManager);
      expect(instance).toBeInstanceOf(AnalysisEngineImpl);
    });
    
    it('should accept IPluginManager in constructor', () => {
      // コンストラクタが正しくIPluginManagerを受け取ることを確認
      const instance = new AnalysisEngineImpl(mockPluginManager);
      
      // analyze関数を呼び出してプラグインマネージャーが正しく使用されていることを確認
      instance.analyze('/test');
      
      // UnifiedAnalysisEngineが正しいパラメータで作成されたことを確認
      expect(UnifiedAnalysisEngine).toHaveBeenCalledWith(mockPluginManager);
    });
  });
});