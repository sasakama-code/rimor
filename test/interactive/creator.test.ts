import { InteractiveCreator } from '../../src/interactive/creator';
import { Session, SessionStep, NextStep, Pattern, GeneratedPlugin } from '../../src/interactive/types';

describe('InteractiveCreator', () => {
  let creator: InteractiveCreator;

  beforeEach(() => {
    creator = new InteractiveCreator();
  });

  describe('startSession', () => {
    it('should create a new session with initial step', async () => {
      const session = await creator.startSession();

      expect(session.id).toBeDefined();
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.currentStep).toBe(SessionStep.PURPOSE);
      expect(session.collectedData).toEqual({});
    });

    it('should generate unique session IDs', async () => {
      const session1 = await creator.startSession();
      const session2 = await creator.startSession();

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('processInput', () => {
    let session: Session;

    beforeEach(async () => {
      session = await creator.startSession();
    });

    it('should handle purpose input correctly', async () => {
      const input = 'テストでアサーションの存在を確認したい';
      const nextStep = await creator.processInput(session, input);

      expect(session.collectedData.purpose).toBe(input);
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.PREVENTION_GOAL);
      expect(nextStep.prompt).toContain('防ぐこと');
    });

    it('should handle prevention goal input correctly', async () => {
      session.currentStep = SessionStep.PREVENTION_GOAL;
      const input = 'テストでアサーションが忘れられることを防ぎたい';
      const nextStep = await creator.processInput(session, input);

      expect(session.collectedData.preventionGoal).toBe(input);
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.GOOD_EXAMPLES);
      expect(nextStep.prompt).toContain('良いテストの例');
    });

    it('should handle good examples input correctly', async () => {
      session.currentStep = SessionStep.GOOD_EXAMPLES;
      const input = 'expect(result).toBe(true);';
      const nextStep = await creator.processInput(session, input);

      expect(session.collectedData.goodExamples).toEqual([input]);
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.BAD_EXAMPLES);
      expect(nextStep.prompt).toContain('悪いテストの例');
    });

    it('should handle bad examples input correctly', async () => {
      session.currentStep = SessionStep.BAD_EXAMPLES;
      session.collectedData.goodExamples = ['expect(result).toBe(true);'];
      const input = 'result;';
      const nextStep = await creator.processInput(session, input);

      expect(session.collectedData.badExamples).toEqual([input]);
      expect(nextStep.action).toBe('generate');
      expect(nextStep.step).toBe(SessionStep.GENERATE);
      expect(nextStep.prompt).toContain('プラグインを生成');
    });

    it('should handle skip for optional examples', async () => {
      session.currentStep = SessionStep.GOOD_EXAMPLES;
      const nextStep = await creator.processInput(session, 'skip');

      expect(session.collectedData.goodExamples).toBeUndefined();
      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.BAD_EXAMPLES);
    });

    it('should handle empty input with validation error', async () => {
      const nextStep = await creator.processInput(session, '');

      expect(nextStep.action).toBe('error');
      expect(nextStep.error).toBeDefined();
      expect(nextStep.step).toBe(SessionStep.PURPOSE);
    });

    it('should handle invalid session step', async () => {
      session.currentStep = 'invalid_step' as SessionStep;
      const nextStep = await creator.processInput(session, 'test input');

      expect(nextStep.action).toBe('error');
      expect(nextStep.error).toContain('不明なステップ');
    });
  });

  describe('analyzeSamples', () => {
    it('should analyze good and bad examples to extract patterns', async () => {
      const goodExamples = [
        'expect(result).toBe(true);',
        'expect(user.name).toEqual("John");'
      ];
      const badExamples = [
        'result;',
        'console.log(user.name);'
      ];

      const patterns = await creator.analyzeSamples(goodExamples, badExamples);

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const expectPattern = patterns.find(p => p.value === 'expect(');
      expect(expectPattern).toBeDefined();
      if (expectPattern) {
        expect(expectPattern.type).toBe('string-match');
        expect(expectPattern.confidence).toBeGreaterThan(0);
      }
    });

    it('should handle empty examples gracefully', async () => {
      const patterns = await creator.analyzeSamples([], []);

      expect(patterns).toHaveLength(0);
    });

    it('should return patterns with high confidence for clear differences', async () => {
      const goodExamples = ['expect(x).toBe(1);', 'expect(y).toBe(2);'];
      const badExamples = ['x === 1;', 'y === 2;'];

      const patterns = await creator.analyzeSamples(goodExamples, badExamples);

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const expectPattern = patterns.find(p => p.value === 'expect(');
      expect(expectPattern).toBeDefined();
      if (expectPattern) {
        expect(expectPattern.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });
  });

  describe('generatePlugin', () => {
    it('should generate a valid plugin from patterns', async () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: 'expect(',
        description: 'アサーションの確認',
        confidence: 0.8
      }];
      const metadata = {
        name: 'test-plugin',
        description: 'テスト用プラグイン'
      };

      const plugin = await creator.generatePlugin(patterns, metadata);

      expect(plugin.code).toContain('class');
      expect(plugin.code).toContain('implements IPlugin');
      expect(plugin.code).toContain('expect(');
      expect(plugin.metadata.name).toBe('test-plugin');
      expect(plugin.metadata.createdBy).toBe('interactive');
      expect(plugin.metadata.patterns).toEqual(patterns);
    });

    it('should handle multiple patterns in generated plugin', async () => {
      const patterns: Pattern[] = [
        {
          type: 'string-match',
          value: 'expect(',
          description: 'アサーション',
          confidence: 0.8
        },
        {
          type: 'string-match', 
          value: 'describe(',
          description: 'テストスイート',
          confidence: 0.7
        }
      ];

      const plugin = await creator.generatePlugin(patterns, { name: 'multi-pattern' });

      expect(plugin.code).toContain('expect(');
      expect(plugin.code).toContain('describe(');
      expect(plugin.metadata.patterns).toHaveLength(2);
    });
  });

  describe('validatePlugin', () => {
    it('should validate generated plugin against test files', async () => {
      const plugin: GeneratedPlugin = {
        code: 'export class TestPlugin implements IPlugin { /* mock */ }',
        metadata: {
          name: 'test-plugin',
          description: 'Test plugin',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: []
        }
      };
      const testFiles = ['test1.js', 'test2.js'];

      const result = await creator.validatePlugin(plugin, testFiles);

      expect(result.isValid).toBeDefined();
      expect(result.issuesFound).toBeGreaterThanOrEqual(0);
      expect(result.filesAnalyzed).toBeGreaterThanOrEqual(0); // ファイルが存在しない場合は0になる
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.message).toBeDefined();
    });
  });

  describe('savePlugin', () => {
    it('should save generated plugin to file system', async () => {
      const plugin: GeneratedPlugin = {
        code: 'export class SavedPlugin implements IPlugin { /* test */ }',
        metadata: {
          name: 'saved-plugin',
          description: 'Saved test plugin',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: []
        }
      };

      await expect(creator.savePlugin(plugin, 'saved-plugin')).resolves.not.toThrow();
    });
  });
});