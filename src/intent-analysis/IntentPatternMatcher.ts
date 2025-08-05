/**
 * Intent Pattern Matcher
 * v0.9.0 - テスト意図のパターンマッチング機能
 * TDD Green Phase - テストを通す最小限の実装
 * KISS原則とYAGNI原則に従って実装
 */

import { CoverageScope } from './ITestIntentAnalyzer';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';

/**
 * テストパターンタイプ
 */
export type TestPattern = 'happy-path' | 'error-case' | 'edge-case' | 'boundary-value' | 'unknown';

/**
 * 詳細なパターンタイプ
 */
export type DetailedPattern = TestPattern | 'null-check' | 'empty-array' | 'null-return';

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
}