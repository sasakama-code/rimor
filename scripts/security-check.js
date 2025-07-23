#!/usr/bin/env node

/**
 * CI環境対応のセキュリティチェックスクリプト
 * npm auditとテスト実行を分離して実行し、詳細なエラーレポートを提供
 */

const { execSync, spawnSync } = require('child_process');

async function securityCheck() {
  console.log('🔒 セキュリティチェックを開始します...');
  
  // Step 1: npm audit実行
  console.log('📋 Step 1: 依存関係の脆弱性チェック...');
  try {
    const auditResult = spawnSync('npm', ['audit', '--audit-level=high'], {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    if (auditResult.status !== 0) {
      console.error('❌ 高レベルの脆弱性が検出されました');
      console.error('💡 修正方法: npm audit fix を実行してください');
      process.exit(1);
    }
    
    console.log('✅ 依存関係の脆弱性チェック完了');
  } catch (error) {
    console.error('❌ npm auditの実行中にエラーが発生しました:', error.message);
    process.exit(1);
  }
  
  // Step 2: テスト実行
  console.log('🧪 Step 2: テストスイート実行...');
  try {
    const testResult = spawnSync('npm', ['test'], {
      encoding: 'utf8',
      stdio: 'inherit',
      timeout: 600000 // 10分タイムアウト（Node.jsネイティブ）
    });
    
    if (testResult.status !== 0) {
      console.error('❌ テストが失敗しました');
      console.error('💡 修正方法: npm test を実行してエラーを確認してください');
      process.exit(1);
    }
    
    if (testResult.signal === 'SIGTERM') {
      console.error('❌ テストがタイムアウトしました（10分制限）');
      console.error('💡 修正方法: テストの実行時間を最適化してください');
      process.exit(1);
    }
    
    console.log('✅ テストスイート実行完了');
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error.message);
    process.exit(1);
  }
  
  console.log('🎉 セキュリティチェックが正常に完了しました');
}

// スクリプト実行
if (require.main === module) {
  securityCheck().catch(error => {
    console.error('💥 セキュリティチェックスクリプトでエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = { securityCheck };