/**
 * Base class for unified AI formatters
 */

import {
  AnalysisResult,
  ProjectContext,
  Issue,
  IssueSeverity,
  IssueCategory
} from '../core/types';

export interface UnifiedAIFormatterOptions {
  maxRisks?: number;
  includeRecommendations?: boolean;
  includeContext?: boolean;
  reportPath?: string;
}

export interface RiskAssessment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  impact: string;
  likelihood: number;
  mitigation?: string;
}

export interface UnifiedAIOutput {
  keyRisks: RiskAssessment[];
  recommendations?: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  context?: any;
}

export abstract class UnifiedAIFormatterBase {
  protected readonly DEFAULT_MAX_RISKS = 10;
  protected readonly DEFAULT_REPORT_PATH = '.rimor/reports/index.html';

  protected options: UnifiedAIFormatterOptions;

  constructor(options: UnifiedAIFormatterOptions = {}) {
    this.options = {
      maxRisks: options.maxRisks || this.DEFAULT_MAX_RISKS,
      includeRecommendations: options.includeRecommendations !== false,
      includeContext: options.includeContext !== false,
      reportPath: options.reportPath || this.DEFAULT_REPORT_PATH
    };
  }

  /**
   * Main formatting method to be implemented by subclasses
   */
  abstract format(result: AnalysisResult, context?: ProjectContext): UnifiedAIOutput;

  /**
   * Assess risks from issues
   */
  protected assessRisks(issues: Issue[]): RiskAssessment[] {
    const riskMap = new Map<string, RiskAssessment>();

    issues.forEach(issue => {
      const riskKey = `${issue.category}-${issue.severity}`;
      
      if (!riskMap.has(riskKey)) {
        riskMap.set(riskKey, this.createRiskAssessment(issue));
      } else {
        // Update existing risk assessment
        const existing = riskMap.get(riskKey)!;
        existing.likelihood = Math.min(1, existing.likelihood + 0.1);
      }
    });

    // Sort by risk level and likelihood
    return Array.from(riskMap.values())
      .sort((a, b) => {
        const levelOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const levelDiff = levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
        if (levelDiff !== 0) return levelDiff;
        return b.likelihood - a.likelihood;
      })
      .slice(0, this.options.maxRisks);
  }

  /**
   * Create risk assessment from issue
   */
  protected createRiskAssessment(issue: Issue): RiskAssessment {
    const riskLevel = this.mapSeverityToRiskLevel(issue.severity);
    
    return {
      riskLevel,
      category: issue.category,
      description: issue.message,
      impact: this.assessImpact(issue),
      likelihood: this.assessLikelihood(issue),
      mitigation: issue.suggestedFix
    };
  }

  /**
   * Map issue severity to risk level
   */
  protected mapSeverityToRiskLevel(severity: IssueSeverity): RiskAssessment['riskLevel'] {
    switch (severity) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
      default:
        return 'LOW';
    }
  }

  /**
   * Assess impact of an issue
   */
  protected assessImpact(issue: Issue): string {
    const impactMap: Record<IssueCategory, string> = {
      'test-quality': 'May lead to undetected bugs and production issues',
      'coverage': 'Reduced confidence in code reliability',
      'assertion': 'Tests may not properly validate functionality',
      'pattern': 'Code maintainability and consistency issues',
      'structure': 'Architectural degradation over time',
      'best-practice': 'Technical debt accumulation',
      'performance': 'Potential performance degradation',
      'security': 'Security vulnerabilities',
      'documentation': 'Knowledge transfer difficulties'
    };

    return impactMap[issue.category as IssueCategory] || 'Potential quality issues';
  }

  /**
   * Assess likelihood of an issue occurring
   */
  protected assessLikelihood(issue: Issue): number {
    const severityWeight: Record<IssueSeverity, number> = {
      'critical': 0.9,
      'high': 0.7,
      'medium': 0.5,
      'low': 0.3
    };

    return severityWeight[issue.severity] || 0.5;
  }

  /**
   * Generate recommendations
   */
  protected generateRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];

    // Critical issues recommendation
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(
        `Address ${criticalCount} critical issues immediately to prevent production failures`
      );
    }

    // Coverage recommendation (check both score and qualityScore for backward compatibility)
    const coverage = result.score?.coverage;
    if (coverage !== undefined && coverage < 0.7) {
      recommendations.push(
        `Increase test coverage to at least 70% (current: ${Math.round(coverage * 100)}%)`
      );
    }

    // Pattern issues recommendation
    const patternIssues = result.issues.filter(i => i.category === 'pattern');
    if (patternIssues.length > 5) {
      recommendations.push(
        'Establish and enforce coding standards to reduce pattern violations'
      );
    }

    // Quality score recommendation (check both score and qualityScore for backward compatibility)
    const overallScore = result.score?.overall ?? result.qualityScore;
    if (overallScore !== undefined && overallScore < 0.6) {
      recommendations.push(
        'Implement quality gates in CI/CD pipeline to maintain standards'
      );
    }

    return recommendations;
  }

  /**
   * Calculate overall risk level
   */
  protected calculateOverallRisk(issues: Issue[]): RiskAssessment['riskLevel'] {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 5) return 'HIGH';
    if (highCount > 0 || issues.length > 20) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Create summary
   */
  protected createSummary(issues: Issue[]): UnifiedAIOutput['summary'] {
    return {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      overallRisk: this.calculateOverallRisk(issues)
    };
  }
}