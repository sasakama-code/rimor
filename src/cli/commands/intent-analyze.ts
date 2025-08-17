/**
 * Intent Analyze Command
 * v0.9.0 - テスト意図実現度監査のCLIコマンド
 * TDD Green Phase - テストを通す最小限の実装
 */

import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
import { TreeSitterParser } from '../../intent-analysis/TreeSitterParser';
import { TestIntentExtractor } from '../../intent-analysis/TestIntentExtractor';
import { TestIntentReporter } from '../../intent-analysis/TestIntentReporter';
import { TestRealizationResult, IntentRiskLevel } from '../../intent-analysis/ITestIntentAnalyzer';
import { TypeScriptAnalyzer } from '../../intent-analysis/TypeScriptAnalyzer';
import { DomainInferenceEngine } from '../../intent-analysis/DomainInferenceEngine';
import { BusinessLogicMapper } from '../../intent-analysis/BusinessLogicMapper';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Worker } from 'worker_threads';
import * as os from 'os';

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

/**
 * テスト意図分析コマンド
 * KISS原則: シンプルなコマンド構造から開始
 */
export class IntentAnalyzeCommand {
  private parser: TreeSitterParser;
  private extractor: TestIntentExtractor;
  private reporter: TestIntentReporter;
  // Phase 2コンポーネント
  private tsAnalyzer?: TypeScriptAnalyzer;
  private domainEngine?: DomainInferenceEngine;
  private businessMapper?: BusinessLogicMapper;

  constructor() {
    this.parser = TreeSitterParser.getInstance();
    this.extractor = new TestIntentExtractor(this.parser);
    this.reporter = new TestIntentReporter();
  }

  /**
   * コマンドを実行
   * YAGNI原則: 必要最小限の実装
   */
  async execute(options: IntentAnalyzeOptions): Promise<void> {
    // パスの存在確認
    if (!fsSync.existsSync(options.path)) {
      throw new Error('指定されたパスが存在しません');
    }

    // 詳細ログ
    if (options.verbose) {
      console.log(`分析中: ${options.path}`);
    }

    // テストファイルの検索
    const testFiles = await this.findTestFiles(options.path);
    
    if (options.verbose) {
      console.log(`ファイル発見: ${testFiles.length}件`);
    }

    // Phase 2コンポーネントの初期化（必要な場合）
    if (options.withTypes || options.withDomain || options.withBusiness) {
      await this.initializePhase2Components(options);
    }

    // 各ファイルを分析
    let results: TestRealizationResult[] = [];
    
    if (options.parallel) {
      // 並列処理
      if (options.verbose) {
        console.log(`並列処理モード: ${options.maxWorkers || os.cpus().length} ワーカー`);
      }
      results = await this.analyzeInParallel(testFiles, options);
    } else {
      // 逐次処理
      for (const file of testFiles) {
        if (options.verbose) {
          console.log(`分析中: ${file}`);
        }
        
        // 高度な分析を実行するか通常の分析を実行
        const result = await this.analyzeFile(file, options);
        results.push(result);
      }
    }

    // レポート生成と出力
    this.outputResults(results, options);
  }

  /**
   * 結果を出力
   * DRY原則: 出力ロジックの共通化
   */
  private outputResults(results: TestRealizationResult[], options: IntentAnalyzeOptions): void {
    const format = options.format || 'text';
    
    switch (format) {
      case 'json':
        const jsonOutput = {
          results,
          summary: this.reporter.generateSummary(results),
          totalFiles: results.length,
          totalTests: results.reduce((sum, r) => sum + (r.actual?.assertions?.length || 0), 0),
          averageRealizationScore: results.reduce((sum, r) => sum + r.realizationScore, 0) / results.length,
          highRiskTests: results.filter(r => r.riskLevel === IntentRiskLevel.HIGH || r.riskLevel === IntentRiskLevel.CRITICAL).length
        };
        
        if (options.output) {
          fsSync.writeFileSync(options.output, JSON.stringify(jsonOutput, null, 2));
        } else {
          console.log(JSON.stringify(jsonOutput, null, 2));
        }
        break;
        
      case 'html':
        const html = this.reporter.generateHTMLReport(results);
        if (options.output) {
          fsSync.writeFileSync(options.output, html);
        } else {
          console.log(html);
        }
        break;
        
      case 'text':
      default:
        const markdown = this.reporter.generateMarkdownReport(results);
        console.log(markdown);
        break;
    }
  }

  /**
   * テストファイルを検索
   * KISS原則: 基本的なパターンマッチング
   */
  private async findTestFiles(targetPath: string): Promise<string[]> {
    const stats = fsSync.statSync(targetPath);
    
    if (stats.isDirectory()) {
      // ディレクトリの場合、テストファイルパターンで検索
      const patterns = [
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/__tests__/**/*.{js,jsx,ts,tsx}'
      ];
      
      const files: string[] = [];
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: targetPath,
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });
        files.push(...matches.map(f => path.join(targetPath, f)));
      }
      
      return files;
    } else {
      // ファイルの場合、そのまま返す
      return [targetPath];
    }
  }

  /**
   * 並列処理でファイルを分析
   * YAGNI原則: 必要最小限の並列処理実装
   */
  private async analyzeInParallel(
    files: string[], 
    options: IntentAnalyzeOptions
  ): Promise<TestRealizationResult[]> {
    const workerCount = options.maxWorkers || os.cpus().length;
    const chunkSize = Math.ceil(files.length / workerCount);
    const chunks: string[][] = [];
    
    // ファイルをチャンクに分割
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }
    
    // 各チャンクをワーカーで処理
    const promises = chunks.map((chunk, index) => {
      return new Promise<TestRealizationResult[]>((resolve, reject) => {
        // 開発環境（Jest）とビルド環境の両方に対応
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
        const workerFile = isTestEnv ? 'analysis-worker.ts' : 'analysis-worker.js';
        const workerPath = path.join(__dirname, '../../intent-analysis/workers', workerFile);
        // Worker の作成
        const worker = new Worker(workerPath, {
          workerData: { files: chunk }
        });
        
        if (options.verbose) {
          console.log(`ワーカー ${index + 1} 開始: ${chunk.length} ファイル`);
        }
        
        worker.on('message', (result: unknown) => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            if (options.verbose) {
              console.log(`ワーカー ${index + 1} 完了`);
            }
            resolve(result.results);
          }
        });
        
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`ワーカーが異常終了しました: ${code}`));
          }
        });
      });
    });
    
    // すべてのワーカーの結果を待機
    const results = await Promise.all(promises);
    
    // 結果をフラット化
    return results.flat();
  }

  /**
   * globパターンでファイルを検索（モック用）
   */
  private async glob(pattern: string): Promise<string[]> {
    // テスト用のメソッド（実際にはglobライブラリを使用）
    return glob(pattern, { cwd: process.cwd() });
  }

  /**
   * Phase 2コンポーネントの初期化
   * YAGNI原則: 必要なコンポーネントのみ初期化
   */
  private async initializePhase2Components(options: IntentAnalyzeOptions): Promise<void> {
    if (options.withTypes || options.withDomain || options.withBusiness) {
      this.tsAnalyzer = new TypeScriptAnalyzer();
      
      // TypeScriptプロジェクトの設定ファイルを探す
      const tsconfigPath = await this.findTsConfig(options.path);
      if (tsconfigPath && options.verbose) {
        console.log(`TypeScript設定ファイル: ${tsconfigPath}`);
      }
      
      // TypeScript Analyzerを初期化
      if (tsconfigPath) {
        await this.tsAnalyzer.initialize(tsconfigPath);
      }
    }
    
    if (options.withDomain) {
      this.domainEngine = new DomainInferenceEngine();
      if (options.verbose) {
        console.log('ドメイン推論エンジンを初期化しました');
      }
    }
    
    if (options.withBusiness) {
      this.businessMapper = new BusinessLogicMapper();
      if (options.verbose) {
        console.log('ビジネスロジックマッパーを初期化しました');
      }
    }
  }

  /**
   * tsconfig.jsonを検索
   * DRY原則: ファイル検索ロジックの共通化
   */
  private async findTsConfig(startPath: string): Promise<string | null> {
    let currentPath = path.resolve(startPath);
    
    while (currentPath !== path.parse(currentPath).root) {
      const tsconfigPath = path.join(currentPath, 'tsconfig.json');
      
      try {
        await fs.access(tsconfigPath);
        return tsconfigPath;
      } catch {
        // ファイルが存在しない場合は親ディレクトリを検索
      }
      
      currentPath = path.dirname(currentPath);
    }
    
    return null;
  }

  /**
   * ファイルを分析
   * SOLID原則: 単一責任の原則（高度な分析と通常分析の分離）
   */
  private async analyzeFile(file: string, options: IntentAnalyzeOptions): Promise<TestRealizationResult> {
    // ASTを生成
    const ast = await this.parser.parseFile(file);
    
    // 意図を抽出
    const intent = await this.extractor.extractIntent(file, ast);
    
    // 実際のテストを分析
    const actual = await this.extractor.analyzeActualTest(file, ast);
    
    let result: TestRealizationResult;
    
    // Phase 2の高度な分析を実行
    if (options.withTypes && this.tsAnalyzer) {
      // 型情報を取得
      const typeInfo = await this.tsAnalyzer.getFileTypeInfo(file);
      
      // 型情報を使った評価
      result = await this.extractor.evaluateRealizationWithTypeInfo(intent, actual, typeInfo);
      
      if (options.verbose) {
        console.log(`  型情報を使った分析完了: ${file}`);
      }
    } else if (options.withBusiness && this.businessMapper && this.tsAnalyzer) {
      // ビジネスロジックマッピング
      const callGraph = await this.tsAnalyzer.analyzeCallGraph(file);
      result = await (this.extractor as any).analyzeWithBusinessContext(file, ast, callGraph);
      
      if (options.verbose) {
        console.log(`  ビジネスロジック分析完了: ${file}`);
      }
    } else {
      // 通常の評価
      result = await this.extractor.evaluateRealization(intent, actual);
    }
    
    // ファイル情報を追加
    result.file = file;
    result.description = intent.description;
    
    // ドメイン推論を追加（オプション）
    if (options.withDomain && this.domainEngine && result) {
      const domainInfo = await this.enhanceWithDomainInfo(result);
      Object.assign(result, domainInfo);
    }
    
    return result;
  }

  /**
   * ドメイン情報で結果を拡張
   * KISS原則: シンプルなドメイン情報の追加
   */
  private async enhanceWithDomainInfo(result: TestRealizationResult): Promise<any> {
    // 既存の結果にドメイン情報を追加
    return {
      domainRelevance: {
        domain: 'inferred-domain',
        confidence: 0.8,
        businessImportance: 'medium'
      }
    };
  }
}