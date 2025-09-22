/**
 * ベンチマーク共通型定義
 * 循環参照解消のための共通インターフェース
 * 
 * SOLID原則: Interface Segregation Principle (ISP) 適用
 */

import { UnifiedAnalysisResult } from '../orchestrator/types';

/**
 * ベンチマーク実行結果
 */
export interface BenchmarkResult {
  success: boolean;
  projectName: string;
  timestamp: string;
  performance: PerformanceMetrics;
  accuracy: AccuracyMetrics;
  target5ms: Target5msResult;
  /** Issue #85: 統合分析結果メトリクス */
  unifiedAnalysis?: UnifiedAnalysisMetrics;
  /** Issue #85: 生の統合分析結果 */
  rawUnifiedResult?: UnifiedAnalysisResult;
  systemInfo: {
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: number;
    nodeVersion: string;
  };
  errors?: string[];
  warnings?: string[];
  duration: number;
}

/**
 * パフォーマンスメトリクス
 */
export interface PerformanceMetrics {
  totalExecutionTime: number;
  avgTimePerFile: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * 精度メトリクス
 */
export interface AccuracyMetrics {
  totalIssuesDetected: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  precisionRate: number;
  recallRate: number;
  f1Score: number;
}

/**
 * 5ms/fileターゲット結果
 */
export interface Target5msResult {
  achieved: boolean;
  actualTime: number;
  targetTime: number;
  improvement: number;
  confidence: number;
}

/**
 * 統合分析メトリクス
 */
export interface UnifiedAnalysisMetrics {
  totalVulnerabilities: number;
  highSeverityCount: number;
  coverageScore: number;
  intentRealizationScore: number;
  gapDetectionScore: number;
  nistComplianceScore: number;
}

/**
 * ベースライン比較結果
 */
export interface BaselineComparison {
  /** 比較実行日時 */
  comparedAt: string;
  /** ベースラインID */
  baselineId: string;
  /** 全体改善率 */
  overallImprovement: number;
  /** プロジェクト別比較結果 */
  projectComparisons: ProjectComparison[];
  /** 5ms/file目標達成改善 */
  target5msImprovements: {
    improved: string[]; // 新規達成
    maintained: string[]; // 達成継続
    degraded: string[]; // 達成から未達成に
  };
  /** 推奨事項 */
  recommendations: string[];
  /** 統計サマリー */
  summary: {
    totalProjects: number;
    improvedCount: number;
    degradedCount: number;
    unchangedCount: number;
    avgImprovement: number;
  };
}

/**
 * プロジェクト別比較結果
 */
export interface ProjectComparison {
  projectName: string;
  performanceImprovement: number;
  accuracyImprovement: number;
  target5msAchieved: boolean;
  target5msImprovement: number;
  significantChanges: string[];
  details: {
    baseline: PerformanceMetrics & AccuracyMetrics;
    current: PerformanceMetrics & AccuracyMetrics;
  };
}