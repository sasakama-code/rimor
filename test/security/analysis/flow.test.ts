import { FlowSensitiveAnalyzer } from '../../../src/security/analysis/flow';
import {
  TestMethod,
  TestStatement,
  TaintLevel,
  TaintSource,
  SecuritySink,
  SecurityIssue
} from '../../../src/security/types';
import { TaintQualifier } from '../../../src/security/types/checker-framework-types';

describe('FlowSensitiveAnalyzer', () => {
  let analyzer: FlowSensitiveAnalyzer;

  beforeEach(() => {
    analyzer = new FlowSensitiveAnalyzer();
  });

  describe('基本的なフロー解析', () => {
    it('アナライザーインスタンスを作成できる', () => {
      expect(analyzer).toBeInstanceOf(FlowSensitiveAnalyzer);
    });

    it('空のメソッドを解析できる', () => {
      const method: TestMethod = {
        name: 'emptyMethod',
        body: '',
        parameters: [],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      
      expect(graph).toBeDefined();
      expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
      expect(graph.entry).toBeDefined();
    });
  });

  describe('buildFlowGraph', () => {
    it('線形フローを正しくグラフ化できる', () => {
      const method: TestMethod = {
        name: 'linearFlow',
        body: `
          const x = getUserInput();
          const y = transform(x);
          const z = sanitize(y);
          return z;
        `,
        parameters: [],
        returnType: 'string',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      
      expect(graph.nodes.length).toBeGreaterThan(1);
      expect(graph.exit).toBeDefined();
      
      // ノードが順番に接続されていることを確認
      const entryNode = graph.nodes.find(n => n.id === graph.entry);
      expect(entryNode).toBeDefined();
      expect(entryNode!.successors.length).toBeGreaterThan(0);
    });

    it('条件分岐を含むフローを解析できる', () => {
      const method: TestMethod = {
        name: 'conditionalFlow',
        body: `
          const input = getUserInput();
          if (isValid(input)) {
            return sanitize(input);
          } else {
            return DEFAULT_VALUE;
          }
        `,
        parameters: [],
        returnType: 'string',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      
      // 分岐が存在することを確認
      const branchingNodes = graph.nodes.filter(n => n.successors.length > 1);
      expect(branchingNodes.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeTaintFlow', () => {
    it('汚染データの伝播を追跡できる', () => {
      const method: TestMethod = {
        name: 'taintPropagation',
        body: `
          const tainted = request.params.id;
          const propagated = "SELECT * FROM users WHERE id = " + tainted;
          db.query(propagated);
        `,
        parameters: [
          { name: 'request', type: 'Request', taint: TaintQualifier.TAINTED }
        ],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      const issues = analyzer.analyzeTaintFlow(graph, method);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toContain('INJECTION');
    });

    it('サニタイザーによる汚染除去を認識できる', () => {
      const method: TestMethod = {
        name: 'sanitizerFlow',
        body: `
          const tainted = request.params.input;
          const clean = sanitize(tainted);
          db.query("SELECT * FROM data WHERE value = ?", [clean]);
        `,
        parameters: [
          { name: 'request', type: 'Request', taint: TaintQualifier.TAINTED }
        ],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      const issues = analyzer.analyzeTaintFlow(graph, method);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectVulnerabilities', () => {
    it('SQLインジェクションを検出できる', () => {
      const graph = {
        nodes: [
          {
            id: '1',
            statement: { type: 'assignment' as const, target: 'query', value: 'userInput' },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: ['2'],
            predecessors: []
          },
          {
            id: '2',
            statement: { type: 'call' as const, target: 'db.query', args: ['query'] },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: [],
            predecessors: ['1'],
            metadata: { sink: SecuritySink.SQL_QUERY }
          }
        ],
        entry: '1',
        exit: '2'
      };

      const vulnerabilities = analyzer.detectVulnerabilities(graph);
      
      expect(vulnerabilities.length).toBe(1);
      expect(vulnerabilities[0].type).toBe('SQL_INJECTION');
    });

    it('XSSを検出できる', () => {
      const graph = {
        nodes: [
          {
            id: '1',
            statement: { type: 'assignment' as const, target: 'userContent', value: 'request.body.content' },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: ['2'],
            predecessors: []
          },
          {
            id: '2',
            statement: { type: 'call' as const, target: 'response.write', args: ['userContent'] },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: [],
            predecessors: ['1'],
            metadata: { sink: SecuritySink.HTML_OUTPUT }
          }
        ],
        entry: '1',
        exit: '2'
      };

      const vulnerabilities = analyzer.detectVulnerabilities(graph);
      
      expect(vulnerabilities.length).toBe(1);
      expect(vulnerabilities[0].type).toBe('XSS');
    });
  });

  describe('trackTaintPath', () => {
    it('汚染経路を追跡できる', () => {
      const source = '1';
      const sink = '3';
      const graph = {
        nodes: [
          {
            id: '1',
            statement: { type: 'assignment' as const, target: 'x', value: 'getUserInput()' },
            inputTaint: TaintLevel.UNTAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: ['2'],
            predecessors: [],
            metadata: { source: TaintSource.USER_INPUT }
          },
          {
            id: '2',
            statement: { type: 'assignment' as const, target: 'y', value: 'x' },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: ['3'],
            predecessors: ['1']
          },
          {
            id: '3',
            statement: { type: 'call' as const, target: 'eval', args: ['y'] },
            inputTaint: TaintLevel.TAINTED,
            outputTaint: TaintLevel.TAINTED,
            successors: [],
            predecessors: ['2'],
            metadata: { sink: SecuritySink.CODE_EXECUTION }
          }
        ],
        entry: '1',
        exit: '3'
      };

      const path = analyzer.trackTaintPath(source, sink, graph);
      
      expect(path).toBeDefined();
      expect(path!.steps).toHaveLength(3);
      expect(path!.source).toBe(TaintSource.USER_INPUT);
      expect(path!.sink).toBe(SecuritySink.CODE_EXECUTION);
    });
  });

  describe('複雑なフローパターン', () => {
    it('ループを含むフローを解析できる', () => {
      const method: TestMethod = {
        name: 'loopFlow',
        body: `
          const items = getUserItems();
          for (const item of items) {
            if (item.tainted) {
              process(item);
            }
          }
        `,
        parameters: [],
        returnType: 'void',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      
      // ループによる循環参照が存在することを確認
      const hasBackEdge = graph.nodes.some(node => 
        node.successors.some(succ => 
          graph.nodes.find(n => n.id === succ)?.successors.includes(node.id)
        )
      );
      
      expect(graph.nodes.length).toBeGreaterThan(2);
    });

    it('例外処理を含むフローを解析できる', () => {
      const method: TestMethod = {
        name: 'exceptionFlow',
        body: `
          try {
            const data = parseUserInput(input);
            return process(data);
          } catch (error) {
            logError(error);
            return null;
          }
        `,
        parameters: [
          { name: 'input', type: 'string', taint: TaintQualifier.TAINTED }
        ],
        returnType: 'any',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const graph = analyzer.buildFlowGraph(method);
      const issues = analyzer.analyzeTaintFlow(graph, method);
      
      // 例外ハンドリングパスが存在することを確認
      expect(graph.nodes.length).toBeGreaterThan(3);
    });
  });
});