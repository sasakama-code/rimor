/**
 * パッケージ分析クラス
 * package.json、lockファイル、依存関係の管理を担当
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import {
  ExtendedPackageJson,
  VersionConstraint,
  PackageLockJson,
  PackageLockDependency,
  YarnLockEntry
} from '../dependency-types';
import { PackageJsonConfig } from '../../core/types';

export interface PackageAnalysisResult {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDependencies: string[];
}

export interface VersionConstraintResult {
  package: string;
  constraint: string;
  type: 'exact' | 'caret' | 'tilde' | 'range' | 'any';
  isRisky: boolean;
}

export class PackageAnalyzer {
  private readonly BUILT_IN_MODULES = new Set([
    'fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream',
    'url', 'querystring', 'child_process', 'cluster', 'events',
    'buffer', 'process', 'console', 'module', 'require', 'assert',
    'net', 'tls', 'dns', 'readline', 'repl', 'vm', 'zlib'
  ]);

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
    
    // デフォルトはnpm
    return 'npm';
  }

  /**
   * package.jsonを解析
   */
  async analyzePackageJson(projectPath: string): Promise<PackageAnalysisResult> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: undefined,
        version: undefined,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      };
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content) as ExtendedPackageJson;
      
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      const peerDependencies = packageJson.peerDependencies || {};
      
      const allDependencies = [
        ...Object.keys(dependencies),
        ...Object.keys(devDependencies),
        ...Object.keys(peerDependencies)
      ];

      return {
        name: packageJson.name,
        version: packageJson.version,
        dependencies,
        devDependencies,
        peerDependencies,
        allDependencies
      };
    } catch (error) {
      // パースエラーの場合は空のオブジェクトを返す
      return {
        name: undefined,
        version: undefined,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        allDependencies: []
      };
    }
  }

  /**
   * 未使用の依存関係を検出
   */
  async findUnusedDependencies(projectPath: string): Promise<string[]> {
    const packageAnalysis = await this.analyzePackageJson(projectPath);
    const allDeps = packageAnalysis.allDependencies;
    
    if (allDeps.length === 0) {
      return [];
    }

    const usedPackages = await this.findUsedPackages(projectPath);
    const unusedDeps = allDeps.filter(dep => !usedPackages.has(dep));
    
    return unusedDeps;
  }

  /**
   * 不足している依存関係を検出
   */
  async findMissingDependencies(projectPath: string): Promise<string[]> {
    const packageAnalysis = await this.analyzePackageJson(projectPath);
    const installedDeps = new Set(packageAnalysis.allDependencies);
    
    const usedPackages = await this.findUsedPackages(projectPath);
    const missingDeps: string[] = [];
    
    usedPackages.forEach(pkg => {
      if (!installedDeps.has(pkg) && !this.BUILT_IN_MODULES.has(pkg)) {
        missingDeps.push(pkg);
      }
    });
    
    return missingDeps;
  }

  /**
   * バージョン制約を分析
   */
  async analyzeVersionConstraints(projectPath: string): Promise<VersionConstraintResult[]> {
    const packageAnalysis = await this.analyzePackageJson(projectPath);
    const results: VersionConstraintResult[] = [];
    
    const allDeps = {
      ...packageAnalysis.dependencies,
      ...packageAnalysis.devDependencies,
      ...packageAnalysis.peerDependencies
    };

    for (const [pkg, version] of Object.entries(allDeps)) {
      const result = this.analyzeVersionString(pkg, version);
      results.push(result);
    }

    return results;
  }

  /**
   * lockファイルを解析
   */
  async parseLockFiles(projectPath: string): Promise<Map<string, string>> {
    const lockInfo = new Map<string, string>();

    // yarn.lockをパース
    const yarnLockPath = path.join(projectPath, 'yarn.lock');
    if (fs.existsSync(yarnLockPath)) {
      try {
        const content = fs.readFileSync(yarnLockPath, 'utf-8');
        const parsed = this.parseYarnLock(content);
        parsed.forEach((version, name) => {
          lockInfo.set(name, version);
        });
      } catch (error) {
        // yarn.lockの解析に失敗した場合は無視
      }
    }

    // package-lock.jsonをパース（yarn.lockがない場合）
    if (lockInfo.size === 0) {
      const packageLockPath = path.join(projectPath, 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        try {
          const content = fs.readFileSync(packageLockPath, 'utf-8');
          const packageLock = JSON.parse(content) as PackageLockJson;
          const packages = this.parsePackageLock(packageLock);
          packages.forEach((version, name) => {
            lockInfo.set(name, version);
          });
        } catch (error) {
          // package-lock.jsonの解析に失敗した場合は無視
        }
      }
    }

    return lockInfo;
  }

  /**
   * プロジェクト内で使用されているパッケージを検出
   * @private
   */
  private async findUsedPackages(projectPath: string): Promise<Set<string>> {
    const usedPackages = new Set<string>();
    const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImports(content);
        imports.forEach(imp => {
          if (!this.isRelativeImport(imp) && !this.BUILT_IN_MODULES.has(imp)) {
            usedPackages.add(this.getPackageName(imp));
          }
        });
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }

    return usedPackages;
  }

  /**
   * コードからimport/requireを抽出
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
   * 相対インポートかどうかを判定
   * @private
   */
  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || 
           importPath.startsWith('../') || 
           importPath.startsWith('/');
  }

  /**
   * インポートパスからパッケージ名を取得
   * @private
   */
  private getPackageName(importPath: string): string {
    // スコープ付きパッケージの場合
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return parts.slice(0, 2).join('/');
    }
    // 通常のパッケージ
    return importPath.split('/')[0];
  }

  /**
   * バージョン文字列を分析
   * @private
   */
  private analyzeVersionString(pkg: string, version: string): VersionConstraintResult {
    let type: 'exact' | 'caret' | 'tilde' | 'range' | 'any';
    let isRisky = false;

    if (version === '*' || version === 'latest') {
      type = 'any';
      isRisky = true;
    } else if (version.startsWith('^')) {
      type = 'caret';
      isRisky = false;
    } else if (version.startsWith('~')) {
      type = 'tilde';
      isRisky = false;
    } else if (version.includes('>') || version.includes('<') || version.includes('||')) {
      type = 'range';
      isRisky = true;
    } else {
      type = 'exact';
      isRisky = false;
    }

    return {
      package: pkg,
      constraint: version,
      type,
      isRisky
    };
  }

  /**
   * yarn.lockをパース
   * @private
   */
  private parseYarnLock(content: string): Map<string, string> {
    const packages = new Map<string, string>();
    const lines = content.split('\n');
    let currentPackage = '';
    
    for (const line of lines) {
      // パッケージ名の行
      if (line && !line.startsWith(' ') && line.includes('@')) {
        currentPackage = line.split('@')[0].trim().replace(/"/g, '');
      }
      // バージョンの行
      else if (line.trim().startsWith('version ')) {
        const version = line.trim().replace('version ', '').replace(/"/g, '');
        if (currentPackage) {
          packages.set(currentPackage, version);
          currentPackage = '';
        }
      }
    }
    
    return packages;
  }

  /**
   * package-lock.jsonをパース
   * @private
   */
  private parsePackageLock(packageLock: PackageLockJson): Map<string, string> {
    const packages = new Map<string, string>();
    
    if (packageLock.packages) {
      Object.entries(packageLock.packages).forEach(([pkgPath, info]) => {
        if (pkgPath && pkgPath.startsWith('node_modules/')) {
          const name = pkgPath.replace('node_modules/', '');
          const packageInfo = info as PackageLockDependency;
          if (packageInfo?.version) {
            packages.set(name, packageInfo.version);
          }
        }
      });
    }
    
    // 旧形式のpackage-lock.json
    if (packageLock.dependencies) {
      Object.entries(packageLock.dependencies).forEach(([name, info]) => {
        if (info?.version) {
          packages.set(name, info.version);
        }
      });
    }
    
    return packages;
  }
}