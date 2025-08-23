/**
 * ハンドラー関数の型定義
 * コールバック・イベントハンドラー用の型
 */

/**
 * 基本的なハンドラー関数
 */
export type Handler<T = void> = (event: Event) => T;

/**
 * 非同期ハンドラー関数
 */
export type AsyncHandler<T = void> = (event: Event) => Promise<T>;

/**
 * エラーハンドラー
 */
export type ErrorHandler = (error: Error, context?: ErrorContext) => void;

/**
 * エラーコンテキスト
 */
export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  method?: string;
  stack?: string;
}

/**
 * コールバック関数の基本型
 */
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;

/**
 * 非同期コールバック
 */
export type AsyncCallback<T = void, E = Error> = (error: E | null, result?: T) => Promise<void>;

/**
 * イベントリスナー
 */
export interface EventListener<T = unknown> {
  eventName: string;
  handler: (data: T) => void;
  once?: boolean;
}

/**
 * Handlebarsヘルパー関数の型
 */
export type HandlebarsHelper = (...args: unknown[]) => unknown;

/**
 * Handlebarsブロックヘルパー
 */
export interface HandlebarsBlockHelper {
  (this: unknown, context: unknown, options: HandlebarsOptions): string;
}

/**
 * Handlebarsオプション
 */
export interface HandlebarsOptions {
  fn: (context: unknown) => string;
  inverse: (context: unknown) => string;
  hash: Record<string, unknown>;
  data?: Record<string, unknown>;
}

/**
 * 配列操作用ヘルパー
 */
export type ArrayHelper<T> = (array: T[], ...args: unknown[]) => T[] | T | undefined;

/**
 * オブジェクト操作用ヘルパー
 */
export type ObjectHelper<T = unknown> = (obj: Record<string, T>, ...args: unknown[]) => T | undefined;

/**
 * 文字列操作用ヘルパー
 */
export type StringHelper = (str: string, ...args: unknown[]) => string;

/**
 * 数値操作用ヘルパー
 */
export type NumberHelper = (num: number, ...args: unknown[]) => number | string;

/**
 * 条件判定ヘルパー
 */
export type ConditionalHelper = (...args: unknown[]) => boolean;

/**
 * 変換ヘルパー
 */
export type TransformHelper<T, R> = (value: T, ...args: unknown[]) => R;

/**
 * フィルター関数
 */
export type FilterFunction<T> = (item: T, index?: number, array?: T[]) => boolean;

/**
 * マッパー関数
 */
export type MapperFunction<T, R> = (item: T, index?: number, array?: T[]) => R;

/**
 * リデューサー関数
 */
export type ReducerFunction<T, R> = (accumulator: R, current: T, index?: number, array?: T[]) => R;

/**
 * ソート比較関数
 */
export type ComparatorFunction<T> = (a: T, b: T) => number;

/**
 * バリデーター関数
 */
export type ValidatorFunction<T> = (value: T) => boolean | string;

/**
 * サニタイザー関数
 */
export type SanitizerFunction<T = string> = (input: T) => T;

/**
 * パーサー関数
 */
export type ParserFunction<T, R> = (input: T) => R | never;

/**
 * フォーマッター関数
 */
export type FormatterFunction<T> = (value: T, format?: string) => string;

/**
 * ミドルウェア関数
 */
export type MiddlewareFunction<T = unknown, R = unknown> = (
  context: T,
  next: () => Promise<R>
) => Promise<R>;

/**
 * インターセプター関数
 */
export interface InterceptorFunction<T = unknown, R = unknown> {
  before?: (context: T) => T | Promise<T>;
  after?: (result: R, context: T) => R | Promise<R>;
  error?: (error: Error, context: T) => void | Promise<void>;
}

/**
 * トランスフォーマー関数
 */
export type TransformerFunction<T, R> = (input: T) => R | Promise<R>;

/**
 * アグリゲーター関数
 */
export type AggregatorFunction<T, R> = (items: T[]) => R;

/**
 * プレディケート関数
 */
export type PredicateFunction<T> = (value: T) => boolean;

/**
 * ファクトリー関数
 */
export type FactoryFunction<T> = (...args: unknown[]) => T;

/**
 * ビルダー関数
 */
export type BuilderFunction<T> = (config: Partial<T>) => T;

/**
 * リゾルバー関数
 */
export type ResolverFunction<T> = () => T | Promise<T>;