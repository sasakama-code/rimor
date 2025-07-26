#!/usr/bin/env node

/**
 * Phase 1: 基本品質分析スクリプト (改善版)
 * 
 * 従来のRimor分析機能を活用した基本品質監査
 * - 静的解析 (Rimor analyze)
 * - テストカバレッジ分析
 * - コード品質指標
 * - ファイル構造分析
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// 非同期版のexecを作成
const execAsync = promisify(exec);

// ====================================================================
// 設定とユーティリティ
// ====================================================================

const argv = yargs(hideBin(process.argv))
  .option('output', {
    alias: 'o',
    type: 'string',
    description: '出力ファイルパス',
    default: 'phase1-basic.json'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['json', 'markdown', 'html', 'csv'],
    description: '出力形式',
    default: 'json'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: '詳細ログ出力',
    default: false
  })
  .option('parallel', {
    type: 'boolean',
    description: '並列実行',
    default: true
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
// 基本品質分析クラス
// ====================================================================

class BasicQualityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      phase: '1',
      name: '基本品質分析',
      summary: {
        totalFiles: 0,
        testFiles: 0,
        sourceFiles: 0,
        issuesFound: 0,
        testCoverage: 0,
        codeQualityScore: 0,
        overallScore: 0
      },
      details: {
        rimorAnalysis: null,
        testCoverageAnalysis: null,
        fileStructureAnalysis: null,
        codeMetrics: null
      },
      issues: [],
      recommendations: [],
      executionTime: 0
    };
  }

  /**
   * Rimor基本分析実行
   */
  async runRimorAnalysis() {
    log.info('Rimor基本分析実行中...');
    
    try {
      // 全プロジェクト分析
      const fullAnalysisCmd = 'node dist/index.js analyze ./src --format=json';
      const { stdout: fullAnalysisOutput } = await execAsync(fullAnalysisCmd, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      });
      
      const fullAnalysis = JSON.parse(fullAnalysisOutput);
      
      // セキュリティディレクトリ特化分析
      let securityAnalysis = null;
      try {
        const securityAnalysisCmd = 'node dist/index.js analyze ./src/security --format=json';
        const { stdout: securityAnalysisOutput } = await execAsync(securityAnalysisCmd, { 
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
        });
        securityAnalysis = JSON.parse(securityAnalysisOutput);
      } catch (err) {
        log.warning(`セキュリティディレクトリ分析をスキップしました: ${err.message}`);
      }

      this.results.details.rimorAnalysis = {
        success: true,
        fullProject: fullAnalysis,
        security: securityAnalysis,
        analysisTime: fullAnalysis.performance?.executionTime || 0
      };

      // サマリー情報の更新
      this.results.summary.totalFiles = fullAnalysis.summary?.totalFiles || 0;
      this.results.summary.issuesFound = fullAnalysis.summary?.issuesFound || 0;
      this.results.summary.testCoverage = fullAnalysis.summary?.testCoverage || 0;

      // 問題の統合
      if (fullAnalysis.issues && Array.isArray(fullAnalysis.issues)) {
        this.results.issues = [...this.results.issues, ...fullAnalysis.issues];
      }
      
      if (securityAnalysis && securityAnalysis.issues && Array.isArray(securityAnalysis.issues)) {
        this.results.issues = [...this.results.issues, ...securityAnalysis.issues.map(issue => ({
          ...issue,
          category: 'security'
        }))];
      }

      // 品質スコア算出
      const testCoverageScore = Math.min(100, (this.results.summary.testCoverage / 95) * 100);
      const issueScore = Math.max(0, 100 - (this.results.summary.issuesFound * 5));
      this.results.summary.codeQualityScore = Math.round((testCoverageScore + issueScore) / 2);

      // 推奨事項生成
      if (this.results.summary.testCoverage < 80) {
        this.results.recommendations.push({
          priority: 'high',
          category: 'testing',
          title: `テストカバレッジが低い (${this.results.summary.testCoverage}%)`,
          description: '80%以上のテストカバレッジを目標にしてください',
          suggestions: [
            '未テストファイルの特定とテスト作成',
            'エッジケースのテスト追加',
            'テストの品質向上'
          ],
          impact: 'high'
        });
      }

      if (this.results.summary.issuesFound > 10) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'quality',
          title: `多数の品質問題が検出されました (${this.results.summary.issuesFound}件)`,
          description: '段階的に問題を修正していくことを推奨します',
          suggestions: [
            '高優先度の問題から修正',
            'コードレビュープロセスの強化',
            '自動化された品質チェックの導入'
          ],
          impact: 'medium'
        });
      }

      log.success(`Rimor分析完了: ${this.results.summary.totalFiles}ファイル、${this.results.summary.issuesFound}件の問題検出`);
      
    } catch (error) {
      log.error(`Rimor分析エラー: ${error.message}`);
      this.results.details.rimorAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * テストカバレッジ詳細分析
   */
  async analyzeTestCoverage() {
    log.info('テストカバレッジ詳細分析実行中...');
    
    try {
      // Jestでカバレッジ取得（存在する場合）
      let jestCoverage = null;
      try {
        const jestCmd = 'npm test -- --coverage --coverageReporters=json --passWithNoTests';
        await execAsync(jestCmd, { 
          timeout: 60000, // 60秒でタイムアウト
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
        });
        
        // coverage/coverage-final.jsonを読み込み
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
        if (fs.existsSync(coveragePath)) {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          jestCoverage = this.analyzeCoverageData(coverageData);
        }
      } catch (err) {
        log.info('Jestカバレッジデータの取得をスキップしました');
      }

      // ファイル存在率による簡易カバレッジ算出
      const fileStructure = this.analyzeFileStructure();
      const simpleTestCoverage = this.calculateSimpleTestCoverage(fileStructure);

      this.results.details.testCoverageAnalysis = {
        success: true,
        jestCoverage: jestCoverage,
        simpleCoverage: simpleTestCoverage,
        fileStructure: fileStructure
      };

      // より正確なテストカバレッジを更新
      if (jestCoverage && jestCoverage.overall) {
        this.results.summary.testCoverage = jestCoverage.overall.lines || this.results.summary.testCoverage;
      } else {
        this.results.summary.testCoverage = simpleTestCoverage.coveragePercentage;
      }

      log.success(`テストカバレッジ分析完了: ${this.results.summary.testCoverage.toFixed(1)}%`);
      
    } catch (error) {
      log.error(`テストカバレッジ分析エラー: ${error.message}`);
      this.results.details.testCoverageAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ファイル構造分析
   */
  analyzeFileStructure() {
    const structure = {
      srcFiles: [],
      testFiles: [],
      configFiles: [],
      docFiles: []
    };

    const walkDir = (dir, category = 'src') => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (file === 'node_modules' || file === '.git') continue;
          
          let newCategory = category;
          if (file === 'test' || file === '__tests__') newCategory = 'test';
          else if (file === 'docs') newCategory = 'doc';
          
          walkDir(filePath, newCategory);
        } else {
          const fileInfo = {
            path: path.relative(process.cwd(), filePath),
            size: stat.size,
            extension: path.extname(file),
            category: category
          };

          if (file.match(/\.(test|spec)\.(js|ts)$/) || category === 'test') {
            structure.testFiles.push(fileInfo);
          } else if (file.match(/\.(js|ts)$/) && !file.includes('.d.ts')) {
            structure.srcFiles.push(fileInfo);
          } else if (file.match(/\.(json|yml|yaml|toml)$/)) {
            structure.configFiles.push(fileInfo);
          } else if (file.match(/\.(md|txt|rst)$/)) {
            structure.docFiles.push(fileInfo);
          }
        }
      }
    };

    walkDir('./src', 'src');
    walkDir('./test', 'test');
    walkDir('./docs', 'doc');
    walkDir('./', 'config');

    return structure;
  }

  /**
   * 簡易テストカバレッジ算出
   */
  calculateSimpleTestCoverage(structure) {
    const srcFiles = structure.srcFiles.filter(f => f.path.startsWith('src/'));
    const testFiles = structure.testFiles;
    
    let coveredFiles = 0;
    
    for (const srcFile of srcFiles) {
      const srcName = path.basename(srcFile.path, path.extname(srcFile.path));
      const srcDir = path.dirname(srcFile.path);
      
      // 対応するテストファイルを探す
      const hasTest = testFiles.some(testFile => {
        const testName = path.basename(testFile.path)
          .replace(/\.(test|spec)\.(js|ts)$/, '');
        
        return testName === srcName || 
               testFile.path.includes(srcName) ||
               srcFile.path.includes(testName);
      });
      
      if (hasTest) coveredFiles++;
    }
    
    const coveragePercentage = srcFiles.length > 0 
      ? (coveredFiles / srcFiles.length) * 100 
      : 0;

    return {
      totalSrcFiles: srcFiles.length,
      coveredFiles: coveredFiles,
      coveragePercentage: coveragePercentage,
      uncoveredFiles: srcFiles.filter(srcFile => {
        const srcName = path.basename(srcFile.path, path.extname(srcFile.path));
        return !testFiles.some(testFile => {
          const testName = path.basename(testFile.path)
            .replace(/\.(test|spec)\.(js|ts)$/, '');
          return testName === srcName || 
                 testFile.path.includes(srcName) ||
                 srcFile.path.includes(testName);
        });
      }).map(f => f.path)
    };
  }

  /**
   * Jestカバレッジデータ分析
   */
  analyzeCoverageData(coverageData) {
    const files = Object.keys(coverageData);
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalLines = 0;
    let coveredLines = 0;

    for (const file of files) {
      const fileCoverage = coverageData[file];
      
      if (fileCoverage.s) {
        totalStatements += Object.keys(fileCoverage.s).length;
        coveredStatements += Object.values(fileCoverage.s).filter(count => count > 0).length;
      }
      
      if (fileCoverage.f) {
        totalFunctions += Object.keys(fileCoverage.f).length;
        coveredFunctions += Object.values(fileCoverage.f).filter(count => count > 0).length;
      }
      
      if (fileCoverage.b) {
        const branches = Object.values(fileCoverage.b);
        for (const branch of branches) {
          totalBranches += branch.length;
          coveredBranches += branch.filter(count => count > 0).length;
        }
      }
      
      if (fileCoverage.statementMap) {
        const lines = new Set();
        for (const stmt of Object.values(fileCoverage.statementMap)) {
          for (let line = stmt.start.line; line <= stmt.end.line; line++) {
            lines.add(line);
          }
        }
        totalLines += lines.size;
        
        const coveredLines = new Set();
        for (const [stmtId, count] of Object.entries(fileCoverage.s)) {
          if (count > 0) {
            const stmt = fileCoverage.statementMap[stmtId];
            for (let line = stmt.start.line; line <= stmt.end.line; line++) {
              coveredLines.add(line);
            }
          }
        }
        coveredLines += coveredLines.size;
      }
    }

    return {
      overall: {
        statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
        functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
        branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
        lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      },
      fileCount: files.length,
      details: {
        totalStatements,
        coveredStatements,
        totalFunctions,
        coveredFunctions,
        totalBranches,
        coveredBranches,
        totalLines,
        coveredLines
      }
    };
  }

  /**
   * コードメトリクス分析
   */
  async analyzeCodeMetrics() {
    log.info('コードメトリクス分析実行中...');
    
    try {
      const fileStructure = this.results.details.testCoverageAnalysis?.fileStructure 
        || this.analyzeFileStructure();

      const metrics = {
        fileCount: {
          source: fileStructure.srcFiles.length,
          test: fileStructure.testFiles.length,
          config: fileStructure.configFiles.length,
          doc: fileStructure.docFiles.length
        },
        codeSize: {
          totalBytes: 0,
          averageFileSize: 0,
          largestFiles: []
        },
        testRatio: 0,
        complexity: {
          estimated: 'medium',
          score: 75
        }
      };

      // ファイルサイズ分析
      const allFiles = [...fileStructure.srcFiles, ...fileStructure.testFiles];
      metrics.codeSize.totalBytes = allFiles.reduce((sum, file) => sum + file.size, 0);
      metrics.codeSize.averageFileSize = allFiles.length > 0 
        ? metrics.codeSize.totalBytes / allFiles.length 
        : 0;
      
      metrics.codeSize.largestFiles = allFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .map(file => ({
          path: file.path,
          size: file.size
        }));

      // テスト比率
      metrics.testRatio = metrics.fileCount.source > 0 
        ? (metrics.fileCount.test / metrics.fileCount.source) * 100 
        : 0;

      // 複雑度推定（ファイル数とサイズから）
      if (metrics.fileCount.source > 100 || metrics.codeSize.averageFileSize > 10000) {
        metrics.complexity.estimated = 'high';
        metrics.complexity.score = 60;
      } else if (metrics.fileCount.source > 50 || metrics.codeSize.averageFileSize > 5000) {
        metrics.complexity.estimated = 'medium';
        metrics.complexity.score = 75;
      } else {
        metrics.complexity.estimated = 'low';
        metrics.complexity.score = 90;
      }

      this.results.details.codeMetrics = {
        success: true,
        metrics: metrics
      };

      this.results.summary.sourceFiles = metrics.fileCount.source;
      this.results.summary.testFiles = metrics.fileCount.test;

      // 推奨事項
      if (metrics.testRatio < 50) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'testing',
          title: `テストファイル比率が低い (${metrics.testRatio.toFixed(1)}%)`,
          description: 'ソースファイル数に対してテストファイルが不足しています',
          suggestions: [
            '主要機能のテストファイル作成',
            'テスト作成のガイドライン策定',
            'テストファーストな開発プロセスの導入'
          ],
          impact: 'medium'
        });
      }

      if (metrics.codeSize.averageFileSize > 8000) {
        this.results.recommendations.push({
          priority: 'low',
          category: 'maintainability',
          title: `ファイルサイズが大きすぎます (平均 ${Math.round(metrics.codeSize.averageFileSize)}バイト)`,
          description: '大きなファイルは保守性を低下させる可能性があります',
          suggestions: [
            'ファイルの分割',
            '単一責任原則の適用',
            'モジュール化の促進'
          ],
          impact: 'low'
        });
      }

      log.success(`コードメトリクス分析完了: ${metrics.fileCount.source}ソースファイル、${metrics.fileCount.test}テストファイル`);
      
    } catch (error) {
      log.error(`コードメトリクス分析エラー: ${error.message}`);
      this.results.details.codeMetrics = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 全監査実行
   */
  async runAll() {
    const startTime = Date.now();
    
    log.info('Phase 1: 基本品質分析開始');

    if (argv.parallel) {
      // 順番に依存する処理があるため、一部のみ並列実行
      await this.runRimorAnalysis();
      
      await Promise.all([
        this.analyzeTestCoverage(),
        this.analyzeCodeMetrics()
      ]);
    } else {
      // 順次実行
      await this.runRimorAnalysis();
      await this.analyzeTestCoverage();
      await this.analyzeCodeMetrics();
    }

    this.results.executionTime = Date.now() - startTime;
    
    // 総合スコア算出
    const scores = [
      this.results.summary.codeQualityScore,
      this.results.details.codeMetrics?.metrics?.complexity?.score || 75
    ].filter(score => score > 0);
    
    this.results.summary.overallScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    log.success(`Phase 1完了: ${this.results.executionTime}ms (総合スコア: ${this.results.summary.overallScore})`);
    
    return this.results;
  }

  /**
   * 結果を指定形式で出力
   */
  async saveResults(outputPath, format) {
    let content;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(this.results, null, 2);
        break;
        
      case 'markdown':
        content = this.generateMarkdownReport();
        break;
        
      case 'html':
        content = this.generateHtmlReport();
        break;
        
      case 'csv':
        content = this.generateCsvReport();
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
    log.success(`結果保存: ${outputPath}`);
  }

  /**
   * Markdownレポート生成
   */
  generateMarkdownReport() {
    const { summary } = this.results;
    
    return `# Phase 1: 基本品質分析結果

## 総合スコア: ${summary.overallScore}/100

## プロジェクト概要
- **総ファイル数**: ${summary.totalFiles}
- **ソースファイル**: ${summary.sourceFiles}
- **テストファイル**: ${summary.testFiles}
- **検出された問題**: ${summary.issuesFound}件
- **テストカバレッジ**: ${summary.testCoverage.toFixed(1)}%
- **コード品質スコア**: ${summary.codeQualityScore}/100

## 推奨事項
${this.results.recommendations.map(rec => 
  `### ${rec.title} (${rec.priority})\n${rec.description}\n${rec.suggestions ? rec.suggestions.map(s => `- ${s}`).join('\n') : ''}`
).join('\n\n')}

## 検出された問題
${this.results.issues.slice(0, 10).map(issue => 
  `- **${issue.file || 'Unknown'}**: ${issue.message || issue.description || 'No description'}`
).join('\n')}

${this.results.issues.length > 10 ? `\n*...他 ${this.results.issues.length - 10}件*` : ''}

---
*実行時間: ${this.results.executionTime}ms*
`;
  }

  /**
   * HTMLレポート生成  
   */
  generateHtmlReport() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase 1: 基本品質分析結果</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .score { font-size: 2em; font-weight: bold; }
        .issue { margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 3px; }
        .high { color: #d32f2f; }
        .medium { color: #f57c00; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Phase 1: 基本品質分析結果</h1>
    <div class="summary">
        <div class="score">総合スコア: ${this.results.summary.overallScore}/100</div>
        <h2>プロジェクト概要</h2>
        <p>総ファイル数: ${this.results.summary.totalFiles}</p>
        <p>検出された問題: ${this.results.summary.issuesFound}件</p>
        <p>テストカバレッジ: ${this.results.summary.testCoverage.toFixed(1)}%</p>
    </div>
    <h2>推奨事項</h2>
    ${this.results.recommendations.map(rec => 
      `<div class="recommendation ${rec.priority}">
         <h3>${rec.title}</h3>
         <p>${rec.description}</p>
       </div>`
    ).join('')}
</body>
</html>`;
  }

  /**
   * CSVレポート生成
   */
  generateCsvReport() {
    const header = 'Type,Priority,Title,Description,Impact\n';
    const rows = this.results.recommendations.map(rec => 
      `"${rec.category}","${rec.priority}","${rec.title}","${rec.description}","${rec.impact}"`
    ).join('\n');
    
    return header + rows;
  }
}

// ====================================================================
// メイン実行
// ====================================================================

async function main() {
  try {
    const auditor = new BasicQualityAuditor();
    const results = await auditor.runAll();
    
    await auditor.saveResults(argv.output, argv.format);
    
    // 低スコアの場合は警告表示
    if (results.summary.overallScore < 70) {
      log.warning(`品質スコアが低いです (${results.summary.overallScore}/100)。詳細は ${argv.output} を確認してください。`);
    }
    
  } catch (error) {
    log.error(`Phase 1実行エラー: ${error.message}`);
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = { BasicQualityAuditor };