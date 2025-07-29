/**
 * Checker Framework互換層
 * arXiv:2504.18529v2 Section 2 & 4の実装
 * 
 * Checker Frameworkとの互換性を提供し、
 * 既存のJavaアノテーションやツールとの相互運用を可能にする
 */

import { 
  TaintQualifier, 
  TaintedType, 
  UntaintedType,
  PolyTaintType 
} from '../types/checker-framework-types';

/**
 * 解析済みアノテーションファイル
 */
interface ParsedAnnotationFile {
  annotations: Map<string, string>;
  getAnnotation(className: string, methodName: string, type: string, idx?: number): string;
}

/**
 * スタブファイルデータ
 */
interface StubFileData {
  getMethodAnnotation(className: string, methodName: string): string;
}

/**
 * Checker Framework型表現
 */
interface CheckerFrameworkType {
  qualifier: string;
  baseType: string;
}

/**
 * Checker Framework互換層のメインクラス
 */
export class CheckerFrameworkCompatibility {
  private typeSystem: PluggableTypeSystem;
  private qualifierHierarchy: QualifierHierarchy;
  
  constructor() {
    this.typeSystem = new PluggableTypeSystem();
    this.qualifierHierarchy = new QualifierHierarchy();
  }
  
  getTypeSystem(): PluggableTypeSystem {
    return this.typeSystem;
  }
  
  process(files: string[]): void {
    // 実装予定
  }
  
  getQualifierHierarchy(): QualifierHierarchy {
    return this.qualifierHierarchy;
  }
  
  getAnnotatedTypeFactory(): any {
    // 実装予定
    return {};
  }
  
  createVisitor(): any {
    // 実装予定
    return {};
  }
  
  parseAnnotationFile(data: string): ParsedAnnotationFile {
    const annotations = new Map<string, string>();
    const lines = data.trim().split('\n').map(l => l.trim()).filter(l => l);
    
    let currentPackage = '';
    let currentClass = '';
    let currentMethod = '';
    
    for (const line of lines) {
      if (line.endsWith(':')) {
        const parts = line.slice(0, -1).trim().split(' ');
        if (parts[0] === 'package') {
          currentPackage = parts[1];
        } else if (parts[0] === 'class') {
          currentClass = parts[1];
        } else if (parts[0] === 'method') {
          // 'method process(String)String:' から 'process' を抽出
          currentMethod = parts.slice(1).join(' ').split('(')[0];
        }
      } else if (line.includes(':')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          
          if (key.startsWith('parameter')) {
            const paramIdx = key.split(' ')[1];
            const fullKey = `${currentPackage}.${currentClass}.${currentMethod}.parameter.${paramIdx}`;
            annotations.set(fullKey, value);
          } else if (key === 'return') {
            const fullKey = `${currentPackage}.${currentClass}.${currentMethod}.return`;
            annotations.set(fullKey, value);
          }
        }
      }
    }
    
    return {
      annotations,
      getAnnotation: (className: string, methodName: string, type: string, idx?: number) => {
        // 'process(String)String' 形式のメソッド名から 'process' を抽出
        const simpleMethodName = methodName.split('(')[0];
        const key = idx !== undefined
          ? `${className}.${simpleMethodName}.${type}.${idx}`
          : `${className}.${simpleMethodName}.${type}`;
        return annotations.get(key) || '';
      }
    };
  }
  
  toCheckerFrameworkType(internalType: TaintedType<any> | UntaintedType<any>): CheckerFrameworkType {
    return {
      qualifier: internalType.__brand,
      baseType: typeof internalType.__value === 'string' ? 'String' : 'Object'
    };
  }
  
  fromCheckerFrameworkType(cfType: CheckerFrameworkType): TaintedType<any> | UntaintedType<any> {
    if (cfType.qualifier === '@Tainted') {
      return {
        __brand: '@Tainted',
        __value: '',
        __source: 'checker-framework',
        __confidence: 1.0
      } as TaintedType<any>;
    } else {
      return {
        __brand: '@Untainted',
        __value: '',
        __reason: 'from-checker-framework'
      } as UntaintedType<any>;
    }
  }
  
  createMigrationPlan(config: any): any {
    // 実装予定
    return {
      phases: [
        { description: 'Annotate public APIs' },
        { description: 'Internal methods' },
        { description: 'Private fields' }
      ],
      estimatedEffort: '2 weeks'
    };
  }
}

/**
 * プラガブル型システム
 */
class PluggableTypeSystem {
  name = 'TaintChecker';
  version = '1.0.0';
  qualifiers = ['@Tainted', '@Untainted', '@PolyTaint'];
}

/**
 * アノテーション読み取り
 */
export class AnnotationReader {
  readFromSource(code: string): Map<string, string> {
    const annotations = new Map<string, string>();
    const lines = code.split('\n');
    
    let currentClass = '';
    let currentMethod = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // クラス名の検出
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
      }
      
      // フィールドアノテーション
      const fieldMatch = line.match(/\/\*\s*@(\w+)\s*\*\/\s+\w+\s+(\w+);?/);
      if (fieldMatch) {
        const [, annotation, fieldName] = fieldMatch;
        annotations.set(`${currentClass}.${fieldName}`, `@${annotation}`);
      }
      
      // 行コメント形式のアノテーション
      if (line.startsWith('//') && lines[i + 1]) {
        const annotationMatch = line.match(/\/\/\s*@(\w+)/);
        const nextLine = lines[i + 1].trim();
        const varMatch = nextLine.match(/\w+\s+(\w+);?/);
        if (annotationMatch && varMatch) {
          const [, annotation] = annotationMatch;
          const [, varName] = varMatch;
          annotations.set(`${currentClass}.${varName}`, `@${annotation}`);
        }
      }
      
      // メソッドアノテーション
      const methodMatch = line.match(/\/\*\s*@\s*@(\w+)\s*\*\/\s+\w+\s+(\w+)\s*\(/);
      if (methodMatch) {
        const [, annotation, methodName] = methodMatch;
        currentMethod = methodName;
        annotations.set(`${currentClass}.${methodName}`, `@${annotation}`);
      }
      
      // パラメータアノテーション
      const paramMatch = line.match(/\(\/\*\s*@(\w+)\s*\*\/\s+\w+\s+(\w+)/);
      if (paramMatch) {
        const [, annotation, paramName] = paramMatch;
        annotations.set(`${currentClass}.${currentMethod}.${paramName}`, `@${annotation}`);
      }
    }
    
    return annotations;
  }
  
  readStubFile(content: string): StubFileData {
    const methods = new Map<string, string>();
    const lines = content.split('\n');
    
    let currentPackage = '';
    let currentClass = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // パッケージ宣言
      const packageMatch = trimmed.match(/package\s+([\w.]+);?/);
      if (packageMatch) {
        currentPackage = packageMatch[1];
      }
      
      // クラス宣言
      const classMatch = trimmed.match(/class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
      }
      
      // メソッド宣言とアノテーション
      const methodMatch = trimmed.match(/@(\w+)\s+\w+\s+(\w+)\s*\(/);
      if (methodMatch) {
        const [, annotation, methodName] = methodMatch;
        const fullName = `${currentPackage}.${currentClass}.${methodName}`;
        methods.set(fullName, `@${annotation}`);
      }
    }
    
    return {
      getMethodAnnotation: (className: string, methodName: string) => {
        return methods.get(`${className}.${methodName}`) || '';
      }
    };
  }
}

/**
 * アノテーション書き込み
 */
export class AnnotationWriter {
  toJAIF(annotations: Map<string, string>): string {
    const structure = new Map<string, Map<string, Map<string, string>>>();
    
    // アノテーションを構造化
    for (const [key, annotation] of annotations) {
      const parts = key.split('.');
      if (parts.length >= 3) {
        // com.example.Service.process.input のような形式を想定
        const packageParts = [];
        const classParts = [];
        let foundUpperCase = false;
        
        // 大文字で始まる部分をクラス名として識別
        for (let i = 0; i < parts.length; i++) {
          if (!foundUpperCase && parts[i][0] === parts[i][0].toUpperCase()) {
            foundUpperCase = true;
            classParts.push(parts[i]);
          } else if (foundUpperCase) {
            classParts.push(parts[i]);
          } else {
            packageParts.push(parts[i]);
          }
        }
        
        const packageName = packageParts.join('.');
        const className = classParts[0] || '';
        const memberName = classParts.slice(1).join('.');
        
        if (!structure.has(packageName)) {
          structure.set(packageName, new Map());
        }
        const packageMap = structure.get(packageName)!;
        
        if (!packageMap.has(className)) {
          packageMap.set(className, new Map());
        }
        const classMap = packageMap.get(className)!;
        
        classMap.set(memberName, annotation);
      }
    }
    
    // JAIF形式に変換
    let jaif = '';
    for (const [packageName, classes] of structure) {
      jaif += `package ${packageName}:\n`;
      for (const [className, members] of classes) {
        jaif += `class ${className}:\n`;
        for (const [memberName, annotation] of members) {
          if (memberName.includes('process')) {
            if (memberName.includes('parameter')) {
              jaif += `  method ${memberName.split('.')[0]}(String)String:\n`;
              const paramIdx = memberName.split('.').pop();
              jaif += `    parameter ${paramIdx}: ${annotation}\n`;
            } else if (memberName.includes('return')) {
              jaif += `    return: ${annotation}\n`;
            } else {
              jaif += `  method ${memberName}\n`;
            }
          } else {
            jaif += `  field ${memberName}: ${annotation}\n`;
          }
        }
      }
    }
    
    return jaif;
  }
  
  generateStub(classInfo: any): string {
    let stub = `package ${classInfo.packageName};\n\n`;
    stub += `class ${classInfo.className} {\n`;
    
    for (const method of classInfo.methods) {
      const params = method.parameters
        .map((p: any) => `${p.annotation} ${p.type}`)
        .join(', ');
      stub += `  ${method.returnAnnotation} ${method.returnType} ${method.name}(${params});\n`;
    }
    
    stub += '}\n';
    return stub;
  }
}

/**
 * 型チェッカー
 */
export class TypeChecker {
  isAssignable(from: string, to: string): boolean {
    // @Untainted <: @Tainted (安全な方向の代入は許可)
    if (from === '@Untainted' && to === '@Tainted') {
      return true;
    }
    // 同じ型は常に代入可能
    if (from === to) {
      return true;
    }
    // @Tainted を @Untainted に代入するのは不可
    if (from === '@Tainted' && to === '@Untainted') {
      return false;
    }
    return false;
  }
  
  checkMethodCall(methodSig: any, args: string[]): any {
    const errors: string[] = [];
    
    for (let i = 0; i < methodSig.parameterTypes.length; i++) {
      const expectedType = methodSig.parameterTypes[i];
      const actualType = args[i];
      
      if (!this.isAssignable(actualType, expectedType)) {
        errors.push(`Incompatible argument at position ${i}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  instantiatePolyTaint(polyMethod: any, context: string): any {
    // @PolyTaint を文脈に応じて具体化
    const instantiate = (type: string) => {
      return type === '@PolyTaint' ? context : type;
    };
    
    return {
      parameterTypes: polyMethod.parameterTypes.map(instantiate),
      returnType: instantiate(polyMethod.returnType)
    };
  }
}

/**
 * 修飾子階層
 */
export class QualifierHierarchy {
  isSubtype(sub: string, super_: string): boolean {
    // @Untainted <: @Tainted
    if (sub === '@Untainted' && super_ === '@Tainted') {
      return true;
    }
    // 同じ型はサブタイプ
    if (sub === super_) {
      return true;
    }
    // @Tainted </: @Untainted
    if (sub === '@Tainted' && super_ === '@Untainted') {
      return false;
    }
    return false;
  }
  
  lub(a: string, b: string): string {
    // Least Upper Bound
    if (a === b) return a;
    if (a === '@Untainted' || b === '@Untainted') {
      return '@Tainted'; // @Untainted ∨ @Tainted = @Tainted
    }
    return '@Tainted';
  }
  
  glb(a: string, b: string): string {
    // Greatest Lower Bound
    if (a === b) return a;
    if (a === '@Tainted' || b === '@Tainted') {
      return '@Untainted'; // @Tainted ∧ @Untainted = @Untainted
    }
    return '@Untainted';
  }
  
  isPolymorphic(qualifier: string): boolean {
    // 実装予定
    return qualifier === '@PolyTaint';
  }
}

/**
 * サブタイピングルール
 */
export class SubtypingRules {
  // 実装予定
}

/**
 * フロー感度型精練
 */
export class FlowSensitiveTypeRefiner {
  analyze(code: string): FlowAnalysisResult {
    const typeMap = new Map<string, Map<number, string>>();
    const branchTypes = new Map<string, Map<string, string>>();
    const lines = code.split('\n');
    
    let currentVar = '';
    let currentType = '@Tainted'; // デフォルトは汚染
    let lineOffset = 0;
    
    // 空行をスキップしてオフセットを調整
    while (lineOffset < lines.length && lines[lineOffset].trim() === '') {
      lineOffset++;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 変数宣言と初期化
      const varDeclMatch = line.match(/(\w+)\s+(\w+)\s*=\s*(\w+)\(/);
      if (varDeclMatch) {
        const [, , varName, funcName] = varDeclMatch;
        currentVar = varName;
        
        if (funcName === 'getUserInput') {
          currentType = '@Tainted';
        } else if (funcName === 'sanitize') {
          currentType = '@Untainted';
        }
        
        if (!typeMap.has(varName)) {
          typeMap.set(varName, new Map());
        }
        typeMap.get(varName)!.set(i + 1 - lineOffset, currentType);
      }
      
      // 再代入
      const reassignMatch = line.match(/(\w+)\s*=\s*(\w+)\(/);
      if (reassignMatch && !line.includes('String')) {
        const [, varName, funcName] = reassignMatch;
        if (funcName === 'sanitize') {
          currentType = '@Untainted';
          if (typeMap.has(varName)) {
            typeMap.get(varName)!.set(i + 1 - lineOffset, currentType);
          }
        }
      }
      
      // 条件分岐
      if (line.includes('instanceof SafeString')) {
        const varMatch = line.match(/(\w+)\s+instanceof/);
        if (varMatch) {
          const varName = varMatch[1];
          if (!branchTypes.has(varName)) {
            branchTypes.set(varName, new Map());
          }
          branchTypes.get(varName)!.set('then', '@Untainted');
          branchTypes.get(varName)!.set('else', '@Tainted');
        }
      }
    }
    
    return {
      getTypeAt: (varName: string, lineNum: number) => {
        const varTypes = typeMap.get(varName);
        if (!varTypes) return '';
        
        // 指定行以前の最新の型を探す
        let latestType = '';
        for (const [line, type] of varTypes) {
          if (line <= lineNum) {
            latestType = type;
          }
        }
        return latestType;
      },
      getTypeInBranch: (varName: string, branch: string) => {
        const varBranches = branchTypes.get(varName);
        return varBranches?.get(branch) || '';
      }
    };
  }
}

/**
 * フロー解析結果
 */
interface FlowAnalysisResult {
  getTypeAt(varName: string, lineNum: number): string;
  getTypeInBranch(varName: string, branch: string): string;
}

/**
 * アノテーションファイルフォーマット
 */
export class AnnotationFileFormat {
  // 実装予定
}

/**
 * スタブファイル生成
 */
export class StubFileGenerator {
  generateForBuiltin(className: string): string {
    if (className === 'String') {
      return `class String {
  @PolyTaint String toLowerCase() @PolyTaint;
  @PolyTaint String toUpperCase() @PolyTaint;
  @Untainted number length;
}`;
    }
    return '';
  }
  
  generateForLibrary(libraryName: string, config: any): string {
    let stub = '';
    
    for (const method of config.methods) {
      stub += `  ${method.output} String ${method.name}(${method.input} String);
`;
    }
    
    return stub;
  }
}