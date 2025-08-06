/**
 * UnifiedAnalysisResult
 * v0.9.0 - 統合分析結果データ構造
 * 
 * 後続のEpicが利用する統一的なデータ構造
 * SOLID原則: インターフェース分離の原則
 */

import { DomainDefinition, DomainCluster } from './types';
import { Issue as BaseIssue } from '../core/types';

/**
 * 統合分析結果
 * ドメイン分析と既存の静的解析結果を統合
 */
export interface UnifiedAnalysisResult {
  /** 分析メタデータ */
  metadata: AnalysisMetadata;
  
  /** ドメイン分析結果 */
  domainAnalysis: DomainAnalysisSection;
  
  /** 静的解析結果 */
  staticAnalysis: StaticAnalysisSection;
  
  /** 統合品質スコア */
  qualityScore: QualityScoreSection;
  
  /** 改善提案 */
  recommendations: RecommendationSection;
  
  /** 生成タイムスタンプ */
  timestamp: Date;
  
  /** データ整合性ハッシュ */
  integrityHash?: string;
}

/**
 * 分析メタデータ
 */
export interface AnalysisMetadata {
  /** 分析対象パス */
  targetPath: string;
  
  /** 分析エンジンバージョン */
  engineVersion: string;
  
  /** 使用されたプラグイン */
  plugins: string[];
  
  /** 分析時間（ミリ秒） */
  analysisTime: number;
  
  /** ファイル統計 */
  fileStats: {
    totalFiles: number;
    analyzedFiles: number;
    testFiles: number;
    sourceFiles: number;
  };
}

/**
 * ドメイン分析セクション
 */
export interface DomainAnalysisSection {
  /** ドメイン定義 */
  definition: DomainDefinition;
  
  /** 検出されたドメインクラスタ */
  clusters: DomainCluster[];
  
  /** ドメインカバレッジ */
  coverage: {
    /** カバーされているドメイン用語の割合 */
    termCoverage: number;
    
    /** テストされているビジネスルールの割合 */
    ruleCoverage: number;
    
    /** ドメイン固有のテストの割合 */
    domainTestRatio: number;
  };
  
  /** ドメイン固有の問題 */
  domainIssues: DomainIssue[];
  
  /** ドメイン用語（統計用） */
  terms?: Record<string, { count: number; files: string[] }>;
  
  /** ビジネスルール（統計用） */
  rules?: any[];
}

/**
 * ドメイン固有の問題
 */
export interface DomainIssue {
  /** 問題ID */
  id: string;
  
  /** ドメインクラスタID */
  clusterId: string;
  
  /** 問題の種類 */
  type: 'missing_test' | 'incomplete_coverage' | 'rule_violation' | 'terminology_mismatch';
  
  /** 重要度 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** 問題の説明 */
  description: string;
  
  /** 影響を受けるファイル */
  affectedFiles: string[];
  
  /** 推奨される修正方法 */
  suggestedFix?: string;
}

/**
 * 静的解析セクション
 */
export interface StaticAnalysisSection {
  /** 検出された問題 */
  issues: BaseIssue[];
  
  /** 問題の統計 */
  statistics: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byPlugin: Record<string, number>;
    byFile: Record<string, number>;
  };
  
  /** コード品質メトリクス */
  metrics: {
    /** テストカバレッジ（推定） */
    estimatedCoverage?: number;
    
    /** アサーション密度 */
    assertionDensity?: number;
    
    /** テスト構造品質スコア */
    testStructureScore?: number;
  };
}

/**
 * 品質スコアセクション
 */
export interface QualityScoreSection {
  /** 総合スコア（0-100） */
  overall: number;
  
  /** カテゴリ別スコア */
  categories: {
    /** ドメイン適合度 */
    domainAlignment: number;
    
    /** テスト完全性 */
    testCompleteness: number;
    
    /** コード品質 */
    codeQuality: number;
    
    /** セキュリティ */
    security: number;
    
    /** 保守性 */
    maintainability: number;
  };
  
  /** スコアの根拠 */
  rationale: string[];
}

/**
 * 改善提案セクション
 */
export interface RecommendationSection {
  /** 優先度付き改善提案 */
  items: Recommendation[];
  
  /** 推定改善効果 */
  estimatedImpact: {
    /** スコア改善見込み */
    scoreImprovement: number;
    
    /** 推定作業時間（時間） */
    estimatedEffort: number;
    
    /** ROI（投資対効果） */
    roi: number;
  };
}

/**
 * 個別の改善提案
 */
export interface Recommendation {
  /** 提案ID */
  id: string;
  
  /** 優先度 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  /** 提案タイトル */
  title: string;
  
  /** 詳細説明 */
  description: string;
  
  /** 影響カテゴリ */
  category: 'domain' | 'test' | 'code' | 'security' | 'performance';
  
  /** 実装例 */
  example?: string;
  
  /** 関連ファイル */
  relatedFiles: string[];
  
  /** 推定作業時間（分） */
  estimatedMinutes: number;
}

/**
 * UnifiedAnalysisResult生成器
 * SOLID原則: 単一責任の原則 - 結果の統合のみを担当
 */
export class UnifiedAnalysisResultBuilder {
  private result: Partial<UnifiedAnalysisResult> = {};
  
  /**
   * メタデータを設定
   */
  setMetadata(metadata: AnalysisMetadata): this {
    this.result.metadata = metadata;
    return this;
  }
  
  /**
   * ドメイン分析結果を設定
   */
  setDomainAnalysis(domainAnalysis: DomainAnalysisSection): this {
    this.result.domainAnalysis = domainAnalysis;
    return this;
  }
  
  /**
   * 静的解析結果を設定
   */
  setStaticAnalysis(staticAnalysis: StaticAnalysisSection): this {
    this.result.staticAnalysis = staticAnalysis;
    return this;
  }
  
  /**
   * 品質スコアを設定
   */
  setQualityScore(qualityScore: QualityScoreSection): this {
    this.result.qualityScore = qualityScore;
    return this;
  }
  
  /**
   * 改善提案を設定
   */
  setRecommendations(recommendations: RecommendationSection): this {
    this.result.recommendations = recommendations;
    return this;
  }
  
  /**
   * 整合性ハッシュを設定
   */
  setIntegrityHash(hash: string): this {
    this.result.integrityHash = hash;
    return this;
  }
  
  /**
   * 統合結果を構築
   */
  build(): UnifiedAnalysisResult {
    if (!this.result.metadata || !this.result.domainAnalysis || 
        !this.result.staticAnalysis || !this.result.qualityScore || 
        !this.result.recommendations) {
      throw new Error('必須フィールドが不足しています');
    }
    
    return {
      ...this.result,
      timestamp: new Date()
    } as UnifiedAnalysisResult;
  }
}

/**
 * 統合分析結果の生成
 * @param domainDefinition ドメイン定義
 * @param staticIssues 静的解析の問題
 * @param metadata 分析メタデータ
 */
export function createUnifiedAnalysisResult(
  domainDefinition: DomainDefinition,
  staticIssues: BaseIssue[],
  metadata: AnalysisMetadata
): UnifiedAnalysisResult {
  const builder = new UnifiedAnalysisResultBuilder();
  
  // ドメイン分析セクションの構築
  const domainAnalysis: DomainAnalysisSection = {
    definition: domainDefinition,
    clusters: domainDefinition.domains || [],
    coverage: calculateDomainCoverage(domainDefinition, staticIssues),
    domainIssues: detectDomainIssues(domainDefinition, staticIssues),
    terms: {},
    rules: []
  };
  
  // 静的解析セクションの構築
  const staticAnalysis: StaticAnalysisSection = {
    issues: staticIssues,
    statistics: calculateStatistics(staticIssues),
    metrics: calculateMetrics(staticIssues)
  };
  
  // 品質スコアの計算
  const qualityScore = calculateQualityScore(domainAnalysis, staticAnalysis);
  
  // 改善提案の生成
  const recommendations = generateRecommendations(domainAnalysis, staticAnalysis, qualityScore);
  
  return builder
    .setMetadata(metadata)
    .setDomainAnalysis(domainAnalysis)
    .setStaticAnalysis(staticAnalysis)
    .setQualityScore(qualityScore)
    .setRecommendations(recommendations)
    .build();
}

/**
 * ドメインカバレッジの計算
 */
function calculateDomainCoverage(
  definition: DomainDefinition,
  issues: BaseIssue[]
): DomainAnalysisSection['coverage'] {
  // 簡易実装（実際の計算ロジックは後で実装）
  return {
    termCoverage: 0.75,
    ruleCoverage: 0.60,
    domainTestRatio: 0.45
  };
}

/**
 * ドメイン固有の問題検出
 */
function detectDomainIssues(
  definition: DomainDefinition,
  issues: BaseIssue[]
): DomainIssue[] {
  // 簡易実装（実際の検出ロジックは後で実装）
  return [];
}

/**
 * 統計情報の計算
 */
function calculateStatistics(issues: BaseIssue[]): StaticAnalysisSection['statistics'] {
  const bySeverity: Record<string, number> = {};
  const byPlugin: Record<string, number> = {};
  const byFile: Record<string, number> = {};
  
  issues.forEach(issue => {
    // 重要度別カウント
    const severity = issue.severity || 'info';
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    
    // プラグイン別カウント
    const plugin = issue.plugin || 'unknown';
    byPlugin[plugin] = (byPlugin[plugin] || 0) + 1;
    
    // ファイル別カウント
    const file = issue.file || 'unknown';
    byFile[file] = (byFile[file] || 0) + 1;
  });
  
  return {
    totalIssues: issues.length,
    bySeverity,
    byPlugin,
    byFile
  };
}

/**
 * メトリクスの計算
 */
function calculateMetrics(issues: BaseIssue[]): StaticAnalysisSection['metrics'] {
  // 簡易実装（実際の計算ロジックは後で実装）
  return {
    estimatedCoverage: 0.65,
    assertionDensity: 0.8,
    testStructureScore: 75
  };
}

/**
 * 品質スコアの計算
 */
function calculateQualityScore(
  domainAnalysis: DomainAnalysisSection,
  staticAnalysis: StaticAnalysisSection
): QualityScoreSection {
  const categories = {
    domainAlignment: domainAnalysis.coverage.termCoverage * 100,
    testCompleteness: (staticAnalysis.metrics.estimatedCoverage || 0) * 100,
    codeQuality: staticAnalysis.metrics.testStructureScore || 0,
    security: 80, // 仮の値
    maintainability: 75 // 仮の値
  };
  
  const overall = Object.values(categories).reduce((sum, score) => sum + score, 0) / 
                  Object.keys(categories).length;
  
  return {
    overall,
    categories,
    rationale: [
      `ドメインカバレッジ: ${domainAnalysis.coverage.termCoverage * 100}%`,
      `テストカバレッジ: ${(staticAnalysis.metrics.estimatedCoverage || 0) * 100}%`,
      `検出された問題: ${staticAnalysis.statistics.totalIssues}件`
    ]
  };
}

/**
 * 改善提案の生成
 */
function generateRecommendations(
  domainAnalysis: DomainAnalysisSection,
  staticAnalysis: StaticAnalysisSection,
  qualityScore: QualityScoreSection
): RecommendationSection {
  const items: Recommendation[] = [];
  
  // ドメインカバレッジが低い場合
  if (domainAnalysis.coverage.termCoverage < 0.8) {
    items.push({
      id: 'improve-domain-coverage',
      priority: 'high',
      title: 'ドメイン用語のテストカバレッジ向上',
      description: `現在のドメイン用語カバレッジは${domainAnalysis.coverage.termCoverage * 100}%です。重要なビジネスロジックのテストを追加してください。`,
      category: 'domain',
      relatedFiles: [],
      estimatedMinutes: 120
    });
  }
  
  // 重大な問題がある場合
  const criticalIssues = staticAnalysis.issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    items.push({
      id: 'fix-critical-issues',
      priority: 'critical',
      title: '重大な問題の修正',
      description: `${criticalIssues.length}件の重大な問題が検出されました。即座に修正が必要です。`,
      category: 'test',
      relatedFiles: [...new Set(criticalIssues.map(i => i.file || 'unknown'))],
      estimatedMinutes: criticalIssues.length * 30
    });
  }
  
  const totalEffort = items.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const scoreImprovement = items.length * 5; // 仮の計算
  
  return {
    items,
    estimatedImpact: {
      scoreImprovement,
      estimatedEffort: totalEffort / 60, // 時間に変換
      roi: scoreImprovement / Math.max(totalEffort / 60, 1)
    }
  };
}

export default UnifiedAnalysisResult;