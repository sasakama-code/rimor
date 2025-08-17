/**
 * 統一されたセキュリティ分析型定義
 * 
 * SOLID原則とDefensive Programmingのバランスを取った設計
 * Taint分析、セキュリティ違反検出、改善提案を統合
 */

/**
 * Taintフローの基本構造
 * KISS原則: 必要最小限のフィールドで表現
 */
export interface TaintFlow {
  /** フローの一意識別子 */
  id: string;
  /** 汚染の発生源 */
  source: string;
  /** 汚染の到達先 */
  sink: string;
  /** フローの経路 */
  path: string[];
  /** 深刻度 */
  severity: TaintSeverity;
  /** 追加情報（オプション） */
  metadata?: Record<string, unknown>;
}

/**
 * Taintの深刻度レベル
 */
export type TaintSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Taint分析のサマリー情報
 */
export interface TaintSummary {
  /** 検出されたフローの総数 */
  totalFlows: number;
  /** 深刻度別のフロー数 */
  criticalFlows: number;
  highRiskFlows: number;
  mediumRiskFlows: number;
  lowRiskFlows: number;
  /** 分析のカバレッジ（オプション） */
  coverage?: number;
  /** 誤検知率（オプション） */
  falsePositiveRate?: number;
}

/**
 * セキュリティ違反の定義
 * ISP（インターフェース分離原則）: 必要な情報のみを含む
 */
export interface SecurityViolation {
  /** 違反の種類 */
  type: ViolationType;
  /** 深刻度 */
  severity: TaintSeverity;
  /** 発生源 */
  source: string;
  /** 影響先 */
  sink: string;
  /** 違反の説明 */
  description: string;
  /** 発生場所（オプション） */
  location?: {
    file: string;
    line: number;
    column?: number;
  };
  /** 修正提案（オプション） */
  fix?: string;
}

/**
 * セキュリティ違反の種類
 */
export type ViolationType = 
  | 'TAINT_FLOW'
  | 'ACCESS_CONTROL'
  | 'INJECTION'
  | 'XSS'
  | 'CSRF'
  | 'SENSITIVE_DATA_EXPOSURE'
  | 'SECURITY_MISCONFIGURATION'
  | 'BROKEN_AUTHENTICATION';

/**
 * セキュリティ改善提案
 */
export interface SecurityImprovement {
  /** 改善カテゴリ */
  category: ImprovementCategory;
  /** 優先度 */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** 改善内容の説明 */
  description: string;
  /** 実装工数の見積もり */
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  /** セキュリティへの影響度 */
  impact: TaintSeverity;
  /** 実装例（オプション） */
  example?: string;
}

/**
 * 改善提案のカテゴリ
 */
export type ImprovementCategory = 
  | 'INPUT_VALIDATION'
  | 'OUTPUT_ENCODING'
  | 'ACCESS_CONTROL'
  | 'CRYPTO'
  | 'ERROR_HANDLING'
  | 'LOGGING'
  | 'CONFIGURATION';

/**
 * Taint分析の基本結果
 * SRP（単一責任原則）: Taint分析の核心機能のみ
 */
export interface BaseTaintAnalysisResult {
  /** 検出されたTaintフロー */
  flows: TaintFlow[];
  /** 分析サマリー */
  summary: TaintSummary;
  /** 推奨事項 */
  recommendations: string[];
}

/**
 * アノテーション情報を含むTaint分析結果
 */
export interface TaintAnalysisWithAnnotations {
  /** アノテーション情報 */
  annotations?: {
    /** 汚染されたプロパティ */
    taintedProperties: string[];
    /** 安全なプロパティ */
    untaintedProperties: string[];
    /** PolyTaintメソッド */
    polyTaintMethods: string[];
    /** 抑制されたメソッド */
    suppressedMethods: string[];
    /** アノテーションエラー */
    errors?: Array<{
      type: string;
      message: string;
      location?: string;
    }>;
  };
}

/**
 * セキュリティ違反を含むTaint分析結果
 */
export interface TaintAnalysisWithViolations {
  /** セキュリティ違反のリスト */
  violations: SecurityViolation[];
  /** 違反パス */
  taintPaths?: Array<{
    from: string;
    to: string;
    through: string[];
  }>;
}

/**
 * 改善提案を含むTaint分析結果
 */
export interface TaintAnalysisWithImprovements {
  /** セキュリティ改善提案 */
  improvements: SecurityImprovement[];
}

/**
 * メトリクスを含むTaint分析結果
 */
export interface TaintAnalysisWithMetrics {
  /** 分析メトリクス */
  metrics: {
    /** 分析時間（ミリ秒） */
    analysisTime: number;
    /** 分析されたファイル数 */
    filesAnalyzed: number;
    /** 分析されたメソッド数 */
    methodsAnalyzed: number;
    /** カバレッジ（パーセント） */
    coverage: number;
    /** 誤検知率（パーセント） */
    falsePositiveRate?: number;
    /** メモリ使用量（MB） */
    memoryUsage?: number;
  };
}

/**
 * 統一されたTaint分析結果型
 * DRY原則: 既存のインターフェースを組み合わせて定義
 */
export interface TaintAnalysisResult extends
  BaseTaintAnalysisResult,
  TaintAnalysisWithAnnotations,
  TaintAnalysisWithViolations,
  TaintAnalysisWithImprovements,
  TaintAnalysisWithMetrics {
  /** 分析のメタデータ（オプション） */
  metadata?: {
    /** 分析エンジンのバージョン */
    engineVersion?: string;
    /** 分析日時 */
    timestamp?: string;
    /** 分析設定 */
    configuration?: Record<string, any>;
  };
}

/**
 * 型ガード: TaintAnalysisResultかどうかを判定
 * Defensive Programming: 実行時の型安全性を確保
 */
export function isTaintAnalysisResult(obj: unknown): obj is TaintAnalysisResult {
  return obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.flows) &&
    obj.summary &&
    typeof obj.summary === 'object' &&
    typeof obj.summary.totalFlows === 'number' &&
    Array.isArray(obj.recommendations);
}

/**
 * 型ガード: セキュリティ違反を含むかどうかを判定
 */
export function hasSecurityViolations(obj: unknown): obj is TaintAnalysisWithViolations {
  return obj &&
    obj.violations &&
    Array.isArray(obj.violations) &&
    obj.violations.every((v) => 
      v.type && v.severity && v.source && v.sink && v.description
    );
}

/**
 * 型ガード: アノテーションを含むかどうかを判定
 */
export function hasAnnotations(obj: unknown): obj is TaintAnalysisWithAnnotations {
  return obj &&
    obj.annotations &&
    typeof obj.annotations === 'object' &&
    Array.isArray(obj.annotations.taintedProperties) &&
    Array.isArray(obj.annotations.untaintedProperties);
}

/**
 * ファクトリ関数: 基本的なTaintAnalysisResultを作成
 * YAGNI原則: 現時点で必要な最小限の実装
 */
export function createTaintAnalysisResult(
  flows: TaintFlow[] = [],
  recommendations: string[] = []
): TaintAnalysisResult {
  const summary: TaintSummary = {
    totalFlows: flows.length,
    criticalFlows: flows.filter(f => f.severity === 'CRITICAL').length,
    highRiskFlows: flows.filter(f => f.severity === 'HIGH').length,
    mediumRiskFlows: flows.filter(f => f.severity === 'MEDIUM').length,
    lowRiskFlows: flows.filter(f => f.severity === 'LOW').length
  };

  return {
    flows,
    summary,
    recommendations,
    violations: [],
    improvements: [],
    metrics: {
      analysisTime: 0,
      filesAnalyzed: 0,
      methodsAnalyzed: 0,
      coverage: 0
    }
  };
}

/**
 * ヘルパー関数: 複数のTaint分析結果をマージ
 */
export function mergeTaintAnalysisResults(results: TaintAnalysisResult[]): TaintAnalysisResult {
  if (results.length === 0) {
    return createTaintAnalysisResult();
  }

  const mergedFlows = results.flatMap(r => r.flows);
  const mergedRecommendations = [...new Set(results.flatMap(r => r.recommendations))];
  const mergedViolations = results.flatMap(r => r.violations || []);
  const mergedImprovements = results.flatMap(r => r.improvements || []);

  const result = createTaintAnalysisResult(mergedFlows, mergedRecommendations);
  
  if (mergedViolations.length > 0) {
    result.violations = mergedViolations;
  }
  
  if (mergedImprovements.length > 0) {
    result.improvements = mergedImprovements;
  }

  // アノテーションのマージ
  const allAnnotations = results.filter(r => r.annotations).map(r => r.annotations!);
  if (allAnnotations.length > 0) {
    result.annotations = {
      taintedProperties: [...new Set(allAnnotations.flatMap(a => a.taintedProperties))],
      untaintedProperties: [...new Set(allAnnotations.flatMap(a => a.untaintedProperties))],
      polyTaintMethods: [...new Set(allAnnotations.flatMap(a => a.polyTaintMethods))],
      suppressedMethods: [...new Set(allAnnotations.flatMap(a => a.suppressedMethods))]
    };
  }

  return result;
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated これらのエイリアスは将来のバージョンで削除予定
 */
export type SecurityTaintResult = TaintAnalysisResult;
export type AnnotationTaintResult = TaintAnalysisWithAnnotations;
export type FlowTaintResult = BaseTaintAnalysisResult;
export type TaintResult = TaintAnalysisResult;