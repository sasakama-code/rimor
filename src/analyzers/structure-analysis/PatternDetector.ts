/**
 * コード構造分析 - アンチパターン検出器
 * God Object、Spaghetti Codeなどのアンチパターンを検出
 */

export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
  message?: string;
}

export interface DesignPattern {
  name: string;
  type: string;
  confidence: number;
  location: string;
}

export class PatternDetector {
  /**
   * デザインパターンの検出
   */
  detectDesignPatterns(fileContent: string, fileName: string): DesignPattern[] {
    const patterns: DesignPattern[] = [];

    // Singleton Pattern
    if (this.isSingletonPattern(fileContent)) {
      patterns.push({
        name: 'Singleton',
        type: 'Creational',
        confidence: 0.8,
        location: fileName
      });
    }

    // Factory Pattern
    if (this.isFactoryPattern(fileContent)) {
      patterns.push({
        name: 'Factory',
        type: 'Creational',
        confidence: 0.75,
        location: fileName
      });
    }

    // Observer Pattern
    if (this.isObserverPattern(fileContent)) {
      patterns.push({
        name: 'Observer',
        type: 'Behavioral',
        confidence: 0.7,
        location: fileName
      });
    }

    // Strategy Pattern  
    if (this.isStrategyPattern(fileContent)) {
      patterns.push({
        name: 'Strategy',
        type: 'Behavioral',
        confidence: 0.75,
        location: fileName
      });
    }

    return patterns;
  }

  /**
   * アンチパターンの検出
   */
  detectAntiPatterns(fileContent: string, fileName: string): AntiPattern[] {
    const antiPatterns: AntiPattern[] = [];

    // God Object検出
    if (this.isGodObject(fileContent)) {
      antiPatterns.push({
        type: 'God Object',
        severity: 'high',
        location: fileName,
        recommendation: 'Consider breaking this class into smaller, more focused classes following the Single Responsibility Principle.'
      });
    }

    // Spaghetti Code検出
    if (this.isSpaghettiCode(fileContent)) {
      antiPatterns.push({
        type: 'Spaghetti Code',
        severity: 'medium',
        location: fileName,
        recommendation: 'Refactor nested conditions to reduce complexity and improve code structure using early returns or guard clauses'
      });
    }

    // Copy-Paste Programming検出 (テストで期待されている)
    if (this.hasCopyPasteCode(fileContent)) {
      antiPatterns.push({
        type: 'Copy-Paste Programming',
        severity: 'medium',
        location: fileName,
        recommendation: 'Extract common code into reusable functions following the DRY (Don\'t Repeat Yourself) principle'
      });
    }

    // Long Method検出
    if (this.hasLongMethod(fileContent)) {
      antiPatterns.push({
        type: 'Long Method',
        severity: 'medium',
        location: fileName,
        recommendation: 'Break down long methods into smaller, more focused functions'
      });
    }

    // Duplicate Code検出
    if (this.hasDuplicateCode(fileContent)) {
      antiPatterns.push({
        type: 'Duplicate Code',
        severity: 'medium',
        location: fileName,
        recommendation: 'Extract common code into reusable functions or modules'
      });
    }

    return antiPatterns;
  }

  /**
   * Singleton Patternの検出
   */
  private isSingletonPattern(content: string): boolean {
    const singletonIndicators = [
      /private\s+static\s+\w+\s*:\s*\w+/,
      /static\s+getInstance/,
      /private\s+constructor/
    ];
    
    return singletonIndicators.filter(pattern => pattern.test(content)).length >= 2;
  }

  /**
   * Factory Patternの検出
   */
  private isFactoryPattern(content: string): boolean {
    const factoryIndicators = [
      /class\s+\w*Factory/,
      /create\w+\s*\(/,
      /function\s+create/
    ];
    
    return factoryIndicators.some(pattern => pattern.test(content));
  }

  /**
   * Observer Patternの検出
   */
  private isObserverPattern(content: string): boolean {
    const observerIndicators = [
      /subscribe|addEventListener/,
      /unsubscribe|removeEventListener/,
      /notify|emit|dispatch/,
      /observers?\s*[:\[]/
    ];
    
    return observerIndicators.filter(pattern => pattern.test(content)).length >= 2;
  }

  /**
   * Strategy Patternの検出
   */
  private isStrategyPattern(content: string): boolean {
    const strategyIndicators = [
      /setStrategy|strategy\s*=/,
      /execute|perform|process/,
      /interface\s+\w*Strategy/
    ];
    
    return strategyIndicators.filter(pattern => pattern.test(content)).length >= 2;
  }

  /**
   * God Object アンチパターンの検出
   */
  private isGodObject(content: string): boolean {
    // クラス内のメソッド数をカウント（インデントを考慮）
    const methodPatterns = [
      /\s+(public|private|protected)?\s*\w+\s*\([^)]*\)\s*[{:]/gm,
      /\s+\w+\([^)]*\)\s*\{/gm,  // メソッド定義の簡易形式
      /\s+(async\s+)?\w+\s*\([^)]*\)\s*\{/gm  // async関数も含む
    ];
    
    let methodCount = 0;
    for (const pattern of methodPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        methodCount = Math.max(methodCount, matches.length);
      }
    }
    
    // プロパティ数をカウント（インデントを考慮）
    const propertyPatterns = [
      /\s+(private|public|protected)\s+\w+\s*[:;]/gm,
      /\s+private\s+\w+:\s*\w+/gm  // private property: Type形式
    ];
    
    let propertyCount = 0;
    for (const pattern of propertyPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        propertyCount = Math.max(propertyCount, matches.length);
      }
    }
    
    // 責務の多様性を検出（異なる種類のサービスを多数含む）
    const responsibilityTypes = ['database', 'logger', 'auth', 'email', 'cache', 'queue', 'analytics'];
    let foundResponsibilities = 0;
    for (const type of responsibilityTypes) {
      if (new RegExp(`\\b${type}\\b`, 'i').test(content)) {
        foundResponsibilities++;
      }
    }
    
    // God Objectの判定条件（調整された条件）
    return (methodCount >= 12) || 
           (propertyCount >= 7 && methodCount >= 10) ||
           (foundResponsibilities >= 5) ||
           (propertyCount >= 7 && foundResponsibilities >= 4);
  }

  /**
   * Spaghetti Code アンチパターンの検出
   */
  private isSpaghettiCode(content: string): boolean {
    // ネストレベルの深さを検出（簡易版）
    let maxNestingLevel = 0;
    let currentLevel = 0;
    const lines = content.split('\n');
    
    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      currentLevel += openBraces - closeBraces;
      maxNestingLevel = Math.max(maxNestingLevel, currentLevel);
    }
    
    // 深いネストをチェック（7以上は深すぎる）
    const hasDeepNesting = maxNestingLevel >= 7;
    
    // 連続したif文の検出
    const consecutiveIfs = /if\s*\([^)]*\)\s*{\s*if\s*\([^)]*\)\s*{\s*if/s;
    const hasConsecutiveIfs = consecutiveIfs.test(content);
    
    // forループ内のforループ内のif文など
    const complexNesting = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{[^}]*if/s;
    const hasComplexNesting = complexNesting.test(content);
    
    return hasDeepNesting || hasConsecutiveIfs || hasComplexNesting;
  }

  /**
   * Long Method アンチパターンの検出
   */
  private hasLongMethod(content: string): boolean {
    // メソッドの行数を概算
    const methods = content.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?^}/gm) || [];
    
    return methods.some(method => {
      const lines = method.split('\n').length;
      return lines > 50;
    });
  }

  /**
   * Copy-Paste Programming アンチパターンの検出
   */
  private hasCopyPasteCode(content: string): boolean {
    // 関数定義を抽出
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{([^}]+)}/g;
    const functions = new Map<string, string[]>();
    
    let match;
    while ((match = functionPattern.exec(content)) !== null) {
      const funcName = match[1];
      const funcBody = match[2].replace(/\s+/g, ' ').trim();
      
      if (!functions.has(funcBody)) {
        functions.set(funcBody, []);
      }
      functions.get(funcBody)!.push(funcName);
    }
    
    // 同じ内容の関数が複数ある場合
    for (const [body, names] of functions) {
      if (names.length >= 2 && body.length > 30) {
        return true;
      }
    }
    
    // 類似したコードブロックの検出
    const lines = content.split('\n');
    const codeSegments = new Map<string, number>();
    
    for (let i = 0; i < lines.length - 3; i++) {
      const segment = lines.slice(i, i + 4)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('//'))
        .join(' ');
      
      if (segment.length > 50) {
        const normalized = segment.replace(/\d+/g, 'N').replace(/['"][^'"]*['"]/g, 'S');
        codeSegments.set(normalized, (codeSegments.get(normalized) || 0) + 1);
      }
    }
    
    return Array.from(codeSegments.values()).some(count => count >= 3);
  }

  /**
   * Duplicate Code アンチパターンの検出
   */
  private hasDuplicateCode(content: string): boolean {
    // 簡易的な重複検出（同じコードブロックが複数回出現）
    const codeBlocks = content.match(/{[^{}]+}/g) || [];
    const blockCounts = new Map<string, number>();
    
    for (const block of codeBlocks) {
      const normalizedBlock = block.replace(/\s+/g, ' ').trim();
      if (normalizedBlock.length > 50) {
        blockCounts.set(normalizedBlock, (blockCounts.get(normalizedBlock) || 0) + 1);
      }
    }
    
    return Array.from(blockCounts.values()).some(count => count > 1);
  }
}