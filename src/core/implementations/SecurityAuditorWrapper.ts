/**
 * Security Auditor Wrapper
 * inversifyデコレータを使用せず、シンプルなDIコンテナ向けのラッパー
 * Phase 6: 既存コンポーネントとの共存
 */

import {
  ISecurityAuditor,
  SecurityAuditResult,
  SecurityAuditOptions,
  SecurityThreat,
  SecurityRule,
  ThreatType
} from '../interfaces/ISecurityAuditor';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security Auditor Wrapper
 * 基本的なセキュリティ監査機能を提供
 */
export class SecurityAuditorWrapper implements ISecurityAuditor {
  private customRules: SecurityRule[] = [];

  async audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult> {
    const startTime = performance.now();
    const threats: SecurityThreat[] = [];
    let filesScanned = 0;

    try {
      // ターゲットパスの解析
      const absolutePath = path.resolve(targetPath);
      const files = this.getFilesToScan(absolutePath, options);
      
      // 各ファイルをスキャン
      for (const filePath of files) {
        try {
          const fileThreats = await this.scanFile(filePath);
          threats.push(...fileThreats);
          filesScanned++;
        } catch (error) {
          console.warn(`ファイルのスキャンに失敗: ${filePath}`, error);
        }
      }

      // 結果の集計
      const summary = this.calculateSummary(threats);
      const executionTime = performance.now() - startTime;

      return {
        threats,
        summary,
        executionTime,
        filesScanned
      };

    } catch (error) {
      console.error('セキュリティ監査中にエラー:', error);
      throw new Error(`セキュリティ監査に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async scanFile(filePath: string): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      if (!fs.existsSync(filePath)) {
        return threats;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // 基本的なセキュリティパターンの検査
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // SQLインジェクションの可能性
        if (this.containsSqlInjectionPattern(line)) {
          threats.push({
            type: ThreatType.INJECTION,
            severity: 'high',
            file: filePath,
            line: lineNumber,
            column: 0,
            message: 'SQLインジェクションの可能性があります',
            recommendation: 'パラメータ化クエリまたはプリペアドステートメントを使用してください',
            cweId: 'CWE-89',
            owaspCategory: 'A03:2021 - Injection'
          });
        }

        // XSSの可能性
        if (this.containsXssPattern(line)) {
          threats.push({
            type: ThreatType.XSS,
            severity: 'medium',
            file: filePath,
            line: lineNumber,
            column: 0,
            message: 'XSS（クロスサイトスクリプティング）の可能性があります',
            recommendation: '出力時にHTMLエスケープを実装してください',
            cweId: 'CWE-79',
            owaspCategory: 'A03:2021 - Injection'
          });
        }

        // ハードコードされたシークレット
        if (this.containsHardcodedSecret(line)) {
          threats.push({
            type: ThreatType.HARDCODED_SECRET,
            severity: 'critical',
            file: filePath,
            line: lineNumber,
            column: 0,
            message: 'ハードコードされたシークレット情報が検出されました',
            recommendation: '環境変数または安全な設定管理システムを使用してください',
            cweId: 'CWE-798',
            owaspCategory: 'A02:2021 - Cryptographic Failures'
          });
        }

        // パストラバーサル
        if (this.containsPathTraversalPattern(line)) {
          threats.push({
            type: ThreatType.PATH_TRAVERSAL,
            severity: 'high',
            file: filePath,
            line: lineNumber,
            column: 0,
            message: 'パストラバーサル攻撃の可能性があります',
            recommendation: 'ファイルパスの検証と正規化を実装してください',
            cweId: 'CWE-22',
            owaspCategory: 'A01:2021 - Broken Access Control'
          });
        }
      }

      // カスタムルールの適用
      for (const rule of this.customRules) {
        const matches = this.applyCustomRule(content, rule, filePath);
        threats.push(...matches);
      }

    } catch (error) {
      console.warn(`ファイルスキャン中にエラー (${filePath}):`, error);
    }

    return threats;
  }

  registerRule(rule: SecurityRule): void {
    this.customRules.push(rule);
  }

  /**
   * スキャン対象ファイルの取得
   */
  private getFilesToScan(targetPath: string, options?: SecurityAuditOptions): string[] {
    const files: string[] = [];
    
    try {
      const stat = fs.statSync(targetPath);
      
      if (stat.isFile()) {
        if (this.shouldScanFile(targetPath, options)) {
          files.push(targetPath);
        }
      } else if (stat.isDirectory()) {
        this.collectFilesRecursively(targetPath, files, options);
      }
    } catch (error) {
      console.warn(`パス解析エラー: ${targetPath}`, error);
    }

    return files;
  }

  /**
   * ディレクトリから再帰的にファイルを収集
   */
  private collectFilesRecursively(dirPath: string, files: string[], options?: SecurityAuditOptions): void {
    try {
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // node_modules や .git などを除外
          if (!this.shouldSkipDirectory(entry)) {
            this.collectFilesRecursively(fullPath, files, options);
          }
        } else if (stat.isFile()) {
          if (this.shouldScanFile(fullPath, options)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`ディレクトリ読み込みエラー: ${dirPath}`, error);
    }
  }

  /**
   * ファイルをスキャンすべきかチェック
   */
  private shouldScanFile(filePath: string, options?: SecurityAuditOptions): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const scanExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.rb', '.go', '.cs'];
    
    // テストファイルの処理
    if (!options?.includeTests && this.isTestFile(filePath)) {
      return false;
    }
    
    return scanExtensions.includes(ext);
  }

  /**
   * ディレクトリをスキップすべきかチェック
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['node_modules', '.git', '.svn', 'dist', 'build', 'coverage', '.nyc_output'];
    return skipDirs.includes(dirName);
  }

  /**
   * テストファイルかどうかチェック
   */
  private isTestFile(filePath: string): boolean {
    const testPatterns = ['.test.', '.spec.', '__tests__', '/test/', '/tests/'];
    return testPatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * SQLインジェクションパターンの検出
   */
  private containsSqlInjectionPattern(line: string): boolean {
    const patterns = [
      /query\s*\+\s*['"]/i,
      /execute\s*\(\s*['"]/i,
      /WHERE\s+.*\s*\+\s*/i,
      /SELECT\s+.*\s*\+\s*/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * XSSパターンの検出
   */
  private containsXssPattern(line: string): boolean {
    const patterns = [
      /innerHTML\s*=\s*[^'"].+['"]/i,
      /document\.write\s*\(/i,
      /eval\s*\(/i,
      /<script[^>]*>.*<\/script>/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * ハードコードされたシークレットの検出
   */
  private containsHardcodedSecret(line: string): boolean {
    const patterns = [
      /password\s*=\s*['"][^'"]{3,}/i,
      /api[_-]?key\s*=\s*['"][^'"]{10,}/i,
      /secret\s*=\s*['"][^'"]{10,}/i,
      /token\s*=\s*['"][^'"]{20,}/i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * パストラバーサルパターンの検出
   */
  private containsPathTraversalPattern(line: string): boolean {
    const patterns = [
      /\.\.\//,
      /\.\.\\\\?/,
      /readFile\s*\(\s*.*\s*\+\s*/i,
      /path\.join\s*\([^)]*\.\./i
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * カスタムルールの適用
   */
  private applyCustomRule(content: string, rule: SecurityRule, filePath: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const lines = content.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;
      
      if (pattern.test(line)) {
        threats.push({
          type: ThreatType.UNVALIDATED_INPUT, // デフォルト
          severity: rule.severity,
          file: filePath,
          line: lineIndex + 1,
          column: 0,
          message: rule.message,
          recommendation: rule.recommendation
        });
      }
    }
    
    return threats;
  }

  /**
   * 脅威サマリーの計算
   */
  private calculateSummary(threats: SecurityThreat[]) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: threats.length
    };

    threats.forEach(threat => {
      switch (threat.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }
    });

    return summary;
  }
}