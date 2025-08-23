/**
 * Quality Score Test Helper
 * 
 * テストで使用するQualityScoreとQualityDetailsのデフォルト値と
 * ビルダー関数を提供
 */

import { 
  QualityScore, 
  QualityDetails,
  QualityDimension
} from '../../src/core/types/quality-score';

/**
 * デフォルトのQualityDetailsを作成
 */
export function createDefaultQualityDetails(overrides?: Partial<QualityDetails>): QualityDetails {
  return {
    strengths: overrides?.strengths || [],
    weaknesses: overrides?.weaknesses || [],
    suggestions: overrides?.suggestions || [],
    ...overrides
  };
}

/**
 * デフォルトのQualityScoreを作成
 */
export function createDefaultQualityScore(overrides?: Partial<QualityScore>): QualityScore {
  const baseScore: QualityScore = {
    overall: 0.8,
    dimensions: {
      completeness: 0.8,
      correctness: 0.8,
      maintainability: 0.8,
      performance: 0.8,
      security: 0.8
    },
    confidence: 0.9,
    details: createDefaultQualityDetails(overrides?.details)
  };

  // overridesがある場合、深くマージ
  if (overrides) {
    return {
      ...baseScore,
      ...overrides,
      dimensions: {
        ...baseScore.dimensions,
        ...(overrides.dimensions || {})
      },
      details: overrides.details ? {
        ...baseScore.details,
        ...overrides.details
      } : baseScore.details
    };
  }

  return baseScore;
}

/**
 * テスト用の簡易QualityScoreビルダー
 */
export class QualityScoreBuilder {
  private score: QualityScore;

  constructor() {
    this.score = createDefaultQualityScore();
  }

  withOverall(overall: number): this {
    this.score.overall = overall;
    return this;
  }

  withDimension(dimension: QualityDimension | string, value: number): this {
    if (!this.score.dimensions) {
      this.score.dimensions = {};
    }
    this.score.dimensions[dimension as QualityDimension] = value;
    return this;
  }

  withConfidence(confidence: number): this {
    this.score.confidence = confidence;
    return this;
  }

  withBreakdown(breakdown: QualityScore['breakdown']): this {
    this.score.breakdown = breakdown;
    return this;
  }

  withDetails(details: Partial<QualityDetails>): this {
    this.score.details = createDefaultQualityDetails(details);
    return this;
  }

  withSecurity(security: number): this {
    this.score.security = security;
    return this;
  }

  withCoverage(coverage: number): this {
    this.score.coverage = coverage;
    return this;
  }

  withMaintainability(maintainability: number): this {
    this.score.maintainability = maintainability;
    return this;
  }

  build(): QualityScore {
    return { ...this.score };
  }
}

/**
 * Legacy形式のQualityScoreから新形式への変換
 */
export function convertLegacyQualityScore(legacy: any): QualityScore {
  const score = createDefaultQualityScore();
  
  // overall は必須なので常にコピー
  if (typeof legacy.overall === 'number') {
    score.overall = legacy.overall;
  }

  // confidence も必須
  if (typeof legacy.confidence === 'number') {
    score.confidence = legacy.confidence;
  }

  // breakdownからdimensionsへの変換
  if (legacy.breakdown) {
    score.dimensions = {};
    if (typeof legacy.breakdown.completeness === 'number') {
      score.dimensions.completeness = legacy.breakdown.completeness / 100;
    }
    if (typeof legacy.breakdown.correctness === 'number') {
      score.dimensions.correctness = legacy.breakdown.correctness / 100;
    }
    if (typeof legacy.breakdown.maintainability === 'number') {
      score.dimensions.maintainability = legacy.breakdown.maintainability / 100;
    }
    if (typeof legacy.breakdown.reliability === 'number') {
      score.dimensions.performance = legacy.breakdown.reliability / 100;
    }
    if (typeof legacy.breakdown.effectiveness === 'number') {
      score.dimensions.security = legacy.breakdown.effectiveness / 100;
    }
    
    // breakdownも保持
    score.breakdown = legacy.breakdown;
  }

  // その他のプロパティをコピー
  if (typeof legacy.security === 'number') {
    score.security = legacy.security;
  }
  if (typeof legacy.coverage === 'number') {
    score.coverage = legacy.coverage;
  }
  if (typeof legacy.maintainability === 'number') {
    score.maintainability = legacy.maintainability;
  }

  // detailsの処理
  if (legacy.details) {
    score.details = createDefaultQualityDetails(legacy.details);
  }

  return score;
}