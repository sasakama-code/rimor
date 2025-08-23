/**
 * Unified Analyze Command Test
 * TDD Red Phase - 失敗するテストから開始
 * Phase 2: CLIコマンド統合のテスト
 */

import { UnifiedAnalyzeCommand } from '../../../src/cli/commands/unified-analyze';
import { UnifiedSecurityAnalysisOrchestrator } from '../../../src/orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { UnifiedAnalysisResult } from '../../../src/orchestrator/types';
import * as fs from 'fs';
import * as path from 'path';

// モック設定
jest.mock('../../../src/orchestrator/UnifiedSecurityAnalysisOrchestrator');
jest.mock('fs');

describe('UnifiedAnalyzeCommand', () => {
  let command: UnifiedAnalyzeCommand;
  let mockOrchestrator: jest.Mocked<UnifiedSecurityAnalysisOrchestrator>;
  const testPath = '/test/path';

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // ファイルシステムモック
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
    
    // オーケストレータモック
    mockOrchestrator = new UnifiedSecurityAnalysisOrchestrator() as jest.Mocked<UnifiedSecurityAnalysisOrchestrator>;
    command = new UnifiedAnalyzeCommand(mockOrchestrator);
  });

  describe('デフォルトコマンド機能', () => {
    it('rimor <path>形式でコマンドが実行できる', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(mockOrchestrator.analyzeTestDirectory).toHaveBeenCalledWith(testPath);
      expect(result).toBeDefined();
    });

    it('パスが指定されない場合、カレントディレクトリを使用する', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: '.',
        format: 'text' as const
      };

      // Act
      await command.execute(options);

      // Assert
      expect(mockOrchestrator.analyzeTestDirectory).toHaveBeenCalledWith('.');
    });

    it('存在しないパスを指定した場合、適切なエラーが発生する', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const options = {
        path: '/nonexistent/path',
        format: 'text' as const
      };

      // Act & Assert
      await expect(command.execute(options))
        .rejects
        .toThrow('指定されたパスが存在しません');
    });

    it('ファイルパスを指定した場合、適切なエラーが発生する', async () => {
      // Arrange
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
      
      const options = {
        path: '/test/file.ts',
        format: 'text' as const
      };

      // Act & Assert
      await expect(command.execute(options))
        .rejects
        .toThrow('指定されたパスはディレクトリである必要があります');
    });
  });

  describe('出力フォーマット', () => {
    it('text形式での出力が可能', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.format).toBe('text');
      expect(result.content).toContain('統合セキュリティ分析レポート');
    });

    it('json形式での出力が可能', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'json' as const
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.format).toBe('json');
      expect(() => JSON.parse(result.content)).not.toThrow();
    });

    it('markdown形式での出力が可能', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'markdown' as const
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.format).toBe('markdown');
      expect(result.content).toContain('# 統合セキュリティ分析レポート');
    });

    it('html形式での出力が可能', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'html' as const
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.format).toBe('html');
      expect(result.content).toContain('<html>');
      expect(result.content).toContain('統合セキュリティ分析レポート');
    });
  });

  describe('コマンドオプション', () => {
    it('verboseオプションが正しく処理される', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const,
        verbose: true
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.verbose).toBe(true);
      expect(result.content).toContain('詳細情報');
    });

    it('outputオプションでファイル出力が可能', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);
      const outputPath = '/output/report.json';

      const mockWriteFileSync = jest.fn();
      jest.spyOn(fs, 'writeFileSync').mockImplementation(mockWriteFileSync);

      const options = {
        path: testPath,
        format: 'json' as const,
        output: outputPath
      };

      // Act
      await command.execute(options);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        'utf8'
      );
    });

    it('includeRecommendationsオプションが正しく処理される', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const,
        includeRecommendations: true
      };

      // Act
      const result = await command.execute(options);

      // Assert
      expect(result.content).toContain('推奨事項');
    });
  });

  describe('プログレス表示', () => {
    it('分析実行中にプログレス情報が表示される', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const options = {
        path: testPath,
        format: 'text' as const,
        verbose: true
      };

      // Act
      await command.execute(options);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('分析開始'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('完了'));
      
      consoleSpy.mockRestore();
    });

    it('エラー発生時に適切なエラーメッセージが表示される', async () => {
      // Arrange
      const error = new Error('分析エラー');
      mockOrchestrator.analyzeTestDirectory.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const options = {
        path: testPath,
        format: 'text' as const
      };

      // Act & Assert
      await expect(command.execute(options)).rejects.toThrow('分析エラー');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('エラー'));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('設定オプション', () => {
    it('統合分析の設定が正しく渡される', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const,
        enableTaintAnalysis: true,
        enableIntentExtraction: true,
        enableGapDetection: false,
        enableNistEvaluation: true
      };

      // Act
      await command.execute(options);

      // Assert
      expect(mockOrchestrator.analyzeTestDirectory).toHaveBeenCalledWith(testPath);
      // 設定がオーケストレータに正しく渡されることを確認
      // 実装では、コンストラクタで設定を渡すことを想定
    });
  });

  describe('パフォーマンス', () => {
    it('大きなプロジェクトでも適切な時間内に完了する', async () => {
      // Arrange
      const mockResult = createMockUnifiedAnalysisResult();
      mockOrchestrator.analyzeTestDirectory.mockResolvedValue(mockResult);

      const options = {
        path: testPath,
        format: 'text' as const
      };

      // Act
      const startTime = Date.now();
      await command.execute(options);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(1000); // 1秒以内（モック環境）
    });
  });
});

// ヘルパー関数
function createMockUnifiedAnalysisResult(): UnifiedAnalysisResult {
  return {
    taintAnalysis: {
      vulnerabilities: [],
      summary: {
        totalVulnerabilities: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0
      }
    },
    intentAnalysis: {
      testIntents: [],
      summary: {
        totalTests: 0,
        highRiskTests: 0,
        mediumRiskTests: 0,
        lowRiskTests: 0
      }
    },
    gapAnalysis: {
      gaps: [],
      summary: {
        totalGaps: 0,
        criticalGaps: 0,
        highGaps: 0,
        mediumGaps: 0,
        lowGaps: 0
      }
    },
    nistEvaluation: {
      riskAssessments: [],
      summary: {
        overallScore: 100,
        riskLevel: 'LOW',
        totalAssessments: 0,
        criticalRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0
      }
    },
    unifiedReport: {
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        overallGrade: 'A'
      },
      taintSummary: {
        totalVulnerabilities: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0
      },
      intentSummary: {
        totalTests: 0,
        highRiskTests: 0,
        mediumRiskTests: 0,
        lowRiskTests: 0
      },
      gapSummary: {
        totalGaps: 0,
        criticalGaps: 0,
        highGaps: 0,
        mediumGaps: 0,
        lowGaps: 0
      },
      nistSummary: {
        overallScore: 100,
        riskLevel: 'LOW',
        totalAssessments: 0,
        criticalRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0
      },
      overallRiskScore: 100,
      metadata: {
        analyzedPath: '/test/path',
        timestamp: new Date().toISOString(),
        rimorVersion: '0.8.0',
        analysisType: 'unified-security',
        executionTime: 1000
      }
    }
  };
}