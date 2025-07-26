import { ScopeInfo } from '../types';

/**
 * スコープ分析機能
 */
export class ScopeAnalyzer {
  /**
   * スコープコンテキストの分析
   */
  async analyzeScopeContext(fileContent: string, targetLine: number): Promise<ScopeInfo[]> {
    const scopes: ScopeInfo[] = [];
    const lines = fileContent.split('\n');
    let braceLevel = 0;
    let currentScope: ScopeInfo | null = null;
    let globalScope: ScopeInfo | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // ブレースのカウント
      for (const char of line) {
        if (char === '{') {
          braceLevel++;
          
          // 新しいスコープの開始
          if (currentScope && currentScope.endLine === -1) {
            currentScope.startLine = lineNumber;
          } else if (!currentScope || currentScope.endLine !== -1) {
            const scopeType = this.determineScopeType(line);
            const newScope: ScopeInfo = {
              type: scopeType as 'global' | 'function' | 'class' | 'block' | 'module',
              startLine: lineNumber,
              endLine: -1,
              variables: [],
              parent: currentScope || undefined,
              children: [],
              functions: [],
              level: braceLevel,
              parentScope: currentScope?.type
            };
            
            if (scopeType === 'function' || scopeType === 'class' || scopeType === 'method') {
              scopes.push(newScope);
              currentScope = newScope;
            }
          }
        } else if (char === '}') {
          braceLevel--;
          
          // スコープの終了
          if (currentScope && currentScope.endLine === -1) {
            currentScope.endLine = lineNumber;
            currentScope = null;
          }
        }
      }
      
      // グローバルスコープの処理
      if (braceLevel === 0) {
        if (!globalScope) {
          globalScope = {
            type: 'global',
            startLine: 1,
            endLine: -1,
            variables: [],
            parent: undefined,
            children: [],
            functions: [],
            level: 0,
            parentScope: undefined
          };
          scopes.push(globalScope);
        }
        
        // グローバルレベルの変数や関数を検出
        const variable = this.extractVariableFromLine(line);
        if (variable && globalScope) {
          globalScope.variables.push(variable);
        }
        
        const functionName = this.extractFunctionFromLine(line);
        if (functionName && globalScope) {
          if (!globalScope.functions) {
            globalScope.functions = [];
          }
          globalScope.functions.push(functionName);
        }
      }
    }
    
    // 未完了のスコープを閉じる
    for (const scope of scopes) {
      if (scope.endLine === -1) {
        scope.endLine = lines.length;
      }
    }
    
    return scopes;
  }

  /**
   * 特定の行のスコープを特定
   */
  findScopeAtLine(scopes: ScopeInfo[], targetLine: number): ScopeInfo | null {
    for (const scope of scopes) {
      if (targetLine >= scope.startLine && targetLine <= scope.endLine) {
        return scope;
      }
    }
    return null;
  }

  /**
   * スコープ階層の取得
   */
  getScopeHierarchy(scopes: ScopeInfo[], targetLine: number): ScopeInfo[] {
    const hierarchy: ScopeInfo[] = [];
    
    // 対象行を含むすべてのスコープを収集
    const containingScopes = scopes.filter(scope => 
      targetLine >= scope.startLine && targetLine <= scope.endLine
    );
    
    // レベル順にソート
    containingScopes.sort((a, b) => (a.level || 0) - (b.level || 0));
    
    return containingScopes;
  }

  /**
   * スコープ内の変数一覧取得
   */
  getVariablesInScope(scope: ScopeInfo): string[] {
    return scope.variables;
  }

  /**
   * スコープ内の関数一覧取得
   */
  getFunctionsInScope(scope: ScopeInfo): string[] {
    return scope.functions || [];
  }

  // Private helper methods

  /**
   * 行からスコープタイプを判定
   */
  private determineScopeType(line: string): string {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('function') || trimmedLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/)) {
      return 'function';
    }
    
    if (trimmedLine.includes('class ')) {
      return 'class';
    }
    
    if (trimmedLine.includes('if ')) {
      return 'if';
    }
    
    if (trimmedLine.includes('for ') || trimmedLine.includes('while ')) {
      return 'loop';
    }
    
    if (trimmedLine.includes('try ')) {
      return 'try';
    }
    
    if (trimmedLine.includes('catch ')) {
      return 'catch';
    }
    
    if (trimmedLine.includes('=>')) {
      return 'arrow-function';
    }
    
    // メソッドの検出（クラス内での関数定義）
    if (trimmedLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/)) {
      return 'method';
    }
    
    return 'block';
  }

  /**
   * 行から変数名を抽出
   */
  private extractVariableFromLine(line: string): string | null {
    const patterns = [
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?!function)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * 行から関数名を抽出
   */
  private extractFunctionFromLine(line: string): string | null {
    const patterns = [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?function/,
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * ネストレベルの計算
   */
  calculateNestingLevel(line: string, currentLevel: number): number {
    let level = currentLevel;
    
    for (const char of line) {
      if (char === '{') {
        level++;
      } else if (char === '}') {
        level--;
      }
    }
    
    return Math.max(0, level);
  }

  /**
   * クロージャーの検出
   */
  detectClosures(fileContent: string): Array<{
    startLine: number;
    endLine: number;
    capturedVariables: string[];
  }> {
    const closures: Array<{
      startLine: number;
      endLine: number;
      capturedVariables: string[];
    }> = [];
    
    const lines = fileContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 関数内関数や関数を返す関数を検出
      if (line.includes('function') && (line.includes('return') || line.includes('=>'))) {
        const capturedVars = this.findCapturedVariables(lines, i);
        if (capturedVars.length > 0) {
          closures.push({
            startLine: i + 1,
            endLine: this.findClosureEnd(lines, i),
            capturedVariables: capturedVars
          });
        }
      }
    }
    
    return closures;
  }

  /**
   * キャプチャされた変数の検出
   */
  private findCapturedVariables(lines: string[], startLine: number): string[] {
    const capturedVars: string[] = [];
    const localVars = new Set<string>();
    
    // 関数の終了を探す
    let braceCount = 0;
    let foundStart = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      if (foundStart) {
        // ローカル変数を収集
        const localVar = this.extractVariableFromLine(line);
        if (localVar) {
          localVars.add(localVar);
        }
        
        // 変数の使用を検出
        const usedVars = this.extractUsedVariables(line);
        for (const usedVar of usedVars) {
          if (!localVars.has(usedVar) && !capturedVars.includes(usedVar)) {
            capturedVars.push(usedVar);
          }
        }
      }
      
      if (foundStart && braceCount === 0) {
        break;
      }
    }
    
    return capturedVars;
  }

  /**
   * 使用されている変数の抽出
   */
  private extractUsedVariables(line: string): string[] {
    const variables: string[] = [];
    const pattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const matches = line.matchAll(pattern);
    
    for (const match of matches) {
      if (match[1] && !this.isKeyword(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * JavaScriptキーワードの判定
   */
  private isKeyword(word: string): boolean {
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
      'throw', 'new', 'this', 'super', 'class', 'extends', 'import', 'export',
      'default', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of'
    ];
    
    return keywords.includes(word);
  }

  /**
   * クロージャーの終了行を検出
   */
  private findClosureEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let foundStart = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      if (foundStart && braceCount === 0) {
        return i + 1;
      }
    }
    
    return lines.length;
  }

  /**
   * スコープ内での変数のシャドウイングを検出
   */
  detectVariableShadowing(scopes: ScopeInfo[]): Array<{
    variable: string;
    outerScope: ScopeInfo;
    innerScope: ScopeInfo;
  }> {
    const shadowings: Array<{
      variable: string;
      outerScope: ScopeInfo;
      innerScope: ScopeInfo;
    }> = [];
    
    for (let i = 0; i < scopes.length; i++) {
      const outerScope = scopes[i];
      
      for (let j = i + 1; j < scopes.length; j++) {
        const innerScope = scopes[j];
        
        // 内側のスコープが外側のスコープに含まれているかチェック
        if (innerScope.startLine >= outerScope.startLine && 
            innerScope.endLine <= outerScope.endLine &&
            (innerScope.level || 0) > (outerScope.level || 0)) {
          
          // 同じ変数名を探す
          for (const outerVar of outerScope.variables) {
            if (innerScope.variables.includes(outerVar)) {
              shadowings.push({
                variable: outerVar,
                outerScope,
                innerScope
              });
            }
          }
        }
      }
    }
    
    return shadowings;
  }
}