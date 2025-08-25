/**
 * Implementation Truth AI Formatter
 * v0.9.0 - AIコーディング時代の品質保証エンジン向けフォーマッター
 * 
 * ImplementationTruthAnalysisResultをAI向けの構造化JSONに変換
 * SOLID原則: 単一責任 - Implementation Truth分析結果のフォーマットのみに特化
 */

import { ImplementationTruthAnalysisResult } from '../core/UnifiedAnalysisEngine';
import { IntentRealizationResult } from '../types/intent-realization';
import { ImplementationTruth } from '../types/implementation-truth';

/**
 * AI向けImplementationTruth分析結果
 */
export interface AIImplementationTruthOutput {
  /**
   * レポート基本情報
   */
  metadata: {
    generatedAt: string;
    format: 'ai-implementation-truth';
    version: '0.9.0';
    rimorEngine: string;
  };

  /**
   * エグゼクティブサマリー（AI向け）
   */
  executiveSummary: {
    overallScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    keyFindings: string[];
    criticalIssues: number;
    totalGaps: number;
    realizationScore: number;
  };

  /**
   * 実装の真実サマリー
   */
  implementationTruth: {
    filePath: string;
    vulnerabilitiesDetected: number;
    securityProfile: {
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      topVulnerabilities: Array<{
        type: string;
        severity: string;
        description: string;
        location: string;
      }>;
    };
    complexity: {
      overall: number;
      methodCount: number;
      averageComplexity: number;
    };
    dependencies: {
      totalDependencies: number;
      externalDependencies: number;
      riskDependencies: string[];
    };
  };

  /**
   * 意図実現度分析結果
   */
  intentRealizationAnalysis: {
    totalTestFiles: number;
    averageRealizationScore: number;
    gapsByType: Record<string, number>;
    gapsBySeverity: Record<string, number>;
    topGaps: Array<{
      type: string;
      severity: string;
      description: string;
      recommendation: string;
      affectedFile: string;
    }>;
  };

  /**
   * AI向けアクションアイテム
   */
  aiActionItems: {
    immediate: Array<{
      priority: 'critical' | 'high';
      action: string;
      description: string;
      estimatedEffort: string;
      impactScore: number;
    }>;
    shortTerm: Array<{
      priority: 'medium';
      action: string;
      description: string;
      estimatedEffort: string;
    }>;
    longTerm: Array<{
      priority: 'low';
      action: string;
      description: string;
      estimatedEffort: string;
    }>;
  };

  /**
   * コード生成指示（AI向け）
   */
  codeGenerationGuidance: {
    missingTests: Array<{
      testType: string;
      targetMethod: string;
      testDescription: string;
      sampleCode: string;
      priority: string;
    }>;
    securityImprovements: Array<{
      vulnerability: string;
      currentCode: string;
      recommendedFix: string;
      explanation: string;
    }>;
    qualityImprovements: Array<{
      area: string;
      currentIssue: string;
      improvement: string;
      codeExample: string;
    }>;
  };

  /**
   * 技術的詳細（デバッグ用）
   */
  technicalDetails: {
    executionTime: number;
    analysisStatistics: {
      filesAnalyzed: number;
      methodsAnalyzed: number;
      vulnerabilitiesScanned: number;
      testCasesAnalyzed: number;
    };
    qualityMetrics: {
      coverageScore: number;
      testQualityScore: number;
      securityScore: number;
      maintainabilityScore: number;
    };
  };
}

/**
 * ImplementationTruthAnalysisResult用AIフォーマッター
 */
export class ImplementationTruthAIFormatter {
  private readonly version = '0.9.0';
  private readonly engine = 'Rimor AI Quality Assurance Engine';

  /**
   * ImplementationTruthAnalysisResultをAI向けJSONに変換
   */
  format(result: ImplementationTruthAnalysisResult): AIImplementationTruthOutput {
    const now = new Date().toISOString();
    
    return {
      metadata: {
        generatedAt: now,
        format: 'ai-implementation-truth',
        version: this.version,
        rimorEngine: this.engine
      },

      executiveSummary: this.formatExecutiveSummary(result),
      implementationTruth: this.formatImplementationTruth(result.implementationTruth),
      intentRealizationAnalysis: this.formatIntentRealizationAnalysis(result),
      aiActionItems: this.formatAIActionItems(result),
      codeGenerationGuidance: this.formatCodeGenerationGuidance(result),
      technicalDetails: this.formatTechnicalDetails(result)
    };
  }

  /**
   * エグゼクティブサマリーのフォーマット
   */
  private formatExecutiveSummary(result: ImplementationTruthAnalysisResult) {
    const grade = this.calculateGrade(result.overallScore);
    const keyFindings = this.extractKeyFindings(result);

    return {
      overallScore: Math.round(result.overallScore * 100) / 100,
      grade,
      keyFindings,
      criticalIssues: result.highSeverityGaps,
      totalGaps: result.totalGapsDetected,
      realizationScore: Math.round(result.summary.realizationScore * 100) / 100
    };
  }

  /**
   * 実装の真実のフォーマット
   */
  private formatImplementationTruth(implementationTruth: ImplementationTruth) {
    const topVulnerabilities = implementationTruth.vulnerabilities
      .slice(0, 5)
      .map(vuln => ({
        type: vuln.type,
        severity: vuln.severity,
        description: vuln.message,
        location: `${vuln.location.file}:${vuln.location.line}`
      }));

    return {
      filePath: implementationTruth.filePath,
      vulnerabilitiesDetected: implementationTruth.vulnerabilities.length,
      securityProfile: {
        riskLevel: this.calculateSecurityRiskLevel(implementationTruth.vulnerabilities),
        topVulnerabilities
      },
      complexity: {
        overall: implementationTruth.structure.complexity.cyclomaticComplexity || 0,
        methodCount: implementationTruth.actualBehaviors.methods.length,
        averageComplexity: this.calculateAverageComplexity(implementationTruth)
      },
      dependencies: {
        totalDependencies: implementationTruth.actualBehaviors.dependencies.length,
        externalDependencies: implementationTruth.actualBehaviors.dependencies.filter(
          dep => dep.type === 'import' || dep.type === 'require'
        ).length,
        riskDependencies: implementationTruth.actualBehaviors.dependencies
          .filter(dep => dep.depth > 3)
          .map(dep => dep.moduleName)
      }
    };
  }

  /**
   * 意図実現度分析のフォーマット
   */
  private formatIntentRealizationAnalysis(result: ImplementationTruthAnalysisResult) {
    const gapsByType = this.countGapsByType(result.intentRealizationResults);
    const gapsBySeverity = this.countGapsBySeverity(result.intentRealizationResults);
    const topGaps = this.extractTopGaps(result.intentRealizationResults);

    return {
      totalTestFiles: result.summary.testFilesAnalyzed,
      averageRealizationScore: result.overallScore,
      gapsByType,
      gapsBySeverity,
      topGaps
    };
  }

  /**
   * AI向けアクションアイテムのフォーマット
   */
  private formatAIActionItems(result: ImplementationTruthAnalysisResult) {
    const allRecommendations = result.intentRealizationResults.flatMap(r => r.recommendations);
    
    return {
      immediate: allRecommendations
        .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
        .slice(0, 5)
        .map(rec => ({
          priority: rec.priority as 'critical' | 'high',
          action: rec.type,
          description: rec.description,
          estimatedEffort: `${rec.expectedImpact.estimatedImplementationTime}h`,
          impactScore: rec.expectedImpact.testQualityImprovement
        })),
      shortTerm: allRecommendations
        .filter(rec => rec.priority === 'medium')
        .slice(0, 5)
        .map(rec => ({
          priority: 'medium' as const,
          action: rec.type,
          description: rec.description,
          estimatedEffort: `${rec.expectedImpact.estimatedImplementationTime}h`
        })),
      longTerm: allRecommendations
        .filter(rec => rec.priority === 'low')
        .slice(0, 3)
        .map(rec => ({
          priority: 'low' as const,
          action: rec.type,
          description: rec.description,
          estimatedEffort: `${rec.expectedImpact.estimatedImplementationTime}h`
        }))
    };
  }

  /**
   * コード生成指示のフォーマット
   */
  private formatCodeGenerationGuidance(result: ImplementationTruthAnalysisResult) {
    const allGaps = result.intentRealizationResults.flatMap(r => r.gaps);
    
    return {
      missingTests: allGaps
        .filter(gap => gap.type.includes('MISSING'))
        .slice(0, 10)
        .map(gap => ({
          testType: gap.type,
          targetMethod: gap.affectedIntent.targetMethod || 'Unknown',
          testDescription: gap.description,
          sampleCode: this.generateTestSampleCode(gap),
          priority: gap.severity
        })),
      securityImprovements: result.implementationTruth.vulnerabilities
        .slice(0, 5)
        .map(vuln => ({
          vulnerability: vuln.type,
          currentCode: 'Current vulnerable code detected',
          recommendedFix: vuln.recommendation || 'Apply security best practices',
          explanation: vuln.message
        })),
      qualityImprovements: allGaps
        .filter(gap => gap.type.includes('QUALITY'))
        .slice(0, 5)
        .map(gap => ({
          area: gap.type,
          currentIssue: gap.description,
          improvement: gap.recommendations[0]?.description || 'Improve code quality',
          codeExample: 'Example code improvement'
        }))
    };
  }

  /**
   * 技術的詳細のフォーマット
   */
  private formatTechnicalDetails(result: ImplementationTruthAnalysisResult) {
    const totalMethods = result.implementationTruth.actualBehaviors.methods.length;
    const totalTests = result.intentRealizationResults.length;

    return {
      executionTime: result.executionTime,
      analysisStatistics: {
        filesAnalyzed: result.summary.productionFilesAnalyzed,
        methodsAnalyzed: totalMethods,
        vulnerabilitiesScanned: result.summary.vulnerabilitiesDetected,
        testCasesAnalyzed: totalTests
      },
      qualityMetrics: {
        coverageScore: this.calculateCoverageScore(result),
        testQualityScore: result.overallScore,
        securityScore: this.calculateSecurityScore(result),
        maintainabilityScore: this.calculateMaintainabilityScore(result)
      }
    };
  }

  // ヘルパーメソッド群

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private extractKeyFindings(result: ImplementationTruthAnalysisResult): string[] {
    const findings: string[] = [];
    
    findings.push(`${result.summary.vulnerabilitiesDetected}個のセキュリティ脆弱性を検出`);
    findings.push(`${result.totalGapsDetected}個の意図実現度ギャップを特定`);
    findings.push(`テスト実現度スコア: ${result.summary.realizationScore.toFixed(1)}%`);
    
    if (result.highSeverityGaps > 0) {
      findings.push(`${result.highSeverityGaps}個の高重要度問題を発見`);
    }

    return findings;
  }

  private calculateSecurityRiskLevel(vulnerabilities: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (vulnerabilities.length > 0) return 'medium';
    return 'low';
  }

  private calculateAverageComplexity(implementationTruth: ImplementationTruth): number {
    const methods = implementationTruth.actualBehaviors.methods;
    if (methods.length === 0) return 0;
    
    // 簡易計算（実際の実装では詳細な複雑度計算が必要）
    return methods.reduce((sum, method) => sum + (method.callsToMethods?.length || 0), 0) / methods.length;
  }

  private countGapsByType(results: IntentRealizationResult[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    results.forEach(result => {
      result.gaps.forEach(gap => {
        counts[gap.type] = (counts[gap.type] || 0) + 1;
      });
    });
    
    return counts;
  }

  private countGapsBySeverity(results: IntentRealizationResult[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    results.forEach(result => {
      result.gaps.forEach(gap => {
        counts[gap.severity] = (counts[gap.severity] || 0) + 1;
      });
    });
    
    return counts;
  }

  private extractTopGaps(results: IntentRealizationResult[]) {
    const allGaps = results.flatMap(result => 
      result.gaps.map(gap => ({
        type: gap.type,
        severity: gap.severity,
        description: gap.description,
        recommendation: gap.recommendations[0]?.description || 'No recommendation available',
        affectedFile: result.filePath
      }))
    );
    
    // 重要度順にソートして上位10件を返す
    return allGaps
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
      .slice(0, 10);
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private generateTestSampleCode(gap: any): string {
    // 簡易的なテストコードサンプル生成
    return `describe('${gap.affectedIntent.targetMethod || 'target method'}', () => {
  it('${gap.description}', () => {
    // Test implementation needed
  });
});`;
  }

  private calculateCoverageScore(result: ImplementationTruthAnalysisResult): number {
    // 実装済みの振る舞いに対するテストカバレッジを計算
    const totalMethods = result.implementationTruth.actualBehaviors.methods.length;
    const testedMethods = result.intentRealizationResults.filter(r => r.realizationScore > 50).length;
    
    return totalMethods > 0 ? (testedMethods / totalMethods) * 100 : 0;
  }

  private calculateSecurityScore(result: ImplementationTruthAnalysisResult): number {
    const vulnerabilities = result.implementationTruth.vulnerabilities.length;
    const criticalVulns = result.implementationTruth.vulnerabilities.filter(v => v.severity === 'critical').length;
    
    if (vulnerabilities === 0) return 100;
    
    // 脆弱性の数と重要度に基づいてスコア計算
    const score = Math.max(0, 100 - (vulnerabilities * 10) - (criticalVulns * 20));
    return Math.round(score);
  }

  private calculateMaintainabilityScore(result: ImplementationTruthAnalysisResult): number {
    // 複雑度とテスト品質に基づくメンテナンス性スコア
    const complexityScore = Math.min(100, Math.max(0, 100 - (result.implementationTruth.structure.complexity.cyclomaticComplexity || 0) * 2));
    const testQualityScore = result.overallScore;
    
    return Math.round((complexityScore + testQualityScore) / 2);
  }
}