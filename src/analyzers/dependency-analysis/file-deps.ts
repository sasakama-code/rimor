/**
 * FileDependencyAnalyzer
 * Issue #65: ファイルレベルの依存関係分析
 * 
 * SOLID原則: 単一責任（ファイル依存関係のみ）
 * DRY原則: インポート解析ロジックの共通化
 * KISS原則: シンプルな正規表現ベースの解析
 */

import { FileDependency } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイルレベルの依存関係を分析
 */
export class FileDependencyAnalyzer {
  private readonly BUILTIN_MODULES = [
    'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util',
    'stream', 'events', 'buffer', 'child_process', 'cluster',
    'dgram', 'dns', 'net', 'readline', 'repl', 'tls', 'tty',
    'v8', 'vm', 'worker_threads', 'zlib'
  ];

  /**
   * ファイルの依存関係を分析
   */
  async analyzeFileDependencies(filePath: string): Promise<{
    file: string;
    imports: string[];
    exports: string[];
    dependsOn: string[];
    dependedBy: string[];
    packageImports?: string[];
  }> {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const packageImports = imports.filter(imp => this.getImportType(imp) === 'external');

    return {
      file: filePath,
      imports,
      exports,
      dependsOn: imports.filter(imp => this.getImportType(imp) === 'relative'),
      dependedBy: [],
      packageImports
    };
  }

  /**
   * インポート文を抽出
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 import文
    const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS require文
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Dynamic import
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)]; // 重複を除去
  }

  /**
   * エクスポート文を抽出
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Default export
    if (/export\s+default/g.test(content)) {
      exports.push('default');
    }

    // Re-exports
    const reExportRegex = /export\s*\{\s*([^}]+)\s*\}\s*from/g;
    while ((match = reExportRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(item => item.trim());
      items.forEach(item => {
        const [name] = item.split(' as ');
        exports.push(name.trim());
      });
    }

    // CommonJS exports
    const commonjsExportRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
    while ((match = commonjsExportRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(item => item.trim());
      items.forEach(item => {
        const [name] = item.split(':');
        exports.push(name.trim());
      });
    }

    return [...new Set(exports)]; // 重複を除去
  }

  /**
   * インポートタイプを判定
   */
  getImportType(importPath: string): 'relative' | 'external' | 'builtin' {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return 'relative';
    }
    if (this.BUILTIN_MODULES.includes(importPath)) {
      return 'builtin';
    }
    return 'external';
  }

  /**
   * ファイル間の依存関係グラフを構築（修正版）
   * Issue #116: 相対キーと絶対解決の不一致を解決
   */
  async buildDependencyGraph(projectPath: string, files: string[]): Promise<Map<string, FileDependency>> {
    const graph = new Map<string, FileDependency>();

    // 各ファイルの依存関係を分析
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        const deps = await this.analyzeFileDependencies(filePath);
        graph.set(file, {
          file,
          imports: deps.imports.filter(imp => this.getImportType(imp) === 'relative'),
          exports: deps.exports,
          dependsOn: deps.imports.filter(imp => this.getImportType(imp) === 'relative'),
          dependedBy: [],
          absPath: filePath // Issue #116: 絶対パスを保持
        });
      }
    }

    // dependedByを計算（修正版）
    for (const [file, deps] of graph.entries()) {
      const currentFilePath = path.join(projectPath, file);
      
      for (const importPath of deps.imports) {
        // Issue #116: projectPath基準で解決し、相対キーに正規化
        const resolvedAbsPath = this.resolveImportPath(currentFilePath, importPath, projectPath);
        
        if (resolvedAbsPath) {
          const relativeKey = this.normalizeToRelativeKey(resolvedAbsPath, projectPath);
          const importedFile = graph.get(relativeKey);
          if (importedFile) {
            importedFile.dependedBy.push(file);
          }
        }
      }
    }

    return graph;
  }

  /**
   * Extract Method: 絶対パス→相対キー正規化
   * Issue #116: パス解決の不整合を解決
   */
  private normalizeToRelativeKey(absolutePath: string, projectPath: string): string {
    const relativePath = path.relative(projectPath, absolutePath);
    return path.normalize(relativePath);
  }

  /**
   * Extract Method: projectPath基準でファイル探索
   * Issue #116: CWD/projectPath不整合を解決  
   */
  private resolveWithProjectBase(importPath: string, fromFile: string, projectPath: string): string | null {
    if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
      return null; // 相対パスのみ処理
    }

    const fromDir = path.dirname(fromFile);
    const resolvedBase = path.resolve(fromDir, importPath);
    
    return this.findFileWithExtensions(resolvedBase, projectPath);
  }

  /**
   * Extract Method: 拡張子探索の抽象化
   * Issue #116: 拡張子判定の改善
   */
  private findFileWithExtensions(basePath: string, projectPath: string): string | null {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    // 拡張子付きで優先探索（Issue #116: キー一致のため）
    for (const ext of extensions) {
      const withExt = basePath + ext;
      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }
    
    // 拡張子なしで存在チェック（フォールバック）
    if (fs.existsSync(basePath)) {
      return basePath;
    }
    
    return null;
  }

  /**
   * 相対インポートパスを解決（修正版）
   * Issue #116: projectPath基準の一貫した解決
   */
  private resolveImportPath(currentFile: string, importPath: string, projectPath: string): string | null {
    const resolved = this.resolveWithProjectBase(importPath, currentFile, projectPath);
    return resolved;
  }
}