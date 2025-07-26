import {
  DomainTerm,
  CodeContext,
  DomainDictionary,
  TermRelevance,
  BusinessRule
} from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * マッチング重み係数の設定インターフェース
 */
interface MatchingWeights {
  directMatch: number;
  aliasMatch: number;
  patternMatch: number;
  contextualMatch: number;
  semanticMatch: number;
}

/**
 * デフォルトの重み係数設定
 */
const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  directMatch: 0.4,
  aliasMatch: 0.25,
  patternMatch: 0.2,
  contextualMatch: 0.1,
  semanticMatch: 0.05
};

/**
 * 関連度計算・スコアリングクラス
 * 用語とコードの関連度を高精度で計算
 */
export class ContextualScorer {
  private static matchingWeights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS;
  private static readonly DEFAULT_RELEVANCE_THRESHOLD = 0.1;
  private static relevanceThreshold: number = ContextualScorer.DEFAULT_RELEVANCE_THRESHOLD;

  /**
   * マッチング重み係数を設定
   */
  static setMatchingWeights(weights: Partial<MatchingWeights>): void {
    this.matchingWeights = { ...this.matchingWeights, ...weights };
  }

  /**
   * 現在の重み係数を取得
   */
  static getMatchingWeights(): MatchingWeights {
    return { ...this.matchingWeights };
  }

  /**
   * 関連度閾値を設定
   */
  static setRelevanceThreshold(threshold: number): void {
    this.relevanceThreshold = threshold;
  }

  /**
   * 現在の関連度閾値を取得
   */
  static getRelevanceThreshold(): number {
    return this.relevanceThreshold;
  }

  /**
   * 高度な用語関連度計算
   */
  static calculateAdvancedTermRelevance(
    code: string,
    term: DomainTerm,
    context?: CodeContext
  ): {
    score: number;
    breakdown: {
      directMatch: number;
      aliasMatch: number;
      patternMatch: number;
      contextualMatch: number;
      semanticMatch: number;
    };
    confidence: number;
  } {
    try {
      // 入力検証
      if (!code || !term) {
        return {
          score: 0,
          breakdown: {
            directMatch: 0,
            aliasMatch: 0,
            patternMatch: 0,
            contextualMatch: 0,
            semanticMatch: 0
          },
          confidence: 0
        };
      }

      const breakdown = {
        directMatch: 0,
        aliasMatch: 0,
        patternMatch: 0,
        contextualMatch: 0,
        semanticMatch: 0
      };

      // 1. 直接マッチング
      breakdown.directMatch = this.calculateDirectMatch(code, term) * this.matchingWeights.directMatch;

      // 2. エイリアスマッチング
      breakdown.aliasMatch = this.calculateAliasMatch(code, term) * this.matchingWeights.aliasMatch;

      // 3. パターンマッチング
      breakdown.patternMatch = this.calculatePatternMatch(code, term) * this.matchingWeights.patternMatch;

      // 4. 文脈マッチング
      if (context) {
        breakdown.contextualMatch = this.calculateContextualMatch(context, term) * this.matchingWeights.contextualMatch;
      }

      // 5. 意味的マッチング
      breakdown.semanticMatch = this.calculateSemanticMatch(code, term) * this.matchingWeights.semanticMatch;

      const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
      const confidence = this.calculateConfidence(breakdown, term);

      return {
        score: Math.min(score, 1.0),
        breakdown,
        confidence
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '高度な関連度計算に失敗しました');
      return {
        score: 0,
        breakdown: {
          directMatch: 0,
          aliasMatch: 0,
          patternMatch: 0,
          contextualMatch: 0,
          semanticMatch: 0
        },
        confidence: 0
      };
    }
  }

  /**
   * 複数用語の関連度ランキング
   */
  static rankTermsByRelevance(
    code: string,
    terms: DomainTerm[],
    context?: CodeContext
  ): Array<{
    term: DomainTerm;
    relevanceScore: number;
    breakdown: any;
    confidence: number;
  }> {
    try {
      return terms
        .map(term => {
          const relevance = this.calculateAdvancedTermRelevance(code, term, context);
          return {
            term,
            relevanceScore: relevance.score,
            breakdown: relevance.breakdown,
            confidence: relevance.confidence
          };
        })
        .filter(result => result.relevanceScore > this.relevanceThreshold)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語ランキングに失敗しました');
      return [];
    }
  }

  /**
   * ドメイン特化スコアリング
   */
  static calculateDomainSpecificScore(
    code: string,
    dictionary: DomainDictionary,
    context?: CodeContext
  ): {
    overallScore: number;
    categoryScores: Record<string, number>;
    importanceWeightedScore: number;
    recommendedFocus: string[];
  } {
    try {
      const categoryScores: Record<string, number> = {};
      const importanceWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      
      let totalWeightedScore = 0;
      let totalWeight = 0;

      // カテゴリ別スコア計算
      dictionary.terms.forEach(term => {
        const relevance = this.calculateAdvancedTermRelevance(code, term, context);
        const weight = importanceWeights[term.importance];
        
        if (!categoryScores[term.category]) {
          categoryScores[term.category] = 0;
        }
        categoryScores[term.category] = Math.max(
          categoryScores[term.category],
          relevance.score
        );

        totalWeightedScore += relevance.score * weight;
        totalWeight += weight;
      });

      const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 
                          Object.keys(categoryScores).length;
      
      const importanceWeightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

      // 推奨フォーカス領域
      const recommendedFocus = Object.entries(categoryScores)
        .filter(([_, score]) => score < 0.3)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3)
        .map(([category, _]) => category);

      return {
        overallScore,
        categoryScores,
        importanceWeightedScore,
        recommendedFocus
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ドメイン特化スコアリングに失敗しました');
      return {
        overallScore: 0,
        categoryScores: {},
        importanceWeightedScore: 0,
        recommendedFocus: []
      };
    }
  }

  /**
   * ビジネスルールの適用度スコア
   */
  static calculateRuleApplicabilityScore(
    context: CodeContext,
    rule: BusinessRule
  ): {
    score: number;
    applicabilityFactors: {
      patternMatch: number;
      domainAlignment: number;
      complexityMatch: number;
      structuralMatch: number;
    };
    applicabilityReason: string;
  } {
    try {
      const factors = {
        patternMatch: 0,
        domainAlignment: 0,
        complexityMatch: 0,
        structuralMatch: 0
      };

      // パターンマッチング
      factors.patternMatch = this.calculateRulePatternMatch(context, rule);

      // ドメイン整合性
      factors.domainAlignment = this.calculateRuleDomainAlignment(context, rule);

      // 複雑度マッチング
      factors.complexityMatch = this.calculateRuleComplexityMatch(context, rule);

      // 構造マッチング
      factors.structuralMatch = this.calculateRuleStructuralMatch(context, rule);

      const score = (factors.patternMatch * 0.4 + 
                    factors.domainAlignment * 0.3 + 
                    factors.complexityMatch * 0.2 + 
                    factors.structuralMatch * 0.1);

      const applicabilityReason = this.generateApplicabilityReason(factors, rule);

      return {
        score,
        applicabilityFactors: factors,
        applicabilityReason
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ルール適用度計算に失敗しました');
      return {
        score: 0,
        applicabilityFactors: {
          patternMatch: 0,
          domainAlignment: 0,
          complexityMatch: 0,
          structuralMatch: 0
        },
        applicabilityReason: '計算エラー'
      };
    }
  }

  /**
   * テスト必要度スコア計算
   */
  static calculateTestNecessityScore(
    context: CodeContext,
    relatedTerms: TermRelevance[]
  ): {
    overallNecessity: number;
    categoryNecessity: {
      unitTests: number;
      integrationTests: number;
      securityTests: number;
      performanceTests: number;
    };
    prioritizedRequirements: Array<{
      requirement: string;
      necessity: number;
      rationale: string;
    }>;
  } {
    try {
      const categoryNecessity = {
        unitTests: 0,
        integrationTests: 0,
        securityTests: 0,
        performanceTests: 0
      };

      // 単体テストの必要度
      const functionComplexity = context.functions.reduce((sum, fn) => sum + fn.complexity, 0) / 
                                 (context.functions.length || 1);
      categoryNecessity.unitTests = Math.min(functionComplexity / 10, 1.0);

      // 統合テストの必要度
      categoryNecessity.integrationTests = Math.min(context.imports.length / 20, 1.0);

      // セキュリティテストの必要度
      const securityTerms = relatedTerms.filter(tr => 
        tr.term.category === 'security' || 
        tr.term.term.toLowerCase().includes('auth') ||
        tr.term.term.toLowerCase().includes('security')
      );
      categoryNecessity.securityTests = Math.min(securityTerms.length / 5, 1.0);

      // パフォーマンステストの必要度
      const performanceTerms = relatedTerms.filter(tr => 
        tr.term.category === 'performance' ||
        tr.term.importance === 'critical'
      );
      categoryNecessity.performanceTests = Math.min(performanceTerms.length / 5, 1.0);

      const overallNecessity = Object.values(categoryNecessity).reduce((sum, score) => sum + score, 0) / 4;

      // 優先度付き要件
      const prioritizedRequirements = this.generatePrioritizedRequirements(
        context,
        relatedTerms,
        categoryNecessity
      );

      return {
        overallNecessity,
        categoryNecessity,
        prioritizedRequirements
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'テスト必要度計算に失敗しました');
      return {
        overallNecessity: 0,
        categoryNecessity: {
          unitTests: 0,
          integrationTests: 0,
          securityTests: 0,
          performanceTests: 0
        },
        prioritizedRequirements: []
      };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * 直接マッチング計算
   */
  private static calculateDirectMatch(code: string, term: DomainTerm): number {
    if (!code || code.length === 0) return 0;
    
    const termRegex = new RegExp(`\\b${this.escapeRegex(term.term)}\\b`, 'gi');
    const matches = code.match(termRegex);
    if (!matches) return 0;

    // 出現頻度と位置を考慮
    const frequency = matches.length;
    const codeLength = code.length;
    const density = frequency / (codeLength / 1000); // 1000文字あたりの密度

    return Math.min(density * 0.2, 1.0);
  }

  /**
   * エイリアスマッチング計算
   */
  private static calculateAliasMatch(code: string, term: DomainTerm): number {
    if (!code || code.length === 0 || term.aliases.length === 0) return 0;

    let totalMatches = 0;
    term.aliases.forEach(alias => {
      const aliasRegex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
      const matches = code.match(aliasRegex);
      if (matches) {
        totalMatches += matches.length;
      }
    });

    const codeLength = code.length;
    const density = totalMatches / (codeLength / 1000);

    return Math.min(density * 0.15, 1.0);
  }

  /**
   * パターンマッチング計算
   */
  private static calculatePatternMatch(code: string, term: DomainTerm): number {
    if (term.relatedPatterns.length === 0) return 0;

    let matchCount = 0;
    term.relatedPatterns.forEach(pattern => {
      try {
        const patternRegex = new RegExp(pattern, 'i');
        if (patternRegex.test(code)) {
          matchCount++;
        }
      } catch {
        // 無効な正規表現は無視
      }
    });

    return Math.min(matchCount / term.relatedPatterns.length, 1.0);
  }

  /**
   * 文脈マッチング計算
   */
  private static calculateContextualMatch(context: CodeContext, term: DomainTerm): number {
    let score = 0;

    // 関数名との関連性
    context.functions.forEach(fn => {
      if (fn.name.toLowerCase().includes(term.term.toLowerCase())) {
        score += 0.3;
      }
      term.aliases.forEach(alias => {
        if (fn.name.toLowerCase().includes(alias.toLowerCase())) {
          score += 0.2;
        }
      });
    });

    // クラス名との関連性
    context.classes.forEach(cls => {
      const className = typeof cls === 'string' ? cls : cls.name;
      if (className.toLowerCase().includes(term.term.toLowerCase())) {
        score += 0.4;
      }
      term.aliases.forEach(alias => {
        if (className.toLowerCase().includes(alias.toLowerCase())) {
          score += 0.3;
        }
      });
    });

    // インポートとの関連性
    context.imports.forEach(imp => {
      if (imp.module.toLowerCase().includes(term.term.toLowerCase())) {
        score += 0.2;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * 意味的マッチング計算
   */
  private static calculateSemanticMatch(code: string, term: DomainTerm): number {
    // 意味的関連語の検出（簡易的）
    const semanticKeywords = this.generateSemanticKeywords(term);
    let matchCount = 0;

    semanticKeywords.forEach(keyword => {
      const keywordRegex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
      if (keywordRegex.test(code)) {
        matchCount++;
      }
    });

    return Math.min(matchCount / (semanticKeywords.length || 1), 1.0);
  }

  /**
   * 意味的キーワード生成
   */
  private static generateSemanticKeywords(term: DomainTerm): string[] {
    const keywords: string[] = [];
    
    // カテゴリベースのキーワード
    const categoryKeywords: Record<string, string[]> = {
      'core-business': ['business', 'process', 'workflow', 'operation'],
      'technical': ['implementation', 'algorithm', 'method', 'function'],
      'security': ['auth', 'encrypt', 'secure', 'validate', 'verify'],
      'performance': ['optimize', 'fast', 'efficient', 'cache', 'speed'],
      'api': ['request', 'response', 'endpoint', 'service', 'client'],
      'data': ['store', 'retrieve', 'query', 'database', 'model']
    };

    if (categoryKeywords[term.category]) {
      keywords.push(...categoryKeywords[term.category]);
    }

    // 定義からキーワード抽出（簡易的）
    const definitionWords = term.definition
      .toLowerCase()
      .match(/\b\w{4,}\b/g) || [];
    keywords.push(...definitionWords.slice(0, 5));

    return [...new Set(keywords)];
  }

  /**
   * 信頼度計算
   */
  private static calculateConfidence(
    breakdown: { [key: string]: number },
    term: DomainTerm
  ): number {
    let confidence = 0.5; // ベース信頼度

    // 複数の要素でマッチした場合は信頼度が高い
    const matchingFactors = Object.values(breakdown).filter(value => value > 0.1).length;
    confidence += matchingFactors * 0.1;

    // 用語の完全性による調整
    if (term.examples.length > 0) confidence += 0.1;
    if (term.testRequirements.length > 0) confidence += 0.1;
    if (term.relatedPatterns.length > 0) confidence += 0.1;

    // 重要度による調整
    const importanceBonus = {
      critical: 0.2,
      high: 0.15,
      medium: 0.1,
      low: 0.05
    };
    confidence += importanceBonus[term.importance];

    return Math.min(confidence, 1.0);
  }

  /**
   * ルールパターンマッチング
   */
  private static calculateRulePatternMatch(context: CodeContext, rule: BusinessRule): number {
    // 簡易的な実装
    const pattern = rule.condition.pattern;
    try {
      const regex = new RegExp(pattern, 'i');
      
      // 関数名でのマッチング
      const functionMatches = context.functions.filter(fn => regex.test(fn.name)).length;
      
      // クラス名でのマッチング
      const classMatches = context.classes.filter(cls => {
        const className = typeof cls === 'string' ? cls : cls.name;
        return regex.test(className);
      }).length;
      
      const totalMatches = functionMatches + classMatches;
      const totalElements = context.functions.length + context.classes.length;
      
      return totalElements > 0 ? totalMatches / totalElements : 0;
    } catch {
      return 0;
    }
  }

  /**
   * ルールドメイン整合性
   */
  private static calculateRuleDomainAlignment(context: CodeContext, rule: BusinessRule): number {
    // ファイルパスやコンテキストとルールドメインの整合性
    const filePath = context.filePath.toLowerCase();
    const ruleDomain = rule.domain.toLowerCase();
    
    if (filePath.includes(ruleDomain)) return 1.0;
    if (context.relatedTerms.some(term => term.category === ruleDomain)) return 0.8;
    
    return 0.3;
  }

  /**
   * ルール複雑度マッチング
   */
  private static calculateRuleComplexityMatch(context: CodeContext, rule: BusinessRule): number {
    const avgComplexity = context.functions.reduce((sum, fn) => sum + fn.complexity, 0) / 
                         (context.functions.length || 1);
    
    // 高優先度ルールは複雑なコードに適用
    if (rule.priority <= 10 && avgComplexity > 5) return 1.0;
    if (rule.priority <= 50 && avgComplexity > 3) return 0.7;
    
    return 0.4;
  }

  /**
   * ルール構造マッチング
   */
  private static calculateRuleStructuralMatch(context: CodeContext, rule: BusinessRule): number {
    const scope = rule.condition.scope;
    
    switch (scope) {
      case 'function':
        return context.functions.length > 0 ? 1.0 : 0;
      case 'class':
        return context.classes.length > 0 ? 1.0 : 0;
      case 'file':
        return 1.0;
      default:
        return 0.5;
    }
  }

  /**
   * 適用可能性理由の生成
   */
  private static generateApplicabilityReason(
    factors: { [key: string]: number },
    rule: BusinessRule
  ): string {
    const highFactors = Object.entries(factors)
      .filter(([_, score]) => score > 0.6)
      .map(([factor, _]) => factor);

    if (highFactors.length === 0) return 'ルールの適用条件に合致しません';
    
    const reasonMap: Record<string, string> = {
      patternMatch: 'パターンが一致',
      domainAlignment: 'ドメインが整合',
      complexityMatch: '複雑度が適合',
      structuralMatch: '構造が対応'
    };

    const reasons = highFactors.map(factor => reasonMap[factor] || factor);
    return `${reasons.join('、')}しているため適用推奨`;
  }

  /**
   * 優先度付き要件の生成
   */
  private static generatePrioritizedRequirements(
    context: CodeContext,
    relatedTerms: TermRelevance[],
    categoryNecessity: { [key: string]: number }
  ): Array<{ requirement: string; necessity: number; rationale: string }> {
    const requirements: Array<{ requirement: string; necessity: number; rationale: string }> = [];

    // 単体テスト要件
    if (categoryNecessity.unitTests > 0.5) {
      requirements.push({
        requirement: '関数レベルの単体テスト',
        necessity: categoryNecessity.unitTests,
        rationale: `平均関数複雑度が高いため (${context.functions.length}個の関数)`
      });
    }

    // 統合テスト要件
    if (categoryNecessity.integrationTests > 0.5) {
      requirements.push({
        requirement: 'モジュール間統合テスト',
        necessity: categoryNecessity.integrationTests,
        rationale: `外部依存関係が多いため (${context.imports.length}個のインポート)`
      });
    }

    // セキュリティテスト要件
    if (categoryNecessity.securityTests > 0.3) {
      requirements.push({
        requirement: 'セキュリティテスト',
        necessity: categoryNecessity.securityTests,
        rationale: 'セキュリティ関連の用語が検出されました'
      });
    }

    // 重要用語ベースの要件
    relatedTerms
      .filter(tr => tr.term.importance === 'critical' && tr.relevance > 0.6)
      .forEach(tr => {
        requirements.push({
          requirement: `${tr.term.term}に関する包括的テスト`,
          necessity: tr.relevance,
          rationale: `重要度クリティカルの用語「${tr.term.term}」に高い関連性`
        });
      });

    return requirements.sort((a, b) => b.necessity - a.necessity);
  }

  /**
   * 正規表現エスケープ
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}