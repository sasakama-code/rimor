# Rimor プロジェクト 命名規則ガイドライン

## 概要

本ドキュメントは、Rimorプロジェクトにおけるファイル命名、クラス命名、ディレクトリ構成の統一的な規則を定義します。コードベースの可読性、保守性、および開発者体験の向上を目的としています。

## 設計原則

### 基本方針
- **明確性**: 名前から目的・役割が明確に理解できること
- **一貫性**: プロジェクト全体で統一された命名パターン
- **検索性**: ファイルやクラスが容易に発見できること
- **将来性**: プロジェクトの成長・変化に対応可能な構造

### 避けるべきパターン
- バージョン番号をファイル名に含める（例: `analyze-v0.8.ts`）
- `*Impl.ts`サフィックス（実装であることは自明）
- 不明確な略語や一般的すぎる名前（例: `analyzer.ts`）

## ファイル命名規則

### 1. 実装クラス
```
パターン: {Domain}{Purpose}.ts
例: PluginManager.ts, CachedAnalysisEngine.ts
```

**Good:**
- `PluginManager.ts` - プラグイン管理クラス
- `CachedAnalysisEngine.ts` - キャッシュ機能付き分析エンジン
- `ParallelAnalysisEngine.ts` - 並列処理対応分析エンジン

**Bad:**
- `PluginManagerImpl.ts` - Implサフィックスは不要
- `analyzer.ts` - 役割が不明確
- `analyze-v0.8.ts` - バージョン番号は不適切

### 2. インターフェース
```
パターン: I{DomainPurpose}.ts
例: IPluginManager.ts, IAnalysisEngine.ts
```

**統一方針**: Iプレフィックスを使用（TypeScript慣習に従いつつ、プロジェクト内一貫性を重視）

### 3. テストファイル
```
パターン: {TargetFile}.{TestType}.test.ts
例: PluginManager.unit.test.ts, AnalysisEngine.integration.test.ts
```

**テストタイプ分類:**
- `*.unit.test.ts` - ユニットテスト
- `*.integration.test.ts` - 統合テスト
- `*.e2e.test.ts` - E2Eテスト

**ヘルパーファイル:**
- `*.test-helper.ts` - テスト用ヘルパー関数

### 4. プラグイン
```
パターン: {Purpose}Plugin.ts
例: TestExistencePlugin.ts, AssertionExistsPlugin.ts
```

### 5. 型定義ファイル
```
パターン: {domain}-types.ts または types/{domain}/{specific}.ts
例: security-types.ts, types/analysis/scoring.ts
```

## ディレクトリ構成

### コア構造
```
src/
├── core/                    # コアコンポーネント
│   ├── implementations/     # 実装クラス
│   ├── interfaces/         # インターフェース定義
│   └── types/              # コア型定義
├── types/                  # 型定義集約
│   ├── analysis/           # 分析関連型
│   ├── security/           # セキュリティ関連型
│   ├── plugins/            # プラグイン関連型
│   └── shared/             # 共通型定義
├── plugins/                # プラグインシステム
│   ├── base/               # ベースクラス
│   ├── core/               # コアプラグイン
│   └── security/           # セキュリティプラグイン
└── cli/                    # CLI関連
    └── commands/           # コマンド実装
```

### 型定義の組織化
```
src/types/
├── analysis/
│   ├── scoring.ts          # スコア計算関連
│   └── reporting.ts        # レポート生成関連
├── security/
│   ├── taint-analysis.ts   # Taint分析関連
│   ├── flow-types.ts       # データフロー関連
│   └── checker-framework.ts # チェッカーフレームワーク
└── plugins/
    └── log-types.ts        # プラグインログ関連
```

## クラス命名規則

### 1. 実装クラス
```
パターン: {Domain}{Purpose}
例: PluginManager, AnalysisEngine, SecurityAuditor
```

### 2. インターフェース
```
パターン: I{DomainPurpose}
例: IPluginManager, IAnalysisEngine, ISecurityAuditor
```

### 3. レガシーコンポーネント
```
パターン: Legacy{Original}
例: LegacyAnalyzer, LegacyExtendedAnalyzer
```

廃止予定のコンポーネントには`Legacy`プレフィックスを付けて、明確に区別する。

## 実践的なガイドライン

### コードレビューチェックリスト

#### ファイル命名
- [ ] バージョン番号がファイル名に含まれていないか
- [ ] `*Impl.ts`パターンを使用していないか
- [ ] ファイル名から役割が明確に理解できるか
- [ ] テストファイルが適切な分類（unit/integration/e2e）を使用しているか

#### クラス命名
- [ ] インターフェースに`I`プレフィックスが付いているか
- [ ] 実装クラス名が具体的で説明的か
- [ ] レガシーコンポーネントに`Legacy`プレフィックスが付いているか

#### ディレクトリ構成
- [ ] 型定義が適切なディレクトリに配置されているか
- [ ] プラグインが適切なカテゴリに分類されているか
- [ ] インポートパスが短く、明確か

### 新機能追加時の指針

1. **ファイル作成前のチェック**
   - 類似の既存ファイルの命名パターンを確認
   - ディレクトリ構成の適切な場所を選択
   - 型定義の配置場所を検討

2. **命名の決定プロセス**
   - ドメインと目的を明確に定義
   - 既存の命名パターンとの整合性を確認
   - 将来の拡張性を考慮

3. **実装後の確認**
   - インポート文の簡潔性
   - ファイル検索の容易性
   - ドキュメント生成への影響

## 自動化とツール

### ESLintルール（推奨設定）
```javascript
// .eslintrc.js
rules: {
  // ファイル命名規則の検証
  'unicorn/filename-case': ['error', {
    cases: {
      camelCase: true,
      pascalCase: true
    }
  }]
}
```

### pre-commitフック
```bash
#!/bin/sh
# ファイル名のパターンチェック
git diff --cached --name-only | grep -E '\.(ts|tsx)$' | while read file; do
  # バージョン番号チェック
  if echo "$file" | grep -q 'v[0-9]\+\.[0-9]\+'; then
    echo "Error: Version number detected in filename: $file"
    exit 1
  fi
  
  # Implサフィックスチェック  
  if echo "$file" | grep -q 'Impl\.ts$'; then
    echo "Error: Impl suffix detected in filename: $file"
    exit 1
  fi
done
```

### CIでの命名規則チェック
```yaml
# .github/workflows/naming-check.yml
- name: Check Naming Conventions
  run: |
    # バージョン番号の検出
    if find src -name "*v[0-9]*.[0-9]*.ts" | grep -q .; then
      echo "::error::Version numbers found in filenames"
      exit 1
    fi
    
    # Implサフィックスの検出
    if find src -name "*Impl.ts" | grep -q .; then
      echo "::error::Impl suffix found in filenames"  
      exit 1
    fi
```

## 改善履歴

### Phase 0: バージョン番号付きファイルの緊急対応
- `analyze-v0.8.ts` → `analyze.ts`
- `AnalyzeCommandV8` → `AnalyzeCommand`

### Phase 1: 実装クラス命名統一
- `*Impl.ts`パターンを全て削除
- `PluginManagerImpl` → `PluginManager`
- `AnalysisEngineImpl` → `AnalysisEngine`

### Phase 2: インターフェース・テスト命名規則
- テスト命名の標準化（`.unit.test.ts`, `.integration.test.ts`）
- インターフェース命名の`I`プレフィックス統一確認

### Phase 3: Analyzer・Plugin命名統一
- Analyzerクラスの具体的命名（`CachedAnalysisEngine`, `ParallelAnalysisEngine`）
- Plugin命名の`*Plugin.ts`統一

### Phase 4: 型定義ファイル集約
- 主要型定義を`src/types/`ディレクトリに集約
- カテゴリ別整理（analysis, security, plugins）

## 今後の展望

### 継続的改善
- 開発者フィードバックの収集と反映
- 新しい命名パターンの検討
- ツールの自動化レベル向上

### 品質指標
- ファイル発見時間の測定
- 新規参加者のオンボーディング時間
- コードレビュー時の命名関連コメント数

---

**更新日**: 2025年8月20日  
**バージョン**: 1.0  
**メンテナ**: Rimor開発チーム