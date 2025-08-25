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
    const scopeStack: ScopeInfo[] = [];
    let braceLevel = 0;
    
    // グローバルスコープを作成
    const globalScope: ScopeInfo = {
      type: 'global',
      startLine: 1,
      endLine: lines.length,
      variables: [],
      parent: undefined,
      children: [],
      functions: [],
      level: 0,
      parentScope: undefined
    };
    scopes.push(globalScope);
    scopeStack.push(globalScope);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmedLine = line.trim();
      
      // スコープ開始の検出（{の前に判定）
      const scopeType = this.determineScopeType(line);
      const hasOpenBrace = line.includes('{');
      
      if (hasOpenBrace && (scopeType === 'function' || scopeType === 'block' || scopeType === 'if' || scopeType === 'loop')) {
        const parentScope = scopeStack[scopeStack.length - 1];
        const newScope: ScopeInfo = {
          type: scopeType === 'if' || scopeType === 'loop' ? 'block' : scopeType as 'global' | 'function' | 'class' | 'block' | 'module',
          startLine: lineNumber,
          endLine: -1,
          variables: [],
          parent: parentScope,
          children: [],
          functions: [],
          level: scopeStack.length,
          parentScope: parentScope?.type
        };
        
        scopes.push(newScope);
        scopeStack.push(newScope);
        if (parentScope) {
          parentScope.children.push(newScope);
        }
      }
      
      // 現在のスコープに変数を追加
      const currentScope = scopeStack[scopeStack.length - 1];
      if (currentScope) {
        const variable = this.extractVariableFromLine(line);
        if (variable) {
          currentScope.variables.push(variable);
        }
        
        const functionName = this.extractFunctionFromLine(line);
        if (functionName) {
          if (!currentScope.functions) {
            currentScope.functions = [];
          }
          currentScope.functions.push(functionName);
        }
      }
      
      // ブレースのカウント
      for (const char of line) {
        if (char === '{') {
          braceLevel++;
        } else if (char === '}') {
          braceLevel--;
          
          // スコープの終了
          if (scopeStack.length > 1) {
            const closingScope = scopeStack.pop();
            if (closingScope && closingScope.endLine === -1) {
              closingScope.endLine = lineNumber;
            }
          }
        }
      }
    }
    
    // 未完了のスコープを閉じる
    for (const scope of scopes) {
      if (scope.endLine === -1) {
        scope.endLine = lines.length;
      }
    }
    
    // すべてのスコープを返す（getScopeHierarchyなどで使用するため）
    return scopes;
  }

  /**
   * コンテンツからスコープ階層を分析
   */
  async analyzeScopeHierarchy(content: string, language: string): Promise<ScopeInfo[]> {
    // 言語に依存しない基本的なスコープ分析を実行
    // targetLineは1を使用（全体のスコープ階層を取得）
    return this.analyzeScopeContext(content, 1);
  }

  /**
   * スコープの抽出（エイリアス）
   * @deprecated analyzeScopeContextを使用してください
   */
  extractScopes(content: string, language: string): ScopeInfo[] {
    // 同期的に処理を実行（後方互換性のため）
    const scopes: ScopeInfo[] = [];
    const lines = content.split('\n');
    
    // 簡易的なスコープ抽出
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('{')) {
        scopes.push({
          type: 'block',
          startLine: i + 1,
          endLine: i + 1,
          variables: [],
          children: [],
          level: 0
        });
      }
    }
    
    return scopes;
  }

  /**
   * 特定の行のスコープを特定
   */
  findScopeAtLine(scopes: ScopeInfo[], targetLine: number): ScopeInfo | null {
    // 対象行を含むすべてのスコープを見つける
    const containingScopes = scopes.filter(scope => 
      targetLine >= scope.startLine && targetLine <= scope.endLine
    );
    
    if (containingScopes.length === 0) {
      return null;
    }
    
    // レベルが最も深いスコープを返す
    containingScopes.sort((a, b) => (b.level || 0) - (a.level || 0));
    return containingScopes[0];
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
    
    // 関数定義の検出（より厳密に）
    if (trimmedLine.match(/(?:async\s+)?function\s+[a-zA-Z_$]/) || 
        trimmedLine.match(/(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(?:async\s+)?function/) ||
        trimmedLine.match(/(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\([^)]*\)\s*=>/) ||
        trimmedLine.match(/^\s*(?:async\s+)?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/) && !trimmedLine.includes('if') && !trimmedLine.includes('for') && !trimmedLine.includes('while')) {
      return 'function';
    }
    
    if (trimmedLine.includes('class ')) {
      return 'class';
    }
    
    if (trimmedLine.match(/\bif\s*\(/)) {
      return 'if';
    }
    
    if (trimmedLine.match(/\b(?:for|while)\s*\(/)) {
      return 'loop';
    }
    
    if (trimmedLine.match(/\btry\s*\{/)) {
      return 'try';
    }
    
    if (trimmedLine.match(/\bcatch\s*\(/)) {
      return 'catch';
    }
    
    if (trimmedLine.includes('=>') && trimmedLine.includes('{')) {
      return 'function';
    }
    
    // ブロックスコープ（単独の{}）
    if (trimmedLine === '{' || (trimmedLine.includes('{') && !trimmedLine.match(/\b(?:function|class|if|for|while|try|catch)\b/))) {
      return 'block';
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