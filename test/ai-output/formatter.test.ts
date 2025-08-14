import { AIOptimizedFormatter } from '../../src/ai-output/formatter';
import {
  AIOptimizedOutput,
  FormatterOptions,
  EnhancedAnalysisResult,
  CodeContext,
  SuggestedFix,
  ActionStep,
  LocationInfo
} from '../../src/ai-output/types';
import { Issue } from '../../src/core/types';
import { FileScore } from '../../src/scoring/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

// モックデータ生成ヘルパー
const createMockIssue = (overrides: Partial<Issue> = {}): Issue => ({
  type: 'MISSING_TEST',
  severity: 'medium',
  file: 'src/example.ts',
  filePath: overrides.filePath || overrides.file || 'src/example.ts',
  category: 'test-quality',
  line: 10,
  column: 5,
  message: 'Test coverage is missing',
  ...overrides
});

const createMockFileScore = (overrides: Partial<FileScore> = {}): FileScore => ({
  filePath: 'src/example.ts',
  overallScore: 75,
  dimensions: {
    completeness: { score: 80, weight: 1.0, issues: [] },
    correctness: { score: 70, weight: 1.0, issues: [] },
    security: { score: 75, weight: 1.0, issues: [] },
    maintainability: { score: 80, weight: 1.0, issues: [] },
    performance: { score: 70, weight: 1.0, issues: [] }
  },
  grade: 'B',
  weights: {
    plugins: {},
    dimensions: {
      completeness: 1.0,
      correctness: 1.0,
      maintainability: 1.0,
      performance: 1.0,
      security: 1.0
    },
    fileTypes: {}
  },
  metadata: {
    analysisTime: 100,
    pluginResults: [],
    issueCount: 1
  },
  ...overrides
});

// Convert EnhancedAnalysisResult to AnalysisResult for formatter compatibility
const toAnalysisResult = (enhanced: EnhancedAnalysisResult): any => ({
  filePath: enhanced.issues[0]?.filePath || 'src/example.ts',
  issues: enhanced.issues,
  score: enhanced.projectScore ? {
    overall: enhanced.projectScore.overallScore,
    details: {},
    grade: enhanced.projectScore.grade
  } : undefined,
  context: enhanced.projectContext,
  metrics: undefined,
  timestamp: new Date()
});

const createMockAnalysisResult = (): EnhancedAnalysisResult => ({
  issues: [createMockIssue()],
  totalFiles: 1,
  executionTime: 1000,
  fileScores: [createMockFileScore()],
  projectScore: {
    projectPath: '/test/project',
    overallScore: 75,
    grade: 'B',
    totalFiles: 1,
    totalDirectories: 1,
    fileScores: [createMockFileScore()],
    directoryScores: [],
    weights: {
      plugins: {},
      dimensions: {
        completeness: 1.0,
        correctness: 1.0,
        maintainability: 1.0,
        performance: 1.0,
        security: 1.0
      },
      fileTypes: {}
    },
    metadata: {
      generatedAt: new Date(),
      executionTime: 1000,
      pluginCount: 3,
      issueCount: 1
    }
  }
});

const mockFs = fs as jest.Mocked<typeof fs>;

describe('AIOptimizedFormatter', () => {
  let formatter: AIOptimizedFormatter;
  const testOutputDir = path.join(__dirname, 'test-output');
  const testProjectPath = '/test/project';

  beforeEach(() => {
    formatter = new AIOptimizedFormatter();
    jest.clearAllMocks();
    
    // Mock fs.existsSync to always return true for our test paths
    mockFs.existsSync.mockImplementation((path) => {
      if (typeof path === 'string' && (path.includes(testProjectPath) || path.includes('package.json'))) {
        return true;
      }
      return false;
    });
    
    // Mock fs.readFileSync for package.json and other files
    mockFs.readFileSync.mockImplementation((path, encoding) => {
      if (typeof path === 'string' && path.includes('package.json')) {
        return JSON.stringify({
          version: '0.8.0',
          dependencies: {},
          devDependencies: { jest: '^29.0.0' }
        });
      }
      if (typeof path === 'string' && path.includes('tsconfig.json')) {
        return JSON.stringify({ compilerOptions: {} });
      }
      // For source file reads in context extraction
      return Array.from({ length: 20 }, (_, i) => `line ${i + 1}: code here`).join('\n');
    });
    
    // Mock fs.readdirSync for project structure
    mockFs.readdirSync.mockReturnValue([
      { name: 'src', isDirectory: () => true },
      { name: 'test', isDirectory: () => true },
      { name: 'package.json', isDirectory: () => false },
      { name: 'README.md', isDirectory: () => false }
    ] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的なフォーマット機能', () => {
    it('フォーマッターインスタンスを作成できる', async () => {
      expect(formatter).toBeInstanceOf(AIOptimizedFormatter);
    });

    it('バージョン情報を取得できる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), '/test/project', { format: 'json' });
      
      expect(formatted.version).toBeDefined();
      expect(typeof formatted.version).toBe('string');
    });
  });

  describe('formatAsJson', () => {
    it('分析結果をJSON形式でフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), '/test/project', { format: 'json' });

      expect(formatted).toHaveProperty('version');
      expect(formatted).toHaveProperty('format');
      expect(formatted).toHaveProperty('metadata');
      expect(formatted).toHaveProperty('context');
      expect(formatted).toHaveProperty('qualityOverview');
      expect(formatted).toHaveProperty('files');
      expect(formatted).toHaveProperty('actionableTasks');
      expect(formatted).toHaveProperty('instructions');
    });

    it('オプションを指定してフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        format: 'json',
        includeContext: true,
        includeSourceCode: true,
        optimizeForAI: true
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", options);

      expect(formatted.files[0].issues[0].context).toBeDefined();
      expect(formatted.metadata).toBeDefined();
    });

    it('コードコンテキストを含めることができる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        format: 'json',
        includeContext: true
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", options);

      formatted.files.forEach((file: any) => {
        file.issues.forEach((issue: any) => {
          if (issue.context) {
            expect(issue.context).toHaveProperty('surroundingCode');
            expect(issue.context).toHaveProperty('targetCode');
          }
        });
      });
    });
  });

  describe('formatAsMarkdown', () => {
    it('分析結果をMarkdown形式でフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const markdown = await formatter.formatAsMarkdown(toAnalysisResult(result), '/test/project', { format: 'markdown' });

      expect(markdown).toContain('# Rimor Test Quality Analysis Report');
      expect(markdown).toContain('## Project Context');
      expect(markdown).toContain('## Critical Issues Summary');
      expect(markdown).toContain('## File:');
      expect(markdown).toContain('## Instructions for AI');
    });

    it('メトリクスを含むMarkdownを生成できる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        format: 'markdown',
        includeContext: true
      };

      const markdown = await formatter.formatAsMarkdown(toAnalysisResult(result), '/test/project', options);

      expect(markdown).toContain('**Quality Score**: 75/100');
      expect(markdown).toContain('File:');
      expect(markdown).toContain('Score: 75/100');
    });

    it('優先度でフィルタリングできる', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [
          createMockIssue({ severity: 'high' }),
          createMockIssue({ severity: 'medium' }),
          createMockIssue({ severity: 'low' })
        ]
      };

      const options: FormatterOptions = {
        format: 'markdown',
        optimizeForAI: true
      };

      const markdown = await formatter.formatAsMarkdown(toAnalysisResult(result), '/test/project', options);

      expect(markdown).toContain('error');
      expect(markdown).toBeDefined();
    });
  });

  describe('フォーマット出力', () => {
    it('JSON形式で正しくフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), '/test/project', { format: 'json' });

      expect(formatted.version).toBeDefined();
      expect(formatted.format).toBe('ai-optimized');
      expect(formatted.qualityOverview.totalIssues).toBe(1);
    });

    it('Markdown形式で正しくフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const markdown = await formatter.formatAsMarkdown(toAnalysisResult(result), '/test/project', { format: 'markdown' });

      expect(markdown).toContain('# Rimor Test Quality Analysis Report');
      expect(markdown).toContain('**Quality Score**: 75/100');
    });
  });

  describe('推奨アクションの生成', () => {
    it('実行可能なステップを生成できる', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [createMockIssue({ severity: 'high' })] // Need error severity for tasks
      };
      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", { format: 'json' });

      expect(formatted.actionableTasks).toBeDefined();
      expect(formatted.actionableTasks).toBeInstanceOf(Array);
      expect(formatted.actionableTasks.length).toBeGreaterThan(0);
    });

    it('優先度に基づいてステップを分類する', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [
          createMockIssue({ severity: 'high', message: 'Fix security vulnerability' }),
          createMockIssue({ severity: 'medium', message: 'Improve test coverage' }),
          createMockIssue({ severity: 'low', message: 'Refactor legacy code' })
        ]
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", { format: 'json' });

      expect(formatted.actionableTasks.length).toBeGreaterThan(0);
      expect(formatted.actionableTasks[0].description).toContain('重要な問題');
    });
  });

  describe('コンテキスト抽出', () => {
    it('問題の周辺コードを抽出できる', async () => {
      const issue = createMockIssue({
        file: 'test-file.ts',
        line: 10
      });

      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [issue]
      };

      const options: FormatterOptions = {
        format: 'json',
        includeContext: true
      };

      // Update mock to return true for the test file
      const originalExistsSyncMock = mockFs.existsSync.getMockImplementation();
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('test-file.ts')) {
          return true;
        }
        return originalExistsSyncMock?.(path) || false;
      });

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", options);
      const contextualizedIssue = formatted.files[0].issues[0];

      expect(contextualizedIssue.context).toBeDefined();
      expect(contextualizedIssue.context?.targetCode.content).toContain('line 10');
    });
  });

  describe('エラーハンドリング', () => {
    it('空の分析結果を処理できる', async () => {
      const emptyResult: EnhancedAnalysisResult = {
        issues: [],
        totalFiles: 0,
        executionTime: 0,
        fileScores: []
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(emptyResult), "/test/project", { format: 'json' });

      expect(formatted.qualityOverview.totalIssues).toBe(0);
      expect(formatted.qualityOverview.criticalIssues).toBe(0);
    });

    it('不正なファイルパスを安全に処理する', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [
          createMockIssue({
            file: '/etc/passwd' // セキュリティリスクのあるパス
          })
        ]
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", { format: 'json' });

      // パスが適切に処理されることを確認
      expect(formatted.files[0].path).toBeDefined();
    });
  });

  describe('パフォーマンス最適化', () => {
    it('大量の問題を効率的に処理できる', async () => {
      const issues = Array.from({ length: 1000 }, (_, i) => 
        createMockIssue({
          file: `src/file${i}.ts`,
          line: i,
          message: `Issue ${i}`
        })
      );

      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues
      };

      const startTime = Date.now();
      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", { format: 'json' });
      const endTime = Date.now();

      expect(formatted.files.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });

    it('maxIssuesPerFileオプションを適用できる', async () => {
      const issues = Array.from({ length: 20 }, (_, i) => 
        createMockIssue({
          file: 'src/example.ts',
          line: i
        })
      );

      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues
      };

      const options: FormatterOptions = {
        format: 'json',
        maxFileSize: 1000000
      };

      const formatted = await formatter.formatAsJSON(toAnalysisResult(result), "/test/project", options);
      const fileData = formatted.files.find(
        (file: any) => file.path === 'src/example.ts'
      );

      expect(fileData).toBeDefined();
    });
  });
});