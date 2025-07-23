import { getMessage, getCurrentLanguage, getMessageLines, messages } from '../../src/i18n/messages';

describe('i18n messages', () => {
  const originalLang = process.env.RIMOR_LANG;
  const originalSystemLang = process.env.LANG;

  afterEach(() => {
    // 環境変数を復元
    if (originalLang) {
      process.env.RIMOR_LANG = originalLang;
    } else {
      delete process.env.RIMOR_LANG;
    }
    
    if (originalSystemLang) {
      process.env.LANG = originalSystemLang;
    } else {
      delete process.env.LANG;
    }
  });

  describe('getCurrentLanguage', () => {
    it('should return ja when RIMOR_LANG is ja', () => {
      process.env.RIMOR_LANG = 'ja';
      expect(getCurrentLanguage()).toBe('ja');
    });

    it('should return en when RIMOR_LANG is en', () => {
      process.env.RIMOR_LANG = 'en';
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should return ja when LANG starts with ja', () => {
      delete process.env.RIMOR_LANG;
      process.env.LANG = 'ja_JP.UTF-8';
      expect(getCurrentLanguage()).toBe('ja');
    });

    it('should return en as default', () => {
      delete process.env.RIMOR_LANG;
      delete process.env.LANG;
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should prioritize RIMOR_LANG over LANG', () => {
      process.env.RIMOR_LANG = 'en';
      process.env.LANG = 'ja_JP.UTF-8';
      expect(getCurrentLanguage()).toBe('en');
    });
  });

  describe('getMessage', () => {
    it('should return Japanese message when language is ja', () => {
      process.env.RIMOR_LANG = 'ja';
      const message = getMessage('plugin.create.welcome');
      expect(message).toBe('🧙 Rimorプラグイン作成アシスタント');
    });

    it('should return English message when language is en', () => {
      process.env.RIMOR_LANG = 'en';
      const message = getMessage('plugin.create.welcome');
      expect(message).toBe('🧙 Rimor Plugin Creation Assistant');
    });

    it('should replace parameters in message', () => {
      process.env.RIMOR_LANG = 'en';
      const message = getMessage('plugin.create.error', { error: 'Test error' });
      expect(message).toBe('Plugin creation error: Test error');
    });

    it('should replace multiple parameters', () => {
      process.env.RIMOR_LANG = 'en';
      const message = getMessage('plugin.create.success', { path: 'test/path.ts' });
      expect(message).toBe('🎉 Plugin saved: test/path.ts');
    });

    it('should handle missing parameters gracefully', () => {
      process.env.RIMOR_LANG = 'en';
      const message = getMessage('plugin.create.error');
      expect(message).toBe('Plugin creation error: {error}');
    });

    it('should fallback to English for unknown language', () => {
      process.env.RIMOR_LANG = 'fr'; // Unsupported language
      const message = getMessage('plugin.create.welcome');
      expect(message).toBe('🧙 Rimor Plugin Creation Assistant');
    });

    it('should return message key for unknown keys', () => {
      process.env.RIMOR_LANG = 'en';
      const message = getMessage('unknown.key' as any);
      expect(message).toBe('unknown.key');
    });
  });

  describe('getMessageLines', () => {
    it('should split multiline messages', () => {
      process.env.RIMOR_LANG = 'en';
      const lines = getMessageLines('plugin.create.welcome.description');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('Welcome! Create custom plugins by');
      expect(lines[1]).toBe('answering a few simple questions.');
    });

    it('should handle single line messages', () => {
      process.env.RIMOR_LANG = 'en';
      const lines = getMessageLines('plugin.create.welcome');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('🧙 Rimor Plugin Creation Assistant');
    });

    it('should work with parameters', () => {
      process.env.RIMOR_LANG = 'en';
      const lines = getMessageLines('plugin.create.error', { error: 'Test\nMultiline\nError' });
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Plugin creation error: Test');
      expect(lines[1]).toBe('Multiline');
      expect(lines[2]).toBe('Error');
    });
  });

  describe('message completeness', () => {
    it('should have all message keys in both languages', () => {
      const jaKeys = Object.keys(messages.ja);
      const enKeys = Object.keys(messages.en);
      
      expect(jaKeys.sort()).toEqual(enKeys.sort());
    });

    it('should have non-empty messages', () => {
      Object.values(messages.ja).forEach(message => {
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
      
      Object.values(messages.en).forEach(message => {
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent parameter placeholders', () => {
      const jaKeys = Object.keys(messages.ja);
      
      jaKeys.forEach(key => {
        const jaMessage = (messages.ja as any)[key];
        const enMessage = (messages.en as any)[key];
        
        // プレースホルダーを抽出
        const jaPlaceholders = (jaMessage.match(/\{\w+\}/g) || []).sort();
        const enPlaceholders = (enMessage.match(/\{\w+\}/g) || []).sort();
        
        expect(jaPlaceholders).toEqual(enPlaceholders);
      });
    });
  });

  describe('specific message keys', () => {
    it('should have all expected plugin creation messages', () => {
      const expectedKeys = [
        'plugin.create.welcome',
        'plugin.create.welcome.subtitle',
        'plugin.create.welcome.description',
        'plugin.create.error',
        'plugin.create.success',
        'plugin.create.analyzing',
        'plugin.create.generating'
      ];
      
      expectedKeys.forEach(key => {
        expect((messages.ja as any)[key]).toBeDefined();
        expect((messages.en as any)[key]).toBeDefined();
      });
    });

    it('should have all expected prompt messages', () => {
      const expectedKeys = [
        'prompt.purpose',
        'prompt.prevention',
        'prompt.good_examples',
        'prompt.bad_examples'
      ];
      
      expectedKeys.forEach(key => {
        expect((messages.ja as any)[key]).toBeDefined();
        expect((messages.en as any)[key]).toBeDefined();
      });
    });
  });
});