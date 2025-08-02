/**
 * TaintLevel列挙型から新型システムへの互換アダプター
 * arXiv:2504.18529v2への段階的移行をサポート
 * 
 * このアダプターは、既存のTaintLevelベースのコードを
 * 新しい@Tainted/@Untaintedアノテーションシステムに
 * 段階的に移行するためのブリッジとして機能します。
 */

import { TaintLevel, TaintSource, TaintMetadata } from '../types/taint';
import { 
  TaintQualifier, 
  TypeConstructors, 
  QualifiedType,
  TaintedType,
  UntaintedType
} from '../types/checker-framework-types';

/**
 * TaintLevel互換アダプター
 * Dorothy Denningの格子理論から新しい型システムへの変換を提供
 */
export class TaintLevelAdapter {
  /**
   * TaintLevelから型クオリファイアへの変換
   * 格子理論の多段階レベルを二値システムにマッピング
   */
  static toTaintQualifier(level: TaintLevel): TaintQualifier {
    // CLEAN/UNTAINTEDは@Untaintedにマップ
    if (level <= TaintLevel.UNTAINTED) {
      return '@Untainted';
    }
    // その他すべては@Taintedにマップ
    return '@Tainted';
  }

  /**
   * TaintLevelから具体的な型への変換
   * 信頼度情報を保持しながら新型システムに変換
   */
  static toQualifiedType<T>(
    value: T, 
    level: TaintLevel,
    source?: TaintSource,
    metadata?: TaintMetadata
  ): QualifiedType<T> {
    // 信頼度の計算（0.0-1.0の範囲）
    const confidence = this.calculateConfidence(level);
    
    if (level <= TaintLevel.UNTAINTED) {
      return TypeConstructors.untainted(value, 'legacy-clean');
    } else {
      const sourceStr = source || metadata?.source || 'legacy-taint';
      return TypeConstructors.tainted(value, sourceStr, confidence);
    }
  }

  /**
   * 新型システムからTaintLevelへの逆変換
   * 内部実装での格子理論使用のため
   */
  static fromQualifiedType<T>(qualified: QualifiedType<T>): TaintLevel {
    if (qualified.__brand === '@Untainted') {
      return TaintLevel.UNTAINTED;
    } else if (qualified.__brand === '@Tainted') {
      const tainted = qualified as TaintedType<T>;
      return this.confidenceToTaintLevel(tainted.__confidence);
    } else {
      // @PolyTaintは文脈依存なので、保守的にPOSSIBLY_TAINTEDとする
      return TaintLevel.POSSIBLY_TAINTED;
    }
  }

  /**
   * TaintLevelから信頼度への変換
   */
  private static calculateConfidence(level: TaintLevel): number {
    switch (level) {
      case TaintLevel.CLEAN:
      case TaintLevel.UNTAINTED:
        return 0.0;
      case TaintLevel.POSSIBLY_TAINTED:
        return 0.25;
      case TaintLevel.LIKELY_TAINTED:
        return 0.5;
      case TaintLevel.DEFINITELY_TAINTED:
        return 0.75;
      case TaintLevel.HIGHLY_TAINTED:
        return 1.0;
      default:
        return 0.5; // デフォルトは中間値
    }
  }

  /**
   * 信頼度からTaintLevelへの逆変換
   */
  private static confidenceToTaintLevel(confidence: number): TaintLevel {
    if (confidence <= 0.0) {
      return TaintLevel.UNTAINTED;
    } else if (confidence <= 0.25) {
      return TaintLevel.POSSIBLY_TAINTED;
    } else if (confidence <= 0.5) {
      return TaintLevel.LIKELY_TAINTED;
    } else if (confidence <= 0.75) {
      return TaintLevel.DEFINITELY_TAINTED;
    } else {
      return TaintLevel.HIGHLY_TAINTED;
    }
  }

  /**
   * 格子演算の互換実装
   * 新型システムで格子理論の演算を再現
   */
  static join<T>(
    a: QualifiedType<T>, 
    b: QualifiedType<T>
  ): QualifiedType<T> {
    // 両方が@Untaintedの場合のみ@Untainted
    if (a.__brand === '@Untainted' && b.__brand === '@Untainted') {
      return a;
    }
    
    // いずれかが@Taintedなら結果も@Tainted
    if (a.__brand === '@Tainted') {
      return a;
    } else if (b.__brand === '@Tainted') {
      return b;
    }
    
    // PolyTaintが含まれる場合は保守的に@Tainted
    return TypeConstructors.tainted(
      a.__value, 
      'join-operation',
      0.5
    );
  }

  /**
   * 格子演算のmeet操作
   */
  static meet<T>(
    a: QualifiedType<T>, 
    b: QualifiedType<T>
  ): QualifiedType<T> {
    // いずれかが@Untaintedなら結果も@Untainted
    if (a.__brand === '@Untainted') {
      return a;
    } else if (b.__brand === '@Untainted') {
      return b;
    }
    
    // 両方が@Taintedの場合、より低い信頼度を選択
    if (a.__brand === '@Tainted' && b.__brand === '@Tainted') {
      const aConf = (a as TaintedType<T>).__confidence;
      const bConf = (b as TaintedType<T>).__confidence;
      if (aConf <= bConf) {
        return a;
      } else {
        return b;
      }
    }
    
    return a;
  }

  /**
   * レガシーコードのための便利メソッド
   * TaintLevelベースの比較を新型システムで実行
   */
  static isMoreTaintedThan<T>(
    a: QualifiedType<T>,
    b: QualifiedType<T>
  ): boolean {
    const aLevel = this.fromQualifiedType(a);
    const bLevel = this.fromQualifiedType(b);
    return aLevel > bLevel;
  }

  /**
   * バッチ変換用のヘルパー
   * 複数の値を一括で変換
   */
  static batchConvert<T>(
    values: Array<{ value: T; level: TaintLevel; source?: TaintSource }>
  ): QualifiedType<T>[] {
    return values.map(({ value, level, source }) => 
      this.toQualifiedType(value, level, source)
    );
  }

  /**
   * デバッグ用の文字列表現
   */
  static toString<T>(qualified: QualifiedType<T>): string {
    if (qualified.__brand === '@Untainted') {
      return 'Untainted (safe)';
    } else if (qualified.__brand === '@Tainted') {
      const tainted = qualified as TaintedType<T>;
      return `Tainted (source: ${tainted.__source}, confidence: ${tainted.__confidence})`;
    } else {
      return 'PolyTaint (context-dependent)';
    }
  }
}

/**
 * 移行期間中の便利な型エイリアス
 */
export type LegacyCompatibleType<T> = QualifiedType<T> & {
  __legacyLevel?: TaintLevel;
};

/**
 * 移行支援ユーティリティ
 */
export class MigrationHelper {
  /**
   * レガシーAPIの互換実装
   * 既存コードの最小限の変更で新システムを使用可能に
   */
  static createLegacyCompatibleAPI() {
    return {
      // TaintLevel定数の互換実装
      TaintLevel: {
        UNTAINTED: '@Untainted' as const,
        POSSIBLY_TAINTED: '@Tainted' as const,
        LIKELY_TAINTED: '@Tainted' as const,
        DEFINITELY_TAINTED: '@Tainted' as const,
        HIGHLY_TAINTED: '@Tainted' as const
      },
      
      // 格子演算の互換実装
      TaintLattice: {
        join: TaintLevelAdapter.join,
        meet: TaintLevelAdapter.meet,
        lessThanOrEqual: <T>(a: QualifiedType<T>, b: QualifiedType<T>) => 
          !TaintLevelAdapter.isMoreTaintedThan(a, b)
      }
    };
  }

  /**
   * 段階的移行のためのデコレータ
   * 既存メソッドを新型システムで自動的にラップ
   */
  static wrapLegacyMethod<T extends (...args: any[]) => TaintLevel>(
    method: T
  ): (...args: Parameters<T>) => TaintQualifier {
    return (...args: Parameters<T>) => {
      const legacyResult = method(...args);
      return TaintLevelAdapter.toTaintQualifier(legacyResult);
    };
  }
}

/**
 * 移行状況の追跡
 */
export class MigrationTracker {
  private static migrationStats = new Map<string, {
    total: number;
    migrated: number;
    lastUpdated: Date;
  }>();

  static recordMigration(fileName: string, total: number, migrated: number): void {
    this.migrationStats.set(fileName, {
      total,
      migrated,
      lastUpdated: new Date()
    });
  }

  static getMigrationProgress(): {
    overallProgress: number;
    fileStats: Array<{ file: string; progress: number }>;
  } {
    let totalItems = 0;
    let migratedItems = 0;
    const fileStats: Array<{ file: string; progress: number }> = [];

    for (const [file, stats] of this.migrationStats) {
      totalItems += stats.total;
      migratedItems += stats.migrated;
      fileStats.push({
        file,
        progress: stats.total > 0 ? (stats.migrated / stats.total) * 100 : 0
      });
    }

    return {
      overallProgress: totalItems > 0 ? (migratedItems / totalItems) * 100 : 0,
      fileStats
    };
  }
}