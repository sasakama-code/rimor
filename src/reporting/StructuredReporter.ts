/**
 * Structured Reporter
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * 分析結果を決定論的な構造化JSONに変換する
 * これが全ての出力の「単一の真実の源」となる
 */

import { injectable } from 'inversify';
import { 
  StructuredAnalysisResult,
  AnalysisMetadata,
  AnalysisSummary,
  Issue,
  IssueType,
  Severity,
  IssueBySeverity,
  AnalysisMetrics,
  CodeLocation,
  DataFlow,
  PluginResult
} from './types';
import { AnalysisResult as CoreAnalysisResult } from '../core/interfaces/IAnalysisEngine';
import { SecurityAuditResult, SecurityThreat } from '../core/interfaces/ISecurityAuditor';
import { Issue as CoreIssue, ExtendedIssue } from '../core/types';
import * as crypto from 'crypto';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';

@injectable()
export class StructuredReporter {
  private readonly version: string = '0.8.0';

  /**
   * コア分析結果を構造化形式に変換
   */
  async convertAnalysisResult(
    result: CoreAnalysisResult,
    analyzedPath: string,
    startTime: number
  ): Promise<StructuredAnalysisResult> {
    const metadata = this.createMetadata(analyzedPath, startTime);
    const issues = this.convertIssues(result.issues, analyzedPath);
    const summary = this.createSummary(result.totalFiles, issues);
    const metrics = this.createMetrics(result);

    return {
      metadata,
      summary,
      issues,
      metrics,
      plugins: this.extractPluginResults(result)
    };
  }

  /**
   * セキュリティ監査結果を構造化形式に統合
   */
  async mergeSecurityResult(
    structuredResult: StructuredAnalysisResult,
    securityResult: SecurityAuditResult
  ): Promise<StructuredAnalysisResult> {
    // セキュリティ問題を既存の問題リストに追加
    const securityIssues = this.convertSecurityIssues(
      securityResult.threats,
      structuredResult.metadata.analyzedPath
    );

    // 問題をマージ（重複を避ける）
    const mergedIssues = this.mergeIssues(
      structuredResult.issues,
      securityIssues
    );

    // サマリーを再計算
    const updatedSummary = this.createSummary(
      structuredResult.summary.totalFiles,
      mergedIssues
    );

    return {
      ...structuredResult,
      summary: updatedSummary,
      issues: mergedIssues
    };
  }

  /**
   * メタデータを作成
   */
  private createMetadata(analyzedPath: string, startTime: number): AnalysisMetadata {
    // PIIマスキングを適用
    const resolvedPath = path.resolve(analyzedPath);
    const maskedPath = PathSecurity.toRelativeOrMasked(resolvedPath);
    
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      analyzedPath: maskedPath,
      duration: Date.now() - startTime
    };
  }

  /**
   * サマリーを作成
   */
  private createSummary(totalFiles: number, issues: Issue[]): AnalysisSummary {
    const issueBySeverity = this.countBySeverity(issues);
    const issueByType = this.countByType(issues);

    return {
      totalFiles,
      totalIssues: issues.length,
      issueBySeverity,
      issueByType
    };
  }

  /**
   * 重要度別の問題数をカウント
   */
  private countBySeverity(issues: Issue[]): IssueBySeverity {
    const counts: IssueBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    issues.forEach(issue => {
      // Map severity to IssueBySeverity keys
      const mappedSeverity = this.mapToIssueBySeverity(issue.severity);
      if (mappedSeverity in counts) {
        counts[mappedSeverity as keyof IssueBySeverity]++;
      }
    });

    return counts;
  }

  /**
   * タイプ別の問題数をカウント
   */
  private countByType(issues: Issue[]): Record<string, number> {
    const counts: Record<string, number> = {};

    issues.forEach(issue => {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
    });

    return counts;
  }

  /**
   * コア形式の問題を構造化形式に変換
   */
  private convertIssues(coreIssues: CoreIssue[], basePath: string): Issue[] {
    return coreIssues.map((coreIssue, index) => 
      this.convertIssue(coreIssue, index, basePath)
    );
  }

  /**
   * 個別の問題を変換
   */
  private convertIssue(coreIssue: CoreIssue | ExtendedIssue, index: number, basePath: string): Issue {
    const extIssue = coreIssue as ExtendedIssue;
    const id = this.generateIssueId(coreIssue.type, index);
    const type = this.mapIssueType(coreIssue.type);
    const severity = this.mapSeverity(coreIssue.severity);
    const location = this.extractLocation(coreIssue, basePath);

    const issue: Issue = {
      id,
      type,
      severity,
      location,
      message: coreIssue.message,
      category: coreIssue.category
    } as Issue;

    // オプショナルフィールドの追加
    if (extIssue.recommendation) {
      issue.recommendation = extIssue.recommendation;
    }

    if (extIssue.codeSnippet) {
      issue.codeSnippet = extIssue.codeSnippet;
    }

    // データフロー情報があれば追加
    const dataFlow = this.extractDataFlow(coreIssue);
    if (dataFlow) {
      issue.dataFlow = dataFlow;
    }

    return issue;
  }

  /**
   * セキュリティ問題を変換
   */
  private convertSecurityIssues(
    threats: SecurityThreat[],
    basePath: string
  ): Issue[] {
    return threats.map((threat, index) => {
      const id = this.generateIssueId(threat.type || 'SECURITY', index + 1000);
      const type = this.mapSecurityType(threat.type);
      const severity = this.mapSeverity(threat.severity || 'high');

      const issue: Issue = {
        id,
        type,
        severity,
        location: {
          file: path.relative(basePath, threat.file || ''),
          startLine: threat.line || 1,
          endLine: threat.line || 1
        },
        message: threat.message || 'Security vulnerability detected',
        category: 'security' // セキュリティカテゴリを追加
      } as Issue;

      // 推奨事項を追加
      if (threat.recommendation) {
        issue.recommendation = threat.recommendation;
      }

      // 参考資料を追加
      if (threat.cweId || threat.owaspCategory) {
        issue.references = [];
        if (threat.cweId) {
          issue.references.push(`CWE-${threat.cweId}`);
        }
        if (threat.owaspCategory) {
          issue.references.push(`OWASP: ${threat.owaspCategory}`);
        }
      }

      return issue;
    });
  }

  /**
   * 問題IDを生成（決定論的）
   */
  private generateIssueId(type: string, index: number): string {
    const hash = crypto.createHash('md5');
    hash.update(`${type}-${index}`);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * 問題タイプをマップ
   */
  private mapIssueType(coreType: string): IssueType {
    const typeMap: Record<string, IssueType> = {
      'missing-test': IssueType.MISSING_TEST,
      'test-missing': IssueType.MISSING_TEST,
      'insufficient-assertion': IssueType.INSUFFICIENT_ASSERTION,
      'assertion-missing': IssueType.INSUFFICIENT_ASSERTION,
      'test-quality': IssueType.TEST_QUALITY,
      'code-quality': IssueType.CODE_QUALITY,
      'sql-injection': IssueType.SQL_INJECTION,
      'SQL_INJECTION': IssueType.SQL_INJECTION,
      'xss': IssueType.XSS,
      'XSS': IssueType.XSS,
      'path-traversal': IssueType.PATH_TRAVERSAL,
      'PATH_TRAVERSAL': IssueType.PATH_TRAVERSAL
    };

    return typeMap[coreType] || IssueType.CODE_QUALITY;
  }

  /**
   * セキュリティタイプをマップ
   */
  private mapSecurityType(threatType: string): IssueType {
    const typeMap: Record<string, IssueType> = {
      'injection': IssueType.SQL_INJECTION,
      'xss': IssueType.XSS,
      'path_traversal': IssueType.PATH_TRAVERSAL,
      'csrf': IssueType.SECURITY_MISCONFIGURATION,
      'auth_bypass': IssueType.SECURITY_MISCONFIGURATION,
      'data_exposure': IssueType.SENSITIVE_DATA_EXPOSURE,
      'insecure_crypto': IssueType.SECURITY_MISCONFIGURATION,
      'hardcoded_secret': IssueType.SENSITIVE_DATA_EXPOSURE,
      'unvalidated_input': IssueType.SECURITY_MISCONFIGURATION
    };

    return typeMap[threatType.toLowerCase()] || IssueType.SECURITY_MISCONFIGURATION;
  }

  /**
   * 重要度をマップ
   */
  private mapSeverity(coreSeverity: string | undefined): Severity {
    if (!coreSeverity) return Severity.LOW;
    
    const severityMap: Record<string, Severity> = {
      'error': Severity.HIGH,
      'warning': Severity.MEDIUM,
      'info': Severity.INFO,
      'critical': Severity.CRITICAL,
      'high': Severity.HIGH,
      'medium': Severity.MEDIUM,
      'low': Severity.LOW
    };

    return severityMap[coreSeverity.toLowerCase()] || Severity.LOW;
  }

  /**
   * SeverityLevelをIssueBySeverityのキーにマップ
   */
  private mapToIssueBySeverity(severity: string): keyof IssueBySeverity {
    const mappingTable: Record<string, keyof IssueBySeverity> = {
      'critical': 'critical',
      'error': 'high',  // errorをhighにマップ
      'high': 'high',
      'warning': 'medium',  // warningをmediumにマップ
      'medium': 'medium',
      'low': 'low',
      'info': 'info'
    };

    return mappingTable[severity.toLowerCase()] || 'low';
  }

  /**
   * コード位置情報を抽出
   */
  private extractLocation(coreIssue: CoreIssue, basePath: string): CodeLocation {
    const location: CodeLocation = {
      file: path.relative(basePath, coreIssue.file || ''),
      startLine: coreIssue.line || 1,
      endLine: coreIssue.endLine || coreIssue.line || 1
    };

    if (coreIssue.column) {
      location.startColumn = coreIssue.column;
    }

    if (coreIssue.endColumn) {
      location.endColumn = coreIssue.endColumn;
    }

    return location;
  }

  /**
   * データフロー情報を抽出
   */
  private extractDataFlow(coreIssue: CoreIssue): DataFlow | undefined {
    // コアIssueにデータフロー情報があれば変換
    // 現在の実装では未対応なのでundefinedを返す
    return undefined;
  }

  /**
   * 脆弱性の位置情報を変換
   */
  private convertVulnLocation(vulnLocation: { file?: string; line?: number; endLine?: number; column?: number; endColumn?: number }, basePath: string): CodeLocation {
    return {
      file: path.relative(basePath, vulnLocation.file || ''),
      startLine: vulnLocation.line || 1,
      endLine: vulnLocation.endLine || vulnLocation.line || 1,
      startColumn: vulnLocation.column,
      endColumn: vulnLocation.endColumn
    };
  }

  /**
   * メトリクスを作成
   */
  private createMetrics(result: CoreAnalysisResult): AnalysisMetrics {
    // 基本的なテストカバレッジメトリクス
    const testCoverage = {
      overall: this.calculateOverallCoverage(result),
      byModule: this.calculateModuleCoverage(result),
      missingTests: this.extractMissingTests(result)
    };

    // コード品質メトリクス（将来の拡張用）
    const codeQuality = {
      complexity: {
        average: 0,
        max: 0,
        highComplexityMethods: []
      },
      maintainability: {
        score: 100,
        issues: []
      }
    };

    return {
      testCoverage,
      codeQuality
    };
  }

  /**
   * 全体のテストカバレッジを計算
   */
  private calculateOverallCoverage(result: CoreAnalysisResult): number {
    if (result.totalFiles === 0) return 100;

    const testedFiles = result.issues.filter(
      issue => issue.type !== 'test-missing'
    ).length;

    return Math.round((testedFiles / result.totalFiles) * 100);
  }

  /**
   * モジュール別のカバレッジを計算
   */
  private calculateModuleCoverage(result: CoreAnalysisResult): Record<string, { coverage: number; testedFiles: number; untestedFiles: number }> {
    // 簡易実装：将来的にはモジュール情報を詳細に解析
    return {
      'src': {
        coverage: this.calculateOverallCoverage(result),
        testedFiles: result.totalFiles,
        untestedFiles: 0
      }
    };
  }

  /**
   * テストが不足しているファイルを抽出
   */
  private extractMissingTests(result: CoreAnalysisResult): Array<{file: string, reason: string}> {
    return result.issues
      .filter(issue => issue.type === 'test-missing')
      .map(issue => ({
        file: issue.file || '',
        reason: issue.message
      }));
  }

  /**
   * プラグイン実行結果を抽出
   */
  private extractPluginResults(result: CoreAnalysisResult): Record<string, PluginResult> {
    const plugins: Record<string, PluginResult> = {};

    // 実行されたプラグイン情報を収集（将来の拡張用）
    if (result.pluginsExecuted) {
      result.pluginsExecuted.forEach(pluginName => {
        plugins[pluginName] = {
          executed: true,
          issues: result.issues.filter(
            issue => (issue as ExtendedIssue & { plugin?: string }).plugin === pluginName
          ).length
        };
      });
    }

    return plugins;
  }

  /**
   * 問題リストをマージ（重複排除）
   */
  private mergeIssues(existing: Issue[], additional: Issue[]): Issue[] {
    const issueMap = new Map<string, Issue>();

    // 既存の問題を追加
    existing.forEach(issue => {
      const key = this.generateIssueKey(issue);
      issueMap.set(key, issue);
    });

    // 追加の問題を追加（重複はスキップ）
    additional.forEach(issue => {
      const key = this.generateIssueKey(issue);
      if (!issueMap.has(key)) {
        issueMap.set(key, issue);
      }
    });

    return Array.from(issueMap.values());
  }

  /**
   * 問題の一意キーを生成（重複検出用）
   */
  private generateIssueKey(issue: Issue): string {
    const parts = [
      issue.type,
      issue.severity,
      issue.location?.file || '',
      issue.location?.startLine || 0,
      issue.location?.endLine || 0
    ];

    return crypto
      .createHash('sha256')
      .update(parts.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 構造化結果をJSON文字列に変換（決定論的）
   */
  toJSON(result: StructuredAnalysisResult): string {
    // 循環参照を検出するためのWeakSet
    const seen = new WeakSet();
    
    const replacer = (key: string, value: unknown): unknown => {
      if (value && typeof value === 'object') {
        // 循環参照のチェック
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
        
        // 配列でない場合はキーをソート
        if (!Array.isArray(value)) {
          const sorted: Record<string, unknown> = {};
          Object.keys(value).sort().forEach(k => {
            sorted[k] = (value as any)[k];
          });
          return sorted;
        }
      }
      return value;
    };
    
    return JSON.stringify(result, replacer, 2);
  }
}