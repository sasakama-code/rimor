/**
 * Dependency Injection トークン定義
 * v0.9.0 - Issue #141対応: TaintTyper統合に伴うDI定義更新
 */

const TYPES = {
  // オーケストレータ関連 (Issue #141対応: 新規追加)
  UnifiedSecurityAnalysisOrchestrator: Symbol.for('UnifiedSecurityAnalysisOrchestrator'),
  AnalysisStrategyFactory: Symbol.for('AnalysisStrategyFactory'),

  // 分析戦略 (Issue #141対応: TaintTyper統合)
  TaintAnalysisStrategy: Symbol.for('TaintAnalysisStrategy'),
  IntentExtractionStrategy: Symbol.for('IntentExtractionStrategy'),
  GapDetectionStrategy: Symbol.for('GapDetectionStrategy'),
  NistEvaluationStrategy: Symbol.for('NistEvaluationStrategy'),

  // CLIコマンド (Issue #141対応: 統合コマンド)
  UnifiedAnalyzeCommand: Symbol.for('UnifiedAnalyzeCommand'),

  // 品質統合 (Issue #141対応: テスト品質統合)
  TestQualityIntegrator: Symbol.for('TestQualityIntegrator'),

  // Core Services (既存・互換性のため保持)
  AnalysisEngine: Symbol.for('AnalysisEngine'),
  UnifiedAnalysisEngine: Symbol.for('UnifiedAnalysisEngine'),
  SecurityAuditor: Symbol.for('SecurityAuditor'),
  Reporter: Symbol.for('Reporter'),
  PluginManager: Symbol.for('PluginManager'),
  UnifiedPluginManager: Symbol.for('UnifiedPluginManager'),
} as const;

export { TYPES };
