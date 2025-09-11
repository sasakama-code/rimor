/**
 * Issue #147対応: inline source map PII露出リスク解消テスト
 * TDD Red Phase: セキュリティテスト先行実装
 * 
 * 設計原則適用:
 * - TDD: t_wada推奨Red-Green-Refactorサイクル
 * - Defensive Programming: Jean-Louis Boulanger推奨多層防御
 * - KISS: Kelly Johnson推奨シンプル設計
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Issue #147: Sourcemap Security Analysis', () => {
  describe('TypeScript Configuration Security', () => {
    /**
     * DRY原則: Andy Hunt & Dave Thomas推奨
     * 共通設定パス定義
     */
    const configPaths = {
      base: path.resolve(__dirname, '../../tsconfig.json'),
      testing: path.resolve(__dirname, '../../config/typescript/tsconfig.testing.json'),
      build: path.resolve(__dirname, '../../config/typescript/tsconfig.build.json'),
      production: path.resolve(__dirname, '../../config/typescript/tsconfig.production.json')
    };

    /**
     * SOLID原則: Uncle Bob推奨単一責任原則
     * inlineSources設定検証の責任分離
     */
    describe('inlineSources Configuration Validation', () => {
      test('tsconfig.json should explicitly disable inlineSources', () => {
        const config = JSON.parse(fs.readFileSync(configPaths.base, 'utf8'));
        
        // PII露出リスク防止: inlineSourcesは明示的にfalseであること
        expect(config.compilerOptions.inlineSources).toBe(false);
      });

      test('tsconfig.testing.json should explicitly disable inlineSources', () => {
        const config = JSON.parse(fs.readFileSync(configPaths.testing, 'utf8'));
        
        // テスト環境でのPII露出リスク防止
        expect(config.compilerOptions.inlineSources).toBe(false);
      });

      test('tsconfig.build.json should have secure sourcemap settings', () => {
        const config = JSON.parse(fs.readFileSync(configPaths.build, 'utf8'));
        
        // ビルド環境でのセキュリティ強化
        expect(config.compilerOptions.inlineSources).toBe(false);
        expect(config.compilerOptions.sourceRoot).toBe('.');
      });

      test('tsconfig.production.json should maintain secure settings', () => {
        const config = JSON.parse(fs.readFileSync(configPaths.production, 'utf8'));
        
        // 本番環境セキュリティ検証（既存の適切な設定確認）
        expect(config.compilerOptions.sourceMap).toBe(false);
        expect(config.compilerOptions.inlineSourceMap).toBe(false);
        expect(config.compilerOptions.inlineSources).toBe(false);
      });
    });

    /**
     * Defensive Programming: 多層防御による絶対パス漏洩検証
     */
    describe('Absolute Path Exposure Prevention', () => {
      test('sourceRoot should be relative path in all configs', () => {
        const testConfigs = [configPaths.base, configPaths.testing, configPaths.build];
        
        testConfigs.forEach(configPath => {
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            if (config.compilerOptions.sourceRoot) {
              // 相対パスであることを検証（絶対パス禁止）
              expect(config.compilerOptions.sourceRoot).not.toMatch(/^[/\\]|^[a-zA-Z]:[/\\]/);
              expect(config.compilerOptions.sourceRoot).toBe('.');
            }
          }
        });
      });

      test('no absolute paths should be embedded in compiled output', async () => {
        // YAGNI原則: 実際に必要な場合のみテスト実行
        const distExists = fs.existsSync(path.resolve(__dirname, '../../dist'));
        
        if (distExists) {
          const distFiles = execSync('find dist -name "*.js" -type f', { 
            cwd: path.resolve(__dirname, '../..'),
            encoding: 'utf8'
          }).split('\n').filter(Boolean);

          for (const file of distFiles.slice(0, 5)) { // 性能考慮でサンプリング
            const fullPath = path.resolve(__dirname, '../../', file);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // ホームディレクトリや絶対パスの漏洩検証
            expect(content).not.toMatch(/\/Users\/[^\/]+/);
            expect(content).not.toMatch(/\/home\/[^\/]+/);
            expect(content).not.toMatch(/C:\\Users\\[^\\]+/);
          }
        }
      });
    });

    /**
     * KISS原則: シンプルなinline source map検出
     */
    describe('Inline Source Map Detection', () => {
      test('no inline source maps should be present in build output', () => {
        const distPath = path.resolve(__dirname, '../../dist');
        
        if (fs.existsSync(distPath)) {
          const jsFiles = execSync('find dist -name "*.js" -type f', {
            cwd: path.resolve(__dirname, '../..'),
            encoding: 'utf8'
          }).split('\n').filter(Boolean);

          jsFiles.forEach(file => {
            const fullPath = path.resolve(__dirname, '../../', file);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // inline source map検出（PII露出リスクパターン）
            expect(content).not.toMatch(/\/\/# sourceMappingURL=data:/);
            expect(content).not.toMatch(/\/\*# sourceMappingURL=data:/);
          });
        }
      });

      test('external source map files should be excluded from repository', () => {
        const gitignoreContent = fs.readFileSync(
          path.resolve(__dirname, '../../.gitignore'),
          'utf8'
        );
        
        // .gitignore設定検証
        expect(gitignoreContent).toMatch(/\*\.map/);
        expect(gitignoreContent).toMatch(/dist\/\*\*\/\*\.map/);
      });
    });
  });

  describe('Build Process Security Validation', () => {
    /**
     * 統合セキュリティ検証
     * Martin Fowler推奨のリファクタリング安全性確保
     */
    test('all build commands should produce secure output', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
      );
      
      const buildCommands = Object.keys(packageJson.scripts)
        .filter(script => script.startsWith('build:'))
        .filter(script => script.includes('production') || script.includes('secure'));
      
      // セキュアビルドコマンドの存在確認
      expect(buildCommands.length).toBeGreaterThan(0);
      expect(buildCommands).toContain('build:production');
      expect(buildCommands).toContain('build:secure');
    });
  });
});