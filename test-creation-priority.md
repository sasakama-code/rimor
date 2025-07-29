# テストファイル作成優先順位リスト

## 優先度: CRITICAL (即日対応推奨)

### 1. コア分析エンジン
これらは Rimor の心臓部であり、すべての機能の基盤となります。

```
src/core/engine.ts                              → test/core/engine.test.ts
src/core/implementations/AnalysisEngineImpl.ts  → test/core/implementations/AnalysisEngineImpl.test.ts
```

### 2. プラグインシステム
プラグインアーキテクチャの中核コンポーネント。

```
src/core/implementations/PluginManagerImpl.ts   → test/core/implementations/PluginManagerImpl.test.ts
src/core/implementations/LegacyPluginAdapter.ts → test/core/implementations/LegacyPluginAdapter.test.ts
```

## 優先度: HIGH (1-3日以内)

### 3. CLIコマンド
ユーザーが直接操作する主要インターフェース。

```
src/cli/commands/analyze.ts   → test/cli/commands/analyze.test.ts
src/cli/commands/bootstrap.ts → test/cli/commands/bootstrap.test.ts
src/cli/commands/validate.ts  → test/cli/commands/validate.test.ts
```

### 4. AIエラーレポーティング
自己診断機能の信頼性確保。

```
src/testing/jest-ai-reporter.ts    → test/testing/jest-ai-reporter.test.ts
src/testing/ai-error-formatter.ts  → test/testing/ai-error-formatter.test.ts
src/testing/error-context.ts       → test/testing/error-context.test.ts
```

### 5. レポーティングシステム
分析結果の出力を担当。

```
src/core/implementations/StructuredReporterImpl.ts → test/core/implementations/StructuredReporterImpl.test.ts
src/core/implementations/ReporterImpl.ts           → test/core/implementations/ReporterImpl.test.ts
```

## 優先度: MEDIUM (1週間以内)

### 6. セキュリティ基盤
セキュリティ機能の中核実装。

```
src/core/implementations/SecurityAuditorImpl.ts → test/core/implementations/SecurityAuditorImpl.test.ts
src/security/analysis/engine.ts                 → test/security/analysis/engine.test.ts
src/security/analysis/flow.ts                   → test/security/analysis/flow.test.ts
```

### 7. ワーカープール
並列処理の基盤。

```
src/core/workerPool.ts → test/core/workerPool.test.ts
```

### 8. AI出力フォーマッター
AI向け最適化出力。

```
src/ai-output/formatter.ts → test/ai-output/formatter.test.ts
```

## 優先度: LOW (2週間以内)

### 9. ユーティリティ
補助的な機能。

```
src/analyzers/code-context/utils.ts → test/analyzers/code-context/utils.test.ts
src/utils/securityHelpers.ts        → test/utils/securityHelpers.test.ts
```

### 10. 拡張機能
追加的な機能モジュール。

```
src/core/pluginManagerExtended.ts            → test/core/pluginManagerExtended.test.ts
src/feedback/FeedbackCollectionSystem.ts     → test/feedback/FeedbackCollectionSystem.test.ts
src/reporting/cache/ReportCache.ts           → test/reporting/cache/ReportCache.test.ts
```

## テスト作成から除外推奨

以下のファイルはインターフェース定義のみを含むため、テスト作成の必要性は低い：

- `src/core/interfaces/*.ts` (すべてのインターフェースファイル)
- `src/security/types/*.ts` (型定義ファイル)

## テスト作成ガイドライン

### 各テストで確認すべき項目

1. **正常系シナリオ**
   - 基本的な機能が期待通りに動作すること
   - 各種オプションが正しく処理されること

2. **異常系シナリオ**
   - 不正な入力に対する適切なエラーハンドリング
   - リソース不足時の挙動
   - 依存関係の失敗時の処理

3. **エッジケース**
   - 境界値のテスト
   - 空の入力/大量の入力
   - 並行処理時の競合状態

4. **統合テスト**
   - 他のコンポーネントとの連携
   - E2Eシナリオ

## 実装推奨事項

1. **テスト駆動開発の活用**
   - 既存コードの理解を深めるためにテストから書く
   - リファクタリングの機会として活用

2. **モックの適切な使用**
   - 外部依存関係は適切にモック化
   - ただし過度なモック化は避ける

3. **テストの保守性**
   - DRY原則に従った共通処理の抽出
   - わかりやすいテスト名とアサーション

4. **カバレッジ目標**
   - 各ファイル80%以上のカバレッジ
   - 重要な分岐はすべてカバー