import { PluginCreateCommand } from '../../src/cli/commands/plugin-create';
import * as fs from 'fs';
import * as path from 'path';

describe('Plugin Creation Performance', () => {
  let command: PluginCreateCommand;
  const testOutputDir = path.join(__dirname, '../../temp-test-plugins');

  beforeEach(() => {
    command = new PluginCreateCommand();
    
    // テスト用一時ディレクトリの作成
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用ファイルのクリーンアップ
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    
    // src/plugins/generated も削除
    const generatedDir = path.join(__dirname, '../../src/plugins/generated');
    if (fs.existsSync(generatedDir)) {
      fs.rmSync(generatedDir, { recursive: true, force: true });
    }
  });

  describe('Template Plugin Generation Performance', () => {
    const templates = ['basic', 'pattern-match', 'async-await', 'api-test', 'validation'];

    templates.forEach(template => {
      it(`should generate ${template} plugin within performance target`, async () => {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();

        // テンプレートからプラグインを生成
        await command.execute({
          template: template
        });

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();

        // 実行時間の測定（ナノ秒をミリ秒に変換）
        const executionTimeMs = Number(endTime - startTime) / 1_000_000;
        
        // メモリ使用量の変化
        const memoryDelta = {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external
        };

        console.log(`${template} plugin generation:`);
        console.log(`  Execution time: ${executionTimeMs.toFixed(2)}ms`);
        console.log(`  Memory delta (MB): RSS: ${(memoryDelta.rss / 1024 / 1024).toFixed(2)}, Heap: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}`);

        // パフォーマンス目標のアサーション
        expect(executionTimeMs).toBeLessThan(3000); // 3秒以内
        expect(memoryDelta.heapUsed).toBeLessThan(50 * 1024 * 1024); // 50MB以内

        // 生成されたファイルの存在確認
        const expectedFile = path.join(__dirname, `../../src/plugins/generated/${template}-plugin.ts`);
        expect(fs.existsSync(expectedFile)).toBe(true);

        // ファイルサイズの確認
        const fileStats = fs.statSync(expectedFile);
        expect(fileStats.size).toBeGreaterThan(100); // 最低100バイト
        expect(fileStats.size).toBeLessThan(10 * 1024); // 10KB以内
      });
    });
  });

  describe('Batch Plugin Generation Performance', () => {
    it('should handle multiple plugin generations efficiently', async () => {
      const templates = ['basic', 'pattern-match', 'async-await'];
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      // 複数のプラグインを連続で生成
      for (const template of templates) {
        await command.execute({
          template: template
        });
      }

      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();

      const totalExecutionTime = Number(endTime - startTime) / 1_000_000;
      const averageExecutionTime = totalExecutionTime / templates.length;
      
      const memoryDelta = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed
      };

      console.log(`Batch generation of ${templates.length} plugins:`);
      console.log(`  Total time: ${totalExecutionTime.toFixed(2)}ms`);
      console.log(`  Average time per plugin: ${averageExecutionTime.toFixed(2)}ms`);
      console.log(`  Total memory delta (MB): RSS: ${(memoryDelta.rss / 1024 / 1024).toFixed(2)}, Heap: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}`);

      // パフォーマンス目標
      expect(totalExecutionTime).toBeLessThan(8000); // 8秒以内
      expect(averageExecutionTime).toBeLessThan(3000); // 平均3秒以内
      expect(memoryDelta.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB以内

      // 全ファイルの生成確認
      templates.forEach(template => {
        const expectedFile = path.join(__dirname, `../../src/plugins/generated/${template}-plugin.ts`);
        expect(fs.existsSync(expectedFile)).toBe(true);
      });
    });
  });

  describe('Memory Efficiency', () => {
    it('should not cause memory leaks during multiple operations', async () => {
      const iterations = 5;
      const memorySnapshots: any[] = [];

      for (let i = 0; i < iterations; i++) {
        await command.execute({
          template: 'basic'
        });

        // ガベージコレクションを強制実行（可能な場合）
        if (global.gc) {
          global.gc();
        }

        memorySnapshots.push(process.memoryUsage());
        
        // 生成されたファイルを削除（メモリリークテストのため）
        const generatedDir = path.join(__dirname, '../../src/plugins/generated');
        if (fs.existsSync(generatedDir)) {
          fs.rmSync(generatedDir, { recursive: true, force: true });
        }
      }

      // メモリ使用量の傾向を分析
      const heapUsages = memorySnapshots.map(snapshot => snapshot.heapUsed);
      const firstHeapUsage = heapUsages[0];
      const lastHeapUsage = heapUsages[heapUsages.length - 1];
      const memoryGrowth = lastHeapUsage - firstHeapUsage;

      console.log(`Memory leak test (${iterations} iterations):`);
      console.log(`  Initial heap: ${(firstHeapUsage / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final heap: ${(lastHeapUsage / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

      // メモリ増加が合理的な範囲内であることを確認
      const growthThreshold = 20 * 1024 * 1024; // 20MB
      expect(memoryGrowth).toBeLessThan(growthThreshold);
    });
  });

  describe('Template Complexity Performance', () => {
    it('should generate complex templates efficiently', async () => {
      // 最も複雑なテンプレート（validation）のパフォーマンステスト
      const startTime = process.hrtime.bigint();
      
      await command.execute({
        template: 'validation'
      });

      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1_000_000;

      console.log(`Complex template (validation) generation: ${executionTime.toFixed(2)}ms`);

      // 複雑なテンプレートでも高速であることを確認
      expect(executionTime).toBeLessThan(3000); // 3秒以内

      // 生成されたファイルの内容を確認
      const generatedFile = path.join(__dirname, '../../src/plugins/generated/validation-plugin.ts');
      expect(fs.existsSync(generatedFile)).toBe(true);
      
      const content = fs.readFileSync(generatedFile, 'utf-8');
      expect(content).toContain('ValidationPlugin');
      expect(content).toContain('boundary');
      expect(content).toContain('validation');
      expect(content.length).toBeGreaterThan(1000); // 十分な内容があることを確認
    });
  });
});