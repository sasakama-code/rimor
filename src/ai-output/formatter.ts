import * as fs from 'fs';
import * as path from 'path';
import { 
  AIOptimizedOutput, 
  FormatterOptions, 
  EnhancedAnalysisResult, 
  CodeContext, 
  SuggestedFix, 
  ActionStep,
  ImpactEstimation,
  AIOutputError,
  LocationInfo
} from './types';
import { Issue } from '../core/types';
import { FileScore } from '../scoring/types';
import { PathSecurity } from '../utils/pathSecurity';
import { ProjectInferenceEngine } from './projectInference';

/**
 * AI向け出力フォーマッター v0.6.0
 * 分析結果をAIツールが理解しやすい形式で出力
 */
export class AIOptimizedFormatter {
  private readonly VERSION: string;
  private readonly MAX_CONTEXT_LINES = 10;
  private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_MAX_TOKENS = 8000;
  private projectInferenceEngine: ProjectInferenceEngine;

  constructor() {
    // package.jsonからバージョンを動的に取得
    this.VERSION = this.loadVersionFromPackageJson();
    this.projectInferenceEngine = new ProjectInferenceEngine();
  }

  /**
   * package.jsonからバージョンを読み込み
   */
  private loadVersionFromPackageJson(): string {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '0.6.0';
      }
    } catch (error) {
      // エラーの場合はフォールバック
    }
    return '0.6.0';
  }

  /**
   * JSON形式でフォーマット
   */
  async formatAsJSON(
    result: EnhancedAnalysisResult, 
    projectPath: string, 
    options: FormatterOptions
  ): Promise<AIOptimizedOutput> {
    try {
      this.validateInputs(result, projectPath);

      const output: AIOptimizedOutput = {
        version: this.VERSION,
        format: "ai-optimized",
        metadata: await this.buildMetadata(projectPath),
        context: await this.buildContext(projectPath, options),
        qualityOverview: this.buildQualityOverview(result),
        files: await this.buildFileAnalysis(result, projectPath, options),
        actionableTasks: await this.buildActionableTasks(result),
        instructions: this.buildInstructions(result)
      };

      // サイズ制限チェック
      const outputSize = JSON.stringify(output).length;
      const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
      if (outputSize > maxSize) {
        throw this.createError('SIZE_LIMIT_EXCEEDED', `出力サイズ ${outputSize} bytes が制限 ${maxSize} bytes を超えています`);
      }

      return output;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError('FORMAT_GENERATION_FAILED', `JSON形式生成エラー: ${error}`);
    }
  }

  /**
   * Markdown形式でフォーマット
   */
  async formatAsMarkdown(
    result: EnhancedAnalysisResult, 
    projectPath: string, 
    options: FormatterOptions
  ): Promise<string> {
    try {
      this.validateInputs(result, projectPath);

      const metadata = await this.buildMetadata(projectPath);
      const qualityOverview = this.buildQualityOverview(result);
      const fileAnalysis = await this.buildFileAnalysis(result, projectPath, options);
      const actionableTasks = await this.buildActionableTasks(result);
      const instructions = this.buildInstructions(result);

      let markdown = this.buildMarkdownHeader(metadata, qualityOverview);
      markdown += this.buildMarkdownFiles(fileAnalysis, options);
      markdown += this.buildMarkdownTasks(actionableTasks);
      markdown += this.buildMarkdownInstructions(instructions);

      // トークン制限対応
      if (options.maxTokens && options.optimizeForAI) {
        markdown = this.optimizeForTokenLimit(markdown, options.maxTokens);
      }

      return markdown;
    } catch (error) {
      throw this.createError('FORMAT_GENERATION_FAILED', `Markdown形式生成エラー: ${error}`);
    }
  }

  /**
   * メタデータ構築
   */
  private async buildMetadata(projectPath: string) {
    let language = 'javascript';
    let testFramework = 'unknown';
    let projectType = 'unknown';

    try {
      // ProjectInferenceEngineを使用した高度な推論
      const inferenceResult = await this.projectInferenceEngine.inferProject(projectPath);
      
      // 言語検出
      language = inferenceResult.language.language || 'javascript';
      
      // テストフレームワーク検出
      testFramework = inferenceResult.testFramework.framework || 'unknown';
      
      // プロジェクトタイプ検出
      switch (inferenceResult.projectType.type) {
        case 'backend':
          projectType = 'rest-api';
          break;
        case 'frontend':
          projectType = 'frontend';
          break;
        case 'library':
          projectType = 'library';
          break;
        case 'cli-tool':
          projectType = 'cli-tool';
          break;
        case 'fullstack':
          projectType = 'fullstack';
          break;
        default:
          projectType = inferenceResult.projectType.type || 'unknown';
      }
    } catch (error) {
      // ProjectInferenceEngineエラー時は簡易検出にフォールバック
      const packageJsonPath = path.join(projectPath, 'package.json');
      const tsConfigPath = path.join(projectPath, 'tsconfig.json');

      try {
        if (fs.existsSync(tsConfigPath)) {
          language = 'typescript';
        }

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          
          // テストフレームワーク検出
          if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
            testFramework = 'jest';
          } else if (packageJson.devDependencies?.mocha || packageJson.dependencies?.mocha) {
            testFramework = 'mocha';
          }

          // プロジェクトタイプ検出
          if (packageJson.dependencies?.express || packageJson.dependencies?.fastify) {
            projectType = 'rest-api';
          } else if (packageJson.dependencies?.react || packageJson.dependencies?.vue) {
            projectType = 'frontend';
          } else {
            projectType = 'library';
          }
        }
      } catch (fallbackError) {
        // フォールバックエラーも無視してデフォルト値を使用
      }
    }

    return {
      projectType,
      language,
      testFramework,
      timestamp: new Date().toISOString(),
      rimVersion: this.VERSION
    };
  }

  /**
   * プロジェクトコンテキスト構築
   */
  private async buildContext(projectPath: string, options: FormatterOptions) {
    const context = {
      rootPath: projectPath,
      configFiles: {} as Record<string, string>,
      dependencies: {} as Record<string, string>,
      projectStructure: ''
    };

    if (!options.includeContext) {
      return context;
    }

    try {
      // 設定ファイルの読み込み
      const configFiles = ['package.json', 'tsconfig.json', 'jest.config.js', '.eslintrc.js'];
      for (const configFile of configFiles) {
        const filePath = path.join(projectPath, configFile);
        if (fs.existsSync(filePath)) {
          context.configFiles[configFile] = fs.readFileSync(filePath, 'utf-8').slice(0, 1000); // 最初の1000文字のみ
        }
      }

      // 依存関係の抽出
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        context.dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
      }

      // プロジェクト構造の簡潔な表現
      context.projectStructure = this.buildProjectStructure(projectPath);
    } catch (error) {
      // エラーは無視
    }

    return context;
  }

  /**
   * 品質概要構築
   */
  private buildQualityOverview(result: EnhancedAnalysisResult) {
    const projectScore = result.projectScore?.overallScore || 0;
    const projectGrade = result.projectScore?.grade || 'F';
    const criticalIssues = result.issues.filter(issue => issue.severity === 'error').length;
    const totalIssues = result.issues.length;

    return {
      projectScore,
      projectGrade,
      criticalIssues,
      totalIssues
    };
  }

  /**
   * ファイル分析構築
   */
  private async buildFileAnalysis(
    result: EnhancedAnalysisResult, 
    projectPath: string, 
    options: FormatterOptions
  ) {
    const fileMap = new Map<string, any>();

    // ファイル別にissueをグループ化
    for (const issue of result.issues) {
      const filePath = issue.file || 'unknown';
      if (!fileMap.has(filePath)) {
        fileMap.set(filePath, {
          path: filePath,
          language: this.detectLanguage(filePath),
          score: this.getFileScore(filePath, result.fileScores),
          issues: []
        });
      }
      
      const enhancedIssue = await this.enhanceIssue(issue, projectPath, options);
      fileMap.get(filePath)!.issues.push(enhancedIssue);
    }

    return Array.from(fileMap.values());
  }

  /**
   * issueの拡張（コンテキストと修正提案を追加）
   */
  private async enhanceIssue(issue: Issue, projectPath: string, options: FormatterOptions) {
    const location: LocationInfo = {
      file: issue.file || 'unknown',
      startLine: issue.line || 1,
      endLine: issue.line || 1
    };

    const codeContext = await this.buildCodeContext(issue, projectPath, options);
    const suggestedFix = this.buildSuggestedFix(issue, codeContext);

    return {
      id: this.generateIssueId(issue),
      type: issue.type,
      severity: issue.severity,
      location,
      description: issue.message,
      context: codeContext,
      fix: suggestedFix
    };
  }

  /**
   * コードコンテキスト構築
   */
  private async buildCodeContext(
    issue: Issue, 
    projectPath: string, 
    options: FormatterOptions
  ): Promise<CodeContext> {
    const relativePath = issue.file || '';
    const filePath = path.resolve(projectPath, relativePath);
    
    const context: CodeContext = {
      targetCode: {
        content: '',
        startLine: issue.line || 1,
        endLine: issue.line || 1
      },
      surroundingCode: {
        before: '',
        after: ''
      },
      imports: [],
      usedAPIs: []
    };

    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        const targetLine = (issue.line || 1) - 1;

        // ターゲットコード
        context.targetCode.content = lines[targetLine] || '';

        // 周辺コード
        const beforeStart = Math.max(0, targetLine - this.MAX_CONTEXT_LINES);
        const afterEnd = Math.min(lines.length, targetLine + this.MAX_CONTEXT_LINES + 1);
        
        context.surroundingCode.before = lines.slice(beforeStart, targetLine).join('\n');
        context.surroundingCode.after = lines.slice(targetLine + 1, afterEnd).join('\n');

        // インポート文の抽出
        context.imports = lines
          .filter(line => line.trim().startsWith('import '))
          .slice(0, 10); // 最初の10個のみ

        // 使用API抽出（簡易版）
        context.usedAPIs = this.extractUsedAPIs(fileContent);
      }
    } catch (error) {
      // エラーは無視
    }

    return context;
  }

  /**
   * 修正提案構築
   */
  private buildSuggestedFix(issue: Issue, codeContext: CodeContext): SuggestedFix {
    let template = '';
    let explanation = '';

    switch (issue.type) {
      case 'missing-assertion':
        template = `expect(result).toBeDefined();\nexpect(result).toEqual(expectedValue);`;
        explanation = 'テストにアサーション文を追加して、期待値と実際の値を比較します。';
        break;
      case 'missing-test':
        template = `describe('${this.extractFunctionName(codeContext.targetCode.content)}', () => {\n  it('should work correctly', () => {\n    // テストを実装\n  });\n});`;
        explanation = '対応するテストファイルを作成し、基本的なテストケースを追加します。';
        break;
      default:
        template = '// 修正が必要です';
        explanation = '問題を修正してください。';
    }

    return {
      type: 'add',
      targetLocation: {
        file: issue.file || 'unknown',
        startLine: issue.line || 1,
        endLine: issue.line || 1
      },
      code: {
        template,
        placeholders: {}
      },
      explanation,
      confidence: 0.8,
      dependencies: []
    };
  }

  /**
   * アクション可能タスク構築
   */
  private async buildActionableTasks(result: EnhancedAnalysisResult): Promise<Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>> {
    const tasks = [];
    const criticalIssues = result.issues.filter(issue => issue.severity === 'error');

    if (criticalIssues.length > 0) {
      tasks.push({
        id: 'fix-critical-issues',
        priority: 1,
        type: 'bug-fix',
        description: `${criticalIssues.length}個の重要な問題を修正`,
        automatable: true,
        estimatedImpact: {
          scoreImprovement: 20,
          issuesResolved: criticalIssues.length,
          effortMinutes: criticalIssues.length * 15,
          riskLevel: 'low' as const
        },
        steps: [
          {
            order: 1,
            action: 'アサーション文の追加',
            target: 'missing-assertion issues',
            explanation: 'テストファイルに適切なアサーション文を追加します',
            automated: true
          }
        ]
      });
    }

    return tasks;
  }

  /**
   * 指示文構築
   */
  private buildInstructions(result: EnhancedAnalysisResult) {
    const criticalCount = result.issues.filter(issue => issue.severity === 'error').length;
    
    return {
      forHuman: `このプロジェクトには${result.issues.length}個の問題があり、そのうち${criticalCount}個が重要です。優先度順に修正を進めてください。`,
      forAI: `以下のテスト品質問題を修正してください：

プロジェクト品質スコア: ${result.projectScore?.overallScore || 0}/100

修正要件:
- 既存のコードスタイルを維持
- 必要なインポートを追加
- エラーケースを網羅的にテスト
- テストの可読性を重視

優先度順に修正し、各修正後にテストを実行して動作確認してください。`
    };
  }

  // ヘルパーメソッド群

  private validateInputs(result: EnhancedAnalysisResult, projectPath: string) {
    if (!result || !result.issues) {
      throw new Error('無効な分析結果です');
    }
    if (!fs.existsSync(projectPath)) {
      throw new Error(`プロジェクトパスが存在しません: ${projectPath}`);
    }
  }

  private createError(code: AIOutputError['code'], message: string): AIOutputError {
    const error = new Error(message) as AIOutputError;
    error.code = code;
    return error;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts': return 'typescript';
      case '.js': return 'javascript';
      case '.py': return 'python';
      case '.java': return 'java';
      default: return 'unknown';
    }
  }

  private getFileScore(filePath: string, fileScores?: FileScore[]): number {
    if (!fileScores) return 0;
    const fileScore = fileScores.find(fs => fs.filePath === filePath);
    return fileScore?.overallScore || 0;
  }

  private generateIssueId(issue: Issue): string {
    return `${issue.type}-${issue.file}-${issue.line}`.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  private extractUsedAPIs(content: string): string[] {
    const apis = [];
    const patterns = [
      /expect\(/g,
      /describe\(/g,
      /it\(/g,
      /beforeEach\(/g,
      /afterEach\(/g
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        apis.push(...matches.map(m => m.replace('(', '')));
      }
    }

    return [...new Set(apis)].slice(0, 10);
  }

  private extractFunctionName(code: string): string {
    const match = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
    return match ? (match[1] || match[2]) : 'unknown';
  }

  private buildProjectStructure(projectPath: string): string {
    try {
      const items = fs.readdirSync(projectPath, { withFileTypes: true })
        .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
        .slice(0, 10)
        .map(item => item.isDirectory() ? `${item.name}/` : item.name);
      return items.join(', ');
    } catch {
      return 'unknown';
    }
  }

  private buildMarkdownHeader(metadata: any, qualityOverview: any): string {
    return `# Rimor Test Quality Analysis Report

## Project Context
- **Language**: ${metadata.language}
- **Test Framework**: ${metadata.testFramework}
- **Project Type**: ${metadata.projectType}
- **Quality Score**: ${qualityOverview.projectScore}/100 (${qualityOverview.projectGrade})

## Critical Issues Summary
Found ${qualityOverview.criticalIssues} critical issues requiring immediate attention.

`;
  }

  private buildMarkdownFiles(fileAnalysis: any[], options: FormatterOptions): string {
    let markdown = '';
    
    for (const file of fileAnalysis) {
      markdown += `## File: ${file.path} (Score: ${file.score}/100)\n\n`;
      
      for (let i = 0; i < file.issues.length; i++) {
        const issue = file.issues[i];
        markdown += `### Issue #${i + 1}: ${issue.description}\n`;
        markdown += `**Severity**: ${issue.severity}\n`;
        markdown += `**Location**: Line ${issue.location.startLine}\n\n`;
        
        if (options.includeSourceCode && issue.context.targetCode.content) {
          markdown += `**Current Code**:\n\`\`\`${file.language}\n${issue.context.targetCode.content}\n\`\`\`\n\n`;
        }
        
        markdown += `**Suggested Fix**:\n\`\`\`${file.language}\n${issue.fix.code.template}\n\`\`\`\n\n`;
        markdown += `${issue.fix.explanation}\n\n`;
      }
    }
    
    return markdown;
  }

  private buildMarkdownTasks(actionableTasks: any[]): string {
    let markdown = '## Automated Tasks\n\n';
    
    for (const task of actionableTasks) {
      markdown += `### ${task.description}\n`;
      markdown += `**Priority**: ${task.priority} (${task.type})\n`;
      markdown += `**Automatable**: ${task.automatable ? 'Yes' : 'No'}\n`;
      markdown += `**Impact**: +${task.estimatedImpact.scoreImprovement} points, resolves ${task.estimatedImpact.issuesResolved} issues\n\n`;
      
      markdown += 'Steps:\n';
      for (const step of task.steps) {
        markdown += `${step.order}. ${step.explanation}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  private buildMarkdownInstructions(instructions: any): string {
    return `---

## Instructions for AI
${instructions.forAI}
`;
  }

  private optimizeForTokenLimit(content: string, maxTokens: number): string {
    // 簡易的なトークン数推定（1トークン ≈ 4文字）
    const estimatedTokens = content.length / 4;
    
    if (estimatedTokens <= maxTokens) {
      return content;
    }
    
    // 制限を超えた場合は内容を削減
    const targetLength = maxTokens * 4 * 0.9; // 安全マージン
    const sections = content.split('\n## ');
    
    let optimizedContent = sections[0]; // ヘッダーは保持
    let currentLength = optimizedContent.length;
    
    for (let i = 1; i < sections.length && currentLength < targetLength; i++) {
      const section = '\n## ' + sections[i];
      if (currentLength + section.length <= targetLength) {
        optimizedContent += section;
        currentLength += section.length;
      } else {
        break;
      }
    }
    
    if (optimizedContent.length < content.length) {
      optimizedContent += '\n\n*[内容が省略されました - トークン制限のため]*';
    }
    
    return optimizedContent;
  }
}