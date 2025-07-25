# Rimor - テスト品質監査ツール

**Rimor**（リモール）は、静的解析とプラグイン駆動アーキテクチャを使用して、テスト品質の問題を特定するツールです。ラテン語で「深く掘る」「徹底的に探索する」を意味し、見過ごされがちなテスト品質の問題を発見することを目的としています。

## 特徴

- 📊 **プラグイン駆動システム** - すべての品質チェックをプラグインとして実装
- 🏆 **品質スコア算出** - 5次元品質評価による定量的テスト品質分析（v0.4.0）
- 📈 **トレンド分析** - Git履歴連携による品質変化追跡と予測（v0.4.0）
- 🎯 **改善提案生成** - AI駆動による自動改善推奨システム（v0.4.0）
- 🧙 **対話型プラグイン作成** - 質問に答えるだけでカスタムプラグイン作成（v0.2.0）
- 🔍 **静的解析エンジン** - コード実行なしでテスト品質を分析
- ⚡ **高速実行** - 通常数ミリ秒で分析完了
- 🎯 **設定可能** - プロジェクト固有の設定をサポート
- 📋 **多様な出力形式** - テキスト・JSON・CSV・HTML形式に対応
- 🌍 **国際化対応** - 日本語・英語対応（v0.2.0）
- 🔧 **TypeScript完全対応** - TypeScriptプロジェクトでの動作に最適化

## インストール

### npm実行（推奨）

```bash
# インストール不要で即座実行
npx rimor

# 特定のディレクトリを分析
npx rimor ./src
```

### ローカル開発用

```bash
# プロジェクトのクローン
git clone https://github.com/sasakama-code/rimor.git
cd rimor

# 依存関係のインストール
npm install

# TypeScriptコンパイル
npm run build
```

## 基本的な使用方法

### 基本コマンド

```bash
# カレントディレクトリを分析
npx rimor

# 特定のディレクトリを分析
npx rimor ./src

# 詳細モードで実行
npx rimor --verbose

# JSON形式で出力
npx rimor --json

# JSON形式で特定ディレクトリを分析
npx rimor ./src --format=json

# ヘルプの表示
npx rimor --help
```

### 品質スコア算出（v0.4.0の新機能）

```bash
# プロジェクト全体の品質スコア算出
npx rimor score

# 特定ディレクトリの品質スコア算出
npx rimor score ./src

# JSON形式でスコア出力
npx rimor score --format=json

# 品質トレンド分析
npx rimor trend

# スコア履歴表示
npx rimor history

# 詳細なスコア分析
npx rimor score --verbose
```

### 開発者向けコマンド（ローカル環境）

```bash
# ディレクトリ全体の分析（推奨）
npm run analyze ./src

# JSON形式で出力
npm run analyze:json ./src

# 詳細モードで実行
npm run analyze:verbose ./src

# 完全チェック（ビルド + テスト + 分析）
npm run full-check
```

### 実行例

```bash
$ npx rimor ./src

🔍 Rimor テスト品質監査
━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  分析対象: /path/to/project/src

🔍 検出された問題:
1. ❌ テストファイルが見つかりません: src/index.ts

📊 サマリー:
📁 分析対象: 11ファイル
❌ テスト不足: 1件
📈 テストカバレッジ: 91%
⏱️  実行時間: 4ms
```

### CI/CD での使用例

```bash
# GitHub Actions での使用
- name: Run Rimor test quality audit
  run: npx rimor --json ./src > rimor-report.json

# 結果を確認して失敗時は CI を停止
- name: Check test quality
  run: |
    if [ $(cat rimor-report.json | jq '.summary.issuesFound') -gt 0 ]; then
      echo "テスト品質の問題が発見されました"
      exit 1
    fi
```

## プラグイン作成（v0.2.0の新機能）

Rimorの最大の特徴は、**対話型プラグイン作成システム**です。プログラミング知識がなくても、質問に答えるだけでカスタムプラグインを作成できます。

### 対話型プラグイン作成

```bash
# 対話モードでプラグイン作成
npx rimor plugin create -i

🧙 Rimor Plugin Creation Assistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome! Create custom plugins by
answering a few simple questions.

? What test quality aspect would you like to check?
> APIのエラーハンドリングが適切に行われているか確認したい

? What does this check aim to prevent?
> 本番環境でのAPIエラーが適切にハンドリングされず、ユーザーに不親切なエラーが表示されること

✨ Analyzing samples...
✅ Plugin generated successfully
🎉 Plugin saved: src/plugins/generated/api-error-handling-plugin.ts
```

### テンプレートからプラグイン作成

```bash
# 利用可能なテンプレート一覧
npx rimor plugin create --help

# 基本テンプレートから作成
npx rimor plugin create --template basic

# 非同期テスト専用プラグイン
npx rimor plugin create --template async-await

# APIテスト専用プラグイン
npx rimor plugin create --template api-test

# バリデーション専用プラグイン
npx rimor plugin create --template validation

# パターンマッチングプラグイン
npx rimor plugin create --template pattern-match
```

### 既存プラグインから派生作成

```bash
# 既存プラグインをベースにカスタム版を作成
npx rimor plugin create --from testExistence
```

### 利用可能なテンプレート

| テンプレート | 説明 | 用途 |
|-------------|------|------|
| `basic` | 基本的なプラグインテンプレート | カスタムロジック実装の出発点 |
| `pattern-match` | パターンマッチングプラグイン | 特定の文字列・パターンの検出 |
| `async-await` | 非同期テスト専用 | async/awaitの適切な使用チェック |
| `api-test` | APIテスト専用 | HTTPステータス・レスポンス検証 |
| `validation` | バリデーション専用 | 入力値検証の境界値テスト |

### 国際化対応

```bash
# 英語環境での実行
RIMOR_LANG=en npx rimor plugin create --help

# 日本語環境での実行（デフォルト）
RIMOR_LANG=ja npx rimor plugin create -i
```

## 品質スコア算出システム（v0.4.0）

Rimorの品質スコア算出システムは、テスト品質を定量的に評価し、継続的な改善をサポートします。

### 5次元品質評価

| ディメンション | 説明 | 評価内容 |
|-------------|------|----------|
| **完全性** | テスト網羅性 | テストケースの網羅度、境界値テスト等 |
| **正確性** | テスト正確性 | アサーションの品質、テスト論理の妥当性 |
| **保守性** | テスト保守性 | コードの可読性、構造化、重複の排除 |
| **パフォーマンス** | 実行効率 | テスト実行時間、リソース使用量 |
| **セキュリティ** | 安全性 | セキュリティテスト、脆弱性チェック |

### グレードシステム

- **A** (90-100点): 優秀 - エンタープライズレベルの品質
- **B** (80-89点): 良好 - 本番環境に適用可能
- **C** (70-79点): 標準 - 基本的な品質要件を満たす
- **D** (60-69点): 要改善 - 改善が必要
- **F** (0-59点): 不合格 - 大幅な見直しが必要

### 実行例

```bash
$ npx rimor score ./src

📊 Rimorテスト品質スコアレポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 総合評価
├─ プロジェクトスコア: 85/100 [=========-] B
├─ 前回からの変化: +12.3 ↑
└─ 評価対象: 156 ファイル

📈 ディメンション別スコア
├─ 完全性:     90/100 [=========] A
├─ 正確性:     82/100 [========-] B
├─ 保守性:     87/100 [========-] B
├─ パフォーマンス: 79/100 [=======--] C
└─ セキュリティ:  84/100 [========-] B

🎯 改善推奨事項（上位3件）
1. [Critical] src/api/payment.test.ts
   → セキュリティテストを追加（推定改善: +12点）
2. [High] src/services/auth.test.ts
   → エラーケースの網羅（推定改善: +8点）
3. [High] src/utils/validation.test.ts
   → 境界値テストの追加（推定改善: +6点）
```

### トレンド分析

```bash
$ npx rimor trend

📈 品質トレンド分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 過去30日間のスコア推移
85 ┤                                      ╭─
84 ┤                                 ╭────╯
83 ┤                        ╭────────╯
82 ┤               ╭────────╯
81 ┤    ╭──────────╯
80 ┼────╯
   └────────────────────────────────────────→
   30日前                              今日

🔍 変化の詳細
├─ 総合スコア: 80 → 85 (+5点, +6.3%)
├─ 最大改善: 完全性 (+8点)
├─ 注意事項: セキュリティ (-2点)
└─ 予測: 来週 87点 (信頼度: 85%)
```

### スコア設定のカスタマイズ

```json
{
  "scoring": {
    "weights": {
      "dimensions": {
        "completeness": 1.0,
        "correctness": 1.5,
        "maintainability": 0.8,
        "performance": 0.5,
        "security": 1.2
      },
      "plugins": {
        "test-existence": 1.0,
        "assertion-exists": 1.2
      },
      "fileTypes": {
        "*.critical.test.ts": 2.0,
        "*.integration.test.ts": 1.5
      }
    },
    "grades": {
      "A": 90,
      "B": 80,
      "C": 70,
      "D": 60
    }
  }
}
```

## 設定ファイル

Rimorは以下の設定ファイルをサポートします（優先度順）：

1. `.rimorrc.json`
2. `.rimorrc`
3. `rimor.config.json`

### 設定例

```json
{
  "plugins": {
    "test-existence": {
      "enabled": true
    },
    "assertion-exists": {
      "enabled": true
    }
  },
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.config.*",
    "*.test.*",
    "*.spec.*"
  ],
  "testPatterns": [
    "**/*.test.{js,ts,tsx}",
    "**/*.spec.{js,ts,tsx}",
    "**/__tests__/**/*.{js,ts,tsx}"
  ],
  "output": {
    "format": "text",
    "verbose": false
  }
}
```

### 設定項目

| 項目 | 説明 | デフォルト値 |
|------|------|--------------|
| `plugins` | 使用するプラグインの設定 | 全プラグイン有効 |
| `excludePatterns` | 分析から除外するファイルパターン | 設定ファイルとテストファイル |
| `testPatterns` | テストファイルのパターン | `.test.*`, `.spec.*`, `__tests__/` |
| `output.format` | 出力形式（`text` または `json`） | `text` |
| `output.verbose` | 詳細表示フラグ | `false` |

## 利用可能なプラグイン

### TestExistencePlugin
- **機能**: ソースファイルに対応するテストファイルの存在確認
- **検出内容**: テストファイルが存在しないソースファイル
- **設定ID**: `test-existence`

### AssertionExistsPlugin
- **機能**: テストファイル内のアサーション文の存在確認
- **検出内容**: `expect`、`assert`、`should`文がないテストファイル
- **設定ID**: `assertion-exists`

## JSON出力形式

`--format=json` オプションを使用した場合の出力形式：

```json
{
  "summary": {
    "totalFiles": 11,
    "issuesFound": 1,
    "testCoverage": 91,
    "executionTime": 4
  },
  "issues": [
    {
      "type": "missing-test",
      "severity": "error",
      "message": "テストファイルが見つかりません: src/index.ts",
      "file": "src/index.ts",
      "plugin": "test-existence"
    }
  ],
  "config": {
    "targetPath": "/path/to/project/src",
    "enabledPlugins": ["TestExistencePlugin", "AssertionExistsPlugin"],
    "format": "json"
  }
}
```

## 開発者向け情報

### テストの実行

```bash
# 全テストの実行
npm test

# 特定のテストファイルの実行
npm test -- analyzer.test.ts
```

### プロジェクト構造

```
rimor/
├── src/
│   ├── core/              # コアシステム
│   │   ├── analyzer.ts    # 静的解析エンジン
│   │   ├── pluginManager.ts # プラグインマネージャー
│   │   ├── config.ts      # 設定管理
│   │   └── types.ts       # 型定義
│   ├── plugins/           # プラグイン実装
│   │   ├── testExistence.ts
│   │   └── assertionExists.ts
│   └── cli/               # CLI実装
│       ├── cli.ts
│       ├── output.ts
│       └── commands/
│           └── analyze.ts
├── test/                  # テストファイル
└── docs/                  # ドキュメント
```

### ビルドとデプロイ

```bash
# TypeScriptコンパイル
npm run build

# テスト実行
npm test

# 完全なビルドとテストのサイクル
npm run build && npm test
```

## ライセンス

MIT License

## 貢献

プロジェクトへの貢献を歓迎します。Issue報告やPull Requestをお気軽にお送りください。

## バージョン履歴

### v0.5.0 (AI-Optimized Output & Security Enhancement)
- **AI向け出力最適化システム**: 構造化出力による修正作業の自動化促進
- **セキュリティ強化**: サンドボックス化・設定検証・CLI引数検証によるエンタープライズ対応
- **コンテキスト抽出エンジン**: コード周辺情報の自動収集とAI向け構造化
- **修正提案テンプレート**: 具体的なコード修正指示の自動生成
- **多形式出力**: JSON・Markdown・プロンプトテンプレート対応
- **アクション可能タスク**: 実行可能な改善ステップの自動生成
- **トークン制限対応**: 大規模プロジェクトでのAI処理最適化
- **セキュリティサンドボックス**: 安全な実行環境とパス正規化

### v0.4.0 (Quality Score System)
- **品質スコア算出システム**: 5次元品質評価による定量的分析
- **トレンド分析**: Git履歴連携による品質変化追跡と予測
- **改善提案生成**: AI駆動による自動改善推奨システム
- **重み付けカスタマイズ**: プラグイン・ディメンション・ファイルタイプ別重み設定
- **多様なレポート形式**: CLI・JSON・CSV・HTML対応
- **グレードシステム**: A-Fの5段階評価とスコア分布可視化
- **パフォーマンス最適化**: 大規模プロジェクト対応とキャッシュシステム
- **セキュリティ強化**: 設定ファイル処理の堅牢性向上

### v0.3.0 (Advanced Plugin System)
- **高度なプラグインシステム**: ITestQualityPlugin完全実装
- **プラグインメタデータ**: バージョニング・詳細情報管理
- **拡張コアコンポーネント**: AnalyzerExtended・PluginManagerExtended
- **パフォーマンス監視**: リアルタイム実行時間測定・ボトルネック特定
- **キャッシュマネージャー**: インテリジェントキャッシングシステム
- **並列アナライザー**: 大規模プロジェクト対応の並列処理

### v0.2.0 (Interactive Plugin Creation)
- **対話型プラグイン作成**: 質問応答式カスタムプラグイン生成
- **5種類のテンプレート**: basic・pattern-match・async-await・api-test・validation
- **国際化対応**: 日本語・英語切り替え（RIMOR_LANG）
- **CLIコマンド統合**: `rimor plugin create`サブコマンド

### v0.1.1 (Bug Fixes)
- **重要なバグ修正**: TestExistencePluginのテストパス探索問題解決
- **CI/CD必須化**: 品質ゲート強化とRimor必須チェック実装
- **テストカバレッジ向上**: 27% → 100%（追加テスト作成なし）
- **設定ファイル統合**: excludeFiles設定の適用改善
- **検出精度強化**: test/ディレクトリ構造・特殊命名対応

### v0.1.0 (MVP)
- コア静的解析機能
- TestExistencePlugin（テストファイル存在確認）
- AssertionExistsPlugin（アサーション存在確認）
- 設定ファイルサポート
- JSON/テキスト出力対応
- CLI基本機能