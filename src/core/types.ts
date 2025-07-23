// 既存のシンプルなプラグインインターフェース（後方互換性のため保持）
export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

export interface Issue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  line?: number;  // 行番号（オプション）
  file?: string;  // ファイルパス（オプション）
}

// 高度なプラグインインターフェース（v0.3.0）
export interface ITestQualityPlugin {
  // プラグイン識別情報
  id: string;
  name: string;
  version: string;
  type: 'core' | 'framework' | 'pattern' | 'domain';
  
  // プラグインの適用条件
  isApplicable(context: ProjectContext): boolean;
  
  // メイン機能
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  evaluateQuality(patterns: DetectionResult[]): QualityScore;
  suggestImprovements(evaluation: QualityScore): Improvement[];
  
  // オプション機能
  autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
  learn?(feedback: Feedback): void;
}

// プロジェクトコンテキスト
export interface ProjectContext {
  rootPath: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'other';
  testFramework?: string;
  packageJson?: any;
  tsConfig?: any;
  customConfig?: Record<string, any>;
  filePatterns: {
    test: string[];
    source: string[];
    ignore: string[];
  };
}

// テストファイル表現
export interface TestFile {
  path: string;
  content: string;
  ast?: any; // 将来的なAST対応
  metadata: {
    framework?: string;
    language: string;
    lastModified: Date;
  };
}

// プラグイン実行結果
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  detectionResults: DetectionResult[];
  qualityScore: QualityScore;
  improvements: Improvement[];
  executionTime: number;
  error?: string;
}

// パターン検出結果
export interface DetectionResult {
  patternId: string;
  patternName: string;
  location: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence: Evidence[];
  metadata?: Record<string, any>;
}

export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// 品質評価
export interface QualityScore {
  overall: number; // 0-100
  breakdown: ScoreBreakdown;
  confidence: number; // 0.0-1.0
  metadata?: Record<string, any>;
}

// スコア内訳
export interface ScoreBreakdown {
  completeness: number;
  correctness: number;
  maintainability: number;
  [dimension: string]: number;
}

// 評価ディメンション
export type QualityDimension = 
  | 'completeness'    // 網羅性
  | 'correctness'     // 正確性
  | 'maintainability' // 保守性
  | 'performance'     // パフォーマンス
  | 'security';       // セキュリティ

// 改善提案
export interface Improvement {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'add' | 'modify' | 'remove' | 'refactor';
  title: string;
  description: string;
  location: CodeLocation;
  suggestedCode?: CodeSnippet;
  estimatedImpact: {
    scoreImprovement: number;
    effortMinutes: number;
  };
  automatable: boolean;
}

// 自動修正結果
export interface FixResult {
  success: boolean;
  applied: AppliedFix[];
  failed: FailedFix[];
  summary: string;
}

export interface AppliedFix {
  improvementId: string;
  filePath: string;
  changes: CodeChange[];
}

export interface FailedFix {
  improvementId: string;
  reason: string;
  manualSteps?: string[];
}

// コード位置情報
export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// コード変更情報
export interface CodeChange {
  type: 'insert' | 'replace' | 'delete';
  location: CodeLocation;
  oldCode?: string;
  newCode?: string;
}

// コードスニペット
export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

// フィードバック
export interface Feedback {
  pluginId: string;
  improvementId?: string;
  rating: number; // 1-5
  comment?: string;
  outcome: 'accepted' | 'rejected' | 'modified';
}