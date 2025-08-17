#!/usr/bin/env node

/**
 * ビルド結果の検証スクリプト
 * distディレクトリの必要なファイルが正しく生成されているかを確認
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let hasError = false;
const isCI = process.env.CI === 'true';
const isVerbose = process.env.VERIFY_BUILD_VERBOSE === 'true' || isCI;

function log(message, level = 'info') {
  const color = level === 'error' ? RED : level === 'warning' ? YELLOW : GREEN;
  console.log(`${color}${message}${RESET}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description}: ${filePath}`, 'error');
    if (isVerbose) {
      log(`   Expected path: ${fullPath}`, 'error');
      // CI環境では親ディレクトリの内容も表示
      if (isCI) {
        const parentDir = path.dirname(fullPath);
        if (fs.existsSync(parentDir)) {
          log(`   Parent directory contents:`, 'error');
          const files = fs.readdirSync(parentDir);
          files.forEach(file => log(`     - ${file}`, 'error'));
        }
      }
    }
    hasError = true;
    return false;
  }
  if (isVerbose || !hasError) {
    log(`✅ ${description}: ${filePath}`, 'success');
  }
  return true;
}

function checkDirectoryExists(dirPath, description) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    log(`❌ ${description}: ${dirPath}`, 'error');
    hasError = true;
    return false;
  }
  if (isVerbose || !hasError) {
    log(`✅ ${description}: ${dirPath}`, 'success');
  }
  return true;
}

function verifyBuild() {
  log('\n🔍 ビルド結果の検証を開始します...\n');
  
  if (isCI) {
    log('CI環境を検出しました。詳細モードで実行します。\n');
  }

  const checks = {
    basic: { passed: 0, failed: 0 },
    cli: { passed: 0, failed: 0 },
    templates: { passed: 0, failed: 0 },
    core: { passed: 0, failed: 0 },
    security: { passed: 0, failed: 0 },
    plugins: { passed: 0, failed: 0 }
  };

  // 基本的なビルド成果物の確認
  log('【基本ビルド成果物】');
  if (checkFileExists('dist/index.js', 'メインエントリーポイント')) checks.basic.passed++; else checks.basic.failed++;
  if (checkFileExists('dist/index.d.ts', 'TypeScript型定義')) checks.basic.passed++; else checks.basic.failed++;
  if (checkDirectoryExists('dist', 'distディレクトリ')) checks.basic.passed++; else checks.basic.failed++;

  // CLIシステムの確認
  log('\n【CLIシステム】');
  if (checkFileExists('dist/cli/cli.js', 'メインCLI')) checks.cli.passed++; else checks.cli.failed++;
  if (checkFileExists('dist/cli/commands/analyze.js', '分析コマンド')) checks.cli.passed++; else checks.cli.failed++;
  if (checkFileExists('dist/cli/commands/analyze-v0.8.js', 'v0.8分析コマンド')) checks.cli.passed++; else checks.cli.failed++;

  // テンプレートファイルの確認（重要）
  log('\n【テンプレートファイル】');
  if (checkDirectoryExists('dist/reporting/templates', 'テンプレートディレクトリ')) checks.templates.passed++; else checks.templates.failed++;
  if (checkFileExists('dist/reporting/templates/summary.md.hbs', 'サマリーテンプレート')) checks.templates.passed++; else checks.templates.failed++;
  if (checkFileExists('dist/reporting/templates/detailed.md.hbs', '詳細テンプレート')) checks.templates.passed++; else checks.templates.failed++;

  // コアコンポーネントの確認
  log('\n【コアコンポーネント】');
  if (checkFileExists('dist/core/analyzer.js', '基本解析エンジン')) checks.core.passed++; else checks.core.failed++;
  if (checkFileExists('dist/core/pluginManager.js', 'プラグインマネージャー')) checks.core.passed++; else checks.core.failed++;
  if (checkFileExists('dist/core/engine.js', '統合エンジン')) checks.core.passed++; else checks.core.failed++;

  // セキュリティコンポーネントの確認（JSファイルまたは型定義ファイル）
  log('\n【セキュリティコンポーネント】');
  const hasError1 = hasError;
  const taintAnalysisExists = checkFileExists('dist/security/taint-analysis-system.js', 'Taint解析システム') || 
                               checkFileExists('dist/security/taint-analysis-system.d.ts', 'Taint解析システム型定義');
  hasError = hasError1; // Reset error flag for OR condition
  if (taintAnalysisExists) checks.security.passed++; else { checks.security.failed++; hasError = true; }
  
  const hasError2 = hasError;
  const typeCheckWorkerExists = checkFileExists('dist/security/checker/type-check-worker.js', '型チェックワーカー') ||
                                 checkFileExists('dist/security/checker/type-check-worker.d.ts', '型チェックワーカー型定義');
  hasError = hasError2; // Reset error flag for OR condition
  if (typeCheckWorkerExists) checks.security.passed++; else { checks.security.failed++; hasError = true; }
  
  const hasError3 = hasError;
  const compatibilityExists = checkFileExists('dist/security/compatibility/checker-framework-compatibility.js', '互換性モジュール') ||
                               checkFileExists('dist/security/compatibility/checker-framework-compatibility.d.ts', '互換性モジュール型定義');
  hasError = hasError3; // Reset error flag for OR condition
  if (compatibilityExists) checks.security.passed++; else { checks.security.failed++; hasError = true; }

  // プラグインの確認
  log('\n【プラグイン】');
  if (checkFileExists('dist/plugins/base/BasePlugin.js', 'ベースプラグイン')) checks.plugins.passed++; else checks.plugins.failed++;
  if (checkFileExists('dist/plugins/testExistence.js', 'テスト存在確認プラグイン')) checks.plugins.passed++; else checks.plugins.failed++;
  if (checkFileExists('dist/plugins/assertionExists.js', 'アサーション存在確認プラグイン')) checks.plugins.passed++; else checks.plugins.failed++;

  // TypeScript設定の確認
  log('\n【TypeScript設定】');
  checkFileExists('tsconfig.json', 'TypeScript設定ファイル');

  // package.jsonの確認
  log('\n【パッケージ設定】');
  checkFileExists('package.json', 'パッケージ設定');

  // ビルドサイズの確認
  log('\n【ビルドサイズ】');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const stats = getDirectorySize(distPath);
    log(`📦 ビルドサイズ: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    log(`📁 ファイル数: ${stats.fileCount} files`);
  }

  // 統計情報の表示
  log('\n【検証結果サマリー】');
  log('カテゴリ別結果:');
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [category, stats] of Object.entries(checks)) {
    const categoryName = {
      basic: '基本ビルド',
      cli: 'CLI',
      templates: 'テンプレート',
      core: 'コア',
      security: 'セキュリティ',
      plugins: 'プラグイン'
    }[category];
    
    totalPassed += stats.passed;
    totalFailed += stats.failed;
    
    if (stats.failed > 0) {
      log(`  ${categoryName}: ✅ ${stats.passed} / ❌ ${stats.failed}`, 'error');
    } else if (stats.passed > 0) {
      log(`  ${categoryName}: ✅ ${stats.passed} / ❌ ${stats.failed}`, 'success');
    }
  }
  
  log(`\n総計: ✅ ${totalPassed} / ❌ ${totalFailed}`);

  // 結果サマリー
  log('\n' + '='.repeat(50));
  if (hasError) {
    log('\n❌ ビルド検証に失敗しました。上記のエラーを確認してください。', 'error');
    
    if (isCI) {
      log('\n【CI環境でのトラブルシューティング】', 'error');
      log('1. ビルドステップが正常に完了しているか確認してください', 'error');
      log('2. テンプレートファイルのコピーステップが実行されているか確認してください', 'error');
      log('3. TypeScriptのコンパイルエラーがないか確認してください', 'error');
    }
    
    process.exit(1);
  } else {
    log('\n✅ ビルド検証が成功しました！', 'success');
    process.exit(0);
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        walkDir(filePath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
  }

  walkDir(dirPath);
  return { size: totalSize, fileCount };
}

// メイン実行
if (require.main === module) {
  verifyBuild();
}

module.exports = { verifyBuild };