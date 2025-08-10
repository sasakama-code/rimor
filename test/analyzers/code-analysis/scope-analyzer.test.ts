import { ScopeAnalyzer } from '../../../src/analyzers/code-analysis/scope-analyzer';

describe('ScopeAnalyzer', () => {
  let analyzer: ScopeAnalyzer;

  beforeEach(() => {
    analyzer = new ScopeAnalyzer();
  });

  describe('analyzeScopeContext', () => {
    it('should analyze scope at a given position', async () => {
      const code = `
        function outerFunction() {
          const outerVar = 1;
          
          function innerFunction() {
            const innerVar = 2;
            // cursor position here
          }
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 7);
      const scope = analyzer.findScopeAtLine(scopes, 7);
      
      expect(scope).toBeDefined();
      expect(scope).toHaveProperty('type');
      expect(scope).toHaveProperty('level');
      expect(scope).toHaveProperty('variables');
    });

    it('should detect global scope', async () => {
      const code = `
        const globalVar = 1;
        // cursor position here
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 3);
      const scope = analyzer.findScopeAtLine(scopes, 3);
      
      expect(scope?.type).toBe('global');
      expect(scope?.level).toBe(0);
    });

    it('should detect function scope', async () => {
      const code = `
        function testFunction() {
          // cursor position here
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 3);
      const scope = analyzer.findScopeAtLine(scopes, 3);
      
      expect(scope?.type).toBe('function');
      expect(scope?.level).toBe(1);
    });

    it('should detect class scope', async () => {
      const code = `
        class TestClass {
          method() {
            // cursor position here
          }
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 4);
      const scope = analyzer.findScopeAtLine(scopes, 4);
      
      expect(scope?.type).toBe('function');
      expect(scope?.parentScope).toBeDefined();
    });
  });

  describe('getScopeHierarchy', () => {
    it('should find complete scope hierarchy', async () => {
      const code = `
        class TestClass {
          method() {
            const closure = () => {
              // cursor position here
            };
          }
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 5);
      const chain = analyzer.getScopeHierarchy(scopes, 5);
      
      expect(chain).toBeInstanceOf(Array);
      expect(chain.length).toBeGreaterThan(0);
      
      // 階層に何が含まれているか確認
      const hasGlobal = chain.some(scope => scope.type === 'global');
      expect(hasGlobal).toBe(true);
    });
  });

  describe('getVariablesInScope', () => {
    it('should list all available variables in scope', async () => {
      const code = `
        const globalVar = 1;
        
        function test() {
          const localVar = 2;
          // cursor position here
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 6);
      const currentScope = analyzer.findScopeAtLine(scopes, 6);
      const localVariables = analyzer.getVariablesInScope(currentScope!);
      
      // 現在のスコープの変数をチェック
      expect(localVariables).toBeInstanceOf(Array);
      expect(localVariables).toContain('localVar');
      
      // グローバルスコープの変数は階層をたどって取得
      const hierarchy = analyzer.getScopeHierarchy(scopes, 6);
      const allVariables = new Set(hierarchy.flatMap(scope => analyzer.getVariablesInScope(scope)));
      expect(allVariables.has('globalVar')).toBe(true);
    });

    it('should respect block scoping', async () => {
      const code = `
        function test() {
          if (true) {
            const blockVar = 1;
          }
          // cursor position here - blockVar should not be available
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 6);
      const scope = analyzer.findScopeAtLine(scopes, 6);
      const variables = analyzer.getVariablesInScope(scope!);
      
      expect(variables).not.toContain('blockVar');
    });
  });

  describe('variable scope analysis', () => {
    it('should find variables in scope', async () => {
      const code = `
        const available = 1;
        
        function test() {
          // cursor position here
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 5);
      const hierarchy = analyzer.getScopeHierarchy(scopes, 5);
      
      // グローバルスコープの変数がアクセス可能
      const allVariables = new Set<string>();
      for (const scope of hierarchy) {
        const vars = analyzer.getVariablesInScope(scope);
        vars.forEach(v => allVariables.add(v));
      }
      
      expect(Array.from(allVariables)).toContain('available');
    });

    it('should not include out of scope variables', async () => {
      const code = `
        function test1() {
          const notAvailable = 1;
        }
        
        function test2() {
          // cursor position here
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 7);
      const currentScope = analyzer.findScopeAtLine(scopes, 7);
      const availableVars = analyzer.getVariablesInScope(currentScope!);
      
      expect(availableVars).not.toContain('notAvailable');
    });
  });

  describe('findScopeAtLine', () => {
    it('should find the nearest enclosing scope', async () => {
      const code = `
        function outer() {
          const x = 1;
          {
            const y = 2;
            // cursor position here
          }
        }
      `;
      
      const scopes = await analyzer.analyzeScopeContext(code, 6);
      const scope = analyzer.findScopeAtLine(scopes, 6);
      
      expect(scope).toBeDefined();
      expect(scope?.type).toBe('block');
    });
  });
});
