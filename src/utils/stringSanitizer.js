"use strict";
/**
 * 文字列サニタイザー
 * AIエラーレポート用に文字列から不要な制御文字を除去
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsiCodes = stripAnsiCodes;
exports.removeExcessiveWhitespace = removeExcessiveWhitespace;
exports.processEscapedCharacters = processEscapedCharacters;
exports.trimTrailingWhitespace = trimTrailingWhitespace;
exports.sanitizeForAIReport = sanitizeForAIReport;
exports.sanitizeObject = sanitizeObject;
exports.sanitizeJsonString = sanitizeJsonString;
/**
 * ANSIエスケープシーケンスを除去
 * @param text 処理対象のテキスト
 * @returns ANSIエスケープシーケンスを除去したテキスト
 */
function stripAnsiCodes(text) {
    // ANSIエスケープシーケンスのパターン
    // ESC[...m形式のカラーコードなどを除去
    const ansiRegex = /\u001b\[[0-9;]*m/g;
    return text.replace(ansiRegex, '');
}
/**
 * 余分な空白行を削減
 * @param text 処理対象のテキスト
 * @returns 余分な空白行を削減したテキスト
 */
function removeExcessiveWhitespace(text) {
    // 3行以上の連続した空白行を2行に削減
    return text.replace(/\n{3,}/g, '\n\n');
}
/**
 * エスケープされた改行・タブ文字を処理
 * @param text 処理対象のテキスト
 * @returns 処理済みのテキスト
 */
function processEscapedCharacters(text) {
    // JSONで文字列として保存される際にエスケープされた文字を処理
    // \\n -> \n, \\t -> \t に変換
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r');
}
/**
 * 行末の余分な空白を除去
 * @param text 処理対象のテキスト
 * @returns 行末の空白を除去したテキスト
 */
function trimTrailingWhitespace(text) {
    return text
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n');
}
/**
 * 完全なサニタイズ処理
 * AIエラーレポート用に全ての不要な文字を除去
 * @param text 処理対象のテキスト
 * @returns サニタイズ済みのテキスト
 */
function sanitizeForAIReport(text) {
    if (!text)
        return '';
    let sanitized = text;
    // 1. ANSIエスケープシーケンスを除去
    sanitized = stripAnsiCodes(sanitized);
    // 2. エスケープされた文字を処理
    sanitized = processEscapedCharacters(sanitized);
    // 3. 行末の余分な空白を除去
    sanitized = trimTrailingWhitespace(sanitized);
    // 4. 余分な空白行を削減
    sanitized = removeExcessiveWhitespace(sanitized);
    return sanitized;
}
/**
 * オブジェクト内の全ての文字列フィールドをサニタイズ
 * @param obj 処理対象のオブジェクト
 * @returns サニタイズ済みのオブジェクト
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        return sanitizeForAIReport(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
/**
 * JSON文字列をサニタイズ
 * @param jsonString JSON文字列
 * @returns サニタイズ済みのJSON文字列
 */
function sanitizeJsonString(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const sanitized = sanitizeObject(parsed);
        return JSON.stringify(sanitized, null, 2);
    }
    catch (error) {
        // JSONパースに失敗した場合は文字列として処理
        return sanitizeForAIReport(jsonString);
    }
}
//# sourceMappingURL=stringSanitizer.js.map