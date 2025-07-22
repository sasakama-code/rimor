# AI向け出力形式要件定義書 v0.5.0

## 1. 概要

### 1.1 機能の目的と価値

AI向け出力形式は、Rimorの分析結果をAIツール（GitHub Copilot、ChatGPT、Claude等）が効率的に理解・処理できる構造化形式で出力する機能です。これにより、AIを活用した自動修正や高度な分析が可能になります。

**主な価値提供**
- **AI連携の最適化**: AIが理解しやすい構造化データの提供
- **自動修正の実現**: AIによるテストコード自動生成・修正
- **高度な分析**: AIによる問題の根本原因分析と改善提案
- **開発効率向上**: 手動修正から自動修正への移行

### 1.2 Rimor全体における位置づけ

本機能は、Rimorの分析結果とAIツールの橋渡しとなり、以下を実現します：
- v0.3.0のプラグインが検出した問題をAIが処理可能な形式に変換
- v0.4.0の品質スコアを含む包括的なコンテキスト提供
- 将来的なAI統合機能の基盤

## 2. 機能要件

### 2.1 ユーザーストーリー

**US-1: AI活用開発者として**
- Rimorの結果をAIツールにコピペして修正を依頼したい
- AIが正確に問題を理解できる形式で情報を受け取りたい
- 修正に必要なコンテキスト（設定ファイル等）も含めたい

**US-2: 自動化推進者として**
- CI/CDパイプラインでAI APIと連携したい
- 一括で複数ファイルの修正案を生成したい
- 修正の成功率を最大化したい

**US-3: チームリーダーとして**
- AIの修正提案を人間がレビューしやすい形式で確認したい
- どの修正が自動化可能か判断したい
- AIの学習用データとして活用したい

### 2.2 詳細な機能仕様

#### 2.2.1 基本出力構造

```typescript
interface AIOptimizedOutput {
  version: string;
  format: "ai-optimized";
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  
  context: {
    rootPath: string;
    configFiles: Record<string, string>; // ファイル名: 内容
    dependencies: Record<string, string>; // パッケージ名: バージョン
    projectStructure: string; // ディレクトリ構造の簡潔な表現
  };
  
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      description: string;
      context: CodeContext;
      fix: SuggestedFix;
    }>;
  }>;
  
  actionableTasks: Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>;
  
  instructions: {
    forHuman: string;
    forAI: string;
  };
}
```

#### 2.2.2 コードコンテキスト構造

```typescript
interface CodeContext {
  // 問題のあるコード
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 関連するソースコード（テスト対象）
  relatedSource?: {
    path: string;
    content: string;
    relevantSection?: {
      startLine: number;
      endLine: number;
    };
  };
  
  // 周辺のコンテキスト
  surroundingCode: {
    before: string; // 前10行
    after: string;  // 後10行
  };
  
  // インポート文
  imports: string[];
  
  // 使用されている主要なAPI/関数
  usedAPIs: string[];
}
```

#### 2.2.3 修正提案構造

```typescript
interface SuggestedFix {
  type: 'add' | 'replace' | 'remove' | 'refactor';
  targetLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  code: {
    template: string; // 修正コードのテンプレート
    placeholders?: Record<string, string>; // 置換が必要な部分
  };
  explanation: string;
  confidence: number; // 0.0-1.0
  dependencies?: string[]; // 必要な追加インポート等
}
```

#### 2.2.4 アクション可能タスク

```typescript
interface ActionStep {
  order: number;
  action: string;
  target: string;
  code?: string;
  explanation: string;
  automated: boolean;
}

interface ImpactEstimation {
  scoreImprovement: number;
  issuesResolved: number;
  effortMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

### 2.3 出力フォーマット

#### 2.3.1 AI向けMarkdown形式

```markdown
# Rimor Test Quality Analysis Report

## Project Context
- **Language**: TypeScript
- **Test Framework**: Jest
- **Project Type**: REST API
- **Quality Score**: 72/100 (C)

## Critical Issues Summary
Found 5 critical issues requiring immediate attention.

## File: src/api/payment.test.ts (Score: 45/100)

### Issue #1: Missing Error Handling Test
**Severity**: Critical
**Location**: Line 23-45

**Current Code**:
```typescript
describe('processPayment', () => {
  it('should process valid payment', async () => {
    const result = await processPayment({ amount: 100 });
    expect(result.success).toBe(true);
  });
});
```

**Related Source Code** (src/api/payment.ts):
```typescript
export async function processPayment(data: PaymentData) {
  if (data.amount < 0) {
    throw new Error('Invalid amount');
  }
  // ... more error cases
}
```

**Suggested Fix**:
```typescript
describe('processPayment', () => {
  it('should process valid payment', async () => {
    const result = await processPayment({ amount: 100 });
    expect(result.success).toBe(true);
  });
  
  // ADD: Error handling tests
  it('should reject negative amounts', async () => {
    await expect(processPayment({ amount: -100 }))
      .rejects.toThrow('Invalid amount');
  });
  
  it('should handle network errors', async () => {
    jest.spyOn(paymentAPI, 'process').mockRejectedValue(
      new Error('Network error')
    );
    await expect(processPayment({ amount: 100 }))
      .rejects.toThrow('Network error');
  });
});
```

## Automated Tasks

### Task 1: Add Missing Error Tests
**Priority**: 1 (Critical)
**Automatable**: Yes
**Impact**: +12 points, resolves 3 issues

Steps:
1. Analyze error cases in source code
2. Generate corresponding test cases
3. Add proper assertions and mocks
4. Verify test execution

---

## Instructions for AI
Please fix the issues in order of priority. For each file, apply the suggested fixes while maintaining the existing code style and test patterns.
```

#### 2.3.2 JSON形式（API連携用）

```json
{
  "version": "1.0",
  "format": "ai-optimized",
  "metadata": {
    "projectType": "rest-api",
    "language": "typescript",
    "testFramework": "jest",
    "timestamp": "2025-01-22T10:00:00Z",
    "rimVersion": "0.5.0"
  },
  "context": {
    "rootPath": "/project",
    "configFiles": {
      "jest.config.js": "module.exports = { preset: 'ts-jest' }",
      "tsconfig.json": "{ \"compilerOptions\": { \"target\": \"es2020\" } }"
    },
    "dependencies": {
      "jest": "^29.0.0",
      "@types/jest": "^29.0.0"
    }
  },
  "files": [
    {
      "path": "src/api/payment.test.ts",
      "language": "typescript",
      "score": 45,
      "issues": [
        {
          "id": "payment-001",
          "type": "missing-error-test",
          "severity": "critical",
          "location": {
            "startLine": 23,
            "endLine": 45
          },
          "description": "Missing error handling test cases",
          "context": {
            "targetCode": {
              "content": "describe('processPayment', () => {...})",
              "startLine": 23,
              "endLine": 45
            }
          },
          "fix": {
            "type": "add",
            "targetLocation": {
              "file": "src/api/payment.test.ts",
              "startLine": 45,
              "endLine": 45
            },
            "code": {
              "template": "it('should reject negative amounts', async () => {...})"
            },
            "confidence": 0.95
          }
        }
      ]
    }
  ]
}
```

### 2.4 AIプロンプトテンプレート

```typescript
interface AIPromptTemplate {
  // 汎用修正プロンプト
  genericFix: string;
  
  // 問題タイプ別プロンプト
  byIssueType: {
    [issueType: string]: string;
  };
  
  // フレームワーク別プロンプト
  byFramework: {
    [framework: string]: string;
  };
  
  // バッチ処理用プロンプト
  batchFix: string;
}

const defaultPrompts: AIPromptTemplate = {
  genericFix: `
以下のテスト品質問題を修正してください：

プロジェクト情報:
{context}

問題の詳細:
{issues}

修正要件:
- 既存のコードスタイルを維持
- 必要なインポートを追加
- エラーケースを網羅的にテスト

修正コードを生成してください。
`,
  
  byIssueType: {
    'missing-error-test': `
エラーハンドリングのテストが不足しています。
ソースコードを分析し、すべてのエラーケースに対するテストを追加してください。
`
  }
};
```

## 3. 非機能要件

### 3.1 出力サイズ制限

- 単一ファイル出力：10MB以内
- コンテキスト情報：1MB以内
- 個別issue詳細：100KB以内
- AI向けプロンプト：8000トークン以内

### 3.2 処理性能

- 出力生成時間：1000ファイルあたり10秒以内
- メモリ使用量：プロジェクトサイズの20%以内
- ストリーミング出力対応（大規模プロジェクト）

### 3.3 互換性

- 主要AIツールとの互換性
  - OpenAI API (GPT-4)
  - Anthropic API (Claude)
  - GitHub Copilot
  - Google Bard
- 出力形式のバージョニング
- 後方互換性の維持

## 4. 実装範囲

### 4.1 v0.5.0で含まれる機能

- 基本的なAI向け出力形式（Markdown/JSON）
- 単一ファイルの修正提案生成
- プロジェクトコンテキストの抽出
- 基本的なプロンプトテンプレート
- CLI経由での出力

### 4.2 v0.5.0で含まれない機能（将来バージョン）

- AI APIとの直接統合
- バッチ修正の自動実行
- 修正結果の自動検証
- カスタムプロンプトテンプレート
- IDE統合

## 5. 技術仕様

### 5.1 アーキテクチャ設計

```
src/
├── ai-output/
│   ├── formatter.ts         # 出力フォーマッター
│   ├── context.ts          # コンテキスト抽出
│   ├── optimizer.ts        # AI向け最適化
│   └── templates/          # プロンプトテンプレート
├── analyzers/
│   ├── code-context.ts     # コードコンテキスト分析
│   ├── dependency.ts       # 依存関係分析
│   └── structure.ts        # プロジェクト構造分析
└── cli/
    └── commands/
        └── ai-output.ts    # CLIコマンド
```

### 5.2 コンテキスト最適化

```typescript
class ContextOptimizer {
  // 関連性の高い情報のみを抽出
  optimizeForAI(
    fullContext: ProjectContext,
    issues: Issue[]
  ): OptimizedContext {
    return {
      // 問題に関連する設定のみ
      relevantConfigs: this.extractRelevantConfigs(issues),
      
      // 使用されている依存関係のみ
      usedDependencies: this.extractUsedDependencies(issues),
      
      // 必要最小限のプロジェクト構造
      minimalStructure: this.extractMinimalStructure(issues)
    };
  }
  
  // トークン数の最適化
  optimizeForTokenLimit(
    content: string,
    maxTokens: number
  ): string {
    // 重要度順にソート
    const prioritized = this.prioritizeContent(content);
    
    // トークン数に収まるように調整
    return this.fitToTokenLimit(prioritized, maxTokens);
  }
}
```

### 5.3 出力ストリーミング

```typescript
class StreamingFormatter {
  async *generateOutput(
    analysis: AnalysisResult
  ): AsyncGenerator<string> {
    // ヘッダー情報
    yield this.formatHeader(analysis.metadata);
    
    // ファイルごとに逐次出力
    for (const file of analysis.files) {
      yield this.formatFile(file);
      
      // メモリ使用量の制御
      if (this.shouldFlush()) {
        await this.flush();
      }
    }
    
    // 集約情報
    yield this.formatSummary(analysis);
  }
}
```

## 6. テスト計画

### 6.1 テストケース

**機能テスト**
- TC-01: 基本的な出力形式の生成
- TC-02: 大規模プロジェクトでの出力
- TC-03: 各種言語・フレームワークの対応
- TC-04: エッジケースの処理

**AI連携テスト**
- TC-05: 生成されたプロンプトの有効性
- TC-06: 修正提案の実行可能性
- TC-07: トークン制限への適合
- TC-08: 各AIツールでの動作確認

**性能テスト**
- TC-09: 出力生成時間の測定
- TC-10: メモリ使用量の確認
- TC-11: ストリーミング出力の効率性

### 6.2 品質基準

- AI修正成功率：70%以上
- 出力生成時間：基準内100%
- トークン効率：8000トークン以内で90%の情報を表現
- フォーマット検証：100%準拠

### 6.3 検収条件

- 3つ以上のAIツールでの動作確認
- 5つ以上のプロジェクトでの実地テスト
- 修正提案の妥当性検証
- ドキュメントとサンプルの完備

## 7. リスクと対策

### 7.1 技術的リスク

**リスク1：AIツールの仕様変更**
- 影響：出力形式の非互換
- 対策：抽象化レイヤーと定期的な互換性テスト

**リスク2：機密情報の露出**
- 影響：セキュリティリスク
- 対策：センシティブ情報のフィルタリング機能

### 7.2 利用上のリスク

**リスク3：AIの誤った修正**
- 影響：バグの導入
- 対策：人間によるレビュープロセスの推奨

**リスク4：過度なAI依存**
- 影響：開発者のスキル低下
- 対策：教育的な説明の追加

## 8. 今後の拡張計画

### v0.6.0での連携
- ドメイン辞書を活用した文脈の充実
- 業界固有の修正パターン

### 将来的な構想
- AI APIとの直接統合
- 修正の自動適用とテスト
- 学習機能による精度向上
- リアルタイムAI支援

---

**作成日**: 2025-01-22
**バージョン**: 1.0
**承認者**: [承認待ち]
**最終更新**: 2025-01-22