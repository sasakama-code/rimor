#!/usr/bin/env node

/**
 * 統合レポート生成システム
 * 
 * 各Phaseの監査結果を統合し、包括的なレポートを生成
 * - JSON形式統合レポート
 * - Markdown形式ヒューマンリーダブルレポート  
 * - HTML形式ビジュアルレポート
 * - CSV形式データエクスポート
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ====================================================================
// 設定とユーティリティ
// ====================================================================

const argv = yargs(hideBin(process.argv))
  .option('input-dir', {
    alias: 'i',
    type: 'string',
    description: 'Phase結果ディレクトリ',
    default: 'audit-results/phase-results'
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    description: '出力ディレクトリ',
    default: 'audit-results'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['json', 'markdown', 'html', 'csv', 'all'],
    description: '出力形式',
    default: 'all'
  })
  .option('timestamp', {
    alias: 't',
    type: 'string',
    description: 'カスタムタイムスタンプ',
    default: new Date().toISOString().replace(/[:.]/g, '-')
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: '詳細ログ出力',
    default: false
  })
  .option('archive', {
    type: 'boolean',
    description: 'アーカイブモード',
    default: false
  })
  .help()
  .argv;

// ログ出力関数
const log = {
  info: (msg) => argv.verbose && console.log(`ℹ️  ${msg}`),
  success: (msg) => argv.verbose && console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

// ====================================================================
// 統合レポート生成クラス
// ====================================================================

class AuditReportGenerator {
  constructor() {
    this.phases = new Map();
    this.comprehensiveReport = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      summary: {
        totalPhases: 0,
        executionTime: 0,
        overallScore: 0,
        criticalIssues: 0,
        totalIssues: 0,
        totalRecommendations: 0
      },
      phases: {},
      aggregatedMetrics: {},
      prioritizedRecommendations: [],
      executiveSummary: '',
      nextSteps: []
    };
  }

  /**
   * Phase結果ファイルの読み込み
   */
  async loadPhaseResults() {
    log.info(`Phase結果読み込み中: ${argv['input-dir']}`);
    
    const inputDir = argv['input-dir'];
    if (!fs.existsSync(inputDir)) {
      throw new Error(`入力ディレクトリが存在しません: ${inputDir}`);
    }

    const files = fs.readdirSync(inputDir);
    const phaseFiles = files.filter(file => file.startsWith('phase') && file.endsWith('.json'));

    for (const file of phaseFiles) {
      try {
        const filePath = path.join(inputDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const phaseId = this.extractPhaseId(file);
        this.phases.set(phaseId, data);
        
        log.info(`Phase ${phaseId} 読み込み完了: ${data.name}`);
      } catch (error) {
        log.warning(`Phase結果ファイル読み込みエラー: ${file} - ${error.message}`);
      }
    }

    this.comprehensiveReport.summary.totalPhases = this.phases.size;
    log.success(`${this.phases.size}個のPhase結果を読み込みました`);
  }

  /**
   * ファイル名からPhase IDを抽出
   */
  extractPhaseId(filename) {
    const match = filename.match(/phase([0-9._]+)-/);
    return match ? match[1] : filename;
  }

  /**
   * 統合分析実行
   */
  async generateComprehensiveAnalysis() {
    log.info('統合分析実行中...');

    // 各Phaseデータの統合
    for (const [phaseId, phaseData] of this.phases) {
      this.comprehensiveReport.phases[phaseId] = {
        name: phaseData.name,
        timestamp: phaseData.timestamp,
        executionTime: phaseData.executionTime || 0,
        summary: phaseData.summary || {},
        issueCount: this.countIssues(phaseData),
        recommendationCount: this.countRecommendations(phaseData),
        score: this.extractScore(phaseData)
      };

      // 推奨事項の統合
      if (phaseData.recommendations && Array.isArray(phaseData.recommendations)) {
        this.comprehensiveReport.prioritizedRecommendations.push(
          ...phaseData.recommendations.map(rec => ({
            ...rec,
            phase: phaseId,
            phaseName: phaseData.name
          }))
        );
      }
    }

    // メトリクス集約
    this.aggregateMetrics();
    
    // 優先度付きレコメンデーション生成
    this.prioritizeRecommendations();
    
    // エグゼクティブサマリー生成
    this.generateExecutiveSummary();
    
    // 次のステップ生成
    this.generateNextSteps();

    log.success('統合分析完了');
  }

  /**
   * 問題数カウント
   */
  countIssues(phaseData) {
    if (phaseData.issues && Array.isArray(phaseData.issues)) {
      return phaseData.issues.length;
    }
    if (phaseData.summary && phaseData.summary.issuesFound) {
      return phaseData.summary.issuesFound;
    }
    return 0;
  }

  /**
   * 推奨事項数カウント
   */
  countRecommendations(phaseData) {
    if (phaseData.recommendations && Array.isArray(phaseData.recommendations)) {
      return phaseData.recommendations.length;
    }
    return 0;
  }

  /**
   * スコア抽出
   */
  extractScore(phaseData) {
    if (phaseData.summary && phaseData.summary.overallScore !== undefined) {
      return phaseData.summary.overallScore;
    }
    if (phaseData.summary && phaseData.summary.score !== undefined) {
      return phaseData.summary.score;
    }
    return null;
  }

  /**
   * メトリクス集約
   */
  aggregateMetrics() {
    let totalExecutionTime = 0;
    let totalIssues = 0;
    let totalRecommendations = 0;
    let scores = [];
    let criticalIssues = 0;

    for (const [phaseId, phaseInfo] of Object.entries(this.comprehensiveReport.phases)) {
      totalExecutionTime += phaseInfo.executionTime || 0;
      totalIssues += phaseInfo.issueCount || 0;
      totalRecommendations += phaseInfo.recommendationCount || 0;
      
      if (phaseInfo.score !== null) {
        scores.push(phaseInfo.score);
      }
    }

    // 重要度の高い推奨事項をカウント
    criticalIssues = this.comprehensiveReport.prioritizedRecommendations
      .filter(rec => rec.priority === 'high' || rec.priority === 'critical').length;

    this.comprehensiveReport.summary = {
      ...this.comprehensiveReport.summary,
      executionTime: totalExecutionTime,
      totalIssues: totalIssues,
      totalRecommendations: totalRecommendations,
      criticalIssues: criticalIssues,
      overallScore: scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0
    };

    // 詳細メトリクス
    this.comprehensiveReport.aggregatedMetrics = {
      performance: this.extractPerformanceMetrics(),
      quality: this.extractQualityMetrics(),
      security: this.extractSecurityMetrics(),
      coverage: this.extractCoverageMetrics()
    };
  }

  /**
   * パフォーマンスメトリクス抽出
   */
  extractPerformanceMetrics() {
    const phase25 = this.phases.get('2.5') || this.phases.get('2_5');
    if (!phase25) return null;

    return {
      bundleSize: phase25.summary?.bundleSize?.total || 0,
      memoryUsage: phase25.summary?.memoryUsage?.peak || 0,
      cpuUsage: phase25.summary?.cpuUsage?.average || 0,
      buildTime: phase25.summary?.buildTime?.total || 0,
      score: phase25.summary?.overallScore || 0
    };
  }

  /**
   * 品質メトリクス抽出
   */
  extractQualityMetrics() {
    const phase1 = this.phases.get('1');
    if (!phase1) return null;

    return {
      testCoverage: phase1.summary?.testCoverage || 0,
      codeQualityScore: phase1.summary?.codeQualityScore || 0,
      totalFiles: phase1.summary?.totalFiles || 0,
      testFiles: phase1.summary?.testFiles || 0,
      sourceFiles: phase1.summary?.sourceFiles || 0
    };
  }

  /**
   * セキュリティメトリクス抽出
   */
  extractSecurityMetrics() {
    const phase0 = this.phases.get('0');
    const phase2 = this.phases.get('2');
    
    const metrics = {};
    
    if (phase0) {
      metrics.dependencies = {
        vulnerabilities: phase0.summary?.vulnerabilities || {},
        licenseIssues: phase0.summary?.licenseIssues || 0,
        outdatedPackages: phase0.summary?.outdatedPackages || 0
      };
    }
    
    if (phase2) {
      metrics.codeAnalysis = {
        securityIssues: phase2.summary?.issuesFound || 0,
        testCoverage: phase2.summary?.testCoverage || 0
      };
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  /**
   * カバレッジメトリクス抽出
   */
  extractCoverageMetrics() {
    const phase1 = this.phases.get('1');
    if (!phase1) return null;

    return {
      overall: phase1.summary?.testCoverage || 0,
      security: this.phases.get('2')?.summary?.testCoverage || 0,
      target: 95,
      status: (phase1.summary?.testCoverage || 0) >= 80 ? 'good' : 'needs-improvement'
    };
  }

  /**
   * 推奨事項の優先度付け
   */
  prioritizeRecommendations() {
    // 優先度とインパクトに基づいてソート
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const impactWeight = { critical: 4, high: 3, medium: 2, low: 1 };

    this.comprehensiveReport.prioritizedRecommendations.sort((a, b) => {
      const aScore = (priorityWeight[a.priority] || 1) + (impactWeight[a.impact] || 1);
      const bScore = (priorityWeight[b.priority] || 1) + (impactWeight[b.impact] || 1);
      return bScore - aScore;
    });

    // トップ10の推奨事項のみを保持
    this.comprehensiveReport.prioritizedRecommendations = 
      this.comprehensiveReport.prioritizedRecommendations.slice(0, 10);
  }

  /**
   * エグゼクティブサマリー生成
   */
  generateExecutiveSummary() {
    const { summary, aggregatedMetrics } = this.comprehensiveReport;
    
    let executiveSummary = `# Rimor v0.7.0 包括的セルフ監査 エグゼクティブサマリー\n\n`;
    
    // 総合評価
    const scoreLevel = summary.overallScore >= 90 ? '優秀' : 
                       summary.overallScore >= 75 ? '良好' : 
                       summary.overallScore >= 60 ? '改善必要' : '要緊急対応';
    
    executiveSummary += `## 総合評価: ${summary.overallScore}/100 (${scoreLevel})\n\n`;
    
    // 主要な発見事項
    executiveSummary += `## 主要な発見事項\n\n`;
    
    if (summary.criticalIssues > 0) {
      executiveSummary += `⚠️ **緊急対応必要**: ${summary.criticalIssues}件の重要な問題が検出されました。\n\n`;
    }
    
    if (aggregatedMetrics.quality) {
      const coverage = aggregatedMetrics.quality.testCoverage;
      if (coverage < 80) {
        executiveSummary += `📊 **テストカバレッジ**: ${coverage.toFixed(1)}% (目標: 95%以上)\n\n`;
      }
    }
    
    if (aggregatedMetrics.security) {
      const vulns = aggregatedMetrics.security.dependencies?.vulnerabilities || {};
      const totalVulns = Object.values(vulns).reduce((sum, count) => sum + count, 0);
      if (totalVulns > 0) {
        executiveSummary += `🔒 **セキュリティ**: ${totalVulns}個の脆弱性が検出されました。\n\n`;
      }
    }
    
    if (aggregatedMetrics.performance) {
      const perfScore = aggregatedMetrics.performance.score;
      if (perfScore < 70) {
        executiveSummary += `⚡ **パフォーマンス**: スコア ${perfScore}/100 で改善が必要です。\n\n`;
      }
    }
    
    // 推奨アクション
    executiveSummary += `## 推奨アクション\n\n`;
    const topRecommendations = this.comprehensiveReport.prioritizedRecommendations.slice(0, 3);
    
    topRecommendations.forEach((rec, index) => {
      executiveSummary += `${index + 1}. **${rec.title}** (${rec.priority}優先度)\n`;
      executiveSummary += `   - ${rec.description}\n`;
      if (rec.phaseName) {
        executiveSummary += `   - 対象: ${rec.phaseName}\n`;
      }
      executiveSummary += `\n`;
    });

    this.comprehensiveReport.executiveSummary = executiveSummary;
  }

  /**
   * 次のステップ生成
   */
  generateNextSteps() {
    const nextSteps = [];
    
    // 緊急対応が必要な項目
    if (this.comprehensiveReport.summary.criticalIssues > 0) {
      nextSteps.push({
        priority: 'immediate',
        timeframe: '1週間以内',
        action: '重要な問題の修正',
        description: `${this.comprehensiveReport.summary.criticalIssues}件の重要な問題を優先的に修正`,
        responsible: 'Development Team'
      });
    }
    
    // テストカバレッジ改善
    const coverage = this.comprehensiveReport.aggregatedMetrics.coverage;
    if (coverage && coverage.overall < 90) {
      nextSteps.push({
        priority: 'high',
        timeframe: '2-3週間',
        action: 'テストカバレッジ向上',
        description: `現在${coverage.overall.toFixed(1)}%から95%への向上`,
        responsible: 'QA Team & Development Team'
      });
    }
    
    // セキュリティ対応
    const security = this.comprehensiveReport.aggregatedMetrics.security;
    if (security && security.dependencies) {
      const vulns = security.dependencies.vulnerabilities;
      const totalVulns = Object.values(vulns).reduce((sum, count) => sum + count, 0);
      
      if (totalVulns > 0) {
        nextSteps.push({
          priority: 'high',
          timeframe: '1-2週間',
          action: '依存関係セキュリティ修正',
          description: `${totalVulns}個の脆弱性のあるパッケージの更新`,
          responsible: 'Security Team & Development Team'
        });
      }
    }
    
    // パフォーマンス改善
    const performance = this.comprehensiveReport.aggregatedMetrics.performance;
    if (performance && performance.score < 80) {
      nextSteps.push({
        priority: 'medium',
        timeframe: '1ヶ月',
        action: 'パフォーマンス最適化',
        description: `バンドルサイズ、メモリ使用量、実行時間の最適化`,
        responsible: 'Development Team'
      });
    }
    
    // 継続的監視の設定
    nextSteps.push({
      priority: 'low',
      timeframe: '継続的',
      action: '定期監査の実施',
      description: '月次での自動監査実行とトレンド分析',
      responsible: 'DevOps Team'
    });

    this.comprehensiveReport.nextSteps = nextSteps;
  }

  /**
   * JSON形式で出力
   */
  async saveAsJson(outputPath) {
    const content = JSON.stringify(this.comprehensiveReport, null, 2);
    fs.writeFileSync(outputPath, content, 'utf8');
    log.success(`JSON統合レポート保存: ${outputPath}`);
  }

  /**
   * Markdown形式で出力
   */
  async saveAsMarkdown(outputPath) {
    let content = this.comprehensiveReport.executiveSummary;
    
    content += `\n## 詳細分析結果\n\n`;
    
    // Phase別サマリー
    content += `### Phase別実行結果\n\n`;
    for (const [phaseId, phaseInfo] of Object.entries(this.comprehensiveReport.phases)) {
      content += `#### Phase ${phaseId}: ${phaseInfo.name}\n`;
      content += `- **実行時間**: ${phaseInfo.executionTime}ms\n`;
      content += `- **問題検出**: ${phaseInfo.issueCount}件\n`;
      content += `- **推奨事項**: ${phaseInfo.recommendationCount}件\n`;
      if (phaseInfo.score !== null) {
        content += `- **スコア**: ${phaseInfo.score}/100\n`;
      }
      content += `\n`;
    }
    
    // 統合メトリクス
    if (this.comprehensiveReport.aggregatedMetrics.quality) {
      const quality = this.comprehensiveReport.aggregatedMetrics.quality;
      content += `### 品質メトリクス\n`;
      content += `- **テストカバレッジ**: ${quality.testCoverage.toFixed(1)}%\n`;
      content += `- **総ファイル数**: ${quality.totalFiles}\n`;
      content += `- **テストファイル数**: ${quality.testFiles}\n`;
      content += `- **ソースファイル数**: ${quality.sourceFiles}\n\n`;
    }
    
    if (this.comprehensiveReport.aggregatedMetrics.performance) {
      const perf = this.comprehensiveReport.aggregatedMetrics.performance;
      content += `### パフォーマンスメトリクス\n`;
      content += `- **バンドルサイズ**: ${this.formatBytes(perf.bundleSize)}\n`;
      content += `- **メモリ使用量**: ${this.formatBytes(perf.memoryUsage)}\n`;
      content += `- **CPU使用率**: ${perf.cpuUsage.toFixed(1)}%\n`;
      content += `- **ビルド時間**: ${(perf.buildTime/1000).toFixed(1)}秒\n\n`;
    }
    
    // 全推奨事項
    content += `## 全推奨事項 (優先度順)\n\n`;
    this.comprehensiveReport.prioritizedRecommendations.forEach((rec, index) => {
      content += `### ${index + 1}. ${rec.title}\n`;
      content += `**優先度**: ${rec.priority} | **カテゴリ**: ${rec.category} | **Phase**: ${rec.phaseName}\n\n`;
      content += `${rec.description}\n\n`;
      if (rec.suggestions && Array.isArray(rec.suggestions)) {
        content += `**具体的なアクション**:\n`;
        rec.suggestions.forEach(suggestion => {
          content += `- ${suggestion}\n`;
        });
        content += `\n`;
      }
    });
    
    // 次のステップ
    content += `## 次のステップ\n\n`;
    this.comprehensiveReport.nextSteps.forEach((step, index) => {
      content += `### ${index + 1}. ${step.action} (${step.priority}優先度)\n`;
      content += `- **期限**: ${step.timeframe}\n`;
      content += `- **担当**: ${step.responsible}\n`;
      content += `- **説明**: ${step.description}\n\n`;
    });
    
    content += `---\n*レポート生成日時: ${this.comprehensiveReport.timestamp}*\n`;
    content += `*総実行時間: ${this.comprehensiveReport.summary.executionTime}ms*\n`;
    
    fs.writeFileSync(outputPath, content, 'utf8');
    log.success(`Markdown統合レポート保存: ${outputPath}`);
  }

  /**
   * HTML形式で出力
   */
  async saveAsHtml(outputPath) {
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rimor v0.7.0 包括的セルフ監査レポート</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 40px; background: #f5f5f5; 
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .score { font-size: 3em; font-weight: bold; color: #2196F3; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; }
        .metric-value { font-size: 1.5em; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 0.9em; }
        .priority-high { border-left-color: #f44336; }
        .priority-medium { border-left-color: #ff9800; }
        .priority-low { border-left-color: #4caf50; }
        .recommendation { margin: 20px 0; padding: 20px; border-radius: 8px; background: #fff; border: 1px solid #ddd; }
        .phase-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        h1, h2, h3 { color: #333; }
        .status-good { color: #4caf50; }
        .status-warning { color: #ff9800; }
        .status-error { color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rimor v0.7.0 包括的セルフ監査レポート</h1>
            <div class="score">${this.comprehensiveReport.summary.overallScore}/100</div>
            <p>実行日時: ${new Date(this.comprehensiveReport.timestamp).toLocaleString('ja-JP')}</p>
        </div>
        
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value">${this.comprehensiveReport.summary.totalPhases}</div>
                <div class="metric-label">実行Phase数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.comprehensiveReport.summary.executionTime}ms</div>
                <div class="metric-label">総実行時間</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.comprehensiveReport.summary.totalIssues}</div>
                <div class="metric-label">検出問題数</div>
            </div>
            <div class="metric-card ${this.comprehensiveReport.summary.criticalIssues > 0 ? 'priority-high' : ''}">
                <div class="metric-value">${this.comprehensiveReport.summary.criticalIssues}</div>
                <div class="metric-label">重要問題数</div>
            </div>
        </div>

        <h2>Phase別実行結果</h2>
        <div class="phase-grid">
            ${Object.entries(this.comprehensiveReport.phases).map(([phaseId, phaseInfo]) => `
                <div class="metric-card">
                    <h3>Phase ${phaseId}: ${phaseInfo.name}</h3>
                    <p><strong>実行時間:</strong> ${phaseInfo.executionTime}ms</p>
                    <p><strong>問題検出:</strong> ${phaseInfo.issueCount}件</p>
                    <p><strong>推奨事項:</strong> ${phaseInfo.recommendationCount}件</p>
                    ${phaseInfo.score !== null ? `<p><strong>スコア:</strong> ${phaseInfo.score}/100</p>` : ''}
                </div>
            `).join('')}
        </div>

        <h2>優先度付き推奨事項</h2>
        ${this.comprehensiveReport.prioritizedRecommendations.map((rec, index) => `
            <div class="recommendation priority-${rec.priority}">
                <h3>${index + 1}. ${rec.title}</h3>
                <p><strong>優先度:</strong> ${rec.priority} | <strong>カテゴリ:</strong> ${rec.category} | <strong>Phase:</strong> ${rec.phaseName}</p>
                <p>${rec.description}</p>
                ${rec.suggestions ? `
                    <ul>
                        ${rec.suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `).join('')}

        <h2>次のステップ</h2>
        ${this.comprehensiveReport.nextSteps.map((step, index) => `
            <div class="recommendation priority-${step.priority}">
                <h3>${index + 1}. ${step.action}</h3>
                <p><strong>期限:</strong> ${step.timeframe} | <strong>担当:</strong> ${step.responsible}</p>
                <p>${step.description}</p>
            </div>
        `).join('')}
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>Rimor v0.7.0 改善版セルフ監査ワークフロー v2.0</p>
        </footer>
    </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf8');
    log.success(`HTML統合レポート保存: ${outputPath}`);
  }

  /**
   * CSV形式で出力
   */
  async saveAsCsv(outputPath) {
    const header = 'Phase,Priority,Category,Title,Description,Impact,Responsible\n';
    const rows = this.comprehensiveReport.prioritizedRecommendations.map(rec => {
      const nextStep = this.comprehensiveReport.nextSteps.find(step => 
        step.action.toLowerCase().includes(rec.category?.toLowerCase() || ''));
      
      return `"${rec.phaseName}","${rec.priority}","${rec.category}","${rec.title}","${rec.description}","${rec.impact}","${nextStep?.responsible || 'TBD'}"`;
    }).join('\n');
    
    const content = header + rows;
    fs.writeFileSync(outputPath, content, 'utf8');
    log.success(`CSV統合レポート保存: ${outputPath}`);
  }

  /**
   * バイト数フォーマット
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 全形式で出力
   */
  async saveAllFormats() {
    const baseFilename = `comprehensive-audit-summary-${argv.timestamp}`;
    const outputDir = argv['output-dir'];

    const formats = argv.format === 'all' 
      ? ['json', 'markdown', 'html', 'csv']
      : [argv.format];

    for (const format of formats) {
      const filename = format === 'markdown' ? `${baseFilename}.md` : `${baseFilename}.${format}`;
      const outputPath = path.join(outputDir, filename);

      switch (format) {
        case 'json':
          await this.saveAsJson(outputPath);
          break;
        case 'markdown':
          await this.saveAsMarkdown(outputPath);
          break;
        case 'html':
          await this.saveAsHtml(outputPath);
          break;
        case 'csv':
          await this.saveAsCsv(outputPath);
          break;
      }
    }

    // メインファイル（タイムスタンプなし）も作成
    if (formats.includes('json')) {
      await this.saveAsJson(path.join(outputDir, 'comprehensive-audit-summary.json'));
    }
    if (formats.includes('markdown')) {
      await this.saveAsMarkdown(path.join(outputDir, 'comprehensive-audit-summary.md'));
    }
  }
}

// ====================================================================
// メイン実行
// ====================================================================

async function main() {
  try {
    log.info('統合レポート生成開始');
    
    const generator = new AuditReportGenerator();
    
    await generator.loadPhaseResults();
    await generator.generateComprehensiveAnalysis();
    await generator.saveAllFormats();
    
    log.success(`統合レポート生成完了: ${argv['output-dir']}/`);
    
    // サマリー表示
    const report = generator.comprehensiveReport;
    console.log(`\n📊 監査結果サマリー:`);
    console.log(`   総合スコア: ${report.summary.overallScore}/100`);
    console.log(`   実行Phase数: ${report.summary.totalPhases}`);
    console.log(`   検出問題数: ${report.summary.totalIssues}`);
    console.log(`   重要問題数: ${report.summary.criticalIssues}`);
    console.log(`   総実行時間: ${report.summary.executionTime}ms`);
    
  } catch (error) {
    log.error(`統合レポート生成エラー: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = { AuditReportGenerator };