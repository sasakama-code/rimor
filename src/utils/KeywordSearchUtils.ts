/**
 * Keyword Search Utilities
 * Issue #119 対応: 曖昧な部分一致による誤検知問題を解決する統一キーワード検索システム
 * 
 * SOLID原則:
 * - 単一責任の原則: キーワード検索機能のみに特化
 * - オープンクローズドの原則: 将来的な分かち書き対応等の拡張可能性を保持
 * - 依存関係逆転の原則: 具体的な検索アルゴリズムではなく抽象的なインターフェースを提供
 * 
 * DRY原則: 全プロジェクトで統一されたキーワード検索ロジック
 */

/**
 * キーワード検索オプション
 */
export interface KeywordSearchOptions {
  /** 大文字小文字を区別するかどうか（デフォルト: false） */
  caseSensitive?: boolean;
  
  /** 記法ゆれの正規化を行うかどうか（デフォルト: true） */
  normalizeNotation?: boolean;
  
  /** デバッグモード（詳細ログ出力）（デフォルト: false） */
  debug?: boolean;
}

/**
 * キーワード検索結果
 */
export interface KeywordSearchResult {
  /** マッチしたかどうか */
  matches: boolean;
  
  /** マッチしたキーワード（複数ある場合は最初の一つ） */
  matchedKeyword?: string;
  
  /** マッチした位置情報（デバッグ用） */
  matchInfo?: {
    originalText: string;
    normalizedText: string;
    pattern: string;
    isAscii: boolean;
  };
}

/**
 * 統一キーワード検索ユーティリティクラス
 * Issue #119 対応: 語境界を考慮した精密なキーワード検索
 */
export class KeywordSearchUtils {
  
  /**
   * 文字列が指定されたキーワードのいずれかを含むかチェック（シンプル版）
   * @param text チェック対象の文字列
   * @param keywords キーワードの配列
   * @param options 検索オプション
   * @returns いずれかのキーワードを含む場合true
   */
  static containsAnyKeyword(
    text: string, 
    keywords: readonly string[], 
    options: KeywordSearchOptions = {}
  ): boolean {
    const result = this.searchKeywords(text, keywords, options);
    return result.matches;
  }

  /**
   * 文字列が指定されたキーワードのいずれかを含むかチェック（詳細結果版）
   * @param text チェック対象の文字列  
   * @param keywords キーワードの配列
   * @param options 検索オプション
   * @returns 詳細な検索結果
   */
  static searchKeywords(
    text: string,
    keywords: readonly string[],
    options: KeywordSearchOptions = {}
  ): KeywordSearchResult {
    const {
      caseSensitive = false,
      normalizeNotation = true,
      debug = false
    } = options;

    // 入力値検証
    if (!text || keywords.length === 0) {
      return { matches: false };
    }

    // ケース変換
    const processedText = caseSensitive ? text : text.toLowerCase();

    // 記法ゆれの正規化（kebab-case, snake_case → スペース区切り）
    const normalized = normalizeNotation 
      ? processedText
          .replace(/[-_]+/g, ' ')       // ハイフン・アンダースコアをスペースに変換
          .replace(/\s+/g, ' ')         // 連続するスペースを単一スペースに
          .trim()
      : processedText;

    // デバッグ情報の準備
    if (debug) {
      console.log(`[KeywordSearchUtils] Original: "${text}"`);
      console.log(`[KeywordSearchUtils] Normalized: "${normalized}"`);
      console.log(`[KeywordSearchUtils] Keywords:`, keywords);
    }

    for (const keyword of keywords) {
      const processedKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      
      // ASCII文字（英語）かどうかの判定
      const isAsciiOnly = /^[\x00-\x7F]+$/.test(processedKeyword);
      
      if (isAsciiOnly) {
        // 英語キーワード：語境界を考慮した完全一致
        const result = this.matchEnglishKeyword(normalized, processedKeyword, text);
        if (result) {
          if (debug) {
            console.log(`[KeywordSearchUtils] English match: "${keyword}"`);
          }
          return {
            matches: true,
            matchedKeyword: keyword,
            matchInfo: debug ? {
              originalText: text,
              normalizedText: normalized,
              pattern: result.pattern,
              isAscii: true
            } : undefined
          };
        }
      } else {
        // 日本語等の非ASCII文字：分かち書きされない言語の特性を考慮して部分一致
        if (normalized.includes(processedKeyword)) {
          if (debug) {
            console.log(`[KeywordSearchUtils] Non-ASCII match: "${keyword}"`);
          }
          return {
            matches: true,
            matchedKeyword: keyword,
            matchInfo: debug ? {
              originalText: text,
              normalizedText: normalized,
              pattern: 'partial-match',
              isAscii: false
            } : undefined
          };
        }
      }
    }

    return { matches: false };
  }

  /**
   * 英語キーワードの語境界を考慮したマッチング
   * @param normalizedText 正規化済みテキスト
   * @param keyword 検索キーワード
   * @param originalText 元のテキスト（関数名パターン検出用）
   * @returns マッチした場合の情報、しなかった場合はnull
   */
  private static matchEnglishKeyword(
    normalizedText: string,
    keyword: string,
    originalText: string
  ): { pattern: string } | null {
    // 正規表現特殊文字のエスケープ処理
    const escapedKeyword = this.escapeRegExp(keyword);
    
    // 語境界を考慮したパターンマッチング
    const wordBoundaryPattern = new RegExp(`(?:^|\\s)${escapedKeyword}(?:\\s|$)`, 'i');
    const matches = wordBoundaryPattern.test(normalizedText);
    
    if (!matches) {
      return null;
    }

    // 関数名・変数名パターンでの偽陽性チェック
    const originalLower = originalText.toLowerCase();
    const functionNamePattern = new RegExp(
      `\\w+_${escapedKeyword}_\\w+|${escapedKeyword}_\\w+(?=\\s|$)|(?<=\\s|^)\\w+_${escapedKeyword}(?=\\s|$)`,
      'i'
    );
    
    if (functionNamePattern.test(originalLower)) {
      return null; // 関数名・変数名の一部の場合は除外
    }

    return { pattern: wordBoundaryPattern.source };
  }

  /**
   * 正規表現特殊文字のエスケープ処理
   * @param str エスケープ対象の文字列
   * @returns エスケープ済み文字列
   */
  private static escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * キーワードリストの正規化・重複除去
   * @param keywords 元のキーワードリスト
   * @param caseSensitive 大文字小文字を区別するか
   * @returns 正規化済みキーワードリスト
   */
  static normalizeKeywords(
    keywords: string[],
    caseSensitive: boolean = false
  ): string[] {
    const processed = keywords
      .filter(kw => kw && kw.trim().length > 0)  // 空文字列・null・undefined除去
      .map(kw => caseSensitive ? kw.trim() : kw.trim().toLowerCase());
    
    // 重複除去
    return [...new Set(processed)];
  }

  /**
   * パフォーマンス計測付きキーワード検索（大量データ処理用）
   * @param text チェック対象の文字列
   * @param keywords キーワードの配列
   * @param options 検索オプション
   * @returns 検索結果とパフォーマンス情報
   */
  static searchKeywordsWithTiming(
    text: string,
    keywords: readonly string[],
    options: KeywordSearchOptions = {}
  ): KeywordSearchResult & { performanceMs: number } {
    const startTime = performance.now();
    const result = this.searchKeywords(text, keywords, options);
    const endTime = performance.now();
    
    return {
      ...result,
      performanceMs: endTime - startTime
    };
  }
}

/**
 * レガシーサポート用のエクスポート
 * 既存コードとの互換性を保つためのヘルパー関数
 */
export const containsAnyKeyword = KeywordSearchUtils.containsAnyKeyword;
export const searchKeywords = KeywordSearchUtils.searchKeywords;