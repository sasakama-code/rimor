/**
 * FileDependencyAnalyzer テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト
 */

import { FileDependencyAnalyzer } from '../../../src/analyzers/dependency-analysis/file-deps';
import { FileDependency } from '../../../src/analyzers/types';
import * as fs from 'fs';

jest.mock('fs');

describe('FileDependencyAnalyzer', () => {
  let analyzer: FileDependencyAnalyzer;

  beforeEach(() => {
    analyzer = new FileDependencyAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzeFileDependencies', () => {
    it('TypeScriptファイルのimport文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/index.ts';
      const mockContent = `
        import express from 'express';
        import { Request, Response } from 'express';
        import * as path from 'path';
        import './utils/helper';
        import Component from '../components/Component';
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.imports).toHaveLength(4); // expressが重複除去されるため4つ
      expect(result.imports).toContain('express');
      expect(result.imports).toContain('path');
      expect(result.imports).toContain('./utils/helper');
      expect(result.imports).toContain('../components/Component');
    });

    it('JavaScriptのrequire文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/index.js';
      const mockContent = `
        const express = require('express');
        const { readFile } = require('fs');
        const utils = require('./utils');
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.imports).toHaveLength(3);
      expect(result.imports).toContain('express');
      expect(result.imports).toContain('fs');
      expect(result.imports).toContain('./utils');
    });

    it('export文を正しく解析する', async () => {
      // Arrange
      const mockFilePath = '/test/src/module.ts';
      const mockContent = `
        export const myFunction = () => {};
        export default class MyClass {}
        export { something } from './other';
      `;
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Act
      const result = await analyzer.analyzeFileDependencies(mockFilePath);

      // Assert
      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(3);
      expect(result.exports).toContain('myFunction');
      expect(result.exports).toContain('default');
      expect(result.exports).toContain('something');
    });

    it('ファイルが存在しない場合はエラーをスロー', async () => {
      // Arrange
      const mockFilePath = '/test/nonexistent.ts';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(analyzer.analyzeFileDependencies(mockFilePath))
        .rejects.toThrow('File not found');
    });
  });

  describe('getImportType', () => {
    it('相対インポートを正しく判定する', () => {
      expect(analyzer.getImportType('./utils')).toBe('relative');
      expect(analyzer.getImportType('../components/Button')).toBe('relative');
    });

    it('絶対インポートを正しく判定する', () => {
      expect(analyzer.getImportType('express')).toBe('external');
      expect(analyzer.getImportType('@company/package')).toBe('external');
    });

    it('ビルトインモジュールを正しく判定する', () => {
      expect(analyzer.getImportType('fs')).toBe('builtin');
      expect(analyzer.getImportType('path')).toBe('builtin');
      expect(analyzer.getImportType('crypto')).toBe('builtin');
    });
  });

  describe('buildDependencyGraph - Issue #116 問題再現テスト', () => {
    it('[TDD RED] 相対キーと絶対解決の不一致により依存関係リンクが失敗する', async () => {
      // Arrange: 実際のプロジェクト構造を模擬
      const projectPath = '/test/project';
      const files = ['src/index.ts', 'src/utils/helper.ts'];
      
      // src/index.ts の内容（src/utils/helperを相対インポート）
      const indexContent = `import { helper } from './utils/helper';`;
      
      // src/utils/helper.ts の内容
      const helperContent = `export const helper = () => {};`;
      
      // ファイルシステムをモック
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path === '/test/project/src/index.ts' || path === '/test/project/src/utils/helper.ts';
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/test/project/src/index.ts') return indexContent;
        if (path === '/test/project/src/utils/helper.ts') return helperContent;
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: 現在の実装では以下が失敗する（Issue #116の問題）
      const indexDeps = graph.get('src/index.ts');
      expect(indexDeps).toBeDefined();
      expect(indexDeps?.dependsOn).toContain('./utils/helper');

      // この部分で問題が発生：resolveImportPathが絶対パスを返すが、
      // graphのキーは相対パスなので一致しない
      const helperDeps = graph.get('src/utils/helper.ts');
      expect(helperDeps).toBeDefined();
      expect(helperDeps?.dependedBy).toContain('src/index.ts'); // これが失敗する
    });

    it('[TDD RED] 拡張子なしインポートの解決失敗により依存関係が構築されない', async () => {
      // Arrange
      const projectPath = '/test/project';
      const files = ['src/app.ts', 'src/service.ts'];
      
      // 拡張子なしでインポート
      const appContent = `import { Service } from './service';`;
      const serviceContent = `export class Service {}`;
      
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // service.ts は存在するが、./service（拡張子なし）では見つからない問題を再現
        return path === '/test/project/src/app.ts' || path === '/test/project/src/service.ts';
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/test/project/src/app.ts') return appContent;
        if (path === '/test/project/src/service.ts') return serviceContent;
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: 拡張子判定の問題で依存関係が正しく構築されない
      const appDeps = graph.get('src/app.ts');
      const serviceDeps = graph.get('src/service.ts');
      
      expect(appDeps).toBeDefined();
      expect(serviceDeps).toBeDefined();
      expect(serviceDeps?.dependedBy).toContain('src/app.ts'); // これが失敗する可能性がある
    });

    it('[TDD RED] projectPath基準とCWD基準の不整合によりファイル探索が失敗する', async () => {
      // Arrange: CWDとprojectPathが異なるケース
      const projectPath = '/different/project/path';
      const files = ['src/main.ts', 'src/lib/utils.ts'];
      
      const mainContent = `import { utils } from './lib/utils';`;
      const utilsContent = `export const utils = {};`;
      
      // より詳細なモック設定でパス解決をサポート
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        // すべての必要なパスで true を返す
        const validPaths = [
          '/different/project/path/src/main.ts',
          '/different/project/path/src/lib/utils.ts',
          '/different/project/path/src/lib/utils' // 拡張子なし
        ];
        return validPaths.includes(path) || path.startsWith('/different/project/path/');
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/different/project/path/src/main.ts') return mainContent;
        if (path === '/different/project/path/src/lib/utils.ts') return utilsContent;
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: 修正後は依存関係が正しく構築される
      const mainDeps = graph.get('src/main.ts');
      const utilsDeps = graph.get('src/lib/utils.ts');
      
      expect(mainDeps).toBeDefined();
      expect(utilsDeps).toBeDefined();
      expect(utilsDeps?.dependedBy).toContain('src/main.ts'); // 修正後は成功するはず
    });
  });

  describe('Issue #117: 相対インポート解決のCWD依存問題修正', () => {
    it('[TDD RED] index.*ファイルの自動解決が動作する', async () => {
      // Arrange: ./components → ./components/index.ts の解決をテスト
      const projectPath = '/test/project';
      const files = ['src/app.ts', 'src/components/index.ts'];
      
      const appContent = `import { Button } from './components';`;
      const indexContent = `export const Button = {};`;
      
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        const validPaths = [
          '/test/project/src/app.ts',
          '/test/project/src/components/index.ts'
        ];
        return validPaths.includes(path);
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/test/project/src/app.ts') return appContent;
        if (path === '/test/project/src/components/index.ts') return indexContent;
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: index.ts ファイルへの依存関係が正しく構築される
      const appDeps = graph.get('src/app.ts');
      const componentsDeps = graph.get('src/components/index.ts');
      
      expect(appDeps).toBeDefined();
      expect(componentsDeps).toBeDefined();
      expect(componentsDeps?.dependedBy).toContain('src/app.ts');
    });

    it('[TDD RED] CWD非依存の絶対パス解決が動作する', async () => {
      // Arrange: 異なるCWDでも一貫した解決をテスト
      const projectPath = '/different/workspace/project';
      const files = ['lib/main.ts', 'lib/utils/helper.ts'];
      
      const mainContent = `import { helper } from './utils/helper';`;
      const helperContent = `export const helper = {};`;
      
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        const validPaths = [
          '/different/workspace/project/lib/main.ts',
          '/different/workspace/project/lib/utils/helper.ts'
        ];
        return validPaths.includes(path);
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/different/workspace/project/lib/main.ts') return mainContent;
        if (path === '/different/workspace/project/lib/utils/helper.ts') return helperContent;
        throw new Error('File not found');
      });

      // Act: 絶対パス解決がCWDに依存しないことを確認
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert
      const mainDeps = graph.get('lib/main.ts');
      const helperDeps = graph.get('lib/utils/helper.ts');
      
      expect(mainDeps).toBeDefined();
      expect(helperDeps).toBeDefined();
      expect(helperDeps?.dependedBy).toContain('lib/main.ts');
    });

    it('[TDD RED] 拡張子とindex.*ファイルの優先順位が正しく動作する', async () => {
      // Arrange: 拡張子付きファイルが存在する場合の優先度をテスト
      const projectPath = '/test/project';
      const files = ['src/main.ts', 'src/module.ts', 'src/module/index.ts'];
      
      const mainContent = `
        import { directModule } from './module';
        import { indexModule } from './module';
      `;
      
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        const validPaths = [
          '/test/project/src/main.ts',
          '/test/project/src/module.ts',
          '/test/project/src/module/index.ts'
        ];
        return validPaths.includes(path);
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/test/project/src/main.ts') return mainContent;
        if (path === '/test/project/src/module.ts') return 'export const directModule = {};';
        if (path === '/test/project/src/module/index.ts') return 'export const indexModule = {};';
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: 拡張子付きファイルが優先され、適切に解決される
      const mainDeps = graph.get('src/main.ts');
      const moduleDeps = graph.get('src/module.ts');
      
      expect(mainDeps).toBeDefined();
      expect(moduleDeps).toBeDefined();
      expect(moduleDeps?.dependedBy).toContain('src/main.ts');
    });

    it('[TDD RED] モノレポ環境での深いパス構造でも正確に解決する', async () => {
      // Arrange: モノレポの深い階層構造をテスト
      const projectPath = '/monorepo/packages/app';
      const files = ['src/components/Button.tsx', 'src/utils/index.ts', 'src/hooks/useButton.ts'];
      
      const buttonContent = `
        import { logger } from '../utils';
        import { useButton } from '../hooks/useButton';
      `;
      const utilsIndexContent = `export const logger = {};`;
      const hookContent = `export const useButton = {};`;
      
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        const validPaths = [
          '/monorepo/packages/app/src/components/Button.tsx',
          '/monorepo/packages/app/src/utils/index.ts',
          '/monorepo/packages/app/src/hooks/useButton.ts'
        ];
        return validPaths.includes(path);
      });
      
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '/monorepo/packages/app/src/components/Button.tsx') return buttonContent;
        if (path === '/monorepo/packages/app/src/utils/index.ts') return utilsIndexContent;
        if (path === '/monorepo/packages/app/src/hooks/useButton.ts') return hookContent;
        throw new Error('File not found');
      });

      // Act
      const graph = await analyzer.buildDependencyGraph(projectPath, files);

      // Assert: 深い階層でも正確に依存関係が構築される
      const buttonDeps = graph.get('src/components/Button.tsx');
      const utilsDeps = graph.get('src/utils/index.ts');
      const hookDeps = graph.get('src/hooks/useButton.ts');
      
      expect(buttonDeps).toBeDefined();
      expect(utilsDeps).toBeDefined();
      expect(hookDeps).toBeDefined();
      expect(utilsDeps?.dependedBy).toContain('src/components/Button.tsx');
      expect(hookDeps?.dependedBy).toContain('src/components/Button.tsx');
    });
  });
});