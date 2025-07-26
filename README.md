# Rimor - AI最適化テスト品質監査ツール v0.6.1

**Rimor**（リモール）は、静的解析とプラグイン駆動アーキテクチャを使用して、テスト品質の問題を特定する次世代ツールです。ラテン語で「深く掘る」「徹底的に探索する」を意味し、見過ごされがちなテスト品質の問題を発見することを目的としています。

## 🆕 v0.6.0の新機能 - ドメイン辞書システム

**Rimorが大幅にパワーアップ！** ドメイン知識を活用したコンテキスト理解により、より深い品質分析が可能になりました。

### 主な新機能
- 📚 **ドメイン辞書システム** - ビジネス用語とルールによる文脈理解
- 🧠 **知識抽出エンジン** - ESLint/TypeScript/Prettier設定からの自動学習
- 🔍 **文脈理解分析** - コードのドメイン関連度とビジネス適合性評価
- 🚀 **セットアップウィザード** - 新規プロジェクト向け自動初期化
- ⚡ **高性能キャッシュ** - メモリ・ディスクの2段階キャッシュシステム
- 🔧 **プラグイン統合** - DictionaryAwarePlugin対応

## 特徴

- 📊 **プラグイン駆動システム** - すべての品質チェックをプラグインとして実装
- 📚 **ドメイン辞書システム** - ビジネス知識を活用した高度な分析（v0.6.0）
- 🧠 **自動知識抽出** - プロジェクト設定からドメイン知識を自動学習（v0.6.0）
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

# 新機能：ドメイン辞書対応分析
npx rimor --dictionary
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

## 🚀 クイックスタート（v0.6.0）

### 1. プロジェクト初期化

```bash
# 新規プロジェクトのセットアップウィザード
npx rimor bootstrap init

# 自動モードでの初期化
npx rimor bootstrap init --auto --domain=ecommerce

# セットアップ状況の確認
npx rimor bootstrap status
```

### 2. 辞書管理

```bash
# 辞書の一覧表示
npx rimor dictionary list

# 新しい用語の追加
npx rimor dictionary add-term

# 辞書の検証
npx rimor dictionary validate

# 辞書の分析統計
npx rimor dictionary analyze
```

### 3. 辞書対応分析

```bash
# ドメイン辞書を使用した分析
npx rimor --dictionary

# 特定ドメインでの分析
npx rimor --dictionary=ecommerce

# 詳細な文脈分析
npx rimor --dictionary --verbose
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

### 品質スコア算出（v0.4.0の機能）

```bash
# プロジェクト全体の品質スコア算出
npx rimor --scoring

# 特定ディレクトリの品質スコア算出
npx rimor ./src --scoring

# JSON形式でスコア出力
npx rimor --scoring --format=json

# 品質トレンド分析
npx rimor trend analyze

# スコア履歴表示
npx rimor history show

# 詳細なスコア分析
npx rimor --scoring --verbose --report-type=detailed
```

### ドメイン辞書システム（v0.6.0の新機能）

#### プロジェクトブートストラップ

```bash
# 初期化ウィザード
npx rimor bootstrap init

# 強制再初期化
npx rimor bootstrap init --force

# 特定テンプレートでの初期化
npx rimor bootstrap init --template=ecommerce

# セットアップ検証
npx rimor bootstrap validate

# セットアップクリーンアップ
npx rimor bootstrap clean --confirm
```

#### 辞書管理

```bash
# 利用可能な辞書の表示
npx rimor dictionary list

# 新しい用語の追加（対話形式）
npx rimor dictionary add-term

# バッチでの用語追加
npx rimor dictionary add-term --term="Payment" --category="financial" --importance="critical"

# 用語の検索
npx rimor dictionary search "payment"

# 辞書の検証
npx rimor dictionary validate

# 辞書の分析統計
npx rimor dictionary analyze

# 辞書の初期化
npx rimor dictionary init --domain=ecommerce
```

#### 高度な分析

```bash
# ドメイン辞書を使用した文脈分析
npx rimor analyze --dictionary

# 特定ドメインでの分析
npx rimor analyze --dictionary=ecommerce ./src

# 詳細な文脈分析レポート
npx rimor analyze --dictionary --format=html --output=domain-report.html

# ビジネス規則との適合性チェック
npx rimor analyze --dictionary --business-rules
```

### 開発者向けコマンド（ローカル環境）

```bash
# ディレクトリ全体の分析（推奨）
npm run analyze:src

# 辞書対応分析
npm run analyze:dictionary

# JSON形式で出力
npm run analyze:src:json

# 辞書管理
npm run dictionary:list
npm run dictionary:validate

# ブートストラップ
npm run bootstrap:init
npm run bootstrap:status

# 包括的品質チェック
npm run full-check

# テスト実行
npm test                    # 全テスト
npm run test:unit          # 単体テスト
npm run test:integration   # 統合テスト
npm run test:performance   # 性能テスト
```

## 🏗️ アーキテクチャ

### システム構成（v0.6.0）

```
Rimor v0.6.0
├── 🧠 Core Engine
│   ├── Static Analysis Engine
│   ├── Plugin Manager
│   └── Dictionary-Aware Plugin Manager (NEW)
├── 📚 Domain Dictionary System (NEW)
│   ├── Knowledge Extractor
│   ├── Context Analysis Engine
│   ├── Business Rules Engine
│   └── Cache System
├── 🔌 Plugin Ecosystem
│   ├── Core Plugins
│   ├── Framework Plugins
│   ├── Domain Plugins (NEW)
│   └── Custom Plugins
├── 💾 Storage Layer
│   ├── YAML Dictionary Storage (NEW)
│   ├── Cache Management
│   └── Version Control
└── 🖥️ CLI Interface
    ├── Analysis Commands
    ├── Dictionary Commands (NEW)
    └── Bootstrap Commands (NEW)
```

### プラグインアーキテクチャ

```typescript
// 従来のプラグイン
interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

// 新しい辞書対応プラグイン（v0.6.0）
interface DictionaryAwarePlugin extends ITestQualityPlugin {
  analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis>;
  
  evaluateDomainQuality(
    patterns: DetectionResult[],
    context: DomainContext
  ): DomainQualityScore;
}
```

### ドメイン辞書システム

#### 辞書構造

```yaml
# .rimor/dictionaries/ecommerce.yaml
version: "1.0.0"
domain: "ecommerce"
language: "ja"
lastUpdated: "2024-01-15T10:30:00Z"

terms:
  - id: "payment-001"
    term: "Payment"
    definition: "決済処理機能"
    category: "financial"
    importance: "critical"
    aliases: ["決済", "payment", "pay"]
    examples:
      - code: "processPayment(amount, currency)"
        description: "金額と通貨を指定した決済処理"
    relatedPatterns: ["payment.*", "pay.*"]
    testRequirements:
      - "決済金額の妥当性テスト"
      - "決済失敗時のエラーハンドリングテスト"

businessRules:
  - id: "payment-validation"
    name: "決済バリデーションルール"
    description: "すべての決済処理にバリデーションが必要"
    condition:
      type: "function-name"
      pattern: ".*[Pp]ayment.*"
      scope: "function"
    requirements:
      - type: "must-have"
        description: "金額妥当性テスト"
        testPattern: "expect\\(.*amount.*\\)\\.toBe.*"
```

#### 知識抽出

システムは以下の設定ファイルから自動的にドメイン知識を抽出します：

- **ESLint設定** (`.eslintrc.json`) - プロジェクトの技術スタックとコーディング規則
- **TypeScript設定** (`tsconfig.json`) - 型定義とモジュール構成
- **Prettier設定** (`.prettierrc`) - コードフォーマット規則

#### 文脈分析エンジン

```typescript
// コード分析結果
interface ContextualAnalysis {
  context: CodeContext;           // 基本的なコード構造
  relevantTerms: TermRelevance[]; // 関連するドメイン用語
  applicableRules: BusinessRule[]; // 適用可能なビジネスルール
  requiredTests: TestRequirement[]; // 推奨テストケース
  qualityScore: number;           // ドメイン品質スコア
}
```

## 📖 使用例

### 1. Ecommerceプロジェクトでの使用

```bash
# 1. プロジェクト初期化
npx rimor bootstrap init --domain=ecommerce

# 2. 基本分析
npx rimor analyze ./src

# 3. ドメイン辞書を使用した高度分析
npx rimor analyze ./src --dictionary

# 4. 決済モジュールの詳細分析
npx rimor analyze ./src/payment --dictionary --verbose
```

### 2. 既存プロジェクトへの統合

```bash
# 1. セットアップ状況確認
npx rimor bootstrap status

# 2. 自動設定抽出による辞書作成
npx rimor bootstrap init --auto

# 3. 辞書内容の確認・調整
npx rimor dictionary list
npx rimor dictionary validate

# 4. 段階的分析実行
npx rimor analyze ./src --dictionary
```

### 3. チーム開発での活用

```bash
# CI/CDパイプラインに統合
name: Quality Check
run: |
  npx rimor bootstrap validate
  npx rimor analyze --dictionary --format=json > quality-report.json
  npx rimor trend analyze --prediction

# 品質レポートの生成
npx rimor analyze --dictionary --format=html --output=team-quality-report.html
```

## 🔧 設定

### 設定ファイル (.rimorrc.json)

```json
{
  "version": "1.0.0",
  "project": {
    "domain": "ecommerce",
    "language": "typescript",
    "framework": "jest",
    "type": "web"
  },
  "dictionary": {
    "enabled": true,
    "defaultDomain": "ecommerce",
    "autoUpdate": true,
    "paths": {
      "dictionaries": ".rimor/dictionaries",
      "cache": ".rimor/cache"
    }
  },
  "plugins": {
    "enabled": ["domain-term-coverage"],
    "disabled": []
  },
  "analysis": {
    "includeTests": true,
    "includeComments": false,
    "minConfidence": 0.7
  }
}
```

### ディレクトリ構造

```
your-project/
├── .rimorrc.json              # Rimor設定ファイル
├── .rimor/
│   ├── dictionaries/
│   │   ├── ecommerce.yaml     # ドメイン辞書
│   │   └── financial.yaml     # 複数辞書対応
│   ├── cache/                 # キャッシュファイル
│   └── versions/              # バージョン履歴
├── src/
└── test/
```

## 📊 分析結果の例

### 従来の分析結果

```
🔍 テスト品質分析結果

📂 ./src/payment.test.ts
✅ テストファイル存在確認
⚠️  アサーション文が見つかりません (行: 15)

📊 品質スコア: 75/100
📈 改善提案: アサーション文の追加を検討してください
```

### ドメイン辞書対応分析結果（v0.6.0）

```
🔍 ドメイン対応テスト品質分析結果

📂 ./src/payment.test.ts
✅ テストファイル存在確認
✅ Paymentドメイン用語検出 (関連度: 92%)
⚠️  決済バリデーションルール未適用
🎯 推奨テストケース: 
   - 決済金額妥当性テスト
   - 決済失敗時エラーハンドリングテスト
   - 通貨コード検証テスト

📊 総合品質スコア: 82/100
📊 ドメイン適合度: 89/100
📊 ビジネス規則準拠度: 75/100
📊 技術品質: 88/100

🧠 文脈分析:
   - 決済処理フローの主要テストケースをカバー
   - エラーハンドリングの強化が推奨
   - ユーザー認証との連携テストが不足

💡 改善提案:
   - invalid payment amount のテストケース追加
   - 決済プロバイダーとの統合テスト実装
   - 決済ログの検証機能追加
```

## 🔌 プラグイン開発

### 基本プラグイン

```typescript
import { BasePlugin } from 'rimor/plugins/base/BasePlugin';

export class CustomTestPlugin extends BasePlugin {
  id = 'custom-test-plugin';
  name = 'Custom Test Plugin';
  version = '1.0.0';
  type = 'pattern' as const;

  isApplicable(context: ProjectContext): boolean {
    return context.language === 'typescript';
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    // カスタム分析ロジック
    return [];
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // 品質評価ロジック
    return { overall: 100, breakdown: {}, confidence: 1.0 };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    // 改善提案ロジック
    return [];
  }
}
```

### ドメイン辞書対応プラグイン（v0.6.0）

```typescript
import { DictionaryAwareBasePlugin } from 'rimor/plugins/base/DictionaryAwareBasePlugin';

export class DomainSpecificPlugin extends DictionaryAwareBasePlugin {
  id = 'domain-specific-plugin';
  name = 'Domain Specific Plugin';
  version = '1.0.0';
  type = 'domain' as const;

  async analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis> {
    // 辞書を使用した文脈分析
    const basicAnalysis = await super.analyzeWithContext(testFile, dictionary);
    
    // ドメイン固有の拡張分析
    const domainSpecificInsights = this.analyzeDomainSpecificPatterns(
      testFile, dictionary
    );
    
    return {
      ...basicAnalysis,
      qualityScore: this.calculateEnhancedScore(basicAnalysis, domainSpecificInsights)
    };
  }

  evaluateDomainQuality(
    patterns: DetectionResult[],
    context: DomainContext
  ): DomainQualityScore {
    // ドメイン固有の品質評価
    return super.evaluateDomainQuality(patterns, context);
  }
}
```

## 🎯 ベストプラクティス

### 1. 効果的な辞書設計

```yaml
# 適切な用語階層
terms:
  # 抽象的な概念
  - term: "Payment"
    category: "core-business"
    importance: "critical"
    
  # 具体的な実装
  - term: "CreditCardPayment"
    category: "implementation"
    importance: "high"
    relatedTerms: ["Payment"]
```

### 2. ビジネスルールの定義

```yaml
businessRules:
  # 明確な条件と要件
  - name: "Payment Security Rule"
    condition:
      type: "function-name"
      pattern: ".*[Pp]ayment.*"
    requirements:
      - type: "must-have"
        description: "Security validation test"
        testPattern: "expect\\(.*security.*\\)"
```

### 3. 継続的な品質改善

```bash
# 定期的な辞書更新
npx rimor dictionary analyze
npx rimor dictionary validate

# トレンド監視
npx rimor trend analyze --anomalies

# 品質向上の追跡
npx rimor history compare --baseline=30 --current=7
```

## 🤝 貢献方法

### 開発環境のセットアップ

```bash
# リポジトリのフォーク・クローン
git clone https://github.com/your-username/rimor.git
cd rimor

# 依存関係のインストール
npm install

# 開発用ビルド
npm run build

# テスト実行
npm test

# 統合テスト実行
npm run test:integration

# 性能テスト実行
npm run test:performance
```

### コードの貢献

1. **Issues**を確認して作業項目を選択
2. **Feature branch**を作成
3. **Test-driven development**でコード実装
4. **統合テスト**を実行して品質確認
5. **Pull Request**を作成

### プラグインの貢献

```bash
# プラグイン作成ウィザード
npx rimor plugin create --interactive

# カスタムプラグインテンプレート
npx rimor plugin create --template=domain-specific
```

## 📚 API リファレンス

### Core API

```typescript
// プラグインマネージャー
import { DictionaryAwarePluginManager } from 'rimor/core';

const manager = new DictionaryAwarePluginManager();
await manager.loadDictionary('./dictionary.yaml');
const results = await manager.runAllWithDictionary('./src');
```

### Dictionary API

```typescript
// 辞書管理
import { DomainDictionaryManager } from 'rimor/dictionary/core';

const dictionary = new DomainDictionaryManager({
  domain: 'ecommerce',
  language: 'ja'
});

dictionary.addTerm(term);
dictionary.searchTerms('payment');
```

### Context Analysis API

```typescript
// 文脈分析
import { ContextEngine } from 'rimor/dictionary/context';

const engine = new ContextEngine(dictionary);
const context = await engine.analyzeContext(code, filePath);
```


## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🔗 リンク

- **GitHub**: https://github.com/sasakama-code/rimor
- **NPM**: https://www.npmjs.com/package/rimor
- **ドキュメント**: https://github.com/sasakama-code/rimor/docs
- **Issues**: https://github.com/sasakama-code/rimor/issues
- **Discussions**: https://github.com/sasakama-code/rimor/discussions

## 🙏 謝辞

Rimorの開発にご協力いただいたコントリビューターの皆様、フィードバックをお寄せいただいたユーザーの皆様に心より感謝いたします。

---

**Rimor v0.6.1** - あなたのテスト品質を次のレベルへ 🚀