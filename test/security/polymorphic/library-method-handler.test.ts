/**
 * ポリモーフィック汚染処理のテスト
 * arXiv:2504.18529v2 Section 3.3の実装
 */

import {
  LibraryMethodHandler,
  GenericTaintHandler,
  PolymorphicTaintPropagator,
  TaintPropagationRule,
  MethodSignature,
  LibraryMethodDatabase
} from '../../../src/security/polymorphic/library-method-handler';
import { 
  TaintQualifier, 
  PolyTaintInstantiation 
} from '../../../src/security/types/checker-framework-types';

describe('LibraryMethodHandler', () => {
  let handler: LibraryMethodHandler;
  
  beforeEach(() => {
    handler = new LibraryMethodHandler();
  });
  
  describe('Built-in JavaScript methods', () => {
    it('should handle String.prototype methods polymorphically', () => {
      const stringMethods = [
        'toUpperCase', 'toLowerCase', 'trim', 'substring', 'slice'
      ];
      
      stringMethods.forEach(method => {
        const signature = handler.getMethodSignature('String', method);
        
        expect(signature).toBeDefined();
        expect(signature!.isPolymorphic).toBe(true);
        
        // Tainted input should produce tainted output
        const taintedResult = handler.propagateTaint(
          'String', method, '@Tainted', []
        );
        expect(taintedResult).toBe('@Tainted');
        
        // Untainted input should produce untainted output
        const untaintedResult = handler.propagateTaint(
          'String', method, '@Untainted', []
        );
        expect(untaintedResult).toBe('@Untainted');
      });
    });
    
    it('should handle Array methods with proper taint propagation', () => {
      // map, filter, reduce are polymorphic
      const polyMethods = ['map', 'filter', 'reduce'];
      
      polyMethods.forEach(method => {
        const signature = handler.getMethodSignature('Array', method);
        
        expect(signature!.isPolymorphic).toBe(true);
        
        // Callback parameter should determine taint
        const result = handler.propagateTaint(
          'Array', method, '@Tainted', ['@Untainted']
        );
        expect(result).toBe('@Tainted'); // Array elements are tainted
      });
    });
    
    it('should handle Object.keys as producing untainted strings', () => {
      const signature = handler.getMethodSignature('Object', 'keys');
      
      expect(signature).toBeDefined();
      expect(signature!.isPolymorphic).toBe(false);
      
      // Keys are always untainted (property names)
      const result = handler.propagateTaint(
        'Object', 'keys', '@Tainted', []
      );
      expect(result).toBe('@Untainted');
    });
  });
  
  describe('Custom library registration', () => {
    it('should allow registering custom library methods', () => {
      const customSignature: MethodSignature = {
        className: 'MyLibrary',
        methodName: 'process',
        isPolymorphic: true,
        parameterIndices: [0],
        propagationRule: 'any',
        returnQualifier: null
      };
      
      handler.registerLibraryMethod(customSignature);
      
      const retrieved = handler.getMethodSignature('MyLibrary', 'process');
      expect(retrieved).toEqual(customSignature);
    });
    
    it('should override built-in methods when registered', () => {
      const overrideSignature: MethodSignature = {
        className: 'String',
        methodName: 'toUpperCase',
        isPolymorphic: false,
        parameterIndices: [],
        propagationRule: 'none',
        returnQualifier: '@Untainted'
      };
      
      handler.registerLibraryMethod(overrideSignature);
      
      const result = handler.propagateTaint(
        'String', 'toUpperCase', '@Tainted', []
      );
      expect(result).toBe('@Untainted');
    });
  });
  
  describe('Taint propagation rules', () => {
    it('should handle "any" propagation rule', () => {
      const signature: MethodSignature = {
        className: 'Test',
        methodName: 'anyRule',
        isPolymorphic: true,
        parameterIndices: [0, 1, 2],
        propagationRule: 'any',
        returnQualifier: null
      };
      
      handler.registerLibraryMethod(signature);
      
      // Any tainted parameter taints the result
      let result = handler.propagateTaint(
        'Test', 'anyRule', '@Untainted', 
        ['@Untainted', '@Tainted', '@Untainted']
      );
      expect(result).toBe('@Tainted');
      
      // All untainted produces untainted
      result = handler.propagateTaint(
        'Test', 'anyRule', '@Untainted',
        ['@Untainted', '@Untainted', '@Untainted']
      );
      expect(result).toBe('@Untainted');
    });
    
    it('should handle "all" propagation rule', () => {
      const signature: MethodSignature = {
        className: 'Test',
        methodName: 'allRule',
        isPolymorphic: true,
        parameterIndices: [0, 1],
        propagationRule: 'all',
        returnQualifier: null
      };
      
      handler.registerLibraryMethod(signature);
      
      // All must be tainted to taint result
      let result = handler.propagateTaint(
        'Test', 'allRule', '@Tainted',
        ['@Tainted', '@Tainted']
      );
      expect(result).toBe('@Tainted');
      
      // One untainted makes result untainted
      result = handler.propagateTaint(
        'Test', 'allRule', '@Tainted',
        ['@Tainted', '@Untainted']
      );
      expect(result).toBe('@Untainted');
      
      // Untainted receiver makes result untainted
      result = handler.propagateTaint(
        'Test', 'allRule', '@Untainted',
        ['@Tainted', '@Tainted']
      );
      expect(result).toBe('@Untainted');
    });
    
    it('should handle fixed return qualifiers', () => {
      const signature: MethodSignature = {
        className: 'Test',
        methodName: 'fixedReturn',
        isPolymorphic: false,
        parameterIndices: [],
        propagationRule: 'none',
        returnQualifier: '@Untainted'
      };
      
      handler.registerLibraryMethod(signature);
      
      // Always returns untainted regardless of input
      const result = handler.propagateTaint(
        'Test', 'fixedReturn', '@Tainted', ['@Tainted']
      );
      expect(result).toBe('@Untainted');
    });
  });
  
  describe('Unknown methods handling', () => {
    it('should treat unknown methods conservatively', () => {
      // Unknown method should propagate taint conservatively
      const result = handler.propagateTaint(
        'UnknownClass', 'unknownMethod', '@Tainted', []
      );
      expect(result).toBe('@Tainted');
    });
    
    it('should allow configuring default behavior for unknown methods', () => {
      handler.setUnknownMethodBehavior('optimistic');
      
      // Optimistic: preserve receiver type
      let result = handler.propagateTaint(
        'UnknownClass', 'unknownMethod', '@Untainted', []
      );
      expect(result).toBe('@Untainted');
      
      handler.setUnknownMethodBehavior('conservative');
      
      // Conservative: always taint
      result = handler.propagateTaint(
        'UnknownClass', 'unknownMethod', '@Untainted', []
      );
      expect(result).toBe('@Tainted');
    });
  });
});

describe('GenericTaintHandler', () => {
  let handler: GenericTaintHandler;
  
  beforeEach(() => {
    handler = new GenericTaintHandler();
  });
  
  describe('Generic type parameter handling', () => {
    it('should track taint through generic type parameters', () => {
      const genericSignature = {
        className: 'Array',
        methodName: 'push',
        typeParameters: ['T'],
        isPolymorphic: true,
        propagatesElementTaint: true
      };
      
      handler.registerGenericMethod(genericSignature);
      
      // Array<@Tainted string> push(@Tainted string) -> void
      const arrayTaint = handler.getArrayElementTaint('@Tainted');
      expect(arrayTaint).toBe('@Tainted');
    });
    
    it('should handle Map and Set generics', () => {
      // Map<K, V> where K or V might be tainted
      const mapKey = '@Untainted';
      const mapValue = '@Tainted';
      
      const mapTaint = handler.getMapTaint(mapKey, mapValue);
      expect(mapTaint.keyTaint).toBe('@Untainted');
      expect(mapTaint.valueTaint).toBe('@Tainted');
      
      // Set<T> preserves element taint
      const setTaint = handler.getSetElementTaint('@Tainted');
      expect(setTaint).toBe('@Tainted');
    });
    
    it('should handle Promise<T> taint propagation', () => {
      // Promise<@Tainted T> -> @Tainted when resolved
      const promiseTaint = handler.getPromiseTaint('@Tainted');
      expect(promiseTaint).toBe('@Tainted');
      
      // Promise chain propagation
      const chainedTaint = handler.propagatePromiseChain(
        '@Tainted',
        ['then', 'catch', 'finally']
      );
      expect(chainedTaint).toBe('@Tainted');
    });
  });
  
  describe('Higher-order function handling', () => {
    it('should handle function parameters with taint', () => {
      // (fn: (@Tainted) => @Untainted) => result
      const higherOrderResult = handler.analyzeHigherOrderFunction(
        '(@Tainted) => @Untainted',
        '@Tainted'
      );
      
      expect(higherOrderResult).toBe('@Untainted');
    });
    
    it('should handle curried functions', () => {
      // curry((a: @Tainted, b: @Untainted) => @Tainted)
      const curriedTaint = handler.analyzeCurriedFunction(
        ['@Tainted', '@Untainted'],
        '@Tainted'
      );
      
      expect(curriedTaint.partial(0)).toBe('@Tainted');
      expect(curriedTaint.final()).toBe('@Tainted');
    });
  });
});

describe('PolymorphicTaintPropagator', () => {
  let propagator: PolymorphicTaintPropagator;
  
  beforeEach(() => {
    propagator = new PolymorphicTaintPropagator();
  });
  
  describe('Complex propagation scenarios', () => {
    it('should handle method chaining with mixed taint', () => {
      const chain = [
        { method: 'filter', receiver: '@Tainted' as TaintQualifier, args: ['@Untainted' as TaintQualifier] },
        { method: 'map', receiver: null, args: ['@Untainted' as TaintQualifier] },
        { method: 'join', receiver: null, args: ['@Untainted' as TaintQualifier] }
      ];
      
      const result = propagator.propagateChain('Array', chain);
      expect(result).toBe('@Tainted'); // Original array taint propagates
    });
    
    it('should handle nested method calls', () => {
      // str.replace(pattern, str2.toUpperCase())
      const nestedResult = propagator.analyzeNestedCall({
        outer: {
          className: 'String',
          method: 'replace',
          receiver: '@Tainted',
          args: ['@Untainted', null]
        },
        inner: {
          className: 'String', 
          method: 'toUpperCase',
          receiver: '@Untainted',
          args: []
        },
        innerPosition: 1
      });
      
      expect(nestedResult).toBe('@Tainted'); // Outer receiver taints result
    });
    
    it('should handle conditional taint propagation', () => {
      // condition ? taintedValue : untaintedValue
      const conditionalResult = propagator.analyzeConditional(
        '@Untainted', // condition
        '@Tainted',   // true branch
        '@Untainted'  // false branch
      );
      
      // Conservative: if any branch is tainted, result is tainted
      expect(conditionalResult).toBe('@Tainted');
    });
  });
  
  describe('Library integration', () => {
    it('should work with real library patterns', () => {
      // jQuery style chaining
      const jqueryChain = propagator.analyzeLibraryPattern('jquery', {
        pattern: '$().val().trim().toLowerCase()',
        initialTaint: '@Tainted'
      });
      expect(jqueryChain).toBe('@Tainted');
      
      // Lodash composition
      const lodashCompose = propagator.analyzeLibraryPattern('lodash', {
        pattern: '_.flow([_.trim, _.escape])',
        initialTaint: '@Tainted'
      });
      expect(lodashCompose).toBe('@Untainted'); // escape sanitizes
    });
  });
});

describe('LibraryMethodDatabase', () => {
  let database: LibraryMethodDatabase;
  
  beforeEach(() => {
    database = new LibraryMethodDatabase();
  });
  
  it('should load built-in library definitions', () => {
    const builtins = database.getBuiltinLibraries();
    expect(builtins).toContain('JavaScript');
    expect(builtins).toContain('Node.js');
  });
  
  it('should support importing library definitions from JSON', () => {
    const jsonDef = {
      libraryName: 'MyLib',
      version: '1.0.0',
      methods: [
        {
          className: 'MyClass',
          methodName: 'process',
          isPolymorphic: true,
          parameterIndices: [0],
          propagationRule: 'any' as const,
          returnQualifier: null
        }
      ]
    };
    
    database.importLibraryDefinition(jsonDef);
    
    const method = database.lookupMethod('MyLib', 'MyClass', 'process');
    expect(method).toBeDefined();
    expect(method!.isPolymorphic).toBe(true);
  });
});