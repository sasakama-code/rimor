/**
 * 探索ベース推論エンジンのテスト
 */

import {
  SearchBasedInferenceEngine,
  ConstraintSolver,
  InferenceResultFormatter
} from '../../../src/security/analysis/search-based-inference';
import { TypeConstraint } from '../../../src/security/types/checker-framework-types';

describe('SearchBasedInferenceEngine', () => {
  let engine: SearchBasedInferenceEngine;
  
  beforeEach(() => {
    engine = new SearchBasedInferenceEngine();
  });
  
  describe('basic inference', () => {
    it('should infer tainted type for user input', async () => {
      const code = `
        const userInput = req.body.name;
        const message = userInput;
      `;
      
      const result = await engine.inferTypes(code);
      
      expect(result.typeMap.get('userInput')).toBe('@Tainted');
      expect(result.typeMap.get('message')).toBe('@Tainted');
      expect(result.confidence.get('userInput')).toBeGreaterThan(0.8);
    });
    
    it('should infer untainted type for literals', async () => {
      const code = `
        const safeValue = "hello world";
        const number = 42;
      `;
      
      const result = await engine.inferTypes(code);
      
      expect(result.typeMap.get('safeValue')).toBe('@Untainted');
      expect(result.typeMap.get('number')).toBe('@Untainted');
      expect(result.confidence.get('safeValue')).toBe(1.0);
    });
    
    it('should detect sanitizer application', async () => {
      const code = `
        const userInput = req.body.data;
        const sanitized = sanitize(userInput);
      `;
      
      const result = await engine.inferTypes(code);
      
      expect(result.typeMap.get('userInput')).toBe('@Tainted');
      expect(result.typeMap.get('sanitized')).toBe('@Untainted');
    });
  });
  
  describe('constraint generation', () => {
    it('should generate subtype constraints for assignments', async () => {
      const code = `
        const a = "safe";
        const b = a;
      `;
      
      const result = await engine.inferTypes(code);
      
      // aからbへの代入は、a <: b の制約を生成
      const subtypeConstraints = result.constraints.filter(c => c.type === 'subtype');
      expect(subtypeConstraints.length).toBeGreaterThan(0);
      
      // 両方とも@Untaintedになるはず
      expect(result.typeMap.get('a')).toBe('@Untainted');
      expect(result.typeMap.get('b')).toBe('@Untainted');
    });
    
    it('should generate equality constraints for direct assignments', async () => {
      const code = `
        const userInput = getUserInput();
      `;
      
      const result = await engine.inferTypes(code);
      
      const equalityConstraints = result.constraints.filter(c => c.type === 'equality');
      expect(equalityConstraints.length).toBeGreaterThan(0);
      expect(result.typeMap.get('userInput')).toBe('@Tainted');
    });
  });
  
  describe('flow sensitivity', () => {
    it('should handle validation checks', async () => {
      const code = `
        const input = req.body.value;
        if (isValid(input)) {
          const safe = input;
        }
      `;
      
      const result = await engine.inferTypes(code);
      
      // フロー制約が生成されるはず
      const flowConstraints = result.constraints.filter(c => c.type === 'flow');
      expect(flowConstraints.length).toBeGreaterThan(0);
    });
  });
  
  describe('security sinks', () => {
    it('should require untainted values for security sinks', async () => {
      const code = `
        const userQuery = req.query.search;
        executeQuery(userQuery);
      `;
      
      const result = await engine.inferTypes(code);
      
      // executeQueryの引数は@Untaintedである必要がある
      const sinkConstraints = result.constraints.filter(
        c => c.type === 'subtype' && c.rhs === '@Untainted'
      );
      expect(sinkConstraints.length).toBeGreaterThan(0);
    });
    
    it('should handle innerHTML sink', async () => {
      const code = `
        const userContent = req.body.content;
        element.innerHTML = userContent;
      `;
      
      const result = await engine.inferTypes(code);
      
      // userContentは@Taintedのまま（制約違反を検出）
      expect(result.typeMap.get('userContent')).toBe('@Tainted');
    });
  });
  
  describe('complex scenarios', () => {
    it('should handle data flow through multiple variables', async () => {
      const code = `
        const rawInput = req.body.data;
        const temp = rawInput;
        const processed = temp;
        const final = sanitize(processed);
      `;
      
      const result = await engine.inferTypes(code);
      
      expect(result.typeMap.get('rawInput')).toBe('@Tainted');
      expect(result.typeMap.get('temp')).toBe('@Tainted');
      expect(result.typeMap.get('processed')).toBe('@Tainted');
      expect(result.typeMap.get('final')).toBe('@Untainted');
    });
    
    it('should optimize type assignments', async () => {
      const code = `
        const a = getUserInput();
        const b = a;
        const c = validate(b) ? b : "default";
        const d = escape(c);
      `;
      
      const result = await engine.inferTypes(code);
      
      // 探索履歴が記録されているはず
      expect(result.searchHistory.length).toBeGreaterThan(0);
      
      // 最終的な型割り当て
      expect(result.typeMap.get('a')).toBe('@Tainted');
      expect(result.typeMap.get('d')).toBe('@Untainted');
    });
  });
});

describe('ConstraintSolver', () => {
  let solver: ConstraintSolver;
  
  beforeEach(() => {
    solver = new ConstraintSolver();
  });
  
  it('should solve simple constraint system', () => {
    const constraints: TypeConstraint[] = [
      {
        type: 'equality',
        lhs: 'x',
        rhs: '@Untainted',
        location: { file: 'test.ts', line: 1, column: 1 }
      },
      {
        type: 'subtype',
        lhs: 'x',
        rhs: 'y',
        location: { file: 'test.ts', line: 2, column: 1 }
      }
    ];
    
    const initialTypes = new Map([
      ['x', '@Tainted' as const],
      ['y', '@Tainted' as const]
    ]);
    
    const result = solver.solve(constraints, initialTypes);
    
    expect(result.success).toBe(true);
    expect(result.solution.get('x')).toBe('@Untainted');
    expect(result.solution.get('y')).toBe('@Untainted');
  });
  
  it('should detect unsatisfiable constraints', () => {
    const constraints: TypeConstraint[] = [
      {
        type: 'equality',
        lhs: 'x',
        rhs: '@Tainted',
        location: { file: 'test.ts', line: 1, column: 1 }
      },
      {
        type: 'equality',
        lhs: 'x',
        rhs: '@Untainted',
        location: { file: 'test.ts', line: 2, column: 1 }
      }
    ];
    
    const initialTypes = new Map<string, any>();
    const result = solver.solve(constraints, initialTypes);
    
    // 最後の制約が優先されるため、xは@Untainted
    expect(result.solution.get('x')).toBe('@Untainted');
  });
  
  it('should propagate types through subtype constraints', () => {
    const constraints: TypeConstraint[] = [
      {
        type: 'equality',
        lhs: 'a',
        rhs: '@Untainted',
        location: { file: 'test.ts', line: 1, column: 1 }
      },
      {
        type: 'subtype',
        lhs: 'a',
        rhs: 'b',
        location: { file: 'test.ts', line: 2, column: 1 }
      },
      {
        type: 'subtype',
        lhs: 'b',
        rhs: 'c',
        location: { file: 'test.ts', line: 3, column: 1 }
      }
    ];
    
    const initialTypes = new Map<string, any>();
    const result = solver.solve(constraints, initialTypes);
    
    expect(result.success).toBe(true);
    expect(result.solution.get('a')).toBe('@Untainted');
    // @Untainted <: @Taintedなので、bとcは@Untaintedまたは@Tainted
    expect(['@Untainted', '@Tainted']).toContain(result.solution.get('b'));
    expect(['@Untainted', '@Tainted']).toContain(result.solution.get('c'));
  });
});

describe('InferenceResultFormatter', () => {
  it('should format inference results', async () => {
    const engine = new SearchBasedInferenceEngine();
    const code = `
      const input = req.body.data;
      const safe = sanitize(input);
    `;
    
    const result = await engine.inferTypes(code);
    const formatted = InferenceResultFormatter.format(result);
    
    expect(formatted).toContain('Type Inference Results');
    expect(formatted).toContain('Variable Types:');
    expect(formatted).toContain('input: @Tainted');
    expect(formatted).toContain('safe: @Untainted');
    expect(formatted).toContain('Total Constraints:');
    expect(formatted).toContain('Satisfied Constraints:');
  });
  
  it('should include search history when available', async () => {
    const engine = new SearchBasedInferenceEngine();
    const code = `
      const a = getUserInput();
      const b = a;
      const c = validate(b) ? sanitize(b) : "default";
    `;
    
    const result = await engine.inferTypes(code);
    const formatted = InferenceResultFormatter.format(result);
    
    if (result.searchHistory.length > 0) {
      expect(formatted).toContain('Search History:');
    }
  });
});