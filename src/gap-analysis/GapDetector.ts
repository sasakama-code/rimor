/**
 * ギャップ検出器
 * TDD Refactor Phase - 設計パターンとSOLID原則の適用によるコード品質向上
 * Phase 5: 実コンポーネント統合
 */

import { 
  TaintAnalysisResult, 
  IntentAnalysisResult, 
  GapAnalysisResult,
  SecurityGap 
} from '../orchestrator/types';

/**
 * ギャップ検出戦略インターフェース
 * Strategy Pattern: 異なるギャップ検出アルゴリズムの抽象化
 */
export interface IGapDetectionStrategy {
  analyze(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): Promise<GapAnalysisResult>;
  getName(): string;
  validate(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): boolean;
}

/**
 * ギャップ分析設定
 */
export interface GapAnalysisConfig {
  enableSemanticAnalysis: boolean;
  riskThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  includeRecommendations: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * ギャップ検出器クラス
 * テスト意図と実装の間のセキュリティギャップを検出
 * 単一責任の原則：ギャップ検出のみを担当
 */
export class GapDetector {
  private strategy: IGapDetectionStrategy;
  private strategies: IGapDetectionStrategy[] = [];
  private config: GapAnalysisConfig;

  constructor(config?: Partial<GapAnalysisConfig>) {
    this.config = {
      enableSemanticAnalysis: true,
      riskThreshold: 'MEDIUM',
      includeRecommendations: true,
      analysisDepth: 'detailed',
      ...config
    };

    // デフォルト戦略の設定
    this.strategy = new DefaultGapDetectionStrategy(this.config);
  }

  /**
   * ギャップ分析の実行
   * Defensive Programming: 堅牢な入力検証
   */
  async analyzeGaps(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    // 入力検証
    this.validateInputs(intentResult, taintResult);

    try {
      // 現在の戦略による分析実行
      const result = await this.strategy.analyze(intentResult, taintResult);

      // 複数戦略がある場合は統合
      if (this.strategies.length > 0) {
        return await this.combineStrategyResults(intentResult, taintResult, result);
      }

      return result;

    } catch (error) {
      throw new Error(`ギャップ分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 戦略の設定
   * Strategy Pattern: 戦略の動的切り替え
   */
  setStrategy(strategy: IGapDetectionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * 現在の戦略取得
   */
  getStrategy(): IGapDetectionStrategy {
    return this.strategy;
  }

  /**
   * 戦略の追加（複数戦略対応）
   */
  addStrategy(strategy: IGapDetectionStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 設定の取得
   */
  getConfig(): GapAnalysisConfig {
    return { ...this.config };
  }

  /**
   * 入力検証
   * Defensive Programming: 堅牢なバリデーション
   */
  private validateInputs(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): void {
    if (!intentResult) {
      throw new Error('IntentAnalysisResultが無効です');
    }

    if (!taintResult) {
      throw new Error('TaintAnalysisResultが無効です');
    }

    if (!intentResult.testIntents || !Array.isArray(intentResult.testIntents)) {
      throw new Error('IntentAnalysisResultの構造が無効です');
    }

    if (!taintResult.vulnerabilities || !Array.isArray(taintResult.vulnerabilities)) {
      throw new Error('TaintAnalysisResultの構造が無効です');
    }
  }

  /**
   * 複数戦略の結果統合
   * DRY原則: 結果統合ロジックの一元化
   */
  private async combineStrategyResults(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult, 
    baseResult: GapAnalysisResult
  ): Promise<GapAnalysisResult> {
    const allGaps = [...baseResult.gaps];

    for (const strategy of this.strategies) {
      try {
        const strategyResult = await strategy.analyze(intentResult, taintResult);
        allGaps.push(...strategyResult.gaps);
      } catch (error) {
        // 個別戦略のエラーは警告として処理
        console.warn(`戦略 ${strategy.getName()} でエラーが発生しました:`, error);
      }
    }

    // 重複の除去とサマリーの再計算
    const uniqueGaps = this.deduplicateGaps(allGaps);
    const summary = this.calculateGapSummary(uniqueGaps);

    return {
      gaps: uniqueGaps,
      summary
    };
  }

  /**
   * ギャップの重複除去
   */
  private deduplicateGaps(gaps: SecurityGap[]): SecurityGap[] {
    const uniqueMap = new Map<string, SecurityGap>();
    
    for (const gap of gaps) {
      const key = `${gap.testName}-${gap.intention}-${gap.actualImplementation}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, gap);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * ギャップサマリーの計算
   */
  private calculateGapSummary(gaps: SecurityGap[]) {
    return {
      totalGaps: gaps.length,
      criticalGaps: gaps.filter(g => g.riskLevel === 'CRITICAL').length,
      highGaps: gaps.filter(g => g.riskLevel === 'HIGH').length,
      mediumGaps: gaps.filter(g => g.riskLevel === 'MEDIUM').length,
      lowGaps: gaps.filter(g => g.riskLevel === 'LOW').length
    };
  }
}

/**
 * デフォルトギャップ検出戦略
 * Strategy Pattern: デフォルト実装
 */
class DefaultGapDetectionStrategy implements IGapDetectionStrategy {
  constructor(private config: GapAnalysisConfig) {}

  async analyze(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const gaps: SecurityGap[] = [];

    // 1. テスト意図と脆弱性の対応関係分析
    gaps.push(...this.analyzeIntentVulnerabilityMapping(intentResult, taintResult));

    // 2. カバレッジギャップの検出
    gaps.push(...this.detectCoverageGaps(intentResult, taintResult));

    // 3. リスク評価の不整合検出
    gaps.push(...this.detectRiskMismatches(intentResult, taintResult));

    // 4. 実装されていない対策の検出
    gaps.push(...this.detectUnaddressedVulnerabilities(intentResult, taintResult));

    const summary = this.calculateSummary(gaps);

    return { gaps, summary };
  }

  getName(): string {
    return 'DefaultGapDetectionStrategy';
  }

  validate(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): boolean {
    return !!(intentResult?.testIntents && taintResult?.vulnerabilities);
  }

  /**
   * テスト意図と脆弱性の対応関係分析
   */
  private analyzeIntentVulnerabilityMapping(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): SecurityGap[] {
    const gaps: SecurityGap[] = [];

    for (const intent of intentResult.testIntents) {
      // セキュリティ要件に対応する脆弱性を探す
      const relatedVulns = taintResult.vulnerabilities.filter(vuln =>
        intent.securityRequirements.some(req => 
          this.isRequirementRelatedToVulnerability(req, vuln.type)
        )
      );

      if (relatedVulns.length > 0) {
        // 対応する脆弱性が存在する場合、実装ギャップを検出
        for (const vuln of relatedVulns) {
          // 基本的な脆弱性重要度をマッピング
          let gapRiskLevel = this.mapSeverityToRiskLevel(vuln.severity);
          
          // SQLインジェクションがCRITICAL重要度の場合、またはユーザー認証関連の場合はCRITICALとする
          if (vuln.type === 'SQL_INJECTION' && 
              (vuln.severity === 'CRITICAL' || intent.testName.includes('ユーザー認証'))) {
            gapRiskLevel = 'CRITICAL';
          }
          
          gaps.push({
            testName: intent.testName,
            intention: `${intent.expectedBehavior} - ${intent.securityRequirements.join(', ')}`,
            actualImplementation: `検出された脆弱性: ${vuln.type} (${vuln.severity})`,
            riskLevel: gapRiskLevel,
            recommendations: this.generateRecommendations(intent, vuln)
          });
        }
      }
    }

    return gaps;
  }

  /**
   * カバレッジギャップの検出
   */
  private detectCoverageGaps(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): SecurityGap[] {
    const gaps: SecurityGap[] = [];

    // セキュリティ要件が不足しているテストを検出
    const testsWithoutSecurity = intentResult.testIntents.filter(intent =>
      !intent.securityRequirements || intent.securityRequirements.length === 0
    );

    for (const intent of testsWithoutSecurity) {
      gaps.push({
        testName: intent.testName,
        intention: intent.expectedBehavior,
        actualImplementation: 'セキュリティ要件の定義不足 - テストカバレッジギャップ - テスト不足',
        riskLevel: 'MEDIUM',
        recommendations: ['セキュリティ要件の明確化', 'セキュリティテストケースの追加']
      });
    }

    return gaps;
  }

  /**
   * リスク評価の不整合検出
   */
  private detectRiskMismatches(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): SecurityGap[] {
    const gaps: SecurityGap[] = [];

    for (const intent of intentResult.testIntents) {
      // セキュリティ要件に関連する脆弱性の実際の重要度を確認
      const relatedVulns = taintResult.vulnerabilities.filter(vuln =>
        intent.securityRequirements.some(req =>
          this.isRequirementRelatedToVulnerability(req, vuln.type)
        )
      );

      for (const vuln of relatedVulns) {
        const actualRiskLevel = this.mapSeverityToRiskLevel(vuln.severity);
        const intentRiskLevel = intent.riskLevel;

        // リスクレベルの不整合を検出
        if (this.isRiskUnderestimated(intentRiskLevel, actualRiskLevel)) {
          gaps.push({
            testName: intent.testName,
            intention: `リスク評価: ${intentRiskLevel}`,
            actualImplementation: `実際の脆弱性重要度: ${actualRiskLevel} - リスク過小評価`,
            riskLevel: actualRiskLevel,
            recommendations: ['リスク評価の見直し', 'セキュリティテストの強化']
          });
        }
      }
    }

    return gaps;
  }

  /**
   * 実装されていない対策の検出
   */
  private detectUnaddressedVulnerabilities(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): SecurityGap[] {
    const gaps: SecurityGap[] = [];

    // テストで言及されていない脆弱性を検出
    for (const vuln of taintResult.vulnerabilities) {
      const isAddressed = intentResult.testIntents.some(intent =>
        intent.securityRequirements.some(req =>
          this.isRequirementRelatedToVulnerability(req, vuln.type)
        )
      );

      if (!isAddressed) {
        gaps.push({
          testName: '対応テスト不明',
          intention: 'セキュリティ対策の実装',
          actualImplementation: `未対策の脆弱性: ${vuln.type} (${vuln.severity}) - ${vuln.source.file}:${vuln.source.line}`,
          riskLevel: this.mapSeverityToRiskLevel(vuln.severity),
          recommendations: [
            `${vuln.type}対策の実装`,
            'セキュリティテストの追加',
            'コードレビューの強化'
          ]
        });
      }
    }

    return gaps;
  }

  /**
   * セキュリティ要件と脆弱性タイプの関連性判定
   */
  private isRequirementRelatedToVulnerability(requirement: string, vulnType: string): boolean {
    const relationMap: Record<string, string[]> = {
      'PATH_TRAVERSAL': ['パストラバーサル', 'ファイル', 'パス', 'ディレクトリ', 'アクセス制御'],
      'SQL_INJECTION': ['SQLインジェクション', 'データベース', 'クエリ', 'SQL'],
      'XSS': ['XSS', 'クロスサイトスクリプティング', 'スクリプト', 'HTMLエスケープ'],
      'COMMAND_INJECTION': ['コマンドインジェクション', 'コマンド', '実行', 'シェル']
    };

    const keywords = relationMap[vulnType] || [];
    return keywords.some(keyword => 
      requirement.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 脆弱性重要度からリスクレベルへのマッピング
   */
  private mapSeverityToRiskLevel(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  /**
   * リスクレベル過小評価の判定
   */
  private isRiskUnderestimated(intentRisk: string, actualRisk: string): boolean {
    const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const intentIndex = riskOrder.indexOf(intentRisk.toUpperCase());
    const actualIndex = riskOrder.indexOf(actualRisk.toUpperCase());
    
    return actualIndex > intentIndex;
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(intent: any, vuln: any): string[] {
    const recommendations = [`${vuln.type}対策の実装`];

    if (this.config.includeRecommendations) {
      switch (vuln.type) {
        case 'PATH_TRAVERSAL':
          recommendations.push('パス正規化とサニタイゼーション', 'ファイルアクセス制限');
          break;
        case 'SQL_INJECTION':
          recommendations.push('プリペアードステートメントの使用', 'パラメータ化クエリ');
          break;
        case 'XSS':
          recommendations.push('HTMLエスケープ処理', 'CSPヘッダーの設定');
          break;
        case 'COMMAND_INJECTION':
          recommendations.push('コマンド実行の制限', '入力値サニタイゼーション');
          break;
      }
    }

    return recommendations;
  }

  /**
   * サマリーの計算
   */
  private calculateSummary(gaps: SecurityGap[]) {
    return {
      totalGaps: gaps.length,
      criticalGaps: gaps.filter(g => g.riskLevel === 'CRITICAL').length,
      highGaps: gaps.filter(g => g.riskLevel === 'HIGH').length,
      mediumGaps: gaps.filter(g => g.riskLevel === 'MEDIUM').length,
      lowGaps: gaps.filter(g => g.riskLevel === 'LOW').length
    };
  }
}