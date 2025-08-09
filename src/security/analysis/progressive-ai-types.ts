/**
 * Progressive AI分析の型定義
 */

import { TaintLevel } from '../types/taint';
import { FlowNode, FlowGraph } from '../types/flow-types';

/**
 * 汚染伝播ステップの型定義
 */
export interface TaintPropagationStep {
  from: string;
  to: string;
  operation: string;
  taintLevel: TaintLevel;
}

/**
 * フローパスの型定義
 */
export interface FlowPath {
  id?: string;
  nodes: string[];
  taintLevel?: TaintLevel;
  passedThroughSanitizer?: boolean;
  reachesSecuritySink?: boolean;
  confidence?: number;
  metadata?: {
    source?: string;
    sink?: string;
    variables?: string[];
    [key: string]: unknown;
  };
}

/**
 * 拡張フローノードの型
 */
export interface ExtendedFlowNode {
  id: string;
  type: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  successors?: string[];
  predecessors?: string[];
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * パス分析結果の型
 */
export interface PathAnalysisResult {
  riskLevel: string;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
  variables: string[];
  vulnerabilities: string[];
  mitigationSteps: string[];
}