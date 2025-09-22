/**
 * 型定義移行ツール
 * 既存の型定義をcore-definitionsに移行するための自動化ツール
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface MigrationTarget {
  filePath: string;
  oldType: string;
  newType: string;
  importNeeded: boolean;
}

interface MigrationReport {
  totalFiles: number;
  modifiedFiles: number;
  skippedFiles: number;
  errors: Array<{ file: string; error: string }>;
  estimatedTime: string;
  affectedTests: string[];
}

export class TypeMigrationTool {
  private migrationMap = new Map<string, string>([
    // RiskLevel移行
    ['RiskLevel.CRITICAL', 'CoreTypes.RiskLevel.CRITICAL'],
    ['RiskLevel.HIGH', 'CoreTypes.RiskLevel.HIGH'],
    ['RiskLevel.MEDIUM', 'CoreTypes.RiskLevel.MEDIUM'],
    ['RiskLevel.LOW', 'CoreTypes.RiskLevel.LOW'],
    ['RiskLevel.MINIMAL', 'CoreTypes.RiskLevel.MINIMAL'],
    
    // 型定義の移行
    ['export type RiskLevel', '// Migrated to CoreTypes - export type RiskLevel'],
    ['export enum RiskLevel', '// Migrated to CoreTypes - export enum RiskLevel'],
    ['export interface RiskAssessment', '// Migrated to CoreTypes - export interface RiskAssessment'],
    ['export interface Issue', '// Migrated to CoreTypes - export interface Issue'],
    ['export type SeverityLevel', '// Migrated to CoreTypes - export type SeverityLevel'],
    
    // インポートパスの更新
    ["from '../ai-output/types'", "from '../core/types/core-definitions'"],
    ["from '../../ai-output/types'", "from '../../core/types/core-definitions'"],
    ["from '../../../ai-output/types'", "from '../../../core/types/core-definitions'"],
  ]);

  private importStatement = "import { CoreTypes, TypeGuards, TypeUtils } from '@/core/types/core-definitions';\n";
  private modifiedFiles: string[] = [];
  private errors: Array<{ file: string; error: string }> = [];

  /**
   * ファイルを移行
   */
  async migrateFile(filePath: string, dryRun = true): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let modified = content;
      let hasChanges = false;

      // Step 1: 重複する型定義をコメントアウト
      const duplicatePatterns = [
        /^export (interface|type|enum) (RiskLevel|RiskAssessment|Issue|SeverityLevel|AIJsonOutput)/gm,
      ];

      for (const pattern of duplicatePatterns) {
        const matches = modified.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // 既にコメントアウトされていない場合のみ
            if (!match.startsWith('//')) {
              const replacement = `// Migrated to CoreTypes - ${match}`;
              modified = modified.replace(match, replacement);
              hasChanges = true;
            }
          });
        }
      }

      // Step 2: 型参照を更新
      this.migrationMap.forEach((newValue, oldValue) => {
        if (modified.includes(oldValue)) {
          modified = modified.replace(new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newValue);
          hasChanges = true;
        }
      });

      // Step 3: インポート文を追加（必要な場合）
      if (hasChanges && this.needsCoreTypesImport(modified)) {
        // 既存のインポートがない場合のみ追加
        if (!modified.includes("from '@/core/types/core-definitions'") &&
            !modified.includes('from "../core/types/core-definitions"') &&
            !modified.includes('from "../../core/types/core-definitions"')) {
          
          // ファイルの先頭のインポート部分を見つける
          const importMatch = modified.match(/^import .* from .*$/m);
          if (importMatch) {
            const firstImportIndex = modified.indexOf(importMatch[0]);
            modified = modified.slice(0, firstImportIndex) + 
                      this.getRelativeImport(filePath) + '\n' +
                      modified.slice(firstImportIndex);
          } else {
            // インポートがない場合は先頭に追加
            modified = this.getRelativeImport(filePath) + '\n' + modified;
          }
          hasChanges = true;
        }
      }

      // Step 4: 変更を保存（dryRunでない場合）
      if (hasChanges) {
        if (!dryRun) {
          fs.writeFileSync(filePath, modified, 'utf-8');
          this.modifiedFiles.push(filePath);
        }
        return true;
      }

      return false;
    } catch (error) {
      this.errors.push({ 
        file: filePath, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * CoreTypesのインポートが必要かチェック
   */
  private needsCoreTypesImport(content: string): boolean {
    const patterns = [
      'CoreTypes.',
      'TypeGuards.',
      'TypeUtils.',
      ': RiskLevel',
      ': SeverityLevel',
      ': Issue',
      ': RiskAssessment',
      ': AIJsonOutput',
    ];
    
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * 相対インポートパスを生成
   */
  private getRelativeImport(filePath: string): string {
    const from = path.dirname(filePath);
    const to = path.join(process.cwd(), 'src/core/types/core-definitions');
    let relativePath = path.relative(from, to).replace(/\\/g, '/');
    
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    // .tsを除去
    relativePath = relativePath.replace(/\.ts$/, '');
    
    return `import { CoreTypes, TypeGuards, TypeUtils } from '${relativePath}';`;
  }

  /**
   * ディレクトリ内の全ファイルを移行
   */
  async migrateDirectory(dirPath: string, dryRun = true): Promise<MigrationReport> {
    const startTime = Date.now();
    const files = this.getAllTypeScriptFiles(dirPath);
    let modifiedCount = 0;
    const affectedTests: Set<string> = new Set();

    console.log(`🔍 Found ${files.length} TypeScript files to process...`);

    for (const file of files) {
      // core-definitions自体はスキップ
      if (file.includes('core-definitions.ts')) continue;
      
      const modified = await this.migrateFile(file, dryRun);
      if (modified) {
        modifiedCount++;
        console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
        
        // テストファイルを特定
        const testFile = this.findTestFile(file);
        if (testFile && fs.existsSync(testFile)) {
          affectedTests.add(testFile);
        }
      }
    }

    const elapsedTime = Date.now() - startTime;
    
    return {
      totalFiles: files.length,
      modifiedFiles: modifiedCount,
      skippedFiles: files.length - modifiedCount,
      errors: this.errors,
      estimatedTime: `${Math.round(elapsedTime / 1000)}s`,
      affectedTests: Array.from(affectedTests)
    };
  }

  /**
   * TypeScriptファイルを再帰的に取得
   */
  private getAllTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
        files.push(...this.getAllTypeScriptFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 対応するテストファイルを見つける
   */
  private findTestFile(sourcePath: string): string | null {
    const parsed = path.parse(sourcePath);
    const testPaths = [
      // 同じディレクトリ
      path.join(parsed.dir, `${parsed.name}.test${parsed.ext}`),
      path.join(parsed.dir, `${parsed.name}.spec${parsed.ext}`),
      // testディレクトリ
      sourcePath.replace('/src/', '/test/').replace('.ts', '.test.ts'),
      sourcePath.replace('/src/', '/test/').replace('.ts', '.spec.ts'),
    ];

    for (const testPath of testPaths) {
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }

    return null;
  }

  /**
   * 移行レポートを生成
   */
  generateReport(report: MigrationReport): string {
    const output: string[] = [];
    
    output.push('# 型定義移行レポート');
    output.push(`\n生成日時: ${new Date().toISOString()}`);
    output.push('\n## サマリー');
    output.push(`- 処理ファイル数: ${report.totalFiles}`);
    output.push(`- 変更ファイル数: ${report.modifiedFiles}`);
    output.push(`- スキップファイル数: ${report.skippedFiles}`);
    output.push(`- エラー数: ${report.errors.length}`);
    output.push(`- 実行時間: ${report.estimatedTime}`);
    
    if (report.affectedTests.length > 0) {
      output.push('\n## 影響を受けるテストファイル');
      report.affectedTests.forEach(test => {
        output.push(`- ${path.relative(process.cwd(), test)}`);
      });
    }
    
    if (report.errors.length > 0) {
      output.push('\n## エラー');
      report.errors.forEach(err => {
        output.push(`\n### ${err.file}`);
        output.push(`\`\`\`\n${err.error}\n\`\`\``);
      });
    }
    
    output.push('\n## 次のステップ');
    output.push('1. 変更されたファイルをレビュー');
    output.push('2. `npm run build`でビルド確認');
    output.push('3. 影響を受けるテストを実行');
    output.push('4. 必要に応じて手動で調整');
    
    return output.join('\n');
  }

  /**
   * 移行前の検証
   */
  async validateBeforeMigration(dirPath: string): Promise<boolean> {
    console.log('🔍 Validating before migration...');
    
    // TypeScriptのコンパイルチェック
    const { execSync } = await import('child_process');
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      console.error('❌ TypeScript compilation failed. Fix errors before migration.');
      return false;
    }
    
    // core-definitionsファイルの存在確認
    const coreDefsPath = path.join(process.cwd(), 'src/core/types/core-definitions.ts');
    if (!fs.existsSync(coreDefsPath)) {
      console.error('❌ core-definitions.ts not found. Create it first.');
      return false;
    }
    
    console.log('✅ Validation passed');
    return true;
  }
}

/**
 * CLI実行
 */
if (require.main === module) {
  (async () => {
    const tool = new TypeMigrationTool();
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    const targetDir = args.find(arg => !arg.startsWith('--')) || 'src';
    
    console.log(`\n🚀 Type Migration Tool`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
    console.log(`Target: ${targetDir}\n`);
    
    // 検証
    const valid = await tool.validateBeforeMigration(targetDir);
    if (!valid && !dryRun) {
      process.exit(1);
    }
    
    // 移行実行
    const report = await tool.migrateDirectory(targetDir, dryRun);
    
    // レポート生成
    const reportContent = tool.generateReport(report);
    const reportPath = path.join(process.cwd(), 'reports/migration-report.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`\n📊 Migration Report saved to: ${reportPath}`);
    console.log(`\n✨ Migration ${dryRun ? 'simulation' : 'execution'} completed!`);
    
    if (dryRun) {
      console.log('\n💡 Run with --execute flag to apply changes');
    }
  })();
}