/**
 * Git Ignore Validation Tests
 * 
 * .jest-cacheディレクトリがGit追跡から除外されていることを確認するテスト
 * 
 * TDD原則に従いRED（失敗）フェーズから開始
 * Issue #97対応: .jest-cacheキャッシュファイルのGit追跡除外
 */

const fs = require('fs');
const path = require('path');

describe('GitIgnoreValidation', () => {
  const projectRoot = path.resolve(__dirname, '..', '..');

  describe('.jest-cacheディレクトリの追跡除外確認', () => {
    test('.gitignoreファイルに.jest-cache/が含まれている', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('.jest-cache/');
    });

    test('.gitignoreの設定が正しく適用されている', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // キャッシュ関連の除外設定を確認
      const cacheExclusions = [
        '.rimor-cache/',
        '.jest-cache/',
        'node_modules/'
      ];
      
      cacheExclusions.forEach(exclusion => {
        expect(gitignoreContent).toContain(exclusion);
      });
    });
  });

  describe('エラーハンドリング（Defensive Programming）', () => {
    test('.gitignoreファイルが存在しない場合の適切なエラー', () => {
      const nonExistentPath = path.join(projectRoot, 'non-existent', '.gitignore');
      
      expect(() => {
        fs.readFileSync(nonExistentPath, 'utf8');
      }).toThrow();
    });
  });
});