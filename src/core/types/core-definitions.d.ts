/**
 * コア型定義 - プロジェクト全体で使用される統一型定義
 *
 * このファイルは型定義の一元管理を目的としています。
 * 全てのモジュールはこのファイルから型をインポートしてください。
 *
 * @since v0.9.0
 */
/**
 * CoreTypes名前空間
 * プロジェクト全体で共通使用される型定義を集約
 */
export declare namespace CoreTypes {
    /**
     * リスクレベル - セキュリティや品質リスクの深刻度
     * CRITICAL > HIGH > MEDIUM > LOW > MINIMAL の順で深刻度が高い
     */
    enum RiskLevel {
        CRITICAL = "CRITICAL",
        HIGH = "HIGH",
        MEDIUM = "MEDIUM",
        LOW = "LOW",
        MINIMAL = "MINIMAL"
    }
    /**
     * 重要度レベル - 問題や警告の重要度
     * 小文字で統一（TypeScript/ESLint標準に準拠）
     * error/warningはhigh/mediumへのマッピング用に追加
     */
    type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'error' | 'warning';
    /**
     * 問題カテゴリ - 検出された問題の分類
     */
    type IssueCategory = 'testing' | 'security' | 'performance' | 'maintainability' | 'reliability' | 'complexity' | 'duplication' | 'style' | 'documentation' | 'general' | 'test-quality' | 'coverage' | 'assertion' | 'pattern' | 'structure' | 'best-practice' | 'error-handling' | 'validation' | 'code-quality' | 'test-coverage' | 'file-system' | 'syntax';
    /**
     * 問題（Issue）- 検出された問題の詳細情報
     */
    interface Issue {
        id: string;
        type: string;
        severity: SeverityLevel;
        category: IssueCategory;
        message: string;
        description?: string;
        filePath?: string;
        file?: string;
        line?: number;
        column?: number;
        endLine?: number;
        endColumn?: number;
        ruleId?: string;
        suggestion?: string;
        fixable?: boolean;
        metadata?: Record<string, any>;
    }
    /**
     * リスク評価 - リスクの詳細評価情報
     */
    interface RiskAssessment {
        riskLevel: RiskLevel;
        category: string;
        description: string;
        problem?: string;
        title?: string;
        impact: string | number;
        likelihood: number;
        score?: number;
        mitigation?: string;
        mitigationStatus?: 'none' | 'partial' | 'comprehensive';
        affectedFiles?: string[];
        estimatedEffort?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
    }
    /**
     * 拡張Issue型 - formatterやreporting用の追加プロパティを含む
     */
    interface ExtendedIssue extends Issue {
        position?: {
            line: number;
            column: number;
            endLine?: number;
            endColumn?: number;
        };
        suggestedFix?: string;
        codeSnippet?: string;
        plugin?: string;
        rule?: string;
        location?: {
            file: string;
            startLine: number;
            endLine: number;
            column?: number;
        };
        recommendation?: string;
        references?: string[];
    }
    /**
     * AI用JSON出力形式 - AI向けに最適化された出力
     */
    interface AIJsonOutput {
        overallAssessment: string;
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
        fullReportUrl: string;
        metadata?: {
            timestamp: string;
            version: string;
            projectType?: string;
        };
    }
    /**
     * 詳細問題情報 - レポート用の詳細な問題情報
     */
    interface DetailedIssue extends Issue {
        riskLevel: RiskLevel;
        title: string;
        contextSnippet?: string;
        relatedFiles?: string[];
        occurrences?: number;
        firstDetected?: Date;
        lastDetected?: Date;
    }
    /**
     * 品質スコア - コード品質の評価スコア
     */
    interface QualityScore {
        overall: number;
        dimensions: {
            completeness?: number;
            correctness?: number;
            maintainability?: number;
            reliability?: number;
            security?: number;
        };
        breakdown?: {
            [key: string]: number;
        };
        confidence: number;
        grade?: 'A' | 'B' | 'C' | 'D' | 'F';
    }
    /**
     * プロジェクトコンテキスト - プロジェクト全体の情報
     */
    interface ProjectContext {
        rootPath: string;
        projectName?: string;
        projectType?: string;
        language?: string;
        framework?: string;
        testFramework?: string;
        configFiles?: string[];
        dependencies?: Record<string, string>;
        totalFiles?: number;
        totalLines?: number;
        testFiles?: number;
    }
    /**
     * 分析結果 - 分析実行の結果
     */
    interface AnalysisResult {
        filePath: string;
        timestamp: Date;
        issues: Issue[];
        score?: QualityScore;
        riskAssessment?: RiskAssessment;
        executionTime?: number;
        pluginsUsed?: string[];
        errors?: Array<{
            plugin: string;
            error: string;
        }>;
    }
    /**
     * 改善提案 - コード改善の提案
     */
    interface Improvement {
        id: string;
        type: 'refactor' | 'fix' | 'enhancement' | 'test' | 'documentation';
        priority: 'critical' | 'high' | 'medium' | 'low';
        impact?: number | {
            scoreImprovement: number;
            effortMinutes: number;
        };
        estimatedImpact?: number;
        title: string;
        description: string;
        category?: string;
        suggestedCode?: string;
        diff?: string;
        autoFixable?: boolean;
        effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
        estimatedTime?: string;
    }
}
/**
 * 型ガード関数
 */
export declare namespace TypeGuards {
    function isRiskLevel(value: unknown): value is CoreTypes.RiskLevel;
    function isSeverityLevel(value: unknown): value is CoreTypes.SeverityLevel;
    function isIssue(value: unknown): value is CoreTypes.Issue;
    function isRiskAssessment(value: unknown): value is CoreTypes.RiskAssessment;
}
/**
 * ユーティリティ関数
 */
export declare namespace TypeUtils {
    /**
     * RiskLevelを数値に変換（比較用）
     */
    function riskLevelToNumber(level: CoreTypes.RiskLevel): number;
    /**
     * SeverityLevelを数値に変換（比較用）
     */
    function severityLevelToNumber(level: CoreTypes.SeverityLevel): number;
    /**
     * リスクレベルの比較
     */
    function compareRiskLevels(a: CoreTypes.RiskLevel, b: CoreTypes.RiskLevel): number;
    /**
     * 重要度レベルの比較
     */
    function compareSeverityLevels(a: CoreTypes.SeverityLevel, b: CoreTypes.SeverityLevel): number;
}
/** @deprecated Use CoreTypes.RiskLevel instead */
export type RiskLevel = CoreTypes.RiskLevel;
/** @deprecated Use CoreTypes.SeverityLevel instead */
export type SeverityLevel = CoreTypes.SeverityLevel;
/** @deprecated Use CoreTypes.IssueCategory instead */
export type IssueCategory = CoreTypes.IssueCategory;
/** @deprecated Use CoreTypes.Issue instead */
export type Issue = CoreTypes.Issue;
/** @deprecated Use CoreTypes.ExtendedIssue instead */
export type ExtendedIssue = CoreTypes.ExtendedIssue;
/** @deprecated Use CoreTypes.RiskAssessment instead */
export type RiskAssessment = CoreTypes.RiskAssessment;
/** @deprecated Use CoreTypes.AIJsonOutput instead */
export type AIJsonOutput = CoreTypes.AIJsonOutput;
//# sourceMappingURL=core-definitions.d.ts.map