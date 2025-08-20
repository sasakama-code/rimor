# Rimor - テスト意図実現度監査ツール v2.0

**Rimor**（リモール）は、テストコードの「意図」と「実装」のギャップを可視化し、プロジェクトに本当に必要なテストの改善を支援する革新的なツールです。単なるカバレッジ測定を超えて、テストの実効性を科学的に評価します。

## 🎯 v2.0の特徴 - テスト意図実現度の可視化

Rimor v2.0は、「テストが何をテストしたいか」と「実際に何をテストしているか」のギャップを検出し、リスクベースで改善優先順位を提示します。

### 主要な特徴

- 🧠 **テスト意図の自動抽出** - 型情報とテスト名から意図を推論
- 🎯 **ギャップ分析エンジン** - 意図と実装の乖離を自動検出
- 🔬 **型ベース解析** - TypeScriptの型システムを活用した精密な分析
- 🛡️ **TaintTyper統合** - 型ベースセキュリティ解析によるSource-Sink脆弱性検出
- 📊 **NIST SP 800-30準拠** - 体系的なリスク評価と優先順位付け
- 🚀 **依存関係考慮** - 影響範囲を考慮した包括的な評価

### 差別化ポイント

- 📈 **カバレッジを超えた品質評価** - テストの「質」に焦点
- 🎯 **プロジェクト適合性** - テストがプロジェクト目的に適しているか評価
- 🔍 **実用的な改善提案** - 具体的なアクションを提示

## 🎓 技術的基盤

Rimorの設計は、以下の技術と標準に基づいています：

- **型ベース解析**: [Practical Type-Based Taint Checking and Inference](https://arxiv.org/abs/2504.18529) - TypeScriptの型システムを活用し、テストコードの意図を型情報から推論する手法を実装
- **TaintTyper**: arXiv:2504.18529v2の理論に基づく型ベースセキュリティ解析エンジン - SQL Injection、Command Injection、Path Traversalなどの脆弱性を自動検出
- **NIST SP 800-30**: リスクアセスメントガイド - 脅威×脆弱性×影響の体系的評価手法を採用
- **テスト意図抽出**: テスト名、型情報、アサーションから多角的に意図を推論

これらの技術により、テストコードの「形式」だけでなく「意味」を理解し、プロジェクトに適したテストかどうかを科学的に評価できます。

## インストール

### npm実行（推奨）

```bash
# インストール不要で即座実行
npx rimor

# 特定のディレクトリを分析
npx rimor analyze ./src

# 自動モードで最適な分析を実行
npx rimor analyze ./src --mode=auto
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

## 🚀 使い方

### 基本的な使用方法

```bash
# テストコードの意図実現度を分析
npx rimor analyze ./test

# リスクベースの優先順位付きレポート
npx rimor analyze ./test --risk-based

# 特定のリスクレベル以上のみ表示
npx rimor analyze ./test --risk-threshold=high

# セキュリティ脆弱性検出（TaintTyper）
npx rimor analyze ./src --security --taint-analysis

# JSON形式で詳細出力
npx rimor analyze ./test --format=json --detailed
```

### プログラマティックAPI

```typescript
import { RimorAnalyzer } from 'rimor';

// テスト意図実現度分析器の初期化
const analyzer = new RimorAnalyzer({
  projectContext: {
    type: 'ecommerce',
    criticalFeatures: ['payment', 'authentication']
  }
});

// テストコードの分析
const result = await analyzer.analyzeTests('./test');

// 高リスクのギャップを取得
const criticalGaps = result.gaps.filter(gap => gap.riskLevel === 'CRITICAL');
console.log(`重大なテストギャップ: ${criticalGaps.length}件`);

// 改善提案の表示
result.recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.action}`);
});

// セキュリティ脆弱性の検出（TaintTyper）
const securityAnalyzer = new SecurityAnalyzer();
const securityResult = await securityAnalyzer.analyzeTaintFlow('./src');

// 検出された脆弱性の表示
securityResult.vulnerabilities.forEach(vuln => {
  console.log(`${vuln.type}: ${vuln.source} → ${vuln.sink} (${vuln.riskLevel})`);
});
```

### 分析結果の例

```typescript
// Rimorが検出するテストギャップの例
{
  testFile: "payment.test.ts",
  testName: "should process payment successfully",
  
  // 意図分析
  intent: {
    extracted: "決済処理の成功ケース",
    expectedBehaviors: ["正常処理", "エラーハンドリング", "並行処理"]
  },
  
  // ギャップ
  gaps: [{
    type: "missing_error_cases",
    description: "ネットワークエラー、タイムアウトのテストが欠落",
    severity: "HIGH"
  }],
  
  // リスク評価（NIST SP 800-30準拠）
  riskAssessment: {
    threat: 8,        // 決済機能の複雑性
    vulnerability: 9,  // エラーケース未テスト
    impact: 10,       // 金銭的影響
    totalRisk: 720,   // CRITICAL
    
    recommendation: "ネットワーク障害とタイムアウトのテストを最優先で追加"
  }
}
```

## 🛡️ セキュリティ解析（TaintTyper）

RimorはTaintTyperエンジンにより、型ベースのセキュリティ解析を提供します。これにより、SQL Injection、Command Injection、Path Traversalなどの脆弱性を自動検出できます。

### サポートされる脆弱性タイプ

- **SQL Injection** - データベースクエリでのユーザー入力混入
- **Command Injection** - システムコマンド実行でのユーザー入力混入  
- **Path Traversal** - ファイルパス操作でのディレクトリトラバーサル
- **XSS (Cross-Site Scripting)** - HTMLレスポンスでのスクリプト注入
- **Code Injection** - 動的コード実行でのユーザー入力混入

### 使用例

```typescript
// 脆弱性のあるコード例
function handleUser(req: express.Request, res: express.Response) {
  const userId = req.params.id; // Source: ユーザー入力
  const query = `SELECT * FROM users WHERE id = ${userId}`; // Sink: SQLクエリ
  mysql.query(query); // ← SQL Injectionの脆弱性
}

// TaintTyperの検出結果
{
  type: "sql-injection",
  source: "userId (req.params.id)",
  sink: "mysql.query",
  riskLevel: "CRITICAL",
  confidence: 87,
  path: ["userId", "query", "mysql.query"],
  recommendation: "パラメータ化クエリまたは入力検証を実装してください"
}
```

### 型アノテーションによる精度向上

TypeScript/JSDocアノテーションを使用することで、解析精度を向上できます：

```typescript
/**
 * @param userData @tainted ユーザー入力データ
 * @param safeData @untainted 検証済み安全データ
 */
function processData(userData: string, safeData: string) {
  // TaintTyperが型アノテーションを考慮して解析
}
```

### セキュリティテスト改善提案

TaintTyperは検出した脆弱性に基づいて、不足しているセキュリティテストを提案します：

```typescript
// 脆弱性検出時の改善提案例
{
  testFile: "auth.test.ts",
  missingTests: [
    "SQL Injectionに対する入力検証テスト",
    "パラメータ化クエリの正常動作テスト",
    "不正入力に対するエラーハンドリングテスト"
  ],
  priority: "CRITICAL",
  estimatedEffort: "2-4時間"
}
```

## 📋 ルール定義

YAMLファイルで独自のルールを定義できます：

```yaml
# rules/custom-rules.yaml
- id: auth-test-coverage
  name: 認証テストカバレッジ
  description: 認証機能に対する適切なテストカバレッジを確保
  category: security
  severity: error
  patterns:
    - type: keyword
      pattern: auth|login|logout|token
      message: 認証関連の機能にはセキュリティテストが必要です
```

## 🔌 プラグインシステム

```typescript
import { IPlugin } from 'rimor/core/interfaces';

class CustomPlugin implements IPlugin {
  metadata = {
    id: 'custom-plugin',
    name: 'カスタムプラグイン',
    version: '1.0.0',
    enabled: true
  };

  async analyze(filePath: string): Promise<Issue[]> {
    // カスタム分析ロジック
    return [];
  }
}

// プラグインの登録
const pluginManager = container.get<IPluginManager>(TYPES.PluginManager);
pluginManager.register(new CustomPlugin());
```

## 📊 リスクベース評価

NIST SP 800-30に基づく体系的なリスク評価により、改善優先順位を明確化：

```bash
# リスクベース分析の実行
npx rimor analyze ./test --risk-assessment

# CRITICALレベルのリスクのみ表示
npx rimor analyze ./test --risk-level=critical

# 影響度分析を含む詳細レポート
npx rimor analyze ./test --impact-analysis --verbose
```

### リスク評価の仕組み

- **脅威（Threat）**: テストの複雑性、変更頻度
- **脆弱性（Vulnerability）**: テストギャップ、アサーション品質
- **影響（Impact）**: ビジネス影響、技術的影響

リスクスコア = 脅威 × 脆弱性 × 影響

## 🔧 設定

`.rimorrc.json`ファイルでプロジェクト固有の設定が可能：

```json
{
  "projectContext": {
    "type": "ecommerce",
    "criticalFeatures": ["payment", "inventory", "authentication"],
    "complianceRequirements": ["PCI-DSS"]
  },
  "analysis": {
    "targetPath": "./test",
    "includePatterns": ["**/*.test.ts", "**/*.spec.ts"],
    "riskThreshold": "medium"
  },
  "output": {
    "format": "json",
    "path": "./rimor-analysis.json",
    "includeRecommendations": true
  }
}
```

## 📈 開発コマンド

```bash
# テストの実行
npm test

# 型チェック
npm run typecheck

# リント
npm run lint

# 全チェック
npm run full-check
```

## 👨‍💻 開発者ガイド

### コードスタイル・命名規則
Rimorプロジェクトでは、コードベースの品質と保守性を確保するため、統一された命名規則を採用しています：

- **[命名規則ガイドライン](./docs/NAMING_CONVENTIONS.md)** - ファイル命名、クラス命名、ディレクトリ構成の詳細なルール
- **[命名規則健康診断レポート](./docs/NAMING_HEALTH_REPORT.md)** - プロジェクトの命名規則改善履歴と現状分析

### 貢献指針
新しい機能の追加やバグ修正を行う際は、以下をご確認ください：
- 命名規則ガイドラインに従ったファイル・クラス命名
- 適切なテストタイプの分類（unit/integration/e2e）
- 型定義ファイルの適切な配置

## 📄 ライセンス

MITライセンス - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 📋 変更履歴

最新の変更については[CHANGELOG.md](./CHANGELOG.md)を参照してください。

## 🎯 なぜRimorが必要か

### 既存ツールの限界
- **カバレッジツール**: 実行率は測れるが、テストの質は評価できない
- **静的解析ツール**: プロダクトコードは分析するが、テストコードの適切性は評価しない
- **セキュリティツール**: 脆弱性は検出するが、セキュリティテストの網羅性は評価しない

### Rimorが提供する価値
1. **テストの意図を理解** - 「何をテストしたいか」を自動的に推論
2. **ギャップを可視化** - 意図と実装の乖離を明確に提示
3. **優先順位を明確化** - リスクベースで改善すべきテストを特定
4. **具体的な改善提案** - 実装可能なアクションを提示

---

**Rimor** - テストコードの「意図」と「実装」のギャップを科学的に評価し、真の品質保証を実現する