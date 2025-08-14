/**
 * CircularDependencyDetector テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト
 */

import { CircularDependencyDetector } from '../../../src/analyzers/dependency-analysis/circular-detector';
import { CyclicDependency, FileDependency } from '../../../src/analyzers/types';

describe('CircularDependencyDetector', () => {
  let detector: CircularDependencyDetector;

  beforeEach(() => {
    detector = new CircularDependencyDetector();
  });

  describe('detectCircularDependencies', () => {
    it('単純な循環依存を検出する', () => {
      // Arrange
      const dependencies: FileDependency[] = [
        {
          file: 'a.ts',
          imports: ['b.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'b.ts',
          imports: ['a.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        }
      ];

      // Act
      const cycles = detector.detectCircularDependencies(dependencies);

      // Assert
      expect(cycles).toHaveLength(1);
      expect(cycles[0].files).toEqual(['a.ts', 'b.ts', 'a.ts']);
      expect(cycles[0].severity).toBe('error');
    });

    it('3つのファイル間の循環依存を検出する', () => {
      // Arrange
      const dependencies: FileDependency[] = [
        {
          file: 'a.ts',
          imports: ['b.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'b.ts',
          imports: ['c.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'c.ts',
          imports: ['a.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        }
      ];

      // Act
      const cycles = detector.detectCircularDependencies(dependencies);

      // Assert
      expect(cycles).toHaveLength(1);
      expect(cycles[0].files).toContain('a.ts');
      expect(cycles[0].files).toContain('b.ts');
      expect(cycles[0].files).toContain('c.ts');
    });

    it('循環依存がない場合は空配列を返す', () => {
      // Arrange
      const dependencies: FileDependency[] = [
        {
          file: 'a.ts',
          imports: ['b.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'b.ts',
          imports: ['c.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'c.ts',
          imports: [],
          exports: [],
          importedBy: [],
          packageImports: []
        }
      ];

      // Act
      const cycles = detector.detectCircularDependencies(dependencies);

      // Assert
      expect(cycles).toHaveLength(0);
    });

    it('複数の独立した循環依存を検出する', () => {
      // Arrange
      const dependencies: FileDependency[] = [
        // 第1の循環
        {
          file: 'a.ts',
          imports: ['b.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'b.ts',
          imports: ['a.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        // 第2の循環
        {
          file: 'x.ts',
          imports: ['y.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        },
        {
          file: 'y.ts',
          imports: ['x.ts'],
          exports: [],
          importedBy: [],
          packageImports: []
        }
      ];

      // Act
      const cycles = detector.detectCircularDependencies(dependencies);

      // Assert
      expect(cycles).toHaveLength(2);
    });
  });

  describe('calculateSeverity', () => {
    it('2ファイルの循環は高重要度', () => {
      const cycle = ['a.ts', 'b.ts', 'a.ts'];
      expect(detector.calculateSeverity(cycle)).toBe('error');
    });

    it('3-4ファイルの循環は中重要度', () => {
      const cycle = ['a.ts', 'b.ts', 'c.ts', 'a.ts'];
      expect(detector.calculateSeverity(cycle)).toBe('warning');
    });

    it('5ファイル以上の循環は低重要度', () => {
      const cycle = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'a.ts'];
      expect(detector.calculateSeverity(cycle)).toBe('info');
    });
  });

  describe('suggestRefactoring', () => {
    it('循環依存に対するリファクタリング提案を生成する', () => {
      // Arrange
      const cycle: CyclicDependency = {
        files: ['a.ts', 'b.ts', 'a.ts'],
        severity: 'error',
        suggestion: ''
      };

      // Act
      const suggestion = detector.suggestRefactoring(cycle);

      // Assert
      expect(suggestion).toContain('Consider extracting common functionality');
      expect(suggestion).toContain('interface');
    });
  });
});