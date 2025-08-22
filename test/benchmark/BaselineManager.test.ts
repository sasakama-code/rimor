/**
 * ベースライン管理システムのテストスイート
 * Phase 3: 継続的改善とベースライン基準の確立
 * 
 * TDD手法: テスト駆動開発による要件定義と設計
 * SOLID原則: 単一責任・開放閉鎖・依存関係逆転の原則適用
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaselineManager } from '../../src/benchmark/BaselineManager';
import { BenchmarkResult } from '../../src/benchmark/ExternalProjectBenchmarkRunner';

// テスト用ディレクトリ設定
const TEST_BASELINE_DIR = path.join(process.cwd(), '.test-baseline');

describe('BaselineManager', () => {
  let baselineManager: BaselineManager;

  beforeEach(async () => {
    // テスト用ベースラインディレクトリの準備
    await fs.mkdir(TEST_BASELINE_DIR, { recursive: true });
    
    baselineManager = new BaselineManager({
      baselineDir: TEST_BASELINE_DIR,
      retentionPeriod: 30, // 30日間保持
      compressionEnabled: true,
      autoCleanup: true
    });
  });

  afterEach(async () => {
    // テスト用ファイルのクリーンアップ
    try {
      await fs.rm(TEST_BASELINE_DIR, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップ失敗は無視
    }
  });

  describe('基本的なベースライン操作', () => {
    it('新しいベースラインを作成できる', async () => {
      const mockResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 2.5, 0.95),
        createMockBenchmarkResult('Ant Design', 3.1, 0.88)
      ];

      const baselineId = await baselineManager.createBaseline(mockResults, {
        name: 'initial-baseline-v1.0',
        description: '初期ベースライン設定',
        createdBy: 'test-suite'
      });

      expect(baselineId).toBeDefined();
      expect(typeof baselineId).toBe('string');
      
      // ベースラインファイルが作成されていることを確認
      const baselinePath = path.join(TEST_BASELINE_DIR, `${baselineId}.json`);
      const exists = await fs.access(baselinePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('ベースラインを正常に取得できる', async () => {
      const mockResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 2.5, 0.95)
      ];

      const baselineId = await baselineManager.createBaseline(mockResults);
      const retrievedBaseline = await baselineManager.getBaseline(baselineId);

      expect(retrievedBaseline).toBeDefined();
      expect(retrievedBaseline!.id).toBe(baselineId);
      expect(retrievedBaseline!.results).toHaveLength(1);
      expect(retrievedBaseline!.results[0].projectName).toBe('TypeScript');
    });

    it('存在しないベースラインIDに対してundefinedを返す', async () => {
      const nonExistentId = 'baseline-not-exists-12345';
      const result = await baselineManager.getBaseline(nonExistentId);

      expect(result).toBeUndefined();
    });
  });

  describe('ベースライン比較機能', () => {
    it('現在結果とベースラインを比較できる', async () => {
      // ベースライン作成
      const baselineResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 3.0, 0.90),
        createMockBenchmarkResult('Ant Design', 3.5, 0.85)
      ];
      const baselineId = await baselineManager.createBaseline(baselineResults);

      // 改善された現在結果
      const currentResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 2.2, 0.95), // 改善
        createMockBenchmarkResult('Ant Design', 4.1, 0.82)  // 劣化
      ];

      const comparison = await baselineManager.compareWithBaseline(currentResults, baselineId);

      expect(comparison).toBeDefined();
      expect(comparison.overallImprovement).toBeDefined();
      expect(comparison.projectComparisons).toHaveLength(2);
      
      // TypeScriptの改善を確認
      const tsComparison = comparison.projectComparisons.find(p => p.projectName === 'TypeScript');
      expect(tsComparison?.performanceImprovement).toBeGreaterThan(0); // 26.7%改善
      
      // Ant Designの劣化を確認
      const antdComparison = comparison.projectComparisons.find(p => p.projectName === 'Ant Design');
      expect(antdComparison?.performanceImprovement).toBeLessThan(0); // 17.1%劣化
    });

    it('5ms/file目標達成率の比較ができる', async () => {
      const baselineResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 3.0, 0.90, true),  // 達成
        createMockBenchmarkResult('Ant Design', 6.0, 0.85, false) // 未達成
      ];
      const baselineId = await baselineManager.createBaseline(baselineResults);

      const currentResults: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 2.5, 0.95, true), // 改善＋達成継続
        createMockBenchmarkResult('Ant Design', 4.8, 0.88, true)  // 大幅改善＋達成
      ];

      const comparison = await baselineManager.compareWithBaseline(currentResults, baselineId);

      expect(comparison.target5msImprovements.improved).toContain('Ant Design');
      expect(comparison.target5msImprovements.maintained).toContain('TypeScript');
      expect(comparison.target5msImprovements.degraded).toHaveLength(0);
    });
  });

  describe('自動ベースライン選択機能', () => {
    it('最適なベースラインを自動選択できる', async () => {
      // 複数のベースラインを作成
      const baseline1Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 4.0, 0.80)
      ], { name: 'old-baseline' });

      const baseline2Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 2.0, 0.95)
      ], { name: 'good-baseline' });

      const baseline3Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 3.0, 0.85)
      ], { name: 'medium-baseline' });

      // 最適なベースラインを自動選択
      const bestBaselineId = await baselineManager.selectOptimalBaseline(['TypeScript']);

      expect(bestBaselineId).toBeDefined();
      // 最も性能の良いbaseline2を選択することを期待
      expect(bestBaselineId).toBe(baseline2Id);
    });

    it('プロジェクトごとの最適ベースラインを選択できる', async () => {
      await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 2.0, 0.95),
        createMockBenchmarkResult('Ant Design', 5.0, 0.70)
      ]);

      await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 4.0, 0.80),
        createMockBenchmarkResult('Ant Design', 3.0, 0.90)
      ]);

      const optimalBaselines = await baselineManager.selectOptimalBaselinesPerProject(['TypeScript', 'Ant Design']);

      expect(optimalBaselines['TypeScript']).toBeDefined();
      expect(optimalBaselines['Ant Design']).toBeDefined();
      // 各プロジェクトで最適な結果を持つベースラインが選択される
    });
  });

  describe('統計的分析機能', () => {
    it('ベースライン統計情報を計算できる', async () => {
      const results: BenchmarkResult[] = [
        createMockBenchmarkResult('TypeScript', 2.5, 0.95),
        createMockBenchmarkResult('Ant Design', 3.1, 0.88),
        createMockBenchmarkResult('VS Code', 4.2, 0.82)
      ];

      const baselineId = await baselineManager.createBaseline(results);
      const statistics = await baselineManager.calculateBaselineStatistics(baselineId);

      expect(statistics).toBeDefined();
      expect(statistics.averageTimePerFile).toBeCloseTo(3.27, 1); // (2.5+3.1+4.2)/3
      expect(statistics.target5msAchievementRate).toBe(1.0); // 100%達成
      expect(statistics.projectCount).toBe(3);
      expect(statistics.overallSuccessRate).toBe(1.0);
    });

    it('複数ベースライン間の傾向分析ができる', async () => {
      // 時系列でベースラインを作成
      const baseline1Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 4.0, 0.80)
      ], { name: 'week-1' });

      const baseline2Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 3.0, 0.90)
      ], { name: 'week-2' });

      const baseline3Id = await baselineManager.createBaseline([
        createMockBenchmarkResult('TypeScript', 2.0, 0.95)
      ], { name: 'week-3' });

      const trendAnalysis = await baselineManager.analyzeTrends([baseline1Id, baseline2Id, baseline3Id]);

      expect(trendAnalysis.overallTrend).toBe('improving'); // 継続的改善
      expect(trendAnalysis.performanceImprovementRate).toBeGreaterThan(0); // 正の改善率
      expect(trendAnalysis.accuracyImprovementRate).toBeGreaterThan(0); // 正の精度向上率
    });
  });

  describe('ベースライン管理機能', () => {
    it('古いベースラインを自動クリーンアップできる', async () => {
      // 保持期間を1日に設定
      const shortRetentionManager = new BaselineManager({
        baselineDir: TEST_BASELINE_DIR,
        retentionPeriod: 1, // 1日
        autoCleanup: true
      });

      // 古い日付のベースラインを作成
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5); // 5日前

      const results: BenchmarkResult[] = [createMockBenchmarkResult('TypeScript', 2.5, 0.95)];
      const oldBaselineId = await shortRetentionManager.createBaseline(results, {
        name: 'old-baseline',
        customTimestamp: oldDate.toISOString()
      });

      // クリーンアップ実行
      const cleanupResult = await shortRetentionManager.cleanup();

      expect(cleanupResult.deletedCount).toBeGreaterThan(0);
      
      // 古いベースラインが削除されていることを確認
      const retrievedOldBaseline = await shortRetentionManager.getBaseline(oldBaselineId);
      expect(retrievedOldBaseline).toBeUndefined();
    });

    it('ベースライン一覧を取得できる', async () => {
      await baselineManager.createBaseline([createMockBenchmarkResult('TypeScript', 2.5, 0.95)], { name: 'baseline-1' });
      await baselineManager.createBaseline([createMockBenchmarkResult('Ant Design', 3.1, 0.88)], { name: 'baseline-2' });

      const baselineList = await baselineManager.listBaselines();

      expect(baselineList).toHaveLength(2);
      expect(baselineList.some(b => b.metadata.name === 'baseline-1')).toBe(true);
      expect(baselineList.some(b => b.metadata.name === 'baseline-2')).toBe(true);
    });
  });

  describe('エラーハンドリングとDefensive Programming', () => {
    it('不正なベースラインIDに対して適切にエラーハンドリングする', async () => {
      const invalidId = '../../../etc/passwd'; // パストラバーサル攻撃の試行
      const result = await baselineManager.getBaseline(invalidId);

      expect(result).toBeUndefined(); // セキュアに未定義を返す
    });

    it('空の結果配列に対して適切にエラーハンドリングする', async () => {
      await expect(baselineManager.createBaseline([])).rejects.toThrow('空の結果配列からベースラインを作成することはできません');
    });

    it('存在しないディレクトリに対して自動作成する', async () => {
      const nonExistentDir = path.join(TEST_BASELINE_DIR, 'non-existent', 'deep', 'path');
      const defensiveManager = new BaselineManager({
        baselineDir: nonExistentDir,
        retentionPeriod: 30
      });

      const results: BenchmarkResult[] = [createMockBenchmarkResult('TypeScript', 2.5, 0.95)];
      const baselineId = await defensiveManager.createBaseline(results);

      expect(baselineId).toBeDefined();
      
      // ディレクトリが自動作成されていることを確認
      const dirExists = await fs.access(nonExistentDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });
  });
});

// ヘルパー関数：モックベンチマーク結果の作成
function createMockBenchmarkResult(
  projectName: string,
  timePerFile: number,
  accuracyRate: number,
  target5msAchieved?: boolean
): BenchmarkResult {
  return {
    success: true,
    projectName,
    timestamp: new Date().toISOString(),
    performance: {
      executionTime: timePerFile * 1000, // 仮のファイル数1000と仮定
      timePerFile,
      totalFiles: 1000,
      memoryUsage: {
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 150 * 1024 * 1024, // 150MB
        external: 10 * 1024 * 1024,  // 10MB
        rss: 200 * 1024 * 1024        // 200MB
      },
      throughput: 1000 / (timePerFile * 1000 / 1000) // files/second
    },
    accuracy: {
      taintTyperSuccessRate: accuracyRate,
      intentExtractionSuccessRate: accuracyRate * 0.9,
      gapDetectionAccuracy: accuracyRate * 0.95,
      errorRate: 1 - accuracyRate,
      totalErrors: Math.floor((1 - accuracyRate) * 100),
      successfulFiles: Math.floor(accuracyRate * 1000),
      failedFiles: Math.floor((1 - accuracyRate) * 1000)
    },
    target5ms: {
      achieved: target5msAchieved ?? (timePerFile <= 5.0),
      actualTimePerFile: timePerFile,
      targetTimePerFile: 5.0,
      deviationPercent: ((timePerFile - 5.0) / 5.0) * 100
    },
    systemInfo: {
      platform: 'test',
      arch: 'x64',
      cpus: 8,
      totalMemory: 16 * 1024 * 1024 * 1024,
      nodeVersion: 'v18.0.0'
    }
  };
}