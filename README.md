# Rimor - テスト品質監査ツール

**Rimor**（リモール）は、静的解析とプラグイン駆動アーキテクチャを使用して、テスト品質の問題を特定するツールです。ラテン語で「深く掘る」「徹底的に探索する」を意味し、見過ごされがちなテスト品質の問題を発見することを目的としています。

## 特徴

- 📊 **プラグイン駆動システム** - すべての品質チェックをプラグインとして実装
- 🔍 **静的解析エンジン** - コード実行なしでテスト品質を分析
- ⚡ **高速実行** - 通常数ミリ秒で分析完了
- 🎯 **設定可能** - プロジェクト固有の設定をサポート
- 📋 **多様な出力形式** - テキストとJSON形式に対応
- 🔧 **TypeScript完全対応** - TypeScriptプロジェクトでの動作に最適化

## インストール

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

### コマンドライン実行

```bash
# ディレクトリ全体の分析（推奨）
npm run analyze ./src

# 単一ファイルの分析
npm run analyze ./src/index.ts

# JSON形式で出力
npm run analyze:json ./src

# 詳細モードで実行
npm run analyze:verbose ./src

# 開発時の便利コマンド（プロジェクトルートを分析）
npm run dev

# 完全チェック（ビルド + テスト + 分析）
npm run full-check

# ヘルプの表示
npm start --help
```

### 実行例

```bash
$ npm run analyze ./src

> rimor@0.1.0 analyze
> npm run build && node dist/index.js analyze ./src

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

### v0.1.0 (MVP)
- コア静的解析機能
- TestExistencePlugin（テストファイル存在確認）
- AssertionExistsPlugin（アサーション存在確認）
- 設定ファイルサポート
- JSON/テキスト出力対応
- CLI基本機能