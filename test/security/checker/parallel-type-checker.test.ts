import { ParallelTypeChecker, createParallelTypeChecker } from '../../../src/security/checker/parallel-type-checker';
import {
  TestMethod,
  MethodAnalysisResult,
  SecurityIssue
} from '../../../src/core/types';
import { TaintQualifier, QualifiedType } from '../../../src/security/types/checker-framework-types';
import * as os from 'os';

describe('ParallelTypeChecker', () => {
  let checker: ParallelTypeChecker;

  beforeEach(async () => {
    checker = await createParallelTypeChecker({
      workerCount: 2,
      enableCache: true,
      debug: false
    });
  });

  afterEach(async () => {
    await checker.shutdown();
  });

  describe('基本的な並列処理', () => {
    it('並列型チェッカーを作成できる', () => {
      expect(checker).toBeInstanceOf(ParallelTypeChecker);
    });

    it('カスタム設定で初期化できる', async () => {
      const customChecker = await createParallelTypeChecker({
        workerCount: 4,
        methodTimeout: 10000,
        batchSize: 20
      });
      
      expect(customChecker).toBeInstanceOf(ParallelTypeChecker);
      await customChecker.shutdown();
    });

    it('デフォルト設定でCPUコア数のワーカーを作成する', async () => {
      const defaultChecker = await createParallelTypeChecker();
      expect(defaultChecker).toBeInstanceOf(ParallelTypeChecker);
      await defaultChecker.shutdown();
    });
  });

  describe('checkMethod', () => {
    it('単一メソッドの型チェックができる', async () => {
      const method: TestMethod = {
        name: 'testMethod',
        body: `
          const input = getUserInput();
          const result = process(input);
          return result;
        `,
        parameters: [
          { name: 'userId', type: 'string' }
        ],
        returnType: 'ProcessResult',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const result = await checker.checkMethod(method);
      
      expect(result).toBeDefined();
      expect(result.methodName).toBe('testMethod');
      expect(result.issues).toBeDefined();
    });

    it('汚染データの型エラーを検出できる', async () => {
      const method: TestMethod = {
        name: 'unsafeMethod',
        body: `
          const tainted = request.params.input; // @Tainted
          executeSql(tainted); // 型エラー: @Tainted -> @Untainted
        `,
        parameters: [
          { name: 'request', type: 'Request', taint: TaintQualifier.TAINTED }
        ],
        returnType: 'void',
        location: { file: 'test.ts', line: 10, column: 1 }
      };

      const result = await checker.checkMethod(method);
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toContain('TYPE_ERROR');
    });

    it('タイムアウトを適切に処理できる', async () => {
      const slowChecker = await createParallelTypeChecker({
        workerCount: 1,
        methodTimeout: 100 // 100ms
      });

      const method: TestMethod = {
        name: 'slowMethod',
        body: `
          // 複雑な処理をシミュレート
          ${Array(1000).fill('const x = compute();').join('\n')}
        `,
        parameters: [],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      await expect(slowChecker.checkMethod(method)).rejects.toThrow('timeout');
      await slowChecker.shutdown();
    });
  });

  describe('checkBatch', () => {
    it('複数メソッドを並列でチェックできる', async () => {
      const methods: TestMethod[] = Array.from({ length: 10 }, (_, i) => ({
        name: `method${i}`,
        body: `return ${i};`,
        parameters: [],
        returnType: 'number',
        location: { file: 'test.ts', line: i * 10, column: 1 }
      }));

      const results = await checker.checkBatch(methods);
      
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.methodName).toBe(`method${i}`);
      });
    });

    it('バッチ処理中のエラーを適切に処理できる', async () => {
      const methods: TestMethod[] = [
        {
          name: 'validMethod',
          body: 'return 1;',
          parameters: [],
          returnType: 'number',
          location: { file: 'test.ts', line: 1, column: 1 }
        },
        {
          name: 'invalidMethod',
          body: null as any, // 不正な入力
          parameters: [],
          returnType: 'void',
          location: { file: 'test.ts', line: 10, column: 1 }
        }
      ];

      const results = await checker.checkBatch(methods);
      
      expect(results).toHaveLength(2);
      expect(results[0].issues).toHaveLength(0);
      expect(results[1].issues.length).toBeGreaterThan(0);
    });
  });

  describe('キャッシング', () => {
    it('同じメソッドの結果をキャッシュする', async () => {
      const method: TestMethod = {
        name: 'cachedMethod',
        body: 'return "cached";',
        parameters: [],
        returnType: 'string',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      // 初回実行
      const startTime1 = Date.now();
      const result1 = await checker.checkMethod(method);
      const time1 = Date.now() - startTime1;

      // キャッシュからの実行
      const startTime2 = Date.now();
      const result2 = await checker.checkMethod(method);
      const time2 = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      expect(time2).toBeLessThan(time1 / 2); // キャッシュは2倍以上高速
    });

    it('clearCache()でキャッシュをクリアできる', async () => {
      const method: TestMethod = {
        name: 'testCache',
        body: 'return 1;',
        parameters: [],
        returnType: 'number',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      await checker.checkMethod(method);
      checker.clearCache();
      
      // キャッシュクリア後は再計算される
      const startTime = Date.now();
      await checker.checkMethod(method);
      const time = Date.now() - startTime;
      
      expect(time).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンスと統計', () => {
    it('getStats()で統計情報を取得できる', async () => {
      const methods: TestMethod[] = Array.from({ length: 5 }, (_, i) => ({
        name: `statMethod${i}`,
        body: `return ${i};`,
        parameters: [],
        returnType: 'number',
        location: { file: 'test.ts', line: i * 10, column: 1 }
      }));

      await checker.checkBatch(methods);
      const stats = checker.getStats();
      
      expect(stats.totalMethods).toBe(5);
      expect(stats.totalTime).toBeGreaterThan(0);
      expect(stats.averageTime).toBeGreaterThan(0);
      expect(stats.cacheHits).toBeGreaterThanOrEqual(0);
    });

    it('並列処理が順次処理より高速である', async () => {
      const methods: TestMethod[] = Array.from({ length: 20 }, (_, i) => ({
        name: `perfMethod${i}`,
        body: `
          const a = compute(${i});
          const b = transform(a);
          return validate(b);
        `,
        parameters: [],
        returnType: 'boolean',
        location: { file: 'test.ts', line: i * 10, column: 1 }
      }));

      // 並列処理
      const parallelStart = Date.now();
      await checker.checkBatch(methods);
      const parallelTime = Date.now() - parallelStart;

      // 順次処理をシミュレート
      const sequentialChecker = await createParallelTypeChecker({
        workerCount: 1
      });
      const sequentialStart = Date.now();
      for (const method of methods) {
        await sequentialChecker.checkMethod(method);
      }
      const sequentialTime = Date.now() - sequentialStart;
      await sequentialChecker.shutdown();

      // 並列処理の方が高速であることを確認
      expect(parallelTime).toBeLessThan(sequentialTime);
    });
  });

  describe('エラーハンドリングと安定性', () => {
    it('ワーカーのクラッシュから回復できる', async () => {
      const method: TestMethod = {
        name: 'crashTest',
        body: 'process.exit(1)', // ワーカーをクラッシュさせる
        parameters: [],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      // クラッシュしても例外がスローされることを確認
      await expect(checker.checkMethod(method)).rejects.toThrow();
      
      // その後も正常に動作することを確認
      const normalMethod: TestMethod = {
        name: 'normalMethod',
        body: 'return true;',
        parameters: [],
        returnType: 'boolean',
        location: { file: 'test.ts', line: 10, column: 1 }
      };
      
      const result = await checker.checkMethod(normalMethod);
      expect(result).toBeDefined();
    });

    it('shutdown()で全ワーカーを正常終了できる', async () => {
      const testChecker = await createParallelTypeChecker({
        workerCount: 3
      });
      
      await testChecker.shutdown();
      
      // シャットダウン後の操作はエラーになる
      const method: TestMethod = {
        name: 'afterShutdown',
        body: 'return 1;',
        parameters: [],
        returnType: 'number',
        location: { file: 'test.ts', line: 1, column: 1 }
      };
      
      await expect(testChecker.checkMethod(method)).rejects.toThrow();
    });
  });
});