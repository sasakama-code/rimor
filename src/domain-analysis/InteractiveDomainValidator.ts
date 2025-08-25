/**
 * Interactive Domain Validator
 * v0.9.0 - 対話型ドメイン検証エンジン
 * 
 * KISS原則: シンプルな対話フローの実装
 * YAGNI原則: 必要最小限の機能から開始
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { DomainCluster, UserValidationResult } from './types';
const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * 対話型ドメイン検証器の設定
 */
interface InteractiveDomainValidatorConfig {
  /** 確認をスキップするか */
  skipConfirmation?: boolean;
  /** 最大表示キーワード数 */
  maxDisplayKeywords?: number;
}

/**
 * 対話型ドメイン検証器
 * SOLID原則: 単一責任の原則 - ユーザーとの対話によるドメイン検証のみを担当
 */
export class InteractiveDomainValidator {
  private config: InteractiveDomainValidatorConfig;

  constructor(config?: InteractiveDomainValidatorConfig) {
    this.config = {
      skipConfirmation: false,
      maxDisplayKeywords: 10,
      ...config
    };
  }

  /**
   * ドメインクラスタを対話的に検証
   * @param clusters - 検証対象のドメインクラスタ
   * @returns ユーザー検証結果
   */
  async validate(clusters: DomainCluster[]): Promise<UserValidationResult> {
    // Defensive Programming: 入力検証
    if (!clusters || !Array.isArray(clusters)) {
      return {
        approvedDomains: [],
        modifiedDomains: [],
        rejectedDomains: [],
        validated: false
      };
    }

    const result: UserValidationResult = {
      approvedDomains: [],
      modifiedDomains: [],
      rejectedDomains: [],
      validated: false
    };

    try {
      // 空のクラスタの場合は即座に返す
      if (clusters.length === 0) {
        result.validated = true;
        return result;
      }

      console.log(chalk.cyan('\n🔍 ドメインクラスタの検証を開始します\n'));

      // 各クラスタを順番に検証
      for (const cluster of clusters) {
        // Defensive Programming: 循環参照を避けるためのクローン
        const safeCluster = this.cloneCluster(cluster);
        
        console.log(this.formatClusterDisplay(safeCluster));

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'このドメインをどうしますか？',
            choices: [
              { name: '✅ 承認', value: 'approve' },
              { name: '✏️  修正', value: 'modify' },
              { name: '❌ 拒否', value: 'reject' }
            ]
          }
        ]);

        if (action === 'approve') {
          result.approvedDomains.push(safeCluster);
        } else if (action === 'modify') {
          const modified = await this.modifyCluster(safeCluster);
          result.modifiedDomains.push(modified);
        } else if (action === 'reject') {
          result.rejectedDomains.push(safeCluster);
        }
      }

      // 新しいドメインの追加
      const { continue: addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: '新しいドメインを追加しますか？',
          default: false
        }
      ]);

      if (addMore) {
        const newDomain = await this.createNewDomain();
        result.approvedDomains.push(newDomain);
      }

      result.validated = true;
      
      console.log(chalk.green('\n✅ ドメイン検証が完了しました\n'));
      this.printSummary(result);

    } catch (error) {
      console.error(chalk.red('エラーが発生しました:'), error);
      result.validated = false;
    }

    return result;
  }

  /**
   * クラスタ情報を見やすく表示
   * KISS原則: シンプルな表示フォーマット
   */
  formatClusterDisplay(cluster: DomainCluster): string {
    // Defensive Programming: NaN/undefined対応
    const confidence = isNaN(cluster.confidence) ? 'N/A' : `${Math.round(cluster.confidence * 100)}%`;
    const color = this.getConfidenceColor(cluster.confidence);
    
    const lines = [
      chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'),
      chalk.bold(`📦 ドメイン: ${cluster.name}`),
      `🎯 信頼度: ${chalk[color](confidence)}`,
      `🔑 キーワード: ${this.formatKeywords(cluster.keywords)}`,
      `📄 関連ファイル: ${cluster.files.length} files`,
      chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    ];

    return lines.join('\n');
  }

  /**
   * 信頼度に応じた色を取得
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  }

  /**
   * キーワードをフォーマット
   */
  private formatKeywords(keywords: string[]): string {
    const maxDisplay = this.config.maxDisplayKeywords || 10;
    const displayKeywords = keywords.slice(0, maxDisplay);
    const formatted = displayKeywords.join(', ');
    
    if (keywords.length > maxDisplay) {
      return `${formatted}, ... (他${keywords.length - maxDisplay}個)`;
    }
    
    return formatted;
  }

  /**
   * クラスタを修正
   */
  private async modifyCluster(cluster: DomainCluster): Promise<DomainCluster> {
    const { newName, newKeywords } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newName',
        message: '新しいドメイン名:',
        default: cluster.name,
        validate: (input: string) => this.isValidDomainName(input) || '有効なドメイン名を入力してください'
      },
      {
        type: 'input',
        name: 'newKeywords',
        message: 'キーワード (カンマ区切り):',
        default: cluster.keywords.join(', '),
        validate: (input: string) => {
          const keywords = input.split(',').map(k => k.trim()).filter(k => k);
          return this.isValidKeywords(keywords) || '有効なキーワードリストを入力してください';
        }
      }
    ]);

    const keywords = newKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);

    return {
      ...cluster,
      name: newName,
      keywords
    };
  }

  /**
   * 新しいドメインを作成
   */
  private async createNewDomain(): Promise<DomainCluster> {
    const { name, keywords: keywordsStr } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '新しいドメイン名:',
        validate: (input: string) => this.isValidDomainName(input) || '有効なドメイン名を入力してください'
      },
      {
        type: 'input',
        name: 'keywords',
        message: 'キーワード (カンマ区切り):',
        validate: (input: string) => {
          const keywords = input.split(',').map(k => k.trim()).filter(k => k);
          return this.isValidKeywords(keywords) || '有効なキーワードリストを入力してください';
        }
      }
    ]);

    const keywords = keywordsStr.split(',').map((k: string) => k.trim()).filter((k: string) => k);

    return {
      id: `custom-${Date.now()}`,
      name,
      keywords,
      confidence: 1.0, // ユーザー定義なので信頼度100%
      files: []
    };
  }

  /**
   * ドメイン名の妥当性を検証
   * Defensive Programming: 入力検証
   */
  isValidDomainName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  }

  /**
   * キーワードリストの妥当性を検証
   * Defensive Programming: 入力検証
   */
  isValidKeywords(keywords: string[]): boolean {
    if (!keywords || !Array.isArray(keywords)) return false;
    if (keywords.length === 0 || keywords.length > 10) return false;
    return keywords.every(k => k && typeof k === 'string' && k.trim().length > 0);
  }

  /**
   * クラスタを安全にクローン
   * Defensive Programming: 循環参照対策
   */
  private cloneCluster(cluster: DomainCluster): DomainCluster {
    try {
      return {
        id: cluster.id,
        name: cluster.name,
        keywords: [...cluster.keywords],
        confidence: cluster.confidence,
        files: [...cluster.files]
      };
    } catch {
      // 循環参照などのエラーの場合は最小限の情報を返す
      return {
        id: cluster.id || 'unknown',
        name: cluster.name || 'Unknown Domain',
        keywords: [],
        confidence: 0,
        files: []
      };
    }
  }

  /**
   * 検証結果のサマリーを表示
   */
  private printSummary(result: UserValidationResult): void {
    console.log(chalk.bold('📊 検証結果サマリー:'));
    console.log(chalk.green(`  ✅ 承認: ${result.approvedDomains.length}個`));
    console.log(chalk.yellow(`  ✏️  修正: ${result.modifiedDomains.length}個`));
    console.log(chalk.red(`  ❌ 拒否: ${result.rejectedDomains.length}個`));
  }
}