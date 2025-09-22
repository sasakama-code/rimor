#!/usr/bin/env node

/**
 * 型カバレッジ測定スクリプト
 * 
 * 用途:
 * - TypeScriptコードの型カバレッジを測定
 * - any型の使用箇所を特定
 * - 型安全性の改善提案を生成
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(process.cwd(), '.rimor', 'reports', 'type-coverage');
const COVERAGE_FILE = path.join(REPORTS_DIR, 'type-coverage.json');
const SUMMARY_FILE = path.join(REPORTS_DIR, 'type-coverage-summary.md');

// カバレッジ結果を格納
const coverageResult = {
  timestamp: new Date().toISOString(),
  metrics: {
    totalFiles: 0,
    filesWithAny: 0,
    totalAnyUsages: 0,
    coverage: 0,
    anyLocations: [],
    recommendations: []
  }
};

/**
 * メイン実行関数
 */
async function main() {
  console.log('🔍 型カバレッジ測定を開始\n');
  
  // レポートディレクトリを作成
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // 型カバレッジを測定
  await measureTypeCoverage();
  
  // any型を検出
  await detectAnyTypes();
  
  // 推奨事項を生成
  generateRecommendations();
  
  // 結果を保存
  saveResults();
  
  // サマリーを生成
  generateSummary();
  
  // 結果を表示
  displayResults();
  
  // 品質ゲートチェック
  const exitCode = checkQualityGates();
  process.exit(exitCode);
}

/**
 * 型カバレッジを測定
 */
async function measureTypeCoverage() {
  console.log('✨ 型カバレッジを計算中...');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = getAllTypeScriptFiles(srcPath);
  
  coverageResult.metrics.totalFiles = files.length;
  
  let totalLines = 0;
  let typedLines = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      // コメントや空行を除外
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }
      
      totalLines++;
      
      // any型が含まれていない行をカウント
      if (!line.includes(': any') && !line.includes('<any>') && !line.includes('as any')) {
        typedLines++;
      }
    }
  }
  
  coverageResult.metrics.coverage = totalLines > 0 
    ? Math.round((typedLines / totalLines) * 10000) / 100 
    : 100;
  
  console.log(`  型カバレッジ: ${coverageResult.metrics.coverage}%\n`);
}

/**
 * any型を検出
 */
async function detectAnyTypes() {
  console.log('🕵️ any型の使用箇所を検出中...');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = getAllTypeScriptFiles(srcPath);
  
  const anyPatterns = [
    /: any/g,
    /<any>/g,
    /as any/g,
    /Function/g,  // Function型もanyと同様に扱う
    /: object(?!\.)(?!\[)/g  // object型も警告対象
  ];
  
  for (const file of files) {
    if (file.includes('.test.') || file.includes('.spec.')) {
      continue; // テストファイルはスキップ
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let fileHasAny = false;
    
    lines.forEach((line, index) => {
      for (const pattern of anyPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          fileHasAny = true;
          coverageResult.metrics.totalAnyUsages += matches.length;
          
          coverageResult.metrics.anyLocations.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            column: line.indexOf(matches[0]) + 1,
            type: pattern.source,
            context: line.trim().substring(0, 100)
          });
        }
      }
    });
    
    if (fileHasAny) {
      coverageResult.metrics.filesWithAny++;
    }
  }
  
  console.log(`  any型使用数: ${coverageResult.metrics.totalAnyUsages}箇所`);
  console.log(`  影響ファイル数: ${coverageResult.metrics.filesWithAny}ファイル\n`);
}

/**
 * 推奨事項を生成
 */
function generateRecommendations() {
  console.log('💡 改善提案を生成中...');
  
  const recommendations = [];
  
  // 型カバレッジに基づく提案
  if (coverageResult.metrics.coverage < 95) {
    recommendations.push({
      priority: 'high',
      category: 'coverage',
      title: '型カバレッジの改善',
      description: `現在の型カバレッジは${coverageResult.metrics.coverage}%です。目標の95%に到達するため、any型の削減が必要です。`
    });
  }
  
  // any型の数に基づく提案
  if (coverageResult.metrics.totalAnyUsages > 50) {
    recommendations.push({
      priority: 'high',
      category: 'any-types',
      title: 'any型の段階的削減',
      description: `${coverageResult.metrics.totalAnyUsages}箇所でany型が使用されています。優先順位をつけて段階的に改善してください。`
    });
  }
  
  // ファイル別の提案
  const fileGroups = {};
  for (const location of coverageResult.metrics.anyLocations) {
    const dir = path.dirname(location.file);
    if (!fileGroups[dir]) {
      fileGroups[dir] = 0;
    }
    fileGroups[dir]++;
  }
  
  const hotspots = Object.entries(fileGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (hotspots.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'hotspots',
      title: '型安全性のホットスポット',
      description: '以下のディレクトリにany型が集中しています:',
      details: hotspots.map(([dir, count]) => `- ${dir}: ${count}箇所`).join('\n')
    });
  }
  
  // unknown型への移行提案
  if (coverageResult.metrics.totalAnyUsages > 0) {
    recommendations.push({
      priority: 'low',
      category: 'migration',
      title: 'unknown型への移行',
      description: 'any型をunknown型に置き換えることで、型の安全性を向上させることができます。'
    });
  }
  
  coverageResult.metrics.recommendations = recommendations;
  console.log(`  提案数: ${recommendations.length}件\n`);
}

/**
 * TypeScriptファイルを再帰的に取得
 */
function getAllTypeScriptFiles(dirPath) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // node_modulesやdistはスキップ
      if (item !== 'node_modules' && item !== 'dist') {
        files.push(...getAllTypeScriptFiles(itemPath));
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

/**
 * 結果を保存
 */
function saveResults() {
  fs.writeFileSync(COVERAGE_FILE, JSON.stringify(coverageResult, null, 2));
  console.log(`💾 結果を保存: ${COVERAGE_FILE}\n`);
}

/**
 * サマリーを生成
 */
function generateSummary() {
  let summary = '# 型カバレッジレポート\n\n';
  summary += `実行日時: ${coverageResult.timestamp}\n\n`;
  
  summary += '## 📊 メトリクス\n\n';
  summary += '| 項目 | 値 | 目標 | 結果 |\n';
  summary += '|------|-----|------|------|\n';
  summary += `| 型カバレッジ | ${coverageResult.metrics.coverage}% | 95% | ${coverageResult.metrics.coverage >= 95 ? '✅' : '❌'} |\n`;
  summary += `| any型使用数 | ${coverageResult.metrics.totalAnyUsages} | <50 | ${coverageResult.metrics.totalAnyUsages < 50 ? '✅' : '❌'} |\n`;
  summary += `| 影響ファイル数 | ${coverageResult.metrics.filesWithAny} | <20 | ${coverageResult.metrics.filesWithAny < 20 ? '✅' : '❌'} |\n`;
  
  summary += '\n## 🔍 any型の使用箇所 (Top 10)\n\n';
  summary += '| ファイル | 行 | タイプ | コンテキスト |\n';
  summary += '|---------|-----|--------|------------|\n';
  
  const topLocations = coverageResult.metrics.anyLocations.slice(0, 10);
  for (const loc of topLocations) {
    summary += `| ${loc.file} | ${loc.line} | ${loc.type} | \`${loc.context.substring(0, 50)}...\` |\n`;
  }
  
  if (coverageResult.metrics.anyLocations.length > 10) {
    summary += `\n*他 ${coverageResult.metrics.anyLocations.length - 10} 箇所*\n`;
  }
  
  summary += '\n## 💡 改善提案\n\n';
  for (const rec of coverageResult.metrics.recommendations) {
    const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
    summary += `### ${icon} ${rec.title}\n\n`;
    summary += `${rec.description}\n`;
    if (rec.details) {
      summary += `\n${rec.details}\n`;
    }
    summary += '\n';
  }
  
  fs.writeFileSync(SUMMARY_FILE, summary);
  console.log(`📄 サマリーを生成: ${SUMMARY_FILE}\n`);
}

/**
 * 結果を表示
 */
function displayResults() {
  console.log('🎯 型カバレッジ結果:');
  console.log('==================');
  console.log(`型カバレッジ: ${coverageResult.metrics.coverage}% (目標: 95%)`);
  console.log(`any型使用数: ${coverageResult.metrics.totalAnyUsages}箇所 (目標: <50)`);
  console.log(`影響ファイル数: ${coverageResult.metrics.filesWithAny}ファイル\n`);
  
  if (coverageResult.metrics.recommendations.length > 0) {
    console.log('💡 主要な改善提案:');
    for (const rec of coverageResult.metrics.recommendations.slice(0, 3)) {
      console.log(`- ${rec.title}`);
    }
  }
}

/**
 * 品質ゲートチェック
 */
function checkQualityGates() {
  const passed = 
    coverageResult.metrics.coverage >= 95 &&
    coverageResult.metrics.totalAnyUsages < 50;
  
  console.log('\n' + (passed ? '✅ 型品質ゲートをクリア！' : '❌ 型品質ゲート未達成'));
  
  return passed ? 0 : 1;
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('型カバレッジ測定エラー:', error);
    process.exit(1);
  });
}