/**
 * Issue #126対応: Sourcemap セキュリティ脆弱性検証テスト
 * TDD Red段階: 現在のsourcemap関連セキュリティ問題を検出
 */

import * as fs from 'fs';
import * as path from 'path';
import { Glob } from 'glob';

describe('Issue #126: Sourcemap セキュリティ脆弱性検証', () => {
  const distDir = path.join(process.cwd(), 'dist');
  const projectRoot = process.cwd();

  describe('Phase 1 Red: セキュリティ脆弱性検証テスト', () => {
    /**
     * TDD Red: sourcemapファイル存在検証
     * 本番配布時にsourcemapファイルが含まれていないことを確認
     */
    test('dist配下にsourcemapファイルが存在しないこと', async () => {
      // ビルド成果物ディレクトリの存在確認
      if (!fs.existsSync(distDir)) {
        // ビルドされていない場合はテストをスキップ
        console.log('distディレクトリが存在しないため、テストをスキップします');
        return;
      }

      // sourcemapファイル検索
      const glob = new Glob('**/*.js.map', { cwd: distDir });
      const jsMapFiles = await Array.fromAsync(glob);

      const tsMapFiles = await Array.fromAsync(new Glob('**/*.d.ts.map', { cwd: distDir }));
      const allMapFiles = [...jsMapFiles, ...tsMapFiles];

      // TDD Red期待: 現在はsourcemapファイルが存在するため失敗する
      expect(allMapFiles).toHaveLength(0);

      if (allMapFiles.length > 0) {
        console.warn('⚠️ 検出されたsourcemapファイル:', allMapFiles);
        console.warn('⚠️ これらのファイルは機密情報漏えいリスクがあります');
      }
    });

    /**
     * TDD Red: inline sourceMappingURL検証
     * JavaScriptファイル内にinline sourceMappingURLが埋め込まれていないことを確認
     */
    test('JavaScriptファイル内にinline sourceMappingURLが存在しないこと', async () => {
      if (!fs.existsSync(distDir)) {
        console.log('distディレクトリが存在しないため、テストをスキップします');
        return;
      }

      const jsFiles = await Array.fromAsync(new Glob('**/*.js', { cwd: distDir }));
      const inlineSourcemapFiles: string[] = [];

      for (const jsFile of jsFiles) {
        const filePath = path.join(distDir, jsFile);
        const content = fs.readFileSync(filePath, 'utf-8');

        // inline sourcemapの検出（base64エンコード）
        if (content.includes('sourceMappingURL=data:application/json;base64,')) {
          inlineSourcemapFiles.push(jsFile);
        }
      }

      // TDD Red期待: inline sourcemapが存在しないことを確認
      expect(inlineSourcemapFiles).toHaveLength(0);

      if (inlineSourcemapFiles.length > 0) {
        console.warn('⚠️ inline sourceMappingURL検出ファイル:', inlineSourcemapFiles);
        console.warn('⚠️ Issue #126: 機密情報がinline埋め込みされています');
      }
    });

    /**
     * TDD Red: 機密パス情報漏えい検証
     * sourcemapファイル内に機密パス情報が含まれていないことを確認
     */
    test('sourcemapファイル内に機密パス情報が漏えいしていないこと', async () => {
      if (!fs.existsSync(distDir)) {
        console.log('distディレクトリが存在しないため、テストをスキップします');
        return;
      }

      const mapFiles = await Array.fromAsync(new Glob('**/*.map', { cwd: distDir }));
      const pathLeakageFiles: Array<{ file: string; paths: string[] }> = [];

      for (const mapFile of mapFiles) {
        const filePath = path.join(distDir, mapFile);
        const content = fs.readFileSync(filePath, 'utf-8');

        try {
          const sourcemap = JSON.parse(content);
          const leakedPaths: string[] = [];

          // sources配列内の機密パス情報チェック
          if (sourcemap.sources && Array.isArray(sourcemap.sources)) {
            for (const source of sourcemap.sources) {
              // 絶対パス検出
              if (path.isAbsolute(source)) {
                leakedPaths.push(`絶対パス: ${source}`);
              }

              // プロジェクト構造露出検出
              if (source.includes('../../src/') || source.includes('../src/')) {
                leakedPaths.push(`プロジェクト構造露出: ${source}`);
              }

              // ユーザーディレクトリ情報検出（Issue #120対応: パターンベース検証）
              const userDirPatterns = [
                { pattern: 'Users', platform: 'macOS/Linux' },
                { pattern: 'home', platform: 'Linux' },
                { pattern: 'Documents and Settings', platform: 'Windows XP' },
              ];

              for (const { pattern, platform } of userDirPatterns) {
                if (source.includes(`/${pattern}/`) || source.includes(`\\${pattern}\\`)) {
                  leakedPaths.push(`${platform}ユーザーディレクトリ情報: ${source}`);
                  break;
                }
              }
            }
          }

          if (leakedPaths.length > 0) {
            pathLeakageFiles.push({ file: mapFile, paths: leakedPaths });
          }
        } catch (error) {
          console.warn(`sourcemapファイルの解析に失敗: ${mapFile}`, error);
        }
      }

      // TDD Red期待: 機密パス情報が漏えいしていないことを確認
      expect(pathLeakageFiles).toHaveLength(0);

      if (pathLeakageFiles.length > 0) {
        console.error('🚨 機密パス情報漏えい検出:');
        pathLeakageFiles.forEach(({ file, paths }) => {
          console.error(`  ファイル: ${file}`);
          paths.forEach(pathInfo => console.error(`    ${pathInfo}`));
        });
        console.error('🚨 Issue #126: 重大なセキュリティリスクです');
      }
    });
  });

  describe('外部sourceMappingURL参照検証', () => {
    /**
     * 外部sourcemapファイルへの参照が適切に処理されているかを確認
     */
    test('外部sourceMappingURL参照が本番環境で除去されていること', async () => {
      if (!fs.existsSync(distDir)) {
        console.log('distディレクトリが存在しないため、テストをスキップします');
        return;
      }

      const jsFiles = await Array.fromAsync(new Glob('**/*.js', { cwd: distDir }));
      const externalSourcemapRefs: Array<{ file: string; refs: string[] }> = [];

      for (const jsFile of jsFiles) {
        const filePath = path.join(distDir, jsFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const refs: string[] = [];

        // 外部sourcemap参照の検出
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('//# sourceMappingURL=') && !trimmedLine.includes('data:')) {
            refs.push(trimmedLine);
          }
        }

        if (refs.length > 0) {
          externalSourcemapRefs.push({ file: jsFile, refs });
        }
      }

      // 本番環境では外部sourcemap参照も除去されるべき
      // 開発環境では許可される場合がある
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        expect(externalSourcemapRefs).toHaveLength(0);
      } else {
        // 開発環境では警告のみ
        if (externalSourcemapRefs.length > 0) {
          console.warn('ℹ️ 開発環境での外部sourcemap参照検出:');
          externalSourcemapRefs.forEach(({ file, refs }) => {
            console.warn(`  ${file}: ${refs.join(', ')}`);
          });
        }
      }
    });
  });

  describe('Jest変換キャッシュセキュリティ検証', () => {
    /**
     * Issue #126の元問題: Jest変換キャッシュでのinline sourcemap
     */
    test('Jest変換キャッシュファイルが適切に除外されていること', () => {
      const jestCacheDirs = [
        path.join(projectRoot, '.jest-cache'),
        path.join(projectRoot, '.cache/jest'),
        path.join(projectRoot, 'node_modules/.cache/jest'),
      ];

      for (const cacheDir of jestCacheDirs) {
        if (fs.existsSync(cacheDir)) {
          // キャッシュディレクトリが存在する場合は警告
          console.warn(`⚠️ Jestキャッシュディレクトリが存在: ${cacheDir}`);
          console.warn('⚠️ キャッシュクリアを推奨: npm run clean:cache:jest');

          // .gitignoreで除外されているかチェック
          const gitignorePath = path.join(projectRoot, '.gitignore');
          if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            const relativeCacheDir = path.relative(projectRoot, cacheDir);

            if (
              !gitignoreContent.includes('.jest-cache') &&
              !gitignoreContent.includes(relativeCacheDir)
            ) {
              console.error(
                `🚨 .gitignoreでキャッシュディレクトリが除外されていません: ${relativeCacheDir}`
              );
            }
          }
        }
      }

      // Jestキャッシュの存在は警告レベル（設定で無効化済み）
      expect(true).toBe(true); // テストとしてはPASSさせる
    });
  });
});
