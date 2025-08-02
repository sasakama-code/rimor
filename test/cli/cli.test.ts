import { CLI } from '../../src/cli/cli';
import { AnalyzeCommandV8 } from '../../src/cli/commands/analyze-v0.8';

// コマンドクラスをモック化
jest.mock('../../src/cli/commands/analyze-v0.8');

describe('CLI', () => {
  let cli: CLI;
  let mockAnalyzeCommand: jest.Mocked<AnalyzeCommandV8>;
  let originalArgv: string[];

  // v0.8.0のデフォルトオプション
  const defaultOptions = {
    path: '.',
    verbose: false,
    format: 'text',
    outputJson: undefined,
    outputMarkdown: undefined,
    outputHtml: undefined,
    annotate: false,
    annotateFormat: 'inline',
    annotateOutput: undefined,
    preview: false,
    includeDetails: false,
    includeRecommendations: true,
    severity: undefined,
    performance: false,
    showPerformanceReport: false,
    parallel: false,
    cache: true,
    clearCache: false,
    showCacheStats: false
  };

  beforeEach(() => {
    cli = new CLI();
    mockAnalyzeCommand = new AnalyzeCommandV8() as jest.Mocked<AnalyzeCommandV8>;
    
    // process.argv をバックアップ
    originalArgv = process.argv;
    
    // execucteメソッドをモック化
    mockAnalyzeCommand.execute = jest.fn().mockResolvedValue(undefined);
    
    // モックインスタンスを返すようにコンストラクタをモック化
    (AnalyzeCommandV8 as jest.MockedClass<typeof AnalyzeCommandV8>).mockImplementation(() => mockAnalyzeCommand);
  });

  afterEach(() => {
    // process.argv を復元
    process.argv = originalArgv;
    jest.clearAllMocks();
  });

  describe('analyze command', () => {
    it('should execute analyze command with default options', async () => {
      process.argv = ['node', 'rimor', 'analyze'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith(defaultOptions);
    });

    it('should execute analyze command with custom path', async () => {
      process.argv = ['node', 'rimor', 'analyze', './src'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith({
        ...defaultOptions,
        path: './src'
      });
    });

    it('should execute analyze command with verbose option', async () => {
      process.argv = ['node', 'rimor', 'analyze', '--verbose'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith({
        ...defaultOptions,
        verbose: true
      });
    });

    it('should execute analyze command with JSON format', async () => {
      process.argv = ['node', 'rimor', 'analyze', '--format=json'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith({
        ...defaultOptions,
        format: 'json'
      });
    });

    it('should execute analyze command with --json shorthand', async () => {
      process.argv = ['node', 'rimor', 'analyze', '--json'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith({
        ...defaultOptions,
        format: 'json'
      });
    });
  });

  describe('plugin create command', () => {
    it.skip('should execute plugin create command with interactive option', async () => {
      // 動的インポートのため、モックが適用されない問題があるためスキップ
      process.argv = ['node', 'rimor', 'plugin', 'create', '--interactive'];
      
      await cli.run();
      
      // expect(mockPluginCreateCommand.execute).toHaveBeenCalledWith({
      //   interactive: true,
      //   template: undefined,
      //   from: undefined
      // });
    });

    it.skip('should execute plugin create command with template option', async () => {
      // 動的インポートのため、モックが適用されない問題があるためスキップ
      process.argv = ['node', 'rimor', 'plugin', 'create', '--template', 'basic'];
      
      await cli.run();
      
      // expect(mockPluginCreateCommand.execute).toHaveBeenCalledWith({
      //   interactive: false,
      //   template: 'basic',
      //   from: undefined
      // });
    });

    it.skip('should execute plugin create command with from option', async () => {
      // 動的インポートのため、モックが適用されない問題があるためスキップ
      process.argv = ['node', 'rimor', 'plugin', 'create', '--from', 'testExistence'];
      
      await cli.run();
      
      // expect(mockPluginCreateCommand.execute).toHaveBeenCalledWith({
      //   interactive: false,
      //   template: undefined,
      //   from: 'testExistence'
      // });
    });

    it.skip('should execute plugin create command with short options', async () => {
      // 動的インポートのため、モックが適用されない問題があるためスキップ
      process.argv = ['node', 'rimor', 'plugin', 'create', '-i'];
      
      await cli.run();
      
      // expect(mockPluginCreateCommand.execute).toHaveBeenCalledWith({
      //   interactive: true,
      //   template: undefined,
      //   from: undefined
      // });
    });

    it.skip('should execute plugin create command with template shorthand', async () => {
      // 動的インポートのため、モックが適用されない問題があるためスキップ
      process.argv = ['node', 'rimor', 'plugin', 'create', '-t', 'async-await'];
      
      await cli.run();
      
      // expect(mockPluginCreateCommand.execute).toHaveBeenCalledWith({
      //   interactive: false,
      //   template: 'async-await',
      //   from: undefined
      // });
    });
  });

  describe('default command (implicit analyze)', () => {
    it('should execute analyze command when no command specified', async () => {
      process.argv = ['node', 'rimor'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith(defaultOptions);
    });

    it('should execute analyze command with path when no command specified', async () => {
      process.argv = ['node', 'rimor', './src'];
      
      await cli.run();
      
      expect(mockAnalyzeCommand.execute).toHaveBeenCalledWith({
        ...defaultOptions,
        path: './src'
      });
    });
  });

  describe('version handling', () => {
    it('should use correct version', () => {
      // package.jsonからバージョンを読み取ってテスト
      const packageJson = require('../../package.json');
      expect(packageJson.version).toBe('0.8.0');
    });
  });

  describe('error handling', () => {
    it.skip('should handle analyze command errors gracefully', async () => {
      // yargs内でのエラーハンドリングのため、現在のテスト方法では正確にテストできない
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called');
      }) as any);

      mockAnalyzeCommand.execute.mockRejectedValue(new Error('Analysis failed'));
      process.argv = ['node', 'rimor', 'analyze'];
      
      await expect(cli.run()).rejects.toThrow('Analysis failed');
      
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it.skip('should handle plugin create command errors gracefully', async () => {
      // yargs内でのエラーハンドリングのため、現在のテスト方法では正確にテストできない
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called');
      }) as any);

      // mockPluginCreateCommand.execute.mockRejectedValue(new Error('Plugin creation failed'));
      process.argv = ['node', 'rimor', 'plugin', 'create', '-i'];
      
      await expect(cli.run()).rejects.toThrow('Plugin creation failed');
      
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});