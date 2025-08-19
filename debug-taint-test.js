/**
 * TaintTyper機能の直接テスト
 */

const { TypeBasedFlowAnalyzer } = require('./dist/security/analysis/type-based-flow-analyzer.js');

async function testTaintAnalysis() {
  console.log('🔍 TaintTyper機能テスト開始...\n');

  const analyzer = new TypeBasedFlowAnalyzer();

  // テスト1: 型アノテーション検出
  const testCode1 = `
    /**
     * @param input @tainted User input data
     */
    function processData(input) {
      const result = eval(input);  // Sink
      return result;
    }
  `;

  try {
    console.log('📋 テスト1: 型アノテーション検出');
    const result1 = await analyzer.analyzeTypeBasedFlow(testCode1, 'test1.ts');
    
    console.log(`  ✅ 型情報マップサイズ: ${result1.typeInfoMap.size}`);
    console.log(`  ✅ 制約数: ${result1.constraints.length}`);
    console.log(`  ✅ パス数: ${result1.paths.length}`);
    console.log(`  ✅ 型アノテーション付きパス: ${result1.summary.typeAnnotatedPaths}`);
    
    // 型情報マップの詳細を確認
    for (const [varName, typeInfo] of result1.typeInfoMap) {
      console.log(`    - ${varName}: ${typeInfo.taintStatus} (アノテーション: ${typeInfo.typeAnnotation?.customTaintType || 'なし'})`);
    }

  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テスト2: 直前コメント形式
  const testCode2 = `
    function processUserData() {
      /** @tainted */
      const userInput = req.body.data;
      
      /** @untainted */
      const safeData = userInput;  // 型制約違反
      
      eval(safeData);  // Sink
    }
  `;

  try {
    console.log('📋 テスト2: 直前コメント形式の型アノテーション');
    const result2 = await analyzer.analyzeTypeBasedFlow(testCode2, 'test2.ts');
    
    console.log(`  ✅ 型情報マップサイズ: ${result2.typeInfoMap.size}`);
    console.log(`  ✅ パス数: ${result2.paths.length}`);
    console.log(`  ✅ 型アノテーション付きパス: ${result2.summary.typeAnnotatedPaths}`);
    console.log(`  ✅ 制約違反数: ${result2.summary.constraintViolations}`);
    
    // 型情報マップの詳細を確認
    for (const [varName, typeInfo] of result2.typeInfoMap) {
      console.log(`    - ${varName}: ${typeInfo.taintStatus} (アノテーション: ${typeInfo.typeAnnotation?.customTaintType || 'なし'})`);
    }

  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テスト3: 基本的なSource-Sinkパス
  const testCode3 = `
    function basicFlow(req, res) {
      const userInput = req.body.data;  // Source
      const query = userInput;          // Assignment
      const result = eval(query);       // Sink
      return result;
    }
  `;

  try {
    console.log('📋 テスト3: 基本的なSource-Sinkパス');
    const result3 = await analyzer.analyzeTypeBasedFlow(testCode3, 'test3.ts');
    
    console.log(`  ✅ パス数: ${result3.paths.length}`);
    console.log(`  ✅ 制約数: ${result3.constraints.length}`);
    
    if (result3.paths.length > 0) {
      const path = result3.paths[0];
      console.log(`    パス: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`);
      console.log(`    制約パス長: ${path.typeConstraintPath.length}`);
      console.log(`    信頼度: ${(path.typeBasedConfidence * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }

  console.log('\n🎯 テスト完了');
}

// 実行
testTaintAnalysis().catch(console.error);