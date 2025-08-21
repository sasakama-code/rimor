# Rimor - AIコーディング時代の品質保証エンジン

Rimorは、プロダクションコードとテストコードの両方を解析し、実装と意図のギャップを自動検出・評価するツールです。AIエージェントが大量のコードを生成する現代において、人手では困難なスケールでコード品質を保証します。

## なぜRimorが必要なのか（WHY）

### AIコーディング時代の課題

- **大量のコード生成**: Claude Code、GitHub Copilotなどが数秒で数百行のコードを生成
- **人手レビューの限界**: 膨大なテストコードを人間が完全にレビューすることは非現実的
- **品質保証の危機**: テストの質を保証できなければ、ソフトウェアの信頼性が崩壊する

### Rimorの信念

AIが生成したコードであっても、人間が書いたコードであっても、その品質と意図の整合性は自動的に検証可能であるべきです。

## どのように実現するか（HOW）

### 実装駆動型の二重検証アプローチ

1. **プロダクションコードの真実を確立**
   - TaintTyperによる型フロー解析でプロダクションコードの実際の振る舞いを把握
   - セキュリティ脆弱性、データフロー、依存関係を「実装の真実」として構造化

2. **テストコードの意図を抽出し検証**
   - テストが何を検証しようとしているかを自動抽出
   - プロダクションコードの実装と照合してギャップを特定

3. **NIST準拠のリスク評価**
   - 検出されたギャップを業界標準（NIST SP 800-30）で評価
   - 優先順位付けされた改善提案を自動生成

## Rimorとは何か（WHAT）

### 主要機能

- **実装の真実の確立**: プロダクションコードの完全な振る舞い解析
- **意図の自動抽出**: テストが検証しようとしている内容の推論
- **ギャップの可視化**: 実装と意図の不一致を定量的に表示
- **リスクベース優先順位**: NIST準拠の評価による改善提案

### 現在の実装状況

- **TaintTyper**: 型ベースセキュリティ解析エンジン（コンパイル時実行、ランタイム影響ゼロ）
- **意図抽出システム**: テストの記述文やコードパターンからの意図推論
- **統合オーケストレーター**: TaintTyper → 意図抽出 → ギャップ分析 → NIST評価
- **多形式レポート**: Markdown、JSON、HTML、AI-JSON形式での出力

## インストール

### npx実行（推奨）

```bash
# 基本的な解析
npx rimor analyze ./src

# 詳細なJSON出力
npx rimor analyze ./src --format=json

# AI向け構造化出力
npx rimor analyze ./src --format=ai-json
```

### ローカル開発

```bash
git clone https://github.com/sasakama-code/rimor.git
cd rimor
npm install
npm run build
```

## 使用方法

### 基本コマンド

```bash
# 基本的な分析（従来のv0.8.0モード）
npx rimor analyze ./src

# Implementation Truth分析（v0.9.0新機能）
npx rimor analyze ./src --implementation-truth

# プロダクションコードとテストコードの統合分析
npx rimor analyze ./src --implementation-truth --test-path ./test

# AI向け最適化出力
npx rimor analyze ./src --ai-output --format=ai-json

# プロダクションコード中心の分析
npx rimor analyze ./src --production-code

# 詳細なJSON出力
npx rimor analyze ./src --implementation-truth --format=json --verbose
```

### Implementation Truth分析の特徴（v0.9.0）

```bash
# テスト意図とプロダクションコードの実装のギャップを検出
npx rimor analyze ./src --implementation-truth --test-path ./test --verbose

# AI向けに最適化された構造化出力
npx rimor analyze ./src --implementation-truth --ai-output --format=ai-json

# 高重要度の問題のみをフィルタ
npx rimor analyze ./src --implementation-truth --severity critical high
```

### プログラマティックAPI

```typescript
import { UnifiedAnalysisEngine } from 'rimor';

const engine = new UnifiedAnalysisEngine();

// 統合解析の実行
const result = await engine.analyze('./src');

// 実装の真実を確立
const implementationTruth = result.implementationTruth;
console.log(`検出された脆弱性: ${implementationTruth.vulnerabilities.length}`);

// 意図実現度の評価
const realizationGaps = result.realizationGaps;
console.log(`実装と意図のギャップ: ${realizationGaps.length}`);

// 改善提案の確認
result.recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.description}`);
});
```

### 専用コマンド

Rimor v0.9.0では、従来の`analyze`コマンドに加えて、特定用途向けの専用コマンドも提供しています：

```bash
# Implementation Truth専用分析（高精度）
npx rimor implementation-truth-analyze ./src

# テストコードも含めた包括的分析
npx rimor implementation-truth-analyze ./src --test-path ./test

# AI向け最適化でMarkdown出力
npx rimor implementation-truth-analyze ./src --format markdown --optimize-for-ai

# 高重要度以上の問題のみ抽出
npx rimor implementation-truth-analyze ./src --min-severity high --verbose
```

**専用コマンドの利点:**
- Implementation Truth機能に特化した高精度分析
- より詳細な進捗表示とエラーハンドリング
- AI向け出力の高度なカスタマイズ
- 既存ワークフローに影響しない独立実行

### 実用例とベストプラクティス

```bash
# 1. 開発時の継続的チェック
npx rimor analyze ./src --implementation-truth --verbose

# 2. CI/CDパイプラインでの品質ゲート
npx rimor analyze ./src --implementation-truth --format=json --min-severity=high

# 3. AIペアプログラミング時の品質確認
npx rimor analyze ./src --ai-output --format=ai-json --include-code-examples

# 4. レガシーコードのモダナイゼーション支援
npx rimor implementation-truth-analyze ./legacy-src --test-path ./test --detail-level=comprehensive
```

**推奨設定:**
- プロダクション環境では`--min-severity=high`以上を推奨
- AI支援開発では`--ai-output`フラグを活用
- 大規模プロジェクトでは`--parallel`オプションを使用

## 技術仕様

### アーキテクチャ

- **DIベース設計**: InversifyJS containerによる依存性注入
- **Wrapperパターン**: 統一されたプラグインシステム
- **統合解析エンジン**: 複数の解析手法を統合実行

### セキュリティ解析（TaintTyper）

型ベースのセキュリティ解析により以下を検出：

- SQL Injection
- Command Injection
- Path Traversal
- XSS (Cross-Site Scripting)
- 入力検証の欠如

```typescript
// 脆弱性検出例
const query = `SELECT * FROM users WHERE id = ${userId}`; // ← 検出される
mysql.query(query);

// 推奨される修正
const query = `SELECT * FROM users WHERE id = ?`;
mysql.query(query, [userId]);
```

### 意図実現度の評価

```typescript
// テスト意図の抽出例
describe('ユーザー認証', () => {
  it('正しいパスワードでログインできる', () => {
    // Rimorが抽出する意図: 認証成功パスの検証
    // 検証項目: パスワード検証、セッション作成、認可チェック
  });
});

// ギャップ検出例
{
  type: 'missing_security_test',
  description: 'SQLインジェクション対策のテストが不足',
  severity: 'HIGH',
  recommendation: 'パラメータ化クエリのテストケースを追加'
}
```

## 開発コマンド

### ビルド・テスト

```bash
# TypeScriptコンパイル
npm run build

# 全テスト実行（2500個のテスト）
npm test

# 高速テスト（重要なテストのみ）
npm run test:quick

# 型チェック
npm run lint
```

### 解析コマンド

```bash
# 自己解析（ドッグフーディング）
npm run analyze

# src配下の解析
npm run analyze:src

# 詳細JSON出力
npm run analyze:json
```

## 設定

### プロジェクト設定（.rimorrc.json）

```json
{
  "analysis": {
    "enableProductionCodeAnalysis": true,
    "enableTaintAnalysis": true,
    "riskThreshold": "medium"
  },
  "output": {
    "format": "markdown",
    "includeRecommendations": true,
    "aiOptimized": false
  },
  "security": {
    "customSanitizers": ["sanitizeInput"],
    "customSinks": ["executeQuery"]
  }
}
```

## 実世界での使用例

### 大規模プロジェクトでの適用

Rimor自身が2500個のテストを持つプロジェクトにおいて、以下の価値を提供：

- **自動レビュー**: 人手では不可能なスケールでのテスト品質評価
- **継続的改善**: CI/CDパイプラインでの自動品質チェック
- **技術債務の可視化**: 優先度付きの改善タスクリスト生成

### AIコーディング支援

- **AIエージェント向け出力**: 機械可読な修正指示
- **自動修正候補**: 具体的なコード改善案の提示
- **品質フィードバック**: 次回のコード生成への学習情報

## アーキテクチャ詳細

### ディレクトリ構成

```text
src/
├── core/           # DIコンテナ、統合エンジン、型定義
├── analyzers/      # コード解析（構造、依存関係、カバレッジ）
├── security/       # TaintTyper型ベースセキュリティ解析
├── intent-analysis/# テスト意図抽出とギャップ分析
├── nist/          # NIST SP 800-30準拠のリスク評価
├── reporting/     # 多形式レポート生成
├── types/         # 型定義（implementation-truth, intent-realization等）
└── cli/           # コマンドラインインターフェース
```

### 処理フロー

1. **プロダクションコード解析** → 実装の真実を確立
2. **TaintTyper実行** → セキュリティ脆弱性検出
3. **テスト意図抽出** → テストが検証しようとしている内容を推論
4. **ギャップ分析** → 実装と意図の不一致を検出
5. **NIST評価** → リスクレベルと優先度の算出
6. **レポート生成** → 改善提案の出力

## ライセンス

MITライセンス - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 変更履歴

最新の変更については[CHANGELOG.md](./CHANGELOG.md)を参照してください。

---

**Rimor** - プロダクションコードとテストコードの品質を、AIが大量生成する時代に適応したスケールで保証する
