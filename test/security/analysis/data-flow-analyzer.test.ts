/**
 * データフロー解析器のテスト
 * TDD Red Phase - 失敗するテストから開始
 * t_wadaのTDDアプローチに従う
 */

import { DataFlowAnalyzer, DataFlowAnalysisResult, DataFlowPath } from '../../../src/security/analysis/data-flow-analyzer';

describe('DataFlowAnalyzer', () => {
  let analyzer: DataFlowAnalyzer;

  beforeEach(() => {
    analyzer = new DataFlowAnalyzer();
  });

  describe('Source-Sinkペアの基本検出', () => {
    it('単純なSource-Sinkフローを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function processUser(req, res) {
          const userInput = req.body.data;  // Source
          const result = eval(userInput);   // Sink
          res.send(result);
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(1);
      expect(result.sinks).toHaveLength(2); // eval, res.send
      expect(result.paths).toHaveLength(2); // userInput -> eval, userInput -> res.send
      
      const criticalPath = result.paths.find(p => p.riskLevel === 'CRITICAL');
      expect(criticalPath).toBeDefined();
      expect(criticalPath?.source.type).toBe('user-input');
      expect(criticalPath?.sink.type).toBe('code-injection');
    });

    it('変数の代入を通じたデータフローを追跡する', async () => {
      // Arrange
      const sourceCode = `
        function handleInput(req, res) {
          const input = req.query.search;   // Source
          const query = input;              // Assignment
          const sql = "SELECT * FROM users WHERE name = '" + query + "'";
          db.query(sql);                    // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].source.type).toBe('user-input');
      expect(result.paths[0].sink.type).toBe('sql-injection');
      
      // データフローパスに代入ステップが含まれることを確認
      const assignmentStep = result.paths[0].path.find(step => step.type === 'assignment');
      expect(assignmentStep).toBeDefined();
      expect(assignmentStep?.description).toContain('代入');
    });

    it('関数パラメーターを通じたデータフローを追跡する', async () => {
      // Arrange
      const sourceCode = `
        function main(req, res) {
          const userCommand = req.body.cmd;  // Source
          executeCommand(userCommand);       // Parameter passing
        }
        
        function executeCommand(cmd) {
          exec(cmd);                         // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].source.type).toBe('user-input');
      expect(result.paths[0].sink.type).toBe('command-injection');
      
      // パラメーター渡しのステップが含まれることを確認
      const parameterStep = result.paths[0].path.find(step => step.type === 'parameter-passing');
      expect(parameterStep).toBeDefined();
    });

    it('プロパティアクセスを通じたデータフローを追跡する', async () => {
      // Arrange
      const sourceCode = `
        function processRequest(req, res) {
          const data = req.body;           // Source
          const filename = data.filename;  // Property access
          fs.readFileSync(filename);       // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].source.type).toBe('user-input');
      expect(result.paths[0].sink.type).toBe('path-traversal');
      
      // プロパティアクセスのステップが含まれることを確認
      const propertyStep = result.paths[0].path.find(step => step.type === 'property-access');
      expect(propertyStep).toBeDefined();
    });
  });

  describe('複数のSource-Sinkペア', () => {
    it('複数のSourceと複数のSinkを正しく組み合わせる', async () => {
      // Arrange
      const sourceCode = `
        function processData(req, res) {
          const userInput = req.body.data;    // Source 1
          const fileName = req.query.file;    // Source 2
          
          eval(userInput);                    // Sink 1
          fs.readFileSync(fileName);          // Sink 2
          res.send(userInput + fileName);     // Sink 3
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(2);
      expect(result.sinks).toHaveLength(3);
      expect(result.paths.length).toBeGreaterThanOrEqual(4); // 各Sourceから複数のSinkへのパス
      
      // 様々なリスクレベルのパスが含まれることを確認
      const riskLevels = result.paths.map(p => p.riskLevel);
      expect(riskLevels).toContain('CRITICAL');
      expect(riskLevels).toContain('HIGH');
    });

    it('異なる脆弱性タイプのSource-Sinkペアを検出する', async () => {
      // Arrange
      const sourceCode = `
        function vulnerableFunction(req, res) {
          const userInput = req.body.input;     // User input source
          const config = process.env.CONFIG;    // Environment source
          
          // SQL Injection
          const sql = "SELECT * FROM users WHERE id = " + userInput;
          db.query(sql);
          
          // Path Traversal
          fs.readFileSync(config + userInput);
          
          // Command Injection
          exec("echo " + userInput);
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(2); // user-input, environment
      expect(result.sinks).toHaveLength(3);   // db.query, fs.readFileSync, exec
      
      const sinkTypes = result.sinks.map(s => s.type);
      expect(sinkTypes).toContain('sql-injection');
      expect(sinkTypes).toContain('path-traversal');
      expect(sinkTypes).toContain('command-injection');
    });
  });

  describe('リスクレベルの評価', () => {
    it('user-input + code-injectionはCRITICALリスクと評価される', async () => {
      // Arrange
      const sourceCode = `
        function test(req, res) {
          const code = req.body.code;
          eval(code);
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].riskLevel).toBe('CRITICAL');
      expect(result.summary.criticalPaths).toBe(1);
    });

    it('environment + path-traversalはMEDIUMリスクと評価される', async () => {
      // Arrange
      const sourceCode = `
        function test() {
          const configPath = process.env.CONFIG_PATH;
          fs.readFileSync(configPath);
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].riskLevel).toBe('MEDIUM');
      expect(result.summary.mediumRiskPaths).toBe(1);
    });

    it('user-input + sql-injectionはCRITICALリスクと評価される', async () => {
      // Arrange
      const sourceCode = `
        function search(req, res) {
          const searchTerm = req.query.q;
          const sql = "SELECT * FROM products WHERE name LIKE '%" + searchTerm + "%'";
          db.query(sql);
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].riskLevel).toBe('CRITICAL');
    });
  });

  describe('信頼度の計算', () => {
    it('短いパスは高い信頼度を持つ', async () => {
      // Arrange
      const sourceCode = `
        function test(req, res) {
          eval(req.body.code);  // 直接的なパス
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].confidence).toBeGreaterThan(0.8);
    });

    it('長いパスは信頼度が低下する', async () => {
      // Arrange
      const sourceCode = `
        function test(req, res) {
          const input = req.body.data;    // Step 1
          const temp = input;             // Step 2: assignment
          const processed = temp;         // Step 3: assignment
          const final = processed;        // Step 4: assignment
          eval(final);                    // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.paths[0].confidence).toBeLessThan(0.8); // パス長により信頼度低下
      expect(result.paths[0].confidence).toBeGreaterThan(0.1); // 最小値保証
    });
  });

  describe('エッジケースとエラーハンドリング', () => {
    it('Sourceのみでシンクがない場合、空のパスを返す', async () => {
      // Arrange
      const sourceCode = `
        function test(req, res) {
          const userInput = req.body.data;  // Source only
          console.log(userInput);           // Safe use
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(1);
      expect(result.sinks).toHaveLength(0);
      expect(result.paths).toHaveLength(0);
      expect(result.summary.totalPaths).toBe(0);
    });

    it('Sinkのみでソースがない場合、空のパスを返す', async () => {
      // Arrange
      const sourceCode = `
        function test() {
          const safeValue = "constant";
          eval(safeValue);  // Sink only
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(0);
      expect(result.sinks).toHaveLength(1);
      expect(result.paths).toHaveLength(0);
    });

    it('SourceとSinkが関連しない場合、空のパスを返す', async () => {
      // Arrange
      const sourceCode = `
        function test(req, res) {
          const userInput = req.body.data;     // Source
          const safeValue = "constant";
          eval(safeValue);                     // Sink (not connected)
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.sources).toHaveLength(1);
      expect(result.sinks).toHaveLength(1);
      expect(result.paths).toHaveLength(0); // 関連がないためパスなし
    });

    it('空のソースコードでも正常に処理する', async () => {
      // Arrange
      const sourceCode = '';

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'empty.ts');

      // Assert
      expect(result.sources).toHaveLength(0);
      expect(result.sinks).toHaveLength(0);
      expect(result.paths).toHaveLength(0);
      expect(result.summary.totalPaths).toBe(0);
    });
  });

  describe('位置情報の正確性', () => {
    it('データフローステップの位置情報が正確', async () => {
      // Arrange
      const sourceCode = `function test(req, res) {
  const input = req.body.data;    // Line 2: Source
  const temp = input;             // Line 3: Assignment
  eval(temp);                     // Line 4: Sink
}`;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      
      const path = result.paths[0];
      expect(path.source.location.line).toBe(2);
      expect(path.sink.location.line).toBe(4);
      
      // データフローステップの位置情報も確認
      if (path.path.length > 0) {
        expect(path.path[0].location.line).toBe(3); // Assignment step
      }
    });
  });

  describe('サマリー情報', () => {
    it('複数のパスを含むサマリーが正確に計算される', async () => {
      // Arrange
      const sourceCode = `
        function multipleVulns(req, res) {
          const userInput = req.body.input;
          const fileName = req.query.file;
          
          // Critical: user-input + eval
          eval(userInput);
          
          // High: user-input + path-traversal  
          fs.readFileSync(fileName);
          
          // High: user-input + sql-injection
          db.query("SELECT * FROM users WHERE name = '" + userInput + "'");
        }
      `;

      // Act
      const result = await analyzer.analyzeDataFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.summary.totalPaths).toBeGreaterThanOrEqual(3);
      expect(result.summary.criticalPaths).toBeGreaterThanOrEqual(1);
      expect(result.summary.highRiskPaths).toBeGreaterThanOrEqual(1);
      
      // サマリーの整合性確認
      const total = result.summary.criticalPaths + result.summary.highRiskPaths + 
                    result.summary.mediumRiskPaths + result.summary.lowRiskPaths;
      expect(total).toBe(result.summary.totalPaths);
    });
  });
});