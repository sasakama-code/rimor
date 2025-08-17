import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TypeScript Project Referencesの動作テスト
 * 
 * テスト要件:
 * - 各モジュールが独立してビルド可能
 * - 依存関係が正しく解決
 * - インクリメンタルビルドが動作
 */
describe('TypeScript Project References', () => {
  const rootDir = process.cwd();
  const typesDir = path.join(rootDir, 'src', 'types');
  
  describe('Module Configuration', () => {
    test('should have tsconfig for each type module', () => {
      const expectedModules = [
        'ai',
        'analysis', 
        'domain',
        'plugins',
        'security',
        'shared',
        'testing',
        'workers'
      ];
      
      for (const module of expectedModules) {
        const tsconfigPath = path.join(typesDir, module, 'tsconfig.json');
        expect(fs.existsSync(tsconfigPath)).toBe(true);
      }
    });

    test('root tsconfig should reference all type modules', () => {
      const rootTsconfig = JSON.parse(
        fs.readFileSync(path.join(rootDir, 'tsconfig.json'), 'utf8')
      );
      
      expect(rootTsconfig.references).toBeDefined();
      expect(Array.isArray(rootTsconfig.references)).toBe(true);
      
      const expectedRefs = [
        { path: './src/types/ai' },
        { path: './src/types/analysis' },
        { path: './src/types/domain' },
        { path: './src/types/plugins' },
        { path: './src/types/security' },
        { path: './src/types/shared' },
        { path: './src/types/testing' },
        { path: './src/types/workers' }
      ];
      
      for (const ref of expectedRefs) {
        expect(rootTsconfig.references).toContainEqual(ref);
      }
    });
  });

  describe('Build Performance', () => {
    test('should build with --build flag successfully', () => {
      const startTime = Date.now();
      
      try {
        execSync('npx tsc --build', { 
          encoding: 'utf8',
          timeout: 30000
        });
      } catch (error: any) {
        // エラーの詳細を出力
        console.error('Build error:', error.stdout || error.stderr);
        throw error;
      }
      
      const buildTime = (Date.now() - startTime) / 1000;
      
      // Project Referencesを使用したビルドも高速であるべき
      expect(buildTime).toBeLessThan(15);
    }, 35000);

    test('should perform incremental build faster', () => {
      // 最初のビルド
      execSync('npx tsc --build', { encoding: 'utf8' });
      
      // ダミーファイルを変更
      const testFile = path.join(typesDir, 'shared', 'test-dummy.ts');
      fs.writeFileSync(testFile, 'export const dummy = 1;');
      
      const startTime = Date.now();
      
      try {
        execSync('npx tsc --build', { 
          encoding: 'utf8',
          timeout: 10000 
        });
      } finally {
        // クリーンアップ
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
      
      const buildTime = (Date.now() - startTime) / 1000;
      
      // インクリメンタルビルドは更に高速
      expect(buildTime).toBeLessThan(5);
    }, 15000);
  });

  describe('Dependency Resolution', () => {
    test('should correctly resolve inter-module dependencies', () => {
      // 各モジュールのindex.tsが存在するか確認
      const modules = [
        'ai', 'analysis', 'domain', 'plugins', 
        'security', 'shared', 'testing', 'workers'
      ];
      
      for (const module of modules) {
        const indexPath = path.join(typesDir, module, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
      }
    });

    test('should generate tsbuildinfo files for caching', () => {
      // ビルドを実行
      execSync('npx tsc --build', { encoding: 'utf8' });
      
      // tsbuildinfoファイルが生成されているか確認
      const tsbuildInfoPath = path.join(rootDir, 'tsconfig.tsbuildinfo');
      expect(fs.existsSync(tsbuildInfoPath)).toBe(true);
      
      // ファイルサイズが適切か確認（キャッシュ情報が含まれている）
      const stats = fs.statSync(tsbuildInfoPath);
      expect(stats.size).toBeGreaterThan(1000); // 最低限のサイズ
    });
  });

  describe('Clean Build', () => {
    test('should clean build artifacts with --clean flag', () => {
      // まずビルド
      execSync('npx tsc --build', { encoding: 'utf8' });
      
      // tsbuildinfoが存在することを確認
      const tsbuildInfoPath = path.join(rootDir, 'tsconfig.tsbuildinfo');
      expect(fs.existsSync(tsbuildInfoPath)).toBe(true);
      
      // cleanを実行
      execSync('npx tsc --build --clean', { encoding: 'utf8' });
      
      // tsbuildinfoが削除されていることを確認
      expect(fs.existsSync(tsbuildInfoPath)).toBe(false);
    });
  });
});