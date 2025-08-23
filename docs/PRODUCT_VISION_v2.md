# Rimor v2.0 製品定義書

## テスト意図実現度監査ツール

## 1. 製品ビジョン

### 1.1 コアコンセプト

「テストが何をテストしたいか」と「実際に何をテストしているか」のギャップを可視化し、リスクベースで改善優先順位を提示する

### 1.2 解決する課題

- テストは存在するが、意図した品質保証ができていない
- カバレッジは高いが、重要な観点が漏れている
- どのテストから改善すべきかが不明確

### 1.3 提供価値

- テストの実効性を客観的に評価
- リスクの高い箇所の優先的な改善
- 開発チームの品質意識向上

## 2. 差別化ポイント

### 2.1 既存ツールとの比較

| ツール種別 | 機能 | Rimorの優位性 |
|-----------|------|--------------|
| カバレッジツール（Jest, NYC） | コード実行率の測定 | テストの「質」を評価 |
| 静的解析ツール（ESLint, SonarQube） | コード品質チェック | テストコードの適切性を評価 |
| セキュリティツール（Snyk, OWASP） | 脆弱性検出 | セキュリティテストの網羅性を評価 |

### 2.2 独自の強み

1. **テスト意図の自動抽出と分析**
2. **NIST SP 800-30ベースの体系的リスク評価**
3. **依存関係を考慮した影響度分析**

## 3. 技術アーキテクチャ

### 3.1 コア技術の統合

#### 型ベース解析とNIST評価の役割分担

```typescript
// フロー: テストコード → 型解析 → 意図抽出 → NIST評価 → 優先順位
interface RimorArchitecture {
  // Layer 1: 型ベース解析（テストコードが対象）
  typeBasedAnalysis: {
    target: "テストコード",
    purpose: "テストの意図と実装の自動解析",
    output: {
      testIntent: "型情報から推論されたテスト意図",
      actualCoverage: "実際にテストされている内容",
      typeGaps: "型の観点から見た不足"
    }
  },
  
  // Layer 2: NIST SP 800-30リスク評価
  riskAssessment: {
    input: "型解析結果 + プロジェクトコンテキスト",
    evaluation: {
      threat: "テストが不適切である度合い",
      vulnerability: "重要機能のテスト不足",
      impact: "品質問題が顕在化した場合の影響"
    },
    output: "優先順位付きリスクスコア"
  }
}
```

### 3.2 主要コンポーネント

#### 3.2.1 テスト意図抽出エンジン

```typescript
interface TestIntentExtractor {
  // テスト名からの意図推論
  extractFromTestName(name: string): Intent;
  
  // 型情報からの意図推論
  extractFromTypes(test: TypedTestCode): TypeBasedIntent;
  
  // アサーションからの検証内容理解
  extractFromAssertions(assertions: Assertion[]): VerificationIntent;
}
```

#### 3.2.2 ギャップ分析エンジン

```typescript
interface GapAnalyzer {
  // 意図と実装の差分検出
  detectGaps(intent: TestIntent, actual: TestImplementation): Gap[];
  
  // プロジェクト目的との適合性評価
  assessProjectFit(test: TestAnalysis, project: ProjectContext): FitScore;
}
```

#### 3.2.3 NIST準拠リスク評価エンジン

```typescript
interface NistRiskEvaluator {
  // リスク = 脅威 × 脆弱性 × 影響
  calculateRisk(threat: ThreatLevel, vulnerability: VulnerabilityLevel, impact: ImpactLevel): RiskScore;
  
  // 優先順位の決定
  prioritize(risks: RiskScore[]): PrioritizedAction[];
}
```

## 4. 分析フロー

### 4.1 全体フロー

1. **テストコード解析**: TypeScriptの型システムを活用してテストコードを解析
2. **意図抽出**: テスト名、型情報、アサーションから意図を推論
3. **ギャップ検出**: 意図と実装の乖離を特定
4. **リスク評価**: NIST SP 800-30に基づいて体系的に評価
5. **優先順位付け**: 改善すべきテストの優先順位を提示

### 4.2 具体例

```typescript
// テストコード例
describe('PaymentService', () => {
  it('should process payment successfully', () => {
    const result = processPayment({ amount: 100 });
    expect(result.success).toBe(true);
  });
});

// Rimorの分析結果
{
  analysis: {
    // 型解析結果
    typeInfo: {
      inputType: "PaymentRequest",
      outputType: "PaymentResult",
      testedProperties: ["success"],
      untestedProperties: ["transactionId", "timestamp", "error"]
    },
    
    // 意図分析
    intent: {
      extracted: "支払い処理の成功ケース",
      expectedCoverage: [
        "正常系処理",
        "エラーハンドリング",
        "境界値",
        "並行処理"
      ],
      actualCoverage: ["正常系の一部のみ"]
    },
    
    // ギャップ
    gaps: [
      {
        type: "missing_error_cases",
        description: "エラーケースが完全に欠落",
        severity: "HIGH"
      },
      {
        type: "insufficient_assertions",
        description: "結果の検証が不十分",
        severity: "MEDIUM"
      }
    ]
  },
  
  // NIST評価
  riskAssessment: {
    threat: {
      level: 8,
      factors: ["決済機能", "エラー処理なし"]
    },
    vulnerability: {
      level: 9,
      factors: ["重要機能のテスト不足"]
    },
    impact: {
      level: 10,
      factors: ["金銭的損失の可能性"]
    },
    totalRisk: 720,
    priority: "CRITICAL"
  },
  
  // 改善提案
  recommendations: [
    {
      priority: 1,
      action: "エラーケースのテスト追加",
      example: "ネットワークエラー、残高不足、無効な金額"
    },
    {
      priority: 2,
      action: "アサーションの強化",
      example: "transactionId、timestampの検証追加"
    }
  ]
}
```

## 5. リスク評価の詳細（NIST SP 800-30準拠）

### 5.1 脅威（Threat）の定義

テストコード自体の特性から生じる品質リスク

| 脅威カテゴリ | 評価指標 | レベル判定基準 |
|-------------|---------|--------------|
| テスト複雑性 | サイクロマティック複雑度、ネスト深度 | 10以上でHIGH |
| テスト脆弱性 | 実装詳細への依存度、モック過多 | 依存度50%以上でHIGH |
| 変更頻度 | テストの修正回数、失敗率 | 月3回以上の修正でHIGH |

### 5.2 脆弱性（Vulnerability）の定義

テストの品質不足による脆弱性

| 脆弱性カテゴリ | 評価指標 | レベル判定基準 |
|---------------|---------|--------------|
| 意図ギャップ | 意図と実装の乖離度 | 50%以上の乖離でHIGH |
| カバレッジ不足 | エッジケース、エラーパス | 未カバー30%以上でHIGH |
| アサーション品質 | 弱いアサーションの割合 | 50%以上でHIGH |

### 5.3 影響（Impact）の定義

テスト不備が引き起こす潜在的影響

| 影響カテゴリ | 評価指標 | レベル判定基準 |
|-------------|---------|--------------|
| ビジネス影響 | 機能の重要度、収益への影響 | コア機能でHIGH |
| 技術的影響 | 依存コンポーネント数 | 10以上の依存でHIGH |
| ユーザー影響 | エンドユーザーへの直接影響 | 直接影響ありでHIGH |

## 6. 実装ロードマップ

### Phase 1: 基礎実装（4週間）

- TypeScript ASTを使用した基本的な型解析
- シンプルな意図抽出アルゴリズム
- 基本的なギャップ検出

### Phase 2: 高度な分析（6週間）

- 高度な型推論による意図理解
- NIST SP 800-30完全準拠のリスク評価
- 依存関係グラフとの統合

### Phase 3: 実用化（4週間）

- パフォーマンス最適化
- CI/CD統合
- レポート生成機能

## 7. 成功指標

### 定量的指標

- テスト意図の抽出精度: 85%以上
- False positive率: 10%以下
- 1000テストファイルを10秒以内で分析

### 定性的指標

- 開発者の70%が「有用」と評価
- 導入後3ヶ月でテスト品質スコア20%向上
- バグ検出の見逃し率30%削減

## 8. まとめ

Rimorは、TypeScriptの型システムとNIST SP 800-30を組み合わせることで、テストコードの「意図」と「実装」のギャップを科学的に評価し、プロジェクトに本当に必要なテストの改善を支援する革新的なツールです。

既存のカバレッジツールや静的解析ツールでは見逃されがちな「テストの質」に焦点を当て、開発チームがより効果的な品質保証を実現できるよう支援します。
