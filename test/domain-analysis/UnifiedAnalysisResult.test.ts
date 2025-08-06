/**
 * UnifiedAnalysisResult テスト
 * v0.9.0
 * 
 * TDD実践: 統合分析結果のテスト
 */

import {
  UnifiedAnalysisResult,
  UnifiedAnalysisResultBuilder,
  createUnifiedAnalysisResult,
  AnalysisMetadata,
  DomainAnalysisSection,
  StaticAnalysisSection,
  QualityScoreSection,
  RecommendationSection
} from '../../src/domain-analysis/UnifiedAnalysisResult';
import { DomainDefinition } from '../../src/domain-analysis/types';
import { Issue } from '../../src/core/types';

describe('UnifiedAnalysisResult', () => {
  describe('UnifiedAnalysisResultBuilder', () => {
    let builder: UnifiedAnalysisResultBuilder;
    
    beforeEach(() => {
      builder = new UnifiedAnalysisResultBuilder();
    });
    
    it('should build a complete UnifiedAnalysisResult', () => {
      const metadata: AnalysisMetadata = {
        targetPath: '/test/path',
        engineVersion: '0.9.0',
        plugins: ['plugin1', 'plugin2'],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 100,
          analyzedFiles: 90,
          testFiles: 40,
          sourceFiles: 50
        }
      };
      
      const domainAnalysis: DomainAnalysisSection = {
        definition: {
          version: '1.0.0',
          project: {
            name: 'test-project',
            path: '/test/path',
            analyzed: new Date()
          },
          domains: [],
          integrity: {
            hash: 'test-signature',
            timestamp: new Date(),
            version: '1.0.0'
          }
        },
        clusters: [],
        coverage: {
          termCoverage: 0.8,
          ruleCoverage: 0.7,
          domainTestRatio: 0.6
        },
        domainIssues: [],
        terms: {},
        rules: []
      };
      
      const staticAnalysis: StaticAnalysisSection = {
        issues: [],
        statistics: {
          totalIssues: 0,
          bySeverity: {},
          byPlugin: {},
          byFile: {}
        },
        metrics: {
          estimatedCoverage: 0.75,
          assertionDensity: 0.85,
          testStructureScore: 80
        }
      };
      
      const qualityScore: QualityScoreSection = {
        overall: 75,
        categories: {
          domainAlignment: 80,
          testCompleteness: 75,
          codeQuality: 70,
          security: 75,
          maintainability: 75
        },
        rationale: ['テスト品質は良好です']
      };
      
      const recommendations: RecommendationSection = {
        items: [],
        estimatedImpact: {
          scoreImprovement: 10,
          estimatedEffort: 5,
          roi: 2
        }
      };
      
      const result = builder
        .setMetadata(metadata)
        .setDomainAnalysis(domainAnalysis)
        .setStaticAnalysis(staticAnalysis)
        .setQualityScore(qualityScore)
        .setRecommendations(recommendations)
        .build();
      
      expect(result.metadata).toEqual(metadata);
      expect(result.domainAnalysis).toEqual(domainAnalysis);
      expect(result.staticAnalysis).toEqual(staticAnalysis);
      expect(result.qualityScore).toEqual(qualityScore);
      expect(result.recommendations).toEqual(recommendations);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
    
    it('should throw error when required fields are missing', () => {
      const metadata: AnalysisMetadata = {
        targetPath: '/test/path',
        engineVersion: '0.9.0',
        plugins: [],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 0,
          analyzedFiles: 0,
          testFiles: 0,
          sourceFiles: 0
        }
      };
      
      builder.setMetadata(metadata);
      
      expect(() => builder.build()).toThrow('必須フィールドが不足しています');
    });
    
    it('should set integrity hash', () => {
      const metadata: AnalysisMetadata = {
        targetPath: '/test/path',
        engineVersion: '0.9.0',
        plugins: [],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 0,
          analyzedFiles: 0,
          testFiles: 0,
          sourceFiles: 0
        }
      };
      
      const domainAnalysis: DomainAnalysisSection = {
        definition: {
          version: '1.0.0',
          project: {
            name: 'test-project',
            path: '/test/path',
            analyzed: new Date()
          },
          domains: [],
          integrity: {
            hash: 'test',
            timestamp: new Date(),
            version: '1.0.0'
          }
        },
        clusters: [],
        coverage: {
          termCoverage: 0,
          ruleCoverage: 0,
          domainTestRatio: 0
        },
        domainIssues: [],
        terms: {},
        rules: []
      };
      
      const result = builder
        .setMetadata(metadata)
        .setDomainAnalysis(domainAnalysis)
        .setStaticAnalysis({
          issues: [],
          statistics: {
            totalIssues: 0,
            bySeverity: {},
            byPlugin: {},
            byFile: {}
          },
          metrics: {}
        })
        .setQualityScore({
          overall: 0,
          categories: {
            domainAlignment: 0,
            testCompleteness: 0,
            codeQuality: 0,
            security: 0,
            maintainability: 0
          },
          rationale: []
        })
        .setRecommendations({
          items: [],
          estimatedImpact: {
            scoreImprovement: 0,
            estimatedEffort: 0,
            roi: 0
          }
        })
        .setIntegrityHash('test-hash')
        .build();
      
      expect(result.integrityHash).toBe('test-hash');
    });
  });
  
  describe('createUnifiedAnalysisResult', () => {
    it('should create a unified analysis result from components', () => {
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/test',
          analyzed: new Date()
        },
        domains: [
          {
            id: 'domain1',
            name: 'Test Domain',
            keywords: ['test', 'domain'],
            confidence: 0.9,
            files: ['/test/file1.ts']
          }
        ],
        integrity: {
          hash: 'test-signature',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
      
      const staticIssues: Issue[] = [
        {
          type: 'test-type',
          file: '/test/file1.ts',
          line: 10,
          column: 5,
          severity: 'high',
          message: 'Test issue',
          plugin: 'test-plugin'
        }
      ];
      
      const metadata: AnalysisMetadata = {
        targetPath: '/test',
        engineVersion: '0.9.0',
        plugins: ['test-plugin'],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 10,
          analyzedFiles: 10,
          testFiles: 5,
          sourceFiles: 5
        }
      };
      
      const result = createUnifiedAnalysisResult(
        domainDefinition,
        staticIssues,
        metadata
      );
      
      expect(result).toBeDefined();
      expect(result.metadata).toEqual(metadata);
      expect(result.domainAnalysis.definition).toEqual(domainDefinition);
      expect(result.staticAnalysis.issues).toEqual(staticIssues);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(result.recommendations.items).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
    
    it('should calculate statistics correctly', () => {
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/test',
          analyzed: new Date()
        },
        domains: [],
        integrity: {
          hash: 'test',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
      
      const staticIssues: Issue[] = [
        {
          type: 'test',
          file: '/test/file1.ts',
          line: 1,
          column: 1,
          severity: 'high',
          message: 'Issue 1',
          plugin: 'plugin1'
        },
        {
          type: 'test',
          file: '/test/file2.ts',
          line: 2,
          column: 2,
          severity: 'medium',
          message: 'Issue 2',
          plugin: 'plugin1'
        },
        {
          type: 'test',
          file: '/test/file1.ts',
          line: 3,
          column: 3,
          severity: 'high',
          message: 'Issue 3',
          plugin: 'plugin2'
        }
      ];
      
      const metadata: AnalysisMetadata = {
        targetPath: '/test',
        engineVersion: '0.9.0',
        plugins: ['plugin1', 'plugin2'],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 2,
          analyzedFiles: 2,
          testFiles: 2,
          sourceFiles: 0
        }
      };
      
      const result = createUnifiedAnalysisResult(
        domainDefinition,
        staticIssues,
        metadata
      );
      
      expect(result.staticAnalysis.statistics.totalIssues).toBe(3);
      expect(result.staticAnalysis.statistics.bySeverity['high']).toBe(2);
      expect(result.staticAnalysis.statistics.bySeverity['medium']).toBe(1);
      expect(result.staticAnalysis.statistics.byPlugin['plugin1']).toBe(2);
      expect(result.staticAnalysis.statistics.byPlugin['plugin2']).toBe(1);
      expect(result.staticAnalysis.statistics.byFile['/test/file1.ts']).toBe(2);
      expect(result.staticAnalysis.statistics.byFile['/test/file2.ts']).toBe(1);
    });
    
    it('should generate recommendations based on analysis', () => {
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/test',
          analyzed: new Date()
        },
        domains: [],
        integrity: {
          hash: 'test',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
      
      const staticIssues: Issue[] = [
        {
          type: 'critical',
          severity: 'critical',
          message: 'Critical issue',
          file: '/test/file.ts',
          line: 1,
          column: 1
        }
      ];
      
      const metadata: AnalysisMetadata = {
        targetPath: '/test',
        engineVersion: '0.9.0',
        plugins: ['test'],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 1,
          analyzedFiles: 1,
          testFiles: 1,
          sourceFiles: 0
        }
      };
      
      const result = createUnifiedAnalysisResult(
        domainDefinition,
        staticIssues,
        metadata
      );
      
      // 重大な問題があるため、推奨事項が生成されるはず
      expect(result.recommendations.items.length).toBeGreaterThan(0);
      
      const criticalRecommendation = result.recommendations.items.find(
        r => r.priority === 'critical'
      );
      expect(criticalRecommendation).toBeDefined();
      expect(criticalRecommendation?.title).toContain('重大な問題');
    });
    
    it('should handle empty inputs gracefully', () => {
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/test',
          analyzed: new Date()
        },
        domains: [],
        integrity: {
          hash: 'test',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
      
      const staticIssues: Issue[] = [];
      
      const metadata: AnalysisMetadata = {
        targetPath: '/test',
        engineVersion: '0.9.0',
        plugins: [],
        analysisTime: 0,
        fileStats: {
          totalFiles: 0,
          analyzedFiles: 0,
          testFiles: 0,
          sourceFiles: 0
        }
      };
      
      const result = createUnifiedAnalysisResult(
        domainDefinition,
        staticIssues,
        metadata
      );
      
      expect(result).toBeDefined();
      expect(result.staticAnalysis.statistics.totalIssues).toBe(0);
      expect(result.domainAnalysis.domainIssues).toEqual([]);
    });
  });
  
  describe('Quality Score Calculation', () => {
    it('should calculate quality scores based on coverage', () => {
      const domainDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/test',
          analyzed: new Date()
        },
        domains: [],
        integrity: {
          hash: 'test',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };
      
      const staticIssues: Issue[] = [];
      
      const metadata: AnalysisMetadata = {
        targetPath: '/test',
        engineVersion: '0.9.0',
        plugins: [],
        analysisTime: 1000,
        fileStats: {
          totalFiles: 10,
          analyzedFiles: 10,
          testFiles: 5,
          sourceFiles: 5
        }
      };
      
      const result = createUnifiedAnalysisResult(
        domainDefinition,
        staticIssues,
        metadata
      );
      
      // カバレッジに基づいてスコアが計算される
      expect(result.qualityScore.categories.domainAlignment).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.categories.domainAlignment).toBeLessThanOrEqual(100);
      expect(result.qualityScore.rationale.length).toBeGreaterThan(0);
    });
  });
});