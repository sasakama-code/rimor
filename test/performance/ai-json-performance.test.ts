/**
 * AI JSON出力のパフォーマンステスト
 * Issue #58: パフォーマンス改善のためのRed Phase
 * 
 * TDD原則に従い、まず失敗するテストを作成
 * t_wada推奨: Red → Green → Refactor
 */

import { UnifiedAIFormatterOptimized } from '../../src/ai-output/unified-ai-formatter-optimized';
import { UnifiedResultGenerator } from '../../src/nist/generators/UnifiedResultGenerator';
import { PriorityEngine } from '../../src/nist/priority/PriorityEngine';
import { TaintVulnerabilityAdapter } from '../../src/nist/adapters/TaintVulnerabilityAdapter';
import { NistRiskEvaluator } from '../../src/nist/evaluators/NistRiskEvaluator';
import { VulnerabilityEvaluator } from '../../src/nist/evaluators/VulnerabilityEvaluator';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  AIActionType
} from '../../src/nist/types/unified-analysis-result';

describe('AI JSON Performance Tests', () => {
  let formatter: UnifiedAIFormatterOptimized;
  let generator: UnifiedResultGenerator;

  beforeEach(() => {
    formatter = new UnifiedAIFormatterOptimized();
    const priorityEngine = new PriorityEngine();
    const vulnerabilityEvaluator = new VulnerabilityEvaluator();
    const taintAdapter = new TaintVulnerabilityAdapter(vulnerabilityEvaluator);
    const nistEvaluator = new NistRiskEvaluator();
    generator = new UnifiedResultGenerator(priorityEngine, taintAdapter, nistEvaluator);
  });

  describe('パフォーマンス要件', () => {
    it('1000件のリスクを100ミリ秒以内に処理できること', async () => {
      // Arrange: 大量のリスクデータを生成
      const largeResult = generateLargeUnifiedResult(1000);
      
      // Act: 処理時間を計測
      const startTime = performance.now();
      const result = formatter.formatAsAIJsonSync(largeResult);
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Assert: 100ミリ秒以内に処理完了（より厳しい条件）
      expect(processingTime).toBeLessThan(100);
      expect(result.keyRisks).toHaveLength(10); // デフォルトの最大10件
    });

    it('10000件のリスクを500ミリ秒以内に処理できること', async () => {
      // Arrange: 超大量のリスクデータ
      const hugeResult = generateLargeUnifiedResult(10000);
      
      // Act: 処理時間を計測
      const startTime = performance.now();
      const result = formatter.formatAsAIJsonSync(hugeResult);
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Assert: 500ミリ秒以内に処理完了（より厳しい条件）
      expect(processingTime).toBeLessThan(500);
    });

    it('メモリ使用量が100MB以下であること', async () => {
      // Arrange: メモリ使用量の初期値を記録
      const initialMemory = process.memoryUsage().heapUsed;
      const largeResult = generateLargeUnifiedResult(5000);
      
      // Act: 処理実行
      formatter.formatAsAIJsonSync(largeResult);
      
      // Assert: メモリ増加量をチェック
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      expect(memoryIncrease).toBeLessThan(100);
    });
  });

  describe('キャッシュ効果', () => {
    it('同じデータの2回目の処理は50%以上高速化すること', async () => {
      // Arrange
      const result = generateLargeUnifiedResult(1000);
      
      // Act: 1回目の処理
      const firstStart = performance.now();
      formatter.formatAsAIJsonSync(result);
      const firstTime = performance.now() - firstStart;
      
      // Act: 2回目の処理（キャッシュ効果を期待）
      const secondStart = performance.now();
      formatter.formatAsAIJsonSync(result);
      const secondTime = performance.now() - secondStart;
      
      // Assert: 2回目は50%以上高速
      expect(secondTime).toBeLessThan(firstTime * 0.5);
    });
  });

  // 削除: JavaScriptの制約により、小規模データでは並列処理が遅くなるため
  // Issue #58のコメントで「並列処理は万能ではない」と結論付けられている

  describe('プログレス報告', () => {
    it('処理進捗をコールバックで報告できること', async () => {
      // Arrange
      const progressCallbacks: number[] = [];
      const result = generateLargeUnifiedResult(1000);
      
      // Act: プログレスコールバック付きで実行
      const options = {
        onProgress: (progress: number) => {
          progressCallbacks.push(progress);
        }
      };
      
      formatter.formatAsAIJsonSync(result, options);
      
      // Assert: プログレスが報告されること
      expect(progressCallbacks.length).toBeGreaterThan(0);
      expect(progressCallbacks[progressCallbacks.length - 1]).toBe(100);
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