/**
 * BaseDomainPlugin
 * 
 * ドメイン固有プラグインの基底クラス
 * ドメイン辞書と連携し、ビジネスドメインに特化した分析を提供
 * 
 * SOLID原則に準拠し、ドメイン知識の拡張可能な実装を提供
 */

import { BasePlugin } from './BasePlugin';
import { 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement 
} from '../../core/types';

// ドメイン辞書の型定義
export interface DomainDictionary {
  terms: DomainTerm[];
  rules: BusinessRule[];
  context: DomainContext;
}

export interface DomainTerm {
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  relatedTerms?: string[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  testRequired: boolean;
}

export interface DomainContext {
  domain: string;
  subdomains?: string[];
  language: string;
  version: string;
}

// ドメイン品質スコア
export interface DomainQualityScore extends QualityScore {
  domainCoverage?: number;
  businessRuleCompliance?: number;
  terminologyConsistency?: number;
}

/**
 * ドメイン固有プラグインの基底クラス
 */
export abstract class BaseDomainPlugin extends BasePlugin {
  type = 'domain' as const;
  protected dictionary?: DomainDictionary;

  /**
   * ドメイン辞書を設定
   */
  setDictionary(dictionary: DomainDictionary): void {
    this.dictionary = dictionary;
  }

  /**
   * ドメイン辞書を取得
   */
  getDictionary(): DomainDictionary | undefined {
    return this.dictionary;
  }

  /**
   * ドメイン用語の検出
   */
  protected detectDomainTerms(content: string): DomainTerm[] {
    if (!this.dictionary) {
      return [];
    }

    const detectedTerms: DomainTerm[] = [];
    const cleanContent = this.removeCommentsAndStrings(content).toLowerCase();

    for (const term of this.dictionary.terms) {
      const searchTerms = [term.term, ...(term.aliases || [])];
      
      for (const searchTerm of searchTerms) {
        if (cleanContent.includes(searchTerm.toLowerCase())) {
          detectedTerms.push(term);
          break;
        }
      }
    }

    return detectedTerms;
  }

  /**
   * ビジネスルールの適合性チェック
   */
  protected checkBusinessRuleCompliance(
    content: string,
    detectedTerms: DomainTerm[]
  ): BusinessRule[] {
    if (!this.dictionary) {
      return [];
    }

    const violatedRules: BusinessRule[] = [];

    for (const rule of this.dictionary.rules) {
      if (rule.testRequired) {
        // ルールに関連する用語が検出されたが、テストが不足している場合
        const relatedTerms = detectedTerms.filter(term => 
          content.includes(term.term) && !this.hasTestForRule(content, rule)
        );

        if (relatedTerms.length > 0) {
          violatedRules.push(rule);
        }
      }
    }

    return violatedRules;
  }

  /**
   * ルールに対するテストの存在確認
   */
  protected hasTestForRule(content: string, rule: BusinessRule): boolean {
    // シンプルな実装：ルール名がテスト名に含まれているかチェック
    const testPattern = /(?:test|it|describe)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match;
    
    while ((match = testPattern.exec(content)) !== null) {
      const testName = match[1].toLowerCase();
      if (testName.includes(rule.name.toLowerCase()) || 
          testName.includes(rule.id.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * ドメイン品質スコアの計算
   */
  protected calculateDomainQualityScore(
    detectedTerms: DomainTerm[],
    violatedRules: BusinessRule[]
  ): DomainQualityScore {
    const baseScore = 100;
    let domainCoverage = 100;
    let businessRuleCompliance = 100;
    let terminologyConsistency = 100;

    // ドメインカバレッジの計算
    if (this.dictionary) {
      const coverageRatio = detectedTerms.length / this.dictionary.terms.length;
      domainCoverage = Math.min(100, coverageRatio * 100);
    }

    // ビジネスルール準拠度の計算
    if (this.dictionary && this.dictionary.rules.length > 0) {
      const complianceRatio = 1 - (violatedRules.length / this.dictionary.rules.length);
      businessRuleCompliance = complianceRatio * 100;
    }

    // 用語一貫性（簡略化された実装）
    terminologyConsistency = detectedTerms.length > 0 ? 100 : 50;

    const overall = (domainCoverage + businessRuleCompliance + terminologyConsistency) / 3;

    return {
      overall,
      dimensions: {
        completeness: domainCoverage,
        correctness: businessRuleCompliance,
        maintainability: terminologyConsistency
      },
      confidence: 0.8,
      domainCoverage,
      businessRuleCompliance,
      terminologyConsistency
    };
  }

  /**
   * ドメイン固有の改善提案生成
   */
  protected generateDomainImprovements(
    violatedRules: BusinessRule[],
    score: DomainQualityScore
  ): Improvement[] {
    const improvements: Improvement[] = [];

    // ビジネスルール違反に対する改善提案
    for (const rule of violatedRules) {
      improvements.push({
        id: `fix-business-rule-${rule.id}`,
        priority: rule.priority,
        type: 'add-test',
        category: 'domain-compliance',
        title: `Add test for business rule: ${rule.name}`,
        description: rule.description,
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.1,
        autoFixable: false
      });
    }

    // ドメインカバレッジ改善の提案
    if (score.domainCoverage && score.domainCoverage < 50) {
      improvements.push({
        id: 'improve-domain-coverage',
        priority: 'medium',
        type: 'refactor',
        category: 'domain-coverage',
        title: 'Improve domain term coverage in tests',
        description: 'Add tests that cover more domain-specific scenarios',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.3,
        autoFixable: false
      });
    }

    return improvements;
  }

  /**
   * プロジェクトコンテキストからドメイン情報を抽出
   */
  protected extractDomainInfo(context: ProjectContext): string | undefined {
    // package.jsonやプロジェクト設定からドメイン情報を推測
    if (context.packageJson) {
      const keywords = context.packageJson.keywords || [];
      const description = context.packageJson.description || '';
      
      // ドメイン関連のキーワードを探す
      const domainKeywords = ['ecommerce', 'finance', 'healthcare', 'education', 'logistics'];
      for (const keyword of domainKeywords) {
        if (keywords.includes(keyword) || description.toLowerCase().includes(keyword)) {
          return keyword;
        }
      }
    }

    return undefined;
  }

  /**
   * ドメイン固有のパターン検出（サブクラスで実装）
   */
  abstract detectDomainPatterns(testFile: TestFile): Promise<DetectionResult[]>;

  /**
   * ドメイン品質の評価（サブクラスで実装）
   */
  abstract evaluateDomainQuality(patterns: DetectionResult[]): DomainQualityScore;
}