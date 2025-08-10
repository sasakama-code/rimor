import { PatternDetector } from '../../../src/analyzers/structure-analysis/pattern-detector';
import { ProjectStructure } from '../../../src/analyzers/types';
import * as fs from 'fs';
import * as path from 'path';

describe('PatternDetector', () => {
  let detector: PatternDetector;
  let mockProjectStructure: ProjectStructure;

  beforeEach(() => {
    detector = new PatternDetector();
    
    // モックプロジェクト構造
    mockProjectStructure = {
      rootPath: '/test/project',
      overview: {
        totalFiles: 50,
        totalDirectories: 10,
        totalLines: 5000,
        languages: [
          { language: 'TypeScript', fileCount: 30, percentage: 60, extensions: ['.ts', '.tsx'] },
          { language: 'JavaScript', fileCount: 20, percentage: 40, extensions: ['.js', '.jsx'] }
        ],
        frameworks: [
          { name: 'React', confidence: 0.9, evidence: ['package.json'] }
        ]
      },
      directories: [
        {
          path: '/test/project/src',
          purpose: 'source',
          fileCount: 30
        },
        {
          path: '/test/project/src/factories',
          purpose: 'source',
          fileCount: 5
        }
      ],
      architecture: {
        type: 'mvc',
        confidence: 0.8,
        evidence: ['controllers/', 'models/', 'views/'],
        suggestions: ['Consider implementing dependency injection']
      },
      namingConventions: {
        files: { camelCase: 20, PascalCase: 10, kebabCase: 20, snakeCase: 0 },
        directories: { camelCase: 5, PascalCase: 0, kebabCase: 5, snakeCase: 0 },
        variables: { camelCase: 100, PascalCase: 0, kebabCase: 0, snakeCase: 0 },
        functions: { camelCase: 50, PascalCase: 0, kebabCase: 0, snakeCase: 0 },
        classes: { camelCase: 0, PascalCase: 30, kebabCase: 0, snakeCase: 0 }
      },
      metrics: {
        complexity: {
          averageCyclomaticComplexity: 10,
          maxComplexity: 15,
          complexFiles: ['file1.ts', 'file2.ts'],
          totalFunctions: 50,
          averageFunctionLength: 20
        },
        maintainability: {
          maintainabilityIndex: 75,
          duplicatedCodePercentage: 5,
          averageFileSize: 100,
          largeFiles: ['file1.ts', 'file2.ts'],
          longFunctions: ['func1', 'func2', 'func3']
        },
        testability: {
          testCoverage: 70,
          testableClasses: 25,
          untestableClasses: 5,
          mockability: 0.8
        },
        documentation: {
          documentedFunctions: 80,
          documentedClasses: 90,
          documentationCoverage: 60,
          readmeQuality: 0.8
        }
      }
    };
  });

  describe('detectDesignPatterns', () => {
    it('should detect Singleton pattern', () => {
      const fileContent = `
        export class DatabaseConnection {
          private static instance: DatabaseConnection;
          
          private constructor() {}
          
          public static getInstance(): DatabaseConnection {
            if (!DatabaseConnection.instance) {
              DatabaseConnection.instance = new DatabaseConnection();
            }
            return DatabaseConnection.instance;
          }
        }
      `;
      
      const patterns = detector.detectDesignPatterns(fileContent, 'DatabaseConnection.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'Singleton',
          confidence: expect.any(Number),
          location: 'DatabaseConnection.ts'
        })
      );
    });

    it('should detect Factory pattern', () => {
      const fileContent = `
        export class AnimalFactory {
          createAnimal(type: string): Animal {
            switch(type) {
              case 'dog':
                return new Dog();
              case 'cat':
                return new Cat();
              default:
                throw new Error('Unknown animal type');
            }
          }
        }
      `;
      
      const patterns = detector.detectDesignPatterns(fileContent, 'AnimalFactory.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'Factory',
          confidence: expect.any(Number),
          location: 'AnimalFactory.ts'
        })
      );
    });

    it('should detect Observer pattern', () => {
      const fileContent = `
        export class EventEmitter {
          private listeners: Map<string, Function[]> = new Map();
          
          on(event: string, callback: Function) {
            if (!this.listeners.has(event)) {
              this.listeners.set(event, []);
            }
            this.listeners.get(event)!.push(callback);
          }
          
          emit(event: string, data: any) {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
          }
        }
      `;
      
      const patterns = detector.detectDesignPatterns(fileContent, 'EventEmitter.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'Observer',
          confidence: expect.any(Number),
          location: 'EventEmitter.ts'
        })
      );
    });
  });

  describe('detectAntiPatterns', () => {
    it('should detect God Object anti-pattern', () => {
      const fileContent = `
        export class ApplicationManager {
          private database: Database;
          private logger: Logger;
          private auth: AuthService;
          private email: EmailService;
          private cache: CacheService;
          private queue: QueueService;
          private analytics: AnalyticsService;
          
          connectDatabase() { }
          disconnectDatabase() { }
          logMessage() { }
          logError() { }
          authenticateUser() { }
          authorizeUser() { }
          sendEmail() { }
          queueEmail() { }
          cacheData() { }
          getCachedData() { }
          trackEvent() { }
          generateReport() { }
          // ... 50 more methods
        }
      `;
      
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'ApplicationManager.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'God Object',
          severity: 'high',
          location: 'ApplicationManager.ts',
          recommendation: expect.stringContaining('Single Responsibility')
        })
      );
    });

    it('should detect Spaghetti Code anti-pattern', () => {
      const fileContent = `
        function processData(data: any) {
          if (data) {
            if (data.type === 'A') {
              if (data.value > 10) {
                if (data.flag) {
                  for (let i = 0; i < data.items.length; i++) {
                    if (data.items[i].valid) {
                      for (let j = 0; j < data.items[i].subitems.length; j++) {
                        if (data.items[i].subitems[j].active) {
                          // Deep nested logic
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'processData.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'Spaghetti Code',
          severity: 'medium',
          location: 'processData.ts',
          recommendation: expect.stringContaining('refactor')
        })
      );
    });

    it('should detect Copy-Paste Programming anti-pattern', () => {
      const fileContent = `
        function calculateTax1(amount: number) {
          const taxRate = 0.2;
          const deduction = 1000;
          return (amount - deduction) * taxRate;
        }
        
        function calculateTax2(amount: number) {
          const taxRate = 0.2;
          const deduction = 1000;
          return (amount - deduction) * taxRate;
        }
        
        function calculateTax3(amount: number) {
          const taxRate = 0.2;
          const deduction = 1000;
          return (amount - deduction) * taxRate;
        }
      `;
      
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'taxes.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'Copy-Paste Programming',
          severity: 'medium',
          location: 'taxes.ts',
          recommendation: expect.stringContaining('DRY')
        })
      );
    });
  });

  describe('analyzeProjectPatterns', () => {
    it('should analyze patterns across the entire project', async () => {
      const analysis = await detector.analyzeProjectPatterns(mockProjectStructure);
      
      expect(analysis).toHaveProperty('designPatterns');
      expect(analysis).toHaveProperty('antiPatterns');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('score');
      
      expect(analysis.designPatterns).toBeInstanceOf(Array);
      expect(analysis.antiPatterns).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should provide recommendations based on detected patterns', async () => {
      const analysis = await detector.analyzeProjectPatterns(mockProjectStructure);
      
      if (analysis.antiPatterns.length > 0) {
        expect(analysis.recommendations.length).toBeGreaterThan(0);
        expect(analysis.recommendations[0]).toHaveProperty('pattern');
        expect(analysis.recommendations[0]).toHaveProperty('action');
        expect(analysis.recommendations[0]).toHaveProperty('priority');
      }
    });

    it('should calculate pattern quality score', async () => {
      const analysis = await detector.analyzeProjectPatterns(mockProjectStructure);
      
      // Score should be lower if anti-patterns are detected
      if (analysis.antiPatterns.length > 0) {
        expect(analysis.score).toBeLessThan(80);
      }
      
      // Score should be higher if design patterns are properly used
      if (analysis.designPatterns.length > analysis.antiPatterns.length) {
        expect(analysis.score).toBeGreaterThan(50);
      }
    });
  });

  describe('generatePatternReport', () => {
    it('should generate comprehensive pattern report', async () => {
      const analysis = await detector.analyzeProjectPatterns(mockProjectStructure);
      const report = detector.generatePatternReport(analysis);
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('designPatterns');
      expect(report).toHaveProperty('antiPatterns');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('metrics');
      
      expect(report.summary).toHaveProperty('totalDesignPatterns');
      expect(report.summary).toHaveProperty('totalAntiPatterns');
      expect(report.summary).toHaveProperty('overallScore');
      expect(report.summary).toHaveProperty('grade');
    });

    it('should format report for readability', async () => {
      const analysis = await detector.analyzeProjectPatterns(mockProjectStructure);
      const report = detector.generatePatternReport(analysis);
      
      expect(report.summary.grade).toMatch(/^[A-F]$/);
      expect(report.metrics).toHaveProperty('patternDiversity');
      expect(report.metrics).toHaveProperty('antiPatternSeverity');
    });
  });

  describe('edge cases', () => {
    it('should handle empty files gracefully', () => {
      const patterns = detector.detectDesignPatterns('', 'empty.ts');
      const antiPatterns = detector.detectAntiPatterns('', 'empty.ts');
      
      expect(patterns).toEqual([]);
      expect(antiPatterns).toEqual([]);
    });

    it('should handle malformed code', () => {
      const malformedCode = 'class { invalid syntax }}}';
      
      expect(() => {
        detector.detectDesignPatterns(malformedCode, 'malformed.ts');
      }).not.toThrow();
      
      expect(() => {
        detector.detectAntiPatterns(malformedCode, 'malformed.ts');
      }).not.toThrow();
    });

    it('should handle very large files', () => {
      const largeFile = 'const x = 1;\n'.repeat(10000);
      
      const patterns = detector.detectDesignPatterns(largeFile, 'large.ts');
      const antiPatterns = detector.detectAntiPatterns(largeFile, 'large.ts');
      
      expect(patterns).toBeDefined();
      expect(antiPatterns).toBeDefined();
    });
  });
});