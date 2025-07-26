import { BusinessRule, QualityStandard, CodeContext } from '../../core/types';
import { BusinessRuleManager } from '../core/rule';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * コードからナレッジ（ビジネスルール、品質基準）を抽出するクラス
 */
export class KnowledgeExtractor {

  /**
   * コードからビジネスルールを抽出
   */
  async extractBusinessRules(
    code: string, 
    context: CodeContext
  ): Promise<{
    extractedRules: BusinessRule[];
  }> {
    try {
      // 入力検証
      if (!code || typeof code !== 'string') {
        return { extractedRules: [] };
      }

      const extractedRules: BusinessRule[] = [];

      // 1. アノテーション付きルールを抽出
      const annotationRules = this.extractAnnotationRules(code);
      extractedRules.push(...annotationRules);

      // 2. コメントからルールを抽出
      const commentRules = this.extractCommentRules(code);
      extractedRules.push(...commentRules);

      // 3. バリデーション関数からルールを抽出
      const validationRules = this.extractValidationRules(code);
      extractedRules.push(...validationRules);

      // 4. 条件文からルールを抽出
      const conditionalRules = this.extractConditionalRules(code);
      extractedRules.push(...conditionalRules);

      // 5. 定数からルールを抽出
      const constantRules = this.extractConstantRules(code);
      extractedRules.push(...constantRules);

      // 重複を除去
      const uniqueRules = this.removeDuplicateRules(extractedRules);

      return { extractedRules: uniqueRules };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルール抽出に失敗しました');
      return { extractedRules: [] };
    }
  }

  /**
   * コードから品質基準を抽出
   */
  async extractQualityStandards(
    code: string,
    context: CodeContext
  ): Promise<{
    extractedStandards: QualityStandard[];
  }> {
    try {
      // 入力検証
      if (!code || typeof code !== 'string') {
        return { extractedStandards: [] };
      }

      const extractedStandards: QualityStandard[] = [];

      // 1. パフォーマンス基準を抽出
      const performanceStandards = this.extractPerformanceStandards(code);
      extractedStandards.push(...performanceStandards);

      // 2. セキュリティ基準を抽出
      const securityStandards = this.extractSecurityStandards(code);
      extractedStandards.push(...securityStandards);

      // 3. テスト基準を抽出
      const testStandards = this.extractTestStandards(code);
      extractedStandards.push(...testStandards);

      // 4. コード品質基準を抽出
      const qualityStandards = this.extractCodeQualityStandards(code);
      extractedStandards.push(...qualityStandards);

      // 重複を除去
      const uniqueStandards = this.removeDuplicateStandards(extractedStandards);

      return { extractedStandards: uniqueStandards };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '品質基準抽出に失敗しました');
      return { extractedStandards: [] };
    }
  }

  /**
   * アノテーション付きルールを抽出
   */
  private extractAnnotationRules(code: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    // JSDocスタイルのアノテーションを検索
    const annotationPattern = /\/\*\*[\s\S]*?@rule\s+([^\n*]+)[\s\S]*?@priority\s+(high|medium|low)[\s\S]*?\*\//g;
    let match;

    while ((match = annotationPattern.exec(code)) !== null) {
      const ruleName = match[1].trim();
      const priority = match[2];
      const fullComment = match[0];
      
      // 説明を抽出
      const descriptionMatch = fullComment.match(/\*\s*([^@\n]+)/);
      const description = descriptionMatch ? descriptionMatch[1].trim() : ruleName;

      try {
        const rule = BusinessRuleManager.createRule({
          id: `annotation-${this.generateId(ruleName)}`,
          name: ruleName,
          description: description,
          domain: 'business',
          condition: {
            type: 'code-pattern',
            pattern: '.*',
            scope: 'function'
          },
          requirements: [{
            type: 'must-have',
            description: description,
            testPattern: '.*',
            example: `// Test for ${ruleName}`
          }],
          priority: this.convertPriorityToNumber(priority)
        });
        rules.push(rule);
      } catch (error) {
        // ルール作成失敗時は無視
      }
    }

    return rules;
  }

  /**
   * コメントからルールを抽出
   */
  private extractCommentRules(code: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    const ruleKeywords = ['must', 'should', 'cannot', 'must not', 'required', 'mandatory', 'forbidden'];
    
    // 単行コメントと複数行コメントからルールを抽出
    const commentPattern = /(?:\/\/\s*(.+)|\/\*[\s\S]*?\*\/)/g;
    let match;

    while ((match = commentPattern.exec(code)) !== null) {
      const comment = match[0];
      const commentText = this.extractCommentText(comment);

      // ルールキーワードを含むコメントを検索
      ruleKeywords.forEach(keyword => {
        if (commentText.toLowerCase().includes(keyword)) {
          const description = this.extractRuleDescription(commentText, keyword);
          if (description) {
            try {
              const rule = BusinessRuleManager.createRule({
                id: `comment-${this.generateId(description)}`,
                name: `Comment Rule: ${keyword}`,
                description: description,
                domain: 'business',
                condition: {
                  type: 'code-pattern',
                  pattern: '.*',
                  scope: 'file'
                },
                requirements: [{
                  type: keyword.includes('must') ? 'must-have' : 'should-have',
                  description: description,
                  testPattern: '.*',
                  example: `// Test for: ${description}`
                }],
                priority: keyword.includes('must') ? 10 : 50
              });
              rules.push(rule);
            } catch (error) {
              // ルール作成失敗時は無視
            }
          }
        }
      });
    }

    return rules;
  }

  /**
   * バリデーション関数からルールを抽出
   */
  private extractValidationRules(code: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    
    // バリデーション関数パターン
    const validationPattern = /function\s+(validate\w+|check\w+|verify\w+)\s*\([^)]*\)\s*{([^}]*)}/g;
    let match;

    while ((match = validationPattern.exec(code)) !== null) {
      const functionName = match[1];
      const functionBody = match[2];
      
      // エラーメッセージからルールを抽出
      const errorMessages = this.extractErrorMessages(functionBody);
      
      errorMessages.forEach(message => {
        try {
          const rule = BusinessRuleManager.createRule({
            id: `validation-${this.generateId(functionName)}-${this.generateId(message)}`,
            name: `${functionName} Rule`,
            description: message,
            domain: 'validation',
            condition: {
              type: 'function-name',
              pattern: `${functionName}.*`,
              scope: 'function'
            },
            requirements: [{
              type: 'must-have',
              description: `Validation test for: ${message}`,
              testPattern: `expect.*${functionName}.*`,
              example: `expect(() => ${functionName}(invalidInput)).toThrow()`
            }],
            priority: 25
          });
          rules.push(rule);
        } catch (error) {
          // ルール作成失敗時は無視
        }
      });
    }

    return rules;
  }

  /**
   * 条件文からルールを抽出
   */
  private extractConditionalRules(code: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    
    // if文の条件からビジネスルールを抽出
    const conditionalPattern = /if\s*\(([^)]+)\)\s*{[^}]*(?:throw|return|error)[^}]*}/g;
    let match;

    while ((match = conditionalPattern.exec(code)) !== null) {
      const condition = match[1].trim();
      const description = this.generateRuleFromCondition(condition);
      
      if (description) {
        try {
          const rule = BusinessRuleManager.createRule({
            id: `conditional-${this.generateId(condition)}`,
            name: 'Conditional Rule',
            description: description,
            domain: 'business',
            condition: {
              type: 'code-pattern',
              pattern: '.*',
              scope: 'function'
            },
            requirements: [{
              type: 'should-have',
              description: `Test for conditional logic: ${description}`,
              testPattern: '.*',
              example: `// Test condition: ${condition}`
            }],
            priority: 75
          });
          rules.push(rule);
        } catch (error) {
          // ルール作成失敗時は無視
        }
      }
    }

    return rules;
  }

  /**
   * 定数からルールを抽出
   */
  private extractConstantRules(code: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    
    // 重要な定数（上限、下限、閾値など）からルールを抽出
    const constantPattern = /const\s+(MAX_\w+|MIN_\w+|LIMIT_\w+|\w+_THRESHOLD|\w+_LIMIT)\s*=\s*([^;]+);/g;
    let match;

    while ((match = constantPattern.exec(code)) !== null) {
      const constantName = match[1];
      const constantValue = match[2].trim();
      
      const description = this.generateRuleFromConstant(constantName, constantValue);
      
      try {
        const rule = BusinessRuleManager.createRule({
          id: `constant-${this.generateId(constantName)}`,
          name: `Constant Rule: ${constantName}`,
          description: description,
          domain: 'business',
          condition: {
            type: 'code-pattern',
            pattern: constantName,
            scope: 'file'
          },
          requirements: [{
            type: 'should-have',
            description: `Test for constant limit: ${description}`,
            testPattern: `.*${constantName}.*`,
            example: `// Test ${constantName} = ${constantValue}`
          }],
          priority: 60
        });
        rules.push(rule);
      } catch (error) {
        // ルール作成失敗時は無視
      }
    }

    return rules;
  }

  /**
   * パフォーマンス基準を抽出
   */
  private extractPerformanceStandards(code: string): QualityStandard[] {
    const standards: QualityStandard[] = [];
    
    // パフォーマンス関連のコメントや定数を検索
    const performancePatterns = [
      /response.*time.*(\d+)\s*ms/i,
      /timeout.*(\d+)/i,
      /performance.*(\d+)/i,
      /(\d+)\s*milliseconds?/i
    ];

    performancePatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern, 'gi');
      while ((match = regex.exec(code)) !== null) {
        const value = parseInt(match[1]);
        if (value > 0) {
          standards.push({
            id: `perf-${this.generateId(match[0])}`,
            name: 'Performance Standard',
            description: `Response time should be under ${value}ms`,
            criteria: [{
              name: 'Response Time',
              description: `Maximum response time of ${value}ms`,
              threshold: value,
              measurement: 'count'
            }],
            weight: 0.8
          });
        }
      }
    });

    return standards;
  }

  /**
   * セキュリティ基準を抽出
   */
  private extractSecurityStandards(code: string): QualityStandard[] {
    const standards: QualityStandard[] = [];
    
    // セキュリティ関連のキーワードを検索
    const securityKeywords = [
      'encrypt', 'decrypt', 'hash', 'authenticate', 'authorize',
      'sanitize', 'validate', 'secure', 'csrf', 'xss', 'injection'
    ];

    securityKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      if (regex.test(code)) {
        standards.push({
          id: `security-${keyword}`,
          name: `Security Standard: ${keyword}`,
          description: `Code must implement proper ${keyword} mechanisms`,
          criteria: [{
            name: `Security ${keyword}`,
            description: `Proper ${keyword} implementation required`,
            threshold: 100,
            measurement: 'percentage'
          }],
          weight: 0.9
        });
      }
    });

    return standards;
  }

  /**
   * テスト基準を抽出
   */
  private extractTestStandards(code: string): QualityStandard[] {
    const standards: QualityStandard[] = [];
    
    // テスト関連のコメントを検索
    const testPattern = /(?:test|spec|should|must).*(?:100%|complete|all|every|each)/gi;
    let match;

    while ((match = testPattern.exec(code)) !== null) {
      standards.push({
        id: `test-${this.generateId(match[0])}`,
        name: 'Test Coverage Standard',
        description: 'All functions must have unit tests',
        criteria: [{
          name: 'Test Coverage',
          description: 'Unit test coverage requirement',
          threshold: 100,
          measurement: 'percentage'
        }],
        weight: 0.7
      });
    }

    return standards;
  }

  /**
   * コード品質基準を抽出
   */
  private extractCodeQualityStandards(code: string): QualityStandard[] {
    const standards: QualityStandard[] = [];
    
    // 複雑度、関数長などの品質基準を検索
    const qualityPatterns = [
      /complexity.*(\d+)/i,
      /(\d+).*lines?\s+per\s+function/i,
      /max.*(\d+).*parameters?/i
    ];

    qualityPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern, 'gi');
      while ((match = regex.exec(code)) !== null) {
        const value = parseInt(match[1]);
        if (value > 0) {
          if (pattern.source.includes('complexity')) {
            standards.push({
              id: `quality-complexity-${value}`,
              name: 'Complexity Standard',
              description: `Function complexity should not exceed ${value}`,
              criteria: [{
                name: 'Cyclomatic Complexity',
                description: `Maximum function complexity of ${value}`,
                threshold: value,
                measurement: 'count'
              }],
              weight: 0.6
            });
          } else if (pattern.source.includes('lines')) {
            standards.push({
              id: `quality-lines-${value}`,
              name: 'Function Length Standard',
              description: `Functions should not exceed ${value} lines`,
              criteria: [{
                name: 'Function Length',
                description: `Maximum function length of ${value} lines`,
                threshold: value,
                measurement: 'count'
              }],
              weight: 0.5
            });
          }
        }
      }
    });

    return standards;
  }

  // ヘルパーメソッド

  private extractCommentText(comment: string): string {
    return comment.replace(/\/\*\*?|\*\/|\*|\/\//g, '').trim();
  }

  private extractRuleDescription(commentText: string, keyword: string): string | null {
    const sentences = commentText.split(/[.!?]+/);
    const targetSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    );
    return targetSentence ? targetSentence.trim() : null;
  }

  private extractErrorMessages(functionBody: string): string[] {
    const messages: string[] = [];
    const errorPattern = /(?:throw|error).*['"`]([^'"`]+)['"`]/gi;
    let match;

    while ((match = errorPattern.exec(functionBody)) !== null) {
      messages.push(match[1]);
    }

    return messages;
  }

  private generateRuleFromCondition(condition: string): string | null {
    // 条件文から自然言語のルールを生成
    const patterns = [
      { pattern: /(\w+)\s*<=\s*0/, template: '$1 must be greater than 0' },
      { pattern: /(\w+)\s*<\s*(\d+)/, template: '$1 must be at least $2' },
      { pattern: /(\w+)\s*>\s*(\d+)/, template: '$1 must not exceed $2' },
      { pattern: /!(\w+)/, template: '$1 is required' },
      { pattern: /(\w+)\s*===?\s*null/, template: '$1 cannot be null' }
    ];

    for (const { pattern, template } of patterns) {
      const match = condition.match(pattern);
      if (match) {
        return template.replace(/\$(\d+)/g, (_, index) => match[parseInt(index)]);
      }
    }

    return null;
  }

  private generateRuleFromConstant(name: string, value: string): string {
    if (name.startsWith('MAX_')) {
      return `Maximum ${name.substring(4).toLowerCase()} is ${value}`;
    } else if (name.startsWith('MIN_')) {
      return `Minimum ${name.substring(4).toLowerCase()} is ${value}`;
    } else if (name.includes('LIMIT')) {
      return `${name.replace(/_/g, ' ').toLowerCase()} is ${value}`;
    } else {
      return `${name.replace(/_/g, ' ').toLowerCase()} threshold is ${value}`;
    }
  }

  private convertPriorityToNumber(priority: string): number {
    switch (priority.toLowerCase()) {
      case 'high': return 25;
      case 'medium': return 50;
      case 'low': return 75;
      default: return 50;
    }
  }

  private generateId(text: string): string {
    return text.toLowerCase()
               .replace(/[^a-z0-9]+/g, '-')
               .replace(/^-+|-+$/g, '')
               .substring(0, 20);
  }

  private removeDuplicateRules(rules: BusinessRule[]): BusinessRule[] {
    const seen = new Set<string>();
    return rules.filter(rule => {
      const key = `${rule.name}-${rule.description}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private removeDuplicateStandards(standards: QualityStandard[]): QualityStandard[] {
    const seen = new Set<string>();
    return standards.filter(standard => {
      const key = `${standard.name}-${standard.description}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}