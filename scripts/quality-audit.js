#!/usr/bin/env node

/**
 * 品質監査スクリプト - Dogfoodingプロセス
 * Rimor自身を使用してRimorのテスト品質を評価
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Rimorを使用して自己診断を実行
 */
async function runDogfooding() {
  console.log('🐕 Dogfoodingプロセスを開始 - Rimor自身でRimorを解析します...');
  
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    executionTime: 0,
    analysisResults: null,
    qualityScore: null,
    trends: [],
    recommendations: []
  };

  try {
    // 1. Rimorを使用して自分自身のソースコードを解析
    console.log('\n📊 ステップ1: ソースコード品質分析...');
    const srcAnalysis = spawnSync('node', ['dist/index.js', 'analyze', 'src', '--json'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

    if (srcAnalysis.status !== 0 && srcAnalysis.status !== 1) {
      throw new Error(`ソースコード解析が失敗しました: ${srcAnalysis.stderr}`);
    }

    // 出力の検証
    if (!srcAnalysis.stdout || srcAnalysis.stdout.trim() === '') {
      throw new Error(`ソースコード解析の出力が空です。stderr: ${srcAnalysis.stderr}`);
    }

    let srcResults;
    try {
      srcResults = JSON.parse(srcAnalysis.stdout);
    } catch (parseError) {
      throw new Error(`ソースコード解析の出力をパースできません: ${parseError.message}\n出力: ${srcAnalysis.stdout}`);
    }
    
    // 2. テストコードの品質分析
    console.log('\n🧪 ステップ2: テストコード品質分析...');
    const testAnalysis = spawnSync('node', ['dist/index.js', 'analyze', 'test', '--json'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });

    if (testAnalysis.status !== 0 && testAnalysis.status !== 1) {
      throw new Error(`テストコード解析が失敗しました: ${testAnalysis.stderr}`);
    }

    // 出力の検証
    if (!testAnalysis.stdout || testAnalysis.stdout.trim() === '') {
      throw new Error(`テストコード解析の出力が空です。stderr: ${testAnalysis.stderr}`);
    }

    let testResults;
    try {
      testResults = JSON.parse(testAnalysis.stdout);
    } catch (parseError) {
      throw new Error(`テストコード解析の出力をパースできません: ${parseError.message}\n出力: ${testAnalysis.stdout}`);
    }

    // 3. 総合品質スコアの計算
    console.log('\n🎯 ステップ3: 総合品質スコア計算...');
    const qualityScore = calculateQualityScore(srcResults, testResults);
    results.qualityScore = qualityScore;

    // 4. 履歴データとの比較（存在する場合）
    console.log('\n📈 ステップ4: トレンド分析...');
    const trends = analyzeQualityTrends(qualityScore);
    results.trends = trends;

    // 5. 改善推奨事項の生成
    console.log('\n💡 ステップ5: 改善推奨事項の生成...');
    const recommendations = generateRecommendations(srcResults, testResults, qualityScore);
    results.recommendations = recommendations;

    // 6. 結果の保存
    results.analysisResults = {
      src: summarizeResults(srcResults),
      test: summarizeResults(testResults)
    };
    results.executionTime = Date.now() - startTime;

    // レポートの保存
    const reportDir = path.join(process.cwd(), '.rimor', 'reports', 'quality');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, 'dogfooding-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    // 結果の表示
    displayResults(results);

    // CI用の閾値チェック
    return checkQualityThresholds(qualityScore);

  } catch (error) {
    console.error('❌ Dogfoodingプロセス中にエラーが発生しました:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * 品質スコアの計算
 */
function calculateQualityScore(srcResults, testResults) {
  const scores = {
    coverage: 0,
    complexity: 0,
    maintainability: 0,
    security: 0,
    testQuality: 0
  };

  // カバレッジスコア（テストの網羅性）
  const totalSrcFiles = srcResults.summary?.filesAnalyzed || 0;
  const filesWithTests = testResults.summary?.filesAnalyzed || 0;
  scores.coverage = totalSrcFiles > 0 ? (filesWithTests / totalSrcFiles) * 100 : 0;

  // 複雑度スコア（問題の少なさ）
  const totalIssues = (srcResults.issues?.length || 0) + (testResults.issues?.length || 0);
  scores.complexity = Math.max(0, 100 - totalIssues * 2);

  // 保守性スコア（medium以下の問題の割合）
  const lowSeverityIssues = [...(srcResults.issues || []), ...(testResults.issues || [])]
    .filter(issue => issue.severity === 'low' || issue.severity === 'medium').length;
  scores.maintainability = totalIssues > 0 ? (lowSeverityIssues / totalIssues) * 100 : 100;

  // セキュリティスコア（critical/highの問題がないか）
  const criticalIssues = [...(srcResults.issues || []), ...(testResults.issues || [])]
    .filter(issue => issue.severity === 'critical' || issue.severity === 'high').length;
  scores.security = Math.max(0, 100 - criticalIssues * 10);

  // テスト品質スコア（テスト関連の問題の少なさ）
  const testIssues = (testResults.issues || []).length;
  scores.testQuality = Math.max(0, 100 - testIssues * 5);

  // 総合スコア（重み付け平均）
  const weights = {
    coverage: 0.25,
    complexity: 0.20,
    maintainability: 0.20,
    security: 0.25,
    testQuality: 0.10
  };

  const overallScore = Object.entries(scores).reduce((total, [key, value]) => {
    return total + (value * weights[key]);
  }, 0);

  return {
    overall: Math.round(overallScore),
    dimensions: scores,
    grade: getGrade(overallScore)
  };
}

/**
 * 品質トレンドの分析
 */
function analyzeQualityTrends(currentScore) {
  const historyPath = path.join(process.cwd(), '.rimor', 'reports', 'quality', 'quality-history.json');
  let history = [];

  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) {
      // 履歴ファイルが破損している場合は新規作成
    }
  }

  // 現在のスコアを履歴に追加
  history.push({
    timestamp: new Date().toISOString(),
    score: currentScore.overall,
    dimensions: currentScore.dimensions
  });

  // 直近10件のみ保持
  if (history.length > 10) {
    history = history.slice(-10);
  }

  // 履歴を保存
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  // トレンド分析
  if (history.length < 2) {
    return { trend: 'neutral', message: '履歴データが不足しています' };
  }

  const recent = history.slice(-5);
  const avgRecent = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
  const previousScore = history[history.length - 2].score;

  if (currentScore.overall > previousScore + 5) {
    return { trend: 'improving', message: `品質が向上しています (+${currentScore.overall - previousScore}点)` };
  } else if (currentScore.overall < previousScore - 5) {
    return { trend: 'declining', message: `品質が低下しています (${currentScore.overall - previousScore}点)` };
  } else {
    return { trend: 'stable', message: '品質は安定しています' };
  }
}

/**
 * 改善推奨事項の生成
 */
function generateRecommendations(srcResults, testResults, qualityScore) {
  const recommendations = [];

  // 各次元のスコアに基づく推奨事項
  if (qualityScore.dimensions.coverage < 80) {
    recommendations.push({
      priority: 'high',
      category: 'coverage',
      message: 'テストカバレッジが不足しています。未テストのモジュールにテストを追加してください。'
    });
  }

  if (qualityScore.dimensions.security < 90) {
    recommendations.push({
      priority: 'critical',
      category: 'security',
      message: 'セキュリティ関連の問題が検出されています。早急に対処してください。'
    });
  }

  if (qualityScore.dimensions.complexity < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'complexity',
      message: 'コードの複雑度が高くなっています。リファクタリングを検討してください。'
    });
  }

  // 具体的な問題に基づく推奨事項
  const criticalIssues = [...(srcResults.issues || []), ...(testResults.issues || [])]
    .filter(issue => issue.severity === 'critical');
  
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'issues',
      message: `${criticalIssues.length}件のクリティカルな問題が検出されています。`,
      details: criticalIssues.slice(0, 3).map(issue => issue.message)
    });
  }

  return recommendations;
}

/**
 * 結果のサマリー生成
 */
function summarizeResults(results) {
  const summary = {
    filesAnalyzed: results.summary?.filesAnalyzed || 0,
    totalIssues: results.issues?.length || 0,
    issuesBySeverity: {}
  };

  if (results.issues) {
    summary.issuesBySeverity = results.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
  }

  return summary;
}

/**
 * 成績の判定
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 結果の表示
 */
function displayResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Dogfooding品質監査結果');
  console.log('='.repeat(60));
  
  console.log(`\n📊 総合品質スコア: ${results.qualityScore.overall}/100 (${results.qualityScore.grade})`);
  
  console.log('\n📈 各次元のスコア:');
  Object.entries(results.qualityScore.dimensions).forEach(([dimension, score]) => {
    const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
    console.log(`  ${dimension.padEnd(15)} ${bar} ${Math.round(score)}%`);
  });

  if (results.trends && results.trends.message) {
    const trendIcon = results.trends.trend === 'improving' ? '📈' :
                     results.trends.trend === 'declining' ? '📉' : '➡️';
    console.log(`\n${trendIcon} トレンド: ${results.trends.message}`);
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 改善推奨事項:');
    results.recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'critical' ? '🔴' :
                  rec.priority === 'high' ? '🟠' : '🟡';
      console.log(`  ${index + 1}. ${icon} ${rec.message}`);
      if (rec.details) {
        rec.details.forEach(detail => {
          console.log(`     - ${detail}`);
        });
      }
    });
  }

  console.log(`\n⏱️  実行時間: ${(results.executionTime / 1000).toFixed(2)}秒`);
  console.log('\n詳細なレポートは .rimor/reports/quality/dogfooding-report.json に保存されました');
}

/**
 * CI用の品質閾値チェック
 */
function checkQualityThresholds(qualityScore) {
  const thresholds = {
    overall: 70,
    security: 85,
    coverage: 60
  };

  let passed = true;
  const failures = [];

  if (qualityScore.overall < thresholds.overall) {
    failures.push(`総合スコア(${qualityScore.overall}) < 閾値(${thresholds.overall})`);
    passed = false;
  }

  if (qualityScore.dimensions.security < thresholds.security) {
    failures.push(`セキュリティスコア(${qualityScore.dimensions.security}) < 閾値(${thresholds.security})`);
    passed = false;
  }

  if (qualityScore.dimensions.coverage < thresholds.coverage) {
    failures.push(`カバレッジスコア(${qualityScore.dimensions.coverage}) < 閾値(${thresholds.coverage})`);
    passed = false;
  }

  if (!passed) {
    console.error('\n❌ 品質閾値チェックに失敗しました:');
    failures.forEach(failure => console.error(`  - ${failure}`));
    return false;
  }

  console.log('\n✅ 品質閾値チェックに合格しました');
  return true;
}

// メイン実行
if (require.main === module) {
  runDogfooding().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 品質監査スクリプトでエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = { runDogfooding };