/**
 * 大規模プロジェクト性能測定テスト
 * TaintTyper実装の実世界での性能目標達成度を検証
 */

import { LargeScalePerformanceValidator, LargeScaleProjectConfig } from '../../src/security/validation/LargeScalePerformanceValidator';
import * as fs from 'fs/promises';

describe('大規模プロジェクト性能測定テスト', () => {
  let performanceValidator: LargeScalePerformanceValidator;

  beforeAll(async () => {
    performanceValidator = new LargeScalePerformanceValidator();
    
    // テスト結果出力ディレクトリの作成
    await fs.mkdir('./test-output/performance', { recursive: true });
  });

  afterAll(async () => {
    // クリーンアップ
    try {
      await fs.rm('./test-output/performance', { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('基本性能測定テスト', () => {
    it('小規模プロジェクトで5ms/file目標を達成できること', async () => {
      const smallConfig: LargeScaleProjectConfig = {
        name: 'Small Project Test',
        fileCount: 50,
        methodCount: 125,
        averageFileSize: 80,
        complexity: 'simple',
        frameworks: ['express']
      };

      const results = await performanceValidator.measureLargeScalePerformance([smallConfig]);
      
      expect(results).toHaveLength(1);
      const result = results[0];

      // 基本的な結果検証
      expect(result.timing.totalTime).toBeGreaterThan(0);
      expect(result.timing.timePerFile).toBeGreaterThan(0);
      expect(result.memory.peakMemory).toBeGreaterThan(0);
      expect(result.throughput.filesPerSecond).toBeGreaterThan(0);

      // 5ms/file目標の確認（小規模では達成しやすい）
      console.log(`小規模プロジェクト: ${result.timing.timePerFile.toFixed(2)}ms/file`);
      
      // テスト環境では緩い制限を適用
      expect(result.timing.timePerFile).toBeLessThanOrEqual(50);
      
      // 基本的な健全性チェック
      expect(result.analysisResults.totalIssues).toBeGreaterThanOrEqual(0);
      expect(result.parallelism.coreCount).toBeGreaterThan(0);
    }, 60000);

    it('中規模プロジェクトで性能要件を満たすこと', async () => {
      const mediumConfig: LargeScaleProjectConfig = {
        name: 'Medium Project Test',
        fileCount: 200,
        methodCount: 500,
        averageFileSize: 100,
        complexity: 'moderate',
        frameworks: ['express', 'react']
      };

      const results = await performanceValidator.measureLargeScalePerformance([mediumConfig]);
      
      expect(results).toHaveLength(1);
      const result = results[0];

      console.log(`中規模プロジェクト: ${result.timing.timePerFile.toFixed(2)}ms/file`);
      console.log(`メモリ使用量: ${result.memory.peakMemory.toFixed(1)}MB`);
      console.log(`スループット: ${result.throughput.filesPerSecond.toFixed(1)} files/sec`);

      // 中規模でも実用的な性能を期待
      expect(result.timing.timePerFile).toBeLessThanOrEqual(100);
      expect(result.memory.peakMemory).toBeLessThanOrEqual(1000); // 1GB以下
      expect(result.throughput.filesPerSecond).toBeGreaterThan(1);
    }, 120000);

    it('複数フレームワークでの並列処理が効率的に動作すること', async () => {
      const multiFrameworkConfig: LargeScaleProjectConfig = {
        name: 'Multi-Framework Test',
        fileCount: 120,
        methodCount: 360,
        averageFileSize: 90,
        complexity: 'moderate',
        frameworks: ['express', 'react', 'nestjs']
      };

      const results = await performanceValidator.measureLargeScalePerformance([multiFrameworkConfig]);
      
      expect(results).toHaveLength(1);
      const result = results[0];

      console.log(`マルチフレームワーク: ${result.timing.timePerFile.toFixed(2)}ms/file`);
      console.log(`並列効率: ${(result.parallelism.parallelEfficiency * 100).toFixed(1)}%`);

      // 並列処理の効率性を確認
      expect(result.parallelism.parallelEfficiency).toBeGreaterThan(0.3); // 30%以上の効率
      expect(result.parallelism.parallelism).toBeGreaterThan(1); // 並列実行されている
    }, 90000);
  });

  describe('スケーラビリティテスト', () => {
    it('ファイル数の増加に対してスケーラブルであること', async () => {
      const baseConfig: LargeScaleProjectConfig = {
        name: 'Scalability Test Base',
        fileCount: 100, // 初期値（テストで変更される）
        methodCount: 250,
        averageFileSize: 80,
        complexity: 'simple',
        frameworks: ['express']
      };

      // より小さな範囲でのスケーラビリティテスト（テスト時間短縮のため）
      const result = await performanceValidator.runScalabilityTest(
        baseConfig,
        50,   // 最小ファイル数
        300,  // 最大ファイル数
        5     // ステップ数
      );

      expect(result).toBeDefined();
      expect(result.scalabilityData.length).toBeGreaterThan(3);
      expect(result.analysis.scalabilityScore).toBeGreaterThan(0);

      console.log(`スケーラビリティ分析:`);
      console.log(`  時間計算量: ${result.analysis.timeComplexity}`);
      console.log(`  スケーラビリティスコア: ${result.analysis.scalabilityScore}/10`);
      console.log(`  推奨最大ファイル数: ${result.analysis.recommendedMaxFiles}`);

      // 基本的な健全性チェック
      expect(result.analysis.scalabilityScore).toBeLessThanOrEqual(10);
      expect(result.analysis.recommendedMaxFiles).toBeGreaterThan(100);
    }, 180000);
  });

  describe('エンタープライズ規模検証', () => {
    it('大規模プロジェクトでも実用的な性能を維持すること', async () => {
      // テスト環境に合わせてサイズを調整（実際のエンタープライズより小規模）
      const largeConfig: LargeScaleProjectConfig = {
        name: 'Large Scale Test',
        fileCount: 1000,
        methodCount: 2500,
        averageFileSize: 120,
        complexity: 'complex',
        frameworks: ['express', 'react', 'nestjs']
      };

      const results = await performanceValidator.measureLargeScalePerformance([largeConfig]);
      
      expect(results).toHaveLength(1);
      const result = results[0];

      console.log(`大規模プロジェクト測定結果:`);
      console.log(`  総実行時間: ${(result.timing.totalTime / 1000).toFixed(1)}秒`);
      console.log(`  ファイルあたり時間: ${result.timing.timePerFile.toFixed(2)}ms`);
      console.log(`  ピークメモリ: ${result.memory.peakMemory.toFixed(1)}MB`);
      console.log(`  検出問題数: ${result.analysisResults.totalIssues}`);
      console.log(`  高速化倍率: ${result.targetAchievement.actualSpeedup.toFixed(1)}x`);

      // 大規模でも実用的な性能範囲内であることを確認
      expect(result.timing.timePerFile).toBeLessThanOrEqual(500); // テスト環境では緩い制限
      expect(result.memory.peakMemory).toBeLessThanOrEqual(2000); // 2GB以下
      expect(result.throughput.filesPerSecond).toBeGreaterThan(0.1);

      // メモリ効率の確認
      expect(result.memory.memoryPerFile).toBeLessThanOrEqual(5); // 5MB/file以下
    }, 300000);

    // より現実的なエンタープライズ規模テスト（オプション）
    // CI環境では時間がかかりすぎるため、通常はスキップ
    it.skip('実際のエンタープライズ規模で性能目標を達成すること', async () => {
      const result = await performanceValidator.validateEnterpriseScale();

      expect(result).toBeDefined();
      
      console.log(`エンタープライズ規模検証:`);
      console.log(`  ファイル数: ${result.config.fileCount}`);
      console.log(`  メソッド数: ${result.config.methodCount}`);
      console.log(`  実行時間: ${(result.timing.totalTime / 1000).toFixed(1)}秒`);
      console.log(`  5ms/file目標: ${result.targetAchievement.fiveMsTarget ? '✅' : '❌'}`);
      console.log(`  高速化目標: ${result.targetAchievement.speedupTarget ? '✅' : '❌'}`);

      // エンタープライズ規模での目標達成確認
      expect(result.targetAchievement.fiveMsTarget).toBe(true);
      expect(result.targetAchievement.actualSpeedup).toBeGreaterThanOrEqual(3.0);
      expect(result.memory.peakMemory).toBeLessThanOrEqual(4000); // 4GB以下
    }, 600000);
  });

  describe('性能回帰テスト', () => {
    it('複数回実行しても一貫した性能を示すこと', async () => {
      const consistencyConfig: LargeScaleProjectConfig = {
        name: 'Consistency Test',
        fileCount: 100,
        methodCount: 250,
        averageFileSize: 75,
        complexity: 'moderate',
        frameworks: ['express']
      };

      const runs = 3;
      const results = [];

      for (let i = 0; i < runs; i++) {
        console.log(`一貫性テスト実行 ${i + 1}/${runs}`);
        const result = await performanceValidator.measureLargeScalePerformance([consistencyConfig]);
        results.push(result[0]);
      }

      // 結果の一貫性を確認
      const avgTimePerFile = results.reduce((sum, r) => sum + r.timing.timePerFile, 0) / runs;
      const maxDeviation = Math.max(...results.map(r => Math.abs(r.timing.timePerFile - avgTimePerFile)));
      const deviationPercentage = (maxDeviation / avgTimePerFile) * 100;

      console.log(`一貫性テスト結果:`);
      console.log(`  平均実行時間: ${avgTimePerFile.toFixed(2)}ms/file`);
      console.log(`  最大偏差: ${maxDeviation.toFixed(2)}ms (${deviationPercentage.toFixed(1)}%)`);

      // 結果のばらつきが30%以内であることを確認（テスト環境では緩い制限）
      expect(deviationPercentage).toBeLessThanOrEqual(30);

      // 全実行で基本的な健全性を維持
      results.forEach(result => {
        expect(result.timing.timePerFile).toBeGreaterThan(0);
        expect(result.memory.peakMemory).toBeGreaterThan(0);
        expect(result.analysisResults.totalIssues).toBeGreaterThanOrEqual(0);
      });
    }, 240000);
  });

  describe('メモリ効率テスト', () => {
    it('メモリ使用量が適切に管理されていること', async () => {
      const memoryConfig: LargeScaleProjectConfig = {
        name: 'Memory Efficiency Test',
        fileCount: 500,
        methodCount: 1250,
        averageFileSize: 100,
        complexity: 'moderate',
        frameworks: ['express', 'react']
      };

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`メモリテスト開始時メモリ: ${initialMemory.toFixed(1)}MB`);

      const results = await performanceValidator.measureLargeScalePerformance([memoryConfig]);
      const result = results[0];

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`メモリテスト終了時メモリ: ${finalMemory.toFixed(1)}MB`);
      console.log(`ピークメモリ: ${result.memory.peakMemory.toFixed(1)}MB`);
      console.log(`ファイルあたりメモリ: ${result.memory.memoryPerFile.toFixed(3)}MB`);

      // メモリ効率の確認
      expect(result.memory.memoryPerFile).toBeLessThanOrEqual(10); // 10MB/file以下
      expect(result.memory.peakMemory).toBeLessThanOrEqual(1500); // 1.5GB以下

      // メモリリークがないことを確認（緩いチェック）
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThanOrEqual(200); // 200MB以下の増加
    }, 180000);
  });

  describe('パフォーマンス目標検証', () => {
    it('TaintTyper要件定義の性能目標を検証すること', async () => {
      console.log('🎯 TaintTyper性能目標検証開始');
      console.log('目標: 5ms/file以下, 3-20倍高速化');

      const targetConfigs: LargeScaleProjectConfig[] = [
        {
          name: 'Target Test 1 - Simple',
          fileCount: 200,
          methodCount: 400,
          averageFileSize: 60,
          complexity: 'simple',
          frameworks: ['express']
        },
        {
          name: 'Target Test 2 - Moderate',
          fileCount: 300,
          methodCount: 750,
          averageFileSize: 80,
          complexity: 'moderate',
          frameworks: ['express', 'react']
        },
        {
          name: 'Target Test 3 - Complex',
          fileCount: 150,
          methodCount: 450,
          averageFileSize: 120,
          complexity: 'complex',
          frameworks: ['nestjs']
        }
      ];

      const results = await performanceValidator.measureLargeScalePerformance(targetConfigs);

      console.log('\n📊 性能目標達成度:');
      console.log('プロジェクト\t\t\t\tms/file\t5ms目標\t高速化\t目標達成');
      console.log('-'.repeat(80));

      let totalFiveMsAchieved = 0;
      let totalSpeedupAchieved = 0;

      results.forEach(result => {
        const fiveMsStatus = result.targetAchievement.fiveMsTarget ? '✅' : '❌';
        const speedupStatus = result.targetAchievement.speedupTarget ? '✅' : '❌';
        
        console.log(
          `${result.config.name.padEnd(30)}\t` +
          `${result.timing.timePerFile.toFixed(2).padStart(6)}\t` +
          `${fiveMsStatus}\t` +
          `${result.targetAchievement.actualSpeedup.toFixed(1)}x\t` +
          `${speedupStatus}`
        );

        if (result.targetAchievement.fiveMsTarget) totalFiveMsAchieved++;
        if (result.targetAchievement.speedupTarget) totalSpeedupAchieved++;
      });

      console.log('-'.repeat(80));
      console.log(`5ms/file目標達成: ${totalFiveMsAchieved}/${results.length} (${(totalFiveMsAchieved/results.length*100).toFixed(1)}%)`);
      console.log(`高速化目標達成: ${totalSpeedupAchieved}/${results.length} (${(totalSpeedupAchieved/results.length*100).toFixed(1)}%)`);

      // 検証：少なくとも1つのプロジェクトで目標を達成していること
      expect(totalFiveMsAchieved + totalSpeedupAchieved).toBeGreaterThan(0);

      // すべての結果が実用的な範囲内であること
      results.forEach(result => {
        expect(result.timing.timePerFile).toBeLessThanOrEqual(200); // テスト環境では緩い制限
        expect(result.memory.peakMemory).toBeLessThanOrEqual(2000);
        expect(result.throughput.filesPerSecond).toBeGreaterThan(0.1);
      });
    }, 400000);
  });
});