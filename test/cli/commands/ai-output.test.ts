import { AIOutputCommand } from '../../../src/cli/commands/ai-output';
import { AIOptimizedFormatter } from '../../../src/ai-output/formatter';
import { EnhancedAnalysisResult } from '../../../src/ai-output/types';
import { Issue } from '../../../src/core/types';
import { FileScore, ProjectScore } from '../../../src/scoring/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// モックコンソールログ
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe('AIOutputCommand', () => {
  let aiOutputCommand: AIOutputCommand;
  let testProjectPath: string;
  let mockAnalysisResult: EnhancedAnalysisResult;

  beforeEach(() => {
    // コンソールモック
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    aiOutputCommand = new AIOutputCommand();
    
    // テスト用プロジェクトディレクトリを作成
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-ai-test-'));
    
    // テスト用ファイルを作成
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: { 'express': '^4.18.0' },
      devDependencies: { 'jest': '^29.0.0' }
    };
    fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(testProjectPath, 'tsconfig.json'), '{"compilerOptions": {"target": "es2020"}}');
    
    // srcディレクトリとテストファイル
    fs.mkdirSync(path.join(testProjectPath, 'src'), { recursive: true });
    const testContent = `describe('test', () => {
  it('should work', () => {
    const result = someFunction();
    // missing assertion
  });
});`;
    fs.writeFileSync(path.join(testProjectPath, 'src/test.ts'), testContent);

    // モック分析結果
    const mockIssue: Issue = {
      type: 'missing-assertion',
      severity: 'error',
      message: 'テスト内にアサーションが見つかりません',
      line: 3,
      file: 'src/test.ts'
    };

    const mockFileScore: FileScore = {
      filePath: 'src/test.ts',
      overallScore: 65,
      dimensions: {
        completeness: { score: 70, weight: 1.0, issues: [mockIssue] },
        correctness: { score: 60, weight: 1.5, issues: [mockIssue] },
        maintainability: { score: 80, weight: 0.8, issues: [] },
        performance: { score: 90, weight: 0.5, issues: [] },
        security: { score: 85, weight: 1.2, issues: [] }
      },
      grade: 'C' as const,
      weights: {
        plugins: { 'assertion-exists': 1.0 },
        dimensions: { completeness: 1.0, correctness: 1.5, maintainability: 0.8, performance: 0.5, security: 1.2 }
      },
      metadata: {
        analysisTime: 150,
        pluginResults: [],
        issueCount: 1
      }
    };

    const mockProjectScore: ProjectScore = {
      projectPath: testProjectPath,
      overallScore: 72,
      grade: 'C' as const,
      totalFiles: 1,
      totalDirectories: 1,
      fileScores: [mockFileScore],
      directoryScores: [],
      weights: {
        plugins: { 'assertion-exists': 1.0 },
        dimensions: { completeness: 1.0, correctness: 1.5, maintainability: 0.8, performance: 0.5, security: 1.2 }
      },
      metadata: {
        generatedAt: new Date('2025-01-22T10:00:00Z'),
        executionTime: 1500,
        pluginCount: 1,
        issueCount: 1
      }
    };

    mockAnalysisResult = {
      issues: [mockIssue],
      totalFiles: 1,
      executionTime: 1500,
      projectScore: mockProjectScore,
      fileScores: [mockFileScore]
    };
  });

  afterEach(() => {
    // テスト用ディレクトリをクリーンアップ
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
    
    // 出力ファイルのクリーンアップ
    const outputFiles = ['ai-output.json', 'ai-output.md', 'test-output.json', 'test-output.md'];
    outputFiles.forEach(fileName => {
      const filePath = path.resolve(fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Class Instantiation', () => {
    test('should create AIOutputCommand instance', () => {
      expect(aiOutputCommand).toBeInstanceOf(AIOutputCommand);
      expect(aiOutputCommand['formatter']).toBeInstanceOf(AIOptimizedFormatter);
    });

    test('should have required public methods', () => {
      expect(typeof aiOutputCommand.execute).toBe('function');
    });
  });

  describe('execute method', () => {
    test('should execute JSON format output successfully', async () => {
      const options = {
        path: testProjectPath,
        format: 'json' as const,
        output: path.join(testProjectPath, 'output.json')
      };

      await aiOutputCommand.execute(options);

      // ファイルが作成されることを確認
      expect(fs.existsSync(options.output)).toBe(true);
      
      // JSON形式で出力されることを確認
      const outputContent = fs.readFileSync(options.output, 'utf-8');
      const jsonOutput = JSON.parse(outputContent);
      
      expect(jsonOutput.version).toBe('0.6.0');
      expect(jsonOutput.format).toBe('ai-optimized');
      expect(jsonOutput.metadata).toBeDefined();
      expect(jsonOutput.context).toBeDefined();
      expect(jsonOutput.qualityOverview).toBeDefined();
      expect(jsonOutput.files).toBeDefined();
      expect(jsonOutput.actionableTasks).toBeDefined();
      expect(jsonOutput.instructions).toBeDefined();
    });

    test('should execute Markdown format output successfully', async () => {
      const options = {
        path: testProjectPath,
        format: 'markdown' as const,
        output: path.join(testProjectPath, 'output.md')
      };

      await aiOutputCommand.execute(options);

      // ファイルが作成されることを確認
      expect(fs.existsSync(options.output)).toBe(true);
      
      // Markdown形式で出力されることを確認
      const outputContent = fs.readFileSync(options.output, 'utf-8');
      
      expect(outputContent).toContain('# Rimor Test Quality Analysis Report');
      expect(outputContent).toContain('## Project Context');
      expect(outputContent).toContain('## Critical Issues Summary');
      expect(outputContent).toContain('## Instructions for AI');
    });

    test('should output to console when no output file specified', async () => {
      const options = {
        path: testProjectPath,
        format: 'json' as const
      };

      await aiOutputCommand.execute(options);

      // コンソール出力があることを確認
      expect(mockConsoleLog).toHaveBeenCalled();
      
      // JSON出力がコンソールに表示されることを確認
      const loggedOutput = mockConsoleLog.mock.calls.find(call => {
        try {
          const parsed = JSON.parse(call[0]);
          return parsed.format === 'ai-optimized';
        } catch {
          return false;
        }
      });
      
      expect(loggedOutput).toBeDefined();
    });

    test('should include context when includeContext option is true', async () => {
      const options = {
        path: testProjectPath,
        format: 'json' as const,
        includeContext: true,
        output: path.join(testProjectPath, 'output-with-context.json')
      };

      await aiOutputCommand.execute(options);

      const outputContent = fs.readFileSync(options.output, 'utf-8');
      const jsonOutput = JSON.parse(outputContent);
      
      expect(jsonOutput.context.configFiles).toBeDefined();
      expect(jsonOutput.context.dependencies).toBeDefined();
      expect(Object.keys(jsonOutput.context.configFiles).length).toBeGreaterThan(0);
    });

    test('should include source code when includeSourceCode option is true', async () => {
      const options = {
        path: testProjectPath,
        format: 'markdown' as const,
        includeSourceCode: true,
        output: path.join(testProjectPath, 'output-with-source.md')
      };

      await aiOutputCommand.execute(options);

      const outputContent = fs.readFileSync(options.output, 'utf-8');
      
      expect(outputContent).toContain('```');
      expect(outputContent).toContain('**Suggested Fix**:');
    });

    test('should optimize for AI when optimizeForAI option is true', async () => {
      const options = {
        path: testProjectPath,
        format: 'markdown' as const,
        optimizeForAI: true,
        maxTokens: 1000,
        output: path.join(testProjectPath, 'output-optimized.md')
      };

      await aiOutputCommand.execute(options);

      const outputContent = fs.readFileSync(options.output, 'utf-8');
      
      // トークン制限により内容が調整されているか確認
      expect(outputContent.length).toBeLessThan(10000); // 大まかな制限値
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent project path', async () => {
      const options = {
        path: '/non/existent/path',
        format: 'json' as const
      };

      await expect(aiOutputCommand.execute(options)).rejects.toThrow();
    });

    test('should handle invalid format option', async () => {
      const options = {
        path: testProjectPath,
        format: 'invalid' as any
      };

      await expect(aiOutputCommand.execute(options)).rejects.toThrow();
    });

    test('should handle write permission errors', async () => {
      const readOnlyDir = path.join(testProjectPath, 'readonly');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o444); // 読み取り専用に設定

      const options = {
        path: testProjectPath,
        format: 'json' as const,
        output: path.join(readOnlyDir, 'output.json')
      };

      await expect(aiOutputCommand.execute(options)).rejects.toThrow();
      
      // クリーンアップのため権限を元に戻す
      fs.chmodSync(readOnlyDir, 0o755);
    });
  });

  describe('Options Validation', () => {
    test('should validate required path option', async () => {
      const options = {
        format: 'json' as const
      } as any;

      await expect(aiOutputCommand.execute(options)).rejects.toThrow();
    });

    test('should use default format when not specified', async () => {
      const options = {
        path: testProjectPath,
        output: path.join(testProjectPath, 'default-format.json')
      };

      await aiOutputCommand.execute(options);

      // デフォルトでJSON形式になることを確認
      const outputContent = fs.readFileSync(options.output, 'utf-8');
      expect(() => JSON.parse(outputContent)).not.toThrow();
    });

    test('should handle maxTokens and maxFileSize limits', async () => {
      const options = {
        path: testProjectPath,
        format: 'json' as const,
        maxTokens: 500,
        maxFileSize: 50000,
        output: path.join(testProjectPath, 'limited-output.json')
      };

      await aiOutputCommand.execute(options);

      const outputContent = fs.readFileSync(options.output, 'utf-8');
      expect(outputContent.length).toBeLessThan(50000);
    });
  });

  describe('Integration with Existing Analysis', () => {
    test('should work with existing analysis result structure', async () => {
      // 既存のAnalysisResult形式（プロジェクトスコアなし）
      const legacyResult = {
        issues: mockAnalysisResult.issues,
        totalFiles: mockAnalysisResult.totalFiles,
        executionTime: mockAnalysisResult.executionTime
      };

      const options = {
        path: testProjectPath,
        format: 'json' as const,
        output: path.join(testProjectPath, 'legacy-output.json')
      };

      // 既存のAnalyzer結果でも動作することを確認
      await aiOutputCommand.execute(options);

      const outputContent = fs.readFileSync(options.output, 'utf-8');
      const jsonOutput = JSON.parse(outputContent);
      
      expect(jsonOutput.qualityOverview.totalIssues).toBe(legacyResult.issues.length);
    });
  });
});