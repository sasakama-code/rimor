/**
 * Checker Framework互換層のテスト
 * arXiv:2504.18529v2 Section 2 & 4の実装
 */

import {
  CheckerFrameworkCompatibility,
  AnnotationReader,
  AnnotationWriter,
  TypeChecker,
  QualifierHierarchy,
  SubtypingRules,
  FlowSensitiveTypeRefiner,
  AnnotationFileFormat,
  StubFileGenerator
} from '../../../src/security/compatibility/checker-framework-compatibility';
import { MethodSignature } from '../../../src/security/compatibility/checker-framework-types';
import { 
  TaintQualifier, 
  TaintedType, 
  UntaintedType 
} from '../../../src/security/types/checker-framework-types';

describe('CheckerFrameworkCompatibility', () => {
  let compatibility: CheckerFrameworkCompatibility;
  
  beforeEach(() => {
    compatibility = new CheckerFrameworkCompatibility();
  });
  
  describe('Core compatibility features', () => {
    it('should implement pluggable type system', () => {
      const typeSystem = compatibility.getTypeSystem();
      
      expect(typeSystem.name).toBe('TaintChecker');
      expect(typeSystem.version).toBe('1.0.0');
      expect(typeSystem.qualifiers).toContain('@Tainted');
      expect(typeSystem.qualifiers).toContain('@Untainted');
      expect(typeSystem.qualifiers).toContain('@PolyTaint');
    });
    
    it('should provide Checker Framework compatible APIs', () => {
      // 主要なAPIが存在することを確認
      expect(typeof compatibility.process).toBe('function');
      expect(typeof compatibility.getQualifierHierarchy).toBe('function');
      expect(typeof compatibility.getAnnotatedTypeFactory).toBe('function');
      expect(typeof compatibility.createVisitor).toBe('function');
    });
    
    it('should support annotation file format (.jaif)', () => {
      const annotationData = `
        package com.example:
        class MyClass:
          method process(String)String:
            parameter 0: @Tainted
            return: @Untainted
      `;
      
      const parsed = compatibility.parseAnnotationFile(annotationData);
      
      expect(parsed.annotations.size).toBeGreaterThan(0);
      expect(parsed.getAnnotation('com.example.MyClass', 'process', 'parameter', 0))
        .toBe('@Tainted');
      expect(parsed.getAnnotation('com.example.MyClass', 'process', 'return'))
        .toBe('@Untainted');
    });
  });
  
  describe('AnnotationReader', () => {
    let reader: AnnotationReader;
    
    beforeEach(() => {
      reader = new AnnotationReader();
    });
    
    it('should read annotations from source code comments', () => {
      const code = `
        class SecurityService {
          /*@Tainted*/ String userInput;
          
          // @Untainted
          String sanitized;
          
          /*@ @PolyTaint */ String process(/*@Tainted*/ String input) {
            return sanitize(input);
          }
        }
      `;
      
      const annotations = reader.readFromSource(code);
      
      expect(annotations.get('SecurityService.userInput')).toBe('@Tainted');
      expect(annotations.get('SecurityService.sanitized')).toBe('@Untainted');
      expect(annotations.get('SecurityService.process')).toBe('@PolyTaint');
      expect(annotations.get('SecurityService.process.input')).toBe('@Tainted');
    });
    
    it('should read stub files', () => {
      const stubContent = `
        package java.lang;
        
        class String {
          @PolyTaint String toLowerCase() @PolyTaint;
          @PolyTaint String toUpperCase() @PolyTaint;
          @Untainted int length();
        }
      `;
      
      const stubs = reader.readStubFile(stubContent);
      
      expect(stubs.getMethodAnnotation('java.lang.String', 'toLowerCase'))
        .toBe('@PolyTaint');
      expect(stubs.getMethodAnnotation('java.lang.String', 'length'))
        .toBe('@Untainted');
    });
  });
  
  describe('AnnotationWriter', () => {
    let writer: AnnotationWriter;
    
    beforeEach(() => {
      writer = new AnnotationWriter();
    });
    
    it('should write inferred annotations to .jaif format', () => {
      const annotations = new Map([
        ['com.example.Service.process.input', '@Tainted'],
        ['com.example.Service.process.return', '@Untainted'],
        ['com.example.Service.data', '@Tainted']
      ]);
      
      const jaif = writer.toJAIF(annotations);
      
      expect(jaif).toContain('package com.example:');
      expect(jaif).toContain('class Service:');
      expect(jaif).toContain('field data: @Tainted');
      expect(jaif).toContain('method process');
    });
    
    it('should generate stub files from annotations', () => {
      const classInfo = {
        name: 'UserService',
        package: 'com.example',
        methods: [
          {
            name: 'validateUser',
            parameters: [{ type: 'String', annotation: '@Tainted', index: 0 }],
            returnType: 'boolean',
            annotations: ['@Untainted']
          }
        ]
      };
      
      const stub = writer.generateStub(classInfo);
      
      expect(stub).toContain('package com.example;');
      expect(stub).toContain('class UserService {');
      expect(stub).toContain('@Untainted boolean validateUser(@Tainted String');
    });
  });
  
  describe('TypeChecker', () => {
    let typeChecker: TypeChecker;
    
    beforeEach(() => {
      typeChecker = new TypeChecker();
    });
    
    it('should check assignment compatibility', () => {
      // @Tainted を @Untainted に代入不可
      expect(typeChecker.isAssignable('@Tainted', '@Untainted')).toBe(false);
      
      // @Untainted を @Tainted に代入可能（安全な方向）
      expect(typeChecker.isAssignable('@Untainted', '@Tainted')).toBe(true);
      
      // 同じ型は代入可能
      expect(typeChecker.isAssignable('@Tainted', '@Tainted')).toBe(true);
    });
    
    it('should check method invocation compatibility', () => {
      const methodSig: MethodSignature = {
        className: 'TestClass',
        methodName: 'testMethod',
        parameters: [
          { type: '@Untainted', index: 0 },
          { type: '@Untainted', index: 1 }
        ],
        returnType: '@Tainted'
      };
      
      // 正しい引数
      expect(typeChecker.checkMethodCall(
        methodSig,
        ['@Untainted', '@Untainted']
      )).toEqual({ safe: true, violations: [] });
      
      // 間違った引数（@Taintedを@Untaintedパラメータに渡す）
      const result = typeChecker.checkMethodCall(
        methodSig,
        ['@Tainted', '@Untainted']
      );
      expect(result.safe).toBe(false);
      expect(result.violations).toContain('Incompatible argument at position 0');
    });
    
    it('should support polymorphic type checking', () => {
      // @PolyTaint は文脈に応じて@Taintedまたは@Untaintedになる
      const polyMethod: MethodSignature = {
        className: 'TestClass',
        methodName: 'polyMethod',
        parameters: [{ type: '@PolyTaint', index: 0 }],
        returnType: '@PolyTaint',
        annotations: ['@PolyTaint']
      };
      
      // @Tainted文脈
      const taintedInstance = typeChecker.instantiatePolyTaint(
        polyMethod,
        '@Tainted'
      );
      expect(taintedInstance.qualifier).toBe('@Tainted');
      expect(taintedInstance.confidence).toBeGreaterThan(0);
      
      // @Untainted文脈
      const untaintedInstance = typeChecker.instantiatePolyTaint(
        polyMethod,
        '@Untainted'
      );
      expect(untaintedInstance.qualifier).toBe('@Untainted');
      expect(untaintedInstance.confidence).toBeGreaterThan(0);
    });
  });
  
  describe('QualifierHierarchy', () => {
    let hierarchy: QualifierHierarchy;
    
    beforeEach(() => {
      hierarchy = new QualifierHierarchy();
    });
    
    it('should define subtyping relations', () => {
      // @Untainted <: @Tainted (untainted is subtype of tainted)
      expect(hierarchy.isSubtype('@Untainted', '@Tainted')).toBe(true);
      expect(hierarchy.isSubtype('@Tainted', '@Untainted')).toBe(false);
    });
    
    it('should compute least upper bound (LUB)', () => {
      expect(hierarchy.lub('@Tainted', '@Untainted')).toBe('@Tainted');
      expect(hierarchy.lub('@Untainted', '@Untainted')).toBe('@Untainted');
      expect(hierarchy.lub('@Tainted', '@Tainted')).toBe('@Tainted');
    });
    
    it('should compute greatest lower bound (GLB)', () => {
      expect(hierarchy.glb('@Tainted', '@Untainted')).toBe('@Untainted');
      expect(hierarchy.glb('@Untainted', '@Untainted')).toBe('@Untainted');
      expect(hierarchy.glb('@Tainted', '@Tainted')).toBe('@Tainted');
    });
    
    it('should handle polymorphic qualifiers', () => {
      // @PolyTaint は特殊なケース
      expect(hierarchy.isPolymorphic('@PolyTaint')).toBe(true);
      expect(hierarchy.isPolymorphic('@Tainted')).toBe(false);
    });
  });
  
  describe('FlowSensitiveTypeRefiner', () => {
    let refiner: FlowSensitiveTypeRefiner;
    
    beforeEach(() => {
      refiner = new FlowSensitiveTypeRefiner();
    });
    
    it('should refine types based on control flow', () => {
      const code = `
        String data = getUserInput(); // @Tainted
        if (isValid(data)) {
          data = sanitize(data); // Now @Untainted
          useData(data); // Should see @Untainted
        }
      `;
      
      const refinements = refiner.analyze(code);
      
      expect(refinements.getTypeAt('data', 1)).toBe('@Tainted');
      expect(refinements.getTypeAt('data', 4)).toBe('@Untainted');
    });
    
    it('should handle conditional refinement', () => {
      const code = `
        String value = unknown(); // @Tainted by default
        if (value instanceof SafeString) {
          // value is @Untainted in this branch
          process(value);
        } else {
          // value remains @Tainted
          sanitize(value);
        }
      `;
      
      const refinements = refiner.analyze(code);
      
      expect(refinements.getTypeInBranch('value', 'then')).toBe('@Untainted');
      expect(refinements.getTypeInBranch('value', 'else')).toBe('@Tainted');
    });
  });
  
  describe('Integration with existing code', () => {
    it('should convert between internal and Checker Framework representations', () => {
      const internalType: TaintedType<string> = {
        __brand: '@Tainted',
        __value: 'user input',
        __source: 'user',
        __confidence: 0.9
      };
      
      const cfType = compatibility.toCheckerFrameworkType(internalType);
      expect(cfType.qualifier).toBe('@Tainted');
      expect(cfType.baseType).toBe('String');
      
      const backToInternal = compatibility.fromCheckerFrameworkType(cfType);
      expect(backToInternal.__brand).toBe('@Tainted');
    });
    
    it('should support gradual migration', () => {
      // 既存コードに段階的にアノテーションを追加
      const migration = compatibility.createMigrationPlan({
        name: 'test-migration',
        version: '1.0.0',
        includePaths: ['src/services/*.ts']
      });
      
      expect(migration.phases).toHaveLength(3);
      expect(migration.phases[0].description).toContain('public APIs');
      expect(migration.estimatedHours).toBeDefined();
    });
  });
});

describe('StubFileGenerator', () => {
  let generator: StubFileGenerator;
  
  beforeEach(() => {
    generator = new StubFileGenerator();
  });
  
  it('should generate stub files for JavaScript built-ins', () => {
    const stringStub = generator.generateForBuiltin('String');
    
    expect(stringStub).toContain('class String');
    expect(stringStub).toContain('@PolyTaint String toLowerCase()');
    expect(stringStub).toContain('@PolyTaint String toUpperCase()');
    expect(stringStub).toContain('@Untainted number length');
  });
  
  it('should generate stub files for common libraries', () => {
    const lodashStub = generator.generateForLibrary('lodash', {
      name: 'lodash',
      version: '4.17.21',
      customAnnotations: {
        'escape': '@Untainted',
        'trim': '@PolyTaint'
      }
    });
    
    expect(lodashStub).toContain('@Untainted String escape(@Tainted String');
    expect(lodashStub).toContain('@PolyTaint String trim(@PolyTaint String');
  });
});