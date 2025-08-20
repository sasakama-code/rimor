/**
 * Test Intent Extractor
 * v0.9.0 - テスト記述から意図を抽出
 * TDD: Green Phase - テストを通す最小限の実装
 */

import { 
  ITestIntentAnalyzer,
  TestIntent,
  TestType,
  CoverageScope,
  ActualTestAnalysis,
  TestRealizationResult,
  TestGap,
  IntentRiskLevel,
  TestAssertion,
  GapType,
  Severity
} from './ITestIntentAnalyzer';
import { TestCase } from '../security/types/security';
import { DomainInference } from './IDomainInferenceEngine';
import { BusinessLogicMapping } from './IBusinessLogicMapper';


// Type definitions for analysis results
interface TestScenario {
  description?: string;
  context?: string;
  testCases?: string[];
  given?: string;
  when?: string;
  then?: string;
}

interface DomainGap {
  type: string;
  domain: string;
  description: string;
  recommendation?: string;
  severity: Severity;
}

interface BusinessMapping {
  domain: string;
  functions: string[];
  coveredFunctions: string[];
  uncoveredFunctions: string[];
  coverage: number;
}

interface Suggestion {
  type: string;
  description: string;
  priority: string;
  impact: string;
  example?: string;
}
import { CoreTypes, TypeGuards, TypeUtils } from '../core/types/core-definitions';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import { TreeSitterParser } from './TreeSitterParser';
import { IntentPatternMatcher } from './IntentPatternMatcher';
import { DomainInferenceEngine } from './DomainInferenceEngine';
import { BusinessLogicMapper } from './BusinessLogicMapper';
import { TypeInfo, CallGraphNode } from './ITypeScriptAnalyzer';
import { 
  ImplementationTruth, 
  MethodBehavior, 
  DataFlow, 
  SideEffect 
} from '../types/implementation-truth';
import { 
  IntentRealizationGap, 
  IntentRealizationResult, 
  IntentGapType,
  UntestedBehavior,
  TestAssumption,
  QualitativeCoverage,
  GapRecommendation,
  SecurityImpact
} from '../types/intent-realization';

/**
 * テスト意図抽出エンジン
 * v0.9.0 Phase 2 - 高度な意図推論機能を追加
 */
export class TestIntentExtractor implements ITestIntentAnalyzer {
  private patternMatcher: IntentPatternMatcher;
  private parser: TreeSitterParser;
  private domainEngine?: DomainInferenceEngine;
  private businessMapper?: BusinessLogicMapper;
  
  constructor(parser?: TreeSitterParser) {
    this.parser = parser || TreeSitterParser.getInstance();
    this.patternMatcher = new IntentPatternMatcher();
  }

  /**
   * 実装の真実とテスト意図の総合分析
   * v0.9.0 新機能 - プロダクションコードとテストコードの統合分析
   */
  async analyzeIntentRealization(
    testFilePath: string,
    ast: ASTNode,
    implementationTruth: ImplementationTruth
  ): Promise<IntentRealizationResult> {
    const startTime = Date.now();
    
    // 1. テスト意図の抽出
    const testIntent = await this.extractIntent(testFilePath, ast);
    
    // 2. 実装と意図の照合分析
    const gaps = await this.detectRealizationGaps(testIntent, implementationTruth);
    
    // 3. 実現度スコアの計算
    const realizationScore = this.calculateRealizationScore(testIntent, implementationTruth, gaps);
    
    // 4. 質的カバレッジの評価
    const qualityMetrics = this.calculateQualityMetrics(testIntent, implementationTruth, gaps);
    
    // 5. 改善提案の生成
    const recommendations = await this.generateRecommendations(gaps, implementationTruth);
    
    // 6. セキュリティ評価
    const securityAssessment = this.assessSecurity(testIntent, implementationTruth, gaps);
    
    // 7. 総合評価
    const overallAssessment = this.generateOverallAssessment(
      realizationScore,
      qualityMetrics,
      securityAssessment,
      recommendations
    );

    return {
      filePath: testFilePath,
      timestamp: new Date().toISOString(),
      testIntent,
      implementationTruth,
      gaps,
      realizationScore,
      qualityMetrics,
      recommendations,
      securityAssessment,
      overallAssessment
    };
  }

  /**
   * 実装と意図のギャップ検出
   * SOLID原則: 単一責任の原則に従いギャップ検出のみに特化
   */
  private async detectRealizationGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth
  ): Promise<IntentRealizationGap[]> {
    const gaps: IntentRealizationGap[] = [];
    let gapIdCounter = 1;

    // 1. ターゲットメソッドの検証
    await this.detectTargetMethodGaps(testIntent, implementationTruth, gaps, gapIdCounter);
    
    // 2. 期待される振る舞いの検証
    await this.detectBehaviorGaps(testIntent, implementationTruth, gaps, gapIdCounter);
    
    // 3. セキュリティ要件の検証
    await this.detectSecurityGaps(testIntent, implementationTruth, gaps, gapIdCounter);
    
    // 4. 副作用の検証
    await this.detectSideEffectGaps(testIntent, implementationTruth, gaps, gapIdCounter);
    
    // 5. エラーハンドリングの検証
    await this.detectErrorHandlingGaps(testIntent, implementationTruth, gaps, gapIdCounter);

    return gaps;
  }

  /**
   * ターゲットメソッドのギャップ検出
   */
  private async detectTargetMethodGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[],
    gapIdCounter: number
  ): Promise<void> {
    if (!testIntent.targetMethod) {
      return;
    }

    const targetMethod = implementationTruth.actualBehaviors.methods.find(
      method => method.name === testIntent.targetMethod
    );

    if (!targetMethod) {
      gaps.push({
        gapId: `gap-${gapIdCounter++}`,
        type: IntentGapType.WRONG_TARGET,
        severity: Severity.HIGH,
        description: `テスト対象メソッド '${testIntent.targetMethod}' が実装に存在しません`,
        affectedIntent: testIntent,
        affectedImplementation: [],
        untestedBehaviors: [],
        incorrectAssumptions: [{
          assumption: `メソッド '${testIntent.targetMethod}' が存在する`,
          actualBehavior: '指定されたメソッドが実装に見つからない',
          severity: Severity.HIGH,
          affectedTestCases: [testIntent.description],
          correctionSuggestion: 'テスト対象メソッド名を確認し、実装と一致させるか、実装にメソッドを追加してください',
          correctionPriority: 'critical'
        }],
        qualitativeCoverage: this.createDefaultQualitativeCoverage(),
        aiPriorityScore: 0.9,
        recommendations: [],
        securityImpact: this.createDefaultSecurityImpact()
      });
    }
  }

  /**
   * 期待される振る舞いのギャップ検出
   */
  private async detectBehaviorGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[],
    gapIdCounter: number
  ): Promise<void> {
    const expectedBehaviors = testIntent.expectedBehavior || [];
    const implementedMethods = implementationTruth.actualBehaviors.methods;

    for (const expectedBehavior of expectedBehaviors) {
      const isImplemented = this.checkBehaviorImplementation(expectedBehavior, implementedMethods);
      
      if (!isImplemented) {
        gaps.push({
          gapId: `gap-${gapIdCounter++}`,
          type: IntentGapType.MISSING_BEHAVIOR_TEST,
          severity: Severity.MEDIUM,
          description: `期待される振る舞い '${expectedBehavior}' のテストが不完全です`,
          affectedIntent: testIntent,
          affectedImplementation: implementedMethods,
          untestedBehaviors: [{
            method: implementedMethods[0] || this.createDummyMethodBehavior(),
            reason: 'INCOMPLETE_TEST' as any,
            riskLevel: 'medium',
            recommendedTestMethod: `${expectedBehavior}のテストケースを追加`,
            conditionsToTest: [expectedBehavior],
            securityConsiderations: []
          }],
          incorrectAssumptions: [],
          qualitativeCoverage: this.createDefaultQualitativeCoverage(),
          aiPriorityScore: 0.6,
          recommendations: [],
          securityImpact: this.createDefaultSecurityImpact()
        });
      }
    }
  }

  /**
   * セキュリティギャップの検出
   */
  private async detectSecurityGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[],
    gapIdCounter: number
  ): Promise<void> {
    const vulnerabilities = implementationTruth.vulnerabilities;
    
    if (vulnerabilities.length > 0) {
      const hasSecurityTests = testIntent.testType === TestType.SECURITY ||
                              testIntent.description.toLowerCase().includes('security') ||
                              testIntent.description.toLowerCase().includes('セキュリティ');

      if (!hasSecurityTests) {
        gaps.push({
          gapId: `gap-${gapIdCounter++}`,
          type: IntentGapType.MISSING_SECURITY_TEST,
          severity: Severity.HIGH,
          description: `${vulnerabilities.length}件の脆弱性が検出されましたが、セキュリティテストがありません`,
          affectedIntent: testIntent,
          affectedImplementation: implementationTruth.actualBehaviors.methods,
          untestedBehaviors: [],
          incorrectAssumptions: [{
            assumption: 'セキュリティテストは不要',
            actualBehavior: `${vulnerabilities.map(v => v.type).join(', ')}の脆弱性が存在`,
            severity: Severity.HIGH,
            affectedTestCases: [testIntent.description],
            correctionSuggestion: 'セキュリティテストケースを追加してください',
            correctionPriority: 'high'
          }],
          qualitativeCoverage: this.createDefaultQualitativeCoverage(),
          aiPriorityScore: 0.8,
          recommendations: [],
          securityImpact: {
            riskLevel: 'high',
            affectedSecurityDomains: ['INPUT_VALIDATION' as any, 'AUTHENTICATION' as any],
            potentialVulnerabilities: vulnerabilities,
            attackVectors: vulnerabilities.map(v => ({
              attackType: v.type,
              description: v.message,
              exploitability: 'medium' as any,
              impactScope: 'local' as any,
              cweId: undefined
            })),
            impactDescription: 'セキュリティテストの欠如により脆弱性が見過ごされる可能性',
            mitigationStrategies: []
          }
        });
      }
    }
  }

  /**
   * 副作用のギャップ検出
   */
  private async detectSideEffectGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[],
    gapIdCounter: number
  ): Promise<void> {
    const methodsWithSideEffects = implementationTruth.actualBehaviors.methods.filter(
      method => method.sideEffects && method.sideEffects.length > 0
    );

    if (methodsWithSideEffects.length > 0) {
      const testsSideEffects = testIntent.description.toLowerCase().includes('side') ||
                              testIntent.description.toLowerCase().includes('effect') ||
                              testIntent.description.toLowerCase().includes('副作用');

      if (!testsSideEffects) {
        gaps.push({
          gapId: `gap-${gapIdCounter++}`,
          type: IntentGapType.MISSING_SIDE_EFFECT_TEST,
          severity: Severity.MEDIUM,
          description: '副作用を持つメソッドがありますが、副作用のテストがありません',
          affectedIntent: testIntent,
          affectedImplementation: methodsWithSideEffects,
          untestedBehaviors: methodsWithSideEffects.map(method => ({
            method,
            reason: 'SIDE_EFFECT_NOT_TESTED' as any,
            riskLevel: 'medium',
            recommendedTestMethod: '副作用の検証テストを追加',
            conditionsToTest: method.sideEffects?.map(se => se.description) || [],
            securityConsiderations: method.sideEffects?.flatMap(se => se.securityImplications.map(si => si.message)) || []
          })),
          incorrectAssumptions: [],
          qualitativeCoverage: this.createDefaultQualitativeCoverage(),
          aiPriorityScore: 0.5,
          recommendations: [],
          securityImpact: this.createDefaultSecurityImpact()
        });
      }
    }
  }

  /**
   * エラーハンドリングのギャップ検出
   */
  private async detectErrorHandlingGaps(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[],
    gapIdCounter: number
  ): Promise<void> {
    const methodsWithExceptions = implementationTruth.actualBehaviors.methods.filter(
      method => method.exceptionHandling && method.exceptionHandling.length > 0
    );

    if (methodsWithExceptions.length > 0) {
      const testsErrorCases = testIntent.description.toLowerCase().includes('error') ||
                             testIntent.description.toLowerCase().includes('exception') ||
                             testIntent.description.toLowerCase().includes('エラー') ||
                             testIntent.description.toLowerCase().includes('例外');

      if (!testsErrorCases) {
        gaps.push({
          gapId: `gap-${gapIdCounter++}`,
          type: IntentGapType.MISSING_ERROR_CASE,
          severity: Severity.MEDIUM,
          description: 'エラーハンドリングが実装されていますが、エラーケースのテストがありません',
          affectedIntent: testIntent,
          affectedImplementation: methodsWithExceptions,
          untestedBehaviors: [],
          incorrectAssumptions: [{
            assumption: 'エラーケースのテストは不要',
            actualBehavior: 'エラーハンドリングが実装されている',
            severity: Severity.MEDIUM,
            affectedTestCases: [testIntent.description],
            correctionSuggestion: 'エラーケースのテストを追加してください',
            correctionPriority: 'medium'
          }],
          qualitativeCoverage: this.createDefaultQualitativeCoverage(),
          aiPriorityScore: 0.4,
          recommendations: [],
          securityImpact: this.createDefaultSecurityImpact()
        });
      }
    }
  }

  /**
   * 実現度スコアの計算
   * 100点満点でテスト意図の実現度を評価
   */
  private calculateRealizationScore(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[]
  ): number {
    let baseScore = 100;
    
    // ギャップによる減点
    gaps.forEach(gap => {
      switch (gap.severity) {
        case Severity.CRITICAL:
          baseScore -= 40;
          break;
        case Severity.HIGH:
          baseScore -= 25;
          break;
        case Severity.MEDIUM:
          baseScore -= 15;
          break;
        case Severity.LOW:
          baseScore -= 5;
          break;
      }
    });

    // AIスコアによる補正
    const avgAiScore = gaps.length > 0 
      ? gaps.reduce((sum, gap) => sum + gap.aiPriorityScore, 0) / gaps.length 
      : 1;
    baseScore = baseScore * (1 - avgAiScore * 0.1);

    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * 質的メトリクスの計算
   */
  private calculateQualityMetrics(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[]
  ): any {
    const totalMethods = implementationTruth.actualBehaviors.methods.length;
    const testedMethods = totalMethods - gaps.filter(g => g.type === IntentGapType.WRONG_TARGET).length;
    
    return {
      testCoverage: totalMethods > 0 ? (testedMethods / totalMethods) * 100 : 0,
      qualitativeCoverage: this.calculateOverallQualitativeCoverage(gaps),
      securityCoverage: this.calculateSecurityCoverage(implementationTruth, gaps),
      maintainabilityScore: 85, // 固定値（実際の実装では詳細な計算を行う）
      executionTime: 0, // 実行時間は別途計測
      complexityScore: implementationTruth.structure.complexity.cyclomaticComplexity,
      duplicationScore: implementationTruth.structure.complexity.duplicationRate
    };
  }

  /**
   * 改善提案の生成
   */
  private async generateRecommendations(
    gaps: IntentRealizationGap[],
    implementationTruth: ImplementationTruth
  ): Promise<GapRecommendation[]> {
    const recommendations: GapRecommendation[] = [];
    let recommendationId = 1;

    for (const gap of gaps) {
      const recommendation = this.createRecommendationForGap(gap, recommendationId++);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - 
             priorityOrder[b.priority as keyof typeof priorityOrder];
    });
  }

  /**
   * セキュリティ評価
   */
  private assessSecurity(
    testIntent: TestIntent,
    implementationTruth: ImplementationTruth,
    gaps: IntentRealizationGap[]
  ): any {
    const securityGaps = gaps.filter(g => g.type === IntentGapType.MISSING_SECURITY_TEST);
    const vulnerabilityCount = implementationTruth.vulnerabilities.length;
    
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (vulnerabilityCount > 5) overallRisk = 'critical';
    else if (vulnerabilityCount > 2) overallRisk = 'high';
    else if (vulnerabilityCount > 0) overallRisk = 'medium';

    return {
      overallSecurityRisk: overallRisk,
      securityTestCoverage: securityGaps.length === 0 ? 100 : 0,
      untestedSecurityRequirements: securityGaps.map(g => g.description),
      securityTestRecommendations: securityGaps.flatMap(g => g.recommendations),
      owaspTop10Coverage: this.generateOwaspCoverage(implementationTruth)
    };
  }

  /**
   * 総合評価の生成
   */
  private generateOverallAssessment(
    realizationScore: number,
    qualityMetrics: any,
    securityAssessment: any,
    recommendations: GapRecommendation[]
  ): any {
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (realizationScore >= 90) grade = 'A';
    else if (realizationScore >= 80) grade = 'B';
    else if (realizationScore >= 70) grade = 'C';
    else if (realizationScore >= 60) grade = 'D';
    else grade = 'F';

    const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
    const highRecommendations = recommendations.filter(r => r.priority === 'high');

    return {
      overallScore: realizationScore,
      grade,
      strengths: this.identifyStrengths(realizationScore, qualityMetrics, securityAssessment),
      weaknesses: this.identifyWeaknesses(recommendations),
      priorityImprovements: criticalRecommendations.map(r => r.description),
      nextSteps: highRecommendations.slice(0, 3).map(r => r.description),
      longTermImprovementPlan: recommendations.slice(0, 5).map(r => r.description)
    };
  }

  // ヘルパーメソッド群

  private createDefaultQualitativeCoverage(): QualitativeCoverage {
    return {
      criticalPathsCovered: 0,
      edgeCasesCovered: 0,
      securityChecksCovered: 0,
      errorHandlingCovered: 0,
      sideEffectsCovered: 0,
      dataFlowCovered: 0,
      dependencyCovered: 0,
      performanceRequirementsCovered: 0,
      overallQualityCoverage: 0
    };
  }

  private createDefaultSecurityImpact(): SecurityImpact {
    return {
      riskLevel: 'low',
      affectedSecurityDomains: [],
      potentialVulnerabilities: [],
      attackVectors: [],
      impactDescription: '特定のセキュリティ影響は検出されませんでした',
      mitigationStrategies: []
    };
  }

  private createDummyMethodBehavior(): MethodBehavior {
    return {
      name: 'unknown',
      parameters: [],
      returnType: { name: 'unknown', isArray: false, isNullable: false },
      callsToMethods: [],
      dataFlow: {
        inputPaths: [],
        outputPaths: [],
        transformations: [],
        taintPropagation: []
      },
      sideEffects: [],
      exceptionHandling: [],
      securityProfile: {
        requiresAuthentication: false,
        requiresAuthorization: false,
        hasInputValidation: false,
        hasOutputSanitization: false,
        vulnerabilities: [],
        accessesSensitiveData: false,
        hasSecurityLogging: false
      }
    };
  }

  private checkBehaviorImplementation(expectedBehavior: string, methods: MethodBehavior[]): boolean {
    // 簡易実装: 期待される振る舞いがメソッド名やコメントに含まれているかチェック
    const behaviorKeywords = expectedBehavior.toLowerCase().split(/\s+/);
    
    return methods.some(method => {
      const methodNameLower = method.name.toLowerCase();
      return behaviorKeywords.some(keyword => methodNameLower.includes(keyword));
    });
  }

  private calculateOverallQualitativeCoverage(gaps: IntentRealizationGap[]): number {
    const totalAspects = 8; // criticalPaths, edgeCases, security, errorHandling, sideEffects, dataFlow, dependency, performance
    const uncoveredAspects = new Set<string>();
    
    gaps.forEach(gap => {
      switch (gap.type) {
        case IntentGapType.MISSING_SECURITY_TEST:
          uncoveredAspects.add('security');
          break;
        case IntentGapType.MISSING_ERROR_CASE:
          uncoveredAspects.add('errorHandling');
          break;
        case IntentGapType.MISSING_SIDE_EFFECT_TEST:
          uncoveredAspects.add('sideEffects');
          break;
        case IntentGapType.MISSING_DATA_FLOW_TEST:
          uncoveredAspects.add('dataFlow');
          break;
        case IntentGapType.MISSING_DEPENDENCY_TEST:
          uncoveredAspects.add('dependency');
          break;
        case IntentGapType.MISSING_PERFORMANCE_TEST:
          uncoveredAspects.add('performance');
          break;
      }
    });

    const coveredAspects = totalAspects - uncoveredAspects.size;
    return (coveredAspects / totalAspects) * 100;
  }

  private calculateSecurityCoverage(implementationTruth: ImplementationTruth, gaps: IntentRealizationGap[]): number {
    const vulnerabilityCount = implementationTruth.vulnerabilities.length;
    const securityGapCount = gaps.filter(g => g.type === IntentGapType.MISSING_SECURITY_TEST).length;
    
    if (vulnerabilityCount === 0) return 100; // 脆弱性がない場合は100%
    
    const coveredVulnerabilities = Math.max(0, vulnerabilityCount - securityGapCount);
    return (coveredVulnerabilities / vulnerabilityCount) * 100;
  }

  private createRecommendationForGap(gap: IntentRealizationGap, id: number): GapRecommendation | null {
    const baseRecommendation = {
      recommendationId: `rec-${id}`,
      type: this.mapGapTypeToRecommendationType(gap.type),
      description: this.generateRecommendationDescription(gap),
      implementationDetails: this.generateImplementationDetails(gap),
      priority: this.mapSeverityToPriority(gap.severity),
      difficulty: 'medium' as const,
      expectedImpact: {
        testQualityImprovement: 0.2,
        securityImprovement: gap.type === IntentGapType.MISSING_SECURITY_TEST ? 0.4 : 0.1,
        coverageImprovement: 0.15,
        maintainabilityImprovement: 0.1,
        estimatedImplementationTime: 2,
        longTermValue: 0.3
      },
      relatedFiles: [gap.affectedIntent.description],
      codeExample: this.generateCodeExample(gap),
      references: ['https://rimor.dev/best-practices', 'https://owasp.org/testing-guide']
    };

    return baseRecommendation;
  }

  private mapGapTypeToRecommendationType(gapType: IntentGapType): any {
    switch (gapType) {
      case IntentGapType.MISSING_SECURITY_TEST:
        return 'ADD_SECURITY_TEST';
      case IntentGapType.MISSING_ERROR_CASE:
        return 'ADD_ERROR_CASE_TEST';
      case IntentGapType.MISSING_SIDE_EFFECT_TEST:
        return 'ADD_TEST_CASE';
      case IntentGapType.WRONG_TARGET:
        return 'IMPROVE_TEST';
      default:
        return 'ADD_TEST_CASE';
    }
  }

  private generateRecommendationDescription(gap: IntentRealizationGap): string {
    switch (gap.type) {
      case IntentGapType.MISSING_SECURITY_TEST:
        return 'セキュリティテストケースを追加して脆弱性を検証する';
      case IntentGapType.MISSING_ERROR_CASE:
        return 'エラーケースのテストを追加して例外処理を検証する';
      case IntentGapType.MISSING_SIDE_EFFECT_TEST:
        return '副作用の検証テストを追加してメソッドの完全性を確保する';
      case IntentGapType.WRONG_TARGET:
        return 'テスト対象メソッドを修正して実装との整合性を確保する';
      default:
        return 'テストケースを追加して機能の検証を強化する';
    }
  }

  private generateImplementationDetails(gap: IntentRealizationGap): string {
    return `1. ${gap.description}を解決するためのテストケースを作成\n2. 適切なアサーションを追加\n3. テストデータの準備\n4. 実行と検証`;
  }

  private mapSeverityToPriority(severity: Severity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case Severity.CRITICAL: return 'critical';
      case Severity.HIGH: return 'high';
      case Severity.MEDIUM: return 'medium';
      case Severity.LOW: return 'low';
      default: return 'medium';
    }
  }

  private generateCodeExample(gap: IntentRealizationGap): string {
    switch (gap.type) {
      case IntentGapType.MISSING_SECURITY_TEST:
        return `it('should reject malicious input', () => {\n  const maliciousInput = '<script>alert("xss")</script>';\n  expect(() => processInput(maliciousInput)).toThrow();\n});`;
      case IntentGapType.MISSING_ERROR_CASE:
        return `it('should handle errors gracefully', () => {\n  expect(() => riskyOperation()).toThrowError('Expected error');\n});`;
      default:
        return `it('should verify expected behavior', () => {\n  // テストケースの実装\n});`;
    }
  }

  private generateOwaspCoverage(implementationTruth: ImplementationTruth): any[] {
    return [
      {
        owaspCategory: 'A01:2021 – Broken Access Control',
        coverageRate: 0,
        testStatus: 'not_tested',
        recommendations: ['認可テストを追加']
      },
      {
        owaspCategory: 'A03:2021 – Injection',
        coverageRate: implementationTruth.vulnerabilities.some(v => v.type.includes('injection')) ? 0 : 100,
        testStatus: 'partially_tested',
        recommendations: ['SQLインジェクション対策のテストを追加']
      }
    ];
  }

  private identifyStrengths(realizationScore: number, qualityMetrics: any, securityAssessment: any): string[] {
    const strengths: string[] = [];
    
    if (realizationScore >= 80) {
      strengths.push('高い意図実現度スコア');
    }
    if (qualityMetrics.testCoverage >= 80) {
      strengths.push('十分なテストカバレッジ');
    }
    if (securityAssessment.overallSecurityRisk === 'low') {
      strengths.push('低いセキュリティリスク');
    }
    if (strengths.length === 0) {
      strengths.push('基本的なテスト構造が整備されている');
    }
    
    return strengths;
  }

  private identifyWeaknesses(recommendations: GapRecommendation[]): string[] {
    const weaknesses: string[] = [];
    const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
    const highCount = recommendations.filter(r => r.priority === 'high').length;
    
    if (criticalCount > 0) {
      weaknesses.push(`${criticalCount}件の重大な問題`);
    }
    if (highCount > 0) {
      weaknesses.push(`${highCount}件の高優先度問題`);
    }
    if (weaknesses.length === 0) {
      weaknesses.push('軽微な改善点のみ');
    }
    
    return weaknesses;
  }

  /**
   * テストファイルから意図を抽出（ITestIntentAnalyzer実装）
   */
  async extractIntent(testFilePath: string, ast: ASTNode): Promise<TestIntent> {
    // 新しい統合分析機能があるが、後方互換性のため既存のAPIも提供
    const testFunctions = this.parser.findTestFunctions(ast);
    
    if (testFunctions.length === 0) {
      return this.createDefaultIntent();
    }

    const firstTest = testFunctions[0];
    const description = this.extractTestDescription(firstTest);
    const targetMethod = this.extractTargetMethod(firstTest);

    return {
      description: description || '不明なテスト',
      targetMethod,
      testType: this.detectTestType(firstTest),
      expectedBehavior: this.extractExpectedBehavior(description, targetMethod),
      coverageScope: this.createDefaultCoverageScope(),
      scenario: this.extractScenario(ast, firstTest)
    };
  }

  /**
   * 実際のテスト分析（ITestIntentAnalyzer実装）
   */
  async analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis> {
    // 既存のAPIとの互換性のため、簡易実装を提供
    return {
      actualTargetMethods: [testFilePath],
      assertions: [],
      actualCoverage: {
        happyPath: false,
        errorCases: false,
        edgeCases: false,
        boundaryValues: false
      },
      complexity: 1
    };
  }

  /**
   * 実現度評価（ITestIntentAnalyzer実装）
   */
  async evaluateRealization(intent: TestIntent, actual: ActualTestAnalysis): Promise<TestRealizationResult> {
    // 既存のAPIとの互換性のため、簡易実装を提供
    const gaps = await this.compareIntentAndRealization(intent, actual);
    const realizationScore = this.calculateRealizationScore2(intent, actual, gaps);
    const riskLevel = this.assessRisk(gaps);

    return {
      intent,
      actual,
      gaps,
      realizationScore,
      riskLevel
    };
  }

  /**
   * リスク評価（ITestIntentAnalyzer実装）
   */
  assessRisk(gaps: TestGap[]): IntentRiskLevel {
    if (gaps.length === 0) return IntentRiskLevel.MINIMAL;
    
    const severities = gaps.map(gap => gap.severity);
    
    if (severities.includes(Severity.CRITICAL)) {
      return IntentRiskLevel.CRITICAL;
    }
    if (severities.includes(Severity.HIGH)) {
      return IntentRiskLevel.HIGH;
    }
    if (severities.includes(Severity.MEDIUM)) {
      return IntentRiskLevel.MEDIUM;
    }
    
    return IntentRiskLevel.LOW;
  }

  // 既存メソッドのヘルパーメソッド群

  private extractTestDescription(testNode: ASTNode): string {
    const match = testNode.text.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : '';
  }

  private extractTargetMethod(testNode: ASTNode): string | undefined {
    const testText = testNode.text;
    const expectIndex = testText.indexOf('expect');
    if (expectIndex > 0) {
      const beforeExpected = testText.substring(0, expectIndex);
      const funcMatch = beforeExpected.match(/(\w+)\s*\(/g);
      if (funcMatch) {
        const lastMatch = funcMatch[funcMatch.length - 1];
        const funcName = lastMatch.match(/(\w+)\s*\(/);
        if (funcName && funcName[1] !== 'const' && funcName[1] !== 'let' && funcName[1] !== 'var') {
          return funcName[1];
        }
      }
    }
    return undefined;
  }

  private detectTestType(testNode: ASTNode): TestType {
    const testText = testNode.text.toLowerCase();
    if (!testText.trim() || testText.match(/it\s*\(\s*['"`]['"`]/)) {
      return TestType.UNKNOWN;
    }
    if (testText.includes('integration')) return TestType.INTEGRATION;
    if (testText.includes('e2e')) return TestType.E2E;
    if (testText.includes('performance')) return TestType.PERFORMANCE;
    if (testText.includes('security')) return TestType.SECURITY;
    return TestType.UNIT;
  }

  private extractExpectedBehavior(description: string, targetMethod?: string): string[] {
    if (!description) return [];
    return [description];
  }

  private createDefaultCoverageScope(): CoverageScope {
    return {
      happyPath: false,
      errorCases: false,
      edgeCases: false,
      boundaryValues: false
    };
  }

  private extractScenario(ast: ASTNode, testNode: ASTNode): any {
    return {
      description: this.extractTestDescription(testNode),
      context: 'テストコンテキスト',
      testCases: [this.extractTestDescription(testNode)]
    };
  }

  private createDefaultIntent(): TestIntent {
    return {
      description: 'デフォルトテスト',
      targetMethod: undefined,
      testType: TestType.UNKNOWN,
      expectedBehavior: [],
      coverageScope: this.createDefaultCoverageScope(),
      scenario: {}
    };
  }

  private async compareIntentAndRealization(intent: TestIntent, actual: ActualTestAnalysis): Promise<TestGap[]> {
    const gaps: TestGap[] = [];
    
    if (intent.targetMethod && !actual.actualTargetMethods.includes(intent.targetMethod)) {
      gaps.push({
        type: GapType.WRONG_TARGET,
        description: `期待されるメソッド '${intent.targetMethod}' がテストされていません`,
        severity: Severity.HIGH,
        suggestions: [`テストに ${intent.targetMethod} の呼び出しを追加してください`]
      });
    }

    return gaps;
  }

  private calculateRealizationScore2(intent: TestIntent, actual: ActualTestAnalysis, gaps: TestGap[]): number {
    let score = 100;
    gaps.forEach(gap => {
      switch (gap.severity) {
        case Severity.CRITICAL: score -= 30; break;
        case Severity.HIGH: score -= 20; break;
        case Severity.MEDIUM: score -= 10; break;
        case Severity.LOW: score -= 5; break;
      }
    });
    return Math.max(0, score);
  }
}

