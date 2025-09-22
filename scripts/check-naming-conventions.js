#!/usr/bin/env node
/**
 * Rimor命名規則チェッカー
 * CI/CD環境で命名規則の自動検証を実行
 * v1.0 - 2025年8月20日
 * 
 * 使用方法:
 *   node scripts/check-naming-conventions.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// カラー定義
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

class NamingConventionChecker {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      verbose: options.verbose || false,
      projectRoot: options.projectRoot || process.cwd()
    };
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logVerbose(message, color = 'reset') {
    if (this.options.verbose) {
      this.log(`  ${message}`, color);
    }
  }

  addError(type, file, message, suggestion = null) {
    this.errors.push({ type, file, message, suggestion });
  }

  addWarning(type, file, message, suggestion = null) {
    this.warnings.push({ type, file, message, suggestion });
  }

  addFix(type, file, oldPath, newPath) {
    this.fixes.push({ type, file, oldPath, newPath });
  }

  /**
   * TypeScriptファイルを取得
   */
  getTypeScriptFiles() {
    const pattern = path.join(this.options.projectRoot, 'src/**/*.ts');
    return glob.sync(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts'
      ]
    });
  }

  /**
   * 1. バージョン番号付きファイル名の検証
   */
  checkVersionNumbers() {
    this.log('\n🔍 1. バージョン番号付きファイル名の検証...', 'cyan');
    
    const files = this.getTypeScriptFiles();
    let found = false;

    files.forEach(filePath => {
      const basename = path.basename(filePath, '.ts');
      const versionPattern = /v\d+\.\d+/;
      
      if (versionPattern.test(basename)) {
        found = true;
        const suggestion = filePath.replace(versionPattern, '');
        this.addError(
          'version-in-filename',
          filePath,
          'バージョン番号がファイル名に含まれています',
          `→ ${suggestion}`
        );
        
        if (this.options.fix && fs.existsSync(filePath)) {
          this.addFix('version-in-filename', filePath, filePath, suggestion);
        }
      }
    });

    if (!found) {
      this.log('  ✅ バージョン番号付きファイル名は検出されませんでした', 'green');
    }
  }

  /**
   * 2. Implサフィックスの検証
   */
  checkImplSuffix() {
    this.log('\n🔍 2. *Impl.tsサフィックスの検証...', 'cyan');
    
    const files = this.getTypeScriptFiles();
    let found = false;

    files.forEach(filePath => {
      const basename = path.basename(filePath, '.ts');
      
      if (basename.endsWith('Impl')) {
        found = true;
        const suggestion = filePath.replace('Impl.ts', '.ts');
        this.addError(
          'impl-suffix',
          filePath,
          'Implサフィックスが検出されました',
          `→ ${suggestion}`
        );
        
        if (this.options.fix && fs.existsSync(filePath)) {
          this.addFix('impl-suffix', filePath, filePath, suggestion);
        }
      }
    });

    if (!found) {
      this.log('  ✅ *Impl.tsサフィックスは検出されませんでした', 'green');
    }
  }

  /**
   * 3. テストファイル命名パターンの検証
   */
  checkTestFileNaming() {
    this.log('\n🔍 3. テストファイル命名パターンの検証...', 'cyan');
    
    const testPattern = path.join(this.options.projectRoot, '**/*.{test,spec}.ts');
    const testFiles = glob.sync(testPattern, {
      ignore: ['**/node_modules/**', '**/dist/**']
    });

    let found = false;
    const validPatterns = [
      /\.unit\.(test|spec)\.ts$/,
      /\.integration\.(test|spec)\.ts$/,
      /\.e2e\.(test|spec)\.ts$/
    ];

    testFiles.forEach(filePath => {
      const isValid = validPatterns.some(pattern => pattern.test(filePath));
      
      if (!isValid) {
        found = true;
        this.addWarning(
          'test-naming',
          filePath,
          '推奨テストファイル命名パターンではありません',
          '推奨: {Target}.{unit|integration|e2e}.test.ts'
        );
      }
    });

    if (!found) {
      this.log('  ✅ テストファイル命名パターンに問題はありません', 'green');
    } else {
      this.log(`  ⚠️  ${testFiles.length}個のテストファイル中、非推奨パターンが検出されました`, 'yellow');
    }
  }

  /**
   * 4. プラグインファイル命名の検証
   */
  checkPluginFileNaming() {
    this.log('\n🔍 4. プラグインファイル命名の検証...', 'cyan');
    
    const pluginPattern = path.join(this.options.projectRoot, 'src/plugins/**/*.ts');
    const pluginFiles = glob.sync(pluginPattern, {
      ignore: ['**/node_modules/**', '**/dist/**']
    });

    let found = false;

    pluginFiles.forEach(filePath => {
      const basename = path.basename(filePath, '.ts');
      
      if (!basename.endsWith('Plugin') && basename !== 'BasePlugin') {
        found = true;
        const suggestion = filePath.replace('.ts', 'Plugin.ts');
        this.addError(
          'plugin-naming',
          filePath,
          'プラグインファイルが*Plugin.ts形式ではありません',
          `→ ${suggestion}`
        );
        
        if (this.options.fix && fs.existsSync(filePath)) {
          this.addFix('plugin-naming', filePath, filePath, suggestion);
        }
      }
    });

    if (!found) {
      this.log('  ✅ プラグインファイル命名に問題はありません', 'green');
    }
  }

  /**
   * 5. 型定義ファイル配置の検証
   */
  checkTypeDefinitionPlacement() {
    this.log('\n🔍 5. 型定義ファイル配置の検証...', 'cyan');
    
    const typePattern = path.join(this.options.projectRoot, 'src/**/*{types,Types}.ts');
    const typeFiles = glob.sync(typePattern, {
      ignore: ['**/node_modules/**', '**/dist/**']
    });

    let misplacedCount = 0;

    typeFiles.forEach(filePath => {
      if (!filePath.includes('/types/')) {
        misplacedCount++;
        this.addWarning(
          'type-placement',
          filePath,
          'src/types/配下にない型定義ファイルです',
          '可能であればsrc/types/配下への移動を検討してください'
        );
        this.logVerbose(`  ${filePath}`, 'yellow');
      }
    });

    if (misplacedCount === 0) {
      this.log('  ✅ 型定義ファイル配置に問題はありません', 'green');
    } else {
      this.log(`  ⚠️  ${misplacedCount}個の型定義ファイルがsrc/types/配下にありません`, 'yellow');
    }
  }

  /**
   * 6. ファイル名の大文字小文字パターン検証
   */
  checkCaseConsistency() {
    this.log('\n🔍 6. ファイル名の大文字小文字パターン検証...', 'cyan');
    
    const files = this.getTypeScriptFiles();
    let inconsistentCount = 0;

    files.forEach(filePath => {
      const basename = path.basename(filePath, '.ts');
      
      // camelCase または PascalCase パターンの検証
      const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(basename);
      const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(basename);
      const isSpecialFile = /\.(test|spec)$|test-helper$|\.config$/.test(basename);
      
      if (!isCamelCase && !isPascalCase && !isSpecialFile) {
        inconsistentCount++;
        this.addWarning(
          'case-consistency',
          filePath,
          '非標準的なファイル名パターンです',
          'camelCase または PascalCase の使用を推奨'
        );
        this.logVerbose(`  ${filePath}`, 'yellow');
      }
    });

    if (inconsistentCount === 0) {
      this.log('  ✅ ファイル名の大文字小文字パターンに問題はありません', 'green');
    } else {
      this.log(`  ⚠️  ${inconsistentCount}個のファイルが非標準的な命名です`, 'yellow');
    }
  }

  /**
   * 自動修正の実行
   */
  applyFixes() {
    if (!this.options.fix || this.fixes.length === 0) {
      return;
    }

    this.log('\n🔧 自動修正を実行中...', 'yellow');
    
    this.fixes.forEach(fix => {
      try {
        fs.renameSync(fix.oldPath, fix.newPath);
        this.log(`  ✅ ${fix.oldPath} → ${fix.newPath}`, 'green');
      } catch (error) {
        this.log(`  ❌ 修正失敗: ${fix.oldPath} (${error.message})`, 'red');
      }
    });
  }

  /**
   * 結果の表示
   */
  displayResults() {
    this.log('\n' + '='.repeat(60), 'bright');
    this.log('📊 命名規則検証結果サマリー', 'bright');
    this.log('='.repeat(60), 'bright');

    // エラー表示
    if (this.errors.length > 0) {
      this.log(`\n❌ エラー: ${this.errors.length}件`, 'red');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.message}`, 'red');
        this.log(`   ファイル: ${error.file}`, 'red');
        if (error.suggestion) {
          this.log(`   提案: ${error.suggestion}`, 'yellow');
        }
      });
    }

    // 警告表示
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  警告: ${this.warnings.length}件`, 'yellow');
      if (this.options.verbose) {
        this.warnings.forEach((warning, index) => {
          this.log(`${index + 1}. ${warning.message}`, 'yellow');
          this.log(`   ファイル: ${warning.file}`, 'yellow');
          if (warning.suggestion) {
            this.log(`   提案: ${warning.suggestion}`, 'cyan');
          }
        });
      }
    }

    // 成功表示
    if (this.errors.length === 0) {
      this.log('\n🎉 命名規則検証完了！', 'green');
      this.log('✅ 重要な違反は検出されませんでした', 'green');
      
      if (this.warnings.length > 0) {
        this.log(`⚠️  改善提案が${this.warnings.length}件あります`, 'yellow');
      }
    } else {
      this.log('\n❌ 命名規則違反が検出されました', 'red');
      this.log('📖 詳細は docs/NAMING_CONVENTIONS.md を参照してください', 'cyan');
      
      if (this.options.fix) {
        this.log('💡 --fixオプションで一部の問題を自動修正できます', 'yellow');
      }
    }

    this.log('\n' + '='.repeat(60), 'bright');
    
    return this.errors.length === 0 ? 0 : 1;
  }

  /**
   * メインチェック実行
   */
  async run() {
    this.log('🔍 Rimor命名規則チェッカー v1.0', 'bright');
    this.log(`📁 対象: ${this.options.projectRoot}`, 'cyan');
    
    if (this.options.fix) {
      this.log('🔧 自動修正モード有効', 'yellow');
    }

    // 各チェックを実行
    this.checkVersionNumbers();
    this.checkImplSuffix();
    this.checkTestFileNaming();
    this.checkPluginFileNaming();
    this.checkTypeDefinitionPlacement();
    this.checkCaseConsistency();

    // 自動修正実行
    this.applyFixes();

    // 結果表示
    return this.displayResults();
  }
}

// コマンドライン引数解析
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
    help: args.includes('--help') || args.includes('-h')
  };
}

// ヘルプ表示
function showHelp() {
  console.log(`
Rimor命名規則チェッカー v1.0

使用方法:
  node scripts/check-naming-conventions.js [オプション]

オプション:
  --fix      自動修正を実行
  --verbose  詳細な出力
  --help     このヘルプを表示

例:
  node scripts/check-naming-conventions.js                # 検証のみ
  node scripts/check-naming-conventions.js --fix          # 自動修正付き
  node scripts/check-naming-conventions.js --verbose      # 詳細出力
  node scripts/check-naming-conventions.js --fix --verbose # 全オプション
`);
}

// メイン実行
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const checker = new NamingConventionChecker(options);
  const exitCode = await checker.run();
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { NamingConventionChecker };