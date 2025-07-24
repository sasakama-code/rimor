import { Issue, QualityScore } from '../core/types';

/**
 * v0.4.0 品質スコア算出器の拡張型定義
 * 要件定義書に基づいた包括的なスコア管理システム
 */

// プラグイン実行結果（既存システムとの連携用）
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  score: number; // 0-100
  weight: number;
  issues: Issue[];
  metadata?: Record<string, any>;
}

// ディメンション別スコア
export interface DimensionScore {
  score: number; // 0-100 (旧value)
  weight: number; // 重み付け係数
  issues: Issue[]; // 課題一覧
  contributors?: {
    pluginId: string;
    contribution: number;
  }[];
  details?: string;
}

// スコアのトレンド情報
export interface ScoreTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  history: {
    timestamp: Date;
    score: number;
    commit?: string;
  }[];
  prediction?: {
    nextScore: number;
    confidence: number;
  };
}

// ファイル単位のスコア
export interface FileScore {
  filePath: string;
  overallScore: number; // 0-100
  dimensions: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weights: WeightConfig; // レポート生成で必要
  metadata: {
    analysisTime: number;
    pluginResults: PluginResult[];
    issueCount: number;
  };
  pluginScores?: {
    [pluginId: string]: {
      score: number;
      weight: number;
      issues: Issue[];
    };
  };
  trend?: ScoreTrend;
}

// ディレクトリ単位のスコア
export interface DirectoryScore {
  directoryPath: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  fileCount: number;
  fileScores: FileScore[];
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  // レガシーサポート
  averageScore?: number;
  dimensions?: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  trend?: ScoreTrend;
}

// プロジェクト全体のスコア
export interface ProjectScore {
  projectPath: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalFiles: number;
  totalDirectories: number; // レポートで必要
  fileScores: FileScore[];
  directoryScores: DirectoryScore[];
  weights: WeightConfig;
  metadata: {
    generatedAt: Date;
    executionTime: number;
    pluginCount: number;
    issueCount: number;
  };
  // レガシーサポート
  averageScore?: number;
  dimensions?: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  distribution?: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  trend?: ScoreTrend;
}

// 集約されたスコア結果
export interface AggregatedScore {
  score: number;
  confidence: number;
  metadata: {
    aggregatedFrom: number;
    totalWeight: number;
    algorithm: string;
  };
}

// 重み付け設定
export interface WeightConfig {
  // プラグイン重み
  plugins: {
    [pluginId: string]: number;
  };
  
  // ディメンション重み
  dimensions: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  
  // ファイルタイプ別重み
  fileTypes?: {
    [pattern: string]: number; // 例: "*.critical.test.ts": 2.0
  };
}

// デフォルト重み設定
export const DEFAULT_WEIGHTS: WeightConfig = {
  plugins: {}, // 全プラグイン均等
  dimensions: {
    completeness: 1.0,
    correctness: 1.5,
    maintainability: 0.8,
    performance: 0.5,
    security: 1.2
  }
};

// 改善提案
export interface Improvement {
  priority: 'critical' | 'high' | 'medium' | 'low';
  target: string;
  action: string;
  expectedImprovement: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  relatedIssues: Issue[];
}

// 品質レポート
export interface QualityReport {
  version: string;
  timestamp: Date;
  summary: {
    projectScore: number;
    projectGrade: string;
    totalFiles: number;
    averageScore: number;
    distribution: {
      A: number;
      B: number;
      C: number;
      D: number;
      F: number;
    };
  };
  
  highlights: {
    topFiles: FileScore[];
    bottomFiles: FileScore[];
    mostImproved: FileScore[];
    mostDegraded: FileScore[];
  };
  
  recommendations: Improvement[];
  
  trends: {
    overall: ScoreTrend;
    byDimension: Record<string, ScoreTrend>;
  };
  
  projectScore: ProjectScore;
}

// スコア履歴の保存形式
export interface ScoreHistory {
  version: string;
  projectId: string;
  entries: Array<{
    timestamp: Date;
    commit?: string;
    branch?: string;
    scores: {
      project: ProjectScore;
      files: Map<string, FileScore>;
    };
    metadata: {
      rimorVersion: string;
      plugins: string[];
      duration: number;
    };
  }>;
}

// キャッシュ構造
export interface ScoreCache {
  fileHash: Map<string, string>; // ファイルパス -> ハッシュ
  scores: Map<string, FileScore>; // ハッシュ -> スコア
  expiry: Date;
}

// グレード判定の基準
export const GRADE_THRESHOLDS = {
  A: 90,
  B: 80, 
  C: 70,
  D: 60,
  F: 0
} as const;

// ディメンションタイプ
export type DimensionType = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
export type GradeType = 'A' | 'B' | 'C' | 'D' | 'F';

// スコア計算メソッドインターフェース
export interface IScoreCalculator {
  // ファイル単位のスコア算出
  calculateFileScore(
    file: string,
    pluginResults: PluginResult[]
  ): FileScore;
  
  // ディレクトリ単位のスコア算出
  calculateDirectoryScore(
    directory: string,
    fileScores: FileScore[]
  ): DirectoryScore;
  
  // プロジェクト全体のスコア算出
  calculateProjectScore(
    directoryScores: DirectoryScore[]
  ): ProjectScore;
  
  // カスタム集約ロジック
  aggregateScores(
    scores: QualityScore[],
    weights?: WeightConfig
  ): AggregatedScore;
}