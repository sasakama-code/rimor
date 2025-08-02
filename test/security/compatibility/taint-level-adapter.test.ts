import { TaintLevelAdapter } from '../../../src/security/compatibility/taint-level-adapter';
import { TaintLevel, TaintSource, TaintMetadata } from '../../../src/security/types/taint';
import { 
  TaintQualifier,
  TypeConstructors,
  TypeGuards,
  TaintedType
} from '../../../src/security/types/checker-framework-types';

describe('TaintLevelAdapter', () => {
  describe('toTaintQualifier', () => {
    it('CLEANレベルを@Untaintedに変換する', () => {
      const qualifier = TaintLevelAdapter.toTaintQualifier(TaintLevel.CLEAN);
      expect(qualifier).toBe('@Untainted');
    });

    it('UNTAINTEDレベルを@Untaintedに変換する', () => {
      const qualifier = TaintLevelAdapter.toTaintQualifier(TaintLevel.UNTAINTED);
      expect(qualifier).toBe('@Untainted');
    });

    it('DEFINITELY_TAINTEDレベルを@Taintedに変換する', () => {
      const qualifier = TaintLevelAdapter.toTaintQualifier(TaintLevel.DEFINITELY_TAINTED);
      expect(qualifier).toBe('@Tainted');
    });

    it('LIKELY_TAINTEDレベルを@Taintedに変換する', () => {
      const qualifier = TaintLevelAdapter.toTaintQualifier(TaintLevel.LIKELY_TAINTED);
      expect(qualifier).toBe('@Tainted');
    });

    it('HIGHLY_TAINTEDレベルを@Taintedに変換する', () => {
      const qualifier = TaintLevelAdapter.toTaintQualifier(TaintLevel.HIGHLY_TAINTED);
      expect(qualifier).toBe('@Tainted');
    });
  });

  describe('toQualifiedType', () => {
    it('クリーンな値をUntaintedTypeに変換する', () => {
      const value = 'clean data';
      const qualified = TaintLevelAdapter.toQualifiedType(
        value, 
        TaintLevel.CLEAN
      );

      expect(TypeGuards.isUntainted(qualified)).toBe(true);
      expect(qualified.__value).toBe(value);
      expect(qualified.__brand).toBe('@Untainted');
    });

    it('汚染された値をTaintedTypeに変換する', () => {
      const value = 'tainted data';
      const qualified = TaintLevelAdapter.toQualifiedType(
        value,
        TaintLevel.DEFINITELY_TAINTED,
        TaintSource.USER_INPUT
      );

      expect(TypeGuards.isTainted(qualified)).toBe(true);
      expect(qualified.__value).toBe(value);
      expect(qualified.__brand).toBe('@Tainted');
      const taintedQualified = qualified as TaintedType<string>;
      expect(taintedQualified.__source).toBe(TaintSource.USER_INPUT);
    });

    // TODO: メタデータサポートが実装されたらコメントを解除
    // it('メタデータを保持する', () => {
    //   const value = 'data with metadata';
    //   const metadata: TaintMetadata = {
    //     confidence: 0.8,
    //     timestamp: new Date(),
    //     reason: 'Test metadata'
    //   };

    //   const qualified = TaintLevelAdapter.toQualifiedType(
    //     value,
    //     TaintLevel.LIKELY_TAINTED,
    //     TaintSource.DATABASE,
    //     metadata
    //   );

    //   expect(qualified.metadata).toBeDefined();
    //   expect(qualified.metadata!.originalLevel).toBe(TaintLevel.LIKELY_TAINTED);
    //   expect(qualified.metadata!.confidence).toBeDefined();
    // });
  });

  describe('fromQualifiedType', () => {
    it('UntaintedTypeをCLEANレベルに変換する', () => {
      const untainted = TypeConstructors.untainted('clean');
      const level = TaintLevelAdapter.fromQualifiedType(untainted);
      
      expect(level).toBe(TaintLevel.CLEAN);
    });

    it('TaintedTypeを適切なレベルに変換する', () => {
      const tainted = TypeConstructors.tainted('dirty', TaintSource.USER_INPUT);
      const level = TaintLevelAdapter.fromQualifiedType(tainted);
      
      expect(level).toBe(TaintLevel.HIGHLY_TAINTED);
    });

    it('メタデータから元のレベルを復元する', () => {
      const value = 'critical data';
      const qualified = TaintLevelAdapter.toQualifiedType(
        value,
        TaintLevel.HIGHLY_TAINTED,
        TaintSource.EXTERNAL_API
      );

      const restoredLevel = TaintLevelAdapter.fromQualifiedType(qualified);
      expect(restoredLevel).toBe(TaintLevel.HIGHLY_TAINTED);
    });
  });

  // TODO: calculateConfidenceがpublicになったらコメントを解除
  // describe('calculateConfidence', () => {
  //   it('各レベルに適切な信頼度を割り当てる', () => {
  //     const confidences = {
  //       clean: TaintLevelAdapter['calculateConfidence'](TaintLevel.CLEAN),
  //       untainted: TaintLevelAdapter['calculateConfidence'](TaintLevel.UNTAINTED),
  //       definitelyTainted: TaintLevelAdapter['calculateConfidence'](TaintLevel.DEFINITELY_TAINTED),
  //       likelyTainted: TaintLevelAdapter['calculateConfidence'](TaintLevel.LIKELY_TAINTED),
  //       highlyTainted: TaintLevelAdapter['calculateConfidence'](TaintLevel.HIGHLY_TAINTED)
  //     };

  //     expect(confidences.clean).toBe(1.0);
  //     expect(confidences.untainted).toBeGreaterThan(0.8);
  //     expect(confidences.definitelyTainted).toBeLessThan(0.8);
  //     expect(confidences.likelyTainted).toBeLessThan(0.6);
  //     expect(confidences.highlyTainted).toBe(1.0);
  //   });
  // });

  // TODO: adaptSecurityCheckメソッドが実装されたらコメントを解除
  // describe('adaptSecurityCheck', () => {
  //   it('レガシーチェック関数を新型システムに適応する', () => {
  //     // レガシー関数：TaintLevelを使用
  //     const legacyCheck = (level: TaintLevel): boolean => {
  //       return level <= TaintLevel.UNTAINTED;
  //     };

  //     // アダプターでラップ
  //     const adaptedCheck = TaintLevelAdapter.adaptSecurityCheck(legacyCheck);

  //     // 新型システムでテスト
  //     const untainted = TypeConstructors.untainted('safe');
  //     const tainted = TypeConstructors.tainted('unsafe', 'user-input');

  //     expect(adaptedCheck(untainted)).toBe(true);
  //     expect(adaptedCheck(tainted)).toBe(false);
  //   });
  // });

  describe('bulkConvert', () => {
    it('複数の値を一括変換できる', () => {
      const items = [
        { value: 'clean', level: TaintLevel.CLEAN },
        { value: 'tainted', level: TaintLevel.DEFINITELY_TAINTED },
        { value: 'critical', level: TaintLevel.HIGHLY_TAINTED }
      ];

      const converted = TaintLevelAdapter.batchConvert(items);

      expect(converted).toHaveLength(3);
      expect(TypeGuards.isUntainted(converted[0])).toBe(true);
      expect(TypeGuards.isTainted(converted[1])).toBe(true);
      expect(TypeGuards.isTainted(converted[2])).toBe(true);
    });
  });

  describe('格子理論との互換性', () => {
    it('格子の順序関係を保持する', () => {
      // Dorothy Denningの格子理論: CLEAN ≤ UNTAINTED ≤ POSSIBLY_TAINTED ≤ LIKELY_TAINTED ≤ DEFINITELY_TAINTED ≤ HIGHLY_TAINTED
      const levels = [
        TaintLevel.CLEAN,
        TaintLevel.UNTAINTED,
        TaintLevel.POSSIBLY_TAINTED,
        TaintLevel.LIKELY_TAINTED,
        TaintLevel.DEFINITELY_TAINTED,
        TaintLevel.HIGHLY_TAINTED
      ];

      const qualifiers = levels.map(l => TaintLevelAdapter.toTaintQualifier(l));
      
      // 最初の2つは@Untainted、残りは@Tainted
      expect(qualifiers.slice(0, 2).every(q => q === '@Untainted')).toBe(true);
      expect(qualifiers.slice(2).every(q => q === '@Tainted')).toBe(true);
    });

    it('格子の結合（join）操作を正しく処理する', () => {
      const value1 = TaintLevelAdapter.toQualifiedType('data1', TaintLevel.CLEAN);
      const value2 = TaintLevelAdapter.toQualifiedType('data2', TaintLevel.DEFINITELY_TAINTED);

      // 結合操作のシミュレート
      const joined = TaintLevelAdapter.join(value1, value2);
      
      expect(TypeGuards.isTainted(joined)).toBe(true);
    });

    it('格子の交わり（meet）操作を正しく処理する', () => {
      const value1 = TaintLevelAdapter.toQualifiedType('data1', TaintLevel.UNTAINTED);
      const value2 = TaintLevelAdapter.toQualifiedType('data2', TaintLevel.DEFINITELY_TAINTED);

      // 交わり操作のシミュレート
      const met = TaintLevelAdapter.meet(value1, value2);
      
      expect(TypeGuards.isUntainted(met)).toBe(true);
    });
  });

  // TODO: 移行サポートメソッドが実装されたらコメントを解除
  // describe('移行サポート機能', () => {
  //   it('警告メッセージを生成する', () => {
  //     const warnings = TaintLevelAdapter.getMigrationWarnings(TaintLevel.LIKELY_TAINTED);
  //     
  //     expect(warnings).toContain('LIKELY_TAINTED');
  //     expect(warnings).toContain('二値システム');
  //   });

  //   it('移行の推奨事項を提供する', () => {
  //     const recommendations = TaintLevelAdapter.getMigrationRecommendations();
  //     
  //     expect(recommendations).toBeDefined();
  //     expect(recommendations.length).toBeGreaterThan(0);
  //   });

  //   it('互換性レポートを生成する', () => {
  //     const report = TaintLevelAdapter.generateCompatibilityReport([
  //       TaintLevel.CLEAN,
  //       TaintLevel.DEFINITELY_TAINTED,
  //       TaintLevel.HIGHLY_TAINTED
  //     ]);

  //     expect(report.totalValues).toBe(3);
  //     expect(report.mappedToUntainted).toBe(1);
  //     expect(report.mappedToTainted).toBe(2);
  //   });
  // });
});