/**
 * 統合分析コマンドの型定義
 * SOLID原則に従った型設計
 */

export interface UnifiedAnalyzeOptions {
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  verbose?: boolean;
  output?: string;
  includeRecommendations?: boolean;
  
  // 従来の互換性オプション
  includeDetails?: boolean;
  cache?: boolean;
  
  // 統合分析設定
  enableTaintAnalysis?: boolean;
  enableIntentExtraction?: boolean;
  enableGapDetection?: boolean;
  enableNistEvaluation?: boolean;
  
  // 実行設定
  timeout?: number;
  parallel?: boolean;
}

export interface UnifiedAnalyzeResult {
  format: string;
  content: string;
  verbose?: boolean;
  metadata: {
    executionTime: number;
    analyzedPath: string;
    timestamp: string;
  };
}

export interface IUnifiedAnalyzeCommand {
  execute(options: UnifiedAnalyzeOptions): Promise<UnifiedAnalyzeResult>;
}