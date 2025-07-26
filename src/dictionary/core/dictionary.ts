import {
  DomainDictionary,
  DomainTerm,
  BusinessRule,
  QualityStandard,
  TermRelationship,
  ContextMapping,
  ExtractedKnowledge,
  TermCandidate,
  QualityMetrics,
  DictionaryDiff,
  UsageStatistics
} from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * ドメイン辞書のコア実装クラス
 * 用語、ルール、品質基準の管理を行う
 */
export class DomainDictionaryManager {
  private dictionary: DomainDictionary;
  private usageStats: UsageStatistics;

  constructor(initialDictionary?: Partial<DomainDictionary>) {
    this.dictionary = {
      version: '1.0.0',
      domain: 'general',
      language: 'ja',
      lastUpdated: new Date(),
      terms: [],
      relationships: [],
      businessRules: [],
      qualityStandards: [],
      contextMappings: [],
      ...initialDictionary
    };
    
    this.usageStats = {
      termUsage: new Map(),
      ruleApplication: new Map(),
      contextHits: new Map(),
      lastAccessed: new Map()
    };
  }

  // ========================================
  // 基本CRUD操作
  // ========================================

  /**
   * 辞書の取得
   */
  getDictionary(): DomainDictionary {
    return { ...this.dictionary };
  }

  /**
   * 辞書の更新
   */
  updateDictionary(updates: Partial<DomainDictionary>): void {
    this.dictionary = {
      ...this.dictionary,
      ...updates,
      lastUpdated: new Date()
    };
  }

  // ========================================
  // 用語管理
  // ========================================

  /**
   * 用語の追加
   */
  addTerm(term: DomainTerm): void {
    try {
      // 重複チェック
      if (this.findTermById(term.id)) {
        throw new Error(`用語ID '${term.id}' は既に存在します`);
      }

      this.dictionary.terms.push(term);
      this.dictionary.lastUpdated = new Date();
      
      // 使用統計を初期化
      this.usageStats.termUsage.set(term.id, 0);
      this.usageStats.lastAccessed.set(term.id, new Date());
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の追加に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の取得（ID指定）
   */
  findTermById(id: string): DomainTerm | undefined {
    const term = this.dictionary.terms.find(t => t.id === id);
    if (term) {
      this.incrementUsage('term', id);
    }
    return term;
  }

  /**
   * 用語の検索（名前・エイリアスから）
   */
  findTermsByName(name: string): DomainTerm[] {
    const matchedTerms = this.dictionary.terms.filter(term => 
      term.term.toLowerCase().includes(name.toLowerCase()) ||
      term.aliases.some(alias => alias.toLowerCase().includes(name.toLowerCase()))
    );
    
    // 使用統計を更新
    matchedTerms.forEach(term => this.incrementUsage('term', term.id));
    
    return matchedTerms;
  }

  /**
   * 用語の更新
   */
  updateTerm(id: string, updates: Partial<DomainTerm>): void {
    try {
      const index = this.dictionary.terms.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error(`用語ID '${id}' が見つかりません`);
      }

      this.dictionary.terms[index] = {
        ...this.dictionary.terms[index],
        ...updates
      };
      this.dictionary.lastUpdated = new Date();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の更新に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の削除
   */
  removeTerm(id: string): void {
    try {
      const index = this.dictionary.terms.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error(`用語ID '${id}' が見つかりません`);
      }

      this.dictionary.terms.splice(index, 1);
      
      // 関連する関係性も削除
      this.dictionary.relationships = this.dictionary.relationships.filter(
        rel => rel.sourceTermId !== id && rel.targetTermId !== id
      );
      
      // 使用統計からも削除
      this.usageStats.termUsage.delete(id);
      this.usageStats.lastAccessed.delete(id);
      
      this.dictionary.lastUpdated = new Date();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の削除に失敗しました');
      throw error;
    }
  }

  // ========================================
  // ビジネスルール管理
  // ========================================

  /**
   * ビジネスルールの追加
   */
  addBusinessRule(rule: BusinessRule): void {
    try {
      // 重複チェック
      if (this.findBusinessRuleById(rule.id)) {
        throw new Error(`ルールID '${rule.id}' は既に存在します`);
      }

      this.dictionary.businessRules.push(rule);
      this.dictionary.lastUpdated = new Date();
      
      // 使用統計を初期化
      this.usageStats.ruleApplication.set(rule.id, 0);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの追加に失敗しました');
      throw error;
    }
  }

  /**
   * ビジネスルールの取得（ID指定）
   */
  findBusinessRuleById(id: string): BusinessRule | undefined {
    const rule = this.dictionary.businessRules.find(r => r.id === id);
    if (rule) {
      this.incrementUsage('rule', id);
    }
    return rule;
  }

  /**
   * ドメインに関連するビジネスルールの取得
   */
  findBusinessRulesByDomain(domain: string): BusinessRule[] {
    const matchedRules = this.dictionary.businessRules.filter(rule => 
      rule.domain === domain
    );
    
    // 使用統計を更新
    matchedRules.forEach(rule => this.incrementUsage('rule', rule.id));
    
    return matchedRules;
  }

  /**
   * ビジネスルールの更新
   */
  updateBusinessRule(id: string, updates: Partial<BusinessRule>): void {
    try {
      const index = this.dictionary.businessRules.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error(`ルールID '${id}' が見つかりません`);
      }

      this.dictionary.businessRules[index] = {
        ...this.dictionary.businessRules[index],
        ...updates
      };
      this.dictionary.lastUpdated = new Date();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの更新に失敗しました');
      throw error;
    }
  }

  /**
   * ビジネスルールの削除
   */
  removeBusinessRule(id: string): void {
    try {
      const index = this.dictionary.businessRules.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error(`ルールID '${id}' が見つかりません`);
      }

      this.dictionary.businessRules.splice(index, 1);
      
      // 使用統計からも削除
      this.usageStats.ruleApplication.delete(id);
      
      this.dictionary.lastUpdated = new Date();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルールの削除に失敗しました');
      throw error;
    }
  }

  // ========================================
  // 関係性管理
  // ========================================

  /**
   * 用語間の関係性追加
   */
  addTermRelationship(relationship: TermRelationship): void {
    try {
      // 参照する用語の存在チェック
      if (!this.findTermById(relationship.sourceTermId)) {
        throw new Error(`参照元の用語ID '${relationship.sourceTermId}' が見つかりません`);
      }
      if (!this.findTermById(relationship.targetTermId)) {
        throw new Error(`参照先の用語ID '${relationship.targetTermId}' が見つかりません`);
      }

      this.dictionary.relationships.push(relationship);
      this.dictionary.lastUpdated = new Date();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '関係性の追加に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の関連用語取得
   */
  getRelatedTerms(termId: string): DomainTerm[] {
    const relationships = this.dictionary.relationships.filter(
      rel => rel.sourceTermId === termId || rel.targetTermId === termId
    );

    const relatedTermIds = new Set<string>();
    relationships.forEach(rel => {
      if (rel.sourceTermId === termId) {
        relatedTermIds.add(rel.targetTermId);
      } else {
        relatedTermIds.add(rel.sourceTermId);
      }
    });

    return Array.from(relatedTermIds)
      .map(id => this.findTermById(id))
      .filter((term): term is DomainTerm => term !== undefined);
  }

  // ========================================
  // 検索・フィルタリング
  // ========================================

  /**
   * 重要度に基づく用語フィルタリング
   */
  getTermsByImportance(importance: 'critical' | 'high' | 'medium' | 'low'): DomainTerm[] {
    return this.dictionary.terms.filter(term => term.importance === importance);
  }

  /**
   * カテゴリに基づく用語フィルタリング
   */
  getTermsByCategory(category: string): DomainTerm[] {
    return this.dictionary.terms.filter(term => term.category === category);
  }

  /**
   * 全文検索
   */
  searchTerms(query: string): DomainTerm[] {
    const lowercaseQuery = query.toLowerCase();
    return this.dictionary.terms.filter(term =>
      term.term.toLowerCase().includes(lowercaseQuery) ||
      term.definition.toLowerCase().includes(lowercaseQuery) ||
      term.aliases.some(alias => alias.toLowerCase().includes(lowercaseQuery)) ||
      term.examples.some(example => 
        example.code.toLowerCase().includes(lowercaseQuery) ||
        example.description.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  // ========================================
  // 統計・メトリクス
  // ========================================

  /**
   * 使用統計の更新
   */
  private incrementUsage(type: 'term' | 'rule' | 'context', id: string): void {
    const now = new Date();
    
    switch (type) {
      case 'term':
        this.usageStats.termUsage.set(id, (this.usageStats.termUsage.get(id) || 0) + 1);
        break;
      case 'rule':
        this.usageStats.ruleApplication.set(id, (this.usageStats.ruleApplication.get(id) || 0) + 1);
        break;
      case 'context':
        this.usageStats.contextHits.set(id, (this.usageStats.contextHits.get(id) || 0) + 1);
        break;
    }
    
    this.usageStats.lastAccessed.set(id, now);
  }

  /**
   * 使用統計の取得
   */
  getUsageStatistics(): UsageStatistics {
    return {
      termUsage: new Map(this.usageStats.termUsage),
      ruleApplication: new Map(this.usageStats.ruleApplication),
      contextHits: new Map(this.usageStats.contextHits),
      lastAccessed: new Map(this.usageStats.lastAccessed)
    };
  }

  /**
   * 辞書の品質評価
   */
  evaluateQuality(): QualityMetrics {
    const totalTerms = this.dictionary.terms.length;
    const totalRules = this.dictionary.businessRules.length;
    
    // 完全性：定義が充実している用語の割合
    const completeTerms = this.dictionary.terms.filter(term => 
      term.definition.length > 10 && 
      term.examples.length > 0 && 
      term.testRequirements.length > 0
    ).length;
    const completeness = totalTerms > 0 ? (completeTerms / totalTerms) * 100 : 0;
    
    // 一貫性：重複や矛盾のないエイリアスの割合
    const aliasSet = new Set<string>();
    let inconsistentAliases = 0;
    this.dictionary.terms.forEach(term => {
      term.aliases.forEach(alias => {
        if (aliasSet.has(alias)) {
          inconsistentAliases++;
        } else {
          aliasSet.add(alias);
        }
      });
    });
    const consistency = totalTerms > 0 ? ((totalTerms - inconsistentAliases) / totalTerms) * 100 : 100;
    
    // カバレッジ：関係性を持つ用語の割合
    const connectedTerms = new Set<string>();
    this.dictionary.relationships.forEach(rel => {
      connectedTerms.add(rel.sourceTermId);
      connectedTerms.add(rel.targetTermId);
    });
    const coverage = totalTerms > 0 ? (connectedTerms.size / totalTerms) * 100 : 0;
    
    // 精度：重要度がcritical/highの用語が適切にテスト要件を持つ割合
    const criticalTerms = this.dictionary.terms.filter(term => 
      term.importance === 'critical' || term.importance === 'high'
    );
    const accurateTerms = criticalTerms.filter(term => term.testRequirements.length > 0);
    const accuracy = criticalTerms.length > 0 ? (accurateTerms.length / criticalTerms.length) * 100 : 100;
    
    // 総合スコア
    const overall = (completeness + consistency + coverage + accuracy) / 4;
    
    return {
      completeness,
      accuracy,
      consistency,
      coverage,
      overall
    };
  }

  /**
   * 辞書の統計情報
   */
  getStatistics(): {
    totalTerms: number;
    totalRules: number;
    totalRelationships: number;
    categoryCounts: Record<string, number>;
    importanceCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    const importanceCounts: Record<string, number> = {};
    
    this.dictionary.terms.forEach(term => {
      categoryCounts[term.category] = (categoryCounts[term.category] || 0) + 1;
      importanceCounts[term.importance] = (importanceCounts[term.importance] || 0) + 1;
    });
    
    return {
      totalTerms: this.dictionary.terms.length,
      totalRules: this.dictionary.businessRules.length,
      totalRelationships: this.dictionary.relationships.length,
      categoryCounts,
      importanceCounts
    };
  }
}