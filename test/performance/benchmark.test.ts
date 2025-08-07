/**
 * パフォーマンスベンチマークテスト
 * Issue #58: 各実装のパフォーマンス比較
 */

import { UnifiedAIFormatter } from '../../src/ai-output/unified-ai-formatter';
import { UnifiedAIFormatterOptimized } from '../../src/ai-output/unified-ai-formatter-optimized';
import { UnifiedAIFormatterParallel } from '../../src/ai-output/unified-ai-formatter-parallel';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  AIActionType
} from '../../src/nist/types/unified-analysis-result';

describe('Performance Benchmark', () => {
  let originalFormatter: UnifiedAIFormatter;
  let optimizedFormatter: UnifiedAIFormatterOptimized;
  let parallelFormatter: UnifiedAIFormatterParallel;

  beforeEach(() => {
    originalFormatter = new UnifiedAIFormatter();
    optimizedFormatter = new UnifiedAIFormatterOptimized();
    parallelFormatter = new UnifiedAIFormatterParallel();
  });

  describe('ベンチマーク比較', () => {
    it('各実装のパフォーマンスを比較', async () => {
      console.log('\n=== パフォーマンスベンチマーク ===\n');
      
      const testCases = [
        { name: '小規模（100件）', riskCount: 100 },
        { name: '中規模（1000件）', riskCount: 1000 },
        { name: '大規模（10000件）', riskCount: 10000 }
      ];

      for (const testCase of testCases) {
        console.log(`\n${testCase.name}:`);
        const result = generateLargeUnifiedResult(testCase.riskCount);
        
        // オリジナル実装
        const originalStart = performance.now();
        originalFormatter.formatAsAIJson(result);
        const originalTime = performance.now() - originalStart;
        console.log(`  オリジナル: ${originalTime.toFixed(2)}ms`);
        
        // 最適化版（setImmediate）
        const optimizedStart = performance.now();
        await optimizedFormatter.formatAsAIJson(result);
        const optimizedTime = performance.now() - optimizedStart;
        console.log(`  最適化版: ${optimizedTime.toFixed(2)}ms`);
        
        // 並列処理版（queueMicrotask）
        const parallelStart = performance.now();
        await parallelFormatter.formatAsAIJson(result);
        const parallelTime = performance.now() - parallelStart;
        console.log(`  並列処理版: ${parallelTime.toFixed(2)}ms`);
        
        // 改善率
        const optimizedImprovement = ((originalTime - optimizedTime) / originalTime * 100).toFixed(1);
        const parallelImprovement = ((originalTime - parallelTime) / originalTime * 100).toFixed(1);
        console.log(`  最適化版改善率: ${optimizedImprovement}%`);
        console.log(`  並列処理版改善率: ${parallelImprovement}%`);
      }
    });

    it('並列処理の効果を測定', async () => {
      console.log('\n=== 並列処理効果測定 ===\n');
      
      const result = generateLargeUnifiedResult(5000);
      const runCount = 5;
      
      // 複数回実行の平均を取る
      let syncTotal = 0;
      let asyncTotal = 0;
      let parallelTotal = 0;
      
      for (let i = 0; i < runCount; i++) {
        // 同期処理
        const syncStart = performance.now();
        parallelFormatter.formatAsAIJsonSync(result);
        syncTotal += performance.now() - syncStart;
        
        // 非同期処理（mode: async）
        const asyncStart = performance.now();
        await parallelFormatter.formatAsAIJson(result, { mode: 'async' });
        asyncTotal += performance.now() - asyncStart;
        
        // 並列処理（mode: parallel）
        const parallelStart = performance.now();
        await parallelFormatter.formatAsAIJson(result, { mode: 'parallel' });
        parallelTotal += performance.now() - parallelStart;
      }
      
      const syncAvg = syncTotal / runCount;
      const asyncAvg = asyncTotal / runCount;
      const parallelAvg = parallelTotal / runCount;
      
      console.log(`同期処理平均: ${syncAvg.toFixed(2)}ms`);
      console.log(`非同期処理平均: ${asyncAvg.toFixed(2)}ms`);
      console.log(`並列処理平均: ${parallelAvg.toFixed(2)}ms`);
      console.log(`並列化による改善: ${((syncAvg - parallelAvg) / syncAvg * 100).toFixed(1)}%`);
      
      // 並列処理が同期処理より速いことを確認
      expect(parallelAvg).toBeLessThanOrEqual(syncAvg);
    });

    it('メモリ使用量を測定', async () => {
      console.log('\n=== メモリ使用量測定 ===\n');
      
      const testCases = [
        { name: '1000件', riskCount: 1000 },
        { name: '10000件', riskCount: 10000 },
        { name: '50000件', riskCount: 50000 }
      ];
      
      for (const testCase of testCases) {
        // ガベージコレクションを実行
        if (global.gc) {
          global.gc();
        }
        
        const initialMemory = process.memoryUsage().heapUsed;
        const result = generateLargeUnifiedResult(testCase.riskCount);
        
        await parallelFormatter.formatAsAIJson(result);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsed = (finalMemory - initialMemory) / 1024 / 1024;
        
        console.log(`${testCase.name}: ${memoryUsed.toFixed(2)}MB`);
      }
    });

    it('スケーラビリティを測定', async () => {
      console.log('\n=== スケーラビリティ測定 ===\n');
      
      const riskCounts = [100, 500, 1000, 5000, 10000];
      const results: { count: number; time: number; timePerItem: number }[] = [];
      
      for (const count of riskCounts) {
        const result = generateLargeUnifiedResult(count);
        
        const start = performance.now();
        await parallelFormatter.formatAsAIJson(result);
        const time = performance.now() - start;
        const timePerItem = time / count;
        
        results.push({ count, time, timePerItem });
        console.log(`${count}件: ${time.toFixed(2)}ms (${timePerItem.toFixed(4)}ms/件)`);
      }
      
      // 線形スケーラビリティのチェック
      // 理想的には timePerItem が一定
      const avgTimePerItem = results.reduce((sum, r) => sum + r.timePerItem, 0) / results.length;
      const maxDeviation = Math.max(...results.map(r => Math.abs(r.timePerItem - avgTimePerItem)));
      const deviationPercent = (maxDeviation / avgTimePerItem) * 100;
      
      console.log(`\n平均処理時間/件: ${avgTimePerItem.toFixed(4)}ms`);
      console.log(`最大偏差: ${deviationPercent.toFixed(1)}%`);
      
      // 偏差が50%以内であることを確認（線形に近い）
      expect(deviationPercent).toBeLessThan(50);
    });
  });
});

/**
 * テスト用の大規模UnifiedAnalysisResultを生成
 */
function generateLargeUnifiedResult(riskCount: number): UnifiedAnalysisResult {
  const risks = Array.from({ length: riskCount }, (_, i) => ({
    riskId: `risk-${i}`,
    filePath: `/src/file${i % 100}.ts`,
    riskLevel: [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM][i % 3],
    title: `Risk ${i}`,
    problem: `Problem description for risk ${i}`,
    context: {
      codeSnippet: `// Code snippet ${i}\nconst value = ${i};`,
      startLine: i * 10,
      endLine: i * 10 + 5
    },
    suggestedAction: {
      type: AIActionType.ADD_ASSERTION,
      description: `Fix for risk ${i}`,
      example: `assert(value !== null);`
    }
  }));

  return {
    schemaVersion: '1.0' as const,
    summary: {
      overallScore: 75,
      overallGrade: 'C',
      dimensions: [],
      statistics: {
        totalFiles: Math.floor(riskCount / 10),
        totalTests: Math.floor(riskCount / 5),
        riskCounts: {
          [RiskLevel.CRITICAL]: Math.floor(riskCount / 3),
          [RiskLevel.HIGH]: Math.floor(riskCount / 3),
          [RiskLevel.MEDIUM]: Math.floor(riskCount / 3),
          [RiskLevel.LOW]: 0,
          [RiskLevel.MINIMAL]: 0
        }
      }
    },
    detailedIssues: [],
    aiKeyRisks: risks
  };
}