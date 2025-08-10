/**
 * ProjectDependencyAnalyzer テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト
 */

import { ProjectDependencyAnalyzer } from '../../../src/analyzers/dependency-analysis/project-deps';
import { ProjectDependency } from '../../../src/analyzers/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('ProjectDependencyAnalyzer', () => {
  let analyzer: ProjectDependencyAnalyzer;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    analyzer = new ProjectDependencyAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzeDependencies', () => {
    it('プロジェクトの依存関係を正しく分析する', async () => {
      // Arrange
      const mockPackageJson = {
        dependencies: {
          'express': '^4.18.0',
          'lodash': '~4.17.21'
        },
        devDependencies: {
          'jest': '^29.0.0',
          'typescript': '^5.0.0'
        }
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPackageJson));

      // Act
      const result = await analyzer.analyzeDependencies(mockProjectPath);

      // Assert
      expect(result).toBeDefined();
      expect(result.dependencies).toHaveLength(2);
      expect(result.devDependencies).toHaveLength(2);
      expect(result.dependencies[0].name).toBe('express');
      expect(result.dependencies[0].version).toBe('^4.18.0');
    });

    it('package.jsonが存在しない場合はエラーをスロー', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(analyzer.analyzeDependencies(mockProjectPath))
        .rejects.toThrow('package.json not found');
    });

    it('脆弱性のある依存関係を検出する', async () => {
      // Arrange
      const mockPackageJson = {
        dependencies: {
          'vulnerable-package': '1.0.0'
        }
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPackageJson));

      // Act
      const result = await analyzer.analyzeDependencies(mockProjectPath);

      // Assert
      expect(result.vulnerabilities).toBeDefined();
      // 実際の脆弱性チェックロジックはモック化
    });
  });

  describe('getInstalledPackages', () => {
    it('インストール済みパッケージのリストを取得する', async () => {
      // Arrange
      const mockNodeModules = ['express', 'lodash', 'jest'];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockNodeModules);

      // Act
      const packages = await analyzer.getInstalledPackages(mockProjectPath);

      // Assert
      expect(packages).toEqual(mockNodeModules);
    });

    it('node_modulesが存在しない場合は空配列を返す', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      const packages = await analyzer.getInstalledPackages(mockProjectPath);

      // Assert
      expect(packages).toEqual([]);
    });
  });
});