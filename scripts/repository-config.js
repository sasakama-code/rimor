#!/usr/bin/env node

/**
 * Repository Configuration Manager
 * 
 * DRY原則（Andy Hunt & Dave Thomas推奨）に従い、
 * リポジトリ情報を一元管理し、設定ファイル間の整合性を保つ
 * 
 * SOLID原則（Uncle Bob推奨）の単一責任原則を適用し、
 * リポジトリ設定管理の責務を独立したモジュールとして分離
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * リポジトリ設定クラス
 * Martin Fowlerのリファクタリング手法（Extract Class）を適用
 */
class RepositoryConfigManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this._gitRemoteUrl = null;
    this._repositoryInfo = null;
  }

  /**
   * Git リモートURLを取得
   * Defensive Programming: エラーハンドリングを含む
   */
  getGitRemoteUrl() {
    if (this._gitRemoteUrl) return this._gitRemoteUrl;

    try {
      this._gitRemoteUrl = execSync('git remote get-url origin', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim();
      
      // Defensive Programming: URL形式の検証
      if (!this._gitRemoteUrl.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+\.git$/)) {
        throw new Error(`Invalid GitHub URL format: ${this._gitRemoteUrl}`);
      }
      
      return this._gitRemoteUrl;
    } catch (error) {
      throw new Error(`Git リモートURLの取得に失敗: ${error.message}`);
    }
  }

  /**
   * リポジトリ情報を解析
   * KISS原則（Kelly Johnson推奨）に従い、シンプルで明確な実装
   */
  getRepositoryInfo() {
    if (this._repositoryInfo) return this._repositoryInfo;

    const gitUrl = this.getGitRemoteUrl();
    const urlPattern = /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)\.git$/;
    const match = gitUrl.match(urlPattern);

    if (!match) {
      throw new Error(`GitHub URL形式が不正です: ${gitUrl}`);
    }

    this._repositoryInfo = {
      organization: match[1],
      repository: match[2],
      baseUrl: gitUrl.replace('.git', ''),
      gitUrl: gitUrl
    };

    return this._repositoryInfo;
  }

  /**
   * TypeDoc設定を生成
   * DRY原則適用: 一箇所でURL管理
   */
  generateTypedocConfig() {
    const repo = this.getRepositoryInfo();
    
    return {
      sourceLinkTemplate: `${repo.baseUrl}/blob/{gitRevision}/{path}#L{line}`,
      navigationLinks: {
        GitHub: repo.baseUrl,
        Issues: `${repo.baseUrl}/issues`
      }
    };
  }

  /**
   * package.json設定を生成
   * DRY原則適用: 一箇所でURL管理
   */
  generatePackageJsonConfig() {
    const repo = this.getRepositoryInfo();
    
    return {
      repository: {
        type: 'git',
        url: repo.gitUrl
      },
      bugs: {
        url: `${repo.baseUrl}/issues`
      },
      homepage: `${repo.baseUrl}#readme`
    };
  }

  /**
   * 設定ファイルを更新
   * Uncle Bob（Robert C. Martin）のSOLID原則に従った設計
   */
  updateConfigFiles() {
    this.updateTypedocConfig();
    this.updatePackageJson();
    console.log('✅ 設定ファイルの更新が完了しました');
  }

  /**
   * TypeDoc設定ファイルを更新
   * Extract Method（Martin Fowler推奨）適用
   */
  updateTypedocConfig() {
    const typedocPath = path.join(this.projectRoot, 'config/typedoc.json');
    const config = this.generateTypedocConfig();
    
    try {
      const typedocConfig = JSON.parse(fs.readFileSync(typedocPath, 'utf8'));
      
      // 設定の更新
      typedocConfig.sourceLinkTemplate = config.sourceLinkTemplate;
      typedocConfig.navigationLinks = config.navigationLinks;
      
      fs.writeFileSync(typedocPath, JSON.stringify(typedocConfig, null, 2) + '\n');
      console.log('✅ TypeDoc設定を更新しました');
    } catch (error) {
      throw new Error(`TypeDoc設定の更新に失敗: ${error.message}`);
    }
  }

  /**
   * package.json設定ファイルを更新
   * Extract Method（Martin Fowler推奨）適用
   */
  updatePackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    const config = this.generatePackageJsonConfig();
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 設定の更新
      packageJson.repository = config.repository;
      packageJson.bugs = config.bugs;
      packageJson.homepage = config.homepage;
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ package.json設定を更新しました');
    } catch (error) {
      throw new Error(`package.json設定の更新に失敗: ${error.message}`);
    }
  }

  /**
   * 設定整合性を検証
   * Defensive Programming（Jean-Louis Boulanger推奨）適用
   */
  validateConsistency() {
    const repo = this.getRepositoryInfo();
    const typedocConfig = this.generateTypedocConfig();
    const packageConfig = this.generatePackageJsonConfig();
    
    const issues = [];
    
    // TypeDoc設定の検証
    try {
      const typedocPath = path.join(this.projectRoot, 'config/typedoc.json');
      const actualTypedoc = JSON.parse(fs.readFileSync(typedocPath, 'utf8'));
      
      if (actualTypedoc.sourceLinkTemplate !== typedocConfig.sourceLinkTemplate) {
        issues.push('TypeDoc sourceLinkTemplateが不整合');
      }
      
      if (actualTypedoc.navigationLinks?.GitHub !== typedocConfig.navigationLinks.GitHub) {
        issues.push('TypeDoc GitHub URLが不整合');
      }
    } catch (error) {
      issues.push(`TypeDoc設定読み込みエラー: ${error.message}`);
    }
    
    // package.json設定の検証
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const actualPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (actualPackage.repository?.url !== packageConfig.repository.url) {
        issues.push('package.json repository URLが不整合');
      }
      
      if (actualPackage.bugs?.url !== packageConfig.bugs.url) {
        issues.push('package.json bugs URLが不整合');
      }
      
      if (actualPackage.homepage !== packageConfig.homepage) {
        issues.push('package.json homepageが不整合');
      }
    } catch (error) {
      issues.push(`package.json設定読み込みエラー: ${error.message}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      repositoryInfo: repo
    };
  }

  /**
   * 設定情報を表示
   * KISS原則（Kelly Johnson推奨）に従った分かりやすい出力
   */
  displayInfo() {
    const repo = this.getRepositoryInfo();
    const validation = this.validateConsistency();
    
    console.log('📋 Repository Configuration Status');
    console.log('=====================================');
    console.log(`組織名: ${repo.organization}`);
    console.log(`リポジトリ名: ${repo.repository}`);
    console.log(`Git URL: ${repo.gitUrl}`);
    console.log(`Base URL: ${repo.baseUrl}`);
    console.log('');
    
    if (validation.isValid) {
      console.log('✅ 全ての設定ファイルが整合しています');
    } else {
      console.log('⚠️  設定に不整合があります:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  const manager = new RepositoryConfigManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'update':
      manager.updateConfigFiles();
      break;
    case 'validate':
      manager.displayInfo();
      break;
    case 'info':
      console.log(JSON.stringify(manager.getRepositoryInfo(), null, 2));
      break;
    default:
      console.log('Repository Configuration Manager');
      console.log('');
      console.log('使用方法:');
      console.log('  node scripts/repository-config.js update   - 設定ファイルを更新');
      console.log('  node scripts/repository-config.js validate - 設定を検証・表示');
      console.log('  node scripts/repository-config.js info     - リポジトリ情報を表示');
  }
}

module.exports = RepositoryConfigManager;