/**
 * ProjectDependencyAnalyzer
 * Issue #65: プロジェクトレベルの依存関係分析
 * 
 * SOLID原則: 単一責任（プロジェクト依存関係のみ）
 * DRY原則: 共通ロジックを基底クラスに抽出
 * KISS原則: シンプルな分析ロジック
 */

import { ProjectDependency } from '../types';
import { PackageJsonConfig } from '../../core/types';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../../utils/pathSecurity';

/**
 * プロジェクトレベルの依存関係を分析
 */
export class ProjectDependencyAnalyzer {
  /**
   * プロジェクトの依存関係を分析
   */
  async analyzeDependencies(projectPath: string): Promise<{
    dependencies: ProjectDependency[];
    devDependencies: ProjectDependency[];
    peerDependencies?: ProjectDependency[];
    optionalDependencies?: ProjectDependency[];
    vulnerabilities?: string[];
  }> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8')
    ) as PackageJsonConfig;

    const result = {
      dependencies: this.extractDependencies(packageJson.dependencies || {}),
      devDependencies: this.extractDependencies(packageJson.devDependencies || {}),
      peerDependencies: packageJson.peerDependencies 
        ? this.extractDependencies(packageJson.peerDependencies)
        : undefined,
      optionalDependencies: packageJson.optionalDependencies
        ? this.extractDependencies(packageJson.optionalDependencies)
        : undefined,
      vulnerabilities: await this.checkVulnerabilities(packageJson)
    };

    return result;
  }

  /**
   * インストール済みパッケージのリストを取得
   */
  async getInstalledPackages(projectPath: string): Promise<string[]> {
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      return [];
    }

    const items = fs.readdirSync(nodeModulesPath);
    const packages: string[] = [];

    for (const item of items) {
      if (item.startsWith('.')) continue;
      
      const itemPath = path.join(nodeModulesPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (item.startsWith('@')) {
          // Scoped packages
          const scopedItems = fs.readdirSync(itemPath);
          for (const scopedItem of scopedItems) {
            packages.push(`${item}/${scopedItem}`);
          }
        } else {
          packages.push(item);
        }
      }
    }

    return packages;
  }

  /**
   * 依存関係を抽出
   */
  private extractDependencies(deps: Record<string, string>): ProjectDependency[] {
    return Object.entries(deps).map(([name, version]) => ({
      name,
      version,
      type: this.getVersionConstraintType(version),
      location: 'package.json'
    }));
  }

  /**
   * バージョン制約のタイプを判定
   */
  private getVersionConstraintType(version: string): 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard' {
    if (version.startsWith('^')) return 'caret';
    if (version.startsWith('~')) return 'tilde';
    if (version === '*' || version === 'latest') return 'wildcard';
    if (version.includes('-') || version.includes('>') || version.includes('<')) return 'range';
    return 'exact';
  }

  /**
   * 脆弱性をチェック（簡易実装）
   */
  private async checkVulnerabilities(packageJson: PackageJsonConfig): Promise<string[]> {
    const vulnerabilities: string[] = [];
    
    // 実際の実装では、npm audit APIやnvdデータベースを使用
    // ここでは簡易的な例として特定のパッケージをチェック
    const knownVulnerablePackages = [
      'vulnerable-package',
      'old-lodash'
    ];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [name] of Object.entries(allDeps)) {
      if (knownVulnerablePackages.includes(name)) {
        vulnerabilities.push(`${name} has known vulnerabilities`);
      }
    }

    return vulnerabilities;
  }

  /**
   * パッケージマネージャーを検出
   */
  async detectPackageManager(projectPath: string): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
      return 'npm';
    }
    
    // デフォルト
    return 'npm';
  }
}