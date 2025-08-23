/**
 * Intent Pattern Matcher
 * v0.9.0 - テスト意図のパターンマッチング機能
 * TDD Green Phase - テストを通す最小限の実装
 * KISS原則とYAGNI原則に従って実装
 */

import { CoverageScope } from './ITestIntentAnalyzer';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * テストパターンタイプ
 */
export type TestPattern = 'happy-path' | 'error-case' | 'edge-case' | 'boundary-value' | 'unknown';

/**
 * 詳細なパターンタイプ
 */
export type DetailedPattern = TestPattern | 'null-check' | 'empty-array' | 'null-return';

/**
 * テスト意図の抽出結果
 */
export interface ExtractedIntent {
  testName: string;
  description: string;
  expectedBehavior: string;
  securityRequirements: string[];
  pattern: TestPattern;
  filePath: string;
  line?: number;
}

/**
 * プロジェクト分析結果
 */
export interface ProjectIntentAnalysis {
  intents: ExtractedIntent[];
  totalTestFiles: number;
  totalTests: number;
  coverageAnalysis: CoverageScope;
  patternDistribution: Record<TestPattern, number>;
}

/**
 * パターン識別のためのキーワード定義
 * DRY原則: 重複を避けるため定数として定義
 */
const PATTERN_KEYWORDS = {
  ERROR_CASE: ['error', 'throw', 'invalid', 'fail'],
  EDGE_CASE: ['edge case', 'empty'],
  BOUNDARY_VALUE: ['boundary', 'maximum', 'minimum', 'limit'],
  HAPPY_PATH: ['valid', 'correct', 'should return', 'normal', 'success']
} as const;

/**
 * テスト意図のパターンマッチングクラス
 * KISS原則: シンプルなパターンマッチングから開始
 */
export class IntentPatternMatcher {
  /**
   * テストの説明文からパターンを識別
   * @param description テストの説明文
   * @returns 識別されたテストパターン
   */
  identifyTestPattern(description: string): TestPattern {
    const lowerDescription = description.toLowerCase();

    // エラーケースの識別（優先度を上げる）
    if (this.containsAnyKeyword(lowerDescription, PATTERN_KEYWORDS.ERROR_CASE)) {
      return 'error-case';
    }

    // エッジケースの識別
    if (this.containsAnyKeyword(lowerDescription, PATTERN_KEYWORDS.EDGE_CASE)) {
      return 'edge-case';
    }

    // 境界値の識別
    if (this.containsAnyKeyword(lowerDescription, PATTERN_KEYWORDS.BOUNDARY_VALUE)) {
      return 'boundary-value';
    }

    // ハッピーパスの識別
    if (this.containsAnyKeyword(lowerDescription, PATTERN_KEYWORDS.HAPPY_PATH)) {
      return 'happy-path';
    }

    return 'unknown';
  }

  /**
   * 文字列が指定されたキーワードのいずれかを含むかチェック
   * @param text チェック対象の文字列
   * @param keywords キーワードの配列
   * @returns いずれかのキーワードを含む場合true
   */
  private containsAnyKeyword(text: string, keywords: readonly string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 複数のテストからカバレッジスコープを分析
   * @param testDescriptions テスト説明文の配列
   * @returns カバレッジスコープ
   */
  analyzeCoverageScope(testDescriptions: string[]): CoverageScope {
    const patterns = testDescriptions.map(desc => this.identifyTestPattern(desc));

    return {
      happyPath: patterns.includes('happy-path'),
      errorCases: patterns.includes('error-case'),
      edgeCases: patterns.includes('edge-case'),
      boundaryValues: patterns.includes('boundary-value')
    };
  }

  /**
   * ASTからテストパターンを抽出
   * @param ast AST ノード
   * @returns 検出されたパターンの配列
   */
  extractPatternFromAST(ast: ASTNode): DetailedPattern[] {
    const patterns: DetailedPattern[] = [];
    const text = ast.text?.toLowerCase() || '';

    // 基本パターンの識別
    const basicPattern = this.identifyTestPattern(text);
    if (basicPattern !== 'unknown') {
      patterns.push(basicPattern);
    }

    // 詳細パターンの識別
    if (text.includes('null')) {
      patterns.push('null-check');
    }
    if (text.includes('empty array') || text.includes('[]')) {
      patterns.push('empty-array');
    }
    if (text.includes('return null') || text.includes('tobenull')) {
      patterns.push('null-return');
    }

    return patterns;
  }

  /**
   * 不足しているテストパターンを提案
   * @param existingPatterns 既存のパターン
   * @returns 提案されるパターン
   */
  suggestMissingPatterns(existingPatterns: TestPattern[]): TestPattern[] {
    const allPatterns: TestPattern[] = ['happy-path', 'error-case', 'edge-case', 'boundary-value'];
    return allPatterns.filter(pattern => !existingPatterns.includes(pattern));
  }

  /**
   * プロジェクト全体のテスト意図分析
   * @param projectPath プロジェクトのルートパス
   * @returns プロジェクト分析結果
   */
  async analyzeProject(projectPath: string): Promise<ProjectIntentAnalysis> {
    const { FileScanner } = await import('../utils/file-scanner');
    const fileScanner = new FileScanner({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      filePatterns: ['*.test.*', '*.spec.*'],
      excludeDirectories: ['node_modules', 'dist', 'build', '.git']
    });

    try {
      // プロジェクトルートを特定してテストファイルを探索
      const projectRoot = this.findProjectRoot(projectPath);
      const testFiles = await fileScanner.getTestFiles(projectRoot);
      const intents: ExtractedIntent[] = [];
      const patternDistribution: Record<TestPattern, number> = {
        'happy-path': 0,
        'error-case': 0,
        'edge-case': 0,
        'boundary-value': 0,
        'unknown': 0
      };

      let totalTests = 0;

      // 各テストファイルを解析
      for (const filePath of testFiles) {
        try {
          const fileIntents = await this.analyzeTestFile(filePath);
          intents.push(...fileIntents);
          
          // パターン分布の更新
          for (const intent of fileIntents) {
            patternDistribution[intent.pattern]++;
            totalTests++;
          }
        } catch (error) {
          console.debug(`テストファイル分析エラー (${filePath}):`, error);
        }
      }

      // カバレッジ分析
      const allPatterns = intents.map(intent => intent.pattern);
      const coverageAnalysis = this.analyzeCoverageScope(intents.map(intent => intent.description));

      return {
        intents,
        totalTestFiles: testFiles.length,
        totalTests,
        coverageAnalysis,
        patternDistribution
      };

    } catch (error) {
      throw new Error(`プロジェクト意図分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 単一テストファイルの分析
   * @param filePath テストファイルのパス
   * @returns 抽出された意図の配列
   */
  async analyzeTestFile(filePath: string): Promise<ExtractedIntent[]> {
    const intents: ExtractedIntent[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      let currentDescribeBlock = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // describeブロックの検出
        const describeMatch = trimmedLine.match(/describe\(['"`](.+?)['"`]/);
        if (describeMatch) {
          currentDescribeBlock = describeMatch[1];
          continue;
        }

        // itブロック（個別テスト）の検出
        const itMatch = trimmedLine.match(/(?:it|test)\(['"`](.+?)['"`]/);
        if (itMatch) {
          const testDescription = itMatch[1];
          const pattern = this.identifyTestPattern(testDescription);
          const expectedBehavior = this.extractExpectedBehavior(testDescription);
          const securityRequirements = this.extractSecurityRequirements(testDescription);

          intents.push({
            testName: `${currentDescribeBlock}: ${testDescription}`,
            description: testDescription,
            expectedBehavior,
            securityRequirements,
            pattern,
            filePath,
            line: i + 1
          });
        }
      }

      return intents;

    } catch (error) {
      throw new Error(`テストファイル分析に失敗しました (${filePath}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * テスト説明から期待動作を抽出
   * @param description テストの説明
   * @returns 期待動作の説明
   */
  private extractExpectedBehavior(description: string): string {
    // "should" パターンの処理
    if (description.includes('should')) {
      const shouldMatch = description.match(/should (.+)/);
      if (shouldMatch) {
        return shouldMatch[1];
      }
    }

    // "正常に" "適切に" などの日本語パターン
    if (description.match(/正常に|適切に|正しく/)) {
      return '正常な処理の実行';
    }

    // "エラー" "失敗" パターン
    if (description.match(/エラー|失敗|throw|error/i)) {
      return 'エラーハンドリングの確認';
    }

    // デフォルト
    return description;
  }

  /**
   * テスト説明からセキュリティ要件を抽出
   * @param description テストの説明
   * @returns セキュリティ要件の配列
   */
  private extractSecurityRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lowerDesc = description.toLowerCase();

    // セキュリティ関連キーワードマッピング
    const securityKeywords = {
      'authentication': ['auth', 'login', 'ログイン', '認証'],
      'authorization': ['permission', 'access', '権限', 'role'],
      'validation': ['validate', 'check', '検証', '入力値'],
      'sanitization': ['sanitize', 'escape', 'サニタイズ', 'エスケープ'],
      'encryption': ['encrypt', 'decrypt', '暗号', 'hash'],
      'sql-injection': ['sql', 'query', 'database', 'injection'],
      'xss': ['xss', 'script', 'html', 'javascript'],
      'csrf': ['csrf', 'token', 'form']
    };

    for (const [requirement, keywords] of Object.entries(securityKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        requirements.push(this.translateSecurityRequirement(requirement));
      }
    }

    // デフォルトセキュリティ要件
    if (requirements.length === 0 && this.isSecurityRelated(description)) {
      requirements.push('基本的なセキュリティ対策');
    }

    return requirements;
  }

  /**
   * セキュリティ要件を日本語に翻訳
   * @param requirement 英語の要件名
   * @returns 日本語の要件名
   */
  private translateSecurityRequirement(requirement: string): string {
    const translations: Record<string, string> = {
      'authentication': '認証',
      'authorization': '認可',
      'validation': '入力値検証',
      'sanitization': 'データサニタイゼーション',
      'encryption': '暗号化',
      'sql-injection': 'SQLインジェクション対策',
      'xss': 'XSS対策',
      'csrf': 'CSRF対策'
    };

    return translations[requirement] || requirement;
  }

  /**
   * セキュリティ関連のテストかどうか判定
   * @param description テストの説明
   * @returns セキュリティ関連の場合true
   */
  private isSecurityRelated(description: string): boolean {
    const securityIndicators = [
      'security', 'secure', 'safe', 'protect', 'guard',
      'セキュリティ', '安全', '保護', '防御'
    ];

    const lowerDesc = description.toLowerCase();
    return securityIndicators.some(indicator => lowerDesc.includes(indicator));
  }

  /**
   * プロジェクトルートを特定
   * @param givenPath 与えられたパス
   * @returns プロジェクトルートのパス
   */
  private findProjectRoot(givenPath: string): string {
    let currentPath = path.resolve(givenPath);

    // package.jsonがある場所をプロジェクトルートとして認識
    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, 'package.json'))) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    // package.jsonが見つからない場合、与えられたパスまたはその親ディレクトリを使用
    const absoluteGivenPath = path.resolve(givenPath);
    
    // srcディレクトリが与えられた場合、その親ディレクトリをプロジェクトルートとする
    if (path.basename(absoluteGivenPath) === 'src') {
      return path.dirname(absoluteGivenPath);
    }

    // それ以外の場合は与えられたパスをそのまま使用
    return absoluteGivenPath;
  }
}