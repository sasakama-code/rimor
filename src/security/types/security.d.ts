/**
 * 型ベースセキュリティ解析 - セキュリティ型システム
 * TaintTyperの研究成果とVolpano-Smith-Irvineの型システム情報フローを統合
 */
import { TaintLevel, TaintSource, SanitizerType } from './taint';
import { TestMethod } from '../../core/types/project-context';
import { IncrementalChange, TestMethodAnalysisResult } from './flow-types';
import { SecurityType } from '../../types/common-types';
export { SecurityType };
type SecurityTypeString = 'authentication' | 'authorization' | 'input-validation' | 'api-security';
/**
 * ブランド型によるテスト品質の型レベル追跡
 */
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
/**
 * セキュリティ要件の定義
 */
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
/**
 * セキュアテスト型 - 品質が保証されたテスト
 */
export type SecureTest<T extends TestCase> = T & {
    readonly __validated: SecurityValidation[];
    readonly __taintLevel: TaintLevel;
    readonly __securityType: SecurityType;
};
/**
 * 危険テスト型 - セキュリティ問題があるテスト
 */
export type UnsafeTest<T extends TestCase> = T & {
    readonly __missing: SecurityRequirement[];
    readonly __vulnerabilities: PotentialVulnerability[];
    readonly __riskLevel: 'low' | 'medium' | 'high' | 'critical';
};
/**
 * 認証テスト型 - 認証関連のテストに特化
 */
export type ValidatedAuthTest = TestCase & {
    readonly __brand: 'auth-validated';
    readonly __covers: AuthTestCoverage[];
    readonly __tokenValidation: boolean;
    readonly __sessionManagement: boolean;
};
/**
 * 入力検証テスト型 - 入力検証テストに特化
 */
export type ValidatedInputTest = TestCase & {
    readonly __brand: 'input-validated';
    readonly __sanitizers: SanitizerType[];
    readonly __boundaries: BoundaryCondition[];
    readonly __typeValidation: boolean;
};
/**
 * 境界条件
 */
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
export interface ITypeBasedSecurityPlugin {
    id: string;
    name: string;
    version: string;
    analyzeTestMethod(method: TestMethod): Promise<TestMethodAnalysisResult>;
    analyzeIncrementally?(update: IncrementalChange): Promise<TestMethodAnalysisResult>;
    generateReport?(): SecurityAnalysisReport;
}
export type AuthTestCoverage = 'success' | 'failure' | 'token-expiry' | 'brute-force' | 'session-hijack' | 'csrf' | 'privilege-escalation';
export interface AuthTestMetrics {
    loginTests: number;
    logoutTests: number;
    tokenTests: number;
    sessionTests: number;
    permissionTests: number;
    total: number;
    percentage: number;
}
export type BoundaryValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
export interface BoundaryCondition {
    /** 境界の種別 */
    type: 'min' | 'max' | 'null' | 'empty' | 'invalid-format' | 'overflow';
    /** 境界値 */
    value: BoundaryValue;
    /** テスト済みかどうか */
    tested: boolean;
}
/**
 * 潜在的脆弱性
 */
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
/**
 * テストケースの基本型
 */
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
/**
 * テスト文（ステートメント）
 */
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
/**
 * 変数
 */
export interface Variable {
    /** 変数名 */
    name: string;
    /** 型情報 */
    type?: string;
    /** スコープ */
    scope: 'local' | 'parameter' | 'field' | 'global';
}
/**
 * セキュリティ型注釈
 */
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
/**
 * 型推論結果
 */
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
/**
 * コンパイル時解析結果
 */
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
export interface SecurityIssue {
    id: string;
    type: 'taint' | 'injection' | 'validation' | 'authentication' | 'authorization' | 'unsafe-taint-flow' | 'missing-sanitizer' | 'SQL_INJECTION' | 'CODE_EXECUTION' | 'missing-auth-test' | 'insufficient-validation' | 'sanitization' | 'boundary' | 'sql-injection' | 'command-injection' | 'code-injection' | 'vulnerable-dependency' | 'outdated-version';
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical' | 'error' | 'warning';
    message: string;
    location: {
        file: string;
        line: number;
        column?: number;
        method?: string;
    };
    evidence?: string[];
    recommendation?: string;
    fixSuggestion?: string;
    cwe?: string;
    owasp?: string;
    taintInfo?: {
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
/**
 * セキュリティテスト品質メトリクス
 */
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
//# sourceMappingURL=security.d.ts.map