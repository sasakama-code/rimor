/**
 * フロー解析関連の型定義
 * 後方互換性のために必要な型をエクスポート
 */

import {
  TaintLevel,
  TaintSource,
  SanitizerType,
  TestMethod,
  SecurityViolation
} from '../types';

// 汚染源情報
export interface TaintSourceInfo {
  id: string;
  name: string;
  type: TaintSource;
  location: { line: number; column: number };
  confidence: number;
  taintLevel?: 'high' | 'medium' | 'low';
}

// サニタイザー情報
export interface SanitizerInfo {
  id: string;
  type: SanitizerType;
  location: { line: number; column: number };
  effectiveness: number;
}

// セキュリティシンク情報
export interface SecuritySinkInfo {
  id: string;
  type: string;
  location: { line: number; column: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 解析オプション
export interface AnalysisOptions {
  interprocedural: boolean;
  contextSensitive: boolean;
  pathSensitive: boolean;
}

// 汚染伝播結果
export interface TaintPropagationResult {
  path: string[];
  taintLevel: TaintLevel;
  reachesExit: boolean;
}

// 汚染フロー解析結果
export interface TaintFlowAnalysisResult {
  sanitizers: Array<{ function: string; type: SanitizerType }>;
  finalTaintLevel: 'clean' | 'tainted';
  paths: number;
  violations: SecurityViolation[];
}

// 汚染違反
export interface TaintViolation {
  type: string;
  severity: string;
  source: string;
  sink: string;
  description: string;
}

// 到達可能性解析結果
export interface ReachabilityAnalysisResult {
  deadCode: Array<{ function: string }>;
  reachabilityScore: number;
  totalNodes: number;
  unreachableNodes: number;
}

// 循環検出結果
export interface CycleDetectionResult {
  functions: string[];
  severity: 'low' | 'medium' | 'high';
}

// 型フロー解析結果
export interface TypeFlowAnalysisResult {
  typeTransitions: TypeTransition[];
  finalType: string;
}

// 型遷移
export interface TypeTransition {
  from: string;
  to: string;
  location: { line: number; column: number };
}

// 型違反
export interface TypeViolation {
  type: string;
  from: string;
  to: string;
  severity: string;
  location: { line: number; column: number };
}