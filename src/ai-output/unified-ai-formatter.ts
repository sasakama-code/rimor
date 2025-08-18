/**
 * Unified AI formatter implementation with strategy pattern
 */

import {
  AnalysisResult,
  ProjectContext,
  Issue
} from '../core/types';

import {
  UnifiedAIFormatterBase,
  UnifiedAIFormatterOptions,
  UnifiedAIOutput,
  RiskAssessment
} from './unified-ai-formatter-base';

import { UnifiedAnalysisResult, AIJsonOutput, UnifiedAIFormatterOptions as TypesFormatterOptions } from './types';
import { AIActionableRisk } from '../nist/types/unified-analysis-result';

// Type guard for UnifiedAnalysisResult
function isUnifiedAnalysisResult(result: unknown): result is UnifiedAnalysisResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'summary' in result &&
    'aiKeyRisks' in result
  );
}

// Type guard for AnalysisResult  
function isAnalysisResult(result: unknown): result is AnalysisResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'issues' in result &&
    'filePath' in result
  );
}

// Strategy interface
interface FormatterStrategy {
  name: string;
  format(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): UnifiedAIOutput | AIJsonOutput;
  formatAsync?(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): Promise<UnifiedAIOutput | AIJsonOutput>;
}

export class UnifiedAIFormatter extends UnifiedAIFormatterBase {
  private strategies: Map<string, FormatterStrategy> = new Map();
  private currentStrategy: string = 'base';

  constructor(options: UnifiedAIFormatterOptions = {}) {
    super(options);
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {
    // Base strategy
    this.strategies.set('base', {
      name: 'base',
      format: (result: UnifiedAnalysisResult | AnalysisResult) => this.baseFormat(result)
    });

    // Optimized strategy
    this.strategies.set('optimized', {
      name: 'optimized',
      format: (result: UnifiedAnalysisResult | AnalysisResult) => this.optimizedFormat(result)
    });

    // Parallel strategy
    this.strategies.set('parallel', {
      name: 'parallel',
      format: (result: UnifiedAnalysisResult | AnalysisResult) => this.baseFormat(result),
      formatAsync: async (result: UnifiedAnalysisResult | AnalysisResult) => this.parallelFormatAsync(result)
    });
  }

  /**
   * Set the formatting strategy
   */
  setStrategy(strategyName: string): void {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }
    this.currentStrategy = strategyName;
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Register a custom strategy
   */
  registerStrategy(strategy: FormatterStrategy): void {
    if (!strategy.name || !strategy.format) {
      throw new Error('Strategy must have name and format method');
    }
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Base format implementation
   */
  private baseFormat(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): UnifiedAIOutput | AIJsonOutput {
    // Handle UnifiedAnalysisResult
    if (isUnifiedAnalysisResult(result)) {
      const risks = result.aiKeyRisks || [];
      const keyRisks: RiskAssessment[] = risks.map(risk => ({
        riskLevel: risk.riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        category: 'code',
        description: risk.problem || risk.title,
        impact: 'high',
        likelihood: 0.7
      }));
      
      return {
        keyRisks,
        summary: {
          totalIssues: risks.length,
          criticalIssues: risks.filter(r => r.riskLevel === 'CRITICAL').length,
          highIssues: risks.filter(r => r.riskLevel === 'HIGH').length,
          overallRisk: this.getOverallRisk(risks)
        }
      };
    }
    
    // Fallback to AnalysisResult format
    if (isAnalysisResult(result)) {
      return this.formatAnalysisResult(result, options as ProjectContext);
    }
    
    throw new Error('Unsupported result format');
  }

  /**
   * Optimized format implementation
   */
  private optimizedFormat(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): UnifiedAIOutput | AIJsonOutput {
    // Handle UnifiedAnalysisResult with optimization
    if (isUnifiedAnalysisResult(result)) {
      const maxRisks = options?.maxRisks || 10;
      const risks = result.aiKeyRisks || [];
      const limitedRisks = risks.slice(0, maxRisks);
      const keyRisks: RiskAssessment[] = limitedRisks.map(risk => ({
        riskLevel: risk.riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        category: 'code',
        description: risk.problem || risk.title,
        impact: 'high',
        likelihood: 0.7
      }));
      
      return {
        keyRisks,
        summary: {
          totalIssues: risks.length,
          criticalIssues: risks.filter(r => r.riskLevel === 'CRITICAL').length,
          highIssues: risks.filter(r => r.riskLevel === 'HIGH').length,
          overallRisk: this.getOverallRisk(limitedRisks)
        }
      };
    }
    
    if (isAnalysisResult(result)) {
      return this.formatAnalysisResult(result, options as ProjectContext);
    }
    
    throw new Error('Unsupported result format');
  }

  /**
   * Get overall risk level
   */
  private getOverallRisk(risks: any[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (risks.some(r => r.riskLevel === 'CRITICAL')) return 'CRITICAL';
    if (risks.some(r => r.riskLevel === 'HIGH')) return 'HIGH';
    if (risks.some(r => r.riskLevel === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Parallel format async implementation
   */
  private async parallelFormatAsync(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): Promise<UnifiedAIOutput | AIJsonOutput> {
    // Simulate parallel processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.baseFormat(result, options));
      }, 10);
    });
  }

  /**
   * Format with current strategy
   */
  format(result: AnalysisResult, context?: ProjectContext): UnifiedAIOutput {
    // Convert context to options for backward compatibility
    const options: UnifiedAIFormatterOptions | undefined = context ? {
      includeContext: true,
      reportPath: (context as any).reportPath || (context as any).rootPath
    } : undefined;
    
    const strategy = this.strategies.get(this.currentStrategy);
    if (!strategy) {
      throw new Error(`Strategy ${this.currentStrategy} not found`);
    }
    
    return strategy.format(result, options) as UnifiedAIOutput;
  }

  /**
   * Format asynchronously
   */
  async formatAsync(result: UnifiedAnalysisResult | AnalysisResult, options?: UnifiedAIFormatterOptions): Promise<UnifiedAIOutput | AIJsonOutput> {
    const strategy = this.strategies.get(this.currentStrategy);
    if (!strategy) {
      throw new Error(`Strategy ${this.currentStrategy} not found`);
    }

    if (strategy.formatAsync) {
      return await strategy.formatAsync(result, options);
    }

    // Fallback to sync format wrapped in promise
    if (isAnalysisResult(result)) {
      return Promise.resolve(this.format(result, options as ProjectContext));
    }
    return Promise.resolve(strategy.format(result, options));
  }

  /**
   * Format multiple results in batch
   */
  async formatBatch(results: (UnifiedAnalysisResult | AnalysisResult)[]): Promise<(UnifiedAIOutput | AIJsonOutput)[]> {
    if (this.currentStrategy === 'parallel') {
      // Process in parallel
      return Promise.all(results.map(r => this.formatAsync(r)));
    }
    
    // Process sequentially
    const formatted = [];
    for (const result of results) {
      formatted.push(await this.formatAsync(result));
    }
    return formatted;
  }

  /**
   * Format UnifiedAnalysisResult as AI-optimized JSON
   */
  formatAsAIJson(unifiedResult: UnifiedAnalysisResult, options: Partial<TypesFormatterOptions> = {}): AIJsonOutput {
    // Validate input
    if (!unifiedResult) {
      throw new Error('Invalid UnifiedAnalysisResult');
    }
    
    if (!unifiedResult.summary || !unifiedResult.aiKeyRisks) {
      throw new Error('Missing required fields');
    }

    // Filter and limit key risks
    const filteredRisks = unifiedResult.aiKeyRisks.filter((risk: any) => {
      // Filter by includeRiskLevels if specified
      if (options.includeRiskLevels && options.includeRiskLevels.length > 0) {
        return options.includeRiskLevels.includes(risk.riskLevel);
      }
      return true;
    });

    // Prioritize CRITICAL and HIGH risks, limit to 10
    const prioritizedRisks = filteredRisks
      .slice(0, 10);

    // Create overall assessment
    const overallAssessment = this.createOverallAssessment(unifiedResult);

    // Transform to AIJsonOutput format
    const keyRisks = prioritizedRisks.map(risk => ({
      problem: risk.problem || risk.title,
      riskLevel: risk.riskLevel,
      context: {
        filePath: risk.filePath,
        codeSnippet: risk.context?.codeSnippet || '',
        startLine: risk.context?.startLine || 0,
        endLine: risk.context?.endLine || 0
      },
      suggestedAction: typeof risk.suggestedAction === 'string' 
        ? { type: 'refactor', description: risk.suggestedAction }
        : risk.suggestedAction || { type: 'review', description: 'Review needed' }
    }));

    // Return AIJsonOutput
    return {
      overallAssessment,
      keyRisks,
      fullReportUrl: options.htmlReportPath || options.reportPath || this.DEFAULT_REPORT_PATH
    };
  }

  private createOverallAssessment(unifiedResult: UnifiedAnalysisResult): string {
    const summary = unifiedResult.summary;
    const score = summary.overallScore || 0;
    const grade = summary.overallGrade || 'N/A';
    const critical = summary.statistics?.riskCounts?.CRITICAL || 0;
    const high = summary.statistics?.riskCounts?.HIGH || 0;
    
    if (unifiedResult.aiKeyRisks && unifiedResult.aiKeyRisks.length === 0) {
      return '問題は検出されませんでした。';
    }
    
    const assessment = `総合スコア: ${score}/100\nグレード: ${grade}\nCRITICAL: ${critical}件, HIGH: ${high}件`;
    
    if (unifiedResult.aiKeyRisks && unifiedResult.aiKeyRisks.length > 0) {
      const topRisk = unifiedResult.aiKeyRisks[0];
      return `${assessment}\n最重要問題: ${topRisk.title || topRisk.problem}`;
    }
    
    return assessment;
  }

  /**
   * Legacy format for AnalysisResult (for base class compatibility)
   */
  private formatAnalysisResult(result: AnalysisResult, context?: ProjectContext | UnifiedAIFormatterOptions): UnifiedAIOutput {
    const keyRisks = this.assessRisks(result.issues);
    const summary = this.createSummary(result.issues);
    
    const output: UnifiedAIOutput = {
      keyRisks,
      summary
    };

    if (this.options.includeRecommendations) {
      output.recommendations = this.generateRecommendations(result);
    }

    if (this.options.includeContext && context) {
      output.context = this.extractContext(context as ProjectContext);
    }

    return output;
  }

  /**
   * Enhanced risk assessment with pattern detection
   */
  protected assessRisks(issues: Issue[]): RiskAssessment[] {
    const baseRisks = super.assessRisks(issues);
    
    // Add pattern-based risk detection
    const patternRisks = this.detectPatternRisks(issues);
    
    // Merge and deduplicate risks
    const allRisks = [...baseRisks, ...patternRisks];
    const uniqueRisks = this.deduplicateRisks(allRisks);
    
    return uniqueRisks
      .sort((a, b) => {
        const levelOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      })
      .slice(0, this.options.maxRisks);
  }

  /**
   * Detect pattern-based risks
   */
  private detectPatternRisks(issues: Issue[]): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // Detect test coverage gaps
    const coverageIssues = issues.filter(i => i.category === 'coverage');
    if (coverageIssues.length > 5) {
      risks.push({
        riskLevel: 'HIGH',
        category: 'coverage-pattern',
        description: 'Systematic test coverage gaps detected across multiple components',
        impact: 'Large portions of codebase may be untested, increasing bug probability',
        likelihood: 0.8,
        mitigation: 'Implement test coverage requirements and automated coverage checks'
      });
    }

    // Detect assertion quality issues
    const assertionIssues = issues.filter(i => i.category === 'assertion');
    if (assertionIssues.length > 10) {
      risks.push({
        riskLevel: 'MEDIUM',
        category: 'assertion-pattern',
        description: 'Widespread assertion quality issues found',
        impact: 'Tests may not effectively validate functionality',
        likelihood: 0.7,
        mitigation: 'Review and strengthen test assertions across the codebase'
      });
    }

    // Detect structural issues
    const structureIssues = issues.filter(i => i.category === 'structure');
    if (structureIssues.length > 3) {
      risks.push({
        riskLevel: 'MEDIUM',
        category: 'structure-pattern',
        description: 'Test structure violations indicate architectural issues',
        impact: 'Test maintainability and reliability concerns',
        likelihood: 0.6,
        mitigation: 'Refactor test architecture following best practices'
      });
    }

    return risks;
  }

  /**
   * Deduplicate risks based on category and description
   */
  private deduplicateRisks(risks: RiskAssessment[]): RiskAssessment[] {
    const seen = new Set<string>();
    return risks.filter(risk => {
      const key = `${risk.category}-${risk.description}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract relevant context for AI analysis
   */
  private extractContext(context: ProjectContext): Record<string, unknown> {
    const deps = context.dependencies;
    const depsCount = Array.isArray(deps) ? deps.length : Object.keys(deps || {}).length;
    const hasESLint = Array.isArray(deps) 
      ? deps.includes('eslint') 
      : !!(deps && typeof deps === 'object' && deps['eslint']);
    
    return {
      projectType: context.type,
      framework: context.framework,
      testFramework: context.testFramework,
      languages: context.languages || (context.language ? [context.language] : []),
      hasTypeScript: context.languages?.includes('typescript') || context.language === 'typescript',
      testFileCount: context.testFiles?.length || 0,
      sourceFileCount: context.sourceFiles?.length || 0,
      dependencies: depsCount,
      configuration: {
        hasESLint,
        hasJest: context.testFramework === 'jest',
        hasMocha: context.testFramework === 'mocha',
        hasTypeScript: context.languages?.includes('typescript') || context.language === 'typescript'
      }
    };
  }

  /**
   * Enhanced recommendation generation
   */
  protected generateRecommendations(result: AnalysisResult): string[] {
    const recommendations = super.generateRecommendations(result);
    
    // Add specific recommendations based on patterns
    const issuesByCategory = this.groupIssuesByCategory(result.issues);
    
    // Test quality recommendations
    if (issuesByCategory['test-quality']?.length > 10) {
      recommendations.push(
        'Implement test quality standards and automated quality checks'
      );
    }

    // Performance recommendations
    if (issuesByCategory['performance']?.length > 5) {
      recommendations.push(
        'Review and optimize test performance to reduce execution time'
      );
    }

    // Security recommendations
    if (issuesByCategory['security']?.length > 0) {
      recommendations.push(
        'Address security-related test gaps immediately'
      );
    }

    // Documentation recommendations
    if (issuesByCategory['documentation']?.length > 15) {
      recommendations.push(
        'Improve test documentation for better maintainability'
      );
    }

    // Best practice recommendations
    if (issuesByCategory['best-practice']?.length > 20) {
      recommendations.push(
        'Conduct team training on testing best practices'
      );
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(issues: Issue[]): Record<string, Issue[]> {
    return issues.reduce((acc, issue) => {
      const category = issue.category || 'unknown';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(issue);
      return acc;
    }, {} as Record<string, Issue[]>);
  }

  /**
   * Calculate enhanced overall risk
   */
  protected calculateOverallRisk(issues: Issue[]): RiskAssessment['riskLevel'] {
    const baseRisk = super.calculateOverallRisk(issues);
    
    // Consider patterns for risk elevation
    const categories = new Set(issues.map(i => i.category));
    const hasMultipleCategories = categories.size > 5;
    const hasSystemicIssues = issues.length > 50;
    
    if (hasSystemicIssues && hasMultipleCategories && baseRisk === 'MEDIUM') {
      return 'HIGH';
    }
    
    return baseRisk;
  }
}