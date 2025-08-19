/**
 * 制約ソルバーのテスト
 * Phase 3: 制約解決と自動推論のテスト
 * t_wadaのTDDアプローチに従う
 */

import { 
  ConstraintSolver, 
  ConstraintSolutionResult, 
  TaintDomain,
  ConstraintVariable,
  ConstraintRule
} from '../../../src/security/analysis/constraint-solver';
import { TypeConstraint, TypeBasedTaintInfo } from '../../../src/security/analysis/type-based-flow-analyzer';
import { TaintSource } from '../../../src/security/analysis/ast-source-detector';
import { TaintSink } from '../../../src/security/analysis/ast-sink-detector';

describe('ConstraintSolver', () => {
  let solver: ConstraintSolver;

  beforeEach(() => {
    solver = new ConstraintSolver();
  });

  describe('基本的な制約解決', () => {
    it('単純なSource制約を解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('userInput')).toBe('tainted');
      expect(result.violations).toHaveLength(0);
    });

    it('代入制約による汚染伝播を解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'input',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [{
        type: 'assignment',
        sourceVariable: 'input',
        targetVariable: 'processed',
        location: { file: 'test.ts', line: 2, column: 1 },
        description: '代入: input → processed'
      }];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('input')).toBe('tainted');
      expect(result.solution.get('processed')).toBe('tainted');
      expect(result.inferenceSteps.length).toBeGreaterThan(0);
    });

    it('チェーン代入による多段階汚染伝播を解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'original',
        apiCall: { functionName: 'req.query', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [
        {
          type: 'assignment',
          sourceVariable: 'original',
          targetVariable: 'step1',
          location: { file: 'test.ts', line: 2, column: 1 },
          description: '代入: original → step1'
        },
        {
          type: 'assignment',
          sourceVariable: 'step1',
          targetVariable: 'step2',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: '代入: step1 → step2'
        },
        {
          type: 'assignment',
          sourceVariable: 'step2',
          targetVariable: 'final',
          location: { file: 'test.ts', line: 4, column: 1 },
          description: '代入: step2 → final'
        }
      ];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('original')).toBe('tainted');
      expect(result.solution.get('step1')).toBe('tainted');
      expect(result.solution.get('step2')).toBe('tainted');
      expect(result.solution.get('final')).toBe('tainted');
      
      // 推論ステップが正しく記録されることを確認
      expect(result.inferenceSteps.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('型アノテーション制約', () => {
    it('@tainted型アノテーションを制約として適用できる', async () => {
      // Arrange
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('explicitTainted', {
        symbol: {} as any,
        taintStatus: 'tainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'tainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('explicitTainted')).toBe('tainted');
    });

    it('@untainted型アノテーションを制約として適用できる', async () => {
      // Arrange
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('explicitUntainted', {
        symbol: {} as any,
        taintStatus: 'untainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'untainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('explicitUntainted')).toBe('untainted');
    });

    it('型アノテーション制約違反を検出できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'taintedSource',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [{
        type: 'assignment',
        sourceVariable: 'taintedSource',
        targetVariable: 'shouldBeUntainted',
        location: { file: 'test.ts', line: 2, column: 1 },
        description: '代入: taintedSource → shouldBeUntainted'
      }];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('shouldBeUntainted', {
        symbol: {} as any,
        taintStatus: 'untainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'untainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      
      const violation = result.violations.find(v => 
        v.description.includes('shouldBeUntainted')
      );
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('critical');
    });
  });

  describe('パラメーター制約', () => {
    it('関数パラメーター制約による汚染伝播を解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [{
        type: 'parameter',
        sourceVariable: 'userInput',
        targetVariable: 'processedData',
        location: { file: 'test.ts', line: 2, column: 1 },
        description: 'パラメーター: userInput → processedData'
      }];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('userInput')).toBe('tainted');
      expect(result.solution.get('processedData')).toBe('tainted');
      
      // パラメーター制約による推論ステップが記録されることを確認
      const parameterStep = result.inferenceSteps.find(step => 
        step.rule.type === 'parameter'
      );
      expect(parameterStep).toBeDefined();
    });

    it('複数のパラメーター制約を同時に解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [
        {
          type: 'user-input',
          category: 'http-request',
          location: { file: 'test.ts', line: 1, column: 1, length: 10 },
          variableName: 'input1',
          apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
          confidence: 0.95
        },
        {
          type: 'user-input',
          category: 'http-request',
          location: { file: 'test.ts', line: 2, column: 1, length: 10 },
          variableName: 'input2',
          apiCall: { functionName: 'req.query', objectName: 'req', arguments: [] },
          confidence: 0.95
        }
      ];

      const typeConstraints: TypeConstraint[] = [
        {
          type: 'parameter',
          sourceVariable: 'input1',
          targetVariable: 'param1',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: 'パラメーター: input1 → param1'
        },
        {
          type: 'parameter',
          sourceVariable: 'input2',
          targetVariable: 'param2',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: 'パラメーター: input2 → param2'
        }
      ];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('input1')).toBe('tainted');
      expect(result.solution.get('input2')).toBe('tainted');
      expect(result.solution.get('param1')).toBe('tainted');
      expect(result.solution.get('param2')).toBe('tainted');
    });
  });

  describe('複合制約解決', () => {
    it('代入・パラメーター・型アノテーションの複合制約を解決できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [
        {
          type: 'assignment',
          sourceVariable: 'userInput',
          targetVariable: 'temp',
          location: { file: 'test.ts', line: 2, column: 1 },
          description: '代入: userInput → temp'
        },
        {
          type: 'parameter',
          sourceVariable: 'temp',
          targetVariable: 'processed',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: 'パラメーター: temp → processed'
        }
      ];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('processed', {
        symbol: {} as any,
        taintStatus: 'tainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'tainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('userInput')).toBe('tainted');
      expect(result.solution.get('temp')).toBe('tainted');
      expect(result.solution.get('processed')).toBe('tainted');
      
      // 複数の推論ステップが記録されることを確認
      expect(result.inferenceSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('循環制約を適切に処理できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'input',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [
        {
          type: 'assignment',
          sourceVariable: 'input',
          targetVariable: 'var1',
          location: { file: 'test.ts', line: 2, column: 1 },
          description: '代入: input → var1'
        },
        {
          type: 'assignment',
          sourceVariable: 'var1',
          targetVariable: 'var2',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: '代入: var1 → var2'
        },
        {
          type: 'assignment',
          sourceVariable: 'var2',
          targetVariable: 'var1',
          location: { file: 'test.ts', line: 4, column: 1 },
          description: '代入: var2 → var1 (循環)'
        }
      ];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.get('input')).toBe('tainted');
      expect(result.solution.get('var1')).toBe('tainted');
      expect(result.solution.get('var2')).toBe('tainted');
    });
  });

  describe('解決サマリーと統計', () => {
    it('解決サマリーを正確に計算する', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'taintedVar',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [{
        type: 'assignment',
        sourceVariable: 'taintedVar',
        targetVariable: 'anotherTainted',
        location: { file: 'test.ts', line: 2, column: 1 },
        description: '代入: taintedVar → anotherTainted'
      }];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('untaintedVar', {
        symbol: {} as any,
        taintStatus: 'untainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'untainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();
      const summary = solver.getSolutionSummary();

      // Assert
      expect(summary.totalVariables).toBe(3); // taintedVar, anotherTainted, untaintedVar
      expect(summary.solvedVariables).toBe(3);
      expect(summary.taintedVariables).toBe(2); // taintedVar, anotherTainted
      expect(summary.untaintedVariables).toBe(1); // untaintedVar
    });

    it('推論ステップの詳細を記録する', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'source',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [{
        type: 'assignment',
        sourceVariable: 'source',
        targetVariable: 'target',
        location: { file: 'test.ts', line: 2, column: 1 },
        description: '代入: source → target'
      }];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.inferenceSteps.length).toBeGreaterThan(0);
      
      const step = result.inferenceSteps[0];
      expect(step.step).toBe(1);
      expect(step.variable).toBeDefined();
      expect(step.oldValue).toBeNull();
      expect(step.newValue).toBeDefined();
      expect(step.reasoning).toContain('推論');
    });
  });

  describe('エラーハンドリング', () => {
    it('未解決制約を正確に特定する', async () => {
      // Arrange - 解決不可能な制約を作成
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('conflictVar', {
        symbol: {} as any,
        taintStatus: 'unknown',
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      // 制約がないため未解決になることを確認
      expect(result.unsolvedConstraints).toBeDefined();
    });

    it('空の入力でも正常に処理する', async () => {
      // Arrange
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];

      // Act
      await solver.initialize(typeConstraints, typeInfoMap, sources, sinks);
      const result = await solver.solve();

      // Assert
      expect(result.success).toBe(true);
      expect(result.solution.size).toBe(0);
      expect(result.violations).toHaveLength(0);
      expect(result.unsolvedConstraints).toHaveLength(0);
    });
  });
});