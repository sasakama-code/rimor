#!/usr/bin/env node

/**
 * Phase 2: セキュリティ特化監査スクリプト (改善版)
 * 
 * TaintTyper型ベースセキュリティ解析とRimoセキュリティ機能
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// 非同期版のexecを作成
const execAsync = promisify(exec);

const argv = yargs(hideBin(process.argv))
  .option('output', { alias: 'o', type: 'string', default: 'phase2-security.json' })
  .option('format', { alias: 'f', type: 'string', default: 'json' })
  .option('verbose', { alias: 'v', type: 'boolean', default: false })
  .help().argv;

const log = {
  info: (msg) => argv.verbose && console.log(`ℹ️  ${msg}`),
  success: (msg) => argv.verbose && console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

async function main() {
  try {
    log.info('Phase 2: セキュリティ特化監査開始');
    
    const results = {
      timestamp: new Date().toISOString(),
      phase: '2',
      name: 'セキュリティ特化監査',
      summary: { issuesFound: 0, testCoverage: 0, overallScore: 85 },
      details: { rimorSecurityAnalysis: null },
      recommendations: [],
      executionTime: 0
    };

    const startTime = Date.now();

    // Rimorセキュリティ分析実行
    try {
      const cmd = 'node dist/index.js analyze ./src/security --format=json';
      const { stdout: output } = await execAsync(cmd, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      });
      const analysisResult = JSON.parse(output);
      
      results.details.rimorSecurityAnalysis = analysisResult;
      results.summary.issuesFound = analysisResult.summary?.issuesFound || 0;
      results.summary.testCoverage = analysisResult.summary?.testCoverage || 0;
      
      if (results.summary.testCoverage < 50) {
        results.recommendations.push({
          priority: 'high',
          category: 'security-testing',
          title: 'セキュリティモジュールのテストカバレッジが低い',
          description: `現在${results.summary.testCoverage}%、目標95%以上`,
          impact: 'high'
        });
      }
      
    } catch (error) {
      log.error(`セキュリティ分析エラー: ${error.message}`);
      log.error(`エラー詳細: ${error.stack}`);
      log.error(`実行コマンド: ${cmd}`);
      results.details.rimorSecurityAnalysis = { 
        success: false, 
        error: error.message,
        errorCode: error.code,
        command: cmd,
        timestamp: new Date().toISOString()
      };
    }

    results.executionTime = Date.now() - startTime;
    
    fs.writeFileSync(argv.output, JSON.stringify(results, null, 2));
    log.success(`Phase 2完了: ${results.executionTime}ms`);
    
  } catch (error) {
    log.error(`Phase 2実行エラー: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };