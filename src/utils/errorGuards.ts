/**
 * エラー型ガード関数
 * any型を削減し、型安全なエラーハンドリングを実現
 */

/**
 * Error型かどうかを判定
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Node.jsのエラーかどうかを判定（codeプロパティを持つ）
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return isError(error) && 'code' in error;
}

/**
 * エラーからメッセージを安全に取得
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

/**
 * エラーコードを安全に取得
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isNodeError(error)) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

/**
 * エラースタックを安全に取得
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

/**
 * エラーをError型に変換
 */
export function ensureError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }
  return new Error(getErrorMessage(error));
}