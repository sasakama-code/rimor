# Rimor v0.8.0 移行ガイド

## 概要

Rimor v0.8.0は、Context Engineeringの原則を採用した大規模なアップデートです。このガイドでは、既存のRimorユーザーがv0.8.0にスムーズに移行するための情報を提供します。

## 主な変更点

### 1. アーキテクチャの刷新

- **DIコンテナ（Inversify）** の導入
- **60%の機能削減** による簡素化
- **Context Engineering** による出力最適化

### 2. 新しいCLIコマンド体系

#### 従来のコマンド（v0.7.x以前）

```bash
# 基本的な分析
rimor analyze ./src

# JSON出力
rimor analyze ./src --format=json
rimor analyze ./src --json

# 詳細モード
rimor analyze ./src --verbose
```

#### 新しいコマンド（v0.8.0）

```bash
# 基本的な分析（互換性あり）
rimor analyze ./src

# 構造化出力（新機能）
rimor analyze ./src --output-json report.json
rimor analyze ./src --output-markdown report.md
rimor analyze ./src --output-html report.html

# インラインアノテーション（新機能）
rimor analyze ./src --annotate
```

## 移行手順

### ステップ1: パッケージの更新

```bash
npm update rimor@^0.8.0
```

### ステップ2: 設定ファイルの更新

#### rimor.config.js（変更なし）

既存の設定ファイルは引き続き使用可能です：

```javascript
module.exports = {
  plugins: {
    'test-existence': { enabled: true },
    'assertion-exists': { enabled: true }
  },
  output: {
    format: 'text',
    verbose: false
  }
};
```

### ステップ3: CI/CDスクリプトの更新

#### 従来のCI設定

```yaml
- name: Run Rimor
  run: |
    npx rimor analyze ./src --json > results.json
    if [ $? -ne 0 ]; then
      echo "Issues found"
      exit 1
    fi
```

#### 新しいCI設定（推奨）

```yaml
- name: Run Rimor v0.8.0
  run: |
    # 構造化JSON出力を使用
    npx rimor analyze ./src --output-json results.json
    
    # jqを使ってCritical問題をチェック
    CRITICAL=$(jq '.summary.issueBySeverity.critical' results.json)
    if [ "$CRITICAL" -gt 0 ]; then
      echo "Critical issues found: $CRITICAL"
      exit 1
    fi
```

### ステップ4: カスタムスクリプトの更新

#### 従来のスクリプト

```javascript
const { Analyzer } = require('rimor');

const analyzer = new Analyzer();
analyzer.registerPlugin(new MyCustomPlugin());
const result = await analyzer.analyze('./src');
```

#### 新しいスクリプト（v0.8.0）

```javascript
import { container, TYPES } from 'rimor';

// DIコンテナから取得
const analysisEngine = container.get(TYPES.AnalysisEngine);
const reporter = container.get(TYPES.Reporter);

// 分析実行
const result = await analysisEngine.analyze('./src');

// レポート生成
await reporter.generateAnalysisReport(result, {
  format: 'json',
  outputPath: 'results.json'
});
```

## 非互換性のある変更

### 1. 削除されたモジュール

以下のモジュールはv0.8.0で削除されました：

- `src/dictionary/*` - ドメイン辞書システム
- `src/interactive/*` - 対話型プラグイン作成
- `src/scoring/*` - 品質スコア算出
- `src/ai-output/*` - 旧AI出力システム（Context Engineeringに置き換え）

### 2. 変更されたAPI

#### PluginManager

```typescript
// 従来
const pluginManager = new PluginManager();
pluginManager.loadPlugin(plugin);

// v0.8.0
const pluginManager = container.get<IPluginManager>(TYPES.PluginManager);
await pluginManager.registerPlugin(plugin);
```

#### Reporter

```typescript
// 従来
const formatter = new OutputFormatter();
console.log(formatter.format(result));

// v0.8.0
const reporter = container.get<IReporter>(TYPES.Reporter);
await reporter.generateAnalysisReport(result, {
  format: ReportFormat.TEXT
});
```

## 新機能の活用

### 1. 複数形式での同時出力

```bash
# 分析結果を複数の形式で保存
rimor analyze ./src \
  --output-json ci-results.json \
  --output-markdown report.md \
  --output-html dashboard.html
```

### 2. インラインアノテーション

```bash
# コードレビュー用のアノテーション生成
rimor analyze ./src \
  --annotate \
  --annotate-format=block \
  --annotate-output ./reviewed-code
```

### 3. AIツールとの統合

```bash
# AI分析用の最適化された出力
rimor analyze ./src \
  --output-json ai-analysis.json \
  --severity=critical,high \
  --include-details
```

## トラブルシューティング

### 問題1: 古いプラグインが動作しない

**症状**: カスタムプラグインがエラーを起こす

**解決策**: `LegacyPluginAdapter`を使用

```typescript
import { LegacyPluginAdapter } from 'rimor';

const adapter = new LegacyPluginAdapter(oldPlugin);
pluginManager.registerPlugin(adapter);
```

### 問題2: 出力形式が異なる

**症状**: JSON出力の構造が変わった

**解決策**: 新しいスキーマに対応

```javascript
// 従来
const issues = result.issues;

// v0.8.0
const issues = result.issues; // 構造は同じだが、より詳細な情報を含む
const severity = result.summary.issueBySeverity; // 新しいサマリー情報
```

### 問題3: パフォーマンスの違い

**症状**: 分析が以前より遅い/速い

**解決策**: キャッシュとパフォーマンスオプションを調整

```bash
# キャッシュを有効化（デフォルト）
rimor analyze ./src --cache

# パフォーマンス監視を有効化
rimor analyze ./src --performance --show-performance-report
```

## ベストプラクティス

### 1. 段階的な移行

1. まず、新しいCLIオプションをテスト環境で試す
2. CI/CDスクリプトを新しい形式に更新
3. カスタムスクリプトを順次移行

### 2. 出力の検証

```bash
# 従来の出力と新しい出力を比較
rimor analyze ./src --json > old-format.json
rimor analyze ./src --output-json new-format.json

# 差分を確認
diff old-format.json new-format.json
```

### 3. 新機能の段階的採用

- **Phase 1**: 基本的な互換性確認
- **Phase 2**: 構造化出力（JSON/Markdown）の採用
- **Phase 3**: インラインアノテーションの活用
- **Phase 4**: AIツールとの統合

## サポート

### ドキュメント

- [Context Engineeringガイド](./v0.8.0-context-engineering.md)
- [APIリファレンス](./api-reference-v0.8.0.md)
- [CLIリファレンス](./cli-reference-v0.8.0.md)

### 問題報告

移行中に問題が発生した場合は、以下の情報と共に報告してください：

1. 使用していたRimorのバージョン
2. エラーメッセージ
3. 実行したコマンド
4. 関連する設定ファイル

## まとめ

Rimor v0.8.0への移行により、以下のメリットが得られます：

- **より構造化された出力** - AI/自動化ツールとの統合が容易
- **柔軟な出力オプション** - 用途に応じた最適な形式
- **インラインフィードバック** - 開発者体験の向上
- **シンプルなアーキテクチャ** - 保守性と拡張性の向上

移行には多少の作業が必要ですが、長期的にはより効率的で強力なテスト品質分析が可能になります。