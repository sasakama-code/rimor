/**
 * 型定義の一貫性チェックツール
 * 重複・競合する型定義を検出し、統一された型定義を生成
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface TypeDefinition {
  name: string;
  filePath: string;
  definition: string;
  kind: 'interface' | 'type' | 'enum';
  exportStatus: 'exported' | 'internal';
}

interface TypeConflict {
  typeName: string;
  definitions: TypeDefinition[];
  conflictType: 'duplicate' | 'inconsistent';
}

export class TypeConsistencyChecker {
  private typeDefinitions: Map<string, TypeDefinition[]> = new Map();
  private conflicts: TypeConflict[] = [];

  /**
   * 指定ディレクトリ配下の型定義を収集
   */
  async collectTypeDefinitions(rootDir: string): Promise<void> {
    const files = this.getAllTypeScriptFiles(rootDir);
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
  }

  /**
   * TypeScriptファイルを再帰的に取得
   */
  private getAllTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        files.push(...this.getAllTypeScriptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * ファイルから型定義を抽出
   */
  private async analyzeFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        this.registerTypeDefinition({
          name: node.name.text,
          filePath,
          definition: node.getText(sourceFile),
          kind: 'interface',
          exportStatus: this.hasExportModifier(node) ? 'exported' : 'internal'
        });
      } else if (ts.isTypeAliasDeclaration(node)) {
        this.registerTypeDefinition({
          name: node.name.text,
          filePath,
          definition: node.getText(sourceFile),
          kind: 'type',
          exportStatus: this.hasExportModifier(node) ? 'exported' : 'internal'
        });
      } else if (ts.isEnumDeclaration(node)) {
        this.registerTypeDefinition({
          name: node.name?.text || 'anonymous',
          filePath,
          definition: node.getText(sourceFile),
          kind: 'enum',
          exportStatus: this.hasExportModifier(node) ? 'exported' : 'internal'
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * export修飾子の確認
   */
  private hasExportModifier(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration): boolean {
    if (!node.modifiers) return false;
    return node.modifiers.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  /**
   * 型定義を登録
   */
  private registerTypeDefinition(def: TypeDefinition): void {
    const existing = this.typeDefinitions.get(def.name) || [];
    existing.push(def);
    this.typeDefinitions.set(def.name, existing);
  }

  /**
   * 競合を検出
   */
  detectConflicts(): TypeConflict[] {
    this.conflicts = [];

    for (const [typeName, definitions] of this.typeDefinitions.entries()) {
      if (definitions.length > 1) {
        const isInconsistent = this.areDefinitionsInconsistent(definitions);
        
        this.conflicts.push({
          typeName,
          definitions,
          conflictType: isInconsistent ? 'inconsistent' : 'duplicate'
        });
      }
    }

    return this.conflicts;
  }

  /**
   * 定義の不整合をチェック
   */
  private areDefinitionsInconsistent(definitions: TypeDefinition[]): boolean {
    const normalizedDefs = definitions.map(d => 
      this.normalizeDefinition(d.definition)
    );

    return new Set(normalizedDefs).size > 1;
  }

  /**
   * 定義を正規化（空白やコメントを除去）
   */
  private normalizeDefinition(definition: string): string {
    return definition
      .replace(/\/\*[\s\S]*?\*\//g, '') // ブロックコメント除去
      .replace(/\/\/.*$/gm, '') // 行コメント除去
      .replace(/\s+/g, ' ') // 連続空白を単一空白に
      .trim();
  }

  /**
   * レポート生成
   */
  generateReport(): string {
    const report: string[] = [];
    
    report.push('# 型定義一貫性チェックレポート');
    report.push(`\n生成日時: ${new Date().toISOString()}`);
    report.push(`\n## サマリー`);
    report.push(`- 総型定義数: ${this.typeDefinitions.size}`);
    report.push(`- 競合数: ${this.conflicts.length}`);
    
    if (this.conflicts.length > 0) {
      report.push(`\n## 競合詳細`);
      
      for (const conflict of this.conflicts) {
        report.push(`\n### ${conflict.typeName} (${conflict.conflictType})`);
        
        for (const def of conflict.definitions) {
          report.push(`\n#### ${def.filePath}`);
          report.push(`- 種別: ${def.kind}`);
          report.push(`- エクスポート: ${def.exportStatus}`);
          report.push('```typescript');
          report.push(def.definition);
          report.push('```');
        }
      }
    }

    report.push(`\n## 推奨アクション`);
    
    for (const conflict of this.conflicts) {
      if (conflict.conflictType === 'inconsistent') {
        report.push(`- ${conflict.typeName}: 定義を統一してください`);
      } else {
        report.push(`- ${conflict.typeName}: 重複を削除してください`);
      }
    }

    return report.join('\n');
  }

  /**
   * 統一型定義ファイルを生成
   */
  generateUnifiedTypes(outputPath: string): void {
    const unifiedTypes: string[] = [];
    
    unifiedTypes.push('/**');
    unifiedTypes.push(' * 統一型定義ファイル');
    unifiedTypes.push(' * 自動生成: ' + new Date().toISOString());
    unifiedTypes.push(' */');
    unifiedTypes.push('');

    const processedTypes = new Set<string>();

    for (const [typeName, definitions] of this.typeDefinitions.entries()) {
      if (processedTypes.has(typeName)) continue;
      
      const exportedDef = definitions.find(d => d.exportStatus === 'exported');
      const selectedDef = exportedDef || definitions[0];
      
      if (definitions.length > 1) {
        unifiedTypes.push(`// 注意: ${typeName}は${definitions.length}箇所で定義されています`);
        unifiedTypes.push(`// 選択元: ${selectedDef.filePath}`);
      }
      
      unifiedTypes.push(selectedDef.definition);
      unifiedTypes.push('');
      
      processedTypes.add(typeName);
    }

    fs.writeFileSync(outputPath, unifiedTypes.join('\n'));
  }
}

/**
 * CLI実行
 */
if (require.main === module) {
  (async () => {
    const checker = new TypeConsistencyChecker();
    const srcDir = path.join(__dirname, '../../src');
    
    console.log('型定義を収集中...');
    await checker.collectTypeDefinitions(srcDir);
    
    console.log('競合を検出中...');
    const conflicts = checker.detectConflicts();
    
    console.log(`検出された競合: ${conflicts.length}件`);
    
    const reportPath = path.join(__dirname, '../../reports/type-consistency-report.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, checker.generateReport());
    console.log(`レポート生成: ${reportPath}`);
    
    if (conflicts.length > 0) {
      // unified-types.tsは廃止されました (issue #77)
      // 新しい型定義は src/types/ 配下のモジュールを使用してください
      // const unifiedPath = path.join(__dirname, '../core/types/unified-types.ts');
      // fs.mkdirSync(path.dirname(unifiedPath), { recursive: true });
      // checker.generateUnifiedTypes(unifiedPath);
      // console.log(`統一型定義生成: ${unifiedPath}`);
    }
  })();
}