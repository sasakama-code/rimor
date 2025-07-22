# 対話型プラグイン作成システム要件定義書 v0.2.0

## 1. 概要

### 1.1 機能の目的と価値

対話型プラグイン作成システムは、プログラミング知識がなくても自然言語での対話を通じてRimorのカスタムプラグインを作成できる機能です。これにより「知識の民主化」を実現し、ドメインエキスパートが直接品質ルールを形式化できるようになります。

**主な価値提供**
- 技術的ハードルの排除：プログラミング不要でプラグイン作成可能
- 知識の形式化促進：暗黙知を明示的なルールに変換
- 迅速な品質改善：発見した問題をすぐにプラグイン化
- チーム全体の参加：開発者以外もテスト品質向上に貢献

### 1.2 Rimor全体における位置づけ

本機能はRimorの差別化要因となる中核機能であり、以下の役割を担います：
- プラグインエコシステムの成長促進
- 組織固有の品質基準の確立支援
- 継続的な品質改善サイクルの実現

## 2. 機能要件

### 2.1 ユーザーストーリー

**US-1: 品質管理者として**
- テストで確認すべき項目を日本語で説明したい
- 良いテストの例を提示して、そのパターンをルール化したい
- 作成したルールをチーム全体で共有したい

**US-2: シニア開発者として**
- コードレビューで頻繁に指摘する内容を自動化したい
- 既存のプラグインを基に、カスタマイズしたい
- プラグインの動作を確認してから適用したい

**US-3: ドメインエキスパートとして**
- 業界特有の要件をテストルールに反映したい
- 技術的な詳細は分からないが、何をチェックすべきかは明確
- チェック項目を段階的に追加・改善したい

### 2.2 詳細な機能仕様

#### 2.2.1 対話フロー

```bash
$ npx rimor plugin create --interactive

🧙 Rimorプラグイン作成アシスタント
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ようこそ！いくつかの質問に答えるだけで、
カスタムプラグインを作成できます。

? どのようなテスト品質をチェックしたいですか？
> [ユーザー入力]

? このチェックは何を防ぐことを目的としていますか？
> [ユーザー入力]

? 良いテストの例を教えてください（スキップ可能）
> [コード入力またはスキップ]

? 悪いテストの例を教えてください（スキップ可能）
> [コード入力またはスキップ]
```

#### 2.2.2 パターン分析機能

ユーザーが提供したテストコードの例から、以下を自動的に抽出：
- 使用されているアサーションパターン
- テスト構造（describe/it/test等）
- 検証対象（変数名、関数名等）
- エラーハンドリングパターン

#### 2.2.3 プラグイン生成機能

分析結果を基に、以下の形式でプラグインを生成：

```typescript
// 生成されるプラグインの例
export class GeneratedPlugin implements IPlugin {
  name = 'user-defined-check';
  
  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];
    
    // ユーザー定義のパターンチェック
    if (!content.includes('[検出パターン]')) {
      issues.push({
        type: 'missing-pattern',
        severity: 'warning',
        message: '[ユーザー定義メッセージ]',
        file: filePath
      });
    }
    
    return issues;
  }
}
```

#### 2.2.4 検証機能

生成されたプラグインを実際のコードに適用し、結果をプレビュー：

```bash
✨ プラグインを生成しました

プレビューモードで実行します...

📊 検出結果
├─ src/api/user.test.ts
│  └─ ⚠️ [ユーザー定義メッセージ]
└─ src/api/payment.test.ts
   └─ ⚠️ [ユーザー定義メッセージ]

? この結果は期待通りですか？
> ◉ はい、保存します
> ○ いいえ、調整します
> ○ キャンセル
```

### 2.3 インターフェース定義

#### 2.3.1 CLIコマンド

```bash
# 対話型モードでプラグイン作成
rimor plugin create --interactive

# テンプレートから作成
rimor plugin create --template [template-name]

# 既存プラグインから派生
rimor plugin create --from [plugin-name]
```

#### 2.3.2 内部API

```typescript
interface IInteractivePluginCreator {
  // 対話セッションの開始
  startSession(): Promise<Session>;
  
  // ユーザー入力の処理
  processInput(session: Session, input: string): Promise<NextStep>;
  
  // サンプルコードの分析
  analyzeSamples(goodExamples: string[], badExamples: string[]): Promise<Pattern[]>;
  
  // プラグインの生成
  generatePlugin(patterns: Pattern[], metadata: PluginMetadata): Promise<GeneratedPlugin>;
  
  // プラグインの検証
  validatePlugin(plugin: GeneratedPlugin, testFiles: string[]): Promise<ValidationResult>;
  
  // プラグインの保存
  savePlugin(plugin: GeneratedPlugin, name: string): Promise<void>;
}
```

## 3. 非機能要件

### 3.1 パフォーマンス基準

- 対話の応答時間：1秒以内
- パターン分析時間：10秒以内（100行のコードに対して）
- プラグイン生成時間：5秒以内
- 検証実行時間：通常の分析実行時間の1.5倍以内

### 3.2 拡張性・保守性

- プラグインテンプレートの追加が容易
- 新しい質問タイプの追加が可能
- 多言語対応を考慮した設計（初期は日本語のみ）
- 生成されたプラグインは手動編集可能

### 3.3 セキュリティ考慮事項

- ユーザー入力のサニタイゼーション
- 生成されるコードの安全性検証
- ファイルシステムアクセスの制限
- 悪意のあるパターンの検出と拒否

## 4. 実装範囲

### 4.1 v0.2.0で含まれる機能

- 基本的な対話フロー（5つの質問）
- シンプルなパターンマッチング
- 文字列検索ベースのプラグイン生成
- 基本的な検証とプレビュー
- プラグインの保存と読み込み

### 4.2 v0.2.0で含まれない機能（将来バージョン）

- 高度なパターン分析（AST解析等）
- 複数条件の組み合わせ
- 自動修正機能の生成
- プラグインの共有・公開機能
- 機械学習による改善提案
- GUI/Webインターフェース

## 5. 技術仕様

### 5.1 アーキテクチャ設計

```
src/
├── interactive/
│   ├── creator.ts          # メインの対話エンジン
│   ├── analyzer.ts         # パターン分析器
│   ├── generator.ts        # コード生成器
│   ├── validator.ts        # 検証システム
│   └── templates/          # プラグインテンプレート
│       ├── basic.ts
│       └── pattern-match.ts
└── cli/
    └── commands/
        └── plugin-create.ts # CLIコマンド実装
```

### 5.2 データモデル

```typescript
// セッション情報
interface Session {
  id: string;
  startTime: Date;
  currentStep: Step;
  collectedData: {
    purpose?: string;
    preventionGoal?: string;
    goodExamples?: string[];
    badExamples?: string[];
    patterns?: Pattern[];
  };
}

// パターン情報
interface Pattern {
  type: 'string-match' | 'regex' | 'structure';
  value: string;
  description: string;
  confidence: number;
}

// 生成されたプラグイン
interface GeneratedPlugin {
  code: string;
  metadata: {
    name: string;
    description: string;
    createdBy: 'interactive';
    createdAt: Date;
    patterns: Pattern[];
  };
}
```

### 5.3 実装の詳細

#### 5.3.1 対話エンジン

```typescript
class InteractiveCreator {
  private prompts: Prompts;
  
  async startSession(): Promise<Session> {
    const session = createNewSession();
    
    // Step 1: 目的の確認
    const purpose = await this.prompts.ask(
      'どのようなテスト品質をチェックしたいですか？'
    );
    session.collectedData.purpose = purpose;
    
    // Step 2: 防止目標の確認
    const preventionGoal = await this.prompts.ask(
      'このチェックは何を防ぐことを目的としていますか？'
    );
    session.collectedData.preventionGoal = preventionGoal;
    
    return session;
  }
}
```

#### 5.3.2 パターン分析器

```typescript
class PatternAnalyzer {
  analyzeExamples(good: string[], bad: string[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // 良い例に共通するパターンを抽出
    const commonPatterns = this.findCommonPatterns(good);
    
    // 悪い例に欠けているパターンを特定
    const missingInBad = this.findMissingPatterns(bad, commonPatterns);
    
    // 信頼度の計算
    patterns.push(...this.calculateConfidence(missingInBad));
    
    return patterns;
  }
}
```

## 6. テスト計画

### 6.1 テストケース

**機能テスト**
- TC-01: 基本的な対話フローの完了
- TC-02: サンプルコードからのパターン抽出
- TC-03: プラグインの生成と保存
- TC-04: 生成されたプラグインの実行
- TC-05: エラーケースの処理

**統合テスト**
- TC-06: 既存のプラグインシステムとの統合
- TC-07: CLIコマンドとの統合
- TC-08: 設定ファイルとの連携

### 6.2 品質基準

- コードカバレッジ：90%以上
- 対話完了率：80%以上（ユーザーテストにて）
- 生成成功率：70%以上（有効なプラグインの生成）
- パフォーマンス基準の達成率：100%

### 6.3 検収条件

- すべての機能テストケースの合格
- ドキュメントの完備
- サンプルプラグインの作成成功（3種類以上）
- チームメンバーによる受け入れテストの完了

## 7. リスクと対策

### 7.1 技術的リスク

**リスク1：パターン分析の精度不足**
- 影響：生成されるプラグインが期待通り動作しない
- 対策：シンプルな文字列マッチングから開始し、段階的に高度化

**リスク2：生成コードの品質問題**
- 影響：実行時エラーやパフォーマンス問題
- 対策：厳格なテンプレート使用とバリデーション強化

### 7.2 スケジュールリスク

**リスク3：対話設計の複雑化**
- 影響：開発期間の延長
- 対策：MVP思考で最小限の対話から開始

### 7.3 ユーザビリティリスク

**リスク4：対話の分かりにくさ**
- 影響：機能が使われない
- 対策：早期のユーザーテストとフィードバック収集

## 8. 今後の拡張計画

### v0.3.0での拡張候補
- AST（抽象構文木）を使用した高度な分析
- 複数パターンの組み合わせ条件
- プラグインテンプレートライブラリの拡充

### v0.4.0での拡張候補
- 自動修正コードの生成
- 既存プラグインの改良機能
- チーム内でのプラグイン共有

### 将来的な構想
- 機械学習によるパターン提案
- Webベースの対話インターフェース
- プラグインマーケットプレイス

---

**作成日**: 2025-01-22
**バージョン**: 1.0
**承認者**: [承認待ち]
**最終更新**: 2025-01-22