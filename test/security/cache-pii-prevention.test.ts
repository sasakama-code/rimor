/**
 * @file キャッシュファイル内PII（個人識別情報）防止テスト
 * @description Issue #120対応 - Jestキャッシュファイルに絶対パスが含まれることを防ぐテスト
 * TDD Red Phase: 現在は失敗するが、修正後は成功するテスト
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Cache PII Prevention - Issue #120', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const cacheDirectories = [
    path.join(projectRoot, '.cache'),
    path.join(projectRoot, '.jest-cache'),
    path.join(projectRoot, '.turbo'),
    path.join(projectRoot, '.nx/cache'),
  ];

  /**
   * キャッシュファイル内の絶対パス検出ヘルパー
   * @param filePath チェック対象のファイルパス
   * @returns 絶対パスが見つかった場合はその配列、見つからない場合は空配列
   */
  function detectAbsolutePathsInFile(filePath: string): string[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const absolutePathPatterns = [
        /\/Users\/[^\/\s]+\/Projects\/Rimor/g,  // 具体的なプロジェクトパス
        /\/Users\/[^\/\s]+\/[^\s]*Rimor[^\s]*/g, // より広範囲なユーザーパス
        new RegExp(process.env.HOME + '[^\\s]*', 'g'), // HOMEディレクトリ配下のパス
      ];
      
      const foundPaths: string[] = [];
      for (const pattern of absolutePathPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          foundPaths.push(...matches);
        }
      }
      
      return [...new Set(foundPaths)]; // 重複除去
    } catch (error) {
      // バイナリファイルや読み取りエラーの場合はスキップ
      return [];
    }
  }

  /**
   * ディレクトリを再帰的に走査してキャッシュファイルを探す
   * @param dirPath 走査対象のディレクトリ
   * @param maxDepth 最大探索深度（無限ループ防止）
   * @returns ファイルパスの配列
   */
  function findCacheFiles(dirPath: string, maxDepth: number = 3): string[] {
    const files: string[] = [];
    
    if (maxDepth <= 0 || !fs.existsSync(dirPath)) {
      return files;
    }
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // キャッシュ関連ディレクトリの場合は再帰的に探索
          if (entry.name.includes('cache') || entry.name.includes('jest')) {
            files.push(...findCacheFiles(fullPath, maxDepth - 1));
          }
        } else if (entry.isFile()) {
          // キャッシュファイルの可能性があるものをチェック
          const shouldCheck = 
            entry.name.includes('cache') ||
            entry.name.includes('transform') ||
            fullPath.includes('jest-transform-cache') ||
            fullPath.includes('perf-cache');
            
          if (shouldCheck) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // アクセス権限エラー等はスキップ
    }
    
    return files;
  }

  describe('絶対パス検出テスト（TDD Red Phase）', () => {
    test('キャッシュファイルに絶対パスが含まれていないこと', () => {
      const allViolations: { file: string; paths: string[] }[] = [];
      
      for (const cacheDir of cacheDirectories) {
        if (fs.existsSync(cacheDir)) {
          const cacheFiles = findCacheFiles(cacheDir);
          
          for (const cacheFile of cacheFiles) {
            const absolutePaths = detectAbsolutePathsInFile(cacheFile);
            
            if (absolutePaths.length > 0) {
              allViolations.push({
                file: cacheFile,
                paths: absolutePaths
              });
            }
          }
        }
      }
      
      // 違反が見つかった場合は詳細情報と共にテスト失敗
      if (allViolations.length > 0) {
        const violationDetails = allViolations.map(violation => 
          `ファイル: ${violation.file}\n  絶対パス: ${violation.paths.join(', ')}`
        ).join('\n\n');
        
        throw new Error(`キャッシュファイル内に絶対パスが検出されました。PII露出リスクがあります:\n\n${violationDetails}\n\n` +
             `対処方法:\n` +
             `1. npm run clean:cache でキャッシュをクリア\n` +
             `2. Jest設定でsourcemapPathTransformを追加して相対パス化\n` +
             `3. CI環境でキャッシュを無効化`);
      }
      
      // 違反がない場合はテスト成功
      expect(allViolations).toHaveLength(0);
    });

    test('特定の問題ファイル IntentPatternMatcher 関連キャッシュの検査', () => {
      const problemFiles = findCacheFiles(path.join(projectRoot, '.cache'))
        .filter(file => file.includes('IntentPatternMatcher'));
      
      const violations: string[] = [];
      
      for (const file of problemFiles) {
        const absolutePaths = detectAbsolutePathsInFile(file);
        if (absolutePaths.length > 0) {
          violations.push(`${file}: ${absolutePaths.slice(0, 3).join(', ')}...`);
        }
      }
      
      if (violations.length > 0) {
        throw new Error(`IntentPatternMatcher関連キャッシュファイルに絶対パスが含まれています:\n${violations.join('\n')}`);
      }
      
      expect(violations).toHaveLength(0);
    });
  });

  describe('環境別キャッシュ設定の検証', () => {
    test('CI環境ではキャッシュが適切に無効化されること', () => {
      const originalCI = process.env.CI;
      
      try {
        // CI環境をシミュレート
        process.env.CI = 'true';
        
        // Jest設定のrequireを避けて動的インポートを使用
        const jestConfigPath = path.join(projectRoot, 'config/jest/jest.config.mjs');
        
        expect(fs.existsSync(jestConfigPath)).toBe(true);
        
        // 設定ファイルの内容を確認（CI環境での適切な設定）
        const configContent = fs.readFileSync(jestConfigPath, 'utf8');
        expect(configContent).toContain('cache: false');
        expect(configContent).toContain('sourceMap: false');
        expect(configContent).toContain('inlineSourceMap: false');
        
      } finally {
        // 環境変数を元に戻す
        if (originalCI !== undefined) {
          process.env.CI = originalCI;
        } else {
          delete process.env.CI;
        }
      }
    });

    test('.gitignoreでキャッシュディレクトリが適切に除外されていること', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // キャッシュディレクトリが除外されていることを確認
      const requiredExclusions = [
        '.cache/',
        '.jest-cache/',
        '/.ts-jest/',
        '*.tsbuildinfo'
      ];
      
      for (const exclusion of requiredExclusions) {
        expect(gitignoreContent).toContain(exclusion);
      }
    });
  });

  describe('Defensive Programming - エラー処理とエッジケース', () => {
    test('存在しないキャッシュディレクトリを安全に処理できること', () => {
      const nonExistentDir = path.join(projectRoot, '.non-existent-cache');
      
      expect(() => {
        findCacheFiles(nonExistentDir);
      }).not.toThrow();
    });

    test('権限のないファイルを安全にスキップできること', () => {
      const tempFilePath = path.join(projectRoot, '.cache', 'temp-test-file');
      
      // テンポラリファイルを作成（存在する場合）
      if (fs.existsSync(path.dirname(tempFilePath))) {
        try {
          fs.writeFileSync(tempFilePath, 'test content');
          fs.chmodSync(tempFilePath, 0o000); // 読み取り権限を削除
          
          expect(() => {
            detectAbsolutePathsInFile(tempFilePath);
          }).not.toThrow();
          
        } catch (error) {
          // ファイル操作に失敗した場合はスキップ（CI環境での権限問題対応）
        } finally {
          // クリーンアップ
          try {
            fs.chmodSync(tempFilePath, 0o644);
            fs.unlinkSync(tempFilePath);
          } catch {
            // クリーンアップ失敗は無視
          }
        }
      }
    });
  });
});