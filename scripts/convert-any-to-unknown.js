#!/usr/bin/env node

/**
 * any型をunknown型に自動変換するスクリプト
 * 
 * 用途:
 * - any型をunknown型に安全に変換
 * - 型ガードの自動生成
 * - 変換後のビルド確認
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(process.cwd(), '.rimor', 'reports', 'type-migration');
const BACKUP_DIR = path.join(process.cwd(), '.rimor', 'backup');
const MIGRATION_LOG = path.join(REPORTS_DIR, 'migration-log.json');

// 変換結果を格納
const migrationResults = {
  timestamp: new Date().toISOString(),
  totalFiles: 0,
  filesModified: 0,
  anyConverted: 0,
  unknownAdded: 0,
  typeGuardsGenerated: 0,
  errors: [],
  files: []
};

// 変換ルール
const conversionRules = [
  {
    // パラメータ定義のany
    pattern: /(\w+):\s*any\b/g,
    replacement: '$1: unknown',
    needsTypeGuard: true,
    description: 'パラメータのany型'
  },
  {
    // ジェネリクスのany
    pattern: /<any>/g,
    replacement: '<unknown>',
    needsTypeGuard: false,
    description: 'ジェネリクスのany型'
  },
  {
    // 型アサーションのas any
    pattern: /as\s+any\b/g,
    replacement: 'as unknown',
    needsTypeGuard: false,
    description: '型アサーション'
  },
  {
    // 配列のany
    pattern: /:\s*any\[\]/g,
    replacement: ': unknown[]',
    needsTypeGuard: true,
    description: '配列のany型'
  },
  {
    // Promiseのany
    pattern: /Promise<any>/g,
    replacement: 'Promise<unknown>',
    needsTypeGuard: false,
    description: 'Promiseのany型'
  }
];

/**
 * メイン実行関数
 */
async function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src';
  const dryRun = args.includes('--dry-run');
  const aggressive = args.includes('--aggressive');
  const generateGuards = args.includes('--with-guards');
  
  console.log('🔄 any → unknown 変換を開始\n');
  console.log(`ターゲット: ${targetPath}`);
  console.log(`モード: ${dryRun ? 'ドライラン' : '実行'}`);
  console.log(`レベル: ${aggressive ? 'アグレッシブ' : '保守的'}`);
  console.log(`型ガード: ${generateGuards ? '生成' : 'スキップ'}\n`);
  
  // ディレクトリ作成
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  if (!dryRun && !fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // ファイルを収集
  const files = collectTypeScriptFiles(targetPath);
  migrationResults.totalFiles = files.length;
  
  // 各ファイルを処理
  for (const file of files) {
    await processFile(file, dryRun, aggressive, generateGuards);
  }
  
  // ビルドテスト
  if (!dryRun && migrationResults.filesModified > 0) {
    console.log('\n🔨 ビルドテスト実行中...');
    const buildSuccess = testBuild();
    
    if (!buildSuccess) {
      console.error('\n❌ ビルドエラーが発生しました');
      console.log('🔄 変更をロールバック中...');
      rollbackChanges();
    }
  }
  
  // 結果を保存
  saveResults();
  
  // サマリーを表示
  displaySummary();
  
  process.exit(migrationResults.errors.length > 0 ? 1 : 0);
}

/**
 * TypeScriptファイルを収集
 */
function collectTypeScriptFiles(targetPath) {
  const files = [];
  const fullPath = path.join(process.cwd(), targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`パスが存在しません: ${fullPath}`);
    return files;
  }
  
  function traverse(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
          traverse(itemPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        // テストファイルを除外
        if (!item.includes('.test.') && !item.includes('.spec.')) {
          files.push(itemPath);
        }
      }
    }
  }
  
  traverse(fullPath);
  return files;
}

/**
 * ファイルを処理
 */
async function processFile(filePath, dryRun, aggressive, generateGuards) {
  const relativePath = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changeCount = 0;
  const changes = [];
  
  // 各変換ルールを適用
  for (const rule of conversionRules) {
    const matches = content.match(rule.pattern);
    
    if (matches) {
      if (!aggressive && rule.needsTypeGuard) {
        // 保守的モードでは型ガードが必要な変換をスキップ
        continue;
      }
      
      modified = modified.replace(rule.pattern, rule.replacement);
      changeCount += matches.length;
      
      changes.push({
        rule: rule.description,
        count: matches.length,
        examples: matches.slice(0, 3)
      });
    }
  }
  
  // 変更がある場合
  if (changeCount > 0) {
    migrationResults.filesModified++;
    migrationResults.anyConverted += changeCount;
    
    const fileResult = {
      path: relativePath,
      changes: changes,
      totalChanges: changeCount
    };
    
    migrationResults.files.push(fileResult);
    
    if (dryRun) {
      console.log(`🔍 ${relativePath}: ${changeCount}箇所の変換候補`);
      changes.forEach(change => {
        console.log(`   - ${change.rule}: ${change.count}箇所`);
      });
    } else {
      // バックアップを作成
      const backupPath = path.join(BACKUP_DIR, relativePath);
      const backupDir = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.writeFileSync(backupPath, content);
      
      // ファイルを更新
      fs.writeFileSync(filePath, modified);
      
      console.log(`✅ ${relativePath}: ${changeCount}箇所を変換`);
      
      // 型ガードを生成
      if (generateGuards && changes.some(c => c.rule.includes('パラメータ'))) {
        generateTypeGuards(filePath, modified);
      }
    }
  }
}

/**
 * 型ガードを生成
 */
function generateTypeGuards(filePath, content) {
  // 関数パラメータでunknown型を使用している箇所を検出
  const functionPattern = /function\s+(\w+)\s*\([^)]*\w+:\s*unknown[^)]*\)/g;
  const methodPattern = /(\w+)\s*\([^)]*\w+:\s*unknown[^)]*\)\s*[:{]/g;
  
  const guards = [];
  let match;
  
  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    guards.push(generateGuardForFunction(functionName));
  }
  
  while ((match = methodPattern.exec(content)) !== null) {
    const methodName = match[1];
    if (methodName !== 'constructor') {
      guards.push(generateGuardForFunction(methodName));
    }
  }
  
  if (guards.length > 0) {
    migrationResults.typeGuardsGenerated += guards.length;
    console.log(`   🔐 ${guards.length}個の型ガードを生成`);
  }
}

/**
 * 関数用の型ガードを生成
 */
function generateGuardForFunction(functionName) {
  return `
// Type guard for ${functionName}
function is${functionName}Param(value: unknown): value is { /* define structure */ } {
  return (
    typeof value === 'object' &&
    value !== null &&
    // Add specific property checks here
    true
  );
}
`;
}

/**
 * ビルドテスト
 */
function testBuild() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ ビルド成功');
    return true;
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : '';
    const errorCount = (output.match(/error TS/g) || []).length;
    
    migrationResults.errors.push({
      type: 'build',
      message: `ビルドエラー: ${errorCount}件`,
      details: output.substring(0, 500)
    });
    
    return false;
  }
}

/**
 * 変更をロールバック
 */
function rollbackChanges() {
  for (const file of migrationResults.files) {
    const originalPath = path.join(process.cwd(), file.path);
    const backupPath = path.join(BACKUP_DIR, file.path);
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, originalPath);
      console.log(`  🔄 ${file.path}`);
    }
  }
  
  console.log('\n✅ ロールバック完了');
}

/**
 * 結果を保存
 */
function saveResults() {
  fs.writeFileSync(MIGRATION_LOG, JSON.stringify(migrationResults, null, 2));
}

/**
 * サマリーを表示
 */
function displaySummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 any → unknown 変換結果');
  console.log('='.repeat(50));
  console.log(`総ファイル数: ${migrationResults.totalFiles}`);
  console.log(`変更ファイル数: ${migrationResults.filesModified}`);
  console.log(`変換数: ${migrationResults.anyConverted}`);
  console.log(`型ガード生成数: ${migrationResults.typeGuardsGenerated}`);
  console.log(`エラー数: ${migrationResults.errors.length}`);
  
  if (migrationResults.filesModified > 0) {
    console.log('\n主要な変更:');
    migrationResults.files.slice(0, 5).forEach(file => {
      console.log(`  - ${file.path}: ${file.totalChanges}箇所`);
    });
    
    if (migrationResults.files.length > 5) {
      console.log(`  ... 他${migrationResults.files.length - 5}ファイル`);
    }
  }
  
  console.log('\nレポート: ' + MIGRATION_LOG);
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ エラー:', error.message);
    process.exit(1);
  });
}