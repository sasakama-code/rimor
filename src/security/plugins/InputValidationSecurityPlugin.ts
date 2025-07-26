/**
 * 型ベースセキュリティプラグイン - 入力検証テスト品質監査
 * ユーザー入力のサニタイズ・バリデーションテストの品質を型レベルで追跡・検証
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
  TaintSource,
  SanitizerType,
  SecurityIssue,
  SecurityTestMetrics,
  SecurityImprovement,
  BoundaryCondition
} from '../types';
import { ITypeBasedSecurityPlugin } from '../../core/types';
import { FlowGraph } from '../analysis/flow';
import { 
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
 * 入力検証セキュリティプラグイン
 * 入力検証・サニタイズテストに特化した品質監査を実行
 */
export class InputValidationSecurityPlugin implements ITypeBasedSecurityPlugin {
  readonly id = 'input-validation-security';
  readonly name = '入力検証セキュリティテスト品質監査';
  readonly version = '0.7.0';
  readonly type = 'core' as const;
  
  // 型システムとの統合
  readonly requiredTypes = [SecurityType.USER_INPUT];
  readonly providedTypes = [SecurityType.VALIDATED_INPUT, SecurityType.SANITIZED_DATA];
  
  private flowAnalyzer: FlowSensitiveAnalyzer;
  private inferenceEngine: SignatureBasedInference;
  private analysisCache = new Map<string, MethodAnalysisResult>();
  
  // 入力検証パターン
  private readonly sanitizerPatterns = [
    /sanitize\(/gi,
    /escape\(/gi,
    /validate\(/gi,
    /clean\(/gi,
    /filter\(/gi,
    /htmlEscape\(/gi,
    /sqlEscape\(/gi
  ];

  private readonly injectionPatterns = [
    { type: 'sql', pattern: /('|"|;|union|select|insert|update|delete|drop)/gi },
    { type: 'xss', pattern: /(<script|javascript:|on\w+\s*=)/gi },
    { type: 'command', pattern: /(\||;|&|`|\$\()/gi },
    { type: 'path', pattern: /(\.\.\/|\.\.\\)/gi }
  ];

  constructor() {
    this.flowAnalyzer = new FlowSensitiveAnalyzer();
    this.inferenceEngine = new SignatureBasedInference();
  }

  /**
   * プラグインの適用条件
   */
  isApplicable(context: ProjectContext): boolean {
    // Web関連のライブラリが存在するかチェック
    const webLibraries = ['express', 'koa', 'fastify', 'body-parser', 'multer', 'joi', 'yup'];
    const hasWebLibrary = webLibraries.some(lib => 
      context.packageJson?.dependencies?.[lib] || 
      context.packageJson?.devDependencies?.[lib]
    );

    // 入力検証関連のテストファイルが存在するかチェック
    const hasValidationTests = context.filePatterns?.test?.some(pattern => 
      pattern.includes('validation') || 
      pattern.includes('input') || 
      pattern.includes('sanitize')
    ) || false;

    return hasWebLibrary || hasValidationTests;
  }

  /**
   * パターン検出（既存インターフェース対応）
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    
    // 入力検証関連のパターンを検出
    const validationPatterns = this.detectValidationPatterns(testFile.content);
    patterns.push(...validationPatterns);

    // サニタイザーパターンを検出
    const sanitizerPatterns = this.detectSanitizerPatterns(testFile.content);
    patterns.push(...sanitizerPatterns);

    // 境界値テストパターンを検出
    const boundaryPatterns = this.detectBoundaryPatterns(testFile.content);
    patterns.push(...boundaryPatterns);

    return patterns;
  }

  /**
   * 品質評価（既存インターフェース対応）
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    let score = 100;
    
    // 入力検証カバレッジの計算
    const validationCoverage = this.calculateValidationCoverage(patterns);
    const sanitizerCoverage = this.calculateSanitizerCoverage(patterns);
    const boundaryCoverage = this.calculateBoundaryCoverage(patterns);
    
    const overallCoverage = (validationCoverage + sanitizerCoverage + boundaryCoverage) / 3;
    score = Math.round(overallCoverage);

    return {
      overall: score,
      breakdown: {
        completeness: validationCoverage,
        correctness: sanitizerCoverage,
        maintainability: boundaryCoverage
      },
      confidence: this.calculateConfidence(patterns)
    };
  }

  /**
   * 改善提案（既存インターフェース対応）
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (evaluation.breakdown?.completeness && evaluation.breakdown.completeness < 70) {
      improvements.push({
        id: 'input-validation-coverage',
        priority: 'high',
        type: 'add',
        title: '入力検証テストの追加',
        description: '基本的な入力検証テストケースが不足しています',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { scoreImprovement: 25, effortMinutes: 20 },
        automatable: false
      });
    }

    if (evaluation.breakdown?.correctness && evaluation.breakdown.correctness < 70) {
      improvements.push({
        id: 'sanitizer-coverage',
        priority: 'critical',
        type: 'add',
        title: 'サニタイザーテストの追加',
        description: 'サニタイザーの動作確認テストが不足しています',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { scoreImprovement: 35, effortMinutes: 30 },
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

      // Step 1: 入力検証テストかどうかを判定
      if (!this.isInputValidationTest(method)) {
        return this.createEmptyResult(method.name, Date.now() - startTime);
      }

      // Step 2: フロー解析の実行
      const flowGraph = await this.trackDataFlow(method);

      // Step 3: 汚染解析の実行
      const taintResult = await this.analyzeTaint(flowGraph);

      // Step 4: 型推論の実行
      const typeResult = await this.inferSecurityTypes(method);

      // Step 5: 入力検証品質の評価
      const issues = this.evaluateInputValidationQuality(method, taintResult, typeResult);
      const metrics = this.calculateInputValidationMetrics(method, taintResult);
      const suggestions = this.generateInputValidationSuggestions(issues, method);

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

    // 入力検証フローに特化した汚染解析
    for (const node of flow.nodes) {
      if (this.isInputValidationNode(node)) {
        const taintLevel = this.analyzeInputNodeTaint(node);
        lattice.setTaintLevel(node.id, taintLevel);
      }
    }

    // 入力検証セキュリティ不変条件の検証
    const inputViolations = this.verifyInputValidationInvariants(flow, lattice);
    violations.push(...inputViolations);

    return {
      lattice,
      violations,
      taintPaths: this.extractInputTaintPaths(flow),
      criticalFlows: this.identifyInputCriticalFlows(flow, violations)
    };
  }

  /**
   * 型推論 - セキュリティ型の推論
   */
  async inferSecurityTypes(method: TestMethod): Promise<TypeInferenceResult> {
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
          const result = await this.analyzeMethod(change.method);
          updatedMethods.push(methodName);
          newIssues.push(...result.issues);
          break;
          
        case 'deleted':
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
  private detectValidationPatterns(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // 基本的な入力検証パターン
      if (line.includes('validate') || line.includes('check')) {
        patterns.push({
          patternId: 'input-validation',
          patternName: '入力検証テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.8,
          evidence: [{ 
            type: 'validation', 
            description: '入力検証のテストケース', 
            location: { file: '', line: index + 1, column: 0 }, 
            code: line.trim(), 
            confidence: 0.8 
          }]
        });
      }

      // 型検証パターン
      if (line.includes('typeof') || line.includes('instanceof')) {
        patterns.push({
          patternId: 'type-validation',
          patternName: '型検証テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.7,
          evidence: [{ 
            type: 'type-check', 
            description: '型検証のテストケース', 
            location: { file: '', line: index + 1, column: 0 }, 
            code: line.trim(), 
            confidence: 0.7 
          }]
        });
      }
    });

    return patterns;
  }

  private detectSanitizerPatterns(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      this.sanitizerPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          patterns.push({
            patternId: 'sanitizer-test',
            patternName: 'サニタイザーテスト',
            location: { file: '', line: index + 1, column: 0 },
            confidence: 0.9,
            evidence: [{ 
              type: 'sanitizer', 
              description: 'サニタイザーのテストケース', 
              location: { file: '', line: index + 1, column: 0 }, 
              code: line.trim(), 
              confidence: 0.9 
            }]
          });
        }
      });
    });

    return patterns;
  }

  private detectBoundaryPatterns(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // 境界値テストパターン
      const boundaryKeywords = ['empty', 'null', 'undefined', 'max', 'min', 'length', 'size'];
      
      if (boundaryKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        patterns.push({
          patternId: 'boundary-test',
          patternName: '境界値テスト',
          location: { file: '', line: index + 1, column: 0 },
          confidence: 0.6,
          evidence: [{ 
            type: 'boundary', 
            description: '境界値のテストケース', 
            location: { file: '', line: index + 1, column: 0 }, 
            code: line.trim(), 
            confidence: 0.6 
          }]
        });
      }
    });

    return patterns;
  }

  private calculateValidationCoverage(patterns: DetectionResult[]): number {
    const validationPatterns = patterns.filter(p => 
      p.patternId === 'input-validation' || p.patternId === 'type-validation'
    );
    return Math.min(100, validationPatterns.length * 25); // 4個で100%
  }

  private calculateSanitizerCoverage(patterns: DetectionResult[]): number {
    const sanitizerPatterns = patterns.filter(p => p.patternId === 'sanitizer-test');
    return Math.min(100, sanitizerPatterns.length * 33); // 3個で100%
  }

  private calculateBoundaryCoverage(patterns: DetectionResult[]): number {
    const boundaryPatterns = patterns.filter(p => p.patternId === 'boundary-test');
    return Math.min(100, boundaryPatterns.length * 20); // 5個で100%
  }

  private calculateConfidence(patterns: DetectionResult[]): number {
    if (patterns.length === 0) return 0;
    const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
    return totalConfidence / patterns.length;
  }

  private isInputValidationTest(method: TestMethod): boolean {
    const validationKeywords = [
      'validate', 'validation', 'input', 'sanitize', 'clean', 'filter',
      'boundary', 'limit', 'check', 'verify'
    ];
    
    const methodName = method.name.toLowerCase();
    const methodContent = method.content.toLowerCase();
    
    return validationKeywords.some(keyword => 
      methodName.includes(keyword) || methodContent.includes(keyword)
    );
  }

  private isInputValidationNode(node: any): boolean {
    const content = node.statement.content.toLowerCase();
    const inputPatterns = ['input', 'validate', 'sanitize', 'clean', 'filter'];
    return inputPatterns.some(pattern => content.includes(pattern));
  }

  private analyzeInputNodeTaint(node: any): TaintLevel {
    const content = node.statement.content.toLowerCase();
    
    // ユーザー入力は高汚染
    if (content.includes('req.body') || content.includes('req.query') || content.includes('input')) {
      return TaintLevel.DEFINITELY_TAINTED;
    }
    
    // サニタイズ後は清浄
    if (this.sanitizerPatterns.some(pattern => pattern.test(content))) {
      return TaintLevel.UNTAINTED;
    }
    
    // 検証中は中程度の汚染
    if (content.includes('validate') || content.includes('check')) {
      return TaintLevel.POSSIBLY_TAINTED;
    }
    
    return TaintLevel.UNTAINTED;
  }

  private verifyInputValidationInvariants(flow: FlowGraph, lattice: SecurityLattice): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // 入力検証特有の不変条件をチェック
    flow.nodes.forEach(node => {
      const content = node.statement.content;
      
      // サニタイズされていない入力が直接使用されているかチェック
      if (this.containsUnsanitizedInput(content)) {
        violations.push({
          type: 'unsanitized-taint-flow',
          variable: 'user_input',
          taintLevel: TaintLevel.DEFINITELY_TAINTED,
          metadata: {
            source: TaintSource.USER_INPUT,
            confidence: 0.9,
            location: { file: '', line: 0, column: 0 },
            tracePath: [],
            securityRules: ['input-sanitization-required']
          },
          severity: 'high',
          suggestedFix: 'ユーザー入力は適切にサニタイズしてからテストしてください'
        });
      }
      
      // インジェクション攻撃のテストが不足しているかチェック
      if (this.shouldTestInjection(content) && !this.hasInjectionTest(content)) {
        violations.push({
          type: 'missing-sanitizer',
          variable: 'injection_test',
          taintLevel: TaintLevel.LIKELY_TAINTED,
          metadata: {
            source: TaintSource.USER_INPUT,
            confidence: 0.8,
            location: { file: '', line: 0, column: 0 },
            tracePath: [],
            securityRules: ['injection-test-required']
          },
          severity: 'medium',
          suggestedFix: 'インジェクション攻撃に対するテストケースを追加してください'
        });
      }
    });
    
    return violations;
  }

  private containsUnsanitizedInput(content: string): boolean {
    const hasInput = content.includes('req.') || content.includes('input');
    const hasSanitizer = this.sanitizerPatterns.some(pattern => pattern.test(content));
    return hasInput && !hasSanitizer;
  }

  private shouldTestInjection(content: string): boolean {
    return content.includes('sql') || content.includes('html') || content.includes('script');
  }

  private hasInjectionTest(content: string): boolean {
    return this.injectionPatterns.some(pattern => pattern.pattern.test(content));
  }

  private extractInputTaintPaths(flow: FlowGraph): any[] {
    return [];
  }

  private identifyInputCriticalFlows(flow: FlowGraph, violations: SecurityViolation[]): any[] {
    return [];
  }

  private evaluateInputValidationQuality(
    method: TestMethod, 
    taintResult: TaintAnalysisResult, 
    typeResult: TypeInferenceResult
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // 汚染解析の結果から問題を抽出
    taintResult.violations.forEach(violation => {
      issues.push({
        id: `input-${violation.type}-${method.name}`,
        severity: violation.severity as any,
        type: 'unsafe-taint-flow',
        message: `入力検証テストで${violation.suggestedFix}`,
        location: { file: method.filePath, line: 0, column: 0 }
      });
    });

    // 必須検証項目の不足をチェック
    const requiredValidations = ['type-check', 'length-check', 'format-check', 'sanitization'];
    const missingValidations = this.checkValidationCoverage(method, requiredValidations);
    
    missingValidations.forEach(missing => {
      issues.push({
        id: `input-missing-${missing}-${method.name}`,
        severity: 'warning',
        type: 'insufficient-validation',
        message: `入力検証テストで${missing}が不足しています`,
        location: { file: method.filePath, line: 0, column: 0 }
      });
    });

    return issues;
  }

  private calculateInputValidationMetrics(method: TestMethod, taintResult: TaintAnalysisResult): SecurityTestMetrics {
    const content = method.content.toLowerCase();
    
    // 入力検証関連のメトリクスを計算
    const hasTypeValidation = content.includes('typeof') || content.includes('instanceof');
    const hasLengthValidation = content.includes('length') || content.includes('size');
    const hasSanitization = this.sanitizerPatterns.some(pattern => pattern.test(content));
    const hasBoundaryTest = content.includes('empty') || content.includes('null');

    const validationCoverage = [hasTypeValidation, hasLengthValidation, hasSanitization, hasBoundaryTest]
      .filter(Boolean).length / 4;

    return {
      securityCoverage: {
        authentication: 20, // デフォルト値
        inputValidation: validationCoverage * 100,
        apiSecurity: 30, // デフォルト値
        overall: validationCoverage * 100 * 0.7 + 15 // 入力検証重視
      },
      taintFlowDetection: taintResult.violations.length === 0 ? 1.0 : 0.4,
      sanitizerCoverage: hasSanitization ? 0.8 : 0.2,
      invariantCompliance: taintResult.violations.length === 0 ? 1.0 : 0.5
    };
  }

  private generateInputValidationSuggestions(issues: SecurityIssue[], method: TestMethod): SecurityImprovement[] {
    const suggestions: SecurityImprovement[] = [];

    issues.forEach(issue => {
      if (issue.type === 'insufficient-validation') {
        suggestions.push({
          id: `fix-${issue.id}`,
          priority: 'high',
          type: 'add-validation',
          title: '入力検証テストケースの追加',
          description: issue.message,
          location: issue.location,
          estimatedImpact: { securityImprovement: 20, implementationMinutes: 10 },
          automatable: false
        });
      } else if (issue.type === 'unsafe-taint-flow') {
        suggestions.push({
          id: `fix-${issue.id}`,
          priority: 'critical',
          type: 'add-sanitizer',
          title: 'サニタイザーの追加',
          description: issue.message,
          location: issue.location,
          estimatedImpact: { securityImprovement: 30, implementationMinutes: 15 },
          automatable: true
        });
      }
    });

    return suggestions;
  }

  private checkValidationCoverage(method: TestMethod, required: string[]): string[] {
    const content = method.content.toLowerCase();
    const missing: string[] = [];

    required.forEach(validation => {
      let covered = false;
      
      switch (validation) {
        case 'type-check':
          covered = content.includes('typeof') || content.includes('instanceof');
          break;
        case 'length-check':
          covered = content.includes('length') || content.includes('size');
          break;
        case 'format-check':
          covered = content.includes('format') || content.includes('pattern') || content.includes('regex');
          break;
        case 'sanitization':
          covered = this.sanitizerPatterns.some(pattern => pattern.test(content));
          break;
      }
      
      if (!covered) {
        missing.push(validation);
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

  /**
   * テストメソッド解析（セキュリティプラグイン用）
   */
  async analyzeTestMethod(testMethod: TestMethod): Promise<any> {
    try {
      const taintFlow = await this.flowAnalyzer.trackSecurityDataFlow(testMethod);
      const issues = this.detectSecurityIssues(testMethod.content);
      
      return {
        taintFlow,
        issues,
        securityMetrics: {
          inputValidationCoverage: this.calculateInputValidationCoverage(testMethod.content),
          sanitizationCoverage: this.calculateSanitizationCoverage(testMethod.content)
        }
      };
    } catch (error) {
      return {
        taintFlow: null,
        issues: [{
          id: 'analysis-error',
          severity: 'error' as const,
          type: 'missing-sanitizer' as const,
          message: `解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
          location: { file: testMethod.filePath, line: 0, column: 0 }
        }]
      };
    }
  }

  /**
   * 増分解析（セキュリティプラグイン用）
   */
  async analyzeIncrementally(changes: any[]): Promise<any> {
    const affectedTests: string[] = [];
    
    for (const change of changes) {
      if (change.methodName && change.filePath) {
        affectedTests.push(change.methodName);
      }
    }
    
    return {
      affectedTests,
      changesProcessed: changes.length,
      securityImpact: this.assessSecurityImpact(changes)
    };
  }

  private detectSecurityIssues(content: string): any[] {
    const issues: any[] = [];
    
    // 基本的なセキュリティ問題の検出
    if (content.includes('req.body') && !content.includes('validate')) {
      issues.push({
        id: 'missing-validation',
        severity: 'medium' as const,
        type: 'missing-sanitizer' as const,
        message: '入力検証が不足している可能性があります',
        location: { file: '', line: 0, column: 0 }
      });
    }
    
    return issues;
  }

  private calculateInputValidationCoverage(content: string): number {
    const hasValidation = content.includes('validate') || content.includes('check');
    return hasValidation ? 0.8 : 0.3;
  }

  private calculateSanitizationCoverage(content: string): number {
    const hasSanitization = this.sanitizerPatterns.some(pattern => pattern.test(content));
    return hasSanitization ? 0.9 : 0.2;
  }

  private assessSecurityImpact(changes: any[]): string {
    const hasSecurityChanges = changes.some(change => 
      change.type === 'security' || 
      (change.methodName && change.methodName.toLowerCase().includes('security'))
    );
    
    return hasSecurityChanges ? 'high' : 'medium';
  }
}