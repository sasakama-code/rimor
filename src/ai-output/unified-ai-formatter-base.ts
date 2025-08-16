import { CoreTypes, TypeGuards, TypeUtils } from '../core/types/core-definitions';
/**
 * Base class for unified AI formatters
 */

import {
  AnalysisResult,
  ProjectContext,
  Issue,
  ExtendedIssue,
  IssueSeverity,
  IssueCategory
} from '../core/types';

export interface UnifiedAIFormatterOptions {
  maxRisks?: number;
  includeRecommendations?: boolean;
  includeContext?: boolean;
  reportPath?: string;
}

// Migrated to CoreTypes
export interface RiskAssessment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  problem?: string;
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
  protected createRiskAssessment(issue: Issue | ExtendedIssue): RiskAssessment {
    const riskLevel = this.mapSeverityToRiskLevel(issue.severity);
    const extIssue = issue as ExtendedIssue;
    
    return {
      riskLevel,
      category: issue.category,
      description: issue.message,
      impact: this.assessImpact(issue),
      likelihood: this.assessLikelihood(issue),
      mitigation: extIssue.suggestedFix || issue.suggestion
    };
  }

  /**
   * Map issue severity to risk level
   */
  protected mapSeverityToRiskLevel(severity: IssueSeverity): RiskAssessment['riskLevel'] {
    switch (severity) {
      case 'critical':
        return 'CRITICAL';
      case 'error':  // same as high
      case 'high':
        return 'HIGH';
      case 'warning':  // same as medium
      case 'medium':
        return 'MEDIUM';
      case 'info':
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
      'testing': 'Test-related issues affecting quality assurance',
      'security': 'Security vulnerabilities',
      'performance': 'Potential performance degradation',
      'maintainability': 'Long-term maintenance difficulties',
      'reliability': 'System reliability and stability issues',
      'complexity': 'Increased cognitive load and maintenance cost',
      'duplication': 'Code duplication leading to maintenance issues',
      'style': 'Code style inconsistencies',
      'documentation': 'Knowledge transfer difficulties',
      'general': 'General quality issues',
      'test-quality': 'May lead to undetected bugs and production issues',
      'coverage': 'Reduced confidence in code reliability',
      'assertion': 'Tests may not properly validate functionality',
      'pattern': 'Code maintainability and consistency issues',
      'structure': 'Architectural degradation over time',
      'best-practice': 'Technical debt accumulation',
      'error-handling': 'Application crashes and poor user experience',
      'validation': 'Invalid data processing and corruption',
      'code-quality': 'Code maintainability and readability issues',
      'test-coverage': 'Insufficient test coverage for critical paths',
      'file-system': 'File operation failures and data loss',
      'syntax': 'Code compilation and runtime errors'
    };

    return impactMap[issue.category as IssueCategory] || 'Potential quality issues';
  }

  /**
   * Assess likelihood of an issue occurring
   */
  protected assessLikelihood(issue: Issue): number {
    const severityWeight: Record<IssueSeverity, number> = {
      'critical': 0.9,
      'error': 0.7,     // same as high
      'high': 0.7,
      'warning': 0.5,   // same as medium
      'medium': 0.5,
      'low': 0.3,
      'info': 0.1
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