# Rimor v2.0 実装計画書（TypeScript/JavaScript特化版）

## 概要

本文書は、Rimor v2.0「テスト意図実現度監査ツール」の実装計画を定義します。TypeScript/JavaScriptのテストコード解析に特化し、ハイブリッドアプローチ（Tree-sitter + TypeScript Compiler API）により高速かつ高精度な分析を実現します。

## 技術アーキテクチャ

### ハイブリッドアプローチの設計

```typescript
// コアアーキテクチャ
export class RimorAnalyzer {
  private syntaxAnalyzer: TreeSitterAnalyzer;    // 高速構文解析
  private typeAnalyzer: TypeScriptAnalyzer;      // 詳細型情報
  private intentExtractor: TestIntentExtractor;   // 意図抽出
  private gapDetector: GapDetector;              // ギャップ検出
  private riskEvaluator: NistRiskEvaluator;      // リスク評価
  
  async analyzeTestFile(filePath: string): Promise<TestAnalysis> {
    // 1. 高速構文解析（1-5ms/file）
    const syntaxInfo = await this.syntaxAnalyzer.parse(filePath);
    
    // 2. 型情報取得（必要時のみ、50-200ms/file）
    const typeInfo = this.needsTypeInfo(syntaxInfo) 
      ? await this.typeAnalyzer.analyze(filePath)
      : null;
    
    // 3. 意図抽出
    const intent = this.intentExtractor.extract(syntaxInfo, typeInfo);
    
    // 4. ギャップ検出
    const gaps = this.gapDetector.detect(intent, syntaxInfo);
    
    // 5. リスク評価（NIST SP 800-30準拠）
    const risk = this.riskEvaluator.evaluate(gaps, typeInfo);
    
    return { intent, gaps, risk };
  }
}
```

## 実装フェーズ

### Phase 1: Tree-sitter基盤構築（4週間）

#### 目標
- Tree-sitterによる高速構文解析の実装
- 基本的なテスト構造の抽出
- シンプルな意図推論

#### Week 1-2: Tree-sitter セットアップと基本解析

```typescript
// src/analyzers/TreeSitterAnalyzer.ts
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

export class TreeSitterAnalyzer {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
  }
  
  async parse(filePath: string): Promise<SyntaxInfo> {
    const content = await fs.readFile(filePath, 'utf-8');
    const tree = this.parser.parse(content);
    
    return {
      testCases: this.extractTestCases(tree),
      describes: this.extractDescribeBlocks(tree),
      assertions: this.extractAssertions(tree),
      imports: this.extractImports(tree)
    };
  }
  
  private extractTestCases(tree: Tree): TestCase[] {
    // S式クエリによる高速パターンマッチング
    const query = this.parser.query(`
      (call_expression
        function: (identifier) @fn (#match? @fn "^(it|test)$")
        arguments: (arguments
          (string (string_fragment) @name)
          (arrow_function body: (statement_block) @body)
        )
      )
    `);
    
    const matches = query.matches(tree.rootNode);
    return matches.map(match => ({
      name: this.captureText(match, 'name'),
      body: this.captureNode(match, 'body'),
      location: this.getLocation(match.captures[0].node)
    }));
  }
}
```

#### Week 3: 基本的な意図抽出

```typescript
// src/intent/TestIntentExtractor.ts
export class TestIntentExtractor {
  extract(syntaxInfo: SyntaxInfo, typeInfo?: TypeInfo): TestIntent {
    const intents = {
      fromName: this.extractFromTestNames(syntaxInfo.testCases),
      fromAssertions: this.extractFromAssertions(syntaxInfo.assertions),
      fromStructure: this.extractFromStructure(syntaxInfo.describes)
    };
    
    return this.mergeIntents(intents);
  }
  
  private extractFromTestNames(testCases: TestCase[]): NameIntent[] {
    const patterns = [
      { regex: /should\s+(\w+)\s+(\w+)\s+when\s+(.+)/, type: 'behavior' },
      { regex: /returns?\s+(\w+)\s+for\s+(.+)/, type: 'return_value' },
      { regex: /throws?\s+(\w+)\s+when\s+(.+)/, type: 'error_handling' },
      { regex: /handles?\s+(\w+)\s+correctly/, type: 'general_handling' }
    ];
    
    return testCases.map(test => {
      for (const pattern of patterns) {
        const match = test.name.match(pattern.regex);
        if (match) {
          return this.parsePattern(match, pattern.type);
        }
      }
      return { raw: test.name, type: 'unknown' };
    });
  }
}
```

#### Week 4: 基本的なギャップ検出

```typescript
// src/gap/GapDetector.ts
export class GapDetector {
  detect(intent: TestIntent, syntaxInfo: SyntaxInfo): Gap[] {
    const gaps: Gap[] = [];
    
    // エラーハンドリングの欠如
    if (intent.expectsErrorHandling && !this.hasErrorTests(syntaxInfo)) {
      gaps.push({
        type: 'missing_error_handling',
        severity: 'high',
        message: 'エラーケースのテストが不足しています'
      });
    }
    
    // アサーションの不足
    const assertionQuality = this.evaluateAssertions(syntaxInfo.assertions);
    if (assertionQuality.score < 0.5) {
      gaps.push({
        type: 'weak_assertions',
        severity: 'medium',
        details: assertionQuality.issues
      });
    }
    
    return gaps;
  }
}

### Phase 2: TypeScript API統合（4週間）

#### 目標
- TypeScript Compiler APIによる詳細な型情報取得
- 型情報を活用した高度な意図推論
- 性能最適化（遅延評価）

#### Week 5-6: TypeScript Compiler API統合

```typescript
// src/analyzers/TypeScriptAnalyzer.ts
import * as ts from 'typescript';

export class TypeScriptAnalyzer {
  private programCache: Map<string, ts.Program> = new Map();
  
  async analyze(filePath: string): Promise<TypeInfo> {
    const program = this.getOrCreateProgram(filePath);
    const sourceFile = program.getSourceFile(filePath);
    const typeChecker = program.getTypeChecker();
    
    return {
      functionTypes: this.extractFunctionTypes(sourceFile, typeChecker),
      variableTypes: this.extractVariableTypes(sourceFile, typeChecker),
      importedTypes: this.extractImportedTypes(sourceFile, typeChecker),
      genericTypes: this.extractGenericTypes(sourceFile, typeChecker)
    };
  }
  
  private extractFunctionTypes(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ): FunctionTypeInfo[] {
    const functions: FunctionTypeInfo[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const signature = typeChecker.getResolvedSignature(node);
        if (signature) {
          const params = signature.getParameters().map(param => ({
            name: param.getName(),
            type: typeChecker.typeToString(
              typeChecker.getTypeOfSymbolAtLocation(param, node)
            ),
            optional: param.valueDeclaration 
              ? ts.isParameter(param.valueDeclaration) && !!param.valueDeclaration.questionToken
              : false
          }));
          
          functions.push({
            name: node.expression.getText(),
            parameters: params,
            returnType: typeChecker.typeToString(signature.getReturnType()),
            location: this.getNodeLocation(node)
          });
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return functions;
  }
  
  private getOrCreateProgram(filePath: string): ts.Program {
    const cached = this.programCache.get(filePath);
    if (cached && !this.isOutdated(cached, filePath)) {
      return cached;
    }
    
    const program = ts.createProgram([filePath], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true
    });
    
    this.programCache.set(filePath, program);
    return program;
  }
}
```

#### Week 7-8: 高度な意図推論

```typescript
// src/intent/TypeBasedIntentInference.ts
export class TypeBasedIntentInference {
  inferFromTypes(typeInfo: TypeInfo): TypeBasedIntent[] {
    const intents: TypeBasedIntent[] = [];
    
    // 型名からドメインを推論
    typeInfo.functionTypes.forEach(func => {
      func.parameters.forEach(param => {
        const domainIntent = this.inferDomainFromType(param.type);
        if (domainIntent) {
          intents.push({
            source: 'type',
            confidence: domainIntent.confidence,
            domain: domainIntent.domain,
            action: this.inferActionFromFunction(func.name),
            target: param.name
          });
        }
      });
    });
    
    return intents;
  }
  
  private inferDomainFromType(typeName: string): DomainIntent | null {
    const domainPatterns = [
      { pattern: /Payment|Transaction|Invoice/, domain: 'payment', confidence: 0.9 },
      { pattern: /User|Auth|Session|Token/, domain: 'authentication', confidence: 0.9 },
      { pattern: /Product|Item|Cart|Order/, domain: 'ecommerce', confidence: 0.8 },
      { pattern: /Email|SMS|Notification/, domain: 'communication', confidence: 0.8 },
      { pattern: /Error|Exception|Failure/, domain: 'error_handling', confidence: 0.7 }
    ];
    
    for (const { pattern, domain, confidence } of domainPatterns) {
      if (pattern.test(typeName)) {
        return { domain, confidence };
      }
    }
    
    return null;
  }
}
```

### Phase 3: NIST評価実装（3週間）

#### 目標
- NIST SP 800-30準拠のリスク評価
- 依存関係を考慮した影響度分析
- 実用的な改善提案生成

#### Week 9-10: NIST SP 800-30実装

```typescript
// src/risk/NistRiskEvaluator.ts
export class NistRiskEvaluator {
  evaluate(gaps: Gap[], typeInfo: TypeInfo | null): RiskAssessment {
    const threat = this.assessThreat(gaps);
    const vulnerability = this.assessVulnerability(gaps, typeInfo);
    const impact = this.assessImpact(typeInfo);
    
    const riskScore = threat.level * vulnerability.level * impact.level;
    
    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      components: { threat, vulnerability, impact },
      recommendations: this.generateRecommendations(gaps, riskScore)
    };
  }
  
  private assessThreat(gaps: Gap[]): ThreatAssessment {
    let threatScore = 0;
    const factors: string[] = [];
    
    // ギャップの種類と数による脅威評価
    gaps.forEach(gap => {
      switch (gap.type) {
        case 'missing_error_handling':
          threatScore += 8;
          factors.push('エラーハンドリング不足');
          break;
        case 'weak_assertions':
          threatScore += 5;
          factors.push('弱いアサーション');
          break;
        case 'missing_edge_cases':
          threatScore += 6;
          factors.push('エッジケース未考慮');
          break;
      }
    });
    
    return {
      level: Math.min(10, Math.ceil(threatScore / gaps.length)),
      factors
    };
  }
  
  private assessVulnerability(gaps: Gap[], typeInfo: TypeInfo | null): VulnerabilityAssessment {
    let vulnScore = 0;
    
    // テストカバレッジの不足
    const coverageGaps = gaps.filter(g => g.type.includes('missing'));
    vulnScore += coverageGaps.length * 3;
    
    // 型安全性の欠如
    if (!typeInfo || typeInfo.functionTypes.some(f => f.returnType === 'any')) {
      vulnScore += 5;
    }
    
    return {
      level: Math.min(10, vulnScore),
      factors: this.identifyVulnerabilityFactors(gaps, typeInfo)
    };
  }
}
```

#### Week 11: 依存関係統合

```typescript
// src/integration/DependencyImpactAnalyzer.ts
import { DependencyAnalyzer } from '../analyzers/dependency';

export class DependencyImpactAnalyzer {
  constructor(private dependencyAnalyzer: DependencyAnalyzer) {}
  
  async calculateImpact(filePath: string, baseImpact: number): Promise<ImpactAssessment> {
    const projectPath = path.dirname(filePath);
    const deps = await this.dependencyAnalyzer.analyzeDependencies(projectPath);
    
    const fileDepInfo = deps.fileDependencies.find(d => d.file === filePath);
    if (!fileDepInfo) {
      return { level: baseImpact, multiplier: 1.0, reason: 'No dependencies' };
    }
    
    // 被依存数による影響度計算
    const dependentCount = fileDepInfo.dependents.length;
    const multiplier = 1 + Math.log10(dependentCount + 1) * 0.5;
    
    // クリティカルパスの判定
    const isOnCriticalPath = this.isOnCriticalPath(fileDepInfo, deps);
    if (isOnCriticalPath) {
      multiplier *= 1.5;
    }
    
    return {
      level: Math.min(10, baseImpact * multiplier),
      multiplier,
      reason: `${dependentCount}個のコンポーネントに影響`,
      criticalPath: isOnCriticalPath
    };
  }
}

### Phase 4: 最適化と実用化（3週間）

#### 目標
- 大規模プロジェクト対応（パフォーマンス最適化）
- CI/CD統合
- 実用的なレポート生成

#### Week 12: パフォーマンス最適化

```typescript
// src/optimization/ParallelProcessor.ts
import { Worker } from 'worker_threads';
import * as os from 'os';

export class ParallelProcessor {
  private workerPool: Worker[] = [];
  private taskQueue: AnalysisTask[] = [];
  
  constructor(private workerCount: number = os.cpus().length) {
    this.initializeWorkers();
  }
  
  async analyzeProject(testFiles: string[]): Promise<ProjectAnalysis> {
    // ファイルを最適なチャンクサイズに分割
    const chunkSize = Math.ceil(testFiles.length / (this.workerCount * 2));
    const chunks = this.chunkArray(testFiles, chunkSize);
    
    // 各チャンクを並列処理
    const results = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk))
    );
    
    return this.mergeResults(results);
  }
  
  private async processChunk(files: string[]): Promise<ChunkResult> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      worker.postMessage({
        type: 'analyze',
        files,
        options: {
          quickMode: files.length > 50, // 大量ファイルは高速モード
          typeAnalysis: files.length < 20 // 少量なら詳細解析
        }
      });
      
      worker.once('message', (result) => {
        if (result.error) reject(result.error);
        else resolve(result);
      });
    });
  }
}

// src/optimization/CacheStrategy.ts
export class AnalysisCache {
  private memoryCache: LRUCache<string, AnalysisResult>;
  private persistentCache: DiskCache;
  
  constructor() {
    this.memoryCache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 60 }); // 1時間
    this.persistentCache = new DiskCache('.rimor-cache');
  }
  
  async get(filePath: string): Promise<AnalysisResult | null> {
    // L1: メモリキャッシュ
    const memResult = this.memoryCache.get(filePath);
    if (memResult) return memResult;
    
    // L2: ディスクキャッシュ
    const fileHash = await this.getFileHash(filePath);
    const diskResult = await this.persistentCache.get(fileHash);
    
    if (diskResult && !this.isStale(diskResult, filePath)) {
      this.memoryCache.set(filePath, diskResult);
      return diskResult;
    }
    
    return null;
  }
}
```

#### Week 13: CI/CD統合とレポート生成

```typescript
// src/cli/RimorCLI.ts
export class RimorCLI {
  async run(args: string[]): Promise<void> {
    const options = this.parseArgs(args);
    
    if (options.ci) {
      // CI モード: 終了コードで結果を返す
      const analysis = await this.analyzer.analyzeProject(options.path);
      const hasErrors = analysis.risks.some(r => r.level === 'CRITICAL');
      
      if (hasErrors && options.failOnCritical) {
        console.error('Critical test quality issues found');
        process.exit(1);
      }
    }
    
    // レポート生成
    const reporter = this.getReporter(options.format);
    const report = await reporter.generate(analysis);
    
    if (options.output) {
      await fs.writeFile(options.output, report);
    } else {
      console.log(report);
    }
  }
}

// src/reporting/HtmlReporter.ts
export class HtmlReporter implements IReporter {
  async generate(analysis: ProjectAnalysis): Promise<string> {
    const template = await this.loadTemplate('report.hbs');
    
    const data = {
      summary: {
        totalFiles: analysis.files.length,
        criticalGaps: analysis.gaps.filter(g => g.severity === 'critical').length,
        averageRisk: this.calculateAverageRisk(analysis.risks)
      },
      riskMatrix: this.generateRiskMatrix(analysis.risks),
      recommendations: this.prioritizeRecommendations(analysis.recommendations),
      charts: {
        riskDistribution: this.generateRiskChart(analysis.risks),
        gapTypes: this.generateGapChart(analysis.gaps)
      }
    };
    
    return Handlebars.compile(template)(data);
  }
}
```

#### Week 14: 統合テストと最終調整

```typescript
// GitHub Actions設定例
// .github/workflows/rimor-check.yml
name: Test Quality Check
on: [push, pull_request]

jobs:
  rimor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run Rimor Analysis
        run: |
          npx rimor analyze ./test \
            --format=markdown \
            --output=rimor-report.md \
            --fail-on-critical
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = fs.readFileSync('rimor-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

## 技術スタック

### 既存技術の活用
- TypeScript 5.x
- Jest（テストフレームワーク）
- TypeScript Compiler API（AST解析）

### 新規導入検討
- 自然言語処理: compromise.js または natural
- レポート生成: Handlebars.js（既存）
- 可視化: Chart.js または D3.js

## リスクと対策

### 技術的リスク

1. **意図推論の精度**
   - リスク: False positiveが多い
   - 対策: 段階的な改善、ユーザーフィードバックループ

2. **パフォーマンス**
   - リスク: 大規模プロジェクトで遅い
   - 対策: 既存の並列処理機能を最大活用

3. **既存コードとの互換性**
   - リスク: v0.8.0からの移行が困難
   - 対策: 段階的移行、互換性レイヤーの提供

## マイルストーン

### M1: MVP リリース（Phase 1完了時）
- 基本的な意図抽出
- シンプルなギャップ検出
- 3段階リスク評価

### M2: ベータリリース（Phase 2完了時）
- 高度な意図理解
- NIST準拠リスク評価
- 依存関係考慮

### M3: 正式リリース（Phase 3完了時）
- 本番環境対応
- CI/CD統合
- 完全なドキュメント

## 成功指標

### 技術指標
- テスト意図抽出精度: 85%以上
- 分析速度: 1000ファイル/10秒
- メモリ使用量: 2GB以下

### ビジネス指標
- ユーザー満足度: 70%以上
- 導入プロジェクト: 10件以上（ベータ期間）
- バグ検出率向上: 20%以上

## 次のステップ

1. **技術検証（1週間）**
   - TypeScript AST APIの詳細調査
   - 意図推論アルゴリズムのプロトタイプ

2. **詳細設計（1週間）**
   - 各コンポーネントのインターフェース定義
   - データフロー設計

3. **開発環境準備**
   - 新しいブランチの作成
   - CI/CDパイプラインの設定

---

本計画は、既存のRimor v0.8.0の資産を最大限活用しつつ、新しいビジョンを実現するための現実的なアプローチを提供します。