/**
 * ExecutiveSummaryFormatter
 * v0.9.0 - Issue #64: レポートシステムの統合
 * REFACTOR段階: BaseFormatterを継承
 * 
 * SOLID原則: 単一責任（エグゼクティブサマリー生成のみ）
 * DRY原則: 共通ロジックをBaseFormatterに委譲
 * KISS原則: シンプルなサマリー生成
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { BaseFormatter } from './BaseFormatter';
import { 
  UnifiedAnalysisResult, 
  ExecutiveSummary,
  RiskLevel 
} from '../../nist/types/unified-analysis-result';

/**
 * エグゼクティブサマリー形式のフォーマッター
 * ExecutiveSummaryGeneratorの機能を統合
 */
export class ExecutiveSummaryFormatter extends BaseFormatter {
  name = 'executive-summary';

  /**
   * エグゼクティブサマリー形式でレポートを生成
   * Template Methodパターンの具体実装
   */
  protected doFormat(result: UnifiedAnalysisResult, options?: any): any {

    // 主要な推奨事項を生成
    const recommendations = this.generateRecommendations(result);
    
    // エグゼクティブサマリーを構築
    const executiveSummary: ExecutiveSummary = {
      overallScore: result.summary.overallScore,
      overallGrade: result.summary.overallGrade,
      statistics: result.summary.statistics,
      dimensions: result.summary.dimensions || []
    };

    // 重要なメトリクスを追加
    const keyMetrics = this.extractKeyMetrics(result);
    
    // リスクのサマリーを生成
    const riskSummary = this.generateRiskSummary(result);
    
    // アクションアイテムを生成
    const actionItems = this.generateActionItems(result);

    return {
      executiveSummary,
      keyMetrics,
      riskSummary,
      actionItems,
      recommendations
    };
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(result: UnifiedAnalysisResult): string[] {
    const recommendations: string[] = [];
    const { summary, aiKeyRisks = [] } = result;
    
    // スコアに基づく推奨事項
    if (summary.overallScore < 60) {
      recommendations.push('プロジェクト全体の品質改善が急務です');
    } else if (summary.overallScore < 80) {
      recommendations.push('段階的な品質改善を進めることを推奨します');
    } else {
      recommendations.push('現在の品質レベルを維持しつつ、さらなる改善を図りましょう');
    }
    
    // CRITICALリスクへの対応
    const criticalCount = summary.statistics.riskCounts.CRITICAL;
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount}件のCRITICALリスクへの即座の対応が必要です`);
    }
    
    // HIGHリスクへの対応
    const highCount = summary.statistics.riskCounts.HIGH;
    if (highCount > 0) {
      recommendations.push(`${highCount}件のHIGHリスクを優先的に解決してください`);
    }
    
    // テストカバレッジに関する推奨
    const testRatio = summary.statistics.totalTests / summary.statistics.totalFiles;
    if (testRatio < 0.5) {
      recommendations.push('テストカバレッジの大幅な改善が必要です');
    } else if (testRatio < 1.0) {
      recommendations.push('テストカバレッジをさらに向上させることを推奨します');
    }
    
    // ディメンション評価に基づく推奨
    if (summary.dimensions) {
      const dimensions = Array.isArray(summary.dimensions) 
        ? summary.dimensions
        : Object.entries(summary.dimensions as any).map(([name, data]) => ({
            name,
            ...(data as any)
          }));
      
      dimensions.forEach((dimension: any) => {
        const score = dimension.score || dimension[dimension.name]?.score;
        const name = dimension.name || Object.keys(dimension)[0];
        
        if (score < 70) {
          recommendations.push(`${name}の品質向上に注力してください（現在のスコア: ${score}）`);
        }
      });
    }
    
    return recommendations;
  }

  /**
   * 主要メトリクスを抽出
   */
  private extractKeyMetrics(result: UnifiedAnalysisResult): Record<string, any> {
    const { summary } = result;
    
    return {
      totalFiles: summary.statistics.totalFiles,
      totalTests: summary.statistics.totalTests || 0,
      testCoverageRatio: ((summary.statistics.totalTests || 0) / summary.statistics.totalFiles * 100).toFixed(1) + '%',
      totalRisks: Object.values(summary.statistics.riskCounts).reduce((sum, count) => sum + count, 0),
      criticalRisks: summary.statistics.riskCounts.CRITICAL,
      highRisks: summary.statistics.riskCounts.HIGH,
      overallScore: summary.overallScore,
      overallGrade: summary.overallGrade
    };
  }

  /**
   * リスクサマリーを生成
   */
  private generateRiskSummary(result: UnifiedAnalysisResult): any {
    const { aiKeyRisks = [] } = result;
    
    // リスクをカテゴリー別に分類
    const risksByCategory: Record<string, any[]> = {};
    
    aiKeyRisks.forEach(risk => {
      const category = this.categorizeRisk(risk);
      if (!risksByCategory[category]) {
        risksByCategory[category] = [];
      }
      risksByCategory[category].push({
        title: risk.title || risk.problem,
        level: risk.riskLevel,
        file: risk.filePath
      });
    });
    
    // トップ3の問題領域を特定
    const topProblematicAreas = Object.entries(risksByCategory)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([category, risks]) => ({
        category,
        riskCount: risks.length,
        examples: risks.slice(0, 2)
      }));
    
    return {
      totalRisks: aiKeyRisks.length,
      byCategory: risksByCategory,
      topProblematicAreas
    };
  }

  /**
   * アクションアイテムを生成
   */
  private generateActionItems(result: UnifiedAnalysisResult): string[] {
    const actions: string[] = [];
    const { summary, aiKeyRisks = [] } = result;
    
    // 優先度順にアクションを追加
    
    // 1. CRITICALリスクの対応
    const criticalRisks = aiKeyRisks.filter(r => r.riskLevel === CoreTypes.RiskLevel.CRITICAL);
    criticalRisks.slice(0, 3).forEach(risk => {
      const action = typeof risk.suggestedAction === 'string' 
        ? risk.suggestedAction 
        : risk.suggestedAction?.description;
      if (action) {
        actions.push(`[CRITICAL] ${action}`);
      }
    });
    
    // 2. HIGHリスクの対応
    const highRisks = aiKeyRisks.filter(r => r.riskLevel === CoreTypes.RiskLevel.HIGH);
    highRisks.slice(0, 2).forEach(risk => {
      const action = typeof risk.suggestedAction === 'string' 
        ? risk.suggestedAction 
        : risk.suggestedAction?.description;
      if (action) {
        actions.push(`[HIGH] ${action}`);
      }
    });
    
    // 3. 全体的な改善アクション
    if (summary.overallScore < 70) {
      actions.push('コードレビュープロセスの強化を検討してください');
    }
    
    if ((summary.statistics.totalTests || 0) < summary.statistics.totalFiles * 0.5) {
      actions.push('単体テストの追加を優先的に実施してください');
    }
    
    return actions.slice(0, 10); // 最大10個のアクション
  }

  /**
   * リスクをカテゴリー分類
   */
  private categorizeRisk(risk: any): string {
    const filePath = risk.filePath.toLowerCase();
    
    if (filePath.includes('test') || filePath.includes('spec')) {
      return 'テスト関連';
    }
    if (filePath.includes('security') || filePath.includes('auth')) {
      return 'セキュリティ関連';
    }
    if (filePath.includes('api') || filePath.includes('endpoint')) {
      return 'API関連';
    }
    if (filePath.includes('database') || filePath.includes('model')) {
      return 'データベース関連';
    }
    if (filePath.includes('util') || filePath.includes('helper')) {
      return 'ユーティリティ関連';
    }
    if (filePath.includes('config')) {
      return '設定関連';
    }
    
    return 'その他';
  }
}