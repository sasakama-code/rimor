/**
 * RiskScorer
 * 総合リスクスコア算出システム
 * 
 * SOLID原則: 単一責任の原則 - リスクスコア算出に特化
 * DRY原則: 共通ロジックの一元化
 * KISS原則: シンプルで理解しやすい実装
 * YAGNI原則: Phase 3要件のみ実装
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { RiskLevel } from '../types/unified-analysis-result';
import { 
  Threat, 
  Vulnerability, 
  Impact,
  RiskMatrix,
  LikelihoodLevel,
  SeverityLevel
} from '../types/nist-types';

/**
 * リスクコンポーネント
 */
export interface RiskComponents {
  threatScore: number;
  vulnerabilityScore: number;
  impactScore: number;
  likelihoodScore: number;
}

/**
 * 重み付け設定
 */
export interface RiskWeights {
  threat: number;
  vulnerability: number;
  impact: number;
  likelihood: number;
}

/**
 * 総合リスクスコア結果
 */
export interface OverallRiskScore {
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
}

/**
 * リスク集約結果
 */
export interface AggregatedRisk {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minimalCount: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

/**
 * カテゴリ別リスク
 */
export interface CategoryRisk {
  count: number;
  averageScore: number;
  maxRiskLevel: RiskLevel;
  risks: unknown[];
}

/**
 * リスクトレンド
 */
export interface RiskTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number;
  projection: number;
}

/**
 * 推奨アクション
 */
export interface RecommendedAction {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  estimatedEffort: string;
  expectedRiskReduction: number;
}

/**
 * リスクアセスメント
 */
// Migrated to CoreTypes
export interface RiskAssessmentInfo {
  riskLevel: RiskLevel;
  score: number;
  category: string;
  affectedAssets: string[];
}

/**
 * 総合リスクスコア算出器
 */
export class RiskScorer {
  /**
   * NISTリスクマトリクスを適用
   */
  applyNistMatrix(threat: Threat, vulnerability: Vulnerability): RiskLevel {
    // 入力検証
    if (!threat || !vulnerability) {
      throw new Error('Threat and vulnerability are required');
    }

    // CVSSスコアがある場合は優先的に使用
    if (vulnerability.cvssScore !== undefined) {
      const cvssAdjustedScore = vulnerability.cvssScore * 10; // 0-10を0-100にスケール
      const likelihoodScore = this.likelihoodToScore(threat.likelihood);
      const combinedScore = (cvssAdjustedScore * 0.6 + likelihoodScore * 0.4);
      return this.scoreToRiskLevel(combinedScore);
    }

    // 可能性と深刻度のマッピング
    const likelihoodScore = this.likelihoodToScore(threat.likelihood);
    const severityScore = this.severityToScore(vulnerability.severity);

    // リスクマトリクス計算（NIST SP 800-30準拠）
    // CRITICALセキュリティとHIGH可能性の組み合わせはCRITICALになる
    if (vulnerability.severity === 'CRITICAL' && likelihoodScore >= 80) {
      return CoreTypes.RiskLevel.CRITICAL;
    }

    // HIGHとHIGHの組み合わせはHIGHになるように調整
    const riskScore = Math.sqrt(likelihoodScore * severityScore);

    return this.scoreToRiskLevel(riskScore);
  }

  /**
   * 複数の脅威・脆弱性ペアから最高リスクを特定
   */
  findHighestRisk(pairs: Array<{threat: Threat, vulnerability: Vulnerability}>): RiskLevel {
    if (!pairs || pairs.length === 0) {
      return CoreTypes.RiskLevel.MINIMAL;
    }

    let highestRisk = CoreTypes.RiskLevel.MINIMAL;
    const riskPriority = this.getRiskPriorityMap();

    for (const pair of pairs) {
      const risk = this.applyNistMatrix(pair.threat, pair.vulnerability);
      if (riskPriority[risk] > riskPriority[highestRisk]) {
        highestRisk = risk as CoreTypes.RiskLevel;
      }
    }

    return highestRisk;
  }

  /**
   * 複数の評価要素から総合スコアを算出
   */
  calculateOverallRisk(components: RiskComponents): OverallRiskScore {
    // 入力検証
    if (!components) {
      throw new Error('Invalid risk components');
    }

    // デフォルトの重み付け
    const weights: RiskWeights = {
      threat: 0.25,
      vulnerability: 0.3,
      impact: 0.35,
      likelihood: 0.1
    };

    const score = this.calculateWeightedScore(components, weights);
    const riskLevel = this.scoreToRiskLevel(score);

    // 信頼度の計算（すべてのコンポーネントが存在する場合は高い）
    const confidence = this.calculateConfidence(components);

    return {
      score,
      riskLevel,
      confidence
    };
  }

  /**
   * 重み付けを考慮したスコア計算
   */
  calculateWeightedScore(components: RiskComponents, weights: RiskWeights): number {
    // 入力検証
    if (!components || !weights) {
      throw new Error('Components and weights are required');
    }

    // 重みの正規化（合計が1になるように）
    const totalWeight = weights.threat + weights.vulnerability + weights.impact + weights.likelihood;
    
    if (totalWeight === 0) {
      throw new Error('Total weight cannot be zero');
    }

    const normalizedWeights = {
      threat: weights.threat / totalWeight,
      vulnerability: weights.vulnerability / totalWeight,
      impact: weights.impact / totalWeight,
      likelihood: weights.likelihood / totalWeight
    };

    // 重み付けスコアの計算
    const weightedScore = 
      components.threatScore * normalizedWeights.threat +
      components.vulnerabilityScore * normalizedWeights.vulnerability +
      components.impactScore * normalizedWeights.impact +
      components.likelihoodScore * normalizedWeights.likelihood;

    return Math.min(100, Math.max(0, weightedScore));
  }

  /**
   * 複数のリスクを集約
   */
  aggregateRisks(risks: Array<{riskLevel: RiskLevel, score: number}>): AggregatedRisk {
    if (!risks || risks.length === 0) {
      return {
        totalRisks: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        minimalCount: 0,
        averageScore: 0,
        maxScore: 0,
        minScore: 0
      };
    }

    const counts = {
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      minimalCount: 0
    };

    let totalScore = 0;
    let maxScore = 0;
    let minScore = 100;

    for (const risk of risks) {
      // リスクレベル別カウント
      switch (risk.riskLevel) {
        case CoreTypes.RiskLevel.CRITICAL:
          counts.criticalCount++;
          break;
        case CoreTypes.RiskLevel.HIGH:
          counts.highCount++;
          break;
        case CoreTypes.RiskLevel.MEDIUM:
          counts.mediumCount++;
          break;
        case CoreTypes.RiskLevel.LOW:
          counts.lowCount++;
          break;
        case CoreTypes.RiskLevel.MINIMAL:
          counts.minimalCount++;
          break;
      }

      // スコア統計
      totalScore += risk.score;
      maxScore = Math.max(maxScore, risk.score);
      minScore = Math.min(minScore, risk.score);
    }

    return {
      totalRisks: risks.length,
      ...counts,
      averageScore: totalScore / risks.length,
      maxScore,
      minScore
    };
  }

  /**
   * カテゴリ別にリスクを集約
   */
  aggregateByCategory(categorizedRisks: Array<{
    category: string,
    riskLevel: RiskLevel,
    score: number
  }>): Record<string, CategoryRisk> {
    const categoryMap: Record<string, CategoryRisk> = {};

    for (const risk of categorizedRisks) {
      if (!categoryMap[risk.category]) {
        categoryMap[risk.category] = {
          count: 0,
          averageScore: 0,
          maxRiskLevel: CoreTypes.RiskLevel.MINIMAL,
          risks: []
        };
      }

      const category = categoryMap[risk.category];
      category.risks.push(risk);
      category.count++;

      // 最高リスクレベルの更新
      const riskPriority = this.getRiskPriorityMap();
      if (riskPriority[risk.riskLevel] > riskPriority[category.maxRiskLevel]) {
        category.maxRiskLevel = risk.riskLevel;
      }
    }

    // 平均スコアの計算
    for (const category of Object.values(categoryMap)) {
      const totalScore = category.risks.reduce((sum, risk: any) => sum + (risk.score || 0), 0);
      category.averageScore = (totalScore as number) / category.count;
    }

    return categoryMap;
  }

  /**
   * 時系列でリスクの変化を分析
   */
  analyzeTrend(historicalData: Array<{
    date: string,
    score: number,
    riskLevel: RiskLevel
  }>): RiskTrend {
    if (!historicalData || historicalData.length < 2) {
      return {
        direction: 'STABLE',
        changeRate: 0,
        projection: historicalData?.[0]?.score || 0
      };
    }

    // 最初と最後のデータポイントを比較
    const firstPoint = historicalData[0];
    const lastPoint = historicalData[historicalData.length - 1];
    
    const scoreDiff = lastPoint.score - firstPoint.score;
    const changeRate = scoreDiff / firstPoint.score;

    let direction: RiskTrend['direction'];
    if (changeRate > 0.1) {
      direction = 'INCREASING';
    } else if (changeRate < -0.1) {
      direction = 'DECREASING';
    } else {
      direction = 'STABLE';
    }

    // 簡単な線形投影
    const projection = lastPoint.score + (scoreDiff / historicalData.length);

    return {
      direction,
      changeRate,
      projection: Math.min(100, Math.max(0, projection))
    };
  }

  /**
   * リスクレベルに応じた推奨アクションを生成
   */
  generateRecommendedActions(riskAssessment: RiskAssessmentInfo): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    // CRITICALリスクの場合
    if (riskAssessment.riskLevel === CoreTypes.RiskLevel.CRITICAL) {
      actions.push({
        priority: 'IMMEDIATE',
        action: '直ちにシステムを隔離し、緊急対応チームを招集',
        estimatedEffort: '1-2時間',
        expectedRiskReduction: 50
      });
    }

    // カテゴリ別の推奨アクション
    if (riskAssessment.category === 'INJECTION') {
      actions.push({
        priority: riskAssessment.riskLevel === CoreTypes.RiskLevel.CRITICAL ? 'IMMEDIATE' : 'HIGH',
        action: '入力検証とサニタイゼーションの実装',
        estimatedEffort: '4-8時間',
        expectedRiskReduction: 40
      });
    }

    // 影響を受ける資産に基づくアクション
    if (riskAssessment.affectedAssets.includes('database')) {
      actions.push({
        priority: 'HIGH',
        action: 'データベースアクセスの監査ログ強化',
        estimatedEffort: '2-4時間',
        expectedRiskReduction: 20
      });
    }

    // 基本的な推奨アクション
    if (actions.length === 0) {
      actions.push({
        priority: 'MEDIUM',
        action: 'リスク詳細分析と緩和策の策定',
        estimatedEffort: '8-16時間',
        expectedRiskReduction: 15
      });
    }

    return actions;
  }

  // ========== Private Helper Methods ==========

  private likelihoodToScore(likelihood: string): number {
    const mapping: Record<string, number> = {
      'VERY_HIGH': 100,
      'HIGH': 80,
      'MODERATE': 60,
      'LOW': 40,
      'VERY_LOW': 20
    };
    return mapping[likelihood] || 50;
  }

  private severityToScore(severity: SeverityLevel): number {
    const mapping: Record<SeverityLevel, number> = {
      'CRITICAL': 100,
      'VERY_HIGH': 90,
      'HIGH': 75,
      'MODERATE': 50,
      'LOW': 30,
      'VERY_LOW': 10
    };
    return mapping[severity] || 50;
  }

  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 90) return CoreTypes.RiskLevel.CRITICAL;
    if (score >= 70) return CoreTypes.RiskLevel.HIGH;
    if (score >= 50) return CoreTypes.RiskLevel.MEDIUM;
    if (score >= 30) return CoreTypes.RiskLevel.LOW;
    return CoreTypes.RiskLevel.MINIMAL;
  }

  private getRiskPriorityMap(): Record<RiskLevel, number> {
    return {
      [CoreTypes.RiskLevel.CRITICAL]: 5,
      [CoreTypes.RiskLevel.HIGH]: 4,
      [CoreTypes.RiskLevel.MEDIUM]: 3,
      [CoreTypes.RiskLevel.LOW]: 2,
      [CoreTypes.RiskLevel.MINIMAL]: 1
    };
  }

  private calculateConfidence(components: RiskComponents): number {
    // すべてのコンポーネントが有効な値を持っているかチェック
    const validComponents = [
      components.threatScore > 0,
      components.vulnerabilityScore > 0,
      components.impactScore > 0,
      components.likelihoodScore > 0
    ].filter(valid => valid).length;

    // 信頼度は有効なコンポーネントの割合
    const baseConfidence = validComponents / 4;

    // スコアのバランスも考慮（極端な値は信頼度を下げる）
    const scores = [
      components.threatScore,
      components.vulnerabilityScore,
      components.impactScore,
      components.likelihoodScore
    ];
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // 標準偏差が大きいほど信頼度を下げる
    const balanceFactor = Math.max(0.5, 1 - (stdDev / 50));
    
    return Math.min(1, baseConfidence * balanceFactor);
  }
}