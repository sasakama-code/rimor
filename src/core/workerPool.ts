/**
 * Worker Pool Implementation
 * v0.8.0 - 並列処理のためのワーカープール実装
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import { debug } from '../utils/debug';

/**
 * ワーカータスク
 */
interface WorkerTask {
  id: string;
  type: 'analyze';
  data: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/**
 * ワーカー情報
 */
interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskQueue: WorkerTask[];
}

/**
 * ワーカープール
 * 並列処理を管理するクラス
 */
export class WorkerPool {
  private workers: WorkerInfo[] = [];
  private taskQueue: WorkerTask[] = [];
  private initialized = false;
  
  constructor(private size: number = 4) {
    this.size = Math.max(1, Math.min(size, 8)); // 1-8の範囲に制限
  }
  
  /**
   * ワーカープールを初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    debug.info(`Initializing worker pool with ${this.size} workers`);
    
    // ワーカースクリプトの作成
    const workerScript = this.createWorkerScript();
    
    // ワーカーの作成
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(workerScript, {
        eval: true,
        workerData: { workerId: i }
      });
      
      const workerInfo: WorkerInfo = {
        worker,
        busy: false,
        taskQueue: []
      };
      
      // イベントハンドラの設定
      this.setupWorkerHandlers(workerInfo);
      
      this.workers.push(workerInfo);
    }
    
    this.initialized = true;
    debug.info('Worker pool initialized');
  }
  
  /**
   * タスクを実行
   */
  async execute(type: string, data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Worker pool not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: this.generateTaskId(),
        type: 'analyze',
        data,
        resolve,
        reject
      };
      
      // 空いているワーカーを探す
      const availableWorker = this.workers.find(w => !w.busy);
      
      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else {
        // 全てのワーカーがビジーの場合はキューに追加
        this.taskQueue.push(task);
      }
    });
  }
  
  /**
   * ワーカープールを終了
   */
  async terminate(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    debug.info('Terminating worker pool');
    
    // 全てのワーカーを終了
    await Promise.all(
      this.workers.map(workerInfo => workerInfo.worker.terminate())
    );
    
    // キューをクリア
    this.taskQueue.forEach(task => {
      task.reject(new Error('Worker pool terminated'));
    });
    
    this.workers = [];
    this.taskQueue = [];
    this.initialized = false;
    
    debug.info('Worker pool terminated');
  }
  
  /**
   * ワーカースクリプトを作成
   */
  private createWorkerScript(): string {
    return `
      const { parentPort, workerData } = require('worker_threads');
      const path = require('path');
      const fs = require('fs');
      
      // メッセージハンドラ
      parentPort.on('message', async (message) => {
        const { id, type, data } = message;
        
        try {
          let result;
          
          switch (type) {
            case 'analyze':
              // 簡素化された分析実行
              result = { issues: [] };
              break;
            default:
              throw new Error(\`Unknown task type: \${type}\`);
          }
          
          parentPort.postMessage({
            id,
            type: 'result',
            data: result
          });
        } catch (error) {
          parentPort.postMessage({
            id,
            type: 'error',
            error: error.message || 'Unknown error'
          });
        }
      });
      
      // 初期化完了を通知
      parentPort.postMessage({ type: 'ready' });
    `;
  }
  
  /**
   * ワーカーのイベントハンドラを設定
   */
  private setupWorkerHandlers(workerInfo: WorkerInfo): void {
    const { worker } = workerInfo;
    
    worker.on('message', (message) => {
      if (message.type === 'ready') {
        debug.verbose(`Worker ready`);
        return;
      }
      
      if (message.type === 'result') {
        const task = workerInfo.taskQueue.find(t => t.id === message.id);
        if (task) {
          task.resolve(message.data);
          this.completeTask(workerInfo, task);
        }
      } else if (message.type === 'error') {
        const task = workerInfo.taskQueue.find(t => t.id === message.id);
        if (task) {
          task.reject(new Error(message.error));
          this.completeTask(workerInfo, task);
        }
      }
    });
    
    worker.on('error', (error) => {
      debug.error('Worker error:', error);
      // エラーが発生したタスクを全て拒否
      workerInfo.taskQueue.forEach(task => {
        task.reject(error);
      });
      workerInfo.taskQueue = [];
      workerInfo.busy = false;
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        debug.error(`Worker exited with code ${code}`);
      }
    });
  }
  
  /**
   * タスクを割り当て
   */
  private assignTask(workerInfo: WorkerInfo, task: WorkerTask): void {
    workerInfo.busy = true;
    workerInfo.taskQueue.push(task);
    
    workerInfo.worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data
    });
  }
  
  /**
   * タスクを完了
   */
  private completeTask(workerInfo: WorkerInfo, task: WorkerTask): void {
    // タスクをキューから削除
    const index = workerInfo.taskQueue.indexOf(task);
    if (index >= 0) {
      workerInfo.taskQueue.splice(index, 1);
    }
    
    // ワーカーを解放
    workerInfo.busy = false;
    
    // 待機中のタスクがあれば実行
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift()!;
      this.assignTask(workerInfo, nextTask);
    }
  }
  
  /**
   * タスクIDを生成
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}