/**
 * 型ベースセキュリティ解析 - フロー感度のあるテスト解析
 * データフロー追跡とセキュリティ不変条件の検証
 */

import {
  TestMethod,
  TestStatement,
  Variable,
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintMetadata,
  TaintTraceStep,
  SecurityViolation,
  SecurityIssue
} from '../types';

/**
 * データフローグラフのノード
 */
export interface FlowNode {
  /** ノードID */
  id: string;
  /** ステートメント */
  statement: TestStatement;
  /** 入力汚染レベル */
  inputTaint: TaintLevel;
  /** 出力汚染レベル */
  outputTaint: TaintLevel;
  /** メタデータ */
  metadata?: TaintMetadata;
  /** 後続ノード */
  successors: string[];
  /** 先行ノード */
  predecessors: string[];
}

/**
 * データフローグラフ
 */
export interface FlowGraph {
  /** ノード一覧 */
  nodes: FlowNode[];
  /** エントリーポイント */
  entry: string;
  /** エグジットポイント */
  exit: string;
  /** 汚染源 */
  taintSources: FlowNode[];
  /** セキュリティシンク */
  securitySinks: FlowNode[];
  /** サニタイザー */  
  sanitizers: FlowNode[];
  /** パス一覧 */
  paths: FlowPath[];
}

/**
 * フローパス
 */
export interface FlowPath {
  /** パスID */
  id: string;
  /** ノード列 */
  nodes: string[];
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** サニタイザーを通過したか */
  passedThroughSanitizer: boolean;
  /** セキュリティシンクに到達するか */
  reachesSecuritySink: boolean;
  /** パス長 */
  length: number;
}

/**
 * フロー感度のあるテスト解析器  
 */
export class FlowSensitiveAnalyzer {
  /**
   * テスト内のセキュリティ関連データフローを追跡
   */
  trackSecurityDataFlow(test: TestMethod): FlowGraph {
    // Step 1: 汚染源（Taint Sources）の識別
    const taintSources = this.identifyTaintSources(test);
    
    // Step 2: サニタイザーの識別
    const sanitizers = this.identifySanitizers(test);
    
    // Step 3: セキュリティシンク（Security Sinks）の識別
    const sinks = this.identifySecuritySinks(test);
    
    // Step 4: フローグラフの構築
    const flowGraph = this.buildFlowGraph(test);
    
    // Step 5: 汚染源・サニタイザー・シンクの設定
    this.markSpecialNodes(flowGraph, taintSources, sanitizers, sinks);
    
    // Step 6: パス感度解析
    this.analyzePaths(flowGraph, {
      interprocedural: false, // モジュラー解析のため
      contextSensitive: true,
      pathSensitive: true
    });
    
    return flowGraph;
  }

  /**
   * フローグラフの構築
   */
  buildFlowGraph(method: TestMethod): FlowGraph {
    const statements = this.parseStatements(method.content);
    const nodes: FlowNode[] = [];
    const nodeMap = new Map<string, FlowNode>();

    // ノードの作成
    statements.forEach((stmt, index) => {
      const node: FlowNode = {
        id: `node_${index}`,
        statement: stmt,
        inputTaint: TaintLevel.UNTAINTED,
        outputTaint: TaintLevel.UNTAINTED,
        successors: [],
        predecessors: []
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // エッジの構築（制御フロー）
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      
      current.successors.push(next.id);
      next.predecessors.push(current.id);
    }

    // データ依存関係の追加
    this.addDataDependencies(nodes, nodeMap);

    const flowGraph: FlowGraph = {
      nodes,
      entry: nodes[0]?.id || '',
      exit: nodes[nodes.length - 1]?.id || '',
      taintSources: [],
      securitySinks: [],
      sanitizers: [],
      paths: []
    };

    // パスの計算
    flowGraph.paths = this.calculateAllPaths(flowGraph);

    return flowGraph;
  }

  /**
   * セキュリティ不変条件の検証
   */
  verifySecurityInvariants(flow: FlowGraph): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // 汚染データの非サニタイズパスを検出
    flow.paths
      .filter(path => path.taintLevel >= TaintLevel.LIKELY_TAINTED)
      .filter(path => !path.passedThroughSanitizer)
      .filter(path => path.reachesSecuritySink)
      .forEach(path => {
        const sinkNode = this.getNodeById(flow, path.nodes[path.nodes.length - 1]);
        if (sinkNode) {
          violations.push({
            type: 'unsanitized-taint-flow',
            variable: this.extractVariableFromPath(path),
            taintLevel: path.taintLevel,
            metadata: sinkNode.metadata || this.createDefaultMetadata(sinkNode),
            severity: this.calculateSeverity(path.taintLevel),
            suggestedFix: this.generateSanitizationSuggestion(path)
          });
        }
      });

    return violations;
  }

  /**
   * 汚染源の識別
   */
  private identifyTaintSources(test: TestMethod): TaintSourceInfo[] {
    const sources: TaintSourceInfo[] = [];
    const content = test.content;

    // ユーザー入力パターン
    const userInputPatterns = [
      /req\.body/g,
      /req\.query/g,
      /req\.params/g,
      /process\.argv/g,
      /document\.getElementById/g,
      /window\.location/g
    ];

    userInputPatterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        sources.push({
          id: `taint_source_${index}_${match.index}`,
          type: TaintSource.USER_INPUT,
          location: this.getLocationFromIndex(content, match.index || 0),
          confidence: 0.9
        });
      });
    });

    // 外部APIパターン
    const apiPatterns = [
      /fetch\(/g,
      /axios\./g,
      /http\.get/g,
      /request\(/g
    ];

    apiPatterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        sources.push({
          id: `api_source_${index}_${match.index}`,
          type: TaintSource.EXTERNAL_API,
          location: this.getLocationFromIndex(content, match.index || 0),
          confidence: 0.8
        });
      });
    });

    return sources;
  }

  /**
   * サニタイザーの識別
   */
  private identifySanitizers(test: TestMethod): SanitizerInfo[] {
    const sanitizers: SanitizerInfo[] = [];
    const content = test.content;

    const sanitizerPatterns = [
      { pattern: /sanitize\(/g, type: SanitizerType.STRING_SANITIZE },
      { pattern: /escape\(/g, type: SanitizerType.HTML_ESCAPE },
      { pattern: /validate\(/g, type: SanitizerType.INPUT_VALIDATION },
      { pattern: /JSON\.parse\(/g, type: SanitizerType.JSON_PARSE },
      { pattern: /parseInt\(/g, type: SanitizerType.TYPE_CONVERSION },
      { pattern: /encodeURIComponent\(/g, type: SanitizerType.HTML_ESCAPE }
    ];

    sanitizerPatterns.forEach(({ pattern, type }, index) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        sanitizers.push({
          id: `sanitizer_${index}_${match.index}`,
          type,
          location: this.getLocationFromIndex(content, match.index || 0),
          effectiveness: this.getSanitizerEffectiveness(type)
        });
      });
    });

    return sanitizers;
  }

  /**
   * セキュリティシンクの識別
   */
  private identifySecuritySinks(test: TestMethod): SecuritySinkInfo[] {
    const sinks: SecuritySinkInfo[] = [];
    const content = test.content;

    const sinkPatterns = [
      { pattern: /expect\(/g, type: SecuritySink.TEST_ASSERTION },
      { pattern: /assert\(/g, type: SecuritySink.TEST_ASSERTION },
      { pattern: /innerHTML\s*=/g, type: SecuritySink.HTML_OUTPUT },
      { pattern: /eval\(/g, type: SecuritySink.JAVASCRIPT_EXEC },
      { pattern: /query\(/g, type: SecuritySink.DATABASE_QUERY },
      { pattern: /exec\(/g, type: SecuritySink.SYSTEM_COMMAND }
    ];

    sinkPatterns.forEach(({ pattern, type }, index) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        sinks.push({
          id: `sink_${index}_${match.index}`,
          type,
          location: this.getLocationFromIndex(content, match.index || 0),
          riskLevel: this.getSinkRiskLevel(type)
        });
      });
    });

    return sinks;
  }

  /**
   * ステートメントのパース（簡易実装）
   */
  private parseStatements(content: string): TestStatement[] {
    const lines = content.split('\n');
    const statements: TestStatement[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      let statement: TestStatement;

      if (trimmed.includes('=') && !trimmed.includes('==')) {
        // 代入文
        const [lhs, rhs] = trimmed.split('=').map(s => s.trim());
        statement = {
          type: 'assignment',
          content: trimmed,
          location: { line: index + 1, column: 0 },
          lhs: lhs.replace(/^(const|let|var)\s+/, ''),
          rhs: rhs.replace(/;$/, '')
        };
      } else if (trimmed.includes('expect(') || trimmed.includes('assert(')) {
        // アサーション
        const actualMatch = trimmed.match(/expect\(([^)]+)\)|assert\(([^)]+)\)/);
        statement = {
          type: 'assertion',
          content: trimmed,
          location: { line: index + 1, column: 0 },
          actual: actualMatch?.[1] || actualMatch?.[2] || '',
          isNegativeAssertion: trimmed.includes('.not.')
        };
      } else if (this.isSanitizerCall(trimmed)) {
        // サニタイザー呼び出し
        statement = {
          type: 'sanitizer',
          content: trimmed,
          location: { line: index + 1, column: 0 }
        };
      } else if (this.isUserInputAccess(trimmed)) {
        // ユーザー入力アクセス
        statement = {
          type: 'userInput',
          content: trimmed,
          location: { line: index + 1, column: 0 }
        };
      } else if (trimmed.includes('(')) {
        // メソッド呼び出し
        const methodMatch = trimmed.match(/(\w+)\s*\(/);
        statement = {
          type: 'methodCall',
          content: trimmed,
          location: { line: index + 1, column: 0 },
          method: methodMatch?.[1] || ''
        };
      } else {
        // その他
        statement = {
          type: 'assignment',
          content: trimmed,
          location: { line: index + 1, column: 0 }
        };
      }

      statements.push(statement);
    });

    return statements;
  }

  /**
   * 特殊ノードのマーク付け
   */
  private markSpecialNodes(
    flowGraph: FlowGraph,
    taintSources: TaintSourceInfo[],
    sanitizers: SanitizerInfo[],
    sinks: SecuritySinkInfo[]
  ): void {
    // 汚染源のマーク
    flowGraph.nodes.forEach(node => {
      if (taintSources.some(source => this.nodeMatchesSource(node, source))) {
        flowGraph.taintSources.push(node);
        node.outputTaint = TaintLevel.DEFINITELY_TAINTED;
        node.metadata = this.createTaintMetadata(node, TaintSource.USER_INPUT);
      }
    });

    // サニタイザーのマーク  
    flowGraph.nodes.forEach(node => {
      if (sanitizers.some(sanitizer => this.nodeMatchesSanitizer(node, sanitizer))) {
        flowGraph.sanitizers.push(node);
      }
    });

    // セキュリティシンクのマーク
    flowGraph.nodes.forEach(node => {
      if (sinks.some(sink => this.nodeMatchesSink(node, sink))) {
        flowGraph.securitySinks.push(node);
      }
    });
  }

  /**
   * パス解析の実行
   */
  private analyzePaths(flowGraph: FlowGraph, options: AnalysisOptions): void {
    // 各パスの汚染レベルを計算
    flowGraph.paths.forEach(path => {
      let currentTaint = TaintLevel.UNTAINTED;
      let passedSanitizer = false;

      for (const nodeId of path.nodes) {
        const node = this.getNodeById(flowGraph, nodeId);
        if (!node) continue;

        // 汚染源の場合
        if (flowGraph.taintSources.includes(node)) {
          currentTaint = TaintLevel.DEFINITELY_TAINTED;
        }

        // サニタイザーの場合
        if (flowGraph.sanitizers.includes(node)) {
          currentTaint = TaintLevel.UNTAINTED;
          passedSanitizer = true;
        }

        // セキュリティシンクの場合
        if (flowGraph.securitySinks.includes(node)) {
          path.reachesSecuritySink = true;
        }
      }

      path.taintLevel = currentTaint;
      path.passedThroughSanitizer = passedSanitizer;
    });
  }

  /**
   * データ依存関係の追加
   */
  private addDataDependencies(nodes: FlowNode[], nodeMap: Map<string, FlowNode>): void {
    // 変数の定義と使用を追跡
    const definitions = new Map<string, string>(); // variable -> nodeId
    
    nodes.forEach(node => {
      const stmt = node.statement;
      
      // 定義（代入の左辺）
      if (stmt.type === 'assignment' && stmt.lhs) {
        definitions.set(stmt.lhs, node.id);
      }
      
      // 使用（右辺や引数）
      const usedVars = this.extractUsedVariables(stmt);
      usedVars.forEach(variable => {
        const defNodeId = definitions.get(variable);
        if (defNodeId && defNodeId !== node.id) {
          const defNode = nodeMap.get(defNodeId);
          if (defNode && !defNode.successors.includes(node.id)) {
            defNode.successors.push(node.id);
            node.predecessors.push(defNodeId);
          }
        }
      });
    });
  }

  /**
   * 全パスの計算
   */
  private calculateAllPaths(flowGraph: FlowGraph): FlowPath[] {
    const paths: FlowPath[] = [];
    const visited = new Set<string>();
    
    const dfs = (nodeId: string, currentPath: string[], pathId: string) => {
      if (visited.has(nodeId)) return;
      
      const newPath = [...currentPath, nodeId];
      
      const node = this.getNodeById(flowGraph, nodeId);
      if (!node || node.successors.length === 0) {
        // 終端ノード - パスを記録
        paths.push({
          id: pathId,
          nodes: newPath,
          taintLevel: TaintLevel.UNTAINTED,
          passedThroughSanitizer: false,
          reachesSecuritySink: false,
          length: newPath.length
        });
        return;
      }
      
      // 後続ノードを探索
      node.successors.forEach((successorId, index) => {
        dfs(successorId, newPath, `${pathId}_${index}`);
      });
    };
    
    if (flowGraph.entry) {
      dfs(flowGraph.entry, [], 'path_0');
    }
    
    return paths;
  }

  // ヘルパーメソッドの実装
  private getLocationFromIndex(content: string, index: number): { line: number; column: number } {
    const lines = content.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length
    };
  }

  private getSanitizerEffectiveness(type: SanitizerType): number {
    switch (type) {
      case SanitizerType.HTML_ESCAPE:
      case SanitizerType.SQL_ESCAPE:
        return 0.95;
      case SanitizerType.INPUT_VALIDATION:
        return 0.85;
      case SanitizerType.TYPE_CONVERSION:
        return 0.7;
      default:
        return 0.5;
    }
  }

  private getSinkRiskLevel(type: SecuritySink): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case SecuritySink.SYSTEM_COMMAND:
      case SecuritySink.JAVASCRIPT_EXEC:
        return 'critical';
      case SecuritySink.DATABASE_QUERY:
      case SecuritySink.HTML_OUTPUT:
        return 'high';
      case SecuritySink.TEST_ASSERTION:
        return 'medium';
      default:
        return 'low';
    }
  }

  private isSanitizerCall(line: string): boolean {
    const sanitizers = ['sanitize(', 'escape(', 'validate(', 'clean('];
    return sanitizers.some(sanitizer => line.includes(sanitizer));
  }

  private isUserInputAccess(line: string): boolean {
    const inputs = ['req.body', 'req.query', 'req.params', 'process.argv'];
    return inputs.some(input => line.includes(input));
  }

  private nodeMatchesSource(node: FlowNode, source: TaintSourceInfo): boolean {
    return node.statement.location.line === source.location.line;
  }

  private nodeMatchesSanitizer(node: FlowNode, sanitizer: SanitizerInfo): boolean {
    return node.statement.location.line === sanitizer.location.line;
  }

  private nodeMatchesSink(node: FlowNode, sink: SecuritySinkInfo): boolean {
    return node.statement.location.line === sink.location.line;
  }

  private getNodeById(flowGraph: FlowGraph, nodeId: string): FlowNode | undefined {
    return flowGraph.nodes.find(node => node.id === nodeId);
  }

  private extractVariableFromPath(path: FlowPath): string {
    return `path_${path.id}`;
  }

  private createDefaultMetadata(node: FlowNode): TaintMetadata {
    return {
      source: TaintSource.USER_INPUT,
      confidence: 0.5,
      location: {
        file: 'unknown',
        line: node.statement.location.line,
        column: node.statement.location.column
      },
      tracePath: [],
      securityRules: []
    };
  }

  private calculateSeverity(taintLevel: TaintLevel): 'low' | 'medium' | 'high' | 'critical' {
    switch (taintLevel) {
      case TaintLevel.DEFINITELY_TAINTED:
        return 'critical';
      case TaintLevel.LIKELY_TAINTED:
        return 'high';
      case TaintLevel.POSSIBLY_TAINTED:
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateSanitizationSuggestion(path: FlowPath): string {
    return `パス ${path.id} でサニタイザーを適用してください`;
  }

  private createTaintMetadata(node: FlowNode, source: TaintSource): TaintMetadata {
    return {
      source,
      confidence: 0.9,
      location: {
        file: 'unknown',
        line: node.statement.location.line,
        column: node.statement.location.column
      },
      tracePath: [{
        type: 'propagate',
        description: node.statement.content,
        inputTaint: node.inputTaint,
        outputTaint: node.outputTaint,
        location: {
          file: 'unknown',
          line: node.statement.location.line,
          column: node.statement.location.column
        }
      }],
      securityRules: []
    };
  }

  private extractUsedVariables(stmt: TestStatement): string[] {
    const variables: string[] = [];
    
    if (stmt.rhs) {
      const matches = stmt.rhs.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
      variables.push(...matches.filter(m => !this.isKeyword(m)));
    }
    
    if (stmt.actual) {
      const matches = stmt.actual.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
      variables.push(...matches.filter(m => !this.isKeyword(m)));
    }
    
    return variables;
  }

  private isKeyword(word: string): boolean {
    const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return'];
    return keywords.includes(word);
  }
}

// 関連するインターフェースの定義
interface TaintSourceInfo {
  id: string;
  type: TaintSource;
  location: { line: number; column: number };
  confidence: number;
}

interface SanitizerInfo {
  id: string;
  type: SanitizerType;
  location: { line: number; column: number };
  effectiveness: number;
}

interface SecuritySinkInfo {
  id: string;
  type: SecuritySink;
  location: { line: number; column: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AnalysisOptions {
  interprocedural: boolean;
  contextSensitive: boolean;
  pathSensitive: boolean;
}