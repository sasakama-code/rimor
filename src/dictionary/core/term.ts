import { DomainTerm, TermRelationship } from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * ドメイン用語の管理クラス
 * 用語の作成、検証、操作を行う
 */
export class DomainTermManager {
  
  /**
   * 新しいドメイン用語を作成
   */
  static createTerm(params: {
    id: string;
    term: string;
    definition: string;
    category: string;
    importance?: 'critical' | 'high' | 'medium' | 'low';
    aliases?: string[];
    examples?: Array<{ code: string; description: string }>;
    relatedPatterns?: string[];
    testRequirements?: string[];
  }): DomainTerm {
    try {
      // 基本検証
      if (!params.id || !params.term || !params.definition || !params.category) {
        throw new Error('必須フィールドが不足しています: id, term, definition, category');
      }

      if (params.term.length < 2) {
        throw new Error('用語は2文字以上である必要があります');
      }

      if (params.definition.length < 10) {
        throw new Error('定義は10文字以上である必要があります');
      }

      const term: DomainTerm = {
        id: params.id,
        term: params.term.trim(),
        aliases: params.aliases || [],
        definition: params.definition.trim(),
        category: params.category.trim(),
        importance: params.importance || 'medium',
        examples: params.examples || [],
        relatedPatterns: params.relatedPatterns || [],
        testRequirements: params.testRequirements || []
      };

      return this.validateTerm(term);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の作成に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の妥当性検証
   */
  static validateTerm(term: DomainTerm): DomainTerm {
    try {
      // ID形式の検証
      if (!/^[a-zA-Z0-9\-_]+$/.test(term.id)) {
        throw new Error('用語IDは英数字、ハイフン、アンダースコアのみ使用可能です');
      }

      // エイリアスの重複チェック
      const uniqueAliases = [...new Set(term.aliases)];
      if (uniqueAliases.length !== term.aliases.length) {
        throw new Error('エイリアスに重複があります');
      }

      // カテゴリの正規化
      const validCategories = [
        'core-business', 'technical', 'domain-specific', 'integration', 
        'security', 'performance', 'ui-ux', 'data', 'api', 'other'
      ];
      
      if (!validCategories.includes(term.category)) {
        // カスタムカテゴリを許可するが、警告する
        console.warn(`警告: カスタムカテゴリ '${term.category}' が使用されています`);
      }

      // 例文の検証
      term.examples.forEach((example, index) => {
        if (!example.code || !example.description) {
          throw new Error(`例文 ${index + 1} にコードまたは説明が不足しています`);
        }
      });

      return term;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の検証に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の更新
   */
  static updateTerm(
    existingTerm: DomainTerm, 
    updates: Partial<Omit<DomainTerm, 'id'>>
  ): DomainTerm {
    try {
      const updatedTerm: DomainTerm = {
        ...existingTerm,
        ...updates
      };

      return this.validateTerm(updatedTerm);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語の更新に失敗しました');
      throw error;
    }
  }

  /**
   * エイリアスの追加
   */
  static addAlias(term: DomainTerm, alias: string): DomainTerm {
    try {
      if (!alias || alias.trim().length === 0) {
        throw new Error('エイリアスが空です');
      }

      const trimmedAlias = alias.trim();
      
      if (term.aliases.includes(trimmedAlias)) {
        throw new Error(`エイリアス '${trimmedAlias}' は既に存在します`);
      }

      if (term.term === trimmedAlias) {
        throw new Error('エイリアスは用語名と同じにできません');
      }

      const updatedTerm = {
        ...term,
        aliases: [...term.aliases, trimmedAlias]
      };

      return this.validateTerm(updatedTerm);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'エイリアスの追加に失敗しました');
      throw error;
    }
  }

  /**
   * エイリアスの削除
   */
  static removeAlias(term: DomainTerm, alias: string): DomainTerm {
    const updatedTerm = {
      ...term,
      aliases: term.aliases.filter(a => a !== alias)
    };

    return this.validateTerm(updatedTerm);
  }

  /**
   * 例文の追加
   */
  static addExample(
    term: DomainTerm, 
    example: { code: string; description: string }
  ): DomainTerm {
    try {
      if (!example.code || !example.description) {
        throw new Error('例文にはコードと説明の両方が必要です');
      }

      if (example.code.length < 5) {
        throw new Error('コード例は5文字以上である必要があります');
      }

      const updatedTerm = {
        ...term,
        examples: [...term.examples, example]
      };

      return this.validateTerm(updatedTerm);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '例文の追加に失敗しました');
      throw error;
    }
  }

  /**
   * テスト要件の追加
   */
  static addTestRequirement(term: DomainTerm, requirement: string): DomainTerm {
    try {
      if (!requirement || requirement.trim().length === 0) {
        throw new Error('テスト要件が空です');
      }

      const trimmedRequirement = requirement.trim();
      
      if (term.testRequirements.includes(trimmedRequirement)) {
        throw new Error(`テスト要件 '${trimmedRequirement}' は既に存在します`);
      }

      const updatedTerm = {
        ...term,
        testRequirements: [...term.testRequirements, trimmedRequirement]
      };

      return this.validateTerm(updatedTerm);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'テスト要件の追加に失敗しました');
      throw error;
    }
  }

  /**
   * 用語の重要度に基づく推奨テスト要件の生成
   */
  static generateRecommendedTestRequirements(term: DomainTerm): string[] {
    const recommendations: string[] = [];

    switch (term.importance) {
      case 'critical':
        recommendations.push(
          '境界値テスト（最小値・最大値・NULL値）',
          'エラーハンドリングテスト',
          'セキュリティテスト',
          'パフォーマンステスト',
          '回帰テスト'
        );
        break;
      
      case 'high':
        recommendations.push(
          '正常系テスト',
          '異常系テスト',
          'エラーハンドリングテスト',
          '統合テスト'
        );
        break;
        
      case 'medium':
        recommendations.push(
          '正常系テスト',
          '基本的な異常系テスト',
          '単体テスト'
        );
        break;
        
      case 'low':
        recommendations.push(
          '基本的な正常系テスト'
        );
        break;
    }

    // カテゴリ別の推奨事項
    if (term.category === 'security') {
      recommendations.push('セキュリティテスト', '認証・認可テスト');
    } else if (term.category === 'api') {
      recommendations.push('APIテスト', 'レスポンス検証テスト');
    } else if (term.category === 'data') {
      recommendations.push('データ整合性テスト', 'データ変換テスト');
    }

    return [...new Set(recommendations)]; // 重複を除去
  }

  /**
   * 用語の完全性スコア計算
   */
  static calculateCompletenessScore(term: DomainTerm): {
    score: number;
    details: {
      hasDefinition: boolean;
      hasExamples: boolean;
      hasTestRequirements: boolean;
      hasAliases: boolean;
      definitionLength: number;
    };
  } {
    const details = {
      hasDefinition: term.definition.length >= 10,
      hasExamples: term.examples.length > 0,
      hasTestRequirements: term.testRequirements.length > 0,
      hasAliases: term.aliases.length > 0,
      definitionLength: term.definition.length
    };

    let score = 0;
    
    // 基本要素（60点）
    if (details.hasDefinition) score += 20;
    if (details.hasExamples) score += 20;
    if (details.hasTestRequirements) score += 20;
    
    // 追加要素（40点）
    if (details.hasAliases) score += 10;
    if (details.definitionLength >= 50) score += 10;
    if (term.examples.length >= 2) score += 10;
    if (term.testRequirements.length >= 3) score += 10;

    return { score, details };
  }

  /**
   * 用語の関連度計算（他の用語との類似度）
   */
  static calculateRelatedness(term1: DomainTerm, term2: DomainTerm): number {
    if (term1.id === term2.id) return 1.0;

    let score = 0;
    
    // カテゴリの一致
    if (term1.category === term2.category) score += 0.3;
    
    // 重要度の近さ
    const importanceWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const importanceDiff = Math.abs(
      importanceWeight[term1.importance] - importanceWeight[term2.importance]
    );
    score += (1 - importanceDiff / 3) * 0.2;
    
    // 共通のエイリアス
    const commonAliases = term1.aliases.filter(alias => 
      term2.aliases.includes(alias) || term2.term === alias
    );
    score += Math.min(commonAliases.length * 0.1, 0.3);
    
    // 定義内での言及
    const term1InTerm2 = term2.definition.toLowerCase().includes(term1.term.toLowerCase());
    const term2InTerm1 = term1.definition.toLowerCase().includes(term2.term.toLowerCase());
    if (term1InTerm2 || term2InTerm1) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * 用語の自動タグ生成
   */
  static generateTags(term: DomainTerm): string[] {
    const tags: string[] = [];
    
    // 重要度タグ
    tags.push(`importance:${term.importance}`);
    
    // カテゴリタグ
    tags.push(`category:${term.category}`);
    
    // 完全性タグ
    const completeness = this.calculateCompletenessScore(term);
    if (completeness.score >= 80) tags.push('complete');
    else if (completeness.score >= 60) tags.push('partial');
    else tags.push('incomplete');
    
    // 特徴タグ
    if (term.aliases.length > 2) tags.push('multi-alias');
    if (term.examples.length > 2) tags.push('well-documented');
    if (term.testRequirements.length > 3) tags.push('test-rich');
    
    return tags;
  }
}