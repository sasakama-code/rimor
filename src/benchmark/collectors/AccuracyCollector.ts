/**
 * 解析精度測定システム
 * Phase 2: TaintTyper、Intent抽出、Gap検出の精度詳細分析
 * 
 * SOLID原則に基づく設計:
 * - Single Responsibility: 精度測定に特化した専用コレクター
 * - Open/Closed: 新しい解析タイプの追加に開放
 * - Dependency Inversion: 統計計算の抽象化
 */

import { EventEmitter } from 'events';
import {
  AccuracyCollectorConfig,
  AccuracyMeasurementResult,
  AccuracyMetrics,
  TaintAnalysisResult,
  IntentExtractionResult,
  GapDetectionResult,
  TaintAnalysisMetrics,
  IntentExtractionMetrics,
  GapDetectionMetrics,
  IntegratedAccuracyMetrics,
  AccuracyStats,
  CurrentAccuracySnapshot,
  AccuracyAlert,
  AccuracyTrend
} from './types';

/**
 * 統計計算ユーティリティクラス
 * DRY原則に従った共通計算ロジックの抽象化
 */
class AccuracyStatisticsCalculator {
  /**
   * 基本精度統計の計算
   */
  static calculateAccuracyStats(results: { expected: any; actual: any; confidence: number }[]): AccuracyStats {
    if (results.length === 0) {
      return { accuracy: 0, sampleCount: 0, averageConfidence: 0 };
    }

    const correctCount = results.filter(r => this.isCorrect(r.expected, r.actual)).length;
    const accuracy = correctCount / results.length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      accuracy,
      sampleCount: results.length,
      averageConfidence
    };
  }

  /**
   * 混同行列の計算
   */
  static calculateConfusionMatrix(results: { expected: boolean; actual: boolean }[]) {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    results.forEach(result => {
      if (result.expected && result.actual) truePositives++;
      else if (!result.expected && result.actual) falsePositives++;
      else if (!result.expected && !result.actual) trueNegatives++;
      else if (result.expected && !result.actual) falseNegatives++;
    });

    return { truePositives, falsePositives, trueNegatives, falseNegatives };
  }

  /**
   * 精度、再現率、F1スコアの計算
   */
  static calculatePrecisionRecallF1(confusion: { truePositives: number; falsePositives: number; trueNegatives: number; falseNegatives: number }) {
    const { truePositives, falsePositives, falseNegatives } = confusion;
    
    const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return { precision, recall, f1Score };
  }

  /**
   * 文字列類似度の計算（レーベンシュタイン距離ベース）
   */
  static calculateStringSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // 初期化
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [];
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // 距離計算
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // 削除
          matrix[i][j - 1] + 1,     // 挿入
          matrix[i - 1][j - 1] + cost // 置換
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen > 0 ? (maxLen - matrix[len1][len2]) / maxLen : 1.0;
  }

  private static isCorrect(expected: any, actual: any): boolean {
    if (typeof expected === 'boolean' && typeof actual === 'boolean') {
      return expected === actual;
    }
    if (typeof expected === 'string' && typeof actual === 'string') {
      return this.calculateStringSimilarity(expected, actual) > 0.8;
    }
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
}

/**
 * TaintTyper精度分析専用クラス
 */
class TaintTyperAccuracyAnalyzer {
  private results: TaintAnalysisResult[] = [];

  addResult(result: TaintAnalysisResult): void {
    this.results.push(result);
  }

  generateMetrics(): TaintAnalysisMetrics {
    const confusion = AccuracyStatisticsCalculator.calculateConfusionMatrix(this.results);
    const { precision, recall, f1Score } = AccuracyStatisticsCalculator.calculatePrecisionRecallF1(confusion);
    const overallAccuracy = (confusion.truePositives + confusion.trueNegatives) / this.results.length;

    // 脆弱性タイプ別分析
    const byVulnerabilityType = this.analyzeByVulnerabilityType();

    // 信頼度レベル別分析
    const byConfidenceLevel = this.analyzeByConfidenceLevel();

    return {
      overallAccuracy,
      precision,
      recall,
      f1Score,
      ...confusion,
      byVulnerabilityType,
      byConfidenceLevel
    };
  }

  private analyzeByVulnerabilityType(): Record<string, AccuracyStats> {
    const typeGroups: Record<string, TaintAnalysisResult[]> = {};
    
    this.results.forEach(result => {
      if (result.vulnerabilityType) {
        if (!typeGroups[result.vulnerabilityType]) {
          typeGroups[result.vulnerabilityType] = [];
        }
        typeGroups[result.vulnerabilityType].push(result);
      }
    });

    const analysis: Record<string, AccuracyStats> = {};
    Object.entries(typeGroups).forEach(([type, results]) => {
      analysis[type] = AccuracyStatisticsCalculator.calculateAccuracyStats(results);
    });

    return analysis;
  }

  private analyzeByConfidenceLevel(): { high: AccuracyStats; medium: AccuracyStats; low: AccuracyStats } {
    const high = this.results.filter(r => r.confidence >= 0.9);
    const medium = this.results.filter(r => r.confidence >= 0.7 && r.confidence < 0.9);
    const low = this.results.filter(r => r.confidence < 0.7);

    return {
      high: AccuracyStatisticsCalculator.calculateAccuracyStats(high),
      medium: AccuracyStatisticsCalculator.calculateAccuracyStats(medium),
      low: AccuracyStatisticsCalculator.calculateAccuracyStats(low)
    };
  }

  reset(): void {
    this.results = [];
  }
}

/**
 * Intent抽出精度分析専用クラス
 */
class IntentExtractionAccuracyAnalyzer {
  private results: IntentExtractionResult[] = [];

  addResult(result: IntentExtractionResult): void {
    this.results.push(result);
  }

  generateMetrics(): IntentExtractionMetrics {
    if (this.results.length === 0) {
      return {
        overallAccuracy: 0,
        averageSimilarity: 0,
        exactMatches: 0,
        partialMatches: 0,
        mismatches: 0,
        byCategory: {},
        byFramework: {}
      };
    }

    const exactMatches = this.results.filter(r => r.similarity >= 0.95).length;
    const partialMatches = this.results.filter(r => r.similarity >= 0.5 && r.similarity < 0.95).length;
    const mismatches = this.results.filter(r => r.similarity < 0.5).length;

    const averageSimilarity = this.results.reduce((sum, r) => sum + r.similarity, 0) / this.results.length;
    const overallAccuracy = exactMatches / this.results.length;

    const byCategory = this.analyzeByCategory();
    const byFramework = this.analyzeByFramework();

    return {
      overallAccuracy,
      averageSimilarity,
      exactMatches,
      partialMatches,
      mismatches,
      byCategory,
      byFramework
    };
  }

  private analyzeByCategory(): Record<string, AccuracyStats> {
    const categoryGroups: Record<string, IntentExtractionResult[]> = {};
    
    this.results.forEach(result => {
      if (result.category) {
        if (!categoryGroups[result.category]) {
          categoryGroups[result.category] = [];
        }
        categoryGroups[result.category].push(result);
      }
    });

    const analysis: Record<string, AccuracyStats> = {};
    Object.entries(categoryGroups).forEach(([category, results]) => {
      const accuracyResults = results.map(r => ({
        expected: r.expectedIntent,
        actual: r.extractedIntent,
        confidence: r.confidence
      }));
      analysis[category] = AccuracyStatisticsCalculator.calculateAccuracyStats(accuracyResults);
    });

    return analysis;
  }

  private analyzeByFramework(): Record<string, AccuracyStats> {
    const frameworkGroups: Record<string, IntentExtractionResult[]> = {};
    
    this.results.forEach(result => {
      if (result.framework) {
        if (!frameworkGroups[result.framework]) {
          frameworkGroups[result.framework] = [];
        }
        frameworkGroups[result.framework].push(result);
      }
    });

    const analysis: Record<string, AccuracyStats> = {};
    Object.entries(frameworkGroups).forEach(([framework, results]) => {
      const accuracyResults = results.map(r => ({
        expected: r.expectedIntent,
        actual: r.extractedIntent,
        confidence: r.confidence
      }));
      analysis[framework] = AccuracyStatisticsCalculator.calculateAccuracyStats(accuracyResults);
    });

    return analysis;
  }

  reset(): void {
    this.results = [];
  }
}

/**
 * Gap検出精度分析専用クラス
 */
class GapDetectionAccuracyAnalyzer {
  private results: GapDetectionResult[] = [];

  addResult(result: GapDetectionResult): void {
    this.results.push(result);
  }

  generateMetrics(): GapDetectionMetrics {
    if (this.results.length === 0) {
      return {
        overallAccuracy: 0,
        precision: 0,
        recall: 0,
        averageGapsDetected: 0,
        byGapType: {}
      };
    }

    // ギャップ数の正確性を評価
    const accurateDetections = this.results.filter(r => r.expectedGaps === r.detectedGaps).length;
    const overallAccuracy = accurateDetections / this.results.length;

    // 精度と再現率の計算（検出されたギャップ数に基づく）
    let totalExpected = 0;
    let totalDetected = 0;
    let correctlyDetected = 0;

    this.results.forEach(result => {
      totalExpected += result.expectedGaps;
      totalDetected += result.detectedGaps;
      correctlyDetected += Math.min(result.expectedGaps, result.detectedGaps);
    });

    const precision = totalDetected > 0 ? correctlyDetected / totalDetected : 0;
    const recall = totalExpected > 0 ? correctlyDetected / totalExpected : 0;
    const averageGapsDetected = totalDetected / this.results.length;

    const byGapType = this.analyzeByGapType();

    return {
      overallAccuracy,
      precision,
      recall,
      averageGapsDetected,
      byGapType
    };
  }

  private analyzeByGapType(): Record<string, AccuracyStats> {
    const typeGroups: Record<string, GapDetectionResult[]> = {};
    
    this.results.forEach(result => {
      if (result.gapType) {
        if (!typeGroups[result.gapType]) {
          typeGroups[result.gapType] = [];
        }
        typeGroups[result.gapType].push(result);
      }
    });

    const analysis: Record<string, AccuracyStats> = {};
    Object.entries(typeGroups).forEach(([type, results]) => {
      const accuracyResults = results.map(r => ({
        expected: r.expectedGaps,
        actual: r.detectedGaps,
        confidence: r.confidence
      }));
      analysis[type] = AccuracyStatisticsCalculator.calculateAccuracyStats(accuracyResults);
    });

    return analysis;
  }

  reset(): void {
    this.results = [];
  }
}

/**
 * メインの精度測定システム
 */
export class AccuracyCollector extends EventEmitter {
  private sessions: Map<string, { startTime: number; status: string }> = new Map();
  private taintAnalyzer!: TaintTyperAccuracyAnalyzer;
  private intentAnalyzer!: IntentExtractionAccuracyAnalyzer;
  private gapAnalyzer!: GapDetectionAccuracyAnalyzer;
  private config: Required<AccuracyCollectorConfig>;
  private accuracyThresholds: Map<string, number> = new Map();
  private accuracyHistory: Map<string, { timestamp: number; accuracy: number }[]> = new Map();

  constructor(config: AccuracyCollectorConfig = {}) {
    super();
    
    // デフォルト設定の適用
    this.config = {
      enableTaintAnalysis: config.enableTaintAnalysis ?? true,
      enableIntentExtraction: config.enableIntentExtraction ?? true,
      enableGapDetection: config.enableGapDetection ?? true,
      confidenceThreshold: config.confidenceThreshold ?? 0.8,
      sampleSize: config.sampleSize ?? 100
    };

    this.initializeAnalyzers();
  }

  private initializeAnalyzers(): void {
    this.taintAnalyzer = new TaintTyperAccuracyAnalyzer();
    this.intentAnalyzer = new IntentExtractionAccuracyAnalyzer();
    this.gapAnalyzer = new GapDetectionAccuracyAnalyzer();
  }

  /**
   * 精度測定セッションを開始
   */
  async startAccuracyMeasurement(sessionId: string): Promise<string> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Accuracy measurement session ${sessionId} already exists`);
    }

    this.sessions.set(sessionId, {
      startTime: Date.now(),
      status: 'active'
    });

    this.accuracyHistory.set(sessionId, []);

    this.emit('accuracy_session_started', { sessionId, timestamp: Date.now() });
    
    return sessionId;
  }

  /**
   * 精度測定セッションを終了
   */
  async endAccuracyMeasurement(sessionId: string): Promise<AccuracyMeasurementResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Accuracy measurement session ${sessionId} not found`
      };
    }

    try {
      const accuracyMetrics = this.generateComprehensiveMetrics();
      
      session.status = 'completed';
      
      this.emit('accuracy_session_completed', { sessionId, accuracyMetrics });

      return {
        success: true,
        accuracyMetrics
      };

    } catch (error) {
      session.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * TaintTyper分析結果の記録
   */
  async recordTaintAnalysisResult(sessionId: string, result: TaintAnalysisResult): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (this.config.enableTaintAnalysis) {
      this.taintAnalyzer.addResult(result);
      this.updateAccuracyHistory(sessionId, 'taint', result.expected === result.actual ? 1 : 0);
    }
  }

  /**
   * Intent抽出結果の記録
   */
  async recordIntentExtractionResult(sessionId: string, result: IntentExtractionResult): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (this.config.enableIntentExtraction) {
      this.intentAnalyzer.addResult(result);
      this.updateAccuracyHistory(sessionId, 'intent', result.similarity);
    }
  }

  /**
   * Gap検出結果の記録
   */
  async recordGapDetectionResult(sessionId: string, result: GapDetectionResult): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (this.config.enableGapDetection) {
      this.gapAnalyzer.addResult(result);
      const accuracy = result.expectedGaps === result.detectedGaps ? 1 : 
                      1 - Math.abs(result.expectedGaps - result.detectedGaps) / Math.max(result.expectedGaps, result.detectedGaps, 1);
      this.updateAccuracyHistory(sessionId, 'gap', accuracy);
    }
  }

  /**
   * 包括的なメトリクス生成
   */
  private generateComprehensiveMetrics(): AccuracyMetrics {
    const taintAnalysis = this.taintAnalyzer.generateMetrics();
    const intentExtraction = this.intentAnalyzer.generateMetrics();
    const gapDetection = this.gapAnalyzer.generateMetrics();
    const integrated = this.calculateIntegratedAccuracy(taintAnalysis, intentExtraction, gapDetection);

    return {
      taintAnalysis,
      intentExtraction,
      gapDetection,
      integrated
    };
  }

  /**
   * 統合精度の計算
   */
  private calculateIntegratedAccuracy(
    taintAnalysis: TaintAnalysisMetrics,
    intentExtraction: IntentExtractionMetrics,
    gapDetection: GapDetectionMetrics
  ): IntegratedAccuracyMetrics {
    // 重み付け（TaintTyper: 40%, Intent: 35%, Gap: 25%）
    const weights = {
      taint: 0.4,
      intent: 0.35,
      gap: 0.25
    };

    const weightedAccuracy = 
      taintAnalysis.overallAccuracy * weights.taint +
      intentExtraction.overallAccuracy * weights.intent +
      gapDetection.overallAccuracy * weights.gap;

    // 信頼度スコア（各分析の信頼度レベルに基づく）
    const confidenceScore = this.calculateConfidenceScore(taintAnalysis, intentExtraction, gapDetection);

    // 総合スコア（精度と信頼度の調和平均）
    const overallScore = 2 * (weightedAccuracy * confidenceScore) / (weightedAccuracy + confidenceScore);

    return {
      overallScore,
      weightedAccuracy,
      confidenceScore
    };
  }

  /**
   * 信頼度スコアの計算
   */
  private calculateConfidenceScore(
    taintAnalysis: TaintAnalysisMetrics,
    intentExtraction: IntentExtractionMetrics,
    gapDetection: GapDetectionMetrics
  ): number {
    // 各分析の高信頼度結果の割合を基に算出
    const taintHighConf = taintAnalysis.byConfidenceLevel.high.sampleCount / 
                         (taintAnalysis.truePositives + taintAnalysis.falsePositives + taintAnalysis.trueNegatives + taintAnalysis.falseNegatives || 1);
    
    const intentHighConf = intentExtraction.exactMatches / 
                          (intentExtraction.exactMatches + intentExtraction.partialMatches + intentExtraction.mismatches || 1);
    
    const gapHighConf = 0.8; // Gap検出は簡易実装

    return (taintHighConf + intentHighConf + gapHighConf) / 3;
  }

  /**
   * 精度履歴の更新
   */
  private updateAccuracyHistory(sessionId: string, analysisType: string, accuracy: number): void {
    const history = this.accuracyHistory.get(sessionId) || [];
    history.push({
      timestamp: Date.now(),
      accuracy
    });

    // 最新100件のみ保持
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.accuracyHistory.set(sessionId, history);
  }

  /**
   * 精度閾値の設定
   */
  setAccuracyThreshold(analysisType: string, threshold: number): void {
    this.accuracyThresholds.set(analysisType, threshold);
  }

  /**
   * 現在の精度スナップショットの取得
   */
  async getCurrentAccuracy(sessionId: string): Promise<CurrentAccuracySnapshot> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const history = this.accuracyHistory.get(sessionId) || [];
    const currentAccuracy = history.length > 0 
      ? history.reduce((sum, entry) => sum + entry.accuracy, 0) / history.length 
      : 0;

    const alerts = this.generateCurrentAlerts(sessionId, currentAccuracy);

    return {
      sessionId,
      currentAccuracy,
      sampleCount: history.length,
      alerts,
      timestamp: Date.now()
    };
  }

  /**
   * 現在のアラート生成
   */
  private generateCurrentAlerts(sessionId: string, currentAccuracy: number): AccuracyAlert[] {
    const alerts: AccuracyAlert[] = [];

    // Taint分析の閾値チェック
    const taintThreshold = this.accuracyThresholds.get('taintAnalysis');
    if (taintThreshold && currentAccuracy < taintThreshold) {
      alerts.push({
        type: 'accuracy_threshold_breach',
        severity: 'high',
        message: `TaintTyper精度が閾値(${taintThreshold})を下回りました: ${currentAccuracy.toFixed(3)}`,
        timestamp: Date.now(),
        affectedMetric: 'taintAnalysis'
      });
    }

    // トレンド劣化チェック
    const history = this.accuracyHistory.get(sessionId) || [];
    if (history.length >= 10) {
      const recent = history.slice(-5).map(h => h.accuracy);
      const older = history.slice(-10, -5).map(h => h.accuracy);
      
      const recentAvg = recent.reduce((sum, acc) => sum + acc, 0) / recent.length;
      const olderAvg = older.reduce((sum, acc) => sum + acc, 0) / older.length;
      
      if (recentAvg < olderAvg * 0.9) { // 10%以上の劣化
        alerts.push({
          type: 'trend_degradation',
          severity: 'medium',
          message: '精度が劣化傾向にあります',
          timestamp: Date.now(),
          affectedMetric: 'overall'
        });
      }
    }

    return alerts;
  }

  /**
   * リソースのクリーンアップ
   */
  cleanup(): void {
    // アクティブセッションの終了
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active') {
        this.endAccuracyMeasurement(sessionId).catch(console.error);
      }
    }

    // 分析器のリセット
    this.taintAnalyzer.reset();
    this.intentAnalyzer.reset();
    this.gapAnalyzer.reset();

    this.sessions.clear();
    this.accuracyHistory.clear();
    this.removeAllListeners();
  }
}