import { AIOptimizedFormatter } from '../../src/ai-output/formatter';
import { AIOptimizedOutput, FormatterOptions, EnhancedAnalysisResult } from '../../src/ai-output/types';
import { Issue } from '../../src/core/types';
import { FileScore, ProjectScore } from '../../src/scoring/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AIOptimizedFormatter', () => {
  let formatter: AIOptimizedFormatter;
  let mockAnalysisResult: EnhancedAnalysisResult;
  let mockProjectScore: ProjectScore;
  let testProjectPath: string;

  beforeEach(() => {
    formatter = new AIOptimizedFormatter();
    
    // テスト用の一時ディレクトリを作成
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-test-'));
    
    // テスト用のファイルを作成
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        'express': '^4.18.0'
      },
      devDependencies: {
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0'
      }
    };
    fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(testProjectPath, 'tsconfig.json'), '{"compilerOptions": {"target": "es2020"}}');
    
    // srcディレクトリを作成
    fs.mkdirSync(path.join(testProjectPath, 'src'), { recursive: true });
    
    // テストファイルも作成
    const testContent = `describe('test', () => {
  it('should work', () => {
    const result = someFunction();
    // missing assertion
  });
});`;
    fs.writeFileSync(path.join(testProjectPath, 'src/test.ts'), testContent);
    
    // テスト用のモックデータ
    const mockIssue: Issue = {
      type: 'missing-assertion',
      severity: 'error',
      message: 'テスト内にアサーションが見つかりません',
      line: 10,
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

    mockProjectScore = {
      projectPath: testProjectPath,
      overallScore: 72,
      grade: 'C' as const,
      totalFiles: 5,
      totalDirectories: 2,
      fileScores: [mockFileScore],
      directoryScores: [],
      weights: {
        plugins: { 'assertion-exists': 1.0 },
        dimensions: { completeness: 1.0, correctness: 1.5, maintainability: 0.8, performance: 0.5, security: 1.2 }
      },
      metadata: {
        generatedAt: new Date('2025-01-22T10:00:00Z'),
        executionTime: 1500,
        pluginCount: 2,
        issueCount: 1
      }
    };

    mockAnalysisResult = {
      issues: [mockIssue],
      totalFiles: 5,
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
  });

  describe('formatAsJSON', () => {
    it('基本的なJSON形式で出力できること', async () => {
      const options: FormatterOptions = { format: 'json' };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result).toBeDefined();
      expect(result.version).toBe('0.6.1');
      expect(result.format).toBe('ai-optimized');
      expect(result.metadata.language).toBeDefined();
      expect(result.context.rootPath).toBe(testProjectPath);
      expect(result.qualityOverview.projectScore).toBe(72);
      expect(result.qualityOverview.projectGrade).toBe('C');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toContain('src/test.ts');
      expect(result.files[0].score).toBe(65);
    });

    it('アクション可能タスクが生成されること', async () => {
      const options: FormatterOptions = { format: 'json' };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result.actionableTasks).toBeDefined();
      expect(Array.isArray(result.actionableTasks)).toBe(true);
    });

    it('AI向け指示が含まれること', async () => {
      const options: FormatterOptions = { format: 'json' };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result.instructions).toBeDefined();
      expect(result.instructions.forHuman).toBeDefined();
      expect(result.instructions.forAI).toBeDefined();
      expect(typeof result.instructions.forAI).toBe('string');
      expect(result.instructions.forAI.length).toBeGreaterThan(0);
    });

    it('コンテキスト情報が含まれること', async () => {
      const options: FormatterOptions = { format: 'json', includeContext: true };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result.context).toBeDefined();
      expect(result.context.rootPath).toBe(testProjectPath);
      expect(result.context.configFiles).toBeDefined();
      expect(result.context.dependencies).toBeDefined();
    });
  });

  describe('formatAsMarkdown', () => {
    it('基本的なMarkdown形式で出力できること', async () => {
      const options: FormatterOptions = { format: 'markdown' };
      
      const result = await formatter.formatAsMarkdown(mockAnalysisResult, testProjectPath, options);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('# Rimor Test Quality Analysis Report');
      expect(result).toContain('## Project Context');
      expect(result).toContain('## Critical Issues Summary');
      expect(result).toContain('## File:');
      expect(result).toContain('src/test.ts');
      expect(result).toContain('### Issue #1:');
      expect(result).toContain('## Automated Tasks');
      expect(result).toContain('## Instructions for AI');
    });

    it('コードブロックが適切にフォーマットされること', async () => {
      const options: FormatterOptions = { format: 'markdown', includeSourceCode: true };
      
      const result = await formatter.formatAsMarkdown(mockAnalysisResult, testProjectPath, options);
      
      expect(result).toContain('```typescript');
      expect(result).toContain('```');
    });

    it('修正提案が含まれること', async () => {
      const options: FormatterOptions = { format: 'markdown' };
      
      const result = await formatter.formatAsMarkdown(mockAnalysisResult, testProjectPath, options);
      
      expect(result).toContain('**Suggested Fix**:');
    });
  });

  describe('サイズ制限とトークン制限', () => {
    it('最大ファイルサイズを超えた場合にエラーになること', async () => {
      const options: FormatterOptions = { format: 'json', maxFileSize: 100 }; // 100バイト制限
      
      await expect(
        formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options)
      ).rejects.toThrow('制限');
    });

    it('最大トークン数を超えた場合に最適化されること', async () => {
      const options: FormatterOptions = { format: 'markdown', maxTokens: 1000, optimizeForAI: true };
      
      const result = await formatter.formatAsMarkdown(mockAnalysisResult, testProjectPath, options);
      
      // トークン制限により内容が調整されているか確認
      expect(result.length).toBeLessThan(5000); // 大まかな制限値
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な分析結果でエラーになること', async () => {
      const invalidResult = {} as EnhancedAnalysisResult;
      const options: FormatterOptions = { format: 'json' };
      
      await expect(
        formatter.formatAsJSON(invalidResult, testProjectPath, options)
      ).rejects.toThrow();
    });

    it('存在しないプロジェクトパスでエラーになること', async () => {
      const options: FormatterOptions = { format: 'json' };
      
      await expect(
        formatter.formatAsJSON(mockAnalysisResult, '/nonexistent/path', options)
      ).rejects.toThrow();
    });
  });

  describe('プロジェクトコンテキスト抽出', () => {
    it('package.jsonが存在する場合は依存関係を抽出すること', async () => {
      const options: FormatterOptions = { format: 'json', includeContext: true };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result.context.dependencies).toBeDefined();
    });

    it('TypeScriptプロジェクトの場合は言語設定が正しいこと', async () => {
      const options: FormatterOptions = { format: 'json' };
      
      const result = await formatter.formatAsJSON(mockAnalysisResult, testProjectPath, options);
      
      expect(result.metadata.language).toBe('typescript');
    });
  });

  describe('互換性テスト', () => {
    it('既存のAnalysisResultでも動作すること', async () => {
      const legacyResult = {
        issues: mockAnalysisResult.issues,
        totalFiles: mockAnalysisResult.totalFiles,
        executionTime: mockAnalysisResult.executionTime
      };
      
      const options: FormatterOptions = { format: 'json' };
      
      const result = await formatter.formatAsJSON(legacyResult, testProjectPath, options);
      
      expect(result).toBeDefined();
      expect(result.qualityOverview.totalIssues).toBe(1);
    });
  });
});