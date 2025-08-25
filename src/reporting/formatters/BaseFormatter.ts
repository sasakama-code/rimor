/**
 * BaseFormatter
 * v0.9.0 - Issue #64: REFACTOR段階
 * Martin Fowlerの手法による共通ロジックの抽出
 * 
 * SOLID原則: 単一責任（基本フォーマット機能）
 * DRY原則: 共通ロジックの一元化
 * Template Methodパターン: 共通処理とカスタマイズポイントの分離
 */

import { IFormattingStrategy } from '../core/types';
import { 
  UnifiedAnalysisResult, 
  RiskLevel,
  AIActionableRisk,
  ExecutiveSummary 
} from '../../nist/types/unified-analysis-result';

/**
 * フォーマッター基底クラス
 * Martin Fowlerの「Pull Up Method」リファクタリング適用
 */
export abstract class BaseFormatter implements IFormattingStrategy {
  abstract name: string;
  
  // リスクレベルの優先度マップ（共通）
  protected readonly riskPriorityMap: Record<string, number> = {
    'CRITICAL': 5,
    'HIGH': 4,
    'MEDIUM': 3,
    'LOW': 2,
    'MINIMAL': 1
  };

  // リスクレベルのラベル（共通）
  protected readonly riskLevelLabels: Record<string, string> = {
    'CRITICAL': 'CRITICAL',
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW',
    'MINIMAL': 'MINIMAL'
  };

  /**
   * Template Methodパターン: フォーマット処理の共通フロー
   */
  format(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string | object {
    // 入力検証（共通）
    this.validateInput(result);
    
    // 前処理（オプション）
    const preprocessed = this.preprocess(result, options);
    
    // 具体的なフォーマット処理（サブクラスで実装）
    const formatted = this.doFormat(preprocessed, options);
    
    // 後処理（オプション）
    return this.postprocess(formatted, options) as string | object;
  }

  /**
   * 非同期版のフォーマット処理
   */
  async formatAsync(result: UnifiedAnalysisResult, options?: Record<string, unknown>): Promise<string | object> {
    return this.format(result, options);
  }

  /**
   * 入力検証（共通）
   * Defensive Programming: 不正な入力を早期に検出
   */
  protected validateInput(result: UnifiedAnalysisResult): void {
    if (!result) {
      throw new Error('Invalid analysis result: result is null or undefined');
    }
    
    if (!result.summary) {
      throw new Error('Invalid analysis result: summary is missing');
    }
    
    if (!result.schemaVersion) {
      throw new Error('Invalid analysis result: schemaVersion is missing');
    }
  }

  /**
   * 前処理（オプション、サブクラスでオーバーライド可能）
   */
  protected preprocess(result: UnifiedAnalysisResult, options?: Record<string, unknown>): UnifiedAnalysisResult {
    return result;
  }

  /**
   * 具体的なフォーマット処理（サブクラスで実装必須）
   * Template Methodパターンの抽象メソッド
   */
  protected abstract doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string | object;

  /**
   * 後処理（オプション、サブクラスでオーバーライド可能）
   */
  protected postprocess(formatted: string | object, options?: Record<string, unknown>): string | object {
    return formatted;
  }

  /**
   * リスクのソート（共通）
   * Martin Fowlerの「Extract Method」リファクタリング適用
   */
  protected sortRisksByPriority(risks: AIActionableRisk[]): AIActionableRisk[] {
    return [...risks].sort((a, b) => {
      const priorityA = this.riskPriorityMap[a.riskLevel] || 0;
      const priorityB = this.riskPriorityMap[b.riskLevel] || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * リスクのフィルタリング（共通）
   */
  protected filterRisksByLevel(
    risks: AIActionableRisk[], 
    levels?: string[]
  ): AIActionableRisk[] {
    if (!levels || levels.length === 0) {
      return risks;
    }
    
    return risks.filter(risk => levels.includes(risk.riskLevel));
  }

  /**
   * リスク統計の計算（共通）
   */
  protected calculateRiskStatistics(risks: AIActionableRisk[]): Record<string, number> {
    const stats: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      MINIMAL: 0
    };
    
    risks.forEach(risk => {
      if (stats[risk.riskLevel] !== undefined) {
        stats[risk.riskLevel]++;
      }
    });
    
    return stats;
  }

  /**
   * サマリー情報のフォーマット（共通）
   */
  protected formatSummaryInfo(summary: ExecutiveSummary): {
    score: number;
    grade: string;
    fileCount: number;
    testCount: number;
  } {
    return {
      score: summary.overallScore,
      grade: summary.overallGrade,
      fileCount: summary.statistics.totalFiles,
      testCount: summary.statistics.totalTests || 0
    };
  }

  /**
   * リスクレベルのテキスト表現を取得（共通）
   */
  protected getRiskLevelText(level: RiskLevel | string): string {
    return this.riskLevelLabels[level] || level;
  }

  /**
   * 推奨アクションのフォーマット（共通）
   */
  protected formatSuggestedAction(action: unknown): string {
    if (!action) {
      return '改善アクションの検討が必要です';
    }
    
    if (typeof action === 'string') {
      return action;
    }
    
    const actionObj = action as any;
    if (actionObj && actionObj.description) {
      return actionObj.description;
    }
    
    return JSON.stringify(action);
  }

  /**
   * タイムスタンプの生成（共通）
   */
  protected generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * ローカライズされた日時の生成（共通）
   */
  protected generateLocalizedDateTime(locale: string = 'ja-JP'): string {
    return new Date().toLocaleString(locale);
  }

  /**
   * HTMLエスケープ（HTML系フォーマッター用）
   */
  protected escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
  }

  /**
   * 最大リスク数の取得（共通）
   */
  protected getMaxRisks(options?: Record<string, unknown>): number {
    const maxRisks = (options?.maxRisks as number) || 10;
    return Math.min(maxRisks, 100); // 最大100件に制限
  }
}