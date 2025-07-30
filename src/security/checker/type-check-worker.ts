/**
 * 型チェックワーカー
 * 並列型チェック用のワーカースレッドスクリプト
 */

import { parentPort } from 'worker_threads';
import { TypeChecker, SubtypingChecker } from '../compatibility/checker-framework-compatibility';
import { SearchBasedInferenceEngine } from '../analysis/search-based-inference';
import { LocalInferenceOptimizer } from '../inference/local-inference-optimizer';
import {
  QualifiedType,
  TypeQualifierError,
  TypeGuards
} from '../types/checker-framework-types';
import { TaintLevelAdapter } from '../compatibility/taint-level-adapter';

interface WorkerTask {
  id: string;
  method: {
    name: string;
    content: string;
    filePath: string;
  };
  dependencies: Array<[string, any]>;
}

interface WorkerResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

// 型チェックインスタンス
const typeChecker = new TypeChecker();
const inferenceEngine = new SearchBasedInferenceEngine();
const localOptimizer = new LocalInferenceOptimizer();

/**
 * メッセージハンドラ
 */
parentPort?.on('message', async (task: WorkerTask) => {
  const startTime = Date.now();
  
  try {
    const result = await performTypeCheck(task);
    
    parentPort?.postMessage({
      id: task.id,
      success: true,
      result,
      executionTime: Date.now() - startTime
    } as WorkerResult);
    
  } catch (error) {
    parentPort?.postMessage({
      id: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    } as WorkerResult);
  }
});

/**
 * 型チェックの実行
 */
async function performTypeCheck(task: WorkerTask) {
  const startTime = Date.now();
  const errors: TypeQualifierError[] = [];
  const warnings: Array<{ message: string; location?: any }> = [];
  const inferredTypes = new Map<string, QualifiedType<any>>();
  const securityIssues: any[] = [];
  
  // 依存関係をMapに変換
  const dependencies = new Map<string, QualifiedType<any>>(
    task.dependencies.map(([key, value]) => {
      // シリアライズされたオブジェクトを適切な型に復元
      if (value && typeof value === 'object' && '__brand' in value) {
        return [key, value as QualifiedType<any>];
      }
      return [key, value];
    })
  );
  
  try {
    // ステップ1: ローカル変数の解析
    const localAnalysis = await localOptimizer.analyzeLocalVariables(
      task.method.content,
      task.method.name
    );
    
    // ステップ2: 型推論
    const inferenceState = await inferenceEngine.inferTypes(
      task.method.content,
      task.method.filePath
    );
    
    // ステップ3: 型チェック
    inferenceState.typeMap.forEach((qualifier, variable) => {
      // TaintQualifierをQualifiedTypeに変換
      const qualifiedType: QualifiedType<any> = qualifier === '@Tainted' 
        ? { __brand: '@Tainted', __value: variable, __source: 'inferred', __confidence: 1.0 } as any
        : qualifier === '@Untainted'
        ? { __brand: '@Untainted', __value: variable } as any
        : { __brand: '@PolyTaint', __value: variable, __parameterIndices: [], __propagationRule: 'any' } as any;
      
      inferredTypes.set(variable, qualifiedType);
      
      // 依存関係との整合性チェック
      const depType = dependencies.get(variable);
      if (depType) {
        const isValid = typeChecker.isAssignable(
          qualifiedType.__brand,
          depType.__brand
        );
        
        if (!isValid) {
          errors.push(new TypeQualifierError(
            `Type mismatch for ${variable}: expected ${depType.__brand}, got ${qualifiedType.__brand}`,
            depType.__brand,
            qualifiedType.__brand,
            {
              file: task.method.filePath,
              line: 0,
              column: 0
            }
          ));
        }
      }
    });
    
    // ステップ4: セキュリティ問題の検出
    analyzeSecurityIssues(
      task.method,
      inferredTypes,
      localAnalysis,
      securityIssues
    );
    
    // ステップ5: 追加の検証
    performAdditionalValidations(
      task.method,
      inferredTypes,
      warnings
    );
    
  } catch (error) {
    errors.push(new TypeQualifierError(
      `Type checking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      '@Tainted',
      '@Untainted'
    ));
  }
  
  return {
    method: task.method,
    typeCheckResult: {
      success: errors.length === 0,
      errors,
      warnings
    },
    inferredTypes: Array.from(inferredTypes.entries()),
    securityIssues,
    executionTime: Date.now() - startTime
  };
}

/**
 * セキュリティ問題の解析
 */
function analyzeSecurityIssues(
  method: any,
  inferredTypes: Map<string, QualifiedType<any>>,
  localAnalysis: any,
  issues: any[]
): void {
  // エスケープする汚染変数の検出
  if (localAnalysis.escapingVariables) {
    localAnalysis.escapingVariables.forEach((variable: string) => {
      const type = inferredTypes.get(variable);
      if (type && TypeGuards.isTainted(type)) {
        issues.push({
          id: `escape-${variable}`,
          type: 'tainted-escape',
          severity: 'high',
          message: `Tainted variable ${variable} escapes method scope`,
          location: {
            file: method.filePath,
            startLine: 0,
            endLine: 0,
            startColumn: 0,
            endColumn: 0
          }
        });
      }
    });
  }
  
  // サニタイズされていない汚染データの使用
  const content = method.content.toLowerCase();
  const dangerousSinks = ['eval', 'exec', 'query', 'innerhtml'];
  
  inferredTypes.forEach((type, variable) => {
    if (TypeGuards.isTainted(type)) {
      dangerousSinks.forEach(sink => {
        if (content.includes(`${sink}(${variable}`) || 
            content.includes(`${sink}(\`.*${variable}`)) {
          issues.push({
            id: `unsanitized-${variable}-${sink}`,
            type: 'unsanitized-taint-flow',
            severity: 'critical',
            message: `Tainted variable ${variable} used in dangerous sink ${sink}`,
            location: {
              file: method.filePath,
              startLine: 0,
              endLine: 0,
              startColumn: 0,
              endColumn: 0
            }
          });
        }
      });
    }
  });
}

/**
 * 追加の検証
 */
function performAdditionalValidations(
  method: any,
  inferredTypes: Map<string, QualifiedType<any>>,
  warnings: any[]
): void {
  // PolyTaint型の未解決警告
  inferredTypes.forEach((type, variable) => {
    if (TypeGuards.isPolyTaint(type)) {
      warnings.push({
        message: `Variable ${variable} has unresolved polymorphic taint type`,
        location: {
          file: method.filePath,
          line: 0,
          column: 0
        }
      });
    }
  });
  
  // 過度に保守的な型付けの警告
  let taintedCount = 0;
  let untaintedCount = 0;
  
  inferredTypes.forEach(type => {
    if (TypeGuards.isTainted(type)) taintedCount++;
    else if (TypeGuards.isUntainted(type)) untaintedCount++;
  });
  
  const totalVars = inferredTypes.size;
  if (totalVars > 5 && taintedCount / totalVars > 0.8) {
    warnings.push({
      message: `Over 80% of variables are marked as @Tainted. Consider reviewing sanitization logic.`,
      location: { file: method.filePath }
    });
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Worker uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Worker unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});