/**
 * Checker Framework互換の型定義
 * arXiv:2504.18529v2 "Practical Type-Based Taint Checking and Inference" の実装
 * 
 * このファイルは論文で提案されている型システムをTypeScriptで実装します。
 */

import { TaintLevel } from './taint';

/**
 * 汚染修飾子の型
 * 論文のSection 2.1で定義されている型修飾子
 */
export type TaintQualifier = '@Tainted' | '@Untainted' | '@PolyTaint';

/**
 * 型クオリファイア階層
 * @Tainted が @Untainted のスーパータイプ
 */
export interface TypeQualifierHierarchy {
  '@Tainted': {
    subtypes: ['@Untainted'];
    supertypes: [];
  };
  '@Untainted': {
    subtypes: [];
    supertypes: ['@Tainted'];
  };
  '@PolyTaint': {
    subtypes: ['@Tainted', '@Untainted'];
    supertypes: ['@Tainted', '@Untainted'];
  };
}

/**
 * 汚染された型 - @Tainted
 * 攻撃者に影響される可能性のある値を表す
 */
export interface TaintedType<T> {
  readonly __brand: '@Tainted';
  readonly __value: T;
  readonly __source: string;
  readonly __confidence: number;
}

/**
 * 清浄な型 - @Untainted
 * 完全に安全で信頼できる値を表す
 */
export interface UntaintedType<T> {
  readonly __brand: '@Untainted';
  readonly __value: T;
  readonly __sanitizedBy?: string;
  readonly __validatedAt?: number;
}

/**
 * ポリモーフィック汚染型 - @PolyTaint
 * メソッドの汚染挙動が引数に依存する場合に使用
 */
export interface PolyTaintType<T> {
  readonly __brand: '@PolyTaint';
  readonly __value: T;
  readonly __parameterIndices: number[];
  readonly __propagationRule: 'any' | 'all';
}

/**
 * 型クオリファイアのユニオン型
 * 論文のFigure 1に対応
 */
export type QualifiedType<T> = TaintedType<T> | UntaintedType<T> | PolyTaintType<T>;

/**
 * 型クオリファイアのガード関数
 */
export const TypeGuards = {
  isTainted<T>(value: any): value is TaintedType<T> {
    return value && typeof value === 'object' && value.__brand === '@Tainted';
  },
  
  isUntainted<T>(value: any): value is UntaintedType<T> {
    return value && typeof value === 'object' && value.__brand === '@Untainted';
  },
  
  isPolyTaint<T>(value: any): value is PolyTaintType<T> {
    return value && typeof value === 'object' && value.__brand === '@PolyTaint';
  }
};

/**
 * 型コンストラクタ
 * 論文のSection 3で説明されている型構築
 */
export const TypeConstructors = {
  /**
   * 汚染された値を作成
   */
  tainted<T>(value: T, source: string, confidence: number = 1.0): TaintedType<T> {
    return {
      __brand: '@Tainted',
      __value: value,
      __source: source,
      __confidence: confidence
    };
  },
  
  /**
   * 清浄な値を作成
   */
  untainted<T>(value: T, sanitizedBy?: string): UntaintedType<T> {
    return {
      __brand: '@Untainted',
      __value: value,
      __sanitizedBy: sanitizedBy,
      __validatedAt: Date.now()
    };
  },
  
  /**
   * ポリモーフィック汚染値を作成
   */
  polyTaint<T>(
    value: T, 
    parameterIndices: number[] = [], 
    propagationRule: 'any' | 'all' = 'any'
  ): PolyTaintType<T> {
    return {
      __brand: '@PolyTaint',
      __value: value,
      __parameterIndices: parameterIndices,
      __propagationRule: propagationRule
    };
  }
};

/**
 * サブタイピング関係のチェック
 * 論文のSection 2.2で定義されている規則
 */
export class SubtypingChecker {
  /**
   * aがbのサブタイプかどうかをチェック
   * @Untainted <: @Tainted (untaintedはtaintedのサブタイプ)
   */
  static isSubtype(a: TaintQualifier, b: TaintQualifier): boolean {
    if (a === b) return true;
    if (a === '@Untainted' && b === '@Tainted') return true;
    if (a === '@PolyTaint') return true; // PolyTaintは文脈依存
    return false;
  }
  
  /**
   * 代入の安全性をチェック
   * 右辺が左辺のサブタイプである必要がある
   */
  static isAssignmentSafe<T>(
    lhs: QualifiedType<T>, 
    rhs: QualifiedType<T>
  ): boolean {
    // @Untainted を @Tainted に代入するのは安全
    if (TypeGuards.isUntainted(rhs) && TypeGuards.isTainted(lhs)) {
      return true;
    }
    
    // @Tainted を @Untainted に代入するのは危険
    if (TypeGuards.isTainted(rhs) && TypeGuards.isUntainted(lhs)) {
      return false;
    }
    
    // 同じ型クオリファイア同士は安全
    if (lhs.__brand === rhs.__brand) {
      return true;
    }
    
    // PolyTaintは文脈依存
    if (TypeGuards.isPolyTaint(lhs) || TypeGuards.isPolyTaint(rhs)) {
      return true; // 実行時に判定
    }
    
    return false;
  }
}

/**
 * 型の昇格・降格
 * 論文のSection 3.2で説明されている操作
 */
export class TypePromotion {
  /**
   * サニタイザーによる型の昇格
   * @Tainted -> @Untainted
   */
  static sanitize<T>(tainted: TaintedType<T>, sanitizerName: string): UntaintedType<T> {
    return TypeConstructors.untainted(tainted.__value, sanitizerName);
  }
  
  /**
   * 汚染源による型の降格
   * @Untainted -> @Tainted
   */
  static taint<T>(untainted: UntaintedType<T>, source: string): TaintedType<T> {
    return TypeConstructors.tainted(untainted.__value, source, 1.0);
  }
  
  /**
   * 条件付き昇格（検証による）
   */
  static conditionalPromote<T>(
    value: QualifiedType<T>, 
    condition: (v: T) => boolean,
    sanitizerName: string
  ): QualifiedType<T> {
    if (TypeGuards.isTainted(value) && condition(value.__value)) {
      return TypeConstructors.untainted(value.__value, sanitizerName);
    }
    return value;
  }
}

/**
 * 型の伝播規則
 * 論文のSection 3.3で定義されている規則
 */
export class TypePropagation {
  /**
   * 二項演算の結果の型を決定
   * より制限的な型（@Tainted）が優先される
   */
  static binaryOperation<T, U, R>(
    lhs: QualifiedType<T>,
    rhs: QualifiedType<U>,
    operation: (a: T, b: U) => R
  ): QualifiedType<R> {
    const result = operation(lhs.__value, rhs.__value);
    
    // どちらかが@Taintedなら結果も@Tainted
    if (TypeGuards.isTainted(lhs) || TypeGuards.isTainted(rhs)) {
      const source = TypeGuards.isTainted(lhs) ? lhs.__source : 
                    TypeGuards.isTainted(rhs) ? rhs.__source : 'unknown';
      return TypeConstructors.tainted(result, source);
    }
    
    // 両方が@Untaintedなら結果も@Untainted
    if (TypeGuards.isUntainted(lhs) && TypeGuards.isUntainted(rhs)) {
      return TypeConstructors.untainted(result);
    }
    
    // PolyTaintが含まれる場合は文脈依存
    return TypeConstructors.polyTaint(result);
  }
  
  /**
   * メソッド呼び出しの結果の型を決定
   */
  static methodCall<T, R>(
    receiver: QualifiedType<T>,
    methodName: string,
    args: QualifiedType<any>[],
    method: (...args: any[]) => R
  ): QualifiedType<R> {
    const argValues = args.map(arg => arg.__value);
    const result = method.apply(receiver.__value, argValues);
    
    // レシーバーまたは引数のいずれかが汚染されていれば結果も汚染
    const taintedInputs = [receiver, ...args].filter(TypeGuards.isTainted);
    if (taintedInputs.length > 0) {
      return TypeConstructors.tainted(result, taintedInputs[0].__source);
    }
    
    return TypeConstructors.untainted(result);
  }
}

/**
 * フロー感度の型チェック
 * 論文のSection 4で説明されている手法
 */
export class FlowSensitiveChecker {
  private typeEnvironment: Map<string, QualifiedType<any>>;
  
  constructor() {
    this.typeEnvironment = new Map();
  }
  
  /**
   * 変数の型を更新
   */
  updateType(varName: string, type: QualifiedType<any>): void {
    this.typeEnvironment.set(varName, type);
  }
  
  /**
   * 変数の現在の型を取得
   */
  getType(varName: string): QualifiedType<any> | undefined {
    return this.typeEnvironment.get(varName);
  }
  
  /**
   * 条件分岐での型の精緻化
   */
  refineType(
    varName: string, 
    condition: (value: any) => boolean,
    trueType: TaintQualifier,
    falseType: TaintQualifier
  ): void {
    const currentType = this.typeEnvironment.get(varName);
    if (!currentType) return;
    
    if (condition(currentType.__value)) {
      // 条件が真の場合の型
      if (trueType === '@Untainted') {
        this.typeEnvironment.set(
          varName, 
          TypeConstructors.untainted(currentType.__value, 'flow-refinement')
        );
      }
    } else {
      // 条件が偽の場合の型
      if (falseType === '@Tainted' && !TypeGuards.isTainted(currentType)) {
        this.typeEnvironment.set(
          varName,
          TypeConstructors.tainted(currentType.__value, 'flow-refinement')
        );
      }
    }
  }
}

/**
 * 簡便なヘルパー関数
 */
export function isTainted<T>(value: any): value is TaintedType<T> {
  return TypeGuards.isTainted(value);
}

export function isUntainted<T>(value: any): value is UntaintedType<T> {
  return TypeGuards.isUntainted(value);
}

export function sanitize<T>(value: TaintedType<T>, sanitizer: (val: T) => T): UntaintedType<T> {
  return TypeConstructors.untainted(sanitizer(value.__value), 'sanitized');
}

export function taint<T>(value: T, source: string): TaintedType<T> {
  return TypeConstructors.tainted(value, source, 1.0);
}

/**
 * 型の互換性チェック
 * 論文のSection 5で定義されている規則
 */
export class TypeCompatibility {
  /**
   * メソッドオーバーライドの安全性をチェック
   * 共変・反変の規則を適用
   */
  static isOverrideSafe(
    baseMethod: {
      params: TaintQualifier[];
      return: TaintQualifier;
    },
    overrideMethod: {
      params: TaintQualifier[];
      return: TaintQualifier;
    }
  ): boolean {
    // パラメータは反変（より一般的な型を受け入れる）
    // オーバーライドメソッドは、ベースメソッドより一般的なパラメータを受け入れる必要がある
    // つまり、base param <: override param でなければならない
    for (let i = 0; i < baseMethod.params.length; i++) {
      if (!SubtypingChecker.isSubtype(baseMethod.params[i], overrideMethod.params[i])) {
        return false;
      }
    }
    
    // 戻り値は共変（より具体的な型を返す）
    // オーバーライドメソッドは、ベースメソッドより具体的な型を返す必要がある
    // つまり、override return <: base return でなければならない
    return SubtypingChecker.isSubtype(overrideMethod.return, baseMethod.return);
  }
}

/**
 * 型推論のヒント
 * 論文のSection 6で説明されている推論アルゴリズム用
 */
export interface TypeInferenceHint {
  variable: string;
  possibleTypes: TaintQualifier[];
  confidence: number;
  evidence: string[];
}

/**
 * 型制約
 * 推論アルゴリズムで使用される制約
 */
export interface TypeConstraint {
  type: 'subtype' | 'equality' | 'flow';
  lhs: string | TaintQualifier;
  rhs: string | TaintQualifier;
  location: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * ポリモーフィック型のインスタンス化
 */
export class PolyTaintInstantiation {
  /**
   * PolyTaint型を具体的な型にインスタンス化
   */
  static instantiate<T>(
    polyType: PolyTaintType<T>,
    argumentTypes: TaintQualifier[]
  ): QualifiedType<T> {
    const relevantArgs = polyType.__parameterIndices.map(i => argumentTypes[i]);
    
    if (polyType.__propagationRule === 'any') {
      // いずれかが@Taintedなら結果も@Tainted
      if (relevantArgs.some(arg => arg === '@Tainted')) {
        return TypeConstructors.tainted(polyType.__value, 'poly-instantiation');
      }
    } else {
      // すべてが@Taintedなら結果も@Tainted
      if (relevantArgs.every(arg => arg === '@Tainted')) {
        return TypeConstructors.tainted(polyType.__value, 'poly-instantiation');
      }
    }
    
    return TypeConstructors.untainted(polyType.__value, 'poly-instantiation');
  }
}

/**
 * 型エラー
 */
export class TypeQualifierError extends Error {
  constructor(
    message: string,
    public readonly expected: TaintQualifier,
    public readonly actual: TaintQualifier,
    public readonly location?: { file: string; line: number; column: number }
  ) {
    super(message);
    this.name = 'TypeQualifierError';
  }
}

/**
 * 型チェック結果
 */
export interface TypeCheckResult {
  success: boolean;
  errors: TypeQualifierError[];
  warnings: Array<{
    message: string;
    location?: { file: string; line: number; column: number };
  }>;
}