import {
  DictionaryAwarePlugin,
  TestFile,
  DomainDictionary,
  ContextualAnalysis,
  DetectionResult,
  DomainContext,
  DomainQualityScore,
  ProjectContext,
  QualityScore,
  Improvement,
  TermRelevance,
  BusinessRule
} from '../../core/types';
import { BasePlugin } from './BasePlugin';
import { ContextEngine } from '../../dictionary/context/engine';
import { ContextAnalyzer } from '../../dictionary/context/analyzer';
import { ContextualScorer } from '../../dictionary/context/scorer';
import { errorHandler } from '../../utils/errorHandler';

/**
 * ドメイン辞書対応プラグインのベースクラス
 * 既存のBasePluginを拡張して、辞書機能を統合
 */
export abstract class DictionaryAwareBasePlugin extends BasePlugin implements DictionaryAwarePlugin {
  protected contextEngine?: ContextEngine;
  protected contextAnalyzer?: ContextAnalyzer;
  
  // 辞書が設定されているかどうかのフラグ
  protected isDictionaryEnabled: boolean = false;

  /**
   * 辞書を使用した文脈分析
   */
  async analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis> {
    try {
      // 辞書エンジンの初期化
      if (!this.contextEngine) {
        this.contextEngine = new ContextEngine(dictionary);
      }
      
      if (!this.contextAnalyzer) {
        this.contextAnalyzer = new ContextAnalyzer(dictionary);
      }

      this.isDictionaryEnabled = true;

      // ファイル内容の文脈分析を実行
      const analysis = await this.contextAnalyzer.performContextualAnalysis(
        testFile.content,
        testFile.path,
        dictionary
      );

      this.logDebug('辞書を使用した文脈分析が完了しました', {
        filePath: testFile.path,
        relevantTermsCount: analysis.relevantTerms.length,
        applicableRulesCount: analysis.applicableRules.length,
        qualityScore: analysis.qualityScore
      });

      return analysis;
    } catch (error) {
      this.logError('文脈分析中にエラーが発生しました', error);
      
      // フォールバック: 基本的な分析結果を返す
      const basicContext = await this.contextEngine?.analyzeContext(testFile.content, testFile.path);
      
      return {
        context: basicContext || {
          filePath: testFile.path,
          language: testFile.metadata.language as any,
          functions: [],
          classes: [],
          imports: [],
          domainRelevance: 0,
          relatedTerms: []
        },
        relevantTerms: [],
        applicableRules: [],
        requiredTests: [],
        qualityScore: 0
      };
    }
  }

  /**
   * ドメイン固有の品質評価
   */
  evaluateDomainQuality(
    patterns: DetectionResult[],
    context: DomainContext
  ): DomainQualityScore {
    try {
      // ドメイン適合度の計算
      const domainAlignment = this.calculateDomainAlignment(patterns, context);
      
      // ビジネス規則への準拠度計算
      const businessCompliance = this.calculateBusinessCompliance(patterns, context);
      
      // 技術的品質の計算
      const technicalQuality = this.calculateTechnicalQuality(patterns);
      
      // 総合スコアの計算（重み付き平均）
      const overall = Math.round(
        (domainAlignment * 0.4) + 
        (businessCompliance * 0.4) + 
        (technicalQuality * 0.2)
      );

      // 推奨事項の生成
      const recommendations = this.generateDomainRecommendations(
        patterns,
        context,
        { domainAlignment, businessCompliance, technicalQuality }
      );

      this.logDebug('ドメイン品質評価が完了しました', {
        overall,
        domainAlignment,
        businessCompliance,
        technicalQuality,
        recommendationsCount: recommendations.length
      });

      return {
        overall,
        dimensions: {
          domainAlignment,
          businessCompliance,
          technicalQuality
        },
        recommendations
      };
    } catch (error) {
      this.logError('ドメイン品質評価中にエラーが発生しました', error);
      
      // エラー時はデフォルトスコアを返す
      return {
        overall: 50,
        dimensions: {
          domainAlignment: 50,
          businessCompliance: 50,
          technicalQuality: 50
        },
        recommendations: ['ドメイン品質評価中にエラーが発生しました。設定を確認してください。']
      };
    }
  }

  /**
   * 既存のevaluateQualityメソッドを拡張
   * 辞書が利用可能な場合はドメイン情報も考慮
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // 基本的な品質スコアを計算
    const basicScore = this.calculateBasicQualityScore(patterns);
    
    // 辞書が利用可能な場合は、追加の品質チェックを実行
    if (this.isDictionaryEnabled && this.contextEngine) {
      const enhancedScore = this.enhanceQualityWithDomain(basicScore, patterns);
      return enhancedScore;
    }
    
    return basicScore;
  }

  // ========================================
  // プロテクテッドメソッド（継承クラス向け）
  // ========================================

  /**
   * ドメイン適合度の計算
   */
  protected calculateDomainAlignment(
    patterns: DetectionResult[],
    context: DomainContext
  ): number {
    if (context.primaryTerms.length === 0) {
      return 50; // 中立的なスコア
    }

    // パターンがドメイン用語とどの程度関連しているかを評価
    let alignmentScore = 0;
    let totalWeight = 0;

    for (const pattern of patterns) {
      for (const term of context.primaryTerms) {
        const relevance = this.calculatePatternTermRelevance(pattern, term);
        const weight = this.getTermWeight(term.importance);
        
        alignmentScore += relevance * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 50;
    }

    return Math.min(100, Math.max(0, Math.round((alignmentScore / totalWeight) * 100)));
  }

  /**
   * ビジネス規則への準拠度計算
   */
  protected calculateBusinessCompliance(
    patterns: DetectionResult[],
    context: DomainContext
  ): number {
    if (context.activeRules.length === 0) {
      return 75; // ルールがない場合は高めのデフォルト
    }

    let complianceScore = 0;
    let applicableRules = 0;

    for (const rule of context.activeRules) {
      const isApplicable = this.isRuleApplicableToPatterns(rule, patterns);
      if (isApplicable) {
        applicableRules++;
        const compliance = this.evaluateRuleCompliance(rule, patterns);
        complianceScore += compliance;
      }
    }

    if (applicableRules === 0) {
      return 75;
    }

    return Math.round(complianceScore / applicableRules);
  }

  /**
   * 技術的品質の計算
   */
  protected calculateTechnicalQuality(patterns: DetectionResult[]): number {
    if (patterns.length === 0) {
      return 100;
    }

    // パターンの信頼度の平均を技術的品質として使用
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    
    // 信頼度が高いほど技術的品質も高い
    return Math.round(avgConfidence * 100);
  }

  /**
   * ドメイン品質を考慮した改善推奨事項の生成
   */
  protected generateDomainRecommendations(
    patterns: DetectionResult[],
    context: DomainContext,
    scores: { domainAlignment: number; businessCompliance: number; technicalQuality: number }
  ): string[] {
    const recommendations: string[] = [];

    // ドメイン適合度が低い場合
    if (scores.domainAlignment < 60) {
      recommendations.push(
        `ドメイン適合度が低いです（${scores.domainAlignment}点）。` +
        `主要なドメイン用語（${context.primaryTerms.map(t => t.term).join(', ')}）を` +
        `テストに含めることを検討してください。`
      );
    }

    // ビジネス規則への準拠度が低い場合
    if (scores.businessCompliance < 70) {
      recommendations.push(
        `ビジネス規則への準拠度が低いです（${scores.businessCompliance}点）。` +
        `適用可能なビジネスルールを確認し、テストケースに反映してください。`
      );
    }

    // 技術的品質が低い場合
    if (scores.technicalQuality < 80) {
      recommendations.push(
        `技術的品質を向上させる余地があります（${scores.technicalQuality}点）。` +
        `テストの構造や命名規則を見直してください。`
      );
    }

    // 総合スコアが低い場合の包括的な推奨
    const overall = (scores.domainAlignment + scores.businessCompliance + scores.technicalQuality) / 3;
    if (overall < 60) {
      recommendations.push(
        'ドメイン品質の総合的な改善が必要です。ドメイン辞書の内容を確認し、' +
        'テスト設計におけるドメイン知識の活用を強化してください。'
      );
    }

    return recommendations;
  }

  // ========================================
  // プライベートヘルパーメソッド
  // ========================================

  /**
   * パターンと用語の関連度計算
   */
  private calculatePatternTermRelevance(pattern: DetectionResult, term: any): number {
    const patternText = JSON.stringify(pattern).toLowerCase();
    const termText = term.term.toLowerCase();
    
    // 単純な文字列マッチングによる関連度計算
    if (patternText.includes(termText)) {
      return 1.0;
    }
    
    // エイリアスとのマッチング
    if (term.aliases) {
      for (const alias of term.aliases) {
        if (patternText.includes(alias.toLowerCase())) {
          return 0.8;
        }
      }
    }
    
    return 0.0;
  }

  /**
   * 用語の重要度に基づく重み計算
   */
  private getTermWeight(importance: string): number {
    switch (importance) {
      case 'critical': return 4.0;
      case 'high': return 3.0;
      case 'medium': return 2.0;
      case 'low': return 1.0;
      default: return 1.0;
    }
  }

  /**
   * ルールがパターンに適用可能かどうかの判定
   */
  private isRuleApplicableToPatterns(rule: BusinessRule, patterns: DetectionResult[]): boolean {
    // 簡易的な適用性判定（実際の実装ではより詳細な条件チェックが必要）
    if (!rule.condition) {
      return false;
    }

    const condition = rule.condition;
    const patternsText = patterns.map(p => JSON.stringify(p).toLowerCase()).join(' ');
    
    // パターンマッチングによる適用性判定
    if (condition.pattern) {
      const regex = new RegExp(condition.pattern, 'i');
      return regex.test(patternsText);
    }
    
    return false;
  }

  /**
   * ルールへの準拠度評価
   */
  private evaluateRuleCompliance(rule: BusinessRule, patterns: DetectionResult[]): number {
    // 簡易的な準拠度評価（実際の実装ではより詳細な評価が必要）
    const baseCompliance = 75;
    
    // パターンの信頼度を考慮
    if (patterns.length > 0) {
      const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      return Math.round(baseCompliance + (avgConfidence * 25));
    }
    
    return baseCompliance;
  }

  /**
   * ドメイン情報を考慮した品質スコア向上
   */
  private enhanceQualityWithDomain(
    basicScore: QualityScore,
    patterns: DetectionResult[]
  ): QualityScore {
    // 基本スコアにドメイン情報を考慮したボーナスを追加
    const domainBonus = this.calculateDomainBonus(patterns);
    
    return {
      ...basicScore,
      overall: Math.min(100, basicScore.overall + domainBonus),
      breakdown: {
        ...basicScore.breakdown,
        // ドメイン適合度の情報を追加
        domainAlignment: this.calculateDomainAlignmentForScore(patterns)
      }
    };
  }

  /**
   * ドメイン情報によるボーナススコア計算
   */
  private calculateDomainBonus(patterns: DetectionResult[]): number {
    // パターンがドメイン用語を含んでいる場合のボーナス
    let bonus = 0;
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.8) {
        bonus += 2; // 高信頼度パターンには追加ボーナス
      }
    }
    
    return Math.min(15, bonus); // 最大15点のボーナス
  }

  /**
   * スコア用のドメイン適合度計算
   */
  private calculateDomainAlignmentForScore(patterns: DetectionResult[]): number {
    if (patterns.length === 0) {
      return 50;
    }
    
    // パターンの平均信頼度を適合度として使用
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    return Math.round(avgConfidence * 100);
  }
}