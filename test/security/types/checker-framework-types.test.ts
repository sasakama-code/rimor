/**
 * Checker Framework互換型定義のテスト
 */

import {
  TypeConstructors,
  TypeGuards,
  SubtypingChecker,
  TypePromotion,
  TypePropagation,
  FlowSensitiveChecker,
  TypeCompatibility,
  PolyTaintInstantiation,
  TypeQualifierError,
  TaintedType,
  UntaintedType,
  PolyTaintType
} from '../../../src/security/types/checker-framework-types';

describe('Checker Framework Types', () => {
  describe('TypeConstructors', () => {
    it('should create tainted type', () => {
      const tainted = TypeConstructors.tainted('user input', 'form-data', 0.9);
      
      expect(tainted.__brand).toBe('@Tainted');
      expect(tainted.__value).toBe('user input');
      expect(tainted.__source).toBe('form-data');
      expect(tainted.__confidence).toBe(0.9);
    });
    
    it('should create untainted type', () => {
      const untainted = TypeConstructors.untainted('safe value', 'html-escape');
      
      expect(untainted.__brand).toBe('@Untainted');
      expect(untainted.__value).toBe('safe value');
      expect(untainted.__sanitizedBy).toBe('html-escape');
      expect(untainted.__validatedAt).toBeDefined();
    });
    
    it('should create poly taint type', () => {
      const poly = TypeConstructors.polyTaint('poly value', [0, 1], 'all');
      
      expect(poly.__brand).toBe('@PolyTaint');
      expect(poly.__value).toBe('poly value');
      expect(poly.__parameterIndices).toEqual([0, 1]);
      expect(poly.__propagationRule).toBe('all');
    });
  });
  
  describe('TypeGuards', () => {
    it('should correctly identify tainted types', () => {
      const tainted = TypeConstructors.tainted('test', 'user');
      const untainted = TypeConstructors.untainted('test');
      const poly = TypeConstructors.polyTaint('test');
      
      expect(TypeGuards.isTainted(tainted)).toBe(true);
      expect(TypeGuards.isTainted(untainted)).toBe(false);
      expect(TypeGuards.isTainted(poly)).toBe(false);
    });
    
    it('should correctly identify untainted types', () => {
      const tainted = TypeConstructors.tainted('test', 'user');
      const untainted = TypeConstructors.untainted('test');
      const poly = TypeConstructors.polyTaint('test');
      
      expect(TypeGuards.isUntainted(tainted)).toBe(false);
      expect(TypeGuards.isUntainted(untainted)).toBe(true);
      expect(TypeGuards.isUntainted(poly)).toBe(false);
    });
    
    it('should correctly identify poly taint types', () => {
      const tainted = TypeConstructors.tainted('test', 'user');
      const untainted = TypeConstructors.untainted('test');
      const poly = TypeConstructors.polyTaint('test');
      
      expect(TypeGuards.isPolyTaint(tainted)).toBe(false);
      expect(TypeGuards.isPolyTaint(untainted)).toBe(false);
      expect(TypeGuards.isPolyTaint(poly)).toBe(true);
    });
  });
  
  describe('SubtypingChecker', () => {
    it('should check subtype relationships correctly', () => {
      // @Untainted <: @Tainted
      expect(SubtypingChecker.isSubtype('@Untainted', '@Tainted')).toBe(true);
      expect(SubtypingChecker.isSubtype('@Tainted', '@Untainted')).toBe(false);
      
      // Same type is subtype of itself
      expect(SubtypingChecker.isSubtype('@Tainted', '@Tainted')).toBe(true);
      expect(SubtypingChecker.isSubtype('@Untainted', '@Untainted')).toBe(true);
      
      // PolyTaint is special
      expect(SubtypingChecker.isSubtype('@PolyTaint', '@Tainted')).toBe(true);
      expect(SubtypingChecker.isSubtype('@PolyTaint', '@Untainted')).toBe(true);
    });
    
    it('should check assignment safety', () => {
      const tainted = TypeConstructors.tainted('tainted', 'user');
      const untainted = TypeConstructors.untainted('safe');
      
      // Safe: untainted to tainted
      expect(SubtypingChecker.isAssignmentSafe(tainted, untainted)).toBe(true);
      
      // Unsafe: tainted to untainted
      expect(SubtypingChecker.isAssignmentSafe(untainted, tainted)).toBe(false);
      
      // Safe: same type
      expect(SubtypingChecker.isAssignmentSafe(tainted, tainted)).toBe(true);
      expect(SubtypingChecker.isAssignmentSafe(untainted, untainted)).toBe(true);
    });
  });
  
  describe('TypePromotion', () => {
    it('should sanitize tainted to untainted', () => {
      const tainted = TypeConstructors.tainted('dirty', 'user-input');
      const sanitized = TypePromotion.sanitize(tainted, 'html-escape');
      
      expect(TypeGuards.isUntainted(sanitized)).toBe(true);
      expect(sanitized.__value).toBe('dirty');
      expect(sanitized.__sanitizedBy).toBe('html-escape');
    });
    
    it('should taint untainted to tainted', () => {
      const untainted = TypeConstructors.untainted('clean');
      const tainted = TypePromotion.taint(untainted, 'external-api');
      
      expect(TypeGuards.isTainted(tainted)).toBe(true);
      expect(tainted.__value).toBe('clean');
      expect(tainted.__source).toBe('external-api');
    });
    
    it('should conditionally promote based on validation', () => {
      const tainted = TypeConstructors.tainted('123', 'user-input');
      const promoted = TypePromotion.conditionalPromote(
        tainted,
        (v) => !isNaN(Number(v)),
        'numeric-validation'
      );
      
      expect(TypeGuards.isUntainted(promoted)).toBe(true);
      
      const invalidTainted = TypeConstructors.tainted('abc', 'user-input');
      const notPromoted = TypePromotion.conditionalPromote(
        invalidTainted,
        (v) => !isNaN(Number(v)),
        'numeric-validation'
      );
      
      expect(TypeGuards.isTainted(notPromoted)).toBe(true);
    });
  });
  
  describe('TypePropagation', () => {
    it('should propagate taint in binary operations', () => {
      const tainted = TypeConstructors.tainted('hello', 'user');
      const untainted = TypeConstructors.untainted('world');
      
      const result = TypePropagation.binaryOperation(
        tainted,
        untainted,
        (a, b) => a + b
      );
      
      expect(TypeGuards.isTainted(result)).toBe(true);
      expect(result.__value).toBe('helloworld');
    });
    
    it('should preserve untainted in binary operations with both untainted', () => {
      const untainted1 = TypeConstructors.untainted('hello');
      const untainted2 = TypeConstructors.untainted('world');
      
      const result = TypePropagation.binaryOperation(
        untainted1,
        untainted2,
        (a, b) => a + b
      );
      
      expect(TypeGuards.isUntainted(result)).toBe(true);
      expect(result.__value).toBe('helloworld');
    });
    
    it('should propagate taint in method calls', () => {
      const taintedReceiver = TypeConstructors.tainted({ value: 'test' }, 'user');
      const untaintedArg = TypeConstructors.untainted('arg');
      
      const result = TypePropagation.methodCall(
        taintedReceiver,
        'concat',
        [untaintedArg],
        function(this: any, arg: string) { return this.value + arg; }
      );
      
      expect(TypeGuards.isTainted(result)).toBe(true);
    });
  });
  
  describe('FlowSensitiveChecker', () => {
    it('should track type changes in flow', () => {
      const checker = new FlowSensitiveChecker();
      
      // Initial tainted value
      const tainted = TypeConstructors.tainted('user input', 'form');
      checker.updateType('userInput', tainted);
      
      expect(TypeGuards.isTainted(checker.getType('userInput')!)).toBe(true);
      
      // After sanitization
      const sanitized = TypeConstructors.untainted('user input', 'sanitizer');
      checker.updateType('userInput', sanitized);
      
      expect(TypeGuards.isUntainted(checker.getType('userInput')!)).toBe(true);
    });
    
    it('should refine types based on conditions', () => {
      const checker = new FlowSensitiveChecker();
      
      const value = TypeConstructors.tainted('123', 'user');
      checker.updateType('value', value);
      
      // Refine to untainted if numeric
      checker.refineType(
        'value',
        (v) => !isNaN(Number(v)),
        '@Untainted',
        '@Tainted'
      );
      
      const refined = checker.getType('value');
      expect(TypeGuards.isUntainted(refined!)).toBe(true);
    });
  });
  
  describe('TypeCompatibility', () => {
    it('should check method override safety', () => {
      // Base: (@Tainted) => @Untainted
      const baseMethod = {
        params: ['@Tainted' as const],
        return: '@Untainted' as const
      };
      
      // Safe override: (@Tainted) => @Untainted (same)
      const safeOverride1 = {
        params: ['@Tainted' as const],
        return: '@Untainted' as const
      };
      
      expect(TypeCompatibility.isOverrideSafe(baseMethod, safeOverride1)).toBe(true);
      
      // Unsafe override: (@Untainted) => @Untainted (param too restrictive)
      const unsafeOverride = {
        params: ['@Untainted' as const],
        return: '@Untainted' as const
      };
      
      expect(TypeCompatibility.isOverrideSafe(baseMethod, unsafeOverride)).toBe(false);
      
      // Unsafe override: (@Tainted) => @Tainted (return too general)
      const unsafeOverride2 = {
        params: ['@Tainted' as const],
        return: '@Tainted' as const
      };
      
      expect(TypeCompatibility.isOverrideSafe(baseMethod, unsafeOverride2)).toBe(false);
    });
  });
  
  describe('PolyTaintInstantiation', () => {
    it('should instantiate poly taint with any rule', () => {
      const poly = TypeConstructors.polyTaint('result', [0, 1], 'any');
      
      // One tainted argument
      const result1 = PolyTaintInstantiation.instantiate(
        poly,
        ['@Tainted', '@Untainted']
      );
      expect(TypeGuards.isTainted(result1)).toBe(true);
      
      // No tainted arguments
      const result2 = PolyTaintInstantiation.instantiate(
        poly,
        ['@Untainted', '@Untainted']
      );
      expect(TypeGuards.isUntainted(result2)).toBe(true);
    });
    
    it('should instantiate poly taint with all rule', () => {
      const poly = TypeConstructors.polyTaint('result', [0, 1], 'all');
      
      // All tainted arguments
      const result1 = PolyTaintInstantiation.instantiate(
        poly,
        ['@Tainted', '@Tainted']
      );
      expect(TypeGuards.isTainted(result1)).toBe(true);
      
      // Some untainted arguments
      const result2 = PolyTaintInstantiation.instantiate(
        poly,
        ['@Tainted', '@Untainted']
      );
      expect(TypeGuards.isUntainted(result2)).toBe(true);
    });
  });
  
  describe('Integration scenarios', () => {
    it('should handle complex taint flow', () => {
      // User input (tainted)
      const userInput = TypeConstructors.tainted('DROP TABLE users', 'form-input');
      
      // Validation (conditional promotion)
      const validated = TypePromotion.conditionalPromote(
        userInput,
        (v) => !v.includes('DROP'),
        'sql-validation'
      );
      
      // Still tainted because validation failed
      expect(TypeGuards.isTainted(validated)).toBe(true);
      
      // Force sanitization
      const sanitized = TypePromotion.sanitize(
        validated as TaintedType<string>,
        'sql-escape'
      );
      
      // Now untainted
      expect(TypeGuards.isUntainted(sanitized)).toBe(true);
      
      // Use in query (binary operation)
      const query = TypeConstructors.untainted('SELECT * FROM users WHERE name = ');
      const finalQuery = TypePropagation.binaryOperation(
        query,
        sanitized,
        (a, b) => a + `'${b}'`
      );
      
      // Result is untainted because both operands are untainted
      expect(TypeGuards.isUntainted(finalQuery)).toBe(true);
    });
    
    it('should handle polymorphic method correctly', () => {
      // Polymorphic string processing method
      const processString = TypeConstructors.polyTaint(
        (s: string) => s.toUpperCase(),
        [0],
        'any'
      );
      
      // With tainted input
      const taintedInput = TypeConstructors.tainted('secret', 'user');
      const result1 = PolyTaintInstantiation.instantiate(
        processString,
        ['@Tainted']
      );
      expect(TypeGuards.isTainted(result1)).toBe(true);
      
      // With untainted input
      const untaintedInput = TypeConstructors.untainted('safe');
      const result2 = PolyTaintInstantiation.instantiate(
        processString,
        ['@Untainted']
      );
      expect(TypeGuards.isUntainted(result2)).toBe(true);
    });
  });
});