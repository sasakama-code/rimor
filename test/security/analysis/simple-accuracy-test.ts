/**
 * 簡単なSource-Sink精度検証
 * Phase 4: 基本的な精度確認用テスト
 */

import { ASTSourceDetector } from '../../../src/security/analysis/ast-source-detector';
import { ASTSinkDetector } from '../../../src/security/analysis/ast-sink-detector';
import { TypeBasedFlowAnalyzer } from '../../../src/security/analysis/type-based-flow-analyzer';

async function testBasicAccuracy() {
  console.log('🔍 Source-Sink精度検証を開始します...\n');

  const sourceDetector = new ASTSourceDetector();
  const sinkDetector = new ASTSinkDetector();
  const flowAnalyzer = new TypeBasedFlowAnalyzer();

  // テストケース1: 単純なSQL Injection
  const sqlInjectionCode = `
    import express from 'express';
    import mysql from 'mysql';
    
    function handleUser(req: express.Request, res: express.Response) {
      const userId = req.params.id;
      const query = \`SELECT * FROM users WHERE id = \${userId}\`;
      mysql.query(query, (error, results) => {
        res.json(results);
      });
    }
  `;

  console.log('📋 テストケース1: SQL Injection検出');
  try {
    const [sources, sinks] = await Promise.all([
      sourceDetector.detectSources(sqlInjectionCode, 'test1.ts'),
      sinkDetector.detectSinks(sqlInjectionCode, 'test1.ts'),
    ]);

    console.log(`  ✅ Source検出数: ${sources.length}`);
    sources.forEach(source => {
      console.log(`    - ${source.variableName} (${source.type})`);
    });

    console.log(`  ✅ Sink検出数: ${sinks.length}`);
    sinks.forEach(sink => {
      console.log(`    - ${sink.dangerousFunction.functionName} (${sink.type})`);
    });

    const analysisResult = await flowAnalyzer.analyzeTypeBasedFlow(sqlInjectionCode, 'test1.ts');
    console.log(`  ✅ データフローパス数: ${analysisResult.paths.length}`);

    analysisResult.paths.forEach((path, index) => {
      console.log(
        `    パス${index + 1}: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`
      );
      console.log(`      リスクレベル: ${path.riskLevel}`);
      console.log(`      信頼度: ${(path.typeBasedConfidence * 100).toFixed(1)}%`);
    });
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テストケース2: コマンドインジェクション
  const commandInjectionCode = `
    import { exec } from 'child_process';
    
    function executeCommand(req: any) {
      const command = req.body.command;
      const fullCommand = \`ls -la \${command}\`;
      exec(fullCommand, (error, stdout, stderr) => {
        console.log(stdout);
      });
    }
  `;

  console.log('📋 テストケース2: Command Injection検出');
  try {
    const [sources, sinks] = await Promise.all([
      sourceDetector.detectSources(commandInjectionCode, 'test2.ts'),
      sinkDetector.detectSinks(commandInjectionCode, 'test2.ts'),
    ]);

    console.log(`  ✅ Source検出数: ${sources.length}`);
    sources.forEach(source => {
      console.log(`    - ${source.variableName} (${source.type})`);
    });

    console.log(`  ✅ Sink検出数: ${sinks.length}`);
    sinks.forEach(sink => {
      console.log(`    - ${sink.dangerousFunction.functionName} (${sink.type})`);
    });

    const analysisResult = await flowAnalyzer.analyzeTypeBasedFlow(
      commandInjectionCode,
      'test2.ts'
    );
    console.log(`  ✅ データフローパス数: ${analysisResult.paths.length}`);

    analysisResult.paths.forEach((path, index) => {
      console.log(
        `    パス${index + 1}: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`
      );
      console.log(`      リスクレベル: ${path.riskLevel}`);
      console.log(`      信頼度: ${(path.typeBasedConfidence * 100).toFixed(1)}%`);
    });
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // テストケース3: パストラバーサル
  const pathTraversalCode = `
    import fs from 'fs';
    
    function readFile(req: any) {
      const fileName = req.query.file;
      const filePath = \`./uploads/\${fileName}\`;
      fs.readFileSync(filePath);
    }
  `;

  console.log('📋 テストケース3: Path Traversal検出');
  try {
    const [sources, sinks] = await Promise.all([
      sourceDetector.detectSources(pathTraversalCode, 'test3.ts'),
      sinkDetector.detectSinks(pathTraversalCode, 'test3.ts'),
    ]);

    console.log(`  ✅ Source検出数: ${sources.length}`);
    sources.forEach(source => {
      console.log(`    - ${source.variableName} (${source.type})`);
    });

    console.log(`  ✅ Sink検出数: ${sinks.length}`);
    sinks.forEach(sink => {
      console.log(`    - ${sink.dangerousFunction.functionName} (${sink.type})`);
    });

    const analysisResult = await flowAnalyzer.analyzeTypeBasedFlow(pathTraversalCode, 'test3.ts');
    console.log(`  ✅ データフローパス数: ${analysisResult.paths.length}`);

    analysisResult.paths.forEach((path, index) => {
      console.log(
        `    パス${index + 1}: ${path.source.variableName} → ${path.sink.dangerousFunction.functionName}`
      );
      console.log(`      リスクレベル: ${path.riskLevel}`);
      console.log(`      信頼度: ${(path.typeBasedConfidence * 100).toFixed(1)}%`);
    });
  } catch (error) {
    console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n🎯 Phase 4 検証完了: TaintTyper基本精度確認');
}

// 実行
testBasicAccuracy().catch(console.error);
