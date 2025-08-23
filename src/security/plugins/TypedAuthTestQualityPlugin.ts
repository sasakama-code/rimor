/**
 * 型ベースセキュリティプラグイン - 認証テスト品質監査
 * TaintTyperの手法を応用し、認証テストの品質を型レベルで追跡・検証
 */

import {
  TestMethod,
  SecurityType,
  TaintLevel,
  AuthTestCoverage,
  ITypeBasedSecurityPlugin,
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement
} from '../../core/types';
import {
  MethodAnalysisResult,
  TestMethodAnalysisResult,
  TaintAnalysisResult,
  TypeInferenceResult,
  SecurityMethodChange,
  IncrementalUpdate,
  SecurityIssue,
  SecurityTestMetrics,
  SecurityImprovement,
  FlowGraph
} from '../types/flow-types';
import { FlowSensitiveAnalyzer } from '../analysis/flow';
import { SignatureBasedInference } from '../analysis/inference';
import { SecurityLattice, SecurityViolation } from '../types/lattice';
import {
  TaintQualifier,
  QualifiedType,
  TypeConstructors,
  TypeGuards
} from '../types/checker-framework-types';
import { TaintLevelAdapter } from '../compatibility/taint-level-adapter';
import {
  AuthASTNode,
  AuthTypeInferenceResult,
  AuthTaintPath,
  AuthCriticalFlow,
  AnalysisError,
  isAuthASTNode,
  isAuthTypeInferenceResult
} from './typed-auth-plugin-types';
import { FlowNode } from '../types/flow-types';

/**
 * 型ベース認証テスト品質プラグイン
 * 認証関連のテストケースに特化した品質監査を実行
 */
export class TypedAuthTestQualityPlugin implements ITypeBasedSecurityPlugin {
  readonly id = 'typed-auth-test-quality';
  readonly name = '型ベース認証テスト品質監査';
  readonly version = '0.7.0';
  readonly type = 'core' as const;
  
  // 型システムとの統合
  readonly requiredTypes = [SecurityType.USER_INPUT, SecurityType.AUTH_TOKEN];
  readonly providedTypes = [SecurityType.VALIDATED_AUTH];
  
  private flowAnalyzer: FlowSensitiveAnalyzer;
  private inferenceEngine: SignatureBasedInference;
  private analysisCache = new Map<string, MethodAnalysisResult>();

  constructor() {
    this.flowAnalyzer = new FlowSensitiveAnalyzer();
    this.inferenceEngine = new SignatureBasedInference();
  }

  /**
   * プラグインの適用条件
   */
  isApplicable(context: ProjectContext): boolean {
    // 認証関連のファイルやライブラリが存在するかチェック
    const authLibraries = ['passport', 'jwt', 'bcrypt', 'express-session'];
    const hasAuthLibrary = authLibraries.some(lib => 
      context.packageJson?.dependencies?.[lib] || 
      context.packageJson?.devDependencies?.[lib]
    );

    // 認証関連のテストファイルが存在するかチェック
    const hasAuthTests = context.filePatterns?.test?.some(pattern => 
      pattern.includes('auth') || pattern.includes('login')
    ) || false;

    return hasAuthLibrary || hasAuthTests;
  }

  /**
   * パターン検出（既存インターフェース対応）
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    
    // 認証関連のパターンを検出
    const authPatterns = this.detectAuthPatterns(testFile.content);
    patterns.push(...authPatterns);

    return patterns;
  }

  /**
   * 品質評価（既存インターフェース対応）
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // 認証カバレッジの計算
    const requiredPatterns = ['login-success', 'login-failure', 'token-validation', 'session-management'];
    const coveredPatterns = patterns.filter(p => 
      p.patternId && requiredPatterns.includes(p.patternId)
    );
    
    // 0.0-1.0の範囲で計算
    const authCoverage = coveredPatterns.length / requiredPatterns.length;
    const correctness = this.calculateCorrectness(patterns) / 100; // 0.0-1.0に正規化
    const maintainability = this.calculateMaintainability(patterns) / 100; // 0.0-1.0に正規化
    
    // overallスコアを計算（0.0-1.0の範囲）
    const score = Math.min(1.0, authCoverage);

    return {
      overall: score, // 0.0-1.0の範囲
      dimensions: {
        completeness: authCoverage, // 0.0-1.0の範囲
        correctness: correctness, // 0.0-1.0の範囲
        maintainability: maintainability // 0.0-1.0の範囲
      },
      // 後方互換性のためbreakdownも提供（100スケール）
      breakdown: {
        completeness: authCoverage * 100,
        correctness: correctness * 100,
        maintainability: maintainability * 100
      },
      confidence: this.calculateConfidence(patterns)
    };
  }

  /**
   * 改善提案（既存インターフェース対応）
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    // 0.0-1.0の範囲で判定（0.8未満を低カバレッジとする）
    if (evaluation.dimensions?.completeness !== undefined && evaluation.dimensions.completeness < 0.8) {
      improvements.push({
        id: 'auth-coverage-improvement',
        priority: 'high',
        type: 'add',
        title: '認証テストカバレッジの向上',
        description: '不足している認証シナリオのテストケースを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: { scoreImprovement: 20, effortMinutes: 30 },
        automatable: false
      });
    }

    return improvements;
  }

  /**
   * モジュラー解析 - テストメソッド単位の解析
   */
  async analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // キャッシュチェック
      const cacheKey = this.generateCacheKey(method);
      const cached = this.analysisCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Step 1: 認証テストかどうかを判定
      if (!this.isAuthRelatedTest(method)) {
        return this.createEmptyResult(method.name, Date.now() - startTime);
      }

      // Step 2: フロー解析の実行
      const flowGraph = await this.trackDataFlow(method);

      // Step 3: 汚染解析の実行
      const taintResult = await this.analyzeTaint(flowGraph);

      // Step 4: 型推論の実行
      const typeResult = await this.inferSecurityTypes(method);

      // Step 5: 認証品質の評価
      const issues = this.evaluateAuthQuality(method, taintResult, typeResult);
      const metrics = this.calculateAuthMetrics(method, taintResult);
      const suggestions = this.generateAuthSuggestions(issues, method);

      const result: MethodAnalysisResult = {
        method,
        methodName: method.name,
        flowGraph: flowGraph,
        violations: taintResult.violations,
        metrics,
        improvements: suggestions,
        issues,
        suggestions: suggestions.map(s => s.description), // string[]に変換
        analysisTime: Date.now() - startTime // 分析時間を追加
      };

      // キャッシュに保存
      this.analysisCache.set(cacheKey, result);
      return result;

    } catch (error) {
      return this.createErrorResult(method.name, error, Date.now() - startTime);
    }
  }

  /**
   * フロー感度 - データフロー追跡
   */
  async trackDataFlow(method: TestMethod): Promise<FlowGraph> {
    return this.flowAnalyzer.trackSecurityDataFlow(method);
  }

  /**
   * 格子ベースの汚染解析
   */
  async analyzeTaint(flow: FlowGraph): Promise<TaintAnalysisResult> {
    const lattice = new SecurityLattice();
    const violations: SecurityViolation[] = [];

    // 認証フローに特化した汚染解析
    for (const [nodeId, node] of flow.nodes) {
      if (this.isAuthRelatedNode(node)) {
        const taintLevel = this.analyzeAuthNodeTaint(node);
        lattice.setTaintLevel(nodeId, taintLevel);
      }
    }

    // 認証セキュリティ不変条件の検証
    const authViolations = this.verifyAuthInvariants(flow, lattice);
    violations.push(...authViolations);

    // TaintAnalysisResultに必要なプロパティを返す
    const methodResults: MethodAnalysisResult[] = [];
    const overallMetrics: SecurityTestMetrics = {
      taintCoverage: 0,
      sanitizerCoverage: 0,
      sinkCoverage: 0,
      securityAssertions: 0,
      vulnerableFlows: violations.length
    };
    const improvements: SecurityImprovement[] = [];
    
    return {
      methods: methodResults,
      overallMetrics,
      violations,
      improvements
    };
  }

  /**
   * 型推論 - セキュリティ型の推論
   */
  async inferSecurityTypes(method: TestMethod): Promise<TypeInferenceResult> {
    // 認証メソッドに特化した型推論
    const result = await this.inferenceEngine.inferSecurityTypes(method);
    const authResult = result as AuthTypeInferenceResult;
    return {
      ...result,
      inferredTypes: authResult.inferredTypes || {},
      typeConstraints: authResult.typeConstraints || [],
      typeErrors: authResult.typeErrors || []
    } as TypeInferenceResult;
  }

  /**
   * インクリメンタル更新
   */
  async updateAnalysis(changes: SecurityMethodChange[]): Promise<IncrementalUpdate> {
    const updatedMethods: string[] = [];
    const invalidatedCache: string[] = [];
    const newIssues: SecurityIssue[] = [];
    const resolvedIssues: string[] = [];

    const analysisResults: MethodAnalysisResult[] = [];
    
    for (const change of changes) {
      const methodName = change.method.name;
      
      switch (change.type) {
        case 'added':
        case 'modified':
          // 新規/変更されたメソッドを再解析
          const result = await this.analyzeMethod(change.method);
          updatedMethods.push(methodName);
          analysisResults.push(result); // 解析結果を直接追加
          if (result.issues) {
            newIssues.push(...result.issues);
          }
          break;
          
        case 'deleted':
          // 削除されたメソッドのキャッシュを無効化
          const cacheKey = this.generateCacheKey(change.method);
          this.analysisCache.delete(cacheKey);
          invalidatedCache.push(cacheKey);
          break;
      }
    }

    return {
      changes,
      affectedMethods: changes.map(c => c.method),
      updatedMethods: analysisResults, // MethodAnalysisResult[]を返す
      reanalysisRequired: newIssues.length > 0
    };
  }

  // プライベートメソッド群
  private detectAuthPatterns(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // ログイン成功パターン
      if (line.includes('login') && line.includes('success')) {
        patterns.push({
          patternId: 'login-success',
          patternName: 'ログイン成功テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.9,
          evidence: [{ type: 'code', description: 'ログイン成功のテストケース', location: { file: '', line: index + 1, column: 0 }, code: line.trim(), confidence: 0.9 }]
        });
      }

      // ログイン失敗パターン
      if (line.includes('login') && (line.includes('fail') || line.includes('error'))) {
        patterns.push({
          patternId: 'login-failure',
          patternName: 'ログイン失敗テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.9,
          evidence: [{ type: 'code', description: 'ログイン失敗のテストケース', location: { file: '', line: index + 1, column: 0 }, code: line.trim(), confidence: 0.9 }]
        });
      }

      // トークン検証パターン
      if (line.includes('token') && line.includes('verify')) {
        patterns.push({
          patternId: 'token-validation',
          patternName: 'トークン検証テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.8,
          evidence: [{ type: 'code', description: 'トークン検証のテストケース', location: { file: '', line: index + 1, column: 0 }, code: line.trim(), confidence: 0.8 }]
        });
      }
    });

    return patterns;
  }

  private calculateCorrectness(patterns: DetectionResult[]): number {
    // 認証テストの正確性を評価
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    return patterns.length > 0 ? (highConfidencePatterns.length / patterns.length) * 100 : 0;
  }

  private calculateMaintainability(patterns: DetectionResult[]): number {
    // 認証テストの保守性を評価（簡易実装）
    return 80; // デフォルト値
  }

  private calculateConfidence(patterns: DetectionResult[]): number {
    if (patterns.length === 0) return 0;
    const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
    return totalConfidence / patterns.length;
  }

  private isAuthRelatedTest(method: TestMethod): boolean {
    const authKeywords = ['auth', 'login', 'logout', 'signin', 'signout', 'token', 'password', 'credential'];
    const methodName = method.name.toLowerCase();
    const methodContent = (method.content || '').toLowerCase();
    
    return authKeywords.some(keyword => 
      methodName.includes(keyword) || methodContent.includes(keyword)
    );
  }

  private isAuthRelatedNode(node: FlowNode): boolean {
    if (!node.statement?.content) return false;
    const content = node.statement.content.toLowerCase();
    const authPatterns = ['login', 'auth', 'token', 'password', 'credential'];
    return authPatterns.some(pattern => content.includes(pattern));
  }

  /**
   * 認証ノードの汚染分析（新型システム版）
   */
  private analyzeAuthNodeTaintType(node: FlowNode): QualifiedType<unknown> {
    if (!node.statement?.content) {
      return TypeConstructors.untainted(node.statement || {});
    }
    const content = node.statement.content.toLowerCase();
    
    // ユーザー入力（パスワード、認証情報）は高汚染
    if (content.includes('password') || content.includes('credential')) {
      return TypeConstructors.tainted(node.statement, 'auth-credentials', 0.95);
    }
    
    // トークン生成・検証は中程度の汚染
    if (content.includes('token') || content.includes('jwt')) {
      return TypeConstructors.tainted(node.statement, 'auth-token', 0.25);
    }
    
    return TypeConstructors.untainted(node.statement);
  }

  /**
   * レガシー互換メソッド
   * @deprecated analyzeAuthNodeTaintTypeを使用してください
   */
  private analyzeAuthNodeTaint(node: FlowNode): TaintLevel {
    const qualifiedType = this.analyzeAuthNodeTaintType(node);
    return TaintLevelAdapter.fromQualifiedType(qualifiedType);
  }

  private verifyAuthInvariants(flow: FlowGraph, lattice: SecurityLattice): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // 認証特有の不変条件をチェック
    // 例: パスワードが平文でアサートされていないか
    flow.nodes.forEach(node => {
      const content = node.statement?.content;
      if (content && content.includes('password') && content.includes('expect') && !content.includes('hash')) {
        violations.push({
          type: 'unsafe-assertion',
          message: 'パスワードが平文でアサートされています',
          variable: 'password',
          taintLevel: 'tainted',
          metadata: {
            level: 'tainted',
            sources: ['user-input'],
            sinks: [],
            sanitizers: [],
            // confidence removed - not in TaintMetadata
            // location removed - not in TaintMetadata
            propagationPath: []
            // tracePath and securityRules removed - not in TaintMetadata
          },
          severity: 'critical',
          suggestedFix: 'パスワードは平文ではなくハッシュ値でテストしてください'
        });
      }
    });
    
    return violations;
  }

  private extractAuthTaintPaths(flow: FlowGraph): AuthTaintPath[] {
    // 認証関連の汚染パスを抽出
    return [];
  }

  private identifyAuthCriticalFlows(flow: FlowGraph, violations: SecurityViolation[]): AuthCriticalFlow[] {
    // 認証関連のクリティカルフローを特定
    return [];
  }

  private evaluateAuthQuality(
    method: TestMethod, 
    taintResult: TaintAnalysisResult, 
    typeResult: TypeInferenceResult
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // 汚染解析の結果から問題を抽出
    taintResult.violations.forEach(violation => {
      issues.push({
        id: `auth-${violation.type}-${method.name}`,
        severity: violation.severity as SecurityIssue['severity'],
        type: 'unsafe-taint-flow',
        message: `認証テストで${violation.suggestedFix}`,
        location: { file: method.filePath, line: 0, column: 0 }
      });
    });

    // 認証カバレッジの不足をチェック
    const requiredCoverage: string[] = ['success', 'failure', 'token-expiry'];
    const missingCoverage = this.checkAuthCoverage(method, requiredCoverage);
    
    missingCoverage.forEach(missing => {
      issues.push({
        id: `auth-missing-${missing}-${method.name}`,
        severity: 'warning',
        type: 'authentication',
        message: `認証テストで${missing}のシナリオが不足しています`,
        location: { file: method.filePath, line: 0, column: 0 }
      });
    });

    return issues;
  }

  private calculateAuthMetrics(method: TestMethod, taintResult: TaintAnalysisResult): SecurityTestMetrics {
    const content = (method.content || '').toLowerCase();
    
    // 認証関連のメトリクスを計算
    const hasLoginTest = content.includes('login');
    const hasPasswordTest = content.includes('password');
    const hasTokenTest = content.includes('token');
    const hasSessionTest = content.includes('session');

    const authCoverage = [hasLoginTest, hasPasswordTest, hasTokenTest, hasSessionTest]
      .filter(Boolean).length / 4;

    return {
      taintCoverage: authCoverage,
      sanitizerCoverage: 0.7,
      sinkCoverage: 0.5,
      securityAssertions: hasTokenTest || hasSessionTest ? 1 : 0,
      vulnerableFlows: 0
    };
  }

  private generateAuthSuggestions(issues: SecurityIssue[], method: TestMethod): SecurityImprovement[] {
    const suggestions: SecurityImprovement[] = [];

    issues.forEach(issue => {
      if (issue.type === 'authentication') {
        suggestions.push({
          type: 'add-assertion',
          description: issue.message,
          location: issue.location,
          impact: 'high'
        });
      }
    });

    return suggestions;
  }

  private checkAuthCoverage(method: TestMethod, required: string[]): string[] {
    const content = method.content?.toLowerCase() || '';
    const missing: string[] = [];

    required.forEach(coverage => {
      let covered = false;
      
      switch (coverage) {
        case 'success':
          covered = content.includes('success') || content.includes('正常');
          break;
        case 'failure':
          covered = content.includes('fail') || content.includes('error') || content.includes('失敗');
          break;
        case 'token-expiry':
          covered = content.includes('expir') || content.includes('期限');
          break;
      }
      
      if (!covered) {
        missing.push(coverage);
      }
    });

    return missing;
  }

  private generateCacheKey(method: TestMethod): string {
    return `${method.filePath || 'unknown'}:${method.name}:${method.content?.length || 0}`;
  }

  private createEmptyResult(methodName: string, analysisTime: number): MethodAnalysisResult {
    const emptyMethod: TestMethod = {
      name: methodName,
      filePath: '',
      content: '',
      type: 'test',
      location: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    };
    return {
      method: emptyMethod,
      methodName,
      flowGraph: { nodes: new Map(), edges: [], exitNodes: [] },
      violations: [],
      metrics: {
        taintCoverage: 0,
        sanitizerCoverage: 0,
        sinkCoverage: 0,
        securityAssertions: 0,
        vulnerableFlows: 0
      },
      improvements: [],
      issues: [],
      suggestions: [],
      analysisTime: analysisTime
    };
  }

  private createErrorResult(methodName: string, error: unknown, analysisTime: number): MethodAnalysisResult {
    const emptyMethod: TestMethod = {
      name: methodName,
      filePath: '',
      content: '',
      type: 'test',
      location: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    };
    return {
      method: emptyMethod,
      methodName,
      flowGraph: { nodes: new Map(), edges: [], exitNodes: [] },
      violations: [],
      metrics: {
        taintCoverage: 0,
        sanitizerCoverage: 0,
        sinkCoverage: 0,
        securityAssertions: 0,
        vulnerableFlows: 0
      },
      improvements: [],
      issues: [{
        id: `error-${methodName}`,
        severity: 'critical',
        type: 'validation',
        message: `解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        location: { file: '', line: 0, column: 0 }
      }],
      suggestions: [],
      analysisTime: analysisTime
    };
  }

  /**
   * テストメソッドの分析（ITypeBasedSecurityPlugin準拠）
   */
  async analyzeTestMethod(method: TestMethod): Promise<TestMethodAnalysisResult> {
    // TestMethodまたは汎用メソッドオブジェクトを処理
    const testMethod: TestMethod = {
      name: method.name || 'unknown',
      filePath: method.filePath || '',
      content: method.content || '',
      type: 'test',
      location: method.location || { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
    };

    // 既存のanalyzeMethodを使用
    const result = await this.analyzeMethod(testMethod);
    
    // レスポンスを整形
    const testMethodResult: TestMethodAnalysisResult = {
      taintFlow: {
        nodes: result.flowGraph?.nodes || [],
        edges: result.flowGraph?.edges || [],
        exitNodes: result.flowGraph?.exitNodes || [],
        sources: result.flowGraph?.taintSources?.map(s => s.variable || s.source || 'unknown') || [],
        sanitizers: result.flowGraph?.sanitizers?.map(s => s.variable || 'unknown') || [],
        sinks: result.flowGraph?.securitySinks?.map(s => s.sink || 'unknown') || []
      },
      issues: result.issues || [],
      securityScore: 0.5 // デフォルトスコア
    };
    
    return testMethodResult;
  }
}