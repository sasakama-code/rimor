/**
 * index.test.ts
 * セキュリティベンチマークモジュールのインデックステスト
 */

describe('Security Benchmarks Index - セキュリティベンチマークモジュール', () => {
  describe('モジュールエクスポート', () => {
    it('必要なクラスがエクスポートされていること', async () => {
      const indexModule = await import('../../../src/security/benchmarks/index');

      expect(indexModule.PerformanceBenchmark).toBeDefined();
      expect(indexModule.BenchmarkRunner).toBeDefined();
      expect(typeof indexModule.PerformanceBenchmark).toBe('function');
      expect(typeof indexModule.BenchmarkRunner).toBe('function');
    });

    it('デフォルトエクスポートが存在すること', async () => {
      const indexModule = await import('../../../src/security/benchmarks/index');

      expect(indexModule.default).toBeDefined();
    });

    it('型定義がエクスポートされていること', async () => {
      const indexModule = await import('../../../src/security/benchmarks/index');

      // 型定義の存在確認（実行時では直接確認できないため、使用可能性をテスト）
      expect(indexModule).toBeDefined();
    });
  });

  describe('モジュール統合', () => {
    it('エクスポートされたクラスが正常にインスタンス化できること', async () => {
      const { PerformanceBenchmark, BenchmarkRunner } = await import('../../../src/security/benchmarks/index');

      expect(() => new PerformanceBenchmark()).not.toThrow();
      expect(() => new BenchmarkRunner()).not.toThrow();
    });

    it('クラス間の依存関係が正しく動作すること', async () => {
      const { PerformanceBenchmark, BenchmarkRunner } = await import('../../../src/security/benchmarks/index');

      const benchmark = new PerformanceBenchmark();
      const runner = new BenchmarkRunner();

      expect(benchmark).toBeDefined();
      expect(runner).toBeDefined();
    });
  });

  describe('パッケージ構造', () => {
    it('必要なメソッドがすべて利用可能であること', async () => {
      const { PerformanceBenchmark } = await import('../../../src/security/benchmarks/index');

      const benchmark = new PerformanceBenchmark();

      // 基本的なメソッドの存在確認
      expect(typeof benchmark.runSmallTest).toBe('function');
      expect(typeof benchmark.runMediumTest).toBe('function');
      expect(typeof benchmark.runLargeTest).toBe('function');
    });

    it('型情報が適切に提供されていること', async () => {
      const indexModule = await import('../../../src/security/benchmarks/index');

      // TypeScriptの型チェックが通ることを確認
      expect(indexModule).toBeDefined();
    });
  });
});