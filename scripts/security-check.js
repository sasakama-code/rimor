#!/usr/bin/env node

/**
 * CI環境対応の包括的セキュリティチェックスクリプト
 * npm auditとTaintTyper型ベースセキュリティ解析を統合実行
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// TaintTyperエンジンのインポート（ビルド済みディレクトリから）
const { TypeBasedSecurityEngine } = require('../dist/security/analysis/engine');
const { TestFileExtractor } = require('../dist/security/utils/test-file-extractor');

async function runTaintTypeAnalysis() {
  console.log('🔍 TaintTyper型ベースセキュリティ解析を開始...');
  
  try {
    // セキュリティエンジンの初期化
    const engine = new TypeBasedSecurityEngine({
      strictness: 'strict',
      maxAnalysisTime: 60000, // CI環境用に時間制限を設定
      parallelism: 4,
      enableCache: false // CI環境ではキャッシュを無効化
    });

    // テストファイルの収集
    const testFiles = await TestFileExtractor.extractFromProject('./test');
    console.log(`📁 ${testFiles.length}個のテストファイルを解析対象として検出`);

    // コンパイル時解析の実行
    const result = await engine.analyzeAtCompileTime(testFiles);

    // 結果の保存（.rimor/reports/security/配下）
    const reportDir = path.join(process.cwd(), '.rimor', 'reports', 'security');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    const reportPath = path.join(reportDir, 'security-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    // 結果の要約を表示
    console.log('\n📊 TaintTyper解析結果:');
    console.log(`  - 解析ファイル数: ${result.statistics.filesAnalyzed}`);
    console.log(`  - 解析メソッド数: ${result.statistics.methodsAnalyzed}`);
    console.log(`  - 型推論成功率: ${(result.statistics.inferenceSuccessRate * 100).toFixed(1)}%`);
    console.log(`  - 検出されたセキュリティ問題: ${result.issues.length}`);

    // 重要度別の問題数を表示
    const issueBySeverity = result.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(issueBySeverity).length > 0) {
      console.log('\n⚠️  重要度別セキュリティ問題:');
      Object.entries(issueBySeverity).forEach(([severity, count]) => {
        const icon = severity === 'critical' ? '🔴' : 
                    severity === 'high' ? '🟠' : 
                    severity === 'medium' ? '🟡' : '⚪';
        console.log(`  ${icon} ${severity}: ${count}件`);
      });
    }

    // クリティカルまたは高レベルの問題がある場合は失敗
    const criticalCount = issueBySeverity.critical || 0;
    const highCount = issueBySeverity.high || 0;
    
    if (criticalCount > 0 || highCount > 0) {
      console.error('\n❌ TaintTyper解析で重大なセキュリティ問題が検出されました');
      console.error('💡 詳細は.rimor/reports/security/security-analysis-report.jsonを確認してください');
      return false;
    }

    console.log('✅ TaintTyper型ベースセキュリティ解析完了');
    return true;
  } catch (error) {
    console.error('❌ TaintTyper解析中にエラーが発生しました:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function runNpmAudit() {
  console.log('\n📋 依存関係の脆弱性チェック...');
  try {
    // より詳細な監査結果を取得
    const auditResult = spawnSync('npm', ['audit', '--json'], {
      encoding: 'utf8'
    });
    
    // 結果をファイルに保存（.rimor/reports/security/配下）
    if (auditResult.stdout) {
      const reportDir = path.join(process.cwd(), '.rimor', 'reports', 'security');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      fs.writeFileSync(path.join(reportDir, 'audit-results.json'), auditResult.stdout);
    }

    // 高レベル以上の脆弱性をチェック
    const auditCheck = spawnSync('npm', ['audit', '--audit-level=high'], {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    if (auditCheck.status !== 0) {
      console.error('❌ 高レベルの脆弱性が検出されました');
      console.error('💡 修正方法: npm audit fix を実行してください');
      return false;
    }
    
    console.log('✅ 依存関係の脆弱性チェック完了');
    return true;
  } catch (error) {
    console.error('❌ npm auditの実行中にエラーが発生しました:', error.message);
    return false;
  }
}

async function securityCheck() {
  console.log('🔒 包括的セキュリティチェックを開始します...');
  console.log('='.repeat(60));
  
  let allChecksPassed = true;

  // 1. npm audit実行
  const auditPassed = await runNpmAudit();
  allChecksPassed = allChecksPassed && auditPassed;

  // 2. TaintTyper解析実行
  const taintTyperPassed = await runTaintTypeAnalysis();
  allChecksPassed = allChecksPassed && taintTyperPassed;

  console.log('\n' + '='.repeat(60));
  
  if (allChecksPassed) {
    console.log('🎉 すべてのセキュリティチェックが正常に完了しました');
  } else {
    console.error('💥 セキュリティチェックで問題が検出されました');
    process.exit(1);
  }
}

// TestFileExtractorのシンプルな実装（distディレクトリにない場合の代替）
if (!fs.existsSync(path.join(__dirname, '../dist/security/utils/test-file-extractor.js'))) {
  const glob = require('glob');
  
  module.exports.TestFileExtractor = {
    async extractFromProject(testDir) {
      const testFiles = glob.sync(path.join(testDir, '**/*.{test,spec}.{js,ts}'), {
        ignore: ['**/node_modules/**']
      });
      
      return testFiles.map(filePath => ({
        filePath,
        content: fs.readFileSync(filePath, 'utf8')
      }));
    }
  };
}

// スクリプト実行
if (require.main === module) {
  securityCheck().catch(error => {
    console.error('💥 セキュリティチェックスクリプトでエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = { securityCheck, runTaintTypeAnalysis, runNpmAudit };