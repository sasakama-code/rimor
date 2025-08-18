/**
 * 統合セキュリティ分析オーケストレータ
 * TDD Refactor Phase - SOLID原則とDRY原則の適用
 * Strategy PatternとFactory Patternによる設計改善
 */

import * as path from 'path';
import {
  UnifiedAnalysisResult,
  UnifiedReport,
  OrchestratorConfig,
  OrchestratorError
} from './types';
import {
  IAnalysisStrategyFactory,
  ITaintAnalysisStrategy,
  IIntentExtractionStrategy,
  IGapDetectionStrategy,
  INistEvaluationStrategy,
  IInputValidator
} from './interfaces';
import { MockAnalysisStrategyFactory } from './strategies/MockAnalysisStrategies';
import { InputValidator } from './validators/InputValidator';

export class UnifiedSecurityAnalysisOrchestrator {
  private readonly config: OrchestratorConfig;
  private readonly strategyFactory: IAnalysisStrategyFactory;
  private readonly validator: IInputValidator;

  constructor(
    config?: Partial<OrchestratorConfig>,
    strategyFactory?: IAnalysisStrategyFactory,
    validator?: IInputValidator
  ) {
    // 依存関係注入による設計（DIP: Dependency Inversion Principle）
    this.strategyFactory = strategyFactory || new MockAnalysisStrategyFactory();
    this.validator = validator || new InputValidator();
    
    // デフォルト設定の適用
    this.config = this.createDefaultConfig(config);
    
    // 設定の検証
    this.validator.validateConfig(this.config);
  }

  /**
   * デフォルト設定の作成
   * DRY原則：設定作成ロジックの一元化
   */
  private createDefaultConfig(config?: Partial<OrchestratorConfig>): OrchestratorConfig {
    return {
      enableTaintAnalysis: true,
      enableIntentExtraction: true,
      enableGapDetection: true,
      enableNistEvaluation: true,
      parallelExecution: false, // YAGNIのため並列処理は後で実装
      timeoutMs: 30000,
      ...config
    };
  }

  /**
   * テストディレクトリの統合分析を実行
   * 単一責任の原則に従い、各ステップを個別メソッドに分離
   */
  async analyzeTestDirectory(targetPath: string): Promise<UnifiedAnalysisResult> {
    // 入力値検証（責務を分離）
    this.validator.validatePath(targetPath);

    const startTime = Date.now();

    try {
      // 分析戦略の取得（Factory Pattern）
      const strategies = this.createAnalysisStrategies();
      
      // 各分析ステップの実行（Strategy Pattern）
      const analysisResults = await this.executeAnalysisSequence(strategies, targetPath);

      // 統合レポート生成
      const executionTime = Date.now() - startTime;
      const unifiedReport = this.generateUnifiedReport(
        analysisResults.taintResult,
        analysisResults.intentResult,
        analysisResults.gapResult,
        analysisResults.nistResult,
        targetPath,
        executionTime
      );

      return {
        taintAnalysis: analysisResults.taintResult,
        intentAnalysis: analysisResults.intentResult,
        gapAnalysis: analysisResults.gapResult,
        nistEvaluation: analysisResults.nistResult,
        unifiedReport
      };

    } catch (error) {
      // Defensive Programming: エラーハンドリング
      return this.handleAnalysisError(error);
    }
  }

  /**
   * 分析戦略群の作成
   * Factory Patternによるオブジェクト生成の抽象化
   */
  private createAnalysisStrategies(): {
    taintStrategy: ITaintAnalysisStrategy;
    intentStrategy: IIntentExtractionStrategy;
    gapStrategy: IGapDetectionStrategy;
    nistStrategy: INistEvaluationStrategy;
  } {
    return {
      taintStrategy: this.strategyFactory.createTaintAnalysisStrategy(),
      intentStrategy: this.strategyFactory.createIntentExtractionStrategy(),
      gapStrategy: this.strategyFactory.createGapDetectionStrategy(),
      nistStrategy: this.strategyFactory.createNistEvaluationStrategy()
    };
  }

  /**
   * 分析シーケンスの実行
   * 各ステップの実行順序を管理
   */
  private async executeAnalysisSequence(
    strategies: ReturnType<typeof this.createAnalysisStrategies>,
    targetPath: string
  ) {
    // 1. TaintTyper実行
    const taintResult = await this.executeTaintAnalysis(strategies.taintStrategy, targetPath);

    // 2. 意図抽出実行（TaintTyperの結果を活用）
    const intentResult = await this.executeIntentExtraction(strategies.intentStrategy, targetPath, taintResult);

    // 3. ギャップ検出
    const gapResult = await this.executeGapDetection(strategies.gapStrategy, intentResult, taintResult);

    // 4. NIST評価
    const nistResult = await this.executeNistEvaluation(strategies.nistStrategy, gapResult);

    return { taintResult, intentResult, gapResult, nistResult };
  }

  /**
   * エラーハンドリングの統一化
   * DRY原則：エラー処理ロジックの一元化
   */
  private handleAnalysisError(error: unknown): never {
    if (error instanceof OrchestratorError) {
      throw error;
    }
    throw new OrchestratorError(
      `統合分析中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      'execution',
      error instanceof Error ? error : undefined
    );
  }

  /**
   * TaintTyper分析実行
   * Strategy Patternによる実装の抽象化
   */
  private async executeTaintAnalysis(
    strategy: ITaintAnalysisStrategy,
    targetPath: string
  ) {
    if (!this.config.enableTaintAnalysis) {
      // 分析が無効な場合のデフォルト結果
      return {
        vulnerabilities: [],
        summary: {
          totalVulnerabilities: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0
        }
      };
    }
    
    return await strategy.analyze(targetPath);
  }

  /**
   * 意図抽出実行
   * Strategy Patternによる実装の抽象化
   */
  private async executeIntentExtraction(
    strategy: IIntentExtractionStrategy,
    targetPath: string,
    taintResult: any
  ) {
    if (!this.config.enableIntentExtraction) {
      return {
        testIntents: [],
        summary: {
          totalTests: 0,
          highRiskTests: 0,
          mediumRiskTests: 0,
          lowRiskTests: 0
        }
      };
    }
    
    return await strategy.extract(targetPath, taintResult);
  }

  /**
   * ギャップ検出実行
   * Strategy Patternによる実装の抽象化
   */
  private async executeGapDetection(
    strategy: IGapDetectionStrategy,
    intentResult: any,
    taintResult: any
  ) {
    if (!this.config.enableGapDetection) {
      return {
        gaps: [],
        summary: {
          totalGaps: 0,
          criticalGaps: 0,
          highGaps: 0,
          mediumGaps: 0,
          lowGaps: 0
        }
      };
    }
    
    return await strategy.detect(intentResult, taintResult);
  }

  /**
   * NIST評価実行
   * Strategy Patternによる実装の抽象化
   */
  private async executeNistEvaluation(
    strategy: INistEvaluationStrategy,
    gapResult: any
  ) {
    if (!this.config.enableNistEvaluation) {
      return {
        riskAssessments: [],
        summary: {
          overallScore: 100,
          riskLevel: 'LOW' as const,
          totalAssessments: 0,
          criticalRisks: 0,
          highRisks: 0,
          mediumRisks: 0,
          lowRisks: 0
        }
      };
    }
    
    return await strategy.evaluate(gapResult);
  }

  /**
   * 統合レポート生成
   * DRY原則に従い、レポート生成ロジックを一箇所に集約
   */
  private generateUnifiedReport(
    taintResult: any,
    intentResult: any,
    gapResult: any,
    nistResult: any,
    targetPath: string,
    executionTime: number
  ): UnifiedReport {
    // 問題数の集計（DRY原則：集計ロジックの統一化）
    const issueCounts = this.calculateIssueCounts(taintResult, gapResult, nistResult);
    
    // 総合グレードの算出
    const overallGrade = this.calculateOverallGrade(nistResult.summary.overallScore);

    return {
      summary: {
        ...issueCounts,
        overallGrade
      },
      taintSummary: taintResult.summary,
      intentSummary: intentResult.summary,
      gapSummary: gapResult.summary,
      nistSummary: nistResult.summary,
      overallRiskScore: nistResult.summary.overallScore,
      metadata: this.createReportMetadata(targetPath, executionTime)
    };
  }

  /**
   * 問題数の集計
   * DRY原則：集計ロジックの一元化
   */
  private calculateIssueCounts(
    taintResult: any,
    gapResult: any,
    nistResult: any
  ) {
    return {
      totalIssues: taintResult.summary.totalVulnerabilities + gapResult.summary.totalGaps,
      criticalIssues: gapResult.summary.criticalGaps + nistResult.summary.criticalRisks,
      highIssues: taintResult.summary.highSeverity + gapResult.summary.highGaps + nistResult.summary.highRisks,
      mediumIssues: taintResult.summary.mediumSeverity + gapResult.summary.mediumGaps + nistResult.summary.mediumRisks,
      lowIssues: taintResult.summary.lowSeverity + gapResult.summary.lowGaps + nistResult.summary.lowRisks
    };
  }

  /**
   * レポートメタデータの作成
   * 単一責任の原則：メタデータ作成の責務を分離
   */
  private createReportMetadata(targetPath: string, executionTime: number) {
    return {
      analyzedPath: targetPath,
      timestamp: new Date().toISOString(),
      rimorVersion: this.getRimorVersion(),
      analysisType: 'unified-security',
      executionTime
    };
  }

  /**
   * Rimorバージョンの取得
   * TODO: package.jsonから動的に取得する実装に変更
   */
  private getRimorVersion(): string {
    return '0.8.0';
  }

  /**
   * 総合グレードの計算
   * KISS原則に従ったシンプルな算出ロジック
   */
  private calculateOverallGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}