/**
 * ArchitectureDetector テスト
 * Issue #65: analyzersディレクトリの責務分離
 * TDD RED段階: テストファースト
 */

import { ArchitectureDetector } from '../../../src/analyzers/structure-analysis/architecture-detector';
import { ArchitecturePattern } from '../../../src/analyzers/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('ArchitectureDetector', () => {
  let detector: ArchitectureDetector;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    detector = new ArchitectureDetector();
    jest.clearAllMocks();
  });

  describe('detectPattern', () => {
    it('MVCパターンを正しく検出する', async () => {
      // Arrange
      const mockDirectories = [
        'controllers',
        'models',
        'views',
        'routes',
        'middlewares'
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirectories);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      // Act
      const pattern = await detector.detectPattern(mockProjectPath);

      // Assert
      expect(pattern.type).toBe('mvc');
      expect(pattern.confidence).toBeGreaterThan(0.4);
      expect(pattern.evidence).toContain('controllers directory found');
      expect(pattern.evidence).toContain('models directory found');
      expect(pattern.evidence).toContain('views directory found');
    });

    it('Layeredアーキテクチャを正しく検出する', async () => {
      // Arrange
      const mockDirectories = [
        'presentation',
        'application',
        'domain',
        'infrastructure',
        'persistence'
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirectories);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      // Act
      const pattern = await detector.detectPattern(mockProjectPath);

      // Assert
      expect(pattern.type).toBe('layered');
      expect(pattern.confidence).toBeGreaterThan(0.4);
      expect(pattern.evidence).toContain('presentation directory found');
      expect(pattern.evidence).toContain('domain directory found');
    });

    it('Microservicesパターンを正しく検出する', async () => {
      // Arrange
      const mockDirectories = [
        'services',
        'api-gateway',
        'service-discovery',
        'auth-service',
        'user-service',
        'product-service'
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirectories);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      // Act
      const pattern = await detector.detectPattern(mockProjectPath);

      // Assert
      expect(pattern.type).toBe('microservices');
      expect(pattern.confidence).toBeGreaterThan(0.4);
      expect(pattern.evidence).toContain('services directory found');
    });

    it('Monolithicパターンを検出する', async () => {
      // Arrange
      const mockDirectories = [
        'src',
        'lib',
        'utils',
        'helpers'
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirectories);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      // Act
      const pattern = await detector.detectPattern(mockProjectPath);

      // Assert
      expect(pattern.type).toBe('monolithic');
      expect(pattern.confidence).toBe(0.5);
    });

    it('複数のパターンが混在する場合は最も確信度の高いものを返す', async () => {
      // Arrange
      const mockDirectories = [
        'controllers',
        'models',
        'services',
        'domain',
        'infrastructure'
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirectories);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      // Act
      const pattern = await detector.detectPattern(mockProjectPath);

      // Assert
      expect(pattern).toBeDefined();
      expect(pattern.confidence).toBeGreaterThan(0);
      expect(['mvc', 'layered', 'hybrid']).toContain(pattern.type);
    });
  });

  describe('analyzeFileStructure', () => {
    it('ファイル構造から追加の証拠を収集する', async () => {
      // Arrange
      const mockFiles = [
        'UserController.ts',
        'UserModel.ts',
        'UserService.ts',
        'UserRepository.ts'
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
      (fs.statSync as jest.Mock).mockReturnValue({ 
        isFile: () => true,
        isDirectory: () => false 
      });

      // Act
      const evidence = await detector.analyzeFileStructure(mockProjectPath);

      // Assert
      expect(evidence).toContain('Controller files detected');
      expect(evidence).toContain('Model files detected');
      expect(evidence).toContain('Service files detected');
      expect(evidence).toContain('Repository pattern detected');
    });
  });
});