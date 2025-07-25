import {
  CodeContext,
  DomainDictionary,
  DomainTerm,
  BusinessRule,
  TestRequirement,
  ImportanceLevel,
  TermRelevance,
  FunctionContext,
  ClassContext,
  ImportContext,
  CodeLocation
} from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * 文脈理解エンジン
 * コードの文脈を理解し、ドメイン関連度を計算する
 */
export class ContextEngine {
  private dictionary: DomainDictionary;
  private cache: Map<string, CodeContext> = new Map();

  constructor(dictionary: DomainDictionary) {
    this.dictionary = dictionary;
  }

  /**
   * コードの文脈を分析
   */
  async analyzeContext(
    code: string,
    filePath: string,
    dictionary?: DomainDictionary
  ): Promise<CodeContext> {
    try {
      const useDictionary = dictionary || this.dictionary;
      const cacheKey = this.generateCacheKey(code, filePath);

      // キャッシュから結果を取得
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const context = await this.performContextAnalysis(code, filePath, useDictionary);
      
      // キャッシュに保存（最大1000エントリ）
      if (this.cache.size >= 1000) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(cacheKey, context);

      return context;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '文脈分析に失敗しました');
      return this.createEmptyContext(filePath);
    }
  }

  /**
   * ドメイン関連度の計算
   */
  calculateRelevance(code: string, term: DomainTerm): number {
    try {
      let relevance = 0;

      // 直接的な用語の出現
      const termRegex = new RegExp(`\\b${this.escapeRegex(term.term)}\\b`, 'gi');
      const termMatches = code.match(termRegex);
      if (termMatches) {
        relevance += Math.min(termMatches.length * 0.2, 0.6);
      }

      // エイリアスの出現
      term.aliases.forEach(alias => {
        const aliasRegex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
        const aliasMatches = code.match(aliasRegex);
        if (aliasMatches) {
          relevance += Math.min(aliasMatches.length * 0.15, 0.4);
        }
      });

      // コード例の類似性
      term.examples.forEach(example => {
        const similarity = this.calculateCodeSimilarity(code, example.code);
        relevance += similarity * 0.3;
      });

      // 関連パターンの検出
      term.relatedPatterns.forEach(pattern => {
        try {
          const patternRegex = new RegExp(pattern, 'i');
          if (patternRegex.test(code)) {
            relevance += 0.2;
          }
        } catch {
          // 無効な正規表現は無視
        }
      });

      return Math.min(relevance, 1.0);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ドメイン関連度の計算に失敗しました');
      return 0;
    }
  }

  /**
   * 必要なテストの推論
   */
  inferRequiredTests(
    context: CodeContext,
    rules: BusinessRule[]
  ): TestRequirement[] {
    try {
      const requiredTests: TestRequirement[] = [];
      const seenRequirements = new Set<string>();

      // ルールベースの要件抽出
      rules.forEach(rule => {
        if (this.isRuleApplicable(context, rule)) {
          rule.requirements.forEach(req => {
            const key = `${req.type}-${req.description}`;
            if (!seenRequirements.has(key)) {
              requiredTests.push(req);
              seenRequirements.add(key);
            }
          });
        }
      });

      // 関連用語からの要件抽出
      context.relatedTerms.forEach(term => {
        term.testRequirements.forEach(reqDesc => {
          const requirement: TestRequirement = {
            type: term.importance === 'critical' ? 'must-have' : 
                  term.importance === 'high' ? 'should-have' : 'nice-to-have',
            description: reqDesc,
            testPattern: this.generateTestPatternFromDescription(reqDesc),
            example: this.generateTestExampleFromDescription(reqDesc)
          };

          const key = `${requirement.type}-${requirement.description}`;
          if (!seenRequirements.has(key)) {
            requiredTests.push(requirement);
            seenRequirements.add(key);
          }
        });
      });

      // 関数・クラス構造からの要件推論
      this.inferTestsFromStructure(context).forEach(req => {
        const key = `${req.type}-${req.description}`;
        if (!seenRequirements.has(key)) {
          requiredTests.push(req);
          seenRequirements.add(key);
        }
      });

      return requiredTests;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '必要テストの推論に失敗しました');
      return [];
    }
  }

  /**
   * 重要度の判定
   */
  assessImportance(
    context: CodeContext,
    dictionary: DomainDictionary
  ): ImportanceLevel {
    try {
      let score = 50; // 基準値
      const reasons: string[] = [];

      // 関連用語の重要度
      context.relatedTerms.forEach(term => {
        const importance = term.importance;
        switch (importance) {
          case 'critical':
            score += 30;
            reasons.push(`重要用語「${term.term}」を含む`);
            break;
          case 'high':
            score += 20;
            reasons.push(`高重要度用語「${term.term}」を含む`);
            break;
          case 'medium':
            score += 10;
            break;
          case 'low':
            score += 5;
            break;
        }
      });

      // 関数・クラスの複雑度
      const avgComplexity = context.functions.reduce((sum, fn) => sum + fn.complexity, 0) / 
                           (context.functions.length || 1);
      if (avgComplexity > 10) {
        score += 20;
        reasons.push('高い複雑度の関数を含む');
      } else if (avgComplexity > 5) {
        score += 10;
        reasons.push('中程度の複雑度の関数を含む');
      }

      // 外部依存関係
      if (context.imports.length > 5) {
        score += 15;
        reasons.push('多くの外部依存関係を持つ');
      }

      // ドメイン関連度
      if (context.domainRelevance > 0.8) {
        score += 25;
        reasons.push('ドメインとの関連性が非常に高い');
      } else if (context.domainRelevance > 0.5) {
        score += 15;
        reasons.push('ドメインとの関連性が高い');
      }

      // スコアを0-100に正規化
      score = Math.max(0, Math.min(100, score));

      // レベルの決定
      let level: 'critical' | 'high' | 'medium' | 'low';
      if (score >= 80) {
        level = 'critical';
      } else if (score >= 60) {
        level = 'high';
      } else if (score >= 40) {
        level = 'medium';
      } else {
        level = 'low';
      }

      return { level, score, reasons };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '重要度判定に失敗しました');
      return { level: 'medium', score: 50, reasons: [] };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * 実際の文脈分析実行
   */
  private async performContextAnalysis(
    code: string,
    filePath: string,
    dictionary: DomainDictionary
  ): Promise<CodeContext> {
    const language = this.detectLanguage(filePath);
    const functions = this.extractFunctions(code, language);
    const classes = this.extractClasses(code, language);
    const imports = this.extractImports(code, language);
    
    // ドメイン関連度の計算
    const domainRelevance = this.calculateOverallDomainRelevance(code, dictionary);
    
    // 関連用語の特定
    const relatedTerms = this.findRelatedTerms(code, dictionary);

    return {
      filePath,
      language,
      functions,
      classes,
      imports,
      domainRelevance,
      relatedTerms
    };
  }

  /**
   * 言語の検出
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c'
    };
    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * 関数の抽出
   */
  private extractFunctions(code: string, language: string): FunctionContext[] {
    const functions: FunctionContext[] = [];
    
    try {
      // TypeScript/JavaScript関数の抽出
      if (language === 'typescript' || language === 'javascript') {
        const functionPatterns = [
          /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g,
          /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(([^)]*)\)\s*=>/g,
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*:\s*[a-zA-Z]/g
        ];

        functionPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(code)) !== null) {
            const name = match[1];
            const params = match[2] ? match[2].split(',').map(p => p.trim()) : [];
            const complexity = this.calculateFunctionComplexity(match[0]);
            const location = this.getLocationFromMatch(code, match);

            functions.push({
              name,
              parameters: params,
              complexity,
              location
            });
          }
        });
      }
    } catch (error) {
      console.warn('関数抽出でエラーが発生しました:', error);
    }

    return functions;
  }

  /**
   * クラスの抽出
   */
  private extractClasses(code: string, language: string): ClassContext[] {
    const classes: ClassContext[] = [];
    
    try {
      if (language === 'typescript' || language === 'javascript') {
        const classPattern = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        
        while ((match = classPattern.exec(code)) !== null) {
          const name = match[1];
          const methods = this.extractClassMethods(code, name);
          const properties = this.extractClassProperties(code, name);
          const location = this.getLocationFromMatch(code, match);

          classes.push({
            name,
            methods,
            properties,
            location
          });
        }
      }
    } catch (error) {
      console.warn('クラス抽出でエラーが発生しました:', error);
    }

    return classes;
  }

  /**
   * インポートの抽出
   */
  private extractImports(code: string, language: string): ImportContext[] {
    const imports: ImportContext[] = [];
    
    try {
      if (language === 'typescript' || language === 'javascript') {
        // ES6 import文
        const importPatterns = [
          /import\s+([^from]+)\s+from\s+['"]([^'"]+)['"]/g,
          /import\s+['"]([^'"]+)['"]/g
        ];

        importPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(code)) !== null) {
            const module = match[2] || match[1];
            const importClause = match[1] || '';
            
            let type: 'default' | 'named' | 'namespace' = 'named';
            let importsList: string[] = [];

            if (importClause.includes('{')) {
              type = 'named';
              const namedImports = importClause.match(/\{([^}]+)\}/);
              if (namedImports) {
                importsList = namedImports[1].split(',').map(s => s.trim());
              }
            } else if (importClause.includes('*')) {
              type = 'namespace';
              importsList = [importClause.trim()];
            } else {
              type = 'default';
              importsList = [importClause.trim()];
            }

            imports.push({
              module,
              imports: importsList,
              type
            });
          }
        });
      }
    } catch (error) {
      console.warn('インポート抽出でエラーが発生しました:', error);
    }

    return imports;
  }

  /**
   * 全体的なドメイン関連度の計算
   */
  private calculateOverallDomainRelevance(
    code: string,
    dictionary: DomainDictionary
  ): number {
    if (dictionary.terms.length === 0) return 0;

    let totalRelevance = 0;
    let termCount = 0;

    dictionary.terms.forEach(term => {
      const relevance = this.calculateRelevance(code, term);
      if (relevance > 0) {
        totalRelevance += relevance;
        termCount++;
      }
    });

    return termCount > 0 ? totalRelevance / termCount : 0;
  }

  /**
   * 関連用語の検出
   */
  private findRelatedTerms(code: string, dictionary: DomainDictionary): DomainTerm[] {
    const relatedTerms: DomainTerm[] = [];
    const minRelevance = 0.1;

    dictionary.terms.forEach(term => {
      const relevance = this.calculateRelevance(code, term);
      if (relevance >= minRelevance) {
        relatedTerms.push(term);
      }
    });

    // 関連度でソート
    return relatedTerms.sort((a, b) => {
      const aRelevance = this.calculateRelevance(code, a);
      const bRelevance = this.calculateRelevance(code, b);
      return bRelevance - aRelevance;
    });
  }

  /**
   * ルールの適用可能性判定
   */
  private isRuleApplicable(context: CodeContext, rule: BusinessRule): boolean {
    // 簡易的な適用判定（将来的にはより高度な判定を実装）
    return context.relatedTerms.some(term => 
      rule.description.toLowerCase().includes(term.term.toLowerCase()) ||
      term.aliases.some(alias => rule.description.toLowerCase().includes(alias.toLowerCase()))
    );
  }

  /**
   * 構造からのテスト推論
   */
  private inferTestsFromStructure(context: CodeContext): TestRequirement[] {
    const requirements: TestRequirement[] = [];

    // 関数ベースの要件
    context.functions.forEach(fn => {
      if (fn.complexity > 5) {
        requirements.push({
          type: 'must-have',
          description: `複雑な関数 ${fn.name} の単体テスト`,
          testPattern: `describe\\(['"]${fn.name}['"]`,
          example: `describe('${fn.name}', () => { ... })`
        });
      }

      if (fn.parameters.length > 3) {
        requirements.push({
          type: 'should-have',
          description: `多数のパラメータを持つ ${fn.name} の境界値テスト`,
          testPattern: 'expect\\(.*\\)\\.toThrow\\(.*\\)',
          example: `expect(() => ${fn.name}(null)).toThrow()`
        });
      }
    });

    // クラスベースの要件
    context.classes.forEach(cls => {
      requirements.push({
        type: 'should-have',
        description: `クラス ${cls.name} のインスタンス化テスト`,
        testPattern: `new\\s+${cls.name}\\(`,
        example: `const instance = new ${cls.name}()`
      });
    });

    return requirements;
  }

  /**
   * ユーティリティメソッド
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private calculateCodeSimilarity(code1: string, code2: string): number {
    // 簡易的な類似度計算（Jaccard係数）
    const words1 = new Set(code1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(code2.toLowerCase().match(/\w+/g) || []);
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateFunctionComplexity(functionCode: string): number {
    // 循環的複雑度の簡易計算
    let complexity = 1;
    const complexityKeywords = /\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g;
    const matches = functionCode.match(complexityKeywords);
    if (matches) {
      complexity += matches.length;
    }
    return complexity;
  }

  private extractClassMethods(code: string, className: string): string[] {
    const methods: string[] = [];
    const classMatch = code.match(new RegExp(`class\\s+${className}[^{]*\\{([^}]*)\\}`, 's'));
    
    if (classMatch) {
      const classBody = classMatch[1];
      const methodPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
      let match;
      
      while ((match = methodPattern.exec(classBody)) !== null) {
        methods.push(match[1]);
      }
    }
    
    return methods;
  }

  private extractClassProperties(code: string, className: string): string[] {
    const properties: string[] = [];
    const classMatch = code.match(new RegExp(`class\\s+${className}[^{]*\\{([^}]*)\\}`, 's'));
    
    if (classMatch) {
      const classBody = classMatch[1];
      const propertyPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]/g;
      let match;
      
      while ((match = propertyPattern.exec(classBody)) !== null) {
        if (!match[1].includes('(')) { // メソッドではない
          properties.push(match[1]);
        }
      }
    }
    
    return properties;
  }

  private getLocationFromMatch(code: string, match: RegExpExecArray): CodeLocation {
    const beforeMatch = code.substring(0, match.index);
    const line = beforeMatch.split('\n').length;
    const column = beforeMatch.split('\n').pop()?.length || 0;
    
    return {
      file: '',
      line,
      column
    };
  }

  private generateTestPatternFromDescription(description: string): string {
    // 説明からテストパターンを生成（簡易的）
    if (description.includes('検証') || description.includes('テスト')) {
      return 'expect\\(.*\\)\\.toBe.*\\(.*\\)';
    } else if (description.includes('エラー')) {
      return 'expect\\(.*\\)\\.toThrow\\(.*\\)';
    } else {
      return 'it\\([\'"].*[\'"]';
    }
  }

  private generateTestExampleFromDescription(description: string): string {
    return `// ${description}のテスト例`;
  }

  private generateCacheKey(code: string, filePath: string): string {
    // 簡易的なハッシュ生成
    const hash = code.length.toString(36) + filePath.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    return hash;
  }

  private createEmptyContext(filePath: string): CodeContext {
    return {
      filePath,
      language: 'unknown',
      functions: [],
      classes: [],
      imports: [],
      domainRelevance: 0,
      relatedTerms: []
    };
  }
}