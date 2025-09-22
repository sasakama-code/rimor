# TaintTyper - 型ベースセキュリティ解析ガイド

TaintTyperは、arXiv:2504.18529v2の理論に基づく型ベースセキュリティ解析エンジンです。TypeScriptの型システムを活用して、Source-Sink脆弱性を自動検出し、セキュリティテストの改善を支援します。

## 📚 目次

- [概要](#概要)
- [サポート脆弱性](#サポート脆弱性)
- [基本的な使用方法](#基本的な使用方法)
- [型アノテーション](#型アノテーション)
- [解析結果の理解](#解析結果の理解)
- [設定とカスタマイズ](#設定とカスタマイズ)
- [実世界での使用例](#実世界での使用例)
- [トラブルシューティング](#トラブルシューティング)

## 📖 概要

TaintTyperは以下の4つのフェーズで動作します：

1. **Phase 1**: TypeScript ASTを使用したSource/Sink検出
2. **Phase 2**: TypeScript Compiler APIによる型制約抽出
3. **Phase 3**: 制約ソルバーによる汚染伝播解析
4. **Phase 4**: 自動型アノテーション推論

### 理論的基盤

- **型ベース汚染解析**: 変数の汚染状態を型システムで追跡
- **制約満足問題**: Arc Consistencyアルゴリズムによる制約解決
- **データフロー解析**: Source-Sinkペアの経路追跡

## 🛡️ サポート脆弱性

### SQL Injection
```typescript
// 検出される脆弱性パターン
function getUserData(req: express.Request) {
  const userId = req.params.id; // Source
  const query = `SELECT * FROM users WHERE id = ${userId}`; // Sink
  mysql.query(query); // ← 検出される
}
```

### Command Injection
```typescript
// 検出される脆弱性パターン
function executeCommand(req: express.Request) {
  const command = req.body.command; // Source
  exec(`ls -la ${command}`); // Sink ← 検出される
}
```

### Path Traversal
```typescript
// 検出される脆弱性パターン
function readFile(req: express.Request) {
  const filename = req.query.file; // Source
  const path = `./uploads/${filename}`;
  fs.readFileSync(path); // Sink ← 検出される
}
```

### XSS (Cross-Site Scripting)
```typescript
// 検出される脆弱性パターン
function generateHTML(req: express.Request) {
  const userContent = req.body.content; // Source
  const html = `<div>${userContent}</div>`;
  res.send(html); // Sink ← 検出される
}
```

### Code Injection
```typescript
// 検出される脆弱性パターン
function executeCode(req: express.Request) {
  const code = req.body.code; // Source
  eval(code); // Sink ← 検出される
}
```

## 🚀 基本的な使用方法

### コマンドライン

```bash
# セキュリティ解析の実行
npx rimor analyze ./src --security --taint-analysis

# 特定の脆弱性タイプのみ検出
npx rimor analyze ./src --security --vulnerability-types=sql-injection,command-injection

# 詳細レポートの生成
npx rimor analyze ./src --security --detailed --output=security-report.json
```

### プログラマティックAPI

```typescript
import { 
  ASTSourceDetector, 
  ASTSinkDetector, 
  TypeBasedFlowAnalyzer 
} from 'rimor/security/analysis';

// 基本的な使用方法
async function analyzeFile(sourceCode: string, fileName: string) {
  const sourceDetector = new ASTSourceDetector();
  const sinkDetector = new ASTSinkDetector();
  const flowAnalyzer = new TypeBasedFlowAnalyzer();

  // Source/Sinkの検出
  const [sources, sinks] = await Promise.all([
    sourceDetector.detectSources(sourceCode, fileName),
    sinkDetector.detectSinks(sourceCode, fileName)
  ]);

  // データフロー解析
  const result = await flowAnalyzer.analyzeTypeBasedFlow(sourceCode, fileName);

  return {
    vulnerabilities: result.paths,
    sources,
    sinks,
    confidence: result.summary
  };
}

// 使用例
const sourceCode = `
  function handleLogin(req, res) {
    const username = req.body.username;
    const query = \`SELECT * FROM users WHERE name = '\${username}'\`;
    mysql.query(query);
  }
`;

const analysis = await analyzeFile(sourceCode, 'login.ts');
console.log(`検出された脆弱性: ${analysis.vulnerabilities.length}件`);
```

## 🏷️ 型アノテーション

TaintTyperは型アノテーションを使用して解析精度を向上させます。

### JSDocアノテーション

```typescript
/**
 * ユーザーデータ処理関数
 * @param userData @tainted ユーザー入力データ（未検証）
 * @param safeData @untainted 検証済み安全データ
 */
function processData(userData: string, safeData: string) {
  // TaintTyperが型アノテーションを考慮
  const result1 = userData.toUpperCase(); // taintedと推論
  const result2 = safeData.toUpperCase(); // untaintedと推論
}
```

### TypeScript型アノテーション

```typescript
// 将来的にサポート予定
type Tainted<T> = T;
type Untainted<T> = T;
type Sanitized<T> = T;

function processRequest(input: Tainted<string>): Untainted<string> {
  // 型レベルでの汚染状態管理
  return sanitize(input); // Sanitized<string> → Untainted<string>
}
```

### 推論による自動アノテーション

```typescript
import { TypeAnnotationInferrer } from 'rimor/security/analysis';

const inferrer = new TypeAnnotationInferrer();
const result = await inferrer.inferTypeAnnotations(
  constraints,
  typeInfoMap,
  sources,
  sinks,
  sourceCode,
  fileName
);

// 推論結果の適用
const annotatedCode = await inferrer.applyAnnotations(
  sourceCode,
  result.suggestions.filter(s => s.autoApplicable)
);
```

## 📊 解析結果の理解

### 脆弱性レポートの構造

```typescript
interface VulnerabilityReport {
  // 基本情報
  type: 'sql-injection' | 'command-injection' | 'path-traversal' | 'xss' | 'code-injection';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-100

  // Source-Sink情報
  source: {
    variableName: string;
    type: string;
    location: { file: string; line: number; column: number };
  };
  sink: {
    functionName: string;
    type: string;
    location: { file: string; line: number; column: number };
  };

  // データフローパス
  path: string[];
  constraints: TypeConstraint[];

  // 型検証
  typeValidation: {
    hasTypeAnnotations: boolean;
    isTypeSafe: boolean;
    violatedConstraints: string[];
  };

  // 推奨アクション
  recommendations: string[];
}
```

### リスクレベルの判定

リスクレベルは以下の要素で決定されます：

- **CRITICAL**: SQL Injection + ユーザー入力（スコア8+）
- **HIGH**: Command Injection、Path Traversal（スコア6-7）
- **MEDIUM**: XSS、データ漏洩（スコア4-5）
- **LOW**: その他の軽微な問題（スコア1-3）

### 信頼度の計算

```typescript
// 信頼度計算の要素
const confidence = baseConfidence
  + annotationBonus       // 型アノテーションボーナス（+15%）
  + inferenceStepsBonus   // 推論ステップ数ボーナス（+3% × ステップ数）
  + sourceTypeBonus;      // 汚染源タイプボーナス（+5%）

// 例: 87%信頼度
// = 80%（ベース）+ 15%（アノテーション）+ 9%（3ステップ）+ 5%（Source）
// = 109% → 100%（上限）
```

## ⚙️ 設定とカスタマイズ

### 設定ファイル（.rimorrc.json）

```json
{
  "security": {
    "taintAnalysis": {
      "enabled": true,
      "vulnerabilityTypes": [
        "sql-injection",
        "command-injection", 
        "path-traversal",
        "xss",
        "code-injection"
      ],
      "confidenceThreshold": 70,
      "includeTypeAnnotations": true,
      "autoInferAnnotations": true
    },
    "customSources": [
      {
        "pattern": "request\\.(query|body|params)",
        "type": "user-input",
        "confidence": 0.95
      }
    ],
    "customSinks": [
      {
        "pattern": "customDb\\.execute",
        "type": "sql-injection",
        "riskLevel": "CRITICAL"
      }
    ]
  }
}
```

### カスタムSource/Sinkの追加

```typescript
// カスタムSourceの定義
const customSource: TaintSource = {
  type: 'api-input',
  category: 'external-api',
  variableName: 'apiData',
  location: { file: 'api.ts', line: 10, column: 5, length: 7 },
  apiCall: {
    functionName: 'fetchExternalAPI',
    objectName: 'apiClient',
    arguments: []
  },
  confidence: 0.9
};

// カスタムSinkの定義
const customSink: TaintSink = {
  type: 'custom-injection',
  location: { file: 'processor.ts', line: 20, column: 3, length: 15 },
  dangerousFunction: {
    functionName: 'executeCustomCommand',
    objectName: 'processor',
    arguments: ['userInput']
  },
  riskLevel: 'HIGH',
  confidence: 0.85,
  description: 'カスタムコマンド実行での注入脆弱性'
};
```

## 🌍 実世界での使用例

### Express.jsアプリケーション

```typescript
// app.ts - Express.jsアプリケーション
import express from 'express';
import mysql from 'mysql';
import fs from 'fs';

const app = express();

// SQL Injection脆弱性
app.get('/users/:id', (req, res) => {
  const userId = req.params.id; // Source
  const query = `SELECT * FROM users WHERE id = ${userId}`; // Sink
  mysql.query(query, (err, results) => {
    res.json(results);
  });
});

// Path Traversal脆弱性
app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename; // Source
  const filePath = `./uploads/${filename}`;
  const content = fs.readFileSync(filePath); // Sink
  res.send(content);
});

// Command Injection脆弱性
app.post('/process', (req, res) => {
  const command = req.body.command; // Source
  const { exec } = require('child_process');
  exec(`processing ${command}`, (error, stdout) => { // Sink
    res.send(stdout);
  });
});
```

TaintTyperの検出結果：

```json
{
  "vulnerabilities": [
    {
      "type": "sql-injection",
      "source": "userId (req.params.id)",
      "sink": "mysql.query",
      "riskLevel": "CRITICAL",
      "confidence": 87,
      "path": ["userId", "query", "mysql.query"],
      "location": { "file": "app.ts", "line": 9 }
    },
    {
      "type": "path-traversal", 
      "source": "filename (req.params.filename)",
      "sink": "fs.readFileSync",
      "riskLevel": "HIGH",
      "confidence": 87,
      "path": ["filename", "filePath", "fs.readFileSync"],
      "location": { "file": "app.ts", "line": 17 }
    },
    {
      "type": "command-injection",
      "source": "command (req.body.command)",
      "sink": "exec",
      "riskLevel": "CRITICAL", 
      "confidence": 87,
      "path": ["command", "exec"],
      "location": { "file": "app.ts", "line": 25 }
    }
  ],
  "summary": {
    "totalVulnerabilities": 3,
    "criticalCount": 2,
    "highCount": 1,
    "averageConfidence": 87
  }
}
```

### Next.js APIルート

```typescript
// pages/api/user/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Source
  
  // 脆弱性のあるコード
  const sql = `SELECT * FROM users WHERE id = '${id}'`; // Sink
  const results = await query(sql);
  
  res.json(results);
}
```

### 改善されたセキュアなコード

```typescript
// 改善後のセキュアなコード
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // 入力検証
  if (!id || typeof id !== 'string' || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  // パラメータ化クエリ
  const sql = 'SELECT * FROM users WHERE id = ?';
  const results = await query(sql, [parseInt(id, 10)]);
  
  res.json(results);
}
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. False Positive（偽陽性）が多い

```typescript
// 問題: 安全なコードが脆弱性として検出される
function safeFunction(safeData: string) {
  const query = `SELECT * FROM config WHERE key = '${safeData}'`;
  mysql.query(query);
}

// 解決方法: 型アノテーションを追加
/**
 * @param safeData @untainted 検証済み安全データ
 */
function safeFunction(safeData: string) {
  const query = `SELECT * FROM config WHERE key = '${safeData}'`;
  mysql.query(query);
}
```

#### 2. 複雑なデータフローが検出されない

```typescript
// 問題: 多段階の関数呼び出しで検出漏れ
function complexFlow(req: Request) {
  const userInput = req.body.data;
  const processed = step1(userInput);
  const final = step2(processed);
  dangerousFunction(final); // 検出されない場合
}

// 解決方法: 中間変数に型アノテーションを追加
function complexFlow(req: Request) {
  /** @type {string} @tainted */
  const userInput = req.body.data;
  
  /** @type {string} @tainted */
  const processed = step1(userInput);
  
  /** @type {string} @tainted */  
  const final = step2(processed);
  
  dangerousFunction(final); // 正しく検出される
}
```

#### 3. カスタムフレームワークのSource/Sinkが検出されない

```typescript
// カスタム検出ルールの追加
const customDetector = new ASTSourceDetector();
customDetector.addCustomSource({
  pattern: /customFramework\.getInput/,
  type: 'user-input',
  confidence: 0.9
});

const customSinkDetector = new ASTSinkDetector();
customSinkDetector.addCustomSink({
  pattern: /customDb\.rawQuery/,
  type: 'sql-injection',
  riskLevel: 'CRITICAL'
});
```

### パフォーマンス最適化

```typescript
// 大規模プロジェクト向けの設定
const analyzer = new TypeBasedFlowAnalyzer({
  // 並列処理の有効化
  enableParallelProcessing: true,
  maxWorkers: 4,
  
  // キャッシュの使用
  enableCache: true,
  cacheDirectory: './.rimor-cache',
  
  // 解析範囲の制限
  maxFileSize: 1024 * 1024, // 1MB
  maxDepth: 10,
  
  // タイムアウト設定
  analysisTimeout: 30000 // 30秒
});
```

### デバッグとログ

```typescript
// デバッグモードの有効化
process.env.RIMOR_DEBUG = 'true';

// 詳細ログの出力
const analyzer = new TypeBasedFlowAnalyzer({
  verbose: true,
  logLevel: 'debug',
  logFile: './rimor-debug.log'
});

// 解析ステップの確認
const result = await analyzer.analyzeTypeBasedFlow(code, filename);
console.log('制約数:', result.constraints.length);
console.log('推論ステップ:', result.inferenceSteps?.length || 0);
```

## 📚 関連資料

- [arXiv:2504.18529v2 - Practical Type-Based Taint Checking and Inference](https://arxiv.org/abs/2504.18529)
- [TypeScript Compiler API Documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [OWASP Top 10 - Security Risks](https://owasp.org/www-project-top-ten/)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)

---

**TaintTyper** - 型システムの力でセキュリティを科学する