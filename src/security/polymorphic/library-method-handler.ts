/**
 * ポリモーフィック汚染処理
 * arXiv:2504.18529v2 Section 3.3の実装
 * 
 * ライブラリメソッドの汚染伝播を多相的に処理し、
 * 未アノテーションのメソッドに対して適切な型推論を行う
 */

import { TaintQualifier } from '../types/checker-framework-types';

/**
 * 汚染伝播ルール
 */
export type TaintPropagationRule = 'any' | 'all' | 'none';

/**
 * メソッドシグネチャ
 */
export interface MethodSignature {
  className: string;
  methodName: string;
  isPolymorphic: boolean;
  parameterIndices: number[];
  propagationRule: TaintPropagationRule;
  returnQualifier: TaintQualifier | null;
}

/**
 * ライブラリメソッドハンドラー
 */
export class LibraryMethodHandler {
  private methodDatabase: Map<string, MethodSignature>;
  private unknownMethodBehavior: 'conservative' | 'optimistic' = 'conservative';
  
  constructor() {
    this.methodDatabase = new Map();
    this.initializeBuiltinMethods();
  }
  
  /**
   * 組み込みメソッドの初期化
   */
  private initializeBuiltinMethods(): void {
    // String.prototype メソッド
    const stringMethods = ['toUpperCase', 'toLowerCase', 'trim', 'substring', 'slice'];
    stringMethods.forEach(method => {
      this.methodDatabase.set(`String.${method}`, {
        className: 'String',
        methodName: method,
        isPolymorphic: true,
        parameterIndices: [],
        propagationRule: 'any',
        returnQualifier: null
      });
    });
    
    // Array メソッド
    const arrayPolyMethods = ['map', 'filter', 'reduce'];
    arrayPolyMethods.forEach(method => {
      this.methodDatabase.set(`Array.${method}`, {
        className: 'Array',
        methodName: method,
        isPolymorphic: true,
        parameterIndices: [0],
        propagationRule: 'any',
        returnQualifier: null
      });
    });
    
    // Object.keys は常に安全
    this.methodDatabase.set('Object.keys', {
      className: 'Object',
      methodName: 'keys',
      isPolymorphic: false,
      parameterIndices: [],
      propagationRule: 'none',
      returnQualifier: '@Untainted'
    });
  }
  
  /**
   * メソッドシグネチャの取得
   */
  getMethodSignature(className: string, methodName: string): MethodSignature | undefined {
    return this.methodDatabase.get(`${className}.${methodName}`);
  }
  
  /**
   * カスタムライブラリメソッドの登録
   */
  registerLibraryMethod(signature: MethodSignature): void {
    const key = `${signature.className}.${signature.methodName}`;
    this.methodDatabase.set(key, signature);
  }
  
  /**
   * 汚染伝播の計算
   */
  propagateTaint(
    className: string,
    methodName: string,
    receiverTaint: TaintQualifier,
    parameterTaints: TaintQualifier[]
  ): TaintQualifier {
    const signature = this.getMethodSignature(className, methodName);
    
    if (!signature) {
      // 未知のメソッド
      return this.handleUnknownMethod(receiverTaint);
    }
    
    // 固定の戻り値型がある場合
    if (signature.returnQualifier) {
      return signature.returnQualifier;
    }
    
    // ポリモーフィックでない場合
    if (!signature.isPolymorphic) {
      return '@Tainted'; // 保守的
    }
    
    // 伝播ルールに基づく処理
    switch (signature.propagationRule) {
      case 'any':
        // レシーバーまたは指定パラメータのいずれかが汚染されていれば汚染
        if (receiverTaint === '@Tainted') return '@Tainted';
        for (const idx of signature.parameterIndices) {
          if (parameterTaints[idx] === '@Tainted') return '@Tainted';
        }
        return '@Untainted';
        
      case 'all':
        // すべてが汚染されている場合のみ汚染
        // レシーバーが汚染されていない場合は@Untainted
        if (receiverTaint !== '@Tainted') return '@Untainted';
        // いずれかのパラメータが汚染されていない場合は@Untainted
        for (const idx of signature.parameterIndices) {
          if (parameterTaints[idx] !== '@Tainted') return '@Untainted';
        }
        // レシーバーも全パラメータも汚染されている
        return '@Tainted';
        
      case 'none':
        return '@Untainted';
        
      default:
        return receiverTaint;
    }
  }
  
  /**
   * 未知のメソッドの処理
   */
  private handleUnknownMethod(receiverTaint: TaintQualifier): TaintQualifier {
    if (this.unknownMethodBehavior === 'conservative') {
      return '@Tainted';
    } else {
      return receiverTaint;
    }
  }
  
  /**
   * 未知のメソッドの振る舞いを設定
   */
  setUnknownMethodBehavior(behavior: 'conservative' | 'optimistic'): void {
    this.unknownMethodBehavior = behavior;
  }
}

/**
 * ジェネリック型の汚染ハンドラー
 */
export class GenericTaintHandler {
  private genericMethods: Map<string, any> = new Map();
  
  /**
   * ジェネリックメソッドの登録
   */
  registerGenericMethod(signature: any): void {
    const key = `${signature.className}.${signature.methodName}`;
    this.genericMethods.set(key, signature);
  }
  
  /**
   * 配列要素の汚染取得
   */
  getArrayElementTaint(arrayTaint: TaintQualifier): TaintQualifier {
    return arrayTaint;
  }
  
  /**
   * Map の汚染取得
   */
  getMapTaint(keyTaint: TaintQualifier, valueTaint: TaintQualifier): {
    keyTaint: TaintQualifier;
    valueTaint: TaintQualifier;
  } {
    return { keyTaint, valueTaint };
  }
  
  /**
   * Set要素の汚染取得
   */
  getSetElementTaint(elementTaint: TaintQualifier): TaintQualifier {
    return elementTaint;
  }
  
  /**
   * Promise の汚染取得
   */
  getPromiseTaint(resolvedTaint: TaintQualifier): TaintQualifier {
    return resolvedTaint;
  }
  
  /**
   * Promise チェーンの伝播
   */
  propagatePromiseChain(
    initialTaint: TaintQualifier,
    methods: string[]
  ): TaintQualifier {
    // 簡易実装：初期の汚染を保持
    return initialTaint;
  }
  
  /**
   * 高階関数の解析
   */
  analyzeHigherOrderFunction(
    functionType: string,
    inputTaint: TaintQualifier
  ): TaintQualifier {
    // 簡易実装
    if (functionType.includes('@Untainted')) {
      return '@Untainted';
    }
    return inputTaint;
  }
  
  /**
   * カリー化関数の解析
   */
  analyzeCurriedFunction(
    paramTaints: TaintQualifier[],
    resultTaint: TaintQualifier
  ): {
    partial: (index: number) => TaintQualifier;
    final: () => TaintQualifier;
  } {
    return {
      partial: (index: number) => paramTaints[index] || '@Tainted',
      final: () => resultTaint
    };
  }
}

/**
 * ポリモーフィック汚染伝播器
 */
export class PolymorphicTaintPropagator {
  private libraryHandler: LibraryMethodHandler;
  
  constructor() {
    this.libraryHandler = new LibraryMethodHandler();
  }
  
  /**
   * メソッドチェーンの伝播
   */
  propagateChain(
    className: string,
    chain: Array<{
      method: string;
      receiver: TaintQualifier | null;
      args: TaintQualifier[];
    }>
  ): TaintQualifier {
    let currentTaint: TaintQualifier = '@Untainted';
    
    for (const call of chain) {
      const receiverTaint = call.receiver || currentTaint;
      currentTaint = this.libraryHandler.propagateTaint(
        className,
        call.method,
        receiverTaint,
        call.args
      );
    }
    
    return currentTaint;
  }
  
  /**
   * ネストしたメソッド呼び出しの解析
   */
  analyzeNestedCall(config: {
    outer: {
      className: string;
      method: string;
      receiver: TaintQualifier;
      args: (TaintQualifier | null)[];
    };
    inner: {
      className: string;
      method: string;
      receiver: TaintQualifier;
      args: TaintQualifier[];
    };
    innerPosition: number;
  }): TaintQualifier {
    // 内側の呼び出しを評価
    const innerResult = this.libraryHandler.propagateTaint(
      config.inner.className,
      config.inner.method,
      config.inner.receiver,
      config.inner.args
    );
    
    // 外側の引数に適用
    const outerArgs = [...config.outer.args];
    outerArgs[config.innerPosition] = innerResult;
    
    // 外側の呼び出しを評価
    return this.libraryHandler.propagateTaint(
      config.outer.className,
      config.outer.method,
      config.outer.receiver,
      outerArgs as TaintQualifier[]
    );
  }
  
  /**
   * 条件式の汚染解析
   */
  analyzeConditional(
    condition: TaintQualifier,
    trueBranch: TaintQualifier,
    falseBranch: TaintQualifier
  ): TaintQualifier {
    // 保守的：いずれかのブランチが汚染されていれば汚染
    if (trueBranch === '@Tainted' || falseBranch === '@Tainted') {
      return '@Tainted';
    }
    return '@Untainted';
  }
  
  /**
   * ライブラリパターンの解析
   */
  analyzeLibraryPattern(
    library: string,
    config: {
      pattern: string;
      initialTaint: TaintQualifier;
    }
  ): TaintQualifier {
    // 簡易実装
    if (library === 'jquery') {
      return config.initialTaint; // jQuery は汚染を保持
    } else if (library === 'lodash' && config.pattern.includes('escape')) {
      return '@Untainted'; // escape はサニタイズ
    }
    return config.initialTaint;
  }
}

/**
 * ライブラリメソッドデータベース
 */
export class LibraryMethodDatabase {
  private libraries: Map<string, any> = new Map();
  
  constructor() {
    this.initializeBuiltins();
  }
  
  private initializeBuiltins(): void {
    this.libraries.set('JavaScript', {});
    this.libraries.set('Node.js', {});
  }
  
  /**
   * 組み込みライブラリの取得
   */
  getBuiltinLibraries(): string[] {
    return Array.from(this.libraries.keys());
  }
  
  /**
   * ライブラリ定義のインポート
   */
  importLibraryDefinition(definition: {
    libraryName: string;
    version: string;
    methods: MethodSignature[];
  }): void {
    this.libraries.set(definition.libraryName, definition);
  }
  
  /**
   * メソッドの検索
   */
  lookupMethod(
    libraryName: string,
    className: string,
    methodName: string
  ): MethodSignature | undefined {
    const library = this.libraries.get(libraryName);
    if (!library || !library.methods) return undefined;
    
    return library.methods.find((m: MethodSignature) => 
      m.className === className && m.methodName === methodName
    );
  }
}