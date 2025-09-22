# Rimor Type System Documentation

## 概要
このドキュメントでは、Rimorプロジェクトの型システムと、Issue #63で実施した型定義の再構成について説明します。

## 型定義の構造

### core/types ディレクトリ構造
Rimorの型定義は、機能別に以下のファイルに分割されています：

```
src/core/types/
├── index.ts              # 統一エクスポート
├── base-types.ts         # 基本型定義（Issue、SeverityLevel等）
├── plugin-interface.ts   # プラグインインターフェース（IPlugin、ITestQualityPlugin等）
├── analysis-result.ts    # 分析結果型（DetectionResult、AnalysisReport等）
├── quality-score.ts      # 品質スコア型（QualityScore、QualityDimension等）
├── domain-dictionary.ts  # ドメイン辞書型（DomainDictionary、DomainTerm等）
├── project-context.ts    # プロジェクトコンテキスト型（ProjectContext、TestFile等）
├── improvements.ts       # 改善提案型（Improvement、ImprovementEngine等）
└── type-guards.ts        # 型ガード関数（実行時型チェック）
```

## 命名規則

### インターフェース命名
- **抽象インターフェース**（実装必須）: `I`プレフィックスを使用
  - 例: `IPlugin`, `ITestQualityPlugin`, `IPluginManager`
- **データ型/設定型**: プレフィックスなし
  - 例: `AnalysisOptions`, `AnalysisResult`, `ProjectContext`
- **型エイリアス**: 説明的な名前
  - 例: `QualityDimension`, `SeverityLevel`

## 型ガードの実装

型安全性を実行時にも保証するため、主要な型に対して型ガード関数を実装しています：

```typescript
// 型ガード関数の例
export function isValidPackageJson(value: unknown): value is PackageJsonConfig {
  if (!isObject(value)) return false;
  // Required fields
  if (typeof value.name !== 'string' || typeof value.version !== 'string') {
    return false;
  }
  // ... additional validation
  return true;
}
```

### 実装済み型ガード
- `isValidPackageJson` - package.json設定の検証
- `isValidASTNode` - AST構造の検証
- `isValidProjectContext` - プロジェクトコンテキストの検証
- `isValidIssue` - Issue型の検証
- `isValidDetectionResult` - 検出結果の検証
- `isValidQualityScore` - 品質スコアの検証
- `isValidImprovement` - 改善提案の検証

## 移行ガイド

### 既存コードからの移行
既存のコードは後方互換性のため、引き続き`core/types.ts`からインポート可能ですが、新規コードでは個別のファイルからインポートすることを推奨します：

```typescript
// 旧方式（後方互換性のため維持）
import { IPlugin, Issue, QualityScore } from './core/types';

// 新方式（推奨）
import { IPlugin } from './core/types/plugin-interface';
import { Issue } from './core/types/base-types';
import { QualityScore } from './core/types/quality-score';

// または統一インポート
import { IPlugin, Issue, QualityScore } from './core/types';
```

## any型の使用について

### 使用方針
プロジェクトでは、型安全性向上のためany型の使用を最小限に抑えています。

### 正当な理由があるany型の使用箇所

#### 1. 型ガード関数のパラメータ
```typescript
// 型ガード関数では、検証対象をunknownで受け取る
function isValidType(value: unknown): value is SpecificType
```

#### 2. 外部ライブラリとのインターフェース
- TypeScript Compiler APIとの連携
- Babel Parser APIとの連携
- その他型定義が不完全なライブラリ

#### 3. 動的な型変換が必要な箇所
- JSONパース結果の処理
- 動的インポート
- リフレクション処理

### any型削減の取り組み
- Issue #63により、プロジェクト全体のany型使用を約40%削減
- unknown型への移行を推進
- 型ガード関数による安全な型変換の実装

## TypeScript設定

### strict mode
プロジェクトはTypeScriptのstrict modeで動作します：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## ベストプラクティス

### 1. 型定義の作成
- 単一責任の原則に従い、機能ごとに型定義ファイルを分割
- 関連する型は同じファイルにグループ化
- 過度に細分化しない

### 2. 型の再利用
- 共通型はbase-types.tsに定義
- プロジェクト固有の型はproject-context.tsに定義
- ドメイン固有の型はdomain-dictionary.tsに定義

### 3. 型ガードの活用
- 外部データの検証には必ず型ガードを使用
- 型アサーションよりも型ガードを優先
- unknown型から具体的な型への変換時に使用

### 4. ジェネリクスの活用
```typescript
// 汎用的な結果型
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}
```

## 今後の改善計画

### Phase 1（完了）
- ✅ core/types.tsの分割
- ✅ 基本的な型ガードの実装
- ✅ 命名規則の統一

### Phase 2（進行中）
- ⚠️ any型の完全除去（残存約135箇所）
- ⚠️ より詳細な型ガードの実装
- ⚠️ ジェネリクスの活用拡大

### Phase 3（計画中）
- Branded Typesの導入
- Utility Typesの拡充
- 型レベルプログラミングの活用

## 関連リソース

- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

## 更新履歴

- 2025-08-09: Issue #63による大規模な型定義の再構成
- 2025-08-09: ドキュメント初版作成