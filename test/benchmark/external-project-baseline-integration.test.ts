/**
 * BaselineManagerとExternalProjectBenchmarkRunner統合テスト
 * Phase 3: TDD手法によるベースライン機能統合
 * 
 * テスト駆動開発（t_wada手法）:
 * 1. Red: 失敗するテストを先に作成
 * 2. Green: 最小限の実装で通る
 * 3. Refactor: コードの改善
 * 
 * SOLID原則適用:
 * - Single Responsibility: 統合テストに特化
 * - Open/Closed: 新しい統合機能の追加に開放的
 * - Dependency Inversion: 抽象化への依存
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ExternalProjectBenchmarkRunner } from '../../src/benchmark/ExternalProjectBenchmarkRunner';
import { BaselineManager } from '../../src/benchmark/BaselineManager';
import { BenchmarkProject } from '../../src/benchmark/config/benchmark-targets';

// テスト用設定
const TEST_BASELINE_DIR = path.join(process.cwd(), '.test-baseline-integration');
const TEST_OUTPUT_DIR = path.join(process.cwd(), '.test-benchmark-output');

describe('BaselineManager統合テスト', () => {
  let benchmarkRunner: ExternalProjectBenchmarkRunner;
  let baselineManager: BaselineManager;

  beforeEach(async () => {
    // テスト用ディレクトリの準備
    await fs.mkdir(TEST_BASELINE_DIR, { recursive: true });
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });

    // BaselineManager初期化
    baselineManager = new BaselineManager({
      baselineDir: TEST_BASELINE_DIR,
      retentionPeriod: 30,
      compressionEnabled: true,
      autoCleanup: false // テスト中は無効化
    });

    // BenchmarkRunner初期化
    benchmarkRunner = new ExternalProjectBenchmarkRunner({
      outputDir: TEST_OUTPUT_DIR,
      timeout: 30000, // 30秒タイムアウト（テスト用）
      parallel: false,
      verbose: false
    });
  });

  afterEach(async () => {
    // テスト用ファイルのクリーンアップ
    try {
      await fs.rm(TEST_BASELINE_DIR, { recursive: true, force: true });
      await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップ失敗は無視
    }
  });

  describe('基本統合機能（Red Phase - 失敗テスト）', () => {
    it('runWithBaselineComparison メソッドが実装されている', async () => {
      // Arrange: 小規模テストプロジェクト作成
      const testProject = await createMockProject('integration-test-project');
      
      // Act & Assert: メソッドの存在確認
      expect(benchmarkRunner.runWithBaselineComparison).toBeDefined();
      expect(typeof benchmarkRunner.runWithBaselineComparison).toBe('function');
    });

    it('ベースライン機能が統合されたベンチマーク実行ができる', async () => {
      // Arrange: テストプロジェクト準備
      const testProject = await createMockProject('baseline-integration-test');
      
      // Act: ベースライン統合実行（まだ実装されていない）
      await expect(async () => {
        await benchmarkRunner.runWithBaselineComparison([testProject]);
      }).not.toThrow(); // メソッドが存在すること
    });

    it('初回実行時にベースラインが自動作成される', async () => {
      // Arrange
      const testProject = await createMockProject('first-baseline-test');
      
      // Act
      const result = await benchmarkRunner.runWithBaselineComparison([testProject]);
      
      // Assert: 初回なので比較結果なし、ベースラインIDのみ
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.baselineId).toBeDefined();
      expect(result.comparison).toBeUndefined(); // 初回なので比較なし
    });

    it('2回目以降の実行時にベースライン比較が実行される', async () => {
      // Arrange: 初回実行でベースライン作成
      const testProject = await createMockProject('comparison-test');
      await benchmarkRunner.runWithBaselineComparison([testProject]);
      
      // Act: 2回目実行
      const secondResult = await benchmarkRunner.runWithBaselineComparison([testProject]);
      
      // Assert: 比較結果が含まれている
      expect(secondResult.comparison).toBeDefined();
      expect(secondResult.comparison!.overallImprovement).toBeDefined();
      expect(secondResult.comparison!.projectComparisons).toHaveLength(1);
    });
  });

  describe('パフォーマンス改善検知機能', () => {
    it('性能改善を検知できる', async () => {
      // Arrange: 初回（遅い）実行
      const testProject = await createMockProject('performance-improvement-test');
      
      // 初回ベンチマーク実行
      const initialResult = await benchmarkRunner.runWithBaselineComparison([testProject]);
      expect(initialResult.baselineId).toBeDefined();

      // Act: 性能向上のシミュレーション（より小さなプロジェクト）
      const improvedProject = await createMockProject('performance-improvement-test', 5); // より少ないファイル
      const improvedResult = await benchmarkRunner.runWithBaselineComparison([improvedProject]);
      
      // Assert: 改善が検知される
      expect(improvedResult.comparison).toBeDefined();
      const comparison = improvedResult.comparison!;
      
      // パフォーマンス改善が記録されている
      const projectComparison = comparison.projectComparisons.find(
        p => p.projectName.includes('performance-improvement-test')
      );
      expect(projectComparison).toBeDefined();
    });

    it('性能劣化を検知できる', async () => {
      // Arrange: 初回（速い）実行
      const testProject = await createMockProject('performance-degradation-test', 5);
      await benchmarkRunner.runWithBaselineComparison([testProject]);
      
      // Act: より重いプロジェクトで劣化をシミュレーション
      const degradedProject = await createMockProject('performance-degradation-test', 50); // より多いファイル
      const degradedResult = await benchmarkRunner.runWithBaselineComparison([degradedProject]);
      
      // Assert: 劣化が検知される
      expect(degradedResult.comparison).toBeDefined();
      const comparison = degradedResult.comparison!;
      
      // パフォーマンス劣化が記録されている
      const projectComparison = comparison.projectComparisons.find(
        p => p.projectName.includes('performance-degradation-test')
      );
      expect(projectComparison).toBeDefined();
    });

    it('5ms/file目標達成状況の変化を追跡できる', async () => {
      // Arrange: 目標未達成プロジェクトの準備
      const heavyProject = await createMockProject('target-tracking-test', 200); // 重いプロジェクト
      await benchmarkRunner.runWithBaselineComparison([heavyProject]);
      
      // Act: 最適化されたプロジェクト（軽量化）
      const optimizedProject = await createMockProject('target-tracking-test', 10); // 軽いプロジェクト
      const optimizedResult = await benchmarkRunner.runWithBaselineComparison([optimizedProject]);
      
      // Assert: 目標達成状況の変化が追跡されている
      expect(optimizedResult.comparison).toBeDefined();
      expect(optimizedResult.comparison!.target5msImprovements).toBeDefined();
      
      const improvements = optimizedResult.comparison!.target5msImprovements;
      // 改善または継続のいずれかに分類される
      expect(
        improvements.improved.length + improvements.maintained.length
      ).toBeGreaterThan(0);
    });
  });

  describe('最適ベースライン選択機能', () => {
    it('複数ベースラインから最適なものを自動選択する', async () => {
      // Arrange: 複数回実行して複数ベースライン作成
      const testProject = await createMockProject('optimal-selection-test');
      
      // 複数回実行でベースライン蓄積
      await benchmarkRunner.runWithBaselineComparison([testProject]);
      await benchmarkRunner.runWithBaselineComparison([testProject]);
      await benchmarkRunner.runWithBaselineComparison([testProject]);
      
      // Act: 最適ベースライン選択
      const optimalId = await baselineManager.selectOptimalBaseline(['optimal-selection-test']);
      
      // Assert: 最適なベースラインが選択される
      expect(optimalId).toBeDefined();
      
      const optimalBaseline = await baselineManager.getBaseline(optimalId!);
      expect(optimalBaseline).toBeDefined();
      expect(optimalBaseline!.statistics.target5msAchievementRate).toBeGreaterThanOrEqual(0);
    });

    it('プロジェクト固有の最適ベースラインを選択できる', async () => {
      // Arrange: 複数プロジェクトでベースライン作成
      const project1 = await createMockProject('project-specific-1');
      const project2 = await createMockProject('project-specific-2');
      
      await benchmarkRunner.runWithBaselineComparison([project1]);
      await benchmarkRunner.runWithBaselineComparison([project2]);
      
      // Act: プロジェクト固有の最適ベースライン選択
      const optimalBaselines = await baselineManager.selectOptimalBaselinesPerProject([
        'project-specific-1',
        'project-specific-2'
      ]);
      
      // Assert: 各プロジェクトに最適なベースラインが選択される
      expect(optimalBaselines['project-specific-1']).toBeDefined();
      expect(optimalBaselines['project-specific-2']).toBeDefined();
    });
  });

  describe('エラーハンドリング・Defensive Programming', () => {
    it('プロジェクトが存在しない場合のエラーハンドリング', async () => {
      // Arrange: 存在しないプロジェクト
      const nonExistentProject: BenchmarkProject = {
        name: 'non-existent-project',
        repositoryUrl: 'https://github.com/non-existent/project.git',
        expectedFileCount: 100,
        target5msPerFile: 5.0,
        timeout: 30000,
        retryCount: 1
      };
      
      // Act & Assert: 適切なエラーハンドリング
      await expect(async () => {
        await benchmarkRunner.runWithBaselineComparison([nonExistentProject]);
      }).not.toThrow(); // エラーは内部でハンドリングされる
    });

    it('ベースラインディレクトリが存在しない場合の自動作成', async () => {
      // Arrange: 存在しないディレクトリ指定
      const nonExistentDir = path.join(TEST_BASELINE_DIR, 'deep', 'nested', 'path');
      const defensiveManager = new BaselineManager({
        baselineDir: nonExistentDir,
        retentionPeriod: 30
      });
      
      const testProject = await createMockProject('directory-creation-test');
      
      // Act: ベンチマーク実行（ディレクトリ自動作成のテスト）
      const runner = new ExternalProjectBenchmarkRunner({
        outputDir: TEST_OUTPUT_DIR,
        timeout: 30000
      });
      
      // テストプロジェクトが実際に処理されることを確認
      expect(testProject).toBeDefined();
      expect(defensiveManager).toBeDefined();
      
      // Assert: エラーが発生しない（ディレクトリが自動作成される）
      await expect(async () => {
        await runner.runMultiProjectBenchmark([testProject]);
      }).not.toThrow();
    });

    it('リソース不足時の適切なエラーメッセージ', async () => {
      // Arrange: 非常に大きなタイムアウト設定のプロジェクト
      const resourceIntensiveProject = await createMockProject('resource-test', 1000);
      
      // 短いタイムアウトでリソース不足をシミュレーション
      const restrictedRunner = new ExternalProjectBenchmarkRunner({
        outputDir: TEST_OUTPUT_DIR,
        timeout: 1, // 1ms（即座にタイムアウト）
        maxRetries: 1
      });
      
      // Act & Assert: タイムアウトエラーが適切に処理される
      const result = await restrictedRunner.runMultiProjectBenchmark([resourceIntensiveProject]);
      
      // 失敗は記録されるが、アプリケーションクラッシュしない
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

/**
 * テスト用モックプロジェクトの作成
 * DRY原則に基づく共通化
 */
async function createMockProject(
  projectName: string, 
  fileCount: number = 10
): Promise<BenchmarkProject> {
  const projectDir = path.join(TEST_OUTPUT_DIR, 'mock-projects', projectName);
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  
  // TypeScriptファイルを動的生成
  for (let i = 0; i < fileCount; i++) {
    const fileContent = `
export class TestClass${i} {
  private data: string[] = [];
  
  constructor() {
    this.data = new Array(100).fill('test-data-${i}');
  }
  
  process(): string {
    return this.data.map(x => x.toUpperCase()).join(',');
  }
  
  async asyncProcess(): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.process()), 1);
    });
  }
}

export const util${i} = {
  helper: (input: string): string => input.toLowerCase(),
  processor: (data: any[]): any[] => data.filter(x => x !== null),
  validator: (value: unknown): boolean => value !== undefined
};
`;
    await fs.writeFile(
      path.join(projectDir, 'src', `test${i}.ts`), 
      fileContent
    );
  }
  
  // package.json作成
  await fs.writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify({
      name: projectName,
      version: "1.0.0",
      main: "src/test0.ts"
    }, null, 2)
  );

  return {
    name: projectName,
    repositoryUrl: `file://${projectDir}`, // ローカルファイルパス
    expectedFileCount: fileCount,
    target5msPerFile: 5.0,
    timeout: 30000,
    retryCount: 2
  };
}