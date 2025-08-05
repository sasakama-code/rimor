/**
 * TypeScript Analyzer Interface
 * v0.9.0 Phase 2 - TypeScript Compiler APIを使用した意味解析
 */

import * as ts from 'typescript';

/**
 * 型情報
 */
export interface TypeInfo {
  /**
   * 型の名前
   */
  typeName: string;
  
  /**
   * プリミティブ型かどうか
   */
  isPrimitive: boolean;
  
  /**
   * ジェネリック型の場合の型引数
   */
  typeArguments?: TypeInfo[];
  
  /**
   * ユニオン型の場合の構成型
   */
  unionTypes?: TypeInfo[];
  
  /**
   * 関数型の場合のシグネチャ
   */
  functionSignature?: {
    parameters: TypeInfo[];
    returnType: TypeInfo;
  };
}

/**
 * 呼び出しグラフのノード
 */
export interface CallGraphNode {
  /**
   * 関数/メソッド名
   */
  name: string;
  
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * この関数が呼び出す関数
   */
  calls: CallGraphNode[];
  
  /**
   * この関数を呼び出す関数
   */
  calledBy: CallGraphNode[];
}

/**
 * モック情報
 */
export interface MockInfo {
  /**
   * モックされているモジュール/関数
   */
  mockedTarget: string;
  
  /**
   * モックのタイプ（jest.mock, sinon.stub等）
   */
  mockType: 'jest.mock' | 'jest.fn' | 'sinon.stub' | 'other';
  
  /**
   * モックの実装があるかどうか
   */
  hasImplementation: boolean;
  
  /**
   * モックの場所
   */
  location: {
    file: string;
    line: number;
  };
}

/**
 * 実行パス
 */
export interface ExecutionPath {
  /**
   * パスのID
   */
  id: string;
  
  /**
   * パスの開始点
   */
  start: CallGraphNode;
  
  /**
   * パスの終了点
   */
  end: CallGraphNode;
  
  /**
   * 経由するノード
   */
  nodes: CallGraphNode[];
  
  /**
   * 条件分岐
   */
  conditions: string[];
  
  /**
   * このパスがテストされているか
   */
  isTested: boolean;
}

/**
 * TypeScript Compiler APIを使用した解析器のインターフェース
 */
export interface ITypeScriptAnalyzer {
  /**
   * TypeScriptプロジェクトを初期化
   */
  initialize(configPath: string): Promise<void>;
  
  /**
   * ファイルの型情報を取得
   */
  getTypeInfo(filePath: string, position: number): Promise<TypeInfo | undefined>;
  
  /**
   * 関数/メソッドの呼び出しグラフを構築
   */
  buildCallGraph(filePath: string): Promise<CallGraphNode[]>;
  
  /**
   * モックの使用状況を検出
   */
  detectMocks(filePath: string): Promise<MockInfo[]>;
  
  /**
   * 実行パスを解析
   */
  analyzeExecutionPaths(filePath: string): Promise<ExecutionPath[]>;
  
  /**
   * 型の互換性をチェック
   */
  checkTypeCompatibility(expected: TypeInfo, actual: TypeInfo): boolean;
  
  /**
   * 未使用のエクスポートを検出
   */
  findUnusedExports(filePath: string): Promise<string[]>;
}