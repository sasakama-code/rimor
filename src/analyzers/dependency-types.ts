/**
 * 依存関係分析用の型定義
 * any型除去のための型定義
 */

import { PackageJsonConfig } from '../core/types';

/**
 * バージョン制約
 */
export interface VersionConstraint {
  package: string;
  declaredVersion: string;
  installedVersion?: string;
  constraint: 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard';
  hasVulnerability?: boolean;
  suggestion?: string;
}

/**
 * パッケージロックファイルの依存関係
 */
export interface PackageLockDependency {
  version: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  requires?: Record<string, string>;
  dependencies?: Record<string, PackageLockDependency>;
}

/**
 * パッケージロックファイル
 */
export interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  requires?: boolean;
  packages?: Record<string, PackageLockDependency>;
  dependencies?: Record<string, PackageLockDependency>;
}

/**
 * Yarn.lockファイルのエントリ
 */
export interface YarnLockEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: Record<string, string>;
}

/**
 * npm-shrinkwrap.jsonファイル
 */
export interface NpmShrinkwrap extends PackageLockJson {
  // npm-shrinkwrapはpackage-lock.jsonと同じ構造
}

/**
 * 拡張されたPackageJson型（型安全性向上）
 */
export interface ExtendedPackageJson extends PackageJsonConfig {
  // 追加フィールドがある場合はここに定義
}

/**
 * 依存関係のバージョン情報
 */
export interface DependencyVersion {
  current: string;
  wanted?: string;
  latest?: string;
  location?: string;
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
}

/**
 * 依存関係の使用状況
 */
export interface DependencyUsageInfo {
  package: string;
  usedIn: string[];
  importCount: number;
  isDev: boolean;
  isOptional: boolean;
}