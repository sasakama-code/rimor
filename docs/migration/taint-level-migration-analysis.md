# TaintLevel列挙型 → 新型システム移行影響分析

## 概要
Dorothy Denningの格子理論に基づくTaintLevel列挙型から、arXiv:2504.18529v2の型ベースアノテーションシステムへの移行影響分析。

## 現在のTaintLevel使用状況

### 1. TaintLevel列挙型の定義
- **ファイル**: `/src/security/types/taint.ts`
- **定義値**:
  - `CLEAN = 0` / `UNTAINTED = 0`
  - `POSSIBLY_TAINTED = 1`
  - `LIKELY_TAINTED = 2`
  - `DEFINITELY_TAINTED = 3`
  - `HIGHLY_TAINTED = 4`

### 2. 影響を受けるファイル（16個）

#### コアセキュリティファイル
1. `/src/security/types/taint.ts` - TaintLevel定義とTaintLatticeクラス
2. `/src/security/types/lattice.ts` - Dorothy Denningの格子理論実装
3. `/src/security/types/security.ts` - セキュリティ型定義
4. `/src/security/types/index.ts` - 型エクスポート

#### 解析エンジンファイル
5. `/src/security/analysis/engine.ts` - 汚染解析エンジン
6. `/src/security/analysis/flow.ts` - フロー感度解析
7. `/src/security/analysis/inference.ts` - 型推論エンジン
8. `/src/security/analysis/modular.ts` - モジュラー解析
9. `/src/security/analysis/progressive-ai.ts` - AI連携解析

#### プラグインファイル
10. `/src/security/plugins/InputValidationSecurityPlugin.ts` - 入力検証プラグイン
11. `/src/security/plugins/TypedAuthTestQualityPlugin.ts` - 認証テストプラグイン

#### その他のファイル
12. `/src/security/validation/AccuracyEvaluationSystem.ts` - 精度評価システム
13. `/src/security/analysis/search-based-inference.ts` - 探索ベース推論（既に新システムも実装）
14. `/src/security/types/checker-framework-types.ts` - 新型システム定義（既に実装）
15. `/src/security/annotations/taint-annotations.ts` - 新アノテーション（既に実装）
16. `/src/core/types.ts` - コア型定義

## 移行戦略

### フェーズ1: 互換レイヤーの作成

```typescript
// src/security/compatibility/taint-level-adapter.ts
import { TaintLevel } from '../types/taint';
import { TaintQualifier, TypeConstructors } from '../types/checker-framework-types';

export class TaintLevelAdapter {
  /**
   * TaintLevelから新しい型クオリファイアへの変換
   */
  static toTaintQualifier(level: TaintLevel): TaintQualifier {
    if (level <= TaintLevel.UNTAINTED) {
      return '@Untainted';
    } else {
      return '@Tainted';
    }
  }

  /**
   * TaintLevelから具体的な型への変換
   */
  static toQualifiedType<T>(value: T, level: TaintLevel) {
    if (level <= TaintLevel.UNTAINTED) {
      return TypeConstructors.untainted(value);
    } else {
      return TypeConstructors.tainted(value, 'legacy-taint', level / 4);
    }
  }
}
```

### フェーズ2: 段階的移行

#### ステップ1: 格子理論の内部化
- `TaintLattice`クラスを内部実装として保持
- 外部APIは新しいアノテーションベースに変更

#### ステップ2: プラグインの移行
- 各プラグインのTaintLevel使用を新システムに変更
- 互換レイヤーを通じて段階的に移行

#### ステップ3: 解析エンジンの更新
- engine.ts, flow.ts, inference.tsの順に移行
- 新しい型チェッカーの統合

### フェーズ3: 旧システムの廃止
- TaintLevel列挙型を非推奨化
- 内部実装のみで格子理論を使用

## 具体的な変更例

### 変更前（TaintLevel使用）
```typescript
// InputValidationSecurityPlugin.ts
private assessTaintLevel(content: string): TaintLevel {
  if (content.includes('req.body')) {
    return TaintLevel.DEFINITELY_TAINTED;
  }
  return TaintLevel.UNTAINTED;
}
```

### 変更後（新型システム）
```typescript
// InputValidationSecurityPlugin.ts
private assessTaintLevel(content: string): QualifiedType<string> {
  if (content.includes('req.body')) {
    return TypeConstructors.tainted(content, 'user-input', 0.9);
  }
  return TypeConstructors.untainted(content);
}
```

## リスクと対策

### リスク
1. 既存テストの破壊
2. プラグインの互換性問題
3. パフォーマンスへの影響

### 対策
1. 包括的なテストカバレッジの維持
2. 互換レイヤーによる段階的移行
3. ベンチマークによる性能検証

## タイムライン
- フェーズ1: 互換レイヤー作成（1日）
- フェーズ2: 段階的移行（3-4日）
- フェーズ3: 旧システム廃止（1日）
- テストと検証: 2日

合計: 約1週間の作業