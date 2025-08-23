/**
 * 外部TypeScriptプロジェクトベンチマーク対象設定
 * issue #84: TypeScript有名プロジェクトを用いた性能ベンチマーク実装
 */

export interface BenchmarkProject {
  /** プロジェクト名 */
  name: string;
  /** GitHubリポジトリURL */
  repositoryUrl: string;
  /** 期待されるファイル数（目安） */
  expectedFileCount: number;
  /** 5ms/file目標値 */
  target5msPerFile: number;
  /** タイムアウト（ミリ秒） */
  timeout: number;
  /** 分析対象ディレクトリ（省略可） */
  targetDirectory?: string;
  /** 除外パターン */
  excludePatterns?: string[];
  /** 特別な設定 */
  specialConfig?: {
    /** メモリ制限 */
    memoryLimit?: number;
    /** 並列処理ワーカー数 */
    maxWorkers?: number;
    /** キャッシュ有効化 */
    enableCache?: boolean;
  };
}

export interface BenchmarkTier {
  tier: 1 | 2;
  projects: BenchmarkProject[];
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * ベンチマーク対象プロジェクトの管理クラス
 */
export class BenchmarkTargets {
  /**
   * Tier 1プロジェクト（最優先）
   * TypeScript、Ant Design、Visual Studio Code
   */
  private static readonly TIER_1_PROJECTS: BenchmarkProject[] = [
    {
      name: 'TypeScript',
      repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
      expectedFileCount: 1500,
      target5msPerFile: 5,
      timeout: 300000, // 5分
      targetDirectory: 'src',
      excludePatterns: [
        'tests/**',
        'built/**',
        'lib/**',
        '*.d.ts'
      ],
      specialConfig: {
        memoryLimit: 4096, // 4GB
        maxWorkers: 4,
        enableCache: true
      }
    },
    {
      name: 'Ant Design',
      repositoryUrl: 'https://github.com/ant-design/ant-design.git',
      expectedFileCount: 800,
      target5msPerFile: 5,
      timeout: 240000, // 4分
      targetDirectory: 'components',
      excludePatterns: [
        'tests/**',
        '__tests__/**',
        'demo/**',
        'docs/**',
        '*.test.ts',
        '*.test.tsx'
      ],
      specialConfig: {
        memoryLimit: 3072, // 3GB
        maxWorkers: 4,
        enableCache: true
      }
    },
    {
      name: 'Visual Studio Code',
      repositoryUrl: 'https://github.com/microsoft/vscode.git',
      expectedFileCount: 2000,
      target5msPerFile: 5,
      timeout: 360000, // 6分
      targetDirectory: 'src',
      excludePatterns: [
        'test/**',
        'tests/**',
        'out/**',
        'extensions/**',
        '*.test.ts'
      ],
      specialConfig: {
        memoryLimit: 6144, // 6GB
        maxWorkers: 6,
        enableCache: true
      }
    }
  ];

  /**
   * Tier 2プロジェクト（追加評価）
   * Material UI、Storybook、Deno
   */
  private static readonly TIER_2_PROJECTS: BenchmarkProject[] = [
    {
      name: 'Material UI',
      repositoryUrl: 'https://github.com/mui/material-ui.git',
      expectedFileCount: 600,
      target5msPerFile: 5,
      timeout: 180000, // 3分
      targetDirectory: 'packages/mui-material/src',
      excludePatterns: [
        'test/**',
        '__tests__/**',
        '*.test.ts',
        '*.test.tsx',
        'docs/**'
      ],
      specialConfig: {
        memoryLimit: 2048, // 2GB
        maxWorkers: 3,
        enableCache: true
      }
    },
    {
      name: 'Storybook',
      repositoryUrl: 'https://github.com/storybookjs/storybook.git',
      expectedFileCount: 1200,
      target5msPerFile: 5,
      timeout: 300000, // 5分
      targetDirectory: 'code/lib',
      excludePatterns: [
        'test/**',
        '*.test.ts',
        '*.test.js',
        'stories/**',
        'docs/**'
      ],
      specialConfig: {
        memoryLimit: 4096, // 4GB
        maxWorkers: 4,
        enableCache: true
      }
    },
    {
      name: 'Deno',
      repositoryUrl: 'https://github.com/denoland/deno.git',
      expectedFileCount: 400,
      target5msPerFile: 5,
      timeout: 240000, // 4分
      targetDirectory: 'cli',
      excludePatterns: [
        'tests/**',
        'test_util/**',
        '*.test.ts',
        'testdata/**'
      ],
      specialConfig: {
        memoryLimit: 3072, // 3GB
        maxWorkers: 4,
        enableCache: true
      }
    }
  ];

  /**
   * Tier 1プロジェクトを取得
   */
  static getTier1Projects(): BenchmarkProject[] {
    return [...this.TIER_1_PROJECTS];
  }

  /**
   * Tier 2プロジェクトを取得
   */
  static getTier2Projects(): BenchmarkProject[] {
    return [...this.TIER_2_PROJECTS];
  }

  /**
   * 全プロジェクトを取得
   */
  static getAllProjects(): BenchmarkProject[] {
    return [...this.TIER_1_PROJECTS, ...this.TIER_2_PROJECTS];
  }

  /**
   * 指定されたティアのプロジェクトを取得
   */
  static getProjectsByTier(tier: 1 | 2): BenchmarkProject[] {
    return tier === 1 ? this.getTier1Projects() : this.getTier2Projects();
  }

  /**
   * プロジェクト名でプロジェクトを検索
   */
  static getProjectByName(name: string): BenchmarkProject | undefined {
    return this.getAllProjects().find(project => 
      project.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * プロジェクトの総推定ファイル数を取得
   */
  static getTotalExpectedFileCount(tier?: 1 | 2): number {
    const projects = tier ? this.getProjectsByTier(tier) : this.getAllProjects();
    return projects.reduce((total, project) => total + project.expectedFileCount, 0);
  }

  /**
   * プロジェクトの推定実行時間を計算（秒）
   */
  static getEstimatedExecutionTime(projects: BenchmarkProject[]): number {
    return projects.reduce((total, project) => {
      const estimatedTime = (project.expectedFileCount * project.target5msPerFile) / 1000;
      return total + estimatedTime;
    }, 0);
  }

  /**
   * システムリソースに基づく推奨プロジェクトを取得
   */
  static getRecommendedProjects(availableMemoryGB: number, cpuCount: number): {
    recommended: BenchmarkProject[];
    warnings: string[];
  } {
    const allProjects = this.getAllProjects();
    const recommended: BenchmarkProject[] = [];
    const warnings: string[] = [];

    for (const project of allProjects) {
      const requiredMemory = (project.specialConfig?.memoryLimit || 2048) / 1024; // GB変換
      const recommendedCpus = project.specialConfig?.maxWorkers || 2;

      if (availableMemoryGB >= requiredMemory) {
        recommended.push(project);
      } else {
        warnings.push(
          `${project.name}は${requiredMemory}GBのメモリが必要ですが、利用可能メモリは${availableMemoryGB}GBです`
        );
      }

      if (cpuCount < recommendedCpus) {
        warnings.push(
          `${project.name}は${recommendedCpus}コア以上のCPUを推奨しますが、利用可能コア数は${cpuCount}コアです`
        );
      }
    }

    return { recommended, warnings };
  }

  /**
   * ベンチマーク設定の検証
   */
  static validateProject(project: BenchmarkProject): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!project.name || project.name.trim() === '') {
      errors.push('プロジェクト名が必要です');
    }

    if (!project.repositoryUrl || !project.repositoryUrl.startsWith('https://github.com/')) {
      errors.push('有効なGitHubリポジトリURLが必要です');
    }

    if (project.expectedFileCount <= 0) {
      errors.push('期待ファイル数は正の数である必要があります');
    }

    if (project.target5msPerFile !== 5) {
      errors.push('5ms/file目標値は5である必要があります');
    }

    if (project.timeout <= 0) {
      errors.push('タイムアウトは正の数である必要があります');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * ベンチマーク結果の成功基準
   */
  static getSuccessCriteria() {
    return {
      performance: {
        target5msPerFile: {
          target: 5,
          tolerance: 0.5, // ±0.5ms
          description: '中規模プロジェクトで5ms/file目標の達成'
        },
        memoryEfficiency: {
          maxMemoryPerGB: 2, // 1GBプロジェクトあたり最大2GB
          description: 'メモリ効率の維持'
        },
        parallelScaling: {
          minEfficiency: 0.7, // 70%以上の並列効率
          description: 'CPU数に応じた線形スケーリング'
        }
      },
      accuracy: {
        fileAnalysisSuccess: {
          target: 0.95, // 95%以上
          description: 'ファイル解析成功率'
        },
        taintTyperAccuracy: {
          target: 0.90, // 90%以上
          description: 'TaintTyper検出精度'
        },
        intentExtractionSuccess: {
          target: 0.85, // 85%以上
          description: 'Intent抽出成功率'
        }
      },
      quality: {
        testCoverage: {
          target: 0.90, // 90%以上
          description: 'テストカバレッジ'
        },
        typeCoverage: {
          target: 1.0, // 100%（anyの使用禁止）
          description: '型カバレッジ'
        },
        zeroErrorExecution: {
          target: true,
          description: 'ゼロエラー実行の保証'
        }
      }
    };
  }
}