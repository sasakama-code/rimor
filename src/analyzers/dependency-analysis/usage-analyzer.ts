/**
 * 使用状況分析クラス
 * 依存関係の使用パターンと頻度を分析
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { DependencyUsageInfo } from '../dependency-types';

export interface ImportLocation {
  file: string;
  line: number;
}

export interface ImportDepthAnalysis {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    file: string;
    depth: number;
  }>;
}

export interface UsageCategory {
  core: string[];        // 頻繁に使用される中核的な依存関係
  peripheral: string[];  // たまに使用される周辺的な依存関係
  unused: string[];      // 使用されていない依存関係
}

export interface UsageReport {
  summary: {
    totalPackages: number;
    usedPackages: number;
    unusedPackages: number;
  };
  frequency: Map<string, number>;
  categories: UsageCategory;
  recommendations: string[];
}

export class UsageAnalyzer {
  private readonly BUILT_IN_MODULES = new Set([
    'fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream',
    'url', 'querystring', 'child_process', 'cluster', 'events',
    'buffer', 'process', 'console', 'module', 'require', 'assert',
    'net', 'tls', 'dns', 'readline', 'repl', 'vm', 'zlib'
  ]);

  private readonly SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  
  /**
   * プロジェクト内で使用されているパッケージを検出
   */
  async findUsedPackages(projectPath: string): Promise<string[]> {
    const usedPackages = new Set<string>();
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImports(content);
        
        imports.forEach(imp => {
          const packageName = this.getExternalPackageName(imp);
          if (packageName) {
            usedPackages.add(packageName);
          }
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    return Array.from(usedPackages);
  }

  /**
   * パッケージの使用頻度を分析
   */
  async analyzeUsageFrequency(projectPath: string): Promise<Map<string, number>> {
    const frequency = new Map<string, number>();
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImportsWithDuplicates(content);
        
        imports.forEach(imp => {
          const packageName = this.getExternalPackageName(imp);
          if (packageName) {
            frequency.set(packageName, (frequency.get(packageName) || 0) + 1);
          }
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    return frequency;
  }

  /**
   * 特定のパッケージがインポートされている場所を検出
   */
  async findImportLocations(projectPath: string, packageName: string): Promise<ImportLocation[]> {
    const locations: ImportLocation[] = [];
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const imports = this.extractImportsFromLine(line);
          imports.forEach(imp => {
            if (!this.isRelativeImport(imp) && this.getPackageName(imp) === packageName) {
              locations.push({
                file: filePath,
                line: index + 1
              });
            }
          });
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    return locations;
  }

  /**
   * 循環インポートを検出
   */
  async detectCircularImports(projectPath: string): Promise<string[][]> {
    const graph = await this.buildDependencyGraph(projectPath);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const dependencies = graph.get(node) || new Set<string>();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          detectCycle(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // 循環を検出
          const cycleStart = path.indexOf(dep);
          if (cycleStart !== -1) {
            const cycle = [...path.slice(cycleStart), dep];
            cycles.push(cycle);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node, []);
      }
    }

    return cycles;
  }

  /**
   * インポートの深さを分析
   */
  async analyzeImportDepth(projectPath: string): Promise<ImportDepthAnalysis> {
    const depths: number[] = [];
    const deepImports: Array<{ file: string; depth: number }> = [];
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    });

    for (const file of sourceFiles) {
      const depth = file.split('/').length;
      depths.push(depth);
      
      if (depth > 3) {
        deepImports.push({
          file: path.join(projectPath, file),
          depth
        });
      }
    }

    const maxDepth = Math.max(...depths, 0);
    const averageDepth = depths.length > 0 
      ? depths.reduce((a, b) => a + b, 0) / depths.length 
      : 0;

    return {
      maxDepth,
      averageDepth,
      deepImports: deepImports.slice(0, 10) // 最も深い10個のみ返す
    };
  }

  /**
   * 使用状況でパッケージを分類
   * Issue #102: package.jsonから宣言された依存関係を読み込み、未使用の依存関係を正しく検出
   */
  async categorizeUsage(projectPath: string): Promise<UsageCategory> {
    const frequency = await this.analyzeUsageFrequency(projectPath);
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    // package.jsonから宣言された依存関係を取得
    let allDependencies: string[] = [];
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        allDependencies = [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {})
        ];
      } catch (error) {
        // package.json読み込みエラーは無視（Defensive Programming）
      }
    }
    
    const core: string[] = [];
    const peripheral: string[] = [];
    const unused: string[] = [];
    const totalImports = Array.from(frequency.values()).reduce((a, b) => a + b, 0);

    // 宣言された依存関係を使用頻度で分類
    for (const pkg of allDependencies) {
      const usage = frequency.get(pkg) || 0;
      if (usage === 0) {
        unused.push(pkg);
      } else if (usage >= 5) {
        core.push(pkg);
      } else {
        peripheral.push(pkg);
      }
    }

    // 実際に使用されているがpackage.jsonにない依存関係も追加
    for (const [pkg, usage] of frequency) {
      if (!allDependencies.includes(pkg)) {
        if (usage >= 5) {
          core.push(pkg);
        } else {
          peripheral.push(pkg);
        }
      }
    }

    return { core, peripheral, unused };
  }

  /**
   * 使用状況レポートを生成
   */
  async generateUsageReport(projectPath: string): Promise<UsageReport> {
    const frequency = await this.analyzeUsageFrequency(projectPath);
    const categories = await this.categorizeUsage(projectPath);
    
    const totalPackages = categories.core.length + 
                         categories.peripheral.length + 
                         categories.unused.length;
    const usedPackages = categories.core.length + categories.peripheral.length;

    const recommendations: string[] = [];
    
    if (categories.unused.length > 0) {
      recommendations.push(`Remove ${categories.unused.length} unused dependencies to reduce bundle size`);
    }
    
    if (categories.peripheral.length > categories.core.length) {
      recommendations.push('Consider consolidating peripheral dependencies');
    }

    return {
      summary: {
        totalPackages,
        usedPackages,
        unusedPackages: categories.unused.length
      },
      frequency,
      categories,
      recommendations
    };
  }

  /**
   * 依存関係グラフを構築（内部使用）
   * @private
   */
  private async buildDependencyGraph(projectPath: string): Promise<Map<string, Set<string>>> {
    const graph = new Map<string, Set<string>>();
    
    // この実装では簡略化のため、パッケージレベルの依存関係のみを扱う
    // 実際のプロジェクトでは、ファイルレベルの依存関係も考慮する必要がある
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImports(content);
        const filePackages = new Set<string>();
        
        imports.forEach(imp => {
          const packageName = this.getExternalPackageName(imp);
          if (packageName) {
            filePackages.add(packageName);
          }
        });
        
        // 簡略化: ファイル名をノードとして使用
        const fileName = path.basename(file, path.extname(file));
        graph.set(fileName, filePackages);
      } catch (error) {
        // エラーは無視
      }
    }
    
    return graph;
  }

  /**
   * コードからimport/requireを抽出（重複を許可しない）
   * @private
   */
  private extractImports(content: string): Set<string> {
    const imports = new Set<string>();
    
    // ES6 imports
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    return imports;
  }

  /**
   * コードからimport/requireを抽出（重複を許可、頻度分析用）
   * @private
   */
  private extractImportsWithDuplicates(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * 一行からimportを抽出
   * @private
   */
  private extractImportsFromLine(line: string): Set<string> {
    const imports = new Set<string>();
    
    // ES6 imports
    const importMatch = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g.exec(line);
    if (importMatch) {
      imports.add(importMatch[1]);
    }
    
    // CommonJS requires
    const requireMatch = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g.exec(line);
    if (requireMatch) {
      imports.add(requireMatch[1]);
    }

    return imports;
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
   * 外部パッケージかどうかを判定（DRY原則適用）
   * Issue #101: 組み込みモジュール判定の統一
   * @private
   */
  private isExternalPackage(importPath: string): boolean {
    if (this.isRelativeImport(importPath)) {
      return false;
    }
    
    const packageName = this.getPackageName(importPath);
    return !this.BUILT_IN_MODULES.has(packageName);
  }

  /**
   * 外部パッケージのパッケージ名を取得（DRY原則適用）
   * @private
   */
  private getExternalPackageName(importPath: string): string | null {
    if (!this.isExternalPackage(importPath)) {
      return null;
    }
    return this.getPackageName(importPath);
  }

  /**
   * インポートパスからパッケージ名を取得
   * @private
   */
  private getPackageName(importPath: string): string {
    // Issue #101: node:プレフィックス除去
    const normalizedPath = importPath.startsWith('node:') 
      ? importPath.slice(5) 
      : importPath;

    // スコープ付きパッケージの場合
    if (normalizedPath.startsWith('@')) {
      const parts = normalizedPath.split('/');
      return parts.slice(0, 2).join('/');
    }
    
    // Issue #101: 組み込みモジュールのサブパス対応（fs/promises など）
    const baseName = normalizedPath.split('/')[0];
    return baseName;
  }
}