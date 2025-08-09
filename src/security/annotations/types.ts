/**
 * Taint Annotation System Type Definitions
 * デコレーターとメタデータシステムの型定義
 */

/**
 * デコレーターのターゲット型
 * クラス、メソッド、プロパティに適用可能
 */
export type DecoratorTarget = Object | Function | { prototype?: Object; new?(...args: unknown[]): unknown };

/**
 * プロパティキーの型
 */
export type PropertyKey = string | symbol;

/**
 * メタデータのタイムスタンプ型
 */
export type Timestamp = number;

/**
 * 汚染メタデータの基本構造
 */
export interface TaintMetadata {
  level: 'tainted' | 'untainted' | 'poly';
  source?: string;
  reason?: string;
  timestamp: Timestamp;
}

/**
 * ポリモーフィック汚染メタデータ
 */
export interface PolyTaintMetadata {
  polymorphic: boolean;
  description?: string;
  timestamp: Timestamp;
}

/**
 * 汚染抑制メタデータ
 */
export interface SuppressTaintMetadata {
  suppressed: boolean;
  reason: string;
  timestamp: Timestamp;
}

/**
 * パラメータ汚染メタデータ
 */
export type ParameterTaintMetadata = TaintMetadata[];

/**
 * クラスアノテーション情報
 */
export interface ClassAnnotationInfo {
  taint?: TaintMetadata;
  poly?: PolyTaintMetadata;
  suppress?: SuppressTaintMetadata;
}

/**
 * クラスアノテーションマップ
 */
export type ClassAnnotationMap = Map<string, ClassAnnotationInfo>;

/**
 * デコレーター記述子の型
 * PropertyDescriptorまたはパラメータインデックス
 */
export type DecoratorDescriptor = PropertyDescriptor | number | undefined;

/**
 * デコレーター関数の戻り値型
 */
export interface DecoratorFunction {
  (target: DecoratorTarget, propertyKey?: PropertyKey, descriptor?: DecoratorDescriptor): void;
}

/**
 * 複合デコレーター型（プロパティ、パラメータ、メソッドに適用可能）
 */
export type CompositeDecorator = PropertyDecorator & ParameterDecorator & MethodDecorator;

/**
 * メソッドデコレーター拡張型
 */
export interface ExtendedMethodDecorator {
  (target: DecoratorTarget, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor | void;
}

/**
 * 汚染検証エラー
 */
export interface TaintValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * デコレーターメタデータストレージ
 */
export interface MetadataStorage {
  taint: Map<PropertyKey, TaintMetadata>;
  polyTaint: Map<PropertyKey, PolyTaintMetadata>;
  suppress: Map<PropertyKey, SuppressTaintMetadata>;
  parameters: Map<PropertyKey, ParameterTaintMetadata>;
}

/**
 * 汚染分析結果
 */
export interface TaintAnalysisResult {
  taintedProperties: string[];
  untaintedProperties: string[];
  polyTaintMethods: string[];
  suppressedMethods: string[];
  errors: TaintValidationError[];
}

/**
 * メタデータコレクター用の型
 */
export interface MetadataCollector {
  getTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): TaintMetadata | undefined;
  getParameterTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): ParameterTaintMetadata;
  getPolyTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): PolyTaintMetadata | undefined;
  getSuppressMetadata(target: DecoratorTarget, propertyKey: PropertyKey): SuppressTaintMetadata | undefined;
  collectClassAnnotations(target: DecoratorTarget): ClassAnnotationMap;
  validateAnnotations(target: DecoratorTarget): string[];
}

/**
 * メソッド引数の型（可変長引数対応）
 */
export type MethodArguments = unknown[];

/**
 * デコレーター適用コンテキスト
 */
export interface DecoratorContext {
  target: DecoratorTarget;
  propertyKey?: PropertyKey;
  descriptor?: DecoratorDescriptor;
  parameterIndex?: number;
}

/**
 * 型ガード関数
 */
export function isTaintMetadata(value: unknown): value is TaintMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'level' in value &&
    'timestamp' in value
  );
}

export function isPolyTaintMetadata(value: unknown): value is PolyTaintMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'polymorphic' in value &&
    'timestamp' in value
  );
}

export function isSuppressTaintMetadata(value: unknown): value is SuppressTaintMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'suppressed' in value &&
    'reason' in value &&
    'timestamp' in value
  );
}

export function isPropertyDescriptor(value: unknown): value is PropertyDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('value' in value || 'get' in value || 'set' in value)
  );
}