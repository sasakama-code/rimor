import { ITestQualityPlugin, DetectionResult, QualityScore, Improvement, ProjectContext, TestFile } from '../src/core/types';

describe('ITestQualityPlugin interface', () => {
  // モックプラグインの実装
  class MockTestQualityPlugin implements ITestQualityPlugin {
    id = 'mock-plugin';
    name = 'Mock Test Quality Plugin';
    version = '1.0.0';
    type = 'core' as const;

    isApplicable(_context: ProjectContext): boolean {
      return true;
    }

    async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
      return [{
        patternId: 'test-pattern',
        patternName: 'Test Pattern',
        location: {
          file: 'test.ts',
          line: 1,
          column: 1,
          endLine: 1
        },
        confidence: 0.9,
        evidence: [{
          type: 'code',
          description: 'Test evidence',
          location: { file: 'test.ts', line: 1, column: 1 },
          code: 'expect(true).toBe(true);',
          confidence: 0.9
        }]
      }];
    }

    evaluateQuality(patterns: DetectionResult[]): QualityScore {
      return {
        overall: 80,
        breakdown: {
          completeness: 80,
          correctness: 80,
          maintainability: 80
        },
        confidence: 0.8,
        metadata: { explanation: 'Good quality test with room for improvement' }
      };
    }

    suggestImprovements(_evaluation: QualityScore): Improvement[] {
      return [{
        id: 'improvement-1',
        priority: 'medium',
        type: 'add',
        title: 'Add more assertions',
        description: 'Consider adding more comprehensive assertions',
        location: {
          file: 'test.ts',
          line: 1,
          column: 1,
          endLine: 1
        },
        estimatedImpact: {
          scoreImprovement: 10,
          effortMinutes: 15
        },
        automatable: false
      }];
    }
  }

  let mockPlugin: ITestQualityPlugin;
  let mockProjectContext: ProjectContext;
  let mockTestFile: TestFile;

  beforeEach(() => {
    mockPlugin = new MockTestQualityPlugin();
    mockProjectContext = {
      rootPath: '/test/project',
      language: 'typescript',
      testFramework: 'jest',
      filePatterns: {
        test: ['**/*.test.ts'],
        source: ['**/*.ts'],
        ignore: ['**/node_modules/**']
      }
    };
    mockTestFile = {
      path: '/test/project/test.ts',
      content: 'expect(true).toBe(true);',
      metadata: {
        framework: 'jest',
        language: 'typescript',
        lastModified: new Date()
      }
    };
  });

  it('should have required plugin identification properties', () => {
    expect(mockPlugin.id).toBeDefined();
    expect(mockPlugin.name).toBeDefined();
    expect(mockPlugin.version).toBeDefined();
    expect(['core', 'framework', 'pattern', 'domain']).toContain(mockPlugin.type);
  });

  it('should implement isApplicable method', () => {
    const result = mockPlugin.isApplicable(mockProjectContext);
    expect(typeof result).toBe('boolean');
  });

  it('should implement detectPatterns method', async () => {
    const patterns = await mockPlugin.detectPatterns(mockTestFile);
    expect(Array.isArray(patterns)).toBe(true);
    
    if (patterns.length > 0) {
      const pattern = patterns[0];
      expect(pattern.patternId).toBeDefined();
      expect(pattern.patternName).toBeDefined();
      expect(pattern.location).toBeDefined();
      expect(pattern.confidence).toBeGreaterThanOrEqual(0);
      expect(pattern.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(pattern.evidence)).toBe(true);
    }
  });

  it('should implement evaluateQuality method', () => {
    const mockPatterns: DetectionResult[] = [{
      patternId: 'test-pattern',
      patternName: 'Test Pattern',
      location: {
        file: 'test.ts',
        line: 1,
        column: 1,
        endLine: 1
      },
      confidence: 0.9,
      evidence: []
    }];

    const quality = mockPlugin.evaluateQuality(mockPatterns);
    expect(quality.overall).toBeGreaterThanOrEqual(0);
    expect(quality.overall).toBeLessThanOrEqual(100);
    expect(typeof quality.breakdown).toBe('object');
    expect(quality.confidence).toBeGreaterThanOrEqual(0);
    expect(quality.confidence).toBeLessThanOrEqual(1);
    expect(typeof quality.metadata?.explanation).toBe('string');
  });

  it('should implement suggestImprovements method', () => {
    const mockQuality: QualityScore = {
      overall: 80,
      breakdown: { completeness: 80, correctness: 80, maintainability: 80 },
      confidence: 0.8,
      metadata: { explanation: 'Test quality' }
    };

    const improvements = mockPlugin.suggestImprovements(mockQuality);
    expect(Array.isArray(improvements)).toBe(true);
    
    if (improvements.length > 0) {
      const improvement = improvements[0];
      expect(improvement.id).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(improvement.priority);
      expect(['add', 'modify', 'remove', 'refactor']).toContain(improvement.type);
      expect(improvement.title).toBeDefined();
      expect(improvement.description).toBeDefined();
      expect(improvement.location).toBeDefined();
      expect(improvement.estimatedImpact).toBeDefined();
      expect(typeof improvement.automatable).toBe('boolean');
    }
  });
});

describe('DetectionResult type', () => {
  it('should have correct structure', () => {
    const result: DetectionResult = {
      patternId: 'test-id',
      patternName: 'Test Pattern',
      location: {
        file: 'test.ts',
        line: 1,
        column: 1,
        endLine: 2
      },
      confidence: 0.95,
      evidence: [{
        type: 'code',
        description: 'Code evidence',
        location: { file: 'test.ts', line: 1, column: 1 },
        code: 'test code',
        confidence: 0.9
      }],
      metadata: {
        customProperty: 'value'
      }
    };

    expect(result.patternId).toBe('test-id');
    expect(result.confidence).toBe(0.95);
    expect(result.evidence[0].type).toBe('code');
  });
});

describe('QualityScore type', () => {
  it('should have correct structure', () => {
    const score: QualityScore = {
      overall: 85,
      breakdown: {
        completeness: 90,
        correctness: 85,
        maintainability: 80
      },
      confidence: 0.9,
      metadata: { explanation: 'High quality test with minor improvements needed' }
    };

    expect(score.overall).toBe(85);
    expect(score.breakdown.completeness).toBe(90);
    expect(score.confidence).toBe(0.9);
  });
});