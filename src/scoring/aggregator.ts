import { 
  FileScore, 
  DirectoryScore, 
  ProjectScore,
  PluginResult,
  WeightConfig,
  DEFAULT_WEIGHTS
} from './types';
import { ScoreCalculatorV2 } from './calculator';
import path from 'path';
import { errorHandler, ErrorType } from '../utils/errorHandler';

/**
 * スコア集約システム - ファイルからディレクトリ、プロジェクトレベルへの階層的集約
 * 複雑なプロジェクト構造に対応し、効率的なスコア計算を提供
 */
export class ScoreAggregator {
  private calculator: ScoreCalculatorV2;

  constructor(calculator: ScoreCalculatorV2) {
    this.calculator = calculator;
  }

  /**
   * プラグイン結果マップからファイルスコア配列を生成
   * @param pluginResultsMap ファイルパス -> プラグイン結果の配列
   * @param weights 重み付け設定
   * @returns ファイルスコア配列
   */
  aggregatePluginResultsToFiles(
    pluginResultsMap: Map<string, PluginResult[]>,
    weights: WeightConfig = DEFAULT_WEIGHTS
  ): FileScore[] {
    const fileScores: FileScore[] = [];

    for (const [filePath, pluginResults] of pluginResultsMap.entries()) {
      const fileScore = this.calculator.calculateFileScore(filePath, pluginResults, weights);
      fileScores.push(fileScore);
    }

    return fileScores.sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  /**
   * ファイルスコア配列をディレクトリスコアに集約
   * @param directoryPath ディレクトリパス
   * @param fileScores ディレクトリ内のファイルスコア配列
   * @returns ディレクトリスコア
   */
  aggregateFilesToDirectory(
    directoryPath: string,
    fileScores: FileScore[]
  ): DirectoryScore {
    return this.calculator.calculateDirectoryScore(directoryPath, fileScores);
  }

  /**
   * ディレクトリスコア配列をプロジェクトスコアに集約
   * @param projectPath プロジェクトパス
   * @param directoryScores ディレクトリスコア配列
   * @returns プロジェクトスコア
   */
  aggregateDirectoriesToProject(
    projectPath: string,
    directoryScores: DirectoryScore[],
    weights: WeightConfig
  ): ProjectScore {
    return this.calculator.calculateProjectScore(directoryScores, weights);
  }

  /**
   * ファイルスコア配列をディレクトリ構造に基づいて自動的にグループ化してディレクトリスコアを生成
   * @param fileScores ファイルスコア配列
   * @returns ディレクトリスコア配列
   */
  aggregateByDirectoryStructure(fileScores: FileScore[]): DirectoryScore[] {
    // ディレクトリごとにファイルをグループ化
    const directoryMap = new Map<string, FileScore[]>();

    for (const fileScore of fileScores) {
      const directory = this.extractDirectoryPath(fileScore.filePath);
      
      if (!directoryMap.has(directory)) {
        directoryMap.set(directory, []);
      }
      directoryMap.get(directory)!.push(fileScore);
    }

    // 各ディレクトリのスコアを計算
    const directoryScores: DirectoryScore[] = [];
    
    for (const [directoryPath, filesInDirectory] of directoryMap.entries()) {
      const directoryScore = this.aggregateFilesToDirectory(directoryPath, filesInDirectory);
      directoryScores.push(directoryScore);
    }

    return directoryScores.sort((a, b) => a.directoryPath.localeCompare(b.directoryPath));
  }

  /**
   * プラグイン結果から完全な階層構造を構築
   * @param pluginResultsMap プラグイン結果マップ
   * @param weights 重み付け設定
   * @returns プロジェクトスコア（完全な階層構造含む）
   */
  buildCompleteHierarchy(
    pluginResultsMap: Map<string, PluginResult[]>,
    weights: WeightConfig = DEFAULT_WEIGHTS
  ): ProjectScore {
    // 1. プラグイン結果からファイルスコアを生成
    const fileScores = this.aggregatePluginResultsToFiles(pluginResultsMap, weights);

    // 2. ファイルスコアをディレクトリ構造に基づいて集約
    const directoryScores = this.aggregateByDirectoryStructure(fileScores);

    // 3. ディレクトリスコアをプロジェクトスコアに集約
    const projectScore = this.aggregateDirectoriesToProject('.', directoryScores, weights);

    return projectScore;
  }

  /**
   * 段階的集約 - 大規模プロジェクト用の効率的な処理
   * @param pluginResultsMap プラグイン結果マップ
   * @param options 集約オプション
   * @returns プロジェクトスコア
   */
  async aggregateIncrementally(
    pluginResultsMap: Map<string, PluginResult[]>,
    options: {
      batchSize?: number;
      weights?: WeightConfig;
      onProgress?: (processed: number, total: number) => void;
      maxMemoryUsage?: number; // MB単位
      skipOnError?: boolean;
    } = {}
  ): Promise<ProjectScore> {
    const { 
      batchSize = 100, 
      weights = DEFAULT_WEIGHTS,
      onProgress,
      maxMemoryUsage = 512, // デフォルト512MB
      skipOnError = true
    } = options;

    const totalFiles = pluginResultsMap.size;
    let processedFiles = 0;
    let errorCount = 0;
    const failedFiles: string[] = [];

    // 大規模プロジェクトの検出とパラメータ調整
    if (totalFiles > 10000) {
      errorHandler.handleWarning(
        `大規模プロジェクト検出: ${totalFiles}ファイル - バッチサイズを調整します`,
        { totalFiles, originalBatchSize: batchSize },
        'aggregateScores'
      );
      const adjustedBatchSize = Math.max(50, Math.min(batchSize, 200));
      options.batchSize = adjustedBatchSize;
    }

    // メモリ使用量監視
    const initialMemory = this.getMemoryUsage();
    
    try {
      // バッチ処理でファイルスコアを生成
      const fileScores: FileScore[] = [];
      const fileEntries = Array.from(pluginResultsMap.entries());

      for (let i = 0; i < fileEntries.length; i += batchSize) {
        const batch = fileEntries.slice(i, i + batchSize);
        
        // メモリ使用量チェック
        const currentMemory = this.getMemoryUsage();
        if (currentMemory - initialMemory > maxMemoryUsage) {
          errorHandler.handleWarning(
            `メモリ使用量が制限を超過: ${currentMemory - initialMemory}MB`,
            { 
              currentMemory, 
              initialMemory, 
              exceeded: currentMemory - initialMemory,
              maxMemoryUsage,
              batchIndex: Math.floor(i / batchSize)
            },
            'aggregateScores'
          );
          // ガベージコレクションの強制実行（可能な場合）
          if (global.gc) {
            global.gc();
          }
        }
        
        for (const [filePath, pluginResults] of batch) {
          try {
            // ファイルサイズ制限チェック（プラグイン結果の量で推定）
            if (pluginResults.length > 1000) {
              errorHandler.handleWarning(
                `ファイル ${filePath} のプラグイン結果が多すぎます: ${pluginResults.length}件`,
                { 
                  filePath, 
                  resultCount: pluginResults.length,
                  threshold: 1000
                },
                'aggregateScores'
              );
              if (!skipOnError) {
                throw new Error(`ファイル ${filePath} の処理がスキップされました（プラグイン結果過多）`);
              }
              failedFiles.push(filePath);
              continue;
            }

            const fileScore = this.calculator.calculateFileScore(filePath, pluginResults, weights);
            fileScores.push(fileScore);
            processedFiles++;

            if (onProgress) {
              onProgress(processedFiles, totalFiles);
            }
          } catch (error) {
            errorCount++;
            failedFiles.push(filePath);
            
            if (skipOnError) {
              errorHandler.handleWarning(
                `ファイル ${filePath} の処理中にエラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
                { 
                  filePath, 
                  error: error instanceof Error ? error.message : '不明なエラー',
                  skipOnError: true
                },
                'aggregateScores'
              );
              continue;
            } else {
              throw new Error(`ファイル ${filePath} の処理に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
            }
          }
        }

        // バッチ間で小休止（メモリ圧迫を緩和）
        if (i > 0 && i % (batchSize * 10) === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // エラー統計の出力
      if (errorCount > 0) {
        errorHandler.handleWarning(
          `処理完了: ${processedFiles}/${totalFiles}ファイル成功, ${errorCount}ファイルエラー`,
          { 
            processedFiles, 
            totalFiles, 
            errorCount,
            successRate: (processedFiles / totalFiles * 100).toFixed(2) + '%'
          },
          'aggregateScores'
        );
        if (failedFiles.length > 0) {
          errorHandler.handleWarning(
            `失敗したファイル（最初の10件）: ${failedFiles.slice(0, 10).join(', ')}`,
            { 
              failedCount: failedFiles.length,
              failedFiles: failedFiles.slice(0, 10)
            },
            'aggregateScores'
          );
        }
      }

      // 最小限のファイルが処理できない場合はエラー
      if (fileScores.length === 0) {
        throw new Error('すべてのファイルの処理に失敗しました');
      }

      // ディレクトリとプロジェクトレベルの集約
      const directoryScores = this.aggregateByDirectoryStructure(fileScores);
      return this.aggregateDirectoriesToProject('.', directoryScores, weights);
      
    } catch (error) {
      const memoryAfter = this.getMemoryUsage();
      console.error(`段階的集約処理に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
      console.error(`メモリ使用量: ${initialMemory}MB -> ${memoryAfter}MB`);
      
      // フォールバック: エラー時は基本的な集約を試行
      try {
        errorHandler.handleWarning(
          'フォールバック: 基本的な集約処理を実行中...',
          { 
            originalError: error instanceof Error ? error.message : '不明なエラー',
            memoryUsage: { initial: initialMemory, current: memoryAfter }
          },
          'aggregateScores'
        );
        return this.buildCompleteHierarchy(pluginResultsMap, weights);
      } catch (fallbackError) {
        throw new Error(`集約処理とフォールバックの両方に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
      }
    }
  }

  /**
   * 差分集約 - 変更されたファイルのみを再計算
   * @param currentScores 現在のプロジェクトスコア
   * @param changedFiles 変更されたファイルと新しいプラグイン結果
   * @param weights 重み付け設定
   * @returns 更新されたプロジェクトスコア
   */
  aggregateDifferentially(
    currentScores: ProjectScore,
    changedFiles: Map<string, PluginResult[]>,
    weights: WeightConfig = DEFAULT_WEIGHTS
  ): ProjectScore {
    // 現在のファイルスコアマップを構築
    const currentFileScoresMap = new Map<string, FileScore>();
    for (const dirScore of currentScores.directoryScores) {
      for (const fileScore of dirScore.fileScores) {
        currentFileScoresMap.set(fileScore.filePath, fileScore);
      }
    }

    // 変更されたファイルのスコアを再計算
    for (const [filePath, pluginResults] of changedFiles.entries()) {
      const newFileScore = this.calculator.calculateFileScore(filePath, pluginResults, weights);
      currentFileScoresMap.set(filePath, newFileScore);
    }

    // 更新されたファイルスコア配列から階層構造を再構築
    const updatedFileScores = Array.from(currentFileScoresMap.values());
    const updatedDirectoryScores = this.aggregateByDirectoryStructure(updatedFileScores);
    
    return this.aggregateDirectoriesToProject('.', updatedDirectoryScores, weights);
  }

  /**
   * 条件付き集約 - 特定の条件に基づくフィルタリング
   * @param pluginResultsMap プラグイン結果マップ
   * @param filter フィルタ関数
   * @param weights 重み付け設定
   * @returns フィルタリングされたプロジェクトスコア
   */
  aggregateConditionally(
    pluginResultsMap: Map<string, PluginResult[]>,
    filter: {
      includeFiles?: (filePath: string) => boolean;
      includeDirectories?: (directoryPath: string) => boolean;
      minimumScore?: number;
      minimumFileCount?: number;
    },
    weights: WeightConfig = DEFAULT_WEIGHTS
  ): ProjectScore {
    // ファイルレベルのフィルタリング
    let filteredPluginResults = new Map(pluginResultsMap);
    
    if (filter.includeFiles) {
      filteredPluginResults = new Map(
        Array.from(pluginResultsMap.entries())
          .filter(([filePath]) => filter.includeFiles!(filePath))
      );
    }

    // ファイルスコアを生成
    const fileScores = this.aggregatePluginResultsToFiles(filteredPluginResults, weights);

    // スコアフィルタリング
    let filteredFileScores = fileScores;
    if (filter.minimumScore !== undefined) {
      filteredFileScores = fileScores.filter(f => f.overallScore >= filter.minimumScore!);
    }

    // ディレクトリ構造の構築
    let directoryScores = this.aggregateByDirectoryStructure(filteredFileScores);

    // ディレクトリレベルのフィルタリング
    if (filter.includeDirectories) {
      directoryScores = directoryScores.filter(d => filter.includeDirectories!(d.directoryPath));
    }

    if (filter.minimumFileCount !== undefined) {
      directoryScores = directoryScores.filter(d => d.fileCount >= filter.minimumFileCount!);
    }

    return this.aggregateDirectoriesToProject('.', directoryScores, weights);
  }

  /**
   * 集約統計の生成
   * @param projectScore プロジェクトスコア
   * @returns 集約統計情報
   */
  generateAggregationStats(projectScore: ProjectScore): {
    fileCount: number;
    directoryCount: number;
    averageFilesPerDirectory: number;
    scoreDistribution: {
      files: Record<string, number>;
      directories: Record<string, number>;
    };
    topPerformingDirectories: DirectoryScore[];
    worstPerformingDirectories: DirectoryScore[];
  } {
    const directoryScores = projectScore.directoryScores;
    const allFileScores = directoryScores.flatMap(d => d.fileScores);

    // ファイルとディレクトリのグレード分布を計算
    const fileGrades = allFileScores.map(f => f.grade);
    const directoryGrades = directoryScores.map(d => d.grade);

    const fileDistribution = this.calculateGradeDistribution(fileGrades);
    const directoryDistribution = this.calculateGradeDistribution(directoryGrades);

    // パフォーマンスの良い/悪いディレクトリを特定
    const sortedDirectories = [...directoryScores].sort((a, b) => b.overallScore - a.overallScore);
    const topPerforming = sortedDirectories.slice(0, Math.max(3, Math.ceil(directoryScores.length * 0.2)));
    const worstPerforming = sortedDirectories.slice(-Math.max(3, Math.ceil(directoryScores.length * 0.2))).reverse();

    return {
      fileCount: allFileScores.length,
      directoryCount: directoryScores.length,
      averageFilesPerDirectory: allFileScores.length / Math.max(1, directoryScores.length),
      scoreDistribution: {
        files: fileDistribution,
        directories: directoryDistribution
      },
      topPerformingDirectories: topPerforming,
      worstPerformingDirectories: worstPerforming
    };
  }

  // === プライベートメソッド ===

  /**
   * ファイルパスからディレクトリパスを抽出
   */
  private extractDirectoryPath(filePath: string): string {
    const directory = path.dirname(filePath);
    
    // ルートディレクトリの場合
    if (directory === '.' || directory === '/') {
      return './';
    }
    
    // 末尾にスラッシュを追加してディレクトリであることを明確化
    return directory.endsWith('/') ? directory : directory + '/';
  }

  /**
   * グレード分布を計算
   */
  private calculateGradeDistribution(grades: string[]): Record<string, number> {
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    for (const grade of grades) {
      if (grade in distribution) {
        distribution[grade]++;
      }
    }
    
    return distribution;
  }

  /**
   * 現在のメモリ使用量を取得（MB）
   */
  private getMemoryUsage(): number {
    try {
      const usage = process.memoryUsage();
      return Math.round(usage.heapUsed / 1024 / 1024); // bytes to MB
    } catch (error) {
      errorHandler.handleWarning(
        'メモリ使用量の取得に失敗',
        { error: error instanceof Error ? error.message : '不明なエラー' },
        'getMemoryUsage'
      );
      return 0;
    }
  }
}