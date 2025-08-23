/**
 * ASTMerger Tests
 * v0.9.0 Phase 2 - ASTマージャーのテストスイート
 * 
 * TDD: RED phase - 失敗するテストから開始
 * t_wadaの推奨: テストファーストで品質を保証
 */

import { ASTMerger, MergeStrategy, MergeResult } from '../../src/intent-analysis/ASTMerger';
import { ASTNode } from '../../src/core/interfaces/IAnalysisEngine';

describe('ASTMerger', () => {
  let merger: ASTMerger;

  beforeEach(() => {
    merger = new ASTMerger({
      validateStructure: true,
      preservePositions: true
    });
  });

  describe('基本的なマージ', () => {
    it('単一のASTはそのまま返す', () => {
      // Arrange
      const singleAST: ASTNode = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        isNamed: true,
        children: [
          {
            type: 'variable_declaration',
            text: 'const x = 1;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 12 },
            isNamed: true
          }
        ]
      };

      // Act
      const result = merger.merge([singleAST]);

      // Assert
      expect(result.ast).toEqual(singleAST);
      expect(result.metadata.strategy).toBe(MergeStrategy.SINGLE);
      expect(result.metadata.nodeCount).toBe(2);
    });

    it('複数のASTを順次マージ', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        isNamed: true,
        children: [
          {
            type: 'variable_declaration',
            text: 'const x = 1;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 12 },
            isNamed: true
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: 'const y = 2;',
        startPosition: { row: 1, column: 0 },
        endPosition: { row: 1, column: 12 },
        isNamed: true,
        children: [
          {
            type: 'variable_declaration',
            text: 'const y = 2;',
            startPosition: { row: 1, column: 0 },
            endPosition: { row: 1, column: 12 },
            isNamed: true
          }
        ]
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.ast.type).toBe('program');
      expect(result.ast.children).toHaveLength(2);
      expect(result.metadata.strategy).toBe(MergeStrategy.SEQUENTIAL);
      expect(result.metadata.mergedChunks).toBe(2);
    });

    it('空のASTリストでエラー', () => {
      // Act & Assert
      expect(() => merger.merge([])).toThrow('Cannot merge empty AST list');
    });
  });

  describe('位置情報の調整', () => {
    it('連続するASTの位置を正しく調整', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: 'function a() {}',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 15 },
        isNamed: true,
        children: [
          {
            type: 'function_declaration',
            text: 'function a() {}',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 15 },
            isNamed: true
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: 'function b() {}',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 15 },
        isNamed: true,
        children: [
          {
            type: 'function_declaration',
            text: 'function b() {}',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 15 },
            isNamed: true
          }
        ]
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      const secondFunction = result.ast.children![1];
      expect(secondFunction.startPosition.row).toBe(1);
      expect(result.metadata.positionsAdjusted).toBe(true);
    });

    it('オーバーラップする位置を検出', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 2, column: 10 },
        isNamed: true,
        children: []
      };

      const ast2: ASTNode = {
        type: 'program',
        text: 'const y = 2;',
        startPosition: { row: 1, column: 0 },
        endPosition: { row: 3, column: 10 },
        isNamed: true,
        children: []
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.metadata.hasOverlap).toBe(true);
      expect(result.metadata.warnings).toContain('Position overlap detected');
    });
  });

  describe('構造検証', () => {
    it('不整合な構造を検出', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 1, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'function_declaration',
            text: 'function incomplete() {',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 23 },
            isNamed: true
            // 閉じ括弧なし
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 1, column: 0 },
        endPosition: { row: 2, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'block_statement',
            text: '}',
            startPosition: { row: 1, column: 0 },
            endPosition: { row: 1, column: 1 },
            isNamed: true
          }
        ]
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.metadata.structureValid).toBe(false);
      expect(result.metadata.errors).toContainEqual(
        expect.objectContaining({
          type: 'structure',
          message: expect.stringContaining('Incomplete structure')
        })
      );
    });

    it('完全な構造のマージ', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: 'class A { method1() {} }',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 24 },
        isNamed: true,
        children: [
          {
            type: 'class_declaration',
            text: 'class A { method1() {} }',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 24 },
            isNamed: true,
            children: []
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: 'class B { method2() {} }',
        startPosition: { row: 1, column: 0 },
        endPosition: { row: 1, column: 24 },
        isNamed: true,
        children: [
          {
            type: 'class_declaration',
            text: 'class B { method2() {} }',
            startPosition: { row: 1, column: 0 },
            endPosition: { row: 1, column: 24 },
            isNamed: true,
            children: []
          }
        ]
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.metadata.structureValid).toBe(true);
      expect(result.metadata.errors).toHaveLength(0);
    });
  });

  describe('マージ戦略', () => {
    it('階層的マージ戦略', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 10, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'module',
            text: 'module A',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 5, column: 0 },
            isNamed: true,
            children: []
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 10, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'module',
            text: 'module B',
            startPosition: { row: 5, column: 0 },
            endPosition: { row: 10, column: 0 },
            isNamed: true,
            children: []
          }
        ]
      };

      // Act
      const merger = new ASTMerger({ mergeStrategy: MergeStrategy.HIERARCHICAL });
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.metadata.strategy).toBe(MergeStrategy.HIERARCHICAL);
      expect(result.ast.children).toHaveLength(2);
    });

    it('インテリジェントマージ戦略', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 2, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'import_statement',
            text: 'import { a } from "module"',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 26 },
            isNamed: true
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 2, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'import_statement',
            text: 'import { a } from "module"',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 26 },
            isNamed: true
          }
        ]
      };

      // Act
      const merger = new ASTMerger({ mergeStrategy: MergeStrategy.INTELLIGENT });
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.metadata.strategy).toBe(MergeStrategy.INTELLIGENT);
      expect(result.metadata.duplicatesRemoved).toBe(1);
      expect(result.ast.children).toHaveLength(1); // 重複を削除
    });
  });

  describe('パフォーマンス', () => {
    it('大量のASTノードを効率的にマージ', () => {
      // Arrange
      const createLargeAST = (offset: number): ASTNode => ({
        type: 'program',
        text: '',
        startPosition: { row: offset * 100, column: 0 },
        endPosition: { row: (offset + 1) * 100, column: 0 },
        isNamed: true,
        children: Array.from({ length: 100 }, (_, i) => ({
          type: 'variable_declaration',
          text: `const var${offset}_${i} = ${i};`,
          startPosition: { row: offset * 100 + i, column: 0 },
          endPosition: { row: offset * 100 + i, column: 20 },
          isNamed: true
        }))
      });

      const asts = Array.from({ length: 10 }, (_, i) => createLargeAST(i));

      // Act
      const startTime = Date.now();
      const result = merger.merge(asts);
      const mergeTime = Date.now() - startTime;

      // Assert
      expect(result.ast.children).toHaveLength(1000);
      expect(mergeTime).toBeLessThan(100); // 100ms以内
      expect(result.metadata.nodeCount).toBe(1001); // program + 1000 children
      expect(result.metadata.mergeTime).toBeDefined();
    });
  });

  describe('エラーリカバリ', () => {
    it('部分的に破損したASTのマージ', () => {
      // Arrange
      const ast1: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 1, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'ERROR',
            text: 'invalid syntax',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 14 },
            isNamed: false
          }
        ]
      };

      const ast2: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 1, column: 0 },
        endPosition: { row: 2, column: 0 },
        isNamed: true,
        children: [
          {
            type: 'function_declaration',
            text: 'function valid() {}',
            startPosition: { row: 1, column: 0 },
            endPosition: { row: 1, column: 19 },
            isNamed: true
          }
        ]
      };

      // Act
      const result = merger.merge([ast1, ast2]);

      // Assert
      expect(result.ast.children).toHaveLength(2);
      expect(result.metadata.hasErrors).toBe(true);
      expect(result.metadata.errorNodes).toBe(1);
      expect(result.metadata.recoverable).toBe(true);
    });

    it('nullまたはundefinedの子ノードを処理', () => {
      // Arrange
      const ast: ASTNode = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 1, column: 0 },
        isNamed: true,
        children: undefined
      };

      // Act
      const result = merger.merge([ast]);

      // Assert
      expect(result.ast.children).toEqual([]);
      expect(result.metadata.warnings).toContain('Empty children array normalized');
    });
  });
});