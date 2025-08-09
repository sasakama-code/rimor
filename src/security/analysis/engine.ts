/**
 * 型ベースセキュリティ解析 - 統合エンジン
 * TaintTyperの理論を実装し、モジュラー解析とフロー解析を統合
 */

import {
  TestMethod,
  TestCase,
  CompileTimeResult,
  SecurityIssue,
  TypeInferenceResult,
  SecurityTypeAnnotation,
  MethodAnalysisResult,
  IncrementalResult,
  MethodChange,
  TypeBasedSecurityAnalysis,
  ModularAnalysis,
  TypeBasedSecurityConfig,
  SecurityType
} from '../types';
import { TaintLevel, TaintSource } from '../../types/common-types';
import { SecurityImprovement, FlowNode } from '../types/flow-types';
import {
  TaintQualifier,
  TypeConstructors,
  TypeGuards,
  type QualifiedType
} from '../types/checker-framework-types';
import { TaintLevelAdapter } from '../compatibility/taint-level-adapter';
import { MethodSignature } from '../types';
import { ModularTestAnalyzer } from './modular';
import { FlowSensitiveAnalyzer, FlowGraph } from './flow';
import { SignatureBasedInference } from './inference';
import { SecurityLattice } from '../types/lattice';
import { SecurityViolation } from '../types/flow-types';
import { ParallelTypeChecker, createParallelTypeChecker } from '../checker/parallel-type-checker';
import * as os from 'os';

/**
 * 型ベースセキュリティ解析エンジン
 * TaintTyperの手法を統合し、ゼロランタイムオーバーヘッドを実現
 */
export class TypeBasedSecurityEngine implements TypeBasedSecurityAnalysis, ModularAnalysis {
  private modularAnalyzer: ModularTestAnalyzer;
  private flowAnalyzer: FlowSensitiveAnalyzer;
  private inferenceEngine: SignatureBasedInference;
  private config: TypeBasedSecurityConfig;
  private workerPool: WorkerPool;
  private parallelTypeChecker: ParallelTypeChecker;

  constructor(config?: Partial<TypeBasedSecurityConfig>) {
    this.config = {
      strictness: 'moderate',
      maxAnalysisTime: 30000,
      parallelism: Math.max(1, Math.floor(os.cpus().length * 0.8)),
      enableCache: true,
      customSanitizers: [],
      customSinks: [],
      excludePatterns: [],
      ...config
    };

    this.modularAnalyzer = new ModularTestAnalyzer();
    this.flowAnalyzer = new FlowSensitiveAnalyzer();
    this.inferenceEngine = new SignatureBasedInference();
    this.workerPool = new WorkerPool(this.config.parallelism);
    this.parallelTypeChecker = createParallelTypeChecker({
      workerCount: this.config.parallelism,
      enableCache: this.config.enableCache,
      debug: false
    });
  }

  /**
   * プロジェクト全体のコンパイル時解析を実行
   * すべての解析は開発時/CI時に実行 - 本番環境への影響は完全にゼロ
   */
  async analyzeAtCompileTime(testFiles: TestCase[]): Promise<CompileTimeResult> {
    const startTime = Date.now();
    const allIssues: SecurityIssue[] = [];
    const statistics = {
      filesAnalyzed: 0,
      methodsAnalyzed: 0,
      inferenceSuccessRate: 0
    };

    try {
      // Step 1: テストファイルをテストメソッドに分割
      const testMethods = await this.extractTestMethods(testFiles);
      statistics.methodsAnalyzed = testMethods.length;

      // Step 2: 並列モジュラー解析の実行
      const methodResults = await this.analyzeMethodsInParallel(testMethods);

      // Step 3: 結果の集約
      const aggregatedResults = this.aggregateAnalysisResults(methodResults);
      allIssues.push(...aggregatedResults.issues);

      // Step 4: 統計情報の計算
      statistics.filesAnalyzed = testFiles.length;
      statistics.inferenceSuccessRate = this.calculateInferenceSuccessRate(methodResults);

      return {
        issues: allIssues,
        executionTime: Date.now() - startTime,
        runtimeImpact: 0, // 常にゼロ - コンパイル時解析のため
        statistics
      };

    } catch (error) {
      // エラーハンドリング
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      allIssues.push({
        id: 'compile-time-error',
        severity: 'error',
        type: 'missing-sanitizer', // fallback type
        message: `コンパイル時解析エラー: ${errorMessage}`,
        location: {
          file: 'unknown',
          line: 0,
          column: 0
        }
      });

      return {
        issues: allIssues,
        executionTime: Date.now() - startTime,
        runtimeImpact: 0,
        statistics
      };
    }
  }

  /**
   * 汚染レベルの推論（新型システム版）
   */
  async inferTaintTypes(testFile: TestCase): Promise<Map<string, QualifiedType<unknown>>> {
    const testMethods = await this.extractTestMethodsFromFile(testFile);
    const taintMap = new Map<string, QualifiedType<unknown>>();

    for (const method of testMethods) {
      // フロー解析による汚染追跡
      const flowGraph = this.flowAnalyzer.trackSecurityDataFlow(method);
      
      // 各変数の汚染レベルを抽出
      for (const [nodeId, node] of flowGraph.nodes) {
        const variables = this.extractVariablesFromNode(node);
        variables.forEach(variable => {
          const currentType = taintMap.get(variable) || TypeConstructors.untainted(variable);
          
          // node.outputTaintを新型システムに変換
          const nodeType = TaintLevelAdapter.toQualifiedType(
            variable,
            node.outputTaint || TaintLevel.UNTAINTED,
            node.metadata?.sources?.[0] || TaintSource.USER_INPUT
          );
          
          // より汚染度の高い型を選択（join操作）
          const newType = TaintLevelAdapter.join(currentType, nodeType);
          taintMap.set(variable, newType);
        });
      }
    }

    return taintMap;
  }

  /**
   * レガシー互換メソッド（段階的移行のため）
   * @deprecated 新しいinferTaintTypesメソッドを使用してください
   */
  async inferTaintLevels(testFile: TestCase): Promise<Map<string, TaintLevel>> {
    const qualifiedTypes = await this.inferTaintTypes(testFile);
    const legacyMap = new Map<string, TaintLevel>();
    
    for (const [variable, qualifiedType] of qualifiedTypes) {
      const legacyLevel = TaintLevelAdapter.fromQualifiedType(qualifiedType);
      legacyMap.set(variable, legacyLevel);
    }
    
    return legacyMap;
  }

  /**
   * セキュリティ型の推論
   */
  async inferSecurityTypes(testFile: TestCase): Promise<TypeInferenceResult> {
    const testMethods = await this.extractTestMethodsFromFile(testFile);
    const allAnnotations: SecurityTypeAnnotation[] = [];
    let totalTime = 0;
    let totalVariables = 0;
    let totalInferred = 0;
    let totalFailed = 0;

    for (const method of testMethods) {
      const result = await this.inferenceEngine.inferSecurityTypes(method);
      allAnnotations.push(...result.annotations);
      totalTime += result.inferenceTime;
      totalVariables += result.statistics.totalVariables;
      totalInferred += result.statistics.inferred;
      totalFailed += result.statistics.failed;
    }

    return {
      annotations: allAnnotations,
      statistics: {
        totalVariables,
        inferred: totalInferred,
        failed: totalFailed,
        averageConfidence: this.calculateAverageConfidence(allAnnotations)
      },
      inferenceTime: totalTime
    };
  }

  /**
   * セキュリティ不変条件の検証
   */
  async verifyInvariants(testFile: TestCase): Promise<import('../types/lattice').SecurityViolation[]> {
    const testMethods = await this.extractTestMethodsFromFile(testFile);
    const allViolations: import('../types/lattice').SecurityViolation[] = [];

    for (const method of testMethods) {
      // フロー解析の実行
      const flowGraph = this.flowAnalyzer.trackSecurityDataFlow(method);
      
      // セキュリティ不変条件の検証
      const flowViolations = this.flowAnalyzer.verifySecurityInvariants(flowGraph);
      
      // flow-types.SecurityViolationをlattice.SecurityViolationに変換
      const latticeViolations: import('../types/lattice').SecurityViolation[] = flowViolations.map(v => ({
        type: v.type,
        message: v.message || 'Security violation detected',
        severity: (['info', 'error', 'warning'].includes(v.severity)) ? 'medium' : v.severity as ('low' | 'medium' | 'high' | 'critical'),
        variable: v.variable || 'unknown',
        taintLevel: v.taintLevel || 'unknown' as TaintLevel,
        metadata: v.metadata || { level: 'unknown' as TaintLevel, sources: [], sinks: [], sanitizers: [] },
        suggestedFix: v.suggestedFix || v.fix || 'Apply appropriate sanitization'
      }));
      
      allViolations.push(...latticeViolations);
    }

    return allViolations;
  }

  /**
   * テストメソッド単位の解析
   */
  async analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult> {
    return this.modularAnalyzer.analyzeTestMethod(method);
  }

  /**
   * インクリメンタル解析
   */
  async incrementalAnalyze(changes: MethodChange[]): Promise<IncrementalResult> {
    const changedMethods = changes.map(change => change.method);
    return this.modularAnalyzer.incrementalAnalyze(changedMethods);
  }

  /**
   * 並列解析（新型システムを使用）
   */
  async analyzeInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]> {
    // 並列型チェックを実行
    const typeCheckResults = await this.parallelTypeChecker.checkMethodsInParallel(methods);
    
    // 結果をMethodAnalysisResult形式に変換
    const results: MethodAnalysisResult[] = [];
    
    for (const [methodName, checkResult] of typeCheckResults) {
      const method = methods.find(m => m.name === methodName);
      if (!method) continue;
      
      const taintedCount = Array.from(checkResult.inferredTypes.values())
        .filter(type => type.__brand === '@Tainted').length;
      const totalVariables = checkResult.inferredTypes.size;
      
      results.push({
        methodName: method.name,
        issues: checkResult.securityIssues.map(issue => ({
          ...issue,
          location: {
            ...issue.location,
            file: issue.location.file || method.filePath || 'unknown'
          }
        })),
        metrics: {
          securityCoverage: {
            authentication: 0, // TODO: 認証テストカバレッジを計算
            inputValidation: totalVariables > 0 ? (totalVariables - taintedCount) / totalVariables : 0,
            apiSecurity: 0, // TODO: APIセキュリティカバレッジを計算
            overall: totalVariables > 0 ? (totalVariables - taintedCount) / totalVariables : 0
          },
          taintFlowDetection: taintedCount,
          sanitizerCoverage: 0, // TODO: サニタイザー適用率を計算
          invariantCompliance: 0 // TODO: 不変条件準拠率を計算
        },
        suggestions: [], // TODO: 改善提案を生成
        analysisTime: checkResult.executionTime
      });
    }
    
    // 統計情報を出力
    const stats = this.parallelTypeChecker.getStatistics();
    if (this.config.debug) {
      console.log(`Parallel type check completed: ${stats.totalMethods} methods, speedup: ${stats.speedup.toFixed(2)}x`);
    }
    
    return results;
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<TypeBasedSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // ワーカープールの再構築（必要に応じて）
    if (newConfig.parallelism && newConfig.parallelism !== this.config.parallelism) {
      this.workerPool.resize(newConfig.parallelism);
    }
  }

  /**
   * パフォーマンス統計の取得
   */
  getPerformanceStats(): PerformanceStats {
    return {
      cacheHitRate: this.modularAnalyzer['cache']?.getHitCount() || 0,
      averageAnalysisTime: this.calculateAverageAnalysisTime(),
      memoryUsage: process.memoryUsage().heapUsed,
      workerUtilization: this.workerPool.getUtilization()
    };
  }

  /**
   * テストファイルからテストメソッドを抽出
   */
  private async extractTestMethods(testFiles: TestCase[]): Promise<TestMethod[]> {
    const allMethods: TestMethod[] = [];

    for (const file of testFiles) {
      const methods = await this.extractTestMethodsFromFile(file);
      allMethods.push(...methods);
    }

    return allMethods;
  }

  /**
   * 単一ファイルからテストメソッドを抽出
   */
  private async extractTestMethodsFromFile(testFile: TestCase): Promise<TestMethod[]> {
    const methods: TestMethod[] = [];
    const content = testFile.content;
    
    // Step 1: まず全ての it/test メソッドを直接抽出（ネスト考慮）
    // より堅牢なテストメソッド抽出パターン
    const itPatterns = [
      // it('test name', async () => { ... }) - ブレース対応版
      /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s*\(\s*\)\s*=>\s*\{/g,
      // it('test name', () => { ... }) - ブレース対応版
      /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>\s*\{/g,
      // it('test name', async function() { ... }) - ブレース対応版
      /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s+function\s*\(\s*\)\s*\{/g,
      // it('test name', function() { ... }) - ブレース対応版
      /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*function\s*\(\s*\)\s*\{/g
    ];
    
    let methodIndex = 0;

    // Step 2: 各パターンでitメソッドを検索し、ブレースマッチングで本体を抽出
    for (const itPattern of itPatterns) {
      let match: RegExpExecArray | null;
      itPattern.lastIndex = 0; // Reset regex state
      
      while ((match = itPattern.exec(content)) !== null) {
        const methodName = match[1];
        const startIndex = match.index;
        const startLine = this.getLineNumber(content, startIndex);

        // Step 3: ブレースマッチングで実際のメソッド本体を抽出
        const methodContent = this.extractMethodBody(content, match.index + match[0].length - 1);
        
        if (methodContent) {
          // 重複を避けるため、既存のメソッド名をチェック
          if (!methods.some(m => m.name === methodName)) {
            methods.push({
              name: methodName,
              type: 'test',
              filePath: testFile.file,
              content: methodContent,
              signature: methodName,
              location: {
                start: { line: startLine, column: 0 } as import('../../core/types').Position,
                end: { line: startLine + methodContent.split('\n').length - 1, column: 0 } as import('../../core/types').Position
              }
            });
            methodIndex++;
          }
        }
      }
    }

    return methods;
  }

  /**
   * ブレースマッチングでメソッド本体を抽出
   */
  private extractMethodBody(content: string, startIndex: number): string | null {
    if (startIndex >= content.length || content[startIndex] !== '{') {
      return null;
    }

    let braceCount = 1;
    let index = startIndex + 1;
    const methodStart = startIndex;

    while (index < content.length && braceCount > 0) {
      const char = content[index];
      
      // 文字列リテラル内のブレースは無視
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        index++;
        // 対応するクォートまでスキップ
        while (index < content.length && content[index] !== quote) {
          if (content[index] === '\\') {
            index++; // エスケープ文字をスキップ
          }
          index++;
        }
        index++; // クロージングクォートをスキップ
        continue;
      }

      // ブレースカウント
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }

      index++;
    }

    if (braceCount === 0) {
      // 完全にマッチした場合、開始ブレースは除く
      return content.substring(methodStart + 1, index - 1);
    }

    return null; // マッチしなかった場合
  }

  /**
   * 並列メソッド解析の実行
   */
  private async analyzeMethodsInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]> {
    const chunks = this.partitionMethods(methods, this.config.parallelism);
    
    const results = await Promise.all(
      chunks.map(chunk => 
        this.workerPool.execute(async () => {
          return Promise.all(chunk.map(method => this.analyzeMethod(method)));
        })
      )
    );

    return results.flat();
  }

  /**
   * 解析結果の集約
   */
  private aggregateAnalysisResults(methodResults: MethodAnalysisResult[]): AggregatedResult {
    const allIssues: SecurityIssue[] = [];
    const allSuggestions: SecurityImprovement[] = [];

    for (const result of methodResults) {
      allIssues.push(...result.issues);
      if (result.suggestions) {
        allSuggestions.push(...(result.suggestions as SecurityImprovement[]));
      }
    }

    // 重複除去
    const uniqueIssues = this.deduplicateIssues(allIssues);

    return {
      issues: uniqueIssues,
      suggestions: allSuggestions,
      totalMethods: methodResults.length,
      averageScore: this.calculateAverageScore(methodResults)
    };
  }

  /**
   * 推論成功率の計算
   */
  private calculateInferenceSuccessRate(results: MethodAnalysisResult[]): number {
    if (results.length === 0) return 0;

    let totalVariables = 0;
    let totalInferred = 0;

    // ここでは簡易的な計算を行う（実際の実装では詳細な統計が必要）
    results.forEach(result => {
      const methodVariables = this.estimateVariableCount(result.methodName);
      const inferredVariables = Math.min(methodVariables, result.issues.length);
      
      totalVariables += methodVariables;
      totalInferred += inferredVariables;
    });

    return totalVariables > 0 ? totalInferred / totalVariables : 0;
  }

  /**
   * メソッドの分割
   */
  private partitionMethods(methods: TestMethod[], partitionCount: number): TestMethod[][] {
    const chunkSize = Math.ceil(methods.length / partitionCount);
    const chunks: TestMethod[][] = [];

    for (let i = 0; i < methods.length; i += chunkSize) {
      chunks.push(methods.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * 行番号の取得
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * メソッドシグネチャの作成
   */
  private createMethodSignature(methodName: string, methodContent: string): MethodSignature {
    // 簡易実装
    return {
      name: methodName,
      parameters: [],
      returnType: 'void',
      annotations: [],
      visibility: 'public',
      isAsync: methodContent.includes('async')
    };
  }

  /**
   * ノードから変数を抽出
   */
  private extractVariablesFromNode(node: FlowNode): string[] {
    const variables: string[] = [];
    const content = node.statement?.content || '';
    
    const matches = content.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    matches.forEach((match: string) => {
      if (!this.isKeyword(match)) {
        variables.push(match);
      }
    });

    return variables;
  }

  /**
   * 平均信頼度の計算
   */
  private calculateAverageConfidence(annotations: SecurityTypeAnnotation[]): number {
    if (annotations.length === 0) return 0;
    const total = annotations.reduce((sum, annotation) => sum + (annotation.confidence || 0), 0);
    return total / annotations.length;
  }

  /**
   * 平均解析時間の計算
   */
  private calculateAverageAnalysisTime(): number {
    // 実装簡略化
    return 50; // ms
  }

  /**
   * 問題の重複除去
   */
  private deduplicateIssues(issues: SecurityIssue[]): SecurityIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.type}-${issue.location.file}-${issue.location.line}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 平均スコアの計算
   */
  private calculateAverageScore(results: MethodAnalysisResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => {
      return sum + (result.metrics?.securityCoverage?.overall || 0);
    }, 0);
    
    return totalScore / results.length;
  }

  /**
   * 変数数の推定
   */
  private estimateVariableCount(methodName: string): number {
    // 簡易実装 - メソッド名の長さに基づく推定
    return Math.max(1, Math.floor(methodName.length / 10));
  }

  /**
   * キーワード判定
   */
  private isKeyword(word: string): boolean {
    const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'expect', 'it', 'describe'];
    return keywords.includes(word);
  }

  /**
   * expectパターンの安全な検索
   */
  private searchExpectPatterns(content: string): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    
    try {
      // 正しくエスケープされたexpectパターン
      const expectPattern = /expect\s*\(/gi;
      let match: RegExpExecArray | null;
      
      expectPattern.lastIndex = 0;
      while ((match = expectPattern.exec(content)) !== null) {
        matches.push(match);
      }
    } catch (error) {
      // 正規表現エラーをキャッチして安全にフォールバック
      console.warn(`正規表現パターンエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // フォールバック: 単純な文字列検索
      const simpleMatches = content.match(/expect\s*\(/g);
      if (simpleMatches) {
        simpleMatches.forEach(matchStr => {
          const index = content.indexOf(matchStr);
          if (index !== -1) {
            const matchArray = [matchStr] as RegExpMatchArray;
            matchArray.index = index;
            matches.push(matchArray);
          }
        });
      }
    }
    
    return matches;
  }
}

/**
 * ワーカープール - 並列処理の管理
 */
class WorkerPool {
  private workers: Worker[] = [];
  private activeWorkers = 0;

  constructor(private size: number) {
    // 実装簡略化 - 実際の実装ではワーカースレッドを使用
  }

  async execute<T>(task: () => Promise<T>): Promise<T> {
    this.activeWorkers++;
    try {
      return await task();
    } finally {
      this.activeWorkers--;
    }
  }

  resize(newSize: number): void {
    this.size = newSize;
    // ワーカープールのリサイズ実装
  }

  getUtilization(): number {
    return this.size > 0 ? this.activeWorkers / this.size : 0;
  }
}

/**
 * ワーカー（簡易実装）
 */
class Worker {
  // 実装簡略化
}

// 関連するインターフェースの定義
interface AggregatedResult {
  issues: SecurityIssue[];
  suggestions: SecurityImprovement[];
  totalMethods: number;
  averageScore: number;
}

interface PerformanceStats {
  cacheHitRate: number;
  averageAnalysisTime: number;
  memoryUsage: number;
  workerUtilization: number;
}