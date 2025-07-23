import { BasePlugin } from '../src/plugins/base/BasePlugin';
import { 
  ITestQualityPlugin, 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement 
} from '../src/core/types';

class TestBasePlugin extends BasePlugin {
  id = 'test-base-plugin';
  name = 'Test Base Plugin';
  version = '1.0.0';
  type = 'core' as const;

  isApplicable(_context: ProjectContext): boolean {
    return true;
  }

  async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
    return [];
  }

  evaluateQuality(_patterns: DetectionResult[]): QualityScore {
    return {
      overall: 100,
      breakdown: {
        completeness: 100,
        correctness: 100,
        maintainability: 100
      },
      confidence: 1.0,
    };
  }

  suggestImprovements(_evaluation: QualityScore): Improvement[] {
    return [];
  }

  // テスト用のpublicメソッド
  public testIsTestFile(filePath: string): boolean {
    return this.isTestFile(filePath);
  }

  public testGetFileInfo(filePath: string) {
    return this.getFileInfo(filePath);
  }

  public testCreateCodeLocation(file: string, startLine: number, endLine?: number) {
    return this.createCodeLocation(file, startLine, endLine);
  }

  public testCreateDetectionResult(
    patternId: string,
    patternName: string,
    location: any,
    confidence: number,
    evidence: any[]
  ) {
    return this.createDetectionResult(patternId, patternName, location, confidence, evidence);
  }

  public testCreateImprovement(
    id: string,
    priority: any,
    type: any,
    title: string,
    description: string,
    location: any,
    estimatedImpact: any
  ) {
    return this.createImprovement(id, priority, type, title, description, location, estimatedImpact);
  }

  public testCalculateBasicQualityScore(patterns: DetectionResult[], baseScore?: number) {
    return this.calculateBasicQualityScore(patterns, baseScore);
  }

  public testParseCodeContent(content: string) {
    return this.parseCodeContent(content);
  }

  public testIsTypeScriptProject(context: ProjectContext): boolean {
    return this.isTypeScriptProject(context);
  }

  public testIsJavaScriptProject(context: ProjectContext): boolean {
    return this.isJavaScriptProject(context);
  }

  public testLogDebug(message: string): void {
    this.logDebug(message);
  }

  public testLogInfo(message: string): void {
    this.logInfo(message);
  }

  public testLogWarning(message: string): void {
    this.logWarning(message);
  }

  public testLogError(message: string): void {
    this.logError(message);
  }
}

describe('BasePlugin', () => {
  let plugin: TestBasePlugin;
  let mockProjectContext: ProjectContext;
  let mockTestFile: TestFile;

  beforeEach(() => {
    plugin = new TestBasePlugin();
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
      path: '/test/project/src/test.ts',
      content: 'test content',
      metadata: {
        framework: 'jest',
        language: 'typescript',
        lastModified: new Date()
      }
    };
  });

  it('should implement ITestQualityPlugin interface', () => {
    expect(plugin).toBeDefined();
    expect(plugin.id).toBe('test-base-plugin');
    expect(plugin.name).toBe('Test Base Plugin');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.type).toBe('core');
  });

  it('should provide helper method for checking test files', () => {
    expect(plugin.testIsTestFile('/path/to/file.test.ts')).toBe(true);
    expect(plugin.testIsTestFile('/path/to/file.spec.js')).toBe(true);
    expect(plugin.testIsTestFile('/path/to/__tests__/file.js')).toBe(true);
    expect(plugin.testIsTestFile('/path/to/regular.ts')).toBe(false);
  });

  it('should provide helper method for extracting file info', () => {
    const info = plugin.testGetFileInfo('/path/to/file.test.ts');
    expect(info.baseName).toBe('file');
    expect(info.extension).toBe('.ts');
    expect(info.directory).toBe('/path/to');
    expect(info.isTestFile).toBe(true);
  });

  it('should provide helper method for creating code locations', () => {
    const location = plugin.testCreateCodeLocation('/test.ts', 5, 10);
    expect(location.file).toBe('/test.ts');
    expect(location.line).toBe(5);
    expect(location.endLine).toBe(10);
  });

  it('should provide helper method for creating detection results', () => {
    const result = plugin.testCreateDetectionResult(
      'pattern-1',
      'Test Pattern',
      plugin.testCreateCodeLocation('/test.ts', 1, 1),
      0.9,
      [{ type: 'code', description: 'Test evidence' }]
    );
    
    expect(result.patternId).toBe('pattern-1');
    expect(result.patternName).toBe('Test Pattern');
    expect(result.confidence).toBe(0.9);
    expect(result.evidence).toHaveLength(1);
  });

  it('should provide helper method for creating improvements', () => {
    const improvement = plugin.testCreateImprovement(
      'imp-1',
      'high',
      'add',
      'Add test',
      'Add comprehensive test',
      plugin.testCreateCodeLocation('/test.ts', 1, 1),
      { scoreImprovement: 10, effortMinutes: 30 }
    );
    
    expect(improvement.id).toBe('imp-1');
    expect(improvement.priority).toBe('high');
    expect(improvement.type).toBe('add');
    expect(improvement.estimatedImpact.scoreImprovement).toBe(10);
  });

  it('should provide helper method for calculating basic quality score', () => {
    const patterns: DetectionResult[] = [
      plugin.testCreateDetectionResult(
        'pattern-1', 
        'Good Pattern', 
        plugin.testCreateCodeLocation('/test.ts', 1, 1), 
        0.9, 
        []
      )
    ];
    
    const score = plugin.testCalculateBasicQualityScore(patterns, 80);
    expect(score.overall).toBe(75); // 80 - (1 * 5) = 75
    expect(score.confidence).toBe(0.9);
  });

  it('should provide helper method for parsing code content', () => {
    const content = `
      // This is a comment
      expect(true).toBe(true);
      /* Block comment */
      test('should work', () => {
        // Another comment
      });
    `;
    
    const parsed = plugin.testParseCodeContent(content);
    expect(parsed.lines).toBeInstanceOf(Array);
    expect(parsed.totalLines).toBeGreaterThan(0);
    expect(parsed.nonEmptyLines).toBeGreaterThan(0);
    expect(parsed.commentLines).toBeGreaterThan(0);
  });

  it('should provide helper method for checking project type', () => {
    const tsContext = { ...mockProjectContext, language: 'typescript' as const };
    const jsContext = { ...mockProjectContext, language: 'javascript' as const };
    
    expect(plugin.testIsTypeScriptProject(tsContext)).toBe(true);
    expect(plugin.testIsTypeScriptProject(jsContext)).toBe(false);
    expect(plugin.testIsJavaScriptProject(jsContext)).toBe(true);
    expect(plugin.testIsJavaScriptProject(tsContext)).toBe(false);
  });

  it('should provide logging methods', () => {
    // これらのメソッドはvoidを返すため、エラーが発生しないことを確認
    expect(() => plugin.testLogDebug('Debug message')).not.toThrow();
    expect(() => plugin.testLogInfo('Info message')).not.toThrow();
    expect(() => plugin.testLogWarning('Warning message')).not.toThrow();
    expect(() => plugin.testLogError('Error message')).not.toThrow();
  });
});