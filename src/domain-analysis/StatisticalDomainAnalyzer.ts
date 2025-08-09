/**
 * Statistical Domain Analyzer
 * v0.9.0 - 統計的ドメイン分析エンジン
 * 
 * KISS原則: シンプルな実装から開始
 * YAGNI原則: 必要最小限の機能のみ実装
 */

import {
  DomainAnalysisConfig,
  DomainAnalysisResult,
  DomainCluster,
  KeywordInfo,
  ClusteringConfig
} from './types';
import { TreeSitterParser } from '../intent-analysis/TreeSitterParser';
import { HybridParser } from '../intent-analysis/HybridParser';
import { MultilingualKeywordExtractor } from './MultilingualKeywordExtractor';
import { DomainClusterer } from './DomainClusterer';
import * as fs from 'fs/promises';
import { isError, getErrorMessage } from '../utils/errorGuards';
import * as path from 'path';
import { glob } from 'glob';

/**
 * 統計的ドメイン分析器
 * SOLID原則: 単一責任の原則
 */
export class StatisticalDomainAnalyzer {
  private config: DomainAnalysisConfig;
  private parser: TreeSitterParser;
  private hybridParser: HybridParser;
  private keywordExtractor: MultilingualKeywordExtractor;
  private domainClusterer: DomainClusterer;

  constructor(config?: Partial<DomainAnalysisConfig>) {
    // デフォルト設定とマージ
    const defaultConfig: DomainAnalysisConfig = {
      projectPath: process.cwd(),
      excludePatterns: ['node_modules', 'dist', 'coverage', '.git'],
      supportedExtensions: ['.ts', '.js', '.tsx', '.jsx'],
      minKeywordFrequency: 2,
      maxClusters: 5
    };
    
    // Defensive Programming: より堅牢なマージロジック
    this.config = {
      projectPath: config?.projectPath ?? defaultConfig.projectPath,
      excludePatterns: config?.excludePatterns !== undefined 
        ? (Array.isArray(config.excludePatterns) ? config.excludePatterns : [])
        : defaultConfig.excludePatterns,
      supportedExtensions: config?.supportedExtensions !== undefined
        ? (Array.isArray(config.supportedExtensions) ? config.supportedExtensions : [])
        : defaultConfig.supportedExtensions,
      minKeywordFrequency: config?.minKeywordFrequency ?? defaultConfig.minKeywordFrequency,
      maxClusters: config?.maxClusters ?? defaultConfig.maxClusters
    };
    
    // 各コンポーネントのインスタンスを作成
    this.parser = TreeSitterParser.getInstance();
    this.hybridParser = new HybridParser({
      enableFallback: true,
      enableSmartTruncation: true,
      enableWarnings: false
    });
    this.keywordExtractor = new MultilingualKeywordExtractor();
    this.domainClusterer = new DomainClusterer();
  }

  /**
   * 設定を取得
   */
  public getConfig(): DomainAnalysisConfig {
    return { ...this.config };
  }

  /**
   * ソースファイルを収集
   * DRY原則: globパターンの再利用
   * Defensive Programming: 配列の存在を確認
   */
  public async collectSourceFiles(): Promise<string[]> {
    // 配列の存在を確認
    if (!Array.isArray(this.config.supportedExtensions) || this.config.supportedExtensions.length === 0) {
      return [];
    }
    
    const patterns = this.config.supportedExtensions.map(
      ext => `${this.config.projectPath}/**/*${ext}`
    );
    
    const ignorePatterns = Array.isArray(this.config.excludePatterns)
      ? this.config.excludePatterns.map(pattern => `**/${pattern}/**`)
      : [];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        ignore: ignorePatterns,
        absolute: true
      });
      files.push(...matches);
    }
    
    return files;
  }

  /**
   * ファイルからトークンを抽出
   * Defensive Programming: エラーハンドリング
   * v0.9.0: 多言語キーワード抽出を統合
   */
  public async extractTokensFromFile(filePath: string): Promise<string[]> {
    try {
      // ファイル内容を読み込み
      const content = await fs.readFile(filePath, 'utf-8');
      
      // HybridParserを使用してASTを取得
      const parseResult = await this.hybridParser.parseFile(filePath);
      const ast = parseResult.ast;
      
      // パースメタデータをログ（デバッグ用）
      if (parseResult.metadata.truncated || parseResult.metadata.strategy === 'babel') {
        // 32KB超過や切り詰めが発生した場合の記録（将来の分析用）
      }
      
      if (!ast) {
        // ASTが取得できない場合はファイル内容全体を使用
        const result = await this.keywordExtractor.extractKeywords(content);
        return result.keywords;
      }
      
      // ASTから識別子を抽出
      const identifiers: string[] = [];
      this.extractTokensFromNode(ast, identifiers);
      
      // コメントと文字列リテラルからも多言語キーワードを抽出
      const textContent = this.extractTextContent(content);
      const textKeywords = await this.keywordExtractor.extractKeywords(textContent);
      
      // 識別子とキーワードを結合
      const allTokens = [...identifiers, ...textKeywords.keywords];
      
      // 重複を除去
      return Array.from(new Set(allTokens));
    } catch (error: unknown) {
      // 32KB制限エラーの場合は警告を出さない
      const errorMessage = getErrorMessage(error);
      if (!errorMessage.includes('Invalid argument')) {
        console.warn(`Failed to extract tokens from ${filePath}:`, errorMessage);
      }
      // エラー時も基本的なトークン抽出を試みる
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const result = await this.keywordExtractor.extractKeywords(content);
        return result.keywords;
      } catch {
        return [];
      }
    }
  }

  /**
   * テキストコンテンツ（コメントなど）を抽出
   */
  private extractTextContent(content: string): string {
    // 単一行コメント（//）と複数行コメント（/* */）を抽出
    const singleLineComments = content.match(/\/\/.*$/gm) || [];
    const multiLineComments = content.match(/\/\*[\s\S]*?\*\//gm) || [];
    
    // コメントの内容を結合
    const comments = [...singleLineComments, ...multiLineComments]
      .map(comment => comment.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').replace(/\s*\*\/$/, ''))
      .join(' ');
    
    return comments;
  }

  /**
   * ASTノードからトークンを再帰的に抽出
   */
  private extractTokensFromNode(node: unknown, tokens: string[]): void {
    // nodeがオブジェクトであることを確認
    if (!node || typeof node !== 'object') {
      return;
    }
    
    const nodeObj = node as Record<string, unknown>;
    
    // 識別子、クラス名、関数名などを抽出
    if (nodeObj.type === 'identifier' || 
        nodeObj.type === 'property_identifier' ||
        nodeObj.type === 'type_identifier') {
      if (typeof nodeObj.text === 'string' && nodeObj.text.length > 2) { // 2文字以上のトークンのみ
        tokens.push(nodeObj.text);
      }
    }
    
    // 子ノードを再帰的に処理
    if (nodeObj.children && Array.isArray(nodeObj.children)) {
      for (const child of nodeObj.children) {
        this.extractTokensFromNode(child, tokens);
      }
    }
  }

  /**
   * トークンの頻度を計算
   */
  public calculateTokenFrequencies(tokens: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    for (const token of tokens) {
      const count = frequencies.get(token) || 0;
      frequencies.set(token, count + 1);
    }
    
    return frequencies;
  }

  /**
   * 低頻度トークンをフィルタリング
   */
  public filterLowFrequencyTokens(
    frequencies: Map<string, number>,
    minFrequency: number
  ): Map<string, number> {
    const filtered = new Map<string, number>();
    
    for (const [token, freq] of frequencies) {
      if (freq >= minFrequency) {
        filtered.set(token, freq);
      }
    }
    
    return filtered;
  }

  /**
   * プロジェクト全体を分析
   * KISS原則: 段階的な処理
   * v0.9.0: DomainClustererとMultilingualKeywordExtractorを統合
   */
  public async analyze(): Promise<DomainAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // プロジェクトパスの存在確認
      await fs.access(this.config.projectPath);
    } catch {
      throw new Error(`Project path does not exist: ${this.config.projectPath}`);
    }
    
    // ファイル収集
    const files = await this.collectSourceFiles();
    
    // 全ファイルからトークンを抽出（多言語対応）
    const allTokens: string[] = [];
    const fileTokenMap = new Map<string, string[]>();
    const languageDistribution = new Map<string, number>();
    
    for (const file of files) {
      const tokens = await this.extractTokensFromFile(file);
      allTokens.push(...tokens);
      fileTokenMap.set(file, tokens);
      
      // 言語分布を記録（ファイル内容から判定）
      try {
        const content = await fs.readFile(file, 'utf-8');
        const langResult = await this.keywordExtractor.detectLanguage(content);
        const count = languageDistribution.get(langResult.language) || 0;
        languageDistribution.set(langResult.language, count + 1);
      } catch {
        // エラーは無視
      }
    }
    
    // トークン頻度計算
    const frequencies = this.calculateTokenFrequencies(allTokens);
    const filtered = this.filterLowFrequencyTokens(
      frequencies, 
      this.config.minKeywordFrequency
    );
    
    // キーワード情報を構築
    const keywords = new Map<string, KeywordInfo>();
    for (const [token, freq] of filtered) {
      const relatedFiles = Array.from(fileTokenMap.entries())
        .filter(([_, tokens]) => tokens.includes(token))
        .map(([file, _]) => file);
      
      keywords.set(token, {
        keyword: token,
        frequency: freq,
        files: relatedFiles
      });
    }
    
    // DomainClustererを使用した高度なクラスタリング
    let domains: DomainCluster[];
    if (keywords.size > 0) {
      // 最適なクラスタ数を決定
      const clusteringConfig: ClusteringConfig = {
        k: Math.min(this.config.maxClusters, Math.max(2, Math.floor(Math.sqrt(keywords.size / 2)))),
        maxIterations: 100,
        tolerance: 0.001
      };
      
      // クラスタリング実行
      domains = this.domainClusterer.clusterFromKeywords(keywords, clusteringConfig);
    } else {
      domains = [];
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      domains,
      keywords,
      timestamp: new Date(),
      metadata: {
        totalFiles: files.length,
        totalTokens: allTokens.length,
        executionTime,
        languageDistribution
      }
    };
  }

  /**
   * 簡易ドメインクラスタ作成（暫定実装）
   * YAGNI原則: 必要になるまで高度な実装は避ける
   */
  private createSimpleDomains(keywords: Map<string, KeywordInfo>): DomainCluster[] {
    const domains: DomainCluster[] = [];
    
    // キーワードを頻度でソート
    const sortedKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, this.config.maxClusters * 10); // 上位キーワードのみ使用
    
    // 簡易的なドメイングループ化（パターンマッチング）
    const domainPatterns = [
      { pattern: /user|auth|login|account/i, name: 'user-management' },
      { pattern: /payment|pay|transaction|billing/i, name: 'payment' },
      { pattern: /order|cart|checkout/i, name: 'order-management' },
      { pattern: /product|item|inventory/i, name: 'product-management' },
      { pattern: /test|spec|mock|stub/i, name: 'testing' }
    ];
    
    for (const { pattern, name } of domainPatterns) {
      const domainKeywords = sortedKeywords
        .filter(([keyword]) => pattern.test(keyword))
        .map(([keyword]) => keyword);
      
      if (domainKeywords.length > 0) {
        const relatedFiles = new Set<string>();
        for (const keyword of domainKeywords) {
          const info = keywords.get(keyword);
          if (info) {
            info.files.forEach(file => relatedFiles.add(file));
          }
        }
        
        domains.push({
          id: `domain-${domains.length + 1}`,
          name,
          keywords: domainKeywords,
          confidence: 0.7, // 暫定的な信頼度
          files: Array.from(relatedFiles)
        });
      }
    }
    
    return domains;
  }
}