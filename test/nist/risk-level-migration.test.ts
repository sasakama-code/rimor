/**
 * RiskLevel Enum移行テスト
 * Issue #52: v0.8.0のSeverity enumからv0.9.0のRiskLevel enumへの移行
 * 
 * TDD Red Phase: 失敗するテストを最初に作成
 * DRY原則: 共通マッピングロジックの再利用
 */

import { RiskLevel } from '../../src/nist/types/unified-analysis-result';
import { RiskLevelMigrator } from '../../src/nist/utils/risk-level-migrator';
import { Severity as OldSeverity, IntentRiskLevel as OldRiskLevel } from '../../src/intent-analysis/ITestIntentAnalyzer';

describe('RiskLevel Enum移行', () => {
  describe('RiskLevelMigrator', () => {
    let migrator: RiskLevelMigrator;

    beforeEach(() => {
      migrator = new RiskLevelMigrator();
    });

    describe('Severity enum (小文字) から RiskLevel enum (大文字) への移行', () => {
      it('Severity.CRITICALをRiskLevel.CRITICALに変換する', () => {
        const oldValue = OldSeverity.CRITICAL;
        const newValue = migrator.migrateFromSeverity(oldValue);
        expect(newValue).toBe(RiskLevel.CRITICAL);
      });

      it('Severity.HIGHをRiskLevel.HIGHに変換する', () => {
        const oldValue = OldSeverity.HIGH;
        const newValue = migrator.migrateFromSeverity(oldValue);
        expect(newValue).toBe(RiskLevel.HIGH);
      });

      it('Severity.MEDIUMをRiskLevel.MEDIUMに変換する', () => {
        const oldValue = OldSeverity.MEDIUM;
        const newValue = migrator.migrateFromSeverity(oldValue);
        expect(newValue).toBe(RiskLevel.MEDIUM);
      });

      it('Severity.LOWをRiskLevel.LOWに変換する', () => {
        const oldValue = OldSeverity.LOW;
        const newValue = migrator.migrateFromSeverity(oldValue);
        expect(newValue).toBe(RiskLevel.LOW);
      });

      it('Severityに存在しないMINIMALのデフォルト処理', () => {
        // SeverityにはMINIMALが存在しないため、LOWをMINIMALにマップ
        const newValue = migrator.getDefaultMinimalLevel();
        expect(newValue).toBe(RiskLevel.MINIMAL);
      });
    });

    describe('旧RiskLevel enum (小文字) から新RiskLevel enum (大文字) への移行', () => {
      it('旧RiskLevel.criticalを新RiskLevel.CRITICALに変換する', () => {
        const oldValue = OldRiskLevel.CRITICAL;
        const newValue = migrator.migrateFromOldRiskLevel(oldValue);
        expect(newValue).toBe(RiskLevel.CRITICAL);
      });

      it('旧RiskLevel.highを新RiskLevel.HIGHに変換する', () => {
        const oldValue = OldRiskLevel.HIGH;
        const newValue = migrator.migrateFromOldRiskLevel(oldValue);
        expect(newValue).toBe(RiskLevel.HIGH);
      });

      it('旧RiskLevel.mediumを新RiskLevel.MEDIUMに変換する', () => {
        const oldValue = OldRiskLevel.MEDIUM;
        const newValue = migrator.migrateFromOldRiskLevel(oldValue);
        expect(newValue).toBe(RiskLevel.MEDIUM);
      });

      it('旧RiskLevel.lowを新RiskLevel.LOWに変換する', () => {
        const oldValue = OldRiskLevel.LOW;
        const newValue = migrator.migrateFromOldRiskLevel(oldValue);
        expect(newValue).toBe(RiskLevel.LOW);
      });

      it('旧RiskLevel.minimalを新RiskLevel.MINIMALに変換する', () => {
        const oldValue = OldRiskLevel.MINIMAL;
        const newValue = migrator.migrateFromOldRiskLevel(oldValue);
        expect(newValue).toBe(RiskLevel.MINIMAL);
      });
    });

    describe('文字列値からの移行', () => {
      it('文字列 "critical" を RiskLevel.CRITICAL に変換する', () => {
        const newValue = migrator.migrateFromString('critical');
        expect(newValue).toBe(RiskLevel.CRITICAL);
      });

      it('文字列 "CRITICAL" を RiskLevel.CRITICAL に変換する', () => {
        const newValue = migrator.migrateFromString('CRITICAL');
        expect(newValue).toBe(RiskLevel.CRITICAL);
      });

      it('文字列 "high" を RiskLevel.HIGH に変換する', () => {
        const newValue = migrator.migrateFromString('high');
        expect(newValue).toBe(RiskLevel.HIGH);
      });

      it('文字列 "medium" を RiskLevel.MEDIUM に変換する', () => {
        const newValue = migrator.migrateFromString('medium');
        expect(newValue).toBe(RiskLevel.MEDIUM);
      });

      it('文字列 "low" を RiskLevel.LOW に変換する', () => {
        const newValue = migrator.migrateFromString('low');
        expect(newValue).toBe(RiskLevel.LOW);
      });

      it('文字列 "minimal" を RiskLevel.MINIMAL に変換する', () => {
        const newValue = migrator.migrateFromString('minimal');
        expect(newValue).toBe(RiskLevel.MINIMAL);
      });

      it('不正な文字列の場合はエラーをスローする', () => {
        expect(() => migrator.migrateFromString('invalid')).toThrow('Unknown risk level: invalid');
      });
    });

    describe('バッチ移行', () => {
      it('複数のSeverity値を一括で移行する', () => {
        const oldValues = [
          OldSeverity.CRITICAL,
          OldSeverity.HIGH,
          OldSeverity.MEDIUM,
          OldSeverity.LOW
        ];

        const newValues = migrator.migrateSeverityBatch(oldValues);

        expect(newValues).toEqual([
          RiskLevel.CRITICAL,
          RiskLevel.HIGH,
          RiskLevel.MEDIUM,
          RiskLevel.LOW
        ]);
      });

      it('複数の旧RiskLevel値を一括で移行する', () => {
        const oldValues = [
          OldRiskLevel.CRITICAL,
          OldRiskLevel.HIGH,
          OldRiskLevel.MEDIUM,
          OldRiskLevel.LOW,
          OldRiskLevel.MINIMAL
        ];

        const newValues = migrator.migrateOldRiskLevelBatch(oldValues);

        expect(newValues).toEqual([
          RiskLevel.CRITICAL,
          RiskLevel.HIGH,
          RiskLevel.MEDIUM,
          RiskLevel.LOW,
          RiskLevel.MINIMAL
        ]);
      });
    });

    describe('逆変換（後方互換性）', () => {
      it('新RiskLevel.CRITICALを旧形式 "critical" に変換する', () => {
        const oldValue = migrator.toOldFormat(RiskLevel.CRITICAL);
        expect(oldValue).toBe('critical');
      });

      it('新RiskLevel.HIGHを旧形式 "high" に変換する', () => {
        const oldValue = migrator.toOldFormat(RiskLevel.HIGH);
        expect(oldValue).toBe('high');
      });

      it('新RiskLevel.MEDIUMを旧形式 "medium" に変換する', () => {
        const oldValue = migrator.toOldFormat(RiskLevel.MEDIUM);
        expect(oldValue).toBe('medium');
      });

      it('新RiskLevel.LOWを旧形式 "low" に変換する', () => {
        const oldValue = migrator.toOldFormat(RiskLevel.LOW);
        expect(oldValue).toBe('low');
      });

      it('新RiskLevel.MINIMALを旧形式 "minimal" に変換する', () => {
        const oldValue = migrator.toOldFormat(RiskLevel.MINIMAL);
        expect(oldValue).toBe('minimal');
      });
    });

    describe('移行統計', () => {
      it('移行された値の統計を収集する', () => {
        const values = [
          OldSeverity.CRITICAL,
          OldSeverity.CRITICAL,
          OldSeverity.HIGH,
          OldSeverity.MEDIUM,
          OldSeverity.LOW,
          OldSeverity.LOW,
          OldSeverity.LOW
        ];

        const result = migrator.migrateSeverityBatchWithStats(values);

        expect(result.migrated).toHaveLength(7);
        expect(result.stats).toEqual({
          CRITICAL: 2,
          HIGH: 1,
          MEDIUM: 1,
          LOW: 3,
          MINIMAL: 0
        });
      });
    });
  });

  describe('グローバル移行ヘルパー関数', () => {
    it('severityToRiskLevel関数が正しく動作する', async () => {
      // 動的インポートを使用
      const { severityToRiskLevel } = await import('../../src/nist/utils/risk-level-helpers');
      
      expect(severityToRiskLevel('critical')).toBe(RiskLevel.CRITICAL);
      expect(severityToRiskLevel('high')).toBe(RiskLevel.HIGH);
      expect(severityToRiskLevel('medium')).toBe(RiskLevel.MEDIUM);
      expect(severityToRiskLevel('low')).toBe(RiskLevel.LOW);
    });

    it('riskLevelToString関数が正しく動作する', async () => {
      const { riskLevelToString } = await import('../../src/nist/utils/risk-level-helpers');
      
      expect(riskLevelToString(RiskLevel.CRITICAL)).toBe('CRITICAL');
      expect(riskLevelToString(RiskLevel.HIGH)).toBe('HIGH');
      expect(riskLevelToString(RiskLevel.MEDIUM)).toBe('MEDIUM');
      expect(riskLevelToString(RiskLevel.LOW)).toBe('LOW');
      expect(riskLevelToString(RiskLevel.MINIMAL)).toBe('MINIMAL');
    });
  });
});