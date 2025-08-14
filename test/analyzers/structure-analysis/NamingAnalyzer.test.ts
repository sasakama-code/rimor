/**
 * NamingAnalyzer テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト (t_wada推奨)
 */

import { NamingAnalyzer } from '../../../src/analyzers/structure-analysis/naming-analyzer';
import { NamingConventions, NamingPattern } from '../../../src/analyzers/types';
import * as fs from 'fs';
import * as glob from 'glob';

jest.mock('fs');
jest.mock('glob');

describe('NamingAnalyzer', () => {
  let analyzer: NamingAnalyzer;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = glob as jest.Mocked<typeof glob>;

  beforeEach(() => {
    analyzer = new NamingAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzeNamingConventions', () => {
    it('プロジェクト全体の命名規則を分析する', async () => {
      // Arrange
      const mockFiles = [
        '/project/src/UserController.ts',
        '/project/src/utils/stringHelper.ts',
        '/project/src/models/user-model.ts'
      ];

      (mockGlob.sync as unknown as jest.Mock).mockReturnValue(mockFiles);
      mockFs.readFileSync.mockReturnValue(`
        class UserService {}
        const userName = 'test';
        function getUserData() {}
      `);

      // Act
      const result = await analyzer.analyzeNamingConventions('/project');

      // Assert
      expect(result).toBeDefined();
      expect(result.files.pattern).toBeDefined();
      expect(result.variables.pattern).toBeDefined();
      expect(result.functions.pattern).toBeDefined();
      expect(result.classes.pattern).toBeDefined();
    });
  });

  describe('analyzeFileNaming', () => {
    it('ファイル名の命名パターンを検出する', () => {
      // Arrange
      const files = [
        'UserController.ts',
        'userService.ts',
        'string-helper.ts',
        'API_CONSTANTS.ts'
      ];

      // Act
      const result = analyzer.analyzeFileNaming(files);

      // Assert
      expect(result).toBe('mixed'); // 複数パターンが混在
    });

    it('PascalCase優位のファイル名パターンを検出する', () => {
      // Arrange
      const files = [
        'UserController.ts',
        'OrderService.ts',
        'ProductModel.ts',
        'AuthMiddleware.ts'
      ];

      // Act
      const result = analyzer.analyzeFileNaming(files);

      // Assert
      expect(result).toBe('PascalCase');
    });

    it('camelCase優位のファイル名パターンを検出する', () => {
      // Arrange
      const files = [
        'userController.ts',
        'orderService.ts',
        'productModel.ts',
        'authMiddleware.ts'
      ];

      // Act
      const result = analyzer.analyzeFileNaming(files);

      // Assert
      expect(result).toBe('camelCase');
    });

    it('kebab-case優位のファイル名パターンを検出する', () => {
      // Arrange
      const files = [
        'user-controller.ts',
        'order-service.ts',
        'product-model.ts',
        'auth-middleware.ts'
      ];

      // Act
      const result = analyzer.analyzeFileNaming(files);

      // Assert
      expect(result).toBe('kebab-case');
    });
  });

  describe('analyzeVariableNaming', () => {
    it('変数名の命名パターンを分析する', () => {
      // Arrange
      const code = `
        const userName = 'John';
        let user_age = 30;
        var UserEmail = 'test@example.com';
        const MAX_RETRY = 3;
        let kebab-case = 'invalid'; // これは無効な変数名
      `;

      // Act
      const result = analyzer.analyzeVariableNaming(code);

      // Assert
      expect(result.camelCase).toContain('userName');
      expect(result.snake_case).toContain('user_age');
      expect(result.PascalCase).toContain('UserEmail');
      expect(result.SCREAMING_SNAKE_CASE).toContain('MAX_RETRY');
    });
  });

  describe('analyzeFunctionNaming', () => {
    it('関数名の命名パターンを分析する', () => {
      // Arrange
      const code = `
        function getUserData() {}
        function CalculateTotal() {}
        const fetch_user = () => {};
        function VALIDATE_INPUT() {}
      `;

      // Act
      const result = analyzer.analyzeFunctionNaming(code);

      // Assert
      expect(result.camelCase).toContain('getUserData');
      expect(result.PascalCase).toContain('CalculateTotal');
      expect(result.snake_case).toContain('fetch_user');
      expect(result.SCREAMING_SNAKE_CASE).toContain('VALIDATE_INPUT');
    });
  });

  describe('analyzeClassNaming', () => {
    it('クラス名の命名パターンを分析する', () => {
      // Arrange
      const code = `
        class UserController {}
        class orderService {}
        class product_model {}
        interface IUserRepository {}
        type TUserData = {};
      `;

      // Act
      const result = analyzer.analyzeClassNaming(code);

      // Assert
      expect(result.patterns.PascalCase).toContain('UserController');
      expect(result.patterns.camelCase).toContain('orderService');
      expect(result.patterns.snake_case).toContain('product_model');
      expect(result.interfaces).toContain('IUserRepository');
      expect(result.types).toContain('TUserData');
    });
  });

  describe('getDominantPattern', () => {
    it('最も使用頻度の高いパターンを特定する', () => {
      // Arrange
      const patterns = {
        camelCase: ['userAge', 'userName', 'getUserData', 'setUserEmail'],
        PascalCase: ['UserController'],
        snake_case: ['user_id'],
        'kebab-case': [],
        SCREAMING_SNAKE_CASE: ['MAX_LIMIT']
      };

      // Act
      const result = analyzer.getDominantPattern(patterns);

      // Assert
      expect(result).toBe('camelCase');
    });

    it('同数の場合はmixedを返す', () => {
      // Arrange
      const patterns = {
        camelCase: ['userName', 'userAge'],
        PascalCase: ['UserController', 'UserService'],
        snake_case: [],
        'kebab-case': [],
        SCREAMING_SNAKE_CASE: []
      };

      // Act
      const result = analyzer.getDominantPattern(patterns);

      // Assert
      expect(result).toBe('mixed');
    });
  });

  describe('generateNamingReport', () => {
    it('命名規則の総合レポートを生成する', () => {
      // Arrange
      const conventions: NamingConventions = {
        files: {
          pattern: 'PascalCase',
          confidence: 0.8,
          examples: ['UserController.ts', 'OrderService.ts'],
          violations: []
        },
        directories: {
          pattern: 'kebab-case',
          confidence: 0.7,
          examples: ['src', 'test'],
          violations: []
        },
        variables: {
          pattern: 'camelCase',
          confidence: 0.85,
          examples: ['userName', 'userAge'],
          violations: []
        },
        functions: {
          pattern: 'camelCase',
          confidence: 0.85,
          examples: ['getUserData', 'setUserEmail'],
          violations: []
        },
        classes: {
          pattern: 'PascalCase',
          confidence: 0.9,
          examples: ['UserController', 'OrderService'],
          violations: []
        }
      };

      // Act
      const report = analyzer.generateNamingReport(conventions);

      // Assert
      expect(report).toContain('Naming Conventions Analysis');
      expect(report).toContain('Files: PascalCase');
      expect(report).toContain('Overall Consistency');
    });
  });
});