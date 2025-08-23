/**
 * データパイプライン
 * TDD Refactor Phase - 設計パターンとSOLID原則の適用によるコード品質向上
 * Phase 4: データパイプラインの実装
 */

import { 
  TaintAnalysisResult, 
  IntentAnalysisResult, 
  GapAnalysisResult, 
  NistEvaluationResult 
} from '../orchestrator/types';

import {
  DataTransformationStrategyFactory,
  TransformationError
} from './strategies/DataTransformationStrategies';

/**
 * データ変換器インターフェース
 * Strategy Patternによる変換処理の抽象化
 */
export interface IDataTransformer<TInput, TOutput> {
  transform(input: TInput): Promise<TOutput>;
  validate(input: TInput): boolean;
  getName(): string;
}

/**
 * データバリデーターインターフェース
 * データ整合性の検証を担当
 */
export interface IDataValidator<T> {
  validate(data: T): boolean;
  getValidationRules(): string[];
}

/**
 * リトライ戦略インターフェース
 * エラー処理とリカバリの抽象化
 */
export interface IRetryStrategy {
  maxRetries: number;
  retryDelay: number;
  shouldRetry(error: Error): boolean;
}

/**
 * パイプライン設定インターフェース
 */
export interface IPipelineConfiguration {
  enableParallelProcessing?: boolean;
  batchSize?: number;
  timeoutMs?: number;
  enableCaching?: boolean;
}

/**
 * ヘルスステータスインターフェース
 */
export interface IHealthStatus {
  isHealthy: boolean;
  lastError?: Error;
  processedCount: number;
  errorCount: number;
}

/**
 * Intent Extraction用の入力データ型
 */
export interface IntentExtractionInput {
  vulnerabilities: TaintAnalysisResult['vulnerabilities'];
  securityContext: {
    analysisType: string;
    riskLevel: string;
    analysisTimestamp: string;
  };
  analysisMetadata: {
    totalVulnerabilities: number;
    riskDistribution: Record<string, number>;
    analysisDepth: string;
  };
}

/**
 * Gap Detection用の入力データ型
 */
export interface GapDetectionInput {
  testIntents: IntentAnalysisResult['testIntents'];
  vulnerabilityContext: {
    relatedVulnerabilities: TaintAnalysisResult['vulnerabilities'];
    securityImplications: string[];
    riskAssessment: string;
  };
  riskProfile: {
    overallRiskLevel: string;
    testCoverage: number;
    securityPosture: string;
  };
}

/**
 * NIST Evaluation用の入力データ型
 */
export interface NistEvaluationInput {
  securityGaps: GapAnalysisResult['gaps'];
  testContext: {
    testIntents: IntentAnalysisResult['testIntents'];
    intentRiskProfile: string;
    testingCompliance: string;
  };
  vulnerabilityProfile: {
    vulnerabilities: TaintAnalysisResult['vulnerabilities'];
    threatLandscape: string;
    attackSurface: string;
  };
  complianceFramework: string;
}

/**
 * データパイプラインクラス
 * 分析ステップ間のデータ変換と連携を担当
 * 単一責任の原則：データフロー管理に特化
 */
export class DataPipeline {
  private transformers = new Map<string, IDataTransformer<any, any>>();
  private validators = new Map<string, IDataValidator<any>>();
  private retryStrategy?: IRetryStrategy;
  private configuration: IPipelineConfiguration;
  private healthStatus: IHealthStatus;

  constructor(config?: IPipelineConfiguration) {
    this.configuration = {
      enableParallelProcessing: false,
      batchSize: 10,
      timeoutMs: 30000,
      enableCaching: false,
      ...config
    };

    this.healthStatus = {
      isHealthy: true,
      processedCount: 0,
      errorCount: 0
    };
  }

  /**
   * TaintAnalysisからIntentExtractionへのデータ変換
   * Strategy Pattern: 戦略を使用した変換処理の委譲
   * Dependency Inversion Principle: 具象戦略ではなくインターフェースに依存
   */
  async transformTaintToIntent(taintResult: TaintAnalysisResult): Promise<IntentExtractionInput> {
    try {
      // Strategy Patternの適用：戦略の動的選択
      const strategy = DataTransformationStrategyFactory.createStrategy<TaintAnalysisResult, IntentExtractionInput>('taint-to-intent');
      
      // 戦略による変換実行
      const result = await strategy.transform(taintResult);
      
      // 成功時の後処理
      this.updateProcessedCount();
      return result;

    } catch (error) {
      // エラーハンドリングの強化
      this.handleTransformationError(error, 'transformTaintToIntent');
      
      // より具体的なエラー情報の提供
      if (error instanceof TransformationError) {
        throw error; // カスタムエラーはそのまま再スロー
      }
      
      throw new TransformationError(
        `TaintToIntent変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        'TRANSFORMATION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * IntentAnalysisからGapDetectionへのデータ変換
   * Strategy Pattern: 複合入力を処理する戦略の適用
   */
  async transformIntentToGap(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapDetectionInput> {
    try {
      // Strategy Patternの適用：複合入力用戦略の取得
      const strategy = DataTransformationStrategyFactory.createStrategy<
        {intent: IntentAnalysisResult, taint: TaintAnalysisResult}, 
        GapDetectionInput
      >('intent-to-gap');
      
      // 戦略による変換実行
      const result = await strategy.transform({ intent: intentResult, taint: taintResult });
      
      // 成功時の後処理
      this.updateProcessedCount();
      return result;

    } catch (error) {
      // エラーハンドリングの強化
      this.handleTransformationError(error, 'transformIntentToGap');
      
      // カスタムエラーの適切な処理
      if (error instanceof TransformationError) {
        throw error;
      }
      
      throw new TransformationError(
        `IntentToGap変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        'TRANSFORMATION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * GapAnalysisからNistEvaluationへのデータ変換
   * Strategy Pattern: 最も複雑な3入力変換の戦略適用
   */
  async transformGapToNist(
    gapResult: GapAnalysisResult,
    intentResult: IntentAnalysisResult,
    taintResult: TaintAnalysisResult
  ): Promise<NistEvaluationInput> {
    try {
      // Strategy Patternの適用：3入力用戦略の取得
      const strategy = DataTransformationStrategyFactory.createStrategy<
        {gap: GapAnalysisResult, intent: IntentAnalysisResult, taint: TaintAnalysisResult}, 
        NistEvaluationInput
      >('gap-to-nist');
      
      // 戦略による変換実行
      const result = await strategy.transform({ 
        gap: gapResult, 
        intent: intentResult, 
        taint: taintResult 
      });
      
      // 成功時の後処理
      this.updateProcessedCount();
      return result;

    } catch (error) {
      // エラーハンドリングの強化
      this.handleTransformationError(error, 'transformGapToNist');
      
      // カスタムエラーの適切な処理
      if (error instanceof TransformationError) {
        throw error;
      }
      
      throw new TransformationError(
        `GapToNist変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        'TRANSFORMATION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * リトライ付き実行
   * エラー処理とリカバリ機能
   */
  async executeWithRetry<T>(
    operation: (data: any) => Promise<T>,
    data: any
  ): Promise<T> {
    if (!this.retryStrategy) {
      return await operation(data);
    }

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryStrategy.maxRetries; attempt++) {
      try {
        return await operation(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.retryStrategy.maxRetries || !this.retryStrategy.shouldRetry(lastError)) {
          break;
        }

        // リトライ間隔の待機
        await this.delay(this.retryStrategy.retryDelay);
      }
    }

    throw new Error(`最大リトライ回数に達しました: ${lastError!.message}`);
  }

  /**
   * カスタム変換器の登録
   */
  registerTransformer<TInput, TOutput>(
    name: string, 
    transformer: IDataTransformer<TInput, TOutput>
  ): void {
    this.transformers.set(name, transformer);
  }

  /**
   * 変換器の取得
   */
  getTransformer<TInput, TOutput>(name: string): IDataTransformer<TInput, TOutput> | undefined {
    return this.transformers.get(name);
  }

  /**
   * カスタムバリデーターの設定
   */
  setValidator<T>(name: string, validator: IDataValidator<T>): void {
    this.validators.set(name, validator);
  }

  /**
   * バリデーターの取得
   */
  getValidator<T>(name: string): IDataValidator<T> | undefined {
    return this.validators.get(name);
  }

  /**
   * リトライ戦略の設定
   */
  setRetryStrategy(strategy: IRetryStrategy): void {
    this.retryStrategy = strategy;
  }

  /**
   * 設定の更新
   */
  updateConfiguration(newConfig: IPipelineConfiguration): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  /**
   * 現在の設定取得
   */
  getConfiguration(): IPipelineConfiguration {
    return { ...this.configuration };
  }

  /**
   * ヘルスステータス取得
   */
  getHealthStatus(): IHealthStatus {
    return { ...this.healthStatus };
  }

  // === プライベートメソッド ===

  /**
   * TaintAnalysisResult検証
   */
  private validateTaintAnalysisResult(result: TaintAnalysisResult): void {
    if (!result) {
      throw new Error('TaintAnalysisResultが無効です');
    }

    if (!result.vulnerabilities || !Array.isArray(result.vulnerabilities)) {
      throw new Error('データ構造に不整合があります');
    }

    if (!result.summary) {
      throw new Error('必須フィールドが不足しています: summary');
    }
  }

  /**
   * IntentAnalysisResult検証
   */
  private validateIntentAnalysisResult(result: IntentAnalysisResult): void {
    if (!result) {
      throw new Error('IntentAnalysisResultが無効です');
    }

    if (!result.summary) {
      throw new Error('必須フィールドが不足しています: summary');
    }
  }

  /**
   * GapAnalysisResult検証
   */
  private validateGapAnalysisResult(result: GapAnalysisResult): void {
    if (!result) {
      throw new Error('GapAnalysisResultが無効です');
    }

    if (!result.summary) {
      throw new Error('必須フィールドが不足しています: summary');
    }
  }

  /**
   * 全体的なリスクレベル計算
   */
  private calculateOverallRiskLevel(taintResult: TaintAnalysisResult): string {
    const { highSeverity, mediumSeverity, lowSeverity } = taintResult.summary;
    
    if (highSeverity > 0) return 'HIGH';
    if (mediumSeverity > 0) return 'MEDIUM';
    if (lowSeverity > 0) return 'LOW';
    return 'NONE';
  }

  /**
   * セキュリティ影響の抽出
   */
  private extractSecurityImplications(intentResult: IntentAnalysisResult): string[] {
    return intentResult.testIntents.flatMap(intent => intent.securityRequirements);
  }

  /**
   * 結合リスク評価
   */
  private assessCombinedRisk(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): string {
    const intentRisk = intentResult.summary.highRiskTests > 0 ? 'HIGH' : 'LOW';
    const taintRisk = this.calculateOverallRiskLevel(taintResult);
    
    if (intentRisk === 'HIGH' || taintRisk === 'HIGH') return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * 結合リスクレベル計算
   */
  private calculateCombinedRiskLevel(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): string {
    return this.assessCombinedRisk(intentResult, taintResult);
  }

  /**
   * テストカバレッジ計算
   */
  private calculateTestCoverage(
    intentResult: IntentAnalysisResult,
    taintResult: TaintAnalysisResult
  ): number {
    const totalVulns = taintResult.summary.totalVulnerabilities;
    const coveredVulns = intentResult.testIntents.length;
    
    if (totalVulns === 0) return 100;
    return Math.min(100, (coveredVulns / totalVulns) * 100);
  }

  /**
   * セキュリティポスチャ評価
   */
  private evaluateSecurityPosture(
    intentResult: IntentAnalysisResult,
    taintResult: TaintAnalysisResult
  ): string {
    const coverage = this.calculateTestCoverage(intentResult, taintResult);
    
    if (coverage >= 80) return 'STRONG';
    if (coverage >= 60) return 'MODERATE';
    return 'WEAK';
  }

  /**
   * インテントリスクプロファイル分析
   */
  private analyzeIntentRiskProfile(intentResult: IntentAnalysisResult): string {
    const total = intentResult.summary.totalTests;
    const highRisk = intentResult.summary.highRiskTests;
    
    if (total === 0) return 'UNKNOWN';
    
    const riskRatio = highRisk / total;
    if (riskRatio >= 0.5) return 'HIGH_RISK_DOMINANT';
    if (riskRatio >= 0.2) return 'MIXED_RISK';
    return 'LOW_RISK_DOMINANT';
  }

  /**
   * テスティングコンプライアンス評価
   */
  private assessTestingCompliance(
    intentResult: IntentAnalysisResult,
    gapResult: GapAnalysisResult
  ): string {
    const criticalGaps = gapResult.summary.criticalGaps;
    const testCoverage = intentResult.summary.totalTests;
    
    if (criticalGaps === 0 && testCoverage > 0) return 'COMPLIANT';
    if (criticalGaps <= 2) return 'PARTIALLY_COMPLIANT';
    return 'NON_COMPLIANT';
  }

  /**
   * 脅威ランドスケープ分析
   */
  private analyzeThreatLandscape(
    taintResult: TaintAnalysisResult,
    gapResult: GapAnalysisResult
  ): string {
    const totalVulns = taintResult.summary.totalVulnerabilities;
    const criticalGaps = gapResult.summary.criticalGaps;
    
    if (totalVulns > 10 && criticalGaps > 3) return 'HIGH_THREAT';
    if (totalVulns > 5 || criticalGaps > 1) return 'MODERATE_THREAT';
    return 'LOW_THREAT';
  }

  /**
   * 攻撃表面計算
   */
  private calculateAttackSurface(
    taintResult: TaintAnalysisResult,
    intentResult: IntentAnalysisResult
  ): string {
    const vulnTypes = new Set(taintResult.vulnerabilities.map(v => v.type)).size;
    const testTypes = new Set(intentResult.testIntents.map((t: any) => t.riskLevel)).size;
    
    const complexity = vulnTypes + testTypes;
    
    if (complexity >= 8) return 'EXTENSIVE';
    if (complexity >= 4) return 'MODERATE';
    return 'LIMITED';
  }

  /**
   * 処理数更新
   */
  private updateProcessedCount(): void {
    this.healthStatus.processedCount++;
  }

  /**
   * 変換エラー処理
   */
  private handleTransformationError(error: unknown, operation: string): void {
    this.healthStatus.errorCount++;
    this.healthStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    if (this.healthStatus.errorCount > 10) {
      this.healthStatus.isHealthy = false;
    }
  }

  /**
   * 遅延ユーティリティ
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}