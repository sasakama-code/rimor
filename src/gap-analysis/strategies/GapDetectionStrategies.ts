/**
 * ギャップ検出戦略実装
 * TDD Refactor Phase - Strategy Patternの詳細実装
 * SOLID原則とデザインパターンによるコード品質向上
 */

import { 
  TaintAnalysisResult, 
  IntentAnalysisResult, 
  GapAnalysisResult,
  SecurityGap 
} from '../../orchestrator/types';
import { IGapDetectionStrategy, GapAnalysisConfig } from '../GapDetector';

/**
 * セマンティックギャップ検出戦略
 * 意味レベルでのギャップ検出を行う高度な戦略
 */
export class SemanticGapDetectionStrategy implements IGapDetectionStrategy {
  constructor(private config: GapAnalysisConfig) {}

  async analyze(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const analyzer = new SemanticAnalyzer(this.config);
    return await analyzer.performSemanticAnalysis(intentResult, taintResult);
  }

  getName(): string {
    return 'SemanticGapDetectionStrategy';
  }

  validate(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): boolean {
    return !!(intentResult?.testIntents && taintResult?.vulnerabilities);
  }
}

/**
 * リスクベースギャップ検出戦略
 * リスクレベルに基づいた重点的なギャップ検出
 */
export class RiskBasedGapDetectionStrategy implements IGapDetectionStrategy {
  constructor(private config: GapAnalysisConfig) {}

  async analyze(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const analyzer = new RiskAnalyzer(this.config);
    return await analyzer.performRiskBasedAnalysis(intentResult, taintResult);
  }

  getName(): string {
    return 'RiskBasedGapDetectionStrategy';
  }

  validate(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): boolean {
    return !!(intentResult?.summary && taintResult?.summary);
  }
}

/**
 * カバレッジベースギャップ検出戦略
 * テストカバレッジの観点からギャップを検出
 */
export class CoverageBasedGapDetectionStrategy implements IGapDetectionStrategy {
  constructor(private config: GapAnalysisConfig) {}

  async analyze(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const analyzer = new CoverageAnalyzer(this.config);
    return await analyzer.performCoverageAnalysis(intentResult, taintResult);
  }

  getName(): string {
    return 'CoverageBasedGapDetectionStrategy';
  }

  validate(intentResult: IntentAnalysisResult, taintResult: TaintAnalysisResult): boolean {
    return !!(intentResult?.testIntents && Array.isArray(intentResult.testIntents));
  }
}

/**
 * セマンティック分析器
 * Single Responsibility Principle: セマンティック分析のみを担当
 */
class SemanticAnalyzer {
  constructor(private config: GapAnalysisConfig) {}

  async performSemanticAnalysis(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const gaps: SecurityGap[] = [];
    
    // セマンティックマッチングによるギャップ検出
    const semanticMap = new SemanticMappingEngine();
    const mappings = semanticMap.analyzeMappings(intentResult.testIntents, taintResult.vulnerabilities);

    for (const mapping of mappings) {
      if (mapping.hasGap) {
        gaps.push({
          testName: mapping.testName,
          intention: mapping.expectedBehavior,
          actualImplementation: mapping.actualImplementation,
          riskLevel: mapping.riskLevel,
          recommendations: mapping.recommendations
        });
      }
    }

    return {
      gaps,
      summary: this.calculateSummary(gaps)
    };
  }

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

/**
 * リスク分析器
 * Single Responsibility Principle: リスクベース分析のみを担当
 */
class RiskAnalyzer {
  constructor(private config: GapAnalysisConfig) {}

  async performRiskBasedAnalysis(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const gaps: SecurityGap[] = [];
    
    // リスクレベルの不整合を検出
    for (const intent of intentResult.testIntents) {
      const relatedVulns = this.findRelatedVulnerabilities(intent, taintResult.vulnerabilities);
      
      for (const vuln of relatedVulns) {
        const riskGap = this.assessRiskGap(intent, vuln);
        if (riskGap) {
          gaps.push(riskGap);
        }
      }
    }

    return {
      gaps,
      summary: this.calculateSummary(gaps)
    };
  }

  private findRelatedVulnerabilities(intent: any, vulnerabilities: any[]): any[] {
    return vulnerabilities.filter(vuln =>
      intent.securityRequirements.some((req: string) =>
        this.isSemanticMatch(req, vuln.type)
      )
    );
  }

  private isSemanticMatch(requirement: string, vulnType: string): boolean {
    // セマンティックマッチングロジック
    const keywordMap: Record<string, string[]> = {
      'PATH_TRAVERSAL': ['パストラバーサル', 'ファイル', 'パス'],
      'SQL_INJECTION': ['SQLインジェクション', 'データベース', 'SQL'],
      'XSS': ['XSS', 'スクリプト', 'HTMLエスケープ'],
      'COMMAND_INJECTION': ['コマンド', '実行', 'シェル']
    };

    const keywords = keywordMap[vulnType] || [];
    return keywords.some(keyword => 
      requirement.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private assessRiskGap(intent: any, vuln: any): SecurityGap | null {
    const intentRisk = intent.riskLevel;
    const vulnRisk = this.mapSeverityToRiskLevel(vuln.severity);

    // リスク過小評価の検出
    if (this.isRiskUnderestimated(intentRisk, vulnRisk)) {
      return {
        testName: intent.testName,
        intention: `リスク評価: ${intentRisk}`,
        actualImplementation: `実際のリスク: ${vulnRisk} - 過小評価`,
        riskLevel: vulnRisk,
        recommendations: ['リスク評価の見直し', 'セキュリティテストの強化']
      };
    }

    return null;
  }

  private mapSeverityToRiskLevel(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  private isRiskUnderestimated(intentRisk: string, actualRisk: string): boolean {
    const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const intentIndex = riskOrder.indexOf(intentRisk.toUpperCase());
    const actualIndex = riskOrder.indexOf(actualRisk.toUpperCase());
    
    return actualIndex > intentIndex;
  }

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

/**
 * カバレッジ分析器
 * Single Responsibility Principle: カバレッジ分析のみを担当
 */
class CoverageAnalyzer {
  constructor(private config: GapAnalysisConfig) {}

  async performCoverageAnalysis(
    intentResult: IntentAnalysisResult, 
    taintResult: TaintAnalysisResult
  ): Promise<GapAnalysisResult> {
    const gaps: SecurityGap[] = [];
    
    // テストカバレッジのギャップを検出
    const uncoveredVulnerabilities = this.findUncoveredVulnerabilities(
      intentResult.testIntents, 
      taintResult.vulnerabilities
    );

    for (const vuln of uncoveredVulnerabilities) {
      gaps.push({
        testName: 'カバレッジ不足',
        intention: 'セキュリティ対策のテストカバレッジ',
        actualImplementation: `未カバーの脆弱性: ${vuln.type} - ${vuln.source.file}`,
        riskLevel: this.mapSeverityToRiskLevel(vuln.severity),
        recommendations: [
          `${vuln.type}対策のテスト追加`,
          'セキュリティテストカバレッジの向上'
        ]
      });
    }

    return {
      gaps,
      summary: this.calculateSummary(gaps)
    };
  }

  private findUncoveredVulnerabilities(testIntents: any[], vulnerabilities: any[]): any[] {
    return vulnerabilities.filter(vuln =>
      !testIntents.some(intent =>
        intent.securityRequirements.some((req: string) =>
          this.isRequirementRelatedToVulnerability(req, vuln.type)
        )
      )
    );
  }

  private isRequirementRelatedToVulnerability(requirement: string, vulnType: string): boolean {
    const relationMap: Record<string, string[]> = {
      'PATH_TRAVERSAL': ['パストラバーサル', 'ファイル', 'パス', 'ディレクトリ'],
      'SQL_INJECTION': ['SQLインジェクション', 'データベース', 'クエリ', 'SQL'],
      'XSS': ['XSS', 'クロスサイトスクリプティング', 'スクリプト', 'HTMLエスケープ'],
      'COMMAND_INJECTION': ['コマンドインジェクション', 'コマンド', '実行', 'シェル']
    };

    const keywords = relationMap[vulnType] || [];
    return keywords.some(keyword => 
      requirement.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private mapSeverityToRiskLevel(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }

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

/**
 * セマンティックマッピングエンジン
 * Open-Closed Principle: 新しいマッピングルールを追加可能
 */
class SemanticMappingEngine {
  analyzeMappings(testIntents: any[], vulnerabilities: any[]): any[] {
    const mappings: any[] = [];

    for (const intent of testIntents) {
      for (const vuln of vulnerabilities) {
        const mapping = this.createMapping(intent, vuln);
        if (mapping) {
          mappings.push(mapping);
        }
      }
    }

    return mappings;
  }

  private createMapping(intent: any, vuln: any): any | null {
    // セマンティックマッピングロジックの実装
    const hasRelation = intent.securityRequirements.some((req: string) =>
      this.isSemanticMatch(req, vuln.type)
    );

    if (hasRelation) {
      return {
        testName: intent.testName,
        expectedBehavior: intent.expectedBehavior,
        actualImplementation: `脆弱性検出: ${vuln.type} (${vuln.severity})`,
        hasGap: true,
        riskLevel: this.mapSeverityToRiskLevel(vuln.severity),
        recommendations: [`${vuln.type}対策の実装`, 'セキュリティテストの強化']
      };
    }

    return null;
  }

  private isSemanticMatch(requirement: string, vulnType: string): boolean {
    // セマンティックマッチングロジック
    const keywordMap: Record<string, string[]> = {
      'PATH_TRAVERSAL': ['パストラバーサル', 'ファイル', 'パス', 'ディレクトリ'],
      'SQL_INJECTION': ['SQLインジェクション', 'データベース', 'クエリ', 'SQL'],
      'XSS': ['XSS', 'クロスサイトスクリプティング', 'スクリプト', 'HTMLエスケープ'],
      'COMMAND_INJECTION': ['コマンドインジェクション', 'コマンド', '実行', 'シェル']
    };

    const keywords = keywordMap[vulnType] || [];
    return keywords.some(keyword => 
      requirement.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private mapSeverityToRiskLevel(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }
}

/**
 * ギャップ検出戦略ファクトリー
 * Factory Pattern: 戦略インスタンスの生成管理
 */
export class GapDetectionStrategyFactory {
  static createStrategy(
    strategyType: 'semantic' | 'risk-based' | 'coverage-based' | 'default',
    config: GapAnalysisConfig
  ): IGapDetectionStrategy {
    switch (strategyType) {
      case 'semantic':
        return new SemanticGapDetectionStrategy(config);
      case 'risk-based':
        return new RiskBasedGapDetectionStrategy(config);
      case 'coverage-based':
        return new CoverageBasedGapDetectionStrategy(config);
      case 'default':
      default:
        // デフォルト戦略はGapDetector内のDefaultGapDetectionStrategyを使用
        throw new Error('デフォルト戦略はGapDetectorで提供されます');
    }
  }

  static getAvailableStrategies(): string[] {
    return ['semantic', 'risk-based', 'coverage-based', 'default'];
  }
}