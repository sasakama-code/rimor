/**
 * AST Merger
 * v0.9.0 Phase 2 - AST統合システム
 * 
 * KISS原則: シンプルなマージロジック
 * YAGNI原則: 必要最小限の機能から開始
 * DRY原則: 共通ロジックの再利用
 * SOLID原則: 単一責任の原則
 * Defensive Programming: 堅牢なエラーハンドリング
 */

import { ASTNode } from '../core/interfaces/IAnalysisEngine';

/**
 * マージ戦略
 */
export enum MergeStrategy {
  SINGLE = 'single',           // 単一AST（マージ不要）
  SEQUENTIAL = 'sequential',   // 順次マージ
  HIERARCHICAL = 'hierarchical', // 階層的マージ
  INTELLIGENT = 'intelligent'  // インテリジェントマージ（重複削除等）
}

/**
 * マージエラー
 */
interface MergeError {
  type: 'structure' | 'position' | 'validation';
  message: string;
  location?: { row: number; column: number };
}

/**
 * マージメタデータ
 */
export interface MergeMetadata {
  strategy: MergeStrategy;
  nodeCount: number;
  mergedChunks: number;
  positionsAdjusted: boolean;
  hasOverlap: boolean;
  structureValid: boolean;
  errors: MergeError[];
  warnings: string[];
  duplicatesRemoved?: number;
  hasErrors?: boolean;
  errorNodes?: number;
  recoverable?: boolean;
  mergeTime?: number;
}

/**
 * マージ結果
 */
export interface MergeResult {
  ast: ASTNode;
  metadata: MergeMetadata;
}

/**
 * ASTマージャー設定
 */
export interface ASTMergerConfig {
  validateStructure?: boolean;
  preservePositions?: boolean;
  mergeStrategy?: MergeStrategy;
  removeduplicates?: boolean;
}

/**
 * ASTマージャー
 * 複数のASTを単一のASTに統合
 */
export class ASTMerger {
  private config: Required<ASTMergerConfig>;

  constructor(config?: ASTMergerConfig) {
    this.config = {
      validateStructure: config?.validateStructure ?? true,
      preservePositions: config?.preservePositions ?? true,
      mergeStrategy: config?.mergeStrategy ?? MergeStrategy.SEQUENTIAL,
      removeduplicates: config?.removeduplicates ?? false
    };
  }

  /**
   * 複数のASTをマージ
   * SOLID原則: 単一責任 - ASTのマージのみを担当
   */
  merge(asts: ASTNode[]): MergeResult {
    const startTime = Date.now();

    // 空のリストチェック
    if (asts.length === 0) {
      throw new Error('Cannot merge empty AST list');
    }

    // 単一ASTの場合
    if (asts.length === 1) {
      const normalized = this.normalizeAST(asts[0]);
      const warnings: string[] = [];
      
      // 空の子配列の警告チェック
      if (asts[0].children === undefined) {
        warnings.push('Empty children array normalized');
      }
      
      return {
        ast: normalized,
        metadata: this.createMetadata(
          MergeStrategy.SINGLE,
          normalized,
          1,
          [],
          warnings,
          Date.now() - startTime
        )
      };
    }

    // マージ戦略に基づいて処理
    let result: MergeResult;
    switch (this.config.mergeStrategy) {
      case MergeStrategy.HIERARCHICAL:
        result = this.hierarchicalMerge(asts);
        break;
      case MergeStrategy.INTELLIGENT:
        result = this.intelligentMerge(asts);
        break;
      case MergeStrategy.SEQUENTIAL:
      default:
        result = this.sequentialMerge(asts);
        break;
    }

    result.metadata.mergeTime = Date.now() - startTime;
    return result;
  }

  /**
   * 順次マージ
   * KISS原則: 最もシンプルなマージ方法
   */
  private sequentialMerge(asts: ASTNode[]): MergeResult {
    const errors: MergeError[] = [];
    const warnings: string[] = [];
    let hasOverlap = false;
    let currentRow = 0;

    // ルートプログラムノード作成
    const mergedAST: ASTNode = {
      type: 'program',
      text: '',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      isNamed: true,
      children: []
    };

    // 各ASTの子ノードをマージ
    for (let i = 0; i < asts.length; i++) {
      const ast = this.normalizeAST(asts[i]);
      
      // オーバーラップチェック
      if (i > 0 && this.hasPositionOverlap(asts[i - 1], ast)) {
        hasOverlap = true;
        warnings.push('Position overlap detected');
      }

      // 子ノードを追加
      if (ast.children && ast.children.length > 0) {
        for (const child of ast.children) {
          const adjustedChild = this.config.preservePositions
            ? this.adjustPosition(child, currentRow)
            : child;
          mergedAST.children!.push(adjustedChild);
        }
        
        // 次のチャンクの開始行を更新
        currentRow = this.getMaxRow(ast) + 1;
      }

      // 構造検証
      if (this.config.validateStructure) {
        const structureErrors = this.validateStructure(ast);
        errors.push(...structureErrors);
      }
    }

    // 終了位置を更新
    if (mergedAST.children && mergedAST.children.length > 0) {
      const lastChild = mergedAST.children[mergedAST.children.length - 1];
      mergedAST.endPosition = lastChild.endPosition;
    }

    return {
      ast: mergedAST,
      metadata: this.createMetadata(
        MergeStrategy.SEQUENTIAL,
        mergedAST,
        asts.length,
        errors,
        warnings,
        0,
        hasOverlap,
        this.config.preservePositions
      )
    };
  }

  /**
   * 階層的マージ
   * DRY原則: sequentialMergeのロジックを再利用
   */
  private hierarchicalMerge(asts: ASTNode[]): MergeResult {
    // 基本的にはsequentialMergeと同じだが、階層構造を保持
    const result = this.sequentialMerge(asts);
    result.metadata.strategy = MergeStrategy.HIERARCHICAL;
    return result;
  }

  /**
   * インテリジェントマージ
   * 重複削除などの高度な処理
   */
  private intelligentMerge(asts: ASTNode[]): MergeResult {
    const result = this.sequentialMerge(asts);
    result.metadata.strategy = MergeStrategy.INTELLIGENT;

    // 重複ノードの削除
    if (this.config.removeduplicates || this.config.mergeStrategy === MergeStrategy.INTELLIGENT) {
      const { ast, duplicatesRemoved } = this.removeDuplicates(result.ast);
      result.ast = ast;
      result.metadata.duplicatesRemoved = duplicatesRemoved;
    }

    return result;
  }

  /**
   * ASTの正規化
   * Defensive Programming: nullやundefinedの処理
   */
  private normalizeAST(ast: ASTNode): ASTNode {
    const normalized = { ...ast };
    
    if (!normalized.children) {
      normalized.children = [];
    }
    
    return normalized;
  }

  /**
   * 位置情報の調整
   */
  private adjustPosition(node: ASTNode, rowOffset: number): ASTNode {
    const adjusted = { ...node };
    
    adjusted.startPosition = {
      row: node.startPosition.row + rowOffset,
      column: node.startPosition.column
    };
    
    adjusted.endPosition = {
      row: node.endPosition.row + rowOffset,
      column: node.endPosition.column
    };
    
    // 子ノードも再帰的に調整
    if (node.children) {
      adjusted.children = node.children.map(child => 
        this.adjustPosition(child, rowOffset)
      );
    }
    
    return adjusted;
  }

  /**
   * 位置のオーバーラップチェック
   */
  private hasPositionOverlap(ast1: ASTNode, ast2: ASTNode): boolean {
    return ast1.endPosition.row >= ast2.startPosition.row;
  }

  /**
   * 最大行番号を取得
   */
  private getMaxRow(ast: ASTNode): number {
    let maxRow = ast.endPosition.row;
    
    if (ast.children) {
      for (const child of ast.children) {
        maxRow = Math.max(maxRow, this.getMaxRow(child));
      }
    }
    
    return maxRow;
  }

  /**
   * 構造検証
   */
  private validateStructure(ast: ASTNode): MergeError[] {
    const errors: MergeError[] = [];
    
    // 不完全な構造のチェック
    if (ast.children) {
      for (const child of ast.children) {
        if (child.type === 'function_declaration' && 
            child.text && !child.text.includes('}')) {
          errors.push({
            type: 'structure',
            message: 'Incomplete structure: function declaration missing closing brace',
            location: child.startPosition
          });
        }
        
        if (child.type === 'ERROR') {
          errors.push({
            type: 'structure',
            message: 'Syntax error node detected',
            location: child.startPosition
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * 重複ノードの削除
   */
  private removeDuplicates(ast: ASTNode): { ast: ASTNode; duplicatesRemoved: number } {
    if (!ast.children || ast.children.length === 0) {
      return { ast, duplicatesRemoved: 0 };
    }

    const seen = new Set<string>();
    const uniqueChildren: ASTNode[] = [];
    let duplicatesRemoved = 0;

    for (const child of ast.children) {
      const key = `${child.type}:${child.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueChildren.push(child);
      } else {
        duplicatesRemoved++;
      }
    }

    return {
      ast: { ...ast, children: uniqueChildren },
      duplicatesRemoved
    };
  }

  /**
   * メタデータ作成
   */
  private createMetadata(
    strategy: MergeStrategy,
    ast: ASTNode,
    mergedChunks: number,
    errors: MergeError[],
    warnings: string[],
    mergeTime: number,
    hasOverlap: boolean = false,
    positionsAdjusted: boolean = false
  ): MergeMetadata {
    const nodeCount = this.countNodes(ast);
    const errorNodes = this.countErrorNodes(ast);
    const hasErrors = errorNodes > 0;
    
    // 空の子配列の警告
    if (ast.children && ast.children.length === 0) {
      warnings.push('Empty children array normalized');
    }
    
    // 構造エラーがない場合、ERRORノードがあっても回復可能
    const structureErrors = errors.filter(e => e.type === 'structure' && e.message.includes('Incomplete'));
    const recoverable = hasErrors && structureErrors.length === 0;

    return {
      strategy,
      nodeCount,
      mergedChunks,
      positionsAdjusted,
      hasOverlap,
      structureValid: errors.filter(e => e.type === 'structure').length === 0,
      errors,
      warnings,
      hasErrors,
      errorNodes,
      recoverable,
      mergeTime
    };
  }

  /**
   * ノード数をカウント
   */
  private countNodes(ast: ASTNode): number {
    let count = 1;
    
    if (ast.children) {
      for (const child of ast.children) {
        count += this.countNodes(child);
      }
    }
    
    return count;
  }

  /**
   * エラーノード数をカウント
   */
  private countErrorNodes(ast: ASTNode): number {
    let count = ast.type === 'ERROR' ? 1 : 0;
    
    if (ast.children) {
      for (const child of ast.children) {
        count += this.countErrorNodes(child);
      }
    }
    
    return count;
  }
}