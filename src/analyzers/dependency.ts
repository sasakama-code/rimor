import { DependencyAnalysis, ProjectDependency, FileDependency, CyclicDependency, DependencyUsage } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';

/**
 * 依存関係分析器
 * プロジェクトの依存関係を分析し、循環依存、未使用・不足している依存関係を検出
 */
export class DependencyAnalyzer {
  private readonly SUPPORTED_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'];
  private readonly IGNORE_PATTERNS = [
    'node_modules',
    'dist',
    'build',
    '.git',
    '.vscode',
    '.idea',
    'coverage'
  ];

  /**
   * プロジェクトの依存関係を包括的に分析
   */
  async analyzeDependencies(projectPath: string): Promise<DependencyAnalysis> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    let packageJson: any = {};

    // package.jsonの読み込み
    try {
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
      }
    } catch (error) {
      // package.jsonが不正な場合は空のオブジェクトを使用
      packageJson = {};
    }

    // ロックファイルの情報を取得
    const lockFileInfo = await this.parseLockFiles(projectPath);

    // 依存関係情報を抽出
    const projectDependencies = await this.extractProjectDependencies(packageJson, lockFileInfo, projectPath);
    const fileDependencies = await this.analyzeFileDependencies(projectPath);

    // 循環依存の検出
    const cyclicDependencies = await this.detectCyclicDependencies(projectPath);

    // 未使用・不足依存関係の検出
    const unusedDependencies = await this.findUnusedDependencies(projectPath);
    const missingDependencies = await this.findMissingDependencies(projectPath);

    return {
      projectDependencies,
      fileDependencies,
      cyclicDependencies,
      unusedDependencies,
      missingDependencies,
      devDependencies: projectDependencies.filter(dep => dep.type === 'development'),
      peerDependencies: projectDependencies.filter(dep => dep.type === 'peer')
    };
  }

  /**
   * 循環依存を検出
   */
  async detectCyclicDependencies(projectPath: string): Promise<CyclicDependency[]> {
    const fileDependencies = await this.analyzeFileDependencies(projectPath);
    const cyclicDeps: CyclicDependency[] = [];

    // 依存関係グラフを構築
    const dependencyGraph = new Map<string, Set<string>>();
    
    fileDependencies.forEach(dep => {
      if (!dependencyGraph.has(dep.file)) {
        dependencyGraph.set(dep.file, new Set());
      }
      dep.dependsOn.forEach(dependency => {
        const dependencies = dependencyGraph.get(dep.file);
        if (dependencies) {
          dependencies.add(dependency);
        }
      });
    });

    // DFSで循環依存を検出
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycles = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // 循環を発見
        const cycleStart = path.indexOf(node);
        const cycleFiles = path.slice(cycleStart);
        
        cyclicDeps.push({
          files: [...cycleFiles, node],
          severity: 'warning',
          suggestion: 'Consider refactoring to break the circular dependency'
        });
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = dependencyGraph.get(node) || new Set();
      dependencies.forEach(dep => {
        detectCycles(dep, [...path, node]);
      });

      recursionStack.delete(node);
    };

    Array.from(dependencyGraph.keys()).forEach((file: string) => {
      if (!visited.has(file)) {
        detectCycles(file, []);
      }
    });

    return cyclicDeps;
  }

  /**
   * 未使用の依存関係を検出
   */
  async findUnusedDependencies(projectPath: string): Promise<string[]> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    let packageJson: any;
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch {
      return [];
    }

    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {},
      ...packageJson.optionalDependencies || {}
    };

    // ファイル内で実際に使用されている依存関係を調査
    const usedDependencies = await this.findUsedDependencies(projectPath);
    
    // 未使用の依存関係を特定
    const unusedDeps: string[] = [];
    
    Object.keys(allDependencies).forEach(dep => {
      if (!usedDependencies.has(dep)) {
        // 特殊ケース: 一部の依存関係は直接importされないが必要
        if (!this.isImplicitlyUsed(dep, packageJson)) {
          unusedDeps.push(dep);
        }
      }
    });

    return unusedDeps;
  }

  /**
   * 不足している依存関係を検出
   */
  async findMissingDependencies(projectPath: string): Promise<string[]> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let installedDependencies = new Set<string>();

    if (fs.existsSync(packageJsonPath)) {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        
        Object.keys(packageJson.dependencies || {}).forEach(dep => installedDependencies.add(dep));
        Object.keys(packageJson.devDependencies || {}).forEach(dep => installedDependencies.add(dep));
        Object.keys(packageJson.peerDependencies || {}).forEach(dep => installedDependencies.add(dep));
        Object.keys(packageJson.optionalDependencies || {}).forEach(dep => installedDependencies.add(dep));
      } catch {
        // パッケージファイルの読み込みに失敗した場合
      }
    }

    // 実際にimportされている依存関係を調査
    const usedDependencies = await this.findUsedDependencies(projectPath);
    
    const missingDeps: string[] = [];
    
    usedDependencies.forEach(dep => {
      if (!installedDependencies.has(dep) && !this.isBuiltIn(dep) && !this.isRelativeImport(dep)) {
        missingDeps.push(dep);
      }
    });

    return missingDeps;
  }

  /**
   * バージョン制約を分析
   */
  async analyzeVersionConstraints(projectPath: string): Promise<any[]> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    let packageJson: any;
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch {
      return [];
    }

    const lockFileInfo = await this.parseLockFiles(projectPath);
    const constraints: any[] = [];

    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    Object.entries(allDependencies).forEach(([name, declared]) => {
      const installed = lockFileInfo.get(name);
      
      constraints.push({
        name,
        declared: declared as string,
        installed: installed || 'not installed',
        satisfies: installed ? this.checkVersionSatisfies(declared as string, installed) : false
      });
    });

    return constraints;
  }

  /**
   * パッケージマネージャーを検出
   */
  async detectPackageManager(projectPath: string): Promise<string> {
    // yarn.lockがあればyarn
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    
    // pnpm-lock.yamlがあればpnpm
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    
    // package-lock.jsonがあればnpm
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
      return 'npm';
    }
    
    return 'unknown';
  }

  // Private helper methods

  private async extractProjectDependencies(
    packageJson: any, 
    lockFileInfo: Map<string, string>, 
    projectPath: string
  ): Promise<ProjectDependency[]> {
    const dependencies: ProjectDependency[] = [];
    const usageMap = await this.analyzeDependencyUsage(projectPath);

    // Production dependencies
    Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        type: 'production',
        installedVersion: lockFileInfo.get(name),
        usage: usageMap.get(name) || []
      });
    });

    // Development dependencies
    Object.entries(packageJson.devDependencies || {}).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        type: 'development',
        installedVersion: lockFileInfo.get(name),
        usage: usageMap.get(name) || []
      });
    });

    // Peer dependencies
    Object.entries(packageJson.peerDependencies || {}).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        type: 'peer',
        installedVersion: lockFileInfo.get(name),
        usage: usageMap.get(name) || []
      });
    });

    // Optional dependencies
    Object.entries(packageJson.optionalDependencies || {}).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        type: 'optional',
        installedVersion: lockFileInfo.get(name),
        usage: usageMap.get(name) || []
      });
    });

    return dependencies;
  }

  private async analyzeFileDependencies(projectPath: string): Promise<FileDependency[]> {
    const fileDependencies: FileDependency[] = [];
    const files = await this.findSourceFiles(projectPath);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const imports = this.extractImports(content);
        const exports = this.extractExports(content);
        
        // 相対パスのimportを解決
        const resolvedDependsOn = imports
          .filter(imp => this.isRelativeImport(imp))
          .map(imp => this.resolveRelativePath(file, imp, projectPath))
          .filter((resolved): resolved is string => resolved !== null);

        fileDependencies.push({
          file: path.relative(projectPath, file),
          imports,
          exports,
          dependsOn: resolvedDependsOn,
          dependedBy: [] // これは後で計算
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    // dependedByを計算
    fileDependencies.forEach(fileDep => {
      fileDep.dependsOn.forEach(dependency => {
        const dependedFile = fileDependencies.find(fd => 
          path.resolve(projectPath, fd.file) === path.resolve(projectPath, dependency)
        );
        if (dependedFile) {
          dependedFile.dependedBy.push(fileDep.file);
        }
      });
    });

    return fileDependencies;
  }

  private async parseLockFiles(projectPath: string): Promise<Map<string, string>> {
    const lockInfo = new Map<string, string>();

    // yarn.lockをパース
    const yarnLockPath = path.join(projectPath, 'yarn.lock');
    if (fs.existsSync(yarnLockPath)) {
      try {
        const content = fs.readFileSync(yarnLockPath, 'utf-8');
        const packages = this.parseYarnLock(content);
        packages.forEach((version, name) => {
          lockInfo.set(name, version);
        });
      } catch (error) {
        // yarn.lockの解析に失敗した場合は無視
      }
    }

    // package-lock.jsonをパース
    const packageLockPath = path.join(projectPath, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      try {
        const content = fs.readFileSync(packageLockPath, 'utf-8');
        const packageLock = JSON.parse(content);
        const packages = this.parsePackageLock(packageLock);
        packages.forEach((version, name) => {
          if (!lockInfo.has(name)) { // yarn.lockを優先
            lockInfo.set(name, version);
          }
        });
      } catch (error) {
        // package-lock.jsonの解析に失敗した場合は無視
      }
    }

    return lockInfo;
  }

  private parseYarnLock(content: string): Map<string, string> {
    const packages = new Map<string, string>();
    const lines = content.split('\n');
    let currentPackage: string | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // パッケージ名の行をチェック
      if (trimmed.includes('@') && trimmed.endsWith(':')) {
        const match = trimmed.match(/^([^@]+)@/);
        if (match) {
          currentPackage = match[1];
        }
      }
      
      // バージョン情報の行をチェック
      if (currentPackage && trimmed.startsWith('version ')) {
        const version = trimmed.replace('version ', '').replace(/"/g, '');
        packages.set(currentPackage, version);
        currentPackage = null;
      }
    }
    
    return packages;
  }

  private parsePackageLock(packageLock: any): Map<string, string> {
    const packages = new Map<string, string>();
    
    if (packageLock.packages) {
      Object.entries(packageLock.packages).forEach(([path, info]: [string, any]) => {
        if (path && path.startsWith('node_modules/')) {
          const name = path.replace('node_modules/', '');
          if (info.version) {
            packages.set(name, info.version);
          }
        }
      });
    }
    
    return packages;
  }

  private async findSourceFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.IGNORE_PATTERNS.some(pattern => entry.name.includes(pattern))) {
            walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    walkDir(projectPath);
    return files;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const patterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return [...new Set(imports)]; // 重複を除去
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const patterns = [
      /export\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /export\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
      /export\s*\*\s+from\s+['"]([^'"]+)['"]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1]);
      }
    });

    return [...new Set(exports)]; // 重複を除去
  }

  private async findUsedDependencies(projectPath: string): Promise<Set<string>> {
    const usedDeps = new Set<string>();
    const files = await this.findSourceFiles(projectPath);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const imports = this.extractImports(content);
        
        imports.forEach(imp => {
          if (!this.isRelativeImport(imp)) {
            // スコープパッケージの場合は適切に分割
            const packageName = imp.startsWith('@') 
              ? imp.split('/').slice(0, 2).join('/')
              : imp.split('/')[0];
            usedDeps.add(packageName);
          }
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return usedDeps;
  }

  private async analyzeDependencyUsage(projectPath: string): Promise<Map<string, DependencyUsage[]>> {
    const usageMap = new Map<string, DependencyUsage[]>();
    const files = await this.findSourceFiles(projectPath);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const imports = this.extractImports(line);
          imports.forEach(imp => {
            if (!this.isRelativeImport(imp)) {
              const packageName = imp.startsWith('@') 
                ? imp.split('/').slice(0, 2).join('/')
                : imp.split('/')[0];
              
              if (!usageMap.has(packageName)) {
                usageMap.set(packageName, []);
              }
              
              usageMap.get(packageName)!.push({
                file: path.relative(projectPath, file),
                imports: [imp],
                line: index + 1
              });
            }
          });
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return usageMap;
  }

  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  private isBuiltIn(moduleName: string): boolean {
    const builtInModules = [
      'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util',
      'stream', 'events', 'buffer', 'child_process', 'cluster',
      'dgram', 'dns', 'net', 'readline', 'repl', 'tls', 'tty',
      'v8', 'vm', 'worker_threads', 'zlib'
    ];
    return builtInModules.includes(moduleName);
  }

  private isImplicitlyUsed(packageName: string, packageJson: any): boolean {
    // TypeScriptの型定義パッケージ
    if (packageName.startsWith('@types/')) {
      return true;
    }
    
    // テストフレームワーク
    const testFrameworks = ['jest', 'mocha', 'jasmine', 'karma'];
    if (testFrameworks.includes(packageName)) {
      return true;
    }
    
    // ビルドツール
    const buildTools = ['webpack', 'rollup', 'parcel', 'vite', 'typescript'];
    if (buildTools.includes(packageName)) {
      return true;
    }
    
    return false;
  }

  private resolveRelativePath(fromFile: string, importPath: string, projectPath: string): string | null {
    try {
      const fromDir = path.dirname(fromFile);
      let resolvedPath = path.resolve(fromDir, importPath);
      
      // セキュリティ: パス検証
      if (!PathSecurity.validateProjectPath(resolvedPath, projectPath)) {
        return null;
      }
      
      // 拡張子がない場合は補完を試行
      if (!path.extname(resolvedPath)) {
        for (const ext of this.SUPPORTED_EXTENSIONS) {
          const withExt = resolvedPath + ext;
          if (!PathSecurity.validateProjectPath(withExt, projectPath)) {
            continue; // セキュリティチェック失敗
          }
          if (fs.existsSync(withExt)) {
            resolvedPath = withExt;
            break;
          }
        }
        
        // index.* ファイルも試行
        const indexPath = path.join(resolvedPath, 'index');
        for (const ext of this.SUPPORTED_EXTENSIONS) {
          const withExt = indexPath + ext;
          if (!PathSecurity.validateProjectPath(withExt, projectPath)) {
            continue; // セキュリティチェック失敗
          }
          if (fs.existsSync(withExt)) {
            resolvedPath = withExt;
            break;
          }
        }
      }
      
      if (fs.existsSync(resolvedPath)) {
        return path.relative(projectPath, resolvedPath);
      }
    } catch (error) {
      // パス解決エラーは無視
    }
    
    return null;
  }

  private checkVersionSatisfies(declared: string, installed: string): boolean {
    // 簡単なバージョンチェック（実際の実装ではsemverライブラリを使用するべき）
    const cleanDeclared = declared.replace(/[\^~]/, '');
    const cleanInstalled = installed;
    
    // 基本的なバージョン比較
    try {
      const declaredParts = cleanDeclared.split('.').map(Number);
      const installedParts = cleanInstalled.split('.').map(Number);
      
      // メジャーバージョンが一致しているかチェック
      return declaredParts[0] === installedParts[0];
    } catch {
      return false;
    }
  }
}