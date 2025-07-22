import { Session, Pattern, GeneratedPlugin, NextStep, SessionStep } from '../../src/interactive/types';

describe('Interactive Plugin Creator Types', () => {
  describe('Session', () => {
    it('should create a valid session with all required fields', () => {
      const session: Session = {
        id: 'test-session-123',
        startTime: new Date(),
        currentStep: SessionStep.PURPOSE,
        collectedData: {}
      };

      expect(session.id).toBe('test-session-123');
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.currentStep).toBe(SessionStep.PURPOSE);
      expect(session.collectedData).toEqual({});
    });

    it('should handle session with complete collected data', () => {
      const session: Session = {
        id: 'test-session-456',
        startTime: new Date(),
        currentStep: SessionStep.COMPLETED,
        collectedData: {
          purpose: 'テスト品質の向上',
          preventionGoal: 'バグの早期発見',
          goodExamples: ['test example 1'],
          badExamples: ['bad example 1'],
          patterns: [{
            type: 'string-match',
            value: 'expect',
            description: 'アサーション',
            confidence: 0.8
          }]
        }
      };

      expect(session.collectedData.purpose).toBe('テスト品質の向上');
      expect(session.collectedData.patterns).toHaveLength(1);
    });
  });

  describe('Pattern', () => {
    it('should create a valid pattern with string-match type', () => {
      const pattern: Pattern = {
        type: 'string-match',
        value: 'expect(',
        description: '期待値のアサーション',
        confidence: 0.9
      };

      expect(pattern.type).toBe('string-match');
      expect(pattern.confidence).toBeGreaterThan(0);
      expect(pattern.confidence).toBeLessThanOrEqual(1);
    });

    it('should create a valid pattern with regex type', () => {
      const pattern: Pattern = {
        type: 'regex',
        value: 'describe\\([\'"`].*[\'"`]',
        description: 'テストスイートの定義',
        confidence: 0.7
      };

      expect(pattern.type).toBe('regex');
      expect(pattern.value).toContain('describe');
    });

    it('should create a valid pattern with structure type', () => {
      const pattern: Pattern = {
        type: 'structure',
        value: 'describe-it-expect',
        description: '基本的なテスト構造',
        confidence: 0.85
      };

      expect(pattern.type).toBe('structure');
    });
  });

  describe('GeneratedPlugin', () => {
    it('should create a valid generated plugin', () => {
      const generatedPlugin: GeneratedPlugin = {
        code: 'export class TestPlugin implements IPlugin { ... }',
        metadata: {
          name: 'user-defined-test',
          description: 'ユーザー定義テストプラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: [{
            type: 'string-match',
            value: 'expect',
            description: 'アサーション',
            confidence: 0.8
          }]
        }
      };

      expect(generatedPlugin.code).toContain('class TestPlugin');
      expect(generatedPlugin.metadata.createdBy).toBe('interactive');
      expect(generatedPlugin.metadata.patterns).toHaveLength(1);
    });
  });

  describe('NextStep', () => {
    it('should create valid next step for continue action', () => {
      const nextStep: NextStep = {
        action: 'continue',
        step: SessionStep.PREVENTION_GOAL,
        prompt: '次の質問に移ります'
      };

      expect(nextStep.action).toBe('continue');
      expect(nextStep.step).toBe(SessionStep.PREVENTION_GOAL);
    });

    it('should create valid next step for generate action', () => {
      const nextStep: NextStep = {
        action: 'generate',
        step: SessionStep.GENERATE,
        prompt: 'プラグインを生成します'
      };

      expect(nextStep.action).toBe('generate');
      expect(nextStep.step).toBe(SessionStep.GENERATE);
    });

    it('should create valid next step for error action', () => {
      const nextStep: NextStep = {
        action: 'error',
        step: SessionStep.PURPOSE,
        prompt: 'エラーが発生しました',
        error: 'Invalid input provided'
      };

      expect(nextStep.action).toBe('error');
      expect(nextStep.error).toBeDefined();
    });
  });
});