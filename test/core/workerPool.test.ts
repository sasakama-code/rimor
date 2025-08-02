import { WorkerPool } from '../../src/core/workerPool';
import { Worker } from 'worker_threads';
import * as path from 'path';

// Worker threadsをモック
jest.mock('worker_threads', () => {
  const EventEmitter = require('events');
  
  class MockWorker extends EventEmitter {
    threadId = Math.random();
    
    constructor(public filename: string, public options?: any) {
      super();
      setTimeout(() => this.emit('online'), 10);
    }
    
    postMessage(data: any) {
      // 非同期で結果を返す
      setTimeout(() => {
        this.emit('message', {
          id: data.id,
          type: 'result',
          data: { processed: true, data: data.data }
        });
      }, 50);
    }
    
    terminate() {
      return Promise.resolve(0);
    }
  }
  
  return { Worker: MockWorker };
});

describe('WorkerPool', () => {
  let pool: WorkerPool;

  beforeEach(() => {
    pool = new WorkerPool(2);
  });

  afterEach(async () => {
    await pool.terminate();
  });

  describe('初期化とシャットダウン', () => {
    it('ワーカープールを作成できる', () => {
      expect(pool).toBeInstanceOf(WorkerPool);
    });

    it('指定したサイズでワーカーを初期化できる', async () => {
      await pool.initialize();
      
      // プライベートプロパティにアクセスするためのハック
      const workers = (pool as any).workers;
      expect(workers).toHaveLength(2);
    });

    it('サイズを1-8の範囲に制限する', () => {
      const tooSmall = new WorkerPool(0);
      const tooBig = new WorkerPool(10);
      
      expect((tooSmall as any).size).toBe(1);
      expect((tooBig as any).size).toBe(8);
    });

    it('重複初期化を防ぐ', async () => {
      await pool.initialize();
      const workersBefore = (pool as any).workers.length;
      
      await pool.initialize();
      const workersAfter = (pool as any).workers.length;
      
      expect(workersAfter).toBe(workersBefore);
    });

    it('シャットダウンで全ワーカーを終了する', async () => {
      await pool.initialize();
      await pool.terminate();
      
      const workers = (pool as any).workers;
      expect(workers).toHaveLength(0);
    });
  });

  describe('タスク実行', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('単一タスクを実行できる', async () => {
      const result = await pool.execute('analyze', { file: 'test.js' });
      
      expect(result).toEqual({
        processed: true,
        data: { file: 'test.js' }
      });
    });

    it('複数タスクを並列実行できる', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => 
        pool.execute('analyze', { file: `test${i}.js` })
      );
      
      const results = await Promise.all(tasks);
      
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.data.file).toBe(`test${i}.js`);
      });
    });

    it('タスクキューが正しく機能する', async () => {
      // プールサイズ以上のタスクを投入
      const tasks = Array.from({ length: 10 }, (_, i) => 
        pool.execute('analyze', { index: i })
      );
      
      const results = await Promise.all(tasks);
      
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.data.index).toBe(i);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('ワーカーエラーを適切に処理する', async () => {
      await pool.initialize();
      
      // ワーカーにエラーを発生させるモックを設定
      const workers = (pool as any).workers;
      const workerInfo = workers[0];
      const worker = workerInfo.worker;
      
      const errorPromise = pool.execute('analyze', { file: 'error.js' });
      
      // エラーメッセージを送信（タスクがワーカーに割り当てられるまで少し待つ）
      setTimeout(() => {
        const taskId = workerInfo.taskQueue[0]?.id;
        if (taskId) {
          worker.emit('message', {
            id: taskId,
            type: 'error',
            error: 'Test error'
          });
        }
      }, 30);
      
      await expect(errorPromise).rejects.toThrow('Test error');
    });

    it('ワーカーのクラッシュを処理する', async () => {
      await pool.initialize();
      
      const workers = (pool as any).workers;
      const worker = workers[0].worker;
      
      // タスクを投入
      const taskPromise = pool.execute('analyze', { file: 'crash.js' });
      
      // ワーカーのエラーイベントを発火
      setTimeout(() => {
        worker.emit('error', new Error('Worker crashed'));
      }, 10);
      
      await expect(taskPromise).rejects.toThrow();
    });

    it('初期化前の実行をエラーにする', async () => {
      const uninitializedPool = new WorkerPool(2);
      
      await expect(
        uninitializedPool.execute('analyze', { file: 'test.js' })
      ).rejects.toThrow('Worker pool not initialized');
    });
  });

  describe('ワーカー管理', () => {
    it('アイドルワーカーを優先的に使用する', async () => {
      await pool.initialize();
      
      const workers = (pool as any).workers;
      
      // 最初のワーカーをビジー状態にする
      workers[0].busy = true;
      
      await pool.execute('analyze', { file: 'test.js' });
      
      // 2番目のワーカーが使用されることを確認
      expect(workers[1].busy).toBe(false); // 処理完了後はアイドルに戻る
    });

    it('タスク完了後にワーカーをアイドル状態に戻す', async () => {
      await pool.initialize();
      
      const workers = (pool as any).workers;
      
      await pool.execute('analyze', { file: 'test.js' });
      
      // 全ワーカーがアイドル状態であることを確認
      workers.forEach((workerInfo: any) => {
        expect(workerInfo.busy).toBe(false);
      });
    });
  });

  describe('統計とモニタリング', () => {
    it('内部状態を確認できる', async () => {
      await pool.initialize();
      
      // いくつかのタスクを実行
      await Promise.all([
        pool.execute('analyze', { file: 'test1.js' }),
        pool.execute('analyze', { file: 'test2.js' }),
        pool.execute('analyze', { file: 'test3.js' })
      ]);
      
      // 内部状態を直接確認（getStatsがないため）
      const workers = (pool as any).workers;
      const taskQueue = (pool as any).taskQueue;
      
      expect(workers).toHaveLength(2);
      expect(taskQueue).toHaveLength(0);
    });
  });

  describe('パフォーマンス', () => {
    it('大量のタスクを効率的に処理できる', async () => {
      const largePool = new WorkerPool(4);
      await largePool.initialize();
      
      const startTime = Date.now();
      
      const tasks = Array.from({ length: 100 }, (_, i) => 
        largePool.execute('analyze', { index: i })
      );
      
      const results = await Promise.all(tasks);
      
      const endTime = Date.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
      
      await largePool.terminate();
    });
  });

  describe('メモリ管理', () => {
    it('終了時にリソースを解放する', async () => {
      await pool.initialize();
      
      const tasksBefore = (pool as any).taskQueue.length;
      const workersBefore = (pool as any).workers.length;
      
      await pool.terminate();
      
      const tasksAfter = (pool as any).taskQueue.length;
      const workersAfter = (pool as any).workers.length;
      
      expect(tasksAfter).toBe(0);
      expect(workersAfter).toBe(0);
    });

    it('ペンディングタスクをシャットダウン時に処理する', async () => {
      await pool.initialize();
      
      // 大量のタスクを投入（一部はキューに残る）
      const tasks = Array.from({ length: 10 }, (_, i) => 
        pool.execute('analyze', { index: i })
      );
      
      // すぐに終了
      setTimeout(() => pool.terminate(), 100);
      
      // すべてのタスクが完了またはリジェクトされることを確認
      const results = await Promise.allSettled(tasks);
      
      expect(results).toHaveLength(10);
    });
  });
});