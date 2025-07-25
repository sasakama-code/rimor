import {
  ContextualAnalysis,
  CodeContext,
  BusinessRule,
  DomainDictionary,
  TermRelevance,
  TestRequirement,
  DomainTerm,
  CodeLocation
} from '../../core/types';
import { ContextEngine } from './engine';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * 文脈分析クラス
 * 具体的な分析ロジックを実装
 */
export class ContextAnalyzer {
  private engine: ContextEngine;

  constructor(dictionary: DomainDictionary) {
    this.engine = new ContextEngine(dictionary);
  }

  /**
   * 包括的な文脈分析の実行
   */
  async performContextualAnalysis(
    code: string,
    filePath: string,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis> {
    try {
      // 基本的な文脈分析
      const context = await this.engine.analyzeContext(code, filePath, dictionary);
      
      // 関連用語の詳細分析
      const relevantTerms = await this.analyzeTermRelevance(code, context.relatedTerms);
      
      // 適用可能なルールの特定
      const applicableRules = this.identifyApplicableRules(context, dictionary.businessRules);
      
      // 必要なテストの推論
      const requiredTests = this.engine.inferRequiredTests(context, applicableRules);
      
      // 品質スコアの計算
      const qualityScore = this.calculateContextualQualityScore(
        context,
        relevantTerms,
        applicableRules,
        requiredTests
      );

      return {
        context,
        relevantTerms,
        applicableRules,
        requiredTests,
        qualityScore
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '文脈分析に失敗しました');
      return this.createEmptyAnalysis(filePath);
    }
  }

  /**
   * 用語関連度の詳細分析
   */
  async analyzeTermRelevance(
    code: string,
    relatedTerms: DomainTerm[]
  ): Promise<TermRelevance[]> {
    try {
      const termRelevances: TermRelevance[] = [];

      for (const term of relatedTerms) {
        const relevance = this.engine.calculateRelevance(code, term);
        
        if (relevance > 0) {
          const evidence = this.extractEvidence(code, term);
          const locations = this.findTermLocations(code, term);

          termRelevances.push({
            term,
            relevance,
            evidence,
            locations
          });
        }
      }

      // 関連度でソート
      return termRelevances.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語関連度分析に失敗しました');
      return [];
    }
  }

  /**
   * 適用可能なルールの特定
   */
  identifyApplicableRules(
    context: CodeContext,
    allRules: BusinessRule[]
  ): BusinessRule[] {
    try {
      const applicableRules: BusinessRule[] = [];

      allRules.forEach(rule => {
        if (this.isRuleApplicableToContext(context, rule)) {
          applicableRules.push(rule);
        }
      });

      // 優先度でソート
      return applicableRules.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '適用可能ルール特定に失敗しました');
      return [];
    }
  }

  /**
   * 文脈別品質スコア計算
   */
  calculateContextualQualityScore(
    context: CodeContext,
    relevantTerms: TermRelevance[],
    applicableRules: BusinessRule[],
    requiredTests: TestRequirement[]
  ): number {
    try {
      let score = 50; // 基準値

      // ドメイン関連度による調整
      score += context.domainRelevance * 30;

      // 関連用語の質による調整
      if (relevantTerms.length > 0) {
        const avgRelevance = relevantTerms.reduce((sum, tr) => sum + tr.relevance, 0) / relevantTerms.length;
        score += avgRelevance * 20;

        // 重要な用語の存在
        const criticalTerms = relevantTerms.filter(tr => tr.term.importance === 'critical');
        if (criticalTerms.length > 0) {
          score += 15;
        }
      }

      // 適用可能ルールの質
      if (applicableRules.length > 0) {
        const highPriorityRules = applicableRules.filter(rule => rule.priority <= 10);
        score += Math.min(highPriorityRules.length * 5, 15);
      }

      // 必要テストの網羅性
      const mustHaveTests = requiredTests.filter(test => test.type === 'must-have');
      const shouldHaveTests = requiredTests.filter(test => test.type === 'should-have');
      
      if (mustHaveTests.length > 0) {
        score += Math.min(mustHaveTests.length * 3, 12);
      }
      if (shouldHaveTests.length > 0) {
        score += Math.min(shouldHaveTests.length * 2, 8);
      }

      // コードの構造的複雑さによる調整
      const avgComplexity = context.functions.reduce((sum, fn) => sum + fn.complexity, 0) / 
                           (context.functions.length || 1);
      if (avgComplexity > 10) {
        // 複雑なコードは品質要求が高い
        score -= 10;
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '品質スコア計算に失敗しました');
      return 50;
    }
  }

  /**
   * バッチ分析（複数ファイルの一括処理）
   */
  async analyzeBatch(
    fileCodes: Array<{ code: string; filePath: string }>,
    dictionary: DomainDictionary,
    options: {
      parallel?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<ContextualAnalysis[]> {
    try {
      const results: ContextualAnalysis[] = [];
      const { parallel = false, batchSize = 10 } = options;

      if (parallel) {
        // 並列処理
        for (let i = 0; i < fileCodes.length; i += batchSize) {
          const batch = fileCodes.slice(i, i + batchSize);
          const batchPromises = batch.map(({ code, filePath }) =>
            this.performContextualAnalysis(code, filePath, dictionary)
          );
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }
      } else {
        // 順次処理
        for (const { code, filePath } of fileCodes) {
          const analysis = await this.performContextualAnalysis(code, filePath, dictionary);
          results.push(analysis);
        }
      }

      return results;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'バッチ分析に失敗しました');
      return [];
    }
  }

  /**
   * 分析結果の統計情報生成
   */
  generateAnalysisStatistics(
    analyses: ContextualAnalysis[]
  ): {
    totalFiles: number;
    avgQualityScore: number;
    avgDomainRelevance: number;
    mostRelevantTerms: Array<{ term: string; frequency: number }>;
    commonRules: Array<{ rule: string; frequency: number }>;
    testCoverage: {
      mustHave: number;
      shouldHave: number;
      niceToHave: number;
    };
  } {
    try {
      const totalFiles = analyses.length;
      
      // 平均品質スコア
      const avgQualityScore = analyses.reduce((sum, analysis) => sum + analysis.qualityScore, 0) / totalFiles;
      
      // 平均ドメイン関連度
      const avgDomainRelevance = analyses.reduce((sum, analysis) => 
        sum + analysis.context.domainRelevance, 0) / totalFiles;

      // 最も関連度の高い用語
      const termFrequency: Map<string, number> = new Map();
      analyses.forEach(analysis => {
        analysis.relevantTerms.forEach(tr => {
          const current = termFrequency.get(tr.term.term) || 0;
          termFrequency.set(tr.term.term, current + 1);
        });
      });

      const mostRelevantTerms = Array.from(termFrequency.entries())
        .map(([term, frequency]) => ({ term, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // 一般的なルール
      const ruleFrequency: Map<string, number> = new Map();
      analyses.forEach(analysis => {
        analysis.applicableRules.forEach(rule => {
          const current = ruleFrequency.get(rule.name) || 0;
          ruleFrequency.set(rule.name, current + 1);
        });
      });

      const commonRules = Array.from(ruleFrequency.entries())
        .map(([rule, frequency]) => ({ rule, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // テストカバレッジ
      const testCoverage = {
        mustHave: 0,
        shouldHave: 0,
        niceToHave: 0
      };

      analyses.forEach(analysis => {
        analysis.requiredTests.forEach(test => {
          switch (test.type) {
            case 'must-have':
              testCoverage.mustHave++;
              break;
            case 'should-have':
              testCoverage.shouldHave++;
              break;
            case 'nice-to-have':
              testCoverage.niceToHave++;
              break;
          }
        });
      });

      return {
        totalFiles,
        avgQualityScore,
        avgDomainRelevance,
        mostRelevantTerms,
        commonRules,
        testCoverage
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '統計情報生成に失敗しました');
      return {
        totalFiles: 0,
        avgQualityScore: 0,
        avgDomainRelevance: 0,
        mostRelevantTerms: [],
        commonRules: [],
        testCoverage: { mustHave: 0, shouldHave: 0, niceToHave: 0 }
      };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * 証拠の抽出
   */
  private extractEvidence(code: string, term: DomainTerm): string[] {
    const evidence: string[] = [];

    // 用語の直接出現
    const termRegex = new RegExp(`\\b${this.escapeRegex(term.term)}\\b`, 'gi');
    if (termRegex.test(code)) {
      evidence.push(`用語「${term.term}」の直接出現`);
    }

    // エイリアスの出現
    term.aliases.forEach(alias => {
      const aliasRegex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
      if (aliasRegex.test(code)) {
        evidence.push(`エイリアス「${alias}」の出現`);
      }
    });

    // パターンマッチング
    term.relatedPatterns.forEach(pattern => {
      try {
        const patternRegex = new RegExp(pattern, 'i');
        if (patternRegex.test(code)) {
          evidence.push(`関連パターン「${pattern}」にマッチ`);
        }
      } catch {
        // 無効な正規表現は無視
      }
    });

    // コード例との類似性
    term.examples.forEach((example, index) => {
      const similarity = this.calculateCodeSimilarity(code, example.code);
      if (similarity > 0.3) {
        evidence.push(`コード例${index + 1}との類似性: ${Math.round(similarity * 100)}%`);
      }
    });

    return evidence;
  }

  /**
   * 用語の出現位置を特定
   */
  private findTermLocations(code: string, term: DomainTerm): CodeLocation[] {
    const locations: CodeLocation[] = [];
    const lines = code.split('\n');

    // 用語本体の検索
    const termRegex = new RegExp(`\\b${this.escapeRegex(term.term)}\\b`, 'gi');
    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = termRegex.exec(line)) !== null) {
        locations.push({
          file: '',
          line: lineIndex + 1,
          column: match.index,
          endLine: lineIndex + 1,
          endColumn: match.index + match[0].length
        });
      }
    });

    // エイリアスの検索
    term.aliases.forEach(alias => {
      const aliasRegex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
      lines.forEach((line, lineIndex) => {
        let match;
        while ((match = aliasRegex.exec(line)) !== null) {
          locations.push({
            file: '',
            line: lineIndex + 1,
            column: match.index,
            endLine: lineIndex + 1,
            endColumn: match.index + match[0].length
          });
        }
      });
    });

    return locations;
  }

  /**
   * ルールの適用可能性判定
   */
  private isRuleApplicableToContext(context: CodeContext, rule: BusinessRule): boolean {
    try {
      // 条件に基づく判定
      const { condition } = rule;

      switch (condition.type) {
        case 'function-name':
          return context.functions.some(fn => {
            const pattern = new RegExp(condition.pattern, 'i');
            return pattern.test(fn.name);
          });

        case 'code-pattern':
          // ここでは簡易的な判定（実際のコードは別途取得が必要）
          return context.relatedTerms.some(term => 
            term.relatedPatterns.some(pattern => pattern.includes(condition.pattern))
          );

        case 'data-type':
          // TypeScript型の検出（簡易的）
          return context.language === 'typescript' && 
                 context.functions.some(fn => fn.returnType?.includes(condition.pattern));

        case 'api-endpoint':
          // API関連の判定（簡易的）
          return context.imports.some(imp => 
            imp.module.includes('express') || 
            imp.module.includes('fastify') ||
            imp.module.includes('axios')
          );

        default:
          return false;
      }
    } catch (error) {
      console.warn('ルール適用可能性判定でエラー:', error);
      return false;
    }
  }

  /**
   * コード類似度計算
   */
  private calculateCodeSimilarity(code1: string, code2: string): number {
    // トークンベースの類似度計算
    const tokenize = (code: string) => {
      return code.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2);
    };

    const tokens1 = new Set(tokenize(code1));
    const tokens2 = new Set(tokenize(code2));

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 正規表現エスケープ
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 空の分析結果を作成
   */
  private createEmptyAnalysis(filePath: string): ContextualAnalysis {
    return {
      context: {
        filePath,
        language: 'unknown',
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