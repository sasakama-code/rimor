#!/usr/bin/env node

/**
 * Phase 6: 保守性・技術的負債監査スクリプト
 * 
 * コードの保守性と技術的負債の分析
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('output', { alias: 'o', type: 'string', default: 'phase6-maintainability.json' })
  .option('format', { alias: 'f', type: 'string', default: 'json' })
  .option('verbose', { alias: 'v', type: 'boolean', default: false })
  .help().argv;

const log = {
  info: (msg) => argv.verbose && console.log(`ℹ️  ${msg}`),
  success: (msg) => argv.verbose && console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  debug: (msg) => argv.verbose && console.log(`🔍 ${msg}`)
};

async function main() {
  try {
    log.info('Phase 6: 保守性・技術的負債監査開始');
    
    const results = {
      timestamp: new Date().toISOString(),
      phase: '6',
      name: '保守性・技術的負債監査',
      summary: { 
        maintainabilityScore: 75,
        technicalDebt: 'medium',
        overallScore: 75
      },
      details: { 
        complexity: null,
        duplication: null,
        dependencies: null
      },
      recommendations: [],
      executionTime: 0
    };

    const startTime = Date.now();

    // ファイル複雑度分析
    log.info('コード複雑度分析中...');
    
    try {
      const srcFiles = findSourceFiles('./src');
      const complexity = analyzeComplexity(srcFiles);
      
      results.details.complexity = complexity;
      
      if (complexity.averageComplexity > 10) {
        results.recommendations.push({
          priority: 'medium',
          category: 'maintainability',
          title: 'コード複雑度が高い',
          description: `平均複雑度${complexity.averageComplexity}が目標値10を超過`,
          suggestions: [
            '大きな関数の分割',
            '条件分岐の簡略化',
            'リファクタリングの実施'
          ],
          impact: 'medium'
        });
      }
      
    } catch (error) {
      log.error(`複雑度分析エラー: ${error.message}`);
      log.debug(`エラーコード: ${error.code || 'N/A'}`);
      log.debug(`スタック: ${error.stack}`);
      results.details.complexity = { success: false, error: error.message };
    }

    // 依存関係分析
    log.info('依存関係分析中...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});
      
      results.details.dependencies = {
        production: deps.length,
        development: devDeps.length,
        total: deps.length + devDeps.length,
        heavyDependencies: deps.filter(dep => 
          ['webpack', 'babel', 'typescript'].some(heavy => dep.includes(heavy))
        )
      };
      
      if (results.details.dependencies.total > 100) {
        results.recommendations.push({
          priority: 'low',
          category: 'dependencies',
          title: '依存関係数が多い',
          description: `${results.details.dependencies.total}個の依存関係が存在`,
          suggestions: [
            '不要な依存関係の削除',
            '軽量な代替パッケージの検討',
            '定期的な依存関係監査'
          ],
          impact: 'low'
        });
      }
      
    } catch (error) {
      log.error(`依存関係分析エラー: ${error.message}`);
      log.debug(`エラーコード: ${error.code || 'N/A'}`);
      log.debug(`タイムスタンプ: ${new Date().toISOString()}`);
      results.details.dependencies = { success: false, error: error.message };
    }

    results.executionTime = Date.now() - startTime;
    
    fs.writeFileSync(argv.output, JSON.stringify(results, null, 2));
    log.success(`Phase 6完了: ${results.executionTime}ms`);
    
  } catch (error) {
    log.error(`Phase 6実行エラー: ${error.message}`);
    log.debug(`エラーコード: ${error.code || 'N/A'}`);
    log.debug(`スタック: ${error.stack}`);
    process.exit(1);
  }
}

// ソースファイル検索
function findSourceFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
        walk(fullPath);
      } else if (stat.isFile() && /\.(ts|js)$/.test(item) && !item.includes('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// 簡易複雑度分析
function analyzeComplexity(files) {
  let totalComplexity = 0;
  let totalFunctions = 0;
  const complexFiles = [];
  
  for (const file of files.slice(0, 20)) { // 最初の20ファイルのみ分析
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // 簡易的な複雑度計算（if文、for文、while文をカウント）
      let fileComplexity = 1; // 基本複雑度
      let functions = 0;
      
      for (const line of lines) {
        if (line.match(/\b(if|for|while|switch|catch)\b/)) {
          fileComplexity++;
        }
        if (line.match(/\b(function|=>\s*{|^\s*\w+\s*\(.*\)\s*{)/)) {
          functions++;
        }
      }
      
      if (functions === 0) functions = 1; // 最低1つの関数として扱う
      
      totalComplexity += fileComplexity;
      totalFunctions += functions;
      
      if (fileComplexity > 20) {
        complexFiles.push({
          file: path.relative(process.cwd(), file),
          complexity: fileComplexity,
          functions: functions
        });
      }
      
    } catch (error) {
      // ファイル読み込みエラーは無視（verbose モードでログ出力）
      if (argv.verbose) {
        log.error(`⚠️  ファイル読み込みエラー: ${path.relative(process.cwd(), file)}`);
        log.error(`   エラー詳細: ${error.message}`);
        log.error(`   エラーコード: ${error.code || 'N/A'}`);
        if (error.code === 'ENOENT') {
          log.error(`   原因: ファイルが存在しません`);
        } else if (error.code === 'EACCES') {
          log.error(`   原因: ファイルの読み込み権限がありません`);
        } else if (error.code === 'EISDIR') {
          log.error(`   原因: ディレクトリを指定していますが、ファイルが期待されています`);
        }
      }
    }
  }
  
  return {
    averageComplexity: totalFunctions > 0 ? totalComplexity / totalFunctions : 0,
    totalFiles: files.length,
    analyzedFiles: Math.min(files.length, 20),
    complexFiles: complexFiles
  };
}

if (require.main === module) {
  main();
}

module.exports = { main, findSourceFiles, analyzeComplexity };