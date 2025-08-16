/**
 * RiskLevel ヘルパー関数
 * グローバルに利用可能なユーティリティ関数群
 * 
 * KISS原則: シンプルで使いやすいAPI
 * DRY原則: 共通処理の一元化
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { RiskLevel } from '../types/unified-analysis-result';
import { RiskLevelMigrator } from './risk-level-migrator';

// シングルトンインスタンス
const migrator = new RiskLevelMigrator();

/**
 * 文字列のSeverity値を新RiskLevelに変換
 * @param severity - 小文字のseverity文字列
 * @returns 大文字のRiskLevel enum値
 */
export function severityToRiskLevel(severity: string): RiskLevel {
  return migrator.migrateFromString(severity);
}

/**
 * RiskLevel enumを文字列に変換
 * @param riskLevel - RiskLevel enum値
 * @returns 大文字の文字列表現
 */
export function riskLevelToString(riskLevel: RiskLevel): string {
  return riskLevel.toString();
}

/**
 * RiskLevelを小文字形式に変換（後方互換性）
 * @param riskLevel - RiskLevel enum値
 * @returns 小文字の文字列表現
 */
export function riskLevelToLowerCase(riskLevel: RiskLevel): string {
  return migrator.toOldFormat(riskLevel);
}

/**
 * リスクレベルの優先度を取得
 * @param riskLevel - RiskLevel enum値
 * @returns 優先度（1-5、5が最高）
 */
export function getRiskPriority(riskLevel: RiskLevel): number {
  return migrator.getPriority(riskLevel);
}

/**
 * 2つのリスクレベルのうち高い方を返す
 * @param level1 - 最初のリスクレベル
 * @param level2 - 2番目のリスクレベル
 * @returns より高いリスクレベル
 */
export function getHigherRiskLevel(level1: RiskLevel, level2: RiskLevel): RiskLevel {
  return migrator.getHigherRisk(level1, level2);
}

/**
 * リスクレベルのリストから最も高いレベルを返す
 * @param levels - リスクレベルの配列
 * @returns 最も高いリスクレベル
 */
export function getMaxRiskLevel(levels: RiskLevel[]): RiskLevel {
  return migrator.getHighestRisk(levels);
}

/**
 * リスクレベルが閾値以上かチェック
 * @param riskLevel - チェック対象のリスクレベル
 * @param threshold - 閾値となるリスクレベル
 * @returns 閾値以上の場合true
 */
export function isRiskAboveThreshold(riskLevel: RiskLevel, threshold: RiskLevel): boolean {
  return getRiskPriority(riskLevel) >= getRiskPriority(threshold);
}

/**
 * リスクレベルに基づく色コードを返す（UI用）
 * @param riskLevel - RiskLevel enum値
 * @returns 色コード文字列
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    [CoreTypes.RiskLevel.CRITICAL]: '#FF0000', // 赤
    [CoreTypes.RiskLevel.HIGH]: '#FF8800',     // オレンジ
    [CoreTypes.RiskLevel.MEDIUM]: '#FFCC00',   // 黄色
    [CoreTypes.RiskLevel.LOW]: '#88CC00',      // 黄緑
    [CoreTypes.RiskLevel.MINIMAL]: '#00CC00'   // 緑
  };
  return colors[riskLevel];
}

/**
 * リスクレベルに基づくアイコンを返す（CLI出力用）
 * @param riskLevel - RiskLevel enum値
 * @returns アイコン文字列
 */
export function getRiskIcon(riskLevel: RiskLevel): string {
  const icons: Record<RiskLevel, string> = {
    [CoreTypes.RiskLevel.CRITICAL]: '🔴',
    [CoreTypes.RiskLevel.HIGH]: '🟠',
    [CoreTypes.RiskLevel.MEDIUM]: '🟡',
    [CoreTypes.RiskLevel.LOW]: '🟢',
    [CoreTypes.RiskLevel.MINIMAL]: '⚪'
  };
  return icons[riskLevel];
}

/**
 * リスクレベルの日本語表記を返す
 * @param riskLevel - RiskLevel enum値
 * @returns 日本語表記
 */
export function getRiskLevelJapanese(riskLevel: RiskLevel): string {
  const japanese: Record<RiskLevel, string> = {
    [CoreTypes.RiskLevel.CRITICAL]: '致命的',
    [CoreTypes.RiskLevel.HIGH]: '高',
    [CoreTypes.RiskLevel.MEDIUM]: '中',
    [CoreTypes.RiskLevel.LOW]: '低',
    [CoreTypes.RiskLevel.MINIMAL]: '最小'
  };
  return japanese[riskLevel];
}

/**
 * スコアからグレードを算出
 * @param score - 0-100のスコア
 * @returns A-Fのグレード
 */
export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * グレードから推奨アクションを返す
 * @param grade - A-Fのグレード
 * @returns 推奨アクション文字列
 */
export function getGradeRecommendation(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  const recommendations: Record<string, string> = {
    'A': '優秀な品質です。現状を維持してください。',
    'B': '良好な品質ですが、いくつかの改善点があります。',
    'C': '平均的な品質です。重要な改善が必要です。',
    'D': '品質に問題があります。早急な対応が必要です。',
    'F': '深刻な品質問題があります。即座の対応が必要です。'
  };
  return recommendations[grade];
}