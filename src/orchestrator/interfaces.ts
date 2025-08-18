/**
 * 統合セキュリティ分析オーケストレータのインターフェース定義
 * SOLID原則の適用：依存関係逆転の原則（DIP）
 */

import {
  TaintAnalysisResult,
  IntentAnalysisResult,
  GapAnalysisResult,
  NistEvaluationResult
} from './types';

/**
 * TaintTyper分析戦略インターフェース
 * Strategy Patternによる分析手法の抽象化
 */
export interface ITaintAnalysisStrategy {
  analyze(targetPath: string): Promise<TaintAnalysisResult>;
}

/**
 * 意図抽出戦略インターフェース
 */
export interface IIntentExtractionStrategy {
  extract(targetPath: string, taintResult: TaintAnalysisResult): Promise<IntentAnalysisResult>;
}

/**
 * ギャップ検出戦略インターフェース
 */
export interface IGapDetectionStrategy {
  detect(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): Promise<GapAnalysisResult>;
}

/**
 * NIST評価戦略インターフェース
 */
export interface INistEvaluationStrategy {
  evaluate(gapResult: GapAnalysisResult): Promise<NistEvaluationResult>;
}

/**
 * 分析戦略ファクトリーインターフェース
 * Factory Patternによる戦略の生成管理
 */
/**
 * 分析戦略の組み合わせ
 */
export interface AnalysisStrategies {
  taintStrategy: ITaintAnalysisStrategy;
  intentStrategy: IIntentExtractionStrategy;
  gapStrategy: IGapDetectionStrategy;
  nistStrategy: INistEvaluationStrategy;
}

export interface IAnalysisStrategyFactory {
  createTaintAnalysisStrategy(): ITaintAnalysisStrategy;
  createIntentExtractionStrategy(): IIntentExtractionStrategy;
  createGapDetectionStrategy(): IGapDetectionStrategy;
  createNistEvaluationStrategy(): INistEvaluationStrategy;
  createAllStrategies(): AnalysisStrategies;
}

/**
 * バリデーターインターフェース
 * 単一責任の原則（SRP）による責務の分離
 */
export interface IInputValidator {
  validatePath(path: string): void;
  validateConfig(config: unknown): void;
}