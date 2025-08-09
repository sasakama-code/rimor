/**
 * Checker Framework互換層の型定義
 */

import { TaintedType, UntaintedType } from '../types/checker-framework-types';

/**
 * メソッドシグネチャの型
 */
export interface MethodSignature {
  className: string;
  methodName: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
}

/**
 * パラメータ情報の型
 */
export interface ParameterInfo {
  name?: string;
  type: string;
  annotation?: string;
  index: number;
}

/**
 * クラス情報の型
 */
export interface ClassInfo {
  name: string;
  package?: string;
  methods: MethodInfo[];
  fields?: FieldInfo[];
  annotations?: string[];
}

/**
 * メソッド情報の型
 */
export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}

/**
 * フィールド情報の型
 */
export interface FieldInfo {
  name: string;
  type: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}

/**
 * 移行計画の型
 */
export interface MigrationPlan {
  phases: MigrationPhase[];
  totalFiles: number;
  estimatedHours: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * 移行フェーズの型
 */
export interface MigrationPhase {
  name: string;
  description: string;
  files: string[];
  order: number;
  dependencies?: string[];
}

/**
 * ライブラリ設定の型
 */
export interface LibraryConfig {
  name: string;
  version: string;
  includePaths?: string[];
  excludePaths?: string[];
  customAnnotations?: Record<string, string>;
}

/**
 * メソッド呼び出しチェック結果の型
 */
export interface MethodCallCheckResult {
  safe: boolean;
  violations?: string[];
  warnings?: string[];
  suggestedFixes?: string[];
}

/**
 * ポリモーフィックメソッドのインスタンス化結果
 */
export interface PolyTaintInstantiationResult {
  qualifier: string;
  confidence: number;
  reason: string;
}

/**
 * Checker Framework型変換用のユニオン型
 */
export type QualifiedValue<T = unknown> = TaintedType<T> | UntaintedType<T>;

/**
 * アノテーテッドタイプファクトリーの型
 */
export interface AnnotatedTypeFactory {
  getAnnotatedType(tree: unknown): AnnotatedType;
  createType(baseType: string, annotations: string[]): AnnotatedType;
}

/**
 * アノテーテッドタイプの型
 */
export interface AnnotatedType {
  baseType: string;
  annotations: string[];
  isSubtypeOf(other: AnnotatedType): boolean;
}

/**
 * Visitorパターンの型
 */
export interface CheckerVisitor {
  visitMethodInvocation(node: unknown): void;
  visitAssignment(node: unknown): void;
  visitReturn(node: unknown): void;
}