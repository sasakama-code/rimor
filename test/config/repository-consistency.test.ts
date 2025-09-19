import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * リポジトリ設定整合性テスト
 * TDD Red Phase: 現在のリンク切れ状態を検証
 * 
 * t_wada推奨のTDD原則に従い、まず失敗するテストを作成する
 */
describe('Repository Configuration Consistency', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const typedocConfigPath = path.join(projectRoot, 'config/typedoc.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  let typedocConfig: any;
  let packageJson: any;
  let gitRemoteUrl: string;

  beforeAll(() => {
    // プロジェクト設定ファイルの読み込み
    typedocConfig = JSON.parse(fs.readFileSync(typedocConfigPath, 'utf8'));
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Git リモートURLの取得
    try {
      gitRemoteUrl = execSync('git remote get-url origin', { 
        cwd: projectRoot,
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      throw new Error('Git リモートURLの取得に失敗しました');
    }
  });

  describe('TypeDoc設定の整合性', () => {
    it('sourceLinkTemplateがgit remoteと一致すること', () => {
      // gitRemoteUrlから期待されるsourceLinkTemplateを構築
      const expectedBaseUrl = gitRemoteUrl.replace('.git', '');
      const expectedTemplate = `${expectedBaseUrl}/blob/{gitRevision}/{path}#L{line}`;
      
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(typedocConfig.sourceLinkTemplate).toBe(expectedTemplate);
    });

    it('navigationLinksのGitHubURLがgit remoteと一致すること', () => {
      const expectedGitHubUrl = gitRemoteUrl.replace('.git', '');
      
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(typedocConfig.navigationLinks.GitHub).toBe(expectedGitHubUrl);
    });

    it('navigationLinksのIssuesURLがgit remoteと一致すること', () => {
      const expectedIssuesUrl = `${gitRemoteUrl.replace('.git', '')}/issues`;
      
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(typedocConfig.navigationLinks.Issues).toBe(expectedIssuesUrl);
    });
  });

  describe('package.json設定の整合性', () => {
    it('repository.urlがgit remoteと一致すること', () => {
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(packageJson.repository.url).toBe(gitRemoteUrl);
    });

    it('bugs.urlがgit remoteのissuesと一致すること', () => {
      const expectedBugsUrl = `${gitRemoteUrl.replace('.git', '')}/issues`;
      
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(packageJson.bugs.url).toBe(expectedBugsUrl);
    });

    it('homepageがgit remoteと一致すること', () => {
      const expectedHomepage = `${gitRemoteUrl.replace('.git', '')}#readme`;
      
      // 現在の設定（これは失敗するはず - Red Phase）
      expect(packageJson.homepage).toBe(expectedHomepage);
    });
  });

  describe('設定ファイル間の整合性', () => {
    it('TypeDocとpackage.jsonのリポジトリURLが一致すること', () => {
      // sourceLinkTemplateからベースURLを抽出
      const typedocBaseUrl = typedocConfig.sourceLinkTemplate
        .replace('/blob/{gitRevision}/{path}#L{line}', '');
      
      // package.jsonのリポジトリURLからベースURLを抽出
      const packageBaseUrl = packageJson.repository.url.replace('.git', '');
      
      // 現在は不一致（これは失敗するはず - Red Phase）
      expect(typedocBaseUrl).toBe(packageBaseUrl);
    });
  });

  describe('リポジトリURL形式の検証', () => {
    it('git remoteが有効なGitHub URLであること', () => {
      // Defensive Programming: URLの形式検証
      expect(gitRemoteUrl).toMatch(/^https:\/\/github\.com\/[\w-]+\/[\w-]+\.git$/);
    });

    it('組織名とリポジトリ名が適切であること', () => {
      // KISS原則: シンプルで明確な検証
      const urlPattern = /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)\.git$/;
      const match = gitRemoteUrl.match(urlPattern);
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match[1]).toBe('sasakama-code'); // 期待される組織名
        expect(match[2]).toBe('rimor'); // 期待されるリポジトリ名
      }
    });
  });
});