# 型定義一貫性チェックレポート

生成日時: 2025-08-16T16:46:34.065Z

## サマリー
- 総型定義数: 727
- 競合数: 725

## 競合詳細

### FormattingStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/adapter.ts
- 種別: type
- エクスポート: exported
```typescript
export type FormattingStrategy = any;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FormattingStrategy = any;
```

### AISummary (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AISummary {
  totalIssues: number;
  totalFiles: number;
  overallScore: number;
  severityDistribution: Record<IssueSeverity, number>;
  categoryDistribution: Record<IssueCategory, number>;
  topIssues: Array<{
    category: IssueCategory;
    severity: IssueSeverity;
    count: number;
    message: string;
  }>;
  keyFindings: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AISummary {
  totalIssues: number;
  totalFiles: number;
  overallScore: number;
  severityDistribution: Record<IssueSeverity, number>;
  categoryDistribution: Record<IssueCategory, number>;
  topIssues: Array<{
    category: IssueCategory;
    severity: IssueSeverity;
    count: number;
    message: string;
  }>;
  keyFindings: string[];
}
```

### AIFormattedIssue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIFormattedIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  impact: 'high' | 'medium' | 'low';
  codeSnippet?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIFormattedIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  impact: 'high' | 'medium' | 'low';
  codeSnippet?: string;
}
```

### AIFormattedFile (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIFormattedFile {
  path: string;
  issueCount: number;
  issues: AIFormattedIssue[];
  score: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIFormattedFile {
  path: string;
  issueCount: number;
  issues: AIFormattedIssue[];
  score: number;
}
```

### AIContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIContext {
  projectType: string;
  framework: string;
  testFramework: string;
  languages: string[];
  dependencies: Record<string, string> | string[];
  configuration: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    hasJest: boolean;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIContext {
  projectType: string;
  framework: string;
  testFramework: string;
  languages: string[];
  dependencies: Record<string, string> | string[];
  configuration: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    hasJest: boolean;
  };
}
```

### AIOptimizedOutput (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOptimizedOutput {
  version: string;
  format: "ai-optimized";
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  
  context: {
    rootPath: string;
    configFiles: Record<string, string>; // ファイル名: 内容
    dependencies: Record<string, string>; // パッケージ名: バージョン
    projectStructure: string; // ディレクトリ構造の簡潔な表現
  };
  
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      description: string;
      context: CodeContext;
      fix: SuggestedFix;
    }>;
  }>;
  
  actionableTasks: Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>;
  
  instructions: {
    forHuman: string;
    forAI: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOptimizedOutput {
  version: string;
  format: "ai-optimized";
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  
  context: {
    rootPath: string;
    configFiles: Record<string, string>; // ファイル名: 内容
    dependencies: Record<string, string>; // パッケージ名: バージョン
    projectStructure: string; // ディレクトリ構造の簡潔な表現
  };
  
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      description: string;
      context: CodeContext;
      fix: SuggestedFix;
    }>;
  }>;
  
  actionableTasks: Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>;
  
  instructions: {
    forHuman: string;
    forAI: string;
  };
}
```

### CodeContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeContext {
  // 問題のあるコード
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 関連するソースコード（テスト対象）
  relatedSource?: {
    path: string;
    content: string;
    relevantSection?: {
      startLine: number;
      endLine: number;
    };
  };
  
  // 周辺のコンテキスト
  surroundingCode: {
    before: string; // 前10行
    after: string;  // 後10行
  };
  
  // インポート文
  imports: string[];
  
  // 使用されている主要なAPI/関数
  usedAPIs: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeContext {
  // 問題のあるコード
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 関連するソースコード（テスト対象）
  relatedSource?: {
    path: string;
    content: string;
    relevantSection?: {
      startLine: number;
      endLine: number;
    };
  };
  
  // 周辺のコンテキスト
  surroundingCode: {
    before: string; // 前10行
    after: string;  // 後10行
  };
  
  // インポート文
  imports: string[];
  
  // 使用されている主要なAPI/関数
  usedAPIs: string[];
}
```

### LocationInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocationInfo {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocationInfo {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}
```

### SuggestedFix (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SuggestedFix {
  type: 'add' | 'replace' | 'remove' | 'refactor';
  targetLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  code: {
    template: string; // 修正コードのテンプレート
    placeholders?: Record<string, string>; // 置換が必要な部分
  };
  explanation: string;
  confidence: number; // 0.0-1.0
  dependencies?: string[]; // 必要な追加インポート等
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SuggestedFix {
  type: 'add' | 'replace' | 'remove' | 'refactor';
  targetLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  code: {
    template: string; // 修正コードのテンプレート
    placeholders?: Record<string, string>; // 置換が必要な部分
  };
  explanation: string;
  confidence: number; // 0.0-1.0
  dependencies?: string[]; // 必要な追加インポート等
}
```

### ActionStep (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ActionStep {
  order: number;
  action: string;
  target: string;
  code?: string;
  explanation: string;
  automated: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ActionStep {
  order: number;
  action: string;
  target: string;
  code?: string;
  explanation: string;
  automated: boolean;
}
```

### ImpactEstimation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactEstimation {
  scoreImprovement: number;
  issuesResolved: number;
  effortMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactEstimation {
  scoreImprovement: number;
  issuesResolved: number;
  effortMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

### AIMarkdownOutput (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIMarkdownOutput {
  header: string;
  projectContext: string;
  criticalIssuesSummary: string;
  fileAnalysis: FileAnalysisSection[];
  automatedTasks: TaskSection[];
  instructions: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIMarkdownOutput {
  header: string;
  projectContext: string;
  criticalIssuesSummary: string;
  fileAnalysis: FileAnalysisSection[];
  automatedTasks: TaskSection[];
  instructions: string;
}
```

### FileAnalysisSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileAnalysisSection {
  fileName: string;
  score: string;
  issues: IssueSection[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileAnalysisSection {
  fileName: string;
  score: string;
  issues: IssueSection[];
}
```

### IssueSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueSection {
  id: string;
  title: string;
  severity: string;
  location: string;
  currentCode: string;
  relatedSourceCode?: string;
  suggestedFix: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueSection {
  id: string;
  title: string;
  severity: string;
  location: string;
  currentCode: string;
  relatedSourceCode?: string;
  suggestedFix: string;
}
```

### TaskSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaskSection {
  id: string;
  title: string;
  priority: string;
  automatable: boolean;
  impact: string;
  steps: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaskSection {
  id: string;
  title: string;
  priority: string;
  automatable: boolean;
  impact: string;
  steps: string[];
}
```

### AIPromptTemplate (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIPromptTemplate {
  // 汎用修正プロンプト
  genericFix: string;
  
  // 問題タイプ別プロンプト
  byIssueType: {
    [issueType: string]: string;
  };
  
  // フレームワーク別プロンプト
  byFramework: {
    [framework: string]: string;
  };
  
  // バッチ処理用プロンプト
  batchFix: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIPromptTemplate {
  // 汎用修正プロンプト
  genericFix: string;
  
  // 問題タイプ別プロンプト
  byIssueType: {
    [issueType: string]: string;
  };
  
  // フレームワーク別プロンプト
  byFramework: {
    [framework: string]: string;
  };
  
  // バッチ処理用プロンプト
  batchFix: string;
}
```

### FormatterOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FormatterOptions {
  format: 'json' | 'markdown';
  maxTokens?: number;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  maxFileSize?: number;
  optimizeForAI?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FormatterOptions {
  format: 'json' | 'markdown';
  maxTokens?: number;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  maxFileSize?: number;
  optimizeForAI?: boolean;
}
```

### EnhancedAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EnhancedAnalysisResult {
  issues: Issue[];
  totalFiles: number;
  executionTime: number;
  projectScore?: ProjectScore;
  fileScores?: FileScore[];
  projectContext?: ProjectContext;
  
  // AI向け拡張情報
  aiContext?: {
    codeContext: Map<string, CodeContext>;
    suggestedFixes: Map<string, SuggestedFix[]>;
    actionableTasks: ActionStep[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EnhancedAnalysisResult {
  issues: Issue[];
  totalFiles: number;
  executionTime: number;
  projectScore?: ProjectScore;
  fileScores?: FileScore[];
  projectContext?: ProjectContext;
  
  // AI向け拡張情報
  aiContext?: {
    codeContext: Map<string, CodeContext>;
    suggestedFixes: Map<string, SuggestedFix[]>;
    actionableTasks: ActionStep[];
  };
}
```

### AIJsonOutput (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIJsonOutput {
  // AIが最初に読むべき全体状況と最重要問題点
  overallAssessment: string;
  
  // 対処すべき問題の優先順位付きリスト
  keyRisks: Array<{
    // 問題点の簡潔な自然言語での説明
    problem: string;
    
    // リスクレベル
    riskLevel: string;
    
    // 修正に必要な最小限のコードスニペットと行番号
    context: {
      filePath: string;
      codeSnippet: string;
      startLine: number;
      endLine: number;
    };
    
    // AIが次にとるべき具体的なアクション
    suggestedAction: {
      type: string; // ADD_ASSERTION, SANITIZE_VARIABLE, etc.
      description: string;
      example?: string; // 具体的なコード例
    };
  }>;
  
  // 人間が確認するための詳細なHTMLレポートへのリンク
  fullReportUrl: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIJsonOutput {
  overallAssessment: string;
  keyRisks: AIRisk[];
  fullReportUrl: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIJsonOutput {
    // 全体評価
    overallAssessment: string;
    
    // 主要リスク（最大10件）
    keyRisks: Array<{
      problem: string;
      riskLevel: string;
      context: {
        filePath: string;
        codeSnippet: string;
        startLine: number;
        endLine: number;
      };
      suggestedAction: {
        type: string;
        description: string;
        example?: string;
      };
    }>;
    
    // 詳細レポートへのリンク
    fullReportUrl: string;
    
    // メタデータ
    metadata?: {
      timestamp: string;
      version: string;
      projectType?: string;
    };
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type AIJsonOutput = CoreTypes.AIJsonOutput;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIJsonOutput {
  // AIが最初に読むべき全体状況と最重要問題点
  overallAssessment: string;
  
  // 対処すべき問題の優先順位付きリスト
  keyRisks: Array<{
    // 問題点の簡潔な自然言語での説明
    problem: string;
    
    // リスクレベル
    riskLevel: string;
    
    // 修正に必要な最小限のコードスニペットと行番号
    context: {
      filePath: string;
      codeSnippet: string;
      startLine: number;
      endLine: number;
    };
    
    // AIが次にとるべき具体的なアクション
    suggestedAction: {
      type: string; // ADD_ASSERTION, SANITIZE_VARIABLE, etc.
      description: string;
      example?: string; // 具体的なコード例
    };
  }>;
  
  // 人間が確認するための詳細なHTMLレポートへのリンク
  fullReportUrl: string;
}
```

### RiskLevel (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    MINIMAL = 'MINIMAL'
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type RiskLevel = CoreTypes.RiskLevel;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: type
- エクスポート: exported
```typescript
export type RiskLevel = IntentRiskLevel;
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL'
}
```

### AIActionType (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AIActionType = 'ADD_ASSERTION' | 'SANITIZE_VARIABLE' | 'REFACTOR_COMPLEX_CODE' | 'ADD_MISSING_TEST';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AIActionType = 'ADD_ASSERTION' | 'SANITIZE_VARIABLE' | 'REFACTOR_COMPLEX_CODE' | 'ADD_MISSING_TEST';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum AIActionType {
  ADD_ASSERTION = 'ADD_ASSERTION',
  SANITIZE_VARIABLE = 'SANITIZE_VARIABLE',
  REFACTOR_COMPLEX_CODE = 'REFACTOR_COMPLEX_CODE',
  ADD_MISSING_TEST = 'ADD_MISSING_TEST'
}
```

### ScoreBreakdown (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoreBreakdown {
  label: string;        // 例: "クリティカルリスク", "Unsafe Taint Flow"
  calculation: string;  // 例: "-5点 x 21件"
  deduction: number;    // 例: -105
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoreBreakdown {
  label: string;        // 例: "クリティカルリスク", "Unsafe Taint Flow"
  calculation: string;  // 例: "-5点 x 21件"
  deduction: number;    // 例: -105
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoreBreakdown {
  /** 項目ラベル（例: "クリティカルリスク", "Unsafe Taint Flow"） */
  label: string;
  /** 計算式の説明（例: "-5点 x 21件"） */
  calculation: string;
  /** 減点数（負の値） */
  deduction: number;
}
```

### ReportDimension (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportDimension {
  name: string;         // 例: "テスト意図実現度", "セキュリティリスク"
  score: number;        // 100点満点のスコア
  weight: number;       // 総合スコアへの寄与度 (0.0 ~ 1.0)
  impact: number;       // 総合スコアへの実際の影響点 (score * weight)
  breakdown: ScoreBreakdown[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportDimension {
  name: string;         // 例: "テスト意図実現度", "セキュリティリスク"
  score: number;        // 100点満点のスコア
  weight: number;       // 総合スコアへの寄与度 (0.0 ~ 1.0)
  impact: number;       // 総合スコアへの実際の影響点 (score * weight)
  breakdown: ScoreBreakdown[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportDimension {
  /** ディメンション名（例: "テスト意図実現度", "セキュリティリスク"） */
  name: string;
  /** 100点満点のスコア */
  score: number;
  /** 総合スコアへの寄与度 (0.0 ~ 1.0) */
  weight: number;
  /** 総合スコアへの実際の影響点 (score * weight) */
  impact: number;
  /** スコアの内訳 */
  breakdown: ScoreBreakdown[];
}
```

### ExecutiveSummary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExecutiveSummary {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: ReportDimension[];
  statistics: {
    totalFiles: number;
    totalTests: number;
    totalIssues?: number; // 後方互換性のためオプショナル
    riskCounts: Record<RiskLevel, number>; // { CRITICAL: 5, HIGH: 12, ... }
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExecutiveSummary {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: ReportDimension[];
  statistics: {
    totalFiles: number;
    totalTests: number;
    totalIssues?: number; // 後方互換性のためオプショナル
    riskCounts: Record<RiskLevel, number>; // { CRITICAL: 5, HIGH: 12, ... }
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExecutiveSummary {
  /** 総合スコア（100点満点） */
  overallScore: number;
  /** 総合評価グレード */
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 評価ディメンションの詳細 */
  dimensions: ReportDimension[];
  /** 統計情報 */
  statistics: {
    /** 分析対象ファイル総数 */
    totalFiles: number;
    /** テストファイル総数 */
    totalTests: number;
    /** リスクレベル別の件数 */
    riskCounts: Record<RiskLevel, number>;
  };
}
```

### DetailedIssue (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedIssue {
  filePath: string;
  startLine: number;
  endLine: number;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  type?: string;
  severity?: string;
  message?: string;
  category?: string;
  contextSnippet?: string; 
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedIssue extends Issue {
    // リスク情報の追加
    riskLevel: RiskLevel;
    title: string;
    
    // コンテキスト情報
    contextSnippet?: string;
    relatedFiles?: string[];
    
    // 統計情報
    occurrences?: number;
    firstDetected?: Date;
    lastDetected?: Date;
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedIssue {
  filePath: string;
  startLine: number;
  endLine: number;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  type?: string;
  severity?: string;
  message?: string;
  category?: string;
  contextSnippet?: string; 
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedIssue {
  /** 問題が発生しているファイルパス */
  filePath: string;
  /** 問題の開始行番号 */
  startLine: number;
  /** 問題の終了行番号 */
  endLine: number;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** 問題のタイトル */
  title: string;
  /** 問題の詳細説明 */
  description: string;
  /** コードスニペット（オプション） */
  contextSnippet?: string;
}
```

### AIActionableRisk (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIActionableRisk {
  id?: string; // 後方互換性のためオプショナル（riskIdと同じ値）
  riskId: string; // 安定した一意のID
  filePath: string;
  riskLevel: RiskLevel;
  title: string;
  problem: string; // AI向けの問題説明
  context: {
    codeSnippet: string;
    startLine: number;
    endLine: number;
  };
  suggestedAction: {
    type: AIActionType;
    description: string;
    example?: string; // 具体的なコード例
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIActionableRisk {
  id?: string; // 後方互換性のためオプショナル（riskIdと同じ値）
  riskId: string; // 安定した一意のID
  filePath: string;
  riskLevel: RiskLevel;
  title: string;
  problem: string; // AI向けの問題説明
  context: {
    codeSnippet: string;
    startLine: number;
    endLine: number;
  };
  suggestedAction: {
    type: AIActionType;
    description: string;
    example?: string; // 具体的なコード例
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIActionableRisk {
  /** 安定した一意のリスクID */
  riskId: string;
  /** リスクが存在するファイルパス */
  filePath: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** リスクのタイトル */
  title: string;
  /** AI向けの問題説明 */
  problem: string;
  /** コード文脈情報 */
  context: {
    /** 関連するコードスニペット */
    codeSnippet: string;
    /** 開始行番号 */
    startLine: number;
    /** 終了行番号 */
    endLine: number;
  };
  /** 推奨されるアクション */
  suggestedAction: {
    /** アクションタイプ */
    type: AIActionType;
    /** アクションの説明 */
    description: string;
    /** 具体的なコード例（オプション） */
    example?: string;
  };
}
```

### UnifiedAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAnalysisResult {
  schemaVersion: "1.0";
  summary: ExecutiveSummary;
  detailedIssues: DetailedIssue[]; // 人間向けレポート用の全問題リスト
  aiKeyRisks: AIActionableRisk[];  // AI向けの優先順位付き問題リスト
}
```

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAnalysisResult {
  basicAnalysis: BasicAnalysisResult;
  qualityAnalysis?: QualityAnalysisResult;
  combinedScore?: QualityScore;
  allIssues: Issue[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAnalysisResult {
  legacyIssues: Issue[];
  qualityResults: QualityAnalysisResult;
  combinedScore?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAnalysisResult {
  schemaVersion: "1.0";
  summary: ExecutiveSummary;
  detailedIssues: DetailedIssue[]; // 人間向けレポート用の全問題リスト
  aiKeyRisks: AIActionableRisk[];  // AI向けの優先順位付き問題リスト
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/unified-analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAnalysisResult {
  /** スキーマバージョン */
  schemaVersion: '1.0';
  /** エグゼクティブサマリー */
  summary: ExecutiveSummary;
  /** 人間向けレポート用の全問題リスト */
  detailedIssues: DetailedIssue[];
  /** AI向けの優先順位付き問題リスト */
  aiKeyRisks: AIActionableRisk[];
}
```

### UnifiedAIFormatterOptions (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAIFormatterOptions {
  // レポートの出力先パス
  reportPath?: string;
  
  // 最大リスク数（デフォルト: 10）
  maxRisks?: number;
  
  // 含めるリスクレベル
  includeRiskLevels?: string[];
  
  // 実際のHTMLレポートパス (Issue #58)
  htmlReportPath?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter-base.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAIFormatterOptions {
  maxRisks?: number;
  includeRecommendations?: boolean;
  includeContext?: boolean;
  reportPath?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAIFormatterOptions {
  // レポートの出力先パス
  reportPath?: string;
  
  // 最大リスク数（デフォルト: 10）
  maxRisks?: number;
  
  // 含めるリスクレベル
  includeRiskLevels?: string[];
  
  // 実際のHTMLレポートパス (Issue #58)
  htmlReportPath?: string;
}
```

### AIOutputError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOutputError extends Error {
  code: 'CONTEXT_EXTRACTION_FAILED' | 'FORMAT_GENERATION_FAILED' | 'SIZE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED';
  details?: any;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOutputError extends Error {
  code: 'CONTEXT_EXTRACTION_FAILED' | 'FORMAT_GENERATION_FAILED' | 'SIZE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED';
  details?: any;
}
```

### RiskAssessment (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter-base.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  problem?: string;
  impact: string;
  likelihood: number;
  mitigation?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
    // リスクレベルと分類
    riskLevel: RiskLevel;
    category: string;
    
    // リスクの説明
    description: string;
    problem?: string;
    title?: string;
    
    // リスク評価指標
    impact: string | number;
    likelihood: number; // 0.0 - 1.0
    score?: number; // リスクスコア
    
    // 対策
    mitigation?: string;
    mitigationStatus?: 'none' | 'partial' | 'comprehensive';
    
    // 追加情報
    affectedFiles?: string[];
    estimatedEffort?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type RiskAssessment = CoreTypes.RiskAssessment;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  problem?: string;
  impact: string;
  likelihood: number;
  mitigation?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
  /**
   * テストカバレッジ不足のリスク
   */
  coverageRisk: 'high' | 'medium' | 'low';
  
  /**
   * ビジネスロジック複雑度のリスク
   */
  complexityRisk: 'high' | 'medium' | 'low';
  
  /**
   * 変更頻度に基づくリスク
   */
  changeRisk: 'high' | 'medium' | 'low';
  
  /**
   * 総合リスクスコア（0-100）
   */
  overallRiskScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
  /** 評価ID */
  id: string;
  /** 評価名 */
  name: string;
  /** 脅威源リスト */
  threatSources: ThreatSource[];
  /** 脅威イベントリスト */
  threatEvents: ThreatEvent[];
  /** 脆弱性リスト */
  vulnerabilities: Vulnerability[];
  /** コントロールの有効性（0.0-1.0） */
  controlEffectiveness: number;
  /** 評価日時（オプション） */
  assessmentDate?: Date;
  /** 評価者（オプション） */
  assessor?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStatus: 'none' | 'partial' | 'comprehensive';
  residualRisk: 'low' | 'medium' | 'high';
}
```

### UnifiedAIOutput (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter-base.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAIOutput {
  keyRisks: RiskAssessment[];
  recommendations?: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  context?: any;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedAIOutput {
  keyRisks: RiskAssessment[];
  recommendations?: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  context?: any;
}
```

### FormatterStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FormatterStrategy {
  name: string;
  format(result: any, options?: any): any;
  formatAsync?(result: any, options?: any): Promise<any>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FormatterStrategy {
  name: string;
  format(result: any, options?: any): any;
  formatAsync?(result: any, options?: any): Promise<any>;
}
```

### ImportLocation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportLocation {
  file: string;
  line: number;
  column?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/usage-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportLocation {
  file: string;
  line: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportLocation {
  file: string;
  line: number;
  column?: number;
}
```

### ImportDepthResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportDepthResult {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    path: string;
    depth: number;
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportDepthResult {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    path: string;
    depth: number;
  }>;
}
```

### UsageCategory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageCategory {
  core: string[];
  peripheral: string[];
  unused: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/usage-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageCategory {
  core: string[];        // 頻繁に使用される中核的な依存関係
  peripheral: string[];  // たまに使用される周辺的な依存関係
  unused: string[];      // 使用されていない依存関係
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageCategory {
  core: string[];
  peripheral: string[];
  unused: string[];
}
```

### UsageReport (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageReport {
  summary: {
    totalPackages: number;
    usedPackages: number;
    unusedPackages: number;
  };
  frequency: Map<string, number>;
  categories: UsageCategory;
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/usage-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageReport {
  totalPackages: number;
  usageStatistics: Array<{
    package: string;
    frequency: number;
    percentage: number;
    locations?: ImportLocation[];
  }>;
  categories?: UsageCategory;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UsageReport {
  summary: {
    totalPackages: number;
    usedPackages: number;
    unusedPackages: number;
  };
  frequency: Map<string, number>;
  categories: UsageCategory;
  recommendations: string[];
}
```

### PackageAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/package-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageAnalysisResult {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDependencies: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageAnalysisResult {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDependencies: string[];
}
```

### VersionConstraintResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/package-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VersionConstraintResult {
  package: string;
  constraint: string;
  type: 'exact' | 'caret' | 'tilde' | 'range' | 'any';
  isRisky: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VersionConstraintResult {
  package: string;
  constraint: string;
  type: 'exact' | 'caret' | 'tilde' | 'range' | 'any';
  isRisky: boolean;
}
```

### ImportDepthAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/usage-analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportDepthAnalysis {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    file: string;
    depth: number;
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImportDepthAnalysis {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    file: string;
    depth: number;
  }>;
}
```

### VersionConstraint (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VersionConstraint {
  package: string;
  declaredVersion: string;
  installedVersion?: string;
  constraint: 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard';
  hasVulnerability?: boolean;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VersionConstraint {
  package: string;
  declaredVersion: string;
  installedVersion?: string;
  constraint: 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard';
  hasVulnerability?: boolean;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VersionConstraint {
  package: string;
  declaredVersion: string;
  installedVersion?: string;
  constraint: 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard';
  hasVulnerability?: boolean;
  suggestion?: string;
}
```

### PackageLockDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageLockDependency {
  version: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  requires?: Record<string, string>;
  dependencies?: Record<string, PackageLockDependency>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageLockDependency {
  version: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  requires?: Record<string, string>;
  dependencies?: Record<string, PackageLockDependency>;
}
```

### PackageLockJson (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  requires?: boolean;
  packages?: Record<string, PackageLockDependency>;
  dependencies?: Record<string, PackageLockDependency>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  requires?: boolean;
  packages?: Record<string, PackageLockDependency>;
  dependencies?: Record<string, PackageLockDependency>;
}
```

### YarnLockEntry (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface YarnLockEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: Record<string, string>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface YarnLockEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: Record<string, string>;
}
```

### NpmShrinkwrap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NpmShrinkwrap extends PackageLockJson {
  // npm-shrinkwrapはpackage-lock.jsonと同じ構造
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NpmShrinkwrap extends PackageLockJson {
  // npm-shrinkwrapはpackage-lock.jsonと同じ構造
}
```

### ExtendedPackageJson (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedPackageJson extends PackageJsonConfig {
  // 追加フィールドがある場合はここに定義
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedPackageJson extends PackageJsonConfig {
  // 追加フィールドがある場合はここに定義
}
```

### DependencyVersion (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyVersion {
  current: string;
  wanted?: string;
  latest?: string;
  location?: string;
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyVersion {
  current: string;
  wanted?: string;
  latest?: string;
  location?: string;
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
}
```

### DependencyUsageInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyUsageInfo {
  package: string;
  usedIn: string[];
  importCount: number;
  isDev: boolean;
  isOptional: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyUsageInfo {
  package: string;
  usedIn: string[];
  importCount: number;
  isDev: boolean;
  isOptional: boolean;
}
```

### AntiPattern (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/PatternDetector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
  message?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  recommendation: string;
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
  message?: string;
}
```

### DesignPattern (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/PatternDetector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DesignPattern {
  name: string;
  type: string;
  confidence: number;
  location: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DesignPattern {
  type: string;
  confidence: number;
  location: string;
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DesignPattern {
  name: string;
  type: string;
  confidence: number;
  location: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/InsecureDesignPlugin.ts
- 種別: interface
- エクスポート: internal
```typescript
interface DesignPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### PatternAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternAnalysis {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  score: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternAnalysis {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  score: number;
}
```

### PatternRecommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternRecommendation {
  pattern: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternRecommendation {
  pattern: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
}
```

### PatternReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternReport {
  summary: {
    totalDesignPatterns: number;
    totalAntiPatterns: number;
    overallScore: number;
    grade: string;
  };
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  metrics: {
    patternDiversity: number;
    antiPatternSeverity: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PatternReport {
  summary: {
    totalDesignPatterns: number;
    totalAntiPatterns: number;
    overallScore: number;
    grade: string;
  };
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  metrics: {
    patternDiversity: number;
    antiPatternSeverity: number;
  };
}
```

### AnalysisOptions (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  includeImports?: boolean;
  includeExports?: boolean;
  analyzeFunctions?: boolean;
  analyzeClasses?: boolean;
  analyzeInterfaces?: boolean;
  analyzeVariables?: boolean;
  analyzeScopes?: boolean;
  detectRelatedFiles?: boolean;
  contextLines?: number;
  maxRelatedFiles?: number;
  includeTests?: boolean;
  includeServices?: boolean;
  analyzeDependencies?: boolean;
  includeTransitiveDeps?: boolean;
  includeSiblings?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  timeout?: number;
  skipPlugins?: string[];
  parallelExecution?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  timeout?: number;
  skipPlugins?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  parallel?: boolean;
  cache?: boolean;
  concurrency?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  // File patterns
  includePatterns?: string[];
  excludePatterns?: string[];
  
  // Analysis depth
  maxDepth?: number;
  followSymlinks?: boolean;
  
  // Performance options
  parallel?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  
  // Caching
  useCache?: boolean;
  cacheDir?: string;
  cacheTTL?: number;
  
  // Output options
  verbose?: boolean;
  quiet?: boolean;
  format?: 'json' | 'text' | 'html' | 'markdown';
  outputFile?: string;
  
  // Plugin options
  enabledPlugins?: string[];
  disabledPlugins?: string[];
  pluginConfig?: Record<string, unknown>;
  
  // Security options
  enableSecurityChecks?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'paranoid';
  
  // Quality thresholds
  minQualityScore?: number;
  maxIssues?: number;
  failOnWarnings?: boolean;
  
  // Custom options
  customOptions?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  includeImports?: boolean;
  includeExports?: boolean;
  analyzeFunctions?: boolean;
  analyzeClasses?: boolean;
  analyzeInterfaces?: boolean;
  analyzeVariables?: boolean;
  analyzeScopes?: boolean;
  detectRelatedFiles?: boolean;
  contextLines?: number;
  maxRelatedFiles?: number;
  includeTests?: boolean;
  includeServices?: boolean;
  analyzeDependencies?: boolean;
  includeTransitiveDeps?: boolean;
  includeSiblings?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  interprocedural: boolean;
  contextSensitive: boolean;
  pathSensitive: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisOptions {
  enableTaintAnalysis?: boolean;
  enableTypeAnalysis?: boolean;
  enableFlowAnalysis?: boolean;
  maxPathLength?: number;
  timeout?: number;
}
```

### ExtractedCodeContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtractedCodeContext {
  // 基本情報
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 周辺コード
  surroundingCode: {
    before: string;
    after: string;
  };
  
  // インポート/エクスポート
  imports: Array<{ source: string }>;
  exports: string[];
  
  // 構造情報
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  variables: VariableInfo[];
  scopes: ScopeInfo[];
  
  // 関連ファイル
  relatedFiles: RelatedFileInfo[];
  
  // 使用されているAPI/ライブラリ
  usedAPIs: string[];
  
  // 言語
  language: string;
  
  // 依存関係
  dependencies: {
    dependencies: string[];
    dependents: string[];
  };
  
  // メタデータ
  metadata: {
    language: string;
    fileSize: number;
    analysisTime: number;
    confidence: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtractedCodeContext {
  // 基本情報
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 周辺コード
  surroundingCode: {
    before: string;
    after: string;
  };
  
  // インポート/エクスポート
  imports: Array<{ source: string }>;
  exports: string[];
  
  // 構造情報
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  variables: VariableInfo[];
  scopes: ScopeInfo[];
  
  // 関連ファイル
  relatedFiles: RelatedFileInfo[];
  
  // 使用されているAPI/ライブラリ
  usedAPIs: string[];
  
  // 言語
  language: string;
  
  // 依存関係
  dependencies: {
    dependencies: string[];
    dependents: string[];
  };
  
  // メタデータ
  metadata: {
    language: string;
    fileSize: number;
    analysisTime: number;
    confidence: number;
  };
}
```

### FunctionInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  documentation?: string;
  complexity?: number;
  calls: string[]; // 呼び出している関数
  calledBy: string[]; // この関数を呼び出している関数
  variables?: string[]; // 関数内で定義されている変数
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  documentation?: string;
  complexity?: number;
  calls: string[]; // 呼び出している関数
  calledBy: string[]; // この関数を呼び出している関数
  variables?: string[]; // 関数内で定義されている変数
}
```

### ClassInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: string[];
  properties: string[];
  extends?: string;
  implements: string[];
  isExported: boolean;
  documentation?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: string[];
  properties: string[];
  extends?: string;
  implements: string[];
  isExported: boolean;
  documentation?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassInfo {
  name: string;
  package?: string;
  methods: MethodInfo[];
  fields?: FieldInfo[];
  annotations?: string[];
}
```

### InterfaceInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InterfaceInfo {
  name: string;
  startLine: number;
  endLine: number;
  properties: string[];
  methods: string[];
  extends: string[];
  isExported: boolean;
  documentation?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InterfaceInfo {
  name: string;
  startLine: number;
  endLine: number;
  properties: string[];
  methods: string[];
  extends: string[];
  isExported: boolean;
  documentation?: string;
}
```

### VariableInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableInfo {
  name: string;
  type?: string;
  scope: string;
  line: number;
  isConst: boolean;
  isExported: boolean;
  usage: VariableUsage[];
  kind?: 'const' | 'let' | 'var';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableInfo {
  name: string;
  type?: string;
  scope: string;
  line: number;
  isConst: boolean;
  isExported: boolean;
  usage: VariableUsage[];
  kind?: 'const' | 'let' | 'var';
}
```

### VariableUsage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableUsage {
  line: number;
  type: 'read' | 'write' | 'declaration';
  context: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableUsage {
  line: number;
  type: 'read' | 'write' | 'declaration';
  context: string;
}
```

### ScopeInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScopeInfo {
  type: 'global' | 'function' | 'class' | 'block' | 'module';
  startLine: number;
  endLine: number;
  variables: string[];
  parent?: ScopeInfo;
  children: ScopeInfo[];
  functions?: string[];
  level?: number;
  parentScope?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScopeInfo {
  type: 'global' | 'function' | 'class' | 'block' | 'module';
  startLine: number;
  endLine: number;
  variables: string[];
  parent?: ScopeInfo;
  children: ScopeInfo[];
  functions?: string[];
  level?: number;
  parentScope?: string;
}
```

### RelatedFileInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RelatedFileInfo {
  path: string;
  relationship: 'import' | 'export' | 'test' | 'similar' | 'dependency' | 'sibling';
  confidence: number;
  reason: string;
  size?: number;
  lastModified?: Date;
  language?: string;
  similarity?: number;
  exports?: string[];
  functions?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RelatedFileInfo {
  path: string;
  relationship: 'import' | 'export' | 'test' | 'similar' | 'dependency' | 'sibling';
  confidence: number;
  reason: string;
  size?: number;
  lastModified?: Date;
  language?: string;
  similarity?: number;
  exports?: string[];
  functions?: string[];
}
```

### DependencyAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyAnalysis {
  projectDependencies: ProjectDependency[];
  fileDependencies: FileDependency[];
  cyclicDependencies: CyclicDependency[];
  unusedDependencies: string[];
  missingDependencies: string[];
  devDependencies: ProjectDependency[];
  peerDependencies: ProjectDependency[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyAnalysis {
  projectDependencies: ProjectDependency[];
  fileDependencies: FileDependency[];
  cyclicDependencies: CyclicDependency[];
  unusedDependencies: string[];
  missingDependencies: string[];
  devDependencies: ProjectDependency[];
  peerDependencies: ProjectDependency[];
}
```

### ProjectDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectDependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  installedVersion?: string;
  description?: string;
  homepage?: string;
  license?: string;
  usage: DependencyUsage[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectDependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  installedVersion?: string;
  description?: string;
  homepage?: string;
  license?: string;
  usage: DependencyUsage[];
}
```

### DependencyUsage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyUsage {
  file: string;
  imports: string[];
  line: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyUsage {
  file: string;
  imports: string[];
  line: number;
}
```

### FileDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileDependency {
  file: string;
  imports: string[];
  exports: string[];
  dependsOn: string[];
  dependedBy: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileDependency {
  file: string;
  imports: string[];
  exports: string[];
  dependsOn: string[];
  dependedBy: string[];
}
```

### CyclicDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CyclicDependency {
  files: string[];
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CyclicDependency {
  files: string[];
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}
```

### ProjectStructure (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectStructure {
  overview: ProjectOverview;
  directories: DirectoryInfo[];
  architecture: ArchitecturePattern;
  conventions: NamingConventions;
  metrics: ProjectMetrics;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectStructure {
  overview: ProjectOverview;
  directories: DirectoryInfo[];
  architecture: ArchitecturePattern;
  conventions: NamingConventions;
  metrics: ProjectMetrics;
}
```

### ProjectOverview (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectOverview {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  languages: LanguageDistribution[];
  frameworks: DetectedFramework[];
  testingFrameworks: DetectedFramework[];
  buildTools: DetectedFramework[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectOverview {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  languages: LanguageDistribution[];
  frameworks: DetectedFramework[];
  testingFrameworks: DetectedFramework[];
  buildTools: DetectedFramework[];
}
```

### LanguageDistribution (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LanguageDistribution {
  language: string;
  fileCount: number;
  percentage: number;
  extensions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LanguageDistribution {
  language: string;
  fileCount: number;
  percentage: number;
  extensions: string[];
}
```

### DetectedFramework (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetectedFramework {
  name: string;
  version?: string;
  confidence: number;
  evidence: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetectedFramework {
  name: string;
  version?: string;
  confidence: number;
  evidence: string[];
}
```

### DirectoryInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DirectoryInfo {
  path: string;
  purpose: DirectoryPurpose;
  fileCount: number;
  subdirectories: string[];
  patterns: string[];
  conventions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DirectoryInfo {
  path: string;
  purpose: DirectoryPurpose;
  fileCount: number;
  subdirectories: string[];
  patterns: string[];
  conventions: string[];
}
```

### DirectoryPurpose (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DirectoryPurpose = 
  | 'source' 
  | 'test' 
  | 'build' 
  | 'config' 
  | 'documentation' 
  | 'assets' 
  | 'vendor' 
  | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DirectoryPurpose = 
  | 'source' 
  | 'test' 
  | 'build' 
  | 'config' 
  | 'documentation' 
  | 'assets' 
  | 'vendor' 
  | 'unknown';
```

### ArchitecturePattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number;
  evidence: string[];
  suggestions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number;
  evidence: string[];
  suggestions: string[];
}
```

### ArchitectureType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ArchitectureType = 
  | 'mvc' 
  | 'mvvm' 
  | 'microservices' 
  | 'layered' 
  | 'clean' 
  | 'hexagonal' 
  | 'modular' 
  | 'monolithic' 
  | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ArchitectureType = 
  | 'mvc' 
  | 'mvvm' 
  | 'microservices' 
  | 'layered' 
  | 'clean' 
  | 'hexagonal' 
  | 'modular' 
  | 'monolithic' 
  | 'unknown';
```

### NamingConventions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NamingConventions {
  files: FileNamingConvention;
  directories: DirectoryNamingConvention;
  variables: VariableNamingConvention;
  functions: FunctionNamingConvention;
  classes: ClassNamingConvention;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NamingConventions {
  files: FileNamingConvention;
  directories: DirectoryNamingConvention;
  variables: VariableNamingConvention;
  functions: FunctionNamingConvention;
  classes: ClassNamingConvention;
}
```

### FileNamingConvention (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

### DirectoryNamingConvention (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DirectoryNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DirectoryNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

### VariableNamingConvention (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VariableNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

### FunctionNamingConvention (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FunctionNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FunctionNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

### ClassNamingConvention (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}
```

### NamingPattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type NamingPattern = 
  | 'camelCase' 
  | 'PascalCase' 
  | 'snake_case' 
  | 'kebab-case' 
  | 'SCREAMING_SNAKE_CASE' 
  | 'mixed' 
  | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type NamingPattern = 
  | 'camelCase' 
  | 'PascalCase' 
  | 'snake_case' 
  | 'kebab-case' 
  | 'SCREAMING_SNAKE_CASE' 
  | 'mixed' 
  | 'unknown';
```

### ProjectMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testability: TestabilityMetrics;
  documentation: DocumentationMetrics;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testability: TestabilityMetrics;
  documentation: DocumentationMetrics;
}
```

### ComplexityMetrics (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxComplexity: number;
  complexFiles: string[];
  totalFunctions: number;
  averageFunctionLength: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxComplexity: number;
  complexFiles: string[];
  totalFunctions: number;
  averageFunctionLength: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
}
```

### MaintainabilityMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  duplicatedCodePercentage: number;
  averageFileSize: number;
  largeFiles: string[];
  longFunctions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  duplicatedCodePercentage: number;
  averageFileSize: number;
  largeFiles: string[];
  longFunctions: string[];
}
```

### TestabilityMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestabilityMetrics {
  testCoverage: number;
  testableClasses: number;
  untestableClasses: number;
  mockability: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestabilityMetrics {
  testCoverage: number;
  testableClasses: number;
  untestableClasses: number;
  mockability: number;
}
```

### DocumentationMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DocumentationMetrics {
  documentedFunctions: number;
  documentedClasses: number;
  documentationCoverage: number;
  readmeQuality: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DocumentationMetrics {
  documentedFunctions: number;
  documentedClasses: number;
  documentationCoverage: number;
  readmeQuality: number;
}
```

### ContextOptimizationOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ContextOptimizationOptions {
  maxContextSize: number;
  prioritizeRelevantCode: boolean;
  includeCallStack: boolean;
  analyzeDataFlow: boolean;
  detectPatterns: boolean;
  generateSuggestions: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ContextOptimizationOptions {
  maxContextSize: number;
  prioritizeRelevantCode: boolean;
  includeCallStack: boolean;
  analyzeDataFlow: boolean;
  detectPatterns: boolean;
  generateSuggestions: boolean;
}
```

### AnalysisCache (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisCache {
  fileHash: Map<string, string>;
  contexts: Map<string, unknown>; // IntegratedContext（循環参照を避けるためunknown）
  dependencies: Map<string, DependencyAnalysis>;
  structures: Map<string, ProjectStructure>;
  expiry: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisCache {
  fileHash: Map<string, string>;
  contexts: Map<string, unknown>; // IntegratedContext（循環参照を避けるためunknown）
  dependencies: Map<string, DependencyAnalysis>;
  structures: Map<string, ProjectStructure>;
  expiry: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnalysisCache {
  hash: string;
  result: any;
  timestamp: number;
}
```

### AnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  files?: Array<{
    path: string;
    issues: Issue[];
  }>;
  issues?: Issue[];
  totalIssues?: number;
  summary?: {
    totalFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/analyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  pluginsExecuted?: string[];  // 実行されたプラグインのリスト
  metadata?: {
    parallelProcessed?: boolean;
    cacheUtilized?: boolean;
    filesFromCache?: number;
    filesAnalyzed?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/parallelAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  parallelStats: {
    batchCount: number;
    avgBatchTime: number;
    maxBatchTime: number;
    concurrencyLevel: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  // File information
  filePath: string;
  relativePath?: string;
  
  // Results
  issues: Issue[];
  detectionResults?: DetectionResult[];
  
  // Metrics
  metrics?: FileMetrics;
  
  // Quality assessment (compatible with legacy code)
  score?: QualityScore;
  qualityScore?: number;
  qualityDetails?: QualityDetails;
  
  // Context
  context?: ProjectContext;
  
  // Performance data
  analysisTime?: number;
  pluginTimings?: Record<string, number>;
  
  // Metadata
  timestamp?: Date;
  analyzerId?: string;
  analyzerVersion?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
    // 識別情報
    filePath: string;
    timestamp: Date;
    
    // 検出された問題
    issues: Issue[];
    
    // スコアと評価
    score?: QualityScore;
    riskAssessment?: RiskAssessment;
    
    // メタデータ
    executionTime?: number;
    pluginsUsed?: string[];
    errors?: Array<{
      plugin: string;
      error: string;
    }>;
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  files?: Array<{
    path: string;
    issues: Issue[];
  }>;
  issues?: Issue[];
  totalIssues?: number;
  summary?: {
    totalFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnalysisResult {
  filePath: string;
  issues: Issue[];
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResult {
  /** メソッド名 */
  methodName: string;
  /** 結果 */
  result: MethodAnalysisResult;
  /** エラー（ある場合） */
  error?: string;
}
```

### PluginResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  issues: Issue[];
  score?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  detections?: Detection[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  pluginVersion?: string;
  
  // Results
  detectionResults: DetectionResult[];
  qualityScore: QualityScore;
  improvements: Improvement[];
  
  // Validation
  validation?: ValidationResult;
  
  // Performance
  executionTime: number;
  memoryUsage?: number;
  
  // Errors and warnings
  error?: string;
  errors?: string[];
  warnings?: string[];
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  issues: Issue[];
  score?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  executed: boolean;
  duration?: number;
  issues?: number;
  metadata?: Record<string, any>;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  score: number; // 0-100
  weight: number;
  issues: Issue[];
  metadata?: Record<string, any>;
}
```

### AIOutputOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOutputOptions {
  path: string;
  format?: 'json' | 'markdown';
  output?: string;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  optimizeForAI?: boolean;
  maxTokens?: number;
  maxFileSize?: number;
  verbose?: boolean;
  // 既存のanalyzer設定
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIOutputOptions {
  path: string;
  format?: 'json' | 'markdown';
  output?: string;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  optimizeForAI?: boolean;
  maxTokens?: number;
  maxFileSize?: number;
  verbose?: boolean;
  // 既存のanalyzer設定
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
}
```

### AIRisk (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIRisk {
  problem: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  context: AIRiskContext;
  suggestedAction: AISuggestedAction;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIRisk {
  problem: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  context: AIRiskContext;
  suggestedAction: AISuggestedAction;
}
```

### AIRiskContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIRiskContext {
  filePath: string;
  codeSnippet: string;
  startLine: number;
  endLine: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIRiskContext {
  filePath: string;
  codeSnippet: string;
  startLine: number;
  endLine: number;
}
```

### AISuggestedAction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AISuggestedAction {
  type: string;
  description: string;
  example: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AISuggestedAction {
  type: string;
  description: string;
  example: string;
}
```

### ReportOutput (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportOutput {
  projectPath: string;
  timestamp: string;
  summary: ReportSummary;
  results: ReportResult[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportOutput {
  projectPath: string;
  timestamp: string;
  summary: ReportSummary;
  results: ReportResult[];
}
```

### ReportSummary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportSummary {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportSummary {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TestIntentReporter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportSummary {
  totalFiles: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRealizationScore: number;
}
```

### ReportResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportResult {
  filePath: string;
  issues: Issue[];
  score: number;
  improvements: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  error?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportResult {
  filePath: string;
  issues: Issue[];
  score: number;
  improvements: string[];
}
```

### AnalysisResultWithPlugins (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResultWithPlugins {
  issues: Issue[];
  pluginResults?: Record<string, PluginResult>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisResultWithPlugins {
  issues: Issue[];
  pluginResults?: Record<string, PluginResult>;
}
```

### Detection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Detection {
  patternId: string;
  severity: string;
  location: Location;
  metadata?: {
    source?: string;
    sink?: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Detection {
  patternId: string;
  severity: string;
  location: Location;
  metadata?: {
    source?: string;
    sink?: string;
  };
}
```

### Location (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Location {
  file: string;
  line: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Location {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Location {
  file: string;
  line: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Location {
  line: number;
  column: number;
}
```

### TaintFlowData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlowData {
  id: string;
  source: string;
  sink: string;
  taintLevel: string;
  path: Array<{ file: string; line: number }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlowData {
  id: string;
  source: string;
  sink: string;
  taintLevel: string;
  path: Array<{ file: string; line: number }>;
}
```

### TaintSummaryData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSummaryData {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSummaryData {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}
```

### AnalyzeOptions (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-v0.8.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  
  // v0.8.0 新オプション
  outputJson?: string;      // JSON出力先ファイル
  outputMarkdown?: string;  // Markdown出力先ファイル
  outputHtml?: string;      // HTML出力先ファイル
  outputAiJson?: string;    // AI JSON出力先ファイル (Issue #58)
  annotate?: boolean;       // インラインアノテーション生成
  annotateFormat?: 'inline' | 'block';  // アノテーション形式
  annotateOutput?: string;  // アノテーション出力先ディレクトリ
  preview?: boolean;        // アノテーションプレビューモード
  
  // 既存オプション
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
  clearCache?: boolean;
  showCacheStats?: boolean;
  performance?: boolean;
  showPerformanceReport?: boolean;
  
  // v0.8.0 追加オプション
  severity?: string[];      // フィルタする重要度
  includeDetails?: boolean; // 詳細情報を含む
  includeRecommendations?: boolean; // 推奨事項を含む
}
```

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json';
  parallel?: boolean;       // 並列処理モードの有効化
  batchSize?: number;       // バッチサイズ（並列モード時のみ）
  concurrency?: number;     // 最大同時実行数（並列モード時のみ）
  cache?: boolean;          // キャッシュ機能の有効化
  clearCache?: boolean;     // キャッシュクリア
  showCacheStats?: boolean; // キャッシュ統計の表示
  performance?: boolean;    // パフォーマンス監視の有効化
  showPerformanceReport?: boolean; // パフォーマンスレポートの表示
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  
  // v0.8.0 新オプション
  outputJson?: string;      // JSON出力先ファイル
  outputMarkdown?: string;  // Markdown出力先ファイル
  outputHtml?: string;      // HTML出力先ファイル
  outputAiJson?: string;    // AI JSON出力先ファイル (Issue #58)
  annotate?: boolean;       // インラインアノテーション生成
  annotateFormat?: 'inline' | 'block';  // アノテーション形式
  annotateOutput?: string;  // アノテーション出力先ディレクトリ
  preview?: boolean;        // アノテーションプレビューモード
  
  // 既存オプション
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
  clearCache?: boolean;
  showCacheStats?: boolean;
  performance?: boolean;
  showPerformanceReport?: boolean;
  
  // v0.8.0 追加オプション
  severity?: string[];      // フィルタする重要度
  includeDetails?: boolean; // 詳細情報を含む
  includeRecommendations?: boolean; // 推奨事項を含む
}
```

### JsonOutput (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/analyze.ts
- 種別: interface
- エクスポート: internal
```typescript
interface JsonOutput {
      summary: {
        totalFiles: number;
        issuesFound: number;
        testCoverage: number;
        executionTime?: number;
      };
      issues: unknown[];
      targetPath: string;
      config: {
        targetPath: string;
        enabledPlugins: string[];
        format: string;
        processingMode: string;
      };
      performance?: {
        cacheStats?: unknown;
        parallelStats?: unknown;
        processingMode?: string;
        performanceReport?: unknown;
      };
    }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface JsonOutput {
      summary: {
        totalFiles: number;
        issuesFound: number;
        testCoverage: number;
        executionTime?: number;
      };
      issues: unknown[];
      targetPath: string;
      config: {
        targetPath: string;
        enabledPlugins: string[];
        format: string;
        processingMode: string;
      };
      performance?: {
        cacheStats?: unknown;
        parallelStats?: unknown;
        processingMode?: string;
        performanceReport?: unknown;
      };
    }
```

### DomainAnalyzeOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/domain-analyze.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalyzeOptions {
  /** 分析対象パス */
  path?: string;
  /** 出力フォーマット */
  format?: 'text' | 'json';
  /** 詳細ログ表示 */
  verbose?: boolean;
  /** 対話モード（デフォルト: true） */
  interactive?: boolean;
  /** 出力ディレクトリ */
  output?: string;
  /** 既存のドメイン定義を検証 */
  verify?: boolean;
  /** 最大クラスタ数 */
  maxClusters?: number;
  /** 最小キーワード頻度 */
  minKeywordFrequency?: number;
  /** 除外パターン */
  excludePatterns?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalyzeOptions {
  /** 分析対象パス */
  path?: string;
  /** 出力フォーマット */
  format?: 'text' | 'json';
  /** 詳細ログ表示 */
  verbose?: boolean;
  /** 対話モード（デフォルト: true） */
  interactive?: boolean;
  /** 出力ディレクトリ */
  output?: string;
  /** 既存のドメイン定義を検証 */
  verify?: boolean;
  /** 最大クラスタ数 */
  maxClusters?: number;
  /** 最小キーワード頻度 */
  minKeywordFrequency?: number;
  /** 除外パターン */
  excludePatterns?: string[];
}
```

### IntentAnalyzeOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/intent-analyze.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntentAnalyzeOptions {
  path: string;
  format?: 'text' | 'json' | 'html';
  verbose?: boolean;
  output?: string;
  parallel?: boolean;
  maxWorkers?: number;
  // Phase 2 高度な分析オプション
  withTypes?: boolean;    // 型情報を使った分析
  withDomain?: boolean;   // ドメイン推論を含む分析
  withBusiness?: boolean; // ビジネスロジックマッピングを含む分析
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntentAnalyzeOptions {
  path: string;
  format?: 'text' | 'json' | 'html';
  verbose?: boolean;
  output?: string;
  parallel?: boolean;
  maxWorkers?: number;
  // Phase 2 高度な分析オプション
  withTypes?: boolean;    // 型情報を使った分析
  withDomain?: boolean;   // ドメイン推論を含む分析
  withBusiness?: boolean; // ビジネスロジックマッピングを含む分析
}
```

### TaintAnalysisOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisOptions {
  path: string;
  output: 'text' | 'json' | 'jaif';
  exportJaif?: string;
  generateStubs?: string;
  incremental: boolean;
  maxDepth: number;
  confidence: number;
  libraryBehavior: 'conservative' | 'optimistic';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisOptions {
  path: string;
  output: 'text' | 'json' | 'jaif';
  exportJaif?: string;
  generateStubs?: string;
  incremental: boolean;
  maxDepth: number;
  confidence: number;
  libraryBehavior: 'conservative' | 'optimistic';
}
```

### TaintIssue (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintIssue {
  type: string;
  severity: string;
  message: string;
  location: {
    line: number;
    column: number;
  };
  file?: string;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintIssue {
  type: string;
  severity: string;
  message: string;
  location: {
    line: number;
    column: number;
  };
  file?: string;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/taint-analysis-system.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintIssue {
  type: 'taint-flow' | 'missing-annotation' | 'incompatible-types' | 'analysis-error';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  suggestion?: string;
}
```

### SampleProject (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SampleProject {
  name: string;
  framework: "express" | "react" | "nestjs" | "nextjs" | "fastify";
  rootPath: string;
  testPaths: string[];
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large';
    testCount: number;
    lastValidated: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SampleProject {
  name: string;
  framework: "express" | "react" | "nestjs" | "nextjs" | "fastify";
  rootPath: string;
  testPaths: string[];
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large';
    testCount: number;
    lastValidated: Date;
  };
}
```

### TestCase (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCase {
  name: string;
  file: string;
  content: string;
  metadata: {
    framework: string;
    language: string;
    lastModified: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCase {
  name: string;
  file: string;
  content: string;
  metadata: {
    framework: string;
    language: string;
    lastModified: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestCase {
  name: string;
  file: string;
  content: string;
  metadata: {
    framework: string;
    language: string;
    lastModified: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/test-case.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCase {
  /** テストケース名 */
  name: string;
  /** テストケースのタイプ */
  type: TestCaseType;
  /** ファイル内の行番号 */
  line?: number;
  /** ファイル内の列番号 */
  column?: number;
  /** ネストレベル */
  level?: number;
  /** 親のテストケース名 */
  parent?: string;
  /** スキップされているか */
  skipped?: boolean;
  /** フォーカスされているか（.only） */
  focused?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCase {
  /** テスト名 */
  name: string;
  /** ファイルパス */
  file: string;
  /** テスト内容 */
  content: string;
  /** メタデータ */
  metadata: {
    framework: string;
    language: string;
    lastModified: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/utils/test-file-extractor.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestCase {
  filePath: string;
  content: string;
  methods: string[];
}
```

### FrameworkBreakdown (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FrameworkBreakdown {
  [framework: string]: {
    count: number;
    avgAccuracy: number;
    avgPerformance: number;
    avgSecurityScore: number;
    totalTests?: number;
    passedTests?: number;
    failedTests?: number;
    coverage?: number;
    issues?: Array<{
      type: string;
      severity: string;
      count: number;
    }>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FrameworkBreakdown {
  [framework: string]: {
    count: number;
    avgAccuracy: number;
    avgPerformance: number;
    avgSecurityScore: number;
    totalTests?: number;
    passedTests?: number;
    failedTests?: number;
    coverage?: number;
    issues?: Array<{
      type: string;
      severity: string;
      count: number;
    }>;
  };
}
```

### ValidateCommandOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/cli/commands/validate.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidateCommandOptions {
  /** 検証対象のプロジェクトパス */
  projectPath?: string;
  /** フレームワーク指定 */
  framework?: 'express' | 'react' | 'nestjs' | 'all';
  /** テストケース生成 */
  generateTests?: boolean;
  /** 出力ディレクトリ */
  outputDir?: string;
  /** 詳細レポート生成 */
  detailedReport?: boolean;
  /** パフォーマンス測定 */
  performanceBenchmark?: boolean;
  /** 精度評価 */
  accuracyEvaluation?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidateCommandOptions {
  /** 検証対象のプロジェクトパス */
  projectPath?: string;
  /** フレームワーク指定 */
  framework?: 'express' | 'react' | 'nestjs' | 'all';
  /** テストケース生成 */
  generateTests?: boolean;
  /** 出力ディレクトリ */
  outputDir?: string;
  /** 詳細レポート生成 */
  detailedReport?: boolean;
  /** パフォーマンス測定 */
  performanceBenchmark?: boolean;
  /** 精度評価 */
  accuracyEvaluation?: boolean;
}
```

### BasicAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BasicAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  errors?: Array<{ pluginName: string; error: string }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BasicAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  errors?: Array<{ pluginName: string; error: string }>;
}
```

### ExtendedAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/analyzerExtended.ts
- 種別: type
- エクスポート: exported
```typescript
export type ExtendedAnalysisResult = NewExtendedAnalysisResult;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}
```

### BatchAnalysisSummary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  files: ExtendedAnalysisResult[];
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/analyzerExtended.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;  // 90-100
    good: number;       // 70-89
    fair: number;       // 50-69
    poor: number;       // 0-49
  };
  commonIssues: string[];
  totalRecommendations: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  files: ExtendedAnalysisResult[];
  executionTime: number;
}
```

### QualityAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/UnifiedPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
  aggregatedScore?: QualityScore;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
}
```

### CacheEntry (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheEntry {
  filePath: string;
  fileHash: string;      // ファイル内容のハッシュ値
  fileSize: number;      // ファイルサイズ
  lastModified: number;  // 最終更新時刻（unixタイムスタンプ）
  pluginResults: Record<string, Issue[]>; // プラグイン名 -> 分析結果
  cachedAt: number;      // キャッシュ作成時刻
  accessCount: number;   // アクセス回数（LRU用）
  lastAccessed: number;  // 最終アクセス時刻（LRU用）
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheEntry {
  filePath: string;
  fileHash: string;      // ファイル内容のハッシュ値
  fileSize: number;      // ファイルサイズ
  lastModified: number;  // 最終更新時刻（unixタイムスタンプ）
  pluginResults: Record<string, Issue[]>; // プラグイン名 -> 分析結果
  cachedAt: number;      // キャッシュ作成時刻
  accessCount: number;   // アクセス回数（LRU用）
  lastAccessed: number;  // 最終アクセス時刻（LRU用）
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CacheEntry {
  ast: ASTNode;
  metadata: ChunkMetadata;
  contentHash: string;
  timestamp: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TreeSitterParser.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CacheEntry {
  ast: ASTNode;
  contentHash: string;
  timestamp: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/cache/ReportCache.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
  ttl: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/strategies/CachingStrategy.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CacheEntry {
  key: string;
  value: string | object;
  timestamp: number;
  hits: number;
}
```

### CacheStatistics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheStatistics {
  totalEntries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  totalSizeBytes: number;
  avgFileSize: number;
  oldestEntry: number;
  newestEntry: number;
  evictions?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheStatistics {
  totalEntries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  totalSizeBytes: number;
  avgFileSize: number;
  oldestEntry: number;
  newestEntry: number;
  evictions?: number;
}
```

### CacheOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheOptions {
  enabled?: boolean;             // キャッシュ有効化フラグ
  maxEntries?: number;           // 最大エントリ数（デフォルト: 1000）
  maxSizeBytes?: number;         // 最大サイズ（バイト、デフォルト: 50MB）
  ttlMs?: number;                // TTL（ミリ秒、デフォルト: 1時間）
  persistToDisk?: boolean;       // ディスクへの永続化
  cacheDirectory?: string;       // キャッシュディレクトリ
  compressionEnabled?: boolean;  // 圧縮の有効化
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheOptions {
  enabled?: boolean;             // キャッシュ有効化フラグ
  maxEntries?: number;           // 最大エントリ数（デフォルト: 1000）
  maxSizeBytes?: number;         // 最大サイズ（バイト、デフォルト: 50MB）
  ttlMs?: number;                // TTL（ミリ秒、デフォルト: 1時間）
  persistToDisk?: boolean;       // ディスクへの永続化
  cacheDirectory?: string;       // キャッシュディレクトリ
  compressionEnabled?: boolean;  // 圧縮の有効化
}
```

### CachedAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CachedAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  cacheStats: {
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    filesFromCache: number;
    filesAnalyzed: number;
  };
  performanceReport?: PerformanceReport;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CachedAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  cacheStats: {
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    filesFromCache: number;
    filesAnalyzed: number;
  };
  performanceReport?: PerformanceReport;
}
```

### CachedAnalysisOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CachedAnalysisOptions {
  enableCache?: boolean;
  cacheOptions?: {
    maxEntries?: number;
    maxSizeBytes?: number;
    ttlMs?: number;
  };
  showCacheStats?: boolean;
  enablePerformanceMonitoring?: boolean;
  showPerformanceReport?: boolean;
  maxCacheSize?: number;  // 後方互換性のため
  autoEviction?: boolean; // 後方互換性のため
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CachedAnalysisOptions {
  enableCache?: boolean;
  cacheOptions?: {
    maxEntries?: number;
    maxSizeBytes?: number;
    ttlMs?: number;
  };
  showCacheStats?: boolean;
  enablePerformanceMonitoring?: boolean;
  showPerformanceReport?: boolean;
  maxCacheSize?: number;  // 後方互換性のため
  autoEviction?: boolean; // 後方互換性のため
}
```

### PluginManager (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PluginManager {
    getRegisteredPlugins(): IPlugin[];
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PluginManager {
    getRegisteredPlugins(): IPlugin[];
  }
```

### PluginConfig (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
  priority?: number;  // プラグイン実行優先度（高いほど先に実行）
  [key: string]: unknown; // 動的プロパティサポート（型安全性向上）
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginConfig {
  // Configuration schema
  schema?: ConfigSchema;
  
  // Default values
  defaults?: Record<string, unknown>;
  
  // Validation rules
  validation?: ValidationRule[];
  
  // Environment variables
  env?: Record<string, string>;
  
  // Feature flags
  features?: Record<string, boolean>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
  priority?: number;  // プラグイン実行優先度（高いほど先に実行）
  [key: string]: unknown; // 動的プロパティサポート（型安全性向上）
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/plugin-config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginConfig {
  /** プラグインの有効/無効 */
  enabled?: boolean;
  /** 実行優先度（数値が大きいほど優先） */
  priority?: number;
  /** タイムアウト時間（ミリ秒） */
  timeout?: number;
  /** 詳細ログ出力 */
  verbose?: boolean;
  /** プラグイン固有のオプション */
  options?: Record<string, unknown>;
}
```

### PluginMetadata (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginMetadata {
  name: string;
  displayName?: string;
  description?: string;
  defaultConfig: PluginConfig;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: 'core' | 'framework' | 'domain' | 'legacy';
  tags: string[];
  author?: string;
  
  // 設定パラメータ
  parameters: PluginParameter[];
  
  // 依存関係
  dependencies: PluginDependency[];
  
  // パフォーマンス情報
  performance: {
    estimatedTimePerFile: number; // ミリ秒
    memoryUsage: 'low' | 'medium' | 'high';
    recommendedBatchSize?: number;
  };
  
  // 対象ファイル
  targetFiles: {
    include: string[];  // glob patterns
    exclude: string[];  // glob patterns
  };
  
  // 出力情報
  issueTypes: {
    type: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
  }[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginMetadata extends BaseMetadata {
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  description?: string;
  documentation?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: {
    node?: string;
    rimor?: string;
  };
  config?: PluginConfig;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginMetadata {
  name: string;
  displayName?: string;
  description?: string;
  defaultConfig: PluginConfig;
}
```

### RimorConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RimorConfig {
  excludePatterns?: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
    reportDir?: string;  // レポート出力ディレクトリ（デフォルト: .rimor/reports/）
  };
  metadata?: {
    generatedAt?: string;
    preset?: string;
    targetEnvironment?: string;
    pluginCount?: number;
    estimatedExecutionTime?: number;
  };
  scoring?: {
    enabled?: boolean;
    weights?: {
      plugins?: Record<string, number>;
      dimensions?: {
        completeness?: number;
        correctness?: number;
        maintainability?: number;
        performance?: number;
        security?: number;
      };
      fileTypes?: Record<string, number>;
    };
    gradeThresholds?: {
      A?: number;
      B?: number;
      C?: number;
      D?: number;
      F?: number;
    };
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RimorConfig {
  excludePatterns?: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
    reportDir?: string;  // レポート出力ディレクトリ（デフォルト: .rimor/reports/）
  };
  metadata?: {
    generatedAt?: string;
    preset?: string;
    targetEnvironment?: string;
    pluginCount?: number;
    estimatedExecutionTime?: number;
  };
  scoring?: {
    enabled?: boolean;
    weights?: {
      plugins?: Record<string, number>;
      dimensions?: {
        completeness?: number;
        correctness?: number;
        maintainability?: number;
        performance?: number;
        security?: number;
      };
      fileTypes?: Record<string, number>;
    };
    gradeThresholds?: {
      A?: number;
      B?: number;
      C?: number;
      D?: number;
      F?: number;
    };
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
}
```

### ASTInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/engine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTInfo {
  fileName: string;
  sourceFile: ts.SourceFile;
  program?: ts.Program;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTInfo {
  fileName: string;
  sourceFile: ts.SourceFile;
  program?: ts.Program;
}
```

### ASTNode (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: ASTNode[];
  isNamed?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTNode {
  type: string;
  kind?: string | number; // TypeScript AST kind
  startPosition: Position;
  endPosition: Position;
  children?: ASTNode[];
  value?: string | number | boolean | null;
  name?: string;
  text?: string;
  params?: ASTNode[];
  body?: ASTNode | ASTNode[];
  properties?: Record<string, unknown>;
  flags?: number;
  modifiers?: ASTNode[];
  decorators?: ASTNode[];
  typeParameters?: ASTNode[];
  typeArguments?: ASTNode[];
  parent?: ASTNode;
  symbol?: {
    name: string;
    flags: number;
    declarations?: unknown[];
  };
  [key: string]: unknown; // Allow additional AST properties
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: ASTNode[];
  isNamed?: boolean;
}
```

### IAnalysisEngine (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IAnalysisEngine {
  /**
   * 指定されたパスを分析
   */
  analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * AST生成（v0.9.0: Tree-sitter対応）
   */
  generateAST(filePath: string): Promise<ASTNode>;
  
  /**
   * キャッシュのクリア
   */
  clearCache?(): Promise<void>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IAnalysisEngine {
  /**
   * 指定されたパスを分析
   */
  analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * AST生成（v0.9.0: Tree-sitter対応）
   */
  generateAST(filePath: string): Promise<ASTNode>;
  
  /**
   * キャッシュのクリア
   */
  clearCache?(): Promise<void>;
}
```

### PluginExecutionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginExecutionResult {
  pluginId: string;
  issues: Issue[];
  executionTime: number;
  error?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginExecutionResult {
  pluginId: string;
  issues: Issue[];
  executionTime: number;
  error?: string;
}
```

### IPlugin (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPlugin {
  metadata: PluginMetadata;
  analyze(filePath: string): Promise<Issue[]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPlugin {
  metadata: PluginMetadata;
  analyze(filePath: string): Promise<Issue[]>;
}
```

### IPluginManager (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginManager {
  /**
   * プラグインを登録
   */
  register(plugin: IPlugin): void;
  
  /**
   * プラグインを登録解除
   */
  unregister(pluginId: string): void;
  
  /**
   * 登録されたプラグインを取得
   */
  getPlugins(): IPlugin[];
  
  /**
   * 特定のプラグインを取得
   */
  getPlugin(pluginId: string): IPlugin | undefined;
  
  /**
   * 全プラグインを実行
   */
  runAll(filePath: string): Promise<PluginExecutionResult[]>;
  
  /**
   * 特定のプラグインを実行
   */
  run(pluginId: string, filePath: string): Promise<PluginExecutionResult>;
  
  /**
   * プラグインの有効/無効を切り替え
   */
  setEnabled(pluginId: string, enabled: boolean): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginManager {
  // Plugin registration
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(pluginId: string): void;
  
  // Plugin discovery
  discover(directory: string): Promise<void>;
  load(pluginPath: string): Promise<IPlugin | ITestQualityPlugin>;
  
  // Plugin execution
  execute(context: AnalysisContext): Promise<PluginResult[]>;
  executePlugin(pluginId: string, context: AnalysisContext): Promise<PluginResult>;
  
  // Plugin management
  getPlugin(pluginId: string): IPlugin | ITestQualityPlugin | undefined;
  getPlugins(): Array<IPlugin | ITestQualityPlugin>;
  getPluginIds(): string[];
  hasPlugin(pluginId: string): boolean;
  
  // Configuration
  configure(pluginId: string, config: Record<string, unknown>): void;
  getConfig(pluginId: string): Record<string, unknown> | undefined;
  
  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginManager {
  /**
   * プラグインを登録
   */
  register(plugin: IPlugin): void;
  
  /**
   * プラグインを登録解除
   */
  unregister(pluginId: string): void;
  
  /**
   * 登録されたプラグインを取得
   */
  getPlugins(): IPlugin[];
  
  /**
   * 特定のプラグインを取得
   */
  getPlugin(pluginId: string): IPlugin | undefined;
  
  /**
   * 全プラグインを実行
   */
  runAll(filePath: string): Promise<PluginExecutionResult[]>;
  
  /**
   * 特定のプラグインを実行
   */
  run(pluginId: string, filePath: string): Promise<PluginExecutionResult>;
  
  /**
   * プラグインの有効/無効を切り替え
   */
  setEnabled(pluginId: string, enabled: boolean): void;
}
```

### ReportFormat (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ReportFormat {
  TEXT = 'text',
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown'
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ReportFormat {
  TEXT = 'text',
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown'
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/core/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ReportFormat = 
  | 'ai-json' 
  | 'markdown' 
  | 'html' 
  | 'executive-summary'
  | 'structured-json';
```

### ReportOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  customTemplate?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  customTemplate?: string;
}
```

### IReporter (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IReporter {
  /**
   * 分析結果レポートを生成
   */
  generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * セキュリティ監査レポートを生成
   */
  generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * 統合レポートを生成
   */
  generateCombinedReport?(
    analysisResult: AnalysisResult,
    securityResult: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * コンソール出力
   */
  printToConsole(content: string): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IReporter {
  /**
   * 分析結果レポートを生成
   */
  generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * セキュリティ監査レポートを生成
   */
  generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * 統合レポートを生成
   */
  generateCombinedReport?(
    analysisResult: AnalysisResult,
    securityResult: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * コンソール出力
   */
  printToConsole(content: string): void;
}
```

### ThreatType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ThreatType {
  INJECTION = 'injection',
  XSS = 'xss',
  CSRF = 'csrf',
  AUTH_BYPASS = 'auth_bypass',
  DATA_EXPOSURE = 'data_exposure',
  INSECURE_CRYPTO = 'insecure_crypto',
  HARDCODED_SECRET = 'hardcoded_secret',
  PATH_TRAVERSAL = 'path_traversal',
  UNVALIDATED_INPUT = 'unvalidated_input'
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ThreatType {
  INJECTION = 'injection',
  XSS = 'xss',
  CSRF = 'csrf',
  AUTH_BYPASS = 'auth_bypass',
  DATA_EXPOSURE = 'data_exposure',
  INSECURE_CRYPTO = 'insecure_crypto',
  HARDCODED_SECRET = 'hardcoded_secret',
  PATH_TRAVERSAL = 'path_traversal',
  UNVALIDATED_INPUT = 'unvalidated_input'
}
```

### SecurityThreat (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityThreat {
  type: ThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  recommendation: string;
  cweId?: string; // Common Weakness Enumeration ID
  owaspCategory?: string; // OWASP Top 10 category
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityThreat {
  type: ThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  recommendation: string;
  cweId?: string; // Common Weakness Enumeration ID
  owaspCategory?: string; // OWASP Top 10 category
}
```

### SecurityAuditResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAuditResult {
  threats: SecurityThreat[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  executionTime: number;
  filesScanned: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAuditResult {
  threats: SecurityThreat[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  executionTime: number;
  filesScanned: number;
}
```

### SecurityRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}
```

### SecurityAuditOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAuditOptions {
  includeTests?: boolean;
  deepScan?: boolean;
  customRules?: SecurityRule[]; // 型安全性を向上
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAuditOptions {
  includeTests?: boolean;
  deepScan?: boolean;
  customRules?: SecurityRule[]; // 型安全性を向上
}
```

### ISecurityAuditor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ISecurityAuditor {
  /**
   * セキュリティ監査を実行
   */
  audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult>;
  
  /**
   * 特定のファイルをスキャン
   */
  scanFile(filePath: string): Promise<SecurityThreat[]>;
  
  /**
   * カスタムルールの登録（将来の拡張用）
   */
  registerRule?(rule: SecurityRule): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ISecurityAuditor {
  /**
   * セキュリティ監査を実行
   */
  audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult>;
  
  /**
   * 特定のファイルをスキャン
   */
  scanFile(filePath: string): Promise<SecurityThreat[]>;
  
  /**
   * カスタムルールの登録（将来の拡張用）
   */
  registerRule?(rule: SecurityRule): void;
}
```

### ConfigGenerationOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/metadataDrivenConfig.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigGenerationOptions {
  preset?: 'minimal' | 'recommended' | 'comprehensive' | 'performance';
  targetEnvironment?: 'development' | 'ci' | 'production';
  maxExecutionTime?: number;  // ミリ秒
  memoryLimit?: 'low' | 'medium' | 'high';
  includeExperimental?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigGenerationOptions {
  preset?: 'minimal' | 'recommended' | 'comprehensive' | 'performance';
  targetEnvironment?: 'development' | 'ci' | 'production';
  maxExecutionTime?: number;  // ミリ秒
  memoryLimit?: 'low' | 'medium' | 'high';
  includeExperimental?: boolean;
}
```

### PluginRecommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/metadataDrivenConfig.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginRecommendation {
  pluginName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginRecommendation {
  pluginName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}
```

### ParallelOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/parallelAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParallelOptions {
  batchSize?: number;        // バッチあたりのファイル数（デフォルト: 10）
  maxConcurrency?: number;   // 最大同時実行数（デフォルト: 4）
  enableStats?: boolean;     // 統計情報収集の有効化（デフォルト: true）
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParallelOptions {
  batchSize?: number;        // バッチあたりのファイル数（デフォルト: 10）
  maxConcurrency?: number;   // 最大同時実行数（デフォルト: 4）
  enableStats?: boolean;     // 統計情報収集の有効化（デフォルト: true）
}
```

### PerformanceMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceMetrics {
  processingTime: number;      // 処理時間（ミリ秒）
  memoryUsage: {
    heapUsed: number;         // 使用ヒープメモリ（バイト）
    heapTotal: number;        // 総ヒープメモリ（バイト）
    external: number;         // 外部メモリ（バイト）
    rss: number;              // RSS（Resident Set Size）
  };
  startTime: number;          // 開始時刻
  endTime: number;            // 終了時刻
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceMetrics {
  processingTime: number;      // 処理時間（ミリ秒）
  memoryUsage: {
    heapUsed: number;         // 使用ヒープメモリ（バイト）
    heapTotal: number;        // 総ヒープメモリ（バイト）
    external: number;         // 外部メモリ（バイト）
    rss: number;              // RSS（Resident Set Size）
  };
  startTime: number;          // 開始時刻
  endTime: number;            // 終了時刻
}
```

### PluginPerformance (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginPerformance {
  pluginName: string;
  filePath: string;
  metrics: PerformanceMetrics;
  issuesFound: number;
  errorOccurred: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginPerformance {
  pluginName: string;
  filePath: string;
  metrics: PerformanceMetrics;
  issuesFound: number;
  errorOccurred: boolean;
}
```

### PerformanceReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceReport {
  totalMetrics: PerformanceMetrics;
  pluginPerformances: PluginPerformance[];
  summary: {
    totalFiles: number;
    totalPlugins: number;
    avgTimePerFile: number;
    avgTimePerPlugin: number;
    slowestPlugin: string;
    fastestPlugin: string;
    memoryPeakUsage: number;
    memoryEfficiency: number;  // MB/s
  };
  detailed: {
    filePerformance: Array<{
      filePath: string;
      totalTime: number;
      pluginCount: number;
      avgTimePerPlugin: number;
    }>;
    pluginPerformance: Array<{
      pluginName: string;
      totalTime: number;
      fileCount: number;
      avgTimePerFile: number;
      errorRate: number;
    }>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceReport {
  totalMetrics: PerformanceMetrics;
  pluginPerformances: PluginPerformance[];
  summary: {
    totalFiles: number;
    totalPlugins: number;
    avgTimePerFile: number;
    avgTimePerPlugin: number;
    slowestPlugin: string;
    fastestPlugin: string;
    memoryPeakUsage: number;
    memoryEfficiency: number;  // MB/s
  };
  detailed: {
    filePerformance: Array<{
      filePath: string;
      totalTime: number;
      pluginCount: number;
      avgTimePerPlugin: number;
    }>;
    pluginPerformance: Array<{
      pluginName: string;
      totalTime: number;
      fileCount: number;
      avgTimePerFile: number;
      errorRate: number;
    }>;
  };
}
```

### PluginParameter (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
  };
}
```

### PluginDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginDependency {
  pluginName: string;
  version?: string;
  optional: boolean;
  reason: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginDependency {
  pluginName: string;
  version?: string;
  optional: boolean;
  reason: string;
}
```

### MetadataProvider (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataProvider {
  getMetadata(): PluginMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataProvider {
  getMetadata(): PluginMetadata;
}
```

### DetectionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetectionResult {
  patternId?: string;
  pattern?: string; // Alias for patternId (backward compatibility)
  patternName?: string;
  location?: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence?: Evidence[];
  severity?: SeverityLevel;
  securityRelevance?: number; // 0.0-1.0
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetectionResult {
  patternId?: string;
  pattern?: string; // Alias for patternId (backward compatibility)
  patternName?: string;
  location?: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence?: Evidence[];
  severity?: SeverityLevel;
  securityRelevance?: number; // 0.0-1.0
  metadata?: Record<string, unknown>;
}
```

### FileMetrics (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileMetrics {
  lines: number;
  statements?: number;
  functions?: number;
  classes?: number;
  complexity?: number;
  testCount?: number;
  assertionCount?: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  dependencies?: number;
  maintainabilityIndex?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileMetrics {
  lines: number;
  functions: number;
  complexity: number;
  coverage?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileMetrics {
  lines: number;
  statements?: number;
  functions?: number;
  classes?: number;
  complexity?: number;
  testCount?: number;
  assertionCount?: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  dependencies?: number;
  maintainabilityIndex?: number;
}
```

### AggregatedAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AggregatedAnalysisResult {
  // Summary
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  
  // Issues
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  issuesByType: Record<string, number>;
  issuesByFile: Record<string, Issue[]>;
  
  // Quality
  overallQualityScore?: number;
  averageQualityScore?: number;
  qualityDistribution?: Record<string, number>;
  
  // Performance
  totalAnalysisTime: number;
  averageFileTime: number;
  slowestFiles?: Array<{ file: string; time: number }>;
  
  // Plugin performance
  pluginPerformance?: Record<string, {
    totalTime: number;
    averageTime: number;
    filesProcessed: number;
  }>;
  
  // File results
  fileResults: AnalysisResult[];
  
  // Metadata
  startTime: Date;
  endTime: Date;
  configuration?: AnalysisOptions;
  environment?: {
    nodeVersion: string;
    platform: string;
    cpus: number;
    memory: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AggregatedAnalysisResult {
  // Summary
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  
  // Issues
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  issuesByType: Record<string, number>;
  issuesByFile: Record<string, Issue[]>;
  
  // Quality
  overallQualityScore?: number;
  averageQualityScore?: number;
  qualityDistribution?: Record<string, number>;
  
  // Performance
  totalAnalysisTime: number;
  averageFileTime: number;
  slowestFiles?: Array<{ file: string; time: number }>;
  
  // Plugin performance
  pluginPerformance?: Record<string, {
    totalTime: number;
    averageTime: number;
    filesProcessed: number;
  }>;
  
  // File results
  fileResults: AnalysisResult[];
  
  // Metadata
  startTime: Date;
  endTime: Date;
  configuration?: AnalysisOptions;
  environment?: {
    nodeVersion: string;
    platform: string;
    cpus: number;
    memory: number;
  };
}
```

### AnalysisContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisContext {
  // Current file
  file: string;
  content?: string;
  ast?: unknown; // Will be properly typed when AST types are defined
  
  // Project context
  projectRoot: string;
  projectType?: string;
  framework?: string;
  
  // Dependencies
  dependencies?: Map<string, string>;
  devDependencies?: Map<string, string>;
  
  // Previous results (for incremental analysis)
  previousResults?: AnalysisResult;
  previousMetrics?: FileMetrics;
  
  // Shared data between plugins
  sharedData?: Map<string, unknown>;
  
  // Options
  options: AnalysisOptions;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisContext {
  // Current file
  file: string;
  content?: string;
  ast?: unknown; // Will be properly typed when AST types are defined
  
  // Project context
  projectRoot: string;
  projectType?: string;
  framework?: string;
  
  // Dependencies
  dependencies?: Map<string, string>;
  devDependencies?: Map<string, string>;
  
  // Previous results (for incremental analysis)
  previousResults?: AnalysisResult;
  previousMetrics?: FileMetrics;
  
  // Shared data between plugins
  sharedData?: Map<string, unknown>;
  
  // Options
  options: AnalysisOptions;
}
```

### AnalysisSession (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    percentage: number;
    currentFile?: string;
  };
  results?: AggregatedAnalysisResult;
  errors?: Error[];
  warnings?: string[];
  logs?: string[];
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    percentage: number;
    currentFile?: string;
  };
  results?: AggregatedAnalysisResult;
  errors?: Error[];
  warnings?: string[];
  logs?: string[];
  metadata?: BaseMetadata;
}
```

### BaseAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseAnalysisResult {
  projectPath: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseAnalysisResult {
  projectPath: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}
```

### FileAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileAnalysisResult {
  filePath: string;
  issues: Issue[];
  patterns: DetectionResult[];
  metrics?: FileMetrics;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileAnalysisResult {
  filePath: string;
  issues: Issue[];
  patterns: DetectionResult[];
  metrics?: FileMetrics;
}
```

### ProjectAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectAnalysisResult extends BaseAnalysisResult {
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  issues: Issue[];
  improvements: Improvement[];
  qualityScore: QualityScore;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectAnalysisResult extends BaseAnalysisResult {
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  issues: Issue[];
  improvements: Improvement[];
  qualityScore: QualityScore;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/taint-analysis-system.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectAnalysisResult {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  issuesByType: Map<string, number>;
  criticalFiles: string[];
  coverage: {
    annotated: number;
    inferred: number;
    total: number;
  };
}
```

### AnalysisSummary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  totalPatterns: number;
  totalImprovements: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  totalPatterns: number;
  totalImprovements: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisSummary {
  totalFiles: number;
  totalIssues: number;
  issueBySeverity: IssueBySeverity;
  issueByType: Record<string, number>;
}
```

### TaintAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  flows: TaintFlow[];
  summary: TaintSummary;
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  flows: TaintFlow[];
  summary: TaintSummary;
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/modular.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TaintAnalysisResult {
  lattice: SecurityLattice;
  violations: SecurityViolation[];
  taintPaths: TaintPath[];
  criticalFlows: CriticalFlow[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  taintedProperties: string[];
  untaintedProperties: string[];
  polyTaintMethods: string[];
  suppressedMethods: string[];
  errors: TaintValidationError[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/taint-analysis-system.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  /** 検出された問題 */
  issues: TaintIssue[];
  /** 推論されたアノテーション */
  annotations: Map<string, TaintQualifier>;
  /** 統計情報 */
  statistics: {
    filesAnalyzed: number;
    issuesFound: number;
    annotationsInferred: number;
    analysisTime: number;
  };
  /** JAIF形式の出力（オプション） */
  jaifOutput?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  methods: MethodAnalysisResult[];
  overallMetrics: SecurityTestMetrics;
  violations: SecurityViolation[];
  improvements: SecurityImprovement[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  /** セキュリティ格子 */
  lattice: SecurityLattice;
  /** セキュリティ違反 */
  violations: SecurityViolation[];
  /** 汚染パス */
  taintPaths: any[];
  /** クリティカルフロー */
  criticalFlows: any[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisResult {
  /** 検出されたTaintフロー */
  flows: TaintFlow[];
  /** サマリー情報 */
  summary: TaintSummary;
  /** 解析メタデータ（オプション） */
  metadata?: {
    /** 解析開始時刻 */
    startTime: Date;
    /** 解析終了時刻 */
    endTime: Date;
    /** 解析対象ファイル数 */
    filesAnalyzed: number;
    /** 使用したルール数 */
    rulesApplied: number;
  };
}
```

### TaintFlow (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlow {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
  confidence: number;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlow {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
  confidence: number;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlow {
  source: TaintSourceInfo;
  sink: SecuritySinkInfo;
  path: FlowPath;
  isSanitized: boolean;
  sanitizers?: SanitizerInfo[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlow {
  /** フローID */
  id: string;
  /** ソースの位置 */
  sourceLocation: {
    file: string;
    line: number;
    column: number;
  };
  /** シンクの位置 */
  sinkLocation: {
    file: string;
    line: number;
    column: number;
  };
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** 信頼度（0-1） */
  confidence: number;
  /** 汚染パス */
  path: string[];
  /** 説明 */
  description: string;
  /** 関連するCWE ID（オプション） */
  cweId?: string;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}
```

### TaintLevel (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/taint-annotations.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintLevel = 'tainted' | 'untainted' | 'poly';
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum TaintLevel {
  SAFE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintLevel = 'untainted' | 'tainted' | 'sanitized' | 'unknown' | 'possibly_tainted' | 'highly_tainted';
```

### TaintSummary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSummary {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSummary {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSummary {
  /** 総フロー数 */
  totalFlows: number;
  /** クリティカルフロー数 */
  criticalFlows: number;
  /** 高レベルフロー数 */
  highFlows: number;
  /** 中レベルフロー数 */
  mediumFlows: number;
  /** 低レベルフロー数 */
  lowFlows: number;
}
```

### SecurityAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAnalysisResult extends BaseAnalysisResult {
  vulnerabilities: SecurityVulnerability[];
  taintAnalysis?: TaintAnalysisResult;
  securityScore: number;
  compliance: ComplianceResult;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAnalysisResult extends BaseAnalysisResult {
  vulnerabilities: SecurityVulnerability[];
  taintAnalysis?: TaintAnalysisResult;
  securityScore: number;
  compliance: ComplianceResult;
}
```

### SecurityVulnerability (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  cwe?: string;
  owasp?: string;
  fix?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  cwe?: string;
  owasp?: string;
  fix?: string;
}
```

### ComplianceResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceResult {
  standard: string;
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceResult {
  standard: string;
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
}
```

### ComplianceViolation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: SeverityLevel;
  location?: {
    file: string;
    line: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: SeverityLevel;
  location?: {
    file: string;
    line: number;
  };
}
```

### DependencyAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyAnalysisResult {
  dependencies: DependencyInfo[];
  vulnerabilities: DependencyVulnerability[];
  outdated: OutdatedDependency[];
  unused: string[];
  missing: string[];
  circular: CircularDependency[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyAnalysisResult {
  dependencies: DependencyInfo[];
  vulnerabilities: DependencyVulnerability[];
  outdated: OutdatedDependency[];
  unused: string[];
  missing: string[];
  circular: CircularDependency[];
}
```

### DependencyInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
}
```

### DependencyVulnerability (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: SeverityLevel;
  vulnerability: string;
  recommendation: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: SeverityLevel;
  vulnerability: string;
  recommendation: string;
}
```

### OutdatedDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OutdatedDependency {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OutdatedDependency {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}
```

### CircularDependency (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CircularDependency {
  files: string[];
  severity: SeverityLevel;
  suggestion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CircularDependency {
  files: string[];
  severity: SeverityLevel;
  suggestion: string;
}
```

### MethodAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisResult {
  name: string;
  file: string;
  line: number;
  issues: Issue[];
  complexity?: number;
  coverage?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisResult {
  name: string;
  file: string;
  line: number;
  issues: Issue[];
  complexity?: number;
  coverage?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisResult {
  method: TestMethod;
  methodName?: string;
  flowGraph: FlowGraph;
  taintAnalysis?: TaintFlowAnalysisResult;
  typeAnalysis?: TypeFlowAnalysisResult;
  violations: SecurityViolation[];
  metrics: SecurityTestMetrics;
  analysisTime?: number;
  improvements: SecurityImprovement[];
  issues?: SecurityIssue[];
  suggestions?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisResult {
  /** メソッド名 */
  methodName: string;
  /** 検出された問題 */
  issues: SecurityIssue[];
  /** 品質メトリクス */
  metrics: SecurityTestMetrics;
  /** 改善提案 */
  suggestions: import('./flow-types').SecurityImprovement[];
  /** 解析時間 */
  analysisTime: number;
}
```

### MethodChange (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodChange {
  type: 'added' | 'modified' | 'deleted';
  method: string | TestMethod;
  file?: string;
  line?: number;
  impact?: 'high' | 'medium' | 'low';
  details?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodChange {
  type: 'added' | 'modified' | 'deleted';
  method: string | TestMethod;
  file?: string;
  line?: number;
  impact?: 'high' | 'medium' | 'low';
  details?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodChange {
  /** 変更の種別 */
  type: 'added' | 'modified' | 'deleted';
  /** メソッド */
  method: TestMethod;
  /** 変更の詳細 */
  details: string;
}
```

### SecurityThreatType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecurityThreatType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecurityThreatType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';
```

### SecurityType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum SecurityType {
  /** ユーザー入力型 */
  USER_INPUT = 'user-input',
  /** 認証トークン型 */
  AUTH_TOKEN = 'auth-token',
  /** 検証済み認証型 */
  VALIDATED_AUTH = 'validated-auth',
  /** 検証済み入力型 */
  VALIDATED_INPUT = 'validated-input',
  /** サニタイズ済み型 */
  SANITIZED_DATA = 'sanitized-data',
  /** セキュアSQL型 */
  SECURE_SQL = 'secure-sql',
  /** セキュアHTML型 */
  SECURE_HTML = 'secure-html',
  /** 認証型 */
  AUTHENTICATION = 'authentication',
  /** 認可型 */
  AUTHORIZATION = 'authorization',
  /** 入力検証型 */
  INPUT_VALIDATION = 'input-validation',
  /** APIセキュリティ型 */
  API_SECURITY = 'api-security'
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum SecurityType {
  /** ユーザー入力型 */
  USER_INPUT = 'user-input',
  /** 認証トークン型 */
  AUTH_TOKEN = 'auth-token',
  /** 検証済み認証型 */
  VALIDATED_AUTH = 'validated-auth',
  /** 検証済み入力型 */
  VALIDATED_INPUT = 'validated-input',
  /** サニタイズ済み型 */
  SANITIZED_DATA = 'sanitized-data',
  /** セキュアSQL型 */
  SECURE_SQL = 'secure-sql',
  /** セキュアHTML型 */
  SECURE_HTML = 'secure-html',
  /** 認証型 */
  AUTHENTICATION = 'authentication',
  /** 認可型 */
  AUTHORIZATION = 'authorization',
  /** 入力検証型 */
  INPUT_VALIDATION = 'input-validation',
  /** APIセキュリティ型 */
  API_SECURITY = 'api-security'
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum SecurityType {
  /** ユーザー入力型 */
  USER_INPUT = 'user-input',
  /** 認証トークン型 */
  AUTH_TOKEN = 'auth-token',
  /** 検証済み認証型 */
  VALIDATED_AUTH = 'validated-auth',
  /** 検証済み入力型 */
  VALIDATED_INPUT = 'validated-input',
  /** サニタイズ済み型 */
  SANITIZED_DATA = 'sanitized-data',
  /** セキュアSQL型 */
  SECURE_SQL = 'secure-sql',
  /** セキュアHTML型 */
  SECURE_HTML = 'secure-html',
  /** 認証型 */
  AUTHENTICATION = 'authentication',
  /** 認可型 */
  AUTHORIZATION = 'authorization',
  /** 入力検証型 */
  INPUT_VALIDATION = 'input-validation',
  /** APIセキュリティ型 */
  API_SECURITY = 'api-security'
}
```

### PluginType (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';
```

#### /Users/sasakama/Projects/Rimor/src/plugins/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security';
```

### TestType (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestType = 'unit' | 'integration' | 'e2e' | 'security';
```

### QualityDimension (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualityDimension = 
  | 'completeness'    // 網羅性
  | 'correctness'     // 正確性
  | 'maintainability' // 保守性
  | 'performance'     // パフォーマンス
  | 'security';
```

### ImprovementType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementType = 
  // 基本的な改善タイプ
  | 'add' | 'modify' | 'remove' | 'refactor'
  // テスト関連の改善タイプ
  | 'add-test' | 'fix-assertion' | 'improve-coverage'
  // セキュリティ関連の改善タイプ
  | 'add-input-validation-tests' | 'enhance-sanitization-testing' 
  | 'add-boundary-condition-tests' | 'improve-error-handling-tests'
  // その他の改善タイプ
  | 'documentation' | 'performance' | 'security';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementType = 
  // 基本的な改善タイプ
  | 'add' | 'modify' | 'remove' | 'refactor'
  // テスト関連の改善タイプ
  | 'add-test' | 'fix-assertion' | 'improve-coverage'
  // セキュリティ関連の改善タイプ
  | 'add-input-validation-tests' | 'enhance-sanitization-testing' 
  | 'add-boundary-condition-tests' | 'improve-error-handling-tests'
  // その他の改善タイプ
  | 'documentation' | 'performance' | 'security';
```

### ImprovementPriority (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementPriority = 'critical' | 'high' | 'medium' | 'low';
```

### Position (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Position {
  line: number;
  column: number;
  offset?: number;
  file?: string; // ファイルパス（オプション）
  method?: string; // メソッド名（テストで使用）
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Position {
  line: number;
  column: number;
  offset?: number;
  file?: string; // ファイルパス（オプション）
  method?: string; // メソッド名（テストで使用）
}
```

### FileLocation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileLocation {
  file: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileLocation {
  file: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileLocation extends Location {
  file: string;
}
```

### RangeLocation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RangeLocation extends FileLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RangeLocation extends FileLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RangeLocation extends Location {
  endLine?: number;
  endColumn?: number;
}
```

### CodeLocation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeLocation {
  line: number;
  column?: number;
  file?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeLocation extends FileLocation, RangeLocation {}
```

### TimeRange (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TimeRange {
  start: Date;
  end: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TimeRange {
  start: Date;
  end: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TimeRange {
  start: Date;
  end: Date;
}
```

### ConfidenceInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfidenceInfo {
  level: number; // 0.0 to 1.0
  reason?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfidenceInfo {
  level: number; // 0.0 to 1.0
  reason?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfidenceInfo {
  confidence: number; // 0.0-1.0
  evidence: string[];
}
```

### BaseMetadata (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  tags?: string[];
  [key: string]: unknown; // Allow extension with additional properties
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  tags?: string[];
  [key: string]: unknown; // Allow extension with additional properties
}
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseMetadata {
  id: string;
  name: string;
  description?: string;
  timestamp?: Date;
  [key: string]: unknown;
}
```

### IssueSeverity (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type IssueSeverity = SeverityLevel;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type IssueSeverity = SeverityLevel;
```

### BaseIssue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseIssue {
  // Identification
  id?: string;
  type: string;
  
  // Severity and priority
  severity: IssueSeverity;
  priority?: number;
  
  // Description
  message: string;
  details?: string;
  
  // Location
  filePath: string; // Required for compatibility
  file?: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  location?: CodeLocation;
  position?: Position;
  
  // Resolution
  recommendation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  
  // Context
  codeSnippet?: string;
  context?: string[];
  
  // Source
  plugin?: string;
  rule?: string;
  category: IssueCategory; // Required for compatibility
  
  // Additional info
  documentation?: string;
  examples?: string[];
  references?: string[];
  tags?: string[];
  
  // Confidence
  confidence?: ConfidenceInfo;
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BaseIssue {
  // Identification
  id?: string;
  type: string;
  
  // Severity and priority
  severity: IssueSeverity;
  priority?: number;
  
  // Description
  message: string;
  details?: string;
  
  // Location
  filePath: string; // Required for compatibility
  file?: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  location?: CodeLocation;
  position?: Position;
  
  // Resolution
  recommendation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  
  // Context
  codeSnippet?: string;
  context?: string[];
  
  // Source
  plugin?: string;
  rule?: string;
  category: IssueCategory; // Required for compatibility
  
  // Additional info
  documentation?: string;
  examples?: string[];
  references?: string[];
  tags?: string[];
  
  // Confidence
  confidence?: ConfidenceInfo;
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

### Evidence (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
```

### Feedback (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Feedback {
  helpful: boolean;
  accurate?: boolean;
  comment?: string;
  rating?: number;
  timestamp?: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Feedback {
  helpful: boolean;
  accurate?: boolean;
  comment?: string;
  rating?: number;
  timestamp?: Date;
}
```

### FixResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FixResult {
  success: boolean;
  modifiedFiles: string[];
  changes?: Array<{
    file: string;
    diff: string;
  }>;
  errors?: string[];
  warnings?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FixResult {
  success: boolean;
  modifiedFiles: string[];
  changes?: Array<{
    file: string;
    diff: string;
  }>;
  errors?: string[];
  warnings?: string[];
}
```

### TaintQualifier (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintQualifier = TaintLevel;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintQualifier = TaintLevel;
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintQualifier = '@Tainted' | '@Untainted' | '@PolyTaint';
```

### SeverityLevel (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'error' | 'warning';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type SeverityLevel = CoreTypes.SeverityLevel;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'error' | 'warning';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SeverityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical' | 'error' | 'warning';
```

### IssueCategory (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type IssueCategory = 
    | 'testing'      // テスト関連
    | 'security'     // セキュリティ
    | 'performance'  // パフォーマンス
    | 'maintainability' // 保守性
    | 'reliability'  // 信頼性
    | 'complexity'   // 複雑度
    | 'duplication'  // 重複
    | 'style'        // コードスタイル
    | 'documentation' // ドキュメント
    | 'general'      // その他
    | 'test-quality' // テスト品質
    | 'coverage'     // カバレッジ
    | 'assertion'    // アサーション
    | 'pattern'      // パターン
    | 'structure'    // 構造
    | 'best-practice' // ベストプラクティス
    | 'error-handling' // エラーハンドリング
    | 'validation'   // バリデーション
    | 'code-quality' // コード品質
    | 'test-coverage' // テストカバレッジ
    | 'file-system'  // ファイルシステム
    | 'syntax';
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type IssueCategory = CoreTypes.IssueCategory;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type IssueCategory = 
    | 'testing'      // テスト関連
    | 'security'     // セキュリティ
    | 'performance'  // パフォーマンス
    | 'maintainability' // 保守性
    | 'reliability'  // 信頼性
    | 'complexity'   // 複雑度
    | 'duplication'  // 重複
    | 'style'        // コードスタイル
    | 'documentation' // ドキュメント
    | 'general'      // その他
    | 'test-quality' // テスト品質
    | 'coverage'     // カバレッジ
    | 'assertion'    // アサーション
    | 'pattern'      // パターン
    | 'structure'    // 構造
    | 'best-practice' // ベストプラクティス
    | 'error-handling' // エラーハンドリング
    | 'validation'   // バリデーション
    | 'code-quality' // コード品質
    | 'test-coverage' // テストカバレッジ
    | 'file-system'  // ファイルシステム
    | 'syntax';
```

### Issue (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Issue {
    // 識別情報
    id: string;
    type: string;
    
    // 深刻度と分類
    severity: SeverityLevel;
    category: IssueCategory;
    
    // 問題の説明
    message: string;
    description?: string;
    
    // 位置情報
    filePath?: string;
    file?: string; // 後方互換性のため追加（filePathと同じ）
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    
    // 追加情報
    ruleId?: string;
    suggestion?: string;
    fixable?: boolean;
    
    // メタデータ
    metadata?: Record<string, any>;
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type Issue = CoreTypes.Issue;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Issue {
    // 識別情報
    id: string;
    type: string;
    
    // 深刻度と分類
    severity: SeverityLevel;
    category: IssueCategory;
    
    // 問題の説明
    message: string;
    description?: string;
    
    // 位置情報
    filePath?: string;
    file?: string; // 後方互換性のため追加（filePathと同じ）
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    
    // 追加情報
    ruleId?: string;
    suggestion?: string;
    fixable?: boolean;
    
    // メタデータ
    metadata?: Record<string, any>;
  }
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Issue = CoreIssue & {
  location?: CodeLocation;
  dataFlow?: DataFlow;
  recommendation?: string;
  codeSnippet?: string;
  references?: string[];
};
```

### ExtendedIssue (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedIssue extends Issue {
    // 位置情報の詳細
    position?: {
      line: number;
      column: number;
      endLine?: number;
      endColumn?: number;
    };
    
    // 追加のコンテキスト情報
    suggestedFix?: string;
    codeSnippet?: string;
    plugin?: string;
    rule?: string;
    
    // reporting用プロパティ
    location?: {
      file: string;
      startLine: number;
      endLine: number;
      column?: number;
    };
    recommendation?: string;
    references?: string[];
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: type
- エクスポート: exported
```typescript
export type ExtendedIssue = CoreTypes.ExtendedIssue;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedIssue extends Issue {
    // 位置情報の詳細
    position?: {
      line: number;
      column: number;
      endLine?: number;
      endColumn?: number;
    };
    
    // 追加のコンテキスト情報
    suggestedFix?: string;
    codeSnippet?: string;
    plugin?: string;
    rule?: string;
    
    // reporting用プロパティ
    location?: {
      file: string;
      startLine: number;
      endLine: number;
      column?: number;
    };
    recommendation?: string;
    references?: string[];
  }
```

### QualityScore (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityScore {
    // 総合スコア (0-100)
    overall: number;
    
    // 次元別スコア
    dimensions: {
      completeness?: number;
      correctness?: number;
      maintainability?: number;
      reliability?: number;
      security?: number;
    };
    
    // スコアの内訳
    breakdown?: {
      [key: string]: number;
    };
    
    // 信頼度 (0.0-1.0)
    confidence: number;
    
    // グレード
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityScore {
  // Overall score
  overall: number; // 0.0-1.0
  
  // Dimensional scores
  dimensions: Partial<Record<QualityDimension, number>>; // 0.0-1.0 each
  
  // Additional custom dimensions
  customDimensions?: Record<string, number>;
  
  // Security-specific score
  security?: number; // 0.0-1.0
  
  // Coverage metrics
  coverage?: number; // 0.0-1.0
  
  // Additional metrics
  maintainability?: number; // 0.0-1.0
  
  // Breakdown of scores
  breakdown?: {
    completeness?: number;
    reliability?: number;
    effectiveness?: number;
    maintainability?: number;
    correctness?: number;
  };
  
  // Confidence in the score
  confidence: number; // 0.0-1.0
  
  // Detailed breakdown
  details?: QualityDetails;
  
  // Historical comparison
  trend?: QualityTrend;
  
  // Benchmarks
  benchmarks?: QualityBenchmarks;
  
  // Metadata
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityScore {
    // 総合スコア (0-100)
    overall: number;
    
    // 次元別スコア
    dimensions: {
      completeness?: number;
      correctness?: number;
      maintainability?: number;
      reliability?: number;
      security?: number;
    };
    
    // スコアの内訳
    breakdown?: {
      [key: string]: number;
    };
    
    // 信頼度 (0.0-1.0)
    confidence: number;
    
    // グレード
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  }
```

### ProjectContext (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectContext {
    // プロジェクト情報
    rootPath: string;
    projectName?: string;
    projectType?: string;
    
    // 技術スタック
    language?: string;
    framework?: string;
    testFramework?: string;
    
    // 設定
    configFiles?: string[];
    dependencies?: Record<string, string>;
    
    // 統計
    totalFiles?: number;
    totalLines?: number;
    testFiles?: number;
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectContext {
  rootPath?: string;
  projectPath?: string;
  type?: string; // Project type (e.g., 'node', 'web', 'library')
  language?: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go' | 'rust' | 'other';
  languages?: string[]; // Multiple languages support
  testFramework?: string;
  framework?: string;
  packageJson?: PackageJsonConfig; // Properly typed, not any
  tsConfig?: TSConfig; // Properly typed, not any
  dependencies?: Record<string, string> | string[]; // Support both formats
  testFiles?: TestFile[]; // Test files in the project
  sourceFiles?: string[]; // Source files in the project
  configuration?: Record<string, unknown>; // Using unknown instead of any
  customConfig?: Record<string, unknown>; // Using unknown instead of any
  filePatterns?: {
    test: string[];
    source: string[];
    ignore: string[];
  };
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectContext {
    // プロジェクト情報
    rootPath: string;
    projectName?: string;
    projectType?: string;
    
    // 技術スタック
    language?: string;
    framework?: string;
    testFramework?: string;
    
    // 設定
    configFiles?: string[];
    dependencies?: Record<string, string>;
    
    // 統計
    totalFiles?: number;
    totalLines?: number;
    testFiles?: number;
  }
```

### Improvement (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Improvement {
    // 識別情報
    id: string;
    type: 'refactor' | 'fix' | 'enhancement' | 'test' | 'documentation';
    
    // 優先度と影響
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact?: number | { scoreImprovement: number; effortMinutes: number };
    estimatedImpact?: number;
    
    // 提案内容
    title: string;
    description: string;
    category?: string;
    
    // 実装詳細
    suggestedCode?: string;
    diff?: string;
    autoFixable?: boolean;
    
    // 努力見積もり
    effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
    estimatedTime?: string;
  }
```

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Improvement {
  // Identification
  id: string;
  
  // Classification
  type: ImprovementType;
  priority: ImprovementPriority;
  category?: string;
  
  // Description
  title: string;
  description: string;
  rationale?: string;
  
  // Location
  location?: CodeLocation;
  affectedFiles?: string[];
  
  // Implementation
  suggestedCode?: string;
  codeSnippet?: string;
  diff?: string;
  
  // Impact assessment
  estimatedImpact?: number; // 0.0-1.0
  impact?: number | { scoreImprovement: number; effortMinutes: number }; // 後方互換性のため
  qualityImprovement?: {
    before: number;
    after: number;
    dimensions: Partial<Record<string, number>>;
  };
  
  // Effort estimation
  effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
  estimatedTime?: string; // e.g., "2 hours", "1 day"
  complexity?: number; // 1-10
  
  // Automation
  autoFixable?: boolean;
  automatable?: boolean; // エイリアスとして追加
  automationLevel?: 'none' | 'partial' | 'full';
  requiresReview?: boolean;
  
  // Dependencies
  dependencies?: string[]; // IDs of other improvements that should be done first
  conflicts?: string[]; // IDs of improvements that conflict with this one
  
  // Additional context
  examples?: CodeExample[];
  references?: Reference[];
  tags?: string[];
  suggestions?: string[];
  codeExample?: string;
  
  // Metadata
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Improvement {
    // 識別情報
    id: string;
    type: 'refactor' | 'fix' | 'enhancement' | 'test' | 'documentation';
    
    // 優先度と影響
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact?: number | { scoreImprovement: number; effortMinutes: number };
    estimatedImpact?: number;
    
    // 提案内容
    title: string;
    description: string;
    category?: string;
    
    // 実装詳細
    suggestedCode?: string;
    diff?: string;
    autoFixable?: boolean;
    
    // 努力見積もり
    effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
    estimatedTime?: string;
  }
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Improvement {
  priority: 'critical' | 'high' | 'medium' | 'low';
  target: string;
  action: string;
  expectedImprovement: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  relatedIssues: Issue[];
}
```

### DomainTerm (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainTerm {
  // Identification
  id: string;
  term: string;
  
  // Variations
  aliases?: string[];
  abbreviations?: string[];
  plurals?: string[];
  
  // Classification
  category?: string;
  type?: 'entity' | 'action' | 'attribute' | 'relationship' | 'constraint' | 'event';
  domain?: string;
  subdomain?: string;
  
  // Definition
  definition: string;
  description?: string;
  examples?: string[];
  nonExamples?: string[];
  
  // Context
  context?: string[];
  relatedTerms?: string[];
  synonyms?: string[];
  antonyms?: string[];
  
  // Business rules
  rules?: string[];
  constraints?: string[];
  validations?: string[];
  
  // Technical mapping
  technicalName?: string;
  dataType?: string;
  format?: string;
  pattern?: string;
  
  // Importance
  importance?: 'low' | 'medium' | 'high' | 'critical';
  frequency?: number; // Usage frequency
  
  // Metadata
  source?: string;
  references?: string[];
  lastUpdated?: Date;
  version?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainTerm {
  // Identification
  id: string;
  term: string;
  
  // Variations
  aliases?: string[];
  abbreviations?: string[];
  plurals?: string[];
  
  // Classification
  category?: string;
  type?: 'entity' | 'action' | 'attribute' | 'relationship' | 'constraint' | 'event';
  domain?: string;
  subdomain?: string;
  
  // Definition
  definition: string;
  description?: string;
  examples?: string[];
  nonExamples?: string[];
  
  // Context
  context?: string[];
  relatedTerms?: string[];
  synonyms?: string[];
  antonyms?: string[];
  
  // Business rules
  rules?: string[];
  constraints?: string[];
  validations?: string[];
  
  // Technical mapping
  technicalName?: string;
  dataType?: string;
  format?: string;
  pattern?: string;
  
  // Importance
  importance?: 'low' | 'medium' | 'high' | 'critical';
  frequency?: number; // Usage frequency
  
  // Metadata
  source?: string;
  references?: string[];
  lastUpdated?: Date;
  version?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseDomainPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainTerm {
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  relatedTerms?: string[];
}
```

### BusinessRule (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessRule {
  // Identification
  id: string;
  name: string;
  code?: string; // Rule code for reference
  
  // Classification
  type?: 'validation' | 'calculation' | 'constraint' | 'workflow' | 'authorization' | 'other';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Definition
  description: string;
  statement: string; // Formal rule statement
  conditions?: string[];
  actions?: string[];
  exceptions?: string[];
  
  // Implementation
  implementation?: {
    pseudocode?: string;
    formula?: string;
    algorithm?: string;
    flowchart?: string;
  };
  
  // Testing
  testScenarios?: TestScenario[];
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  
  // Related entities
  relatedTerms?: string[];
  relatedRules?: string[];
  dependencies?: string[];
  
  // Compliance
  compliance?: {
    standard?: string;
    regulation?: string;
    requirement?: string;
    auditTrail?: boolean;
  };
  
  // Metadata
  owner?: string;
  approvedBy?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  version?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessRule {
  // Identification
  id: string;
  name: string;
  code?: string; // Rule code for reference
  
  // Classification
  type?: 'validation' | 'calculation' | 'constraint' | 'workflow' | 'authorization' | 'other';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Definition
  description: string;
  statement: string; // Formal rule statement
  conditions?: string[];
  actions?: string[];
  exceptions?: string[];
  
  // Implementation
  implementation?: {
    pseudocode?: string;
    formula?: string;
    algorithm?: string;
    flowchart?: string;
  };
  
  // Testing
  testScenarios?: TestScenario[];
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  
  // Related entities
  relatedTerms?: string[];
  relatedRules?: string[];
  dependencies?: string[];
  
  // Compliance
  compliance?: {
    standard?: string;
    regulation?: string;
    requirement?: string;
    auditTrail?: boolean;
  };
  
  // Metadata
  owner?: string;
  approvedBy?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  version?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseDomainPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  testRequired: boolean;
}
```

### TestScenario (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  given: string[]; // Preconditions
  when: string[]; // Actions
  then: string[]; // Expected outcomes
  priority?: 'low' | 'medium' | 'high';
  automated?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  given: string[]; // Preconditions
  when: string[]; // Actions
  then: string[]; // Expected outcomes
  priority?: 'low' | 'medium' | 'high';
  automated?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TestIntentExtractor.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestScenario {
  description?: string;
  context?: string;
  testCases?: string[];
  given?: string;
  when?: string;
  then?: string;
}
```

### DomainDictionary (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionary {
  // Identification
  id: string;
  name: string;
  version: string;
  
  // Content
  terms: DomainTerm[];
  rules: BusinessRule[];
  relationships?: DomainRelationship[];
  
  // Organization
  categories?: DomainCategory[];
  domains?: string[];
  glossary?: Map<string, string>; // Quick lookup
  
  // Metadata
  language?: string;
  industry?: string;
  organization?: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  reviewers?: string[];
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionary {
  // Identification
  id: string;
  name: string;
  version: string;
  
  // Content
  terms: DomainTerm[];
  rules: BusinessRule[];
  relationships?: DomainRelationship[];
  
  // Organization
  categories?: DomainCategory[];
  domains?: string[];
  glossary?: Map<string, string>; // Quick lookup
  
  // Metadata
  language?: string;
  industry?: string;
  organization?: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  reviewers?: string[];
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionary {
  /**
   * 用語リスト
   */
  terms: DomainDictionaryEntry[];
  
  /**
   * ルールリスト
   */
  rules: DomainRule[];
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseDomainPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionary {
  terms: DomainTerm[];
  rules: BusinessRule[];
  context: DomainContext;
}
```

### DomainRelationship (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainRelationship {
  id: string;
  type: 'is-a' | 'has-a' | 'uses' | 'depends-on' | 'relates-to' | 'custom';
  source: string; // Term ID
  target: string; // Term ID
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  required?: boolean;
  bidirectional?: boolean;
  description?: string;
  rules?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainRelationship {
  id: string;
  type: 'is-a' | 'has-a' | 'uses' | 'depends-on' | 'relates-to' | 'custom';
  source: string; // Term ID
  target: string; // Term ID
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  required?: boolean;
  bidirectional?: boolean;
  description?: string;
  rules?: string[];
}
```

### DomainCategory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCategory {
  id: string;
  name: string;
  description?: string;
  parent?: string; // Parent category ID
  children?: string[]; // Child category IDs
  terms?: string[]; // Term IDs in this category
  icon?: string;
  color?: string;
  order?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCategory {
  id: string;
  name: string;
  description?: string;
  parent?: string; // Parent category ID
  children?: string[]; // Child category IDs
  terms?: string[]; // Term IDs in this category
  icon?: string;
  color?: string;
  order?: number;
}
```

### DomainContext (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainContext {
  dictionary: DomainDictionary;
  activeTerms: Set<string>; // Currently relevant terms
  activeRules: Set<string>; // Currently applicable rules
  confidence: ConfidenceInfo;
  matches?: DomainMatch[];
  violations?: RuleViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainContext {
  dictionary: DomainDictionary;
  activeTerms: Set<string>; // Currently relevant terms
  activeRules: Set<string>; // Currently applicable rules
  confidence: ConfidenceInfo;
  matches?: DomainMatch[];
  violations?: RuleViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainContext {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * クラス名
   */
  className?: string;
  
  /**
   * インポートされているモジュール
   */
  imports: string[];
  
  /**
   * 名前空間
   */
  namespace?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseDomainPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainContext {
  domain: string;
  subdomains?: string[];
  language: string;
  version: string;
}
```

### DomainMatch (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainMatch {
  termId: string;
  term: string;
  location: {
    file: string;
    line: number;
    column: number;
    text: string;
  };
  confidence: number;
  type: 'exact' | 'partial' | 'semantic' | 'inferred';
  context?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainMatch {
  termId: string;
  term: string;
  location: {
    file: string;
    line: number;
    column: number;
    text: string;
  };
  confidence: number;
  type: 'exact' | 'partial' | 'semantic' | 'inferred';
  context?: string;
}
```

### RuleViolation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable?: boolean;
}
```

### DomainCoverage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCoverage {
  totalTerms: number;
  coveredTerms: number;
  uncoveredTerms: string[];
  coverage: number; // Percentage
  
  totalRules: number;
  implementedRules: number;
  violatedRules: number;
  compliance: number; // Percentage
  
  byCategory?: Map<string, {
    total: number;
    covered: number;
    coverage: number;
  }>;
  
  suggestions?: string[];
  gaps?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCoverage {
  totalTerms: number;
  coveredTerms: number;
  uncoveredTerms: string[];
  coverage: number; // Percentage
  
  totalRules: number;
  implementedRules: number;
  violatedRules: number;
  compliance: number; // Percentage
  
  byCategory?: Map<string, {
    total: number;
    covered: number;
    coverage: number;
  }>;
  
  suggestions?: string[];
  gaps?: string[];
}
```

### IDomainKnowledgeExtractor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainKnowledgeExtractor {
  extractTerms(content: string): DomainTerm[];
  extractRules(content: string): BusinessRule[];
  extractRelationships(terms: DomainTerm[]): DomainRelationship[];
  buildDictionary(sources: string[]): DomainDictionary;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainKnowledgeExtractor {
  extractTerms(content: string): DomainTerm[];
  extractRules(content: string): BusinessRule[];
  extractRelationships(terms: DomainTerm[]): DomainRelationship[];
  buildDictionary(sources: string[]): DomainDictionary;
}
```

### IDomainAnalyzer (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainAnalyzer {
  analyze(content: string, dictionary: DomainDictionary): DomainContext;
  findMatches(content: string, terms: DomainTerm[]): DomainMatch[];
  validateRules(content: string, rules: BusinessRule[]): RuleViolation[];
  calculateCoverage(matches: DomainMatch[], dictionary: DomainDictionary): DomainCoverage;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainAnalyzer {
  analyze(content: string, dictionary: DomainDictionary): DomainContext;
  findMatches(content: string, terms: DomainTerm[]): DomainMatch[];
  validateRules(content: string, rules: BusinessRule[]): RuleViolation[];
  calculateCoverage(matches: DomainMatch[], dictionary: DomainDictionary): DomainCoverage;
}
```

### Handler (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Handler<T = void> = (event: Event) => T;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Handler<T = void> = (event: Event) => T;
```

### AsyncHandler (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AsyncHandler<T = void> = (event: Event) => Promise<T>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AsyncHandler<T = void> = (event: Event) => Promise<T>;
```

### ErrorHandler (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ErrorHandler = (error: Error, context?: ErrorContext) => void;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ErrorHandler = (error: Error, context?: ErrorContext) => void;
```

### ErrorContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  method?: string;
  stack?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  method?: string;
  stack?: string;
}
```

### Callback (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;
```

### AsyncCallback (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AsyncCallback<T = void, E = Error> = (error: E | null, result?: T) => Promise<void>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AsyncCallback<T = void, E = Error> = (error: E | null, result?: T) => Promise<void>;
```

### EventListener (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EventListener<T = unknown> {
  eventName: string;
  handler: (data: T) => void;
  once?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EventListener<T = unknown> {
  eventName: string;
  handler: (data: T) => void;
  once?: boolean;
}
```

### HandlebarsHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type HandlebarsHelper = (...args: unknown[]) => unknown;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type HandlebarsHelper = (...args: unknown[]) => unknown;
```

### HandlebarsBlockHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HandlebarsBlockHelper {
  (this: unknown, context: unknown, options: HandlebarsOptions): string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HandlebarsBlockHelper {
  (this: unknown, context: unknown, options: HandlebarsOptions): string;
}
```

### HandlebarsOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HandlebarsOptions {
  fn: (context: unknown) => string;
  inverse: (context: unknown) => string;
  hash: Record<string, unknown>;
  data?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HandlebarsOptions {
  fn: (context: unknown) => string;
  inverse: (context: unknown) => string;
  hash: Record<string, unknown>;
  data?: Record<string, unknown>;
}
```

### ArrayHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ArrayHelper<T> = (array: T[], ...args: unknown[]) => T[] | T | undefined;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ArrayHelper<T> = (array: T[], ...args: unknown[]) => T[] | T | undefined;
```

### ObjectHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ObjectHelper<T = unknown> = (obj: Record<string, T>, ...args: unknown[]) => T | undefined;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ObjectHelper<T = unknown> = (obj: Record<string, T>, ...args: unknown[]) => T | undefined;
```

### StringHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type StringHelper = (str: string, ...args: unknown[]) => string;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type StringHelper = (str: string, ...args: unknown[]) => string;
```

### NumberHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type NumberHelper = (num: number, ...args: unknown[]) => number | string;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type NumberHelper = (num: number, ...args: unknown[]) => number | string;
```

### ConditionalHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ConditionalHelper = (...args: unknown[]) => boolean;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ConditionalHelper = (...args: unknown[]) => boolean;
```

### TransformHelper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TransformHelper<T, R> = (value: T, ...args: unknown[]) => R;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TransformHelper<T, R> = (value: T, ...args: unknown[]) => R;
```

### FilterFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FilterFunction<T> = (item: T, index?: number, array?: T[]) => boolean;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FilterFunction<T> = (item: T, index?: number, array?: T[]) => boolean;
```

### MapperFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MapperFunction<T, R> = (item: T, index?: number, array?: T[]) => R;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MapperFunction<T, R> = (item: T, index?: number, array?: T[]) => R;
```

### ReducerFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ReducerFunction<T, R> = (accumulator: R, current: T, index?: number, array?: T[]) => R;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ReducerFunction<T, R> = (accumulator: R, current: T, index?: number, array?: T[]) => R;
```

### ComparatorFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ComparatorFunction<T> = (a: T, b: T) => number;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ComparatorFunction<T> = (a: T, b: T) => number;
```

### ValidatorFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatorFunction<T> = (value: T) => boolean | string;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatorFunction<T> = (value: T) => boolean | string;
```

### SanitizerFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SanitizerFunction<T = string> = (input: T) => T;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SanitizerFunction<T = string> = (input: T) => T;
```

### ParserFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ParserFunction<T, R> = (input: T) => R | never;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ParserFunction<T, R> = (input: T) => R | never;
```

### FormatterFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FormatterFunction<T> = (value: T, format?: string) => string;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FormatterFunction<T> = (value: T, format?: string) => string;
```

### MiddlewareFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MiddlewareFunction<T = unknown, R = unknown> = (
  context: T,
  next: () => Promise<R>
) => Promise<R>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MiddlewareFunction<T = unknown, R = unknown> = (
  context: T,
  next: () => Promise<R>
) => Promise<R>;
```

### InterceptorFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InterceptorFunction<T = unknown, R = unknown> {
  before?: (context: T) => T | Promise<T>;
  after?: (result: R, context: T) => R | Promise<R>;
  error?: (error: Error, context: T) => void | Promise<void>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InterceptorFunction<T = unknown, R = unknown> {
  before?: (context: T) => T | Promise<T>;
  after?: (result: R, context: T) => R | Promise<R>;
  error?: (error: Error, context: T) => void | Promise<void>;
}
```

### TransformerFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TransformerFunction<T, R> = (input: T) => R | Promise<R>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TransformerFunction<T, R> = (input: T) => R | Promise<R>;
```

### AggregatorFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AggregatorFunction<T, R> = (items: T[]) => R;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AggregatorFunction<T, R> = (items: T[]) => R;
```

### PredicateFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PredicateFunction<T> = (value: T) => boolean;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PredicateFunction<T> = (value: T) => boolean;
```

### FactoryFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FactoryFunction<T> = (...args: unknown[]) => T;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type FactoryFunction<T> = (...args: unknown[]) => T;
```

### BuilderFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type BuilderFunction<T> = (config: Partial<T>) => T;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type BuilderFunction<T> = (config: Partial<T>) => T;
```

### ResolverFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ResolverFunction<T> = () => T | Promise<T>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ResolverFunction<T> = () => T | Promise<T>;
```

### CodeExample (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeExample {
  title: string;
  description?: string;
  before: string;
  after: string;
  language?: string;
  framework?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeExample {
  title: string;
  description?: string;
  before: string;
  after: string;
  language?: string;
  framework?: string;
}
```

### Reference (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Reference {
  type: 'documentation' | 'article' | 'video' | 'book' | 'tool' | 'other';
  title: string;
  url?: string;
  author?: string;
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Reference {
  type: 'documentation' | 'article' | 'video' | 'book' | 'tool' | 'other';
  title: string;
  url?: string;
  author?: string;
  description?: string;
}
```

### ImprovementPlan (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementPlan {
  // Identification
  id: string;
  name: string;
  description?: string;
  
  // Improvements
  improvements: Improvement[];
  
  // Grouping
  phases?: ImprovementPhase[];
  categories?: Map<string, Improvement[]>;
  
  // Prioritization
  priorityOrder: string[]; // Improvement IDs in priority order
  criticalPath?: string[]; // IDs of improvements on the critical path
  
  // Estimates
  totalEffort?: string;
  totalImpact?: number;
  estimatedDuration?: string;
  
  // Execution strategy
  strategy?: 'sequential' | 'parallel' | 'mixed';
  maxParallel?: number;
  
  // Progress tracking
  status?: 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  progress?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementPlan {
  // Identification
  id: string;
  name: string;
  description?: string;
  
  // Improvements
  improvements: Improvement[];
  
  // Grouping
  phases?: ImprovementPhase[];
  categories?: Map<string, Improvement[]>;
  
  // Prioritization
  priorityOrder: string[]; // Improvement IDs in priority order
  criticalPath?: string[]; // IDs of improvements on the critical path
  
  // Estimates
  totalEffort?: string;
  totalImpact?: number;
  estimatedDuration?: string;
  
  // Execution strategy
  strategy?: 'sequential' | 'parallel' | 'mixed';
  maxParallel?: number;
  
  // Progress tracking
  status?: 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  progress?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
  metadata?: BaseMetadata;
}
```

### ImprovementPhase (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementPhase {
  id: string;
  name: string;
  description?: string;
  improvements: string[]; // Improvement IDs
  order: number;
  duration?: string;
  dependencies?: string[]; // Other phase IDs
  status?: 'pending' | 'in-progress' | 'completed';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementPhase {
  id: string;
  name: string;
  description?: string;
  improvements: string[]; // Improvement IDs
  order: number;
  duration?: string;
  dependencies?: string[]; // Other phase IDs
  status?: 'pending' | 'in-progress' | 'completed';
}
```

### ImprovementExecutionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementExecutionResult {
  improvementId: string;
  success: boolean;
  
  // Changes made
  modifiedFiles?: string[];
  additions?: number;
  deletions?: number;
  diff?: string;
  
  // Quality impact
  qualityBefore?: number;
  qualityAfter?: number;
  actualImpact?: number;
  
  // Execution details
  executionTime?: number;
  executedAt?: Date;
  executedBy?: string;
  method?: 'manual' | 'automated' | 'assisted';
  
  // Issues encountered
  errors?: string[];
  warnings?: string[];
  rollbackRequired?: boolean;
  rollbackPerformed?: boolean;
  
  // Review
  reviewed?: boolean;
  reviewedBy?: string;
  reviewComments?: string;
  approved?: boolean;
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementExecutionResult {
  improvementId: string;
  success: boolean;
  
  // Changes made
  modifiedFiles?: string[];
  additions?: number;
  deletions?: number;
  diff?: string;
  
  // Quality impact
  qualityBefore?: number;
  qualityAfter?: number;
  actualImpact?: number;
  
  // Execution details
  executionTime?: number;
  executedAt?: Date;
  executedBy?: string;
  method?: 'manual' | 'automated' | 'assisted';
  
  // Issues encountered
  errors?: string[];
  warnings?: string[];
  rollbackRequired?: boolean;
  rollbackPerformed?: boolean;
  
  // Review
  reviewed?: boolean;
  reviewedBy?: string;
  reviewComments?: string;
  approved?: boolean;
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

### ImprovementAnalytics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementAnalytics {
  // Summary statistics
  totalImprovements: number;
  completedImprovements: number;
  successRate: number;
  averageImpact: number;
  averageExecutionTime: number;
  
  // By type
  byType: Record<ImprovementType, {
    count: number;
    completed: number;
    averageImpact: number;
    successRate: number;
  }>;
  
  // By priority
  byPriority: Record<ImprovementPriority, {
    count: number;
    completed: number;
    averageTime: number;
  }>;
  
  // By effort
  byEffort: Record<string, {
    count: number;
    completed: number;
    totalTime: number;
  }>;
  
  // Trends
  trends: {
    improvementsPerDay: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  };
  
  // Top improvements
  topImprovements: Array<{
    id: string;
    title: string;
    impact: number;
    effort: string;
  }>;
  
  // Bottlenecks
  bottlenecks?: string[];
  blockers?: string[];
  
  // Forecast
  estimatedCompletion?: Date;
  projectedQuality?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementAnalytics {
  // Summary statistics
  totalImprovements: number;
  completedImprovements: number;
  successRate: number;
  averageImpact: number;
  averageExecutionTime: number;
  
  // By type
  byType: Record<ImprovementType, {
    count: number;
    completed: number;
    averageImpact: number;
    successRate: number;
  }>;
  
  // By priority
  byPriority: Record<ImprovementPriority, {
    count: number;
    completed: number;
    averageTime: number;
  }>;
  
  // By effort
  byEffort: Record<string, {
    count: number;
    completed: number;
    totalTime: number;
  }>;
  
  // Trends
  trends: {
    improvementsPerDay: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  };
  
  // Top improvements
  topImprovements: Array<{
    id: string;
    title: string;
    impact: number;
    effort: string;
  }>;
  
  // Bottlenecks
  bottlenecks?: string[];
  blockers?: string[];
  
  // Forecast
  estimatedCompletion?: Date;
  projectedQuality?: number;
}
```

### IImprovementEngine (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IImprovementEngine {
  analyze(context: unknown): Promise<Improvement[]>;
  prioritize(improvements: Improvement[]): Improvement[];
  createPlan(improvements: Improvement[]): ImprovementPlan;
  execute(improvement: Improvement): Promise<ImprovementExecutionResult>;
  track(plan: ImprovementPlan): ImprovementAnalytics;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IImprovementEngine {
  analyze(context: unknown): Promise<Improvement[]>;
  prioritize(improvements: Improvement[]): Improvement[];
  createPlan(improvements: Improvement[]): ImprovementPlan;
  execute(improvement: Improvement): Promise<ImprovementExecutionResult>;
  track(plan: ImprovementPlan): ImprovementAnalytics;
}
```

### TestAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestAnalysisResult {
  file: TestFileType;
  issues: IssueType[];
  detectionResults: DetectionResultType[];
  qualityScore: QualityScoreType;
  improvements: ImprovementType[];
  domainContext?: DomainContextType;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestAnalysisResult {
  file: TestFileType;
  issues: IssueType[];
  detectionResults: DetectionResultType[];
  qualityScore: QualityScoreType;
  improvements: ImprovementType[];
  domainContext?: DomainContextType;
}
```

### PluginExecutionContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginExecutionContext {
  project: ProjectContextType;
  file: TestFileType;
  analysis: AnalysisContextType;
  dictionary?: DomainDictionaryType;
  options?: AnalysisOptionsType;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginExecutionContext {
  project: ProjectContextType;
  file: TestFileType;
  analysis: AnalysisContextType;
  dictionary?: DomainDictionaryType;
  options?: AnalysisOptionsType;
}
```

### QualityScoreMap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualityScoreMap = Map<string, QualityScoreType>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualityScoreMap = Map<string, QualityScoreType>;
```

### ImprovementMap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementMap = Map<string, ImprovementType[]>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImprovementMap = Map<string, ImprovementType[]>;
```

### DetectionResultMap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetectionResultMap = Map<string, DetectionResultType[]>;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetectionResultMap = Map<string, DetectionResultType[]>;
```

### DeepPartial (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### RequireAtLeastOne (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
```

### Nullable (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/index.ts
- 種別: type
- エクスポート: exported
```typescript
export type Nullable<T> = T | null | undefined;
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Nullable<T> = T | null | undefined;
```

### ITestQualityPlugin (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITestQualityPlugin {
  // Plugin identification
  id: string;
  name: string;
  version: string;
  type: PluginType;
  
  // Plugin capabilities
  capabilities?: PluginCapabilities;
  
  // Plugin applicability
  isApplicable(context: ProjectContext): boolean;
  
  // Main functionality
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  evaluateQuality(patterns: DetectionResult[]): QualityScore;
  suggestImprovements(evaluation: QualityScore): Improvement[];
  
  // Optional functionality
  autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
  learn?(feedback: Feedback): void;
  configure?(config: Record<string, unknown>): void;
  validate?(testFile: TestFile): Promise<ValidationResult>;
  
  // Lifecycle hooks
  initialize?(context: ProjectContext): Promise<void>;
  beforeAnalysis?(context: AnalysisContext): Promise<void>;
  afterAnalysis?(result: AnalysisResult): Promise<void>;
  cleanup?(): Promise<void>;
  
  // Metadata
  metadata?: PluginMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITestQualityPlugin {
  // Plugin identification
  id: string;
  name: string;
  version: string;
  type: PluginType;
  
  // Plugin capabilities
  capabilities?: PluginCapabilities;
  
  // Plugin applicability
  isApplicable(context: ProjectContext): boolean;
  
  // Main functionality
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  evaluateQuality(patterns: DetectionResult[]): QualityScore;
  suggestImprovements(evaluation: QualityScore): Improvement[];
  
  // Optional functionality
  autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
  learn?(feedback: Feedback): void;
  configure?(config: Record<string, unknown>): void;
  validate?(testFile: TestFile): Promise<ValidationResult>;
  
  // Lifecycle hooks
  initialize?(context: ProjectContext): Promise<void>;
  beforeAnalysis?(context: AnalysisContext): Promise<void>;
  afterAnalysis?(result: AnalysisResult): Promise<void>;
  cleanup?(): Promise<void>;
  
  // Metadata
  metadata?: PluginMetadata;
}
```

### PluginCapabilities (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginCapabilities {
  languages?: string[];
  frameworks?: string[];
  fileTypes?: string[];
  features?: string[];
  autoFix?: boolean;
  learning?: boolean;
  incremental?: boolean;
  parallel?: boolean;
  streaming?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginCapabilities {
  languages?: string[];
  frameworks?: string[];
  fileTypes?: string[];
  features?: string[];
  autoFix?: boolean;
  learning?: boolean;
  incremental?: boolean;
  parallel?: boolean;
  streaming?: boolean;
}
```

### ConfigSchema (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}
```

### SchemaProperty (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}
```

### ValidationRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}
```

### ValidationResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  info?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  info?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/RealWorldProjectValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationResult {
  /** プロジェクト情報 */
  project: RealWorldProject;
  /** 解析結果 */
  analysisResults: MethodAnalysisResult[];
  /** パフォーマンス測定 */
  performanceMetrics: {
    totalTime: number;
    timePerFile: number;
    memoryUsage: number;
    throughput: number;
  };
  /** 精度評価 */
  accuracyMetrics: {
    detectedIssues: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  /** セキュリティ評価 */
  securityAssessment: {
    overallScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    coverageByCategory: {
      authentication: number;
      inputValidation: number;
      authorization: number;
      dataProtection: number;
    };
  };
  /** フレームワーク固有の評価 */
  frameworkSpecificFindings: FrameworkSpecificFinding[];
  /** パース エラー */
  parsingErrors: string[];
  /** 不足ファイル */
  missingFiles: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/migrationHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### ValidationError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationError {
  field?: string;
  rule?: string;
  message: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationError {
  field?: string;
  rule?: string;
  message: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
}
```

### ValidationWarning (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationWarning {
  field?: string;
  message: string;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ValidationWarning {
  field?: string;
  message: string;
  suggestion?: string;
}
```

### IPluginLoader (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginLoader {
  load(path: string): Promise<IPlugin | ITestQualityPlugin>;
  validate(plugin: unknown): boolean;
  isPluginFile(path: string): boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginLoader {
  load(path: string): Promise<IPlugin | ITestQualityPlugin>;
  validate(plugin: unknown): boolean;
  isPluginFile(path: string): boolean;
}
```

### IPluginRegistry (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginRegistry {
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(id: string): void;
  get(id: string): IPlugin | ITestQualityPlugin | undefined;
  getAll(): Array<IPlugin | ITestQualityPlugin>;
  has(id: string): boolean;
  clear(): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginRegistry {
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(id: string): void;
  get(id: string): IPlugin | ITestQualityPlugin | undefined;
  getAll(): Array<IPlugin | ITestQualityPlugin>;
  has(id: string): boolean;
  clear(): void;
}
```

### IPluginExecutor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginExecutor {
  execute(plugin: IPlugin | ITestQualityPlugin, context: AnalysisContext): Promise<PluginResult>;
  executeAll(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext): Promise<PluginResult[]>;
  executeParallel(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext, maxConcurrency?: number): Promise<PluginResult[]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IPluginExecutor {
  execute(plugin: IPlugin | ITestQualityPlugin, context: AnalysisContext): Promise<PluginResult>;
  executeAll(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext): Promise<PluginResult[]>;
  executeParallel(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext, maxConcurrency?: number): Promise<PluginResult[]>;
}
```

### PackageJsonConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageJsonConfig {
  name: string;
  version: string;
  description?: string;
  main?: string;
  type?: 'module' | 'commonjs';
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  } | string;
  keywords?: string[];
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  contributors?: Array<string | {
    name: string;
    email?: string;
    url?: string;
  }>;
  license?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  homepage?: string;
  private?: boolean;
  workspaces?: string[] | {
    packages?: string[];
    nohoist?: string[];
  };
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: string | Record<string, string>;
  man?: string | string[];
  directories?: {
    lib?: string;
    bin?: string;
    man?: string;
    doc?: string;
    example?: string;
    test?: string;
  };
  config?: Record<string, unknown>;
  publishConfig?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PackageJsonConfig {
  name: string;
  version: string;
  description?: string;
  main?: string;
  type?: 'module' | 'commonjs';
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  } | string;
  keywords?: string[];
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  contributors?: Array<string | {
    name: string;
    email?: string;
    url?: string;
  }>;
  license?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  homepage?: string;
  private?: boolean;
  workspaces?: string[] | {
    packages?: string[];
    nohoist?: string[];
  };
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: string | Record<string, string>;
  man?: string | string[];
  directories?: {
    lib?: string;
    bin?: string;
    man?: string;
    doc?: string;
    example?: string;
    test?: string;
  };
  config?: Record<string, unknown>;
  publishConfig?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}
```

### TSConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TSConfig {
  compilerOptions?: {
    // Type Checking
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    alwaysStrict?: boolean;
    exactOptionalPropertyTypes?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;
    noImplicitOverride?: boolean;
    noImplicitReturns?: boolean;
    noImplicitThis?: boolean;
    noPropertyAccessFromIndexSignature?: boolean;
    noUncheckedIndexedAccess?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    strict?: boolean;
    strictBindCallApply?: boolean;
    strictFunctionTypes?: boolean;
    strictNullChecks?: boolean;
    strictPropertyInitialization?: boolean;
    useUnknownInCatchVariables?: boolean;
    
    // Modules
    allowArbitraryExtensions?: boolean;
    allowImportingTsExtensions?: boolean;
    allowUmdGlobalAccess?: boolean;
    baseUrl?: string;
    customConditions?: string[];
    module?: string;
    moduleResolution?: 'node' | 'classic' | 'node16' | 'nodenext' | 'bundler';
    moduleSuffixes?: string[];
    noResolve?: boolean;
    paths?: Record<string, string[]>;
    resolveJsonModule?: boolean;
    resolvePackageJsonExports?: boolean;
    resolvePackageJsonImports?: boolean;
    rootDir?: string;
    rootDirs?: string[];
    typeRoots?: string[];
    types?: string[];
    
    // Emit
    declaration?: boolean;
    declarationDir?: string;
    declarationMap?: boolean;
    downlevelIteration?: boolean;
    emitBOM?: boolean;
    emitDeclarationOnly?: boolean;
    importHelpers?: boolean;
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error';
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    mapRoot?: string;
    newLine?: 'crlf' | 'lf';
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    outDir?: string;
    outFile?: string;
    preserveConstEnums?: boolean;
    preserveValueImports?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    stripInternal?: boolean;
    
    // JavaScript Support
    allowJs?: boolean;
    checkJs?: boolean;
    maxNodeModuleJsDepth?: number;
    
    // Editor Support
    disableSizeLimit?: boolean;
    plugins?: Array<{ name: string; [key: string]: unknown }>;
    
    // Interop Constraints
    allowSyntheticDefaultImports?: boolean;
    esModuleInterop?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    isolatedModules?: boolean;
    preserveSymlinks?: boolean;
    verbatimModuleSyntax?: boolean;
    
    // Language and Environment
    emitDecoratorMetadata?: boolean;
    experimentalDecorators?: boolean;
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native';
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    jsxImportSource?: string;
    lib?: string[];
    moduleDetection?: 'auto' | 'legacy' | 'force';
    noLib?: boolean;
    reactNamespace?: string;
    target?: string;
    useDefineForClassFields?: boolean;
    
    // Compiler Diagnostics
    diagnostics?: boolean;
    explainFiles?: boolean;
    extendedDiagnostics?: boolean;
    generateCpuProfile?: string;
    listEmittedFiles?: boolean;
    listFiles?: boolean;
    traceResolution?: boolean;
    
    // Projects
    composite?: boolean;
    disableReferencedProjectLoad?: boolean;
    disableSolutionSearching?: boolean;
    disableSourceOfProjectReferenceRedirect?: boolean;
    incremental?: boolean;
    tsBuildInfoFile?: string;
    
    // Output Formatting
    noErrorTruncation?: boolean;
    preserveWatchOutput?: boolean;
    pretty?: boolean;
    
    // Completeness
    skipDefaultLibCheck?: boolean;
    skipLibCheck?: boolean;
    
    [key: string]: unknown; // Allow additional options
  };
  include?: string[];
  exclude?: string[];
  files?: string[];
  extends?: string;
  references?: Array<{ path: string; prepend?: boolean }>;
  compileOnSave?: boolean;
  typeAcquisition?: {
    enable?: boolean;
    include?: string[];
    exclude?: string[];
    disableFilenameBasedTypeAcquisition?: boolean;
  };
  watchOptions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TSConfig {
  compilerOptions?: {
    // Type Checking
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    alwaysStrict?: boolean;
    exactOptionalPropertyTypes?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;
    noImplicitOverride?: boolean;
    noImplicitReturns?: boolean;
    noImplicitThis?: boolean;
    noPropertyAccessFromIndexSignature?: boolean;
    noUncheckedIndexedAccess?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    strict?: boolean;
    strictBindCallApply?: boolean;
    strictFunctionTypes?: boolean;
    strictNullChecks?: boolean;
    strictPropertyInitialization?: boolean;
    useUnknownInCatchVariables?: boolean;
    
    // Modules
    allowArbitraryExtensions?: boolean;
    allowImportingTsExtensions?: boolean;
    allowUmdGlobalAccess?: boolean;
    baseUrl?: string;
    customConditions?: string[];
    module?: string;
    moduleResolution?: 'node' | 'classic' | 'node16' | 'nodenext' | 'bundler';
    moduleSuffixes?: string[];
    noResolve?: boolean;
    paths?: Record<string, string[]>;
    resolveJsonModule?: boolean;
    resolvePackageJsonExports?: boolean;
    resolvePackageJsonImports?: boolean;
    rootDir?: string;
    rootDirs?: string[];
    typeRoots?: string[];
    types?: string[];
    
    // Emit
    declaration?: boolean;
    declarationDir?: string;
    declarationMap?: boolean;
    downlevelIteration?: boolean;
    emitBOM?: boolean;
    emitDeclarationOnly?: boolean;
    importHelpers?: boolean;
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error';
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    mapRoot?: string;
    newLine?: 'crlf' | 'lf';
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    outDir?: string;
    outFile?: string;
    preserveConstEnums?: boolean;
    preserveValueImports?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    stripInternal?: boolean;
    
    // JavaScript Support
    allowJs?: boolean;
    checkJs?: boolean;
    maxNodeModuleJsDepth?: number;
    
    // Editor Support
    disableSizeLimit?: boolean;
    plugins?: Array<{ name: string; [key: string]: unknown }>;
    
    // Interop Constraints
    allowSyntheticDefaultImports?: boolean;
    esModuleInterop?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    isolatedModules?: boolean;
    preserveSymlinks?: boolean;
    verbatimModuleSyntax?: boolean;
    
    // Language and Environment
    emitDecoratorMetadata?: boolean;
    experimentalDecorators?: boolean;
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native';
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    jsxImportSource?: string;
    lib?: string[];
    moduleDetection?: 'auto' | 'legacy' | 'force';
    noLib?: boolean;
    reactNamespace?: string;
    target?: string;
    useDefineForClassFields?: boolean;
    
    // Compiler Diagnostics
    diagnostics?: boolean;
    explainFiles?: boolean;
    extendedDiagnostics?: boolean;
    generateCpuProfile?: string;
    listEmittedFiles?: boolean;
    listFiles?: boolean;
    traceResolution?: boolean;
    
    // Projects
    composite?: boolean;
    disableReferencedProjectLoad?: boolean;
    disableSolutionSearching?: boolean;
    disableSourceOfProjectReferenceRedirect?: boolean;
    incremental?: boolean;
    tsBuildInfoFile?: string;
    
    // Output Formatting
    noErrorTruncation?: boolean;
    preserveWatchOutput?: boolean;
    pretty?: boolean;
    
    // Completeness
    skipDefaultLibCheck?: boolean;
    skipLibCheck?: boolean;
    
    [key: string]: unknown; // Allow additional options
  };
  include?: string[];
  exclude?: string[];
  files?: string[];
  extends?: string;
  references?: Array<{ path: string; prepend?: boolean }>;
  compileOnSave?: boolean;
  typeAcquisition?: {
    enable?: boolean;
    include?: string[];
    exclude?: string[];
    disableFilenameBasedTypeAcquisition?: boolean;
  };
  watchOptions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}
```

### TestFile (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestFile {
  path: string;
  content: string;
  framework?: string;
  testMethods?: TestMethod[]; // Properly typed, not any
  testCount?: number;
  hasTests?: boolean;
  ast?: ASTNode; // Properly typed, not any
  metadata?: {
    framework?: string;
    language: string;
    lastModified: Date;
    size?: number;
    encoding?: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestFile {
  path: string;
  content: string;
  framework?: string;
  testMethods?: TestMethod[]; // Properly typed, not any
  testCount?: number;
  hasTests?: boolean;
  ast?: ASTNode; // Properly typed, not any
  metadata?: {
    framework?: string;
    language: string;
    lastModified: Date;
    size?: number;
    encoding?: string;
  };
}
```

### MethodSignature (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodSignature {
  name: string;
  parameters: Array<{
    name: string;
    type?: string;
    source?: 'user-input' | 'database' | 'api' | 'constant';
  }>;
  returnType?: string;
  annotations: string[];
  isAsync: boolean;
  visibility?: 'private' | 'protected' | 'public';
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodSignature {
  name: string;
  parameters: Array<{
    name: string;
    type?: string;
    source?: 'user-input' | 'database' | 'api' | 'constant';
  }>;
  returnType?: string;
  annotations: string[];
  isAsync: boolean;
  visibility?: 'private' | 'protected' | 'public';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodSignature {
  className: string;
  methodName: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/polymorphic/library-method-handler.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodSignature {
  className: string;
  methodName: string;
  isPolymorphic: boolean;
  parameterIndices: number[];
  propagationRule: TaintPropagationRule;
  returnQualifier: TaintQualifier | null;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodSignature {
  /** メソッド名 */
  name: string;
  /** パラメータ */
  parameters: Parameter[];
  /** 戻り値の型 */
  returnType?: string;
  /** アノテーション */
  annotations: string[];
  /** アクセス修飾子 */
  visibility?: 'private' | 'protected' | 'public';
  /** 非同期かどうか */
  isAsync: boolean;
}
```

### TestMethod (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethod {
  name: string;
  type: 'test' | 'suite' | 'hook' | 'helper';
  location: {
    start: Position;
    end: Position;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  };
  async?: boolean;
  skip?: boolean;
  only?: boolean;
  timeout?: number;
  tags?: string[];
  assertions?: number | string[];
  description?: string;
  // 追加プロパティ（後方互換性のため）
  content?: string;
  body?: string;
  filePath?: string;
  signature?: string | MethodSignature;
  testType?: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'smoke';
  // Security-related properties
  securityRelevance?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethod {
  name: string;
  type: 'test' | 'suite' | 'hook' | 'helper';
  location: {
    start: Position;
    end: Position;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  };
  async?: boolean;
  skip?: boolean;
  only?: boolean;
  timeout?: number;
  tags?: string[];
  assertions?: number | string[];
  description?: string;
  // 追加プロパティ（後方互換性のため）
  content?: string;
  body?: string;
  filePath?: string;
  signature?: string | MethodSignature;
  testType?: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'smoke';
  // Security-related properties
  securityRelevance?: number;
}
```

### QualityDetails (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityDetails {
  // Analysis findings
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Risk assessment
  risks?: string[];
  opportunities?: string[];
  
  // Specific issues
  criticalIssues?: string[];
  warnings?: string[];
  info?: string[];
  
  // Metrics breakdown
  metrics?: QualityMetrics;
  
  // Evidence
  evidence?: QualityEvidence[];
  
  // Security-specific metrics
  validationCoverage?: number; // 0.0-1.0
  sanitizerCoverage?: number; // 0.0-1.0
  boundaryCoverage?: number; // 0.0-1.0
  sanitizationQuality?: number; // 0.0-1.0
  boundaryTestingScore?: number; // 0.0-1.0
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityDetails {
  // Analysis findings
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Risk assessment
  risks?: string[];
  opportunities?: string[];
  
  // Specific issues
  criticalIssues?: string[];
  warnings?: string[];
  info?: string[];
  
  // Metrics breakdown
  metrics?: QualityMetrics;
  
  // Evidence
  evidence?: QualityEvidence[];
  
  // Security-specific metrics
  validationCoverage?: number; // 0.0-1.0
  sanitizerCoverage?: number; // 0.0-1.0
  boundaryCoverage?: number; // 0.0-1.0
  sanitizationQuality?: number; // 0.0-1.0
  boundaryTestingScore?: number; // 0.0-1.0
}
```

### QualityMetrics (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityMetrics {
  // Test metrics
  testCoverage?: number;
  assertionDensity?: number;
  testComplexity?: number;
  testMaintainability?: number;
  
  // Code metrics
  codeComplexity?: number;
  duplicateCode?: number;
  codeSmells?: number;
  technicalDebt?: number;
  
  // Documentation metrics
  documentationCoverage?: number;
  commentDensity?: number;
  
  // Security metrics
  securityScore?: number;
  vulnerabilities?: number;
  securityHotspots?: number;
  
  // Performance metrics
  performanceScore?: number;
  slowTests?: number;
  memoryLeaks?: number;
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityMetrics {
  // Test metrics
  testCoverage?: number;
  assertionDensity?: number;
  testComplexity?: number;
  testMaintainability?: number;
  
  // Code metrics
  codeComplexity?: number;
  duplicateCode?: number;
  codeSmells?: number;
  technicalDebt?: number;
  
  // Documentation metrics
  documentationCoverage?: number;
  commentDensity?: number;
  
  // Security metrics
  securityScore?: number;
  vulnerabilities?: number;
  securityHotspots?: number;
  
  // Performance metrics
  performanceScore?: number;
  slowTests?: number;
  memoryLeaks?: number;
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}
```

#### /Users/sasakama/Projects/Rimor/src/monitoring/quality-dashboard.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityMetrics {
  timestamp: Date;
  
  // コードカバレッジ
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  // 型定義の健全性
  typeHealth: {
    totalTypes: number;
    conflicts: number;
    duplicates: number;
    missingTypes: number;
    consistency: number; // 0-100%
  };
  
  // テストの状態
  testStatus: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number; // ms
    flaky: string[]; // 不安定なテスト
  };
  
  // 技術的負債
  technicalDebt: {
    score: number; // 0-100 (100が最良)
    issues: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    estimatedTime: string; // 修正見積もり時間
  };
  
  // コード品質
  codeQuality: {
    complexity: {
      average: number;
      max: number;
      files: Array<{ path: string; complexity: number }>;
    };
    duplication: {
      percentage: number;
      blocks: number;
    };
    maintainability: number; // 0-100
  };
  
  // ビルド状態
  buildStatus: {
    success: boolean;
    errors: number;
    warnings: number;
    duration: number; // ms
    size: {
      total: number; // bytes
      main: number;
      vendor: number;
    };
  };
}
```

### QualityEvidence (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityEvidence {
  type: 'positive' | 'negative' | 'neutral';
  dimension: QualityDimension | string;
  description: string;
  impact: number; // -1.0 to 1.0
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  code?: string;
  suggestion?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityEvidence {
  type: 'positive' | 'negative' | 'neutral';
  dimension: QualityDimension | string;
  description: string;
  impact: number; // -1.0 to 1.0
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  code?: string;
  suggestion?: string;
}
```

### QualityTrend (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number; // Percentage change
  changeRate: number; // Rate of change per time unit
  history: QualityHistoryPoint[];
  forecast?: QualityForecast;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number; // Percentage change
  changeRate: number; // Rate of change per time unit
  history: QualityHistoryPoint[];
  forecast?: QualityForecast;
}
```

### QualityHistoryPoint (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityHistoryPoint {
  timestamp: Date;
  overall: number;
  dimensions: Partial<Record<QualityDimension, number>>;
  issueCount?: number;
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityHistoryPoint {
  timestamp: Date;
  overall: number;
  dimensions: Partial<Record<QualityDimension, number>>;
  issueCount?: number;
  metadata?: Record<string, unknown>;
}
```

### QualityForecast (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityForecast {
  nextPeriod: number; // Predicted score
  confidence: number; // Confidence in prediction
  factors: string[]; // Factors affecting the forecast
  recommendations: string[]; // Actions to improve forecast
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityForecast {
  nextPeriod: number; // Predicted score
  confidence: number; // Confidence in prediction
  factors: string[]; // Factors affecting the forecast
  recommendations: string[]; // Actions to improve forecast
}
```

### QualityBenchmarks (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityBenchmarks {
  industry?: {
    average: number;
    percentile: number;
    rank?: number;
    totalProjects?: number;
  };
  project?: {
    best: number;
    worst: number;
    average: number;
    median: number;
    standardDeviation: number;
  };
  team?: {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  customBenchmarks?: Record<string, number>;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityBenchmarks {
  industry?: {
    average: number;
    percentile: number;
    rank?: number;
    totalProjects?: number;
  };
  project?: {
    best: number;
    worst: number;
    average: number;
    median: number;
    standardDeviation: number;
  };
  team?: {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  customBenchmarks?: Record<string, number>;
}
```

### QualityGrade (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  label: string;
  description: string;
  color: string;
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  label: string;
  description: string;
  color: string;
  recommendations: string[];
}
```

### QualityReport (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityReport {
  // Identification
  id: string;
  projectId?: string;
  projectName?: string;
  
  // Timing
  timestamp: Date;
  analysisTime: number;
  
  // Scores
  overallScore: QualityScore;
  fileScores?: Map<string, QualityScore>;
  moduleScores?: Map<string, QualityScore>;
  
  // Grade
  grade: QualityGrade;
  
  // Summary
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    averageScore: number;
    highQualityFiles: number;
    lowQualityFiles: number;
    criticalIssues: number;
  };
  
  // Top issues
  topIssues?: Array<{
    type: string;
    count: number;
    severity: string;
    impact: number;
  }>;
  
  // Recommendations
  recommendations: QualityRecommendation[];
  
  // Comparison
  comparison?: {
    previous?: QualityScore;
    baseline?: QualityScore;
    target?: QualityScore;
  };
  
  // Metadata
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityReport {
  // Identification
  id: string;
  projectId?: string;
  projectName?: string;
  
  // Timing
  timestamp: Date;
  analysisTime: number;
  
  // Scores
  overallScore: QualityScore;
  fileScores?: Map<string, QualityScore>;
  moduleScores?: Map<string, QualityScore>;
  
  // Grade
  grade: QualityGrade;
  
  // Summary
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    averageScore: number;
    highQualityFiles: number;
    lowQualityFiles: number;
    criticalIssues: number;
  };
  
  // Top issues
  topIssues?: Array<{
    type: string;
    count: number;
    severity: string;
    impact: number;
  }>;
  
  // Recommendations
  recommendations: QualityRecommendation[];
  
  // Comparison
  comparison?: {
    previous?: QualityScore;
    baseline?: QualityScore;
    target?: QualityScore;
  };
  
  // Metadata
  metadata?: BaseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### QualityRecommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'quick-win' | 'improvement' | 'refactoring' | 'architectural';
  title: string;
  description: string;
  impact: number; // Expected improvement in score
  effort: 'low' | 'medium' | 'high'; // Implementation effort
  dimension: QualityDimension | string;
  examples?: string[];
  resources?: string[];
  estimatedTime?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'quick-win' | 'improvement' | 'refactoring' | 'architectural';
  title: string;
  description: string;
  impact: number; // Expected improvement in score
  effort: 'low' | 'medium' | 'high'; // Implementation effort
  dimension: QualityDimension | string;
  examples?: string[];
  resources?: string[];
  estimatedTime?: string;
}
```

### QualityConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityConfig {
  // Weights for dimensions
  dimensionWeights?: Partial<Record<QualityDimension, number>>;
  
  // Thresholds
  thresholds?: {
    minimum?: number;
    target?: number;
    excellent?: number;
  };
  
  // Grading scale
  gradingScale?: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
  }>;
  
  // Rules
  rules?: QualityRule[];
  
  // Custom dimensions
  customDimensions?: Array<{
    name: string;
    weight: number;
    description: string;
  }>;
  
  // Options
  options?: {
    includeHistory?: boolean;
    includeBenchmarks?: boolean;
    includeForecasts?: boolean;
    historicalPeriods?: number;
    benchmarkSource?: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityConfig {
  // Weights for dimensions
  dimensionWeights?: Partial<Record<QualityDimension, number>>;
  
  // Thresholds
  thresholds?: {
    minimum?: number;
    target?: number;
    excellent?: number;
  };
  
  // Grading scale
  gradingScale?: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
  }>;
  
  // Rules
  rules?: QualityRule[];
  
  // Custom dimensions
  customDimensions?: Array<{
    name: string;
    weight: number;
    description: string;
  }>;
  
  // Options
  options?: {
    includeHistory?: boolean;
    includeBenchmarks?: boolean;
    includeForecasts?: boolean;
    historicalPeriods?: number;
    benchmarkSource?: string;
  };
}
```

### QualityRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityRule {
  id: string;
  name: string;
  dimension: QualityDimension | string;
  condition: string; // Expression to evaluate
  impact: number; // Score impact when violated
  severity: 'info' | 'warning' | 'error';
  message: string;
  autoFixable?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface QualityRule {
  id: string;
  name: string;
  dimension: QualityDimension | string;
  condition: string; // Expression to evaluate
  impact: number; // Score impact when violated
  severity: 'info' | 'warning' | 'error';
  message: string;
  autoFixable?: boolean;
}
```

### WorkerTask (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerTask<T = unknown> {
  id: string;
  type: 'analyze';
  data: T;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}
```

#### /Users/sasakama/Projects/Rimor/src/core/workerPool.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerTask<T = unknown> {
  id: string;
  type: 'analyze';
  data: T;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/parallel-type-checker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerTask {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, QualifiedType<unknown>]>;
}
```

### WorkerInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskQueue: WorkerTask<unknown>[];
}
```

#### /Users/sasakama/Projects/Rimor/src/core/workerPool.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskQueue: WorkerTask<unknown>[];
}
```

### DomainRule (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'quality' | 'performance' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  patterns: RulePattern[];
  tags?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/domain/simple-rules.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'quality' | 'performance' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  patterns: RulePattern[];
  tags?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainRule {
  /**
   * パターン（正規表現）
   */
  pattern: RegExp;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}
```

### RulePattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RulePattern {
  type: 'regex' | 'ast' | 'keyword';
  pattern: string;
  message: string;
  fix?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain/simple-rules.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RulePattern {
  type: 'regex' | 'ast' | 'keyword';
  pattern: string;
  message: string;
  fix?: string;
}
```

### RuleEvaluationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  fix?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain/simple-rules.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  fix?: string;
}
```

### InteractiveDomainValidatorConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InteractiveDomainValidatorConfig {
  /** 確認をスキップするか */
  skipConfirmation?: boolean;
  /** 最大表示キーワード数 */
  maxDisplayKeywords?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/InteractiveDomainValidator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InteractiveDomainValidatorConfig {
  /** 確認をスキップするか */
  skipConfirmation?: boolean;
  /** 最大表示キーワード数 */
  maxDisplayKeywords?: number;
}
```

### KeywordExtractionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface KeywordExtractionResult {
  language: string;
  keywords: string[];
  confidence?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/MultilingualKeywordExtractor.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface KeywordExtractionResult {
  language: string;
  keywords: string[];
  confidence?: number;
}
```

### AnalysisMetadata (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisMetadata {
  version: string;
  timestamp: string;
  analyzedPath: string;
  duration: number;
}
```

### DomainAnalysisSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### DomainIssue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### StaticAnalysisSection (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface StaticAnalysisSection {
  /** 検出された問題 */
  issues: Issue[];
  
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### QualityScoreSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### RecommendationSection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### Recommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/UnifiedAnalysisResult.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### DomainAnalysisConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalysisConfig {
  /** 分析対象プロジェクトのパス */
  projectPath: string;
  
  /** 除外するパターン（glob形式） */
  excludePatterns: string[];
  
  /** サポートする拡張子 */
  supportedExtensions: string[];
  
  /** 最小キーワード頻度（これ以下は無視） */
  minKeywordFrequency: number;
  
  /** 最大クラスタ数 */
  maxClusters: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalysisConfig {
  /** 分析対象プロジェクトのパス */
  projectPath: string;
  
  /** 除外するパターン（glob形式） */
  excludePatterns: string[];
  
  /** サポートする拡張子 */
  supportedExtensions: string[];
  
  /** 最小キーワード頻度（これ以下は無視） */
  minKeywordFrequency: number;
  
  /** 最大クラスタ数 */
  maxClusters: number;
}
```

### KeywordInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface KeywordInfo {
  /** キーワード */
  keyword: string;
  
  /** 出現頻度 */
  frequency: number;
  
  /** TF-IDFスコア */
  tfidfScore?: number;
  
  /** 出現ファイル */
  files: string[];
  
  /** 言語（日本語/英語など） */
  language?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface KeywordInfo {
  /** キーワード */
  keyword: string;
  
  /** 出現頻度 */
  frequency: number;
  
  /** TF-IDFスコア */
  tfidfScore?: number;
  
  /** 出現ファイル */
  files: string[];
  
  /** 言語（日本語/英語など） */
  language?: string;
}
```

### DomainCluster (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCluster {
  /** クラスタID */
  id: string;
  
  /** ドメイン名（ユーザーが確認・修正可能） */
  name: string;
  
  /** クラスタに含まれるキーワード */
  keywords: string[];
  
  /** クラスタの信頼度（0-1） */
  confidence: number;
  
  /** クラスタに関連するファイル */
  files: string[];
  
  /** 中心となるキーワード（重心） */
  centroid?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainCluster {
  /** クラスタID */
  id: string;
  
  /** ドメイン名（ユーザーが確認・修正可能） */
  name: string;
  
  /** クラスタに含まれるキーワード */
  keywords: string[];
  
  /** クラスタの信頼度（0-1） */
  confidence: number;
  
  /** クラスタに関連するファイル */
  files: string[];
  
  /** 中心となるキーワード（重心） */
  centroid?: string[];
}
```

### IntegrityHash (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntegrityHash {
  /** SHA-256ハッシュ値 */
  hash: string;
  
  /** ハッシュ生成時刻 */
  timestamp: Date;
  
  /** ハッシュ対象のデータバージョン */
  version: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntegrityHash {
  /** SHA-256ハッシュ値 */
  hash: string;
  
  /** ハッシュ生成時刻 */
  timestamp: Date;
  
  /** ハッシュ対象のデータバージョン */
  version: string;
}
```

### DomainAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalysisResult {
  /** 検出されたドメインクラスタ */
  domains: DomainCluster[];
  
  /** 抽出されたキーワード情報 */
  keywords: Map<string, KeywordInfo>;
  
  /** 整合性ハッシュ */
  integrity?: IntegrityHash;
  
  /** 分析実行時刻 */
  timestamp: Date;
  
  /** 分析メタデータ */
  metadata?: {
    totalFiles: number;
    totalTokens: number;
    executionTime: number;
    languageDistribution?: Map<string, number>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainAnalysisResult {
  /** 検出されたドメインクラスタ */
  domains: DomainCluster[];
  
  /** 抽出されたキーワード情報 */
  keywords: Map<string, KeywordInfo>;
  
  /** 整合性ハッシュ */
  integrity?: IntegrityHash;
  
  /** 分析実行時刻 */
  timestamp: Date;
  
  /** 分析メタデータ */
  metadata?: {
    totalFiles: number;
    totalTokens: number;
    executionTime: number;
    languageDistribution?: Map<string, number>;
  };
}
```

### LanguageDetectionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LanguageDetectionResult {
  /** 検出された言語（ISO 639-3コード） */
  language: string;
  
  /** 信頼度スコア */
  confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LanguageDetectionResult {
  /** 検出された言語（ISO 639-3コード） */
  language: string;
  
  /** 信頼度スコア */
  confidence: number;
}
```

### TFIDFVector (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TFIDFVector {
  /** ドキュメントID（ファイルパス） */
  documentId: string;
  
  /** TF-IDFベクトル値 */
  vector: Map<string, number>;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TFIDFVector {
  /** ドキュメントID（ファイルパス） */
  documentId: string;
  
  /** TF-IDFベクトル値 */
  vector: Map<string, number>;
}
```

### ClusteringConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClusteringConfig {
  /** クラスタ数（K-MeansのK） */
  k: number;
  
  /** 最大反復回数 */
  maxIterations?: number;
  
  /** 収束閾値 */
  tolerance?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClusteringConfig {
  /** クラスタ数（K-MeansのK） */
  k: number;
  
  /** 最大反復回数 */
  maxIterations?: number;
  
  /** 収束閾値 */
  tolerance?: number;
}
```

### UserValidationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UserValidationResult {
  /** ユーザーが承認したドメイン */
  approvedDomains: DomainCluster[];
  
  /** ユーザーが修正したドメイン */
  modifiedDomains: DomainCluster[];
  
  /** ユーザーが拒否したドメイン */
  rejectedDomains: DomainCluster[];
  
  /** 検証完了フラグ */
  validated: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UserValidationResult {
  /** ユーザーが承認したドメイン */
  approvedDomains: DomainCluster[];
  
  /** ユーザーが修正したドメイン */
  modifiedDomains: DomainCluster[];
  
  /** ユーザーが拒否したドメイン */
  rejectedDomains: DomainCluster[];
  
  /** 検証完了フラグ */
  validated: boolean;
}
```

### DomainDefinition (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDefinition {
  /** スキーマバージョン */
  version: string;
  
  /** プロジェクト情報 */
  project: {
    name: string;
    path: string;
    analyzed: Date;
  };
  
  /** ドメインクラスタ */
  domains: DomainCluster[];
  
  /** 整合性ハッシュ */
  integrity: IntegrityHash;
  
  /** メタデータ */
  metadata?: Record<string, unknown>;
}
```

#### /Users/sasakama/Projects/Rimor/src/domain-analysis/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDefinition {
  /** スキーマバージョン */
  version: string;
  
  /** プロジェクト情報 */
  project: {
    name: string;
    path: string;
    analyzed: Date;
  };
  
  /** ドメインクラスタ */
  domains: DomainCluster[];
  
  /** 整合性ハッシュ */
  integrity: IntegrityHash;
  
  /** メタデータ */
  metadata?: Record<string, unknown>;
}
```

### UsageStats (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface UsageStats {
  totalAnalyses: number;
  averageTime: number;
  filesAnalyzed: number;
  issuesFound: number;
  frequency?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface UsageStats {
  totalAnalyses: number;
  averageTime: number;
  filesAnalyzed: number;
  issuesFound: number;
  frequency?: number;
}
```

### AccuracyAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AccuracyAnalysis {
  falsePositiveRate: number;
  commonFalsePositives: string[];
  missedIssueRate?: number;
  topProblematicPatterns?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AccuracyAnalysis {
  falsePositiveRate: number;
  commonFalsePositives: string[];
  missedIssueRate?: number;
  topProblematicPatterns?: string[];
}
```

### PerformanceAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceAnalysis {
  averageAnalysisTime: number;
  slowFiles: string[];
  slowestOperations?: string[];
  memoryUsageComplaints?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceAnalysis {
  averageAnalysisTime: number;
  slowFiles: string[];
  slowestOperations?: string[];
  memoryUsageComplaints?: number;
}
```

### FeatureUsageAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FeatureUsageAnalysis {
  mostUsed: Array<{ feature: string; count: number }>;
  requested: Array<{ feature: string; count: number }>;
  mostUsedFeatures?: string[];
  leastUsedFeatures?: string[];
  requestedFeatures?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FeatureUsageAnalysis {
  mostUsed: Array<{ feature: string; count: number }>;
  requested: Array<{ feature: string; count: number }>;
  mostUsedFeatures?: string[];
  leastUsedFeatures?: string[];
  requestedFeatures?: string[];
}
```

### ProjectFeedback (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectFeedback {
  projectId: string;
  projectName: string;
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'other';
  projectSize: {
    fileCount: number;
    testCount: number;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
  };
  usageMetrics: {
    analysisFrequency: number; // per week
    averageAnalysisTime: number; // ms
    issuesDetected: number;
    issuesResolved: number;
  };
  userExperience: {
    satisfaction: number; // 1-10
    easeOfUse: number; // 1-10
    accuracyRating: number; // 1-10
    performanceRating: number; // 1-10
    overallValue: number; // 1-10
  };
  specificFeedback: {
    mostUsefulFeatures: string[];
    painPoints: string[];
    improvementSuggestions: string[];
    falsePositives: FalsePositiveReport[];
    missedIssues: MissedIssueReport[];
  };
  timestamp: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ProjectFeedback {
  projectId: string;
  projectName: string;
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'other';
  projectSize: {
    fileCount: number;
    testCount: number;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
  };
  usageMetrics: {
    analysisFrequency: number; // per week
    averageAnalysisTime: number; // ms
    issuesDetected: number;
    issuesResolved: number;
  };
  userExperience: {
    satisfaction: number; // 1-10
    easeOfUse: number; // 1-10
    accuracyRating: number; // 1-10
    performanceRating: number; // 1-10
    overallValue: number; // 1-10
  };
  specificFeedback: {
    mostUsefulFeatures: string[];
    painPoints: string[];
    improvementSuggestions: string[];
    falsePositives: FalsePositiveReport[];
    missedIssues: MissedIssueReport[];
  };
  timestamp: Date;
}
```

### FalsePositiveReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FalsePositiveReport {
  issueType: string;
  description: string;
  codeSnippet: string;
  expectedBehavior: string;
  actualBehavior: string;
  impact: 'low' | 'medium' | 'high';
  frequency: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FalsePositiveReport {
  issueType: string;
  description: string;
  codeSnippet: string;
  expectedBehavior: string;
  actualBehavior: string;
  impact: 'low' | 'medium' | 'high';
  frequency: number;
}
```

### MissedIssueReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MissedIssueReport {
  description: string;
  securityImplication: string;
  codeSnippet: string;
  suggestedDetection: string;
  impact: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MissedIssueReport {
  description: string;
  securityImplication: string;
  codeSnippet: string;
  suggestedDetection: string;
  impact: 'low' | 'medium' | 'high';
}
```

### FeedbackAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FeedbackAnalysisResult {
  overallSatisfaction: number;
  commonPainPoints: string[];
  prioritizedImprovements: ImprovementItem[];
  accuracyIssues: {
    falsePositiveRate: number;
    missedIssueRate: number;
    topProblematicPatterns: string[];
  };
  performanceIssues: {
    averageAnalysisTime: number;
    slowestOperations: string[];
    memoryUsageComplaints: number;
  };
  featureUsage: {
    mostUsedFeatures: string[];
    leastUsedFeatures: string[];
    requestedFeatures: string[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FeedbackAnalysisResult {
  overallSatisfaction: number;
  commonPainPoints: string[];
  prioritizedImprovements: ImprovementItem[];
  accuracyIssues: {
    falsePositiveRate: number;
    missedIssueRate: number;
    topProblematicPatterns: string[];
  };
  performanceIssues: {
    averageAnalysisTime: number;
    slowestOperations: string[];
    memoryUsageComplaints: number;
  };
  featureUsage: {
    mostUsedFeatures: string[];
    leastUsedFeatures: string[];
    requestedFeatures: string[];
  };
}
```

### ImprovementItem (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  category: 'accuracy' | 'performance' | 'usability' | 'features';
  affectedUsers: number;
  estimatedImplementationTime: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImprovementItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  category: 'accuracy' | 'performance' | 'usability' | 'features';
  affectedUsers: number;
  estimatedImplementationTime: string;
}
```

### IndividualFeedback (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface IndividualFeedback {
  issueId: string;
  falsePositive?: boolean;
  actualSeverity?: string;
  userComment?: string;
  timestamp?: Date;
  rule?: string;
  impact?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface IndividualFeedback {
  issueId: string;
  falsePositive?: boolean;
  actualSeverity?: string;
  userComment?: string;
  timestamp?: Date;
  rule?: string;
  impact?: string;
}
```

### PerformanceData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceData {
  file: string;
  analysisTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceData {
  file: string;
  analysisTime: number;
}
```

### TimeImpactData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TimeImpactData {
  issueId: string;
  timeSpentInvestigating: number;
  wasRealIssue: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/feedback/FeedbackCollectionSystem.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TimeImpactData {
  issueId: string;
  timeSpentInvestigating: number;
  wasRealIssue: boolean;
}
```

### MergeStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum MergeStrategy {
  SINGLE = 'single',           // 単一AST（マージ不要）
  SEQUENTIAL = 'sequential',   // 順次マージ
  HIERARCHICAL = 'hierarchical', // 階層的マージ
  INTELLIGENT = 'intelligent'  // インテリジェントマージ（重複削除等）
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ASTMerger.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum MergeStrategy {
  SINGLE = 'single',           // 単一AST（マージ不要）
  SEQUENTIAL = 'sequential',   // 順次マージ
  HIERARCHICAL = 'hierarchical', // 階層的マージ
  INTELLIGENT = 'intelligent'  // インテリジェントマージ（重複削除等）
}
```

### MergeError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface MergeError {
  type: 'structure' | 'position' | 'validation';
  message: string;
  location?: { row: number; column: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ASTMerger.ts
- 種別: interface
- エクスポート: internal
```typescript
interface MergeError {
  type: 'structure' | 'position' | 'validation';
  message: string;
  location?: { row: number; column: number };
}
```

### MergeMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MergeMetadata {
  strategy: MergeStrategy;
  nodeCount: number;
  mergedChunks: number;
  positionsAdjusted: boolean;
  hasOverlap: boolean;
  structureValid: boolean;
  errors: MergeError[];
  warnings: string[];
  duplicatesRemoved?: number;
  hasErrors?: boolean;
  errorNodes?: number;
  recoverable?: boolean;
  mergeTime?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ASTMerger.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MergeMetadata {
  strategy: MergeStrategy;
  nodeCount: number;
  mergedChunks: number;
  positionsAdjusted: boolean;
  hasOverlap: boolean;
  structureValid: boolean;
  errors: MergeError[];
  warnings: string[];
  duplicatesRemoved?: number;
  hasErrors?: boolean;
  errorNodes?: number;
  recoverable?: boolean;
  mergeTime?: number;
}
```

### MergeResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MergeResult {
  ast: ASTNode;
  metadata: MergeMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ASTMerger.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MergeResult {
  ast: ASTNode;
  metadata: MergeMetadata;
}
```

### ASTMergerConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTMergerConfig {
  validateStructure?: boolean;
  preservePositions?: boolean;
  mergeStrategy?: MergeStrategy;
  removeduplicates?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ASTMerger.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ASTMergerConfig {
  validateStructure?: boolean;
  preservePositions?: boolean;
  mergeStrategy?: MergeStrategy;
  removeduplicates?: boolean;
}
```

### ParserStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ParserStrategy {
  TREE_SITTER = 'tree-sitter',
  BABEL = 'babel',
  HYBRID = 'hybrid',
  SMART_CHUNKING = 'smart-chunking'
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/HybridParser.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ParserStrategy {
  TREE_SITTER = 'tree-sitter',
  BABEL = 'babel',
  HYBRID = 'hybrid',
  SMART_CHUNKING = 'smart-chunking'
}
```

### ParseMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParseMetadata {
  strategy: ParserStrategy;
  truncated: boolean;
  originalSize: number;
  parsedSize: number;
  parseTime: number;
  fallbackReason?: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
    lastCompleteBoundary?: number;
  };
  // SmartChunking関連
  chunked?: boolean;
  chunks?: number;
  astsMerged?: number;
  mergeStrategy?: string;
  syntaxBoundaryChunking?: boolean;
  hasErrors?: boolean;
  recoverable?: boolean;
  nodeCount?: number;
  cacheHit?: boolean;
  language?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/HybridParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParseMetadata {
  strategy: ParserStrategy;
  truncated: boolean;
  originalSize: number;
  parsedSize: number;
  parseTime: number;
  fallbackReason?: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
    lastCompleteBoundary?: number;
  };
  // SmartChunking関連
  chunked?: boolean;
  chunks?: number;
  astsMerged?: number;
  mergeStrategy?: string;
  syntaxBoundaryChunking?: boolean;
  hasErrors?: boolean;
  recoverable?: boolean;
  nodeCount?: number;
  cacheHit?: boolean;
  language?: string;
}
```

### ParseResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParseResult {
  ast: ASTNode;
  metadata: ParseMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/HybridParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParseResult {
  ast: ASTNode;
  metadata: ParseMetadata;
}
```

### HybridParserConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HybridParserConfig {
  /** 32KB制限 - tree-sitterの最大サイズ */
  maxTreeSitterSize?: number;
  /** フォールバック戦略を有効化 */
  enableFallback?: boolean;
  /** スマート切り詰めを有効化 */
  enableSmartTruncation?: boolean;
  /** 警告表示を有効化 */
  enableWarnings?: boolean;
  /** SmartChunkingを有効化 */
  enableSmartChunking?: boolean;
  /** チャンキングを開始するサイズ */
  chunkingThreshold?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/HybridParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HybridParserConfig {
  /** 32KB制限 - tree-sitterの最大サイズ */
  maxTreeSitterSize?: number;
  /** フォールバック戦略を有効化 */
  enableFallback?: boolean;
  /** スマート切り詰めを有効化 */
  enableSmartTruncation?: boolean;
  /** 警告表示を有効化 */
  enableWarnings?: boolean;
  /** SmartChunkingを有効化 */
  enableSmartChunking?: boolean;
  /** チャンキングを開始するサイズ */
  chunkingThreshold?: number;
}
```

### BusinessLogicMapping (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessLogicMapping {
  /**
   * テストファイルパス
   */
  testFilePath: string;
  
  /**
   * 関連するビジネスロジックファイル
   */
  businessLogicFiles: BusinessLogicFile[];
  
  /**
   * カバレッジの深さ（0-1）
   */
  coverageDepth: number;
  
  /**
   * ビジネスクリティカル度
   */
  businessCriticality: BusinessCriticality;
  
  /**
   * 影響範囲
   */
  impactScope: ImpactScope;
  
  /**
   * リスク評価
   */
  riskAssessment: RiskAssessment;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessLogicMapping {
  /**
   * テストファイルパス
   */
  testFilePath: string;
  
  /**
   * 関連するビジネスロジックファイル
   */
  businessLogicFiles: BusinessLogicFile[];
  
  /**
   * カバレッジの深さ（0-1）
   */
  coverageDepth: number;
  
  /**
   * ビジネスクリティカル度
   */
  businessCriticality: BusinessCriticality;
  
  /**
   * 影響範囲
   */
  impactScope: ImpactScope;
  
  /**
   * リスク評価
   */
  riskAssessment: RiskAssessment;
}
```

### BusinessLogicFile (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessLogicFile {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * ドメイン情報
   */
  domain: DomainInference;
  
  /**
   * 関数/メソッド一覧
   */
  functions: BusinessFunction[];
  
  /**
   * 重要度スコア（0-100）
   */
  importanceScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessLogicFile {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * ドメイン情報
   */
  domain: DomainInference;
  
  /**
   * 関数/メソッド一覧
   */
  functions: BusinessFunction[];
  
  /**
   * 重要度スコア（0-100）
   */
  importanceScore: number;
}
```

### BusinessFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessFunction {
  /**
   * 関数名
   */
  name: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * テストされているか
   */
  isTested: boolean;
  
  /**
   * 複雑度
   */
  complexity: number;
  
  /**
   * 依存関係の数
   */
  dependencyCount: number;
  
  /**
   * ビジネスルールを含むか
   */
  containsBusinessRules: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessFunction {
  /**
   * 関数名
   */
  name: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * テストされているか
   */
  isTested: boolean;
  
  /**
   * 複雑度
   */
  complexity: number;
  
  /**
   * 依存関係の数
   */
  dependencyCount: number;
  
  /**
   * ビジネスルールを含むか
   */
  containsBusinessRules: boolean;
}
```

### BusinessCriticality (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessCriticality {
  /**
   * レベル
   */
  level: 'critical' | 'high' | 'medium' | 'low';
  
  /**
   * 理由
   */
  reasons: string[];
  
  /**
   * スコア（0-100）
   */
  score: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BusinessCriticality {
  /**
   * レベル
   */
  level: 'critical' | 'high' | 'medium' | 'low';
  
  /**
   * 理由
   */
  reasons: string[];
  
  /**
   * スコア（0-100）
   */
  score: number;
}
```

### ImpactScope (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactScope {
  /**
   * 直接影響を受けるファイル数
   */
  directImpact: number;
  
  /**
   * 間接影響を受けるファイル数
   */
  indirectImpact: number;
  
  /**
   * 影響を受けるドメイン
   */
  affectedDomains: string[];
  
  /**
   * クリティカルパスに含まれるか
   */
  onCriticalPath: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactScope {
  /**
   * 直接影響を受けるファイル数
   */
  directImpact: number;
  
  /**
   * 間接影響を受けるファイル数
   */
  indirectImpact: number;
  
  /**
   * 影響を受けるドメイン
   */
  affectedDomains: string[];
  
  /**
   * クリティカルパスに含まれるか
   */
  onCriticalPath: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactScope {
  totalAssets: number;
  criticalAssets: number;
  overallImpact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### DomainImportanceConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainImportanceConfig {
  /**
   * 重要度レベルごとの重み
   */
  weightMap?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /**
   * クリティカルドメインのリスト
   */
  criticalDomains?: string[];
  
  /**
   * ドメインボーナスポイント
   */
  domainBonus?: number;
  
  /**
   * 特定ドメインの重要度強制設定を無効化
   */
  disableDomainOverrides?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainImportanceConfig {
  /**
   * 重要度レベルごとの重み
   */
  weightMap?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /**
   * クリティカルドメインのリスト
   */
  criticalDomains?: string[];
  
  /**
   * ドメインボーナスポイント
   */
  domainBonus?: number;
  
  /**
   * 特定ドメインの重要度強制設定を無効化
   */
  disableDomainOverrides?: boolean;
}
```

### IBusinessLogicMapper (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IBusinessLogicMapper {
  /**
   * テストファイルからビジネスロジックへのマッピング
   */
  mapTestToBusinessLogic(
    testFilePath: string,
    callGraph: CallGraphNode[],
    typeInfo: Map<string, TypeInfo>
  ): Promise<BusinessLogicMapping>;
  
  /**
   * ビジネス重要度の計算
   */
  calculateBusinessImportance(
    functions: BusinessFunction[],
    domain: DomainInference
  ): Promise<BusinessCriticality>;
  
  /**
   * 影響範囲の分析
   */
  analyzeImpactScope(
    callGraph: CallGraphNode[],
    startNode: CallGraphNode
  ): Promise<ImpactScope>;
  
  /**
   * ビジネスルールの検出
   */
  detectBusinessRules(
    functionBody: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<boolean>;
  
  /**
   * クリティカルパスの判定
   */
  isOnCriticalPath(
    node: CallGraphNode,
    domains: string[]
  ): Promise<boolean>;
  
  /**
   * ドメイン重要度設定を適用
   */
  setDomainImportanceConfig(config: DomainImportanceConfig): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IBusinessLogicMapper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IBusinessLogicMapper {
  /**
   * テストファイルからビジネスロジックへのマッピング
   */
  mapTestToBusinessLogic(
    testFilePath: string,
    callGraph: CallGraphNode[],
    typeInfo: Map<string, TypeInfo>
  ): Promise<BusinessLogicMapping>;
  
  /**
   * ビジネス重要度の計算
   */
  calculateBusinessImportance(
    functions: BusinessFunction[],
    domain: DomainInference
  ): Promise<BusinessCriticality>;
  
  /**
   * 影響範囲の分析
   */
  analyzeImpactScope(
    callGraph: CallGraphNode[],
    startNode: CallGraphNode
  ): Promise<ImpactScope>;
  
  /**
   * ビジネスルールの検出
   */
  detectBusinessRules(
    functionBody: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<boolean>;
  
  /**
   * クリティカルパスの判定
   */
  isOnCriticalPath(
    node: CallGraphNode,
    domains: string[]
  ): Promise<boolean>;
  
  /**
   * ドメイン重要度設定を適用
   */
  setDomainImportanceConfig(config: DomainImportanceConfig): void;
}
```

### DomainInference (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainInference {
  /**
   * 推論されたドメイン名
   */
  domain: string;
  
  /**
   * 推論の信頼度（0-1）
   */
  confidence: number;
  
  /**
   * 関連する概念
   */
  concepts: string[];
  
  /**
   * ビジネス重要度
   */
  businessImportance: BusinessImportance;
  
  /**
   * 関連するドメイン（オプション）
   */
  relatedDomains?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainInference {
  /**
   * 推論されたドメイン名
   */
  domain: string;
  
  /**
   * 推論の信頼度（0-1）
   */
  confidence: number;
  
  /**
   * 関連する概念
   */
  concepts: string[];
  
  /**
   * ビジネス重要度
   */
  businessImportance: BusinessImportance;
  
  /**
   * 関連するドメイン（オプション）
   */
  relatedDomains?: string[];
}
```

### BusinessImportance (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type BusinessImportance = 'critical' | 'high' | 'medium' | 'low';
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: type
- エクスポート: exported
```typescript
export type BusinessImportance = 'critical' | 'high' | 'medium' | 'low';
```

### DomainDictionaryEntry (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionaryEntry {
  /**
   * 用語
   */
  term: string;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainDictionaryEntry {
  /**
   * 用語
   */
  term: string;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}
```

### ConfidenceConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfidenceConfig {
  /**
   * タイプ名に対する信頼度のマッピング
   */
  typeConfidenceMap?: Record<string, number>;
  
  /**
   * ドメインに対する信頼度のマッピング
   */
  domainConfidenceMap?: Record<string, number>;
  
  /**
   * デフォルトの信頼度
   */
  defaultConfidence?: number;
  
  /**
   * 複数の証拠が重なった場合の信頼度増加率
   */
  evidenceBoostFactor?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfidenceConfig {
  /**
   * タイプ名に対する信頼度のマッピング
   */
  typeConfidenceMap?: Record<string, number>;
  
  /**
   * ドメインに対する信頼度のマッピング
   */
  domainConfidenceMap?: Record<string, number>;
  
  /**
   * デフォルトの信頼度
   */
  defaultConfidence?: number;
  
  /**
   * 複数の証拠が重なった場合の信頼度増加率
   */
  evidenceBoostFactor?: number;
}
```

### IDomainInferenceEngine (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainInferenceEngine {
  /**
   * 型情報からドメインを推論
   */
  inferDomainFromType(typeInfo: TypeInfo): Promise<DomainInference>;
  
  /**
   * 文脈情報からドメインを推論
   */
  inferDomainFromContext(context: DomainContext): Promise<DomainInference>;
  
  /**
   * ドメインのビジネス重要度を取得
   */
  getDomainImportance(domain: string): Promise<BusinessImportance>;
  
  /**
   * ドメイン辞書を読み込む
   */
  loadDictionary(dictionary: DomainDictionary): Promise<void>;
  
  /**
   * 複数の推論結果を統合
   */
  mergeInferences(inferences: DomainInference[]): DomainInference;
  
  /**
   * 信頼度設定を適用
   */
  setConfidenceConfig(config: ConfidenceConfig): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IDomainInferenceEngine.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IDomainInferenceEngine {
  /**
   * 型情報からドメインを推論
   */
  inferDomainFromType(typeInfo: TypeInfo): Promise<DomainInference>;
  
  /**
   * 文脈情報からドメインを推論
   */
  inferDomainFromContext(context: DomainContext): Promise<DomainInference>;
  
  /**
   * ドメインのビジネス重要度を取得
   */
  getDomainImportance(domain: string): Promise<BusinessImportance>;
  
  /**
   * ドメイン辞書を読み込む
   */
  loadDictionary(dictionary: DomainDictionary): Promise<void>;
  
  /**
   * 複数の推論結果を統合
   */
  mergeInferences(inferences: DomainInference[]): DomainInference;
  
  /**
   * 信頼度設定を適用
   */
  setConfidenceConfig(config: ConfidenceConfig): void;
}
```

### TestIntent (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestIntent {
  /**
   * テストの意図を表す説明文
   */
  description: string;
  
  /**
   * テスト対象のメソッド/関数名
   */
  targetMethod?: string;
  
  /**
   * テストシナリオ（Given-When-Then形式）
   */
  scenario?: {
    given?: string;
    when?: string;
    then?: string;
  };
  
  /**
   * テストのタイプ（unit, integration, e2e等）
   */
  testType: TestType;
  
  /**
   * 期待される動作
   */
  expectedBehavior: string[];
  
  /**
   * カバレッジ範囲
   */
  coverageScope: CoverageScope;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestIntent {
  /**
   * テストの意図を表す説明文
   */
  description: string;
  
  /**
   * テスト対象のメソッド/関数名
   */
  targetMethod?: string;
  
  /**
   * テストシナリオ（Given-When-Then形式）
   */
  scenario?: {
    given?: string;
    when?: string;
    then?: string;
  };
  
  /**
   * テストのタイプ（unit, integration, e2e等）
   */
  testType: TestType;
  
  /**
   * 期待される動作
   */
  expectedBehavior: string[];
  
  /**
   * カバレッジ範囲
   */
  coverageScope: CoverageScope;
}
```

### CoverageScope (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CoverageScope {
  /**
   * ハッピーパスのカバレッジ
   */
  happyPath: boolean;
  
  /**
   * エラーケースのカバレッジ
   */
  errorCases: boolean;
  
  /**
   * エッジケースのカバレッジ
   */
  edgeCases: boolean;
  
  /**
   * 境界値のカバレッジ
   */
  boundaryValues: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CoverageScope {
  /**
   * ハッピーパスのカバレッジ
   */
  happyPath: boolean;
  
  /**
   * エラーケースのカバレッジ
   */
  errorCases: boolean;
  
  /**
   * エッジケースのカバレッジ
   */
  edgeCases: boolean;
  
  /**
   * 境界値のカバレッジ
   */
  boundaryValues: boolean;
}
```

### TestRealizationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestRealizationResult {
  /**
   * 意図した内容
   */
  intent: TestIntent;
  
  /**
   * 実際のテストコード分析結果
   */
  actual: ActualTestAnalysis;
  
  /**
   * ギャップ分析
   */
  gaps: TestGap[];
  
  /**
   * 実現度スコア（0-100）
   */
  realizationScore: number;
  
  /**
   * リスクレベル
   */
  riskLevel: IntentRiskLevel;
  
  /**
   * テストファイルパス（レポート生成用）
   */
  file?: string;
  
  /**
   * テストの説明（レポート生成用）
   */
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestRealizationResult {
  /**
   * 意図した内容
   */
  intent: TestIntent;
  
  /**
   * 実際のテストコード分析結果
   */
  actual: ActualTestAnalysis;
  
  /**
   * ギャップ分析
   */
  gaps: TestGap[];
  
  /**
   * 実現度スコア（0-100）
   */
  realizationScore: number;
  
  /**
   * リスクレベル
   */
  riskLevel: IntentRiskLevel;
  
  /**
   * テストファイルパス（レポート生成用）
   */
  file?: string;
  
  /**
   * テストの説明（レポート生成用）
   */
  description?: string;
}
```

### ActualTestAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ActualTestAnalysis {
  /**
   * 実際にテストされているメソッド
   */
  actualTargetMethods: string[];
  
  /**
   * 実際のアサーション
   */
  assertions: TestAssertion[];
  
  /**
   * 実際のカバレッジ
   */
  actualCoverage: CoverageScope;
  
  /**
   * テストの複雑度
   */
  complexity: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ActualTestAnalysis {
  /**
   * 実際にテストされているメソッド
   */
  actualTargetMethods: string[];
  
  /**
   * 実際のアサーション
   */
  assertions: TestAssertion[];
  
  /**
   * 実際のカバレッジ
   */
  actualCoverage: CoverageScope;
  
  /**
   * テストの複雑度
   */
  complexity: number;
}
```

### TestAssertion (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestAssertion {
  type: string;
  expected: string;
  actual: string;
  location: {
    line: number;
    column: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestAssertion {
  type: string;
  expected: string;
  actual: string;
  location: {
    line: number;
    column: number;
  };
}
```

### TestGap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestGap {
  /**
   * ギャップの種類
   */
  type: GapType;
  
  /**
   * ギャップの説明
   */
  description: string;
  
  /**
   * 重要度
   */
  severity: Severity;
  
  /**
   * 改善提案
   */
  suggestions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestGap {
  /**
   * ギャップの種類
   */
  type: GapType;
  
  /**
   * ギャップの説明
   */
  description: string;
  
  /**
   * 重要度
   */
  severity: Severity;
  
  /**
   * 改善提案
   */
  suggestions: string[];
}
```

### GapType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum GapType {
  MISSING_ASSERTION = 'missing_assertion',
  INCOMPLETE_COVERAGE = 'incomplete_coverage',
  WRONG_TARGET = 'wrong_target',
  MISSING_ERROR_CASE = 'missing_error_case',
  MISSING_EDGE_CASE = 'missing_edge_case',
  UNCLEAR_INTENT = 'unclear_intent'
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum GapType {
  MISSING_ASSERTION = 'missing_assertion',
  INCOMPLETE_COVERAGE = 'incomplete_coverage',
  WRONG_TARGET = 'wrong_target',
  MISSING_ERROR_CASE = 'missing_error_case',
  MISSING_EDGE_CASE = 'missing_edge_case',
  UNCLEAR_INTENT = 'unclear_intent'
}
```

### Severity (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}
```

### IntentRiskLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum IntentRiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum IntentRiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}
```

### ITestIntentAnalyzer (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITestIntentAnalyzer {
  /**
   * テストファイルから意図を抽出
   */
  extractIntent(testFilePath: string, ast: ASTNode): Promise<TestIntent>;
  
  /**
   * 実際のテスト実装を分析
   */
  analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis>;
  
  /**
   * テスト意図と実装のギャップを評価
   */
  evaluateRealization(
    intent: TestIntent,
    actual: ActualTestAnalysis
  ): Promise<TestRealizationResult>;
  
  /**
   * リスク評価
   */
  assessRisk(gaps: TestGap[]): IntentRiskLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITestIntentAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITestIntentAnalyzer {
  /**
   * テストファイルから意図を抽出
   */
  extractIntent(testFilePath: string, ast: ASTNode): Promise<TestIntent>;
  
  /**
   * 実際のテスト実装を分析
   */
  analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis>;
  
  /**
   * テスト意図と実装のギャップを評価
   */
  evaluateRealization(
    intent: TestIntent,
    actual: ActualTestAnalysis
  ): Promise<TestRealizationResult>;
  
  /**
   * リスク評価
   */
  assessRisk(gaps: TestGap[]): IntentRiskLevel;
}
```

### TypeInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInfo {
  /**
   * 型の名前
   */
  typeName: string;
  
  /**
   * プリミティブ型かどうか
   */
  isPrimitive: boolean;
  
  /**
   * ジェネリック型の場合の型引数
   */
  typeArguments?: TypeInfo[];
  
  /**
   * ユニオン型の場合の構成型
   */
  unionTypes?: TypeInfo[];
  
  /**
   * 関数型の場合のシグネチャ
   */
  functionSignature?: {
    parameters: TypeInfo[];
    returnType: TypeInfo;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITypeScriptAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInfo {
  /**
   * 型の名前
   */
  typeName: string;
  
  /**
   * プリミティブ型かどうか
   */
  isPrimitive: boolean;
  
  /**
   * ジェネリック型の場合の型引数
   */
  typeArguments?: TypeInfo[];
  
  /**
   * ユニオン型の場合の構成型
   */
  unionTypes?: TypeInfo[];
  
  /**
   * 関数型の場合のシグネチャ
   */
  functionSignature?: {
    parameters: TypeInfo[];
    returnType: TypeInfo;
  };
}
```

### CallGraphNode (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CallGraphNode {
  /**
   * 関数/メソッド名
   */
  name: string;
  
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * この関数が呼び出す関数
   */
  calls: CallGraphNode[];
  
  /**
   * この関数を呼び出す関数
   */
  calledBy: CallGraphNode[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITypeScriptAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CallGraphNode {
  /**
   * 関数/メソッド名
   */
  name: string;
  
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * この関数が呼び出す関数
   */
  calls: CallGraphNode[];
  
  /**
   * この関数を呼び出す関数
   */
  calledBy: CallGraphNode[];
}
```

### MockInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MockInfo {
  /**
   * モックされているモジュール/関数
   */
  mockedTarget: string;
  
  /**
   * モックのタイプ（jest.mock, sinon.stub等）
   */
  mockType: 'jest.mock' | 'jest.fn' | 'sinon.stub' | 'other';
  
  /**
   * モックの実装があるかどうか
   */
  hasImplementation: boolean;
  
  /**
   * モックの場所
   */
  location: {
    file: string;
    line: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITypeScriptAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MockInfo {
  /**
   * モックされているモジュール/関数
   */
  mockedTarget: string;
  
  /**
   * モックのタイプ（jest.mock, sinon.stub等）
   */
  mockType: 'jest.mock' | 'jest.fn' | 'sinon.stub' | 'other';
  
  /**
   * モックの実装があるかどうか
   */
  hasImplementation: boolean;
  
  /**
   * モックの場所
   */
  location: {
    file: string;
    line: number;
  };
}
```

### ExecutionPath (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExecutionPath {
  /**
   * パスのID
   */
  id: string;
  
  /**
   * パスの開始点
   */
  start: CallGraphNode;
  
  /**
   * パスの終了点
   */
  end: CallGraphNode;
  
  /**
   * 経由するノード
   */
  nodes: CallGraphNode[];
  
  /**
   * 条件分岐
   */
  conditions: string[];
  
  /**
   * このパスがテストされているか
   */
  isTested: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITypeScriptAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExecutionPath {
  /**
   * パスのID
   */
  id: string;
  
  /**
   * パスの開始点
   */
  start: CallGraphNode;
  
  /**
   * パスの終了点
   */
  end: CallGraphNode;
  
  /**
   * 経由するノード
   */
  nodes: CallGraphNode[];
  
  /**
   * 条件分岐
   */
  conditions: string[];
  
  /**
   * このパスがテストされているか
   */
  isTested: boolean;
}
```

### ITypeScriptAnalyzer (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITypeScriptAnalyzer {
  /**
   * TypeScriptプロジェクトを初期化
   */
  initialize(configPath: string): Promise<void>;
  
  /**
   * ファイルの型情報を取得
   */
  getTypeInfo(filePath: string, position: number): Promise<TypeInfo | undefined>;
  
  /**
   * 関数/メソッドの呼び出しグラフを構築
   */
  buildCallGraph(filePath: string): Promise<CallGraphNode[]>;
  
  /**
   * モックの使用状況を検出
   */
  detectMocks(filePath: string): Promise<MockInfo[]>;
  
  /**
   * 実行パスを解析
   */
  analyzeExecutionPaths(filePath: string): Promise<ExecutionPath[]>;
  
  /**
   * 型の互換性をチェック
   */
  checkTypeCompatibility(expected: TypeInfo, actual: TypeInfo): boolean;
  
  /**
   * 未使用のエクスポートを検出
   */
  findUnusedExports(filePath: string): Promise<string[]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/ITypeScriptAnalyzer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITypeScriptAnalyzer {
  /**
   * TypeScriptプロジェクトを初期化
   */
  initialize(configPath: string): Promise<void>;
  
  /**
   * ファイルの型情報を取得
   */
  getTypeInfo(filePath: string, position: number): Promise<TypeInfo | undefined>;
  
  /**
   * 関数/メソッドの呼び出しグラフを構築
   */
  buildCallGraph(filePath: string): Promise<CallGraphNode[]>;
  
  /**
   * モックの使用状況を検出
   */
  detectMocks(filePath: string): Promise<MockInfo[]>;
  
  /**
   * 実行パスを解析
   */
  analyzeExecutionPaths(filePath: string): Promise<ExecutionPath[]>;
  
  /**
   * 型の互換性をチェック
   */
  checkTypeCompatibility(expected: TypeInfo, actual: TypeInfo): boolean;
  
  /**
   * 未使用のエクスポートを検出
   */
  findUnusedExports(filePath: string): Promise<string[]>;
}
```

### TestPattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestPattern = 'happy-path' | 'error-case' | 'edge-case' | 'boundary-value' | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IntentPatternMatcher.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestPattern = 'happy-path' | 'error-case' | 'edge-case' | 'boundary-value' | 'unknown';
```

### DetailedPattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetailedPattern = TestPattern | 'null-check' | 'empty-array' | 'null-return';
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/IntentPatternMatcher.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetailedPattern = TestPattern | 'null-check' | 'empty-array' | 'null-return';
```

### ChunkingStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ChunkingStrategy {
  SINGLE = 'single',      // 単一チャンク（小さいファイル）
  MULTIPLE = 'multiple',  // 複数チャンク（大きいファイル）
  STREAMING = 'streaming' // ストリーミング（将来拡張）
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ChunkingStrategy {
  SINGLE = 'single',      // 単一チャンク（小さいファイル）
  MULTIPLE = 'multiple',  // 複数チャンク（大きいファイル）
  STREAMING = 'streaming' // ストリーミング（将来拡張）
}
```

### ChunkMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ChunkMetadata {
  strategy: ChunkingStrategy;
  chunks: number;
  chunkReadCalls: number;
  maxChunkSize: number;
  encoding: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
  };
  errors?: Array<{
    chunk: number;
    message: string;
    position?: { row: number; column: number };
  }>;
  partialParse?: boolean;
  parseTime?: number;
  cacheHit?: boolean;
  language?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ChunkMetadata {
  strategy: ChunkingStrategy;
  chunks: number;
  chunkReadCalls: number;
  maxChunkSize: number;
  encoding: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
  };
  errors?: Array<{
    chunk: number;
    message: string;
    position?: { row: number; column: number };
  }>;
  partialParse?: boolean;
  parseTime?: number;
  cacheHit?: boolean;
  language?: string;
}
```

### ChunkParseResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ChunkParseResult {
  ast: ASTNode;
  metadata: ChunkMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ChunkParseResult {
  ast: ASTNode;
  metadata: ChunkMetadata;
}
```

### SmartChunkingConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SmartChunkingConfig {
  chunkSize?: number;     // デフォルト: 30000 (30KB)
  enableDebug?: boolean;
  enableCache?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SmartChunkingConfig {
  chunkSize?: number;     // デフォルト: 30000 (30KB)
  enableDebug?: boolean;
  enableCache?: boolean;
}
```

### ChunkInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  content: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/SmartChunkingParser.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  content: string;
}
```

### DomainGap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface DomainGap {
  type: string;
  domain: string;
  description: string;
  recommendation?: string;
  severity: Severity;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TestIntentExtractor.ts
- 種別: interface
- エクスポート: internal
```typescript
interface DomainGap {
  type: string;
  domain: string;
  description: string;
  recommendation?: string;
  severity: Severity;
}
```

### BusinessMapping (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface BusinessMapping {
  domain: string;
  functions: string[];
  coveredFunctions: string[];
  uncoveredFunctions: string[];
  coverage: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TestIntentExtractor.ts
- 種別: interface
- エクスポート: internal
```typescript
interface BusinessMapping {
  domain: string;
  functions: string[];
  coveredFunctions: string[];
  uncoveredFunctions: string[];
  coverage: number;
}
```

### Suggestion (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface Suggestion {
  type: string;
  description: string;
  priority: string;
  impact: string;
  example?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TestIntentExtractor.ts
- 種別: interface
- エクスポート: internal
```typescript
interface Suggestion {
  type: string;
  description: string;
  priority: string;
  impact: string;
  example?: string;
}
```

### SupportedLanguage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  TSX = 'tsx',
  JSX = 'jsx'
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/TreeSitterParser.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  TSX = 'tsx',
  JSX = 'jsx'
}
```

### WorkerData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerData {
  files: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/workers/analysis-worker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerData {
  files: string[];
}
```

### WorkerResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerResult {
  results: TestRealizationResult[];
  error?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/intent-analysis/workers/analysis-worker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerResult {
  results: TestRealizationResult[];
  error?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/parallel-type-checker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface WorkerResult {
  id: string;
  success: boolean;
  result?: MethodTypeCheckResult;
  error?: Error;
  executionTime: number;
}
```

### VulnerabilityRecommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  timeline: string;
  technicalDetails?: string;
  references?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/adapters/TaintVulnerabilityAdapter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  timeline: string;
  technicalDetails?: string;
  references?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/VulnerabilityEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityRecommendation {
  /** 優先度 */
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 推奨アクション */
  action: string;
  /** 実施タイムライン */
  timeline: string;
  /** 技術的詳細 */
  technicalDetails?: string;
  /** 参考リンク */
  references?: string[];
}
```

### CombinedVulnerabilityAssessment (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CombinedVulnerabilityAssessment {
  overallRiskLevel: RiskLevel;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minimalCount: number;
  recommendations?: VulnerabilityRecommendation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/adapters/TaintVulnerabilityAdapter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CombinedVulnerabilityAssessment {
  overallRiskLevel: RiskLevel;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minimalCount: number;
  recommendations?: VulnerabilityRecommendation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/VulnerabilityEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CombinedVulnerabilityAssessment {
  /** 総合リスクレベル */
  overallRiskLevel: RiskLevel;
  /** 脆弱性の総数 */
  vulnerabilityCount: number;
  /** クリティカルレベルの脆弱性数 */
  criticalCount: number;
  /** 高レベルの脆弱性数 */
  highCount: number;
  /** 中レベルの脆弱性数 */
  mediumCount: number;
  /** 低レベルの脆弱性数 */
  lowCount: number;
  /** 最小レベルの脆弱性数 */
  minimalCount: number;
}
```

### VulnerabilityChain (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityChain {
  chainId: string;
  vulnerabilityIds: string[];
  chainedRisk: RiskLevel;
  description: string;
  attackScenario?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/adapters/TaintVulnerabilityAdapter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityChain {
  chainId: string;
  vulnerabilityIds: string[];
  chainedRisk: RiskLevel;
  description: string;
  attackScenario?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/VulnerabilityEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityChain {
  /** チェーンID */
  chainId: string;
  /** チェーンを構成する脆弱性ID */
  vulnerabilityIds: string[];
  /** 連鎖的リスクレベル */
  chainedRisk: RiskLevel;
  /** チェーンの説明 */
  description: string;
  /** 攻撃シナリオ */
  attackScenario?: string;
}
```

### CriticalPath (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPath {
  pathId: string;
  pathName: string;
  components: string[];
  businessValue: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  downTimeImpact: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPath {
  pathId: string;
  pathName: string;
  components: string[];
  businessValue: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  downTimeImpact: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}
```

### CriticalPathImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPathImpact {
  riskLevel: RiskLevel;
  businessImpactScore: number;
  urgency: 'IMMEDIATE' | 'URGENT' | 'PLANNED' | 'DEFERRED';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPathImpact {
  riskLevel: RiskLevel;
  businessImpactScore: number;
  urgency: 'IMMEDIATE' | 'URGENT' | 'PLANNED' | 'DEFERRED';
}
```

### AffectedAsset (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AffectedAsset {
  assetId: string;
  type: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AffectedAsset {
  assetId: string;
  type: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### DowntimeInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DowntimeInfo {
  estimatedHours: number;
  revenuePerHour: number;
  operationalCostPerHour: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DowntimeInfo {
  estimatedHours: number;
  revenuePerHour: number;
  operationalCostPerHour: number;
}
```

### FinancialImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FinancialImpact {
  totalLoss: number;
  revenueLoss: number;
  operationalCost: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FinancialImpact {
  totalLoss: number;
  revenueLoss: number;
  operationalCost: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### ComplianceInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceInfo {
  regulation: string;
  violationType: string;
  affectedRecords: number;
  maxPenalty: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceInfo {
  regulation: string;
  violationType: string;
  affectedRecords: number;
  maxPenalty: number;
}
```

### ComplianceImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceImpact {
  riskLevel: RiskLevel;
  potentialPenalty: number;
  reputationalDamage: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComplianceImpact {
  riskLevel: RiskLevel;
  potentialPenalty: number;
  reputationalDamage: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}
```

### IncidentInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncidentInfo {
  type: string;
  publicExposure: 'HIGH' | 'MEDIUM' | 'LOW';
  mediaAttention: 'SIGNIFICANT' | 'MODERATE' | 'MINIMAL';
  customerImpact: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncidentInfo {
  type: string;
  publicExposure: 'HIGH' | 'MEDIUM' | 'LOW';
  mediaAttention: 'SIGNIFICANT' | 'MODERATE' | 'MINIMAL';
  customerImpact: number;
}
```

### ReputationImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReputationImpact {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recoveryTime: 'YEARS' | 'MONTHS' | 'WEEKS' | 'DAYS';
  customerTrustLoss: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReputationImpact {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recoveryTime: 'YEARS' | 'MONTHS' | 'WEEKS' | 'DAYS';
  customerTrustLoss: number;
}
```

### CustomerImpactInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CustomerImpactInfo {
  affectedCustomers: number;
  averageLifetimeValue: number;
  churnProbability: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CustomerImpactInfo {
  affectedCustomers: number;
  averageLifetimeValue: number;
  churnProbability: number;
}
```

### CustomerChurnRisk (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CustomerChurnRisk {
  potentialRevenueLoss: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CustomerChurnRisk {
  potentialRevenueLoss: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### IntegratedImpacts (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntegratedImpacts {
  technical: { severity: string; score: number };
  business: { severity: string; score: number };
  financial: { severity: string; score: number };
  reputation: { severity: string; score: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IntegratedImpacts {
  technical: { severity: string; score: number };
  business: { severity: string; score: number };
  financial: { severity: string; score: number };
  reputation: { severity: string; score: number };
}
```

### OverallImpactResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OverallImpactResult {
  combinedScore: number;
  primaryRisk: string;
  riskLevel: RiskLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OverallImpactResult {
  combinedScore: number;
  primaryRisk: string;
  riskLevel: RiskLevel;
}
```

### TimeFactors (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TimeFactors {
  immediateImpact: string;
  shortTermImpact: string;
  longTermImpact: string;
  recoveryTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TimeFactors {
  immediateImpact: string;
  shortTermImpact: string;
  longTermImpact: string;
  recoveryTime: number;
}
```

### TemporalImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TemporalImpact {
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  escalationRisk: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TemporalImpact {
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  escalationRisk: boolean;
}
```

### ImpactInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactInfo {
  level: ImpactLevel;
  type: string;
  affectedSystems: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ImpactInfo {
  level: ImpactLevel;
  type: string;
  affectedSystems: string[];
}
```

### MitigationStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MitigationStrategy {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  strategy: string;
  estimatedEffort: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MitigationStrategy {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  strategy: string;
  estimatedEffort: string;
}
```

### IncidentDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncidentDetail {
  impactLevel: ImpactLevel;
  affectedComponents: number;
  estimatedDowntime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncidentDetail {
  impactLevel: ImpactLevel;
  affectedComponents: number;
  estimatedDowntime: number;
}
```

### RecoveryPlan (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecoveryPlan {
  phases: RecoveryPhase[];
  totalEstimatedTime: number;
  criticalMilestones: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecoveryPlan {
  phases: RecoveryPhase[];
  totalEstimatedTime: number;
  criticalMilestones: string[];
}
```

### RecoveryPhase (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecoveryPhase {
  name: string;
  duration: number;
  tasks: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/ImpactEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecoveryPhase {
  name: string;
  duration: number;
  tasks: string[];
}
```

### VulnerabilityAssessment (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityAssessment {
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** 悪用可能性の確率（0-1） */
  exploitProbability: number;
  /** 総合スコア（0-100） */
  overallScore: number;
  /** 評価の詳細説明 */
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/evaluators/VulnerabilityEvaluator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerabilityAssessment {
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** 悪用可能性の確率（0-1） */
  exploitProbability: number;
  /** 総合スコア（0-100） */
  overallScore: number;
  /** 評価の詳細説明 */
  description?: string;
}
```

### RiskComponents (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskComponents {
  threatScore: number;
  vulnerabilityScore: number;
  impactScore: number;
  likelihoodScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskComponents {
  threatScore: number;
  vulnerabilityScore: number;
  impactScore: number;
  likelihoodScore: number;
}
```

### RiskWeights (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskWeights {
  threat: number;
  vulnerability: number;
  impact: number;
  likelihood: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskWeights {
  threat: number;
  vulnerability: number;
  impact: number;
  likelihood: number;
}
```

### OverallRiskScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OverallRiskScore {
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OverallRiskScore {
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
}
```

### AggregatedRisk (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### CategoryRisk (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CategoryRisk {
  count: number;
  averageScore: number;
  maxRiskLevel: RiskLevel;
  risks: any[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CategoryRisk {
  count: number;
  averageScore: number;
  maxRiskLevel: RiskLevel;
  risks: any[];
}
```

### RiskTrend (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number;
  projection: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number;
  projection: number;
}
```

### RecommendedAction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecommendedAction {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  estimatedEffort: string;
  expectedRiskReduction: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecommendedAction {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  estimatedEffort: string;
  expectedRiskReduction: number;
}
```

### ThreatSourceType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ThreatSourceType = 'ADVERSARIAL' | 'ACCIDENTAL' | 'STRUCTURAL' | 'ENVIRONMENTAL';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ThreatSourceType = 'ADVERSARIAL' | 'ACCIDENTAL' | 'STRUCTURAL' | 'ENVIRONMENTAL';
```

### CapabilityLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type CapabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type CapabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### IntentLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type IntentLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type IntentLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### TargetingLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TargetingLevel = 'NONE' | 'OPPORTUNISTIC' | 'FOCUSED' | 'SPECIFIC';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TargetingLevel = 'NONE' | 'OPPORTUNISTIC' | 'FOCUSED' | 'SPECIFIC';
```

### LikelihoodLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type LikelihoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type LikelihoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### ImpactLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImpactLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ImpactLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### ExploitabilityLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ExploitabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ExploitabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### DetectabilityLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetectabilityLevel = 'VERY_HARD' | 'HARD' | 'MODERATE' | 'EASY' | 'VERY_EASY';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DetectabilityLevel = 'VERY_HARD' | 'HARD' | 'MODERATE' | 'EASY' | 'VERY_EASY';
```

### RelevanceLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type RelevanceLevel = 'CONFIRMED' | 'EXPECTED' | 'ANTICIPATED' | 'PREDICTED' | 'POSSIBLE';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type RelevanceLevel = 'CONFIRMED' | 'EXPECTED' | 'ANTICIPATED' | 'PREDICTED' | 'POSSIBLE';
```

### ThreatSource (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatSource {
  /** 脅威源ID */
  id: string;
  /** 脅威源名 */
  name: string;
  /** 脅威源タイプ */
  type: ThreatSourceType;
  /** 能力レベル */
  capability: CapabilityLevel;
  /** 意図レベル */
  intent: IntentLevel;
  /** ターゲティングレベル */
  targeting: TargetingLevel;
  /** 説明（オプション） */
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatSource {
  /** 脅威源ID */
  id: string;
  /** 脅威源名 */
  name: string;
  /** 脅威源タイプ */
  type: ThreatSourceType;
  /** 能力レベル */
  capability: CapabilityLevel;
  /** 意図レベル */
  intent: IntentLevel;
  /** ターゲティングレベル */
  targeting: TargetingLevel;
  /** 説明（オプション） */
  description?: string;
}
```

### ThreatEvent (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatEvent {
  /** 脅威イベントID */
  id: string;
  /** 脅威イベントの説明 */
  description: string;
  /** 関連する脅威源ID */
  threatSources: string[];
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響度 */
  impact: ImpactLevel;
  /** 関連性 */
  relevance: RelevanceLevel;
  /** 戦術・技術・手順（オプション） */
  ttps?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatEvent {
  /** 脅威イベントID */
  id: string;
  /** 脅威イベントの説明 */
  description: string;
  /** 関連する脅威源ID */
  threatSources: string[];
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響度 */
  impact: ImpactLevel;
  /** 関連性 */
  relevance: RelevanceLevel;
  /** 戦術・技術・手順（オプション） */
  ttps?: string[];
}
```

### Vulnerability (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Vulnerability {
  /** 脆弱性ID */
  id: string;
  /** 脆弱性タイプ（オプション） */
  type?: string;
  /** 脆弱性の説明 */
  description: string;
  /** 深刻度 */
  severity: SeverityLevel;
  /** 悪用可能性 */
  exploitability: ExploitabilityLevel;
  /** 検出可能性 */
  detectability: DetectabilityLevel;
  /** 影響を受けるコンポーネント（オプション） */
  affectedComponent?: string;
  /** 影響を受ける資産 */
  affectedAssets?: string[];
  /** CVE ID（オプション） */
  cveId?: string;
  /** CWE ID（オプション） */
  cweId?: string;
  /** CVSS スコア（オプション） */
  cvss?: number;
  /** CVSSスコア（レガシー互換）（オプション） */
  cvssScore?: number;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Vulnerability {
  /** 脆弱性ID */
  id: string;
  /** 脆弱性タイプ（オプション） */
  type?: string;
  /** 脆弱性の説明 */
  description: string;
  /** 深刻度 */
  severity: SeverityLevel;
  /** 悪用可能性 */
  exploitability: ExploitabilityLevel;
  /** 検出可能性 */
  detectability: DetectabilityLevel;
  /** 影響を受けるコンポーネント（オプション） */
  affectedComponent?: string;
  /** 影響を受ける資産 */
  affectedAssets?: string[];
  /** CVE ID（オプション） */
  cveId?: string;
  /** CWE ID（オプション） */
  cweId?: string;
  /** CVSS スコア（オプション） */
  cvss?: number;
  /** CVSSスコア（レガシー互換）（オプション） */
  cvssScore?: number;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}
```

### NISTRiskMatrix (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NISTRiskMatrix {
  /** 脅威の可能性 */
  threatLikelihood: LikelihoodLevel;
  /** 脆弱性の深刻度 */
  vulnerabilitySeverity: SeverityLevel;
  /** 影響レベル */
  impactLevel: ImpactLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface NISTRiskMatrix {
  /** 脅威の可能性 */
  threatLikelihood: LikelihoodLevel;
  /** 脆弱性の深刻度 */
  vulnerabilitySeverity: SeverityLevel;
  /** 影響レベル */
  impactLevel: ImpactLevel;
}
```

### ThreatEventAssessment (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatEventAssessment {
  /** 脅威イベントID */
  eventId: string;
  /** 総合的な可能性 */
  overallLikelihood: LikelihoodLevel;
  /** 総合的な影響 */
  overallImpact: ImpactLevel;
  /** 寄与する脅威源 */
  contributingSources: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ThreatEventAssessment {
  /** 脅威イベントID */
  eventId: string;
  /** 総合的な可能性 */
  overallLikelihood: LikelihoodLevel;
  /** 総合的な影響 */
  overallImpact: ImpactLevel;
  /** 寄与する脅威源 */
  contributingSources: string[];
}
```

### EnvironmentalImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EnvironmentalImpact {
  /** 脅威源ID */
  threatSourceId: string;
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響範囲 */
  scope: 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
  /** 復旧時間 */
  recoveryTime: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface EnvironmentalImpact {
  /** 脅威源ID */
  threatSourceId: string;
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響範囲 */
  scope: 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
  /** 復旧時間 */
  recoveryTime: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
}
```

### Threat (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Threat {
  id: string;
  name: string;
  category: string;
  likelihood: LikelihoodLevel | string;
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Threat {
  id: string;
  name: string;
  category: string;
  likelihood: LikelihoodLevel | string;
  description: string;
}
```

### Impact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Impact {
  id: string;
  description: string;
  level: ImpactLevel;
  affectedAssets: string[];
  businessImpact?: string;
  financialImpact?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Impact {
  id: string;
  description: string;
  level: ImpactLevel;
  affectedAssets: string[];
  businessImpact?: string;
  financialImpact?: number;
}
```

### RiskMatrix (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskMatrix {
  threatLikelihood: LikelihoodLevel;
  vulnerabilitySeverity: SeverityLevel;
  impactLevel: ImpactLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskMatrix {
  threatLikelihood: LikelihoodLevel;
  vulnerabilitySeverity: SeverityLevel;
  impactLevel: ImpactLevel;
}
```

### RiskRecommendation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskRecommendation {
  /** 優先度 */
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 推奨アクション */
  action: string;
  /** 実施タイムライン */
  timeline: string;
  /** 期待される効果 */
  expectedBenefit: string;
  /** 実装の複雑さ */
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 推定コスト */
  estimatedCost?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskRecommendation {
  /** 優先度 */
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 推奨アクション */
  action: string;
  /** 実施タイムライン */
  timeline: string;
  /** 期待される効果 */
  expectedBenefit: string;
  /** 実装の複雑さ */
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 推定コスト */
  estimatedCost?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### RiskItem (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskItem {
  /** アイテムID */
  id: string;
  /** リスクレベル */
  level: string;
  /** その他のプロパティ */
  [key: string]: any;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskItem {
  /** アイテムID */
  id: string;
  /** リスクレベル */
  level: string;
  /** その他のプロパティ */
  [key: string]: any;
}
```

### BusinessImpact (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum BusinessImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum BusinessImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### TechnicalComplexity (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum TechnicalComplexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum TechnicalComplexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}
```

### UrgencyLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type UrgencyLevel = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type UrgencyLevel = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
```

### EstimatedEffort (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type EstimatedEffort = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type EstimatedEffort = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
```

### RiskPriorityRequest (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskPriorityRequest {
  /** リスクID（オプション） */
  riskId?: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** ビジネスインパクト */
  businessImpact: BusinessImpact;
  /** 技術的複雑性 */
  technicalComplexity: TechnicalComplexity;
  /** 影響を受けるコンポーネント数 */
  affectedComponents: number;
  /** 依存関係の数 */
  dependencies: number;
  /** クリティカルパス上にあるか */
  isOnCriticalPath?: boolean;
  /** カスタム重み付け（オプション） */
  customWeights?: PriorityWeights;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskPriorityRequest {
  /** リスクID（オプション） */
  riskId?: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** ビジネスインパクト */
  businessImpact: BusinessImpact;
  /** 技術的複雑性 */
  technicalComplexity: TechnicalComplexity;
  /** 影響を受けるコンポーネント数 */
  affectedComponents: number;
  /** 依存関係の数 */
  dependencies: number;
  /** クリティカルパス上にあるか */
  isOnCriticalPath?: boolean;
  /** カスタム重み付け（オプション） */
  customWeights?: PriorityWeights;
}
```

### PriorityWeights (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityWeights {
  /** リスクレベルの重み（デフォルト: 0.4） */
  riskWeight?: number;
  /** ビジネスインパクトの重み（デフォルト: 0.3） */
  businessWeight?: number;
  /** 技術的複雑性の重み（デフォルト: 0.2） */
  complexityWeight?: number;
  /** スコープの重み（デフォルト: 0.1） */
  scopeWeight?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityWeights {
  /** リスクレベルの重み（デフォルト: 0.4） */
  riskWeight?: number;
  /** ビジネスインパクトの重み（デフォルト: 0.3） */
  businessWeight?: number;
  /** 技術的複雑性の重み（デフォルト: 0.2） */
  complexityWeight?: number;
  /** スコープの重み（デフォルト: 0.1） */
  scopeWeight?: number;
}
```

### PriorityScoreBreakdown (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityScoreBreakdown {
  /** 基本リスクスコア（0-100） */
  baseRiskScore: number;
  /** ビジネスインパクトスコア（0-1.5） */
  businessImpactScore: number;
  /** 技術的複雑性スコア（0-1） */
  technicalComplexityScore: number;
  /** スコープスコア（0-100） */
  scopeScore: number;
  /** 最終スコア（0-100） */
  finalScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityScoreBreakdown {
  /** 基本リスクスコア（0-100） */
  baseRiskScore: number;
  /** ビジネスインパクトスコア（0-1.5） */
  businessImpactScore: number;
  /** 技術的複雑性スコア（0-1） */
  technicalComplexityScore: number;
  /** スコープスコア（0-100） */
  scopeScore: number;
  /** 最終スコア（0-100） */
  finalScore: number;
}
```

### ResourceAllocation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ResourceAllocation {
  /** 推奨チームサイズ */
  recommendedTeamSize: number;
  /** 推定人日 */
  estimatedManDays: number;
  /** 必要な専門知識 */
  requiredExpertise: string[];
  /** 推奨スキルレベル */
  recommendedSkillLevel: 'ジュニア' | 'ミッド' | 'シニア' | 'エキスパート';
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ResourceAllocation {
  /** 推奨チームサイズ */
  recommendedTeamSize: number;
  /** 推定人日 */
  estimatedManDays: number;
  /** 必要な専門知識 */
  requiredExpertise: string[];
  /** 推奨スキルレベル */
  recommendedSkillLevel: 'ジュニア' | 'ミッド' | 'シニア' | 'エキスパート';
}
```

### RiskPriorityResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskPriorityResult {
  /** リスクID */
  riskId?: string;
  /** 優先度スコア（0-100） */
  priority: number;
  /** 緊急度 */
  urgency: UrgencyLevel;
  /** 推奨アクション */
  recommendedAction: string;
  /** 対応タイムライン */
  timeline: string;
  /** ビジネスインパクト倍率 */
  businessImpactMultiplier: number;
  /** 対応しやすさスコア（0-1） */
  easinessScore: number;
  /** 推定作業量 */
  estimatedEffort: EstimatedEffort;
  /** スコープスコア */
  scopeScore: number;
  /** クリティカルパス倍率 */
  criticalPathMultiplier?: number;
  /** スコアの内訳 */
  scoreBreakdown: PriorityScoreBreakdown;
  /** リソース配分の推奨 */
  resourceAllocation?: ResourceAllocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskPriorityResult {
  /** リスクID */
  riskId?: string;
  /** 優先度スコア（0-100） */
  priority: number;
  /** 緊急度 */
  urgency: UrgencyLevel;
  /** 推奨アクション */
  recommendedAction: string;
  /** 対応タイムライン */
  timeline: string;
  /** ビジネスインパクト倍率 */
  businessImpactMultiplier: number;
  /** 対応しやすさスコア（0-1） */
  easinessScore: number;
  /** 推定作業量 */
  estimatedEffort: EstimatedEffort;
  /** スコープスコア */
  scopeScore: number;
  /** クリティカルパス倍率 */
  criticalPathMultiplier?: number;
  /** スコアの内訳 */
  scoreBreakdown: PriorityScoreBreakdown;
  /** リソース配分の推奨 */
  resourceAllocation?: ResourceAllocation;
}
```

### PriorityScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityScore {
  /** 総合スコア */
  total: number;
  /** 構成要素 */
  components: {
    risk: number;
    business: number;
    technical: number;
    scope: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/priority-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PriorityScore {
  /** 総合スコア */
  total: number;
  /** 構成要素 */
  components: {
    risk: number;
    business: number;
    technical: number;
    scope: number;
  };
}
```

### MigrationStats (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationStats {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  MINIMAL: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/utils/risk-level-migrator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationStats {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  MINIMAL: number;
}
```

### BatchMigrationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BatchMigrationResult<T> {
  /** 移行後の値 */
  migrated: T[];
  /** 移行統計 */
  stats: MigrationStats;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/utils/risk-level-migrator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BatchMigrationResult<T> {
  /** 移行後の値 */
  migrated: T[];
  /** 移行統計 */
  stats: MigrationStats;
}
```

### DomainQualityScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainQualityScore extends QualityScore {
  domainCoverage?: number;
  businessRuleCompliance?: number;
  terminologyConsistency?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseDomainPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DomainQualityScore extends QualityScore {
  domainCoverage?: number;
  businessRuleCompliance?: number;
  terminologyConsistency?: number;
}
```

### SecurityPattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/base/BaseSecurityPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
}
```

### LogLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/log-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}
```

### LogMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LogMetadata {
  /** タイムスタンプ */
  timestamp?: number;
  /** プラグイン名 */
  plugin?: string;
  /** ファイルパス */
  filePath?: string;
  /** 行番号 */
  line?: number;
  /** 列番号 */
  column?: number;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/log-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LogMetadata {
  /** タイムスタンプ */
  timestamp?: number;
  /** プラグイン名 */
  plugin?: string;
  /** ファイルパス */
  filePath?: string;
  /** 行番号 */
  line?: number;
  /** 列番号 */
  column?: number;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}
```

### ErrorLogMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorLogMetadata extends LogMetadata {
  /** エラー情報 */
  error?: {
    message?: string;
    stack?: string;
    name?: string;
    code?: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/log-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorLogMetadata extends LogMetadata {
  /** エラー情報 */
  error?: {
    message?: string;
    stack?: string;
    name?: string;
    code?: string;
  };
}
```

### LogEntry (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: LogMetadata | ErrorLogMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/log-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: LogMetadata | ErrorLogMetadata;
}
```

### PluginPerformanceConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginPerformanceConfig {
  /** バッチサイズ */
  batchSize?: number;
  /** 並列実行数 */
  parallelism?: number;
  /** メモリ制限（MB） */
  memoryLimit?: number;
  /** CPU使用率制限（%） */
  cpuLimit?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/plugin-config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PluginPerformanceConfig {
  /** バッチサイズ */
  batchSize?: number;
  /** 並列実行数 */
  parallelism?: number;
  /** メモリ制限（MB） */
  memoryLimit?: number;
  /** CPU使用率制限（%） */
  cpuLimit?: number;
}
```

### ExtendedPluginConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedPluginConfig extends PluginConfig {
  /** パフォーマンス設定 */
  performance?: PluginPerformanceConfig;
  /** 対象ファイルパターン */
  include?: string[];
  /** 除外ファイルパターン */
  exclude?: string[];
  /** 依存プラグイン */
  dependencies?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/plugin-config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedPluginConfig extends PluginConfig {
  /** パフォーマンス設定 */
  performance?: PluginPerformanceConfig;
  /** 対象ファイルパターン */
  include?: string[];
  /** 除外ファイルパターン */
  exclude?: string[];
  /** 依存プラグイン */
  dependencies?: string[];
}
```

### TestCaseType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestCaseType = 'test' | 'describe' | 'it' | 'suite' | 'spec';
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/test-case.ts
- 種別: type
- エクスポート: exported
```typescript
export type TestCaseType = 'test' | 'describe' | 'it' | 'suite' | 'spec';
```

### TestFileStats (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestFileStats {
  /** 総テストケース数 */
  totalTests: number;
  /** describeブロック数 */
  describeBlocks: number;
  /** スキップされたテスト数 */
  skippedTests: number;
  /** フォーカスされたテスト数 */
  focusedTests: number;
  /** 最大ネストレベル */
  maxNestingLevel: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/plugins/types/test-case.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestFileStats {
  /** 総テストケース数 */
  totalTests: number;
  /** describeブロック数 */
  describeBlocks: number;
  /** スキップされたテスト数 */
  skippedTests: number;
  /** フォーカスされたテスト数 */
  focusedTests: number;
  /** 最大ネストレベル */
  maxNestingLevel: number;
}
```

### AnnotationLine (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnnotationLine {
  lineNumber: number;
  annotation: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/AnnotationGenerator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnnotationLine {
  lineNumber: number;
  annotation: string;
}
```

### FileAnnotation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FileAnnotation {
  filePath: string;
  originalContent: string;
  annotatedContent: string;
  annotationCount: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/CodeAnnotator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FileAnnotation {
  filePath: string;
  originalContent: string;
  annotatedContent: string;
  annotationCount: number;
}
```

### IFormattingStrategy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IFormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): string | object;
  formatAsync?(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/core/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IFormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): string | object;
  formatAsync?(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
}
```

### UnifiedReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedReport {
  format: ReportFormat;
  content: string | object;
  timestamp: string;
  metadata?: {
    generatedBy: string;
    version: string;
    processingTime?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/core/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UnifiedReport {
  format: ReportFormat;
  content: string | object;
  timestamp: string;
  metadata?: {
    generatedBy: string;
    version: string;
    processingTime?: number;
  };
}
```

### ReportGenerationOptions (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportGenerationOptions {
  format?: ReportFormat;
  includeMetadata?: boolean;
  cacheEnabled?: boolean;
  parallelProcessing?: boolean;
  maxRisks?: number;
  includeRiskLevels?: string[];
  htmlReportPath?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/core/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportGenerationOptions {
  format?: ReportFormat;
  includeMetadata?: boolean;
  cacheEnabled?: boolean;
  parallelProcessing?: boolean;
  maxRisks?: number;
  includeRiskLevels?: string[];
  htmlReportPath?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReportGenerationOptions {
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  includeCodeSnippets?: boolean;
  includeDataFlow?: boolean;
  severityFilter?: Severity[];
  typeFilter?: IssueType[];
}
```

### ILegacyAdapter (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ILegacyAdapter {
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
  isDeprecated: boolean;
  deprecationMessage: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/core/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ILegacyAdapter {
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
  isDeprecated: boolean;
  deprecationMessage: string;
}
```

### DataFlowNode (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DataFlowNode {
  location: CodeLocation;
  type: string;
  description?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DataFlowNode {
  location: CodeLocation;
  type: string;
  description?: string;
}
```

### DataFlow (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DataFlow {
  source: DataFlowNode;
  sink: DataFlowNode;
  path: DataFlowNode[];
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DataFlow {
  source: DataFlowNode;
  sink: DataFlowNode;
  path: DataFlowNode[];
}
```

### ModuleCoverage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ModuleCoverage {
  coverage: number;
  testedFiles: number;
  untestedFiles: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ModuleCoverage {
  coverage: number;
  testedFiles: number;
  untestedFiles: number;
}
```

### TestCoverageMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCoverageMetrics {
  overall: number;
  byModule: Record<string, ModuleCoverage>;
  missingTests?: Array<{
    file: string;
    reason: string;
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCoverageMetrics {
  overall: number;
  byModule: Record<string, ModuleCoverage>;
  missingTests?: Array<{
    file: string;
    reason: string;
  }>;
}
```

### HighComplexityMethod (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HighComplexityMethod {
  method: string;
  complexity: number;
  location: CodeLocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HighComplexityMethod {
  method: string;
  complexity: number;
  location: CodeLocation;
}
```

### CodeQualityMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeQualityMetrics {
  complexity?: {
    average: number;
    max: number;
    highComplexityMethods: HighComplexityMethod[];
  };
  maintainability?: {
    score: number;
    issues: string[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CodeQualityMetrics {
  complexity?: {
    average: number;
    max: number;
    highComplexityMethods: HighComplexityMethod[];
  };
  maintainability?: {
    score: number;
    issues: string[];
  };
}
```

### AnalysisMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisMetrics {
  testCoverage: TestCoverageMetrics;
  codeQuality: CodeQualityMetrics;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisMetrics {
  testCoverage: TestCoverageMetrics;
  codeQuality: CodeQualityMetrics;
}
```

### StructuredAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface StructuredAnalysisResult {
  metadata: AnalysisMetadata;
  summary: AnalysisSummary;
  issues: Issue[];
  metrics: AnalysisMetrics;
  plugins?: Record<string, PluginResult>;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface StructuredAnalysisResult {
  metadata: AnalysisMetadata;
  summary: AnalysisSummary;
  issues: Issue[];
  metrics: AnalysisMetrics;
  plugins?: Record<string, PluginResult>;
}
```

### AnnotationOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotationOptions {
  prefix?: string;
  format?: 'inline' | 'block';
  includeDataFlow?: boolean;
  overwrite?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotationOptions {
  prefix?: string;
  format?: 'inline' | 'block';
  includeDataFlow?: boolean;
  overwrite?: boolean;
}
```

### LegacyConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LegacyConfig {
  plugins?: Record<string, {
    weight?: number;
    [key: string]: unknown;
  }>;
  quality?: {
    thresholds?: {
      excellent?: number;
      good?: number;
      acceptable?: number;
      poor?: number;
    };
    strictMode?: boolean;
  };
  strictMode?: boolean;
  scoring?: {
    enabled?: boolean;
    weights?: Partial<WeightConfig>;
    gradeThresholds?: Partial<Record<GradeType, number>>;
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
  [key: string]: unknown;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LegacyConfig {
  plugins?: Record<string, {
    weight?: number;
    [key: string]: unknown;
  }>;
  quality?: {
    thresholds?: {
      excellent?: number;
      good?: number;
      acceptable?: number;
      poor?: number;
    };
    strictMode?: boolean;
  };
  strictMode?: boolean;
  scoring?: {
    enabled?: boolean;
    weights?: Partial<WeightConfig>;
    gradeThresholds?: Partial<Record<GradeType, number>>;
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
  [key: string]: unknown;
}
```

### JsonValue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;
```

### JsonObject (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JsonObject {
  [key: string]: JsonValue;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JsonObject {
  [key: string]: JsonValue;
}
```

### JsonArray (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JsonArray extends Array<JsonValue> {}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JsonArray extends Array<JsonValue> {}
```

### SanitizedConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SanitizedConfig {
  [key: string]: JsonValue;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SanitizedConfig {
  [key: string]: JsonValue;
}
```

### PartialScoringConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PartialScoringConfig {
  enabled?: boolean;
  weights?: {
    plugins?: Record<string, number>;
    dimensions?: Partial<Record<string, number>>;
  };
  gradeThresholds?: Partial<Record<GradeType, number>>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PartialScoringConfig {
  enabled?: boolean;
  weights?: {
    plugins?: Record<string, number>;
    dimensions?: Partial<Record<string, number>>;
  };
  gradeThresholds?: Partial<Record<GradeType, number>>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}
```

### ScoringConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoringConfig {
  enabled: boolean;
  weights: WeightConfig;
  gradeThresholds: Record<GradeType, number>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoringConfig {
  enabled: boolean;
  weights: WeightConfig;
  gradeThresholds: Record<GradeType, number>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}
```

### ConfigValidationResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/config.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/ConfigSecurity.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigValidationResult {
  isValid: boolean;
  sanitizedConfig?: unknown;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}
```

### SummaryReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SummaryReport {
  projectInfo: {
    path: string;
    overallScore: number;
    grade: GradeType;
    totalFiles: number;
    totalDirectories: number;
    generatedAt: Date;
    executionTime: number;
  };
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  topIssues: {
    dimension: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedFiles: number;
  }[];
  recommendations: string[];
  metadata: {
    pluginCount: number;
    issueCount: number;
    averageFileScore: number;
    worstPerformingDimension: string;
    bestPerformingDimension: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/reports.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SummaryReport {
  projectInfo: {
    path: string;
    overallScore: number;
    grade: GradeType;
    totalFiles: number;
    totalDirectories: number;
    generatedAt: Date;
    executionTime: number;
  };
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  topIssues: {
    dimension: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedFiles: number;
  }[];
  recommendations: string[];
  metadata: {
    pluginCount: number;
    issueCount: number;
    averageFileScore: number;
    worstPerformingDimension: string;
    bestPerformingDimension: string;
  };
}
```

### DetailedReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedReport {
  summary: SummaryReport;
  fileDetails: {
    filePath: string;
    score: number;
    grade: GradeType;
    dimensions: {
      name: string;
      score: number;
      weight: number;
      issues: string[];
    }[];
    issues: {
      dimension: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
      line?: number;
    }[];
    suggestions: string[];
  }[];
  directoryDetails: {
    directoryPath: string;
    score: number;
    grade: GradeType;
    fileCount: number;
    dimensionBreakdown: Record<string, number>;
    worstFile: string;
    bestFile: string;
  }[];
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/reports.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedReport {
  summary: SummaryReport;
  fileDetails: {
    filePath: string;
    score: number;
    grade: GradeType;
    dimensions: {
      name: string;
      score: number;
      weight: number;
      issues: string[];
    }[];
    issues: {
      dimension: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
      line?: number;
    }[];
    suggestions: string[];
  }[];
  directoryDetails: {
    directoryPath: string;
    score: number;
    grade: GradeType;
    fileCount: number;
    dimensionBreakdown: Record<string, number>;
    worstFile: string;
    bestFile: string;
  }[];
}
```

### TrendReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TrendReport {
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvementRate: number; // パーセンテージ
  historicalData: {
    date: Date;
    score: number;
    grade: GradeType;
  }[];
  predictions: {
    nextWeekScore: number;
    nextMonthScore: number;
    confidence: number;
  };
  dimensionTrends: {
    dimension: string;
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
  }[];
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/reports.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TrendReport {
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvementRate: number; // パーセンテージ
  historicalData: {
    date: Date;
    score: number;
    grade: GradeType;
  }[];
  predictions: {
    nextWeekScore: number;
    nextMonthScore: number;
    confidence: number;
  };
  dimensionTrends: {
    dimension: string;
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
  }[];
  recommendations: string[];
}
```

### HistoricalScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HistoricalScore {
  date: Date;
  score: number;
  grade: GradeType;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/reports.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface HistoricalScore {
  date: Date;
  score: number;
  grade: GradeType;
}
```

### DimensionScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### ScoreTrend (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### FileScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### DirectoryScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### ProjectScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### AggregatedScore (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AggregatedScore {
  score: number;
  confidence: number;
  metadata: {
    aggregatedFrom: number;
    totalWeight: number;
    algorithm: string;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AggregatedScore {
  score: number;
  confidence: number;
  metadata: {
    aggregatedFrom: number;
    totalWeight: number;
    algorithm: string;
  };
}
```

### WeightConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### ScoreHistory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### ScoreCache (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoreCache {
  fileHash: Map<string, string>; // ファイルパス -> ハッシュ
  scores: Map<string, FileScore>; // ハッシュ -> スコア
  expiry: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScoreCache {
  fileHash: Map<string, string>; // ファイルパス -> ハッシュ
  scores: Map<string, FileScore>; // ハッシュ -> スコア
  expiry: Date;
}
```

### DimensionType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DimensionType = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DimensionType = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
```

### GradeType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type GradeType = 'A' | 'B' | 'C' | 'D' | 'F';
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type GradeType = 'A' | 'B' | 'C' | 'D' | 'F';
```

### IScoreCalculator (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

#### /Users/sasakama/Projects/Rimor/src/scoring/types.ts
- 種別: interface
- エクスポート: exported
```typescript
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
```

### CLIValidationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CLIValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/CLISecurity.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CLIValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}
```

### CLISecurityLimits (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CLISecurityLimits {
  /** 最大パス長 */
  maxPathLength: number;
  /** 最大出力ファイルサイズ (bytes) */
  maxOutputFileSize: number;
  /** 許可されるファイル拡張子 */
  allowedOutputExtensions: string[];
  /** 禁止されるディレクトリパターン */
  forbiddenDirectoryPatterns: string[];
  /** 環境変数検証有効化 */
  validateEnvironmentVariables: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/CLISecurity.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CLISecurityLimits {
  /** 最大パス長 */
  maxPathLength: number;
  /** 最大出力ファイルサイズ (bytes) */
  maxOutputFileSize: number;
  /** 許可されるファイル拡張子 */
  allowedOutputExtensions: string[];
  /** 禁止されるディレクトリパターン */
  forbiddenDirectoryPatterns: string[];
  /** 環境変数検証有効化 */
  validateEnvironmentVariables: boolean;
}
```

### ConfigSecurityLimits (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigSecurityLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大オブジェクト深度 */
  maxObjectDepth: number;
  /** 最大プロパティ数 */
  maxProperties: number;
  /** 最大配列長 */
  maxArrayLength: number;
  /** 最大文字列長 */
  maxStringLength: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/ConfigSecurity.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ConfigSecurityLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大オブジェクト深度 */
  maxObjectDepth: number;
  /** 最大プロパティ数 */
  maxProperties: number;
  /** 最大配列長 */
  maxArrayLength: number;
  /** 最大文字列長 */
  maxStringLength: number;
}
```

### AggregatedResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AggregatedResult {
  issues: SecurityIssue[];
  suggestions: SecurityImprovement[];
  totalMethods: number;
  averageScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/engine.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AggregatedResult {
  issues: SecurityIssue[];
  suggestions: SecurityImprovement[];
  totalMethods: number;
  averageScore: number;
}
```

### PerformanceStats (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceStats {
  cacheHitRate: number;
  averageAnalysisTime: number;
  memoryUsage: number;
  workerUtilization: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/engine.ts
- 種別: interface
- エクスポート: internal
```typescript
interface PerformanceStats {
  cacheHitRate: number;
  averageAnalysisTime: number;
  memoryUsage: number;
  workerUtilization: number;
}
```

### TaintSourceInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSourceInfo {
  id: string;
  name: string;
  type: TaintSource;
  location: { line: number; column: number };
  confidence: number;
  taintLevel?: 'high' | 'medium' | 'low';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSourceInfo {
  id: string;
  name: string;
  type: TaintSource;
  location: { line: number; column: number };
  confidence: number;
  taintLevel?: 'high' | 'medium' | 'low';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintSourceInfo {
  source: TaintSource;
  location: Position;
  variable: string;
  confidence: number;
}
```

### SanitizerInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SanitizerInfo {
  id: string;
  type: SanitizerType;
  location: { line: number; column: number };
  effectiveness: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SanitizerInfo {
  id: string;
  type: SanitizerType;
  location: { line: number; column: number };
  effectiveness: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SanitizerInfo {
  type: SanitizerType;
  location: Position;
  variable: string;
  effectiveness: number;
}
```

### SecuritySinkInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecuritySinkInfo {
  id: string;
  type: string;
  location: { line: number; column: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecuritySinkInfo {
  id: string;
  type: string;
  location: { line: number; column: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecuritySinkInfo {
  sink: SecuritySink;
  location: Position;
  variable: string;
  risk: number;
}
```

### TaintPropagationResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationResult {
  path: string[];
  taintLevel: TaintLevel;
  reachesExit: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationResult {
  path: string[];
  taintLevel: TaintLevel;
  reachesExit: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationResult {
  tainted: Map<string, TaintLevel>;
  propagationPaths: FlowPath[];
  violations: TaintViolation[];
}
```

### TaintFlowAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlowAnalysisResult {
  sanitizers: Array<{ function: string; type: SanitizerType }>;
  finalTaintLevel: 'clean' | 'tainted';
  paths: number;
  violations: SecurityViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlowAnalysisResult {
  sanitizers: Array<{ function: string; type: SanitizerType }>;
  finalTaintLevel: 'clean' | 'tainted';
  paths: number;
  violations: SecurityViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintFlowAnalysisResult {
  sources: TaintSourceInfo[];
  sinks: SecuritySinkInfo[];
  sanitizers: SanitizerInfo[];
  flows: TaintFlow[];
  violations: TaintViolation[];
}
```

### TaintViolation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintViolation {
  type: string;
  severity: string;
  source: string;
  sink: string;
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintViolation {
  type: string;
  severity: string;
  source: string;
  sink: string;
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintViolation {
  source: TaintSourceInfo;
  sink: SecuritySinkInfo;
  path: FlowPath;
  message: string;
  severity: SeverityLevel;
}
```

### ReachabilityAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReachabilityAnalysisResult {
  deadCode: Array<{ function: string }>;
  reachabilityScore: number;
  totalNodes: number;
  unreachableNodes: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReachabilityAnalysisResult {
  deadCode: Array<{ function: string }>;
  reachabilityScore: number;
  totalNodes: number;
  unreachableNodes: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ReachabilityAnalysisResult {
  reachableNodes: Set<string>;
  unreachableNodes: Set<string>;
  deadCode: FlowNode[];
}
```

### CycleDetectionResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CycleDetectionResult {
  functions: string[];
  severity: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CycleDetectionResult {
  functions: string[];
  severity: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: FlowPath[];
}
```

### TypeFlowAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeFlowAnalysisResult {
  typeTransitions: TypeTransition[];
  finalType: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeFlowAnalysisResult {
  typeTransitions: TypeTransition[];
  finalType: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeFlowAnalysisResult {
  typeStates: Map<string, TypeState>;
  transitions: TypeTransition[];
  violations: TypeViolation[];
}
```

### TypeTransition (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeTransition {
  from: string;
  to: string;
  location: { line: number; column: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeTransition {
  from: string;
  to: string;
  location: { line: number; column: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeTransition {
  from: TypeState;
  to: TypeState;
  edge: FlowEdge;
}
```

### TypeViolation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeViolation {
  type: string;
  from: string;
  to: string;
  severity: string;
  location: { line: number; column: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeViolation {
  type: string;
  from: string;
  to: string;
  severity: string;
  location: { line: number; column: number };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeViolation {
  location: Position;
  expected?: string;
  actual?: string;
  message: string;
  severity?: 'error' | 'warning';
}
```

### QualityPrediction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface QualityPrediction {
  complexity: number;
  securityRelevance: number;
  testingNeeds: TestingNeeds;
  recommendedTestTypes: string[];
  estimatedTestCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface QualityPrediction {
  complexity: number;
  securityRelevance: number;
  testingNeeds: TestingNeeds;
  recommendedTestTypes: string[];
  estimatedTestCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

### TestingNeeds (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestingNeeds {
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  requiredCoverage: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestingNeeds {
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  requiredCoverage: number;
}
```

### VariableDeclaration (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface VariableDeclaration {
  name: string;
  type: string;
  initializer: string;
  line: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface VariableDeclaration {
  name: string;
  type: string;
  initializer: string;
  line: number;
}
```

### InferredSecurityType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InferredSecurityType {
  type: SecurityType;
  taintLevel: TaintLevel;
  confidence: number;
  evidence: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InferredSecurityType {
  type: SecurityType;
  taintLevel: TaintLevel;
  confidence: number;
  evidence: string[];
}
```

### SecurityApiCall (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SecurityApiCall {
  method: string;
  securityType: SecurityType;
  resultTaintLevel: TaintLevel;
  variable?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SecurityApiCall {
  method: string;
  securityType: SecurityType;
  resultTaintLevel: TaintLevel;
  variable?: string;
}
```

### UserInputDetection (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface UserInputDetection {
  variable: string;
  source: string;
  confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface UserInputDetection {
  variable: string;
  source: string;
  confidence: number;
}
```

### LocalContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface LocalContext {
  method: string;
  variables: string[];
  imports: string[];
  libraries: string[];
  complexity: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/modular.ts
- 種別: interface
- エクスポート: internal
```typescript
interface LocalContext {
  method: string;
  variables: string[];
  imports: string[];
  libraries: string[];
  complexity: number;
}
```

### AnalyzedSignature (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnalyzedSignature extends MethodSignature {
  securityRelevant: boolean;
  taintSources: string[];
  potentialSinks: string[];
  requiredValidations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/modular.ts
- 種別: interface
- エクスポート: internal
```typescript
interface AnalyzedSignature extends MethodSignature {
  securityRelevant: boolean;
  taintSources: string[];
  potentialSinks: string[];
  requiredValidations: string[];
}
```

### TaintPath (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TaintPath {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/modular.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TaintPath {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
}
```

### CriticalFlow (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalFlow {
  id: string;
  source: string;
  sink: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/modular.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CriticalFlow {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalFlow {
  id: string;
  source: string;
  sink: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}
```

### TaintPropagationStep (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationStep {
  from: string;
  to: string;
  operation: string;
  taintLevel: TaintLevel;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationStep {
  from: string;
  to: string;
  operation: string;
  taintLevel: TaintLevel;
}
```

### FlowPath (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowPath {
  id?: string;
  nodes: string[];
  taintLevel?: TaintLevel;
  passedThroughSanitizer?: boolean;
  reachesSecuritySink?: boolean;
  confidence?: number;
  metadata?: {
    source?: string;
    sink?: string;
    variables?: string[];
    [key: string]: unknown;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowPath {
  id?: string;
  nodes: string[];
  taintLevel?: TaintLevel;
  passedThroughSanitizer?: boolean;
  reachesSecuritySink?: boolean;
  confidence?: number;
  metadata?: {
    source?: string;
    sink?: string;
    variables?: string[];
    [key: string]: unknown;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowPath {
  id?: string;
  nodes: string[];
  edges: FlowEdge[];
  isFeasible: boolean;
  condition?: string;
  taintLevel?: TaintLevel;
  reachesSecuritySink?: boolean;
  passedThroughSanitizer?: boolean;
}
```

### ExtendedFlowNode (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedFlowNode {
  id: string;
  type: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  successors?: string[];
  predecessors?: string[];
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: {
    [key: string]: unknown;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedFlowNode {
  id: string;
  type: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  successors?: string[];
  predecessors?: string[];
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: {
    [key: string]: unknown;
  };
}
```

### PathAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PathAnalysisResult {
  riskLevel: string;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
  variables: string[];
  vulnerabilities: string[];
  mitigationSteps: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PathAnalysisResult {
  riskLevel: string;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
  variables: string[];
  vulnerabilities: string[];
  mitigationSteps: string[];
}
```

### TypeSummary (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeSummary {
  /** 識別されたセキュリティ型 */
  securityTypes: SecurityTypeSummary[];
  /** 必要だが不足している型 */
  missingTypes: MissingTypeSummary[];
  /** 汚染源の数 */
  taintSources: number;
  /** サニタイザーの数 */
  sanitizers: number;
  /** 全体的な型安全性スコア */
  typeSafetyScore: number;
  /** 推奨される次のアクション */
  recommendedActions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeSummary {
  /** 識別されたセキュリティ型 */
  securityTypes: SecurityTypeSummary[];
  /** 必要だが不足している型 */
  missingTypes: MissingTypeSummary[];
  /** 汚染源の数 */
  taintSources: number;
  /** サニタイザーの数 */
  sanitizers: number;
  /** 全体的な型安全性スコア */
  typeSafetyScore: number;
  /** 推奨される次のアクション */
  recommendedActions: string[];
}
```

### SecurityTypeSummary (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTypeSummary {
  type: SecurityType;
  count: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTypeSummary {
  type: SecurityType;
  count: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}
```

### MissingTypeSummary (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MissingTypeSummary {
  expectedType: SecurityType;
  location: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedFix: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MissingTypeSummary {
  expectedType: SecurityType;
  location: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedFix: string;
}
```

### FlowAnalysisDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowAnalysisDetail {
  method: string;
  flowPaths: FlowPathDetail[];
  taintPropagation: TaintPropagationDetail[];
  criticalPaths: CriticalPathDetail[];
  securityRisks: SecurityRiskDetail[];
  optimizationSuggestions: OptimizationSuggestion[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowAnalysisDetail {
  method: string;
  flowPaths: FlowPathDetail[];
  taintPropagation: TaintPropagationDetail[];
  criticalPaths: CriticalPathDetail[];
  securityRisks: SecurityRiskDetail[];
  optimizationSuggestions: OptimizationSuggestion[];
}
```

### FlowPathDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowPathDetail {
  pathId: string;
  source: string;
  sink: string;
  taintLevel: TaintLevel;
  sanitized: boolean;
  pathLength: number;
  riskAssessment: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowPathDetail {
  pathId: string;
  source: string;
  sink: string;
  taintLevel: TaintLevel;
  sanitized: boolean;
  pathLength: number;
  riskAssessment: string;
}
```

### TaintPropagationDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationDetail {
  variable: string;
  initialTaint: TaintLevel;
  finalTaint: TaintLevel;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintPropagationDetail {
  variable: string;
  initialTaint: TaintLevel;
  finalTaint: TaintLevel;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
}
```

### LocalTaintPropagationStep (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalTaintPropagationStep {
  step: number;
  operation: string;
  taintChange: { from: TaintLevel; to: TaintLevel };
  reason: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalTaintPropagationStep {
  step: number;
  operation: string;
  taintChange: { from: TaintLevel; to: TaintLevel };
  reason: string;
}
```

### CriticalPathDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPathDetail {
  pathId: string;
  severity: 'high' | 'critical';
  description: string;
  affectedVariables: string[];
  potentialVulnerabilities: string[];
  mitigationSteps: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CriticalPathDetail {
  pathId: string;
  severity: 'high' | 'critical';
  description: string;
  affectedVariables: string[];
  potentialVulnerabilities: string[];
  mitigationSteps: string[];
}
```

### SecurityRiskDetail (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRiskDetail {
  riskId: string;
  category: 'injection' | 'xss' | 'auth' | 'data-leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCode: string;
  remediation: string;
  automatable: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRiskDetail {
  riskId: string;
  category: 'injection' | 'xss' | 'auth' | 'data-leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCode: string;
  remediation: string;
  automatable: boolean;
}
```

### OptimizationSuggestion (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OptimizationSuggestion {
  type: 'performance' | 'security' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OptimizationSuggestion {
  type: 'performance' | 'security' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}
```

### CompleteTypeAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompleteTypeAnalysis {
  typeInference: DetailedTypeInference;
  flowGraphs: DetailedFlowGraph[];
  latticeAnalysis: DetailedLatticeAnalysis;
  securityInvariants: SecurityInvariantAnalysis[];
  comprehensiveReport: ComprehensiveAnalysisReport;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompleteTypeAnalysis {
  typeInference: DetailedTypeInference;
  flowGraphs: DetailedFlowGraph[];
  latticeAnalysis: DetailedLatticeAnalysis;
  securityInvariants: SecurityInvariantAnalysis[];
  comprehensiveReport: ComprehensiveAnalysisReport;
}
```

### DetailedTypeInference (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedTypeInference {
  totalVariables: number;
  typedVariables: number;
  inferenceAccuracy: number;
  typeDistribution: Map<SecurityType, number>;
  uncertainTypes: UncertainTypeInfo[];
  typeConflicts: TypeConflictInfo[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedTypeInference {
  totalVariables: number;
  typedVariables: number;
  inferenceAccuracy: number;
  typeDistribution: Map<SecurityType, number>;
  uncertainTypes: UncertainTypeInfo[];
  typeConflicts: TypeConflictInfo[];
}
```

### UncertainTypeInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UncertainTypeInfo {
  variable: string;
  possibleTypes: SecurityType[];
  confidence: number;
  evidence: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UncertainTypeInfo {
  variable: string;
  possibleTypes: SecurityType[];
  confidence: number;
  evidence: string[];
}
```

### TypeConflictInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeConflictInfo {
  variable: string;
  conflictingTypes: SecurityType[];
  resolutionSuggestion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeConflictInfo {
  variable: string;
  conflictingTypes: SecurityType[];
  resolutionSuggestion: string;
}
```

### DetailedFlowGraph (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedFlowGraph {
  methodName: string;
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  taintSources: number;
  sanitizers: number;
  sinks: number;
  vulnerablePaths: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedFlowGraph {
  methodName: string;
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  taintSources: number;
  sanitizers: number;
  sinks: number;
  vulnerablePaths: number;
}
```

### DetailedLatticeAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedLatticeAnalysis {
  latticeHeight: number;
  joinOperations: number;
  meetOperations: number;
  fixpointIterations: number;
  convergenceTime: number;
  stabilityMetrics: LatticeStabilityMetrics;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedLatticeAnalysis {
  latticeHeight: number;
  joinOperations: number;
  meetOperations: number;
  fixpointIterations: number;
  convergenceTime: number;
  stabilityMetrics: LatticeStabilityMetrics;
}
```

### LatticeStabilityMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LatticeStabilityMetrics {
  monotonicity: number;
  consistency: number;
  convergenceRate: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LatticeStabilityMetrics {
  monotonicity: number;
  consistency: number;
  convergenceRate: number;
}
```

### SecurityInvariantAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityInvariantAnalysis {
  invariantId: string;
  description: string;
  status: 'satisfied' | 'violated' | 'unknown';
  violationCount: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityInvariantAnalysis {
  invariantId: string;
  description: string;
  status: 'satisfied' | 'violated' | 'unknown';
  violationCount: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}
```

### ComprehensiveAnalysisReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComprehensiveAnalysisReport {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: RiskAssessment;
  recommendationPriorities: RecommendationPriority[];
  metricsComparison: MetricsComparison;
  futureTrends: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ComprehensiveAnalysisReport {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: RiskAssessment;
  recommendationPriorities: RecommendationPriority[];
  metricsComparison: MetricsComparison;
  futureTrends: string[];
}
```

### RiskFactor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  description: string;
}
```

### RecommendationPriority (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecommendationPriority {
  priority: number;
  category: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RecommendationPriority {
  priority: number;
  category: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
}
```

### MetricsComparison (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetricsComparison {
  current: SecurityTestMetrics;
  baseline: SecurityTestMetrics;
  improvement: MetricsImprovement;
  benchmarks: BenchmarkComparison[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetricsComparison {
  current: SecurityTestMetrics;
  baseline: SecurityTestMetrics;
  improvement: MetricsImprovement;
  benchmarks: BenchmarkComparison[];
}
```

### MetricsImprovement (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetricsImprovement {
  overall: number;
  byCategory: Map<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetricsImprovement {
  overall: number;
  byCategory: Map<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}
```

### BenchmarkComparison (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkComparison {
  category: string;
  industry: string;
  ourScore: number;
  benchmarkScore: number;
  percentile: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkComparison {
  category: string;
  industry: string;
  ourScore: number;
  benchmarkScore: number;
  percentile: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/PerformanceBenchmark.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkComparison {
  /** ベースライン結果 */
  baseline: BenchmarkResult;
  /** 最適化後結果 */
  optimized: BenchmarkResult;
  /** 速度向上率 */
  speedupRatio: number;
  /** メモリ効率向上率 */
  memoryEfficiencyRatio: number;
  /** 5ms/file目標達成状況 */
  target5msAchieved: boolean;
  /** 3-20x目標達成状況 */
  speedupTargetAchieved: boolean;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  regressions: string[];
}
```

### ProgressiveAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ProgressiveAnalysisResult {
  phase: number;
  summary: TypeSummary;
  detailedAnalysis: MethodAnalysisResult[];
  nextSteps: string[];
  completionPercentage: number;
  estimatedRemainingTime?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ProgressiveAnalysisResult {
  phase: number;
  summary: TypeSummary;
  detailedAnalysis: MethodAnalysisResult[];
  nextSteps: string[];
  completionPercentage: number;
  estimatedRemainingTime?: number;
}
```

### AIContextInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIContextInfo {
  analysisComplexity: 'low' | 'medium' | 'high';
  recommendedApproach: string;
  keyInsights: string[];
  prioritizedActions: string[];
  confidenceMetrics: {
    overall: number;
    byCategory: Map<string, number>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/progressive-ai.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AIContextInfo {
  analysisComplexity: 'low' | 'medium' | 'high';
  recommendedApproach: string;
  keyInsights: string[];
  prioritizedActions: string[];
  confidenceMetrics: {
    overall: number;
    byCategory: Map<string, number>;
  };
}
```

### InferenceState (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InferenceState {
  /** 変数名から型クオリファイアへのマッピング */
  typeMap: Map<string, TaintQualifier>;
  /** 生成された制約のリスト */
  constraints: TypeConstraint[];
  /** 推論の信頼度 */
  confidence: Map<string, number>;
  /** 探索の履歴 */
  searchHistory: SearchStep[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/search-based-inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface InferenceState {
  /** 変数名から型クオリファイアへのマッピング */
  typeMap: Map<string, TaintQualifier>;
  /** 生成された制約のリスト */
  constraints: TypeConstraint[];
  /** 推論の信頼度 */
  confidence: Map<string, number>;
  /** 探索の履歴 */
  searchHistory: SearchStep[];
}
```

### SearchStep (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SearchStep {
  variable: string;
  previousType: TaintQualifier | null;
  newType: TaintQualifier;
  reason: string;
  timestamp: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/search-based-inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SearchStep {
  variable: string;
  previousType: TaintQualifier | null;
  newType: TaintQualifier;
  reason: string;
  timestamp: number;
}
```

### SolverResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SolverResult {
  success: boolean;
  solution: Map<string, TaintQualifier>;
  unsatisfiableConstraints: TypeConstraint[];
  iterations: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/search-based-inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SolverResult {
  success: boolean;
  solution: Map<string, TaintQualifier>;
  unsatisfiableConstraints: TypeConstraint[];
  iterations: number;
}
```

### TypeChangeCandidate (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeChangeCandidate {
  variable: string;
  oldType: TaintQualifier;
  newType: TaintQualifier;
  reason: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/analysis/search-based-inference.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeChangeCandidate {
  variable: string;
  oldType: TaintQualifier;
  newType: TaintQualifier;
  reason: string;
}
```

### DecoratorTarget (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DecoratorTarget = Object | Function | { prototype?: Object; new?(...args: unknown[]): unknown };
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DecoratorTarget = Object | Function | { prototype?: Object; new?(...args: unknown[]): unknown };
```

### PropertyKey (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PropertyKey = string | symbol;
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PropertyKey = string | symbol;
```

### Timestamp (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Timestamp = number;
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type Timestamp = number;
```

### TaintMetadata (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintMetadata {
  level: 'tainted' | 'untainted' | 'poly';
  source?: string;
  reason?: string;
  timestamp: Timestamp;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintMetadata {
  level: 'tainted' | 'untainted' | 'poly';
  source?: string;
  reason?: string;
  timestamp: Timestamp;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintMetadata {
  level: TaintLevel;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
  propagationPath?: string[];
  location?: Position;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintMetadata {
  level: TaintLevel;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
  propagationPath?: string[];
}
```

### PolyTaintMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintMetadata {
  level?: 'poly';
  polymorphic?: boolean;
  description?: string;
  parameterIndices?: number[];
  propagationRule?: 'any' | 'all';
  timestamp: Timestamp;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintMetadata {
  level?: 'poly';
  polymorphic?: boolean;
  description?: string;
  parameterIndices?: number[];
  propagationRule?: 'any' | 'all';
  timestamp: Timestamp;
}
```

### SuppressTaintMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SuppressTaintMetadata {
  suppressed: boolean;
  reason: string;
  timestamp: Timestamp;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SuppressTaintMetadata {
  suppressed: boolean;
  reason: string;
  timestamp: Timestamp;
}
```

### ParameterTaintMetadata (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ParameterTaintMetadata = TaintMetadata[];
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ParameterTaintMetadata = TaintMetadata[];
```

### ClassAnnotationInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassAnnotationInfo {
  taint?: TaintMetadata;
  poly?: PolyTaintMetadata;
  suppress?: SuppressTaintMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ClassAnnotationInfo {
  taint?: TaintMetadata;
  poly?: PolyTaintMetadata;
  suppress?: SuppressTaintMetadata;
}
```

### ClassAnnotationMap (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ClassAnnotationMap = Map<string, ClassAnnotationInfo>;
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ClassAnnotationMap = Map<string, ClassAnnotationInfo>;
```

### DecoratorDescriptor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DecoratorDescriptor = PropertyDescriptor | number | undefined;
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type DecoratorDescriptor = PropertyDescriptor | number | undefined;
```

### DecoratorFunction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DecoratorFunction {
  (target: DecoratorTarget, propertyKey?: PropertyKey, descriptor?: DecoratorDescriptor): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DecoratorFunction {
  (target: DecoratorTarget, propertyKey?: PropertyKey, descriptor?: DecoratorDescriptor): void;
}
```

### CompositeDecorator (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type CompositeDecorator = PropertyDecorator & ParameterDecorator & MethodDecorator;
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type CompositeDecorator = PropertyDecorator & ParameterDecorator & MethodDecorator;
```

### ExtendedMethodDecorator (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedMethodDecorator {
  (target: DecoratorTarget, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor | void;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ExtendedMethodDecorator {
  (target: DecoratorTarget, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor | void;
}
```

### TaintValidationError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
}
```

### MetadataStorage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataStorage {
  taint: Map<PropertyKey, TaintMetadata>;
  polyTaint: Map<PropertyKey, PolyTaintMetadata>;
  suppress: Map<PropertyKey, SuppressTaintMetadata>;
  parameters: Map<PropertyKey, ParameterTaintMetadata>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataStorage {
  taint: Map<PropertyKey, TaintMetadata>;
  polyTaint: Map<PropertyKey, PolyTaintMetadata>;
  suppress: Map<PropertyKey, SuppressTaintMetadata>;
  parameters: Map<PropertyKey, ParameterTaintMetadata>;
}
```

### MetadataCollector (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataCollector {
  getTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): TaintMetadata | undefined;
  getParameterTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): ParameterTaintMetadata;
  getPolyTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): PolyTaintMetadata | undefined;
  getSuppressMetadata(target: DecoratorTarget, propertyKey: PropertyKey): SuppressTaintMetadata | undefined;
  collectClassAnnotations(target: DecoratorTarget): ClassAnnotationMap;
  validateAnnotations(target: DecoratorTarget): string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MetadataCollector {
  getTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): TaintMetadata | undefined;
  getParameterTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): ParameterTaintMetadata;
  getPolyTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): PolyTaintMetadata | undefined;
  getSuppressMetadata(target: DecoratorTarget, propertyKey: PropertyKey): SuppressTaintMetadata | undefined;
  collectClassAnnotations(target: DecoratorTarget): ClassAnnotationMap;
  validateAnnotations(target: DecoratorTarget): string[];
}
```

### MethodArguments (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MethodArguments = unknown[];
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: type
- エクスポート: exported
```typescript
export type MethodArguments = unknown[];
```

### DecoratorContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DecoratorContext {
  target: DecoratorTarget;
  propertyKey?: PropertyKey;
  descriptor?: DecoratorDescriptor;
  parameterIndex?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/annotations/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DecoratorContext {
  target: DecoratorTarget;
  propertyKey?: PropertyKey;
  descriptor?: DecoratorDescriptor;
  parameterIndex?: number;
}
```

### BenchmarkConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkConfig {
  /** テストサイズ */
  testSizes: ('small' | 'medium' | 'large' | 'xlarge')[];
  /** 実行回数（平均を取る） */
  iterations: number;
  /** 5ms/file目標の許容誤差（%） */
  target5msTolerance: number;
  /** 速度向上目標の許容範囲 */
  speedupTargetRange: { min: number; max: number };
  /** 性能劣化の警告閾値（%） */
  regressionThreshold: number;
  /** 出力ディレクトリ */
  outputDir: string;
  /** CI環境での実行かどうか */
  isCiEnvironment: boolean;
  /** 詳細ログの出力 */
  verbose: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkConfig {
  /** テストサイズ */
  testSizes: ('small' | 'medium' | 'large' | 'xlarge')[];
  /** 実行回数（平均を取る） */
  iterations: number;
  /** 5ms/file目標の許容誤差（%） */
  target5msTolerance: number;
  /** 速度向上目標の許容範囲 */
  speedupTargetRange: { min: number; max: number };
  /** 性能劣化の警告閾値（%） */
  regressionThreshold: number;
  /** 出力ディレクトリ */
  outputDir: string;
  /** CI環境での実行かどうか */
  isCiEnvironment: boolean;
  /** 詳細ログの出力 */
  verbose: boolean;
}
```

### BenchmarkHistory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkHistory {
  /** タイムスタンプ */
  timestamp: string;
  /** Git commit hash */
  commitHash?: string;
  /** ブランチ名 */
  branch?: string;
  /** ベンチマーク結果 */
  results: BenchmarkComparison[];
  /** システム情報のハッシュ */
  systemHash: string;
  /** 性能スコア */
  performanceScore: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkHistory {
  /** タイムスタンプ */
  timestamp: string;
  /** Git commit hash */
  commitHash?: string;
  /** ブランチ名 */
  branch?: string;
  /** ベンチマーク結果 */
  results: BenchmarkComparison[];
  /** システム情報のハッシュ */
  systemHash: string;
  /** 性能スコア */
  performanceScore: number;
}
```

### RegressionDetectionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RegressionDetectionResult {
  /** 回帰が検出されたかどうか */
  hasRegression: boolean;
  /** 回帰項目 */
  regressions: PerformanceRegression[];
  /** 改善項目 */
  improvements: PerformanceImprovement[];
  /** 総合評価 */
  overallAssessment: 'excellent' | 'good' | 'warning' | 'critical';
  /** 推奨アクション */
  recommendedActions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RegressionDetectionResult {
  /** 回帰が検出されたかどうか */
  hasRegression: boolean;
  /** 回帰項目 */
  regressions: PerformanceRegression[];
  /** 改善項目 */
  improvements: PerformanceImprovement[];
  /** 総合評価 */
  overallAssessment: 'excellent' | 'good' | 'warning' | 'critical';
  /** 推奨アクション */
  recommendedActions: string[];
}
```

### PerformanceRegression (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceRegression {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 劣化率（%） */
  degradationPercent: number;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 説明 */
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceRegression {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 劣化率（%） */
  degradationPercent: number;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 説明 */
  description: string;
}
```

### PerformanceImprovement (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceImprovement {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 改善率（%） */
  improvementPercent: number;
  /** 説明 */
  description: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceImprovement {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 改善率（%） */
  improvementPercent: number;
  /** 説明 */
  description: string;
}
```

### PerformanceTrendAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceTrendAnalysis {
  /** トレンド方向 */
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient-data';
  /** 平均スコア */
  averageScore: number;
  /** スコアのばらつき */
  scoreVariation: number;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  degradations: string[];
  /** 推奨事項 */
  recommendations: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/BenchmarkRunner.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceTrendAnalysis {
  /** トレンド方向 */
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient-data';
  /** 平均スコア */
  averageScore: number;
  /** スコアのばらつき */
  scoreVariation: number;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  degradations: string[];
  /** 推奨事項 */
  recommendations: string[];
}
```

### BenchmarkResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkResult {
  /** テスト名 */
  testName: string;
  /** ファイル数 */
  fileCount: number;
  /** メソッド数 */
  methodCount: number;
  /** 総実行時間（ms） */
  totalTime: number;
  /** ファイル当たりの実行時間（ms） */
  timePerFile: number;
  /** メソッド当たりの実行時間（ms） */
  timePerMethod: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** CPU使用率（%） */
  cpuUsage: number;
  /** スループット（files/sec） */
  throughput: number;
  /** 成功率（%） */
  successRate: number;
  /** エラー数 */
  errorCount: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュヒット率（%） */
  cacheHitRate: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/PerformanceBenchmark.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BenchmarkResult {
  /** テスト名 */
  testName: string;
  /** ファイル数 */
  fileCount: number;
  /** メソッド数 */
  methodCount: number;
  /** 総実行時間（ms） */
  totalTime: number;
  /** ファイル当たりの実行時間（ms） */
  timePerFile: number;
  /** メソッド当たりの実行時間（ms） */
  timePerMethod: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** CPU使用率（%） */
  cpuUsage: number;
  /** スループット（files/sec） */
  throughput: number;
  /** 成功率（%） */
  successRate: number;
  /** エラー数 */
  errorCount: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュヒット率（%） */
  cacheHitRate: number;
}
```

### SystemInfo (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SystemInfo {
  /** CPU情報 */
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  /** メモリ情報 */
  memory: {
    total: number;
    free: number;
    used: number;
  };
  /** OS情報 */
  os: {
    platform: string;
    release: string;
    arch: string;
  };
  /** Node.js バージョン */
  nodeVersion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/benchmarks/PerformanceBenchmark.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SystemInfo {
  /** CPU情報 */
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  /** メモリ情報 */
  memory: {
    total: number;
    free: number;
    used: number;
  };
  /** OS情報 */
  os: {
    platform: string;
    release: string;
    arch: string;
  };
  /** Node.js バージョン */
  nodeVersion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
  };
  memory: {
    total: number;
  };
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  nodeVersion: string;
  platform: string;
  osVersion: string;
}
```

### ParallelTypeCheckConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParallelTypeCheckConfig {
  /** ワーカースレッド数（デフォルト: CPUコア数） */
  workerCount?: number;
  /** メソッドあたりの最大解析時間（ミリ秒） */
  methodTimeout?: number;
  /** バッチサイズ（一度に処理するメソッド数） */
  batchSize?: number;
  /** キャッシュを有効にするか */
  enableCache?: boolean;
  /** デバッグモード */
  debug?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/parallel-type-checker.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParallelTypeCheckConfig {
  /** ワーカースレッド数（デフォルト: CPUコア数） */
  workerCount?: number;
  /** メソッドあたりの最大解析時間（ミリ秒） */
  methodTimeout?: number;
  /** バッチサイズ（一度に処理するメソッド数） */
  batchSize?: number;
  /** キャッシュを有効にするか */
  enableCache?: boolean;
  /** デバッグモード */
  debug?: boolean;
}
```

### MethodTypeCheckResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodTypeCheckResult {
  method: TestMethod;
  typeCheckResult: TypeCheckResult;
  inferredTypes: Map<string, QualifiedType<unknown>>;
  securityIssues: SecurityIssue[];
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/parallel-type-checker.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodTypeCheckResult {
  method: TestMethod;
  typeCheckResult: TypeCheckResult;
  inferredTypes: Map<string, QualifiedType<unknown>>;
  securityIssues: SecurityIssue[];
  executionTime: number;
}
```

### TypeCheckWorkerMessage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWorkerMessage {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, unknown]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWorkerMessage {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, unknown]>;
}
```

### TypeCheckWorkerResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWorkerResult {
  id: string;
  success: boolean;
  result?: TypeInferenceWorkerResult;
  error?: string;
  executionTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWorkerResult {
  id: string;
  success: boolean;
  result?: TypeInferenceWorkerResult;
  error?: string;
  executionTime: number;
}
```

### TypeInferenceWorkerResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceWorkerResult {
  inferredTypes: Map<string, QualifiedType<unknown>>;
  violations: SecurityViolation[];
  securityIssues: SecurityIssue[];
  warnings: TypeCheckWarning[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceWorkerResult {
  inferredTypes: Map<string, QualifiedType<unknown>>;
  violations: SecurityViolation[];
  securityIssues: SecurityIssue[];
  warnings: TypeCheckWarning[];
}
```

### SecurityViolation (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityViolation {
  type: string;
  description?: string;
  location: CodeLocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityViolation {
  type: string;
  description?: string;
  location: CodeLocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/lattice/modern-security-lattice.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityViolation {
  type: string;
  variable: string;
  qualifier: TaintQualifier;
  confidence?: number;
  metadata: TaintMetadata;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityViolation {
  type: 'taint' | 'type' | 'flow' | 'invariant' | 'unsanitized-taint-flow' | 'missing-sanitizer' | 'unsafe-assertion' | 'sql-injection' | 'xss' | 'command-injection';
  severity: SeverityLevel;
  message: string;
  location?: Position;
  path?: FlowPath;
  fix?: string;
  suggestedFix?: string;
  variable?: string;
  taintLevel?: TaintLevel;
  metadata?: TaintMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/lattice.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityViolation {
  /** 違反の種別 */
  type: 'taint' | 'type' | 'flow' | 'invariant' | 'unsanitized-taint-flow' | 'missing-sanitizer' | 'unsafe-assertion' | 'sql-injection' | 'xss' | 'command-injection';
  /** 重要度 */
  severity: SeverityLevel;
  /** メッセージ */
  message: string;
  /** 位置 */
  location?: Position;
  /** パス */
  path?: FlowPath;
  /** 修正提案 */
  fix?: string;
  suggestedFix?: string;
  /** 関連する変数 */
  variable?: string;
  /** 汚染レベル */
  taintLevel?: TaintLevel;
  /** メタデータ */
  metadata?: TaintMetadata;
}
```

### TypeCheckWarning (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWarning {
  message: string;
  location?: CodeLocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckWarning {
  message: string;
  location?: CodeLocation;
}
```

### LocalAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalAnalysisResult {
  escapingVariables?: string[];
  annotations?: Array<{
    variable: string;
    annotation: string;
  }>;
  flows?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  userInputs?: string[];
  databaseInputs?: string[];
  apiInputs?: string[];
  controlFlows?: Array<{
    type: string;
    condition?: string;
    variables?: string[];
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalAnalysisResult {
  escapingVariables?: string[];
  annotations?: Array<{
    variable: string;
    annotation: string;
  }>;
  flows?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  userInputs?: string[];
  databaseInputs?: string[];
  apiInputs?: string[];
  controlFlows?: Array<{
    type: string;
    condition?: string;
    variables?: string[];
  }>;
}
```

### MethodAnalysisContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisContext {
  name: string;
  content: string;
  filePath: string;
  parameters?: Array<{
    name: string;
    type?: string;
  }>;
  returnType?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodAnalysisContext {
  name: string;
  content: string;
  filePath: string;
  parameters?: Array<{
    name: string;
    type?: string;
  }>;
  returnType?: string;
}
```

### MethodCall (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodCall {
  name: string;
  arguments: string[];
  returnType?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/checker/type-check-worker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface MethodCall {
  methodName: string;
  arguments: string[];
  assignedTo?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodCall {
  name: string;
  arguments: string[];
  returnType?: string;
}
```

### ParsedAnnotationFile (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ParsedAnnotationFile {
  annotations: Map<string, string>;
  getAnnotation(className: string, methodName: string, type: string, idx?: number): string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-compatibility.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ParsedAnnotationFile {
  annotations: Map<string, string>;
  getAnnotation(className: string, methodName: string, type: string, idx?: number): string;
}
```

### StubFileData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface StubFileData {
  getMethodAnnotation(className: string, methodName: string): string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-compatibility.ts
- 種別: interface
- エクスポート: internal
```typescript
interface StubFileData {
  getMethodAnnotation(className: string, methodName: string): string;
}
```

### CheckerFrameworkType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CheckerFrameworkType {
  qualifier: string;
  baseType: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-compatibility.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CheckerFrameworkType {
  qualifier: string;
  baseType: string;
}
```

### FlowAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FlowAnalysisResult {
  getTypeAt(varName: string, lineNum: number): string;
  getTypeInBranch(varName: string, branch: string): string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-compatibility.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FlowAnalysisResult {
  getTypeAt(varName: string, lineNum: number): string;
  getTypeInBranch(varName: string, branch: string): string;
}
```

### ParameterInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParameterInfo {
  name?: string;
  type: string;
  annotation?: string;
  index: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParameterInfo {
  name?: string;
  type: string;
  annotation?: string;
  index: number;
}
```

### MethodInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}
```

### FieldInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FieldInfo {
  name: string;
  type: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FieldInfo {
  name: string;
  type: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}
```

### MigrationPlan (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationPlan {
  phases: MigrationPhase[];
  totalFiles: number;
  estimatedHours: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationPlan {
  phases: MigrationPhase[];
  totalFiles: number;
  estimatedHours: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/migrationHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationPlan {
  pluginName: string;
  migrationSteps: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  breakingChanges: string[];
  compatibilityNotes: string[];
}
```

### MigrationPhase (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationPhase {
  name: string;
  description: string;
  files: string[];
  order: number;
  dependencies?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationPhase {
  name: string;
  description: string;
  files: string[];
  order: number;
  dependencies?: string[];
}
```

### LibraryConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LibraryConfig {
  name: string;
  version: string;
  includePaths?: string[];
  excludePaths?: string[];
  customAnnotations?: Record<string, string>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LibraryConfig {
  name: string;
  version: string;
  includePaths?: string[];
  excludePaths?: string[];
  customAnnotations?: Record<string, string>;
}
```

### MethodCallCheckResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodCallCheckResult {
  safe: boolean;
  violations?: string[];
  warnings?: string[];
  suggestedFixes?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MethodCallCheckResult {
  safe: boolean;
  violations?: string[];
  warnings?: string[];
  suggestedFixes?: string[];
}
```

### PolyTaintInstantiationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintInstantiationResult {
  qualifier: string;
  confidence: number;
  reason: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintInstantiationResult {
  qualifier: string;
  confidence: number;
  reason: string;
}
```

### QualifiedValue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualifiedValue<T = unknown> = TaintedType<T> | UntaintedType<T>;
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualifiedValue<T = unknown> = TaintedType<T> | UntaintedType<T>;
```

### AnnotatedTypeFactory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotatedTypeFactory {
  getAnnotatedType(tree: unknown): AnnotatedType;
  createType(baseType: string, annotations: string[]): AnnotatedType;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotatedTypeFactory {
  getAnnotatedType(tree: unknown): AnnotatedType;
  createType(baseType: string, annotations: string[]): AnnotatedType;
}
```

### AnnotatedType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotatedType {
  baseType: string;
  annotations: string[];
  isSubtypeOf(other: AnnotatedType): boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnnotatedType {
  baseType: string;
  annotations: string[];
  isSubtypeOf(other: AnnotatedType): boolean;
}
```

### CheckerVisitor (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CheckerVisitor {
  visitMethodInvocation(node: unknown): void;
  visitAssignment(node: unknown): void;
  visitReturn(node: unknown): void;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CheckerVisitor {
  visitMethodInvocation(node: unknown): void;
  visitAssignment(node: unknown): void;
  visitReturn(node: unknown): void;
}
```

### LegacyCompatibleType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type LegacyCompatibleType<T> = QualifiedType<T> & {
  __legacyLevel?: TaintLevel;
};
```

#### /Users/sasakama/Projects/Rimor/src/security/compatibility/taint-level-adapter.ts
- 種別: type
- エクスポート: exported
```typescript
export type LegacyCompatibleType<T> = QualifiedType<T> & {
  __legacyLevel?: TaintLevel;
};
```

### LocalVariableAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalVariableAnalysisResult {
  /** メソッド内のローカル変数リスト */
  localVariables: string[];
  /** 推論された型マップ */
  inferredTypes: Map<string, TaintQualifier>;
  /** スコープ情報 */
  scopeInfo: Map<string, string>;
  /** エスケープする変数（メソッド外で参照される） */
  escapingVariables: string[];
  /** 最適化が適用されたか */
  optimizationApplied: boolean;
  /** スキップされた冗長チェック数 */
  redundantChecksSkipped: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LocalVariableAnalysisResult {
  /** メソッド内のローカル変数リスト */
  localVariables: string[];
  /** 推論された型マップ */
  inferredTypes: Map<string, TaintQualifier>;
  /** スコープ情報 */
  scopeInfo: Map<string, string>;
  /** エスケープする変数（メソッド外で参照される） */
  escapingVariables: string[];
  /** 最適化が適用されたか */
  optimizationApplied: boolean;
  /** スキップされた冗長チェック数 */
  redundantChecksSkipped: number;
}
```

### InferenceOptimizationResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InferenceOptimizationResult {
  /** 型マップ */
  typeMap: Map<string, TaintQualifier>;
  /** 最適化メトリクス */
  optimizationMetrics: {
    localVariablesOptimized: number;
    cacheHits: number;
    inferenceTimeMs: number;
  };
  /** 警告メッセージ */
  warnings: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InferenceOptimizationResult {
  /** 型マップ */
  typeMap: Map<string, TaintQualifier>;
  /** 最適化メトリクス */
  optimizationMetrics: {
    localVariablesOptimized: number;
    cacheHits: number;
    inferenceTimeMs: number;
  };
  /** 警告メッセージ */
  warnings: string[];
}
```

### CacheHitStatistics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheHitStatistics {
  hits: number;
  misses: number;
  hitRate: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CacheHitStatistics {
  hits: number;
  misses: number;
  hitRate: number;
}
```

### ChangeInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChangeInfo {
  methodName: string;
  newHash: string;
  changeType: ChangeType;
  affectedLines: number[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChangeInfo {
  methodName: string;
  newHash: string;
  changeType: ChangeType;
  affectedLines: number[];
}
```

### ChangeType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: internal
```typescript
type ChangeType = 'signature' | 'body' | 'comment';
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: type
- エクスポート: internal
```typescript
type ChangeType = 'signature' | 'body' | 'comment';
```

### ChangeDetectionResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChangeDetectionResult {
  type: ChangeType;
  affectedLines: number[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/inference/local-inference-optimizer.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ChangeDetectionResult {
  type: ChangeType;
  affectedLines: number[];
}
```

### LatticeAnalysisStats (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LatticeAnalysisStats {
  variablesAnalyzed: number;
  taintedVariables: number;
  untaintedVariables: number;
  polyTaintVariables: number;
  violationsFound: number;
  analysisTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/lattice/modern-security-lattice.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LatticeAnalysisStats {
  variablesAnalyzed: number;
  taintedVariables: number;
  untaintedVariables: number;
  polyTaintVariables: number;
  violationsFound: number;
  analysisTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/lattice.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LatticeAnalysisStats {
  /** 解析された変数数 */
  variablesAnalyzed: number;
  /** 汚染された変数数 */
  taintedVariables: number;
  /** 検出された違反数 */
  violationsFound: number;
  /** 解析時間（ms） */
  analysisTime: number;
  /** 格子の高さ（複雑さの指標） */
  latticeHeight: number;
}
```

### CryptoPattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CryptoPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/CryptographicFailuresPlugin.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CryptoPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### OWASPCategory (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum OWASPCategory {
  A01_BROKEN_ACCESS_CONTROL = 'A01:2021',
  A02_CRYPTOGRAPHIC_FAILURES = 'A02:2021',
  A03_INJECTION = 'A03:2021',
  A04_INSECURE_DESIGN = 'A04:2021',
  A05_SECURITY_MISCONFIGURATION = 'A05:2021',
  A06_VULNERABLE_COMPONENTS = 'A06:2021',
  A07_IDENTIFICATION_AUTH_FAILURES = 'A07:2021',
  A08_DATA_INTEGRITY_FAILURES = 'A08:2021',
  A09_SECURITY_LOGGING_FAILURES = 'A09:2021',
  A10_SSRF = 'A10:2021'
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/IOWASPSecurityPlugin.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum OWASPCategory {
  A01_BROKEN_ACCESS_CONTROL = 'A01:2021',
  A02_CRYPTOGRAPHIC_FAILURES = 'A02:2021',
  A03_INJECTION = 'A03:2021',
  A04_INSECURE_DESIGN = 'A04:2021',
  A05_SECURITY_MISCONFIGURATION = 'A05:2021',
  A06_VULNERABLE_COMPONENTS = 'A06:2021',
  A07_IDENTIFICATION_AUTH_FAILURES = 'A07:2021',
  A08_DATA_INTEGRITY_FAILURES = 'A08:2021',
  A09_SECURITY_LOGGING_FAILURES = 'A09:2021',
  A10_SSRF = 'A10:2021'
}
```

### OWASPTestResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OWASPTestResult {
  category: OWASPCategory;
  coverage: number;
  issues: SecurityIssue[];
  recommendations: string[];
  testPatterns: string[];
  missingTests: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/IOWASPSecurityPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface OWASPTestResult {
  category: OWASPCategory;
  coverage: number;
  issues: SecurityIssue[];
  recommendations: string[];
  testPatterns: string[];
  missingTests: string[];
}
```

### IOWASPSecurityPlugin (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IOWASPSecurityPlugin extends ITestQualityPlugin {
  /**
   * OWASPカテゴリ
   */
  owaspCategory: OWASPCategory;
  
  /**
   * CWE（Common Weakness Enumeration）IDのリスト
   */
  cweIds: string[];
  
  /**
   * セキュリティテストパターンの検証
   */
  validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult>;
  
  /**
   * 脆弱性パターンの検出
   */
  detectVulnerabilityPatterns(content: string): SecurityIssue[];
  
  /**
   * 推奨されるセキュリティテストの生成
   */
  generateSecurityTests(context: ProjectContext): string[];
  
  /**
   * エンタープライズ要件の検証
   */
  validateEnterpriseRequirements?(testFile: TestFile): boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/IOWASPSecurityPlugin.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IOWASPSecurityPlugin extends ITestQualityPlugin {
  /**
   * OWASPカテゴリ
   */
  owaspCategory: OWASPCategory;
  
  /**
   * CWE（Common Weakness Enumeration）IDのリスト
   */
  cweIds: string[];
  
  /**
   * セキュリティテストパターンの検証
   */
  validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult>;
  
  /**
   * 脆弱性パターンの検出
   */
  detectVulnerabilityPatterns(content: string): SecurityIssue[];
  
  /**
   * 推奨されるセキュリティテストの生成
   */
  generateSecurityTests(context: ProjectContext): string[];
  
  /**
   * エンタープライズ要件の検証
   */
  validateEnterpriseRequirements?(testFile: TestFile): boolean;
}
```

### InjectionQualityDetails (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InjectionQualityDetails extends QualityDetails {
  sqlInjectionCoverage?: number;
  commandInjectionCoverage?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InjectionQualityDetails extends QualityDetails {
  sqlInjectionCoverage?: number;
  commandInjectionCoverage?: number;
}
```

### VulnerableComponentsQualityDetails (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerableComponentsQualityDetails extends QualityDetails {
  vulnerabilityScanCoverage?: number;
  dependencyCheckCoverage?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface VulnerableComponentsQualityDetails extends QualityDetails {
  vulnerabilityScanCoverage?: number;
  dependencyCheckCoverage?: number;
}
```

### CryptographicFailuresQualityDetails (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CryptographicFailuresQualityDetails extends QualityDetails {
  weakAlgorithmsDetected?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/owasp/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CryptographicFailuresQualityDetails extends QualityDetails {
  weakAlgorithmsDetected?: number;
}
```

### AuthASTNode (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthASTNode {
  type: string;
  value?: string;
  name?: string;
  operator?: string;
  left?: AuthASTNode;
  right?: AuthASTNode;
  object?: AuthASTNode;
  property?: AuthASTNode;
  callee?: AuthASTNode;
  arguments?: AuthASTNode[];
  children?: AuthASTNode[];
  statement?: {
    content: string;
    [key: string]: unknown;
  };
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/typed-auth-plugin-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthASTNode {
  type: string;
  value?: string;
  name?: string;
  operator?: string;
  left?: AuthASTNode;
  right?: AuthASTNode;
  object?: AuthASTNode;
  property?: AuthASTNode;
  callee?: AuthASTNode;
  arguments?: AuthASTNode[];
  children?: AuthASTNode[];
  statement?: {
    content: string;
    [key: string]: unknown;
  };
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

### AuthTypeInferenceResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTypeInferenceResult extends TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/typed-auth-plugin-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTypeInferenceResult extends TypeInferenceResult {
  inferredTypes?: Record<string, string>;
  typeConstraints?: Array<{
    variable: string;
    constraint: string;
  }>;
  typeErrors?: Array<{
    message: string;
    location?: {
      line: number;
      column?: number;
    };
  }>;
}
```

### AuthTaintPath (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTaintPath {
  source: string;
  sink: string;
  nodes: string[];
  taintLevel: TaintLevel;
  isAuthRelated: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/typed-auth-plugin-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTaintPath {
  source: string;
  sink: string;
  nodes: string[];
  taintLevel: TaintLevel;
  isAuthRelated: boolean;
}
```

### AuthCriticalFlow (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthCriticalFlow {
  id: string;
  path: string[];
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  authContext: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/typed-auth-plugin-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthCriticalFlow {
  id: string;
  path: string[];
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  authContext: string;
}
```

### AnalysisError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisError {
  message: string;
  stack?: string;
  code?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/plugins/typed-auth-plugin-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisError {
  message: string;
  stack?: string;
  code?: string;
}
```

### TaintPropagationRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintPropagationRule = 'any' | 'all' | 'none';
```

#### /Users/sasakama/Projects/Rimor/src/security/polymorphic/library-method-handler.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintPropagationRule = 'any' | 'all' | 'none';
```

### TaintAnalysisConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisConfig {
  /** 推論エンジンの設定 */
  inference: {
    /** 探索ベース推論を有効化 */
    enableSearchBased: boolean;
    /** ローカル最適化を有効化 */
    enableLocalOptimization: boolean;
    /** インクリメンタル解析を有効化 */
    enableIncremental: boolean;
    /** 最大探索深度 */
    maxSearchDepth: number;
    /** 信頼度閾値 */
    confidenceThreshold: number;
  };
  /** ライブラリサポート設定 */
  library: {
    /** 組み込みライブラリの定義を読み込む */
    loadBuiltins: boolean;
    /** カスタムライブラリ定義のパス */
    customLibraryPaths: string[];
    /** 未知のメソッドの扱い */
    unknownMethodBehavior: 'conservative' | 'optimistic';
  };
  /** Checker Framework互換性 */
  compatibility: {
    /** .jaifファイルの出力を有効化 */
    exportJAIF: boolean;
    /** スタブファイルの生成を有効化 */
    generateStubs: boolean;
    /** 段階的移行モード */
    gradualMigration: boolean;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/taint-analysis-system.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintAnalysisConfig {
  /** 推論エンジンの設定 */
  inference: {
    /** 探索ベース推論を有効化 */
    enableSearchBased: boolean;
    /** ローカル最適化を有効化 */
    enableLocalOptimization: boolean;
    /** インクリメンタル解析を有効化 */
    enableIncremental: boolean;
    /** 最大探索深度 */
    maxSearchDepth: number;
    /** 信頼度閾値 */
    confidenceThreshold: number;
  };
  /** ライブラリサポート設定 */
  library: {
    /** 組み込みライブラリの定義を読み込む */
    loadBuiltins: boolean;
    /** カスタムライブラリ定義のパス */
    customLibraryPaths: string[];
    /** 未知のメソッドの扱い */
    unknownMethodBehavior: 'conservative' | 'optimistic';
  };
  /** Checker Framework互換性 */
  compatibility: {
    /** .jaifファイルの出力を有効化 */
    exportJAIF: boolean;
    /** スタブファイルの生成を有効化 */
    generateStubs: boolean;
    /** 段階的移行モード */
    gradualMigration: boolean;
  };
}
```

### IncrementalAnalysisResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalAnalysisResult {
  analyzedFiles: string[];
  skippedFiles: string[];
  totalTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/taint-analysis-system.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalAnalysisResult {
  analyzedFiles: string[];
  skippedFiles: string[];
  totalTime: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalAnalysisResult {
  affectedTests: string[];
  changesProcessed: number;
  qualityImprovement: number;
  newIssuesFound: SecurityIssue[];
  resolvedIssues: SecurityIssue[];
  securityImpact: 'high' | 'medium' | 'low';
}
```

### PropagationRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PropagationRule = 'any' | 'all';
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type PropagationRule = 'any' | 'all';
```

### TypeQualifierHierarchy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeQualifierHierarchy {
  '@Tainted': {
    subtypes: ['@Untainted'];
    supertypes: [];
  };
  '@Untainted': {
    subtypes: [];
    supertypes: ['@Tainted'];
  };
  '@PolyTaint': {
    subtypes: ['@Tainted', '@Untainted'];
    supertypes: ['@Tainted', '@Untainted'];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeQualifierHierarchy {
  '@Tainted': {
    subtypes: ['@Untainted'];
    supertypes: [];
  };
  '@Untainted': {
    subtypes: [];
    supertypes: ['@Tainted'];
  };
  '@PolyTaint': {
    subtypes: ['@Tainted', '@Untainted'];
    supertypes: ['@Tainted', '@Untainted'];
  };
}
```

### TaintedType (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintedType<T> {
  readonly __brand: '@Tainted';
  readonly __value: T;
  readonly __source: string;
  readonly __confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintedType<T> {
  readonly __brand: '@Tainted';
  readonly __value: T;
  readonly __source: string;
  readonly __confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintedType<T, Level extends TaintLevel = TaintLevel> = T & {
  readonly __taint: Level;
  readonly __metadata: TaintMetadata;
};
```

### UntaintedType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UntaintedType<T> {
  readonly __brand: '@Untainted';
  readonly __value: T;
  readonly __sanitizedBy?: string;
  readonly __validatedAt?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface UntaintedType<T> {
  readonly __brand: '@Untainted';
  readonly __value: T;
  readonly __sanitizedBy?: string;
  readonly __validatedAt?: number;
}
```

### PolyTaintType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintType<T> {
  readonly __brand: '@PolyTaint';
  readonly __value: T;
  readonly __parameterIndices: number[];
  readonly __propagationRule: PropagationRule;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PolyTaintType<T> {
  readonly __brand: '@PolyTaint';
  readonly __value: T;
  readonly __parameterIndices: number[];
  readonly __propagationRule: PropagationRule;
}
```

### QualifiedType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualifiedType<T> = TaintedType<T> | UntaintedType<T> | PolyTaintType<T>;
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type QualifiedType<T> = TaintedType<T> | UntaintedType<T> | PolyTaintType<T>;
```

### TypeInferenceHint (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceHint {
  variable: string;
  possibleTypes: TaintQualifier[];
  confidence: number;
  evidence: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceHint {
  variable: string;
  possibleTypes: TaintQualifier[];
  confidence: number;
  evidence: string[];
}
```

### TypeConstraint (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeConstraint {
  type: 'subtype' | 'equality' | 'flow';
  lhs: string | TaintQualifier;
  rhs: string | TaintQualifier;
  location: {
    file: string;
    line: number;
    column: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeConstraint {
  type: 'subtype' | 'equality' | 'flow';
  lhs: string | TaintQualifier;
  rhs: string | TaintQualifier;
  location: {
    file: string;
    line: number;
    column: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeConstraint {
  variable: string;
  type?: string;
  constraint: 'equals' | 'subtype' | 'supertype' | string;
  reason?: string;
}
```

### TypeCheckResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckResult {
  success: boolean;
  errors: TypeQualifierError[];
  warnings: Array<{
    message: string;
    location?: { file: string; line: number; column: number };
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/checker-framework-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeCheckResult {
  success: boolean;
  errors: TypeQualifierError[];
  warnings: Array<{
    message: string;
    location?: { file: string; line: number; column: number };
  }>;
}
```

### TestMethodExtended (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethodExtended extends TestMethod {
  filePath?: string;
  content?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethodExtended extends TestMethod {
  filePath?: string;
  content?: string;
}
```

### FlowGraph (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowGraph {
  nodes: Map<string, FlowNode>;
  edges: FlowEdge[];
  entryNode?: string;
  exitNodes: string[];
  violations?: SecurityViolation[];
  taintSources?: TaintSourceInfo[];
  sanitizers?: SanitizerInfo[];
  securitySinks?: SecuritySinkInfo[];
  paths?: FlowPath[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowGraph {
  nodes: Map<string, FlowNode>;
  edges: FlowEdge[];
  entryNode?: string;
  exitNodes: string[];
  violations?: SecurityViolation[];
  taintSources?: TaintSourceInfo[];
  sanitizers?: SanitizerInfo[];
  securitySinks?: SecuritySinkInfo[];
  paths?: FlowPath[];
}
```

### FlowNode (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'branch' | 'merge' | 'call' | 'return';
  statement?: TestStatement;
  location?: Position;
  predecessors: string[];
  successors: string[];
  taintState?: TaintState;
  typeState?: TypeState;
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: TaintMetadata;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'branch' | 'merge' | 'call' | 'return';
  statement?: TestStatement;
  location?: Position;
  predecessors: string[];
  successors: string[];
  taintState?: TaintState;
  typeState?: TypeState;
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: TaintMetadata;
}
```

### FlowEdge (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowEdge {
  from: string;
  to: string;
  condition?: string;
  type?: 'normal' | 'true' | 'false' | 'exception';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FlowEdge {
  from: string;
  to: string;
  condition?: string;
  type?: 'normal' | 'true' | 'false' | 'exception';
}
```

### TestStatement (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestStatement {
  id: string;
  type: 'assertion' | 'setup' | 'action' | 'teardown' | 'declaration' | 'expression' | 'entry' | 'assignment' | 'methodCall' | 'sanitizer';
  content: string;
  location: Position;
  variables?: string[];
  calls?: MethodCall[];
  actual?: string;
  lhs?: string;
  rhs?: string;
  method?: string;
  returnValue?: string;
  arguments?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestStatement {
  id: string;
  type: 'assertion' | 'setup' | 'action' | 'teardown' | 'declaration' | 'expression' | 'entry' | 'assignment' | 'methodCall' | 'sanitizer';
  content: string;
  location: Position;
  variables?: string[];
  calls?: MethodCall[];
  actual?: string;
  lhs?: string;
  rhs?: string;
  method?: string;
  returnValue?: string;
  arguments?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestStatement {
  /** 文の種別 */
  type: 'assignment' | 'methodCall' | 'assertion' | 'sanitizer' | 'userInput' | 'entry' | 'setup' | 'action' | 'teardown' | 'declaration' | 'expression';
  /** 文の内容 */
  content: string;
  /** 位置情報 */
  location: {
    line: number;
    column: number;
  };
  /** 左辺値（代入文の場合） */
  lhs?: string;
  /** 右辺値（代入文の場合） */
  rhs?: string;
  /** メソッド名（メソッド呼び出しの場合） */
  method?: string;
  /** 引数（メソッド呼び出しの場合） */
  arguments?: unknown[];
  /** 戻り値（メソッド呼び出しの場合） */
  returnValue?: string;
  /** アサーションの実際値 */
  actual?: string;
  /** アサーションの期待値 */
  expected?: string;
  /** 否定アサーションかどうか */
  isNegativeAssertion?: boolean;
}
```

### TaintState (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintState {
  variables: Map<string, TaintLevel>;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintState {
  variables: Map<string, TaintLevel>;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
}
```

### TypeState (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeState {
  variables: Map<string, string>;
  constraints: TypeConstraint[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeState {
  variables: Map<string, string>;
  constraints: TypeConstraint[];
}
```

### TypeError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeError extends TypeViolation {
  severity: 'error' | 'warning';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeError extends TypeViolation {
  severity: 'error' | 'warning';
}
```

### SecurityTestMetrics (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTestMetrics {
  taintCoverage: number;
  sanitizerCoverage: number;
  sinkCoverage: number;
  securityAssertions: number;
  vulnerableFlows: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTestMetrics {
  taintCoverage: number;
  sanitizerCoverage: number;
  sinkCoverage: number;
  securityAssertions: number;
  vulnerableFlows: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTestMetrics {
  /** セキュリティテストカバレッジ */
  securityCoverage: {
    /** 認証テストカバレッジ */
    authentication: number;
    /** 入力検証テストカバレッジ */
    inputValidation: number;
    /** APIセキュリティテストカバレッジ */
    apiSecurity: number;
    /** 全体カバレッジ */
    overall: number;
  };
  /** 汚染フロー検出率 */
  taintFlowDetection: number;
  /** サニタイザー適用率 */
  sanitizerCoverage: number;
  /** セキュリティ不変条件の遵守率 */
  invariantCompliance: number;
}
```

### SecurityImprovement (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityImprovement {
  id?: string;
  type: 'add-sanitizer' | 'add-validation' | 'add-assertion' | 'fix-flow';
  title?: string;
  location: Position;
  description: string;
  suggestedCode?: string;
  impact: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high';
  estimatedImpact?: {
    securityImprovement: number;
    implementationMinutes: number;
  };
  automatable?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityImprovement {
  id?: string;
  type: 'add-sanitizer' | 'add-validation' | 'add-assertion' | 'fix-flow';
  title?: string;
  location: Position;
  description: string;
  suggestedCode?: string;
  impact: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high';
  estimatedImpact?: {
    securityImprovement: number;
    implementationMinutes: number;
  };
  automatable?: boolean;
}
```

### TypeInferenceResult (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeInferenceResult {
  /** 推論された型注釈 */
  annotations: SecurityTypeAnnotation[];
  /** 推論の統計情報 */
  statistics: {
    /** 総変数数 */
    totalVariables: number;
    /** 推論成功数 */
    inferred: number;
    /** 推論失敗数 */
    failed: number;
    /** 平均信頼度 */
    averageConfidence: number;
  };
  /** 推論にかかった時間（ms） */
  inferenceTime: number;
}
```

### SecurityMethodChange (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityMethodChange {
  method: TestMethod;
  type?: 'added' | 'modified' | 'deleted';
  changeType: 'added' | 'modified' | 'deleted';
  affectedFlows: FlowPath[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityMethodChange {
  method: TestMethod;
  type?: 'added' | 'modified' | 'deleted';
  changeType: 'added' | 'modified' | 'deleted';
  affectedFlows: FlowPath[];
}
```

### IncrementalUpdate (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalUpdate {
  changes: SecurityMethodChange[];
  affectedMethods: TestMethod[];
  updatedMethods?: MethodAnalysisResult[];
  reanalysisRequired: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalUpdate {
  changes: SecurityMethodChange[];
  affectedMethods: TestMethod[];
  updatedMethods?: MethodAnalysisResult[];
  reanalysisRequired: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalUpdate {
  /** 更新されたメソッド */
  updatedMethods: string[];
  /** 無効化されたキャッシュ */
  invalidatedCache: string[];
  /** 新しい問題 */
  newIssues: SecurityIssue[];
  /** 解決された問題 */
  resolvedIssues: string[];
}
```

### InputTaintPath (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InputTaintPath {
  source: string;
  sink: string;
  path: string[];
  isCritical: boolean;
  sanitizers: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface InputTaintPath {
  source: string;
  sink: string;
  path: string[];
  isCritical: boolean;
  sanitizers: string[];
}
```

### IncrementalChange (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalChange {
  methodName?: string;
  filePath?: string;
  content?: string;
  type?: 'added' | 'modified' | 'deleted' | 'security';
  method?: {
    name: string;
    content?: string;
    [key: string]: unknown;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalChange {
  methodName?: string;
  filePath?: string;
  content?: string;
  type?: 'added' | 'modified' | 'deleted' | 'security';
  method?: {
    name: string;
    content?: string;
    [key: string]: unknown;
  };
}
```

### TestMethodAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethodAnalysisResult {
  taintFlow: Omit<FlowGraph, 'sanitizers' | 'taintSources' | 'securitySinks'> & {
    sources?: string[];
    sanitizers?: string[];
    sinks?: string[];
  };
  issues: SecurityIssue[];
  securityScore: number;
  securityMetrics?: {
    inputValidationCoverage: number;
    sanitizationCoverage: number;
  };
  // テストで使用されているプロパティを追加
  affectedTests?: any[];
  qualityImprovement?: number;
  newIssuesFound?: any[];
  resolvedIssues?: any[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestMethodAnalysisResult {
  taintFlow: Omit<FlowGraph, 'sanitizers' | 'taintSources' | 'securitySinks'> & {
    sources?: string[];
    sanitizers?: string[];
    sinks?: string[];
  };
  issues: SecurityIssue[];
  securityScore: number;
  securityMetrics?: {
    inputValidationCoverage: number;
    sanitizationCoverage: number;
  };
  // テストで使用されているプロパティを追加
  affectedTests?: any[];
  qualityImprovement?: number;
  newIssuesFound?: any[];
  resolvedIssues?: any[];
}
```

### SecurityIssue (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityIssue {
  id: string;
  type: 'taint' | 'injection' | 'validation' | 'authentication' | 'authorization' | 'unsafe-taint-flow' | 'missing-sanitizer' | 'sanitization' | 'boundary';
  severity: SeverityLevel;
  message: string;
  location: Position;
  evidence?: string[];
  recommendation?: string;
  cwe?: string;
  owasp?: string;
  suggestedFix?: string;
  codeSnippet?: string;
  taintInfo?: { // テストで使用されているため追加
    source: TaintSource;
    sink?: string;
    flow?: string[];
    confidence?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/flow-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityIssue {
  id: string;
  type: 'taint' | 'injection' | 'validation' | 'authentication' | 'authorization' | 'unsafe-taint-flow' | 'missing-sanitizer' | 'sanitization' | 'boundary';
  severity: SeverityLevel;
  message: string;
  location: Position;
  evidence?: string[];
  recommendation?: string;
  cwe?: string;
  owasp?: string;
  suggestedFix?: string;
  codeSnippet?: string;
  taintInfo?: { // テストで使用されているため追加
    source: TaintSource;
    sink?: string;
    flow?: string[];
    confidence?: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityIssue {
  id: string;
  type: 'taint' | 'injection' | 'validation' | 'authentication' | 'authorization' | 'unsafe-taint-flow' | 'missing-sanitizer' | 'SQL_INJECTION' | 'CODE_EXECUTION' | 'missing-auth-test' | 'insufficient-validation' | 'sanitization' | 'boundary' | 'sql-injection' | 'command-injection' | 'code-injection' | 'vulnerable-dependency' | 'outdated-version';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical' | 'error' | 'warning';
  message: string;
  location: {
    file: string;
    line: number;
    column?: number;
    method?: string; // テストで使用されているため追加
  };
  evidence?: string[];
  recommendation?: string;
  fixSuggestion?: string;
  cwe?: string;
  owasp?: string;
  taintInfo?: { // テストで使用されているため追加
    source: TaintSource;
    sink?: string;
    flow?: string[];
    confidence?: number;
    location?: {
      file: string;
      line: number;
      column: number;
    };
    tracePath?: string[];
    securityRules?: string[];
  };
}
```

### Parameter (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Parameter {
  /** パラメータ名 */
  name: string;
  /** 型 */
  type?: string;
  /** データソース */
  source?: 'user-input' | 'database' | 'api' | 'constant';
  /** アノテーション（セキュリティプラグイン用） */
  annotations?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Parameter {
  /** パラメータ名 */
  name: string;
  /** 型 */
  type?: string;
  /** データソース */
  source?: 'user-input' | 'database' | 'api' | 'constant';
  /** アノテーション（セキュリティプラグイン用） */
  annotations?: string[];
}
```

### IncrementalResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalResult {
  /** 解析されたメソッド数 */
  analyzed: number;
  /** キャッシュから取得されたメソッド数 */
  cached: number;
  /** 総実行時間 */
  totalTime: number;
  /** 結果 */
  results: MethodAnalysisResult[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IncrementalResult {
  /** 解析されたメソッド数 */
  analyzed: number;
  /** キャッシュから取得されたメソッド数 */
  cached: number;
  /** 総実行時間 */
  totalTime: number;
  /** 結果 */
  results: MethodAnalysisResult[];
}
```

### TypeBasedSecurityConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeBasedSecurityConfig {
  /** 解析の厳密さ */
  strictness: 'strict' | 'moderate' | 'lenient';
  /** 最大解析時間（ms） */  
  maxAnalysisTime: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュの有効化 */
  enableCache: boolean;
  /** カスタムサニタイザー */
  customSanitizers: string[];
  /** カスタムシンク */
  customSinks: string[];
  /** 除外パターン */
  excludePatterns: string[];
  /** デバッグモード */
  debug?: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeBasedSecurityConfig {
  /** 解析の厳密さ */
  strictness: 'strict' | 'moderate' | 'lenient';
  /** 最大解析時間（ms） */  
  maxAnalysisTime: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュの有効化 */
  enableCache: boolean;
  /** カスタムサニタイザー */
  customSanitizers: string[];
  /** カスタムシンク */
  customSinks: string[];
  /** 除外パターン */
  excludePatterns: string[];
  /** デバッグモード */
  debug?: boolean;
}
```

### TypeBasedSecurityAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeBasedSecurityAnalysis {
  /** 汚染レベルの推論 */
  inferTaintLevels(testFile: TestCase): Promise<Map<string, TaintLevel>>;
  
  /** セキュリティ型の推論 */
  inferSecurityTypes(testFile: TestCase): Promise<TypeInferenceResult>;
  
  /** セキュリティ不変条件の検証 */
  verifyInvariants(testFile: TestCase): Promise<SecurityViolation[]>;
  
  /** コンパイル時解析の実行 */
  analyzeAtCompileTime(testFiles: TestCase[]): Promise<CompileTimeResult>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TypeBasedSecurityAnalysis {
  /** 汚染レベルの推論 */
  inferTaintLevels(testFile: TestCase): Promise<Map<string, TaintLevel>>;
  
  /** セキュリティ型の推論 */
  inferSecurityTypes(testFile: TestCase): Promise<TypeInferenceResult>;
  
  /** セキュリティ不変条件の検証 */
  verifyInvariants(testFile: TestCase): Promise<SecurityViolation[]>;
  
  /** コンパイル時解析の実行 */
  analyzeAtCompileTime(testFiles: TestCase[]): Promise<CompileTimeResult>;
}
```

### ModularAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ModularAnalysis {
  /** テストメソッド単位の解析 */
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;
  
  /** インクリメンタル解析 */
  incrementalAnalyze(changes: SecurityMethodChange[]): Promise<IncrementalResult>;
  
  /** 並列解析 */
  analyzeInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]>;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/index.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ModularAnalysis {
  /** テストメソッド単位の解析 */
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;
  
  /** インクリメンタル解析 */
  incrementalAnalyze(changes: SecurityMethodChange[]): Promise<IncrementalResult>;
  
  /** 並列解析 */
  analyzeInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]>;
}
```

### SecurityTypeString (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: internal
```typescript
type SecurityTypeString = 'authentication' | 'authorization' | 'input-validation' | 'api-security';
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: internal
```typescript
type SecurityTypeString = 'authentication' | 'authorization' | 'input-validation' | 'api-security';
```

### SecurityValidation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityValidation {
  /** 検証の種別 */
  type: string;
  /** 検証が実行された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 検証の時刻 */
  timestamp: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityValidation {
  /** 検証の種別 */
  type: string;
  /** 検証が実行された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 検証の時刻 */
  timestamp: Date;
}
```

### SecurityRequirement (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRequirement {
  /** 要件ID */
  id: string;
  /** 要件の種別 */
  type: 'auth-test' | 'input-validation' | 'api-security' | 'session-management' | SecurityTypeString;
  /** 必須テストケース */
  required: string[];
  /** 最小汚染レベル */
  minTaintLevel: TaintLevel;
  /** 適用される汚染源 */
  applicableSources: TaintSource[];
  /** チェック項目（テスト用） */
  checks?: string[];
  /** 重要度（テスト用） */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityRequirement {
  /** 要件ID */
  id: string;
  /** 要件の種別 */
  type: 'auth-test' | 'input-validation' | 'api-security' | 'session-management' | SecurityTypeString;
  /** 必須テストケース */
  required: string[];
  /** 最小汚染レベル */
  minTaintLevel: TaintLevel;
  /** 適用される汚染源 */
  applicableSources: TaintSource[];
  /** チェック項目（テスト用） */
  checks?: string[];
  /** 重要度（テスト用） */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

### SecureTest (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecureTest<T extends TestCase> = T & {
  readonly __validated: SecurityValidation[];
  readonly __taintLevel: TaintLevel;
  readonly __securityType: SecurityType;
};
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecureTest<T extends TestCase> = T & {
  readonly __validated: SecurityValidation[];
  readonly __taintLevel: TaintLevel;
  readonly __securityType: SecurityType;
};
```

### UnsafeTest (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type UnsafeTest<T extends TestCase> = T & {
  readonly __missing: SecurityRequirement[];
  readonly __vulnerabilities: PotentialVulnerability[];
  readonly __riskLevel: 'low' | 'medium' | 'high' | 'critical';
};
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type UnsafeTest<T extends TestCase> = T & {
  readonly __missing: SecurityRequirement[];
  readonly __vulnerabilities: PotentialVulnerability[];
  readonly __riskLevel: 'low' | 'medium' | 'high' | 'critical';
};
```

### ValidatedAuthTest (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatedAuthTest = TestCase & {
  readonly __brand: 'auth-validated';
  readonly __covers: AuthTestCoverage[];
  readonly __tokenValidation: boolean;
  readonly __sessionManagement: boolean;
};
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatedAuthTest = TestCase & {
  readonly __brand: 'auth-validated';
  readonly __covers: AuthTestCoverage[];
  readonly __tokenValidation: boolean;
  readonly __sessionManagement: boolean;
};
```

### ValidatedInputTest (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatedInputTest = TestCase & {
  readonly __brand: 'input-validated';
  readonly __sanitizers: SanitizerType[];
  readonly __boundaries: BoundaryCondition[];
  readonly __typeValidation: boolean;
};
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type ValidatedInputTest = TestCase & {
  readonly __brand: 'input-validated';
  readonly __sanitizers: SanitizerType[];
  readonly __boundaries: BoundaryCondition[];
  readonly __typeValidation: boolean;
};
```

### SecurityAnalysisReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAnalysisReport {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  issues: SecurityIssue[];
  metrics?: SecurityTestMetrics;
  recommendations?: string[];
  timestamp: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityAnalysisReport {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  issues: SecurityIssue[];
  metrics?: SecurityTestMetrics;
  recommendations?: string[];
  timestamp: Date;
}
```

### ITypeBasedSecurityPlugin (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITypeBasedSecurityPlugin {
  id: string;
  name: string;
  version: string;
  
  // Main analysis methods
  analyzeTestMethod(method: TestMethod): Promise<TestMethodAnalysisResult>;
  analyzeIncrementally?(update: IncrementalChange): Promise<TestMethodAnalysisResult>;
  generateReport?(): SecurityAnalysisReport;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ITypeBasedSecurityPlugin {
  id: string;
  name: string;
  version: string;
  
  // Main analysis methods
  analyzeTestMethod(method: TestMethod): Promise<TestMethodAnalysisResult>;
  analyzeIncrementally?(update: IncrementalChange): Promise<TestMethodAnalysisResult>;
  generateReport?(): SecurityAnalysisReport;
}
```

### AuthTestCoverage (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type AuthTestCoverage = 
  | 'success'
  | 'failure'
  | 'token-expiry'
  | 'brute-force'
  | 'session-hijack'
  | 'csrf'
  | 'privilege-escalation';
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type AuthTestCoverage = 
  | 'success'
  | 'failure'
  | 'token-expiry'
  | 'brute-force'
  | 'session-hijack'
  | 'csrf'
  | 'privilege-escalation';
```

### AuthTestMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTestMetrics {
  loginTests: number;
  logoutTests: number;
  tokenTests: number;
  sessionTests: number;
  permissionTests: number;
  total: number;
  percentage: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AuthTestMetrics {
  loginTests: number;
  logoutTests: number;
  tokenTests: number;
  sessionTests: number;
  permissionTests: number;
  total: number;
  percentage: number;
}
```

### BoundaryValue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type BoundaryValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: type
- エクスポート: exported
```typescript
export type BoundaryValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
```

### BoundaryCondition (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BoundaryCondition {
  /** 境界の種別 */
  type: 'min' | 'max' | 'null' | 'empty' | 'invalid-format' | 'overflow';
  /** 境界値 */
  value: BoundaryValue;
  /** テスト済みかどうか */
  tested: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface BoundaryCondition {
  /** 境界の種別 */
  type: 'min' | 'max' | 'null' | 'empty' | 'invalid-format' | 'overflow';
  /** 境界値 */
  value: BoundaryValue;
  /** テスト済みかどうか */
  tested: boolean;
}
```

### PotentialVulnerability (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PotentialVulnerability {
  /** 脆弱性の種別 */
  type: 'sql-injection' | 'xss' | 'csrf' | 'auth-bypass' | 'data-leak';
  /** 脆弱性の説明 */
  description: string;
  /** 影響範囲 */
  impact: 'low' | 'medium' | 'high' | 'critical';
  /** 検出された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 修正提案 */
  fixSuggestion: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PotentialVulnerability {
  /** 脆弱性の種別 */
  type: 'sql-injection' | 'xss' | 'csrf' | 'auth-bypass' | 'data-leak';
  /** 脆弱性の説明 */
  description: string;
  /** 影響範囲 */
  impact: 'low' | 'medium' | 'high' | 'critical';
  /** 検出された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 修正提案 */
  fixSuggestion: string;
}
```

### Variable (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Variable {
  /** 変数名 */
  name: string;
  /** 型情報 */
  type?: string;
  /** スコープ */
  scope: 'local' | 'parameter' | 'field' | 'global';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Variable {
  /** 変数名 */
  name: string;
  /** 型情報 */
  type?: string;
  /** スコープ */
  scope: 'local' | 'parameter' | 'field' | 'global';
}
```

### SecurityTypeAnnotation (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTypeAnnotation {
  /** 変数や式 */
  target?: string;
  /** 変数名（レガシー互換性） */
  variable?: string;
  /** セキュリティ型 */
  securityType: SecurityType;
  /** セキュリティレベル */
  securityLevel?: TaintLevel;
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** 推論の信頼度 */
  confidence: number;
  /** 推論の根拠 */
  evidence: string[];
  /** フローポリシー */
  flowPolicy?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface SecurityTypeAnnotation {
  /** 変数や式 */
  target?: string;
  /** 変数名（レガシー互換性） */
  variable?: string;
  /** セキュリティ型 */
  securityType: SecurityType;
  /** セキュリティレベル */
  securityLevel?: TaintLevel;
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** 推論の信頼度 */
  confidence: number;
  /** 推論の根拠 */
  evidence: string[];
  /** フローポリシー */
  flowPolicy?: string;
}
```

### CompileTimeResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompileTimeResult {
  /** 検出された問題 */
  issues: SecurityIssue[];
  /** 実行時間 */
  executionTime: number;
  /** ランタイムへの影響（常に0） */
  runtimeImpact: 0;
  /** 解析統計 */
  statistics: {
    /** 解析されたファイル数 */
    filesAnalyzed: number;
    /** 解析されたメソッド数 */
    methodsAnalyzed: number;
    /** 型推論の成功率 */
    inferenceSuccessRate: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/security.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompileTimeResult {
  /** 検出された問題 */
  issues: SecurityIssue[];
  /** 実行時間 */
  executionTime: number;
  /** ランタイムへの影響（常に0） */
  runtimeImpact: 0;
  /** 解析統計 */
  statistics: {
    /** 解析されたファイル数 */
    filesAnalyzed: number;
    /** 解析されたメソッド数 */
    methodsAnalyzed: number;
    /** 型推論の成功率 */
    inferenceSuccessRate: number;
  };
}
```

### TaintVulnerabilityAssessment (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintVulnerabilityAssessment {
  /** 脆弱性ID */
  vulnerabilityId: string;
  /** Taintフロー */
  taintFlow: TaintFlow;
  /** リスクスコア（0-100） */
  riskScore: number;
  /** 悪用可能性（0-1） */
  exploitability: number;
  /** 影響度（0-1） */
  impact: number;
  /** 推奨される修正方法 */
  remediation: string[];
  /** 参考リンク */
  references?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintVulnerabilityAssessment {
  /** 脆弱性ID */
  vulnerabilityId: string;
  /** Taintフロー */
  taintFlow: TaintFlow;
  /** リスクスコア（0-100） */
  riskScore: number;
  /** 悪用可能性（0-1） */
  exploitability: number;
  /** 影響度（0-1） */
  impact: number;
  /** 推奨される修正方法 */
  remediation: string[];
  /** 参考リンク */
  references?: string[];
}
```

### TaintChainRisk (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintChainRisk {
  /** チェーンID */
  chainId: string;
  /** チェーンを構成するフローID */
  flowIds: string[];
  /** 連鎖的リスクスコア */
  chainRiskScore: number;
  /** チェーンの説明 */
  description: string;
  /** 攻撃シナリオ */
  attackScenario: string;
  /** 緩和策 */
  mitigation: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint-analysis-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintChainRisk {
  /** チェーンID */
  chainId: string;
  /** チェーンを構成するフローID */
  flowIds: string[];
  /** 連鎖的リスクスコア */
  chainRiskScore: number;
  /** チェーンの説明 */
  description: string;
  /** 攻撃シナリオ */
  attackScenario: string;
  /** 緩和策 */
  mitigation: string[];
}
```

### TaintTraceStep (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintTraceStep {
  /** ステップの種別 */
  type: 'propagate' | 'sanitize' | 'merge' | 'branch';
  /** 操作の説明 */
  description: string;
  /** 操作前の汚染レベル */
  inputTaint: TaintLevel;
  /** 操作後の汚染レベル */
  outputTaint: TaintLevel;
  /** 操作が行われた位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TaintTraceStep {
  /** ステップの種別 */
  type: 'propagate' | 'sanitize' | 'merge' | 'branch';
  /** 操作の説明 */
  description: string;
  /** 操作前の汚染レベル */
  inputTaint: TaintLevel;
  /** 操作後の汚染レベル */
  outputTaint: TaintLevel;
  /** 操作が行われた位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
}
```

### SafeValue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SafeValue<T> = T & {
  readonly __safe: true;
  readonly __validated: true;
};
```

#### /Users/sasakama/Projects/Rimor/src/security/types/taint.ts
- 種別: type
- エクスポート: exported
```typescript
export type SafeValue<T> = T & {
  readonly __safe: true;
  readonly __validated: true;
};
```

### TestCaseAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCaseAnalysisResult {
  testCase?: {
    file?: string;
    [key: string]: unknown;
  };
  groundTruth?: GroundTruthData;
  detectedIssues?: SecurityIssue[];
  analysis?: {
    missedIssues?: Array<SecurityIssue | GroundTruthIssue>;
    falseAlarms?: Array<SecurityIssue | GroundTruthIssue>;
    correctDetections?: Array<SecurityIssue | GroundTruthIssue>;
    [key: string]: unknown;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCaseAnalysisResult {
  testCase?: {
    file?: string;
    [key: string]: unknown;
  };
  groundTruth?: GroundTruthData;
  detectedIssues?: SecurityIssue[];
  analysis?: {
    missedIssues?: Array<SecurityIssue | GroundTruthIssue>;
    falseAlarms?: Array<SecurityIssue | GroundTruthIssue>;
    correctDetections?: Array<SecurityIssue | GroundTruthIssue>;
    [key: string]: unknown;
  };
}
```

### GroundTruthData (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GroundTruthData {
  /** テストファイル識別子 */
  testFileId: string;
  /** メソッド名 */
  methodName: string;
  /** 実際のセキュリティ問題 */
  actualSecurityIssues: GroundTruthIssue[];
  /** 実際の汚染レベル */
  actualTaintLevels: Map<string, TaintLevel>;
  /** 必要なセキュリティテスト */
  requiredSecurityTests: string[];
  /** 手動検証の結果 */
  manualVerificationResult: 'safe' | 'unsafe' | 'needs-attention';
  /** 検証者情報 */
  verifiedBy: string;
  /** 検証日時 */
  verifiedAt: Date;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GroundTruthData {
  /** テストファイル識別子 */
  testFileId: string;
  /** メソッド名 */
  methodName: string;
  /** 実際のセキュリティ問題 */
  actualSecurityIssues: GroundTruthIssue[];
  /** 実際の汚染レベル */
  actualTaintLevels: Map<string, TaintLevel>;
  /** 必要なセキュリティテスト */
  requiredSecurityTests: string[];
  /** 手動検証の結果 */
  manualVerificationResult: 'safe' | 'unsafe' | 'needs-attention';
  /** 検証者情報 */
  verifiedBy: string;
  /** 検証日時 */
  verifiedAt: Date;
}
```

### GroundTruthIssue (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GroundTruthIssue {
  /** 問題の種類 */
  type: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 説明 */
  description: string;
  /** 確信度 */
  confidence: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GroundTruthIssue {
  /** 問題の種類 */
  type: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 説明 */
  description: string;
  /** 確信度 */
  confidence: number;
}
```

### AccuracyMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyMetrics {
  /** 総テストケース数 */
  totalTestCases: number;
  /** 解析済みテストケース数 */
  analyzedTestCases: number;
  
  /** 自動推論関連 */
  inference: {
    /** 自動推論率（目標85%以上） */
    automaticInferenceRate: number;
    /** 推論精度（目標90%以上） */
    inferenceAccuracy: number;
    /** 推論失敗数 */
    inferenceFailed: number;
  };
  
  /** 検出精度関連 */
  detection: {
    /** 真陽性（正しく検出） */
    truePositives: number;
    /** 偽陽性（誤検知）目標15%以下 */
    falsePositives: number;
    /** 真陰性（正しく非検出） */
    trueNegatives: number;
    /** 偽陰性（見逃し）目標5%以下 */
    falseNegatives: number;
    /** 精度（Precision） */
    precision: number | null;
    /** 再現率（Recall） */
    recall: number | null;
    /** F1スコア */
    f1Score: number | null;
    /** 誤検知率 */
    falsePositiveRate: number;
    /** 偽陰性率 */
    falseNegativeRate: number;
  };
  
  /** 型システム関連 */
  typeSystem: {
    /** 型推論成功率 */
    typeInferenceSuccessRate: number;
    /** 汚染追跡精度 */
    taintTrackingAccuracy: number;
    /** セキュリティ不変条件検証率 */
    invariantVerificationRate: number;
  };
  
  /** パフォーマンス関連 */
  performance: {
    /** 平均解析時間（ms/file）目標5ms以下 */
    averageAnalysisTime: number;
    /** 目標達成率 */
    targetAchievementRate: number;
    /** スループット（files/sec） */
    throughput: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyMetrics {
  /** 総テストケース数 */
  totalTestCases: number;
  /** 解析済みテストケース数 */
  analyzedTestCases: number;
  
  /** 自動推論関連 */
  inference: {
    /** 自動推論率（目標85%以上） */
    automaticInferenceRate: number;
    /** 推論精度（目標90%以上） */
    inferenceAccuracy: number;
    /** 推論失敗数 */
    inferenceFailed: number;
  };
  
  /** 検出精度関連 */
  detection: {
    /** 真陽性（正しく検出） */
    truePositives: number;
    /** 偽陽性（誤検知）目標15%以下 */
    falsePositives: number;
    /** 真陰性（正しく非検出） */
    trueNegatives: number;
    /** 偽陰性（見逃し）目標5%以下 */
    falseNegatives: number;
    /** 精度（Precision） */
    precision: number | null;
    /** 再現率（Recall） */
    recall: number | null;
    /** F1スコア */
    f1Score: number | null;
    /** 誤検知率 */
    falsePositiveRate: number;
    /** 偽陰性率 */
    falseNegativeRate: number;
  };
  
  /** 型システム関連 */
  typeSystem: {
    /** 型推論成功率 */
    typeInferenceSuccessRate: number;
    /** 汚染追跡精度 */
    taintTrackingAccuracy: number;
    /** セキュリティ不変条件検証率 */
    invariantVerificationRate: number;
  };
  
  /** パフォーマンス関連 */
  performance: {
    /** 平均解析時間（ms/file）目標5ms以下 */
    averageAnalysisTime: number;
    /** 目標達成率 */
    targetAchievementRate: number;
    /** スループット（files/sec） */
    throughput: number;
  };
}
```

### DetailedAccuracyResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedAccuracyResult {
  /** 全体メトリクス */
  overallMetrics: AccuracyMetrics;
  /** テストケース別詳細 */
  perTestCaseResults: TestCaseAccuracyResult[];
  /** フレームワーク別結果 */
  perFrameworkResults: Map<string, AccuracyMetrics>;
  /** 問題別分析 */
  issueTypeAnalysis: Map<string, IssueTypeAccuracy>;
  /** 時系列精度変化 */
  accuracyTrends: AccuracyTrend[];
  /** 推奨改善策 */
  recommendedImprovements: AccuracyImprovement[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DetailedAccuracyResult {
  /** 全体メトリクス */
  overallMetrics: AccuracyMetrics;
  /** テストケース別詳細 */
  perTestCaseResults: TestCaseAccuracyResult[];
  /** フレームワーク別結果 */
  perFrameworkResults: Map<string, AccuracyMetrics>;
  /** 問題別分析 */
  issueTypeAnalysis: Map<string, IssueTypeAccuracy>;
  /** 時系列精度変化 */
  accuracyTrends: AccuracyTrend[];
  /** 推奨改善策 */
  recommendedImprovements: AccuracyImprovement[];
}
```

### TestCaseAccuracyResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCaseAccuracyResult {
  /** テストケース */
  testCase: TestCase;
  /** 正解データ */
  groundTruth: GroundTruthData;
  /** 実際の検出結果 */
  detectedIssues: SecurityIssue[];
  /** 精度評価 */
  accuracy: {
    correct: boolean;
    precision: number | null;
    recall: number | null;
    inferenceSuccessful: boolean;
  };
  /** 詳細分析 */
  analysis: {
    missedIssues: GroundTruthIssue[];
    falseAlarms: SecurityIssue[];
    correctDetections: SecurityIssue[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestCaseAccuracyResult {
  /** テストケース */
  testCase: TestCase;
  /** 正解データ */
  groundTruth: GroundTruthData;
  /** 実際の検出結果 */
  detectedIssues: SecurityIssue[];
  /** 精度評価 */
  accuracy: {
    correct: boolean;
    precision: number | null;
    recall: number | null;
    inferenceSuccessful: boolean;
  };
  /** 詳細分析 */
  analysis: {
    missedIssues: GroundTruthIssue[];
    falseAlarms: SecurityIssue[];
    correctDetections: SecurityIssue[];
  };
}
```

### AccuracyTrend (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyTrend {
  /** 測定日時 */
  timestamp: Date;
  /** 精度メトリクス */
  metrics: AccuracyMetrics;
  /** 変更内容 */
  changes: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyTrend {
  /** 測定日時 */
  timestamp: Date;
  /** 精度メトリクス */
  metrics: AccuracyMetrics;
  /** 変更内容 */
  changes: string[];
}
```

### AccuracyImprovement (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyImprovement {
  /** 改善項目 */
  area: 'inference' | 'detection' | 'type-system' | 'performance';
  /** 現在の値 */
  currentValue: number;
  /** 目標値 */
  targetValue: number;
  /** 改善策 */
  recommendations: string[];
  /** 推定効果 */
  estimatedImpact: number;
  /** 実装難易度 */
  implementationComplexity: 'low' | 'medium' | 'high';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AccuracyImprovement {
  /** 改善項目 */
  area: 'inference' | 'detection' | 'type-system' | 'performance';
  /** 現在の値 */
  currentValue: number;
  /** 目標値 */
  targetValue: number;
  /** 改善策 */
  recommendations: string[];
  /** 推定効果 */
  estimatedImpact: number;
  /** 実装難易度 */
  implementationComplexity: 'low' | 'medium' | 'high';
}
```

### TestTemplate (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestTemplate {
  /** テンプレート名 */
  name: string;
  /** フレームワーク */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** カテゴリ */
  category: 'authentication' | 'input-validation' | 'authorization' | 'data-protection' | 'api-security';
  /** セキュリティパターン */
  securityPattern: string;
  /** テストコードテンプレート */
  template: string;
  /** 期待される検出パターン */
  expectedFindings: string[];
  /** 複雑度 */
  complexity: 'basic' | 'intermediate' | 'advanced';
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/FrameworkTestGenerator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestTemplate {
  /** テンプレート名 */
  name: string;
  /** フレームワーク */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** カテゴリ */
  category: 'authentication' | 'input-validation' | 'authorization' | 'data-protection' | 'api-security';
  /** セキュリティパターン */
  securityPattern: string;
  /** テストコードテンプレート */
  template: string;
  /** 期待される検出パターン */
  expectedFindings: string[];
  /** 複雑度 */
  complexity: 'basic' | 'intermediate' | 'advanced';
}
```

### GenerationConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GenerationConfig {
  /** 出力ディレクトリ */
  outputDir: string;
  /** 生成するテスト数 */
  testCount: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  /** フレームワーク設定 */
  frameworkConfig: {
    [key: string]: {
      version: string;
      dependencies: string[];
      testFramework: 'jest' | 'mocha' | 'vitest';
    };
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/FrameworkTestGenerator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface GenerationConfig {
  /** 出力ディレクトリ */
  outputDir: string;
  /** 生成するテスト数 */
  testCount: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  /** フレームワーク設定 */
  frameworkConfig: {
    [key: string]: {
      version: string;
      dependencies: string[];
      testFramework: 'jest' | 'mocha' | 'vitest';
    };
  };
}
```

### ScalabilityDataPoint (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ScalabilityDataPoint {
  fileCount: number;
  totalTime: number;
  memoryUsed: number;
  throughput: number;
  executionTime: number;
  timePerFile: number;
  memoryUsage: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ScalabilityDataPoint {
  fileCount: number;
  totalTime: number;
  memoryUsed: number;
  throughput: number;
  executionTime: number;
  timePerFile: number;
  memoryUsage: number;
}
```

### ProcessedAnalysisResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ProcessedAnalysisResult {
  issueCount: number;
  issueTypeDistribution: Map<string, number>;
  criticalIssues: number;
  highPriorityIssues: number;
  totalIssues: number;
  issuesPerFile: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ProcessedAnalysisResult {
  issueCount: number;
  issueTypeDistribution: Map<string, number>;
  criticalIssues: number;
  highPriorityIssues: number;
  totalIssues: number;
  issuesPerFile: number;
}
```

### ScalabilityAnalysis (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ScalabilityAnalysis {
  complexity: string;
  timeComplexity: string;
  spaceComplexity: string;
  regressionCoefficient: number;
  scalabilityScore: number;
  recommendedMaxFiles: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ScalabilityAnalysis {
  complexity: string;
  timeComplexity: string;
  spaceComplexity: string;
  regressionCoefficient: number;
  scalabilityScore: number;
  recommendedMaxFiles: number;
}
```

### LargeScaleProjectConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LargeScaleProjectConfig {
  /** プロジェクト名 */
  name: string;
  /** ファイル数の規模 */
  fileCount: number;
  /** テストメソッド数の規模 */
  methodCount: number;
  /** 平均ファイルサイズ（行数） */
  averageFileSize: number;
  /** 複雑度レベル */
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  /** フレームワーク */
  frameworks: ('express' | 'react' | 'nestjs' | 'nextjs')[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface LargeScaleProjectConfig {
  /** プロジェクト名 */
  name: string;
  /** ファイル数の規模 */
  fileCount: number;
  /** テストメソッド数の規模 */
  methodCount: number;
  /** 平均ファイルサイズ（行数） */
  averageFileSize: number;
  /** 複雑度レベル */
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  /** フレームワーク */
  frameworks: ('express' | 'react' | 'nestjs' | 'nextjs')[];
}
```

### PerformanceResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceResult {
  /** プロジェクト設定 */
  config: LargeScaleProjectConfig;
  /** 実行時間メトリクス */
  timing: {
    /** 総実行時間（ms） */
    totalTime: number;
    /** ファイルあたり平均時間（ms） */
    timePerFile: number;
    /** メソッドあたり平均時間（ms） */
    timePerMethod: number;
    /** セットアップ時間（ms） */
    setupTime: number;
    /** 解析時間（ms） */
    analysisTime: number;
    /** 後処理時間（ms） */
    teardownTime: number;
  };
  /** メモリ使用量メトリクス */
  memory: {
    /** 初期メモリ使用量（MB） */
    initialMemory: number;
    /** ピークメモリ使用量（MB） */
    peakMemory: number;
    /** 最終メモリ使用量（MB） */
    finalMemory: number;
    /** メモリ効率（MB/file） */
    memoryPerFile: number;
  };
  /** スループット メトリクス */
  throughput: {
    /** ファイル処理速度（files/sec） */
    filesPerSecond: number;
    /** メソッド処理速度（methods/sec） */
    methodsPerSecond: number;
    /** 問題検出速度（issues/sec） */
    issuesPerSecond: number;
  };
  /** 並列処理効率 */
  parallelism: {
    /** 使用CPU数 */
    coreCount: number;
    /** 並列度 */
    parallelism: number;
    /** CPU使用率 */
    cpuUtilization: number;
    /** 並列効率（理想値=1.0） */
    parallelEfficiency: number;
  };
  /** 目標達成度 */
  targetAchievement: {
    /** 5ms/file目標達成 */
    fiveMsTarget: boolean;
    /** 3-20x高速化達成 */
    speedupTarget: boolean;
    /** 実際の高速化倍率 */
    actualSpeedup: number;
  };
  /** 検出結果 */
  analysisResults: {
    /** 総検出問題数 */
    totalIssues: number;
    /** ファイルあたり平均問題数 */
    issuesPerFile: number;
    /** 問題種別分布 */
    issueTypeDistribution: Map<string, number>;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface PerformanceResult {
  /** プロジェクト設定 */
  config: LargeScaleProjectConfig;
  /** 実行時間メトリクス */
  timing: {
    /** 総実行時間（ms） */
    totalTime: number;
    /** ファイルあたり平均時間（ms） */
    timePerFile: number;
    /** メソッドあたり平均時間（ms） */
    timePerMethod: number;
    /** セットアップ時間（ms） */
    setupTime: number;
    /** 解析時間（ms） */
    analysisTime: number;
    /** 後処理時間（ms） */
    teardownTime: number;
  };
  /** メモリ使用量メトリクス */
  memory: {
    /** 初期メモリ使用量（MB） */
    initialMemory: number;
    /** ピークメモリ使用量（MB） */
    peakMemory: number;
    /** 最終メモリ使用量（MB） */
    finalMemory: number;
    /** メモリ効率（MB/file） */
    memoryPerFile: number;
  };
  /** スループット メトリクス */
  throughput: {
    /** ファイル処理速度（files/sec） */
    filesPerSecond: number;
    /** メソッド処理速度（methods/sec） */
    methodsPerSecond: number;
    /** 問題検出速度（issues/sec） */
    issuesPerSecond: number;
  };
  /** 並列処理効率 */
  parallelism: {
    /** 使用CPU数 */
    coreCount: number;
    /** 並列度 */
    parallelism: number;
    /** CPU使用率 */
    cpuUtilization: number;
    /** 並列効率（理想値=1.0） */
    parallelEfficiency: number;
  };
  /** 目標達成度 */
  targetAchievement: {
    /** 5ms/file目標達成 */
    fiveMsTarget: boolean;
    /** 3-20x高速化達成 */
    speedupTarget: boolean;
    /** 実際の高速化倍率 */
    actualSpeedup: number;
  };
  /** 検出結果 */
  analysisResults: {
    /** 総検出問題数 */
    totalIssues: number;
    /** ファイルあたり平均問題数 */
    issuesPerFile: number;
    /** 問題種別分布 */
    issueTypeDistribution: Map<string, number>;
  };
}
```

### ScalabilityTestResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScalabilityTestResult {
  /** テスト条件 */
  testConditions: {
    /** 最小ファイル数 */
    minFiles: number;
    /** 最大ファイル数 */
    maxFiles: number;
    /** ステップ数 */
    steps: number;
  };
  /** スケーラビリティデータ */
  scalabilityData: {
    /** ファイル数 */
    fileCount: number;
    /** 実行時間（ms） */
    executionTime: number;
    /** ファイルあたり時間（ms） */
    timePerFile: number;
    /** メモリ使用量（MB） */
    memoryUsage: number;
  }[];
  /** スケーラビリティ分析 */
  analysis: {
    /** 時間計算量（O記法） */
    timeComplexity: string;
    /** 空間計算量（O記法） */
    spaceComplexity: string;
    /** スケーラビリティスコア（1-10） */
    scalabilityScore: number;
    /** 推奨最大ファイル数 */
    recommendedMaxFiles: number;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/LargeScalePerformanceValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ScalabilityTestResult {
  /** テスト条件 */
  testConditions: {
    /** 最小ファイル数 */
    minFiles: number;
    /** 最大ファイル数 */
    maxFiles: number;
    /** ステップ数 */
    steps: number;
  };
  /** スケーラビリティデータ */
  scalabilityData: {
    /** ファイル数 */
    fileCount: number;
    /** 実行時間（ms） */
    executionTime: number;
    /** ファイルあたり時間（ms） */
    timePerFile: number;
    /** メモリ使用量（MB） */
    memoryUsage: number;
  }[];
  /** スケーラビリティ分析 */
  analysis: {
    /** 時間計算量（O記法） */
    timeComplexity: string;
    /** 空間計算量（O記法） */
    spaceComplexity: string;
    /** スケーラビリティスコア（1-10） */
    scalabilityScore: number;
    /** 推奨最大ファイル数 */
    recommendedMaxFiles: number;
  };
}
```

### RealWorldProject (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RealWorldProject {
  /** プロジェクト名 */
  name: string;
  /** フレームワーク種別 */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** プロジェクトルートパス */
  rootPath: string;
  /** テストディレクトリパス */
  testPaths: string[];
  /** 期待される検証結果 */
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  /** メタデータ */
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
    testCount: number;
    lastValidated: Date;
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/RealWorldProjectValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RealWorldProject {
  /** プロジェクト名 */
  name: string;
  /** フレームワーク種別 */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** プロジェクトルートパス */
  rootPath: string;
  /** テストディレクトリパス */
  testPaths: string[];
  /** 期待される検証結果 */
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  /** メタデータ */
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
    testCount: number;
    lastValidated: Date;
  };
}
```

### FrameworkSpecificFinding (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FrameworkSpecificFinding {
  /** フレームワーク */
  framework: string;
  /** カテゴリ */
  category: string;
  /** 発見事項 */
  finding: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 推奨対策 */
  recommendation: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/RealWorldProjectValidator.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FrameworkSpecificFinding {
  /** フレームワーク */
  framework: string;
  /** カテゴリ */
  category: string;
  /** 発見事項 */
  finding: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 推奨対策 */
  recommendation: string;
}
```

### AITestErrorReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AITestErrorReport {
  version: string;
  format: 'ai-test-error';
  executionDate: string;
  summary: ErrorSummary;
  errorGroups: ErrorGroup[];
  contextualInstructions: ContextualInstructions;
  quickActions: QuickAction[];
  ciTraceability?: CITraceabilityInfo;
  executionInfo?: ExecutionInfo;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AITestErrorReport {
  version: string;
  format: 'ai-test-error';
  executionDate: string;
  summary: ErrorSummary;
  errorGroups: ErrorGroup[];
  contextualInstructions: ContextualInstructions;
  quickActions: QuickAction[];
  ciTraceability?: CITraceabilityInfo;
  executionInfo?: ExecutionInfo;
}
```

### ExecutionInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ExecutionInfo {
  startTime: string;
  endTime?: string;
  duration?: number;
  environment: string;
  totalFilesProcessed?: number;
  totalErrorsCollected?: number;
  jestReportedFailures?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ExecutionInfo {
  startTime: string;
  endTime?: string;
  duration?: number;
  environment: string;
  totalFilesProcessed?: number;
  totalErrorsCollected?: number;
  jestReportedFailures?: number;
}
```

### CITraceabilityInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CITraceabilityInfo {
  runId: string;
  runNumber: string;
  workflow: string;
  job?: string;
  actor?: string;
  repository: string;
  branch: string;
  sha: string;
  prNumber?: string;
  deepLink?: string;
  prLink?: string;
  nodeVersion: string;
  os: string;
  timestamp: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface CITraceabilityInfo {
  runId: string;
  runNumber: string;
  workflow: string;
  job?: string;
  actor?: string;
  repository: string;
  branch: string;
  sha: string;
  prNumber?: string;
  deepLink?: string;
  prLink?: string;
  nodeVersion: string;
  os: string;
  timestamp: string;
}
```

### ErrorSummary (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  testFileCount: number;
  commonPatterns: string[];
  estimatedFixTime: number; // 分単位
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  testFileCount: number;
  commonPatterns: string[];
  estimatedFixTime: number; // 分単位
}
```

### ErrorGroup (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ErrorGroup {
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  errors: FormattedError[];
  commonSolution?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ErrorGroup {
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  errors: FormattedError[];
  commonSolution?: string;
}
```

### FormattedError (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FormattedError {
  id: string;
  testFile: string;
  testName: string;
  errorMessage: string;
  context: {
    failedAssertion: string;
    relevantCode: string;
    stackTrace: string;
  };
  suggestedFix: {
    explanation: string;
    code: string;
    confidence: number;
  };
  relatedInfo: {
    sourceFile?: string;
    dependencies: string[];
  };
  errorHash?: string; // CI環境でのエラー照合用
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface FormattedError {
  id: string;
  testFile: string;
  testName: string;
  errorMessage: string;
  context: {
    failedAssertion: string;
    relevantCode: string;
    stackTrace: string;
  };
  suggestedFix: {
    explanation: string;
    code: string;
    confidence: number;
  };
  relatedInfo: {
    sourceFile?: string;
    dependencies: string[];
  };
  errorHash?: string; // CI環境でのエラー照合用
}
```

### ContextualInstructions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ContextualInstructions {
  forHuman: string;
  forAI: string;
  debuggingSteps: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface ContextualInstructions {
  forHuman: string;
  forAI: string;
  debuggingSteps: string[];
}
```

### QuickAction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface QuickAction {
  command: string;
  description: string;
  expectedOutcome: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ai-error-formatter.ts
- 種別: interface
- エクスポート: internal
```typescript
interface QuickAction {
  command: string;
  description: string;
  expectedOutcome: string;
}
```

### CITraceability (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CITraceability {
  // GitHub Actions情報
  runId: string;           // GITHUB_RUN_ID
  runNumber: string;       // GITHUB_RUN_NUMBER
  workflow: string;        // GITHUB_WORKFLOW
  job: string;            // GITHUB_JOB
  actor: string;          // GITHUB_ACTOR
  
  // リポジトリ情報
  repository: string;      // GITHUB_REPOSITORY
  branch: string;         // GITHUB_REF_NAME
  sha: string;           // GITHUB_SHA
  prNumber?: string;      // PR番号（該当する場合）
  
  // 実行環境
  nodeVersion: string;    // マトリックス情報から取得
  os: string;            // ランナーOS (RUNNER_OS)
  timestamp: string;      // 実行日時
  
  // エラー照合用
  errorHash: string;      // エラーの一意識別子
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/ci-traceability.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CITraceability {
  // GitHub Actions情報
  runId: string;           // GITHUB_RUN_ID
  runNumber: string;       // GITHUB_RUN_NUMBER
  workflow: string;        // GITHUB_WORKFLOW
  job: string;            // GITHUB_JOB
  actor: string;          // GITHUB_ACTOR
  
  // リポジトリ情報
  repository: string;      // GITHUB_REPOSITORY
  branch: string;         // GITHUB_REF_NAME
  sha: string;           // GITHUB_SHA
  prNumber?: string;      // PR番号（該当する場合）
  
  // 実行環境
  nodeVersion: string;    // マトリックス情報から取得
  os: string;            // ランナーOS (RUNNER_OS)
  timestamp: string;      // 実行日時
  
  // エラー照合用
  errorHash: string;      // エラーの一意識別子
}
```

### TestErrorContext (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestErrorContext {
  // 基本情報
  timestamp: string;
  testFile: string;
  testName: string;
  errorType: ErrorType;
  
  // エラー詳細
  error: {
    message: string;
    stack?: string;
    actual?: unknown;
    expected?: unknown;
  };
  
  // コードコンテキスト（Select Context）
  codeContext: {
    failedLine: number;
    failedCode: string;
    surroundingCode: {
      before: string;
      after: string;
    };
    testStructure: TestStructure;
  };
  
  // 環境情報（Write Context）
  environment: {
    nodeVersion: string;
    jestVersion?: string;
    ciEnvironment: boolean;
    memoryUsage: NodeJS.MemoryUsage;
  };
  
  // 関連ファイル（Isolate Context）
  relatedFiles: {
    sourceFile?: string;
    dependencies: string[];
    configFiles: string[];
  };
  
  // CIトレーサビリティ情報（オプション）
  ciTraceability?: unknown;
  
  // 推奨アクション（Compress Context）
  suggestedActions: SuggestedAction[];
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/error-context.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestErrorContext {
  // 基本情報
  timestamp: string;
  testFile: string;
  testName: string;
  errorType: ErrorType;
  
  // エラー詳細
  error: {
    message: string;
    stack?: string;
    actual?: unknown;
    expected?: unknown;
  };
  
  // コードコンテキスト（Select Context）
  codeContext: {
    failedLine: number;
    failedCode: string;
    surroundingCode: {
      before: string;
      after: string;
    };
    testStructure: TestStructure;
  };
  
  // 環境情報（Write Context）
  environment: {
    nodeVersion: string;
    jestVersion?: string;
    ciEnvironment: boolean;
    memoryUsage: NodeJS.MemoryUsage;
  };
  
  // 関連ファイル（Isolate Context）
  relatedFiles: {
    sourceFile?: string;
    dependencies: string[];
    configFiles: string[];
  };
  
  // CIトレーサビリティ情報（オプション）
  ciTraceability?: unknown;
  
  // 推奨アクション（Compress Context）
  suggestedActions: SuggestedAction[];
}
```

### TestStructure (inconsistent)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestStructure {
  describes: Array<{ location: CodeLocation; name: string }>;
  tests: Array<{ location: CodeLocation; name: string }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/error-context.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TestStructure {
  describes: string[];
  currentTest: string;
  hooks: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface TestStructure {
  describes: Array<{ location: CodeLocation; name: string }>;
  tests: Array<{ location: CodeLocation; name: string }>;
}
```

### SuggestedAction (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SuggestedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  codeSnippet?: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/error-context.ts
- 種別: interface
- エクスポート: internal
```typescript
interface SuggestedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  codeSnippet?: string;
}
```

### JestAIReporterOptions (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JestAIReporterOptions {
  outputPath?: string;
  enableConsoleOutput?: boolean;
  [key: string]: unknown;
}
```

#### /Users/sasakama/Projects/Rimor/src/testing/jest-ai-reporter.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface JestAIReporterOptions {
  outputPath?: string;
  enableConsoleOutput?: boolean;
  [key: string]: unknown;
}
```

### MigrationReport (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationReport {
  totalPlugins: number;
  legacyPlugins: number;
  modernPlugins: number;
  migrationEstimate: {
    totalEffort: string;
    estimatedHours: number;
    complexPlugins: number;
  };
  pluginDetails: Array<{
    name: string;
    type: 'legacy' | 'modern';
    complexity: string;
    filePath?: string;
  }>;
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/migrationHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface MigrationReport {
  totalPlugins: number;
  legacyPlugins: number;
  modernPlugins: number;
  migrationEstimate: {
    totalEffort: string;
    estimatedHours: number;
    complexPlugins: number;
  };
  pluginDetails: Array<{
    name: string;
    type: 'legacy' | 'modern';
    complexity: string;
    filePath?: string;
  }>;
}
```

### CompatibilityResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompatibilityResult {
  isCompatible: boolean;
  breakingChanges: string[];
  newRequirements: string[];
  suggestions: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/migrationHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CompatibilityResult {
  isCompatible: boolean;
  breakingChanges: string[];
  newRequirements: string[];
  suggestions: string[];
}
```

### TypeDefinition (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeDefinition {
  name: string;
  filePath: string;
  definition: string;
  kind: 'interface' | 'type' | 'enum';
  exportStatus: 'exported' | 'internal';
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/type-consistency-checker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeDefinition {
  name: string;
  filePath: string;
  definition: string;
  kind: 'interface' | 'type' | 'enum';
  exportStatus: 'exported' | 'internal';
}
```

### TypeConflict (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeConflict {
  typeName: string;
  definitions: TypeDefinition[];
  conflictType: 'duplicate' | 'inconsistent';
}
```

#### /Users/sasakama/Projects/Rimor/src/tools/type-consistency-checker.ts
- 種別: interface
- エクスポート: internal
```typescript
interface TypeConflict {
  typeName: string;
  definitions: TypeDefinition[];
  conflictType: 'duplicate' | 'inconsistent';
}
```

### TaintSource (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';
```

### SecuritySink (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown' | 'database-query' | 'html-output' | 'javascript-exec' | 'system-command' | 'file-write' | 'test-assertion';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown' | 'database-query' | 'html-output' | 'javascript-exec' | 'system-command' | 'file-write' | 'test-assertion';
```

### SanitizerType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none' | 'html-escape' | 'sql-escape' | 'input-validation' | 'type-conversion' | 'string-sanitize' | 'json-parse';
```

#### /Users/sasakama/Projects/Rimor/src/types/common-types.ts
- 種別: type
- エクスポート: exported
```typescript
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none' | 'html-escape' | 'sql-escape' | 'input-validation' | 'type-conversion' | 'string-sanitize' | 'json-parse';
```

### CleanupRule (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CleanupRule {
  pattern: string | RegExp;
  reason: string;
  enabled: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/cleanupManager.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface CleanupRule {
  pattern: string | RegExp;
  reason: string;
  enabled: boolean;
}
```

### ParsedFile (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParsedFile {
  filePath: string;
  content: string;
  lines: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ParsedFile {
  filePath: string;
  content: string;
  lines: string[];
}
```

### Pattern (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Pattern {
  line: number;
  column: number;
  match: string;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Pattern {
  line: number;
  column: number;
  match: string;
}
```

### Assertion (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Assertion {
  type: string;
  location: CodeLocation;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Assertion {
  type: string;
  location: CodeLocation;
}
```

### Import (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Import {
  module: string;
  type?: string;
  imports?: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface Import {
  module: string;
  type?: string;
  imports?: string[];
}
```

### FileComplexityMetrics (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileComplexityMetrics {
  totalLines: number;
  codeLines: number;
  testCount: number;
  assertionCount: number;
  avgComplexityPerTest: number;
  maxNestingDepth: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/codeAnalysisHelper.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface FileComplexityMetrics {
  totalLines: number;
  codeLines: number;
  testCount: number;
  assertionCount: number;
  avgComplexityPerTest: number;
  maxNestingDepth: number;
}
```

### DebugLevel (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  VERBOSE = 4,
  TRACE = 5
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/debug.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  VERBOSE = 4,
  TRACE = 5
}
```

### ErrorType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  WARNING = 'WARNING',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN = 'UNKNOWN'
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/errorHandler.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  WARNING = 'WARNING',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN = 'UNKNOWN'
}
```

### ErrorInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoverable: boolean;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/errorHandler.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoverable: boolean;
}
```

### AnalysisLimits (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大処理ファイル数 */
  maxFilesProcessed: number;
  /** 最大分析時間 (ms) */
  maxAnalysisTime: number;
  /** 最大メモリ使用量 (MB) */
  maxMemoryUsage: number;
  /** 最大コンテキスト行数 */
  maxContextLines: number;
  /** 最大ディレクトリ探索深度 */
  maxDepth: number;
  /** 最大プラグイン結果数 */
  maxPluginResults: number;
  /** 最大キャッシュサイズ (MB) */
  maxCacheSize: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/utils/resourceLimits.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface AnalysisLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大処理ファイル数 */
  maxFilesProcessed: number;
  /** 最大分析時間 (ms) */
  maxAnalysisTime: number;
  /** 最大メモリ使用量 (MB) */
  maxMemoryUsage: number;
  /** 最大コンテキスト行数 */
  maxContextLines: number;
  /** 最大ディレクトリ探索深度 */
  maxDepth: number;
  /** 最大プラグイン結果数 */
  maxPluginResults: number;
  /** 最大キャッシュサイズ (MB) */
  maxCacheSize: number;
}
```

### DashboardConfig (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DashboardConfig {
  refreshInterval: number; // ms
  historyLimit: number;
  thresholds: {
    coverage: {
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    };
    complexity: {
      average: number;
      max: number;
    };
    duplication: number;
    technicalDebt: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'file' | 'slack' | 'email')[];
  };
}
```

#### /Users/sasakama/Projects/Rimor/src/monitoring/quality-dashboard.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface DashboardConfig {
  refreshInterval: number; // ms
  historyLimit: number;
  thresholds: {
    coverage: {
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    };
    complexity: {
      average: number;
      max: number;
    };
    duplication: number;
    technicalDebt: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'file' | 'slack' | 'email')[];
  };
}
```

### RiskAssessmentInfo (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessmentInfo {
  riskLevel: RiskLevel;
  score: number;
  category: string;
  affectedAssets: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/scorers/RiskScorer.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessmentInfo {
  riskLevel: RiskLevel;
  score: number;
  category: string;
  affectedAssets: string[];
}
```

### IssueTypeAccuracy (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueTypeAccuracy {
  /** 問題の種別 */
  issueType: string;
  /** 検出数 */
  detected: number;
  /** 正解数 */
  actual: number;
  /** 精度 */
  precision: number | null;
  /** 再現率 */
  recall: number | null;
  /** 典型的な誤検知パターン */
  commonFalsePositives: string[];
  /** 典型的な見逃しパターン */
  commonMisses: string[];
}
```

#### /Users/sasakama/Projects/Rimor/src/security/validation/AccuracyEvaluationSystem.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueTypeAccuracy {
  /** 問題の種別 */
  issueType: string;
  /** 検出数 */
  detected: number;
  /** 正解数 */
  actual: number;
  /** 精度 */
  precision: number | null;
  /** 再現率 */
  recall: number | null;
  /** 典型的な誤検知パターン */
  commonFalsePositives: string[];
  /** 典型的な見逃しパターン */
  commonMisses: string[];
}
```

### RiskAssessmentResult (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessmentResult {
  /** 評価ID */
  assessmentId: string;
  /** 固有リスクレベル（コントロール前） */
  inherentRiskLevel: string;
  /** 軽減後リスクレベル（コントロール後） */
  mitigatedRiskLevel: string;
  /** 全体的なリスクレベル */
  overallRiskLevel: string;
  /** 推奨事項 */
  recommendations: RiskRecommendation[];
  /** 詳細な脅威評価 */
  threatAssessments?: ThreatEventAssessment[];
  /** リスクスコア（0-100） */
  riskScore?: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/nist/types/nist-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface RiskAssessmentResult {
  /** 評価ID */
  assessmentId: string;
  /** 固有リスクレベル（コントロール前） */
  inherentRiskLevel: string;
  /** 軽減後リスクレベル（コントロール後） */
  mitigatedRiskLevel: string;
  /** 全体的なリスクレベル */
  overallRiskLevel: string;
  /** 推奨事項 */
  recommendations: RiskRecommendation[];
  /** 詳細な脅威評価 */
  threatAssessments?: ThreatEventAssessment[];
  /** リスクスコア（0-100） */
  riskScore?: number;
}
```

### IssueType (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum IssueType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  XPATH_INJECTION = 'XPATH_INJECTION',
  MISSING_TEST = 'MISSING_TEST',
  INSUFFICIENT_ASSERTION = 'INSUFFICIENT_ASSERTION',
  TEST_QUALITY = 'TEST_QUALITY',
  CODE_QUALITY = 'CODE_QUALITY',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE'
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: enum
- エクスポート: exported
```typescript
export enum IssueType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  XPATH_INJECTION = 'XPATH_INJECTION',
  MISSING_TEST = 'MISSING_TEST',
  INSUFFICIENT_ASSERTION = 'INSUFFICIENT_ASSERTION',
  TEST_QUALITY = 'TEST_QUALITY',
  CODE_QUALITY = 'CODE_QUALITY',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE'
}
```

### IssueBySeverity (duplicate)

#### /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}
```

#### /Users/sasakama/Projects/Rimor/src/reporting/types.ts
- 種別: interface
- エクスポート: exported
```typescript
export interface IssueBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}
```

## 推奨アクション
- FormattingStrategy: 重複を削除してください
- AISummary: 重複を削除してください
- AIFormattedIssue: 重複を削除してください
- AIFormattedFile: 重複を削除してください
- AIContext: 重複を削除してください
- AIOptimizedOutput: 重複を削除してください
- CodeContext: 重複を削除してください
- LocationInfo: 重複を削除してください
- SuggestedFix: 重複を削除してください
- ActionStep: 重複を削除してください
- ImpactEstimation: 重複を削除してください
- AIMarkdownOutput: 重複を削除してください
- FileAnalysisSection: 重複を削除してください
- IssueSection: 重複を削除してください
- TaskSection: 重複を削除してください
- AIPromptTemplate: 重複を削除してください
- FormatterOptions: 重複を削除してください
- EnhancedAnalysisResult: 重複を削除してください
- AIJsonOutput: 定義を統一してください
- RiskLevel: 定義を統一してください
- AIActionType: 定義を統一してください
- ScoreBreakdown: 重複を削除してください
- ReportDimension: 重複を削除してください
- ExecutiveSummary: 定義を統一してください
- DetailedIssue: 定義を統一してください
- AIActionableRisk: 定義を統一してください
- UnifiedAnalysisResult: 定義を統一してください
- UnifiedAIFormatterOptions: 定義を統一してください
- AIOutputError: 重複を削除してください
- RiskAssessment: 定義を統一してください
- UnifiedAIOutput: 重複を削除してください
- FormatterStrategy: 重複を削除してください
- ImportLocation: 定義を統一してください
- ImportDepthResult: 重複を削除してください
- UsageCategory: 重複を削除してください
- UsageReport: 定義を統一してください
- PackageAnalysisResult: 重複を削除してください
- VersionConstraintResult: 重複を削除してください
- ImportDepthAnalysis: 重複を削除してください
- VersionConstraint: 重複を削除してください
- PackageLockDependency: 重複を削除してください
- PackageLockJson: 重複を削除してください
- YarnLockEntry: 重複を削除してください
- NpmShrinkwrap: 重複を削除してください
- ExtendedPackageJson: 重複を削除してください
- DependencyVersion: 重複を削除してください
- DependencyUsageInfo: 重複を削除してください
- AntiPattern: 定義を統一してください
- DesignPattern: 定義を統一してください
- PatternAnalysis: 重複を削除してください
- PatternRecommendation: 重複を削除してください
- PatternReport: 重複を削除してください
- AnalysisOptions: 定義を統一してください
- ExtractedCodeContext: 重複を削除してください
- FunctionInfo: 重複を削除してください
- ClassInfo: 定義を統一してください
- InterfaceInfo: 重複を削除してください
- VariableInfo: 重複を削除してください
- VariableUsage: 重複を削除してください
- ScopeInfo: 重複を削除してください
- RelatedFileInfo: 重複を削除してください
- DependencyAnalysis: 重複を削除してください
- ProjectDependency: 重複を削除してください
- DependencyUsage: 重複を削除してください
- FileDependency: 重複を削除してください
- CyclicDependency: 重複を削除してください
- ProjectStructure: 重複を削除してください
- ProjectOverview: 重複を削除してください
- LanguageDistribution: 重複を削除してください
- DetectedFramework: 重複を削除してください
- DirectoryInfo: 重複を削除してください
- DirectoryPurpose: 重複を削除してください
- ArchitecturePattern: 重複を削除してください
- ArchitectureType: 重複を削除してください
- NamingConventions: 重複を削除してください
- FileNamingConvention: 重複を削除してください
- DirectoryNamingConvention: 重複を削除してください
- VariableNamingConvention: 重複を削除してください
- FunctionNamingConvention: 重複を削除してください
- ClassNamingConvention: 重複を削除してください
- NamingPattern: 重複を削除してください
- ProjectMetrics: 重複を削除してください
- ComplexityMetrics: 定義を統一してください
- MaintainabilityMetrics: 重複を削除してください
- TestabilityMetrics: 重複を削除してください
- DocumentationMetrics: 重複を削除してください
- ContextOptimizationOptions: 重複を削除してください
- AnalysisCache: 定義を統一してください
- AnalysisResult: 定義を統一してください
- PluginResult: 定義を統一してください
- AIOutputOptions: 重複を削除してください
- AIRisk: 重複を削除してください
- AIRiskContext: 重複を削除してください
- AISuggestedAction: 重複を削除してください
- ReportOutput: 重複を削除してください
- ReportSummary: 定義を統一してください
- ReportResult: 定義を統一してください
- AnalysisResultWithPlugins: 重複を削除してください
- Detection: 重複を削除してください
- Location: 定義を統一してください
- TaintFlowData: 重複を削除してください
- TaintSummaryData: 重複を削除してください
- AnalyzeOptions: 定義を統一してください
- JsonOutput: 重複を削除してください
- DomainAnalyzeOptions: 重複を削除してください
- IntentAnalyzeOptions: 重複を削除してください
- TaintAnalysisOptions: 重複を削除してください
- TaintIssue: 定義を統一してください
- SampleProject: 重複を削除してください
- TestCase: 定義を統一してください
- FrameworkBreakdown: 重複を削除してください
- ValidateCommandOptions: 重複を削除してください
- BasicAnalysisResult: 重複を削除してください
- ExtendedAnalysisResult: 定義を統一してください
- BatchAnalysisSummary: 定義を統一してください
- QualityAnalysisResult: 定義を統一してください
- CacheEntry: 定義を統一してください
- CacheStatistics: 重複を削除してください
- CacheOptions: 重複を削除してください
- CachedAnalysisResult: 重複を削除してください
- CachedAnalysisOptions: 重複を削除してください
- PluginManager: 重複を削除してください
- PluginConfig: 定義を統一してください
- PluginMetadata: 定義を統一してください
- RimorConfig: 重複を削除してください
- ASTInfo: 重複を削除してください
- ASTNode: 定義を統一してください
- IAnalysisEngine: 重複を削除してください
- PluginExecutionResult: 重複を削除してください
- IPlugin: 定義を統一してください
- IPluginManager: 定義を統一してください
- ReportFormat: 定義を統一してください
- ReportOptions: 重複を削除してください
- IReporter: 重複を削除してください
- ThreatType: 重複を削除してください
- SecurityThreat: 重複を削除してください
- SecurityAuditResult: 重複を削除してください
- SecurityRule: 重複を削除してください
- SecurityAuditOptions: 重複を削除してください
- ISecurityAuditor: 重複を削除してください
- ConfigGenerationOptions: 重複を削除してください
- PluginRecommendation: 重複を削除してください
- ParallelOptions: 重複を削除してください
- PerformanceMetrics: 重複を削除してください
- PluginPerformance: 重複を削除してください
- PerformanceReport: 重複を削除してください
- PluginParameter: 重複を削除してください
- PluginDependency: 重複を削除してください
- MetadataProvider: 重複を削除してください
- DetectionResult: 重複を削除してください
- FileMetrics: 定義を統一してください
- AggregatedAnalysisResult: 重複を削除してください
- AnalysisContext: 重複を削除してください
- AnalysisSession: 重複を削除してください
- BaseAnalysisResult: 重複を削除してください
- FileAnalysisResult: 重複を削除してください
- ProjectAnalysisResult: 定義を統一してください
- AnalysisSummary: 定義を統一してください
- TaintAnalysisResult: 定義を統一してください
- TaintFlow: 定義を統一してください
- TaintLevel: 定義を統一してください
- TaintSummary: 定義を統一してください
- SecurityAnalysisResult: 重複を削除してください
- SecurityVulnerability: 重複を削除してください
- ComplianceResult: 重複を削除してください
- ComplianceViolation: 重複を削除してください
- DependencyAnalysisResult: 重複を削除してください
- DependencyInfo: 重複を削除してください
- DependencyVulnerability: 重複を削除してください
- OutdatedDependency: 重複を削除してください
- CircularDependency: 重複を削除してください
- MethodAnalysisResult: 定義を統一してください
- MethodChange: 定義を統一してください
- SecurityThreatType: 重複を削除してください
- SecurityType: 重複を削除してください
- PluginType: 定義を統一してください
- TestType: 定義を統一してください
- QualityDimension: 定義を統一してください
- ImprovementType: 重複を削除してください
- ImprovementPriority: 定義を統一してください
- Position: 重複を削除してください
- FileLocation: 定義を統一してください
- RangeLocation: 定義を統一してください
- CodeLocation: 定義を統一してください
- TimeRange: 重複を削除してください
- ConfidenceInfo: 定義を統一してください
- BaseMetadata: 定義を統一してください
- IssueSeverity: 重複を削除してください
- BaseIssue: 重複を削除してください
- Evidence: 重複を削除してください
- Feedback: 重複を削除してください
- FixResult: 重複を削除してください
- TaintQualifier: 定義を統一してください
- SeverityLevel: 定義を統一してください
- IssueCategory: 定義を統一してください
- Issue: 定義を統一してください
- ExtendedIssue: 定義を統一してください
- QualityScore: 定義を統一してください
- ProjectContext: 定義を統一してください
- Improvement: 定義を統一してください
- DomainTerm: 定義を統一してください
- BusinessRule: 定義を統一してください
- TestScenario: 定義を統一してください
- DomainDictionary: 定義を統一してください
- DomainRelationship: 重複を削除してください
- DomainCategory: 重複を削除してください
- DomainContext: 定義を統一してください
- DomainMatch: 重複を削除してください
- RuleViolation: 重複を削除してください
- DomainCoverage: 重複を削除してください
- IDomainKnowledgeExtractor: 重複を削除してください
- IDomainAnalyzer: 重複を削除してください
- Handler: 重複を削除してください
- AsyncHandler: 重複を削除してください
- ErrorHandler: 重複を削除してください
- ErrorContext: 重複を削除してください
- Callback: 重複を削除してください
- AsyncCallback: 重複を削除してください
- EventListener: 重複を削除してください
- HandlebarsHelper: 重複を削除してください
- HandlebarsBlockHelper: 重複を削除してください
- HandlebarsOptions: 重複を削除してください
- ArrayHelper: 重複を削除してください
- ObjectHelper: 重複を削除してください
- StringHelper: 重複を削除してください
- NumberHelper: 重複を削除してください
- ConditionalHelper: 重複を削除してください
- TransformHelper: 重複を削除してください
- FilterFunction: 重複を削除してください
- MapperFunction: 重複を削除してください
- ReducerFunction: 重複を削除してください
- ComparatorFunction: 重複を削除してください
- ValidatorFunction: 重複を削除してください
- SanitizerFunction: 重複を削除してください
- ParserFunction: 重複を削除してください
- FormatterFunction: 重複を削除してください
- MiddlewareFunction: 重複を削除してください
- InterceptorFunction: 重複を削除してください
- TransformerFunction: 重複を削除してください
- AggregatorFunction: 重複を削除してください
- PredicateFunction: 重複を削除してください
- FactoryFunction: 重複を削除してください
- BuilderFunction: 重複を削除してください
- ResolverFunction: 重複を削除してください
- CodeExample: 重複を削除してください
- Reference: 重複を削除してください
- ImprovementPlan: 重複を削除してください
- ImprovementPhase: 重複を削除してください
- ImprovementExecutionResult: 重複を削除してください
- ImprovementAnalytics: 重複を削除してください
- IImprovementEngine: 重複を削除してください
- TestAnalysisResult: 重複を削除してください
- PluginExecutionContext: 重複を削除してください
- QualityScoreMap: 重複を削除してください
- ImprovementMap: 重複を削除してください
- DetectionResultMap: 重複を削除してください
- DeepPartial: 重複を削除してください
- RequireAtLeastOne: 重複を削除してください
- Nullable: 重複を削除してください
- ITestQualityPlugin: 重複を削除してください
- PluginCapabilities: 重複を削除してください
- ConfigSchema: 重複を削除してください
- SchemaProperty: 重複を削除してください
- ValidationRule: 重複を削除してください
- ValidationResult: 定義を統一してください
- ValidationError: 重複を削除してください
- ValidationWarning: 重複を削除してください
- IPluginLoader: 重複を削除してください
- IPluginRegistry: 重複を削除してください
- IPluginExecutor: 重複を削除してください
- PackageJsonConfig: 重複を削除してください
- TSConfig: 重複を削除してください
- TestFile: 重複を削除してください
- MethodSignature: 定義を統一してください
- TestMethod: 重複を削除してください
- QualityDetails: 重複を削除してください
- QualityMetrics: 定義を統一してください
- QualityEvidence: 重複を削除してください
- QualityTrend: 重複を削除してください
- QualityHistoryPoint: 重複を削除してください
- QualityForecast: 重複を削除してください
- QualityBenchmarks: 重複を削除してください
- QualityGrade: 重複を削除してください
- QualityReport: 定義を統一してください
- QualityRecommendation: 重複を削除してください
- QualityConfig: 重複を削除してください
- QualityRule: 重複を削除してください
- WorkerTask: 定義を統一してください
- WorkerInfo: 重複を削除してください
- DomainRule: 定義を統一してください
- RulePattern: 重複を削除してください
- RuleEvaluationResult: 重複を削除してください
- InteractiveDomainValidatorConfig: 重複を削除してください
- KeywordExtractionResult: 重複を削除してください
- AnalysisMetadata: 定義を統一してください
- DomainAnalysisSection: 重複を削除してください
- DomainIssue: 重複を削除してください
- StaticAnalysisSection: 定義を統一してください
- QualityScoreSection: 重複を削除してください
- RecommendationSection: 重複を削除してください
- Recommendation: 重複を削除してください
- DomainAnalysisConfig: 重複を削除してください
- KeywordInfo: 重複を削除してください
- DomainCluster: 重複を削除してください
- IntegrityHash: 重複を削除してください
- DomainAnalysisResult: 重複を削除してください
- LanguageDetectionResult: 重複を削除してください
- TFIDFVector: 重複を削除してください
- ClusteringConfig: 重複を削除してください
- UserValidationResult: 重複を削除してください
- DomainDefinition: 重複を削除してください
- UsageStats: 重複を削除してください
- AccuracyAnalysis: 重複を削除してください
- PerformanceAnalysis: 重複を削除してください
- FeatureUsageAnalysis: 重複を削除してください
- ProjectFeedback: 重複を削除してください
- FalsePositiveReport: 重複を削除してください
- MissedIssueReport: 重複を削除してください
- FeedbackAnalysisResult: 重複を削除してください
- ImprovementItem: 重複を削除してください
- IndividualFeedback: 重複を削除してください
- PerformanceData: 重複を削除してください
- TimeImpactData: 重複を削除してください
- MergeStrategy: 重複を削除してください
- MergeError: 重複を削除してください
- MergeMetadata: 重複を削除してください
- MergeResult: 重複を削除してください
- ASTMergerConfig: 重複を削除してください
- ParserStrategy: 重複を削除してください
- ParseMetadata: 重複を削除してください
- ParseResult: 重複を削除してください
- HybridParserConfig: 重複を削除してください
- BusinessLogicMapping: 重複を削除してください
- BusinessLogicFile: 重複を削除してください
- BusinessFunction: 重複を削除してください
- BusinessCriticality: 重複を削除してください
- ImpactScope: 定義を統一してください
- DomainImportanceConfig: 重複を削除してください
- IBusinessLogicMapper: 重複を削除してください
- DomainInference: 重複を削除してください
- BusinessImportance: 重複を削除してください
- DomainDictionaryEntry: 重複を削除してください
- ConfidenceConfig: 重複を削除してください
- IDomainInferenceEngine: 重複を削除してください
- TestIntent: 重複を削除してください
- CoverageScope: 重複を削除してください
- TestRealizationResult: 重複を削除してください
- ActualTestAnalysis: 重複を削除してください
- TestAssertion: 重複を削除してください
- TestGap: 重複を削除してください
- GapType: 重複を削除してください
- Severity: 定義を統一してください
- IntentRiskLevel: 重複を削除してください
- ITestIntentAnalyzer: 重複を削除してください
- TypeInfo: 重複を削除してください
- CallGraphNode: 重複を削除してください
- MockInfo: 重複を削除してください
- ExecutionPath: 重複を削除してください
- ITypeScriptAnalyzer: 重複を削除してください
- TestPattern: 重複を削除してください
- DetailedPattern: 重複を削除してください
- ChunkingStrategy: 重複を削除してください
- ChunkMetadata: 重複を削除してください
- ChunkParseResult: 重複を削除してください
- SmartChunkingConfig: 重複を削除してください
- ChunkInfo: 重複を削除してください
- DomainGap: 重複を削除してください
- BusinessMapping: 重複を削除してください
- Suggestion: 重複を削除してください
- SupportedLanguage: 重複を削除してください
- WorkerData: 重複を削除してください
- WorkerResult: 定義を統一してください
- VulnerabilityRecommendation: 重複を削除してください
- CombinedVulnerabilityAssessment: 定義を統一してください
- VulnerabilityChain: 重複を削除してください
- CriticalPath: 重複を削除してください
- CriticalPathImpact: 重複を削除してください
- AffectedAsset: 重複を削除してください
- DowntimeInfo: 重複を削除してください
- FinancialImpact: 重複を削除してください
- ComplianceInfo: 重複を削除してください
- ComplianceImpact: 重複を削除してください
- IncidentInfo: 重複を削除してください
- ReputationImpact: 重複を削除してください
- CustomerImpactInfo: 重複を削除してください
- CustomerChurnRisk: 重複を削除してください
- IntegratedImpacts: 重複を削除してください
- OverallImpactResult: 重複を削除してください
- TimeFactors: 重複を削除してください
- TemporalImpact: 重複を削除してください
- ImpactInfo: 重複を削除してください
- MitigationStrategy: 重複を削除してください
- IncidentDetail: 重複を削除してください
- RecoveryPlan: 重複を削除してください
- RecoveryPhase: 重複を削除してください
- VulnerabilityAssessment: 重複を削除してください
- RiskComponents: 重複を削除してください
- RiskWeights: 重複を削除してください
- OverallRiskScore: 重複を削除してください
- AggregatedRisk: 重複を削除してください
- CategoryRisk: 重複を削除してください
- RiskTrend: 重複を削除してください
- RecommendedAction: 重複を削除してください
- ThreatSourceType: 重複を削除してください
- CapabilityLevel: 重複を削除してください
- IntentLevel: 重複を削除してください
- TargetingLevel: 重複を削除してください
- LikelihoodLevel: 重複を削除してください
- ImpactLevel: 重複を削除してください
- ExploitabilityLevel: 重複を削除してください
- DetectabilityLevel: 重複を削除してください
- RelevanceLevel: 重複を削除してください
- ThreatSource: 重複を削除してください
- ThreatEvent: 重複を削除してください
- Vulnerability: 重複を削除してください
- NISTRiskMatrix: 重複を削除してください
- ThreatEventAssessment: 重複を削除してください
- EnvironmentalImpact: 重複を削除してください
- Threat: 重複を削除してください
- Impact: 重複を削除してください
- RiskMatrix: 重複を削除してください
- RiskRecommendation: 重複を削除してください
- RiskItem: 重複を削除してください
- BusinessImpact: 重複を削除してください
- TechnicalComplexity: 重複を削除してください
- UrgencyLevel: 重複を削除してください
- EstimatedEffort: 重複を削除してください
- RiskPriorityRequest: 重複を削除してください
- PriorityWeights: 重複を削除してください
- PriorityScoreBreakdown: 重複を削除してください
- ResourceAllocation: 重複を削除してください
- RiskPriorityResult: 重複を削除してください
- PriorityScore: 重複を削除してください
- MigrationStats: 重複を削除してください
- BatchMigrationResult: 重複を削除してください
- DomainQualityScore: 重複を削除してください
- SecurityPattern: 重複を削除してください
- LogLevel: 重複を削除してください
- LogMetadata: 重複を削除してください
- ErrorLogMetadata: 重複を削除してください
- LogEntry: 重複を削除してください
- PluginPerformanceConfig: 重複を削除してください
- ExtendedPluginConfig: 重複を削除してください
- TestCaseType: 重複を削除してください
- TestFileStats: 重複を削除してください
- AnnotationLine: 重複を削除してください
- FileAnnotation: 重複を削除してください
- IFormattingStrategy: 重複を削除してください
- UnifiedReport: 重複を削除してください
- ReportGenerationOptions: 定義を統一してください
- ILegacyAdapter: 重複を削除してください
- DataFlowNode: 重複を削除してください
- DataFlow: 重複を削除してください
- ModuleCoverage: 重複を削除してください
- TestCoverageMetrics: 重複を削除してください
- HighComplexityMethod: 重複を削除してください
- CodeQualityMetrics: 重複を削除してください
- AnalysisMetrics: 重複を削除してください
- StructuredAnalysisResult: 重複を削除してください
- AnnotationOptions: 重複を削除してください
- LegacyConfig: 重複を削除してください
- JsonValue: 重複を削除してください
- JsonObject: 重複を削除してください
- JsonArray: 重複を削除してください
- SanitizedConfig: 重複を削除してください
- PartialScoringConfig: 重複を削除してください
- ScoringConfig: 重複を削除してください
- ConfigValidationResult: 定義を統一してください
- SummaryReport: 重複を削除してください
- DetailedReport: 重複を削除してください
- TrendReport: 重複を削除してください
- HistoricalScore: 重複を削除してください
- DimensionScore: 重複を削除してください
- ScoreTrend: 重複を削除してください
- FileScore: 重複を削除してください
- DirectoryScore: 重複を削除してください
- ProjectScore: 重複を削除してください
- AggregatedScore: 重複を削除してください
- WeightConfig: 重複を削除してください
- ScoreHistory: 重複を削除してください
- ScoreCache: 重複を削除してください
- DimensionType: 重複を削除してください
- GradeType: 重複を削除してください
- IScoreCalculator: 重複を削除してください
- CLIValidationResult: 重複を削除してください
- CLISecurityLimits: 重複を削除してください
- ConfigSecurityLimits: 重複を削除してください
- AggregatedResult: 重複を削除してください
- PerformanceStats: 重複を削除してください
- TaintSourceInfo: 定義を統一してください
- SanitizerInfo: 定義を統一してください
- SecuritySinkInfo: 定義を統一してください
- TaintPropagationResult: 定義を統一してください
- TaintFlowAnalysisResult: 定義を統一してください
- TaintViolation: 定義を統一してください
- ReachabilityAnalysisResult: 定義を統一してください
- CycleDetectionResult: 定義を統一してください
- TypeFlowAnalysisResult: 定義を統一してください
- TypeTransition: 定義を統一してください
- TypeViolation: 定義を統一してください
- QualityPrediction: 重複を削除してください
- TestingNeeds: 重複を削除してください
- VariableDeclaration: 重複を削除してください
- InferredSecurityType: 重複を削除してください
- SecurityApiCall: 重複を削除してください
- UserInputDetection: 重複を削除してください
- LocalContext: 重複を削除してください
- AnalyzedSignature: 重複を削除してください
- TaintPath: 重複を削除してください
- CriticalFlow: 定義を統一してください
- TaintPropagationStep: 重複を削除してください
- FlowPath: 定義を統一してください
- ExtendedFlowNode: 重複を削除してください
- PathAnalysisResult: 重複を削除してください
- TypeSummary: 重複を削除してください
- SecurityTypeSummary: 重複を削除してください
- MissingTypeSummary: 重複を削除してください
- FlowAnalysisDetail: 重複を削除してください
- FlowPathDetail: 重複を削除してください
- TaintPropagationDetail: 重複を削除してください
- LocalTaintPropagationStep: 重複を削除してください
- CriticalPathDetail: 重複を削除してください
- SecurityRiskDetail: 重複を削除してください
- OptimizationSuggestion: 重複を削除してください
- CompleteTypeAnalysis: 重複を削除してください
- DetailedTypeInference: 重複を削除してください
- UncertainTypeInfo: 重複を削除してください
- TypeConflictInfo: 重複を削除してください
- DetailedFlowGraph: 重複を削除してください
- DetailedLatticeAnalysis: 重複を削除してください
- LatticeStabilityMetrics: 重複を削除してください
- SecurityInvariantAnalysis: 重複を削除してください
- ComprehensiveAnalysisReport: 重複を削除してください
- RiskFactor: 重複を削除してください
- RecommendationPriority: 重複を削除してください
- MetricsComparison: 重複を削除してください
- MetricsImprovement: 重複を削除してください
- BenchmarkComparison: 定義を統一してください
- ProgressiveAnalysisResult: 重複を削除してください
- AIContextInfo: 重複を削除してください
- InferenceState: 重複を削除してください
- SearchStep: 重複を削除してください
- SolverResult: 重複を削除してください
- TypeChangeCandidate: 重複を削除してください
- DecoratorTarget: 重複を削除してください
- PropertyKey: 重複を削除してください
- Timestamp: 重複を削除してください
- TaintMetadata: 定義を統一してください
- PolyTaintMetadata: 重複を削除してください
- SuppressTaintMetadata: 重複を削除してください
- ParameterTaintMetadata: 重複を削除してください
- ClassAnnotationInfo: 重複を削除してください
- ClassAnnotationMap: 重複を削除してください
- DecoratorDescriptor: 重複を削除してください
- DecoratorFunction: 重複を削除してください
- CompositeDecorator: 重複を削除してください
- ExtendedMethodDecorator: 重複を削除してください
- TaintValidationError: 重複を削除してください
- MetadataStorage: 重複を削除してください
- MetadataCollector: 重複を削除してください
- MethodArguments: 重複を削除してください
- DecoratorContext: 重複を削除してください
- BenchmarkConfig: 重複を削除してください
- BenchmarkHistory: 重複を削除してください
- RegressionDetectionResult: 重複を削除してください
- PerformanceRegression: 重複を削除してください
- PerformanceImprovement: 重複を削除してください
- PerformanceTrendAnalysis: 重複を削除してください
- BenchmarkResult: 重複を削除してください
- SystemInfo: 定義を統一してください
- ParallelTypeCheckConfig: 重複を削除してください
- MethodTypeCheckResult: 重複を削除してください
- TypeCheckWorkerMessage: 重複を削除してください
- TypeCheckWorkerResult: 重複を削除してください
- TypeInferenceWorkerResult: 重複を削除してください
- SecurityViolation: 定義を統一してください
- TypeCheckWarning: 重複を削除してください
- LocalAnalysisResult: 重複を削除してください
- MethodAnalysisContext: 重複を削除してください
- MethodCall: 定義を統一してください
- ParsedAnnotationFile: 重複を削除してください
- StubFileData: 重複を削除してください
- CheckerFrameworkType: 重複を削除してください
- FlowAnalysisResult: 重複を削除してください
- ParameterInfo: 重複を削除してください
- MethodInfo: 重複を削除してください
- FieldInfo: 重複を削除してください
- MigrationPlan: 定義を統一してください
- MigrationPhase: 重複を削除してください
- LibraryConfig: 重複を削除してください
- MethodCallCheckResult: 重複を削除してください
- PolyTaintInstantiationResult: 重複を削除してください
- QualifiedValue: 重複を削除してください
- AnnotatedTypeFactory: 重複を削除してください
- AnnotatedType: 重複を削除してください
- CheckerVisitor: 重複を削除してください
- LegacyCompatibleType: 重複を削除してください
- LocalVariableAnalysisResult: 重複を削除してください
- InferenceOptimizationResult: 重複を削除してください
- CacheHitStatistics: 重複を削除してください
- ChangeInfo: 重複を削除してください
- ChangeType: 重複を削除してください
- ChangeDetectionResult: 重複を削除してください
- LatticeAnalysisStats: 定義を統一してください
- CryptoPattern: 重複を削除してください
- OWASPCategory: 重複を削除してください
- OWASPTestResult: 重複を削除してください
- IOWASPSecurityPlugin: 重複を削除してください
- InjectionQualityDetails: 重複を削除してください
- VulnerableComponentsQualityDetails: 重複を削除してください
- CryptographicFailuresQualityDetails: 重複を削除してください
- AuthASTNode: 重複を削除してください
- AuthTypeInferenceResult: 定義を統一してください
- AuthTaintPath: 重複を削除してください
- AuthCriticalFlow: 重複を削除してください
- AnalysisError: 重複を削除してください
- TaintPropagationRule: 重複を削除してください
- TaintAnalysisConfig: 重複を削除してください
- IncrementalAnalysisResult: 定義を統一してください
- PropagationRule: 重複を削除してください
- TypeQualifierHierarchy: 重複を削除してください
- TaintedType: 定義を統一してください
- UntaintedType: 重複を削除してください
- PolyTaintType: 重複を削除してください
- QualifiedType: 重複を削除してください
- TypeInferenceHint: 重複を削除してください
- TypeConstraint: 定義を統一してください
- TypeCheckResult: 重複を削除してください
- TestMethodExtended: 重複を削除してください
- FlowGraph: 重複を削除してください
- FlowNode: 重複を削除してください
- FlowEdge: 重複を削除してください
- TestStatement: 定義を統一してください
- TaintState: 重複を削除してください
- TypeState: 重複を削除してください
- TypeError: 重複を削除してください
- SecurityTestMetrics: 定義を統一してください
- SecurityImprovement: 重複を削除してください
- TypeInferenceResult: 定義を統一してください
- SecurityMethodChange: 重複を削除してください
- IncrementalUpdate: 定義を統一してください
- InputTaintPath: 重複を削除してください
- IncrementalChange: 重複を削除してください
- TestMethodAnalysisResult: 重複を削除してください
- SecurityIssue: 定義を統一してください
- Parameter: 重複を削除してください
- IncrementalResult: 重複を削除してください
- TypeBasedSecurityConfig: 重複を削除してください
- TypeBasedSecurityAnalysis: 重複を削除してください
- ModularAnalysis: 重複を削除してください
- SecurityTypeString: 重複を削除してください
- SecurityValidation: 重複を削除してください
- SecurityRequirement: 重複を削除してください
- SecureTest: 重複を削除してください
- UnsafeTest: 重複を削除してください
- ValidatedAuthTest: 重複を削除してください
- ValidatedInputTest: 重複を削除してください
- SecurityAnalysisReport: 重複を削除してください
- ITypeBasedSecurityPlugin: 重複を削除してください
- AuthTestCoverage: 重複を削除してください
- AuthTestMetrics: 重複を削除してください
- BoundaryValue: 重複を削除してください
- BoundaryCondition: 重複を削除してください
- PotentialVulnerability: 重複を削除してください
- Variable: 重複を削除してください
- SecurityTypeAnnotation: 重複を削除してください
- CompileTimeResult: 重複を削除してください
- TaintVulnerabilityAssessment: 重複を削除してください
- TaintChainRisk: 重複を削除してください
- TaintTraceStep: 重複を削除してください
- SafeValue: 重複を削除してください
- TestCaseAnalysisResult: 重複を削除してください
- GroundTruthData: 重複を削除してください
- GroundTruthIssue: 重複を削除してください
- AccuracyMetrics: 重複を削除してください
- DetailedAccuracyResult: 重複を削除してください
- TestCaseAccuracyResult: 重複を削除してください
- AccuracyTrend: 重複を削除してください
- AccuracyImprovement: 重複を削除してください
- TestTemplate: 重複を削除してください
- GenerationConfig: 重複を削除してください
- ScalabilityDataPoint: 重複を削除してください
- ProcessedAnalysisResult: 重複を削除してください
- ScalabilityAnalysis: 重複を削除してください
- LargeScaleProjectConfig: 重複を削除してください
- PerformanceResult: 重複を削除してください
- ScalabilityTestResult: 重複を削除してください
- RealWorldProject: 重複を削除してください
- FrameworkSpecificFinding: 重複を削除してください
- AITestErrorReport: 重複を削除してください
- ExecutionInfo: 重複を削除してください
- CITraceabilityInfo: 重複を削除してください
- ErrorSummary: 重複を削除してください
- ErrorGroup: 重複を削除してください
- FormattedError: 重複を削除してください
- ContextualInstructions: 重複を削除してください
- QuickAction: 重複を削除してください
- CITraceability: 重複を削除してください
- TestErrorContext: 重複を削除してください
- TestStructure: 定義を統一してください
- SuggestedAction: 重複を削除してください
- JestAIReporterOptions: 重複を削除してください
- MigrationReport: 重複を削除してください
- CompatibilityResult: 重複を削除してください
- TypeDefinition: 重複を削除してください
- TypeConflict: 重複を削除してください
- TaintSource: 重複を削除してください
- SecuritySink: 重複を削除してください
- SanitizerType: 重複を削除してください
- CleanupRule: 重複を削除してください
- ParsedFile: 重複を削除してください
- Pattern: 重複を削除してください
- Assertion: 重複を削除してください
- Import: 重複を削除してください
- FileComplexityMetrics: 重複を削除してください
- DebugLevel: 重複を削除してください
- ErrorType: 重複を削除してください
- ErrorInfo: 重複を削除してください
- AnalysisLimits: 重複を削除してください
- DashboardConfig: 重複を削除してください
- RiskAssessmentInfo: 重複を削除してください
- IssueTypeAccuracy: 重複を削除してください
- RiskAssessmentResult: 重複を削除してください
- IssueType: 重複を削除してください
- IssueBySeverity: 重複を削除してください