/**
 * 文字列サニタイザー
 * AIエラーレポート用に文字列から不要な制御文字を除去
 */
/**
 * ANSIエスケープシーケンスを除去
 * @param text 処理対象のテキスト
 * @returns ANSIエスケープシーケンスを除去したテキスト
 */
export declare function stripAnsiCodes(text: string): string;
/**
 * 余分な空白行を削減
 * @param text 処理対象のテキスト
 * @returns 余分な空白行を削減したテキスト
 */
export declare function removeExcessiveWhitespace(text: string): string;
/**
 * エスケープされた改行・タブ文字を処理
 * @param text 処理対象のテキスト
 * @returns 処理済みのテキスト
 */
export declare function processEscapedCharacters(text: string): string;
/**
 * 行末の余分な空白を除去
 * @param text 処理対象のテキスト
 * @returns 行末の空白を除去したテキスト
 */
export declare function trimTrailingWhitespace(text: string): string;
/**
 * 完全なサニタイズ処理
 * AIエラーレポート用に全ての不要な文字を除去
 * @param text 処理対象のテキスト
 * @returns サニタイズ済みのテキスト
 */
export declare function sanitizeForAIReport(text: string): string;
/**
 * オブジェクト内の全ての文字列フィールドをサニタイズ
 * @param obj 処理対象のオブジェクト
 * @returns サニタイズ済みのオブジェクト
 */
export declare function sanitizeObject<T>(obj: T): T;
/**
 * JSON文字列をサニタイズ
 * @param jsonString JSON文字列
 * @returns サニタイズ済みのJSON文字列
 */
export declare function sanitizeJsonString(jsonString: string): string;
//# sourceMappingURL=stringSanitizer.d.ts.map