import {
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  ProjectContext,
  DomainDictionary,
  ContextualAnalysis,
  DomainContext,
  DomainQualityScore,
  Evidence,
  CodeLocation
} from '../../core/types';
import { DictionaryAwareBasePlugin } from '../base/DictionaryAwareBasePlugin';

/**
 * ドメイン用語カバレッジプラグイン
 * テストコードがドメイン用語をどの程度カバーしているかを評価
 */
export class DomainTermCoveragePlugin extends DictionaryAwareBasePlugin {
  id = 'domain-term-coverage';
  name = 'DomainTermCoverage';
  version = '1.0.0';
  type = 'domain' as const;

  /**
   * プラグインの適用条件
   */
  isApplicable(context: ProjectContext): boolean {
    // TypeScriptまたはJavaScriptプロジェクトに適用
    return context.language === 'typescript' || context.language === 'javascript';
  }

  /**
   * パターン検出（基本実装）
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    
    try {
      // テストファイル名からのドメイン用語検出
      const fileNamePatterns = this.detectDomainTermsInFileName(testFile);
      patterns.push(...fileNamePatterns);
      
      // テストコード内容からのドメイン用語検出
      const contentPatterns = this.detectDomainTermsInContent(testFile);
      patterns.push(...contentPatterns);
      
      // テスト関数名からのドメイン用語検出
      const functionPatterns = this.detectDomainTermsInFunctions(testFile);
      patterns.push(...functionPatterns);

      this.logDebug('ドメイン用語パターン検出が完了しました', {
        filePath: testFile.path,
        totalPatterns: patterns.length,
        fileNamePatterns: fileNamePatterns.length,
        contentPatterns: contentPatterns.length,
        functionPatterns: functionPatterns.length
      });

    } catch (error) {
      this.logError('パターン検出中にエラーが発生しました', error);
    }

    return patterns;
  }

  /**
   * 品質評価（基本実装）
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const coverageScore = this.calculateDomainTermCoverage(patterns);
    const consistencyScore = this.calculateTermUsageConsistency(patterns);
    
    const overall = Math.round((coverageScore * 0.7) + (consistencyScore * 0.3));
    
    return {
      overall,
      breakdown: {
        completeness: coverageScore,
        correctness: consistencyScore,
        maintainability: Math.min(overall + 10, 100)
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0.5
    };
  }

  /**
   * 改善提案
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    if (evaluation.breakdown.completeness < 70) {
      improvements.push(this.createImprovement(
        'add-domain-terms',
        'high',
        'add',
        'ドメイン用語の追加',
        'テストにより多くのドメイン用語を含めて、ビジネス要件のカバレッジを向上させてください。',
        this.createCodeLocation('', 1),
        { scoreImprovement: 15, effortMinutes: 30 }
      ));
    }
    
    if (evaluation.breakdown.correctness < 80) {
      improvements.push(this.createImprovement(
        'improve-term-consistency',
        'medium',
        'modify',
        '用語使用の一貫性向上',
        'ドメイン用語の使用方法を統一し、一貫性を保ってください。',
        this.createCodeLocation('', 1),
        { scoreImprovement: 10, effortMinutes: 20 }
      ));
    }

    return improvements;
  }

  /**
   * 辞書を使用した拡張分析
   */
  async analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis> {
    try {
      // 基本の文脈分析を実行
      const basicAnalysis = await super.analyzeWithContext(testFile, dictionary);
      
      // ドメイン固有の拡張分析
      const domainSpecificAnalysis = await this.performDomainSpecificAnalysis(
        testFile,
        dictionary,
        basicAnalysis
      );
      
      return {
        ...basicAnalysis,
        ...domainSpecificAnalysis,
        qualityScore: this.calculateEnhancedQualityScore(
          basicAnalysis,
          domainSpecificAnalysis
        )
      };
    } catch (error) {
      this.logError('辞書を使用した分析中にエラーが発生しました', error);
      return super.analyzeWithContext(testFile, dictionary);
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
      const baseEvaluation = super.evaluateDomainQuality(patterns, context);
      
      // ドメイン用語カバレッジ固有の評価を追加
      const termCoverageScore = this.evaluateTermCoverageQuality(patterns, context);
      const termUsageScore = this.evaluateTermUsageQuality(patterns, context);
      
      // スコアの統合
      const enhancedScore = Math.round(
        (baseEvaluation.overall * 0.6) +
        (termCoverageScore * 0.25) +
        (termUsageScore * 0.15)
      );
      
      // 推奨事項の拡張
      const enhancedRecommendations = [
        ...baseEvaluation.recommendations,
        ...this.generateCoverageSpecificRecommendations(patterns, context)
      ];
      
      return {
        overall: enhancedScore,
        dimensions: {
          domainAlignment: baseEvaluation.dimensions.domainAlignment,
          businessCompliance: termCoverageScore,
          technicalQuality: termUsageScore
        },
        recommendations: enhancedRecommendations
      };
    } catch (error) {
      this.logError('ドメイン品質評価中にエラーが発生しました', error);
      return super.evaluateDomainQuality(patterns, context);
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * ファイル名からのドメイン用語検出
   */
  private detectDomainTermsInFileName(testFile: TestFile): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const fileName = testFile.path.split('/').pop() || '';
    
    // 一般的なドメイン用語パターン
    const domainTermPatterns = [
      /user/i, /payment/i, /order/i, /product/i, /customer/i,
      /service/i, /controller/i, /model/i, /repository/i
    ];
    
    domainTermPatterns.forEach((pattern, index) => {
      const matches = this.findPatternInCode(fileName, pattern);
      matches.forEach(match => {
        patterns.push(this.createDetectionResult(
          `domain-term-filename-${index}`,
          `Domain Term in Filename: ${match.match}`,
          this.createCodeLocation(testFile.path, 0),
          0.8,
          [{
            type: 'filename-domain-term',
            description: `ファイル名にドメイン用語 "${match.match}" が含まれています`,
            location: this.createCodeLocation(testFile.path, 0),
            code: fileName,
            confidence: 0.8
          }]
        ));
      });
    });
    
    return patterns;
  }

  /**
   * コンテンツからのドメイン用語検出
   */
  private detectDomainTermsInContent(testFile: TestFile): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const cleanedContent = this.removeCommentsAndStrings(testFile.content);
    
    // 変数名や関数呼び出しからドメイン用語を検出
    const domainTermRegex = /\b(user|payment|order|product|customer|service|controller|model|repository)\w*/gi;
    const matches = this.findPatternInCode(cleanedContent, domainTermRegex);
    
    matches.forEach((match, index) => {
      patterns.push(this.createDetectionResult(
        `domain-term-content-${index}`,
        `Domain Term in Content: ${match.match}`,
        this.createCodeLocation(testFile.path, match.line, undefined, match.column),
        0.7,
        [{
          type: 'content-domain-term',
          description: `コード内にドメイン用語 "${match.match}" が使用されています`,
          location: this.createCodeLocation(testFile.path, match.line, undefined, match.column),
          code: match.match,
          confidence: 0.7
        }]
      ));
    });
    
    return patterns;
  }

  /**
   * 関数名からのドメイン用語検出
   */
  private detectDomainTermsInFunctions(testFile: TestFile): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    
    // テスト関数のパターン
    const testFunctionRegex = /(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const matches = this.findPatternInCode(testFile.content, testFunctionRegex);
    
    matches.forEach((match, index) => {
      // テスト名にドメイン用語が含まれているかチェック
      const testName = match.match;
      const hasDomainTerm = /\b(user|payment|order|product|customer|service)\b/i.test(testName);
      
      if (hasDomainTerm) {
        patterns.push(this.createDetectionResult(
          `domain-term-function-${index}`,
          `Domain Term in Test Function: ${testName}`,
          this.createCodeLocation(testFile.path, match.line, undefined, match.column),
          0.9,
          [{
            type: 'function-domain-term',
            description: `テスト関数名にドメイン用語が含まれています`,
            location: this.createCodeLocation(testFile.path, match.line, undefined, match.column),
            code: testName,
            confidence: 0.9
          }]
        ));
      }
    });
    
    return patterns;
  }

  /**
   * ドメイン用語カバレッジの計算
   */
  private calculateDomainTermCoverage(patterns: DetectionResult[]): number {
    if (patterns.length === 0) {
      return 30; // 用語が検出されない場合は低スコア
    }
    
    // パターンの種類の多様性を評価
    const patternTypes = new Set(patterns.map(p => p.patternId.split('-')[2]));
    const diversityBonus = Math.min(20, patternTypes.size * 7);
    
    // 基本スコア + 多様性ボーナス
    const baseScore = Math.min(70, patterns.length * 10);
    return Math.min(100, baseScore + diversityBonus);
  }

  /**
   * 用語使用の一貫性計算
   */
  private calculateTermUsageConsistency(patterns: DetectionResult[]): number {
    if (patterns.length === 0) {
      return 50;
    }
    
    // パターンの信頼度の標準偏差を一貫性の指標として使用
    const confidences = patterns.map(p => p.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    const stdDev = Math.sqrt(variance);
    
    // 標準偏差が小さいほど一貫性が高い
    const consistencyScore = Math.max(50, 100 - (stdDev * 100));
    return Math.round(consistencyScore);
  }

  /**
   * ドメイン固有分析の実行
   */
  private async performDomainSpecificAnalysis(
    testFile: TestFile,
    dictionary: DomainDictionary,
    basicAnalysis: ContextualAnalysis
  ): Promise<Partial<ContextualAnalysis>> {
    // ドメイン辞書の用語との照合
    const additionalTerms = this.findAdditionalDomainTerms(testFile, dictionary);
    
    // 追加のビジネスルール適用
    const additionalRules = this.applyAdditionalBusinessRules(testFile, dictionary);
    
    return {
      relevantTerms: [...basicAnalysis.relevantTerms, ...additionalTerms],
      applicableRules: [...basicAnalysis.applicableRules, ...additionalRules]
    };
  }

  /**
   * 追加のドメイン用語検索
   */
  private findAdditionalDomainTerms(testFile: TestFile, dictionary: DomainDictionary): any[] {
    const additionalTerms: any[] = [];
    
    for (const term of dictionary.terms) {
      if (term.aliases) {
        for (const alias of term.aliases) {
          if (testFile.content.toLowerCase().includes(alias.toLowerCase())) {
            additionalTerms.push({
              term,
              relevance: 0.6,
              evidence: [`エイリアス "${alias}" がコード内で検出されました`],
              locations: []
            });
          }
        }
      }
    }
    
    return additionalTerms;
  }

  /**
   * 追加のビジネスルール適用
   */
  private applyAdditionalBusinessRules(testFile: TestFile, dictionary: DomainDictionary): any[] {
    return dictionary.businessRules.filter(rule => {
      if (rule.condition && rule.condition.pattern) {
        const regex = new RegExp(rule.condition.pattern, 'i');
        return regex.test(testFile.content);
      }
      return false;
    });
  }

  /**
   * 拡張品質スコア計算
   */
  private calculateEnhancedQualityScore(
    basicAnalysis: ContextualAnalysis,
    domainAnalysis: Partial<ContextualAnalysis>
  ): number {
    const termCount = (domainAnalysis.relevantTerms?.length || 0);
    const ruleCount = (domainAnalysis.applicableRules?.length || 0);
    
    // 基本スコア + ドメイン要素ボーナス
    const domainBonus = Math.min(20, (termCount * 3) + (ruleCount * 5));
    return Math.min(100, basicAnalysis.qualityScore + domainBonus);
  }

  /**
   * 用語カバレッジ品質評価
   */
  private evaluateTermCoverageQuality(patterns: DetectionResult[], context: DomainContext): number {
    const totalTerms = context.primaryTerms.length;
    if (totalTerms === 0) return 75;
    
    const coveredTerms = new Set();
    for (const pattern of patterns) {
      for (const term of context.primaryTerms) {
        if (pattern.patternName.toLowerCase().includes(term.term.toLowerCase())) {
          coveredTerms.add(term.id);
        }
      }
    }
    
    const coverageRatio = coveredTerms.size / totalTerms;
    return Math.round(coverageRatio * 100);
  }

  /**
   * 用語使用品質評価
   */
  private evaluateTermUsageQuality(patterns: DetectionResult[], context: DomainContext): number {
    if (patterns.length === 0) return 50;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    return Math.round(avgConfidence * 100);
  }

  /**
   * カバレッジ固有の推奨事項生成
   */
  private generateCoverageSpecificRecommendations(
    patterns: DetectionResult[],
    context: DomainContext
  ): string[] {
    const recommendations: string[] = [];
    
    const termCoverage = this.evaluateTermCoverageQuality(patterns, context);
    if (termCoverage < 50) {
      recommendations.push(
        `ドメイン用語のカバレッジが不足しています（${termCoverage}%）。` +
        `重要なビジネス概念をテストに含めることを強く推奨します。`
      );
    }
    
    if (patterns.length < 3) {
      recommendations.push(
        'ドメイン用語の使用頻度が低いです。テスト名や変数名により多くのビジネス用語を含めてください。'
      );
    }
    
    return recommendations;
  }
}