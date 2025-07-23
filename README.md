# Rimor - テスト品質監査ツール

**Rimor**（リモール）は、静的解析とプラグイン駆動アーキテクチャを使用して、テスト品質の問題を特定するツールです。ラテン語で「深く掘る」「徹底的に探索する」を意味し、見過ごされがちなテスト品質の問題を発見することを目的としています。

## 特徴

- 📊 **プラグイン駆動システム** - すべての品質チェックをプラグインとして実装
- 🧙 **対話型プラグイン作成** - 質問に答えるだけでカスタムプラグイン作成（v0.2.0）
- 🔍 **静的解析エンジン** - コード実行なしでテスト品質を分析
- ⚡ **高速実行** - 通常数ミリ秒で分析完了
- 🎯 **設定可能** - プロジェクト固有の設定をサポート
- 📋 **多様な出力形式** - テキストとJSON形式に対応
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