#!/usr/bin/env node

/**
 * Repository Configuration Consistency Validator
 * 
 * Defensive Programming原則（Jean-Louis Boulanger推奨）を適用し、
 * 設定ファイル間の整合性を継続的に監視・検証する
 * 
 * YAGNI原則（Ron Jeffries, XP推奨）とKISS原則（Kelly Johnson推奨）の
 * バランスを保ちながら、必要最小限の防御機能を実装
 */

const RepositoryConfigManager = require('./repository-config.js');
const fs = require('fs');
const path = require('path');

/**
 * 設定整合性バリデータクラス
 * Uncle Bob（Robert C. Martin）のSOLID原則に従った設計
 */
class RepositoryConsistencyValidator {
  constructor(options = {}) {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configManager = new RepositoryConfigManager();
    this.options = {
      strict: options.strict || false,
      exitOnError: options.exitOnError || true,
      verbose: options.verbose || false,
      checkPreCommit: options.checkPreCommit || false
    };
  }

  /**
   * 包括的な整合性検証
   * Defensive Programming: 多層防御による徹底的な検証
   */
  async validateAll() {
    const results = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      passed: [],
      failed: [],
      warnings: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    console.log('🔍 Repository Configuration Consistency Check');
    console.log('=============================================');

    // 基本整合性チェック
    await this.runCheck('基本設定整合性', () => this.validateBasicConsistency(), results);
    
    // ファイル存在性チェック
    await this.runCheck('設定ファイル存在性', () => this.validateFileExistence(), results);
    
    // URL形式チェック
    await this.runCheck('URL形式検証', () => this.validateUrlFormats(), results);
    
    // Cross-reference チェック
    await this.runCheck('クロスリファレンス整合性', () => this.validateCrossReferences(), results);
    
    // Git整合性チェック
    await this.runCheck('Git設定整合性', () => this.validateGitConsistency(), results);

    if (this.options.strict) {
      // 厳密モード: 追加チェック
      await this.runCheck('セキュリティ検証', () => this.validateSecurity(), results);
      await this.runCheck('パフォーマンス影響', () => this.validatePerformanceImpact(), results);
    }

    this.generateReport(results);
    return results;
  }

  /**
   * 個別チェック実行フレームワーク
   * Extract Method（Martin Fowler推奨）適用
   */
  async runCheck(name, checkFunction, results) {
    try {
      const result = await checkFunction();
      
      if (result.success) {
        results.passed.push({ name, ...result });
        if (this.options.verbose) {
          console.log(`✅ ${name}: ${result.message || 'OK'}`);
        }
      } else {
        results.failed.push({ name, ...result });
        console.log(`❌ ${name}: ${result.message}`);
        
        if (result.details) {
          result.details.forEach(detail => console.log(`   - ${detail}`));
        }
      }
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          results.warnings.push({ name, warning });
          console.log(`⚠️  ${name}: ${warning}`);
        });
      }
      
    } catch (error) {
      const errorResult = {
        name,
        success: false,
        message: `チェック実行エラー: ${error.message}`,
        error: error.stack
      };
      
      results.failed.push(errorResult);
      console.log(`💥 ${name}: チェック実行失敗 - ${error.message}`);
    }
    
    results.summary.total++;
  }

  /**
   * 基本設定整合性チェック
   * 既存のRepositoryConfigManagerを活用
   */
  validateBasicConsistency() {
    try {
      const validation = this.configManager.validateConsistency();
      
      return {
        success: validation.isValid,
        message: validation.isValid ? 
          '全ての基本設定が整合しています' : 
          '基本設定に不整合があります',
        details: validation.issues,
        repositoryInfo: validation.repositoryInfo
      };
    } catch (error) {
      return {
        success: false,
        message: `基本整合性チェック失敗: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * 設定ファイル存在性チェック
   * Defensive Programming: ファイル存在確認
   */
  validateFileExistence() {
    const requiredFiles = [
      'config/typedoc.json',
      'package.json',
      '.git/config'
    ];

    const missingFiles = [];
    const existingFiles = [];

    requiredFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath)) {
        existingFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    });

    return {
      success: missingFiles.length === 0,
      message: missingFiles.length === 0 ? 
        '全ての必須ファイルが存在します' : 
        `必須ファイルが不足: ${missingFiles.join(', ')}`,
      details: missingFiles,
      existingFiles
    };
  }

  /**
   * URL形式検証
   * Defensive Programming: 不正なURL形式の検出
   */
  validateUrlFormats() {
    const issues = [];
    const validUrls = [];

    try {
      const repoInfo = this.configManager.getRepositoryInfo();
      const typedocConfig = this.configManager.generateTypedocConfig();
      const packageConfig = this.configManager.generatePackageJsonConfig();

      // Git URLの検証
      if (!this.isValidGitHubUrl(repoInfo.gitUrl)) {
        issues.push(`不正なGit URL形式: ${repoInfo.gitUrl}`);
      } else {
        validUrls.push(repoInfo.gitUrl);
      }

      // TypeDoc URLsの検証
      if (!this.isValidHttpsUrl(typedocConfig.navigationLinks.GitHub)) {
        issues.push(`不正なGitHub URL: ${typedocConfig.navigationLinks.GitHub}`);
      } else {
        validUrls.push(typedocConfig.navigationLinks.GitHub);
      }

      // Package.json URLsの検証
      if (!this.isValidGitHubUrl(packageConfig.repository.url)) {
        issues.push(`不正なリポジトリURL: ${packageConfig.repository.url}`);
      } else {
        validUrls.push(packageConfig.repository.url);
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 
          '全てのURLが正しい形式です' : 
          'URL形式に問題があります',
        details: issues,
        validUrls
      };

    } catch (error) {
      return {
        success: false,
        message: `URL形式検証エラー: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * クロスリファレンス整合性チェック
   * Defensive Programming: 設定間の相互参照整合性
   */
  validateCrossReferences() {
    try {
      const repoInfo = this.configManager.getRepositoryInfo();
      const issues = [];

      // TypeDoc vs Package.json
      const typedocPath = path.join(this.projectRoot, 'config/typedoc.json');
      const packagePath = path.join(this.projectRoot, 'package.json');
      
      const typedocConfig = JSON.parse(fs.readFileSync(typedocPath, 'utf8'));
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // 組織名の一致確認
      const typedocOrg = this.extractOrgFromUrl(typedocConfig.navigationLinks?.GitHub);
      const packageOrg = this.extractOrgFromUrl(packageJson.repository?.url?.replace('.git', ''));
      const gitOrg = repoInfo.organization;

      if (typedocOrg !== packageOrg || packageOrg !== gitOrg) {
        issues.push(`組織名の不一致: TypeDoc(${typedocOrg}), Package(${packageOrg}), Git(${gitOrg})`);
      }

      // リポジトリ名の一致確認
      const typedocRepo = this.extractRepoFromUrl(typedocConfig.navigationLinks?.GitHub);
      const packageRepo = this.extractRepoFromUrl(packageJson.repository?.url?.replace('.git', ''));
      const gitRepo = repoInfo.repository;

      if (typedocRepo !== packageRepo || packageRepo !== gitRepo) {
        issues.push(`リポジトリ名の不一致: TypeDoc(${typedocRepo}), Package(${packageRepo}), Git(${gitRepo})`);
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 
          'クロスリファレンス整合性OK' : 
          'クロスリファレンスに不整合',
        details: issues
      };

    } catch (error) {
      return {
        success: false,
        message: `クロスリファレンス検証エラー: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * Git設定整合性チェック
   * Defensive Programming: Git設定の検証
   */
  validateGitConsistency() {
    try {
      const issues = [];
      const { execSync } = require('child_process');

      // Git リモートの確認
      const remotes = execSync('git remote -v', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();

      const originLines = remotes.split('\n').filter(line => line.startsWith('origin'));
      
      if (originLines.length < 2) {
        issues.push('origin リモートの設定が不完全');
      }

      // ブランチの確認
      try {
        const currentBranch = execSync('git branch --show-current', {
          cwd: this.projectRoot,
          encoding: 'utf8'
        }).trim();

        if (!currentBranch) {
          issues.push('現在のブランチが特定できません');
        }
      } catch (branchError) {
        issues.push(`ブランチ情報取得エラー: ${branchError.message}`);
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 
          'Git設定は正常です' : 
          'Git設定に問題があります',
        details: issues
      };

    } catch (error) {
      return {
        success: false,
        message: `Git設定検証エラー: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * セキュリティ検証（厳密モード）
   * Defensive Programming: セキュリティリスクの検出
   */
  validateSecurity() {
    const issues = [];
    const warnings = [];

    try {
      const repoInfo = this.configManager.getRepositoryInfo();

      // HTTPSプロトコルの確認
      if (!repoInfo.gitUrl.startsWith('https://')) {
        issues.push('Git URLがHTTPSを使用していません');
      }

      // 公開リポジトリの確認（警告レベル）
      if (repoInfo.gitUrl.includes('github.com')) {
        warnings.push('パブリックGitHubリポジトリです（意図的でない場合は注意）');
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 
          'セキュリティ検証OK' : 
          'セキュリティ問題が検出されました',
        details: issues,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `セキュリティ検証エラー: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * パフォーマンス影響評価（厳密モード）
   * YAGNI原則とのバランス: 必要最小限のチェック
   */
  validatePerformanceImpact() {
    const warnings = [];

    try {
      // 設定ファイルサイズチェック
      const typedocPath = path.join(this.projectRoot, 'config/typedoc.json');
      const packagePath = path.join(this.projectRoot, 'package.json');

      const typedocSize = fs.statSync(typedocPath).size;
      const packageSize = fs.statSync(packagePath).size;

      if (typedocSize > 10000) { // 10KB
        warnings.push(`TypeDoc設定ファイルが大きいです: ${typedocSize} bytes`);
      }

      if (packageSize > 50000) { // 50KB
        warnings.push(`package.jsonが大きいです: ${packageSize} bytes`);
      }

      return {
        success: true,
        message: 'パフォーマンス影響評価完了',
        warnings
      };

    } catch (error) {
      return {
        success: false,
        message: `パフォーマンス評価エラー: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * 検証レポート生成
   * KISS原則: シンプルで分かりやすいレポート
   */
  generateReport(results) {
    results.summary.passed = results.passed.length;
    results.summary.failed = results.failed.length;
    results.summary.warnings = results.warnings.length;

    console.log('\n📊 検証結果サマリー');
    console.log('=================');
    console.log(`✅ 成功: ${results.summary.passed}`);
    console.log(`❌ 失敗: ${results.summary.failed}`);
    console.log(`⚠️  警告: ${results.summary.warnings}`);
    console.log(`📋 合計: ${results.summary.total}`);

    if (results.summary.failed > 0 && this.options.exitOnError) {
      console.log('\n💥 重大な問題が検出されました。修正が必要です。');
      process.exit(1);
    }

    if (results.summary.warnings > 0) {
      console.log('\n⚠️  警告があります。確認を推奨します。');
    }

    if (results.summary.failed === 0 && results.summary.warnings === 0) {
      console.log('\n🎉 全ての検証に合格しました！');
    }
  }

  // ユーティリティメソッド
  isValidGitHubUrl(url) {
    return /^https:\/\/github\.com\/[\w-]+\/[\w-]+\.git$/.test(url);
  }

  isValidHttpsUrl(url) {
    return /^https:\/\//.test(url);
  }

  extractOrgFromUrl(url) {
    const match = url?.match(/github\.com\/([\w-]+)\//);
    return match ? match[1] : null;
  }

  extractRepoFromUrl(url) {
    const match = url?.match(/github\.com\/[\w-]+\/([\w-]+)/);
    return match ? match[1] : null;
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose'),
    exitOnError: !args.includes('--no-exit'),
    checkPreCommit: args.includes('--pre-commit')
  };

  const validator = new RepositoryConsistencyValidator(options);
  
  validator.validateAll().catch(error => {
    console.error('💥 検証プロセスでエラーが発生:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = RepositoryConsistencyValidator;