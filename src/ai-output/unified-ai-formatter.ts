/**
 * Unified AI formatter implementation
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

export class UnifiedAIFormatter extends UnifiedAIFormatterBase {
  constructor(options: UnifiedAIFormatterOptions = {}) {
    super(options);
  }

  /**
   * Format analysis results into unified AI output
   */
  format(result: AnalysisResult, context?: ProjectContext): UnifiedAIOutput {
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
      output.context = this.extractContext(context);
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
  private extractContext(context: ProjectContext): any {
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