/**
 * ローカル推論最適化のテスト
 * arXiv:2504.18529v2 Section 6.2の実装
 */

import {
  LocalInferenceOptimizer,
  InferenceCache,
  IncrementalInferenceEngine,
  InferenceOptimizationResult,
  CacheHitStatistics
} from '../../../src/security/inference/local-inference-optimizer';
import { TaintQualifier } from '../../../src/security/types/checker-framework-types';

describe('LocalInferenceOptimizer', () => {
  let optimizer: LocalInferenceOptimizer;
  
  beforeEach(() => {
    optimizer = new LocalInferenceOptimizer();
  });
  
  describe('Local Variable Analysis', () => {
    it('should infer types for method-local variables', async () => {
      const methodCode = `
        function processData(userInput: string) {
          const temp = userInput;
          const sanitized = sanitize(temp);
          return sanitized;
        }
      `;
      
      const result = await optimizer.analyzeLocalVariables(methodCode, 'processData');
      
      expect(result.localVariables).toContain('temp');
      expect(result.localVariables).toContain('sanitized');
      expect(result.inferredTypes.get('temp')).toBe('@Tainted');
      expect(result.inferredTypes.get('sanitized')).toBe('@Untainted');
    });
    
    it('should handle nested scopes correctly', async () => {
      const methodCode = `
        function complexMethod(input: string) {
          const outer = input;
          if (isValid(input)) {
            const inner = outer;
            const processed = validate(inner);
            return processed;
          }
          return outer;
        }
      `;
      
      const result = await optimizer.analyzeLocalVariables(methodCode, 'complexMethod');
      
      expect(result.localVariables).toContain('outer');
      expect(result.localVariables).toContain('inner');
      expect(result.localVariables).toContain('processed');
      expect(result.scopeInfo.get('inner')).toBe('if-block');
    });
    
    it('should optimize inference for variables that do not escape', async () => {
      const methodCode = `
        function calculate() {
          const local1 = "constant";
          const local2 = local1.toUpperCase();
          const local3 = local2 + "suffix";
          // local3 does not escape
        }
      `;
      
      const result = await optimizer.analyzeLocalVariables(methodCode, 'calculate');
      
      expect(result.escapingVariables).not.toContain('local3');
      expect(result.optimizationApplied).toBe(true);
      expect(result.inferredTypes.get('local1')).toBe('@Untainted');
      expect(result.inferredTypes.get('local2')).toBe('@Untainted');
      expect(result.inferredTypes.get('local3')).toBe('@Untainted');
    });
  });
  
  describe('Inference Cache', () => {
    it('should cache inference results for methods', async () => {
      const cache = new InferenceCache();
      const methodSignature = 'processData(string):string';
      const inferenceResult = new Map([
        ['param1', '@Tainted' as TaintQualifier],
        ['return', '@Untainted' as TaintQualifier]
      ]);
      
      cache.put(methodSignature, inferenceResult);
      
      expect(cache.has(methodSignature)).toBe(true);
      expect(cache.get(methodSignature)).toEqual(inferenceResult);
    });
    
    it('should track cache hit statistics', async () => {
      const cache = new InferenceCache();
      const methodSig = 'testMethod()';
      
      cache.put(methodSig, new Map());
      cache.get(methodSig); // hit
      cache.get(methodSig); // hit
      cache.get('nonExistent'); // miss
      
      const stats = cache.getStatistics();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
    
    it('should invalidate cache entries on code changes', async () => {
      const cache = new InferenceCache();
      const methodSig = 'mutableMethod()';
      const oldResult = new Map([['var1', '@Tainted' as TaintQualifier]]);
      
      cache.put(methodSig, oldResult);
      expect(cache.has(methodSig)).toBe(true);
      
      cache.invalidate(methodSig);
      expect(cache.has(methodSig)).toBe(false);
    });
    
    it('should support LRU eviction policy', async () => {
      const cache = new InferenceCache({ maxSize: 3 });
      
      cache.put('method1', new Map());
      cache.put('method2', new Map());
      cache.put('method3', new Map());
      
      // Access method1 to make it recently used
      cache.get('method1');
      
      // Add method4, should evict method2 (least recently used)
      cache.put('method4', new Map());
      
      expect(cache.has('method1')).toBe(true);
      expect(cache.has('method2')).toBe(false);
      expect(cache.has('method3')).toBe(true);
      expect(cache.has('method4')).toBe(true);
    });
  });
  
  describe('Incremental Inference', () => {
    let incrementalEngine: IncrementalInferenceEngine;
    
    beforeEach(() => {
      incrementalEngine = new IncrementalInferenceEngine();
    });
    
    it('should only re-analyze changed methods', async () => {
      const initialCode = {
        'method1': 'function method1() { return "unchanged"; }',
        'method2': 'function method2() { return getUserInput(); }',
        'method3': 'function method3() { return "unchanged"; }'
      };
      
      // Initial analysis
      await incrementalEngine.analyzeAll(initialCode);
      
      // Change only method2
      const updatedCode = {
        ...initialCode,
        'method2': 'function method2() { return sanitize(getUserInput()); }'
      };
      
      const reanalyzed = await incrementalEngine.incrementalAnalyze(updatedCode);
      
      expect(reanalyzed.analyzedMethods).toEqual(['method2']);
      expect(reanalyzed.skippedMethods).toContain('method1');
      expect(reanalyzed.skippedMethods).toContain('method3');
    });
    
    it('should propagate changes to dependent methods', async () => {
      const code = {
        'base': 'function base() { return getUserInput(); }',
        'dependent1': 'function dependent1() { return base(); }',
        'dependent2': 'function dependent2() { return dependent1(); }',
        'independent': 'function independent() { return "constant"; }'
      };
      
      await incrementalEngine.analyzeAll(code);
      
      // Change base method
      const updatedCode = {
        ...code,
        'base': 'function base() { return sanitize(getUserInput()); }'
      };
      
      const result = await incrementalEngine.incrementalAnalyze(updatedCode);
      
      expect(result.analyzedMethods).toContain('base');
      expect(result.analyzedMethods).toContain('dependent1');
      expect(result.analyzedMethods).toContain('dependent2');
      expect(result.analyzedMethods).not.toContain('independent');
    });
    
    it('should use cached results for unchanged methods', async () => {
      const code = {
        'expensive': 'function expensive() { /* complex logic */ return compute(); }',
        'simple': 'function simple() { return "hello"; }'
      };
      
      const startTime = Date.now();
      await incrementalEngine.analyzeAll(code);
      const initialTime = Date.now() - startTime;
      
      // Make a small change
      const updatedCode = {
        ...code,
        'simple': 'function simple() { return "world"; }'
      };
      
      const incrementalStart = Date.now();
      await incrementalEngine.incrementalAnalyze(updatedCode);
      const incrementalTime = Date.now() - incrementalStart;
      
      // Incremental should be faster
      expect(incrementalTime).toBeLessThan(initialTime);
    });
  });
  
  describe('Integration with main inference engine', () => {
    it('should optimize search-based inference', async () => {
      const code = `
        class Service {
          processRequest(userInput: string) {
            const validated = this.validate(userInput);
            const temp = validated;
            const result = this.transform(temp);
            return result;
          }
          
          private validate(input: string): string {
            if (isValid(input)) {
              return input;
            }
            throw new Error('Invalid input');
          }
          
          private transform(data: string): string {
            return sanitize(data);
          }
        }
      `;
      
      const result = await optimizer.optimizeInference(code);
      
      expect(result.optimizationMetrics.localVariablesOptimized).toBeGreaterThan(0);
      expect(result.optimizationMetrics.cacheHits).toBeGreaterThanOrEqual(0);
      expect(result.optimizationMetrics.inferenceTimeMs).toBeDefined();
      
      // Verify correct type inference
      expect(result.typeMap.get('userInput')).toBe('@Tainted');
      expect(result.typeMap.get('result')).toBe('@Untainted');
    });
    
    it('should handle circular dependencies gracefully', async () => {
      const code = `
        function methodA() {
          return methodB();
        }
        
        function methodB() {
          return methodA();
        }
      `;
      
      const result = await optimizer.optimizeInference(code);
      
      expect(result.warnings).toContain('Circular dependency detected');
      expect(result.typeMap.size).toBeGreaterThan(0);
    });
  });
  
  describe('Performance optimizations', () => {
    it('should batch analyze related methods', async () => {
      const methods = [
        'function m1() { return getUserInput(); }',
        'function m2() { return m1(); }',
        'function m3() { return m2(); }',
        'function m4() { return m3(); }',
        'function m5() { return sanitize(m4()); }'
      ];
      
      const result = await optimizer.batchAnalyze(methods);
      
      expect(result.batchSize).toBe(5);
      expect(result.parallelizationUsed).toBe(true);
      expect(result.totalTime).toBeLessThan(result.batchSize * 100); // Should be faster than sequential
    });
    
    it('should skip redundant type checks', async () => {
      const code = `
        function redundantChecks(input: string) {
          const a = input;
          const b = a;
          const c = b;
          const d = c;
          const e = d;
          return e;
        }
      `;
      
      const result = await optimizer.analyzeLocalVariables(code, 'redundantChecks');
      
      expect(result.redundantChecksSkipped).toBeGreaterThan(0);
      expect(result.inferredTypes.get('a')).toBe('@Tainted');
      expect(result.inferredTypes.get('e')).toBe('@Tainted');
    });
  });
});