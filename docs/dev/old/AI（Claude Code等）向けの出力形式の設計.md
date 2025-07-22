# AI（Claude Code等）向けの出力形式の設計

## 1. 現状の出力形式の課題

### 1.1 AIが処理しづらい現在の形式

```json
// 現在のJSON出力（人間向けに最適化されている）
{
  "summary": {
    "score": 72,
    "grade": "C"  // AIには不要な表現
  },
  "issues": [{
    "message": "決済セキュリティテスト不足",  // 日本語で曖昧
    "suggestedFix": {
      "code": "it('should reject...')"  // コンテキスト不足
    }
  }]
}
```

**問題点**：
- 自然言語の説明が主体
- コードの完全なコンテキストが不明
- 修正の適用位置が曖昧
- 依存関係の情報が欠落

## 2. AI最適化された出力形式

### 2.1 構造化されたAI向けフォーマット

```json
{
  "version": "1.0",
  "format": "ai-optimized",
  "metadata": {
    "projectType": "typescript-jest",
    "language": "typescript",
    "testFramework": "jest",
    "timestamp": "2024-01-20T10:30:00Z",
    "auditVersion": "0.2.0"
  },
  
  "context": {
    "rootPath": "/Users/dev/payment-service",
    "configFiles": {
      "eslint": ".eslintrc.json",
      "jest": "jest.config.js",
      "tsconfig": "tsconfig.json"
    },
    "dependencies": {
      "jest": "^29.0.0",
      "typescript": "^5.0.0"
    }
  },
  
  "files": [
    {
      "path": "src/api/payment.test.ts",
      "language": "typescript",
      "framework": "jest",
      "content": "// 完全なファイル内容（オプション）",
      "ast": { /* AST表現（オプション） */ },
      
      "issues": [
        {
          "id": "payment-security-001",
          "type": "missing-test-case",
          "severity": "critical",
          "category": "security",
          
          "location": {
            "startLine": 23,
            "endLine": 45,
            "startColumn": 1,
            "endColumn": 3,
            "functionName": "describe('payment processing')",
            "testName": "should process payment"
          },
          
          "detection": {
            "plugin": "payment-security",
            "rule": "payment-negative-amount-test",
            "confidence": 0.95
          },
          
          "problem": {
            "description": "Missing test case for negative payment amounts",
            "impact": "Potential financial loss due to negative amount processing",
            "cweId": "CWE-20",  // 標準的な脆弱性分類
            "relatedPatterns": ["input-validation", "boundary-testing"]
          },
          
          "fix": {
            "type": "add-test-case",
            "targetLocation": {
              "after": "line:44",  // 明確な挿入位置
              "insideBlock": "describe('payment processing')"
            },
            "code": {
              "language": "typescript",
              "content": "it('should reject negative amounts', async () => {\n  await expect(processPayment(-100))\n    .rejects.toThrow('Invalid amount');\n});"
            },
            "imports": [],  // 必要な import 文
            "dependencies": []  // 必要な依存関係
          },
          
          "references": {
            "documentation": "https://example.com/security-guidelines#negative-amounts",
            "similarIssues": ["payment-security-002", "payment-security-003"],
            "relatedFiles": ["src/api/payment.ts", "src/services/payment-validator.ts"]
          }
        }
      ],
      
      "metrics": {
        "testCount": 5,
        "assertionCount": 8,
        "coverage": 0.65,
        "complexity": 3.2
      }
    }
  ],
  
  "actionableTasks": [
    {
      "id": "task-001",
      "priority": 1,
      "type": "add-multiple-tests",
      "targetFile": "src/api/payment.test.ts",
      "estimatedImpact": "high",
      "automatable": true,
      
      "steps": [
        {
          "order": 1,
          "action": "add-test",
          "location": { "after": "line:44" },
          "code": "// Negative amount test code..."
        },
        {
          "order": 2,
          "action": "add-test",
          "location": { "after": "line:50" },
          "code": "// Decimal precision test code..."
        }
      ]
    }
  ],
  
  "relationships": {
    "fileGraph": {
      "nodes": ["payment.test.ts", "payment.ts", "payment-validator.ts"],
      "edges": [
        { "from": "payment.test.ts", "to": "payment.ts", "type": "tests" },
        { "from": "payment.ts", "to": "payment-validator.ts", "type": "uses" }
      ]
    },
    
    "issueCorrelations": [
      {
        "issues": ["payment-security-001", "payment-security-002"],
        "correlation": "same-feature",
        "suggestedGroupFix": true
      }
    ]
  }
}
```

### 2.2 Claude Code 専用フォーマット

```typescript
// claude-code-format.json
interface ClaudeCodeFormat {
  // Claude Codeが理解しやすい形式
  tasks: Array<{
    file: string;
    language: string;
    currentCode: {
      full: string;  // ファイル全体
      relevant: {    // 関連部分のみ
        start: number;
        end: number;
        content: string;
      };
    };
    
    modifications: Array<{
      type: 'insert' | 'replace' | 'delete';
      location: {
        line?: number;
        after?: string;  // 正規表現パターン
        before?: string;
      };
      newCode: string;
      explanation: string;
    }>;
    
    validation: {
      // 修正後の検証方法
      runTests: string[];
      expectedOutcome: string;
    };
  }>;
  
  // コンテキスト情報
  projectContext: {
    style: Record<string, any>;  // コーディング規約
    patterns: string[];  // プロジェクトのパターン
    terminology: Record<string, string>;  // 用語集
  };
}
```

## 3. AI との対話的やり取りの最適化

### 3.1 段階的な情報提供

```typescript
class AIOptimizedOutput {
  // 初回: 概要のみ
  getSummaryForAI(): AISummary {
    return {
      totalIssues: 38,
      criticalIssues: 5,
      categories: {
        security: 5,
        correctness: 12,
        performance: 21
      },
      quickWins: [  // AIが即座に対応できる簡単な修正
        { id: "fix-001", effort: "low", impact: "high" }
      ]
    };
  }
  
  // 詳細要求時: 特定の問題の完全な情報
  getIssueDetail(issueId: string): AIDetailedIssue {
    return {
      issue: this.issues.get(issueId),
      fullContext: {
        fileContent: this.readFile(issue.file),
        relatedFiles: this.getRelatedFiles(issue),
        projectStructure: this.getRelevantStructure(issue)
      },
      suggestedApproach: this.generateApproach(issue)
    };
  }
}
```

### 3.2 プログレッシブエンハンスメント

```bash
# レベル1: 基本情報
$ npx tqa analyze --format=ai-basic
{
  "issues": ["Missing negative amount test", "No async error handling"],
  "files": ["payment.test.ts", "api.test.ts"]
}

# レベル2: 実行可能な情報
$ npx tqa analyze --format=ai-actionable
{
  "modifications": [
    {
      "file": "payment.test.ts",
      "line": 44,
      "action": "insert",
      "code": "it('should reject negative amounts', ...)"
    }
  ]
}

# レベル3: 完全なコンテキスト
$ npx tqa analyze --format=ai-complete
{
  // ファイル全体、AST、依存関係、実行環境情報を含む
}
```

## 4. ストリーミング対応

### 4.1 大規模プロジェクト向けストリーミング出力

```typescript
class StreamingAIOutput {
  async *streamAnalysis(files: string[]): AsyncGenerator<AIChunk> {
    // ファイルごとに結果をストリーミング
    for (const file of files) {
      const result = await this.analyzeFile(file);
      
      yield {
        type: 'file-complete',
        file: file,
        issues: result.issues,
        continueAnalysis: true
      };
      
      // AIが中断を要求できる
      if (await this.checkAIResponse() === 'stop') {
        break;
      }
    }
    
    yield {
      type: 'analysis-complete',
      summary: this.generateSummary()
    };
  }
}
```

## 5. 実装例

### 5.1 CLI オプションの追加

```bash
# AI向け出力オプション
$ npx tqa analyze --format=ai --ai-tool=claude-code

# 特定のAIツール向け最適化
$ npx tqa analyze --format=github-copilot
$ npx tqa analyze --format=cursor
$ npx tqa analyze --format=codeium
```

### 5.2 設定ファイルでの指定

```yaml
# .test-quality/config.yml
output:
  formats:
    - human  # デフォルト
    - ai     # AI向け追加
  
  ai_optimization:
    include_ast: false  # ASTは通常不要
    include_full_content: true  # ファイル全体を含める
    chunk_size: 50  # 一度に処理する問題数
    language: "en"  # AIは英語の方が正確
```

## まとめ：AI対応の追加実装

現在の設計に以下を追加することで、AI（Claude Code等）への対応が可能：

1. **構造化出力フォーマット**: 完全な機械可読形式
2. **コンテキスト情報の充実**: ファイル関係、プロジェクト構造
3. **明確な修正指示**: 曖昧さのない位置指定
4. **段階的情報提供**: AIの処理能力に応じた出力
5. **ストリーミング対応**: 大規模プロジェクトでの効率化

これにより、AIツールがテスト品質の改善を自動的に実行できるようになります。