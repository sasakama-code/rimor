import { ScopeAnalyzer } from '../../../src/analyzers/code-context/scope';

describe('ScopeAnalyzer', () => {
  let analyzer: ScopeAnalyzer;

  beforeEach(() => {
    analyzer = new ScopeAnalyzer();
  });

  describe('analyzeScope', () => {
    it('should analyze scope at a given position', () => {
      const code = `
        function outerFunction() {
          const outerVar = 1;
          
          function innerFunction() {
            const innerVar = 2;
            // cursor position here
          }
        }
      `;
      
      const scope = analyzer.analyzeScope(code, 6, 10, 'typescript');
      
      expect(scope).toBeDefined();
      expect(scope).toHaveProperty('type');
      expect(scope).toHaveProperty('depth');
      expect(scope).toHaveProperty('availableVariables');
    });

    it('should detect global scope', () => {
      const code = `
        const globalVar = 1;
        // cursor position here
      `;
      
      const scope = analyzer.analyzeScope(code, 2, 5, 'typescript');
      
      expect(scope.type).toBe('global');
      expect(scope.depth).toBe(0);
    });

    it('should detect function scope', () => {
      const code = `
        function testFunction() {
          // cursor position here
        }
      `;
      
      const scope = analyzer.analyzeScope(code, 2, 10, 'typescript');
      
      expect(scope.type).toBe('function');
      expect(scope.depth).toBe(1);
    });

    it('should detect class scope', () => {
      const code = `
        class TestClass {
          method() {
            // cursor position here
          }
        }
      `;
      
      const scope = analyzer.analyzeScope(code, 3, 10, 'typescript');
      
      expect(scope.type).toBe('method');
      expect(scope.parentScope?.type).toBe('class');
    });
  });

  describe('findScopeChain', () => {
    it('should find complete scope chain', () => {
      const code = `
        class TestClass {
          method() {
            const closure = () => {
              // cursor position here
            };
          }
        }
      `;
      
      const chain = analyzer.findScopeChain(code, 4, 15, 'typescript');
      
      expect(chain).toBeInstanceOf(Array);
      expect(chain.length).toBeGreaterThan(1);
      expect(chain[0].type).toBe('arrow');
    });
  });

  describe('getAvailableVariables', () => {
    it('should list all available variables in scope', () => {
      const code = `
        const globalVar = 1;
        
        function test() {
          const localVar = 2;
          // cursor position here
        }
      `;
      
      const variables = analyzer.getAvailableVariables(code, 5, 10, 'typescript');
      
      expect(variables).toBeInstanceOf(Array);
      expect(variables).toContainEqual(
        expect.objectContaining({ name: 'localVar' })
      );
      expect(variables).toContainEqual(
        expect.objectContaining({ name: 'globalVar' })
      );
    });

    it('should respect block scoping', () => {
      const code = `
        function test() {
          if (true) {
            const blockVar = 1;
          }
          // cursor position here - blockVar should not be available
        }
      `;
      
      const variables = analyzer.getAvailableVariables(code, 5, 10, 'typescript');
      
      expect(variables).not.toContainEqual(
        expect.objectContaining({ name: 'blockVar' })
      );
    });
  });

  describe('isInScope', () => {
    it('should check if a variable is in scope', () => {
      const code = `
        const available = 1;
        
        function test() {
          // cursor position here
        }
      `;
      
      const inScope = analyzer.isInScope('available', code, 4, 10, 'typescript');
      
      expect(inScope).toBe(true);
    });

    it('should return false for out of scope variables', () => {
      const code = `
        function test1() {
          const notAvailable = 1;
        }
        
        function test2() {
          // cursor position here
        }
      `;
      
      const inScope = analyzer.isInScope('notAvailable', code, 6, 10, 'typescript');
      
      expect(inScope).toBe(false);
    });
  });

  describe('findNearestScope', () => {
    it('should find the nearest enclosing scope', () => {
      const code = `
        function outer() {
          const x = 1;
          {
            const y = 2;
            // cursor position here
          }
        }
      `;
      
      const scope = analyzer.findNearestScope(code, 5, 10, 'typescript');
      
      expect(scope).toBeDefined();
      expect(scope.type).toBe('block');
    });
  });
});
