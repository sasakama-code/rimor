/**
 * RiskLevel Enum移行ユーティリティ
 * v0.8.0のSeverity/RiskLevel（小文字）からv0.9.0のRiskLevel（大文字）への移行
 * 
 * DRY原則: 共通変換ロジックの一元化
 * KISS原則: シンプルで明確な変換処理
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { RiskLevel } from '../types/unified-analysis-result';
import { Severity as OldSeverity, IntentRiskLevel as OldRiskLevel } from '../../intent-analysis/ITestIntentAnalyzer';

/**
 * リスクレベル移行統計
 */
export interface MigrationStats {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  MINIMAL: number;
}

/**
 * バッチ移行結果
 */
export interface BatchMigrationResult<T> {
  /** 移行後の値 */
  migrated: T[];
  /** 移行統計 */
  stats: MigrationStats;
}

/**
 * RiskLevel移行クラス
 * Severity enumと旧RiskLevel enumから新RiskLevel enumへの移行を担当
 */
export class RiskLevelMigrator {
  /**
   * Severity enum（小文字）から新RiskLevel enum（大文字）への変換
   */
  migrateFromSeverity(severity: OldSeverity): RiskLevel {
    const mapping: Record<string, RiskLevel> = {
      'critical': CoreTypes.RiskLevel.CRITICAL,
      'high': CoreTypes.RiskLevel.HIGH,
      'medium': CoreTypes.RiskLevel.MEDIUM,
      'low': CoreTypes.RiskLevel.LOW
    };

    const severityValue = severity.toLowerCase();
    const mapped = mapping[severityValue];
    
    if (!mapped) {
      // SeverityにMINIMALは存在しないため、デフォルトでLOWを返す
      return CoreTypes.RiskLevel.LOW;
    }
    
    return mapped;
  }

  /**
   * 旧RiskLevel enum（小文字）から新RiskLevel enum（大文字）への変換
   */
  migrateFromOldRiskLevel(oldRiskLevel: OldRiskLevel): RiskLevel {
    const mapping: Record<string, RiskLevel> = {
      'critical': CoreTypes.RiskLevel.CRITICAL,
      'high': CoreTypes.RiskLevel.HIGH,
      'medium': CoreTypes.RiskLevel.MEDIUM,
      'low': CoreTypes.RiskLevel.LOW,
      'minimal': CoreTypes.RiskLevel.MINIMAL
    };

    const riskValue = oldRiskLevel.toLowerCase();
    const mapped = mapping[riskValue];
    
    if (!mapped) {
      throw new Error(`Unknown old risk level: ${oldRiskLevel}`);
    }
    
    return mapped;
  }

  /**
   * 文字列から新RiskLevel enumへの変換
   * 大文字・小文字両方に対応
   */
  migrateFromString(value: string): RiskLevel {
    const normalizedValue = value.toUpperCase();
    
    switch (normalizedValue) {
      case 'CRITICAL':
        return CoreTypes.RiskLevel.CRITICAL;
      case 'HIGH':
        return CoreTypes.RiskLevel.HIGH;
      case 'MEDIUM':
        return CoreTypes.RiskLevel.MEDIUM;
      case 'LOW':
        return CoreTypes.RiskLevel.LOW;
      case 'MINIMAL':
        return CoreTypes.RiskLevel.MINIMAL;
      default:
        throw new Error(`Unknown risk level: ${value}`);
    }
  }

  /**
   * SeverityにはMINIMALが存在しないため、デフォルトのMINIMALレベルを返す
   */
  getDefaultMinimalLevel(): RiskLevel {
    return CoreTypes.RiskLevel.MINIMAL;
  }

  /**
   * 複数のSeverity値を一括で移行
   */
  migrateSeverityBatch(severities: OldSeverity[]): RiskLevel[] {
    return severities.map(severity => this.migrateFromSeverity(severity));
  }

  /**
   * 複数の旧RiskLevel値を一括で移行
   */
  migrateOldRiskLevelBatch(oldRiskLevels: OldRiskLevel[]): RiskLevel[] {
    return oldRiskLevels.map(level => this.migrateFromOldRiskLevel(level));
  }

  /**
   * 複数のSeverity値を統計付きで一括移行
   */
  migrateSeverityBatchWithStats(severities: OldSeverity[]): BatchMigrationResult<RiskLevel> {
    const migrated: RiskLevel[] = [];
    const stats: MigrationStats = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      MINIMAL: 0
    };

    for (const severity of severities) {
      const newLevel = this.migrateFromSeverity(severity);
      migrated.push(newLevel);
      stats[newLevel]++;
    }

    return { migrated, stats };
  }

  /**
   * 新RiskLevelを旧形式（小文字）に変換（後方互換性のため）
   */
  toOldFormat(riskLevel: RiskLevel): string {
    return riskLevel.toLowerCase();
  }

  /**
   * リスクレベルの優先度を数値で返す（比較用）
   * CRITICAL = 5, HIGH = 4, MEDIUM = 3, LOW = 2, MINIMAL = 1
   */
  getPriority(riskLevel: RiskLevel): number {
    const priorities: Record<RiskLevel, number> = {
      [CoreTypes.RiskLevel.CRITICAL]: 5,
      [CoreTypes.RiskLevel.HIGH]: 4,
      [CoreTypes.RiskLevel.MEDIUM]: 3,
      [CoreTypes.RiskLevel.LOW]: 2,
      [CoreTypes.RiskLevel.MINIMAL]: 1
    };
    return priorities[riskLevel];
  }

  /**
   * 2つのリスクレベルを比較（高い方を返す）
   */
  getHigherRisk(level1: RiskLevel, level2: RiskLevel): RiskLevel {
    return this.getPriority(level1) >= this.getPriority(level2) ? level1 : level2;
  }

  /**
   * リスクレベルのリストから最も高いリスクレベルを返す
   */
  getHighestRisk(levels: RiskLevel[]): RiskLevel {
    if (levels.length === 0) {
      return CoreTypes.RiskLevel.MINIMAL;
    }
    return levels.reduce((highest, current) => this.getHigherRisk(highest, current));
  }
}