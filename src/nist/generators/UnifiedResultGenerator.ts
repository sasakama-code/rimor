/**
 * UnifiedResultGenerator
 * 全評価結果を統合してUnifiedAnalysisResultを生成
 * 
 * SOLID原則: 単一責任の原則 - 統合ロジックに特化
 * DRY原則: 変換ロジックの一元化
 * KISS原則: シンプルな統合フロー
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { PriorityEngine } from '../priority/PriorityEngine';
import { TaintVulnerabilityAdapter } from '../adapters/TaintVulnerabilityAdapter';
import { NistRiskEvaluator } from '../evaluators/NistRiskEvaluator';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  AIActionType,
  ExecutiveSummary,
  DetailedIssue,
  AIActionableRisk,
  ReportDimension,
  ScoreBreakdown
} from '../types/unified-analysis-result';
import {
  TaintAnalysisResult,
  TaintLevel,
  TaintFlow
} from '../../security/types/taint-analysis-types';
import {
  RiskPriorityRequest,
  BusinessImpact,
  TechnicalComplexity
} from '../types/priority-types';

/**
 * 統合分析結果ジェネレーター
 */
export class UnifiedResultGenerator {
  constructor(
    private priorityEngine: PriorityEngine,
    private taintAdapter: TaintVulnerabilityAdapter,
    private nistEvaluator: NistRiskEvaluator
  ) {}

  /**
   * Taint解析結果からUnifiedAnalysisResultを生成
   */
  async generate(taintResult: TaintAnalysisResult): Promise<UnifiedAnalysisResult> {
    if (!taintResult) {
      throw new Error('Invalid taint result');
    }

    const vulnerabilities = this.taintAdapter.convertTaintToVulnerabilities(taintResult);
    const assessment = await this.taintAdapter.evaluateTaintVulnerabilities(taintResult);
    
    const detailedIssues = this.generateDetailedIssues(taintResult);
    const aiKeyRisks = await this.generateAIKeyRisks(taintResult);
    const summary = this.generateExecutiveSummary(taintResult, assessment.overallRiskLevel);

    return {
      schemaVersion: '1.0',
      summary,
      detailedIssues,
      aiKeyRisks
    };
  }

  /**
   * エグゼクティブサマリーを生成
   */
  private generateExecutiveSummary(
    taintResult: TaintAnalysisResult,
    overallRiskLevel: RiskLevel
  ): ExecutiveSummary {
    const overallScore = this.calculateOverallScore(taintResult);
    const overallGrade = this.calculateGrade(overallScore);
    const dimensions = this.calculateDimensions(taintResult);
    
    const statistics = {
      totalFiles: this.countUniqueFiles(taintResult),
      totalTests: 0,
      riskCounts: this.countRisksByLevel(taintResult)
    };

    return {
      overallScore,
      overallGrade,
      dimensions,
      statistics
    };
  }

  /**
   * 総合スコアを計算
   */
  private calculateOverallScore(taintResult: TaintAnalysisResult): number {
    if (taintResult.flows.length === 0) {
      return 100;
    }

    const baseScore = 100;
    let deductions = 0;

    deductions += taintResult.summary.criticalFlows * 60;
    deductions += taintResult.summary.highFlows * 40;
    deductions += taintResult.summary.mediumFlows * 30;
    deductions += taintResult.summary.lowFlows * 10;

    return Math.max(0, baseScore - deductions);
  }

  /**
   * グレードを計算
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * 評価ディメンションを計算
   */
  private calculateDimensions(taintResult: TaintAnalysisResult): ReportDimension[] {
    const dimensions: ReportDimension[] = [];

    const intentScore = this.calculateIntentScore(taintResult);
    dimensions.push({
      name: 'テスト意図実現度',
      score: intentScore,
      weight: 0.4,
      impact: intentScore * 0.4,
      breakdown: this.getIntentBreakdown(taintResult)
    });

    const securityScore = this.calculateSecurityScore(taintResult);
    dimensions.push({
      name: 'セキュリティリスク',
      score: securityScore,
      weight: 0.4,
      impact: securityScore * 0.4,
      breakdown: this.getSecurityBreakdown(taintResult)
    });

    const coverageScore = this.calculateCoverageScore(taintResult);
    dimensions.push({
      name: 'カバレッジ完全性',
      score: coverageScore,
      weight: 0.2,
      impact: coverageScore * 0.2,
      breakdown: this.getCoverageBreakdown(taintResult)
    });

    return dimensions;
  }

  /**
   * テスト意図スコアを計算
   */
  private calculateIntentScore(taintResult: TaintAnalysisResult): number {
    if (taintResult.flows.length === 0) return 100;
    
    const baseScore = 100;
    const highRiskFlows = taintResult.summary.criticalFlows + taintResult.summary.highFlows;
    const deduction = Math.min(50, highRiskFlows * 10);
    
    return baseScore - deduction;
  }

  /**
   * セキュリティスコアを計算
   */
  private calculateSecurityScore(taintResult: TaintAnalysisResult): number {
    if (taintResult.flows.length === 0) return 100;
    
    const baseScore = 100;
    let deduction = 0;
    
    taintResult.flows.forEach(flow => {
      if (flow.taintLevel === TaintLevel.CRITICAL) deduction += 25;
      else if (flow.taintLevel === TaintLevel.HIGH) deduction += 15;
      else if (flow.taintLevel === TaintLevel.MEDIUM) deduction += 8;
      else if (flow.taintLevel === TaintLevel.LOW) deduction += 3;
    });
    
    return Math.max(0, baseScore - deduction);
  }

  /**
   * カバレッジスコアを計算
   */
  private calculateCoverageScore(taintResult: TaintAnalysisResult): number {
    if (taintResult.flows.length === 0) return 100;
    
    const baseScore = 100;
    const flowCount = taintResult.flows.length;
    const deduction = Math.min(40, flowCount * 5);
    
    return baseScore - deduction;
  }

  /**
   * 意図スコアの内訳を取得
   */
  private getIntentBreakdown(taintResult: TaintAnalysisResult): ScoreBreakdown[] {
    const breakdown: ScoreBreakdown[] = [];
    
    if (taintResult.summary.criticalFlows > 0) {
      breakdown.push({
        label: 'クリティカルリスク',
        calculation: `-10点 x ${taintResult.summary.criticalFlows}件`,
        deduction: -10 * taintResult.summary.criticalFlows
      });
    }
    
    if (taintResult.summary.highFlows > 0) {
      breakdown.push({
        label: '高リスク',
        calculation: `-10点 x ${taintResult.summary.highFlows}件`,
        deduction: -10 * taintResult.summary.highFlows
      });
    }
    
    return breakdown;
  }

  /**
   * セキュリティスコアの内訳を取得
   */
  private getSecurityBreakdown(taintResult: TaintAnalysisResult): ScoreBreakdown[] {
    const breakdown: ScoreBreakdown[] = [];
    
    if (taintResult.summary.criticalFlows > 0) {
      breakdown.push({
        label: 'Unsafe Taint Flow',
        calculation: `-25点 x ${taintResult.summary.criticalFlows}件`,
        deduction: -25 * taintResult.summary.criticalFlows
      });
    }
    
    if (taintResult.summary.highFlows > 0) {
      breakdown.push({
        label: 'High Risk Flow',
        calculation: `-15点 x ${taintResult.summary.highFlows}件`,
        deduction: -15 * taintResult.summary.highFlows
      });
    }
    
    if (taintResult.summary.mediumFlows > 0) {
      breakdown.push({
        label: 'Medium Risk Flow',
        calculation: `-8点 x ${taintResult.summary.mediumFlows}件`,
        deduction: -8 * taintResult.summary.mediumFlows
      });
    }
    
    return breakdown;
  }

  /**
   * カバレッジスコアの内訳を取得
   */
  private getCoverageBreakdown(taintResult: TaintAnalysisResult): ScoreBreakdown[] {
    const breakdown: ScoreBreakdown[] = [];
    
    if (taintResult.flows.length > 0) {
      breakdown.push({
        label: '未カバーフロー',
        calculation: `-5点 x ${taintResult.flows.length}件`,
        deduction: -5 * taintResult.flows.length
      });
    }
    
    return breakdown;
  }

  /**
   * 詳細な問題リストを生成
   */
  private generateDetailedIssues(taintResult: TaintAnalysisResult): DetailedIssue[] {
    return taintResult.flows.map(flow => ({
      filePath: flow.sinkLocation.file,
      startLine: flow.sinkLocation.line,
      endLine: flow.sinkLocation.line,
      riskLevel: this.mapTaintLevelToRiskLevel(flow.taintLevel),
      title: this.generateIssueTitle(flow),
      description: flow.description,
      contextSnippet: this.generateContextSnippet(flow)
    }));
  }

  /**
   * AI向けキーリスクを生成
   */
  private async generateAIKeyRisks(taintResult: TaintAnalysisResult): Promise<AIActionableRisk[]> {
    const risks: AIActionableRisk[] = [];
    
    for (const flow of taintResult.flows) {
      const priorityRequest: RiskPriorityRequest = {
        riskId: flow.id,
        riskLevel: this.mapTaintLevelToRiskLevel(flow.taintLevel),
        businessImpact: this.estimateBusinessImpact(flow),
        technicalComplexity: this.estimateTechnicalComplexity(flow),
        affectedComponents: 1,
        dependencies: flow.path.length
      };
      
      const priorityResult = this.priorityEngine.calculatePriority(priorityRequest);
      
      risks.push({
        riskId: flow.id,
        filePath: flow.sinkLocation.file,
        riskLevel: this.mapTaintLevelToRiskLevel(flow.taintLevel),
        title: this.generateIssueTitle(flow),
        problem: flow.description,
        context: {
          codeSnippet: this.generateContextSnippet(flow),
          startLine: flow.sinkLocation.line,
          endLine: flow.sinkLocation.line
        },
        suggestedAction: this.generateSuggestedAction(flow)
      });
    }
    
    return risks.sort((a, b) => 
      this.getRiskPriority(b.riskLevel) - this.getRiskPriority(a.riskLevel)
    );
  }

  /**
   * TaintLevelをRiskLevelにマッピング
   */
  private mapTaintLevelToRiskLevel(taintLevel: TaintLevel): RiskLevel {
    switch (taintLevel) {
      case TaintLevel.CRITICAL:
        return CoreTypes.RiskLevel.CRITICAL;
      case TaintLevel.HIGH:
        return CoreTypes.RiskLevel.HIGH;
      case TaintLevel.MEDIUM:
        return CoreTypes.RiskLevel.MEDIUM;
      case TaintLevel.LOW:
        return CoreTypes.RiskLevel.LOW;
      case TaintLevel.SAFE:
      default:
        return CoreTypes.RiskLevel.MINIMAL;
    }
  }

  /**
   * 問題のタイトルを生成
   */
  private generateIssueTitle(flow: TaintFlow): string {
    if (flow.description.includes('SQL')) {
      return 'SQLインジェクション脆弱性';
    }
    if (flow.description.includes('XSS')) {
      return 'クロスサイトスクリプティング脆弱性';
    }
    if (flow.description.includes('認証')) {
      return '認証バイパスの脆弱性';
    }
    if (flow.description.includes('コマンド')) {
      return 'コマンドインジェクション脆弱性';
    }
    return '汚染フロー検出';
  }

  /**
   * コンテキストスニペットを生成
   */
  private generateContextSnippet(flow: TaintFlow): string {
    return `// ${flow.sinkLocation.file}:${flow.sinkLocation.line}
// Taint flow: ${flow.path.join(' → ')}
// Risk: ${flow.description}`;
  }

  /**
   * 推奨アクションを生成
   */
  private generateSuggestedAction(flow: TaintFlow): {
    type: AIActionType;
    description: string;
    example?: string;
  } {
    let type: AIActionType;
    let description: string;
    let example: string | undefined;

    if (flow.description.includes('SQL')) {
      type = AIActionType.SANITIZE_VARIABLE;
      description = '入力をサニタイズし、パラメータ化クエリを使用してください';
      example = '// パラメータ化クエリの使用\nconst query = "SELECT * FROM users WHERE id = ?";\ndb.query(query, [userId]);';
    } else if (flow.description.includes('XSS')) {
      type = AIActionType.SANITIZE_VARIABLE;
      description = 'HTMLエスケープを実装してください';
      example = 'const safe = escapeHtml(userInput);';
    } else if (flow.description.includes('認証')) {
      type = AIActionType.ADD_ASSERTION;
      description = '認証チェックを追加してください';
      example = 'if (!isAuthenticated(user)) { throw new UnauthorizedError(); }';
    } else {
      type = AIActionType.REFACTOR_COMPLEX_CODE;
      description = 'コードを安全な実装にリファクタリングしてください';
    }

    return { type, description, example };
  }

  /**
   * ビジネスインパクトを推定
   */
  private estimateBusinessImpact(flow: TaintFlow): BusinessImpact {
    if (flow.taintLevel === TaintLevel.CRITICAL) return BusinessImpact.CRITICAL;
    if (flow.taintLevel === TaintLevel.HIGH) return BusinessImpact.HIGH;
    if (flow.taintLevel === TaintLevel.MEDIUM) return BusinessImpact.MEDIUM;
    return BusinessImpact.LOW;
  }

  /**
   * 技術的複雑性を推定
   */
  private estimateTechnicalComplexity(flow: TaintFlow): TechnicalComplexity {
    if (flow.path.length > 5) return TechnicalComplexity.VERY_HIGH;
    if (flow.path.length > 3) return TechnicalComplexity.HIGH;
    if (flow.path.length > 2) return TechnicalComplexity.MEDIUM;
    return TechnicalComplexity.LOW;
  }

  /**
   * ユニークなファイル数をカウント
   */
  private countUniqueFiles(taintResult: TaintAnalysisResult): number {
    const files = new Set<string>();
    
    taintResult.flows.forEach(flow => {
      files.add(flow.sourceLocation.file);
      files.add(flow.sinkLocation.file);
      flow.path.forEach(path => {
        const file = path.split(':')[0];
        if (file) files.add(file);
      });
    });
    
    return files.size;
  }

  /**
   * リスクレベル別のカウント
   */
  private countRisksByLevel(taintResult: TaintAnalysisResult): Record<RiskLevel, number> {
    return {
      [CoreTypes.RiskLevel.CRITICAL]: taintResult.summary.criticalFlows,
      [CoreTypes.RiskLevel.HIGH]: taintResult.summary.highFlows,
      [CoreTypes.RiskLevel.MEDIUM]: taintResult.summary.mediumFlows,
      [CoreTypes.RiskLevel.LOW]: taintResult.summary.lowFlows,
      [CoreTypes.RiskLevel.MINIMAL]: 0
    };
  }

  /**
   * リスクの優先度を取得
   */
  private getRiskPriority(riskLevel: RiskLevel): number {
    const priorities: Record<RiskLevel, number> = {
      [CoreTypes.RiskLevel.CRITICAL]: 5,
      [CoreTypes.RiskLevel.HIGH]: 4,
      [CoreTypes.RiskLevel.MEDIUM]: 3,
      [CoreTypes.RiskLevel.LOW]: 2,
      [CoreTypes.RiskLevel.MINIMAL]: 1
    };
    return priorities[riskLevel];
  }
}