/**
 * TypeScript AST を使用したTaint Sink検出器
 * arXiv:2504.18529v2の理論に基づいた実装
 * 
 * Sink検出の目的:
 * - セキュリティホールとなる危険な関数呼び出しを特定
 * - 汚染されたデータが到達すると脆弱性を引き起こす箇所を検出
 * - データフロー解析の終点として活用
 */

import * as ts from 'typescript';

/**
 * Taint Sink の情報
 */
export interface TaintSink {
  /** シンクのタイプ */
  type: 'sql-injection' | 'path-traversal' | 'command-injection' | 'xss' | 'code-injection' | 'file-write';
  /** シンクの詳細カテゴリ */
  category: string;
  /** シンクの場所 */
  location: {
    file: string;
    line: number;
    column: number;
    length: number;
  };
  /** 危険な関数またはメソッド */
  dangerousFunction: {
    functionName: string;
    objectName?: string;
    arguments: string[];
    dangerousParameterIndex: number; // 汚染が危険なパラメーターのインデックス
  };
  /** リスクレベル */
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 信頼度スコア */
  confidence: number;
}

/**
 * TypeScript AST ベースのSink検出器
 */
export class ASTSinkDetector {
  private sourceFile: ts.SourceFile | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private program: ts.Program | null = null;

  constructor() {}

  /**
   * ソースコードを解析してTaint Sinkを検出
   * @param sourceCode TypeScriptソースコード
   * @param fileName ファイル名
   * @returns 検出されたTaint Sinkのリスト
   */
  async detectSinks(sourceCode: string, fileName: string): Promise<TaintSink[]> {
    const isJavaScript = fileName.endsWith('.js');
    
    // TypeScript プログラムの作成
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      // JavaScript ファイルの場合は型チェックを緩和
      strict: !isJavaScript,
      noImplicitAny: !isJavaScript,
      // JSファイルのサポート
      allowJs: true,
      checkJs: isJavaScript
    };

    // 仮想的なファイルシステムでコンパイルホストを作成
    const host = ts.createCompilerHost(compilerOptions);
    const originalGetSourceFile = host.getSourceFile;
    
    host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (name === fileName) {
        return ts.createSourceFile(fileName, sourceCode, languageVersion, true);
      }
      return originalGetSourceFile.call(host, name, languageVersion, onError, shouldCreateNewSourceFile);
    };

    // プログラム作成
    this.program = ts.createProgram([fileName], compilerOptions, host);
    this.sourceFile = this.program.getSourceFile(fileName) || null;
    this.typeChecker = this.program.getTypeChecker();

    if (!this.sourceFile) {
      throw new Error(`ソースファイルの読み込みに失敗しました: ${fileName}`);
    }

    const sinks: TaintSink[] = [];
    
    // AST をトラバースしてSink を検出
    this.visitNode(this.sourceFile, sinks);

    // 重複を排除
    return this.removeDuplicateSinks(sinks);
  }

  /**
   * AST ノードを再帰的に訪問
   * @param node 現在のノード
   * @param sinks 検出されたSinkの蓄積用配列
   */
  private visitNode(node: ts.Node, sinks: TaintSink[]): void {
    // 関数呼び出しの検査
    if (ts.isCallExpression(node)) {
      this.analyzeCallExpression(node, sinks);
    }

    // new式の検査（new Function() など）
    if (ts.isNewExpression(node)) {
      this.analyzeNewExpression(node, sinks);
    }

    // プロパティアクセス + 関数呼び出しの検査
    if (ts.isPropertyAccessExpression(node) && ts.isCallExpression(node.parent)) {
      this.analyzeMethodCall(node.parent as ts.CallExpression, sinks);
    }

    // 子ノードも再帰的に訪問
    ts.forEachChild(node, (child) => this.visitNode(child, sinks));
  }

  /**
   * 関数呼び出し式の解析
   */
  private analyzeCallExpression(node: ts.CallExpression, sinks: TaintSink[]): void {
    if (!this.sourceFile) return;

    const functionName = this.extractFunctionName(node);
    const objectName = this.extractObjectName(node);
    
    // メソッド呼び出しの場合は専用ロジックを使用
    if (objectName) {
      const methodSinkInfo = this.identifyMethodSink(objectName, functionName);
      if (methodSinkInfo) {
        const location = this.getNodeLocation(node);
        const args = node.arguments.map(arg => arg.getText(this.sourceFile!));
        
        sinks.push({
          type: methodSinkInfo.type,
          category: methodSinkInfo.category,
          location,
          dangerousFunction: {
            functionName,
            objectName,
            arguments: args,
            dangerousParameterIndex: methodSinkInfo.dangerousParameterIndex
          },
          riskLevel: methodSinkInfo.riskLevel,
          confidence: methodSinkInfo.confidence
        });
        return; // メソッド呼び出しとして処理完了
      }
    }
    
    // 既知のTaint Sink を検査（単体関数）
    const sinkInfo = this.identifyTaintSink(functionName, objectName);
    if (sinkInfo) {
      const location = this.getNodeLocation(node);
      const args = node.arguments.map(arg => arg.getText(this.sourceFile!));
      
      sinks.push({
        type: sinkInfo.type,
        category: sinkInfo.category,
        location,
        dangerousFunction: {
          functionName,
          objectName,
          arguments: args,
          dangerousParameterIndex: sinkInfo.dangerousParameterIndex
        },
        riskLevel: sinkInfo.riskLevel,
        confidence: sinkInfo.confidence
      });
    }
  }

  /**
   * new式の解析（new Function() など）
   */
  private analyzeNewExpression(node: ts.NewExpression, sinks: TaintSink[]): void {
    if (!this.sourceFile) return;

    const constructorName = this.extractConstructorName(node);
    
    // 危険なコンストラクタをチェック
    if (constructorName === 'Function') {
      const location = this.getNodeLocation(node);
      const args = node.arguments?.map(arg => arg.getText(this.sourceFile!)) || [];
      
      sinks.push({
        type: 'code-injection',
        category: 'dynamic-execution',
        location,
        dangerousFunction: {
          functionName: 'Function',
          objectName: undefined,
          arguments: args,
          dangerousParameterIndex: args.length > 0 ? args.length - 1 : 0 // 最後の引数がコード
        },
        riskLevel: 'CRITICAL',
        confidence: 0.95
      });
    }
  }

  /**
   * メソッド呼び出しの解析
   */
  private analyzeMethodCall(node: ts.CallExpression, sinks: TaintSink[]): void {
    if (!this.sourceFile) return;

    const functionName = this.extractFunctionName(node);
    const objectName = this.extractObjectName(node);
    
    // メソッド呼び出し形式のSinkを検査
    const sinkInfo = this.identifyMethodSink(objectName, functionName);
    if (sinkInfo) {
      const location = this.getNodeLocation(node);
      const args = node.arguments.map(arg => arg.getText(this.sourceFile!));
      
      sinks.push({
        type: sinkInfo.type,
        category: sinkInfo.category,
        location,
        dangerousFunction: {
          functionName,
          objectName,
          arguments: args,
          dangerousParameterIndex: sinkInfo.dangerousParameterIndex
        },
        riskLevel: sinkInfo.riskLevel,
        confidence: sinkInfo.confidence
      });
    }
  }

  /**
   * 関数名の抽出
   */
  private extractFunctionName(node: ts.CallExpression): string {
    if (!this.sourceFile) return 'unknown';

    if (ts.isIdentifier(node.expression)) {
      return node.expression.text;
    } else if (ts.isPropertyAccessExpression(node.expression)) {
      return node.expression.name.text;
    }
    
    return node.expression.getText(this.sourceFile);
  }

  /**
   * オブジェクト名の抽出
   */
  private extractObjectName(node: ts.CallExpression): string | undefined {
    if (!this.sourceFile) return undefined;

    if (ts.isPropertyAccessExpression(node.expression)) {
      return node.expression.expression.getText(this.sourceFile);
    }
    
    return undefined;
  }

  /**
   * コンストラクタ名の抽出
   */
  private extractConstructorName(node: ts.NewExpression): string {
    if (!this.sourceFile) return 'unknown';

    if (ts.isIdentifier(node.expression)) {
      return node.expression.text;
    }
    
    return node.expression.getText(this.sourceFile);
  }

  /**
   * 関数ベースのTaint Sinkの特定
   */
  private identifyTaintSink(functionName: string, objectName?: string): {
    type: TaintSink['type'];
    category: string;
    riskLevel: TaintSink['riskLevel'];
    confidence: number;
    dangerousParameterIndex: number;
  } | null {
    
    // SQLクエリ実行
    if (functionName === 'query' || functionName === 'execute') {
      return {
        type: 'sql-injection',
        category: 'database-query',
        riskLevel: 'CRITICAL',
        confidence: 0.90,
        dangerousParameterIndex: 0
      };
    }

    // ファイルシステム操作
    if (functionName === 'readFile' || functionName === 'readFileSync' ||
        functionName === 'writeFile' || functionName === 'writeFileSync') {
      return {
        type: 'path-traversal',
        category: 'filesystem',
        riskLevel: 'HIGH',
        confidence: 0.85,
        dangerousParameterIndex: 0
      };
    }

    // コマンド実行
    if (functionName === 'exec' || functionName === 'execSync' ||
        functionName === 'spawn' || functionName === 'spawnSync') {
      return {
        type: 'command-injection',
        category: 'system-command',
        riskLevel: 'CRITICAL',
        confidence: 0.95,
        dangerousParameterIndex: 0
      };
    }

    // 動的コード実行
    if (functionName === 'eval' || functionName === 'Function') {
      return {
        type: 'code-injection',
        category: 'dynamic-execution',
        riskLevel: 'CRITICAL',
        confidence: 0.95,
        dangerousParameterIndex: 0
      };
    }

    return null;
  }

  /**
   * メソッドベースのTaint Sinkの特定
   */
  private identifyMethodSink(objectName: string | undefined, methodName: string): {
    type: TaintSink['type'];
    category: string;
    riskLevel: TaintSink['riskLevel'];
    confidence: number;
    dangerousParameterIndex: number;
  } | null {
    
    // データベースオブジェクトのメソッド
    if (objectName && ['db', 'connection', 'pool'].includes(objectName.toLowerCase())) {
      if (methodName === 'query' || methodName === 'execute') {
        return {
          type: 'sql-injection',
          category: 'database-method',
          riskLevel: 'CRITICAL',
          confidence: 0.90,
          dangerousParameterIndex: 0
        };
      }
    }

    // ファイルシステムオブジェクトのメソッド
    if (objectName === 'fs') {
      if (['readFile', 'readFileSync', 'writeFile', 'writeFileSync'].includes(methodName)) {
        return {
          type: 'path-traversal',
          category: 'fs-method',
          riskLevel: 'HIGH',
          confidence: 0.85,
          dangerousParameterIndex: 0
        };
      }
    }

    // HTTP レスポンスオブジェクトのメソッド
    if (objectName === 'res' || objectName === 'response') {
      if (methodName === 'send' || methodName === 'write' || methodName === 'end') {
        return {
          type: 'xss',
          category: 'http-response',
          riskLevel: 'HIGH',
          confidence: 0.80,
          dangerousParameterIndex: 0
        };
      }
    }

    // DOM操作
    if (objectName === 'document') {
      if (methodName === 'write' || methodName === 'writeln') {
        return {
          type: 'xss',
          category: 'dom-manipulation',
          riskLevel: 'HIGH',
          confidence: 0.85,
          dangerousParameterIndex: 0
        };
      }
    }

    // child_process メソッド
    if (objectName === 'child_process' || objectName === 'cp') {
      if (['exec', 'execSync', 'spawn', 'spawnSync'].includes(methodName)) {
        return {
          type: 'command-injection',
          category: 'child-process',
          riskLevel: 'CRITICAL',
          confidence: 0.95,
          dangerousParameterIndex: 0
        };
      }
    }

    return null;
  }

  /**
   * ノードの位置情報を取得
   */
  private getNodeLocation(node: ts.Node): TaintSink['location'] {
    if (!this.sourceFile) {
      return { file: 'unknown', line: 0, column: 0, length: 0 };
    }

    const sourceFile = this.sourceFile;
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      file: sourceFile.fileName,
      line: start.line + 1, // 1-based line numbers
      column: start.character + 1, // 1-based column numbers
      length: node.getEnd() - node.getStart(sourceFile)
    };
  }

  /**
   * 重複するSinkを排除
   */
  private removeDuplicateSinks(sinks: TaintSink[]): TaintSink[] {
    const seen = new Map<string, TaintSink>();
    
    for (const sink of sinks) {
      // ユニークキーを作成（位置 + 関数呼び出し）
      const key = `${sink.location.file}:${sink.location.line}:${sink.location.column}:${sink.dangerousFunction.functionName}:${sink.dangerousFunction.objectName || ''}`;
      
      if (!seen.has(key)) {
        seen.set(key, sink);
      }
    }
    
    return Array.from(seen.values());
  }
}