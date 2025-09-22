#!/usr/bin/env node

/**
 * CI/CDパイプラインベンチマークスクリプト
 * 
 * 用途:
 * - 現状のビルド/テストパフォーマンスを測定
 * - 最適化前後の比較
 * - CI環境での自動実行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), '.rimor', 'reports', 'ci');
const BENCHMARK_FILE = path.join(REPORTS_DIR, 'benchmark-results.json');
const SUMMARY_FILE = path.join(REPORTS_DIR, 'benchmark-summary.md');

// ベンチマーク結果を格納
const benchmarkResults = {
  timestamp: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ci: process.env.CI === 'true'
  },
  metrics: {},
  comparisons: {}
};

/**
 * メイン実行関数
 */
async function main() {
  console.log('⚡ CI/CD パイプラインベンチマークを開始\n');
  
  // レポートディレクトリを作成
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // 前回の結果を読み込み
  const previousResults = loadPreviousResults();
  
  // 各ベンチマークを実行
  await runBenchmarks();
  
  // 前回との比較
  if (previousResults) {
    compareResults(previousResults);
  }
  
  // 結果を保存
  saveResults();
  
  // サマリーを生成
  generateSummary();
  
  // 結果を表示
  displayResults();
  
  // 目標を達成しているかチェック
  const exitCode = checkTargets();
  process.exit(exitCode);
}

/**
 * ベンチマークを実行
 */
async function runBenchmarks() {
  console.log('✨ ベンチマーク実行中...\n');
  
  // 1. ビルドパフォーマンス
  await measureBuild();
  
  // 2. 型チェックパフォーマンス
  await measureTypeCheck();
  
  // 3. テスト実行パフォーマンス
  await measureTests();
  
  // 4. バンドルサイズ
  await measureBundleSize();
  
  // 5. メモリ使用量
  await measureMemoryUsage();
}

/**
 * ビルドパフォーマンスを測定
 */
async function measureBuild() {
  console.log('🔨 ビルドパフォーマンス測定...');
  
  // クリーンビルド
  execSync('rm -rf dist', { stdio: 'ignore' });
  
  const startTime = Date.now();
  try {
    execSync('npm run build:simple', { stdio: 'ignore' });
  } catch (error) {
    console.error('ビルドエラー:', error.message);
  }
  const buildTime = (Date.now() - startTime) / 1000;
  
  benchmarkResults.metrics.fullBuild = {
    value: buildTime,
    unit: 'seconds'
  };
  
  // インクリメンタルビルド
  const testFile = path.join(process.cwd(), 'src', 'test-dummy.ts');
  fs.writeFileSync(testFile, '// Test\nexport const test = 1;');
  
  const incrStartTime = Date.now();
  try {
    execSync('npm run build:simple', { stdio: 'ignore' });
  } catch (error) {
    console.error('インクリメンタルビルドエラー:', error.message);
  }
  const incrBuildTime = (Date.now() - incrStartTime) / 1000;
  
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
  
  benchmarkResults.metrics.incrementalBuild = {
    value: incrBuildTime,
    unit: 'seconds'
  };
  
  console.log(`  フルビルド: ${buildTime.toFixed(2)}秒`);
  console.log(`  インクリメンタル: ${incrBuildTime.toFixed(2)}秒\n`);
}

/**
 * 型チェックパフォーマンスを測定
 */
async function measureTypeCheck() {
  console.log('🔍 型チェックパフォーマンス測定...');
  
  const startTime = Date.now();
  try {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
  } catch (error) {
    console.error('型チェックエラー:', error.message);
  }
  const typeCheckTime = (Date.now() - startTime) / 1000;
  
  benchmarkResults.metrics.typeCheck = {
    value: typeCheckTime,
    unit: 'seconds'
  };
  
  // strictモードでのエラー数をカウント
  let strictErrors = 0;
  try {
    execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : '';
    strictErrors = (output.match(/error TS/g) || []).length;
  }
  
  benchmarkResults.metrics.strictModeErrors = {
    value: strictErrors,
    unit: 'errors'
  };
  
  console.log(`  型チェック: ${typeCheckTime.toFixed(2)}秒`);
  console.log(`  strictモードエラー: ${strictErrors}個\n`);
}

/**
 * テスト実行パフォーマンスを測定
 */
async function measureTests() {
  console.log('🧪 テスト実行パフォーマンス測定...');
  
  const startTime = Date.now();
  let testsPassed = false;
  
  try {
    execSync('npm run test:quick', { stdio: 'ignore' });
    testsPassed = true;
  } catch (error) {
    console.error('テスト実行エラー');
  }
  
  const testTime = (Date.now() - startTime) / 1000;
  
  benchmarkResults.metrics.testExecution = {
    value: testTime,
    unit: 'seconds'
  };
  
  benchmarkResults.metrics.testsPassed = {
    value: testsPassed ? 1 : 0,
    unit: 'boolean'
  };
  
  console.log(`  テスト実行: ${testTime.toFixed(2)}秒`);
  console.log(`  テスト結果: ${testsPassed ? '成功' : '失敗'}\n`);
}

/**
 * バンドルサイズを測定
 */
async function measureBundleSize() {
  console.log('📦 バンドルサイズ測定...');
  
  const distPath = path.join(process.cwd(), 'dist');
  let totalSize = 0;
  
  if (fs.existsSync(distPath)) {
    totalSize = calculateDirectorySize(distPath);
  }
  
  const sizeInMB = totalSize / (1024 * 1024);
  
  benchmarkResults.metrics.bundleSize = {
    value: sizeInMB,
    unit: 'MB'
  };
  
  console.log(`  バンドルサイズ: ${sizeInMB.toFixed(2)}MB\n`);
}

/**
 * メモリ使用量を測定
 */
async function measureMemoryUsage() {
  console.log('💾 メモリ使用量測定...');
  
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / (1024 * 1024);
  
  benchmarkResults.metrics.memoryUsage = {
    value: heapUsedMB,
    unit: 'MB'
  };
  
  console.log(`  ヒープ使用量: ${heapUsedMB.toFixed(2)}MB\n`);
}

/**
 * ディレクトリサイズを計算
 */
function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

/**
 * 前回の結果を読み込み
 */
function loadPreviousResults() {
  if (fs.existsSync(BENCHMARK_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
    } catch (error) {
      console.error('前回の結果読み込みエラー:', error.message);
    }
  }
  return null;
}

/**
 * 結果を比較
 */
function compareResults(previousResults) {
  console.log('📊 前回との比較...');
  
  for (const [key, current] of Object.entries(benchmarkResults.metrics)) {
    const previous = previousResults.metrics?.[key];
    if (previous) {
      const diff = current.value - previous.value;
      const percentChange = (diff / previous.value) * 100;
      
      benchmarkResults.comparisons[key] = {
        previous: previous.value,
        current: current.value,
        diff: diff,
        percentChange: percentChange,
        improved: diff < 0
      };
      
      const arrow = diff < 0 ? '↓' : diff > 0 ? '↑' : '=';
      const color = diff < 0 ? '\x1b[32m' : diff > 0 ? '\x1b[31m' : '\x1b[33m';
      const reset = '\x1b[0m';
      
      console.log(`  ${key}: ${color}${arrow} ${Math.abs(percentChange).toFixed(1)}%${reset}`);
    }
  }
  
  console.log();
}

/**
 * 結果を保存
 */
function saveResults() {
  fs.writeFileSync(BENCHMARK_FILE, JSON.stringify(benchmarkResults, null, 2));
  console.log(`💾 結果を保存: ${BENCHMARK_FILE}\n`);
}

/**
 * サマリーを生成
 */
function generateSummary() {
  let summary = '# CI/CD パイプラインベンチマーク結果\n\n';
  summary += `実行日時: ${benchmarkResults.timestamp}\n`;
  summary += `環境: Node.js ${benchmarkResults.environment.node} (${benchmarkResults.environment.platform})\n\n`;
  
  summary += '## パフォーマンスメトリクス\n\n';
  summary += '| メトリクス | 値 | 目標 | 結果 |\n';
  summary += '|-----------|-----|------|------|\n';
  
  const targets = {
    fullBuild: { label: 'フルビルド', target: 30 },
    incrementalBuild: { label: 'インクリメンタルビルド', target: 10 },
    typeCheck: { label: '型チェック', target: 20 },
    testExecution: { label: 'テスト実行', target: 60 },
    bundleSize: { label: 'バンドルサイズ', target: 1 },
    strictModeErrors: { label: 'strictモードエラー', target: 0 }
  };
  
  for (const [key, config] of Object.entries(targets)) {
    const metric = benchmarkResults.metrics[key];
    if (metric) {
      const passed = metric.value <= config.target;
      const status = passed ? '✅' : '❌';
      summary += `| ${config.label} | ${metric.value.toFixed(2)}${metric.unit} | ${config.target}${metric.unit} | ${status} |\n`;
    }
  }
  
  if (Object.keys(benchmarkResults.comparisons).length > 0) {
    summary += '\n## 前回との比較\n\n';
    summary += '| メトリクス | 前回 | 今回 | 変化 |\n';
    summary += '|-----------|------|------|------|\n';
    
    for (const [key, comparison] of Object.entries(benchmarkResults.comparisons)) {
      const arrow = comparison.improved ? '↓' : comparison.diff > 0 ? '↑' : '=';
      summary += `| ${key} | ${comparison.previous.toFixed(2)} | ${comparison.current.toFixed(2)} | ${arrow} ${Math.abs(comparison.percentChange).toFixed(1)}% |\n`;
    }
  }
  
  fs.writeFileSync(SUMMARY_FILE, summary);
  console.log(`📄 サマリーを生成: ${SUMMARY_FILE}\n`);
}

/**
 * 結果を表示
 */
function displayResults() {
  console.log('🎯 最終結果:');
  console.log('===============');
  
  const targets = {
    fullBuild: { label: 'フルビルド', target: 30, unit: '秒' },
    incrementalBuild: { label: 'インクリビルド', target: 10, unit: '秒' },
    typeCheck: { label: '型チェック', target: 20, unit: '秒' },
    bundleSize: { label: 'バンドルサイズ', target: 1, unit: 'MB' }
  };
  
  let allPassed = true;
  
  for (const [key, config] of Object.entries(targets)) {
    const metric = benchmarkResults.metrics[key];
    if (metric) {
      const passed = metric.value <= config.target;
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${config.label}: ${metric.value.toFixed(2)}${config.unit} (目標: ${config.target}${config.unit})`);
      
      if (!passed) {
        allPassed = false;
      }
    }
  }
  
  console.log('\n' + (allPassed ? '✅ すべての目標を達成！' : '❌ 一部の目標が未達成'));
}

/**
 * 目標達成をチェック
 */
function checkTargets() {
  const targets = {
    fullBuild: 30,
    incrementalBuild: 10,
    typeCheck: 20,
    bundleSize: 1,
    strictModeErrors: 0
  };
  
  for (const [key, target] of Object.entries(targets)) {
    const metric = benchmarkResults.metrics[key];
    if (metric && metric.value > target) {
      return 1; // 失敗
    }
  }
  
  return 0; // 成功
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('ベンチマーク実行エラー:', error);
    process.exit(1);
  });
}