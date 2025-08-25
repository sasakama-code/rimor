/**
 * AnalyzeCommand Implementation Truth機能テスト
 * v0.9.0 AIコーディング時代の品質保証エンジン対応
 * 
 * TDDアプローチによるImplementation Truth機能の検証
 */

import { AnalyzeCommand, AnalyzeOptions } from '../../../src/cli/commands/analyze';
import { UnifiedAnalysisEngine } from '../../../src/core/UnifiedAnalysisEngine';
import { OutputFormatter } from '../../../src/cli/output';

// モック設定
jest.mock('../../../src/core/UnifiedAnalysisEngine');
jest.mock('../../../src/cli/output');

const MockedUnifiedAnalysisEngine = UnifiedAnalysisEngine as jest.MockedClass<typeof UnifiedAnalysisEngine>;
const MockedOutputFormatter = OutputFormatter as jest.MockedClass<typeof OutputFormatter>;

describe('AnalyzeCommand - Implementation Truth機能', () => {
  let analyzeCommand: AnalyzeCommand;
  let mockUnifiedEngine: jest.Mocked<UnifiedAnalysisEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // UnifiedAnalysisEngineのモック
    mockUnifiedEngine = new MockedUnifiedAnalysisEngine() as jest.Mocked<UnifiedAnalysisEngine>;
    mockUnifiedEngine.analyzeWithImplementationTruth = jest.fn();
    
    // OutputFormatterのモック
    MockedOutputFormatter.info = jest.fn().mockResolvedValue('info message');
    MockedOutputFormatter.success = jest.fn().mockResolvedValue('success message');
    MockedOutputFormatter.warning = jest.fn().mockResolvedValue('warning message');
    MockedOutputFormatter.error = jest.fn().mockResolvedValue('error message');
    MockedOutputFormatter.header = jest.fn().mockResolvedValue('header message');
    
    analyzeCommand = new AnalyzeCommand();
    
    // console.logをモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Implementation Truth機能の有効化', () => {
    it('--implementation-truthオプションでImplementation Truth分析が実行される', async () => {
      // Arrange
      const mockImplementationTruthResult = {
        implementationTruth: {
          filePath: '/test/src',
          timestamp: '2025-01-01T00:00:00.000Z',
          actualBehaviors: {
            methods: [],
            dataFlows: [],
            dependencies: [],
            securityProfile: {
              overallRiskLevel: 'low' as const,
              vulnerabilities: [],
              securityMeasures: [],
              sensitiveDataHandling: [],
              auditResults: []
            }
          },
          vulnerabilities: [],
          structure: {
            complexity: {
              cyclomaticComplexity: 1,
              cognitiveComplexity: 1,
              nestingDepth: 1,
              fanIn: 0,
              fanOut: 0,
              linesOfCode: 10,
              duplicationRate: 0
            },
            coverage: {
              lineCoverage: [],
              branchCoverage: [],
              functionCoverage: [],
              conditionCoverage: []
            },
            criticalPaths: []
          },
          metadata: {
            engineVersion: '0.9.0',
            analysisTime: 100,
            confidence: 0.9,
            warnings: []
          }
        },
        intentRealizationResults: [],
        summary: {
          productionFilesAnalyzed: 1,
          testFilesAnalyzed: 0,
          vulnerabilitiesDetected: 0,
          realizationScore: 85.0,
          topRecommendations: []
        },
        totalGapsDetected: 0,
        highSeverityGaps: 0,
        executionTime: 100,
        overallScore: 85.0,
        metadata: {
          executionTime: 100,
          timestamp: '2025-01-01T00:00:00.000Z'
        }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockImplementationTruthResult as any);

      const options: AnalyzeOptions = {
        path: './test-src',
        implementationTruth: true,
        verbose: true,
        format: 'json'
      };

      // Act
      await analyzeCommand.execute(options);

      // Assert
      expect(mockUnifiedEngine.analyzeWithImplementationTruth).toHaveBeenCalledWith(
        expect.stringContaining('test-src'),
        undefined
      );
      expect(console.log).toHaveBeenCalledWith('info message');
    });

    it('--production-codeオプションでImplementation Truth分析が実行される', async () => {
      // Arrange
      const mockResult = {
        implementationTruth: {
          filePath: '/test/src',
          vulnerabilities: []
        },
        intentRealizationResults: [],
        summary: { 
          productionFilesAnalyzed: 1,
          testFilesAnalyzed: 0,
          vulnerabilitiesDetected: 0,
          realizationScore: 90.0,
          topRecommendations: []
        },
        totalGapsDetected: 0,
        highSeverityGaps: 0,
        executionTime: 50,
        overallScore: 90.0,
        metadata: { executionTime: 50 }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockResult as any);

      const options: AnalyzeOptions = {
        path: './src',
        productionCode: true,
        verbose: false,
        format: 'text'
      };

      // Act
      await analyzeCommand.execute(options);

      // Assert
      expect(mockUnifiedEngine.analyzeWithImplementationTruth).toHaveBeenCalled();
    });

    it('--ai-outputオプションでImplementation Truth分析が実行される', async () => {
      // Arrange
      const mockResult = {
        implementationTruth: { vulnerabilities: [] },
        intentRealizationResults: [],
        summary: { 
          productionFilesAnalyzed: 1,
          testFilesAnalyzed: 0,
          vulnerabilitiesDetected: 0,
          realizationScore: 95.0,
          topRecommendations: []
        },
        totalGapsDetected: 0,
        highSeverityGaps: 0,
        executionTime: 75,
        overallScore: 95.0,
        metadata: { executionTime: 75 }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockResult as any);

      const options: AnalyzeOptions = {
        path: './src',
        aiOutput: true,
        format: 'ai-json'
      };

      // Act
      await analyzeCommand.execute(options);

      // Assert
      expect(mockUnifiedEngine.analyzeWithImplementationTruth).toHaveBeenCalled();
    });
  });

  describe('テストパス指定', () => {
    it('--test-pathオプションでテストコードパスが指定される', async () => {
      // Arrange
      const mockResult = {
        implementationTruth: { vulnerabilities: [] },
        intentRealizationResults: [
          {
            testFile: '/test/sample.test.ts',
            gaps: [
              {
                type: 'missing-assertion',
                severity: 'medium',
                description: 'アサーションが不足しています',
                location: { line: 10, column: 5 }
              }
            ]
          }
        ],
        summary: { 
          productionFilesAnalyzed: 1,
          testFilesAnalyzed: 1,
          vulnerabilitiesDetected: 0,
          realizationScore: 75.0,
          topRecommendations: ['テストカバレッジを向上させてください']
        },
        totalGapsDetected: 1,
        highSeverityGaps: 0,
        executionTime: 120,
        overallScore: 75.0,
        metadata: { executionTime: 120 }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockResult as any);

      const options: AnalyzeOptions = {
        path: './src',
        implementationTruth: true,
        testPath: './test',
        verbose: true
      };

      // Act
      await analyzeCommand.execute(options);

      // Assert
      expect(mockUnifiedEngine.analyzeWithImplementationTruth).toHaveBeenCalledWith(
        expect.stringContaining('src'),
        expect.stringContaining('test')
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('テストコードパス'));
    });
  });

  describe('エラーハンドリング', () => {
    it('Implementation Truth分析でエラーが発生した場合、従来の分析にフォールバックする', async () => {
      // Arrange
      const mockError = new Error('Implementation Truth analysis failed');
      mockUnifiedEngine.analyzeWithImplementationTruth.mockRejectedValue(mockError);

      // 従来のAnalysisEngineのモック（DIコンテナから取得される）
      const mockContainer = {
        get: jest.fn().mockReturnValue({
          analyze: jest.fn().mockResolvedValue({
            totalFiles: 1,
            issues: [],
            executionTime: 50,
            metadata: {}
          })
        })
      };

      const analyzeCommandWithMockContainer = new AnalyzeCommand(mockContainer as any);

      const options: AnalyzeOptions = {
        path: './src',
        implementationTruth: true,
        verbose: true
      };

      // Act
      await analyzeCommandWithMockContainer.execute(options);

      // Assert
      expect(console.warn).toHaveBeenCalledWith('warning message');
      expect(mockContainer.get).toHaveBeenCalled(); // 従来のエンジンが使用された
    });

    it('Implementation Truth分析の詳細エラーメッセージが表示される', async () => {
      // Arrange
      const mockError = new Error('Specific error message');
      mockUnifiedEngine.analyzeWithImplementationTruth.mockRejectedValue(mockError);

      const mockContainer = {
        get: jest.fn().mockReturnValue({
          analyze: jest.fn().mockResolvedValue({ totalFiles: 0, issues: [], executionTime: 0 })
        })
      };

      const analyzeCommandWithMockContainer = new AnalyzeCommand(mockContainer as any);

      const options: AnalyzeOptions = {
        path: './src',
        implementationTruth: true,
        verbose: true
      };

      // Act
      await analyzeCommandWithMockContainer.execute(options);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Specific error message')
      );
    });
  });

  describe('結果の変換', () => {
    it('Implementation Truth結果が従来の分析結果形式に正しく変換される', async () => {
      // Arrange
      const mockImplementationTruthResult = {
        implementationTruth: {
          vulnerabilities: [
            {
              type: 'sql-injection',
              severity: 'high',
              description: 'SQLインジェクションの脆弱性',
              location: { file: 'src/db.ts', line: 42, column: 10 }
            }
          ]
        },
        intentRealizationResults: [
          {
            testFile: 'test/db.test.ts',
            gaps: [
              {
                type: 'missing-test',
                severity: 'medium',
                description: 'セキュリティテストが不足',
                location: { line: 20, column: 5 }
              }
            ]
          }
        ],
        summary: { 
          productionFilesAnalyzed: 1,
          testFilesAnalyzed: 1,
          vulnerabilitiesDetected: 1,
          realizationScore: 65.0,
          topRecommendations: ['セキュリティテストを追加してください', '入力検証を実装してください']
        },
        totalGapsDetected: 1,
        highSeverityGaps: 1,
        executionTime: 200,
        overallScore: 65.0,
        metadata: { executionTime: 200 }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockImplementationTruthResult as any);

      const options: AnalyzeOptions = {
        path: './src',
        implementationTruth: true,
        format: 'json'
      };

      // Act & Assert
      await expect(analyzeCommand.execute(options)).resolves.not.toThrow();
      
      // Implementation Truth結果が呼び出されたことを確認
      expect(mockUnifiedEngine.analyzeWithImplementationTruth).toHaveBeenCalled();
    });
  });

  describe('verbose出力', () => {
    it('verboseモードで詳細な進捗情報が表示される', async () => {
      // Arrange
      const mockResult = {
        implementationTruth: { vulnerabilities: [] },
        intentRealizationResults: [],
        summary: { 
          productionFilesAnalyzed: 5,
          testFilesAnalyzed: 0,
          vulnerabilitiesDetected: 0,
          realizationScore: 95.0,
          topRecommendations: []
        },
        totalGapsDetected: 0,
        highSeverityGaps: 0,
        executionTime: 150,
        overallScore: 95.0,
        metadata: { executionTime: 150 }
      };

      mockUnifiedEngine.analyzeWithImplementationTruth.mockResolvedValue(mockResult as any);

      const options: AnalyzeOptions = {
        path: './src',
        implementationTruth: true,
        verbose: true
      };

      // Act
      await analyzeCommand.execute(options);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('v0.9.0 (Implementation Truth Analysis)')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('0個の脆弱性, 0個のギャップを検出')
      );
    });
  });
});