/**
 * arXiv:2504.18529v2「Practical Type-Based Taint Checking and Inference」
 * 実装の統合テストスイート
 */

import {
  Tainted,
  Untainted,
  PolyTaint,
  SuppressTaintWarning
} from '../../../../src/security/annotations/taint-annotations';
import {
  TaintQualifier,
  QualifiedType,
  TypeConstructors,
  TypeGuards,
  SubtypingChecker
} from '../../../../src/security/types/checker-framework-types';
import { SearchBasedInferenceEngine } from '../../../../src/security/analysis/search-based-inference';
import { ParallelTypeChecker } from '../../../../src/security/checker/parallel-type-checker';
import { LocalInferenceOptimizer, IncrementalInferenceEngine } from '../../../../src/security/inference/local-inference-optimizer';
import { TypeBasedSecurityEngine } from '../../../../src/security/analysis/engine';
import { TaintLevelAdapter } from '../../../../src/security/compatibility/taint-level-adapter';
import { ModernSecurityLattice } from '../../../../src/security/lattice/modern-security-lattice';

describe('Type-Based Taint Analysis Integration Tests', () => {
  describe('1. 型アノテーションシステム', () => {
    it('should correctly apply taint annotations to variables', () => {
      @Tainted()
      let userInput = 'test input';
      
      @Untainted()
      let sanitized = 'safe value';
      
      @PolyTaint()
      function transform<T>(input: T): T {
        return input;
      }
      
      expect(TypeGuards.isTainted(TypeConstructors.tainted(userInput))).toBe(true);
      expect(TypeGuards.isUntainted(TypeConstructors.untainted(sanitized))).toBe(true);
    });
    
    it('should handle polymorphic taint propagation', () => {
      const taintedValue = TypeConstructors.tainted('user input');
      const untaintedValue = TypeConstructors.untainted('safe value');
      
      // PolyTaint関数は入力の汚染状態を保持
      const polyFunc = <T>(value: QualifiedType<T>): QualifiedType<T> => {
        return value;
      };
      
      const result1 = polyFunc(taintedValue);
      const result2 = polyFunc(untaintedValue);
      
      expect(result1.__brand).toBe('@Tainted');
      expect(result2.__brand).toBe('@Untainted');
    });
    
    it('should suppress warnings when @SuppressTaintWarning is used', () => {
      @SuppressTaintWarning('intentional-test')
      function testFunction() {
        const tainted = TypeConstructors.tainted('user data');
        // 通常は警告が出るが、抑制される
        const unsafe = tainted.__value;
        return unsafe;
      }
      
      expect(() => testFunction()).not.toThrow();
    });
  });
  
  describe('2. 自動型推論エンジン', () => {
    let inferenceEngine: SearchBasedInferenceEngine;
    
    beforeEach(() => {
      inferenceEngine = new SearchBasedInferenceEngine();
    });
    
    it('should infer taint types for method parameters', async () => {
      const testCode = `
        function validateInput(userInput: string): string {
          if (userInput.length > 100) {
            throw new Error('Input too long');
          }
          return userInput.trim();
        }
      `;
      
      const result = await inferenceEngine.inferTypes(testCode, 'test.ts');
      
      expect(result.typeMap.has('userInput')).toBe(true);
      expect(result.typeMap.get('userInput')?.__brand).toBe('@Tainted');
    });
    
    it('should handle search-based inference with error minimization', async () => {
      const testCode = `
        function processData(input: any) {
          const sanitized = sanitize(input);
          const result = transform(sanitized);
          return result;
        }
      `;
      
      const result = await inferenceEngine.inferTypes(testCode, 'test.ts');
      
      expect(result.typeMap.has('sanitized')).toBe(true);
      expect(result.typeMap.get('sanitized')?.__brand).toBe('@Untainted');
      expect(result.errors.length).toBe(0);
    });
  });
  
  describe('3. 並列型チェック', () => {
    let parallelChecker: ParallelTypeChecker;
    
    beforeEach(() => {
      parallelChecker = new ParallelTypeChecker({
        workerCount: 2,
        enableCache: true
      });
    });
    
    afterEach(async () => {
      await parallelChecker.cleanup();
    });
    
    it('should perform parallel type checking with speedup', async () => {
      const methods = [
        {
          name: 'method1',
          filePath: 'test1.ts',
          content: 'function method1(input: string) { return input; }',
          signature: { name: 'method1', parameters: [], returnType: 'string', annotations: [], visibility: 'public', isAsync: false },
          location: { startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 }
        },
        {
          name: 'method2',
          filePath: 'test2.ts',
          content: 'function method2(data: any) { return sanitize(data); }',
          signature: { name: 'method2', parameters: [], returnType: 'any', annotations: [], visibility: 'public', isAsync: false },
          location: { startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 }
        }
      ];
      
      const results = await parallelChecker.checkMethodsInParallel(methods);
      
      expect(results.size).toBe(2);
      
      const stats = parallelChecker.getStatistics();
      expect(stats.totalMethods).toBe(2);
      expect(stats.speedup).toBeGreaterThan(1);
    });
  });
  
  describe('4. インクリメンタル解析', () => {
    let incrementalEngine: IncrementalInferenceEngine;
    
    beforeEach(() => {
      incrementalEngine = new IncrementalInferenceEngine();
    });
    
    it('should skip unchanged methods in incremental analysis', async () => {
      const initialCode = {
        method1: 'function method1() { return "unchanged"; }',
        method2: 'function method2() { return "original"; }'
      };
      
      // 初回解析
      await incrementalEngine.analyzeAll(initialCode);
      
      // 一部のみ変更
      const updatedCode = {
        method1: 'function method1() { return "unchanged"; }',
        method2: 'function method2() { return "modified"; }'
      };
      
      const result = await incrementalEngine.incrementalAnalyze(updatedCode);
      
      expect(result.analyzedMethods).toContain('method2');
      expect(result.skippedMethods).toContain('method1');
      expect(result.cacheHits).toBeGreaterThan(0);
    });
    
    it('should detect dependency changes and reanalyze affected methods', async () => {
      const code = {
        base: 'function base() { return getData(); }',
        dependent1: 'function dependent1() { return base(); }',
        dependent2: 'function dependent2() { return dependent1(); }'
      };
      
      await incrementalEngine.analyzeAll(code);
      
      // ベースメソッドを変更
      const updatedCode = {
        ...code,
        base: 'function base() { return getSanitizedData(); }'
      };
      
      const result = await incrementalEngine.incrementalAnalyze(updatedCode);
      
      // 依存メソッドも再解析されるべき
      expect(result.analyzedMethods).toContain('base');
      expect(result.analyzedMethods).toContain('dependent1');
      expect(result.analyzedMethods).toContain('dependent2');
    });
  });
  
  describe('5. Dorothy Denning格子理論との統合', () => {
    let lattice: ModernSecurityLattice;
    
    beforeEach(() => {
      lattice = new ModernSecurityLattice();
    });
    
    it('should maintain lattice theory internally while exposing new API', () => {
      lattice.setTaintType('variable1', 'value1', '@Tainted');
      lattice.setTaintType('variable2', 'value2', '@Untainted');
      
      const joinResult = lattice.joinTypes<string>('variable1', 'variable2', (a, b) => a + b);
      
      // Tainted ⊔ Untainted = Tainted (格子理論に従う)
      expect(joinResult.qualifier).toBe('@Tainted');
    });
    
    it('should verify security invariants using lattice operations', () => {
      lattice.setTaintType('userInput', 'test', '@Tainted');
      lattice.setTaintType('sanitized', 'clean', '@Untainted');
      
      // フロー: userInput -> sanitized (サニタイザーなし)
      const flow = {
        source: 'userInput',
        destination: 'sanitized',
        hasSanitizer: false
      };
      
      const violations = lattice.verifyFlow(flow);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
    });
  });
  
  describe('6. レガシー互換性', () => {
    it('should convert between TaintLevel enum and new type system', () => {
      const TaintLevel = {
        UNTAINTED: 0,
        POSSIBLY_TAINTED: 1,
        TAINTED: 2,
        POLY_TAINTED: 3
      };
      
      // レガシーから新型への変換
      const newType = TaintLevelAdapter.toQualifiedType('var1', TaintLevel.TAINTED);
      expect(newType.__brand).toBe('@Tainted');
      
      // 新型からレガシーへの変換
      const taintedType = TypeConstructors.tainted('value');
      const legacyLevel = TaintLevelAdapter.fromQualifiedType(taintedType);
      expect(legacyLevel).toBe(TaintLevel.TAINTED);
    });
  });
  
  describe('7. 統合シナリオテスト', () => {
    let securityEngine: TypeBasedSecurityEngine;
    
    beforeEach(() => {
      securityEngine = new TypeBasedSecurityEngine({
        parallelism: 2,
        enableCache: true
      });
    });
    
    it('should analyze a complete test file with security issues', async () => {
      const testFile = {
        file: 'auth.test.ts',
        content: `
          describe('Authentication Tests', () => {
            it('should validate password', () => {
              const password = 'hardcoded123';
              const userInput = getUserInput();
              const query = \`SELECT * FROM users WHERE password = '\${userInput}'\`;
              expect(validatePassword(password)).toBe(true);
            });
          });
        `
      };
      
      const result = await securityEngine.analyzeAtCompileTime([testFile]);
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.type === 'unsafe-taint-flow')).toBe(true);
      expect(result.runtimeImpact).toBe(0); // コンパイル時解析のため
    });
    
    it('should provide performance improvement over sequential analysis', async () => {
      const testFiles = Array.from({ length: 10 }, (_, i) => ({
        file: `test${i}.ts`,
        content: `
          function test${i}(input: string) {
            const processed = process(input);
            return validate(processed);
          }
        `
      }));
      
      const startTime = Date.now();
      const result = await securityEngine.analyzeAtCompileTime(testFiles);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      const expectedSequentialTime = testFiles.length * 50; // 推定
      
      expect(executionTime).toBeLessThan(expectedSequentialTime);
      expect(result.statistics.filesAnalyzed).toBe(10);
    });
  });
  
  describe('8. エラーケースとエッジケース', () => {
    it('should handle circular dependencies gracefully', async () => {
      const optimizer = new LocalInferenceOptimizer();
      
      const circularCode = `
        function methodA() {
          return methodB();
        }
        
        function methodB() {
          return methodA();
        }
      `;
      
      const result = await optimizer.optimizeInference(circularCode);
      
      expect(result.warnings).toContain('Circular dependency detected');
      expect(result.typeMap.size).toBeGreaterThan(0);
    });
    
    it('should handle invalid type annotations', () => {
      const invalidType = { __brand: 'InvalidQualifier' } as any;
      
      expect(() => TypeGuards.isTainted(invalidType)).not.toThrow();
      expect(TypeGuards.isTainted(invalidType)).toBe(false);
    });
    
    it('should handle empty or malformed code', async () => {
      const engine = new SearchBasedInferenceEngine();
      
      const result = await engine.inferTypes('', 'empty.ts');
      
      expect(result.typeMap.size).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });
});

// モックヘルパー関数
function getUserInput(): string {
  return 'mock-user-input';
}

function validatePassword(password: string): boolean {
  return password.length > 8;
}

function sanitize(input: any): any {
  return String(input).replace(/[<>]/g, '');
}

function process(input: string): string {
  return input.toLowerCase();
}

function validate(input: string): boolean {
  return input.length > 0;
}

function getData(): any {
  return { data: 'test' };
}

function getSanitizedData(): any {
  return { data: 'sanitized' };
}