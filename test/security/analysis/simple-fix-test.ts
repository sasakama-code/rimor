/**
 * 簡単な修正テスト - 基本機能の確認
 */

import { TypeBasedFlowAnalyzer } from '../../../src/security/analysis/type-based-flow-analyzer';

async function testBasicAnnotations() {
  console.log('🔍 型アノテーション基本テスト開始...\n');

  const analyzer = new TypeBasedFlowAnalyzer();

  // テスト1: 単純なJSDocアノテーション
  const simpleCode = `
    /** @untainted */
    const safeData = "safe";
    
    /** @tainted */  
    const userData = req.body.data;
  `;

  try {
    console.log('📋 テスト1: 単純なJSDocアノテーション');
    const result = await analyzer.analyzeTypeBasedFlow(simpleCode, 'simple.ts');

    console.log(`  ✅ 型情報マップサイズ: ${result.typeInfoMap.size}`);
    console.log(`  ✅ 型アノテーション付きパス: ${result.summary.typeAnnotatedPaths}`);

    // 型情報マップの詳細を確認
    for (const [varName, typeInfo] of result.typeInfoMap) {
      console.log(
        `    - ${varName}: ${typeInfo.taintStatus} (アノテーション: ${typeInfo.typeAnnotation?.customTaintType || 'なし'})`
      );
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テスト2: Express.js基本パターン
  const expressCode = `
    function handleRequest(req, res) {
      const userId = req.params.id;
      const query = \`SELECT * FROM users WHERE id = \${userId}\`;
      mysql.query(query);
    }
  `;

  try {
    console.log('📋 テスト2: Express.js基本パターン');
    const result = await analyzer.analyzeTypeBasedFlow(expressCode, 'express.ts');

    console.log(`  ✅ 検出パス数: ${result.paths.length}`);
    console.log(`  ✅ 制約数: ${result.constraints.length}`);

    if (result.paths.length > 0) {
      const path = result.paths[0];
      console.log(
        `    パス: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`
      );
      console.log(`    リスク: ${path.riskLevel}`);
      console.log(`    信頼度: ${(path.typeBasedConfidence * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テスト3: 型アノテーション付きデータフロー
  const annotatedFlowCode = `
    function processUserData(req, res) {
      /** @tainted */
      const userInput = req.body.data;
      
      /** @untainted */
      const safeData = userInput;  // 型制約違反
      
      eval(safeData);  // Sink
    }
  `;

  try {
    console.log('📋 テスト3: 型アノテーション付きデータフロー');
    const result = await analyzer.analyzeTypeBasedFlow(annotatedFlowCode, 'annotated.ts');

    console.log(`  ✅ 検出パス数: ${result.paths.length}`);
    console.log(`  ✅ 型アノテーション付きパス: ${result.summary.typeAnnotatedPaths}`);
    console.log(`  ✅ 型安全パス: ${result.summary.typeSafePaths}`);
    console.log(`  ✅ 制約違反数: ${result.summary.constraintViolations}`);

    if (result.paths.length > 0) {
      const path = result.paths[0];
      console.log(
        `    パス: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`
      );
      console.log(`    型アノテーション有: ${path.typeValidation.hasTypeAnnotations}`);
      console.log(`    型安全: ${path.typeValidation.isTypeSafe}`);
      console.log(`    制約違反: ${path.typeValidation.violatedConstraints.length}件`);
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n🎯 基本テスト完了');
}

// 実行
testBasicAnnotations().catch(console.error);
