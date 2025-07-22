# ドメイン辞書システム要件定義書 v0.6.0

## 1. 概要

### 1.1 機能の目的と価値

ドメイン辞書システムは、組織・業界固有の知識や文脈を蓄積し、Rimorの品質分析をより深く、文脈に即したものにする知識ベース機能です。技術的な「形」だけでなく、ビジネス的な「意味」を理解した品質監査を実現します。

**主な価値提供**
- **文脈理解**: コードの技術的側面だけでなくビジネス的意味を理解
- **組織知識の形式化**: 暗黙知を明示的なルールとして蓄積
- **精度向上**: ドメイン固有の要件に基づく的確な品質評価
- **知識共有**: チーム間でのベストプラクティス共有

### 1.2 Rimor全体における位置づけ

本機能は、Rimorを汎用ツールから組織特化型ツールへと進化させる重要な要素であり：
- v0.2.0の対話型システムで収集した知識の蓄積先
- v0.3.0のプラグインが参照する文脈情報源
- v0.4.0の品質スコアに文脈を考慮した重み付けを提供

## 2. 機能要件

### 2.1 ユーザーストーリー

**US-1: ドメインエキスパートとして**
- 業界特有の用語や概念を辞書に登録したい
- ビジネスルールとテスト要件の関連を定義したい
- 重要度に応じた品質基準を設定したい

**US-2: 開発者として**
- コードの意味を理解した上で品質チェックを受けたい
- ドメイン用語の正しい使用法を確認したい
- 業務要件に基づくテストの必要性を理解したい

**US-3: 品質管理者として**
- 組織の品質基準を体系的に管理したい
- ドメイン知識の成熟度を測定したい
- 新人への知識伝達を効率化したい

### 2.2 詳細な機能仕様

#### 2.2.1 辞書構造

```typescript
interface DomainDictionary {
  version: string;
  domain: string;
  language: string;
  lastUpdated: Date;
  
  // 用語定義
  terms: DomainTerm[];
  
  // 概念間の関係
  relationships: TermRelationship[];
  
  // ビジネスルール
  businessRules: BusinessRule[];
  
  // 品質基準
  qualityStandards: QualityStandard[];
  
  // コンテキストマッピング
  contextMappings: ContextMapping[];
}

interface DomainTerm {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  examples: {
    code: string;
    description: string;
  }[];
  relatedPatterns: string[];
  testRequirements: string[];
}
```

#### 2.2.2 ビジネスルール定義

```typescript
interface BusinessRule {
  id: string;
  name: string;
  description: string;
  domain: string;
  condition: RuleCondition;
  requirements: TestRequirement[];
  priority: number;
  compliance?: {
    standard: string;
    clause: string;
  };
}

interface RuleCondition {
  type: 'code-pattern' | 'function-name' | 'data-type' | 'api-endpoint';
  pattern: string; // 正規表現またはパターン
  scope: 'file' | 'class' | 'function' | 'variable';
}

interface TestRequirement {
  type: 'must-have' | 'should-have' | 'nice-to-have';
  description: string;
  testPattern: string;
  example?: string;
}
```

#### 2.2.3 知識抽出機能

```typescript
interface KnowledgeExtractor {
  // Linter設定からの抽出
  extractFromLinters(
    eslintConfig?: any,
    prettierConfig?: any,
    customLinters?: any[]
  ): ExtractedKnowledge;
  
  // コードベースからの学習
  learnFromCodebase(
    sourcePath: string,
    options: LearningOptions
  ): Promise<ExtractedKnowledge>;
  
  // ドキュメントからの抽出
  extractFromDocs(
    docPaths: string[],
    format: 'markdown' | 'jsdoc' | 'openapi'
  ): ExtractedKnowledge;
  
  // 既存テストからのパターン学習
  learnFromTests(
    testFiles: string[]
  ): Promise<TestPatterns>;
}

interface ExtractedKnowledge {
  terms: DomainTerm[];
  patterns: CodePattern[];
  rules: InferredRule[];
  confidence: number;
}
```

#### 2.2.4 文脈理解エンジン

```typescript
interface ContextEngine {
  // コードの文脈を理解
  analyzeContext(
    code: string,
    filePath: string,
    dictionary: DomainDictionary
  ): CodeContext;
  
  // ドメイン関連度の計算
  calculateRelevance(
    code: string,
    term: DomainTerm
  ): number; // 0.0-1.0
  
  // 必要なテストの推論
  inferRequiredTests(
    context: CodeContext,
    rules: BusinessRule[]
  ): TestRequirement[];
  
  // 重要度の判定
  assessImportance(
    context: CodeContext,
    dictionary: DomainDictionary
  ): ImportanceLevel;
}
```

#### 2.2.5 辞書の成長と最適化

```typescript
interface DictionaryEvolution {
  // 使用頻度に基づく最適化
  optimizeByUsage(
    dictionary: DomainDictionary,
    usageStats: UsageStatistics
  ): DomainDictionary;
  
  // 新しい用語の候補抽出
  suggestNewTerms(
    codebase: string[],
    currentDictionary: DomainDictionary
  ): TermCandidate[];
  
  // 辞書の品質評価
  evaluateQuality(
    dictionary: DomainDictionary
  ): QualityMetrics;
  
  // バージョン管理
  version: {
    create(dictionary: DomainDictionary): string;
    diff(v1: string, v2: string): DictionaryDiff;
    merge(dictionaries: DomainDictionary[]): DomainDictionary;
  };
}
```

### 2.3 ブートストラップ機能

#### 2.3.1 初期辞書構築ウィザード

```bash
$ npx rimor dictionary init

🧙 Rimorドメイン辞書構築ウィザード
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? あなたのプロジェクトのドメインは？
> ◉ 金融・決済
> ○ ヘルスケア・医療
> ○ Eコマース
> ○ その他（カスタム）

? 既存の設定から知識をインポートしますか？
> ☑ ESLint設定（.eslintrc.json）
> ☑ TypeScript設定（tsconfig.json）
> ☑ OpenAPI仕様（swagger.json）
> ☐ その他のドキュメント

インポート中...
✓ 42個のルールから知識を抽出
✓ 156個の型定義から用語を推測
✓ 23個のAPIエンドポイントから概念を抽出

? 重要な用語を3つ教えてください（カンマ区切り）
> payment, transaction, authorization

素晴らしい！これらの用語について詳しく定義しましょう...
```

#### 2.3.2 段階的な知識構築

```typescript
interface BootstrapStrategy {
  // Phase 1: 最小限の辞書
  minimal: {
    terms: 10, // 最重要用語のみ
    rules: 5,  // 基本的なルール
    time: '30 minutes'
  };
  
  // Phase 2: 実用的な辞書
  practical: {
    terms: 50,
    rules: 20,
    patterns: 15,
    time: '1 week'
  };
  
  // Phase 3: 包括的な辞書
  comprehensive: {
    terms: 200,
    rules: 50,
    patterns: 40,
    relationships: 100,
    time: '1 month'
  };
}
```

### 2.4 プラグインとの統合

```typescript
interface DictionaryAwarePlugin extends ITestQualityPlugin {
  // 辞書を使用した分析
  analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis>;
  
  // ドメイン固有の品質評価
  evaluateDomainQuality(
    patterns: DetectionResult[],
    context: DomainContext
  ): DomainQualityScore;
}

// 使用例：金融ドメインプラグイン
class FinancialDomainPlugin implements DictionaryAwarePlugin {
  async analyzeWithContext(testFile: TestFile, dictionary: DomainDictionary) {
    const terms = dictionary.terms.filter(t => 
      t.category === 'financial' && t.importance === 'critical'
    );
    
    // 重要な金融用語に関連するテストを重点的にチェック
    for (const term of terms) {
      if (this.isRelatedToTerm(testFile, term)) {
        // より厳格な品質基準を適用
        await this.applyStrictValidation(testFile, term);
      }
    }
  }
}
```

## 3. 非機能要件

### 3.1 パフォーマンス基準

- 辞書検索時間：1ms以内（メモリキャッシュ使用）
- 文脈分析時間：ファイルあたり50ms以内
- 辞書ロード時間：1000語あたり100ms以内
- メモリ使用量：辞書サイズの2倍以内

### 3.2 スケーラビリティ

- 最大辞書サイズ：10,000用語
- 最大ルール数：1,000ルール
- 同時アクセス：読み取り無制限、書き込み排他制御
- 分散環境対応：辞書の同期機能

### 3.3 保守性

- 辞書フォーマットのバージョニング
- インポート/エクスポート機能
- 差分管理とマージ機能
- 可読性の高いYAML/JSON形式

## 4. 実装範囲

### 4.1 v0.6.0で含まれる機能

- 基本的な辞書構造とAPI
- Linter設定からの知識抽出
- 簡易的な文脈理解エンジン
- CLI経由での辞書管理
- 基本的なブートストラップ機能

### 4.2 v0.6.0で含まれない機能（将来バージョン）

- 機械学習による知識抽出
- 自然言語処理による文書解析
- 辞書の自動成長機能
- マルチテナント対応
- GUIベースの辞書エディタ

## 5. 技術仕様

### 5.1 アーキテクチャ設計

```
src/
├── dictionary/
│   ├── core/
│   │   ├── dictionary.ts     # 辞書コア機能
│   │   ├── term.ts          # 用語管理
│   │   └── rule.ts          # ルール管理
│   ├── extractors/
│   │   ├── linter.ts        # Linter設定抽出
│   │   ├── code.ts          # コード解析
│   │   └── doc.ts           # ドキュメント解析
│   ├── context/
│   │   ├── engine.ts        # 文脈理解エンジン
│   │   ├── analyzer.ts      # 文脈分析
│   │   └── scorer.ts        # 関連度計算
│   └── storage/
│       ├── loader.ts        # 辞書ローダー
│       ├── cache.ts         # キャッシュ管理
│       └── versioning.ts    # バージョン管理
└── cli/
    └── commands/
        └── dictionary.ts    # 辞書管理コマンド
```

### 5.2 データ永続化

```yaml
# .rimor/dictionary.yaml
version: "1.0"
domain: "financial"
language: "ja"
lastUpdated: "2025-01-22T10:00:00Z"

terms:
  - id: "term-001"
    term: "決済"
    aliases: ["payment", "settlement"]
    definition: "商品やサービスの対価を支払う処理"
    category: "core-business"
    importance: "critical"
    examples:
      - code: "processPayment(amount, currency)"
        description: "決済処理の実行"
    testRequirements:
      - "金額の妥当性検証"
      - "通貨コードの検証"
      - "エラーハンドリング"

businessRules:
  - id: "rule-001"
    name: "決済金額検証"
    description: "決済金額は正の値である必要がある"
    condition:
      type: "function-name"
      pattern: ".*[Pp]ayment.*"
      scope: "function"
    requirements:
      - type: "must-have"
        description: "負の金額のテスト"
        testPattern: "expect.*amount.*toBeLessThan\\(0\\)"
```

### 5.3 キャッシュ戦略

```typescript
class DictionaryCache {
  private memoryCache: Map<string, CachedEntry>;
  private diskCache: DiskCache;
  
  async get(key: string): Promise<any> {
    // L1: メモリキャッシュ
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // L2: ディスクキャッシュ
    const diskValue = await this.diskCache.get(key);
    if (diskValue) {
      this.memoryCache.set(key, diskValue);
      return diskValue;
    }
    
    return null;
  }
  
  // LRUアルゴリズムによるメモリ管理
  private evictLRU() {
    const oldest = this.findOldestEntry();
    this.memoryCache.delete(oldest.key);
  }
}
```

## 6. テスト計画

### 6.1 テストケース

**単体テスト**
- TC-01: 辞書の基本操作（CRUD）
- TC-02: 知識抽出の正確性
- TC-03: 文脈理解の妥当性
- TC-04: キャッシュの動作

**統合テスト**
- TC-05: プラグインとの連携
- TC-06: 大規模辞書での性能
- TC-07: 複数辞書のマージ
- TC-08: バージョン管理機能

**受け入れテスト**
- TC-09: 実際のドメインでの有効性
- TC-10: ユーザビリティ
- TC-11: 知識の成長過程

### 6.2 品質基準

- 辞書検索の正確性：100%
- 文脈理解の精度：80%以上
- 知識抽出の網羅性：70%以上
- パフォーマンス基準：100%達成

### 6.3 検収条件

- 3つ以上のドメインでの実証
- 100語以上の辞書構築成功
- パフォーマンス基準の達成
- ユーザーマニュアルの完備

## 7. リスクと対策

### 7.1 技術的リスク

**リスク1：文脈理解の精度不足**
- 影響：誤った品質評価
- 対策：シンプルなルールベースから開始し段階的に高度化

**リスク2：辞書の肥大化**
- 影響：パフォーマンス劣化
- 対策：使用頻度に基づく自動最適化

### 7.2 運用リスク

**リスク3：辞書メンテナンスの負担**
- 影響：陳腐化による精度低下
- 対策：半自動更新機能の提供

**リスク4：ドメイン知識の不足**
- 影響：初期構築の困難
- 対策：充実したテンプレートとウィザード

## 8. 今後の拡張計画

### 統合による相乗効果
- v0.2.0: 対話型システムで収集した知識を辞書に自動登録
- v0.3.0: プラグインが辞書を参照して高度な分析
- v0.4.0: ドメインの重要度に応じたスコア重み付け
- v0.5.0: AIへの文脈情報提供による精度向上

### 将来的な構想
- 業界標準辞書の提供
- 辞書のマーケットプレイス
- AI/MLによる辞書の自動成長
- 多言語対応

---

**作成日**: 2025-01-22
**バージョン**: 1.0
**承認者**: [承認待ち]
**最終更新**: 2025-01-22