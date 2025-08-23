/**
 * CircularDependencyDetector クラス
 * Issue #103: 循環検出ロジックの設計上の問題を修正
 * 
 * 責務:
 * - ファイルレベルの循環依存検出
 * - 相対インポートのみを対象とした分析
 * - フルパスを使用した同名ファイル衝突の回避
 * 
 * 設計原則:
 * - DRY: 共通ロジックをユーティリティメソッドに抽出
 * - SOLID: 単一責任原則に基づく設計
 * - KISS: シンプルなDFSアルゴリズムの採用
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export interface CircularDependencyResult {
  cycles: string[][];
  summary: {
    totalFiles: number;
    totalCycles: number;
    severeCycles: number;
  };
}

export class CircularDependencyDetector {
  private readonly SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  private readonly BUILT_IN_MODULES = new Set([
    'fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream',
    'url', 'querystring', 'child_process', 'cluster', 'events',
    'buffer', 'process', 'console', 'module', 'require', 'assert',
    'net', 'tls', 'dns', 'readline', 'repl', 'vm', 'zlib'
  ]);

  /**
   * 循環依存を検出
   * Issue #103: ファイルレベルの循環依存検出に修正
   */
  async detectCircularDependencies(projectPath: string): Promise<string[][]> {
    const graph = await this.buildFileDependencyGraph(projectPath);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const detectCycle = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);

      const dependencies = graph.get(node) || new Set<string>();
      
      for (const dep of dependencies) {
        // 循環を発見した場合
        const cycleStartIndex = currentPath.indexOf(dep);
        if (cycleStartIndex !== -1) {
          const cycle = [...currentPath.slice(cycleStartIndex), dep];
          // プロジェクト相対パスに変換
          const relativeCycle = cycle.map(filePath => path.relative(projectPath, filePath));
          cycles.push(relativeCycle);
        } else if (!visited.has(dep)) {
          detectCycle(dep);
        }
      }

      recursionStack.delete(node);
      currentPath.pop();
    };

    // 全ノードを探索
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node);
      }
    }

    return this.deduplicateCycles(cycles);
  }

  /**
   * ファイル間の依存関係グラフを構築
   * Issue #103: フルパスを使用して同名ファイルの衝突を回避
   * @private
   */
  protected async buildFileDependencyGraph(projectPath: string): Promise<Map<string, Set<string>>> {
    const graph = new Map<string, Set<string>>();
    
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.git/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.resolve(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativeImports = this.extractRelativeImports(content, filePath, projectPath);
        graph.set(filePath, new Set(relativeImports));
      } catch (error) {
        // ファイル読み込みエラーは無視（Defensive Programming）
        graph.set(filePath, new Set());
      }
    }

    return graph;
  }

  /**
   * 相対インポートを抽出
   * Issue #103: 相対インポートのみを対象とし、外部パッケージは除外
   * @private
   */
  private extractRelativeImports(content: string, fromFilePath: string, projectPath: string): string[] {
    const imports = new Set<string>();
    const fromDir = path.dirname(fromFilePath);

    // ES6 imports
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = this.resolveRelativeImport(match[1], fromDir, projectPath);
      if (importPath) {
        imports.add(importPath);
      }
    }

    // ES6 exports with from clause (export ... from '...')
    const exportFromRegex = /export\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    while ((match = exportFromRegex.exec(content)) !== null) {
      const importPath = this.resolveRelativeImport(match[1], fromDir, projectPath);
      if (importPath) {
        imports.add(importPath);
      }
    }

    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = this.resolveRelativeImport(match[1], fromDir, projectPath);
      if (importPath) {
        imports.add(importPath);
      }
    }

    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = this.resolveRelativeImport(match[1], fromDir, projectPath);
      if (importPath) {
        imports.add(importPath);
      }
    }

    return Array.from(imports);
  }

  /**
   * 相対インポートパスを解決
   * @private
   */
  private resolveRelativeImport(importPath: string, fromDir: string, projectPath: string): string | null {
    // 相対パスでない場合は無視
    if (!this.isRelativeImport(importPath)) {
      return null;
    }

    // 拡張子を除去したベースパス
    const basePath = importPath.replace(/\.(js|jsx|ts|tsx|mjs|cjs)$/, '');
    const baseResolvedPath = path.resolve(fromDir, basePath);

    // 可能なパスを試行（拡張子のバリエーション）
    const possiblePaths = [
      // 元のパスをそのまま
      path.resolve(fromDir, importPath),
      // 拡張子なしの場合は各拡張子を試行
      baseResolvedPath + '.ts',
      baseResolvedPath + '.tsx',
      baseResolvedPath + '.js',
      baseResolvedPath + '.jsx',
      baseResolvedPath + '.mjs',
      baseResolvedPath + '.cjs',
      // index ファイルを試行
      path.resolve(baseResolvedPath, 'index.ts'),
      path.resolve(baseResolvedPath, 'index.tsx'),
      path.resolve(baseResolvedPath, 'index.js'),
      path.resolve(baseResolvedPath, 'index.jsx'),
      path.resolve(baseResolvedPath, 'index.mjs'),
      path.resolve(baseResolvedPath, 'index.cjs')
    ];

    for (const possiblePath of possiblePaths) {
      try {
        // プロジェクト内のファイルかつ存在する場合のみ
        if (possiblePath.startsWith(projectPath) && 
            fs.existsSync(possiblePath) && 
            fs.statSync(possiblePath).isFile()) {
          return possiblePath;
        }
      } catch (error) {
        // ファイルアクセスエラーは無視
        continue;
      }
    }

    return null;
  }

  /**
   * 相対インポートかどうかを判定
   * @private
   */
  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || 
           importPath.startsWith('../') || 
           importPath.startsWith('/');
  }

  /**
   * 循環の重複を除去
   * @private
   */
  private deduplicateCycles(cycles: string[][]): string[][] {
    const uniqueCycles = new Map<string, string[]>();

    for (const cycle of cycles) {
      // 循環を正規化（最小の要素から始まるように）
      const normalizedCycle = this.normalizeCycle(cycle);
      const key = JSON.stringify(normalizedCycle);
      
      if (!uniqueCycles.has(key)) {
        uniqueCycles.set(key, normalizedCycle);
      }
    }

    return Array.from(uniqueCycles.values());
  }

  /**
   * 循環を正規化
   * @private
   */
  private normalizeCycle(cycle: string[]): string[] {
    if (cycle.length <= 1) {
      return cycle;
    }

    // 最後の重複要素を除去
    const cycleWithoutLast = cycle.slice(0, -1);
    
    // 最小の要素のインデックスを見つける
    let minIndex = 0;
    for (let i = 1; i < cycleWithoutLast.length; i++) {
      if (cycleWithoutLast[i] < cycleWithoutLast[minIndex]) {
        minIndex = i;
      }
    }

    // 最小要素から始まるように回転
    const rotated = [
      ...cycleWithoutLast.slice(minIndex),
      ...cycleWithoutLast.slice(0, minIndex)
    ];

    // 終端要素を追加して循環を完成
    rotated.push(rotated[0]);
    
    return rotated;
  }

  /**
   * 循環の重要度を計算
   * scripts/check-circular-deps.jsとの一貫性を保持
   */
  calculateSeverity(cycle: string[]): 'high' | 'medium' | 'low' {
    const length = cycle.length - 1; // 終端の重複要素を除く

    if (length === 2) {
      return 'high'; // 直接的な相互依存
    } else if (length <= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * リファクタリング提案を生成
   */
  suggestRefactoring(cycle: string[]): string {
    const suggestions: string[] = [];
    
    suggestions.push('Consider extracting common functionality into a separate module');
    suggestions.push('Use interface segregation to break dependencies');
    suggestions.push('Apply dependency inversion principle');
    suggestions.push('Consider using dependency injection');
    
    if (cycle.length <= 3) {
      suggestions.push('This is a direct circular dependency - consider immediate refactoring');
    } else {
      suggestions.push('This is a complex cycle - consider gradual refactoring');
    }

    return suggestions.join('\n');
  }

  /**
   * 詳細な循環依存レポートを生成
   */
  async generateDetailedReport(projectPath: string): Promise<CircularDependencyResult> {
    const cycles = await this.detectCircularDependencies(projectPath);
    const graph = await this.buildFileDependencyGraph(projectPath);
    
    const severeCycles = cycles.filter(cycle => 
      this.calculateSeverity(cycle) === 'high'
    ).length;

    return {
      cycles,
      summary: {
        totalFiles: graph.size,
        totalCycles: cycles.length,
        severeCycles
      }
    };
  }
}