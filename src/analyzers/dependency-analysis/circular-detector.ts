/**
 * CircularDependencyDetector
 * Issue #65: 循環依存検出専用モジュール
 * 
 * SOLID原則: 単一責任（循環依存検出のみ）
 * DRY原則: グラフ走査アルゴリズムの再利用
 * KISS原則: シンプルなDFSベースの検出
 */

import { CyclicDependency, FileDependency } from '../types';

/**
 * 循環依存を検出する専用クラス
 */
export class CircularDependencyDetector {
  /**
   * 循環依存を検出
   */
  detectCircularDependencies(dependencies: FileDependency[]): CyclicDependency[] {
    const graph = this.buildGraph(dependencies);
    const cycles: CyclicDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const detectedCycles = new Set<string>();

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        const cyclesFromNode = this.dfs(
          node,
          graph,
          visited,
          recursionStack,
          []
        );
        
        for (const cycle of cyclesFromNode) {
          const cycleKey = this.getCycleKey(cycle);
          if (!detectedCycles.has(cycleKey)) {
            detectedCycles.add(cycleKey);
            cycles.push({
              cycle,
              severity: this.calculateSeverity(cycle),
              suggestion: this.suggestRefactoring({ 
                cycle, 
                severity: this.calculateSeverity(cycle),
                suggestion: ''
              })
            });
          }
        }
      }
    }

    return cycles;
  }

  /**
   * 依存関係グラフを構築
   */
  private buildGraph(dependencies: FileDependency[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const dep of dependencies) {
      if (!graph.has(dep.file)) {
        graph.set(dep.file, []);
      }
      graph.set(dep.file, dep.imports);
    }

    return graph;
  }

  /**
   * 深さ優先探索で循環を検出
   */
  private dfs(
    node: string,
    graph: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[][] {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const cycles: string[][] = [];
    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const nestedCycles = this.dfs(
          neighbor,
          graph,
          visited,
          recursionStack,
          [...path]
        );
        cycles.push(...nestedCycles);
      } else if (recursionStack.has(neighbor)) {
        // 循環を検出
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycle = [...path.slice(cycleStartIndex), neighbor];
          cycles.push(cycle);
        }
      }
    }

    recursionStack.delete(node);
    return cycles;
  }

  /**
   * 循環のキーを生成（重複検出用）
   */
  private getCycleKey(cycle: string[]): string {
    const sorted = [...cycle].sort();
    return sorted.join('->');
  }

  /**
   * 循環の重要度を計算
   */
  calculateSeverity(cycle: string[]): 'low' | 'medium' | 'high' {
    const length = cycle.length - 1; // 最後の要素は最初の要素の繰り返し
    
    if (length <= 2) {
      return 'high'; // 2ファイル間の直接的な循環
    } else if (length <= 4) {
      return 'medium'; // 3-4ファイル間の循環
    } else {
      return 'low'; // 5ファイル以上の循環
    }
  }

  /**
   * リファクタリング提案を生成
   */
  suggestRefactoring(cycle: CyclicDependency): string {
    const suggestions: string[] = [];
    const severity = cycle.severity;

    if (severity === 'high') {
      suggestions.push('Consider extracting common functionality to a separate module');
      suggestions.push('Use dependency injection or interfaces to break the direct dependency');
    } else if (severity === 'medium') {
      suggestions.push('Review the module boundaries and responsibilities');
      suggestions.push('Consider using event-driven architecture or mediator pattern');
    } else {
      suggestions.push('Analyze if all dependencies are necessary');
      suggestions.push('Consider restructuring the module hierarchy');
    }

    // インターフェースベースの解決策を提案
    suggestions.push('Create an interface or abstract class to decouple the modules');

    return suggestions.join('. ');
  }

  /**
   * 循環依存の影響範囲を分析
   */
  analyzeImpact(
    cycle: CyclicDependency,
    allDependencies: FileDependency[]
  ): {
    affectedFiles: string[];
    testFiles: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const affectedFiles = new Set<string>();
    const testFiles = new Set<string>();

    // 循環に含まれるファイルを追加
    for (const file of cycle.cycle) {
      affectedFiles.add(file);
      
      // このファイルをインポートしている他のファイルを検索
      for (const dep of allDependencies) {
        if (dep.imports.includes(file)) {
          affectedFiles.add(dep.file);
          
          if (dep.file.includes('.test.') || dep.file.includes('.spec.')) {
            testFiles.add(dep.file);
          }
        }
      }
    }

    // 影響度を計算
    let severity: 'low' | 'medium' | 'high' | 'critical' = cycle.severity;
    if (affectedFiles.size > 10) {
      severity = 'critical';
    } else if (affectedFiles.size > 5 && severity !== 'high') {
      severity = 'high';
    }

    return {
      affectedFiles: Array.from(affectedFiles),
      testFiles: Array.from(testFiles),
      severity
    };
  }
}