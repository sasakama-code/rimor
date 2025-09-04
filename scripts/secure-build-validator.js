/**
 * Issue #126対応: セキュアビルド検証スクリプト
 * Martin Fowler Extract Method適用: ビルド後のセキュリティ検証ロジックの独立化
 * Jean-Louis Boulanger Defensive Programming: 本番配布前のセキュリティ検証強化
 */

const fs = require('fs');
const path = require('path');
const { Glob } = require('glob');

/**
 * DRY原則適用: 共通設定定数の定義（Andy Hunt & Dave Thomas推奨）
 */
const SECURITY_CONFIG = {
  DIST_DIR: path.join(process.cwd(), 'dist'),
  ALLOWED_EXTENSIONS: ['.js', '.d.ts', '.json', '.hbs'],
  FORBIDDEN_PATTERNS: [
    /sourceMappingURL=data:application\/json;base64,/,
    /\/Users\/[^\/\s]+/g,
    /\/home\/[^\/\s]+/g,
    /C:\\Users\\[^\\s]+/g,
    /\.\.\/\.\.\/src\//g,
    /\.\.\/src\//g
  ],
  FORBIDDEN_FILES: [
    /\.map$/,
    /\.js\.map$/,
    /\.d\.ts\.map$/,
    /\.css\.map$/
  ]
};

/**
 * Uncle Bob SOLID原則適用: 単一責任の原則によるバリデーター分離
 */
class SecureBuildValidator {
  constructor(config = SECURITY_CONFIG) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Martin Fowler Extract Method: メイン検証ロジックの独立化
   */
  async validateBuild() {
    console.log('🔍 Issue #126対応: セキュアビルド検証を開始します...\n');

    if (!fs.existsSync(this.config.DIST_DIR)) {
      this.errors.push(`ビルド成果物ディレクトリが存在しません: ${this.config.DIST_DIR}`);
      return this.generateReport();
    }

    // Kelly Johnson KISS原則適用: 明確で理解しやすい検証ステップ
    await this.validateSourcemapFiles();
    await this.validateInlineSourcemaps();
    await this.validatePathLeakage();
    await this.validateFilePermissions();

    return this.generateReport();
  }

  /**
   * Andy Hunt & Dave Thomas DRY原則適用: Sourcemapファイル検証の統一化
   */
  async validateSourcemapFiles() {
    console.log('📂 Sourcemapファイル検証中...');
    
    const mapFiles = await this.findFiles('**/*.map');
    
    if (mapFiles.length > 0) {
      this.errors.push(`🚨 Sourcemapファイルが検出されました (${mapFiles.length}個):`);
      mapFiles.slice(0, 10).forEach(file => {
        this.errors.push(`  - ${file}`);
      });
      if (mapFiles.length > 10) {
        this.errors.push(`  ... 他${mapFiles.length - 10}個のファイル`);
      }
    } else {
      console.log('✅ Sourcemapファイル: 検出されませんでした');
    }
  }

  /**
   * Defensive Programming適用: Inline sourcemap検証強化
   */
  async validateInlineSourcemaps() {
    console.log('🔍 Inline sourcemap検証中...');
    
    const jsFiles = await this.findFiles('**/*.js');
    const inlineSourcemapFiles = [];

    for (const jsFile of jsFiles) {
      const filePath = path.join(this.config.DIST_DIR, jsFile);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      for (const pattern of this.config.FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          inlineSourcemapFiles.push({
            file: jsFile,
            pattern: pattern.toString()
          });
        }
      }
    }

    if (inlineSourcemapFiles.length > 0) {
      this.errors.push(`🚨 Inline sourcemap/機密パス検出 (${inlineSourcemapFiles.length}個):`);
      inlineSourcemapFiles.forEach(({ file, pattern }) => {
        this.errors.push(`  - ${file}: ${pattern}`);
      });
    } else {
      console.log('✅ Inline sourcemap: 検出されませんでした');
    }
  }

  /**
   * Martin Fowler Parameterize Method: パス漏えい検証の効率化
   */
  async validatePathLeakage() {
    console.log('🔒 機密パス情報漏えい検証中...');
    
    const allFiles = await this.findFiles('**/*');
    const leakageFiles = [];

    for (const file of allFiles) {
      // バイナリファイルをスキップ
      if (this.isBinaryFile(file)) continue;

      try {
        const filePath = path.join(this.config.DIST_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const leakedPatterns = [];
        for (const pattern of this.config.FORBIDDEN_PATTERNS) {
          const matches = content.match(pattern);
          if (matches) {
            leakedPatterns.push(...matches.slice(0, 3)); // 最初の3個のマッチのみ
          }
        }

        if (leakedPatterns.length > 0) {
          leakageFiles.push({
            file,
            patterns: leakedPatterns
          });
        }
      } catch (error) {
        this.warnings.push(`ファイル読み込み警告: ${file} - ${error.message}`);
      }
    }

    if (leakageFiles.length > 0) {
      this.errors.push(`🚨 機密パス情報漏えい検出 (${leakageFiles.length}個):`);
      leakageFiles.slice(0, 5).forEach(({ file, patterns }) => {
        this.errors.push(`  - ${file}:`);
        patterns.forEach(pattern => {
          this.errors.push(`    ${pattern}`);
        });
      });
    } else {
      console.log('✅ 機密パス情報: 漏えいは検出されませんでした');
    }
  }

  /**
   * Jean-Louis Boulanger Defensive Programming: ファイル権限検証
   */
  async validateFilePermissions() {
    console.log('🔐 ファイル権限検証中...');
    
    const allFiles = await this.findFiles('**/*');
    const permissionIssues = [];

    for (const file of allFiles) {
      try {
        const filePath = path.join(this.config.DIST_DIR, file);
        const stats = fs.statSync(filePath);
        
        // 実行権限が不適切に設定されているファイルの検出
        if (stats.isFile() && (stats.mode & 0o111) && !file.endsWith('.js')) {
          permissionIssues.push(`実行権限が設定された非JSファイル: ${file}`);
        }
      } catch (error) {
        this.warnings.push(`権限チェック警告: ${file} - ${error.message}`);
      }
    }

    if (permissionIssues.length > 0) {
      this.warnings.push('⚠️ ファイル権限の確認が必要:', ...permissionIssues);
    } else {
      console.log('✅ ファイル権限: 問題ありません');
    }
  }

  /**
   * KISS原則適用: シンプルなファイル検索ヘルパー
   */
  async findFiles(pattern) {
    const glob = new Glob(pattern, { cwd: this.config.DIST_DIR });
    return Array.from(await glob);
  }

  /**
   * YAGNI原則適用: 必要最小限のバイナリファイル判定
   */
  isBinaryFile(filePath) {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf'];
    return binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  /**
   * Martin Fowler Template Method: レポート生成の統一化
   */
  generateReport() {
    console.log('\n📋 セキュアビルド検証結果:');
    console.log('=' .repeat(50));

    const isSecure = this.errors.length === 0;

    if (isSecure) {
      console.log('✅ セキュアビルド検証: 成功');
      console.log('🎯 Issue #126対応: セキュリティリスクは検出されませんでした');
    } else {
      console.log('🚨 セキュアビルド検証: 失敗');
      console.log(`❌ ${this.errors.length}個のセキュリティ問題が検出されました`);
      console.log('\n🔴 エラー:');
      this.errors.forEach(error => console.log(error));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      this.warnings.forEach(warning => console.log(warning));
    }

    console.log('=' .repeat(50));

    return {
      isSecure,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        status: isSecure ? 'SECURE' : 'VULNERABLE'
      }
    };
  }
}

/**
 * CLI実行エントリーポイント
 */
if (require.main === module) {
  const validator = new SecureBuildValidator();
  validator.validateBuild().then(result => {
    process.exit(result.isSecure ? 0 : 1);
  }).catch(error => {
    console.error('セキュアビルド検証でエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = SecureBuildValidator;