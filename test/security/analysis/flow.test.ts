/**
 * flow.test.ts
 * フロー解析システムのテスト
 */

import { FlowSensitiveAnalyzer, FlowGraph } from '../../../src/security/analysis/flow';

describe('FlowSensitiveAnalyzer - フロー解析システム', () => {
  let analyzer: FlowSensitiveAnalyzer;

  beforeEach(() => {
    analyzer = new FlowSensitiveAnalyzer();
  });

  describe('基本的なフロー解析', () => {
    it('データフローグラフを構築すること', () => {
      const code = `
        function processData(input) {
          const step1 = sanitize(input);
          const step2 = validate(step1);
          return process(step2);
        }
      `;

      const flowGraph = analyzer.buildFlowGraph(code);

      expect(flowGraph).toBeDefined();
      expect(flowGraph.nodes.length).toBeGreaterThan(0);
      expect(flowGraph.edges.length).toBeGreaterThan(0);
      expect(flowGraph.entryPoints.length).toBeGreaterThan(0);
      expect(flowGraph.exitPoints.length).toBeGreaterThan(0);
    });

    it('制御フローを正確に追跡すること', () => {
      const code = `
        function conditional(input) {
          if (input.isValid) {
            return processValid(input);
          } else {
            return processInvalid(input);
          }
        }
      `;

      const flowGraph = analyzer.buildFlowGraph(code);

      expect(flowGraph.conditionalPaths.length).toBe(2);
      expect(flowGraph.nodes.some(n => n.type === 'condition')).toBe(true);
      expect(flowGraph.nodes.some(n => n.type === 'branch')).toBe(true);
    });

    it('ループ構造を適切に処理すること', () => {
      const code = `
        function processArray(arr) {
          const results = [];
          for (let i = 0; i < arr.length; i++) {
            const processed = process(arr[i]);
            results.push(processed);
          }
          return results;
        }
      `;

      const flowGraph = analyzer.buildFlowGraph(code);

      expect(flowGraph.loops.length).toBe(1);
      expect(flowGraph.loops[0].type).toBe('for');
      expect(flowGraph.loops[0].bodyNodes.length).toBeGreaterThan(0);
    });
  });

  describe('汚染分析', () => {
    it('汚染源を特定すること', () => {
      const code = `
        function handleUserInput(userInput, dbQuery) {
          const result1 = process(userInput); // 汚染源
          const result2 = process(dbQuery); // 汚染源
          return combine(result1, result2);
        }
      `;

      const taintSources = analyzer.identifyTaintSources(code);

      expect(taintSources.length).toBe(2);
      expect(taintSources.some(s => s.name === 'userInput')).toBe(true);
      expect(taintSources.some(s => s.name === 'dbQuery')).toBe(true);
      expect(taintSources[0].taintLevel).toBe('high');
    });

    it('汚染の伝播を追跡すること', () => {
      const code = `
        function propagateTaint(taintedInput) {
          const step1 = firstProcess(taintedInput);
          const step2 = secondProcess(step1);
          const step3 = thirdProcess(step2);
          return step3;
        }
      `;

      const propagation = analyzer.traceTaintPropagation(code, 'taintedInput');

      expect(propagation).toBeDefined();
      expect(propagation.path.length).toBe(4); // input -> step1 -> step2 -> step3
      expect(propagation.taintLevel).toBe('high');
      expect(propagation.reachesExit).toBe(true);
    });

    it('サニタイザーによる汚染除去を検出すること', () => {
      const code = `
        function sanitizeAndProcess(taintedInput) {
          const cleaned = sanitize(taintedInput); // サニタイザー
          const validated = validate(cleaned); // 追加検証
          return safeProcess(validated);
        }
      `;

      const analysis = analyzer.analyzeTaintFlow(code);

      expect(analysis.sanitizers.length).toBe(2);
      expect(analysis.sanitizers[0].function).toBe('sanitize');
      expect(analysis.sanitizers[1].function).toBe('validate');
      expect(analysis.finalTaintLevel).toBe('clean');
    });

    it('汚染違反を検出すること', () => {
      const code = `
        function unsafeFlow(userInput) {
          const processed = lightProcess(userInput); // 不十分なサニタイゼーション
          return dangerousOperation(processed); // 危険な操作
        }
      `;

      const violations = analyzer.detectTaintViolations(code);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('taint-violation');
      expect(violations[0].severity).toBe('high');
      expect(violations[0].source).toBe('userInput');
      expect(violations[0].sink).toBe('dangerousOperation');
    });
  });

  describe('パス解析', () => {
    it('すべての実行パスを列挙すること', () => {
      const code = `
        function multiplePaths(input) {
          if (input.type === 'A') {
            if (input.valid) {
              return processA(input);
            } else {
              return errorA(input);
            }
          } else {
            return processB(input);
          }
        }
      `;

      const paths = analyzer.enumerateExecutionPaths(code);

      expect(paths.length).toBe(3); // A-valid, A-invalid, B
      expect(paths.every(p => p.length > 0)).toBe(true);
      expect(paths.some(p => p.includes('processA'))).toBe(true);
      expect(paths.some(p => p.includes('errorA'))).toBe(true);
      expect(paths.some(p => p.includes('processB'))).toBe(true);
    });

    it('デッドコードを検出すること', () => {
      const code = `
        function withDeadCode(input) {
          if (true) {
            return process(input);
          }
          return deadCode(input); // 到達不可能
        }
      `;

      const analysis = analyzer.analyzeReachability(code);

      expect(analysis.deadCode.length).toBe(1);
      expect(analysis.deadCode[0].function).toBe('deadCode');
      expect(analysis.reachabilityScore).toBeLessThan(1.0);
    });

    it('循環参照を検出すること', () => {
      const code = `
        function circularFlow(input) {
          return processA(input);
        }
        
        function processA(data) {
          if (data.recurse) {
            return processB(data);
          }
          return data;
        }
        
        function processB(data) {
          return processA(data); // 循環参照
        }
      `;

      const cycles = analyzer.detectCycles(code);

      expect(cycles.length).toBe(1);
      expect(cycles[0].functions).toContain('processA');
      expect(cycles[0].functions).toContain('processB');
      expect(cycles[0].severity).toBe('medium');
    });
  });

  describe('型フロー解析', () => {
    it('型の伝播を追跡すること', () => {
      const code = `
        function typeFlow(input: string) {
          const processed: ProcessedString = process(input);
          const validated: ValidatedString = validate(processed);
          return store(validated);
        }
      `;

      const typeFlow = analyzer.analyzeTypeFlow(code);

      expect(typeFlow).toBeDefined();
      expect(typeFlow.typeTransitions.length).toBe(3);
      expect(typeFlow.typeTransitions[0].from).toBe('string');
      expect(typeFlow.typeTransitions[0].to).toBe('ProcessedString');
      expect(typeFlow.finalType).toBe('ValidatedString');
    });

    it('型安全性違反を検出すること', () => {
      const code = `
        function typeViolation(input: any) {
          const unsafe: string = input; // 型安全性違反
          return process(unsafe);
        }
      `;

      const violations = analyzer.detectTypeViolations(code);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('unsafe-type-cast');
      expect(violations[0].severity).toBe('medium');
    });
  });

  describe('パフォーマンス最適化', () => {
    it('大きなフロートグラフを効率的に処理すること', () => {
      const largeCode = Array.from({ length: 100 }, (_, i) => 
        `function func${i}(input) { return process${i}(input); }`
      ).join('\n');

      const startTime = Date.now();
      const flowGraph = analyzer.buildFlowGraph(largeCode);
      const endTime = Date.now();

      expect(flowGraph).toBeDefined();
      expect(endTime - startTime).toBeLessThan(3000); // 3秒以内
      expect(flowGraph.nodes.length).toBeGreaterThan(100);
    });

    it('キャッシュを使用して重複処理を避けること', () => {
      const code = `
        function cachedAnalysis(input) {
          return process(input);
        }
      `;

      // 初回解析
      const startTime1 = Date.now();
      const result1 = analyzer.buildFlowGraph(code);
      const endTime1 = Date.now();
      const firstTime = endTime1 - startTime1;

      // 2回目解析（キャッシュ利用）
      const startTime2 = Date.now();
      const result2 = analyzer.buildFlowGraph(code);
      const endTime2 = Date.now();
      const secondTime = endTime2 - startTime2;

      expect(result2).toEqual(result1);
      expect(secondTime).toBeLessThanOrEqual(firstTime);
    });
  });

  describe('可視化とレポート', () => {
    it('フロートグラフを可視化用データに変換すること', () => {
      const code = `
        function visualizeFlow(input) {
          const step1 = process(input);
          if (step1.valid) {
            return success(step1);
          }
          return error(step1);
        }
      `;

      const flowGraph = analyzer.buildFlowGraph(code);
      const visualization = analyzer.generateVisualizationData(flowGraph);

      expect(visualization).toBeDefined();
      expect(visualization.nodes.length).toBeGreaterThan(0);
      expect(visualization.edges.length).toBeGreaterThan(0);
      expect(visualization.layout).toBeDefined();
    });

    it('フロー解析レポートを生成すること', () => {
      const code = `
        function reportableFlow(input) {
          const sanitized = sanitize(input);
          const processed = process(sanitized);
          return store(processed);
        }
      `;

      const analysis = analyzer.performFullAnalysis(code);
      const report = analyzer.generateFlowReport(analysis);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.flowGraph).toBeDefined();
      expect(report.taintAnalysis).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('構文エラーのあるコードでもクラッシュしないこと', () => {
      const invalidCode = `
        function broken() {
          return invalid syntax
        }
      `;

      expect(() => {
        const result = analyzer.buildFlowGraph(invalidCode);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('空のコードを適切に処理すること', () => {
      const flowGraph = analyzer.buildFlowGraph('');

      expect(flowGraph).toBeDefined();
      expect(flowGraph.nodes).toHaveLength(0);
      expect(flowGraph.edges).toHaveLength(0);
    });

    it('無限ループを検出して適切に処理すること', () => {
      const infiniteLoopCode = `
        function infiniteLoop() {
          while (true) {
            process();
          }
        }
      `;

      const analysis = analyzer.analyzeWithTimeout(infiniteLoopCode, 5000);

      expect(analysis).toBeDefined();
      expect(analysis.timeout).toBe(true);
      expect(analysis.partialResult).toBeDefined();
    });
  });
});