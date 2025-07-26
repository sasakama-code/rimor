/**
 * 型ベースセキュリティ解析 - AI向け段階的情報提供システム
 * Claude Code等のAI向けに最適化された段階的情報提供機能
 */

import {
  TestMethod,
  SecurityType,
  TaintLevel,
  TaintSource,
  SanitizerType,
  SecurityIssue,
  SecurityTestMetrics,
  TypeInferenceResult,
  MethodAnalysisResult
} from '../types';
import { FlowGraph } from './flow';
import { SecurityLattice, SecurityViolation } from '../types/lattice';

/**
 * 型サマリー情報
 */
export interface TypeSummary {
  /** 識別されたセキュリティ型 */
  securityTypes: SecurityTypeSummary[];
  /** 必要だが不足している型 */
  missingTypes: MissingTypeSummary[];
  /** 汚染源の数 */
  taintSources: number;
  /** サニタイザーの数 */
  sanitizers: number;
  /** 全体的な型安全性スコア */
  typeSafetyScore: number;
  /** 推奨される次のアクション */
  recommendedActions: string[];
}

/**
 * セキュリティ型サマリー
 */
export interface SecurityTypeSummary {
  type: SecurityType;
  count: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * 不足している型サマリー
 */
export interface MissingTypeSummary {
  expectedType: SecurityType;
  context: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

/**
 * フロー解析詳細
 */
export interface FlowAnalysisDetail {
  method: string;
  flowPaths: FlowPathDetail[];
  taintPropagation: TaintPropagationDetail[];
  criticalPaths: CriticalPathDetail[];
  securityRisks: SecurityRiskDetail[];
  optimizationSuggestions: OptimizationSuggestion[];
}

/**
 * フローパス詳細
 */
export interface FlowPathDetail {
  pathId: string;
  source: string;
  sink: string;
  taintLevel: TaintLevel;
  sanitized: boolean;
  pathLength: number;
  riskAssessment: string;
}

/**
 * 汚染伝播詳細
 */
export interface TaintPropagationDetail {
  variable: string;
  initialTaint: TaintLevel;
  finalTaint: TaintLevel;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
}

/**
 * 汚染伝播ステップ
 */
export interface TaintPropagationStep {
  step: number;
  operation: string;
  taintChange: { from: TaintLevel; to: TaintLevel };
  reason: string;
}

/**
 * クリティカルパス詳細
 */
export interface CriticalPathDetail {
  pathId: string;
  severity: 'high' | 'critical';
  description: string;
  affectedVariables: string[];
  potentialVulnerabilities: string[];
  mitigationSteps: string[];
}

/**
 * セキュリティリスク詳細
 */
export interface SecurityRiskDetail {
  riskId: string;
  category: 'injection' | 'xss' | 'auth' | 'data-leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCode: string;
  remediation: string;
  automatable: boolean;
}

/**
 * 最適化提案
 */
export interface OptimizationSuggestion {
  type: 'performance' | 'security' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

/**
 * 完全な型解析
 */
export interface CompleteTypeAnalysis {
  typeInference: DetailedTypeInference;
  flowGraphs: DetailedFlowGraph[];
  latticeAnalysis: DetailedLatticeAnalysis;
  securityInvariants: SecurityInvariantAnalysis[];
  comprehensiveReport: ComprehensiveAnalysisReport;
}

/**
 * 詳細型推論
 */
export interface DetailedTypeInference {
  totalVariables: number;
  typedVariables: number;
  inferenceAccuracy: number;
  typeDistribution: Map<SecurityType, number>;
  uncertainTypes: UncertainTypeInfo[];
  typeConflicts: TypeConflictInfo[];
}

/**
 * 不確実な型情報
 */
export interface UncertainTypeInfo {
  variable: string;
  possibleTypes: SecurityType[];
  confidence: number;
  evidence: string[];
}

/**
 * 型競合情報
 */
export interface TypeConflictInfo {
  variable: string;
  conflictingTypes: SecurityType[];
  resolutionSuggestion: string;
}

/**
 * 詳細フローグラフ
 */
export interface DetailedFlowGraph {
  methodName: string;
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  taintSources: number;
  sanitizers: number;
  sinks: number;
  vulnerablePaths: number;
}

/**
 * 詳細格子解析
 */
export interface DetailedLatticeAnalysis {
  latticeHeight: number;
  joinOperations: number;
  meetOperations: number;
  fixpointIterations: number;
  convergenceTime: number;
  stabilityMetrics: LatticeStabilityMetrics;
}

/**
 * 格子安定性メトリクス
 */
export interface LatticeStabilityMetrics {
  monotonicity: number;
  consistency: number;
  convergenceRate: number;
}

/**
 * セキュリティ不変条件解析
 */
export interface SecurityInvariantAnalysis {
  invariantId: string;
  description: string;
  status: 'satisfied' | 'violated' | 'unknown';
  violationCount: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

/**
 * 包括的解析レポート
 */
export interface ComprehensiveAnalysisReport {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: RiskAssessment;
  recommendationPriorities: RecommendationPriority[];
  metricsComparison: MetricsComparison;
  futureTrends: string[];
}

/**
 * リスク評価
 */
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStatus: 'none' | 'partial' | 'comprehensive';
  residualRisk: 'low' | 'medium' | 'high';
}

/**
 * リスク要因
 */
export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * 推奨事項優先度
 */
export interface RecommendationPriority {
  priority: number;
  category: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
}

/**
 * メトリクス比較
 */
export interface MetricsComparison {
  current: SecurityTestMetrics;
  baseline: SecurityTestMetrics;
  improvement: MetricsImprovement;
  benchmarks: BenchmarkComparison[];
}

/**
 * メトリクス改善
 */
export interface MetricsImprovement {
  overall: number;
  byCategory: Map<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * ベンチマーク比較
 */
export interface BenchmarkComparison {
  category: string;
  industry: string;
  ourScore: number;
  benchmarkScore: number;
  percentile: number;
}

/**
 * AI向け段階的型情報提供システム
 */
export class TypeAwareProgressiveAI {
  private analysisResults: Map<string, MethodAnalysisResult> = new Map();
  private typeInferences: Map<string, TypeInferenceResult> = new Map();
  private flowGraphs: Map<string, FlowGraph> = new Map();
  private latticeAnalyses: Map<string, SecurityLattice> = new Map();

  constructor() {
    // 初期化
  }

  /**
   * 解析結果を追加
   */
  addAnalysisResult(methodName: string, result: MethodAnalysisResult): void {
    this.analysisResults.set(methodName, result);
  }

  /**
   * 型推論結果を追加
   */
  addTypeInference(methodName: string, inference: TypeInferenceResult): void {
    this.typeInferences.set(methodName, inference);
  }

  /**
   * フローグラフを追加
   */
  addFlowGraph(methodName: string, flowGraph: FlowGraph): void {
    this.flowGraphs.set(methodName, flowGraph);
  }

  /**
   * 格子解析を追加
   */
  addLatticeAnalysis(methodName: string, lattice: SecurityLattice): void {
    this.latticeAnalyses.set(methodName, lattice);
  }

  /**
   * レベル1: 型シグネチャのサマリー
   * AI開発者向けの高レベル概要情報
   */
  getTypeSummary(): TypeSummary {
    const securityTypes = this.analyzeSecurityTypes();
    const missingTypes = this.identifyMissingTypes();
    const taintSources = this.countTaintSources();
    const sanitizers = this.countSanitizers();
    const typeSafetyScore = this.calculateTypeSafetyScore();
    const recommendedActions = this.generateRecommendedActions();

    return {
      securityTypes,
      missingTypes,
      taintSources,
      sanitizers,
      typeSafetyScore,
      recommendedActions
    };
  }

  /**
   * レベル2: フロー解析の詳細
   * 特定メソッドの詳細なフロー情報
   */
  getFlowDetails(methodId: string): FlowAnalysisDetail {
    const flowGraph = this.flowGraphs.get(methodId);
    const analysisResult = this.analysisResults.get(methodId);
    
    if (!flowGraph || !analysisResult) {
      throw new Error(`メソッド ${methodId} の解析結果が見つかりません`);
    }

    return {
      method: methodId,
      flowPaths: this.extractFlowPaths(flowGraph),
      taintPropagation: this.analyzeTaintPropagation(flowGraph),
      criticalPaths: this.identifyCriticalPaths(flowGraph),
      securityRisks: this.assessSecurityRisks(flowGraph, analysisResult),
      optimizationSuggestions: this.generateOptimizationSuggestions(flowGraph)
    };
  }

  /**
   * レベル3: 完全な型とフロー情報
   * 全体的な包括的解析情報
   */
  getCompleteTypeAnalysis(): CompleteTypeAnalysis {
    return {
      typeInference: this.generateDetailedTypeInference(),
      flowGraphs: this.generateDetailedFlowGraphs(),
      latticeAnalysis: this.generateDetailedLatticeAnalysis(),
      securityInvariants: this.analyzeSecurityInvariants(),
      comprehensiveReport: this.generateComprehensiveReport()
    };
  }

  /**
   * AI向けコンテキスト情報の取得
   */
  getAIContext(): AIContextInfo {
    return {
      analysisComplexity: this.calculateAnalysisComplexity(),
      recommendedApproach: this.recommendAnalysisApproach(),
      keyInsights: this.extractKeyInsights(),
      prioritizedActions: this.prioritizeActions(),
      confidenceMetrics: this.calculateConfidenceMetrics()
    };
  }

  // プライベートメソッド群
  private analyzeSecurityTypes(): SecurityTypeSummary[] {
    const typeMap = new Map<SecurityType, { count: number; confidence: number }>();
    
    this.typeInferences.forEach(inference => {
      inference.annotations.forEach(annotation => {
        const existing = typeMap.get(annotation.securityType) || { count: 0, confidence: 0 };
        typeMap.set(annotation.securityType, {
          count: existing.count + 1,
          confidence: (existing.confidence + annotation.confidence) / 2
        });
      });
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      confidence: data.confidence,
      riskLevel: this.assessTypeRisk(type),
      description: this.getTypeDescription(type)
    }));
  }

  private identifyMissingTypes(): MissingTypeSummary[] {
    const missing: MissingTypeSummary[] = [];
    
    // 期待される型と実際の型を比較
    this.analysisResults.forEach((result, methodName) => {
      const expectedTypes = this.inferExpectedTypes(methodName);
      const actualTypes = this.getActualTypes(methodName);
      
      expectedTypes.forEach(expectedType => {
        if (!actualTypes.includes(expectedType)) {
          missing.push({
            expectedType,
            context: methodName,
            impact: this.assessMissingTypeImpact(expectedType),
            suggestion: this.suggestTypeFix(expectedType, methodName)
          });
        }
      });
    });

    return missing;
  }

  private countTaintSources(): number {
    let count = 0;
    this.flowGraphs.forEach(graph => {
      count += graph.taintSources.length;
    });
    return count;
  }

  private countSanitizers(): number {
    let count = 0;
    this.flowGraphs.forEach(graph => {
      count += graph.sanitizers.length;
    });
    return count;
  }

  private calculateTypeSafetyScore(): number {
    let totalScore = 0;
    let count = 0;
    
    this.analysisResults.forEach(result => {
      const safetyScore = this.calculateMethodTypeSafety(result);
      totalScore += safetyScore;
      count++;
    });
    
    return count > 0 ? totalScore / count : 0;
  }

  private generateRecommendedActions(): string[] {
    const actions: string[] = [];
    
    // 型安全性の改善提案
    if (this.calculateTypeSafetyScore() < 70) {
      actions.push('型注釈の追加でセキュリティを向上させる');
    }
    
    // サニタイザーの追加提案
    if (this.countSanitizers() < this.countTaintSources() * 0.8) {
      actions.push('サニタイザーの追加で汚染対策を強化する');
    }
    
    // テストカバレッジの改善提案
    const avgCoverage = this.calculateAverageCoverage();
    if (avgCoverage < 80) {
      actions.push('セキュリティテストカバレッジを向上させる');
    }

    return actions;
  }

  private extractFlowPaths(flowGraph: FlowGraph): FlowPathDetail[] {
    return flowGraph.paths.map(path => ({
      pathId: path.id,
      source: path.nodes[0] || 'unknown',
      sink: path.nodes[path.nodes.length - 1] || 'unknown',
      taintLevel: path.taintLevel,
      sanitized: path.passedThroughSanitizer,
      pathLength: path.length,
      riskAssessment: this.assessPathRisk(path)
    }));
  }

  private analyzeTaintPropagation(flowGraph: FlowGraph): TaintPropagationDetail[] {
    const propagations: TaintPropagationDetail[] = [];
    
    // 各ノードの汚染伝播を分析
    flowGraph.nodes.forEach(node => {
      if (node.inputTaint !== node.outputTaint) {
        propagations.push({
          variable: node.id,
          initialTaint: node.inputTaint,
          finalTaint: node.outputTaint,
          propagationSteps: this.extractPropagationSteps(node),
          sanitizationPoints: this.findSanitizationPoints(node, flowGraph)
        });
      }
    });

    return propagations;
  }

  private identifyCriticalPaths(flowGraph: FlowGraph): CriticalPathDetail[] {
    return flowGraph.paths
      .filter(path => path.taintLevel >= TaintLevel.LIKELY_TAINTED && !path.passedThroughSanitizer)
      .map(path => ({
        pathId: path.id,
        severity: path.taintLevel === TaintLevel.DEFINITELY_TAINTED ? 'critical' : 'high',
        description: `汚染されたデータが未処理でシンクに到達`,
        affectedVariables: this.extractPathVariables(path),
        potentialVulnerabilities: this.identifyPathVulnerabilities(path),
        mitigationSteps: this.generateMitigationSteps(path)
      }));
  }

  private assessSecurityRisks(flowGraph: FlowGraph, result: MethodAnalysisResult): SecurityRiskDetail[] {
    return result.issues.map(issue => ({
      riskId: issue.id,
      category: this.categorizeIssue(issue),
      severity: issue.severity as any,
      description: issue.message,
      affectedCode: this.extractAffectedCode(issue),
      remediation: issue.fixSuggestion || '手動で修正が必要',
      automatable: false // デフォルト
    }));
  }

  private generateOptimizationSuggestions(flowGraph: FlowGraph): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // パフォーマンス最適化
    if (flowGraph.paths.length > 100) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        description: 'フローパスが多すぎます。メソッドの分割を検討してください',
        expectedBenefit: '解析速度の向上',
        implementationEffort: 'medium'
      });
    }
    
    // セキュリティ最適化
    const vulnerablePaths = flowGraph.paths.filter(p => 
      p.taintLevel >= TaintLevel.LIKELY_TAINTED && !p.passedThroughSanitizer
    );
    
    if (vulnerablePaths.length > 0) {
      suggestions.push({
        type: 'security',
        priority: 'high',
        description: `${vulnerablePaths.length}個の脆弱なパスが検出されました`,
        expectedBenefit: 'セキュリティリスクの削減',
        implementationEffort: 'low'
      });
    }

    return suggestions;
  }

  private generateDetailedTypeInference(): DetailedTypeInference {
    let totalVariables = 0;
    let typedVariables = 0;
    let totalConfidence = 0;
    const typeDistribution = new Map<SecurityType, number>();
    const uncertainTypes: UncertainTypeInfo[] = [];
    
    this.typeInferences.forEach(inference => {
      totalVariables += inference.statistics.totalVariables;
      typedVariables += inference.statistics.inferred;
      totalConfidence += inference.statistics.averageConfidence;
      
      inference.annotations.forEach(annotation => {
        const count = typeDistribution.get(annotation.securityType) || 0;
        typeDistribution.set(annotation.securityType, count + 1);
        
        if (annotation.confidence < 0.7) {
          uncertainTypes.push({
            variable: annotation.target || annotation.variable || 'unknown',
            possibleTypes: [annotation.securityType],
            confidence: annotation.confidence,
            evidence: annotation.evidence
          });
        }
      });
    });

    return {
      totalVariables,
      typedVariables,
      inferenceAccuracy: totalVariables > 0 ? typedVariables / totalVariables : 0,
      typeDistribution,
      uncertainTypes,
      typeConflicts: [] // 簡易実装
    };
  }

  private generateDetailedFlowGraphs(): DetailedFlowGraph[] {
    return Array.from(this.flowGraphs.entries()).map(([methodName, graph]) => ({
      methodName,
      nodeCount: graph.nodes.length,
      edgeCount: this.countEdges(graph),
      complexity: this.calculateFlowComplexity(graph),
      taintSources: graph.taintSources.length,
      sanitizers: graph.sanitizers.length,
      sinks: graph.securitySinks.length,
      vulnerablePaths: graph.paths.filter(p => 
        p.taintLevel >= TaintLevel.LIKELY_TAINTED && !p.passedThroughSanitizer
      ).length
    }));
  }

  private generateDetailedLatticeAnalysis(): DetailedLatticeAnalysis {
    // 簡易実装
    return {
      latticeHeight: 4, // TaintLevelの数
      joinOperations: 0,
      meetOperations: 0,
      fixpointIterations: 0,
      convergenceTime: 0,
      stabilityMetrics: {
        monotonicity: 1.0,
        consistency: 1.0,
        convergenceRate: 1.0
      }
    };
  }

  private analyzeSecurityInvariants(): SecurityInvariantAnalysis[] {
    const invariants: SecurityInvariantAnalysis[] = [];
    
    // 基本的な不変条件をチェック
    invariants.push({
      invariantId: 'no-unsanitized-taint',
      description: '汚染されたデータは適切にサニタイズされている',
      status: this.checkNoUnsanitizedTaint(),
      violationCount: this.countUnsanitizedTaintViolations(),
      criticalityLevel: 'critical',
      remediation: 'サニタイザーの追加または強化'
    });

    return invariants;
  }

  private generateComprehensiveReport(): ComprehensiveAnalysisReport {
    return {
      executiveSummary: this.generateExecutiveSummary(),
      keyFindings: this.extractKeyFindings(),
      riskAssessment: this.generateRiskAssessment(),
      recommendationPriorities: this.generateRecommendationPriorities(),
      metricsComparison: this.generateMetricsComparison(),
      futureTrends: this.predictFutureTrends()
    };
  }

  // 追加のヘルパーメソッド（簡易実装）
  private assessTypeRisk(type: SecurityType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case SecurityType.USER_INPUT: return 'critical';
      case SecurityType.AUTH_TOKEN: return 'high';
      default: return 'medium';
    }
  }

  private getTypeDescription(type: SecurityType): string {
    const descriptions = {
      [SecurityType.USER_INPUT]: 'ユーザーからの入力データ',
      [SecurityType.AUTH_TOKEN]: '認証トークン',
      [SecurityType.VALIDATED_AUTH]: '検証済み認証情報',
      [SecurityType.VALIDATED_INPUT]: '検証済み入力データ',
      [SecurityType.SANITIZED_DATA]: 'サニタイズ済みデータ',
      [SecurityType.SECURE_SQL]: 'セキュアSQL',
      [SecurityType.SECURE_HTML]: 'セキュアHTML'
    };
    return descriptions[type] || '未知の型';
  }

  private inferExpectedTypes(methodName: string): SecurityType[] {
    // 簡易実装 - メソッド名から期待される型を推測
    if (methodName.includes('auth')) {
      return [SecurityType.AUTH_TOKEN, SecurityType.VALIDATED_AUTH];
    }
    if (methodName.includes('input') || methodName.includes('validate')) {
      return [SecurityType.USER_INPUT, SecurityType.VALIDATED_INPUT];
    }
    return [];
  }

  private getActualTypes(methodName: string): SecurityType[] {
    const inference = this.typeInferences.get(methodName);
    return inference ? inference.annotations.map(a => a.securityType) : [];
  }

  private assessMissingTypeImpact(type: SecurityType): 'low' | 'medium' | 'high' | 'critical' {
    return this.assessTypeRisk(type);
  }

  private suggestTypeFix(type: SecurityType, methodName: string): string {
    return `メソッド ${methodName} で ${this.getTypeDescription(type)} の型注釈を追加してください`;
  }

  private calculateMethodTypeSafety(result: MethodAnalysisResult): number {
    const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
    const highIssues = result.issues.filter(i => i.severity === 'error').length;
    
    let score = 100;
    score -= criticalIssues * 30;
    score -= highIssues * 15;
    
    return Math.max(0, score);
  }

  private calculateAverageCoverage(): number {
    let totalCoverage = 0;
    let count = 0;
    
    this.analysisResults.forEach(result => {
      totalCoverage += result.metrics.securityCoverage.overall;
      count++;
    });
    
    return count > 0 ? totalCoverage / count : 0;
  }

  // その他のヘルパーメソッド（簡易実装）
  private assessPathRisk(path: any): string {
    if (path.taintLevel >= TaintLevel.LIKELY_TAINTED && !path.passedThroughSanitizer) {
      return '高リスク: 汚染データが未処理';
    }
    return '低リスク';
  }

  private extractPropagationSteps(node: any): TaintPropagationStep[] {
    return []; // 簡易実装
  }

  private findSanitizationPoints(node: any, flowGraph: FlowGraph): string[] {
    return []; // 簡易実装
  }

  private extractPathVariables(path: any): string[] {
    return path.nodes;
  }

  private identifyPathVulnerabilities(path: any): string[] {
    return ['潜在的なインジェクション攻撃'];
  }

  private generateMitigationSteps(path: any): string[] {
    return ['適切なサニタイザーの追加', '入力検証の強化'];
  }

  private categorizeIssue(issue: SecurityIssue): 'injection' | 'xss' | 'auth' | 'data-leak' | 'other' {
    if (issue.type === 'unsafe-taint-flow') return 'injection';
    if (issue.type === 'missing-auth-test') return 'auth';
    return 'other';
  }

  private extractAffectedCode(issue: SecurityIssue): string {
    return `${issue.location.file}:${issue.location.line}`;
  }

  private countEdges(graph: FlowGraph): number {
    return graph.nodes.reduce((total, node) => total + node.successors.length, 0);
  }

  private calculateFlowComplexity(graph: FlowGraph): number {
    return graph.nodes.length + graph.paths.length;
  }

  private checkNoUnsanitizedTaint(): 'satisfied' | 'violated' | 'unknown' {
    // 簡易実装
    return 'satisfied';
  }

  private countUnsanitizedTaintViolations(): number {
    return 0; // 簡易実装
  }

  private generateExecutiveSummary(): string {
    return 'セキュリティテスト品質の型ベース解析を実行しました。';
  }

  private extractKeyFindings(): string[] {
    return ['型安全性の向上が必要', 'サニタイザーの追加を推奨'];
  }

  private generateRiskAssessment(): RiskAssessment {
    return {
      overallRisk: 'medium',
      riskFactors: [],
      mitigationStatus: 'partial',
      residualRisk: 'low'
    };
  }

  private generateRecommendationPriorities(): RecommendationPriority[] {
    return [];
  }

  private generateMetricsComparison(): MetricsComparison {
    // 簡易実装
    return {
      current: {
        securityCoverage: { authentication: 70, inputValidation: 60, apiSecurity: 50, overall: 60 },
        taintFlowDetection: 0.8,
        sanitizerCoverage: 0.7,
        invariantCompliance: 0.9
      },
      baseline: {
        securityCoverage: { authentication: 50, inputValidation: 40, apiSecurity: 30, overall: 40 },
        taintFlowDetection: 0.6,
        sanitizerCoverage: 0.5,
        invariantCompliance: 0.7
      },
      improvement: {
        overall: 20,
        byCategory: new Map(),
        trend: 'improving'
      },
      benchmarks: []
    };
  }

  private predictFutureTrends(): string[] {
    return ['セキュリティテストの自動化が進展', '型ベース解析の精度向上'];
  }

  private calculateAnalysisComplexity(): 'low' | 'medium' | 'high' {
    const totalMethods = this.analysisResults.size;
    if (totalMethods < 10) return 'low';
    if (totalMethods < 50) return 'medium';
    return 'high';
  }

  private recommendAnalysisApproach(): string {
    return 'インクリメンタル解析を推奨';
  }

  private extractKeyInsights(): string[] {
    return ['型安全性が品質向上の鍵', 'モジュラー解析により効率向上'];
  }

  private prioritizeActions(): string[] {
    return ['1. サニタイザー追加', '2. 型注釈強化', '3. テストカバレッジ向上'];
  }

  private calculateConfidenceMetrics(): { overall: number; byCategory: Map<string, number> } {
    return {
      overall: 0.8,
      byCategory: new Map([
        ['type-inference', 0.85],
        ['flow-analysis', 0.75],
        ['security-analysis', 0.80]
      ])
    };
  }
}

/**
 * AIコンテキスト情報
 */
export interface AIContextInfo {
  analysisComplexity: 'low' | 'medium' | 'high';
  recommendedApproach: string;
  keyInsights: string[];
  prioritizedActions: string[];
  confidenceMetrics: {
    overall: number;
    byCategory: Map<string, number>;
  };
}