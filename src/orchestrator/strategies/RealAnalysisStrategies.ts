/**
 * 実分析戦略の実装
 * 既存のコンポーネント（TaintAnalysisSystem、IntentPatternMatcher、GapDetector、NistRiskEvaluator）を統合
 * Strategy Pattern: Mock実装から実装への移行
 */

import { TaintAnalysisSystem } from '../../security/taint-analysis-system';
import { IntentPatternMatcher } from '../../intent-analysis/IntentPatternMatcher';
import { GapDetector } from '../../gap-analysis/GapDetector';
import { NistRiskEvaluator } from '../../nist/evaluators/NistRiskEvaluator';
import { KeywordSearchUtils } from '../../utils/KeywordSearchUtils';

import {
  IAnalysisStrategyFactory,
  ITaintAnalysisStrategy,
  IIntentExtractionStrategy,
  IGapDetectionStrategy,
  INistEvaluationStrategy,
  AnalysisStrategies
} from '../interfaces';

import {
  TaintAnalysisResult,
  IntentAnalysisResult,
  GapAnalysisResult,
  NistEvaluationResult,
  OrchestratorConfig
} from '../types';

/**
 * 実Taint分析戦略
 * Adapter Pattern: TaintAnalysisSystemを戦略インターフェースに適応
 */
export class RealTaintAnalysisStrategy implements ITaintAnalysisStrategy {
  private taintSystem: TaintAnalysisSystem;

  constructor(config?: any) {
    console.log('🔧 [RealTaintAnalysisStrategy] 初期化中...');
    
    // TaintAnalysisSystemの設定に基づいて初期化
    const taintConfig = {
      inference: {
        enableSearchBased: true,
        enableLocalOptimization: true,
        enableIncremental: true,
        maxSearchDepth: 10,
        confidenceThreshold: 0.8
      },
      library: {
        loadBuiltins: true,
        customLibraryPaths: [],
        unknownMethodBehavior: 'conservative' as const
      },
      compatibility: {
        exportJAIF: false,
        generateStubs: false,
        gradualMigration: true
      },
      // AST解析を明示的に有効化
      ast: {
        enableASTAnalysis: true,
        enableDataFlowTracking: true,
        enableScopeAnalysis: true,
        maxFlowDepth: 50,
        typescriptOnly: false  // JSファイルも対象にする
      }
    };

    console.log('🔧 [RealTaintAnalysisStrategy] TaintAnalysisSystem設定:', {
      enableASTAnalysis: taintConfig.ast.enableASTAnalysis,
      enableDataFlowTracking: taintConfig.ast.enableDataFlowTracking,
      typescriptOnly: taintConfig.ast.typescriptOnly
    });

    this.taintSystem = new TaintAnalysisSystem(taintConfig);
    console.log('✅ [RealTaintAnalysisStrategy] 初期化完了');
  }

  async analyze(targetPath: string, options?: { benchmarkMode?: boolean }): Promise<TaintAnalysisResult> {
    try {
      console.log(`🔍 [RealTaintAnalysisStrategy] 分析開始: ${targetPath}${options?.benchmarkMode ? ' (ベンチマークモード)' : ''}`);
      
      // TaintAnalysisSystemを使用した実際の汚染分析（ベンチマークモード対応）
      const analysisResult = await this.taintSystem.analyzeProject(targetPath, { benchmarkMode: options?.benchmarkMode });
      
      // TaintAnalysisSystemの結果をTaintAnalysisResult形式に変換
      return this.convertToTaintAnalysisResult(analysisResult);

    } catch (error) {
      throw new Error(`Taint分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getName(): string {
    return 'RealTaintAnalysisStrategy';
  }

  /**
   * TaintAnalysisSystemの結果を標準形式に変換
   * Adapter Pattern: 異なるインターフェース間の変換
   */
  private convertToTaintAnalysisResult(systemResult: any): TaintAnalysisResult {
    // TaintAnalysisSystemの結果構造を標準形式に変換
    const vulnerabilities = systemResult.detectedTaints?.map((taint: any) => ({
      id: taint.id || `TAINT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapTaintTypeToVulnerabilityType(taint.type),
      severity: this.mapTaintSeverityToSeverity(taint.severity),
      source: {
        file: taint.sourceLocation?.file || 'unknown',
        line: taint.sourceLocation?.line || 0,
        column: taint.sourceLocation?.column || 0
      },
      sink: {
        file: taint.sinkLocation?.file || 'unknown',
        line: taint.sinkLocation?.line || 0,
        column: taint.sinkLocation?.column || 0
      },
      dataFlow: taint.dataFlowPath || ['unknown']
    })) || [];

    const summary = {
      totalVulnerabilities: vulnerabilities.length,
      highSeverity: vulnerabilities.filter((v: any) => v.severity === 'HIGH' || v.severity === 'CRITICAL').length,
      mediumSeverity: vulnerabilities.filter((v: any) => v.severity === 'MEDIUM').length,
      lowSeverity: vulnerabilities.filter((v: any) => v.severity === 'LOW').length
    };

    return { vulnerabilities, summary };
  }

  private mapTaintTypeToVulnerabilityType(taintType: string): string {
    const typeMap: Record<string, string> = {
      'PATH_TAINT': 'PATH_TRAVERSAL',
      'SQL_TAINT': 'SQL_INJECTION',
      'XSS_TAINT': 'XSS',
      'COMMAND_TAINT': 'COMMAND_INJECTION'
    };
    return typeMap[taintType] || 'PATH_TRAVERSAL';
  }

  private mapTaintSeverityToSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }
}

/**
 * 実Intent抽出戦略
 * Adapter Pattern: IntentPatternMatcherを戦略インターフェースに適応
 */
export class RealIntentExtractionStrategy implements IIntentExtractionStrategy {
  private intentMatcher: IntentPatternMatcher;

  constructor(config?: any) {
    this.intentMatcher = new IntentPatternMatcher();
  }

  async extract(targetPath: string, taintResult: TaintAnalysisResult): Promise<IntentAnalysisResult> {
    try {
      // IntentPatternMatcherを使用した実際の意図抽出
      const intentAnalysis = await this.intentMatcher.analyzeProject(targetPath);
      
      // 結果をIntentAnalysisResult形式に変換
      return this.convertProjectAnalysisToIntentResult(intentAnalysis, taintResult);

    } catch (error) {
      console.debug('Intent抽出エラー:', error);
      // エラー時はフォールバック
      return this.createFallbackIntentResult(taintResult);
    }
  }

  getName(): string {
    return 'RealIntentExtractionStrategy';
  }

  /**
   * IntentPatternMatcherの結果を標準形式に変換
   */
  private convertProjectAnalysisToIntentResult(projectAnalysis: any, taintResult: TaintAnalysisResult): IntentAnalysisResult {
    const testIntents = projectAnalysis.intents?.map((intent: any) => ({
      testName: intent.testName || 'Unknown Test',
      expectedBehavior: intent.expectedBehavior || intent.description || 'Unknown Behavior',
      securityRequirements: this.enhanceSecurityRequirements(intent.securityRequirements || [], taintResult),
      riskLevel: this.assessIntentRiskLevel(intent, taintResult)
    })) || [];

    const summary = {
      totalTests: testIntents.length,
      highRiskTests: testIntents.filter((t: any) => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length,
      mediumRiskTests: testIntents.filter((t: any) => t.riskLevel === 'MEDIUM').length,
      lowRiskTests: testIntents.filter((t: any) => t.riskLevel === 'LOW').length
    };

    return { testIntents, summary };
  }

  /**
   * エラー時のフォールバック結果を作成
   */
  private createFallbackIntentResult(taintResult: TaintAnalysisResult): IntentAnalysisResult {
    return {
      testIntents: [{
        testName: 'Default Security Test',
        expectedBehavior: 'セキュリティ要件の基本検証',
        securityRequirements: ['入力値検証', '基本的なセキュリティ対策'],
        riskLevel: 'LOW'
      }],
      summary: {
        totalTests: 1,
        highRiskTests: 0,
        mediumRiskTests: 0,
        lowRiskTests: 1
      }
    };
  }

  /**
   * セキュリティ要件を強化
   * Taint分析結果と既存の要件を組み合わせ
   */
  private enhanceSecurityRequirements(existingRequirements: string[], taintResult: TaintAnalysisResult): string[] {
    const requirements: string[] = [...existingRequirements];
    
    // Taint分析結果から関連するセキュリティ要件を追加
    for (const vuln of taintResult.vulnerabilities) {
      const vulnRequirement = this.getSecurityRequirementForVulnerability(vuln.type);
      if (!requirements.includes(vulnRequirement)) {
        requirements.push(vulnRequirement);
      }
    }

    // 最低限のセキュリティ要件を保証
    if (requirements.length === 0) {
      requirements.push('基本的なセキュリティ対策');
    }

    return requirements;
  }


  private getSecurityRequirementForVulnerability(vulnType: string): string {
    const requirementMap: Record<string, string> = {
      'PATH_TRAVERSAL': 'パストラバーサル防止',
      'SQL_INJECTION': 'SQLインジェクション防止',
      'XSS': 'XSS防止',
      'COMMAND_INJECTION': 'コマンドインジェクション防止'
    };
    return requirementMap[vulnType] || 'セキュリティ対策';
  }

  private assessIntentRiskLevel(intent: any, taintResult: TaintAnalysisResult): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // セキュリティ関連キーワードによるリスク評価
    const intentText = `${intent.testName || ''} ${intent.description || ''}`.toLowerCase();
    
    // 高リスクキーワード
    const highRiskKeywords = ['auth', 'login', 'password', 'token', 'admin', 'sql', 'injection'];
    const mediumRiskKeywords = ['validate', 'check', 'input', 'form', 'data'];
    
    // Issue #119 対応: 統一キーワード検索を使用
    if (KeywordSearchUtils.containsAnyKeyword(intentText, highRiskKeywords)) {
      return 'HIGH';
    }
    
    if (KeywordSearchUtils.containsAnyKeyword(intentText, mediumRiskKeywords)) {
      return 'MEDIUM';
    }
    
    // 脆弱性との関連性をチェック
    if (taintResult.vulnerabilities.length > 0) {
      const maxSeverity = taintResult.vulnerabilities.reduce((max, vuln) => {
        return this.isHigherRisk(vuln.severity, max) ? vuln.severity : max;
      }, 'LOW');
      
      return maxSeverity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    }

    return 'LOW';
  }

  private isHigherRisk(risk1: string, risk2: string): boolean {
    const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return riskOrder.indexOf(risk1.toUpperCase()) > riskOrder.indexOf(risk2.toUpperCase());
  }
}

/**
 * 実Gap検出戦略
 * 新しく実装したGapDetectorを直接使用
 */
export class RealGapDetectionStrategy implements IGapDetectionStrategy {
  private gapDetector: GapDetector;

  constructor(config?: any) {
    this.gapDetector = new GapDetector({
      enableSemanticAnalysis: true,
      riskThreshold: config?.riskThreshold || 'MEDIUM',
      includeRecommendations: true,
      analysisDepth: config?.analysisDepth || 'detailed'
    });
  }

  async detect(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    try {
      // 実装したGapDetectorを直接使用
      return await this.gapDetector.analyzeGaps(intentResult, taintResult);

    } catch (error) {
      throw new Error(`Gap検出に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getName(): string {
    return 'RealGapDetectionStrategy';
  }
}

/**
 * 実NIST評価戦略
 * Adapter Pattern: NistRiskEvaluatorを戦略インターフェースに適応
 */
export class RealNistEvaluationStrategy implements INistEvaluationStrategy {
  private nistEvaluator: NistRiskEvaluator;

  constructor(config?: any) {
    this.nistEvaluator = new NistRiskEvaluator();
  }

  async evaluate(gapResult: GapAnalysisResult): Promise<NistEvaluationResult> {
    try {
      // NistRiskEvaluatorを使用した実際のNIST評価
      const riskAssessments = await this.performRiskAssessments(gapResult);
      const summary = this.calculateNistSummary(riskAssessments);

      return { riskAssessments, summary };

    } catch (error) {
      throw new Error(`NIST評価に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getName(): string {
    return 'RealNistEvaluationStrategy';
  }

  private async performRiskAssessments(gapResult: GapAnalysisResult): Promise<any[]> {
    const assessments = [];

    for (const gap of gapResult.gaps) {
      try {
        // 各ギャップをNIST リスク評価形式に変換
        const riskAssessment = {
          gapId: gap.testName,
          threatLevel: this.mapRiskToThreatLevel(gap.riskLevel),
          vulnerabilityLevel: this.mapRiskToVulnerabilityLevel(gap.riskLevel),
          impactLevel: this.assessImpactLevel(gap),
          overallRisk: gap.riskLevel,
          nistScore: this.calculateNistScore(gap.riskLevel),
          recommendations: gap.recommendations
        };

        assessments.push(riskAssessment);

      } catch (error) {
        console.warn(`ギャップ ${gap.testName} のNIST評価中にエラー:`, error);
      }
    }

    return assessments;
  }

  private mapRiskToThreatLevel(riskLevel: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }

  private mapRiskToVulnerabilityLevel(riskLevel: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }

  private assessImpactLevel(gap: any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // ギャップの内容に基づいて影響レベルを評価
    if (gap.actualImplementation.includes('CRITICAL') || gap.intention.includes('認証')) {
      return 'CRITICAL';
    }
    if (gap.actualImplementation.includes('SQL_INJECTION')) {
      return 'HIGH';
    }
    return gap.riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }

  private calculateNistScore(riskLevel: string): number {
    const scoreMap: Record<string, number> = {
      'CRITICAL': 90,
      'HIGH': 75,
      'MEDIUM': 50,
      'LOW': 25
    };
    return scoreMap[riskLevel.toUpperCase()] || 50;
  }

  private calculateNistSummary(assessments: any[]) {
    const scores = assessments.map(a => a.nistScore);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 100;

    return {
      overallScore,
      riskLevel: this.scoreToRiskLevel(overallScore),
      totalAssessments: assessments.length,
      criticalRisks: assessments.filter(a => a.overallRisk === 'CRITICAL').length,
      highRisks: assessments.filter(a => a.overallRisk === 'HIGH').length,
      mediumRisks: assessments.filter(a => a.overallRisk === 'MEDIUM').length,
      lowRisks: assessments.filter(a => a.overallRisk === 'LOW').length
    };
  }

  private scoreToRiskLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }
}

/**
 * 実分析戦略ファクトリー
 * Factory Pattern: 実戦略インスタンスの生成管理
 * Mock戦略ファクトリーを置き換え
 */
export class RealAnalysisStrategyFactory implements IAnalysisStrategyFactory {
  constructor(private config: OrchestratorConfig) {}

  createTaintAnalysisStrategy(): ITaintAnalysisStrategy {
    return new RealTaintAnalysisStrategy(this.config);
  }

  createIntentExtractionStrategy(): IIntentExtractionStrategy {
    return new RealIntentExtractionStrategy(this.config);
  }

  createGapDetectionStrategy(): IGapDetectionStrategy {
    return new RealGapDetectionStrategy(this.config);
  }

  createNistEvaluationStrategy(): INistEvaluationStrategy {
    return new RealNistEvaluationStrategy(this.config);
  }

  createAllStrategies(): AnalysisStrategies {
    return {
      taintStrategy: this.createTaintAnalysisStrategy(),
      intentStrategy: this.createIntentExtractionStrategy(),
      gapStrategy: this.createGapDetectionStrategy(),
      nistStrategy: this.createNistEvaluationStrategy()
    };
  }
}