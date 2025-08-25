/**
 * Intent Analyze Command Tests
 * v0.9.0 - TDD Red Phase: 失敗するテストを最初に書く
 */

// モックの設定（インポート前に設定）
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('glob');
jest.mock('tree-sitter', () => ({
  default: jest.fn().mockImplementation(() => ({
    setLanguage: jest.fn(),
    parse: jest.fn()
  }))
}));
jest.mock('tree-sitter-javascript', () => ({}));
jest.mock('tree-sitter-typescript', () => ({
  typescript: {},
  tsx: {}
}));
jest.mock('../../../src/intent-analysis/TreeSitterParser', () => ({
  TreeSitterParser: {
    getInstance: jest.fn()
  }
}));
jest.mock('../../../src/intent-analysis/TestIntentExtractor');
jest.mock('../../../src/intent-analysis/TestIntentReporter');
jest.mock('../../../src/intent-analysis/TypeScriptAnalyzer');
jest.mock('../../../src/intent-analysis/DomainInferenceEngine');
jest.mock('../../../src/intent-analysis/BusinessLogicMapper');

import { IntentAnalyzeCommand } from '../../../src/cli/commands/intent-analyze';
import { TreeSitterParser } from '../../../src/intent-analysis/TreeSitterParser';
import { TestIntentExtractor } from '../../../src/intent-analysis/TestIntentExtractor';
import { TestIntentReporter } from '../../../src/intent-analysis/TestIntentReporter';
import { TypeScriptAnalyzer } from '../../../src/intent-analysis/TypeScriptAnalyzer';
import { DomainInferenceEngine } from '../../../src/intent-analysis/DomainInferenceEngine';
import { BusinessLogicMapper } from '../../../src/intent-analysis/BusinessLogicMapper';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

describe('IntentAnalyzeCommand', () => {
  let command: IntentAnalyzeCommand;
  let mockParser: jest.Mocked<TreeSitterParser>;
  let mockExtractor: jest.Mocked<TestIntentExtractor>;
  let mockReporter: jest.Mocked<TestIntentReporter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // パーサーのモック
    mockParser = {
      parseFile: jest.fn(),
      parseContent: jest.fn(),
      findNodes: jest.fn(),
      findTestFunctions: jest.fn(),
      findAssertions: jest.fn()
    } as any;
    (TreeSitterParser.getInstance as jest.Mock).mockReturnValue(mockParser);
    
    // エクストラクターのモック
    mockExtractor = new TestIntentExtractor(mockParser) as jest.Mocked<TestIntentExtractor>;
    (TestIntentExtractor as jest.MockedClass<typeof TestIntentExtractor>).mockImplementation(() => mockExtractor);
    
    // レポーターのモック
    mockReporter = new TestIntentReporter() as jest.Mocked<TestIntentReporter>;
    (TestIntentReporter as jest.MockedClass<typeof TestIntentReporter>).mockImplementation(() => mockReporter);
    
    command = new IntentAnalyzeCommand();
  });

  describe('execute', () => {
    it('指定されたパスのテストファイルを分析し、レポートを生成する', async () => {
      // Arrange
      const testPath = '/test/project';
      const options = {
        path: testPath,
        format: 'text' as const
      };
      
      // ファイルシステムのモック
      const mockStats = { isDirectory: () => true };
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // テストファイルの発見をモック
      const testFiles = ['test1.test.ts', 'test2.spec.js'];
      jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(testFiles);
      
      // パーサーのモック
      const mockAST = { type: 'program', text: 'test code' };
      mockParser.parseFile.mockResolvedValue(mockAST as any);
      
      // エクストラクターのモック
      const mockIntent = { description: 'test intent', testType: 'unit' };
      const mockActual = { assertions: [], complexity: 1 };
      const mockResult = { 
        intent: mockIntent, 
        actual: mockActual, 
        gaps: [], 
        realizationScore: 90,
        riskLevel: 'low'
      };
      mockExtractor.extractIntent.mockResolvedValue(mockIntent as any);
      mockExtractor.analyzeActualTest.mockResolvedValue(mockActual as any);
      mockExtractor.evaluateRealization.mockResolvedValue(mockResult as any);
      
      // レポーターのモック
      const mockMarkdown = '# Test Report';
      mockReporter.generateMarkdownReport.mockReturnValue(mockMarkdown);
      
      // コンソール出力をモック
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      await command.execute(options);
      
      // Assert
      expect(mockParser.parseFile).toHaveBeenCalledTimes(2); // 2つのテストファイル
      expect(mockExtractor.extractIntent).toHaveBeenCalledTimes(2);
      expect(mockExtractor.analyzeActualTest).toHaveBeenCalledTimes(2);
      expect(mockExtractor.evaluateRealization).toHaveBeenCalledTimes(2);
      expect(mockReporter.generateMarkdownReport).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(mockMarkdown);
      
      consoleLogSpy.mockRestore();
    });

    it('format=jsonの場合、JSON形式で出力する', async () => {
      // Arrange
      const options = {
        path: '/test/project',
        format: 'json' as const
      };
      
      // 基本的なモックセットアップ
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(['test.test.ts']);
      
      const mockAST = { type: 'program' };
      mockParser.parseFile.mockResolvedValue(mockAST as any);
      
      const mockResult = {
        file: 'test.test.ts',
        intent: { description: 'test' },
        actual: { assertions: [] },
        gaps: [],
        realizationScore: 85,
        riskLevel: 'medium'
      };
      mockExtractor.extractIntent.mockResolvedValue({ description: 'test' } as any);
      mockExtractor.analyzeActualTest.mockResolvedValue({ assertions: [] } as any);
      mockExtractor.evaluateRealization.mockResolvedValue(mockResult as any);
      
      // レポーターのサマリーをモック
      mockReporter.generateSummary.mockReturnValue({
        totalFiles: 1,
        criticalRiskCount: 0,
        highRiskCount: 0,
        mediumRiskCount: 1,
        lowRiskCount: 0,
        averageRealizationScore: 85
      });
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      await command.execute(options);
      
      // Assert
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('results');
      expect(parsed).toHaveProperty('summary');
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].realizationScore).toBe(85);
      
      consoleLogSpy.mockRestore();
    });

    it('HTML形式での出力をサポートする', async () => {
      // Arrange
      const options = {
        path: '/test/project',
        format: 'html' as any,
        output: 'report.html'
      };
      
      // 基本的なモックセットアップ
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(['test.test.ts']);
      
      const mockAST = { type: 'program' };
      mockParser.parseFile.mockResolvedValue(mockAST as any);
      
      mockExtractor.extractIntent.mockResolvedValue({} as any);
      mockExtractor.analyzeActualTest.mockResolvedValue({} as any);
      mockExtractor.evaluateRealization.mockResolvedValue({
        gaps: [],
        realizationScore: 100,
        riskLevel: 'minimal'
      } as any);
      
      const mockHTML = '<!DOCTYPE html><html>...</html>';
      mockReporter.generateHTMLReport.mockReturnValue(mockHTML);
      
      const writeFileSyncSpy = fs.writeFileSync as jest.Mock;
      
      // Act
      await command.execute(options);
      
      // Assert
      expect(mockReporter.generateHTMLReport).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalledWith('report.html', mockHTML);
    });

    it('エラーが発生した場合、適切にエラーハンドリングする', async () => {
      // Arrange
      const options = {
        path: '/invalid/path',
        format: 'text' as const
      };
      
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Act & Assert
      await expect(command.execute(options)).rejects.toThrow('指定されたパスが存在しません');
    });

    it('verboseオプションで詳細情報を出力する', async () => {
      // Arrange
      const options = {
        path: '/test/project',
        format: 'text' as const,
        verbose: true
      };
      
      // 基本的なモックセットアップ
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(['test.test.ts']);
      
      mockParser.parseFile.mockResolvedValue({ type: 'program' } as any);
      mockExtractor.extractIntent.mockResolvedValue({} as any);
      mockExtractor.analyzeActualTest.mockResolvedValue({} as any);
      mockExtractor.evaluateRealization.mockResolvedValue({
        gaps: [],
        realizationScore: 100,
        riskLevel: 'minimal'
      } as any);
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      await command.execute(options);
      
      // Assert
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => log.includes('分析中:'))).toBeTruthy();
      expect(logs.some(log => log.includes('ファイル発見:'))).toBeTruthy();
      
      consoleLogSpy.mockRestore();
    });

    describe('Phase 2 高度な分析オプション', () => {
      it('--with-typesオプションで型情報を使った分析を実行する', async () => {
        // Arrange
        const options = {
          path: '/test/project',
          format: 'text' as const,
          withTypes: true
        };
        
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(['test.test.ts']);
        
        mockParser.parseFile.mockResolvedValue({ type: 'program' } as any);
        mockExtractor.extractIntent.mockResolvedValue({} as any);
        mockExtractor.analyzeActualTest.mockResolvedValue({} as any);
        
        // evaluateRealizationのモック
        mockExtractor.evaluateRealization = jest.fn().mockResolvedValue({
          gaps: [],
          realizationScore: 95,
          riskLevel: 'minimal',
          domainRelevance: { domain: 'user-management', confidence: 0.9 },
          businessImportance: 'high'
        });
        
        // TypeScriptAnalyzerのモック
        const mockTsAnalyzer = {
          initialize: jest.fn().mockResolvedValue(undefined),
          getFileTypeInfo: jest.fn().mockResolvedValue(new Map([
            ['testVar', { typeName: 'string', isPrimitive: true }]
          ]))
        };
        (TypeScriptAnalyzer as jest.MockedClass<typeof TypeScriptAnalyzer>).mockImplementation(() => mockTsAnalyzer as any);
        
        // fs/promisesのaccessをモック（tsconfig.json検索用）
        (fsPromises.access as jest.Mock).mockRejectedValue(new Error('File not found'));
        
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // Act
        await command.execute(options);
        
        // Assert
        expect(mockExtractor.evaluateRealization).toHaveBeenCalled();
        
        consoleLogSpy.mockRestore();
      });

      it('--with-domainオプションでドメイン推論を含む分析を実行する', async () => {
        // Arrange
        const options = {
          path: '/test/project',
          format: 'text' as const,
          withDomain: true
        };
        
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        jest.spyOn(command as any, 'findTestFiles').mockResolvedValue(['test.test.ts']);
        
        mockParser.parseFile.mockResolvedValue({ type: 'program' } as any);
        mockExtractor.extractIntent.mockResolvedValue({} as any);
        mockExtractor.analyzeActualTest.mockResolvedValue({} as any);
        mockExtractor.evaluateRealization.mockResolvedValue({
          gaps: [],
          realizationScore: 90,
          riskLevel: 'low'
        } as any);
        
        // ドメイン推論結果を含むレポートが生成されることを確認
        mockReporter.generateMarkdownReport = jest.fn().mockImplementation(results => {
          return results.some((r: any) => r.domainRelevance) 
            ? '# レポート（ドメイン分析付き）' 
            : '# 通常レポート';
        });
        
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // Act
        await command.execute(options);
        
        // Assert
        const output = consoleLogSpy.mock.calls[0][0];
        expect(output).toContain('ドメイン分析付き');
        
        consoleLogSpy.mockRestore();
      });
    });
  });

  describe('findTestFiles', () => {
    it('テストファイルパターンにマッチするファイルを検索する', async () => {
      // privateメソッドのテストのため、一時的にpublicとしてアクセス
      const findTestFiles = (command as any).findTestFiles.bind(command);
      
      // ファイルシステムのモック
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      
      // globのモック
      (glob as unknown as jest.Mock).mockImplementation((pattern: string) => {
        // パターンに応じてマッチするファイルを返す
        if (pattern.includes('.test.')) {
          return Promise.resolve(['test/example.test.ts']);
        } else if (pattern.includes('.spec.')) {
          return Promise.resolve(['test/sample.spec.js']);
        } else if (pattern.includes('__tests__')) {
          return Promise.resolve(['__tests__/unit.test.tsx']);
        } else {
          return Promise.resolve([]);
        }
      });
      
      // Act
      const result = await findTestFiles('/project');
      
      // Assert
      expect(result).toEqual([
        '/project/test/example.test.ts',
        '/project/test/sample.spec.js',
        '/project/__tests__/unit.test.tsx'
      ]);
    });
  });
});