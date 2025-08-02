/**
 * 正規表現ヘルパークラス
 * lastIndexリセットや安全な正規表現操作を提供
 */

export class RegexHelper {
  /**
   * 正規表現のlastIndexをリセットしてからテストを実行
   * @param pattern 正規表現パターン
   * @param text テスト対象のテキスト
   * @returns マッチするかどうか
   */
  static resetAndTest(pattern: RegExp, text: string): boolean {
    pattern.lastIndex = 0;
    return pattern.test(text);
  }
  
  /**
   * 正規表現のlastIndexをリセットしてからマッチを実行
   * @param pattern 正規表現パターン
   * @param text マッチ対象のテキスト
   * @returns マッチ結果またはnull
   */
  static resetAndMatch(pattern: RegExp, text: string): RegExpMatchArray | null {
    pattern.lastIndex = 0;
    return text.match(pattern);
  }
  
  /**
   * 正規表現のlastIndexをリセットしてからexecを実行
   * @param pattern 正規表現パターン
   * @param text 実行対象のテキスト
   * @returns 実行結果またはnull
   */
  static resetAndExec(pattern: RegExp, text: string): RegExpExecArray | null {
    pattern.lastIndex = 0;
    return pattern.exec(text);
  }
  
  /**
   * 複数の正規表現パターンをテストし、マッチした数を返す
   * @param patterns 正規表現パターンの配列
   * @param text テスト対象のテキスト
   * @returns マッチした数
   */
  static countMatches(patterns: RegExp[], text: string): number {
    let count = 0;
    for (const pattern of patterns) {
      if (this.resetAndTest(pattern, text)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * 複数の正規表現パターンをテストし、いずれかがマッチするかを返す
   * @param patterns 正規表現パターンの配列
   * @param text テスト対象のテキスト
   * @returns いずれかがマッチするかどうか
   */
  static testAny(patterns: RegExp[], text: string): boolean {
    for (const pattern of patterns) {
      if (this.resetAndTest(pattern, text)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 複数の正規表現パターンをテストし、すべてがマッチするかを返す
   * @param patterns 正規表現パターンの配列
   * @param text テスト対象のテキスト
   * @returns すべてがマッチするかどうか
   */
  static testAll(patterns: RegExp[], text: string): boolean {
    for (const pattern of patterns) {
      if (!this.resetAndTest(pattern, text)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 正規表現パターンでマッチしたすべての結果を配列で返す
   * @param pattern 正規表現パターン（グローバルフラグ必須）
   * @param text マッチ対象のテキスト
   * @returns マッチした文字列の配列
   */
  static findAllMatches(pattern: RegExp, text: string): string[] {
    if (!pattern.global) {
      throw new Error("");
    }
    
    pattern.lastIndex = 0;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[0]);
    }
    
    return matches;
  }
  
  /**
   * デバッグ用: 正規表現の状態を表示
   * @param pattern 正規表現パターン
   * @param label デバッグ用ラベル
   */
  static debugPattern(pattern: RegExp, label: string = 'Pattern'): void {
    console.log(`${label}:`, {
      source: pattern.source,
      flags: pattern.flags,
      lastIndex: pattern.lastIndex,
      global: pattern.global,
      ignoreCase: pattern.ignoreCase,
      multiline: pattern.multiline
    });
  }
}