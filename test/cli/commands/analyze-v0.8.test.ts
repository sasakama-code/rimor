/**
 * Analyze Command v0.8.0 Tests
 * Context Engineering対応の分析コマンドテスト
 */

import { AnalyzeCommandV8 } from '../../../src/cli/commands/analyze-v0.8';
import { container, initializeContainer, TYPES } from '../../../src/container';
import { IAnalysisEngine } from '../../../src/core/interfaces/IAnalysisEngine';
import { IReporter } from '../../../src/core/interfaces/IReporter';
import { ISecurityAuditor } from '../../../src/core/interfaces/ISecurityAuditor';
import * as fs from 'fs';
import * as path from 'path';
import { errorHandler } from '../../../src/utils/errorHandler';
import { CLISecurity, DEFAULT_CLI_SECURITY_LIMITS } from '../../../src/security/CLISecurity';

// モック
jest.mock('fs');
jest.mock('../../../src/utils/errorHandler');
jest.mock('../../../src/cli/output', () => ({
  OutputFormatter: {
    error: jest.fn().mockImplementation((message: string) => Promise.resolve(`error: ${message}`)),
    warning: jest.fn().mockImplementation((message: string) => Promise.resolve(`warning: ${message}`)),
    success: jest.fn().mockImplementation((message: string) => Promise.resolve(`success: ${message}`)),
    info: jest.fn().mockImplementation((message: string) => Promise.resolve(`info: ${message}`)),
    header: jest.fn().mockImplementation((message: string) => Promise.resolve(`header: ${message}`))
  }
}));
jest.mock('../../../src/utils/cleanupManager', () => ({
  cleanupManager: {
    performStartupCleanup: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../../../src/security/CLISecurity');

const mockFs = fs as jest.Mocked<typeof fs>;

// ヘルパー関数：モックの作成
function createMocks() {
  // errorHandlerのモック設定
  const mockedErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;
  mockedErrorHandler.handleError = jest.fn().mockReturnValue({
    type: 'TEST_ERROR',
    message: 'Test error message',
    originalError: new Error('Test error'),
    recoverable: false
  });
  const mockAnalysisEngine: jest.Mocked<IAnalysisEngine> = {
    analyze: jest.fn().mockResolvedValue({
      totalFiles: 10,
      issues: [],
      executionTime: 1000
    })
  };

  const mockReporter: jest.Mocked<IReporter> = {
    generateAnalysisReport: jest.fn().mockResolvedValue({
      success: true,
      outputPath: '/output/report.json'
    }),
    generateSecurityReport: jest.fn(),
    generateCombinedReport: jest.fn().mockResolvedValue({
      success: true,
      content: 'Combined report content'
    }),
    printToConsole: jest.fn()
  };

  const mockSecurityAuditor: jest.Mocked<ISecurityAuditor> = {
    audit: jest.fn().mockResolvedValue({
      threats: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      executionTime: 100,
      filesScanned: 10
    }),
    scanFile: jest.fn().mockResolvedValue([])
  };

  // CLISecurityモックの実装
  const MockedCLISecurity = CLISecurity as jest.MockedClass<typeof CLISecurity>;
  MockedCLISecurity.mockImplementation(() => {
    const instance = {
      limits: DEFAULT_CLI_SECURITY_LIMITS,
      projectRoot: '/test/project',
      validateAllArguments: jest.fn().mockImplementation((args) => ({
        isValid: true,
        allErrors: [],
        allWarnings: [],
        allSecurityIssues: [],
        sanitizedArgs: {
          path: args.path || '/test/project',
          format: args.format || 'text',
          outputFile: args.outputFile,
          ...args
        }
      })),
      validateAnalysisPath: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      validateOutputPath: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      validateFormat: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      validateCommandArguments: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      validatePluginOptions: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      sanitizePath: jest.fn().mockImplementation(p => p)
    };
    return instance as any;
  });
  
  const mockCliSecurity = new MockedCLISecurity('/', DEFAULT_CLI_SECURITY_LIMITS);

  return {
    mockAnalysisEngine,
    mockReporter,
    mockSecurityAuditor,
    mockCliSecurity
  };
}

// ヘルパー関数：DIコンテナのセットアップ
function setupContainer(mocks: ReturnType<typeof createMocks>) {
  const testContainer = initializeContainer();
  
  // コンテナバインディングを上書き
  testContainer.unbind(TYPES.AnalysisEngine);
  testContainer.bind<IAnalysisEngine>(TYPES.AnalysisEngine).toConstantValue(mocks.mockAnalysisEngine);
  testContainer.unbind(TYPES.Reporter);
  testContainer.bind<IReporter>(TYPES.Reporter).toConstantValue(mocks.mockReporter);
  testContainer.unbind(TYPES.SecurityAuditor);
  testContainer.bind<ISecurityAuditor>(TYPES.SecurityAuditor).toConstantValue(mocks.mockSecurityAuditor);
  
  return testContainer;
}

describe('AnalyzeCommandV8', () => {
  describe('execute', () => {
    it('should perform basic analysis', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      // issuesがある場合のテスト
      mocks.mockAnalysisEngine.analyze.mockResolvedValue({
        totalFiles: 10,
        issues: [
          {
            type: 'missing-test',
            file: 'test.ts',
            line: 10,
            severity: 'high',
            message: 'Test missing'
          }
        ],
        executionTime: 1000
      });
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code ${code}`);
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await expect(command.execute({
          path: '/test/project',
          verbose: false
        })).rejects.toThrow('process.exit called with code 1');
        
        expect(mocks.mockAnalysisEngine.analyze).toHaveBeenCalledWith(
          path.resolve('/test/project')
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should generate JSON output when specified', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputJson: '/output/analysis.json'
        });
        
        // issuesが空の場合、process.exitは呼ばれない
        expect(mockExit).not.toHaveBeenCalled();
        
        expect(mocks.mockReporter.generateAnalysisReport).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            format: expect.anything(),
            outputPath: '/output/analysis.json'
          })
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should generate Markdown output when specified', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mocks.mockReporter.generateAnalysisReport.mockResolvedValue({
        success: true,
        outputPath: '/output/analysis.md'
      });
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputMarkdown: '/output/analysis.md',
          includeDetails: true
        });
        
        expect(mockExit).not.toHaveBeenCalled();
        
        // includeDetailsがtrueの場合、generateCombinedReportが呼ばれる
        expect(mocks.mockReporter.generateCombinedReport).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Object),
          expect.objectContaining({
            format: 'markdown',
            outputPath: '/output/analysis.md',
            includeDetails: true,
            includeSummary: true
          })
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should generate HTML output when specified', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mocks.mockReporter.generateAnalysisReport.mockResolvedValue({
        success: true,
        outputPath: '/output/analysis.html'
      });
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputHtml: '/output/analysis.html'
        });
        
        expect(mockExit).not.toHaveBeenCalled();
        
        expect(mocks.mockReporter.generateAnalysisReport).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            format: expect.anything(),
            outputPath: '/output/analysis.html'
          })
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should include security audit when includeDetails is true', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          includeDetails: true,
          outputJson: '/output/combined.json'
        });
        
        expect(mocks.mockSecurityAuditor.audit).toHaveBeenCalledWith(
          path.resolve('/test/project')
        );
        expect(mocks.mockReporter.generateCombinedReport).toHaveBeenCalled();
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should handle multiple output formats', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputJson: '/output/report.json',
          outputMarkdown: '/output/report.md',
          outputHtml: '/output/report.html'
        });
        
        expect(mockExit).not.toHaveBeenCalled();
        
        // 各フォーマットでgenerateAnalysisReportが呼ばれることを確認
        expect(mocks.mockReporter.generateAnalysisReport).toHaveBeenCalledTimes(3);
        
        const calls = mocks.mockReporter.generateAnalysisReport.mock.calls;
        const formats = calls.map(call => call[1].format);
        
        expect(formats).toContain('json');
        expect(formats).toContain('markdown');
        expect(formats).toContain('html');
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should handle file not found error', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(false);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code ${code}`);
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await expect(command.execute({
          path: '/nonexistent/path'
        })).rejects.toThrow('process.exit called with code 1');
        
        // console.errorが呼ばれたことを確認
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should handle analysis errors gracefully', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mocks.mockAnalysisEngine.analyze.mockRejectedValue(
        new Error('Analysis failed')
      );
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code ${code}`);
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await expect(command.execute({
          path: '/test/project'
        })).rejects.toThrow('process.exit called with code 1');
        
        // console.errorが呼ばれたことを確認（2回：Original errorとformatted error）
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should respect includeRecommendations option', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputMarkdown: '/output/report.md',
          includeRecommendations: false
        });
        
        expect(mocks.mockReporter.generateAnalysisReport).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            includeRecommendations: false
          })
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });

  describe('security validation', () => {
    it('should validate CLI arguments for security issues', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code ${code}`);
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // issuesがある場合をモック
        mocks.mockAnalysisEngine.analyze.mockResolvedValue({
          totalFiles: 10,
          issues: [{ type: 'test', file: 'test.ts', line: 1, severity: 'high', message: 'test' }],
          executionTime: 1000
        });
        
        await expect(command.execute({
          path: '../../../etc/passwd',
          outputJson: '/etc/sensitive.json'
        })).rejects.toThrow('process.exit called with code 1');
        
        // セキュリティ検証が実行されることを確認
        expect(mocks.mockCliSecurity.validateAllArguments).toHaveBeenCalled();
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });

  describe('console output formatting', () => {
    it('should not show header when outputting to file', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          outputJson: '/output/report.json'
        });
        
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Rimor v0.8.0')
        );
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should show verbose information when verbose flag is set', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック（呼ばれない想定）
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project',
          verbose: true
        });
        
        expect(mockExit).not.toHaveBeenCalled();
        
        // console.logが呼ばれているか確認
        expect(consoleLogSpy).toHaveBeenCalled();
        
        // console.logに渡された値を確認
        const logCalls = consoleLogSpy.mock.calls;
        
        // 最低限、ヘッダーと詳細情報が出力されていることを確認
        expect(logCalls.length).toBeGreaterThanOrEqual(2);
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });

  describe('exit codes', () => {
    it('should exit with code 0 when no issues found', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      mocks.mockAnalysisEngine.analyze.mockResolvedValue({
        totalFiles: 10,
        issues: [],
        executionTime: 1000
      });
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await command.execute({
          path: '/test/project'
        });
        
        expect(mockExit).not.toHaveBeenCalled();
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });

    it('should exit with code 1 when issues are found', async () => {
      // このテスト専用のセットアップ
      const mocks = createMocks();
      const testContainer = setupContainer(mocks);
      
      // issuesがある場合のモック設定
      mocks.mockAnalysisEngine.analyze.mockResolvedValue({
        totalFiles: 10,
        issues: [
          {
            type: 'missing-test',
            file: 'test.ts',
            line: 10,
            severity: 'high',
            message: 'Test missing'
          }
        ],
        executionTime: 1000
      });
      
      mockFs.existsSync.mockReturnValue(true);
      
      const command = new AnalyzeCommandV8(testContainer, mocks.mockCliSecurity);
      
      // process.exitのモック
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code ${code}`);
      });
      
      // console のモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await expect(command.execute({
          path: '/test/project'
        })).rejects.toThrow('process.exit called with code 1');
      } finally {
        // クリーンアップ
        mockExit.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });
});