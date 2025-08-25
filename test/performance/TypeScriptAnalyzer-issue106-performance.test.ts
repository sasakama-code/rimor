/**
 * TypeScriptAnalyzer Performance Test for Issue #106
 * Program再構築のパフォーマンス影響を測定
 */

import { TypeScriptAnalyzer } from '../../src/intent-analysis/TypeScriptAnalyzer';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('TypeScriptAnalyzer Performance Test - Issue #106', () => {
  let analyzer: TypeScriptAnalyzer;
  let tempDir: string;
  
  beforeAll(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = path.join(os.tmpdir(), 'ts-analyzer-perf-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    // tsconfig.jsonを作成
    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        incremental: true
      }
    };
    await fs.writeFile(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    analyzer = new TypeScriptAnalyzer();
    await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
  });
  
  afterAll(async () => {
    // 一時ディレクトリをクリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  it('Program非参加ファイルの型解決パフォーマンス測定', async () => {
    // 複数のファイルを作成
    const baseTypes = `
      export interface User { id: number; name: string; }
      export type UserId = number;
      export interface ApiResponse<T> { data: T; status: number; }
    `;
    await fs.writeFile(path.join(tempDir, 'types.ts'), baseTypes);
    
    // Program外ファイルを複数作成
    const externalFiles: string[] = [];
    for (let i = 0; i < 10; i++) {
      const filePath = path.join(tempDir, `external${i}.ts`);
      const content = `
        import { User, UserId, ApiResponse } from './types';
        
        const user${i}: User = { id: ${i}, name: "User ${i}" };
        const userId${i}: UserId = ${i};
        const response${i}: ApiResponse<User> = { data: user${i}, status: 200 };
        
        function processUser${i}(u: User): UserId {
          return u.id;
        }
      `;
      await fs.writeFile(filePath, content);
      externalFiles.push(filePath);
    }
    
    console.log('Program非参加ファイルのパフォーマンステストを開始...');
    
    // パフォーマンス測定
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage().heapUsed;
    
    // 各ファイルの型情報を取得
    const results: Array<{ file: string; typeCount: number; duration: number }> = [];
    
    for (const filePath of externalFiles) {
      const fileStartTime = process.hrtime.bigint();
      
      // 複数の型情報を取得
      const content = await fs.readFile(filePath, 'utf-8');
      const userTypeInfo = await analyzer.getTypeInfo(filePath, content.indexOf('user'));
      const userIdTypeInfo = await analyzer.getTypeInfo(filePath, content.indexOf('userId'));
      const responseTypeInfo = await analyzer.getTypeInfo(filePath, content.indexOf('response'));
      
      const fileEndTime = process.hrtime.bigint();
      const fileDuration = Number(fileEndTime - fileStartTime) / 1000000; // ms
      
      results.push({
        file: path.basename(filePath),
        typeCount: [userTypeInfo, userIdTypeInfo, responseTypeInfo].filter(t => t).length,
        duration: fileDuration
      });
    }
    
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;
    
    const totalDuration = Number(endTime - startTime) / 1000000; // ms
    const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB
    const averageDuration = totalDuration / externalFiles.length;
    
    console.log(`\n=== パフォーマンス測定結果 ===`);
    console.log(`総処理時間: ${totalDuration.toFixed(2)} ms`);
    console.log(`平均処理時間/ファイル: ${averageDuration.toFixed(2)} ms`);
    console.log(`メモリ増加: ${memoryIncrease.toFixed(2)} MB`);
    console.log(`処理速度: ${(1000 / averageDuration).toFixed(2)} files/sec`);
    console.log(`\n=== ファイル別詳細 ===`);
    
    results.forEach((result, index) => {
      console.log(`${result.file}: ${result.duration.toFixed(2)}ms, 型情報${result.typeCount}個`);
    });
    
    // アサーション
    expect(totalDuration).toBeLessThan(5000); // 5秒以内
    expect(averageDuration).toBeLessThan(500); // 平均500ms以内
    expect(memoryIncrease).toBeLessThan(100); // メモリ増加100MB以内
    
    // 型情報が正確に取得できていることを確認
    results.forEach(result => {
      expect(result.typeCount).toBeGreaterThanOrEqual(2); // 最低2個の型情報が取得できている
    });
    
    console.log('\n✅ パフォーマンステスト完了');
  });
  
  it('キャッシュ効率テスト（同一ファイルの複数回アクセス）', async () => {
    const testFile = path.join(tempDir, 'cache-test.ts');
    const content = `
      export interface CacheTestType { value: string; }
      const cacheTest: CacheTestType = { value: "test" };
    `;
    await fs.writeFile(testFile, content);
    
    // 1回目の実行
    const firstStart = process.hrtime.bigint();
    const firstResult = await analyzer.getTypeInfo(testFile, content.indexOf('cacheTest'));
    const firstEnd = process.hrtime.bigint();
    const firstDuration = Number(firstEnd - firstStart) / 1000000;
    
    // 2回目の実行（キャッシュ効果確認）
    const secondStart = process.hrtime.bigint();
    const secondResult = await analyzer.getTypeInfo(testFile, content.indexOf('cacheTest'));
    const secondEnd = process.hrtime.bigint();
    const secondDuration = Number(secondEnd - secondStart) / 1000000;
    
    console.log(`\n=== キャッシュ効率テスト ===`);
    console.log(`1回目: ${firstDuration.toFixed(2)}ms`);
    console.log(`2回目: ${secondDuration.toFixed(2)}ms`);
    console.log(`高速化率: ${((firstDuration - secondDuration) / firstDuration * 100).toFixed(2)}%`);
    
    // 結果が同一であることを確認
    expect(firstResult?.typeName).toBe(secondResult?.typeName);
    
    // 2回目が高速化されていることを期待（Program再構築が不要なため）
    expect(secondDuration).toBeLessThanOrEqual(firstDuration);
    
    console.log('✅ キャッシュ効率テスト完了');
  }, 10000);
});