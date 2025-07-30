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

// モックデータ生成ヘルパー
const createMockIssue = (overrides: Partial<Issue> = {}): Issue => ({
  type: 'MISSING_TEST',
  severity: 'medium',
  file: 'src/example.ts',
  line: 10,
  column: 5,
  message: 'Test coverage is missing',
  ...overrides
});

const createMockFileScore = (overrides: Partial<FileScore> = {}): FileScore => ({
  path: 'src/example.ts',
  score: 75,
  dimensions: {
    completeness: { score: 80, weight: 1.0 },
    correctness: { score: 70, weight: 1.0 },
    security: { score: 75, weight: 1.0 },
    maintainability: { score: 80, weight: 1.0 },
    performance: { score: 70, weight: 1.0 }
  },
  issues: [],
  ...overrides
});

const createMockAnalysisResult = (): EnhancedAnalysisResult => ({
  issues: [createMockIssue()],
  overallScore: 75,
  fileScores: [createMockFileScore()],
  suggestions: [{
    priority: 'high',
    impact: 'high',
    effort: 'medium',
    description: 'Add test coverage',
    relatedIssues: ['test-coverage']
  }],
  criticalPatterns: [{
    pattern: 'missing-tests',
    count: 1,
    severity: 'high',
    recommendation: 'Add comprehensive test suite'
  }],
  timestamp: new Date().toISOString()
});

describe('AIOptimizedFormatter', () => {
  let formatter: AIOptimizedFormatter;
  const testOutputDir = path.join(__dirname, 'test-output');

  beforeEach(() => {
    formatter = new AIOptimizedFormatter();
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('基本的なフォーマット機能', () => {
    it('フォーマッターインスタンスを作成できる', async () => {
      expect(formatter).toBeInstanceOf(AIOptimizedFormatter);
    });

    it('バージョン情報を取得できる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(result, '/test/project', {});
      
      expect(formatted.version).toBeDefined();
      expect(typeof formatted.version).toBe('string');
    });
  });

  describe('formatAsJson', () => {
    it('分析結果をJSON形式でフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(result, '/test/project', {});

      expect(formatted).toHaveProperty('version');
      expect(formatted).toHaveProperty('timestamp');
      expect(formatted).toHaveProperty('summary');
      expect(formatted).toHaveProperty('criticalIssues');
      expect(formatted).toHaveProperty('contextualizedIssues');
      expect(formatted).toHaveProperty('fileAnalysis');
      expect(formatted).toHaveProperty('actionableSteps');
      expect(formatted).toHaveProperty('metadata');
    });

    it('オプションを指定してフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        includeCodeContext: true,
        maxIssuesPerFile: 5,
        priorityThreshold: 'medium',
        includeMetrics: true
      };

      const formatted = await formatter.formatAsJSON(result, "/test/project", options);

      expect(formatted.contextualizedIssues[0].context).toBeDefined();
      expect(formatted.metadata.formatterOptions).toEqual(options);
    });

    it('コードコンテキストを含めることができる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        includeCodeContext: true
      };

      const formatted = await formatter.formatAsJSON(result, "/test/project", options);

      formatted.contextualizedIssues.forEach(issue => {
        if (issue.context) {
          expect(issue.context).toHaveProperty('surroundingCode');
          expect(issue.context).toHaveProperty('relatedPatterns');
        }
      });
    });
  });

  describe('formatAsMarkdown', () => {
    it('分析結果をMarkdown形式でフォーマットできる', async () => {
      const result = createMockAnalysisResult();
      const markdown = formatter.formatAsMarkdown(result);

      expect(markdown).toContain('# Rimor Test Quality Analysis Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Critical Issues');
      expect(markdown).toContain('## File Analysis');
      expect(markdown).toContain('## Recommendations');
    });

    it('メトリクスを含むMarkdownを生成できる', async () => {
      const result = createMockAnalysisResult();
      const options: FormatterOptions = {
        includeMetrics: true
      };

      const markdown = formatter.formatAsMarkdown(result, options);

      expect(markdown).toContain('Overall Score:');
      expect(markdown).toContain('Completeness:');
      expect(markdown).toContain('Security:');
    });

    it('優先度でフィルタリングできる', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [
          createMockIssue({ severity: 'critical' }),
          createMockIssue({ severity: 'high' }),
          createMockIssue({ severity: 'medium' }),
          createMockIssue({ severity: 'low' })
        ]
      };

      const options: FormatterOptions = {
        priorityThreshold: 'high'
      };

      const markdown = formatter.formatAsMarkdown(result, options);

      expect(markdown).toContain('critical');
      expect(markdown).toContain('high');
      expect(markdown).not.toContain('medium');
      expect(markdown).not.toContain('low');
    });
  });

  describe('saveToFile', () => {
    it('JSON形式でファイルに保存できる', async () => {
      const result = createMockAnalysisResult();
      const outputPath = path.join(testOutputDir, 'output.json');

      await formatter.saveToFile(result, outputPath, 'json');

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(content).toHaveProperty('version');
      expect(content).toHaveProperty('summary');
    });

    it('Markdown形式でファイルに保存できる', async () => {
      const result = createMockAnalysisResult();
      const outputPath = path.join(testOutputDir, 'output.md');

      await formatter.saveToFile(result, outputPath, 'markdown');

      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('# Rimor Test Quality Analysis Report');
    });

    it('ディレクトリが存在しない場合は作成する', async () => {
      const result = createMockAnalysisResult();
      const nestedDir = path.join(testOutputDir, 'nested', 'deep');
      const outputPath = path.join(nestedDir, 'output.json');

      await formatter.saveToFile(result, outputPath, 'json');

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('無効なフォーマットを指定した場合エラーをスローする', async () => {
      const result = createMockAnalysisResult();
      const outputPath = path.join(testOutputDir, 'output.txt');

      await expect(
        formatter.saveToFile(result, outputPath, 'invalid' as any)
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('推奨アクションの生成', () => {
    it('実行可能なステップを生成できる', async () => {
      const result = createMockAnalysisResult();
      const formatted = await formatter.formatAsJSON(result, "/test/project", {});

      expect(formatted.actionableSteps).toBeDefined();
      expect(formatted.actionableSteps.immediate).toBeInstanceOf(Array);
      expect(formatted.actionableSteps.shortTerm).toBeInstanceOf(Array);
      expect(formatted.actionableSteps.longTerm).toBeInstanceOf(Array);
    });

    it('優先度に基づいてステップを分類する', async () => {
      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        suggestions: [
          {
            priority: 'critical',
            impact: 'high',
            effort: 'low',
            description: 'Fix security vulnerability',
            relatedIssues: ['sec-001']
          },
          {
            priority: 'medium',
            impact: 'medium',
            effort: 'medium',
            description: 'Improve test coverage',
            relatedIssues: ['test-001']
          },
          {
            priority: 'low',
            impact: 'low',
            effort: 'high',
            description: 'Refactor legacy code',
            relatedIssues: ['legacy-001']
          }
        ]
      };

      const formatted = await formatter.formatAsJSON(result, "/test/project", {});

      expect(formatted.actionableSteps.immediate.length).toBeGreaterThan(0);
      expect(formatted.actionableSteps.immediate[0].description).toContain('security');
    });
  });

  describe('コンテキスト抽出', () => {
    it('問題の周辺コードを抽出できる', async () => {
      // テスト用のソースファイルを作成
      const sourceFile = path.join(testOutputDir, 'source.ts');
      const sourceContent = Array.from({ length: 20 }, (_, i) => 
        `line ${i + 1}: code here`
      ).join('\n');
      fs.writeFileSync(sourceFile, sourceContent);

      const issue = createMockIssue({
        file: sourceFile,
        line: 10
      });

      const result: EnhancedAnalysisResult = {
        ...createMockAnalysisResult(),
        issues: [issue]
      };

      const options: FormatterOptions = {
        includeCodeContext: true
      };

      const formatted = await formatter.formatAsJSON(result, "/test/project", options);
      const contextualizedIssue = formatted.contextualizedIssues[0];

      expect(contextualizedIssue.context).toBeDefined();
      expect(contextualizedIssue.context?.surroundingCode).toContain('line 10');
    });
  });

  describe('エラーハンドリング', () => {
    it('空の分析結果を処理できる', async () => {
      const emptyResult: EnhancedAnalysisResult = {
        projectPath: '/test/project',
        issues: [],
        overallScore: 100,
        fileScores: [],
        suggestions: [],
        criticalPatterns: [],
        timestamp: new Date().toISOString()
      };

      const formatted = await formatter.formatAsJSON(emptyResult, "/test/project", {});

      expect(formatted.summary.totalIssues).toBe(0);
      expect(formatted.criticalIssues).toHaveLength(0);
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

      const formatted = await formatter.formatAsJSON(result, "/test/project", {});

      // パスが適切にサニタイズされることを確認
      expect(formatted.contextualizedIssues[0].file).not.toContain('/etc/passwd');
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
      const formatted = await formatter.formatAsJSON(result, "/test/project", {});
      const endTime = Date.now();

      expect(formatted.contextualizedIssues.length).toBe(1000);
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
        maxIssuesPerFile: 5
      };

      const formatted = await formatter.formatAsJSON(result, "/test/project", options);
      const fileIssues = formatted.contextualizedIssues.filter(
        (issue: any) => issue.file === 'src/example.ts'
      );

      expect(fileIssues.length).toBe(5);
    });
  });
});