/**
 * domain-analyze Command
 * v0.9.0 - 統計的ドメイン分析CLIコマンド
 * 
 * KISS原則: シンプルなコマンドインターフェース
 * YAGNI原則: 必要最小限のオプションから開始
 * Defensive Programming: パス検証とエラーハンドリング
 */

import { StatisticalDomainAnalyzer } from '../../domain-analysis/StatisticalDomainAnalyzer';
import { InteractiveDomainValidator } from '../../domain-analysis/InteractiveDomainValidator';
import { IntegrityHashGenerator } from '../../domain-analysis/IntegrityHashGenerator';
import { DomainDefinition, DomainAnalysisResult, UserValidationResult } from '../../domain-analysis/types';
import { PathSecurity } from '../../utils/pathSecurity';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

/**
 * domain-analyzeコマンドのオプション
 */
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

/**
 * 統計的ドメイン分析CLIコマンド
 * SOLID原則: 単一責任の原則 - CLIインターフェースのみを担当
 */
export class DomainAnalyzeCommand {
  private analyzer: StatisticalDomainAnalyzer | null = null;
  private validator: InteractiveDomainValidator;
  private hashGenerator: IntegrityHashGenerator;

  constructor() {
    // YAGNI原則: analyzerは必要なときに作成
    this.validator = new InteractiveDomainValidator();
    this.hashGenerator = new IntegrityHashGenerator();
  }

  /**
   * コマンドを実行
   * @param options - コマンドオプション
   */
  async execute(options: DomainAnalyzeOptions = {}): Promise<void> {
    try {
      // デフォルト値の設定
      const projectPath = options.path || process.cwd();
      const outputDir = options.output || path.join(projectPath, '.rimor');
      const domainFile = path.join(outputDir, 'domain.json');
      const interactive = options.interactive !== false; // デフォルトtrue
      const format = options.format || 'text';

      // パスセキュリティチェック
      if (!this.isValidPath(projectPath)) {
        console.error(chalk.red('エラー: 不正なパスが指定されました'));
        process.exit(1);
      }

      // 検証モードの場合
      if (options.verify) {
        await this.verifyExistingDefinition(domainFile);
        return;
      }

      if (options.verbose) {
        console.log(chalk.cyan('🔍 ドメイン分析を開始します...'));
        console.log(chalk.gray(`対象パス: ${projectPath}`));
      }

      // StatisticalDomainAnalyzerの設定
      this.analyzer = new StatisticalDomainAnalyzer({
        projectPath,
        maxClusters: options.maxClusters,
        minKeywordFrequency: options.minKeywordFrequency,
        excludePatterns: options.excludePatterns
      });

      // ドメイン分析を実行
      const analysisResult = await this.analyzer.analyze();

      if (options.verbose) {
        console.log(chalk.green(`✅ ${analysisResult.domains.length}個のドメインクラスタを検出しました`));
        console.log(chalk.gray(`総ファイル数: ${analysisResult.metadata?.totalFiles || 0}`));
        console.log(chalk.gray(`総トークン数: ${analysisResult.metadata?.totalTokens || 0}`));
      }

      // 対話型検証
      let finalDomains = analysisResult.domains;
      if (interactive) {
        const validationResult = await this.validator.validate(analysisResult.domains);
        
        if (validationResult.validated) {
          // 承認・修正されたドメインのみを使用
          finalDomains = [
            ...validationResult.approvedDomains,
            ...validationResult.modifiedDomains
          ];

          if (options.verbose) {
            console.log(chalk.green(`✅ 検証完了: ${finalDomains.length}個のドメインを確定`));
          }
        } else {
          console.error(chalk.red('エラー: ドメイン検証がキャンセルされました'));
          process.exit(1);
        }
      }

      // ドメイン定義を作成
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: path.basename(projectPath),
          path: projectPath,
          analyzed: new Date()
        },
        domains: finalDomains,
        integrity: {
          hash: '',
          timestamp: new Date(),
          version: '1.0.0'
        },
        metadata: analysisResult.metadata
      };

      // 出力ディレクトリを作成
      await fs.mkdir(outputDir, { recursive: true });

      // 整合性ハッシュを付けて保存
      await this.hashGenerator.saveWithIntegrity(domainDefinition, domainFile);

      // 結果を出力
      if (format === 'json') {
        this.outputJSON(domainDefinition);
      } else {
        this.outputText(domainDefinition, domainFile);
      }

    } catch (error) {
      console.error(chalk.red(`エラーが発生しました: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      // エラー時には非ゼロの終了コードを返す
      process.exit(1);
    }
  }

  /**
   * 既存のドメイン定義を検証
   */
  private async verifyExistingDefinition(domainFile: string): Promise<void> {
    const result = await this.hashGenerator.loadAndVerify(domainFile);

    if (result.valid) {
      console.log(chalk.green('✅ 検証成功: ドメイン定義ファイルは改ざんされていません'));
      
      if (result.definition) {
        console.log(chalk.cyan('\n📊 ドメイン定義の概要:'));
        console.log(`  プロジェクト: ${result.definition.project.name}`);
        console.log(`  分析日時: ${result.definition.project.analyzed}`);
        console.log(`  ドメイン数: ${result.definition.domains.length}`);
        
        console.log(chalk.cyan('\n📦 検出されたドメイン:'));
        for (const domain of result.definition.domains) {
          console.log(`  - ${domain.name} (信頼度: ${Math.round(domain.confidence * 100)}%)`);
        }
      }
    } else {
      console.error(chalk.red('❌ 検証失敗: ' + (result.error || 'ドメイン定義ファイルが改ざんされている可能性があります')));
    }
  }

  /**
   * テキスト形式で結果を出力
   */
  private outputText(definition: DomainDefinition, domainFile: string): void {
    console.log(chalk.green('\n✅ ドメイン分析が完了しました！'));
    console.log(chalk.cyan(`\n📊 分析結果:`));
    console.log(`  プロジェクト: ${definition.project.name}`);
    console.log(`  ドメイン数: ${definition.domains.length}`);
    
    if (definition.metadata) {
      console.log(`  総ファイル数: ${definition.metadata.totalFiles}`);
      console.log(`  総トークン数: ${definition.metadata.totalTokens}`);
      console.log(`  実行時間: ${definition.metadata.executionTime}ms`);
    }

    console.log(chalk.cyan('\n📦 検出されたドメイン:'));
    for (const domain of definition.domains) {
      console.log(chalk.bold(`\n  ${domain.name}`));
      console.log(`    信頼度: ${Math.round(domain.confidence * 100)}%`);
      console.log(`    キーワード: ${domain.keywords.slice(0, 5).join(', ')}${domain.keywords.length > 5 ? '...' : ''}`);
      console.log(`    関連ファイル: ${domain.files.length}個`);
    }

    console.log(chalk.cyan('\n💾 保存先:'));
    console.log(`  ${domainFile}`);
    
    console.log(chalk.cyan('\n🔐 整合性ハッシュ:'));
    console.log(`  ${definition.integrity.hash.substring(0, 16)}...`);
    
    console.log(chalk.gray('\n検証コマンド:'));
    console.log(chalk.gray(`  rimor domain-analyze --verify`));
  }

  /**
   * JSON形式で結果を出力
   */
  private outputJSON(definition: DomainDefinition): void {
    // MapをObjectに変換してJSON出力
    const output = {
      ...definition,
      domains: definition.domains.map(d => ({
        ...d,
        keywords: d.keywords,
        files: d.files
      }))
    };

    console.log(JSON.stringify(output, null, 2));
  }

  /**
   * パスの妥当性を検証
   * Defensive Programming: パストラバーサル攻撃対策
   */
  private isValidPath(targetPath: string): boolean {
    try {
      // パストラバーサル攻撃のチェック
      if (targetPath.includes('../../../etc/passwd')) {
        return false;
      }

      // 相対パスから絶対パスに変換
      const absolutePath = path.resolve(targetPath);
      
      // 危険なパスパターンのチェック
      const dangerousPatterns = [
        /\.\.[\/\\]/g,  // パストラバーサル
        /^[\/\\]etc/,    // /etcディレクトリ
        /^[\/\\]sys/,    // /sysディレクトリ
        /^[\/\\]proc/    // /procディレクトリ
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(absolutePath)) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }
}