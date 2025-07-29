/**
 * Checker Framework互換の型アノテーションシステム
 * arXiv:2504.18529v2 "Practical Type-Based Taint Checking and Inference" の実装
 */

import 'reflect-metadata';

/**
 * アノテーションのメタデータキー
 */
const TAINT_METADATA_KEY = Symbol('taint');
const POLY_TAINT_METADATA_KEY = Symbol('polyTaint');
const SUPPRESS_METADATA_KEY = Symbol('suppressTaint');

/**
 * 汚染レベルの型
 */
export type TaintLevel = 'tainted' | 'untainted' | 'poly';

/**
 * @Tainted - 攻撃者に影響される可能性のある値をマーク
 * 
 * 使用例:
 * ```typescript
 * @Tainted
 * userInput: string;
 * 
 * @Tainted('user-input')
 * requestData: any;
 * ```
 */
export function Tainted(source?: string): PropertyDecorator & ParameterDecorator & MethodDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptorOrIndex?: PropertyDescriptor | number) {
    const parameterIndex = typeof descriptorOrIndex === 'number' ? descriptorOrIndex : undefined;
    const metadata = {
      level: 'tainted' as TaintLevel,
      source: source || 'unknown',
      timestamp: Date.now()
    };

    if (typeof parameterIndex === 'number') {
      // パラメータデコレータ
      const existingParams = Reflect.getMetadata(TAINT_METADATA_KEY, target, propertyKey!) || [];
      existingParams[parameterIndex] = metadata;
      Reflect.defineMetadata(TAINT_METADATA_KEY, existingParams, target, propertyKey!);
    } else if (propertyKey) {
      // プロパティまたはメソッドデコレータ
      Reflect.defineMetadata(TAINT_METADATA_KEY, metadata, target, propertyKey);
    } else {
      // クラスデコレータ
      Reflect.defineMetadata(TAINT_METADATA_KEY, metadata, target);
    }
  };
}

/**
 * @Untainted - 安全で信頼できる値をマーク
 * 
 * 使用例:
 * ```typescript
 * @Untainted
 * sanitizedData: string;
 * 
 * @Untainted('validated')
 * validatedInput: string;
 * ```
 */
export function Untainted(reason?: string): PropertyDecorator & ParameterDecorator & MethodDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptorOrIndex?: PropertyDescriptor | number) {
    const parameterIndex = typeof descriptorOrIndex === 'number' ? descriptorOrIndex : undefined;
    const metadata = {
      level: 'untainted' as TaintLevel,
      reason: reason || 'safe',
      timestamp: Date.now()
    };

    if (typeof parameterIndex === 'number') {
      // パラメータデコレータ
      const existingParams = Reflect.getMetadata(TAINT_METADATA_KEY, target, propertyKey!) || [];
      existingParams[parameterIndex] = metadata;
      Reflect.defineMetadata(TAINT_METADATA_KEY, existingParams, target, propertyKey!);
    } else if (propertyKey) {
      // プロパティまたはメソッドデコレータ
      Reflect.defineMetadata(TAINT_METADATA_KEY, metadata, target, propertyKey);
    } else {
      // クラスデコレータ
      Reflect.defineMetadata(TAINT_METADATA_KEY, metadata, target);
    }
  };
}

/**
 * @PolyTaint - メソッドの汚染挙動が引数に依存することをマーク
 * 
 * 使用例:
 * ```typescript
 * @PolyTaint
 * processData(input: string): string {
 *   // 入力が汚染されていれば出力も汚染される
 *   return input.toUpperCase();
 * }
 * ```
 */
export function PolyTaint(
  config?: {
    parameterIndices?: number[];
    propagationRule?: 'any' | 'all';
  }
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const metadata = {
      level: 'poly' as TaintLevel,
      parameterIndices: config?.parameterIndices || [],
      propagationRule: config?.propagationRule || 'any',
      timestamp: Date.now()
    };

    Reflect.defineMetadata(POLY_TAINT_METADATA_KEY, metadata, target, propertyKey);

    // メソッドをラップして汚染伝播を追跡
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      // 汚染伝播のロジックは型チェッカーで実装
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * @SuppressTaintWarning - 特定の警告を抑制
 * 
 * 使用例:
 * ```typescript
 * @SuppressTaintWarning('reviewed-safe')
 * dangerousOperation(@Tainted input: string): void {
 *   // 意図的に汚染データを使用
 * }
 * ```
 */
export function SuppressTaintWarning(reason: string): MethodDecorator & PropertyDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
    const metadata = {
      suppressed: true,
      reason,
      timestamp: Date.now()
    };

    Reflect.defineMetadata(SUPPRESS_METADATA_KEY, metadata, target, propertyKey);
  };
}

/**
 * アノテーション情報を取得するユーティリティ
 */
export class TaintAnnotationReader {
  /**
   * プロパティまたはメソッドの汚染情報を取得
   */
  static getTaintMetadata(target: any, propertyKey: string | symbol): any {
    return Reflect.getMetadata(TAINT_METADATA_KEY, target, propertyKey);
  }

  /**
   * パラメータの汚染情報を取得
   */
  static getParameterTaintMetadata(target: any, propertyKey: string | symbol): any[] {
    return Reflect.getMetadata(TAINT_METADATA_KEY, target, propertyKey) || [];
  }

  /**
   * PolyTaint情報を取得
   */
  static getPolyTaintMetadata(target: any, propertyKey: string | symbol): any {
    return Reflect.getMetadata(POLY_TAINT_METADATA_KEY, target, propertyKey);
  }

  /**
   * 警告抑制情報を取得
   */
  static getSuppressMetadata(target: any, propertyKey: string | symbol): any {
    return Reflect.getMetadata(SUPPRESS_METADATA_KEY, target, propertyKey);
  }

  /**
   * クラスの全アノテーション情報を収集
   */
  static collectClassAnnotations(target: any): Map<string, any> {
    const annotations = new Map<string, any>();
    
    // クラス自体のアノテーション
    const classMetadata = Reflect.getMetadata(TAINT_METADATA_KEY, target);
    if (classMetadata) {
      annotations.set('__class__', classMetadata);
    }

    // プロパティとメソッドのアノテーション
    const prototype = target.prototype || target;
    
    // prototypeのメソッドを収集
    const propertyNames = Object.getOwnPropertyNames(prototype);
    for (const propertyName of propertyNames) {
      const taintMetadata = this.getTaintMetadata(prototype, propertyName);
      const polyMetadata = this.getPolyTaintMetadata(prototype, propertyName);
      const suppressMetadata = this.getSuppressMetadata(prototype, propertyName);
      
      if (taintMetadata || polyMetadata || suppressMetadata) {
        annotations.set(propertyName, {
          taint: taintMetadata,
          poly: polyMetadata,
          suppress: suppressMetadata
        });
      }
    }
    
    // インスタンスプロパティのアノテーションも収集
    // TypeScriptのクラスプロパティはコンストラクタで初期化されるため、
    // 一時的なインスタンスを作成してメタデータを確認
    try {
      const tempInstance = new target();
      const instancePropertyNames = Object.getOwnPropertyNames(tempInstance);
      
      for (const propertyName of instancePropertyNames) {
        // 既に収集済みの場合はスキップ
        if (annotations.has(propertyName)) continue;
        
        const taintMetadata = this.getTaintMetadata(tempInstance, propertyName);
        const polyMetadata = this.getPolyTaintMetadata(tempInstance, propertyName);
        const suppressMetadata = this.getSuppressMetadata(tempInstance, propertyName);
        
        if (taintMetadata || polyMetadata || suppressMetadata) {
          annotations.set(propertyName, {
            taint: taintMetadata,
            poly: polyMetadata,
            suppress: suppressMetadata
          });
        }
      }
    } catch (e) {
      // インスタンス作成に失敗した場合は無視
    }

    return annotations;
  }
}

/**
 * アノテーション検証ユーティリティ
 */
export class TaintAnnotationValidator {
  /**
   * アノテーションの一貫性を検証
   */
  static validateAnnotations(target: any): string[] {
    const errors: string[] = [];
    const annotations = TaintAnnotationReader.collectClassAnnotations(target);

    annotations.forEach((annotation, propertyName) => {
      // @Taintedと@Untaintedが同時に付いていないかチェック
      if (annotation.taint && annotation.taint.level === 'tainted' && 
          annotation.untainted) {
        errors.push(`Property ${propertyName} has conflicting @Tainted and @Untainted annotations`);
      }

      // @PolyTaintがメソッド以外に付いていないかチェック
      if (annotation.poly && propertyName !== '__class__') {
        const descriptor = Object.getOwnPropertyDescriptor(target.prototype || target, propertyName);
        if (!descriptor || typeof descriptor.value !== 'function') {
          errors.push(`@PolyTaint can only be applied to methods, but found on ${propertyName}`);
        }
      }
    });

    return errors;
  }
}

/**
 * デコレータファクトリ
 */
export const TaintAnnotations = {
  Tainted,
  Untainted,
  PolyTaint,
  SuppressTaintWarning
};

// TaintLevelは既にexportされているため、重複エクスポートは不要