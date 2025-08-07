/**
 * UnifiedAIFormatterStrategy v0.9.0
 * 戦略パターンによるAI Formatter統合実装
 * 
 * SOLID原則に準拠した設計:
 * - Single Responsibility: AI向けフォーマット変換のみ
 * - Open/Closed: 新しい戦略の追加が可能
 * - Liskov Substitution: 全戦略が同じインターフェースを実装
 * - Interface Segregation: 必要最小限のインターフェース
 * - Dependency Inversion: 具象ではなく抽象に依存
 * 
 * DRY原則: 共通ロジックを基底クラスに集約
 * KISS原則: シンプルで理解しやすい戦略切り替え
 */

import { 
  UnifiedAnalysisResult, 
  AIJsonOutput, 
  UnifiedAIFormatterOptions,
  AIActionableRisk,
  ExecutiveSummary 
} from './types';

/**
 * フォーマット戦略インターフェース
 */
export interface FormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: UnifiedAIFormatterOptions): AIJsonOutput;
  formatAsync?(result: UnifiedAnalysisResult, options?: UnifiedAIFormatterOptions): Promise<AIJsonOutput>;
}

/**
 * 基本フォーマット戦略
 * unified-ai-formatter-base.tsの実装を統合
 */
class BaseFormattingStrategy implements FormattingStrategy {
  name = 'base';
  
  private readonly DEFAULT_MAX_RISKS = 10;
  private readonly DEFAULT_REPORT_PATH = '.rimor/reports/index.html';
  
  private readonly riskPriorityMap: Record<string, number> = {
    'CRITICAL': 5,
    'HIGH': 4,
    'MEDIUM': 3,
    'LOW': 2,
    'MINIMAL': 1
  };

  format(result: UnifiedAnalysisResult, options: UnifiedAIFormatterOptions = {}): AIJsonOutput {
    this.validateInput(result);
    
    const { summary, aiKeyRisks } = result;
    let filteredRisks = [...aiKeyRisks];
    
    // リスクレベルによるフィルタリング
    if (options.includeRiskLevels && options.includeRiskLevels.length > 0) {
      filteredRisks = filteredRisks.filter(risk => 
        options.includeRiskLevels!.includes(risk.riskLevel)
      );
    }
    
    // 優先順位でソート
    const sortedRisks = this.sortByPriority(filteredRisks);
    
    // 最大数制限
    const maxRisks = options.maxRisks || this.DEFAULT_MAX_RISKS;
    const limitedRisks = sortedRisks.slice(0, maxRisks);
    
    // AIJsonOutput形式に変換
    const keyRisks = limitedRisks.map(risk => ({
      problem: risk.problem,
      riskLevel: risk.riskLevel,
      context: {
        filePath: risk.filePath,
        codeSnippet: risk.context.codeSnippet,
        startLine: risk.context.startLine,
        endLine: risk.context.endLine
      },
      suggestedAction: risk.suggestedAction
    }));
    
    return {
      overallAssessment: this.generateOverallAssessment(summary, limitedRisks),
      keyRisks,
      fullReportUrl: options.htmlReportPath || this.DEFAULT_REPORT_PATH
    };
  }

  protected validateInput(result: UnifiedAnalysisResult): void {
    if (!result) {
      throw new Error('Invalid UnifiedAnalysisResult');
    }
    if (!result.summary || !result.aiKeyRisks) {
      throw new Error('Missing required fields');
    }
  }

  protected sortByPriority(risks: AIActionableRisk[]): AIActionableRisk[] {
    return [...risks].sort((a, b) => {
      const priorityA = this.riskPriorityMap[a.riskLevel] || 0;
      const priorityB = this.riskPriorityMap[b.riskLevel] || 0;
      return priorityB - priorityA;
    });
  }

  protected identifyTopIssues(risks: AIActionableRisk[]): string[] {
    return risks.slice(0, 3).map(risk => risk.problem || risk.title);
  }

  protected generateOverallAssessment(
    summary: ExecutiveSummary,
    risks: AIActionableRisk[]
  ): string {
    const { overallScore, overallGrade, statistics } = summary;
    
    let assessment = `プロジェクト品質評価結果:\n`;
    assessment += `総合スコア: ${overallScore}/100\n`;
    assessment += `グレード: ${overallGrade}\n\n`;
    
    if (!risks || risks.length === 0) {
      assessment += `問題は検出されませんでした。\n`;
      assessment += `優秀なコード品質が確認されました。`;
    } else {
      const riskCounts = statistics.riskCounts;
      if (riskCounts.CRITICAL > 0) {
        assessment += `CRITICAL: ${riskCounts.CRITICAL}件\n`;
      }
      if (riskCounts.HIGH > 0) {
        assessment += `HIGH: ${riskCounts.HIGH}件\n`;
      }
      if (riskCounts.MEDIUM > 0) {
        assessment += `MEDIUM: ${riskCounts.MEDIUM}件\n`;
      }
      if (riskCounts.LOW > 0) {
        assessment += `LOW: ${riskCounts.LOW}件\n`;
      }
    }
    
    return assessment;
  }

  protected generateContextualSummary(statistics: ExecutiveSummary['statistics']): string {
    if (!statistics) return 'プロジェクト統計情報なし';
    
    let summary = 'プロジェクト統計:\n';
    summary += `ファイル数: ${statistics.totalFiles}\n`;
    summary += `テスト数: ${statistics.totalTests || 0}\n`;
    
    return summary;
  }
}

/**
 * 最適化フォーマット戦略
 * unified-ai-formatter-optimized.tsの実装を統合
 */
class OptimizedFormattingStrategy extends BaseFormattingStrategy {
  name = 'optimized';

  format(result: UnifiedAnalysisResult, options: UnifiedAIFormatterOptions = {}): AIJsonOutput {
    this.validateInput(result);
    
    // メモリ効率的な処理
    const { summary, aiKeyRisks } = result;
    
    // 早期フィルタリングで処理量を削減
    let filteredRisks = aiKeyRisks;
    
    if (options.includeRiskLevels && options.includeRiskLevels.length > 0) {
      filteredRisks = aiKeyRisks.filter(risk => 
        options.includeRiskLevels!.includes(risk.riskLevel)
      );
    }
    
    // 最大数でカットして後続処理を軽減
    const maxRisks = Math.min(options.maxRisks || 10, 10);
    const topRisks = this.getTopRisksEfficiently(filteredRisks, maxRisks);
    
    // AIJsonOutput形式に変換
    const keyRisks = topRisks.map(risk => ({
      problem: risk.problem,
      riskLevel: risk.riskLevel,
      context: {
        filePath: risk.filePath,
        codeSnippet: risk.context.codeSnippet,
        startLine: risk.context.startLine,
        endLine: risk.context.endLine
      },
      suggestedAction: risk.suggestedAction
    }));
    
    return {
      overallAssessment: this.generateOptimizedAssessment(summary, topRisks),
      keyRisks,
      fullReportUrl: options.htmlReportPath || '.rimor/reports/index.html'
    };
  }

  private getTopRisksEfficiently(risks: AIActionableRisk[], maxCount: number): AIActionableRisk[] {
    // 優先度の高いものだけを効率的に抽出
    const criticalRisks = risks.filter(r => r.riskLevel === 'CRITICAL').slice(0, maxCount);
    if (criticalRisks.length >= maxCount) return criticalRisks;
    
    const highRisks = risks.filter(r => r.riskLevel === 'HIGH').slice(0, maxCount - criticalRisks.length);
    const combined = [...criticalRisks, ...highRisks];
    if (combined.length >= maxCount) return combined.slice(0, maxCount);
    
    const mediumRisks = risks.filter(r => r.riskLevel === 'MEDIUM').slice(0, maxCount - combined.length);
    return [...combined, ...mediumRisks].slice(0, maxCount);
  }

  private generateOptimizedAssessment(
    summary: ExecutiveSummary,
    risks: AIActionableRisk[]
  ): string {
    // 簡潔な評価メッセージ
    const { overallScore, overallGrade } = summary;
    
    if (risks.length === 0) {
      return `品質評価: ${overallGrade} (${overallScore}/100) - 問題なし`;
    }
    
    const criticalCount = risks.filter(r => r.riskLevel === 'CRITICAL').length;
    const highCount = risks.filter(r => r.riskLevel === 'HIGH').length;
    
    return `品質評価: ${overallGrade} (${overallScore}/100)\n` +
           `重要な問題: CRITICAL=${criticalCount}, HIGH=${highCount}`;
  }
}

/**
 * 並列処理フォーマット戦略
 * unified-ai-formatter-parallel.tsの実装を統合
 */
class ParallelFormattingStrategy extends BaseFormattingStrategy {
  name = 'parallel';

  async formatAsync(
    result: UnifiedAnalysisResult, 
    options: UnifiedAIFormatterOptions = {}
  ): Promise<AIJsonOutput> {
    this.validateInput(result);
    
    const { summary, aiKeyRisks } = result;
    
    // 並列処理タスク
    const [processedRisks, assessment] = await Promise.all([
      this.processRisksAsync(aiKeyRisks, options),
      this.generateAssessmentAsync(summary, aiKeyRisks)
    ]);
    
    // AIJsonOutput形式に変換
    const keyRisks = processedRisks.map(risk => ({
      problem: risk.problem,
      riskLevel: risk.riskLevel,
      context: {
        filePath: risk.filePath,
        codeSnippet: risk.context.codeSnippet,
        startLine: risk.context.startLine,
        endLine: risk.context.endLine
      },
      suggestedAction: risk.suggestedAction
    }));
    
    return {
      overallAssessment: assessment,
      keyRisks,
      fullReportUrl: options.htmlReportPath || '.rimor/reports/index.html'
    };
  }

  format(result: UnifiedAnalysisResult, options: UnifiedAIFormatterOptions = {}): AIJsonOutput {
    // 同期版は基本実装を使用
    return super.format(result, options);
  }

  private async processRisksAsync(
    risks: AIActionableRisk[], 
    options: UnifiedAIFormatterOptions
  ): Promise<AIActionableRisk[]> {
    return new Promise(resolve => {
      let filtered = risks;
      
      if (options.includeRiskLevels && options.includeRiskLevels.length > 0) {
        filtered = risks.filter(risk => 
          options.includeRiskLevels!.includes(risk.riskLevel)
        );
      }
      
      const sorted = this.sortByPriority(filtered);
      const limited = sorted.slice(0, options.maxRisks || 10);
      
      resolve(limited);
    });
  }

  private async generateAssessmentAsync(
    summary: ExecutiveSummary,
    risks: AIActionableRisk[]
  ): Promise<string> {
    return new Promise(resolve => {
      const assessment = this.generateOverallAssessment(summary, risks);
      resolve(assessment);
    });
  }

}

/**
 * 統合AI Formatterクラス（戦略パターン実装）
 */
export class UnifiedAIFormatterStrategy {
  private strategies: Map<string, FormattingStrategy>;
  private currentStrategy: FormattingStrategy;

  constructor() {
    this.strategies = new Map();
    
    // デフォルト戦略の登録
    this.registerStrategy(new BaseFormattingStrategy());
    this.registerStrategy(new OptimizedFormattingStrategy());
    this.registerStrategy(new ParallelFormattingStrategy());
    
    // デフォルトはBase戦略
    this.currentStrategy = this.strategies.get('base')!;
  }

  /**
   * 戦略の登録
   */
  registerStrategy(strategy: FormattingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * 戦略の切り替え
   */
  setStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Invalid strategy: ${strategyName}`);
    }
    this.currentStrategy = strategy;
  }

  /**
   * 利用可能な戦略の取得
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * フォーマット実行（同期）
   */
  format(result: UnifiedAnalysisResult, options?: UnifiedAIFormatterOptions): AIJsonOutput {
    return this.currentStrategy.format(result, options);
  }

  /**
   * フォーマット実行（非同期）
   */
  async formatAsync(result: UnifiedAnalysisResult, options?: UnifiedAIFormatterOptions): Promise<AIJsonOutput> {
    if (this.currentStrategy.formatAsync) {
      return this.currentStrategy.formatAsync(result, options);
    }
    // 非同期メソッドがない場合は同期版を使用
    return Promise.resolve(this.currentStrategy.format(result, options));
  }

  /**
   * バッチ処理（複数結果の並列処理）
   */
  async formatBatch(
    results: UnifiedAnalysisResult[], 
    options?: UnifiedAIFormatterOptions
  ): Promise<AIJsonOutput[]> {
    return Promise.all(
      results.map(result => this.formatAsync(result, options))
    );
  }
}