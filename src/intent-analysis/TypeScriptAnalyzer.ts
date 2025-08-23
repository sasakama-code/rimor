/**
 * TypeScript Analyzer
 * v0.9.0 Phase 2 - TypeScript Compiler APIを使用した意味解析
 * TDD Green Phase - テストを通す最小限の実装
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {
  ITypeScriptAnalyzer,
  TypeInfo,
  CallGraphNode,
  MockInfo,
  ExecutionPath
} from './ITypeScriptAnalyzer';

/**
 * TypeScript Compiler APIを使用した解析器
 * KISS原則: 最初はシンプルな実装から開始
 */
export class TypeScriptAnalyzer implements ITypeScriptAnalyzer {
  private program?: ts.Program;
  private checker?: ts.TypeChecker;
  private initialized = false;
  
  /**
   * 初期化状態を確認
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * TypeScriptプロジェクトを初期化
   * YAGNI原則: 必要最小限の設定のみ
   */
  async initialize(configPath: string): Promise<void> {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(`設定ファイルの読み込みエラー: ${configFile.error.messageText}`);
    }
    
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );
    
    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    this.checker = this.program.getTypeChecker();
    this.initialized = true;
  }
  
  /**
   * ファイルの型情報を取得
   * KISS原則: 基本的な型情報の取得から開始
   */
  async getTypeInfo(filePath: string, position: number): Promise<TypeInfo | undefined> {
    if (!this.program || !this.checker) {
      throw new Error('TypeScriptAnalyzerが初期化されていません');
    }
    
    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) {
      // ファイルをプログラムに追加
      const content = fs.readFileSync(filePath, 'utf-8');
      const newSourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      // 簡易的な型推論（実際の実装では再度プログラムを作成する必要があるが、ここでは簡略化）
      return this.inferTypeFromSource(newSourceFile, position);
    }
    
    const node = this.findNodeAtPosition(sourceFile, position);
    if (!node) return undefined;
    
    const type = this.checker.getTypeAtLocation(node);
    return this.convertToTypeInfo(type);
  }
  
  /**
   * 関数の呼び出しグラフを構築
   * YAGNI原則: 基本的な呼び出し関係のみ解析
   */
  async buildCallGraph(filePath: string): Promise<CallGraphNode[]> {
    if (!this.program || !this.checker) {
      throw new Error('TypeScriptAnalyzerが初期化されていません');
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    const callGraph: CallGraphNode[] = [];
    const functionNodes = new Map<string, CallGraphNode>();
    
    // 関数定義を収集
    this.visitNode(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const funcNode: CallGraphNode = {
          name: node.name.text,
          filePath,
          line: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1,
          calls: [],
          calledBy: []
        };
        functionNodes.set(node.name.text, funcNode);
        callGraph.push(funcNode);
      }
    });
    
    // 呼び出し関係を解析
    this.visitNode(sourceFile, (node) => {
      if (ts.isCallExpression(node)) {
        const callerFunc = this.findContainingFunction(node);
        if (callerFunc && ts.isFunctionDeclaration(callerFunc) && callerFunc.name) {
          const callerName = callerFunc.name.text;
          const callerNode = functionNodes.get(callerName);
          
          if (callerNode && ts.isIdentifier(node.expression)) {
            const calleeName = node.expression.text;
            const calleeNode = functionNodes.get(calleeName);
            
            if (calleeNode) {
              callerNode.calls.push(calleeNode);
              calleeNode.calledBy.push(callerNode);
            }
          }
        }
      }
    });
    
    return callGraph;
  }
  
  /**
   * モックの使用状況を検出
   * KISS原則: Jest mockの基本パターンのみ検出
   */
  async detectMocks(filePath: string): Promise<MockInfo[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    const mocks: MockInfo[] = [];
    
    this.visitNode(sourceFile, (node) => {
      // jest.mock() の検出
      if (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'jest' &&
          node.expression.name.text === 'mock' &&
          node.arguments.length > 0) {
        
        const arg = node.arguments[0];
        if (ts.isStringLiteral(arg)) {
          mocks.push({
            mockedTarget: arg.text,
            mockType: 'jest.mock',
            hasImplementation: node.arguments.length > 1,
            location: {
              file: filePath,
              line: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
            }
          });
        }
      }
      
      // jest.fn() の検出
      if (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'jest' &&
          node.expression.name.text === 'fn') {
        
        // mockReturnValueなどのチェーン呼び出しをチェック
        let hasImplementation = node.arguments.length > 0;
        
        // jest.fn()がチェーン呼び出しの一部である場合をチェック
        // 例: jest.fn().mockReturnValue(42).mockReturnValueOnce(1)
        hasImplementation = hasImplementation || this.checkMockChain(node);
        
        mocks.push({
          mockedTarget: 'anonymous',
          mockType: 'jest.fn',
          hasImplementation,
          location: {
            file: filePath,
            line: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
          }
        });
      }
    });
    
    return mocks;
  }
  
  /**
   * 実行パスを解析（未実装）
   * YAGNI原則: Phase 2の後半で実装予定
   */
  async analyzeExecutionPaths(filePath: string): Promise<ExecutionPath[]> {
    // TODO: Phase 2.3で実装
    return [];
  }
  
  /**
   * 型の互換性をチェック
   * KISS原則: 基本的な型チェックのみ
   */
  checkTypeCompatibility(expected: TypeInfo, actual: TypeInfo): boolean {
    // any型は全ての型と互換
    if (expected.typeName === 'any' || actual.typeName === 'any') {
      return true;
    }
    
    // 同じ型名なら互換
    if (expected.typeName === actual.typeName) {
      return true;
    }
    
    // TODO: より詳細な型互換性チェック
    return false;
  }
  
  /**
   * 未使用のエクスポートを検出（未実装）
   * YAGNI原則: 必要になったら実装
   */
  async findUnusedExports(filePath: string): Promise<string[]> {
    // TODO: 必要に応じて実装
    return [];
  }
  
  /**
   * ヘルパーメソッド：モックチェーンをチェック
   * DRY原則: チェーン検出ロジックの共通化
   */
  private checkMockChain(node: ts.CallExpression): boolean {
    const mockMethods = [
      'mockReturnValue', 'mockReturnValueOnce', 
      'mockImplementation', 'mockImplementationOnce',
      'mockResolvedValue', 'mockResolvedValueOnce',
      'mockRejectedValue', 'mockRejectedValueOnce'
    ];
    
    let current: ts.Node = node;
    
    // チェーンを辿る
    while (current.parent) {
      const parent = current.parent;
      
      // PropertyAccessExpressionの場合
      if (ts.isPropertyAccessExpression(parent) && parent.expression === current) {
        const grandParent = parent.parent;
        
        // CallExpressionの場合
        if (ts.isCallExpression(grandParent) && grandParent.expression === parent) {
          const methodName = parent.name.text;
          if (mockMethods.includes(methodName)) {
            return true;
          }
          // さらにチェーンが続く可能性があるので継続
          current = grandParent;
          continue;
        }
      }
      break;
    }
    
    return false;
  }
  
  /**
   * ヘルパーメソッド：ノードを訪問
   */
  private visitNode(node: ts.Node, visitor: (node: ts.Node) => void): void {
    visitor(node);
    ts.forEachChild(node, child => this.visitNode(child, visitor));
  }
  
  /**
   * ヘルパーメソッド：位置からノードを検索
   */
  private findNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node | undefined {
    function find(node: ts.Node): ts.Node | undefined {
      if (position >= node.pos && position < node.end) {
        return ts.forEachChild(node, find) || node;
      }
      return undefined;
    }
    return find(sourceFile);
  }
  
  /**
   * ヘルパーメソッド：ノードを含む関数を検索
   */
  private findContainingFunction(node: ts.Node): ts.FunctionDeclaration | undefined {
    let current = node.parent;
    while (current) {
      if (ts.isFunctionDeclaration(current)) {
        return current;
      }
      current = current.parent;
    }
    return undefined;
  }
  
  /**
   * ヘルパーメソッド：TypeScript型をTypeInfoに変換
   */
  private convertToTypeInfo(type: ts.Type): TypeInfo {
    let typeName = this.checker!.typeToString(type);
    
    // 配列型の正規化（number[] -> Array）
    if (typeName.endsWith('[]')) {
      const elementTypeName = typeName.slice(0, -2);
      return {
        typeName: 'Array',
        isPrimitive: false,
        typeArguments: [{
          typeName: elementTypeName,
          isPrimitive: ['number', 'string', 'boolean'].includes(elementTypeName)
        }]
      };
    }
    
    const isPrimitive = ['number', 'string', 'boolean', 'null', 'undefined'].includes(typeName);
    
    const typeInfo: TypeInfo = {
      typeName,
      isPrimitive
    };
    
    // 配列型の処理
    // TypeScript内部APIを使用して型引数を取得
    const typeRef = type as ts.TypeReference;
    if (type.symbol && type.symbol.name === 'Array' && typeRef.typeArguments) {
      typeInfo.typeArguments = typeRef.typeArguments.map((arg: ts.Type) => 
        this.convertToTypeInfo(arg)
      );
    }
    
    // 関数型の処理
    const signatures = type.getCallSignatures();
    if (signatures.length > 0) {
      const signature = signatures[0];
      typeInfo.functionSignature = {
        parameters: signature.parameters.map(param => {
          const paramType = this.checker!.getTypeOfSymbolAtLocation(param, param.valueDeclaration!);
          return this.convertToTypeInfo(paramType);
        }),
        returnType: this.convertToTypeInfo(signature.getReturnType())
      };
    }
    
    return typeInfo;
  }
  
  /**
   * ヘルパーメソッド：ソースから型を推論（簡易版）
   */
  private inferTypeFromSource(sourceFile: ts.SourceFile, position: number): TypeInfo | undefined {
    const node = this.findNodeAtPosition(sourceFile, position);
    if (!node) return undefined;
    
    // 変数宣言の型アノテーションから推論
    if (ts.isVariableDeclaration(node.parent) && node.parent.type) {
      const typeNode = node.parent.type;
      return this.typeNodeToTypeInfo(typeNode);
    }
    
    // 関数宣言から推論
    if (ts.isFunctionDeclaration(node)) {
      const params = node.parameters.map(p => 
        p.type ? this.typeNodeToTypeInfo(p.type) : { typeName: 'any', isPrimitive: false }
      );
      const returnType = node.type 
        ? this.typeNodeToTypeInfo(node.type)
        : { typeName: 'void', isPrimitive: true };
        
      return {
        typeName: 'function',
        isPrimitive: false,
        functionSignature: {
          parameters: params,
          returnType
        }
      };
    }
    
    return undefined;
  }
  
  /**
   * ヘルパーメソッド：型ノードをTypeInfoに変換
   */
  private typeNodeToTypeInfo(typeNode: ts.TypeNode): TypeInfo {
    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      const typeName = typeNode.typeName.text;
      
      // 配列型の特別処理
      if (typeName === 'Array' && typeNode.typeArguments && typeNode.typeArguments.length > 0) {
        return {
          typeName: 'Array',
          isPrimitive: false,
          typeArguments: [this.typeNodeToTypeInfo(typeNode.typeArguments[0])]
        };
      }
      
      return {
        typeName,
        isPrimitive: ['number', 'string', 'boolean'].includes(typeName)
      };
    }
    
    if (ts.isArrayTypeNode(typeNode)) {
      return {
        typeName: 'Array',
        isPrimitive: false,
        typeArguments: [this.typeNodeToTypeInfo(typeNode.elementType)]
      };
    }
    
    // キーワード型
    switch (typeNode.kind) {
      case ts.SyntaxKind.NumberKeyword:
        return { typeName: 'number', isPrimitive: true };
      case ts.SyntaxKind.StringKeyword:
        return { typeName: 'string', isPrimitive: true };
      case ts.SyntaxKind.BooleanKeyword:
        return { typeName: 'boolean', isPrimitive: true };
      case ts.SyntaxKind.VoidKeyword:
        return { typeName: 'void', isPrimitive: true };
      case ts.SyntaxKind.AnyKeyword:
        return { typeName: 'any', isPrimitive: false };
      default:
        return { typeName: 'unknown', isPrimitive: false };
    }
  }

  /**
   * ファイルの型情報を取得
   * KISS原則: 基本的な型情報のマップを返す
   */
  async getFileTypeInfo(filePath: string): Promise<Map<string, TypeInfo>> {
    if (!this.program || !this.checker) {
      throw new Error('TypeScriptAnalyzerが初期化されていません');
    }
    
    const typeInfoMap = new Map<string, TypeInfo>();
    const sourceFile = this.program.getSourceFile(filePath);
    
    if (!sourceFile) {
      return typeInfoMap;
    }
    
    // 変数と関数の型情報を収集
    this.visitNode(sourceFile, (node) => {
      if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        const type = this.checker!.getTypeAtLocation(node);
        const typeName = this.checker!.typeToString(type);
        
        typeInfoMap.set(node.name.text, {
          typeName,
          isPrimitive: this.isPrimitiveType(type)
        });
      }
      
      if (ts.isFunctionDeclaration(node) && node.name) {
        const type = this.checker!.getTypeAtLocation(node);
        const typeName = this.checker!.typeToString(type);
        
        typeInfoMap.set(node.name.text, {
          typeName,
          isPrimitive: false
        });
      }
    });
    
    return typeInfoMap;
  }

  /**
   * ファイルの呼び出しグラフを分析
   * DRY原則: 既存のbuildCallGraphメソッドを再利用
   */
  async analyzeCallGraph(filePath: string): Promise<CallGraphNode[]> {
    return this.buildCallGraph(filePath);
  }

  /**
   * プリミティブ型かどうかを判定
   * KISS原則: 基本的な型のみチェック
   */
  private isPrimitiveType(type: ts.Type): boolean {
    const flags = type.flags;
    return !!(flags & (
      ts.TypeFlags.String |
      ts.TypeFlags.Number |
      ts.TypeFlags.Boolean |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Void
    ));
  }
}