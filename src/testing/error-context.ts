import * as fs from 'fs';
import * as path from 'path';
import { ErrorInfo, ErrorType } from '../utils/errorHandler';
import { CodeContextAnalyzer } from '../analyzers/code-context';
import { Issue } from '../core/types';

/**
 * テストエラーのコンテキスト情報
 * Context Engineeringの原則に基づいて構造化
 */
export interface TestErrorContext {
  // 基本情報
  timestamp: string;
  testFile: string;
  testName: string;
  errorType: ErrorType;
  
  // エラー詳細
  error: {
    message: string;
    stack?: string;
    actual?: any;
    expected?: any;
  };
  
  // コードコンテキスト（Select Context）
  codeContext: {
    failedLine: number;
    failedCode: string;
    surroundingCode: {
      before: string;
      after: string;
    };
    testStructure: TestStructure;
  };
  
  // 環境情報（Write Context）
  environment: {
    nodeVersion: string;
    jestVersion?: string;
    ciEnvironment: boolean;
    memoryUsage: NodeJS.MemoryUsage;
  };
  
  // 関連ファイル（Isolate Context）
  relatedFiles: {
    sourceFile?: string;
    dependencies: string[];
    configFiles: string[];
  };
  
  // 推奨アクション（Compress Context）
  suggestedActions: SuggestedAction[];
}

interface TestStructure {
  describes: string[];
  currentTest: string;
  hooks: string[];
}

interface SuggestedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  codeSnippet?: string;
}

/**
 * テストエラーコンテキスト収集器
 * Context Engineeringの手法を使用してエラー情報を収集・構造化
 */
export class TestErrorContextCollector {
  private codeAnalyzer: CodeContextAnalyzer;
  private readonly MAX_STACK_LINES = 10;
  private readonly MAX_CODE_LINES = 15;
  
  constructor() {
    this.codeAnalyzer = new CodeContextAnalyzer();
  }
  
  /**
   * テストエラーのコンテキストを収集
   */
  async collectErrorContext(
    error: Error | any,
    testPath: string,
    testName: string,
    projectPath: string
  ): Promise<TestErrorContext> {
    const timestamp = new Date().toISOString();
    
    // エラー情報の抽出
    const errorDetails = this.extractErrorDetails(error);
    
    // コードコンテキストの収集
    const codeContext = await this.extractCodeContext(
      error,
      testPath,
      testName,
      projectPath
    );
    
    // 環境情報の収集
    const environment = this.collectEnvironmentInfo();
    
    // 関連ファイルの検出
    const relatedFiles = await this.findRelatedFiles(
      testPath,
      projectPath
    );
    
    // 推奨アクションの生成
    const suggestedActions = this.generateSuggestedActions(
      errorDetails,
      codeContext,
      testPath
    );
    
    return {
      timestamp,
      testFile: testPath,
      testName,
      errorType: this.determineErrorType(error),
      error: errorDetails,
      codeContext,
      environment,
      relatedFiles,
      suggestedActions
    };
  }
  
  /**
   * エラー詳細の抽出
   */
  private extractErrorDetails(error: Error | any): TestErrorContext['error'] {
    const details: TestErrorContext['error'] = {
      message: error?.message || String(error),
      stack: error?.stack
    };
    
    // Jest特有のエラー情報を抽出
    if (error && typeof error === 'object') {
      if ('matcherResult' in error) {
        details.actual = error.matcherResult?.actual;
        details.expected = error.matcherResult?.expected;
      } else if ('actual' in error && 'expected' in error) {
        details.actual = error.actual;
        details.expected = error.expected;
      }
    }
    
    // スタックトレースの最適化（Context Compression）
    if (details.stack) {
      details.stack = this.optimizeStackTrace(details.stack);
    }
    
    return details;
  }
  
  /**
   * コードコンテキストの抽出
   */
  private async extractCodeContext(
    error: Error | any,
    testPath: string,
    testName: string,
    projectPath: string
  ): Promise<TestErrorContext['codeContext']> {
    const failedLine = this.extractFailedLine(error);
    const testContent = await this.readFileContent(testPath);
    const lines = testContent.split('\n');
    
    // 失敗した行のコード
    const failedCode = lines[failedLine - 1] || '';
    
    // 周辺コード（Context Selection）
    const beforeStart = Math.max(0, failedLine - this.MAX_CODE_LINES);
    const afterEnd = Math.min(lines.length, failedLine + this.MAX_CODE_LINES);
    
    const surroundingCode = {
      before: lines.slice(beforeStart, failedLine - 1).join('\n'),
      after: lines.slice(failedLine, afterEnd).join('\n')
    };
    
    // テスト構造の分析
    const testStructure = this.analyzeTestStructure(testContent, testName);
    
    return {
      failedLine,
      failedCode,
      surroundingCode,
      testStructure
    };
  }
  
  /**
   * 環境情報の収集
   */
  private collectEnvironmentInfo(): TestErrorContext['environment'] {
    return {
      nodeVersion: process.version,
      jestVersion: this.getJestVersion(),
      ciEnvironment: process.env.CI === 'true',
      memoryUsage: process.memoryUsage()
    };
  }
  
  /**
   * 関連ファイルの検出
   */
  private async findRelatedFiles(
    testPath: string,
    projectPath: string
  ): Promise<TestErrorContext['relatedFiles']> {
    const relatedFiles: TestErrorContext['relatedFiles'] = {
      dependencies: [],
      configFiles: []
    };
    
    // ソースファイルの検出
    const sourceFile = this.findSourceFile(testPath);
    if (sourceFile && fs.existsSync(sourceFile)) {
      relatedFiles.sourceFile = sourceFile;
    }
    
    // インポートの解析
    try {
      const testContent = await this.readFileContent(testPath);
      relatedFiles.dependencies = this.extractImports(testContent);
    } catch (error) {
      // エラーは無視
    }
    
    // 設定ファイルの検出
    const configFiles = [
      'jest.config.js',
      'jest.config.mjs',
      'jest.setup.js',
      'tsconfig.json',
      '.eslintrc.js'
    ];
    
    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        relatedFiles.configFiles.push(configFile);
      }
    }
    
    return relatedFiles;
  }
  
  /**
   * 推奨アクションの生成（Context Compression）
   */
  private generateSuggestedActions(
    errorDetails: TestErrorContext['error'],
    codeContext: TestErrorContext['codeContext'],
    testPath: string
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    
    // エラーメッセージに基づくアクション
    if (errorDetails.message.includes('Cannot find module')) {
      actions.push({
        priority: 'high',
        action: 'モジュールのインストールまたはパスの修正',
        reasoning: 'モジュールが見つからないエラーです',
        codeSnippet: 'npm install <missing-module>'
      });
    }
    
    if (errorDetails.message.includes('Expected') && errorDetails.message.includes('Received')) {
      actions.push({
        priority: 'medium',
        action: 'アサーションの期待値を確認',
        reasoning: '期待値と実際の値が一致していません',
        codeSnippet: `expect(actual).toBe(${errorDetails.expected})`
      });
    }
    
    if (errorDetails.message.includes('TypeError')) {
      actions.push({
        priority: 'high',
        action: '型エラーの修正',
        reasoning: '型の不一致またはnull/undefined参照の可能性',
        codeSnippet: '// null チェックを追加: if (value != null) { ... }'
      });
    }
    
    // コードコンテキストに基づくアクション
    if (codeContext.failedCode.includes('async') && !codeContext.failedCode.includes('await')) {
      actions.push({
        priority: 'medium',
        action: 'awaitキーワードの追加',
        reasoning: '非同期関数の呼び出しにawaitが不足している可能性',
        codeSnippet: 'await ' + codeContext.failedCode.trim()
      });
    }
    
    return actions;
  }
  
  // ヘルパーメソッド
  
  private determineErrorType(error: Error | any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;
    
    const message = error.message || String(error);
    
    if (message.includes('Cannot find module') || message.includes('ENOENT')) {
      return ErrorType.FILE_NOT_FOUND;
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('parse') || message.includes('SyntaxError')) {
      return ErrorType.PARSE_ERROR;
    }
    
    return ErrorType.UNKNOWN;
  }
  
  private extractFailedLine(error: Error | any): number {
    if (!error?.stack) return 1;
    
    const stackLines = error.stack.split('\n');
    for (const line of stackLines) {
      const match = line.match(/:(\d+):\d+\)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return 1;
  }
  
  private optimizeStackTrace(stack: string): string {
    const lines = stack.split('\n');
    const relevantLines = lines
      .filter(line => !line.includes('node_modules'))
      .slice(0, this.MAX_STACK_LINES);
    
    return relevantLines.join('\n');
  }
  
  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }
  
  private analyzeTestStructure(content: string, testName: string): TestStructure {
    const describes: string[] = [];
    const hooks: string[] = [];
    
    // describe ブロックの抽出
    const describeRegex = /describe\(['"`](.*?)['"`]/g;
    let match;
    while ((match = describeRegex.exec(content)) !== null) {
      describes.push(match[1]);
    }
    
    // フックの検出
    const hookPatterns = ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'];
    for (const hook of hookPatterns) {
      if (content.includes(`${hook}(`)) {
        hooks.push(hook);
      }
    }
    
    return {
      describes,
      currentTest: testName,
      hooks
    };
  }
  
  private findSourceFile(testPath: string): string | undefined {
    // テストファイルから対応するソースファイルを推測
    const sourceFile = testPath
      .replace(/\.test\.(ts|js)$/, '.$1')
      .replace(/\.spec\.(ts|js)$/, '.$1')
      .replace('/__tests__/', '/');
    
    return fs.existsSync(sourceFile) ? sourceFile : undefined;
  }
  
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"`](.*?)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.')) {
        imports.push(match[1]);
      }
    }
    
    return [...new Set(imports)];
  }
  
  private getJestVersion(): string | undefined {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.devDependencies?.jest || packageJson.dependencies?.jest;
    } catch (error) {
      return undefined;
    }
  }
}