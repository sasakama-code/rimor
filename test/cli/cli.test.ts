import { CLI } from '../../src/cli/cli';
import { AnalyzeCommandV8 } from '../../src/cli/commands/analyze-v0.8';
import { DomainAnalyzeCommand } from '../../src/cli/commands/domain-analyze';

// inquirerをモック化
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// コマンドクラスをモック化
jest.mock('../../src/cli/commands/analyze-v0.8');
jest.mock('../../src/cli/commands/domain-analyze');

describe('CLI', () => {
  let cli: CLI;
  let mockAnalyzeCommand: jest.Mocked<AnalyzeCommandV8>;
  let originalArgv: string[];
  let processExitSpy: jest.SpyInstance;

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
    
    // process.exitをモック化してJestワーカーエラーを防ぐ
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as any);
    
    // execucteメソッドをモック化
    mockAnalyzeCommand.execute = jest.fn().mockResolvedValue(undefined);
    
    // モックインスタンスを返すようにコンストラクタをモック化
    (AnalyzeCommandV8 as jest.MockedClass<typeof AnalyzeCommandV8>).mockImplementation(() => mockAnalyzeCommand);
  });

  afterEach(() => {
    // process.argv を復元
    process.argv = originalArgv;
    // process.exitモックを復元
    processExitSpy.mockRestore();
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

  describe('domain-analyze command', () => {
    let mockDomainAnalyzeCommand: jest.Mocked<DomainAnalyzeCommand>;

    beforeEach(() => {
      mockDomainAnalyzeCommand = new DomainAnalyzeCommand() as jest.Mocked<DomainAnalyzeCommand>;
      mockDomainAnalyzeCommand.execute = jest.fn().mockResolvedValue(undefined);
      (DomainAnalyzeCommand as jest.MockedClass<typeof DomainAnalyzeCommand>).mockImplementation(() => mockDomainAnalyzeCommand);
    });

    it('should execute domain-analyze command with default options', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        path: '.',
        format: 'text',
        verbose: false,
        interactive: true
      }));
    });

    it('should execute domain-analyze command with custom path', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze', './src'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        path: './src'
      }));
    });

    it('should execute domain-analyze command with --interactive=false', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze', '--interactive=false'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        interactive: false
      }));
    });

    it('should execute domain-analyze command with --format=json', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze', '--format=json'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        format: 'json'
      }));
    });

    it('should execute domain-analyze command with --verify option', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze', '--verify'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        verify: true
      }));
    });

    it('should execute domain-analyze command with custom parameters', async () => {
      process.argv = ['node', 'rimor', 'domain-analyze', '--max-clusters=10', '--min-keyword-frequency=5'];
      
      await cli.run();
      
      expect(mockDomainAnalyzeCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
        maxClusters: 10,
        minKeywordFrequency: 5
      }));
    });

    it('should handle domain-analyze command errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockDomainAnalyzeCommand.execute.mockRejectedValue(new Error('Domain analysis failed'));
      process.argv = ['node', 'rimor', 'domain-analyze'];
      
      await expect(cli.run()).rejects.toThrow('Domain analysis failed');
      
      consoleSpy.mockRestore();
    });
  });
});