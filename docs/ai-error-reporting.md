# AI Error Reporting System (v0.8.0)

## 概要

RimorのAI Error Reporting Systemは、Context Engineeringの手法を活用して、テストエラー情報をAIが理解しやすい形式で提供するシステムです。これにより、エラー修正の効率が大幅に向上し、開発者はより迅速に問題を解決できます。

## 背景と目的

### 課題
- 同じようなエラー修正で時間を取られている
- エラーログが冗長で、重要な情報を見つけにくい
- AIアシスタント（Claude Code等）に提供する際、コンテキストが不足している

### 解決策
Context Engineeringの4つの戦略を適用：
1. **Write Context**: エラー情報を構造化して保存
2. **Select Context**: 関連するコンテキストを選択的に含める
3. **Compress Context**: 重要な情報のみを保持
4. **Isolate Context**: エラーの種類ごとに文脈を分離

## システム構成

### コンポーネント

#### 1. TestErrorContextCollector (`src/testing/error-context.ts`)
テストエラー発生時の完全なコンテキストを収集します。

収集する情報：
- テストファイルの内容と失敗箇所
- 失敗したアサーションの詳細
- 関連するソースコード
- 依存関係情報
- 実行環境情報（Node.js版、Jest版、メモリ使用量等）

#### 2. AITestErrorFormatter (`src/testing/ai-error-formatter.ts`)
収集したコンテキストをAI向けに最適化された形式でフォーマットします。

機能：
- エラーの分類と優先順位付け
- 類似エラーのグループ化
- 解決策の提案
- 修正時間の推定

#### 3. JestAIReporter (`src/testing/jest-ai-reporter.ts`)
Jestカスタムレポーターとして動作し、テスト実行時に自動的にエラー情報を収集・フォーマットします。

## 使用方法

### 基本設定

1. **jest.config.mjsの設定**
```javascript
export default {
  // ... 他の設定
  reporters: [
    'default',
    ['<rootDir>/dist/testing/jest-ai-reporter.js', {
      outputPath: 'test-errors-ai.md',
      enableConsoleOutput: true
    }]
  ],
};
```

2. **ビルドとテスト実行**
```bash
# TypeScriptをビルド
npm run build

# テストを実行（エラーレポート自動生成）
npm test
```

### 出力形式

#### Markdownレポート (`test-errors-ai.md`)
AIが読みやすい構造化されたマークダウン形式：
- エラーサマリー（総数、重大度、推定修正時間）
- 共通パターンの識別
- 推奨アクション
- エラー詳細（コード、修正案、信頼度）
- デバッグ手順
- AI向け指示

#### JSONレポート (`test-errors-ai.json`)
プログラムで処理可能な構造化データ：
```json
{
  "version": "0.8.0",
  "format": "ai-test-error",
  "summary": {
    "totalErrors": 7,
    "criticalErrors": 0,
    "testFileCount": 1,
    "commonPatterns": ["モジュール未検出エラー"],
    "estimatedFixTime": 35
  },
  "errorGroups": [...],
  "contextualInstructions": {...},
  "quickActions": [...]
}
```

## エラーパターンと優先度

### 優先度レベル
1. **Critical**: TypeScriptコンパイルエラー
2. **High**: モジュール未検出、インポートエラー
3. **Medium**: アサーション不一致
4. **Low**: その他のエラー

### 自動検出されるパターン
- モジュール未検出エラー
- タイムアウトエラー
- アサーション不一致
- 型エラー
- Null/Undefined参照エラー
- モック関連エラー

## ドッグフーディング戦略

Rimor自身のテストにこのシステムを適用することで：
1. **実践的な検証**: 実際のプロジェクトでの有効性を確認
2. **継続的改善**: 自身のエラーログから改善点を発見
3. **品質向上**: Rimor自体のテスト品質が向上

## 効果と利点

### 定量的効果
- エラー修正時間の短縮（推定30-50%）
- 重要情報の発見時間短縮
- エラーパターンの可視化

### 定性的効果
- AIアシスタントの理解度向上
- デバッグ体験の改善
- チーム全体の生産性向上

## 今後の拡張

### 計画中の機能
1. **機械学習による修正提案**: 過去の修正パターンから学習
2. **統合開発環境連携**: VSCode等との直接統合
3. **リアルタイムエラー分析**: テスト実行中のライブ分析
4. **チーム共有機能**: エラーパターンのチーム間共有

### カスタマイズ可能な要素
- エラーパターンの追加定義
- 優先度計算ロジックのカスタマイズ
- 出力フォーマットの拡張
- 言語別の修正提案テンプレート

## 技術仕様

### 依存関係
- Jest 29.x以上
- TypeScript 5.x以上
- Node.js 18.x以上

### パフォーマンス
- エラー収集のオーバーヘッド: < 100ms/エラー
- レポート生成時間: < 1秒（100エラーまで）
- メモリ使用量: 最大50MB追加

## まとめ

RimorのAI Error Reporting Systemは、Context Engineeringの原則を適用することで、テストエラーの修正効率を大幅に向上させます。構造化されたエラー情報により、AIアシスタントはより的確な修正提案を行え、開発者はより迅速に問題を解決できます。

このシステムは、Rimor自身の開発でも活用されており、ドッグフーディング戦略により継続的な改善が行われています。