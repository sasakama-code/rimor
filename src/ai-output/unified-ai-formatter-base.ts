/**
 * UnifiedAIFormatterBase
 * v0.9.0 - DRY原則適用のための共通ベースクラス
 * 
 * TDD Green Phase: テストを通過させる実装
 * Martin Fowlerの推奨するExtract Superclassパターンの適用
 */

import { UnifiedAnalysisResult, AIJsonOutput, AIActionableRisk } from './types';

/**
 * UnifiedAIFormatterファミリーの共通基底クラス
 * DRY原則に従い、重複コードを排除
 */
export abstract class UnifiedAIFormatterBase {
  /**
   * 共通定数
   */
  readonly DEFAULT_MAX_RISKS = 10;
  readonly DEFAULT_REPORT_PATH = '.rimor/reports/index.html';

  /**
   * リスクレベルの優先順位マップ
   */
  protected readonly riskPriorityMap: Record<string, number> = {
    'CRITICAL': 5,
    'HIGH': 4,
    'MEDIUM': 3,
    'LOW': 2,
    'MINIMAL': 1
  };

  /**
   * 入力検証（Defensive Programming）
   */
  protected validateInput(result: UnifiedAnalysisResult): void {
    if (!result) {
      throw new Error('Invalid UnifiedAnalysisResult');
    }
    if (!result.summary || !result.aiKeyRisks) {
      throw new Error('Missing required fields');
    }
  }

  /**
   * リスクが存在しないかチェック
   */
  protected hasNoRisks(keyRisks: AIActionableRisk[]): boolean {
    return !keyRisks || keyRisks.length === 0;
  }

  /**
   * 上位の問題を特定
   */
  protected identifyTopIssues(keyRisks: AIActionableRisk[]): string[] {
    return keyRisks.slice(0, 3).map(risk => risk.problem);
  }

  /**
   * リスクを優先順位でソート
   */
  protected sortByPriority(risks: AIActionableRisk[]): AIActionableRisk[] {
    return [...risks].sort((a, b) => {
      const priorityA = this.riskPriorityMap[a.riskLevel] || 0;
      const priorityB = this.riskPriorityMap[b.riskLevel] || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * 全体評価メッセージの生成
   * Template Methodパターンの適用
   */
  protected generateOverallAssessment(
    summary: UnifiedAnalysisResult['summary'],
    keyRisks: AIActionableRisk[]
  ): string {
    const { overallScore, overallGrade, statistics } = summary;
    
    let assessment = `プロジェクト品質評価結果:\n`;
    assessment += `総合スコア: ${overallScore}/100\n`;
    assessment += `グレード: ${overallGrade}\n\n`;
    
    if (this.hasNoRisks(keyRisks)) {
      assessment += `問題は検出されませんでした。\n`;
      assessment += `優秀なコード品質が確認されました。`;
    } else {
      // リスクレベル別の集計（テストとの互換性のため英語表記）
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
      
      // 上位の問題を特定
      const topIssues = this.identifyTopIssues(keyRisks);
      if (topIssues.length > 0) {
        assessment += `\n最重要問題:\n`;
        topIssues.forEach((issue, index) => {
          assessment += `${index + 1}. ${issue}\n`;
        });
      }
    }
    
    return assessment;
  }

  /**
   * キーリスクの生成
   * Template Methodパターンの適用
   */
  protected generateKeyRisks(
    keyRisks: AIActionableRisk[],
    maxRisks: number = this.DEFAULT_MAX_RISKS
  ): AIJsonOutput['keyRisks'] {
    // 優先順位でソート
    const sortedRisks = this.sortByPriority(keyRisks);
    
    // 最大数に制限
    const limitedRisks = sortedRisks.slice(0, maxRisks);
    
    // AIJsonOutput形式に変換
    return limitedRisks.map(risk => ({
      problem: risk.problem,
      riskLevel: risk.riskLevel,
      context: {
        filePath: risk.filePath,
        codeSnippet: risk.context.codeSnippet,
        startLine: risk.context.startLine,
        endLine: risk.context.endLine
      },
      suggestedAction: {
        type: risk.suggestedAction.type,
        description: risk.suggestedAction.description,
        example: risk.suggestedAction.example
      }
    }));
  }

  /**
   * レポートURLの生成
   * Template Methodパターンの適用
   */
  protected generateReportUrl(customPath?: string): string {
    return customPath || this.DEFAULT_REPORT_PATH;
  }

  /**
   * 内部的なフォーマット処理
   * 継承クラスから呼び出し可能
   */
  protected formatAsAIJsonInternal(
    result: UnifiedAnalysisResult,
    options?: { htmlReportPath?: string; maxRisks?: number }
  ): AIJsonOutput {
    // 入力検証
    this.validateInput(result);
    
    const { summary, aiKeyRisks } = result;
    
    // 全体評価の生成
    const overallAssessment = this.generateOverallAssessment(summary, aiKeyRisks);
    
    // キーリスクの生成
    const keyRisks = this.generateKeyRisks(
      aiKeyRisks,
      options?.maxRisks || this.DEFAULT_MAX_RISKS
    );
    
    // レポートURLの生成
    const fullReportUrl = this.generateReportUrl(options?.htmlReportPath);
    
    return {
      overallAssessment,
      keyRisks,
      fullReportUrl
    };
  }

  /**
   * 抽象メソッド：各継承クラスで実装
   * 継承クラスではasync版も実装可能
   */
  abstract formatAsAIJson(result: UnifiedAnalysisResult): AIJsonOutput | Promise<AIJsonOutput>;
}