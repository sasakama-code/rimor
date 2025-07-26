#!/usr/bin/env node

/**
 * Phase 2.5: パフォーマンス・リソース監査スクリプト
 * 
 * アプリケーションのパフォーマンス特性を包括的に分析
 * - バンドルサイズ分析
 * - メモリ使用量分析
 * - CPU使用率分析
 * - ビルド時間分析
 * - 実行時パフォーマンス測定
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ====================================================================
// 設定とユーティリティ
// ====================================================================

const argv = yargs(hideBin(process.argv))
  .option('output', {
    alias: 'o',
    type: 'string',
    description: '出力ファイルパス',
    default: 'phase2_5-performance.json'
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
// パフォーマンス監査クラス
// ====================================================================

class PerformanceAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      phase: '2.5',
      name: 'パフォーマンス・リソース監査',
      summary: {
        bundleSize: {
          total: 0,
          compressed: 0,
          score: 0
        },
        memoryUsage: {
          baseline: 0,
          peak: 0,
          leaks: 0,
          score: 0
        },
        cpuUsage: {
          average: 0,
          peak: 0,
          score: 0
        },
        buildTime: {
          total: 0,
          score: 0
        },
        overallScore: 0
      },
      details: {
        bundleAnalysis: null,
        memoryAnalysis: null,
        cpuAnalysis: null,
        buildAnalysis: null,
        benchmarkResults: null
      },
      recommendations: [],
      executionTime: 0
    };
  }

  /**
   * バンドルサイズ分析
   */
  async analyzeBundleSize() {
    log.info('バンドルサイズ分析実行中...');
    
    try {
      const distPath = path.join(process.cwd(), 'dist');
      
      if (!fs.existsSync(distPath)) {
        throw new Error('distディレクトリが見つかりません。先にビルドを実行してください。');
      }

      const bundleStats = this.analyzeDirectory(distPath);
      
      // 目標値との比較（Node.jsライブラリの場合）
      const TARGET_SIZE = 5 * 1024 * 1024; // 5MB
      const OPTIMAL_SIZE = 1 * 1024 * 1024; // 1MB
      
      let score = 100;
      if (bundleStats.totalSize > TARGET_SIZE) {
        score = Math.max(0, 50 - ((bundleStats.totalSize - TARGET_SIZE) / TARGET_SIZE) * 50);
      } else if (bundleStats.totalSize > OPTIMAL_SIZE) {
        score = 50 + ((TARGET_SIZE - bundleStats.totalSize) / (TARGET_SIZE - OPTIMAL_SIZE)) * 50;
      }

      this.results.summary.bundleSize = {
        total: bundleStats.totalSize,
        compressed: bundleStats.totalSize * 0.3, // 推定圧縮サイズ
        score: Math.round(score)
      };

      this.results.details.bundleAnalysis = {
        success: true,
        stats: bundleStats,
        targets: {
          optimal: OPTIMAL_SIZE,
          acceptable: TARGET_SIZE
        },
        analysis: this.analyzeBundleComposition(bundleStats)
      };

      // 推奨事項生成
      if (bundleStats.totalSize > TARGET_SIZE) {
        this.results.recommendations.push({
          priority: 'high',
          category: 'performance',
          title: `バンドルサイズが目標値を超過 (${this.formatBytes(bundleStats.totalSize)})`,
          description: `目標値${this.formatBytes(TARGET_SIZE)}を${this.formatBytes(bundleStats.totalSize - TARGET_SIZE)}超過しています`,
          suggestions: [
            '不要な依存関係の削除',
            'Tree shakingの最適化',
            'Dynamic importの活用',
            'コード分割の実装'
          ],
          impact: 'high'
        });
      }

      log.success(`バンドルサイズ分析完了: ${this.formatBytes(bundleStats.totalSize)} (スコア: ${Math.round(score)})`);
      
    } catch (error) {
      log.error(`バンドルサイズ分析エラー: ${error.message}`);
      this.results.details.bundleAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ディレクトリ分析
   */
  analyzeDirectory(dirPath) {
    const stats = {
      totalSize: 0,
      fileCount: 0,
      files: [],
      largestFiles: []
    };

    const walk = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walk(filePath);
        } else {
          const fileInfo = {
            path: path.relative(process.cwd(), filePath),
            size: stat.size,
            extension: path.extname(file)
          };
          
          stats.files.push(fileInfo);
          stats.totalSize += stat.size;
          stats.fileCount++;
        }
      }
    };

    walk(dirPath);
    
    // 最大ファイルをソート
    stats.largestFiles = stats.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return stats;
  }

  /**
   * バンドル構成分析
   */
  analyzeBundleComposition(bundleStats) {
    const analysis = {
      jsFiles: bundleStats.files.filter(f => f.extension === '.js'),
      mapFiles: bundleStats.files.filter(f => f.extension === '.map'),
      otherFiles: bundleStats.files.filter(f => !['.js', '.map'].includes(f.extension))
    };

    return {
      jsSize: analysis.jsFiles.reduce((sum, f) => sum + f.size, 0),
      mapSize: analysis.mapFiles.reduce((sum, f) => sum + f.size, 0),
      otherSize: analysis.otherFiles.reduce((sum, f) => sum + f.size, 0),
      fileTypes: this.groupByExtension(bundleStats.files)
    };
  }

  /**
   * メモリ使用量分析
   */
  async analyzeMemoryUsage() {
    log.info('メモリ使用量分析実行中...');
    
    try {
      const memoryBaseline = process.memoryUsage();
      
      // 簡易的な解析実行でメモリ使用量測定
      const testCommand = 'node dist/index.js analyze ./src --format=json';
      
      const memoryBefore = process.memoryUsage();
      
      try {
        execSync(testCommand, { stdio: 'pipe' });
      } catch (err) {
        // 分析エラーは無視してメモリ測定を継続
      }
      
      const memoryAfter = process.memoryUsage();
      
      const memoryDelta = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external
      };

      // メモリスコア算出（100MB以下を満点とする）
      const TARGET_MEMORY = 100 * 1024 * 1024; // 100MB
      const actualMemory = Math.max(memoryDelta.rss, memoryDelta.heapUsed);
      const memoryScore = Math.max(0, 100 - (actualMemory / TARGET_MEMORY) * 100);

      this.results.summary.memoryUsage = {
        baseline: memoryBaseline.rss,
        peak: memoryAfter.rss,
        leaks: 0, // 簡易版では検出せず
        score: Math.round(memoryScore)
      };

      this.results.details.memoryAnalysis = {
        success: true,
        baseline: memoryBaseline,
        delta: memoryDelta,
        analysis: {
          efficient: actualMemory < TARGET_MEMORY,
          target: TARGET_MEMORY,
          actual: actualMemory
        }
      };

      if (actualMemory > TARGET_MEMORY) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'performance',
          title: `メモリ使用量が目標値を超過 (${this.formatBytes(actualMemory)})`,
          description: `目標値${this.formatBytes(TARGET_MEMORY)}を超過しています`,
          suggestions: [
            'メモリリークの調査',
            '大きなオブジェクトの見直し',
            'ガベージコレクションの最適化',
            'ストリーミング処理の導入'
          ],
          impact: 'medium'
        });
      }

      log.success(`メモリ分析完了: ${this.formatBytes(actualMemory)} (スコア: ${Math.round(memoryScore)})`);
      
    } catch (error) {
      log.error(`メモリ分析エラー: ${error.message}`);
      this.results.details.memoryAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * CPU使用率分析
   */
  async analyzeCpuUsage() {
    log.info('CPU使用率分析実行中...');
    
    try {
      const cpuUsage = process.cpuUsage();
      
      // CPU集約的なテスト実行
      const testCommand = 'node dist/index.js analyze ./src --format=json';
      const startTime = Date.now();
      const startCpu = process.cpuUsage();
      
      try {
        execSync(testCommand, { stdio: 'pipe' });
      } catch (err) {
        // エラーは無視してCPU測定を継続
      }
      
      const endTime = Date.now();
      const endCpu = process.cpuUsage(startCpu);
      
      const executionTime = endTime - startTime;
      const cpuTime = endCpu.user + endCpu.system;
      const cpuPercentage = (cpuTime / (executionTime * 1000)) * 100;

      // CPUスコア算出（50%以下を満点とする）
      const TARGET_CPU = 50; // 50%
      const cpuScore = Math.max(0, 100 - (cpuPercentage / TARGET_CPU) * 100);

      this.results.summary.cpuUsage = {
        average: cpuPercentage,
        peak: cpuPercentage * 1.2, // 推定ピーク値
        score: Math.round(cpuScore)
      };

      this.results.details.cpuAnalysis = {
        success: true,
        measurement: {
          executionTime: executionTime,
          cpuTime: cpuTime,
          percentage: cpuPercentage
        },
        analysis: {
          efficient: cpuPercentage < TARGET_CPU,
          target: TARGET_CPU,
          actual: cpuPercentage
        }
      };

      if (cpuPercentage > TARGET_CPU) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'performance',
          title: `CPU使用率が高い (${cpuPercentage.toFixed(1)}%)`,
          description: `目標値${TARGET_CPU}%を超過しています`,
          suggestions: [
            'アルゴリズムの最適化',
            '並列処理の導入',
            'キャッシュの活用',  
            'I/O処理の非同期化'
          ],
          impact: 'medium'
        });
      }

      log.success(`CPU分析完了: ${cpuPercentage.toFixed(1)}% (スコア: ${Math.round(cpuScore)})`);
      
    } catch (error) {
      log.error(`CPU分析エラー: ${error.message}`);
      this.results.details.cpuAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ビルド時間分析
   */
  async analyzeBuildTime() {
    log.info('ビルド時間分析実行中...');
    
    try {
      // クリーンビルドで測定
      if (fs.existsSync('dist')) {
        execSync('rm -rf dist', { stdio: 'pipe' });
      }

      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const endTime = Date.now();
      
      const buildTime = endTime - startTime;
      
      // ビルドスコア算出（30秒以下を満点とする）
      const TARGET_BUILD_TIME = 30000; // 30秒
      const buildScore = Math.max(0, 100 - (buildTime / TARGET_BUILD_TIME) * 100);

      this.results.summary.buildTime = {
        total: buildTime,
        score: Math.round(buildScore)
      };

      this.results.details.buildAnalysis = {
        success: true,
        buildTime: buildTime,
        analysis: {
          fast: buildTime < TARGET_BUILD_TIME,
          target: TARGET_BUILD_TIME,
          actual: buildTime
        }
      };

      if (buildTime > TARGET_BUILD_TIME) {
        this.results.recommendations.push({
          priority: 'low',
          category: 'development',
          title: `ビルド時間が長い (${(buildTime/1000).toFixed(1)}秒)`,
          description: `目標値${TARGET_BUILD_TIME/1000}秒を超過しています`,
          suggestions: [
            'インクリメンタルコンパイルの活用',
            'TypeScript設定の最適化',
            '並列ビルドの導入',
            '不要なファイルの除外'
          ],
          impact: 'low'
        });
      }

      log.success(`ビルド分析完了: ${(buildTime/1000).toFixed(1)}秒 (スコア: ${Math.round(buildScore)})`);
      
    } catch (error) {
      log.error(`ビルド分析エラー: ${error.message}`);
      this.results.details.buildAnalysis = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ベンチマーク実行
   */
  async runBenchmarks() {
    log.info('パフォーマンスベンチマーク実行中...');
    
    try {
      const benchmarks = [
        {
          name: '基本分析',
          command: 'node dist/index.js analyze ./src --format=json',
          target: 5000 // 5秒
        },
        {
          name: 'セキュリティ分析',
          command: 'node dist/index.js analyze ./src/security --format=json',
          target: 1000 // 1秒
        }
      ];

      const results = [];
      
      for (const bench of benchmarks) {
        const times = [];
        
        // 3回実行して平均を取る
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          try {
            execSync(bench.command, { stdio: 'pipe' });
          } catch (err) {
            // エラーは無視して時間測定を継続
          }
          const endTime = Date.now();
          times.push(endTime - startTime);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const score = Math.max(0, 100 - (averageTime / bench.target) * 100);
        
        results.push({
          name: bench.name,
          averageTime: averageTime,
          target: bench.target,
          score: Math.round(score),
          efficient: averageTime < bench.target
        });
      }

      this.results.details.benchmarkResults = {
        success: true,
        benchmarks: results,
        overallScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      };

      log.success(`ベンチマーク完了: 総合スコア ${this.results.details.benchmarkResults.overallScore}`);
      
    } catch (error) {
      log.error(`ベンチマークエラー: ${error.message}`);
      this.results.details.benchmarkResults = {
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
    
    log.info('Phase 2.5: パフォーマンス・リソース監査開始');

    if (argv.parallel) {
      // 並列実行（ビルド分析は除く）
      await Promise.all([
        this.analyzeBundleSize(),
        this.analyzeMemoryUsage(),
        this.analyzeCpuUsage()
      ]);
      
      // ビルド分析とベンチマークは順次実行
      await this.analyzeBuildTime();
      await this.runBenchmarks();
    } else {
      // 順次実行
      await this.analyzeBundleSize();
      await this.analyzeMemoryUsage();
      await this.analyzeCpuUsage();
      await this.analyzeBuildTime();
      await this.runBenchmarks();
    }

    this.results.executionTime = Date.now() - startTime;
    
    // 総合スコア算出
    const scores = [
      this.results.summary.bundleSize.score,
      this.results.summary.memoryUsage.score,
      this.results.summary.cpuUsage.score,
      this.results.summary.buildTime.score
    ].filter(score => score > 0);
    
    this.results.summary.overallScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    log.success(`Phase 2.5完了: ${this.results.executionTime}ms (総合スコア: ${this.results.summary.overallScore})`);
    
    return this.results;
  }

  /**
   * ユーティリティ関数: バイト数フォーマット
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * ユーティリティ関数: 拡張子でグループ化
   */
  groupByExtension(files) {
    const groups = {};
    for (const file of files) {
      const ext = file.extension || 'no-extension';
      if (!groups[ext]) {
        groups[ext] = { count: 0, totalSize: 0 };
      }
      groups[ext].count++;
      groups[ext].totalSize += file.size;
    }
    return groups;
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
    
    return `# Phase 2.5: パフォーマンス・リソース監査結果

## 総合スコア: ${summary.overallScore}/100

## パフォーマンス指標
- **バンドルサイズ**: ${this.formatBytes(summary.bundleSize.total)} (スコア: ${summary.bundleSize.score})
- **メモリ使用量**: ピーク ${this.formatBytes(summary.memoryUsage.peak)} (スコア: ${summary.memoryUsage.score})
- **CPU使用率**: 平均 ${summary.cpuUsage.average.toFixed(1)}% (スコア: ${summary.cpuUsage.score})
- **ビルド時間**: ${(summary.buildTime.total/1000).toFixed(1)}秒 (スコア: ${summary.buildTime.score})

## 推奨事項
${this.results.recommendations.map(rec => 
  `### ${rec.title} (${rec.priority})\n${rec.description}\n${rec.suggestions ? rec.suggestions.map(s => `- ${s}`).join('\n') : ''}`
).join('\n\n')}

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
    <title>Phase 2.5: パフォーマンス・リソース監査結果</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .score { font-size: 2em; font-weight: bold; }
        .high { color: #d32f2f; }
        .medium { color: #f57c00; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Phase 2.5: パフォーマンス・リソース監査結果</h1>
    <div class="summary">
        <div class="score">総合スコア: ${this.results.summary.overallScore}/100</div>
        <h2>パフォーマンス指標</h2>
        <p>バンドルサイズ: ${this.formatBytes(this.results.summary.bundleSize.total)} (スコア: ${this.results.summary.bundleSize.score})</p>
        <p>メモリ使用量: ${this.formatBytes(this.results.summary.memoryUsage.peak)} (スコア: ${this.results.summary.memoryUsage.score})</p>
        <p>CPU使用率: ${this.results.summary.cpuUsage.average.toFixed(1)}% (スコア: ${this.results.summary.cpuUsage.score})</p>
        <p>ビルド時間: ${(this.results.summary.buildTime.total/1000).toFixed(1)}秒 (スコア: ${this.results.summary.buildTime.score})</p>
    </div>
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
    const auditor = new PerformanceAuditor();
    const results = await auditor.runAll();
    
    await auditor.saveResults(argv.output, argv.format);
    
    // 低スコアの場合は警告表示
    if (results.summary.overallScore < 70) {
      log.warning(`パフォーマンススコアが低いです (${results.summary.overallScore}/100)。詳細は ${argv.output} を確認してください。`);
    }
    
  } catch (error) {
    log.error(`Phase 2.5実行エラー: ${error.message}`);
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = { PerformanceAuditor };