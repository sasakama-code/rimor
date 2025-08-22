/**
 * BenchmarkReportGeneratorのテストスイート
 * Phase 4: レポート生成・可視化機能
 * 
 * TDD手法（t_wada準拠）:
 * 1. Red: 失敗するテストを作成
 * 2. Green: 最小限の実装
 * 3. Refactor: コード改善
 * 
 * SOLID原則適用:
 * - Single Responsibility: レポート生成に特化
 * - Open/Closed: 新しいフォーマットの追加に開放的
 * - Liskov Substitution: フォーマット実装の互換性
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BenchmarkReportGenerator } from '../../src/benchmark/reporters/BenchmarkReportGenerator';
import { BenchmarkResult, BaselineIntegratedResult } from '../../src/benchmark/ExternalProjectBenchmarkRunner';
import { BaselineComparison } from '../../src/benchmark/BaselineManager';

// テスト用ディレクトリ設定
const TEST_REPORT_DIR = path.join(process.cwd(), '.test-reports');

describe('BenchmarkReportGenerator', () => {
  let reportGenerator: BenchmarkReportGenerator;

  beforeEach(async () => {
    // テスト用レポートディレクトリの準備
    await fs.mkdir(TEST_REPORT_DIR, { recursive: true });
    
    reportGenerator = new BenchmarkReportGenerator({
      outputDir: TEST_REPORT_DIR,
      templateDir: path.join(__dirname, '../../src/benchmark/templates'),
      enableCharts: true,
      includeRawData: true
    });
  });

  afterEach(async () => {
    // テスト用ファイルのクリーンアップ
    try {
      await fs.rm(TEST_REPORT_DIR, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップ失敗は無視
    }
  });

  describe('Markdown レポート生成（Red Phase）', () => {
    it('BenchmarkReportGeneratorクラスが定義されている', () => {
      expect(BenchmarkReportGenerator).toBeDefined();
    });

    it('generateMarkdownReport メソッドが存在する', () => {
      expect(reportGenerator.generateMarkdownReport).toBeDefined();
      expect(typeof reportGenerator.generateMarkdownReport).toBe('function');
    });

    it('基本的なMarkdownレポートを生成できる', async () => {
      // Arrange: モックベンチマーク結果
      const mockResults = createMockBenchmarkResults();
      
      // Act: Markdownレポート生成
      const reportPath = await reportGenerator.generateMarkdownReport(mockResults);
      
      // Assert: レポートファイルが生成される
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('.md');
      
      const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    });

    it('ベースライン比較付きMarkdownレポートを生成できる', async () => {
      // Arrange: モック統合結果（比較データ付き）
      const mockIntegratedResult = createMockIntegratedResult(true); // 比較データ含む
      
      // Act: 統合レポート生成
      const reportPath = await reportGenerator.generateMarkdownReport(
        mockIntegratedResult.results,
        mockIntegratedResult.comparison
      );
      
      // Assert: 比較情報が含まれたレポート
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      expect(reportContent).toContain('## ベースライン比較結果');
      expect(reportContent).toContain('全体改善率');
      expect(reportContent).toContain('プロジェクト別比較');
    });

    it('5ms/file目標達成率をMarkdownレポートに含む', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const reportPath = await reportGenerator.generateMarkdownReport(mockResults);
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      
      // Assert: 5ms目標関連の情報が含まれる
      expect(reportContent).toContain('5ms/file');
      expect(reportContent).toContain('目標達成率');
      expect(reportContent).toContain('100%'); // モックデータは全て5ms以下
    });

    it('推奨事項をMarkdownレポートに含む', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const reportPath = await reportGenerator.generateMarkdownReport(mockResults);
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      
      // Assert: 推奨事項セクションが存在
      expect(reportContent).toContain('## 推奨事項');
      expect(reportContent).toMatch(/\d+\./); // 番号付きリスト
    });
  });

  describe('HTML レポート生成', () => {
    it('generateHTMLReport メソッドが存在する', () => {
      expect(reportGenerator.generateHTMLReport).toBeDefined();
      expect(typeof reportGenerator.generateHTMLReport).toBe('function');
    });

    it('基本的なHTMLレポートを生成できる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const reportPath = await reportGenerator.generateHTMLReport(mockResults, {
        includeCharts: true,
        theme: 'light',
        interactive: true
      });
      
      // Assert
      expect(reportPath).toContain('.html');
      
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      expect(reportContent).toContain('<html>');
      expect(reportContent).toContain('</html>');
      expect(reportContent).toContain('chart'); // Chart.js関連
    });

    it('Chart.jsグラフがHTMLレポートに含まれる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const reportPath = await reportGenerator.generateHTMLReport(mockResults, {
        includeCharts: true
      });
      
      // Assert
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      expect(reportContent).toContain('Chart.js');
      expect(reportContent).toContain('<canvas'); // グラフキャンバス
      expect(reportContent).toContain('type: "bar"'); // 棒グラフ
      expect(reportContent).toContain('type: "line"'); // 折れ線グラフ
    });

    it('インタラクティブ機能付きHTMLレポートを生成できる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const reportPath = await reportGenerator.generateHTMLReport(mockResults, {
        interactive: true,
        includeSearch: true,
        includeFilter: true
      });
      
      // Assert
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      expect(reportContent).toContain('onclick'); // インタラクティブ要素
      expect(reportContent).toContain('search'); // 検索機能
      expect(reportContent).toContain('filter'); // フィルタ機能
    });
  });

  describe('CSV エクスポート', () => {
    it('generateCSVExport メソッドが存在する', () => {
      expect(reportGenerator.generateCSVExport).toBeDefined();
      expect(typeof reportGenerator.generateCSVExport).toBe('function');
    });

    it('基本的なCSVエクスポートができる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act
      const csvPath = await reportGenerator.generateCSVExport(mockResults);
      
      // Assert
      expect(csvPath).toContain('.csv');
      
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.split('\\n');
      
      // ヘッダー行の確認
      expect(lines[0]).toContain('プロジェクト名');
      expect(lines[0]).toContain('実行時間(ms/file)');
      expect(lines[0]).toContain('5ms目標達成');
      expect(lines[0]).toContain('精度');
      
      // データ行の確認
      expect(lines.length).toBeGreaterThan(1); // ヘッダー + データ
      expect(lines[1]).toMatch(/,/); // CSV形式
    });

    it('ベースライン比較データを含むCSVエクスポート', async () => {
      // Arrange
      const mockIntegratedResult = createMockIntegratedResult(true);
      
      // Act
      const csvPath = await reportGenerator.generateCSVExport(
        mockIntegratedResult.results,
        { includeComparison: true, comparison: mockIntegratedResult.comparison }
      );
      
      // Assert
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain('改善率');
      expect(csvContent).toContain('ベースライン');
    });
  });

  describe('ダッシュボード生成', () => {
    it('generateDashboard メソッドが存在する', () => {
      expect(reportGenerator.generateDashboard).toBeDefined();
      expect(typeof reportGenerator.generateDashboard).toBe('function');
    });

    it('包括的なダッシュボードを生成できる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      const mockIntegratedResult = createMockIntegratedResult(true);
      
      // Act
      const dashboardPath = await reportGenerator.generateDashboard([mockIntegratedResult], {
        includeHistoricalData: true,
        includeTrendAnalysis: true,
        includeRecommendations: true
      });
      
      // Assert
      expect(dashboardPath).toContain('dashboard');
      expect(dashboardPath).toContain('.html');
      
      const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');
      
      // ダッシュボード要素の確認
      expect(dashboardContent).toContain('パフォーマンス概要');
      expect(dashboardContent).toContain('傾向分析');
      expect(dashboardContent).toContain('推奨事項');
      expect(dashboardContent).toContain('Chart.js'); // グラフライブラリ
    });

    it('時系列トレンドグラフがダッシュボードに含まれる', async () => {
      // Arrange: 複数の統合結果（時系列データ）
      const historicalData = [
        createMockIntegratedResult(false), // 1週間前
        createMockIntegratedResult(true),  // 現在
      ];
      
      // Act
      const dashboardPath = await reportGenerator.generateDashboard(historicalData, {
        includeTrendAnalysis: true
      });
      
      // Assert
      const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');
      expect(dashboardContent).toContain('type: "line"'); // 時系列グラフ
      expect(dashboardContent).toContain('時系列'); // 時系列分析
    });
  });

  describe('エラーハンドリング・Defensive Programming', () => {
    it('空の結果配列に対して適切にエラーハンドリングする', async () => {
      // Arrange: 空の結果
      const emptyResults: BenchmarkResult[] = [];
      
      // Act & Assert: エラーをthrowしない（デフォルト値で対応）
      await expect(reportGenerator.generateMarkdownReport(emptyResults)).resolves.toBeDefined();
    });

    it('出力ディレクトリが存在しない場合の自動作成', async () => {
      // Arrange: 存在しないディレクトリ
      const nonExistentDir = path.join(TEST_REPORT_DIR, 'deep', 'nested', 'path');
      const defensiveGenerator = new BenchmarkReportGenerator({
        outputDir: nonExistentDir
      });
      
      // Act
      const mockResults = createMockBenchmarkResults();
      const reportPath = await defensiveGenerator.generateMarkdownReport(mockResults);
      
      // Assert: ディレクトリが自動作成される
      const dirExists = await fs.access(path.dirname(reportPath)).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('不正なデータに対してもレポート生成が継続される', async () => {
      // Arrange: 部分的に不正なデータ
      const mixedResults = [
        createMockBenchmarkResult('valid-project', 2.5, 0.95, true),
        // 不正なデータを含むが、プロパティは最小限存在
        {
          success: false,
          projectName: 'invalid-project',
          timestamp: new Date().toISOString(),
          error: 'Simulated error',
          // その他のプロパティは不完全
        } as any
      ];
      
      // Act & Assert: エラーをthrowせず、有効なデータでレポート生成
      await expect(reportGenerator.generateMarkdownReport(mixedResults)).resolves.toBeDefined();
    });
  });

  describe('カスタマイゼーション機能', () => {
    it('カスタムテンプレートを使用できる', async () => {
      // Arrange: カスタムテンプレート設定
      const customGenerator = new BenchmarkReportGenerator({
        outputDir: TEST_REPORT_DIR,
        customTemplates: {
          markdown: 'custom-markdown-template.hbs',
          html: 'custom-html-template.hbs'
        }
      });
      
      const mockResults = createMockBenchmarkResults();
      
      // Act: カスタムテンプレートでレポート生成
      const reportPath = await customGenerator.generateMarkdownReport(mockResults);
      
      // Assert: カスタムテンプレートが使用される
      expect(reportPath).toBeDefined();
    });

    it('複数フォーマットの一括生成ができる', async () => {
      // Arrange
      const mockResults = createMockBenchmarkResults();
      
      // Act: 複数フォーマット一括生成
      const allReports = await reportGenerator.generateAllFormats(mockResults, {
        markdown: true,
        html: true,
        csv: true,
        dashboard: true
      });
      
      // Assert: 各フォーマットのファイルが生成される
      expect(allReports.markdown).toBeDefined();
      expect(allReports.html).toBeDefined();
      expect(allReports.csv).toBeDefined();
      expect(allReports.dashboard).toBeDefined();
      
      // ファイル存在確認
      const files = await Promise.all([
        fs.access(allReports.markdown!).then(() => true).catch(() => false),
        fs.access(allReports.html!).then(() => true).catch(() => false),
        fs.access(allReports.csv!).then(() => true).catch(() => false),
        fs.access(allReports.dashboard!).then(() => true).catch(() => false)
      ]);
      
      expect(files.every(exists => exists)).toBe(true);
    });
  });
});

// ===== ヘルパー関数 =====

/**
 * モックベンチマーク結果の作成
 */
function createMockBenchmarkResults(): BenchmarkResult[] {
  return [
    createMockBenchmarkResult('TypeScript', 2.1, 0.96, true),
    createMockBenchmarkResult('Ant Design', 3.8, 0.89, true),
    createMockBenchmarkResult('VS Code', 4.2, 0.85, true),
    createMockBenchmarkResult('Material UI', 2.9, 0.92, true),
    createMockBenchmarkResult('Storybook', 3.5, 0.88, true)
  ];
}

/**
 * モック統合結果の作成
 */
function createMockIntegratedResult(includeComparison: boolean): BaselineIntegratedResult {
  const results = createMockBenchmarkResults();
  const baselineId = 'baseline-' + Date.now();
  
  let comparison: BaselineComparison | undefined;
  let usedBaselineId: string | undefined;
  
  if (includeComparison) {
    usedBaselineId = 'baseline-previous';
    comparison = {
      comparedAt: new Date().toISOString(),
      baselineId: usedBaselineId,
      overallImprovement: 15.3, // 15.3%改善
      projectComparisons: results.map((result, index) => ({
        projectName: result.projectName,
        performanceImprovement: 10 + (index * 5), // 10%, 15%, 20%など
        accuracyImprovement: 2 + (index * 1), // 2%, 3%, 4%など
        target5msStatus: 'maintained' as const,
        baselineMetrics: {
          timePerFile: result.performance.timePerFile + 0.5,
          accuracy: result.accuracy.taintTyperSuccessRate - 0.02
        },
        currentMetrics: {
          timePerFile: result.performance.timePerFile,
          accuracy: result.accuracy.taintTyperSuccessRate
        }
      })),
      target5msImprovements: {
        improved: ['Material UI'],
        maintained: ['TypeScript', 'Ant Design', 'VS Code', 'Storybook'],
        degraded: []
      },
      recommendations: [
        '優秀な性能です。現在の最適化戦略を継続してください。',
        'Material UIで大幅な改善が見られました。この手法を他のプロジェクトにも適用を検討してください。'
      ]
    };
  }
  
  return {
    results,
    comparison,
    baselineId,
    usedBaselineId
  };
}

/**
 * 個別モックベンチマーク結果の作成
 */
function createMockBenchmarkResult(
  projectName: string,
  timePerFile: number,
  accuracyRate: number,
  target5msAchieved: boolean
): BenchmarkResult {
  return {
    success: true,
    projectName,
    timestamp: new Date().toISOString(),
    performance: {
      executionTime: timePerFile * 1000, // 仮の総時間
      timePerFile,
      totalFiles: 1000,
      memoryUsage: {
        heapUsed: 150 * 1024 * 1024, // 150MB
        heapTotal: 200 * 1024 * 1024, // 200MB
        external: 20 * 1024 * 1024,  // 20MB
        rss: 250 * 1024 * 1024        // 250MB
      },
      throughput: 1000 / (timePerFile * 1000 / 1000), // files/second
      cpuUsage: 45.2,
      parallelEfficiency: 0.85
    },
    accuracy: {
      taintTyperSuccessRate: accuracyRate,
      intentExtractionSuccessRate: accuracyRate * 0.92,
      gapDetectionAccuracy: accuracyRate * 0.95,
      errorRate: 1 - accuracyRate,
      totalErrors: Math.floor((1 - accuracyRate) * 100),
      successfulFiles: Math.floor(accuracyRate * 1000),
      failedFiles: Math.floor((1 - accuracyRate) * 1000)
    },
    target5ms: {
      achieved: target5msAchieved,
      actualTimePerFile: timePerFile,
      targetTimePerFile: 5.0,
      deviationPercent: ((timePerFile - 5.0) / 5.0) * 100
    },
    systemInfo: {
      platform: 'darwin',
      arch: 'x64',
      cpus: 8,
      totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
      nodeVersion: 'v18.17.0'
    }
  };
}