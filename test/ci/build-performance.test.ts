import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CI/CDパイプラインのビルドパフォーマンステスト
 * 
 * テスト要件:
 * - ビルド時間: 30秒以下
 * - 型チェック時間: 20秒以下
 * - インクリメンタルビルド時間: 10秒以下
 */
// グローバル定数
const BENCHMARK_RESULTS_PATH = path.join(process.cwd(), '.rimor', 'reports', 'ci', 'benchmark.json');

describe('Build Performance', () => {
  beforeAll(() => {
    // ベンチマーク結果ディレクトリを作成
    const dir = path.dirname(BENCHMARK_RESULTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  describe('TypeScript Compilation', () => {
    test('should complete full build within 30 seconds', () => {
      const startTime = Date.now();
      
      try {
        execSync('npm run build:simple', { 
          encoding: 'utf8',
          timeout: 35000 // 35秒でタイムアウト
        });
      } catch (error) {
        throw new Error(`Build failed or timed out: ${error}`);
      }
      
      const buildTime = (Date.now() - startTime) / 1000;
      
      // ベンチマーク結果を保存
      saveBenchmarkResult('full_build', buildTime);
      
      expect(buildTime).toBeLessThan(30);
    }, 40000);

    test('should complete incremental build within 10 seconds', () => {
      // 最初のビルドを実行（キャッシュ作成）
      execSync('npm run build:simple', { encoding: 'utf8' });
      
      // ダミーの変更を加える
      const testFile = path.join(process.cwd(), 'src', 'test-dummy.ts');
      fs.writeFileSync(testFile, '// Test comment for incremental build\nexport const dummy = 1;');
      
      const startTime = Date.now();
      
      try {
        execSync('npm run build:simple', { 
          encoding: 'utf8',
          timeout: 15000
        });
      } catch (error) {
        throw new Error(`Incremental build failed: ${error}`);
      } finally {
        // クリーンアップ
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
      
      const buildTime = (Date.now() - startTime) / 1000;
      
      saveBenchmarkResult('incremental_build', buildTime);
      
      expect(buildTime).toBeLessThan(10);
    }, 20000);
  });

  describe('Type Checking', () => {
    test('should complete type check within 20 seconds', () => {
      const startTime = Date.now();
      
      try {
        execSync('npx tsc --noEmit', { 
          encoding: 'utf8',
          timeout: 25000
        });
      } catch (error) {
        throw new Error(`Type check failed: ${error}`);
      }
      
      const typeCheckTime = (Date.now() - startTime) / 1000;
      
      saveBenchmarkResult('type_check', typeCheckTime);
      
      expect(typeCheckTime).toBeLessThan(20);
    }, 30000);

    test('should have no type errors in strict mode', () => {
      let result;
      try {
        result = execSync('npx tsc --noEmit --strict', { 
          encoding: 'utf8'
        });
      } catch (error: any) {
        // エラー出力を解析
        const errorOutput = error.stdout || error.stderr || '';
        const errorCount = (errorOutput.match(/error TS/g) || []).length;
        
        saveBenchmarkResult('strict_mode_errors', errorCount);
        
        // エラーがある場合は詳細を出力
        if (errorCount > 0) {
          console.error(`Found ${errorCount} type errors in strict mode`);
        }
        
        expect(errorCount).toBe(0);
      }
    });
  });

  describe('Bundle Size', () => {
    test('should produce bundle smaller than 1MB', () => {
      // ビルドを実行
      execSync('npm run build:simple', { encoding: 'utf8' });
      
      const distPath = path.join(process.cwd(), 'dist');
      const totalSize = calculateDirectorySize(distPath);
      const sizeInMB = totalSize / (1024 * 1024);
      
      saveBenchmarkResult('bundle_size_mb', sizeInMB);
      
      expect(sizeInMB).toBeLessThan(1);
    });
  });

  describe('Memory Usage', () => {
    test('should use less than 1GB memory during build', () => {
      const startMemory = process.memoryUsage().heapUsed;
      
      execSync('npm run build:simple', { encoding: 'utf8' });
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (endMemory - startMemory) / (1024 * 1024);
      
      saveBenchmarkResult('build_memory_mb', memoryUsedMB);
      
      expect(memoryUsedMB).toBeLessThan(1024); // 1GB
    });
  });

  afterAll(() => {
    // ベンチマーク結果のサマリーを生成
    generateBenchmarkSummary();
  });
});

/**
 * ベンチマーク結果を保存
 */
function saveBenchmarkResult(metric: string, value: number): void {
  let results: any = {};
  
  if (fs.existsSync(BENCHMARK_RESULTS_PATH)) {
    results = JSON.parse(fs.readFileSync(BENCHMARK_RESULTS_PATH, 'utf8'));
  }
  
  if (!results.metrics) {
    results.metrics = {};
  }
  
  results.metrics[metric] = {
    value,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(BENCHMARK_RESULTS_PATH, JSON.stringify(results, null, 2));
}

/**
 * ディレクトリサイズを計算
 */
function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

/**
 * ベンチマークサマリーを生成
 */
function generateBenchmarkSummary(): void {
  if (!fs.existsSync(BENCHMARK_RESULTS_PATH)) {
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(BENCHMARK_RESULTS_PATH, 'utf8'));
  const summaryPath = path.join(path.dirname(BENCHMARK_RESULTS_PATH), 'benchmark-summary.md');
  
  let summary = '# CI/CD ベンチマーク結果\n\n';
  summary += `実行日時: ${new Date().toISOString()}\n\n`;
  summary += '## パフォーマンスメトリクス\n\n';
  summary += '| メトリクス | 値 | 目標 | 結果 |\n';
  summary += '|-----------|-----|------|------|\n';
  
  const targets = {
    'full_build': { target: 30, unit: '秒', label: 'フルビルド時間' },
    'incremental_build': { target: 10, unit: '秒', label: 'インクリメンタルビルド時間' },
    'type_check': { target: 20, unit: '秒', label: '型チェック時間' },
    'bundle_size_mb': { target: 1, unit: 'MB', label: 'バンドルサイズ' },
    'build_memory_mb': { target: 1024, unit: 'MB', label: 'ビルド時メモリ使用量' },
    'strict_mode_errors': { target: 0, unit: '個', label: 'strictモードエラー数' }
  };
  
  for (const [key, config] of Object.entries(targets)) {
    const metric = results.metrics?.[key];
    if (metric) {
      const value = metric.value;
      const passed = value <= config.target;
      const status = passed ? '✅' : '❌';
      summary += `| ${config.label} | ${value.toFixed(2)}${config.unit} | ${config.target}${config.unit} | ${status} |\n`;
    }
  }
  
  fs.writeFileSync(summaryPath, summary);
  console.log('\nBenchmark summary saved to:', summaryPath);
}