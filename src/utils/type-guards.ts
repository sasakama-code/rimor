/**
 * 型ガード関数ライブラリ
 * unknown型から安全に型を絞り込むためのユーティリティ
 */

/**
 * オブジェクトかどうかをチェック
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 文字列かどうかをチェック
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 数値かどうかをチェック
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 真偽値かどうかをチェック
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 配列かどうかをチェック
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 関数かどうかをチェック
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * nullまたはundefinedかどうかをチェック
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 値が存在するかどうかをチェック（null/undefinedでない）
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 文字列の配列かどうかをチェック
 */
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

/**
 * 数値の配列かどうかをチェック
 */
export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(isNumber);
}

/**
 * オブジェクトに特定のプロパティが存在するかチェック
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * オブジェクトに複数のプロパティが存在するかチェック
 */
export function hasProperties<K extends string>(
  obj: unknown,
  keys: K[]
): obj is Record<K, unknown> {
  return isObject(obj) && keys.every(key => key in obj);
}

/**
 * 安全にプロパティにアクセス
 */
export function getProperty<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!isObject(obj)) {
    return defaultValue;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current as T;
}

/**
 * 型の検証と変換
 */
export function validateAndTransform<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  transformer?: (v: T) => T
): T | null {
  if (!validator(value)) {
    return null;
  }
  return transformer ? transformer(value) : value;
}

/**
 * 複数の型ガードを組み合わせ
 */
export function combineGuards<T, U extends T>(
  guard1: (v: unknown) => v is T,
  guard2: (v: T) => v is U
): (v: unknown) => v is U {
  return (value: unknown): value is U => {
    return guard1(value) && guard2(value);
  };
}

/**
 * ユニオン型のガード
 */
export function isUnion<T, U>(
  value: unknown,
  guard1: (v: unknown) => v is T,
  guard2: (v: unknown) => v is U
): value is T | U {
  return guard1(value) || guard2(value);
}

/**
 * エラーオブジェクトかどうかをチェック
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Promiseかどうかをチェック
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    isObject(value) &&
    'then' in value &&
    isFunction((value as any).then) &&
    'catch' in value &&
    isFunction((value as any).catch)
  );
}

/**
 * レスポンスオブジェクトの型ガード例
 */
export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export function isApiResponse(value: unknown): value is ApiResponse {
  return (
    isObject(value) &&
    hasProperty(value, 'success') &&
    isBoolean(value.success) &&
    (!hasProperty(value, 'data') || isDefined(value.data)) &&
    (!hasProperty(value, 'error') || isString(value.error))
  );
}

/**
 * 型ガードを使用した安全なキャスト
 */
export function safeCast<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  errorMessage?: string
): T {
  if (!guard(value)) {
    throw new TypeError(
      errorMessage || `Value does not match expected type`
    );
  }
  return value;
}

/**
 * デバッグ用：型情報をログ出力
 */
export function logType(value: unknown, label?: string): void {
  const prefix = label ? `[${label}] ` : '';
  
  if (isNullOrUndefined(value)) {
    console.log(`${prefix}Type: ${value}`);
  } else if (isArray(value)) {
    console.log(`${prefix}Type: Array (length: ${value.length})`);
  } else if (isObject(value)) {
    console.log(`${prefix}Type: Object (keys: ${Object.keys(value).join(', ')})`);
  } else {
    console.log(`${prefix}Type: ${typeof value}`);
  }
}

/**
 * JSONの安全なパース
 */
export function safeJsonParse<T = unknown>(
  json: string,
  validator?: (v: unknown) => v is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * アサーション関数
 */
export function assert<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message || 'Assertion failed');
  }
}