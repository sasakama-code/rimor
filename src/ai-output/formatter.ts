/**
 * AI-optimized output formatter
 */

import { 
  AnalysisResult,
  ProjectContext,
  Issue,
  IssueCategory,
  IssueSeverity,
  TestFile,
  TestMethod,
  QualityScore 
} from '../core/types';
import { 
  AIOptimizedOutput,
  AIFormattedFile,
  AIFormattedIssue,
  AIContext,
  AISummary 
} from './types';

export class AIOptimizedFormatter {
  private readonly maxIssuesPerFile = 50;
  private readonly maxFilesInOutput = 100;

  /**
   * Format analysis results as JSON for AI consumption
   */
  async formatAsJSON(result: AnalysisResult, projectPath: string, options: any = {}): Promise<any> {
    const output = this.format(result);
    return {
      ...output,
      projectPath,
      format: options.format || 'json'
    };
  }

  /**
   * Format analysis results as Markdown for AI consumption
   */
  async formatAsMarkdown(result: AnalysisResult, projectPath: string, options: any = {}): Promise<string> {
    const output = this.format(result);
    const markdown = `# Rimor Test Quality Analysis Report

## Project Context
- Project Path: ${projectPath}
- Root Path: ${output.context.rootPath || 'Unknown'}
- Dependencies: ${Object.keys(output.context.dependencies || {}).length} packages

## Summary
- Total Issues: ${output.qualityOverview.totalIssues}
- Total Files: ${output.files.length}
- **Quality Score**: ${Math.round(output.qualityOverview.projectScore * 100)}/100
- Quality Grade: ${output.qualityOverview.projectGrade}

## Critical Issues Summary
${output.files.filter(f => f.issues.some((i: any) => i.severity === 'critical'))
  .map(f => `- ${f.path}: ${f.issues.filter((i: any) => i.severity === 'critical').length} critical issues`)
  .join('\n') || '- No critical issues found'}

## Issues by File
${output.files.map(f => `## File: ${f.path}
Score: ${Math.round((f.score || 0.75) * 100)}/100
${f.issues.map((i: any) => `- ${i.severity}: ${i.description || 'No description'}`).join('\n')}`).join('\n\n')}

## Instructions for AI
${Array.isArray(output.instructions) ? output.instructions.join('\n') : '- No specific instructions'}
`;
    return markdown;
  }

  /**
   * Format analysis results for AI consumption
   */
  format(result: AnalysisResult, context?: ProjectContext): AIOptimizedOutput {
    const summary = this.generateSummary(result);
    const files = this.formatFiles(result.issues);
    const aiContext = this.extractContext(result, context);

    return {
      summary,
      files,
      context: aiContext,
      metadata: {
        timestamp: new Date().toISOString(),
        totalIssues: result.issues.length,
        totalFiles: files.length
      },
      // Add required properties for AIOptimizedOutput
      version: '0.8.0',
      format: 'ai-optimized' as const,
      qualityOverview: {
        projectScore: result.score?.overall || 0,
        projectGrade: this.calculateGrade(result.score?.overall || 0),
        criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
        totalIssues: result.issues.length
      },
      actionableTasks: [],
      insights: [],
      instructions: this.generateInstructions(result) // instructionsプロパティを追加
    } as any; // Type assertion to handle interface differences
  }

  /**
   * Format with custom options
   */
  formatWithOptions(
    result: AnalysisResult,
    options: {
      maxIssues?: number;
      maxFiles?: number;
      includeContext?: boolean;
      includeCodeSnippets?: boolean;
    } = {}
  ): AIOptimizedOutput {
    const maxIssues = options.maxIssues || this.maxIssuesPerFile;
    const maxFiles = options.maxFiles || this.maxFilesInOutput;

    const summary = this.generateSummary(result);
    const files = this.formatFiles(result.issues, maxIssues, maxFiles);
    const aiContext = options.includeContext 
      ? this.extractContext(result, result.context)
      : undefined;

    return {
      summary,
      files,
      context: aiContext,
      metadata: {
        timestamp: new Date().toISOString(),
        totalIssues: result.issues.length,
        totalFiles: files.length,
        options
      },
      // Add required properties for AIOptimizedOutput
      version: '0.8.0',
      format: 'ai-optimized' as const,
      qualityOverview: {
        projectScore: result.score?.overall || 0,
        projectGrade: this.calculateGrade(result.score?.overall || 0),
        criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
        totalIssues: result.issues.length
      },
      actionableTasks: [],
      insights: []
    } as any; // Type assertion to handle interface differences
  }

  /**
   * Generate summary
   */
  private generateSummary(result: AnalysisResult): AISummary {
    const severityDistribution = this.calculateSeverityDistribution(result.issues);
    const categoryDistribution = this.calculateCategoryDistribution(result.issues);
    const topIssues = this.getTopIssues(result.issues, 5);

    return {
      totalIssues: result.issues.length,
      totalFiles: new Set(result.issues.map(i => i.filePath)).size,
      overallScore: result.score?.overall || 0,
      severityDistribution,
      categoryDistribution,
      topIssues: topIssues.map(i => ({
        category: i.category,
        severity: i.severity,
        count: result.issues.filter(
          issue => issue.category === i.category && issue.severity === i.severity
        ).length,
        message: i.message
      })),
      keyFindings: this.extractKeyFindings(result)
    };
  }

  /**
   * Format files with issues
   */
  private formatFiles(
    issues: Issue[], 
    maxIssuesPerFile = this.maxIssuesPerFile,
    maxFiles = this.maxFilesInOutput
  ): AIFormattedFile[] {
    const fileGroups = this.groupByFile(issues);
    const sortedFiles = Array.from(fileGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, maxFiles);

    return sortedFiles.map(([filePath, fileIssues]) => ({
      path: filePath,
      issueCount: fileIssues.length,
      issues: fileIssues
        .slice(0, maxIssuesPerFile)
        .map(issue => this.formatIssue(issue)),
      score: this.calculateFileScore(fileIssues)
    }));
  }

  /**
   * Format single issue
   */
  private formatIssue(issue: Issue): AIFormattedIssue {
    return {
      category: issue.category,
      severity: issue.severity,
      message: issue.message,
      line: issue.position?.line,
      column: issue.position?.column,
      suggestion: issue.suggestedFix,
      impact: this.calculateImpact(issue),
      codeSnippet: issue.codeSnippet
    };
  }

  /**
   * Extract context for AI
   */
  private extractContext(result: AnalysisResult, context?: ProjectContext): AIContext {
    return {
      projectType: context?.type || 'unknown',
      framework: context?.framework || 'unknown',
      testFramework: context?.testFramework || 'unknown',
      languages: context?.languages || [],
      dependencies: context?.dependencies || [],
      configuration: {
        hasTypeScript: context?.languages?.includes('typescript') || context?.language === 'typescript' || false,
        hasESLint: this.hasDependency(context?.dependencies, 'eslint'),
        hasPrettier: this.hasDependency(context?.dependencies, 'prettier'),
        hasJest: context?.testFramework === 'jest'
      }
    };
  }

  /**
   * Calculate severity distribution
   */
  private calculateSeverityDistribution(issues: Issue[]): Record<IssueSeverity, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<IssueSeverity, number>);
  }

  /**
   * Calculate category distribution
   */
  private calculateCategoryDistribution(issues: Issue[]): Record<IssueCategory, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<IssueCategory, number>);
  }

  /**
   * Get top issues by frequency
   */
  private getTopIssues(issues: Issue[], limit: number): Issue[] {
    const issueMap = new Map<string, Issue>();
    const countMap = new Map<string, number>();

    issues.forEach(issue => {
      const key = `${issue.category}-${issue.severity}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, issue);
      }
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    return Array.from(issueMap.entries())
      .sort((a, b) => (countMap.get(b[0]) || 0) - (countMap.get(a[0]) || 0))
      .slice(0, limit)
      .map(([_, issue]) => issue);
  }

  /**
   * Extract key findings
   */
  private extractKeyFindings(result: AnalysisResult): string[] {
    const findings: string[] = [];

    // Critical issues
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      findings.push(`${criticalCount} critical issues require immediate attention`);
    }

    // Test coverage
    if (result.score && result.score.coverage !== undefined) {
      if (result.score.coverage < 0.5) {
        findings.push(`Low test coverage (${Math.round(result.score.coverage * 100)}%)`);
      }
    }

    // Quality score
    if (result.score && result.score.overall < 0.6) {
      findings.push(`Overall quality score below acceptable threshold`);
    }

    // Pattern issues
    const patternIssues = result.issues.filter(i => i.category === 'pattern');
    if (patternIssues.length > 10) {
      findings.push(`Multiple pattern violations detected (${patternIssues.length} issues)`);
    }

    return findings;
  }

  /**
   * Group issues by file
   */
  private groupByFile(issues: Issue[]): Map<string, Issue[]> {
    const groups = new Map<string, Issue[]>();
    
    issues.forEach(issue => {
      const file = issue.filePath;
      if (!groups.has(file)) {
        groups.set(file, []);
      }
      groups.get(file)!.push(issue);
    });

    return groups;
  }

  /**
   * Calculate file score
   */
  private calculateFileScore(issues: Issue[]): number {
    if (issues.length === 0) return 1.0;

    const severityWeights: Record<IssueSeverity, number> = {
      critical: 0.4,
      high: 0.3,
      medium: 0.2,
      low: 0.1
    };

    const totalWeight = issues.reduce((sum, issue) => {
      return sum + (severityWeights[issue.severity] || 0.1);
    }, 0);

    // Normalize to 0-1 scale (inverse of weight)
    return Math.max(0, 1 - (totalWeight / issues.length));
  }

  /**
   * Calculate issue impact
   */
  private calculateImpact(issue: Issue): 'high' | 'medium' | 'low' {
    if (issue.severity === 'critical') return 'high';
    if (issue.severity === 'high') return 'high';
    if (issue.severity === 'medium') return 'medium';
    return 'low';
  }
  
  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): string {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  /**
   * Generate instructions for fixing issues
   */
  private generateInstructions(result: AnalysisResult): string[] {
    const instructions: string[] = [];
    
    // 重大な問題がある場合の指示
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      instructions.push('優先度: まず重大な問題から修正してください');
    }
    
    // カテゴリごとの指示
    const issuesByCategory = this.groupIssuesByCategory(result.issues);
    for (const [category, issues] of Object.entries(issuesByCategory)) {
      if (issues.length > 0) {
        instructions.push(`${category}: ${issues.length}件の問題を修正してください`);
      }
    }
    
    return instructions;
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(issues: Issue[]): Record<string, Issue[]> {
    const grouped: Record<string, Issue[]> = {};
    
    for (const issue of issues) {
      const category = issue.category || 'その他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(issue);
    }
    
    return grouped;
  }
  
  /**
   * Check if dependency exists
   */
  private hasDependency(deps: Record<string, string> | string[] | undefined, name: string): boolean {
    if (!deps) return false;
    if (Array.isArray(deps)) {
      return deps.includes(name);
    }
    return !!deps[name];
  }
}