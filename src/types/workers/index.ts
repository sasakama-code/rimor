/**
 * ワーカー関連の統一型定義
 * 
 * 並列処理とワーカープールの型定義を集約
 * KISS原則に基づいたシンプルな設計
 */

/**
 * ワーカーの状態
 */
export type WorkerStatus = 
  | 'IDLE'          // アイドル
  | 'BUSY'          // 処理中
  | 'TERMINATING'   // 終了中
  | 'TERMINATED'    // 終了済み
  | 'ERROR';        // エラー

/**
 * タスクの状態
 */
export type TaskStatus = 
  | 'PENDING'       // 待機中
  | 'RUNNING'       // 実行中
  | 'COMPLETED'     // 完了
  | 'FAILED'        // 失敗
  | 'CANCELLED';    // キャンセル

/**
 * タスクの優先度
 */
export type TaskPriority = 'HIGH' | 'NORMAL' | 'LOW';

/**
 * ワーカータスク
 * SRP: タスクの情報に特化
 */
export interface WorkerTask {
  /** タスクID */
  id: string;
  /** タスクタイプ */
  type: string;
  /** 優先度 */
  priority?: TaskPriority;
  /** ペイロード */
  payload: unknown;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** リトライ回数 */
  retryCount?: number;
  /** 作成日時 */
  createdAt: string;
  /** 開始日時 */
  startedAt?: string;
  /** 完了日時 */
  completedAt?: string;
}

/**
 * ワーカー情報
 */
export interface WorkerInfo {
  /** ワーカーID */
  id: string;
  /** ワーカー名 */
  name?: string;
  /** 状態 */
  status: WorkerStatus;
  /** 現在のタスク */
  currentTask?: WorkerTask;
  /** 処理済みタスク数 */
  processedTasks: number;
  /** エラー数 */
  errorCount: number;
  /** CPU使用率 */
  cpuUsage?: number;
  /** メモリ使用量 */
  memoryUsage?: number;
  /** 作成日時 */
  createdAt: string;
  /** 最終活動日時 */
  lastActiveAt?: string;
}

/**
 * タスク結果
 */
export interface TaskResult {
  /** タスクID */
  taskId: string;
  /** 成功/失敗 */
  success: boolean;
  /** 結果データ */
  data?: unknown;
  /** エラー */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  /** 実行時間（ミリ秒） */
  executionTime: number;
  /** ワーカーID */
  workerId?: string;
}

/**
 * ワーカープール設定
 */
export interface WorkerPoolConfig {
  /** 最小ワーカー数 */
  minWorkers?: number;
  /** 最大ワーカー数 */
  maxWorkers?: number;
  /** タスクキューの最大サイズ */
  maxQueueSize?: number;
  /** ワーカーのアイドルタイムアウト（ミリ秒） */
  workerIdleTimeout?: number;
  /** タスクのデフォルトタイムアウト（ミリ秒） */
  taskTimeout?: number;
  /** 自動スケーリング有効化 */
  autoScale?: boolean;
  /** メトリクス収集有効化 */
  enableMetrics?: boolean;
}

/**
 * ワーカープール統計
 */
export interface WorkerPoolStats {
  /** アクティブワーカー数 */
  activeWorkers: number;
  /** アイドルワーカー数 */
  idleWorkers: number;
  /** 待機中のタスク数 */
  pendingTasks: number;
  /** 処理済みタスク数 */
  processedTasks: number;
  /** 失敗したタスク数 */
  failedTasks: number;
  /** 平均実行時間（ミリ秒） */
  avgExecutionTime: number;
  /** CPU使用率 */
  cpuUsage: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** 稼働時間（秒） */
  uptime: number;
}

/**
 * ワーカープールイベント
 */
export interface WorkerPoolEvent {
  /** イベントタイプ */
  type: 
    | 'WORKER_CREATED'
    | 'WORKER_TERMINATED'
    | 'TASK_STARTED'
    | 'TASK_COMPLETED'
    | 'TASK_FAILED'
    | 'POOL_SCALED';
  /** タイムスタンプ */
  timestamp: string;
  /** ワーカーID */
  workerId?: string;
  /** タスクID */
  taskId?: string;
  /** 詳細 */
  details?: unknown;
}

/**
 * ワーカープールインターフェース
 */
export interface IWorkerPool {
  /** タスクの実行 */
  execute(task: WorkerTask): Promise<TaskResult>;
  /** バッチタスクの実行 */
  executeBatch(tasks: WorkerTask[]): Promise<TaskResult[]>;
  /** ワーカープールの開始 */
  start(): Promise<void>;
  /** ワーカープールの停止 */
  stop(): Promise<void>;
  /** 統計情報の取得 */
  getStats(): WorkerPoolStats;
  /** ワーカー情報の取得 */
  getWorkers(): WorkerInfo[];
  /** タスクのキャンセル */
  cancelTask(taskId: string): Promise<boolean>;
  /** すべてのタスクのキャンセル */
  cancelAllTasks(): Promise<void>;
}

/**
 * タスクハンドラー
 */
export type TaskHandler<T = any, R = any> = (payload: T) => Promise<R>;

/**
 * タスクレジストリ
 */
export interface TaskRegistry {
  /** タスクハンドラーの登録 */
  register<T, R>(type: string, handler: TaskHandler<T, R>): void;
  /** タスクハンドラーの登録解除 */
  unregister(type: string): void;
  /** タスクハンドラーの取得 */
  getHandler(type: string): TaskHandler | undefined;
  /** すべてのタスクタイプの取得 */
  getTypes(): string[];
}

/**
 * 型ガード: WorkerTaskかどうかを判定
 */
export function isWorkerTask(obj: unknown): obj is WorkerTask {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    obj.payload !== undefined &&
    typeof obj.createdAt === 'string';
}

/**
 * 型ガード: TaskResultかどうかを判定
 */
export function isTaskResult(obj: unknown): obj is TaskResult {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.taskId === 'string' &&
    typeof obj.success === 'boolean' &&
    typeof obj.executionTime === 'number';
}

/**
 * ヘルパー関数: タスク優先度を数値に変換
 */
export function taskPriorityToNumber(priority: TaskPriority): number {
  const mapping: Record<TaskPriority, number> = {
    'HIGH': 3,
    'NORMAL': 2,
    'LOW': 1
  };
  return mapping[priority] || 2;
}

/**
 * ヘルパー関数: タスクのソート（優先度順）
 */
export function sortTasksByPriority(tasks: WorkerTask[]): WorkerTask[] {
  return tasks.sort((a, b) => {
    const aPriority = taskPriorityToNumber(a.priority || 'NORMAL');
    const bPriority = taskPriorityToNumber(b.priority || 'NORMAL');
    return bPriority - aPriority;
  });
}

/**
 * ヘルパー関数: ワーカープールの使用率を計算
 */
export function calculatePoolUtilization(stats: WorkerPoolStats): number {
  const totalWorkers = stats.activeWorkers + stats.idleWorkers;
  if (totalWorkers === 0) return 0;
  return (stats.activeWorkers / totalWorkers) * 100;
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated
 */
export type Task = WorkerTask;
export type Worker = WorkerInfo;
export type PoolStats = WorkerPoolStats;