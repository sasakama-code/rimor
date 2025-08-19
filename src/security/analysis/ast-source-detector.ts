/**
 * TypeScript AST を使用したTaint Source検出器
 * arXiv:2504.18529v2の理論に基づいた実装
 * 
 * Source検出の目的:
 * - untrusted dataの入り口となるAPI呼び出しを特定
 * - ファイル位置情報（行・列）を正確に記録
 * - データフロー解析の起点として活用
 */

import * as ts from 'typescript';
import * as path from 'path';

/**
 * Taint Source の情報
 */
export interface TaintSource {
  /** 汚染源のタイプ */
  type: 'user-input' | 'network-input' | 'file-input' | 'environment' | 'database';
  /** 汚染源の詳細カテゴリ */
  category: string;
  /** ソースの場所 */
  location: {
    file: string;
    line: number;
    column: number;
    length: number;
  };
  /** 汚染されるデータの変数名またはプロパティ */
  variableName: string;
  /** API呼び出し詳細 */
  apiCall: {
    functionName: string;
    objectName?: string;
    arguments: string[];
  };
  /** 信頼度スコア */
  confidence: number;
}

/**
 * TypeScript AST ベースのSource検出器
 */
export class ASTSourceDetector {
  private sourceFile: ts.SourceFile | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private program: ts.Program | null = null;

  constructor() {}

  /**
   * ソースコードを解析してTaint Sourceを検出
   * @param sourceCode TypeScriptソースコード
   * @param fileName ファイル名
   * @returns 検出されたTaint Sourceのリスト
   */
  async detectSources(sourceCode: string, fileName: string): Promise<TaintSource[]> {
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

    const sources: TaintSource[] = [];
    
    // AST をトラバースしてSource を検出
    this.visitNode(this.sourceFile, sources);

    // 重複を排除（同じ位置とAPIコールの組み合わせは削除）
    return this.removeDuplicateSources(sources);
  }

  /**
   * AST ノードを再帰的に訪問
   * @param node 現在のノード
   * @param sources 検出されたSourceの蓄積用配列
   */
  private visitNode(node: ts.Node, sources: TaintSource[]): void {
    // 関数宣言の検査（JSDocアノテーション付きパラメーター検出）
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      this.analyzeFunctionDeclaration(node, sources);
    }

    // 関数呼び出しの検査
    if (ts.isCallExpression(node)) {
      this.analyzeCallExpression(node, sources);
    }

    // プロパティアクセスの検査（最外側のプロパティアクセスのみ処理）
    if (ts.isPropertyAccessExpression(node)) {
      // 親がプロパティアクセスかどうかチェック
      const hasPropertyAccessParent = ts.isPropertyAccessExpression(node.parent);
      
      if (!hasPropertyAccessParent) {
        // 最外側のプロパティアクセスなので解析
        this.analyzePropertyAccess(node, sources);
      }
    }

    // 要素アクセス式の検査（obj['prop']）
    if (ts.isElementAccessExpression(node)) {
      this.analyzeElementAccess(node, sources);
    }

    // 変数宣言の検査
    if (ts.isVariableDeclaration(node)) {
      this.analyzeVariableDeclaration(node, sources);
    }

    // 子ノードも再帰的に訪問
    ts.forEachChild(node, (child) => this.visitNode(child, sources));
  }

  /**
   * 関数呼び出し式の解析
   */
  private analyzeCallExpression(node: ts.CallExpression, sources: TaintSource[]): void {
    if (!this.sourceFile) return;

    const functionName = this.extractFunctionName(node);
    const objectName = this.extractObjectName(node);
    
    // 既知のTaint Source API をチェック
    const sourceInfo = this.identifyTaintSource(functionName, objectName);
    if (sourceInfo) {
      const location = this.getNodeLocation(node);
      const args = node.arguments.map(arg => arg.getText(this.sourceFile!));
      
      sources.push({
        type: sourceInfo.type,
        category: sourceInfo.category,
        location,
        variableName: this.extractTargetVariable(node),
        apiCall: {
          functionName,
          objectName,
          arguments: args
        },
        confidence: sourceInfo.confidence
      });
    }
  }

  /**
   * プロパティアクセス式の解析
   */
  private analyzePropertyAccess(node: ts.PropertyAccessExpression, sources: TaintSource[]): void {
    if (!this.sourceFile) return;

    // 全体のプロパティチェーンを取得 (例: req.query.id -> "req.query")
    const fullPropertyChain = this.getFullPropertyChain(node);
    
    // Express.js リクエストオブジェクトのプロパティをチェック
    for (const [objectName, propertyName] of this.parsePropertyChain(fullPropertyChain)) {
      const requestSourceInfo = this.identifyRequestObjectProperty(objectName, propertyName);
      if (requestSourceInfo) {
        const location = this.getNodeLocation(node);
        
        sources.push({
          type: requestSourceInfo.type,
          category: requestSourceInfo.category,
          location,
          variableName: this.extractTargetVariableFromProperty(node),
          apiCall: {
            functionName: propertyName,
            objectName,
            arguments: []
          },
          confidence: requestSourceInfo.confidence
        });
        return; // 一致したら終了
      }
    }
    
    // その他のTaint Source プロパティをチェック
    const propertyName = node.name.text;
    const objectName = node.expression.getText(this.sourceFile);
    
    const sourceInfo = this.identifyTaintSourceProperty(objectName, propertyName);
    if (sourceInfo) {
      const location = this.getNodeLocation(node);
      
      sources.push({
        type: sourceInfo.type,
        category: sourceInfo.category,
        location,
        variableName: this.extractTargetVariableFromProperty(node),
        apiCall: {
          functionName: propertyName,
          objectName,
          arguments: []
        },
        confidence: sourceInfo.confidence
      });
    }
  }

  /**
   * 要素アクセス式の解析（obj['prop']）
   */
  private analyzeElementAccess(node: ts.ElementAccessExpression, sources: TaintSource[]): void {
    if (!this.sourceFile) return;

    const objectName = node.expression.getText(this.sourceFile);
    
    // プロパティ名を抽出（文字列リテラルから）
    let propertyName = '';
    if (node.argumentExpression && ts.isStringLiteral(node.argumentExpression)) {
      propertyName = node.argumentExpression.text;
    } else if (node.argumentExpression) {
      propertyName = node.argumentExpression.getText(this.sourceFile);
    }

    // Express.js リクエストオブジェクトのプロパティをチェック
    const requestSourceInfo = this.identifyRequestObjectProperty(objectName, propertyName);
    if (requestSourceInfo) {
      const location = this.getNodeLocation(node);
      
      sources.push({
        type: requestSourceInfo.type,
        category: requestSourceInfo.category,
        location,
        variableName: this.extractTargetVariableFromElementAccess(node),
        apiCall: {
          functionName: propertyName,
          objectName,
          arguments: []
        },
        confidence: requestSourceInfo.confidence
      });
      return;
    }

    // その他のTaint Source プロパティをチェック
    const sourceInfo = this.identifyTaintSourceProperty(objectName, propertyName);
    if (sourceInfo) {
      const location = this.getNodeLocation(node);
      
      sources.push({
        type: sourceInfo.type,
        category: sourceInfo.category,
        location,
        variableName: this.extractTargetVariableFromElementAccess(node),
        apiCall: {
          functionName: propertyName,
          objectName,
          arguments: []
        },
        confidence: sourceInfo.confidence
      });
    }
  }

  /**
   * 変数宣言の解析
   */
  private analyzeVariableDeclaration(node: ts.VariableDeclaration, sources: TaintSource[]): void {
    if (!node.initializer) return;
    
    // 初期化式がTaint Source APIの場合
    if (ts.isCallExpression(node.initializer)) {
      this.analyzeCallExpression(node.initializer, sources);
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
   * Taint Sourceの特定
   */
  private identifyTaintSource(functionName: string, objectName?: string): {
    type: TaintSource['type'];
    category: string;
    confidence: number;
  } | null {
    // Express.js のリクエストオブジェクト
    if (objectName === 'req' || objectName === 'request') {
      switch (functionName) {
        case 'query':
        case 'params':
        case 'body':
          return { type: 'user-input', category: 'http-request', confidence: 0.95 };
        case 'headers':
          return { type: 'user-input', category: 'http-headers', confidence: 0.90 };
        case 'cookies':
          return { type: 'user-input', category: 'http-cookies', confidence: 0.85 };
      }
    }

    // ファイルシステム操作（戻り値としてはsource、引数としてはsink）
    if (objectName === 'fs' && ['readFile', 'readFileSync', 'readdir', 'readdirSync', 'createReadStream'].includes(functionName)) {
      return { type: 'file-input', category: 'filesystem', confidence: 0.80 };
    }
    
    // 名前空間なしのファイルシステム関数（import { readFile } from 'fs'）
    if (!objectName && ['readFile', 'readFileSync', 'readdir', 'readdirSync'].includes(functionName)) {
      return { type: 'file-input', category: 'filesystem', confidence: 0.75 };
    }

    // HTTP クライアント
    if (functionName === 'fetch' || functionName === 'request' || functionName === 'axios') {
      return { type: 'network-input', category: 'http-client', confidence: 0.85 };
    }

    // axios メソッド
    if (objectName === 'axios' && ['get', 'post', 'put', 'delete', 'patch', 'request'].includes(functionName)) {
      return { type: 'network-input', category: 'http-client', confidence: 0.85 };
    }

    // 環境変数
    if (objectName === 'process.env' || functionName === 'getenv') {
      return { type: 'environment', category: 'env-variables', confidence: 0.75 };
    }

    // ユーザー入力関数（テスト用）
    if (functionName === 'getUserInput' || functionName === 'getInput' || functionName === 'readUserInput') {
      return { type: 'user-input', category: 'test-input', confidence: 0.90 };
    }

    // データベース操作（これらはSinkであってSourceではない）
    // 削除: query, executeは危険な関数呼び出しであり、汚染源ではない

    return null;
  }

  /**
   * Express.js リクエストオブジェクトの特定
   */
  private identifyRequestObjectProperty(objectName: string, propertyName: string): {
    type: TaintSource['type'];
    category: string;
    confidence: number;
  } | null {
    // Express.js のリクエストオブジェクト
    if (objectName === 'req' || objectName === 'request') {
      switch (propertyName) {
        case 'query':
        case 'params':
        case 'body':
          return { type: 'user-input', category: 'http-request', confidence: 0.95 };
        case 'headers':
          return { type: 'user-input', category: 'http-headers', confidence: 0.90 };
        case 'cookies':
          return { type: 'user-input', category: 'http-cookies', confidence: 0.85 };
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * プロパティベースのTaint Source特定
   */
  private identifyTaintSourceProperty(objectName: string, propertyName: string): {
    type: TaintSource['type'];
    category: string;
    confidence: number;
  } | null {
    // window.location 系
    if (objectName === 'window.location' || objectName === 'location') {
      return { type: 'user-input', category: 'browser-location', confidence: 0.90 };
    }

    // document プロパティ
    if (objectName === 'document') {
      if (propertyName === 'URL' || propertyName === 'referrer') {
        return { type: 'user-input', category: 'browser-document', confidence: 0.85 };
      }
    }

    // process.env プロパティ
    if (objectName === 'process.env' || objectName.endsWith('.env')) {
      return { type: 'environment', category: 'env-variables', confidence: 0.75 };
    }

    return null;
  }

  /**
   * ノードの位置情報を取得
   */
  private getNodeLocation(node: ts.Node): TaintSource['location'] {
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
   * プロパティチェーン全体を取得
   * 例: req.query.id -> "req.query.id"
   */
  private getFullPropertyChain(node: ts.PropertyAccessExpression): string {
    if (!this.sourceFile) return 'unknown';
    return node.getText(this.sourceFile);
  }

  /**
   * プロパティチェーンを解析して (オブジェクト, プロパティ) ペアを取得
   * 例: "req.query.id" -> [["req", "query"], ["req.query", "id"]]
   */
  private parsePropertyChain(propertyChain: string): Array<[string, string]> {
    const parts = propertyChain.split('.');
    const pairs: Array<[string, string]> = [];
    
    // 各レベルで (親オブジェクト, プロパティ) ペアを作成
    for (let i = 1; i < parts.length; i++) {
      const objectName = parts.slice(0, i).join('.');
      const propertyName = parts[i];
      pairs.push([objectName, propertyName]);
    }
    
    return pairs;
  }

  /**
   * 対象変数名の抽出（代入先など）
   */
  private extractTargetVariable(node: ts.CallExpression): string {
    if (!this.sourceFile) return 'unknown';

    // 親ノードを辿って代入先を探す
    let parent = node.parent;
    
    if (parent && ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }

    if (parent && ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      return parent.left.getText(this.sourceFile);
    }

    return 'temp';
  }

  /**
   * プロパティアクセスの対象変数名抽出
   */
  private extractTargetVariableFromProperty(node: ts.PropertyAccessExpression): string {
    if (!this.sourceFile) return 'unknown';

    // 親ノードを辿って使用コンテキストを探す
    let parent = node.parent;
    
    if (parent && ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }

    return node.name.text;
  }

  /**
   * 要素アクセスの対象変数名抽出
   */
  private extractTargetVariableFromElementAccess(node: ts.ElementAccessExpression): string {
    if (!this.sourceFile) return 'unknown';

    // 親ノードを辿って使用コンテキストを探す
    let parent = node.parent;
    
    if (parent && ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }

    // プロパティ名を使用
    if (node.argumentExpression && ts.isStringLiteral(node.argumentExpression)) {
      return node.argumentExpression.text;
    }

    return 'temp';
  }

  /**
   * 関数宣言の解析（JSDocアノテーション付きパラメーター検出）
   */
  private analyzeFunctionDeclaration(
    node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
    sources: TaintSource[]
  ): void {
    if (!this.sourceFile) return;

    // 関数のパラメーターをチェック
    const parameters = node.parameters;
    
    for (const param of parameters) {
      if (ts.isIdentifier(param.name)) {
        const paramName = param.name.text;
        
        // JSDocアノテーションをチェック
        const taintType = this.extractTaintTypeFromJSDoc(node, paramName);
        
        if (taintType === 'tainted') {
          const location = this.getNodeLocation(param);
          
          sources.push({
            type: 'user-input',
            category: 'tainted-parameter',
            location,
            variableName: paramName,
            apiCall: {
              functionName: paramName,
              objectName: 'parameter',
              arguments: []
            },
            confidence: 0.9
          });
        }
      }
    }
  }

  /**
   * JSDocからtaint typeを抽出
   */
  private extractTaintTypeFromJSDoc(
    functionNode: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
    paramName: string
  ): 'tainted' | 'untainted' | null {
    // TypeScript Compiler APIを使用してJSDocタグを取得
    const jsDocTags = ts.getJSDocTags(functionNode);
    
    for (const tag of jsDocTags) {
      if (ts.isJSDocParameterTag(tag) && tag.name && ts.isIdentifier(tag.name) && tag.name.text === paramName) {
        const comment = tag.comment;
        if (typeof comment === 'string') {
          if (comment.includes('@tainted')) {
            return 'tainted';
          } else if (comment.includes('@untainted')) {
            return 'untainted';
          }
        }
      }
    }
    
    // フォールバック: 関数全体のテキストから検索
    const fullText = functionNode.getFullText();
    const patterns = [
      new RegExp(`@param\\s+${paramName}\\s+@tainted`, 'i'),
      new RegExp(`@param\\s+${paramName}\\s+@untainted`, 'i'),
      new RegExp(`\\*\\s+@param\\s+${paramName}\\s+@tainted`, 'i'),
      new RegExp(`\\*\\s+@param\\s+${paramName}\\s+@untainted`, 'i')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (pattern.test(fullText)) {
        return i % 2 === 0 ? 'tainted' : 'untainted';
      }
    }
    
    return null;
  }

  /**
   * 重複するSourceを排除
   */
  private removeDuplicateSources(sources: TaintSource[]): TaintSource[] {
    const seen = new Map<string, TaintSource>();
    
    for (const source of sources) {
      // ユニークキーを作成（位置 + APIコール）
      const key = `${source.location.file}:${source.location.line}:${source.location.column}:${source.apiCall.functionName}:${source.apiCall.objectName || ''}`;
      
      if (!seen.has(key)) {
        seen.set(key, source);
      }
    }
    
    return Array.from(seen.values());
  }
}