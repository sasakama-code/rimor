const { AnalyzeCommand } = require('./dist/cli/commands/analyze.js');

console.log('🚀 手動でAnalyzeCommandを実行してテスト...');

async function testManualAnalyze() {
  try {
    const analyzeCommand = new AnalyzeCommand();
    
    const options = {
      format: 'json',
      output: undefined,
      includeDetails: false,
      verbose: true,
      implementationTruth: false,
      productionCode: undefined,
      testPath: undefined,
      aiOutput: false
    };
    
    console.log('📋 分析オプション:', options);
    console.log('🎯 対象パス: src/plugins/core/TestExistencePlugin.ts');
    
    // オリジナルのconsole.logを保存
    const originalLog = console.log;
    const outputs = [];
    
    // console.logをキャプチャ
    console.log = (...args) => {
      const message = args.join(' ');
      outputs.push(message);
      originalLog(...args);
    };
    
    // 分析実行
    await analyzeCommand.execute({
      ...options,
      _: ['src/plugins/core/TestExistencePlugin.ts']
    });
    
    // console.logを復元
    console.log = originalLog;
    
    console.log('\n📊 分析完了');
    
    // JSON出力を探す
    const jsonOutputs = outputs.filter(output => {
      try {
        JSON.parse(output);
        return true;
      } catch {
        return false;
      }
    });
    
    if (jsonOutputs.length > 0) {
      console.log('✅ JSON出力が見つかりました:');
      const result = JSON.parse(jsonOutputs[0]);
      console.log(`  ファイル数: ${result.totalFiles}`);
      console.log(`  Issue数: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.type}: ${issue.message}`);
        });
      }
    } else {
      console.log('⚠️  JSON出力が見つかりませんでした');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 手動分析実行中にエラーが発生しました:', error.message);
    return false;
  }
}

testManualAnalyze().then(success => {
  console.log(success ? '\n✅ 手動分析完了' : '\n❌ 手動分析失敗');
  process.exit(success ? 0 : 1);
});