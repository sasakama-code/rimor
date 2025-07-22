import { Pattern } from './types';

/**
 * サンプルコードからパターンを抽出する分析器
 * v0.2.0では文字列マッチングベースの基本分析を実装
 */
export class PatternAnalyzer {
  private goodExamples: string[] = [];
  private badExamples: string[] = [];

  /**
   * 良い例と悪い例からパターンを抽出
   */
  analyzeExamples(goodExamples: string[], badExamples: string[]): Pattern[] {
    this.goodExamples = goodExamples;
    this.badExamples = badExamples;

    if (goodExamples.length === 0) {
      return [];
    }

    const patterns: Pattern[] = [];

    // 良い例に共通するパターンを抽出
    const commonPatterns = this.findCommonPatterns(goodExamples);

    // 悪い例にはないパターンを特定し、信頼度を計算
    for (const pattern of commonPatterns) {
      const confidence = this.calculateConfidence(pattern);
      
      // 最低信頼度を満たすパターンのみ採用
      if (confidence >= 0.1) {
        patterns.push({
          type: 'string-match',
          value: pattern,
          description: this.generateDescription(pattern),
          confidence: confidence
        });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * サンプルに共通するパターンを検出
   */
  findCommonPatterns(examples: string[]): string[] {
    if (examples.length === 0) return [];

    // 検出対象のパターン候補
    const candidatePatterns = [
      'expect(',
      'describe(',
      'it(',
      'test(',
      '.toBe(',
      '.toEqual(',
      '.toContain(',
      '.toHaveLength(',
      '.toBeNull(',
      '.toBeUndefined(',
      '.toBeTruthy(',
      '.toBeFalsy(',
      '.toThrow(',
      '.toBeGreaterThan(',
      '.toBeLessThan(',
      '.toBeInstanceOf(',
      'beforeEach(',
      'afterEach(',
      'beforeAll(',
      'afterAll('
    ];

    const commonPatterns: string[] = [];

    for (const pattern of candidatePatterns) {
      // パターンがすべての例に含まれているか、または大多数に含まれているかチェック
      const matchCount = examples.filter(example => example.includes(pattern)).length;
      const matchRatio = matchCount / examples.length;

      // 50%以上の例に含まれていれば共通パターンとみなす
      if (matchRatio >= 0.5) {
        commonPatterns.push(pattern);
      }
    }

    return commonPatterns;
  }

  /**
   * パターンの信頼度を計算
   */
  calculateConfidence(pattern: string): number {
    const goodMatches = this.goodExamples.filter(example => example.includes(pattern)).length;
    const badMatches = this.badExamples.filter(example => example.includes(pattern)).length;

    const totalGood = this.goodExamples.length;
    const totalBad = this.badExamples.length;

    if (totalGood === 0) return 0;

    // 良い例での出現率
    const goodRatio = goodMatches / totalGood;
    
    // 悪い例での出現率（低い方が良い）
    const badRatio = totalBad > 0 ? badMatches / totalBad : 0;
    
    // 信頼度計算：良い例での出現率が高く、悪い例での出現率が低いほど高い
    const confidence = goodRatio * (1 - badRatio);
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * パターンの説明文を生成
   */
  private generateDescription(pattern: string): string {
    const descriptions: { [key: string]: string } = {
      'expect(': 'テストで期待値を確認するアサーション',
      'describe(': 'テストスイートの定義',
      'it(': '個別のテストケースの定義',
      'test(': '個別のテストケースの定義',
      '.toBe(': '厳密等価性のアサーション',
      '.toEqual(': 'オブジェクト等価性のアサーション',
      '.toContain(': '配列や文字列の包含チェック',
      '.toHaveLength(': '配列の長さチェック',
      '.toBeNull(': 'null値のチェック',
      '.toBeUndefined(': 'undefined値のチェック',
      '.toBeTruthy(': '真値のチェック',
      '.toBeFalsy(': '偽値のチェック',
      '.toThrow(': '例外の発生チェック',
      '.toBeGreaterThan(': '大小比較（より大きい）',
      '.toBeLessThan(': '大小比較（より小さい）',
      '.toBeInstanceOf(': 'インスタンスタイプのチェック',
      'beforeEach(': '各テスト前の準備処理',
      'afterEach(': '各テスト後のクリーンアップ処理',
      'beforeAll(': '全テスト前の準備処理',
      'afterAll(': '全テスト後のクリーンアップ処理'
    };

    return descriptions[pattern] || `パターン: ${pattern}`;
  }
}