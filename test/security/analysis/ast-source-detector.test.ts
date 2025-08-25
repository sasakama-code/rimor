/**
 * AST Source 検出器のテスト
 * TDD Red Phase - 失敗するテストから開始
 * t_wadaのTDDアプローチに従う
 */

import { ASTSourceDetector, TaintSource } from '../../../src/security/analysis/ast-source-detector';

describe('ASTSourceDetector', () => {
  let detector: ASTSourceDetector;

  beforeEach(() => {
    detector = new ASTSourceDetector();
  });

  describe('Express.js リクエストオブジェクトのSource検出', () => {
    it('req.query からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const express = require('express');
        const app = express();
        
        app.get('/user', (req, res) => {
          const userId = req.query.id;
          // userId は汚染された値
        });
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0]).toMatchObject({
        type: 'user-input',
        category: 'http-request',
        variableName: 'userId',
        apiCall: {
          functionName: 'query',
          objectName: 'req',
          arguments: []
        }
      });
      expect(sources[0].confidence).toBeGreaterThanOrEqual(0.9);
      expect(sources[0].location.line).toBe(6);
      expect(sources[0].location.column).toBeGreaterThan(0);
    });

    it('req.body からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        app.post('/user', (req, res) => {
          const userData = req.body;
          const name = req.body.name;
        });
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      
      const userDataSource = sources.find(s => s.variableName === 'userData');
      expect(userDataSource).toBeDefined();
      expect(userDataSource?.type).toBe('user-input');
      expect(userDataSource?.category).toBe('http-request');
      
      const nameSource = sources.find(s => s.variableName === 'name');
      expect(nameSource).toBeDefined();
    });

    it('req.params からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        app.get('/user/:id', (req, res) => {
          const userId = req.params.id;
        });
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0].apiCall.functionName).toBe('params');
      expect(sources[0].type).toBe('user-input');
    });

    it('req.headers からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        app.get('/api', (req, res) => {
          const authHeader = req.headers.authorization;
          const userAgent = req.headers['user-agent'];
        });
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      sources.forEach(source => {
        expect(source.type).toBe('user-input');
        expect(source.category).toBe('http-headers');
      });
    });
  });

  describe('ファイルシステムからのSource検出', () => {
    it('fs.readFile からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const fs = require('fs');
        
        function readUserData(filename) {
          const data = fs.readFileSync(filename);
          return data;
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0]).toMatchObject({
        type: 'file-input',
        category: 'filesystem',
        apiCall: {
          functionName: 'readFileSync',
          objectName: 'fs'
        }
      });
    });

    it('readFile系関数からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        import { readFile, readFileSync } from 'fs';
        
        async function loadConfig() {
          const configData = await readFile('config.json');
          const syncData = readFileSync('data.txt');
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      sources.forEach(source => {
        expect(source.type).toBe('file-input');
        expect(source.category).toBe('filesystem');
      });
    });
  });

  describe('ネットワーク入力からのSource検出', () => {
    it('fetch APIからのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        async function fetchUserData(userId) {
          const response = await fetch(\`/api/users/\${userId}\`);
          const userData = await response.json();
          return userData;
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0]).toMatchObject({
        type: 'network-input',
        category: 'http-client',
        apiCall: {
          functionName: 'fetch'
        }
      });
    });

    it('axios からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        const axios = require('axios');
        
        async function getApiData() {
          const result = await axios.get('https://api.example.com/data');
          return result.data;
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(1);
      expect(sources[0].type).toBe('network-input');
      expect(sources[0].apiCall.functionName).toBe('get');
      expect(sources[0].apiCall.objectName).toBe('axios');
    });
  });

  describe('環境変数からのSource検出', () => {
    it('process.env からのTaint Sourceを検出できる', async () => {
      // Arrange  
      const sourceCode = `
        function getDbConfig() {
          const dbUrl = process.env.DATABASE_URL;
          const apiKey = process.env['API_KEY'];
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      sources.forEach(source => {
        expect(source.type).toBe('environment');
        expect(source.category).toBe('env-variables');
      });
    });
  });

  describe('ブラウザー入力からのSource検出', () => {
    it('window.location からのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function getCurrentUrl() {
          const currentUrl = window.location.href;
          const searchParams = location.search;
          return { currentUrl, searchParams };
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      sources.forEach(source => {
        expect(source.type).toBe('user-input');
        expect(source.category).toBe('browser-location');
      });
    });

    it('document プロパティからのTaint Sourceを検出できる', async () => {
      // Arrange
      const sourceCode = `
        function getDocumentInfo() {
          const currentUrl = document.URL;
          const referrer = document.referrer;
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      sources.forEach(source => {
        expect(source.type).toBe('user-input');
        expect(source.category).toBe('browser-document');
      });
    });
  });

  describe('複合的なシナリオ', () => {
    it('複数のSource typeが混在するコードを正しく解析する', async () => {
      // Arrange
      const sourceCode = `
        const express = require('express');
        const fs = require('fs');
        
        app.post('/upload', async (req, res) => {
          const fileName = req.body.filename;      // user-input
          const fileData = fs.readFileSync(fileName); // file-input
          const apiData = await fetch('/api/validate'); // network-input
          const envVar = process.env.UPLOAD_DIR;    // environment
        });
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(4);
      
      const types = sources.map(s => s.type);
      expect(types).toContain('user-input');
      expect(types).toContain('file-input');
      expect(types).toContain('network-input');
      expect(types).toContain('environment');
    });

    it('ネストした関数呼び出しでもSourceを検出する', async () => {
      // Arrange
      const sourceCode = `
        function processRequest(req) {
          const data = JSON.parse(req.body.data);
          const config = fs.readFileSync(req.query.configFile);
        }
      `;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(3); // req.body, req.query, fs.readFileSync
      
      const userInputSources = sources.filter(s => s.type === 'user-input');
      const fileInputSources = sources.filter(s => s.type === 'file-input');
      
      expect(userInputSources).toHaveLength(2);
      expect(fileInputSources).toHaveLength(1);
    });
  });

  describe('位置情報の正確性', () => {
    it('正確な行・列番号を報告する', async () => {
      // Arrange
      const sourceCode = `const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  const userId = req.query.id;  // これは5行目
  const userData = req.body;    // これは6行目
});`;

      // Act
      const sources = await detector.detectSources(sourceCode, 'test.ts');

      // Assert
      expect(sources).toHaveLength(2);
      
      const querySource = sources.find(s => s.apiCall.functionName === 'query');
      const bodySource = sources.find(s => s.apiCall.functionName === 'body');
      
      expect(querySource?.location.line).toBe(5);
      expect(bodySource?.location.line).toBe(6);
      
      expect(querySource?.location.column).toBeGreaterThan(0);
      expect(bodySource?.location.column).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なTypeScriptコードでも適切にエラーを処理する', async () => {
      // Arrange
      const invalidCode = `
        const invalid syntax here
        req.query.id
      `;

      // Act & Assert
      await expect(detector.detectSources(invalidCode, 'invalid.ts'))
        .resolves.toBeInstanceOf(Array); // エラーではなく空配列または部分的な結果
    });

    it('空のソースコードでも正常に処理する', async () => {
      // Arrange
      const emptyCode = '';

      // Act
      const sources = await detector.detectSources(emptyCode, 'empty.ts');

      // Assert
      expect(sources).toHaveLength(0);
    });
  });
});