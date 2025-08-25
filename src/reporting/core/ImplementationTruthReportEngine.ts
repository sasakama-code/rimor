/**
 * Implementation Truth Report Engine
 * v0.9.0 - AIコーディング時代の品質保証エンジン専用レポートエンジン
 * 
 * SOLID原則: 単一責任（Implementation Truth分析結果の専用レポート）
 * 戦略パターンを使用して様々な形式のレポート生成
 */

import { ImplementationTruthAnalysisResult } from '../../core/UnifiedAnalysisEngine';
import { 
  ImplementationTruthAIFormatter, 
  AIImplementationTruthOutput 
} from '../../ai-output/implementation-truth-ai-formatter';

/**
 * レポート形式の種類
 */
export type ImplementationTruthReportFormat = 
  | 'ai-json'
  | 'markdown'
  | 'html'
  | 'summary';

/**
 * レポート生成オプション
 */
export interface ImplementationTruthReportOptions {
  /**
   * レポート形式
   */
  format?: ImplementationTruthReportFormat;

  /**
   * 詳細レベル
   */
  detailLevel?: 'summary' | 'detailed' | 'comprehensive';

  /**
   * AI向け最適化
   */
  optimizeForAI?: boolean;

  /**
   * メタデータを含むか
   */
  includeMetadata?: boolean;

  /**
   * コード例を含むか
   */
  includeCodeExamples?: boolean;

  /**
   * 技術的詳細を含むか
   */
  includeTechnicalDetails?: boolean;
}

/**
 * 統合されたレポート出力
 */
export interface ImplementationTruthReport {
  /**
   * レポート形式
   */
  format: ImplementationTruthReportFormat;

  /**
   * レポート内容
   */
  content: string | object;

  /**
   * 生成タイムスタンプ
   */
  timestamp: string;

  /**
   * メタデータ
   */
  metadata?: {
    generatedBy: string;
    version: string;
    processingTime: number;
    analysisId?: string;
  };
}

/**
 * フォーマット戦略インターフェース
 */
export interface IImplementationTruthFormattingStrategy {
  name: string;
  format(result: ImplementationTruthAnalysisResult, options?: ImplementationTruthReportOptions): string | object;
  formatAsync?(result: ImplementationTruthAnalysisResult, options?: ImplementationTruthReportOptions): Promise<string | object>;
}

/**
 * AI-JSON フォーマット戦略
 */
export class AIJsonFormattingStrategy implements IImplementationTruthFormattingStrategy {
  name = 'ai-json';
  private formatter = new ImplementationTruthAIFormatter();

  format(result: ImplementationTruthAnalysisResult, options?: ImplementationTruthReportOptions): AIImplementationTruthOutput {
    return this.formatter.format(result);
  }
}

/**
 * Markdown フォーマット戦略
 */
export class MarkdownFormattingStrategy implements IImplementationTruthFormattingStrategy {
  name = 'markdown';

  format(result: ImplementationTruthAnalysisResult, options?: ImplementationTruthReportOptions): string {
    const aiOutput = new ImplementationTruthAIFormatter().format(result);
    return this.convertToMarkdown(aiOutput, options);
  }

  private convertToMarkdown(aiOutput: AIImplementationTruthOutput, options?: ImplementationTruthReportOptions): string {
    const sections: string[] = [];

    // ヘッダー
    sections.push('# Rimor Implementation Truth Analysis Report\n');
    sections.push(`Generated at: ${aiOutput.metadata.generatedAt}\n`);
    sections.push(`Version: ${aiOutput.metadata.version}\n\n`);

    // エグゼクティブサマリー
    sections.push('## Executive Summary\n');
    sections.push(`**Overall Score:** ${aiOutput.executiveSummary.overallScore} (Grade: ${aiOutput.executiveSummary.grade})\n`);
    sections.push(`**Critical Issues:** ${aiOutput.executiveSummary.criticalIssues}\n`);
    sections.push(`**Total Gaps:** ${aiOutput.executiveSummary.totalGaps}\n`);
    sections.push(`**Realization Score:** ${aiOutput.executiveSummary.realizationScore}%\n\n`);

    // キーファインディング
    sections.push('### Key Findings\n');
    aiOutput.executiveSummary.keyFindings.forEach(finding => {
      sections.push(`- ${finding}\n`);
    });
    sections.push('\n');

    // 実装の真実
    sections.push('## Implementation Truth Analysis\n');
    sections.push(`**File:** \`${aiOutput.implementationTruth.filePath}\`\n`);
    sections.push(`**Vulnerabilities:** ${aiOutput.implementationTruth.vulnerabilitiesDetected}\n`);
    sections.push(`**Security Risk:** ${aiOutput.implementationTruth.securityProfile.riskLevel}\n`);
    sections.push(`**Complexity:** ${aiOutput.implementationTruth.complexity.overall}\n\n`);

    if (aiOutput.implementationTruth.securityProfile.topVulnerabilities.length > 0) {
      sections.push('### Top Security Vulnerabilities\n');
      aiOutput.implementationTruth.securityProfile.topVulnerabilities.forEach((vuln, index) => {
        sections.push(`${index + 1}. **${vuln.type}** (${vuln.severity})\n`);
        sections.push(`   - ${vuln.description}\n`);
        sections.push(`   - Location: \`${vuln.location}\`\n\n`);
      });
    }

    // 意図実現度分析
    sections.push('## Intent Realization Analysis\n');
    sections.push(`**Test Files Analyzed:** ${aiOutput.intentRealizationAnalysis.totalTestFiles}\n`);
    sections.push(`**Average Realization Score:** ${aiOutput.intentRealizationAnalysis.averageRealizationScore.toFixed(1)}%\n\n`);

    // ギャップ分析
    sections.push('### Gap Analysis\n');
    sections.push('#### By Type\n');
    Object.entries(aiOutput.intentRealizationAnalysis.gapsByType).forEach(([type, count]) => {
      sections.push(`- ${type}: ${count}\n`);
    });
    sections.push('\n');

    sections.push('#### By Severity\n');
    Object.entries(aiOutput.intentRealizationAnalysis.gapsBySeverity).forEach(([severity, count]) => {
      sections.push(`- ${severity}: ${count}\n`);
    });
    sections.push('\n');

    // AIアクションアイテム
    sections.push('## AI Action Items\n');
    
    if (aiOutput.aiActionItems.immediate.length > 0) {
      sections.push('### Immediate Actions (Critical/High Priority)\n');
      aiOutput.aiActionItems.immediate.forEach((item, index) => {
        sections.push(`${index + 1}. **${item.action}** (${item.priority})\n`);
        sections.push(`   - ${item.description}\n`);
        sections.push(`   - Estimated Effort: ${item.estimatedEffort}\n`);
        sections.push(`   - Impact Score: ${item.impactScore.toFixed(2)}\n\n`);
      });
    }

    if (options?.detailLevel === 'comprehensive' && aiOutput.aiActionItems.shortTerm.length > 0) {
      sections.push('### Short-term Actions (Medium Priority)\n');
      aiOutput.aiActionItems.shortTerm.forEach((item, index) => {
        sections.push(`${index + 1}. **${item.action}**\n`);
        sections.push(`   - ${item.description}\n`);
        sections.push(`   - Estimated Effort: ${item.estimatedEffort}\n\n`);
      });
    }

    if (options?.includeCodeExamples) {
      // コード生成指示
      sections.push('## Code Generation Guidance\n');
      
      if (aiOutput.codeGenerationGuidance.missingTests.length > 0) {
        sections.push('### Missing Tests\n');
        aiOutput.codeGenerationGuidance.missingTests.slice(0, 5).forEach((test, index) => {
          sections.push(`${index + 1}. **${test.testType}** for \`${test.targetMethod}\`\n`);
          sections.push(`   - Description: ${test.testDescription}\n`);
          sections.push(`   - Priority: ${test.priority}\n`);
          sections.push('   - Sample Code:\n');
          sections.push('   ```javascript\n');
          sections.push(test.sampleCode);
          sections.push('\n   ```\n\n');
        });
      }
    }

    if (options?.includeTechnicalDetails) {
      // 技術的詳細
      sections.push('## Technical Details\n');
      sections.push(`**Execution Time:** ${aiOutput.technicalDetails.executionTime}ms\n`);
      sections.push(`**Files Analyzed:** ${aiOutput.technicalDetails.analysisStatistics.filesAnalyzed}\n`);
      sections.push(`**Methods Analyzed:** ${aiOutput.technicalDetails.analysisStatistics.methodsAnalyzed}\n`);
      sections.push(`**Test Cases Analyzed:** ${aiOutput.technicalDetails.analysisStatistics.testCasesAnalyzed}\n\n`);

      sections.push('### Quality Metrics\n');
      sections.push(`- **Coverage Score:** ${aiOutput.technicalDetails.qualityMetrics.coverageScore.toFixed(1)}%\n`);
      sections.push(`- **Test Quality Score:** ${aiOutput.technicalDetails.qualityMetrics.testQualityScore.toFixed(1)}%\n`);
      sections.push(`- **Security Score:** ${aiOutput.technicalDetails.qualityMetrics.securityScore.toFixed(1)}%\n`);
      sections.push(`- **Maintainability Score:** ${aiOutput.technicalDetails.qualityMetrics.maintainabilityScore.toFixed(1)}%\n\n`);
    }

    // フッター
    sections.push('---\n');
    sections.push(`*Generated by Rimor AI Quality Assurance Engine v${aiOutput.metadata.version}*\n`);

    return sections.join('');
  }
}

/**
 * HTML フォーマット戦略
 */
export class HtmlFormattingStrategy implements IImplementationTruthFormattingStrategy {
  name = 'html';

  format(result: ImplementationTruthAnalysisResult, options?: ImplementationTruthReportOptions): string {
    const aiOutput = new ImplementationTruthAIFormatter().format(result);
    return this.convertToHtml(aiOutput, options);
  }

  private convertToHtml(aiOutput: AIImplementationTruthOutput, options?: ImplementationTruthReportOptions): string {
    const styles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; }
        .grade-a { background-color: #28a745; }
        .grade-b { background-color: #17a2b8; }
        .grade-c { background-color: #ffc107; color: #212529; }
        .grade-d { background-color: #fd7e14; }
        .grade-f { background-color: #dc3545; }
        .vulnerability { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 8px 0; }
        .action-item { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 12px; margin: 8px 0; }
        .critical { border-left-color: #dc3545; }
        .high { border-left-color: #fd7e14; }
        .medium { border-left-color: #ffc107; }
        .low { border-left-color: #28a745; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 12px; border-radius: 6px; overflow-x: auto; }
      </style>
    `;

    const gradeClass = `grade-${aiOutput.executiveSummary.grade.toLowerCase()}`;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rimor Implementation Truth Analysis Report</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>Rimor Implementation Truth Analysis Report</h1>
        <p><strong>Generated:</strong> ${aiOutput.metadata.generatedAt}</p>
        <p><strong>Version:</strong> ${aiOutput.metadata.version}</p>
      </div>

      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p><span class="score-badge ${gradeClass}">Score: ${aiOutput.executiveSummary.overallScore} (Grade: ${aiOutput.executiveSummary.grade})</span></p>
        <ul>
          <li><strong>Critical Issues:</strong> ${aiOutput.executiveSummary.criticalIssues}</li>
          <li><strong>Total Gaps:</strong> ${aiOutput.executiveSummary.totalGaps}</li>
          <li><strong>Realization Score:</strong> ${aiOutput.executiveSummary.realizationScore}%</li>
        </ul>

        <h3>Key Findings</h3>
        <ul>
    `;

    aiOutput.executiveSummary.keyFindings.forEach(finding => {
      html += `<li>${finding}</li>`;
    });

    html += `
        </ul>
      </div>

      <div class="implementation-truth">
        <h2>Implementation Truth Analysis</h2>
        <p><strong>File:</strong> <code>${aiOutput.implementationTruth.filePath}</code></p>
        <p><strong>Vulnerabilities:</strong> ${aiOutput.implementationTruth.vulnerabilitiesDetected}</p>
        <p><strong>Security Risk:</strong> ${aiOutput.implementationTruth.securityProfile.riskLevel}</p>
        <p><strong>Complexity:</strong> ${aiOutput.implementationTruth.complexity.overall}</p>
    `;

    if (aiOutput.implementationTruth.securityProfile.topVulnerabilities.length > 0) {
      html += '<h3>Top Security Vulnerabilities</h3>';
      aiOutput.implementationTruth.securityProfile.topVulnerabilities.forEach((vuln, index) => {
        html += `
        <div class="vulnerability">
          <strong>${index + 1}. ${vuln.type} (${vuln.severity})</strong><br>
          ${vuln.description}<br>
          <code>${vuln.location}</code>
        </div>
        `;
      });
    }

    html += '</div>';

    // AIアクションアイテム
    if (aiOutput.aiActionItems.immediate.length > 0) {
      html += '<div class="ai-actions"><h2>AI Action Items</h2><h3>Immediate Actions</h3>';
      aiOutput.aiActionItems.immediate.forEach((item, index) => {
        html += `
        <div class="action-item ${item.priority}">
          <strong>${index + 1}. ${item.action} (${item.priority})</strong><br>
          ${item.description}<br>
          Estimated Effort: ${item.estimatedEffort} | Impact Score: ${item.impactScore.toFixed(2)}
        </div>
        `;
      });
      html += '</div>';
    }

    html += `
      <hr>
      <p><em>Generated by Rimor AI Quality Assurance Engine v${aiOutput.metadata.version}</em></p>
    </body>
    </html>
    `;

    return html;
  }
}

/**
 * Implementation Truth専用レポートエンジン
 */
export class ImplementationTruthReportEngine {
  private strategy: IImplementationTruthFormattingStrategy;
  private readonly strategies = new Map<string, IImplementationTruthFormattingStrategy>();

  constructor(defaultFormat: ImplementationTruthReportFormat = 'ai-json') {
    // 利用可能な戦略を登録
    this.strategies.set('ai-json', new AIJsonFormattingStrategy());
    this.strategies.set('markdown', new MarkdownFormattingStrategy());
    this.strategies.set('html', new HtmlFormattingStrategy());

    // デフォルト戦略を設定
    this.strategy = this.strategies.get(defaultFormat) || this.strategies.get('ai-json')!;
  }

  /**
   * フォーマット戦略を設定
   */
  setFormat(format: ImplementationTruthReportFormat): void {
    const strategy = this.strategies.get(format);
    if (!strategy) {
      throw new Error(`Unsupported format: ${format}`);
    }
    this.strategy = strategy;
  }

  /**
   * 利用可能な形式を取得
   */
  getAvailableFormats(): ImplementationTruthReportFormat[] {
    return Array.from(this.strategies.keys()) as ImplementationTruthReportFormat[];
  }

  /**
   * レポート生成
   */
  async generate(
    result: ImplementationTruthAnalysisResult,
    options?: ImplementationTruthReportOptions
  ): Promise<ImplementationTruthReport> {
    if (!result) {
      throw new Error('Invalid analysis result');
    }

    const startTime = Date.now();

    try {
      // 戦略に応じたフォーマット処理
      let content: string | object;
      
      if (this.strategy.formatAsync) {
        content = await this.strategy.formatAsync(result, options);
      } else {
        content = await Promise.resolve(this.strategy.format(result, options));
      }

      const processingTime = Date.now() - startTime;

      return {
        format: options?.format || 'ai-json',
        content,
        timestamp: new Date().toISOString(),
        metadata: options?.includeMetadata !== false ? {
          generatedBy: 'ImplementationTruthReportEngine',
          version: '0.9.0',
          processingTime,
          analysisId: result.implementationTruth.filePath
        } : undefined
      };

    } catch (error) {
      throw new Error(`Report generation failed: ${error}`);
    }
  }

  /**
   * 複数形式でのレポート生成
   */
  async generateMultiFormat(
    result: ImplementationTruthAnalysisResult,
    formats: ImplementationTruthReportFormat[],
    options?: ImplementationTruthReportOptions
  ): Promise<ImplementationTruthReport[]> {
    const reports: ImplementationTruthReport[] = [];
    
    for (const format of formats) {
      this.setFormat(format);
      const report = await this.generate(result, { ...options, format });
      reports.push(report);
    }
    
    return reports;
  }
}