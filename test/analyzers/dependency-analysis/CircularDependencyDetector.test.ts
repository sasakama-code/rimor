/**
 * CircularDependencyDetector テスト
 * Issue #103: 循環検出ロジックの設計上の問題を修正
 * TDD RED段階: 実装前にテストケースを定義
 */

import { CircularDependencyDetector } from '../../../src/analyzers/dependency-analysis/circular-dependency-detector';
import * as path from 'path';
import {
  createTempProject,
  createTestFile,
  createTypeScriptProject,
  cleanupTempProject
} from '../../helpers/integration-test-utils';

describe('CircularDependencyDetector', () => {
  let detector: CircularDependencyDetector;
  let projectDir: string;

  beforeEach(() => {
    detector = new CircularDependencyDetector();
    projectDir = createTempProject('circular-deps-test-');
    createTypeScriptProject(projectDir);
  });

  afterEach(() => {
    cleanupTempProject(projectDir);
  });

  describe('detectCircularDependencies', () => {
    it('should return empty array when no circular dependencies exist', async () => {
      // 直線的な依存関係を作成
      createTestFile(projectDir, 'src/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/b.ts', `
        import { funcC } from './c';
        export function funcB() { return funcC(); }
      `);

      createTestFile(projectDir, 'src/c.ts', `
        export function funcC() { return 'c'; }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toEqual([]);
    });

    it('should detect simple circular dependencies between two files', async () => {
      // A -> B -> A の循環を作成
      createTestFile(projectDir, 'src/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/b.ts', `
        import { funcA } from './a';
        export function funcB() { return funcA(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('src/a.ts');
      expect(result[0]).toContain('src/b.ts');
    });

    it('should detect complex circular dependencies with multiple files', async () => {
      // A -> B -> C -> A の循環を作成
      createTestFile(projectDir, 'src/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/b.ts', `
        import { funcC } from './c';
        export function funcB() { return funcC(); }
      `);

      createTestFile(projectDir, 'src/c.ts', `
        import { funcA } from './a';
        export function funcC() { return funcA(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(4); // A -> B -> C -> A
      expect(result[0]).toContain('src/a.ts');
      expect(result[0]).toContain('src/b.ts');
      expect(result[0]).toContain('src/c.ts');
    });

    it('should handle same filename collision correctly (Issue #103)', async () => {
      // 同名ファイルを異なるディレクトリに作成
      createTestFile(projectDir, 'src/components/index.ts', `
        import { helper } from '../utils/index';
        export function componentIndex() { return helper(); }
      `);

      createTestFile(projectDir, 'src/utils/index.ts', `
        import { componentIndex } from '../components/index';
        export function helper() { return componentIndex(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('src/components/index.ts');
      expect(result[0]).toContain('src/utils/index.ts');
    });

    it('should only detect relative imports and ignore external packages (Issue #103)', async () => {
      createTestFile(projectDir, 'src/a.ts', `
        import express from 'express';  // 外部パッケージ
        import { funcB } from './b';     // 相対インポート
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/b.ts', `
        import lodash from 'lodash';     // 外部パッケージ
        import * as path from 'path';    // 組み込みモジュール
        export function funcB() { return 'b'; }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      // 循環依存はない（相対インポートのみを対象とするため）
      expect(result).toEqual([]);
    });

    it('should handle different import styles correctly', async () => {
      createTestFile(projectDir, 'src/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/b.ts', `
        const { funcA } = require('./a');
        export function funcB() { return funcA(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('src/a.ts');
      expect(result[0]).toContain('src/b.ts');
    });

    it('should resolve file extensions correctly', async () => {
      createTestFile(projectDir, 'src/module1.ts', `
        import { func2 } from './module2.js';  // .js拡張子でインポート
        export function func1() { return func2(); }
      `);

      createTestFile(projectDir, 'src/module2.ts', `
        import { func1 } from './module1';     // 拡張子なし
        export function func2() { return func1(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('src/module1.ts');
      expect(result[0]).toContain('src/module2.ts');
    });

    it('should handle index file imports correctly', async () => {
      createTestFile(projectDir, 'src/components/index.ts', `
        export { Button } from './button/index';
      `);

      createTestFile(projectDir, 'src/components/button/index.ts', `
        import { BaseComponent } from '../index';
        export class Button extends BaseComponent {}
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(1);
    });

    it('should ignore non-source files', async () => {
      // JSファイル以外を作成
      createTestFile(projectDir, 'src/data.json', '{"test": true}');
      createTestFile(projectDir, 'src/styles.css', '.test { color: red; }');
      createTestFile(projectDir, 'src/README.md', '# Test');

      // 正常なTSファイル
      createTestFile(projectDir, 'src/app.ts', `
        export function app() { return 'app'; }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toEqual([]);
    });

    it('should handle multiple independent circular dependencies', async () => {
      // 第一の循環: a -> b -> a
      createTestFile(projectDir, 'src/group1/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);

      createTestFile(projectDir, 'src/group1/b.ts', `
        import { funcA } from './a';
        export function funcB() { return funcA(); }
      `);

      // 第二の循環: x -> y -> x
      createTestFile(projectDir, 'src/group2/x.ts', `
        import { funcY } from './y';
        export function funcX() { return funcY(); }
      `);

      createTestFile(projectDir, 'src/group2/y.ts', `
        import { funcX } from './x';
        export function funcY() { return funcX(); }
      `);

      const result = await detector.detectCircularDependencies(projectDir);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('buildFileDependencyGraph', () => {
    it('should build correct file-to-file dependency graph', async () => {
      createTestFile(projectDir, 'src/a.ts', `
        import { funcB } from './b';
        import { funcC } from './c';
      `);

      createTestFile(projectDir, 'src/b.ts', `
        import { funcC } from './c';
      `);

      createTestFile(projectDir, 'src/c.ts', `
        export function funcC() { return 'c'; }
      `);

      // テスト用にprotectedメソッドを呼び出し
      const graph = await (detector as any).buildFileDependencyGraph(projectDir);
      
      expect(graph).toBeInstanceOf(Map);
      const aPath = path.normalize(path.join(projectDir, 'src/a.ts'));
      const bPath = path.normalize(path.join(projectDir, 'src/b.ts'));
      const cPath = path.normalize(path.join(projectDir, 'src/c.ts'));
      
      expect(graph.has(aPath)).toBe(true);
      expect(graph.has(bPath)).toBe(true);
      expect(graph.has(cPath)).toBe(true);
      
      const aDeps = graph.get(aPath);
      expect(aDeps).toContain(bPath);
      expect(aDeps).toContain(cPath);
    });

    it('should use full file paths as keys to avoid basename collision (Issue #103)', async () => {
      createTestFile(projectDir, 'src/components/index.ts', `
        export function componentIndex() { return 'component'; }
      `);

      createTestFile(projectDir, 'src/utils/index.ts', `
        export function utilIndex() { return 'util'; }
      `);

      const graph = await (detector as any).buildFileDependencyGraph(projectDir);
      
      const componentIndexPath = path.normalize(path.join(projectDir, 'src/components/index.ts'));
      const utilIndexPath = path.normalize(path.join(projectDir, 'src/utils/index.ts'));
      
      expect(graph.has(componentIndexPath)).toBe(true);
      expect(graph.has(utilIndexPath)).toBe(true);
      expect(componentIndexPath).not.toEqual(utilIndexPath);
    });
  });
});