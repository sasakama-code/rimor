const { container, initializeContainer } = require('./dist/container/index.js');
const TYPES = require('./dist/container/types.js').TYPES;

console.log('🔍 analyze コマンドの実行フローをデバッグ...');

async function debugAnalyzeCommand() {
  try {
    // DIコンテナ初期化
    const myContainer = initializeContainer();
    console.log('✅ DIコンテナが初期化されました');
    
    // サービス取得
    console.log('📦 サービス取得中...');
    const analysisEngine = myContainer.get(TYPES.AnalysisEngine);
    console.log('✅ AnalysisEngine取得完了');
    
    const unifiedPluginManager = myContainer.get(TYPES.UnifiedPluginManager);
    console.log('✅ UnifiedPluginManager取得完了');
    
    // 品質プラグインの確認
    const qualityPlugins = unifiedPluginManager.getQualityPlugins();
    console.log(`📋 登録済み品質プラグイン数: ${qualityPlugins.length}`);
    
    qualityPlugins.forEach((plugin, index) => {
      console.log(`  ${index + 1}. ${plugin.name || plugin.id} (ID: ${plugin.id})`);
    });
    
    // レガシープラグインの確認
    const legacyPlugins = unifiedPluginManager.getLegacyPlugins();
    console.log(`📋 登録済みレガシープラグイン数: ${legacyPlugins.length}`);
    
    legacyPlugins.forEach((plugin, index) => {
      console.log(`  ${index + 1}. ${plugin.name || 'Unknown'}`);
    });
    
    // テストファイルで分析実行
    console.log('\n🚀 テストファイル分析実行中...');
    const targetPath = './src/plugins/core/TestExistencePlugin.ts';
    const result = await analysisEngine.analyze(targetPath);
    
    console.log('\n📊 分析結果:');
    console.log(`  ファイル数: ${result.totalFiles}`);
    console.log(`  Issue数: ${result.issues.length}`);
    console.log(`  実行時間: ${result.executionTime}ms`);
    
    if (result.issues.length > 0) {
      console.log('\n📝 検出されたIssue:');
      result.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type}: ${issue.message}`);
        console.log(`     カテゴリ: ${issue.category}`);
        console.log(`     重要度: ${issue.severity}`);
      });
    } else {
      console.log('\n⚠️  Issue が検出されませんでした - 品質プラグインが実行されていない可能性があります');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ デバッグ実行中にエラーが発生しました:', error.message);
    console.error(error.stack);
    return false;
  }
}

debugAnalyzeCommand().then(success => {
  console.log(success ? '\n✅ デバッグ完了' : '\n❌ デバッグ失敗');
  process.exit(success ? 0 : 1);
});