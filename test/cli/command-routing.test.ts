/**
 * コマンドルーティングテスト
 * TDD RED Phase - issue #83: コマンドの整理
 * analyze -> analyze-legacy, unified-analyze -> analyze への移行
 */

import { CLI } from '../../src/cli/cli';
import { AnalyzeCommand } from '../../src/cli/commands/analyze';
import { UnifiedAnalyzeCommand } from '../../src/cli/commands/unified-analyze';

// モックの設定
jest.mock('../../src/cli/commands/analyze');
jest.mock('../../src/cli/commands/unified-analyze');

describe('Command Routing Integration', () => {
  let cli: CLI;
  let mockAnalyzeCommand: jest.Mocked<AnalyzeCommand>;
  let mockUnifiedAnalyzeCommand: jest.Mocked<UnifiedAnalyzeCommand>;

  beforeEach(() => {
    // モックの初期化
    mockAnalyzeCommand = {
      execute: jest.fn()
    } as any;
    
    mockUnifiedAnalyzeCommand = {
      execute: jest.fn()
    } as any;

    // モックコンストラクタの設定
    (AnalyzeCommand as jest.MockedClass<typeof AnalyzeCommand>).mockImplementation(() => mockAnalyzeCommand);
    (UnifiedAnalyzeCommand as jest.MockedClass<typeof UnifiedAnalyzeCommand>).mockImplementation(() => mockUnifiedAnalyzeCommand);

    cli = new CLI();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('analyze-legacy コマンド', () => {
    it('analyze-legacy コマンドが従来のAnalyzeCommandを実行する', async () => {
      // ARRANGE
      const testPath = './test-path';
      const mockArgv = ['node', 'rimor', 'analyze-legacy', testPath, '--verbose'];
      
      // process.argvをモック
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視（実際のCLI呼び出しではないため）
      }

      // ASSERT - 後方互換性として従来のAnalyzeCommandが呼ばれることを期待
      expect(AnalyzeCommand).toHaveBeenCalled();
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: testPath,
          verbose: true,
          format: 'text'
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });

    it('analyze-legacy コマンドが全てのオプションを正しく処理する', async () => {
      // ARRANGE
      const mockArgv = [
        'node', 'rimor', 'analyze-legacy', './src',
        '--format=json',
        '--output-json=report.json',
        '--include-details',
        '--severity=critical,high'
      ];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: './src',
          format: 'json',
          outputJson: 'report.json',
          includeDetails: true,
          severity: ['critical', 'high']
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });
  });

  describe('新しい analyze コマンド', () => {
    it('analyze コマンドがUnifiedAnalyzeCommandを実行する', async () => {
      // ARRANGE
      const testPath = './test-path';
      const mockArgv = ['node', 'rimor', 'analyze', testPath, '--verbose'];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT - 新しいanalyzeコマンドはUnifiedAnalyzeCommandを使用
      expect(UnifiedAnalyzeCommand).toHaveBeenCalled();
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: testPath,
          verbose: true,
          format: 'text'
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });

    it('デフォルトコマンド（引数なし）がUnifiedAnalyzeCommandを実行する', async () => {
      // ARRANGE - 引数なしの場合はデフォルトでanalyzeが実行される
      const mockArgv = ['node', 'rimor'];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT - デフォルトコマンドは新しいUnifiedAnalyzeCommandを使用
      expect(UnifiedAnalyzeCommand).toHaveBeenCalled();
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '.',  // デフォルトパス
          format: 'text'
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });

    it('analyze コマンドが統合分析オプションを正しく処理する', async () => {
      // ARRANGE
      const mockArgv = [
        'node', 'rimor', 'analyze', './src',
        '--format=json',
        '--verbose',
        '--include-recommendations',
        '--enable-taint-analysis',
        '--enable-intent-extraction',
        '--enable-gap-detection',
        '--enable-nist-evaluation'
      ];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: './src',
          format: 'json',
          verbose: true,
          includeRecommendations: true,
          enableTaintAnalysis: true,
          enableIntentExtraction: true,
          enableGapDetection: true,
          enableNistEvaluation: true
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });
  });

  describe('unified-analyze コマンド', () => {
    it('unified-analyze コマンドが引き続き動作する（後方互換性）', async () => {
      // ARRANGE
      const testPath = './test-path';
      const mockArgv = ['node', 'rimor', 'unified-analyze', testPath, '--format=markdown'];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT - unified-analyzeコマンドは引き続き存在し、UnifiedAnalyzeCommandを使用
      expect(UnifiedAnalyzeCommand).toHaveBeenCalled();
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: testPath,
          format: 'markdown'
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });
  });

  describe('コマンドルーティングの一貫性', () => {
    it('analyze と unified-analyze が同じUnifiedAnalyzeCommandを使用する', async () => {
      // ARRANGE & ACT - analyze コマンド
      const analyzeArgv = ['node', 'rimor', 'analyze', './src'];
      const originalArgv = process.argv;
      
      process.argv = analyzeArgv;
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }
      
      const analyzeCallCount = (UnifiedAnalyzeCommand as jest.MockedClass<typeof UnifiedAnalyzeCommand>).mock.calls.length;
      
      // Reset mocks
      jest.clearAllMocks();
      
      // ACT - unified-analyze コマンド
      const unifiedArgv = ['node', 'rimor', 'unified-analyze', './src'];
      process.argv = unifiedArgv;
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }
      
      const unifiedCallCount = (UnifiedAnalyzeCommand as jest.MockedClass<typeof UnifiedAnalyzeCommand>).mock.calls.length;

      // ASSERT - 両方のコマンドがUnifiedAnalyzeCommandを使用
      expect(analyzeCallCount).toBeGreaterThan(0);
      expect(unifiedCallCount).toBeGreaterThan(0);

      // Cleanup
      process.argv = originalArgv;
    });

    it('analyze-legacy のみが従来のAnalyzeCommandを使用する', async () => {
      // ARRANGE & ACT - analyze-legacy コマンド
      const legacyArgv = ['node', 'rimor', 'analyze-legacy', './src'];
      const originalArgv = process.argv;
      
      process.argv = legacyArgv;
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT - analyze-legacyのみがAnalyzeCommandを使用
      expect(AnalyzeCommand).toHaveBeenCalled();
      expect(UnifiedAnalyzeCommand).not.toHaveBeenCalled();

      // Cleanup
      process.argv = originalArgv;
    });
  });

  describe('オプション互換性', () => {
    it('従来のanalyzeオプションが新しいanalyzeコマンドでも動作する', async () => {
      // ARRANGE - 従来のオプションを新しいanalyzeコマンドで使用
      const mockArgv = [
        'node', 'rimor', 'analyze', './src',
        '--verbose',
        '--format=json',
        '--parallel',
        '--cache',
        '--include-details',
        '--include-recommendations'
      ];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT - 従来のオプションが新しいコマンドでも正しく処理される
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: './src',
          verbose: true,
          format: 'json',
          parallel: true,
          includeDetails: true,
          includeRecommendations: true
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });

    it('統合分析特有のオプションが正しく処理される', async () => {
      // ARRANGE - 統合分析特有のオプション
      const mockArgv = [
        'node', 'rimor', 'analyze', './src',
        '--enable-taint-analysis=false',
        '--enable-intent-extraction=true',
        '--enable-gap-detection=true',
        '--enable-nist-evaluation=false',
        '--timeout=60000',
        '--parallel'
      ];
      
      const originalArgv = process.argv;
      process.argv = mockArgv;

      // ACT
      try {
        await cli.run();
      } catch (error) {
        // テスト環境でのyargsエラーは無視
      }

      // ASSERT
      expect(mockUnifiedAnalyzeCommand.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          path: './src',
          enableTaintAnalysis: false,
          enableIntentExtraction: true,
          enableGapDetection: true,
          enableNistEvaluation: false,
          timeout: 60000,
          parallel: true
        })
      );

      // Cleanup
      process.argv = originalArgv;
    });
  });
});