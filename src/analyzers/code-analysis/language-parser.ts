import * as path from 'path';
import { FunctionInfo, ClassInfo, InterfaceInfo, VariableInfo } from '../types';

/**
 * 言語固有の解析機能
 */
export class LanguageAnalyzer {
  /**
   * ファイル拡張子から言語を検出
   */
  detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'typescriptreact';
      case '.js':
        return 'javascript';
      case '.jsx':
        return 'javascriptreact';
      case '.py':
        return 'python';
      case '.java':
        return 'java';
      case '.cs':
        return 'csharp';
      case '.cpp':
      case '.cc':
      case '.cxx':
        return 'cpp';
      case '.c':
        return 'c';
      case '.go':
        return 'go';
      case '.rs':
        return 'rust';
      case '.php':
        return 'php';
      case '.rb':
        return 'ruby';
      default:
        return 'unknown';
    }
  }

  /**
   * 関数情報の抽出
   */
  async extractFunctionInfo(fileContent: string, language: string): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];
    const lines = fileContent.split('\n');
    
    if (language === 'typescript' || language === 'javascript') {
      return this.extractJavaScriptFunctions(lines);
    }
    
    if (language === 'python') {
      return this.extractPythonFunctions(lines);
    }
    
    if (language === 'java') {
      return this.extractJavaFunctions(lines);
    }
    
    return functions;
  }

  /**
   * クラス情報の抽出
   */
  extractClassInfo(fileContent: string, language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const lines = fileContent.split('\n');
    
    if (language === 'typescript' || language === 'javascript') {
      return this.extractJavaScriptClasses(lines, language);
    }
    
    if (language === 'python') {
      return this.extractPythonClasses(lines);
    }
    
    if (language === 'java') {
      return this.extractJavaClasses(lines);
    }
    
    return classes;
  }

  /**
   * インターフェース情報の抽出
   */
  extractInterfaceInfo(fileContent: string, language: string): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];
    const lines = fileContent.split('\n');
    
    if (language === 'typescript') {
      return this.extractTypeScriptInterfaces(lines);
    }
    
    if (language === 'java') {
      return this.extractJavaInterfaces(lines);
    }
    
    return interfaces;
  }

  /**
   * 変数情報の抽出
   */
  extractVariableInfo(fileContent: string, language: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = fileContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (language === 'typescript' || language === 'javascript') {
        const jsVars = this.extractJavaScriptVariables(line, i + 1);
        variables.push(...jsVars);
      } else if (language === 'python') {
        const pyVars = this.extractPythonVariables(line, i + 1);
        variables.push(...pyVars);
      }
    }
    
    return variables;
  }

  /**
   * インポート文の抽出
   */
  extractImports(fileContent: string, language: string): Array<{ source: string }> {
    const imports: Array<{ source: string }> = [];
    const lines = fileContent.split('\n');
    
    const importRegexes = this.getImportRegexes(language);
    
    for (const line of lines) {
      for (const regex of importRegexes) {
        const match = line.match(regex);
        if (match && match[1]) {
          imports.push({ source: match[1] });
        }
      }
    }
    
    return imports;
  }

  /**
   * エクスポート文の抽出
   */
  extractExports(fileContent: string, language: string): string[] {
    const exports: string[] = [];
    const lines = fileContent.split('\n');
    
    const exportRegexes = this.getExportRegexes(language);
    
    for (const line of lines) {
      for (const regex of exportRegexes) {
        const match = line.match(regex);
        if (match && match[1]) {
          exports.push(match[1]);
        }
      }
    }
    
    return exports;
  }

  /**
   * 使用されているAPIの抽出
   */
  extractUsedAPIs(fileContent: string, language: string): string[] {
    const apis: string[] = [];
    const patterns = this.getAPIPatterns(language);
    
    for (const pattern of patterns) {
      const matches = fileContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2]) {
          apis.push(`${match[1]}.${match[2]}`);
        }
      }
    }
    
    return [...new Set(apis)];
  }

  // Private helper methods

  private extractJavaScriptFunctions(lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const functionRegexes = [
      /^[\s]*(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      /^[\s]*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
      /^[\s]*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/,
      /^[\s]*(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/
    ];
    
    // Skip if-statements, for-loops, etc
    const skipPatterns = [
      /^[\s]*(?:if|for|while|switch|catch|try)\s*\(/,
      /^[\s]*}\s*else\s*(?:if)?/
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip lines that are not function declarations
      let shouldSkip = false;
      for (const skipPattern of skipPatterns) {
        if (skipPattern.test(line)) {
          shouldSkip = true;
          break;
        }
      }
      if (shouldSkip) continue;
      
      for (const regex of functionRegexes) {
        const match = line.match(regex);
        if (match) {
          const functionName = match[1];
          
          // constructorはスキップ
          if (functionName === 'constructor') {
            break;
          }
          
          let braceCount = 0;
          let foundStart = false;
          let endLine = i;
          
          // 関数の終了行を探す
          for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j];
            
            for (const char of currentLine) {
              if (char === '{') {
                braceCount++;
                foundStart = true;
              } else if (char === '}') {
                braceCount--;
              }
            }
            
            if (foundStart && braceCount === 0) {
              endLine = j;
              break;
            }
          }
          
          const functionLines = lines.slice(i, endLine + 1);
          
          functions.push({
            name: functionName,
            startLine: i + 1,
            endLine: endLine + 1,
            parameters: this.extractParameters(line),
            returnType: this.extractReturnType(line),
            isAsync: line.includes('async '),
            isExported: this.isExported(line),
            complexity: this.calculateComplexity(functionLines),
            calls: this.extractFunctionCalls(functionLines),
            calledBy: [],
            variables: this.extractVariablesFromLines(functionLines),
            documentation: this.extractDocumentation(lines, i)
          });
          break;
        }
      }
    }
    
    return functions;
  }

  private extractJavaScriptClasses(lines: string[], language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const classMatch = line.match(/^[\s]*(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      
      if (classMatch) {
        const className = classMatch[1];
        let braceCount = 0;
        let foundStart = false;
        let endLine = i;
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          
          for (const char of currentLine) {
            if (char === '{') {
              braceCount++;
              foundStart = true;
            } else if (char === '}') {
              braceCount--;
            }
          }
          
          if (foundStart && braceCount === 0) {
            endLine = j;
            break;
          }
        }
        
        const members = this.extractClassMembers(lines, i, language);
        
        classes.push({
          name: className,
          startLine: i + 1,
          endLine: endLine + 1,
          methods: members.methods,
          properties: members.properties,
          extends: this.extractExtendsClass(line),
          implements: this.extractImplementsInterfaces(line),
          isExported: this.isExported(line),
          documentation: this.extractDocumentation(lines, i)
        });
      }
    }
    
    return classes;
  }

  private extractTypeScriptInterfaces(lines: string[]): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const interfaceMatch = line.match(/^[\s]*(?:export\s+)?interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      
      if (interfaceMatch) {
        const interfaceName = interfaceMatch[1];
        let braceCount = 0;
        let foundStart = false;
        let endLine = i;
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          
          for (const char of currentLine) {
            if (char === '{') {
              braceCount++;
              foundStart = true;
            } else if (char === '}') {
              braceCount--;
            }
          }
          
          if (foundStart && braceCount === 0) {
            endLine = j;
            break;
          }
        }
        
        const members = this.extractInterfaceMembers(lines, i);
        
        interfaces.push({
          name: interfaceName,
          startLine: i + 1,
          endLine: endLine + 1,
          methods: members.methods,
          properties: members.properties,
          extends: this.extractExtendsInterface(line) ? [this.extractExtendsInterface(line)!] : [],
          isExported: this.isExported(line),
          documentation: this.extractDocumentation(lines, i)
        });
      }
    }
    
    return interfaces;
  }

  private extractJavaScriptVariables(line: string, lineNumber: number): VariableInfo[] {
    const variables: VariableInfo[] = [];
    
    // 通常の変数宣言
    const normalPattern = /(?:(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*))(?:\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$<>[\]]*))?\s*=/g;
    
    // デストラクチャリング構文
    const destructuringPattern = /(const|let|var)\s*\{([^}]+)\}\s*=/g;
    
    // 通常の変数を抽出
    const normalMatches = line.matchAll(normalPattern);
    for (const match of normalMatches) {
      if (match[2]) {
        variables.push({
          name: match[2],
          line: lineNumber,
          type: match[3] || this.extractVariableType(line, match[2]),
          scope: this.determineScope([line], 0),
          isConst: match[1] === 'const',
          isExported: this.isExported(line),
          usage: [],
          kind: match[1] as 'const' | 'let' | 'var'
        });
      }
    }
    
    // デストラクチャリング変数を抽出
    const destructMatches = line.matchAll(destructuringPattern);
    for (const match of destructMatches) {
      if (match[2]) {
        // { name, email } から name と email を抽出
        const vars = match[2].split(',').map(v => v.trim());
        for (const varName of vars) {
          // プロパティの名前変更を処理 (例: { foo: bar })
          const cleanName = varName.includes(':') ? varName.split(':')[1].trim() : varName;
          if (cleanName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanName)) {
            variables.push({
              name: cleanName,
              line: lineNumber,
              type: 'any', // デストラクチャリングの型推論は複雑なので any とする
              scope: this.determineScope([line], 0),
              isConst: match[1] === 'const',
              isExported: this.isExported(line),
              usage: [],
              kind: match[1] as 'const' | 'let' | 'var'
            });
          }
        }
      }
    }
    
    return variables;
  }

  // Placeholder methods for other languages
  private extractPythonFunctions(lines: string[]): FunctionInfo[] {
    // TODO: Implement Python function extraction
    return [];
  }

  private extractPythonClasses(lines: string[]): ClassInfo[] {
    // TODO: Implement Python class extraction
    return [];
  }

  private extractPythonVariables(line: string, lineNumber: number): VariableInfo[] {
    // TODO: Implement Python variable extraction
    return [];
  }

  private extractJavaFunctions(lines: string[]): FunctionInfo[] {
    // TODO: Implement Java function extraction
    return [];
  }

  private extractJavaClasses(lines: string[]): ClassInfo[] {
    // TODO: Implement Java class extraction
    return [];
  }

  private extractJavaInterfaces(lines: string[]): InterfaceInfo[] {
    // TODO: Implement Java interface extraction
    return [];
  }

  // Helper methods
  private getImportRegexes(language: string): RegExp[] {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return [
          /import\s+.*from\s+['"]([^'"]+)['"]/,
          /require\s*\(\s*['"]([^'"]+)['"]\s*\)/
        ];
      case 'python':
        return [
          /from\s+([a-zA-Z0-9_.]+)\s+import/,
          /import\s+([a-zA-Z0-9_.]+)/
        ];
      default:
        return [];
    }
  }

  private getExportRegexes(language: string): RegExp[] {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return [
          /export\s+.*?([a-zA-Z_$][a-zA-Z0-9_$]*)/,
          /module\.exports\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/
        ];
      default:
        return [];
    }
  }

  private getAPIPatterns(language: string): RegExp[] {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return [
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
        ];
      default:
        return [];
    }
  }

  // Helper methods that need to be implemented
  private extractParameters(line: string): string[] {
    const match = line.match(/\(([^)]*)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(p => {
        // パラメータ名のみを抽出（型情報を除去）
        const paramName = p.trim().split(':')[0].trim();
        return paramName;
      }).filter(p => p);
    }
    return [];
  }

  private extractReturnType(line: string): string | undefined {
    // メソッドの引数リストの後の型を抽出
    // 最後の ) を見つけて、その後の : から { までの間を取得
    const lastParenIndex = line.lastIndexOf(')');
    if (lastParenIndex === -1) return undefined;
    
    const afterParen = line.substring(lastParenIndex + 1);
    const match = afterParen.match(/^\s*:\s*([^{]+)/);
    return match ? match[1].trim() : undefined;
  }

  private calculateComplexity(lines: string[]): number {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'];
    let complexity = 1; // Base complexity
    
    for (const line of lines) {
      for (const keyword of complexityKeywords) {
        if (line.includes(keyword)) {
          complexity++;
        }
      }
    }
    
    return complexity;
  }

  private extractFunctionCalls(lines: string[]): string[] {
    const calls: string[] = [];
    
    for (const line of lines) {
      const matches = line.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
      if (matches) {
        for (const match of matches) {
          if (match[1]) {
            calls.push(match[1]);
          }
        }
      }
    }
    
    return [...new Set(calls)];
  }

  private extractVariablesFromLines(lines: string[]): string[] {
    const variables: string[] = [];
    
    for (const line of lines) {
      const matches = line.matchAll(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      for (const match of matches) {
        if (match[1]) {
          variables.push(match[1]);
        }
      }
    }
    
    return [...new Set(variables)];
  }

  private extractDocumentation(lines: string[], lineIndex: number): string | undefined {
    // Look for JSDoc or other documentation before the function
    for (let i = lineIndex - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('/*') || line.startsWith('//')) {
        return line;
      }
      if (line && !line.startsWith('*') && !line.startsWith('//')) {
        break;
      }
    }
    return undefined;
  }

  private extractClassMembers(lines: string[], startLine: number, language: string): {
    methods: string[];
    properties: string[];
  } {
    const methods: string[] = [];
    const properties: string[] = [];
    let braceLevel = 0;
    let foundStart = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceLevel++;
          foundStart = true;
        } else if (char === '}') {
          braceLevel--;
        }
      }
      
      if (braceLevel > 0) {
        // Match various method patterns including async methods
        const methodMatch = line.match(/^\s*(?:async\s+)?(?:static\s+)?(?:private\s+|public\s+|protected\s+)?(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (methodMatch && methodMatch[1] !== 'if' && methodMatch[1] !== 'for' && methodMatch[1] !== 'while' && methodMatch[1] !== 'switch') {
          methods.push(methodMatch[1]);
        }
        
        const propertyMatch = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]/);
        if (propertyMatch && braceLevel > 0) {
          properties.push(propertyMatch[1]);
        }
      }
      
      if (foundStart && braceLevel === 0) {
        break;
      }
    }
    
    return { methods, properties };
  }

  private extractInterfaceMembers(lines: string[], startLine: number): {
    methods: string[];
    properties: string[];
  } {
    const methods: string[] = [];
    const properties: string[] = [];
    let braceLevel = 0;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') braceLevel++;
        else if (char === '}') braceLevel--;
      }
      
      if (braceLevel > 0) {
        const methodMatch = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (methodMatch) {
          methods.push(methodMatch[1]);
        } else {
          const propertyMatch = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/);
          if (propertyMatch) {
            properties.push(propertyMatch[1]);
          }
        }
      }
      
      if (braceLevel === 0 && i > startLine) {
        break;
      }
    }
    
    return { methods, properties };
  }

  private extractVariableType(line: string, varName: string): string | undefined {
    const typeMatch = line.match(new RegExp(`${varName}\\s*:\\s*([^=,}]+)`));
    return typeMatch ? typeMatch[1].trim() : undefined;
  }

  private determineScope(lines: string[], lineIndex: number): string {
    // Simple scope determination - could be enhanced
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('function') || line.includes('class')) {
        return 'local';
      }
    }
    return 'global';
  }

  private extractExtendsClass(line: string): string | undefined {
    const match = line.match(/extends\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : undefined;
  }

  private extractImplementsInterfaces(line: string): string[] {
    const match = line.match(/implements\s+([^{]+)/);
    if (match) {
      return match[1].split(',').map(i => i.trim());
    }
    return [];
  }

  private extractExtendsInterface(line: string): string | undefined {
    const match = line.match(/extends\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : undefined;
  }

  private isExported(line: string): boolean {
    return line.trimStart().startsWith('export ');
  }

  /**
   * 言語固有の機能を解析
   */
  parseLanguageSpecificFeatures(fileContent: string, language: string): any {
    // 言語固有の機能解析を実装
    // 将来的な拡張のためのプレースホルダー
    const features: any = {
      language,
      hasAsync: false,
      hasGenerics: false,
      hasDecorators: false,
      hasJSX: false
    };

    if (language === 'typescript' || language === 'javascript') {
      features.hasAsync = /async\s+function|\basync\s+=>/m.test(fileContent);
      features.hasGenerics = /<[A-Z]\w*>/m.test(fileContent);
      features.hasDecorators = /@\w+\s*\(/m.test(fileContent);
      features.hasJSX = /<[A-Z]\w*[^>]*>/m.test(fileContent);
    }

    return features;
  }
}