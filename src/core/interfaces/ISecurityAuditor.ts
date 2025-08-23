/**
 * Security Auditor Interface
 * v0.8.0 - セキュリティ監査のインターフェース定義
 */

/**
 * セキュリティ脅威の種別
 */
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

/**
 * セキュリティ脅威情報
 */
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

/**
 * セキュリティ監査結果
 */
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

/**
 * セキュリティ監査オプション
 */
/**
 * カスタムセキュリティルール
 */
export interface SecurityRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

export interface SecurityAuditOptions {
  includeTests?: boolean;
  deepScan?: boolean;
  customRules?: SecurityRule[]; // 型安全性を向上
}

/**
 * セキュリティ監査インターフェース
 * v0.7.0 TypeBasedSecurityEngineの簡素化版
 */
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