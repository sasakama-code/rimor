/**
 * AST Sink 検出器のテスト
 * TDD Red Phase - 失敗するテストから開始
 * t_wadaのTDDアプローチに従う
 */

import { ASTSinkDetector, TaintSink } from '../../../src/security/analysis/ast-sink-detector';

describe('ASTSinkDetector', () => {
  let detector: ASTSinkDetector;

  beforeEach(() => {
    detector = new ASTSinkDetector();
  });

  describe('SQLインジェクションSinkの検出', () => {
    it('database.query() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const mysql = require('mysql');
        const connection = mysql.createConnection({});
        
        function getUserData(userId) {
          const query = "SELECT * FROM users WHERE id = " + userId;
          const result = connection.query(query);
          return result;
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0]).toMatchObject({
        type: 'sql-injection',
        category: 'database-method',
        riskLevel: 'CRITICAL',
        dangerousFunction: {
          functionName: 'query',
          objectName: 'connection',
          dangerousParameterIndex: 0
        }
      });
      expect(sinks[0].confidence).toBeGreaterThanOrEqual(0.9);
      expect(sinks[0].location.line).toBeGreaterThan(0);
    });

    it('db.execute() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        import { db } from './database';
        
        async function updateUser(userId, name) {
          const sql = \`UPDATE users SET name = '\${name}' WHERE id = \${userId}\`;
          await db.execute(sql);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('sql-injection');
      expect(sinks[0].dangerousFunction.functionName).toBe('execute');
      expect(sinks[0].dangerousFunction.objectName).toBe('db');
    });

    it('単体のquery() 関数呼び出しを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function searchUsers(searchTerm) {
          const sql = "SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%'";
          return query(sql);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('sql-injection');
      expect(sinks[0].category).toBe('database-query');
    });
  });

  describe('パストラバーサルSinkの検出', () => {
    it('fs.readFile() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const fs = require('fs');
        
        function readUserFile(fileName) {
          const fullPath = './uploads/' + fileName;
          return fs.readFileSync(fullPath);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0]).toMatchObject({
        type: 'path-traversal',
        category: 'fs-method',
        riskLevel: 'HIGH',
        dangerousFunction: {
          functionName: 'readFileSync',
          objectName: 'fs',
          dangerousParameterIndex: 0
        }
      });
    });

    it('fs.writeFile() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        import * as fs from 'fs';
        
        function saveFile(filename, content) {
          const path = '/var/uploads/' + filename;
          fs.writeFileSync(path, content);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('path-traversal');
      expect(sinks[0].dangerousFunction.functionName).toBe('writeFileSync');
    });

    it('単体のreadFile() 関数を検出できる', async () => {
      // Arrange
      const sourceCode = `
        function loadConfig(configName) {
          const configPath = './config/' + configName;
          return readFileSync(configPath);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('path-traversal');
      expect(sinks[0].category).toBe('filesystem');
    });
  });

  describe('コマンドインジェクションSinkの検出', () => {
    it('child_process.exec() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const { exec } = require('child_process');
        
        function runCommand(userCommand) {
          const fullCommand = 'echo ' + userCommand;
          exec(fullCommand, (error, stdout, stderr) => {
            console.log(stdout);
          });
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0]).toMatchObject({
        type: 'command-injection',
        category: 'system-command',
        riskLevel: 'CRITICAL',
        dangerousFunction: {
          functionName: 'exec',
          dangerousParameterIndex: 0
        }
      });
    });

    it('child_process.spawn() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const cp = require('child_process');
        
        function executeScript(scriptName) {
          const args = [scriptName];
          cp.spawn('node', args);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('command-injection');
      expect(sinks[0].dangerousFunction.functionName).toBe('spawn');
      expect(sinks[0].dangerousFunction.objectName).toBe('cp');
    });

    it('単体のexec() 関数を検出できる', async () => {
      // Arrange
      const sourceCode = `
        function runShellCommand(cmd) {
          const fullCmd = 'bash -c "' + cmd + '"';
          return execSync(fullCmd);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('command-injection');
      expect(sinks[0].category).toBe('system-command');
    });
  });

  describe('XSSSinkの検出', () => {
    it('res.send() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        app.get('/user/:id', (req, res) => {
          const userId = req.params.id;
          const html = '<h1>User ID: ' + userId + '</h1>';
          res.send(html);
        });
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0]).toMatchObject({
        type: 'xss',
        category: 'http-response',
        riskLevel: 'HIGH',
        dangerousFunction: {
          functionName: 'send',
          objectName: 'res',
          dangerousParameterIndex: 0
        }
      });
    });

    it('document.write() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function displayMessage(userMessage) {
          const html = '<div>' + userMessage + '</div>';
          document.write(html);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('xss');
      expect(sinks[0].category).toBe('dom-manipulation');
      expect(sinks[0].dangerousFunction.functionName).toBe('write');
    });

    it('response.write() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function handleRequest(request, response) {
          const userInput = request.query.message;
          response.write('<p>' + userInput + '</p>');
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('xss');
      expect(sinks[0].dangerousFunction.objectName).toBe('response');
    });
  });

  describe('コードインジェクションSinkの検出', () => {
    it('eval() からのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function executeUserCode(userCode) {
          const result = eval(userCode);
          return result;
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0]).toMatchObject({
        type: 'code-injection',
        category: 'dynamic-execution',
        riskLevel: 'CRITICAL',
        dangerousFunction: {
          functionName: 'eval',
          dangerousParameterIndex: 0
        }
      });
      expect(sinks[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('Function() コンストラクタからのTaint Sinkを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function createDynamicFunction(code) {
          const dynamicFunc = new Function('return ' + code);
          return dynamicFunc();
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(1);
      expect(sinks[0].type).toBe('code-injection');
      expect(sinks[0].dangerousFunction.functionName).toBe('Function');
    });
  });

  describe('複合的なシナリオ', () => {
    it('複数のSink typeが混在するコードを正しく解析する', async () => {
      // Arrange
      const sourceCode = `
        const fs = require('fs');
        const { exec } = require('child_process');
        
        function processUserRequest(req, res) {
          const userInput = req.body.input;
          const filename = req.body.filename;
          const command = req.body.command;
          
          // パストラバーサル
          const fileContent = fs.readFileSync(filename);
          
          // コマンドインジェクション
          exec(command);
          
          // XSS
          res.send('<div>' + userInput + '</div>');
          
          // SQLインジェクション
          const sql = "SELECT * FROM logs WHERE data = '" + userInput + "'";
          db.query(sql);
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(4);
      
      const types = sinks.map(s => s.type);
      expect(types).toContain('path-traversal');
      expect(types).toContain('command-injection');
      expect(types).toContain('xss');
      expect(types).toContain('sql-injection');
    });

    it('ネストした関数呼び出しでもSinkを検出する', async () => {
      // Arrange
      const sourceCode = `
        function processData(data) {
          const processedData = JSON.parse(data);
          return {
            result: eval(processedData.code),
            output: exec(processedData.command)
          };
        }
      `;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(3); // JSON.parse, eval, exec
      
      const dataIntegritySink = sinks.find(s => s.type === 'data-integrity-failure');
      const codeInjectionSink = sinks.find(s => s.type === 'code-injection');
      const commandInjectionSink = sinks.find(s => s.type === 'command-injection');
      
      expect(dataIntegritySink).toBeDefined();
      expect(codeInjectionSink).toBeDefined();
      expect(commandInjectionSink).toBeDefined();
      
      // JSON.parseのSinkを検証
      expect(dataIntegritySink?.dangerousFunction.functionName).toBe('parse');
      expect(dataIntegritySink?.dangerousFunction.objectName).toBe('JSON');
    });
  });

  describe('位置情報の正確性', () => {
    it('正確な行・列番号を報告する', async () => {
      // Arrange
      const sourceCode = `const fs = require('fs');

function test() {
  fs.readFile('test.txt');     // これは4行目
  eval('console.log("hi")');   // これは5行目
}`;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks).toHaveLength(2);
      
      const pathSink = sinks.find(s => s.type === 'path-traversal');
      const codeSink = sinks.find(s => s.type === 'code-injection');
      
      expect(pathSink?.location.line).toBe(4);
      expect(codeSink?.location.line).toBe(5);
      
      expect(pathSink?.location.column).toBeGreaterThan(0);
      expect(codeSink?.location.column).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なTypeScriptコードでも適切にエラーを処理する', async () => {
      // Arrange
      const invalidCode = `
        const invalid syntax here
        eval("test");
      `;

      // Act & Assert
      await expect(detector.detectSinks(invalidCode, 'invalid.ts'))
        .resolves.toBeInstanceOf(Array); // エラーではなく配列を返す
    });

    it('空のソースコードでも正常に処理する', async () => {
      // Arrange
      const emptyCode = '';

      // Act
      const sinks = await detector.detectSinks(emptyCode, 'empty.ts');

      // Assert
      expect(sinks).toHaveLength(0);
    });
  });

  describe('リスクレベルの評価', () => {
    it('eval() はCRITICALリスクとして評価される', async () => {
      // Arrange
      const sourceCode = `eval(userInput);`;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks[0].riskLevel).toBe('CRITICAL');
    });

    it('fs.readFile() はHIGHリスクとして評価される', async () => {
      // Arrange
      const sourceCode = `fs.readFile(fileName);`;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks[0].riskLevel).toBe('HIGH');
    });

    it('res.send() はHIGHリスクとして評価される', async () => {
      // Arrange
      const sourceCode = `res.send(htmlContent);`;

      // Act
      const sinks = await detector.detectSinks(sourceCode, 'test.ts');

      // Assert
      expect(sinks[0].riskLevel).toBe('HIGH');
    });
  });
});