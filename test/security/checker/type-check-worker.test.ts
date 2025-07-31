import { Worker } from 'worker_threads';
import * as path from 'path';

describe('TypeCheckWorker', () => {
  let worker: Worker;
  // ビルド済みのJavaScriptファイルを使用
  const workerPath = path.join(__dirname, '../../../dist/security/checker/type-check-worker.js');

  beforeEach(() => {
    // ビルド済みのJSファイルを直接実行
    worker = new Worker(workerPath);
  });

  afterEach(async () => {
    await worker.terminate();
  });

  describe('基本的なワーカー機能', () => {
    it('ワーカースレッドを起動できる', (done) => {
      worker.on('online', () => {
        expect(worker.threadId).toBeDefined();
        done();
      });
    });

    it('メッセージを送受信できる', (done) => {
      const task = {
        id: 'test-1',
        method: {
          name: 'testMethod',
          content: 'return true;',
          filePath: 'test.ts'
        },
        dependencies: []
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        expect(result.id).toBe('test-1');
        expect(result.success).toBeDefined();
        expect(result.executionTime).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('型チェック処理', () => {
    it('正常なコードの型チェックが成功する', (done) => {
      const task = {
        id: 'check-1',
        method: {
          name: 'safeMethod',
          content: `
            const sanitized: string = sanitize(input);
            return sanitized;
          `,
          filePath: 'safe.ts'
        },
        dependencies: [
          ['input', { type: 'string', taint: 'UNTAINTED' }],
          ['sanitize', { type: 'function', signature: '(string) => string' }]
        ]
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        if (result.id === 'check-1') {
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
          done();
        }
      });
    });

    it('型エラーを検出できる', (done) => {
      const task = {
        id: 'check-2',
        method: {
          name: 'unsafeMethod',
          content: `
            const tainted: @Tainted string = getUserInput();
            executeSql(tainted); // エラー: @Tainted -> @Untainted
          `,
          filePath: 'unsafe.ts'
        },
        dependencies: [
          ['getUserInput', { 
            type: 'function', 
            signature: '() => @Tainted string',
            returnTaint: 'TAINTED' 
          }],
          ['executeSql', { 
            type: 'function', 
            signature: '(@Untainted string) => void',
            parameterTaint: ['UNTAINTED']
          }]
        ]
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        if (result.id === 'check-2') {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('type');
          done();
        }
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な入力を適切に処理する', (done) => {
      const invalidTask = {
        id: 'invalid-1',
        method: null,
        dependencies: []
      };

      worker.postMessage(invalidTask);
      
      worker.on('message', (result) => {
        if (result.id === 'invalid-1') {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          done();
        }
      });
    });

    it('構文エラーのあるコードを処理できる', (done) => {
      const task = {
        id: 'syntax-error',
        method: {
          name: 'syntaxError',
          content: 'const x = ; // 構文エラー',
          filePath: 'error.ts'
        },
        dependencies: []
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        if (result.id === 'syntax-error') {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('syntax');
          done();
        }
      });
    });
  });

  describe('パフォーマンス', () => {
    it('複数のタスクを順次処理できる', (done) => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `perf-${i}`,
        method: {
          name: `method${i}`,
          content: `return ${i};`,
          filePath: `test${i}.ts`
        },
        dependencies: []
      }));

      let completed = 0;
      const results: any[] = [];

      worker.on('message', (result) => {
        if (result.id.startsWith('perf-')) {
          results.push(result);
          completed++;
          
          if (completed === tasks.length) {
            expect(results).toHaveLength(5);
            results.forEach(r => {
              expect(r.success).toBe(true);
              expect(r.executionTime).toBeGreaterThan(0);
            });
            done();
          }
        }
      });

      tasks.forEach(task => worker.postMessage(task));
    });

    it('実行時間を正確に測定する', (done) => {
      const task = {
        id: 'timing-1',
        method: {
          name: 'complexMethod',
          content: `
            // 複雑な処理をシミュレート
            const data = processData(input);
            const validated = validate(data);
            const transformed = transform(validated);
            return sanitize(transformed);
          `,
          filePath: 'complex.ts'
        },
        dependencies: [
          ['input', { type: 'any' }],
          ['processData', { type: 'function' }],
          ['validate', { type: 'function' }],
          ['transform', { type: 'function' }],
          ['sanitize', { type: 'function' }]
        ]
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        if (result.id === 'timing-1') {
          expect(result.executionTime).toBeGreaterThan(0);
          expect(result.executionTime).toBeLessThan(1000); // 1秒以内
          done();
        }
      });
    });
  });

  describe('ワーカー通信', () => {
    it('大きなペイロードを処理できる', (done) => {
      const largeContent = Array(1000).fill('const x = 1;').join('\n');
      const task = {
        id: 'large-1',
        method: {
          name: 'largeMethod',
          content: largeContent,
          filePath: 'large.ts'
        },
        dependencies: Array.from({ length: 100 }, (_, i) => [
          `var${i}`,
          { type: 'string' }
        ])
      };

      worker.postMessage(task);
      
      worker.on('message', (result) => {
        if (result.id === 'large-1') {
          expect(result).toBeDefined();
          expect(result.executionTime).toBeGreaterThan(0);
          done();
        }
      });
    });

    it('エラーイベントを適切に処理する', (done) => {
      // 新しいワーカーを作成（既存のエラーハンドラを回避）
      const errorWorker = new Worker(workerPath);
      
      errorWorker.on('error', (error) => {
        // Worker threadsではエラーがシリアライズされるため、詳細なチェックは行わない
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
        errorWorker.terminate().then(() => done());
      });

      // 不正なメッセージを送信してエラーを誘発
      errorWorker.postMessage({ invalid: 'message' });
    });
  });
});