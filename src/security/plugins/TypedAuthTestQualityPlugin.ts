/**
 * 型ベースセキュリティプラグイン - 認証テスト品質監査
 * TaintTyperの手法を応用し、認証テストの品質を型レベルで追跡・検証
 */

import {
  TestMethod,
  MethodAnalysisResult,
  TaintAnalysisResult,
  TypeInferenceResult,
  MethodChange,
  IncrementalUpdate,
  SecurityType,
  TaintLevel,
  SecurityIssue,
  SecurityTestMetrics,
  SecurityImprovement,
  AuthTestCoverage,
  ITypeBasedSecurityPlugin,
  FlowGraph,
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement
} from '../../core/types';
import { FlowSensitiveAnalyzer } from '../analysis/flow';
import { SignatureBasedInference } from '../analysis/inference';
import { SecurityLattice, SecurityViolation } from '../types/lattice';

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
    let score = 100;
    let authCoverage = 0;
    
    // 認証カバレッジの計算
    const requiredPatterns = ['login-success', 'login-failure', 'token-validation', 'session-management'];
    const coveredPatterns = patterns.filter(p => 
      p.patternId && requiredPatterns.includes(p.patternId)
    );
    
    authCoverage = coveredPatterns.length / requiredPatterns.length * 100;
    score = Math.min(score, authCoverage);

    return {
      overall: Math.round(score),
      breakdown: {
        completeness: authCoverage,
        correctness: this.calculateCorrectness(patterns),
        maintainability: this.calculateMaintainability(patterns)
      },
      confidence: this.calculateConfidence(patterns)
    };
  }

  /**
   * 改善提案（既存インターフェース対応）
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (evaluation.breakdown?.completeness && evaluation.breakdown.completeness < 80) {
      improvements.push({
        id: 'auth-coverage-improvement',
        priority: 'high',
        type: 'add',
        title: '認証テストカバレッジの向上',
        description: '不足している認証シナリオのテストケースを追加してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { scoreImprovement: 20, effortMinutes: 30 },
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
        methodName: method.name,
        issues,
        metrics,
        suggestions,
        analysisTime: Date.now() - startTime
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
    for (const node of flow.nodes) {
      if (this.isAuthRelatedNode(node)) {
        const taintLevel = this.analyzeAuthNodeTaint(node);
        lattice.setTaintLevel(node.id, taintLevel);
      }
    }

    // 認証セキュリティ不変条件の検証
    const authViolations = this.verifyAuthInvariants(flow, lattice);
    violations.push(...authViolations);

    return {
      lattice,
      violations,
      taintPaths: this.extractAuthTaintPaths(flow),
      criticalFlows: this.identifyAuthCriticalFlows(flow, violations)
    };
  }

  /**
   * 型推論 - セキュリティ型の推論
   */
  async inferSecurityTypes(method: TestMethod): Promise<TypeInferenceResult> {
    // 認証メソッドに特化した型推論
    return this.inferenceEngine.inferSecurityTypes(method);
  }

  /**
   * インクリメンタル更新
   */
  async updateAnalysis(changes: MethodChange[]): Promise<IncrementalUpdate> {
    const updatedMethods: string[] = [];
    const invalidatedCache: string[] = [];
    const newIssues: SecurityIssue[] = [];
    const resolvedIssues: string[] = [];

    for (const change of changes) {
      const methodName = change.method.name;
      
      switch (change.type) {
        case 'added':
        case 'modified':
          // 新規/変更されたメソッドを再解析
          const result = await this.analyzeMethod(change.method);
          updatedMethods.push(methodName);
          newIssues.push(...result.issues);
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
      updatedMethods,
      invalidatedCache,
      newIssues,
      resolvedIssues
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
    const methodContent = method.content.toLowerCase();
    
    return authKeywords.some(keyword => 
      methodName.includes(keyword) || methodContent.includes(keyword)
    );
  }

  private isAuthRelatedNode(node: any): boolean {
    const content = node.statement.content.toLowerCase();
    const authPatterns = ['login', 'auth', 'token', 'password', 'credential'];
    return authPatterns.some(pattern => content.includes(pattern));
  }

  private analyzeAuthNodeTaint(node: any): TaintLevel {
    const content = node.statement.content.toLowerCase();
    
    // ユーザー入力（パスワード、認証情報）は高汚染
    if (content.includes('password') || content.includes('credential')) {
      return TaintLevel.DEFINITELY_TAINTED;
    }
    
    // トークン生成・検証は中程度の汚染
    if (content.includes('token') || content.includes('jwt')) {
      return TaintLevel.POSSIBLY_TAINTED;
    }
    
    return TaintLevel.UNTAINTED;
  }

  private verifyAuthInvariants(flow: FlowGraph, lattice: SecurityLattice): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // 認証特有の不変条件をチェック
    // 例: パスワードが平文でアサートされていないか
    flow.nodes.forEach(node => {
      const content = node.statement.content;
      if (content.includes('password') && content.includes('expect') && !content.includes('hash')) {
        violations.push({
          type: 'unsafe-assertion',
          variable: 'password',
          taintLevel: TaintLevel.DEFINITELY_TAINTED,
          metadata: {
            source: 'user-input' as any,
            confidence: 0.9,
            location: { file: '', line: 0, column: 0 },
            tracePath: [],
            securityRules: ['password-plaintext-check']
          },
          severity: 'critical',
          suggestedFix: 'パスワードは平文ではなくハッシュ値でテストしてください'
        });
      }
    });
    
    return violations;
  }

  private extractAuthTaintPaths(flow: FlowGraph): any[] {
    // 認証関連の汚染パスを抽出
    return [];
  }

  private identifyAuthCriticalFlows(flow: FlowGraph, violations: SecurityViolation[]): any[] {
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
        severity: violation.severity as any,
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
        type: 'missing-auth-test',
        message: `認証テストで${missing}のシナリオが不足しています`,
        location: { file: method.filePath, line: 0, column: 0 }
      });
    });

    return issues;
  }

  private calculateAuthMetrics(method: TestMethod, taintResult: TaintAnalysisResult): SecurityTestMetrics {
    const content = method.content.toLowerCase();
    
    // 認証関連のメトリクスを計算
    const hasLoginTest = content.includes('login');
    const hasPasswordTest = content.includes('password');
    const hasTokenTest = content.includes('token');
    const hasSessionTest = content.includes('session');

    const authCoverage = [hasLoginTest, hasPasswordTest, hasTokenTest, hasSessionTest]
      .filter(Boolean).length / 4;

    return {
      securityCoverage: {
        authentication: authCoverage * 100,
        inputValidation: 50, // デフォルト値
        apiSecurity: 30, // デフォルト値
        overall: authCoverage * 100 * 0.8 + 20 // 認証重視
      },
      taintFlowDetection: taintResult.violations.length === 0 ? 1.0 : 0.5,
      sanitizerCoverage: 0.7, // デフォルト値
      invariantCompliance: taintResult.violations.length === 0 ? 1.0 : 0.3
    };
  }

  private generateAuthSuggestions(issues: SecurityIssue[], method: TestMethod): SecurityImprovement[] {
    const suggestions: SecurityImprovement[] = [];

    issues.forEach(issue => {
      if (issue.type === 'missing-auth-test') {
        suggestions.push({
          id: `fix-${issue.id}`,
          priority: 'high',
          type: 'enhance-coverage',
          title: '認証テストケースの追加',
          description: issue.message,
          location: issue.location,
          estimatedImpact: { securityImprovement: 25, implementationMinutes: 15 },
          automatable: false
        });
      }
    });

    return suggestions;
  }

  private checkAuthCoverage(method: TestMethod, required: string[]): string[] {
    const content = method.content.toLowerCase();
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
    return `${method.filePath}:${method.name}:${method.content.length}`;
  }

  private createEmptyResult(methodName: string, analysisTime: number): MethodAnalysisResult {
    return {
      methodName,
      issues: [],
      metrics: {
        securityCoverage: { authentication: 0, inputValidation: 0, apiSecurity: 0, overall: 0 },
        taintFlowDetection: 0,
        sanitizerCoverage: 0,
        invariantCompliance: 0
      },
      suggestions: [],
      analysisTime
    };
  }

  private createErrorResult(methodName: string, error: any, analysisTime: number): MethodAnalysisResult {
    return {
      methodName,
      issues: [{
        id: `error-${methodName}`,
        severity: 'error',
        type: 'missing-sanitizer', // fallback
        message: `解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        location: { file: '', line: 0, column: 0 }
      }],
      metrics: {
        securityCoverage: { authentication: 0, inputValidation: 0, apiSecurity: 0, overall: 0 },
        taintFlowDetection: 0,
        sanitizerCoverage: 0,
        invariantCompliance: 0
      },
      suggestions: [],
      analysisTime
    };
  }
}