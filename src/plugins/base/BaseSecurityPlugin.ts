/**
 * BaseSecurityPlugin
 * 
 * セキュリティプラグインの基底クラス
 * SOLID原則に従い、セキュリティ固有の共通機能を提供
 */

import { BasePlugin } from './BasePlugin';
import { DetectionResult } from '../../core/types';

export interface SecurityPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
}

export abstract class BaseSecurityPlugin extends BasePlugin {
  type = 'security' as const;

  /**
   * セキュリティパターンを検出
   */
  protected detectSecurityPatterns(content: string): SecurityPattern[] {
    const patterns: SecurityPattern[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // SQL Injection検出
      if (this.detectSQLInjection(line)) {
        patterns.push({
          type: 'sql-injection',
          severity: 'critical',
          description: 'Potential SQL injection vulnerability detected',
          line: index + 1,
          column: 1
        });
      }

      // XSS検出
      if (this.detectXSS(line)) {
        patterns.push({
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS vulnerability detected',
          line: index + 1,
          column: 1
        });
      }

      // Command Injection検出
      if (this.detectCommandInjection(line)) {
        patterns.push({
          type: 'command-injection',
          severity: 'critical',
          description: 'Potential Command injection vulnerability detected',
          line: index + 1,
          column: 1
        });
      }

      // Path Traversal検出
      if (this.detectPathTraversal(line)) {
        patterns.push({
          type: 'path-traversal',
          severity: 'high',
          description: 'Potential Path traversal vulnerability detected',
          line: index + 1,
          column: 1
        });
      }

      // Hardcoded Credentials検出
      if (this.detectHardcodedCredentials(line)) {
        patterns.push({
          type: 'hardcoded-credentials',
          severity: 'high',
          description: 'Hardcoded credentials detected',
          line: index + 1,
          column: 1
        });
      }

      // Weak Cryptography検出
      if (this.detectWeakCrypto(line)) {
        patterns.push({
          type: 'weak-crypto',
          severity: 'medium',
          description: 'Use of weak cryptographic algorithm detected',
          line: index + 1,
          column: 1
        });
      }
    });

    return patterns;
  }

  /**
   * セキュリティスコアを評価
   */
  protected evaluateSecurityScore(patterns: DetectionResult[]): number {
    if (patterns.length === 0) {
      return 1;
    }

    let totalPenalty = 0;
    const severityWeights: Record<string, number> = {
      critical: 0.8,
      high: 0.5,
      medium: 0.3,
      low: 0.1,
      info: 0.05
    };

    patterns.forEach(pattern => {
      const weight = pattern.severity ? severityWeights[pattern.severity] || 0.1 : 0.1;
      totalPenalty += weight;
    });

    // スコアは0から1の範囲に正規化
    const score = Math.max(0, 1 - totalPenalty);
    return score;
  }

  /**
   * Taint sourceかどうかを判定
   */
  protected isTaintSource(value: string): boolean {
    const taintSources = [
      'request.params',
      'request.body',
      'request.query',
      'request.headers',
      'process.env',
      'localStorage',
      'sessionStorage',
      'document.cookie',
      'window.location'
    ];

    return taintSources.some(source => value.includes(source));
  }

  /**
   * 危険なsinkかどうかを判定
   */
  protected isDangerousSink(value: string): boolean {
    const dangerousSinks = [
      'eval',
      'exec',
      'execSync',
      'spawn',
      'innerHTML',
      'outerHTML',
      'document.write',
      'db.query',
      'db.execute',
      'fs.readFileSync',
      'fs.writeFileSync'
    ];

    return dangerousSinks.some(sink => value.includes(sink));
  }

  // 個別の脆弱性検出メソッド
  private detectSQLInjection(line: string): boolean {
    // 文字列連結によるSQLクエリ構築を検出
    const patterns = [
      /SELECT.*FROM.*WHERE.*\+/i,
      /INSERT.*INTO.*VALUES.*\+/i,
      /UPDATE.*SET.*\+/i,
      /DELETE.*FROM.*\+/i,
      /query\s*\(\s*["'`].*\+/,
      /execute\s*\(\s*["'`].*\+/
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private detectXSS(line: string): boolean {
    // innerHTML等への直接代入を検出
    const patterns = [
      /innerHTML\s*=\s*[^'"`]/,
      /outerHTML\s*=\s*[^'"`]/,
      /document\.write\s*\(/,
      /insertAdjacentHTML/
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private detectCommandInjection(line: string): boolean {
    // exec等への文字列連結を検出
    const patterns = [
      /exec\s*\(\s*['"`].*\+/,
      /execSync\s*\(\s*['"`].*\+/,
      /spawn\s*\(\s*['"`].*\+/,
      /system\s*\(\s*['"`].*\+/
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private detectPathTraversal(line: string): boolean {
    // ../ パターンや相対パスの危険な使用を検出
    const patterns = [
      /readFile.*\.\.\//,
      /readFileSync.*\.\.\//,
      /require\s*\(\s*['"`]\.\.\//,
      /path\.join.*\.\.\//
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private detectHardcodedCredentials(line: string): boolean {
    // パスワードやAPIキーのハードコーディングを検出
    const patterns = [
      /password\s*[:=]\s*["'`][^"'`]+["'`]/i,
      /apikey\s*[:=]\s*["'`][^"'`]+["'`]/i,
      /api_key\s*[:=]\s*["'`][^"'`]+["'`]/i,
      /secret\s*[:=]\s*["'`][^"'`]+["'`]/i,
      /token\s*[:=]\s*["'`][^"'`]+["'`]/i,
      /sk_test_/i,
      /sk_live_/i
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private detectWeakCrypto(line: string): boolean {
    // 弱い暗号化アルゴリズムの使用を検出
    const patterns = [
      /createHash\s*\(\s*['"`]md5/i,
      /createHash\s*\(\s*['"`]sha1/i,
      /createCipher\s*\(\s*['"`]des/i,
      /createCipher\s*\(\s*['"`]rc4/i
    ];

    return patterns.some(pattern => pattern.test(line));
  }
}