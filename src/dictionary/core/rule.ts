import { BusinessRule, TestRequirement, RuleCondition } from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * ビジネスルールの管理クラス
 * ルールの作成、検証、適用判定を行う
 */
export class BusinessRuleManager {

  /**
   * 新しいビジネスルールを作成
   */
  static createRule(params: {
    id: string;
    name: string;
    description: string;
    domain: string;
    condition: RuleCondition;
    requirements?: TestRequirement[];
    priority?: number;
    compliance?: {
      standard: string;
      clause: string;
    };
  }): BusinessRule {
    try {
      // 基本検証
      if (!params.id || !params.name || !params.description || !params.domain) {
        throw new Error('必須フィールドが不足しています: id, name, description, domain');
      }

      if (!params.condition) {
        throw new Error('ルール条件は必須です');
      }

      const rule: BusinessRule = {
        id: params.id,
        name: params.name.trim(),
        description: params.description.trim(),
        domain: params.domain.trim(),
        condition: params.condition,
        requirements: params.requirements || [],
        priority: params.priority || 100,
        compliance: params.compliance
      };

      return this.validateRule(rule);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの作成に失敗しました');
      throw error;
    }
  }

  /**
   * ビジネスルールの妥当性検証
   */
  static validateRule(rule: BusinessRule): BusinessRule {
    try {
      // ID形式の検証
      if (!/^[a-zA-Z0-9\-_]+$/.test(rule.id)) {
        throw new Error('ルールIDは英数字、ハイフン、アンダースコアのみ使用可能です');
      }

      // 名前の長さチェック
      if (rule.name.length < 3) {
        throw new Error('ルール名は3文字以上である必要があります');
      }

      // 説明の長さチェック
      if (rule.description.length < 10) {
        throw new Error('ルール説明は10文字以上である必要があります');
      }

      // 優先度の範囲チェック
      if (rule.priority < 1 || rule.priority > 1000) {
        throw new Error('優先度は1-1000の範囲で指定してください');
      }

      // 条件の検証
      this.validateRuleCondition(rule.condition);

      // 要件の検証
      rule.requirements.forEach((req, index) => {
        this.validateTestRequirement(req, index);
      });

      return rule;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの検証に失敗しました');
      throw error;
    }
  }

  /**
   * ルール条件の検証
   */
  private static validateRuleCondition(condition: RuleCondition): void {
    const validTypes = ['code-pattern', 'function-name', 'data-type', 'api-endpoint'];
    if (!validTypes.includes(condition.type)) {
      throw new Error(`無効な条件タイプ: ${condition.type}`);
    }

    if (!condition.pattern || condition.pattern.trim().length === 0) {
      throw new Error('パターンは必須です');
    }

    const validScopes = ['file', 'class', 'function', 'variable'];
    if (!validScopes.includes(condition.scope)) {
      throw new Error(`無効なスコープ: ${condition.scope}`);
    }

    // 正規表現の妥当性チェック（パターンが正規表現の場合）
    if (condition.type === 'code-pattern') {
      try {
        new RegExp(condition.pattern);
      } catch (error) {
        throw new Error(`無効な正規表現パターン: ${condition.pattern}`);
      }
    }
  }

  /**
   * テスト要件の検証
   */
  private static validateTestRequirement(requirement: TestRequirement, index: number): void {
    const validTypes = ['must-have', 'should-have', 'nice-to-have'];
    if (!validTypes.includes(requirement.type)) {
      throw new Error(`要件 ${index + 1}: 無効な要件タイプ: ${requirement.type}`);
    }

    if (!requirement.description || requirement.description.trim().length === 0) {
      throw new Error(`要件 ${index + 1}: 説明は必須です`);
    }

    if (!requirement.testPattern || requirement.testPattern.trim().length === 0) {
      throw new Error(`要件 ${index + 1}: テストパターンは必須です`);
    }

    // テストパターンの正規表現妥当性チェック
    try {
      new RegExp(requirement.testPattern);
    } catch (error) {
      throw new Error(`要件 ${index + 1}: 無効なテストパターン: ${requirement.testPattern}`);
    }
  }

  /**
   * ルールの更新
   */
  static updateRule(
    existingRule: BusinessRule,
    updates: Partial<Omit<BusinessRule, 'id'>>
  ): BusinessRule {
    try {
      const updatedRule: BusinessRule = {
        ...existingRule,
        ...updates
      };

      return this.validateRule(updatedRule);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの更新に失敗しました');
      throw error;
    }
  }

  /**
   * テスト要件の追加
   */
  static addTestRequirement(rule: BusinessRule, requirement: TestRequirement): BusinessRule {
    try {
      this.validateTestRequirement(requirement, rule.requirements.length);

      const updatedRule = {
        ...rule,
        requirements: [...rule.requirements, requirement]
      };

      return this.validateRule(updatedRule);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'テスト要件の追加に失敗しました');
      throw error;
    }
  }

  /**
   * コードに対するルール適用判定
   */
  static isApplicableToCode(rule: BusinessRule, code: string, context: {
    filePath: string;
    functionName?: string;
    className?: string;
    variableName?: string;
  }): boolean {
    try {
      const { condition } = rule;
      
      switch (condition.type) {
        case 'code-pattern':
          return this.matchesCodePattern(condition, code, context);
          
        case 'function-name':
          return this.matchesFunctionName(condition, context.functionName);
          
        case 'data-type':
          return this.matchesDataType(condition, code);
          
        case 'api-endpoint':
          return this.matchesApiEndpoint(condition, code);
          
        default:
          return false;
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ルール適用判定に失敗しました');
      return false;
    }
  }

  /**
   * コードパターンマッチング
   */
  private static matchesCodePattern(
    condition: RuleCondition,
    code: string,
    context: { filePath: string; functionName?: string; className?: string; variableName?: string; }
  ): boolean {
    const pattern = new RegExp(condition.pattern, 'i');
    
    switch (condition.scope) {
      case 'file':
        return pattern.test(code);
      case 'function':
        return context.functionName ? pattern.test(context.functionName) : false;
      case 'class':
        return context.className ? pattern.test(context.className) : false;
      case 'variable':
        return context.variableName ? pattern.test(context.variableName) : false;
      default:
        return pattern.test(code);
    }
  }

  /**
   * 関数名マッチング
   */
  private static matchesFunctionName(condition: RuleCondition, functionName?: string): boolean {
    if (!functionName) return false;
    const pattern = new RegExp(condition.pattern, 'i');
    return pattern.test(functionName);
  }

  /**
   * データ型マッチング
   */
  private static matchesDataType(condition: RuleCondition, code: string): boolean {
    const pattern = new RegExp(condition.pattern, 'i');
    
    // TypeScript型注釈の検索
    const typeAnnotationRegex = /:\s*([A-Za-z][A-Za-z0-9<>\[\]|&\s]*)/g;
    const matches = code.match(typeAnnotationRegex);
    
    if (!matches) return false;
    
    return matches.some(match => pattern.test(match));
  }

  /**
   * APIエンドポイントマッチング
   */
  private static matchesApiEndpoint(condition: RuleCondition, code: string): boolean {
    const pattern = new RegExp(condition.pattern, 'i');
    
    // 一般的なHTTPメソッドとパス
    const apiPatterns = [
      /['"`]\/[a-zA-Z0-9\/\-_{}:]*['"`]/g,  // URL paths
      /@RequestMapping\(['"`][^'"`]*['"`]\)/g, // Spring
      /@GetMapping\(['"`][^'"`]*['"`]\)/g,
      /@PostMapping\(['"`][^'"`]*['"`]\)/g,
      /app\.(get|post|put|delete)\(['"`][^'"`]*['"`]/g, // Express.js
      /router\.(get|post|put|delete)\(['"`][^'"`]*['"`]/g
    ];
    
    return apiPatterns.some(apiPattern => {
      const matches = code.match(apiPattern);
      return matches ? matches.some(match => pattern.test(match)) : false;
    });
  }

  /**
   * ルールの複雑度計算
   */
  static calculateComplexity(rule: BusinessRule): {
    score: number;
    factors: {
      conditionComplexity: number;
      requirementCount: number;
      patternComplexity: number;
    };
  } {
    const factors = {
      conditionComplexity: this.getConditionComplexity(rule.condition),
      requirementCount: rule.requirements.length,
      patternComplexity: this.getPatternComplexity(rule.condition.pattern)
    };
    
    // 複雑度スコア（1-10）
    const score = Math.min(
      factors.conditionComplexity + 
      Math.min(factors.requirementCount * 0.5, 3) + 
      factors.patternComplexity,
      10
    );
    
    return { score, factors };
  }

  /**
   * 条件の複雑度
   */
  private static getConditionComplexity(condition: RuleCondition): number {
    const typeComplexity = {
      'function-name': 1,
      'data-type': 2,
      'code-pattern': 3,
      'api-endpoint': 4
    };
    
    return typeComplexity[condition.type] || 1;
  }

  /**
   * パターンの複雑度
   */
  private static getPatternComplexity(pattern: string): number {
    let complexity = 1;
    
    // 正規表現の特殊文字の数
    const specialChars = pattern.match(/[.*+?^${}()|[\]\\]/g);
    if (specialChars) {
      complexity += Math.min(specialChars.length * 0.2, 2);
    }
    
    // パターンの長さ
    complexity += Math.min(pattern.length * 0.01, 1);
    
    return Math.round(complexity * 10) / 10;
  }

  /**
   * ルールの効果予測
   */
  static predictEffectiveness(rule: BusinessRule): {
    coverage: number;      // カバレッジ予測 (0-1)
    precision: number;     // 精度予測 (0-1)
    maintenance: number;   // メンテナンス性 (0-1)
    overall: number;       // 総合効果 (0-1)
  } {
    const complexity = this.calculateComplexity(rule);
    
    // カバレッジ：シンプルなパターンほど広範囲をカバー
    const coverage = Math.max(0.1, 1 - (complexity.factors.patternComplexity / 10));
    
    // 精度：複雑なパターンほど高精度だが、過度に複雑だと下がる
    const precision = complexity.score <= 6 
      ? complexity.score / 6 
      : Math.max(0.3, 1 - (complexity.score - 6) / 4);
    
    // メンテナンス性：シンプルなルールほど保守しやすい
    const maintenance = Math.max(0.1, 1 - (complexity.score / 10));
    
    // 総合効果
    const overall = (coverage * 0.3 + precision * 0.4 + maintenance * 0.3);
    
    return { coverage, precision, maintenance, overall };
  }

  /**
   * ルール適用のシミュレーション
   */
  static simulateApplication(rule: BusinessRule, codeSamples: string[]): {
    matchCount: number;
    totalSamples: number;
    matchRate: number;
    examples: Array<{
      code: string;
      matched: boolean;
      requirements: TestRequirement[];
    }>;
  } {
    const examples: Array<{
      code: string;
      matched: boolean;
      requirements: TestRequirement[];
    }> = [];
    
    let matchCount = 0;
    
    codeSamples.forEach(code => {
      const matched = this.isApplicableToCode(rule, code, { filePath: 'test.ts' });
      if (matched) matchCount++;
      
      examples.push({
        code: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
        matched,
        requirements: matched ? rule.requirements : []
      });
    });
    
    return {
      matchCount,
      totalSamples: codeSamples.length,
      matchRate: codeSamples.length > 0 ? matchCount / codeSamples.length : 0,
      examples
    };
  }

  /**
   * 推奨テスト要件の生成
   */
  static generateRecommendedRequirements(rule: BusinessRule): TestRequirement[] {
    const recommendations: TestRequirement[] = [];
    
    // 条件タイプに基づく推奨事項
    switch (rule.condition.type) {
      case 'function-name':
        recommendations.push({
          type: 'must-have',
          description: '関数の正常動作テスト',
          testPattern: 'expect\\(.*\\)\\.toBe.*\\(.*\\)',
          example: 'expect(result).toBeDefined()'
        });
        break;
        
      case 'api-endpoint':
        recommendations.push({
          type: 'must-have',
          description: 'HTTPステータスコードの検証',
          testPattern: 'expect\\(.*status\\)\\.toBe\\(200\\)',
          example: 'expect(response.status).toBe(200)'
        });
        break;
        
      case 'data-type':
        recommendations.push({
          type: 'must-have',
          description: '型安全性のテスト',
          testPattern: 'expect\\(typeof.*\\)\\.toBe\\(.*\\)',
          example: 'expect(typeof result).toBe("object")'
        });
        break;
        
      case 'code-pattern':
        recommendations.push({
          type: 'should-have',
          description: 'パターンマッチングの検証',
          testPattern: 'expect\\(.*\\)\\.toMatch\\(.*\\)',
          example: 'expect(code).toMatch(/pattern/)'
        });
        break;
    }
    
    // ドメイン別の推奨事項
    if (rule.domain === 'security') {
      recommendations.push({
        type: 'must-have',
        description: 'セキュリティ検証テスト',
        testPattern: 'expect\\(.*\\)\\.not\\.toContain\\(.*\\)',
        example: 'expect(output).not.toContain("password")'
      });
    }
    
    // 優先度に基づく追加要件
    if (rule.priority <= 10) {
      recommendations.push({
        type: 'must-have',
        description: '境界値テスト',
        testPattern: 'expect\\(.*\\)\\.toThrow\\(.*\\)',
        example: 'expect(() => func(null)).toThrow()'
      });
    }
    
    return recommendations;
  }
}