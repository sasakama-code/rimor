/**
 * Analysis Worker
 * v0.9.0 - テスト意図分析の並列処理ワーカー
 * TDD Green Phase - パフォーマンス最適化
 */

import { parentPort, workerData } from 'worker_threads';
import { TreeSitterParser } from '../TreeSitterParser';
import { TestIntentExtractor } from '../TestIntentExtractor';
import { TestRealizationResult } from '../ITestIntentAnalyzer';

interface WorkerData {
  files: string[];
}

interface WorkerResult {
  results: TestRealizationResult[];
  error?: string;
}

/**
 * ワーカーでファイルを分析
 * KISS原則: 単純な並列処理から開始
 */
async function analyzeFiles(files: string[]): Promise<TestRealizationResult[]> {
  const parser = TreeSitterParser.getInstance();
  const extractor = new TestIntentExtractor(parser);
  const results: TestRealizationResult[] = [];

  for (const file of files) {
    try {
      // ASTを生成
      const ast = await parser.parseFile(file);
      
      // 意図を抽出
      const intent = await extractor.extractIntent(file, ast);
      
      // 実際のテストを分析
      const actual = await extractor.analyzeActualTest(file, ast);
      
      // ギャップを評価
      const result = await extractor.evaluateRealization(intent, actual);
      
      // ファイル情報を追加
      result.file = file;
      result.description = intent.description;
      
      results.push(result);
    } catch (error) {
      // エラーが発生してもスキップして続行
      console.error(`Error analyzing ${file}:`, error);
    }
  }

  return results;
}

/**
 * ワーカーのメイン処理
 */
async function main() {
  if (!parentPort) {
    throw new Error('このファイルはワーカースレッドとして実行される必要があります');
  }

  try {
    const { files } = workerData as WorkerData;
    const results = await analyzeFiles(files);
    
    const response: WorkerResult = { results };
    parentPort.postMessage(response);
  } catch (error) {
    const response: WorkerResult = {
      results: [],
      error: error instanceof Error ? error.message : String(error)
    };
    parentPort.postMessage(response);
  }
}

// ワーカーを開始
main().catch((error) => {
  console.error('Worker error:', error);
  process.exit(1);
});