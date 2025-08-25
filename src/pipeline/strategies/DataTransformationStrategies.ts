/**
 * データ変換戦略の実装
 * Strategy Patternによる変換処理の抽象化
 * TDD Refactor Phase - 設計パターンの適用によるコード品質向上
 */

import { 
  TaintAnalysisResult, 
  IntentAnalysisResult, 
  GapAnalysisResult, 
  NistEvaluationResult 
} from '../../orchestrator/types';

import {
  IDataTransformer,
  IntentExtractionInput,
  GapDetectionInput,
  NistEvaluationInput
} from '../DataPipeline';

/**
 * TaintAnalysisからIntentExtraction用データ変換戦略
 * 単一責任の原則：Taint結果の変換のみを担当
 */
export class TaintToIntentTransformationStrategy implements IDataTransformer<TaintAnalysisResult, IntentExtractionInput> {
  
  async transform(taintResult: TaintAnalysisResult): Promise<IntentExtractionInput> {
    // Defensive Programming: 入力検証
    this.validateInput(taintResult);

    const securityContext = this.buildSecurityContext(taintResult);
    const analysisMetadata = this.buildAnalysisMetadata(taintResult);

    return {
      vulnerabilities: taintResult.vulnerabilities,
      securityContext,
      analysisMetadata
    };
  }

  validate(input: TaintAnalysisResult): boolean {
    try {
      this.validateInput(input);
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'TaintToIntentTransformationStrategy';
  }

  /**
   * セキュリティコンテキストの構築
   * DRY原則：コンテキスト生成ロジックの一元化
   */
  private buildSecurityContext(taintResult: TaintAnalysisResult) {
    return {
      analysisType: 'taint-analysis',
      riskLevel: this.calculateOverallRiskLevel(taintResult),
      analysisTimestamp: new Date().toISOString()
    };
  }

  /**
   * 分析メタデータの構築
   * KISS原則：シンプルでわかりやすいメタデータ構築
   */
  private buildAnalysisMetadata(taintResult: TaintAnalysisResult) {
    return {
      totalVulnerabilities: taintResult.summary.totalVulnerabilities,
      riskDistribution: {
        high: taintResult.summary.highSeverity,
        medium: taintResult.summary.mediumSeverity,
        low: taintResult.summary.lowSeverity
      },
      analysisDepth: 'comprehensive'
    };
  }

  /**
   * 全体的なリスクレベル計算
   * ビジネスロジックの分離
   */
  private calculateOverallRiskLevel(taintResult: TaintAnalysisResult): string {
    const { highSeverity, mediumSeverity, lowSeverity } = taintResult.summary;
    
    if (highSeverity > 0) return 'HIGH';
    if (mediumSeverity > 0) return 'MEDIUM';
    if (lowSeverity > 0) return 'LOW';
    return 'NONE';
  }

  /**
   * 入力検証
   * Defensive Programming: 堅牢な入力チェック
   */
  private validateInput(taintResult: TaintAnalysisResult): void {
    if (!taintResult) {
      throw new TransformationError('TaintAnalysisResultが無効です', 'INVALID_INPUT');
    }

    if (!taintResult.vulnerabilities || !Array.isArray(taintResult.vulnerabilities)) {
      throw new TransformationError('データ構造に不整合があります', 'INVALID_STRUCTURE');
    }

    if (!taintResult.summary) {
      throw new TransformationError('必須フィールドが不足しています: summary', 'MISSING_REQUIRED_FIELD');
    }
  }
}

/**
 * IntentAnalysisからGapDetection用データ変換戦略
 * 単一責任の原則：Intent結果の変換のみを担当
 */
export class IntentToGapTransformationStrategy implements IDataTransformer<{intent: IntentAnalysisResult, taint: TaintAnalysisResult}, GapDetectionInput> {
  
  async transform(input: {intent: IntentAnalysisResult, taint: TaintAnalysisResult}): Promise<GapDetectionInput> {
    const { intent: intentResult, taint: taintResult } = input;
    
    // Defensive Programming: 入力検証
    this.validateInput(intentResult, taintResult);

    const vulnerabilityContext = this.buildVulnerabilityContext(intentResult, taintResult);
    const riskProfile = this.buildRiskProfile(intentResult, taintResult);

    return {
      testIntents: intentResult.testIntents,
      vulnerabilityContext,
      riskProfile
    };
  }

  validate(input: {intent: IntentAnalysisResult, taint: TaintAnalysisResult}): boolean {
    try {
      this.validateInput(input.intent, input.taint);
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'IntentToGapTransformationStrategy';
  }

  /**
   * 脆弱性コンテキストの構築
   * Open-Closed Principle: 新しい関連性判定アルゴリズムを簡単に追加可能
   */
  private buildVulnerabilityContext(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult) {
    return {
      relatedVulnerabilities: this.findRelatedVulnerabilities(intentResult, taintResult),
      securityImplications: this.extractSecurityImplications(intentResult),
      riskAssessment: this.assessCombinedRisk(intentResult, taintResult)
    };
  }

  /**
   * リスクプロファイルの構築
   * Interface Segregation Principle: 必要な情報のみを含むプロファイル
   */
  private buildRiskProfile(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult) {
    return {
      overallRiskLevel: this.calculateCombinedRiskLevel(intentResult, taintResult),
      testCoverage: this.calculateTestCoverage(intentResult, taintResult),
      securityPosture: this.evaluateSecurityPosture(intentResult, taintResult)
    };
  }

  /**
   * 関連する脆弱性の特定
   * Strategy Pattern内でのアルゴリズムの封じ込め
   */
  private findRelatedVulnerabilities(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult) {
    return taintResult.vulnerabilities.filter(vuln =>
      intentResult.testIntents.some(intent => 
        intent.securityRequirements.some(req => 
          req.toLowerCase().includes(vuln.type.toLowerCase()) ||
          this.isSemanticMatch(req, vuln.type)
        )
      )
    );
  }

  /**
   * セマンティックマッチング
   * YAGNI原則：現時点では基本的な実装のみ
   */
  private isSemanticMatch(requirement: string, vulnType: string): boolean {
    const semanticMap: Record<string, string[]> = {
      'PATH_TRAVERSAL': ['ファイル', 'パス', 'ディレクトリ', 'アクセス制御'],
      'SQL_INJECTION': ['データベース', 'クエリ', 'SQL'],
      'XSS': ['入力検証', 'スクリプト', 'HTMLエスケープ'],
      'COMMAND_INJECTION': ['コマンド', '実行', 'シェル']
    };

    const keywords = semanticMap[vulnType] || [];
    return keywords.some(keyword => requirement.includes(keyword));
  }

  private extractSecurityImplications(intentResult: IntentAnalysisResult): string[] {
    return intentResult.testIntents.flatMap(intent => intent.securityRequirements);
  }

  private assessCombinedRisk(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): string {
    const intentRisk = intentResult.summary.highRiskTests > 0 ? 'HIGH' : 'LOW';
    const taintRisk = taintResult.summary.highSeverity > 0 ? 'HIGH' : 'LOW';
    
    if (intentRisk === 'HIGH' || taintRisk === 'HIGH') return 'HIGH';
    return 'MEDIUM';
  }

  private calculateCombinedRiskLevel(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): string {
    return this.assessCombinedRisk(intentResult, taintResult);
  }

  private calculateTestCoverage(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): number {
    const totalVulns = taintResult.summary.totalVulnerabilities;
    const coveredVulns = this.findRelatedVulnerabilities(intentResult, taintResult).length;
    
    if (totalVulns === 0) return 100;
    return Math.min(100, (coveredVulns / totalVulns) * 100);
  }

  private evaluateSecurityPosture(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): string {
    const coverage = this.calculateTestCoverage(intentResult, taintResult);
    
    if (coverage >= 80) return 'STRONG';
    if (coverage >= 60) return 'MODERATE';
    return 'WEAK';
  }

  private validateInput(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): void {
    if (!intentResult) {
      throw new TransformationError('IntentAnalysisResultが無効です', 'INVALID_INPUT');
    }
    if (!taintResult) {
      throw new TransformationError('TaintAnalysisResultが無効です', 'INVALID_INPUT');
    }
    if (!intentResult.summary || !taintResult.summary) {
      throw new TransformationError('必須フィールドが不足しています', 'MISSING_REQUIRED_FIELD');
    }
  }
}

/**
 * GapAnalysisからNistEvaluation用データ変換戦略
 * 単一責任の原則：Gap結果の変換のみを担当
 */
export class GapToNistTransformationStrategy implements IDataTransformer<{gap: GapAnalysisResult, intent: IntentAnalysisResult, taint: TaintAnalysisResult}, NistEvaluationInput> {
  
  async transform(input: {gap: GapAnalysisResult, intent: IntentAnalysisResult, taint: TaintAnalysisResult}): Promise<NistEvaluationInput> {
    const { gap: gapResult, intent: intentResult, taint: taintResult } = input;
    
    // Defensive Programming: 入力検証
    this.validateInput(gapResult, intentResult, taintResult);

    const testContext = this.buildTestContext(intentResult, gapResult);
    const vulnerabilityProfile = this.buildVulnerabilityProfile(taintResult, intentResult, gapResult);

    return {
      securityGaps: gapResult.gaps,
      testContext,
      vulnerabilityProfile,
      complianceFramework: 'NIST SP 800-30'
    };
  }

  validate(input: {gap: GapAnalysisResult, intent: IntentAnalysisResult, taint: TaintAnalysisResult}): boolean {
    try {
      this.validateInput(input.gap, input.intent, input.taint);
      return true;
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'GapToNistTransformationStrategy';
  }

  private buildTestContext(intentResult: IntentAnalysisResult, gapResult: GapAnalysisResult) {
    return {
      testIntents: intentResult.testIntents,
      intentRiskProfile: this.analyzeIntentRiskProfile(intentResult),
      testingCompliance: this.assessTestingCompliance(intentResult, gapResult)
    };
  }

  private buildVulnerabilityProfile(taintResult: TaintAnalysisResult, intentResult: IntentAnalysisResult, gapResult: GapAnalysisResult) {
    return {
      vulnerabilities: taintResult.vulnerabilities,
      threatLandscape: this.analyzeThreatLandscape(taintResult, gapResult),
      attackSurface: this.calculateAttackSurface(taintResult, intentResult)
    };
  }

  private analyzeIntentRiskProfile(intentResult: IntentAnalysisResult): string {
    const total = intentResult.summary.totalTests;
    const highRisk = intentResult.summary.highRiskTests;
    
    if (total === 0) return 'UNKNOWN';
    
    const riskRatio = highRisk / total;
    if (riskRatio >= 0.5) return 'HIGH_RISK_DOMINANT';
    if (riskRatio >= 0.2) return 'MIXED_RISK';
    return 'LOW_RISK_DOMINANT';
  }

  private assessTestingCompliance(intentResult: IntentAnalysisResult, gapResult: GapAnalysisResult): string {
    const criticalGaps = gapResult.summary.criticalGaps;
    const testCoverage = intentResult.summary.totalTests;
    
    if (criticalGaps === 0 && testCoverage > 0) return 'COMPLIANT';
    if (criticalGaps <= 2) return 'PARTIALLY_COMPLIANT';
    return 'NON_COMPLIANT';
  }

  private analyzeThreatLandscape(taintResult: TaintAnalysisResult, gapResult: GapAnalysisResult): string {
    const totalVulns = taintResult.summary.totalVulnerabilities;
    const criticalGaps = gapResult.summary.criticalGaps;
    
    if (totalVulns > 10 && criticalGaps > 3) return 'HIGH_THREAT';
    if (totalVulns > 5 || criticalGaps > 1) return 'MODERATE_THREAT';
    return 'LOW_THREAT';
  }

  private calculateAttackSurface(taintResult: TaintAnalysisResult, intentResult: IntentAnalysisResult): string {
    const vulnTypes = new Set(taintResult.vulnerabilities.map(v => v.type)).size;
    const testTypes = new Set(intentResult.testIntents.map(t => t.riskLevel)).size;
    
    const complexity = vulnTypes + testTypes;
    
    if (complexity >= 8) return 'EXTENSIVE';
    if (complexity >= 4) return 'MODERATE';
    return 'LIMITED';
  }

  private validateInput(gapResult: GapAnalysisResult, intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): void {
    if (!gapResult || !intentResult || !taintResult) {
      throw new TransformationError('入力パラメータが無効です', 'INVALID_INPUT');
    }
    if (!gapResult.summary || !intentResult.summary || !taintResult.summary) {
      throw new TransformationError('必須フィールドが不足しています', 'MISSING_REQUIRED_FIELD');
    }
  }
}

/**
 * カスタム変換エラークラス
 * Liskov Substitution Principle: Errorクラスの適切な継承
 */
export class TransformationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_INPUT' | 'INVALID_STRUCTURE' | 'MISSING_REQUIRED_FIELD' | 'TRANSFORMATION_FAILED',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransformationError';
  }
}

/**
 * データ変換戦略ファクトリー
 * Factory Pattern: 戦略インスタンスの生成を管理
 * Dependency Inversion Principle: 具象クラスではなくインターフェースに依存
 */
export class DataTransformationStrategyFactory {
  private static strategies = new Map<string, () => IDataTransformer<any, any>>();

  static {
    // デフォルト戦略の登録
    this.registerStrategy('taint-to-intent', () => new TaintToIntentTransformationStrategy());
    this.registerStrategy('intent-to-gap', () => new IntentToGapTransformationStrategy());
    this.registerStrategy('gap-to-nist', () => new GapToNistTransformationStrategy());
  }

  /**
   * 戦略の登録
   * Open-Closed Principle: 新しい戦略を追加可能
   */
  static registerStrategy<TInput, TOutput>(
    name: string,
    factory: () => IDataTransformer<TInput, TOutput>
  ): void {
    this.strategies.set(name, factory);
  }

  /**
   * 戦略の作成
   * Factory Method Pattern
   */
  static createStrategy<TInput, TOutput>(name: string): IDataTransformer<TInput, TOutput> {
    const factory = this.strategies.get(name);
    if (!factory) {
      throw new Error(`未知の変換戦略: ${name}`);
    }
    return factory();
  }

  /**
   * 利用可能な戦略一覧
   * Information Expert Pattern: ファクトリーが持つ情報を提供
   */
  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * 戦略の登録解除
   * YAGNI原則: 必要に応じて将来実装
   */
  static unregisterStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }
}