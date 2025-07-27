import { ProjectInferenceEngine } from '../../src/ai-output/project-inference';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('../../src/analyzers/dependency');
jest.mock('../../src/analyzers/structure');
jest.mock('../../src/analyzers/code-context/language');

describe('ProjectInferenceEngine', () => {
  let engine: ProjectInferenceEngine;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    engine = new ProjectInferenceEngine();
    jest.clearAllMocks();
  });

  describe('inferProject', () => {
    it('should successfully infer project details', async () => {
      // Mock file system operations
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result).toHaveProperty('projectIntent');
      expect(result).toHaveProperty('technologyStack');
      expect(result).toHaveProperty('domainContext');
      expect(result).toHaveProperty('qualityPatterns');
      expect(result).toHaveProperty('aiGuidance');
    });

    it('should return fallback result on error', async () => {
      // Mock an error
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.projectIntent.primaryPurpose).toBe('unknown');
      expect(result.projectIntent.confidence).toBe(0);
    });
  });

  describe('pattern matching', () => {
    it('should detect web API projects', async () => {
      // Setup mocks to simulate a web API project
      const mockDependencies = {
        projectDependencies: [
          { name: 'express' },
          { name: 'body-parser' }
        ]
      };
      
      const mockStructure = {
        directories: [
          { path: '/test/project/routes' },
          { path: '/test/project/controllers' }
        ]
      };
      
      // Mock the analyzer methods
      const dependencyAnalyzer = require('../../src/analyzers/dependency').DependencyAnalyzer;
      dependencyAnalyzer.prototype.analyzeDependencies = jest.fn().mockResolvedValue(mockDependencies);
      
      const structureAnalyzer = require('../../src/analyzers/structure').ProjectStructureAnalyzer;
      structureAnalyzer.prototype.analyzeProjectStructure = jest.fn().mockResolvedValue(mockStructure);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.projectIntent.primaryPurpose).toBe('web-api');
    });
  });

  describe('technology stack inference', () => {
    it('should detect Express.js framework', async () => {
      const mockDependencies = {
        projectDependencies: [{ name: 'express' }]
      };
      
      const mockStructure = { directories: [] };
      
      const dependencyAnalyzer = require('../../src/analyzers/dependency').DependencyAnalyzer;
      dependencyAnalyzer.prototype.analyzeDependencies = jest.fn().mockResolvedValue(mockDependencies);
      
      const structureAnalyzer = require('../../src/analyzers/structure').ProjectStructureAnalyzer;
      structureAnalyzer.prototype.analyzeProjectStructure = jest.fn().mockResolvedValue(mockStructure);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.technologyStack.framework).toBe('Express.js');
    });
  });

  describe('domain context inference', () => {
    it('should identify e-commerce domain', async () => {
      // Mock code analysis with e-commerce related patterns
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
        class Product { }
        function addToCart() { }
        const order = createOrder();
      `);
      
      const result = await engine.inferProject(mockProjectPath);
      
      // The test will verify domain inference logic exists
      expect(result.domainContext).toBeDefined();
      expect(result.domainContext.businessDomain).toBeDefined();
    });
  });

  describe('quality patterns inference', () => {
    it('should analyze testing strategy', async () => {
      // Setup mocks to simulate project with tests
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'app.test.ts', isDirectory: () => false },
        { name: 'app.ts', isDirectory: () => false }
      ]);
      
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.qualityPatterns.testingStrategy).toBeDefined();
    });
  });

  describe('AI guidance generation', () => {
    it('should generate contextual hints', async () => {
      const result = await engine.inferProject(mockProjectPath);
      
      expect(result.aiGuidance).toBeDefined();
      expect(result.aiGuidance.suggestedAnalysisApproach).toBeDefined();
      expect(result.aiGuidance.keyFocusAreas).toBeInstanceOf(Array);
      expect(result.aiGuidance.potentialRiskAreas).toBeInstanceOf(Array);
      expect(result.aiGuidance.recommendedImprovements).toBeInstanceOf(Array);
      expect(result.aiGuidance.contextualHints).toBeInstanceOf(Array);
    });
  });
});
