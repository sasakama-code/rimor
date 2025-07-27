/**
 * securityHelpers.test.ts
 * セキュリティヘルパー関数のテスト
 */

import {
  sanitizeJWTPayload,
  sanitize,
  validateEmail,
  sanitizeBio,
  validateAndSanitizeUsername,
  validatePasswordStrength
} from '../../src/utils/securityHelpers';

describe('Security Helpers', () => {
  describe('sanitizeJWTPayload', () => {
    it('通常のペイロードを正しく処理する', () => {
      const payload = {
        userId: '12345',
        username: 'testuser',
        role: 'user'
      };
      
      const result = sanitizeJWTPayload(payload);
      
      expect(result.userId).toBe('12345');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('user');
    });

    it('XSS攻撃を含むペイロードをサニタイズする', () => {
      const maliciousPayload = {
        username: '<script>alert("XSS")</script>',
        bio: 'Hello <img src=x onerror=alert("XSS")>'
      };
      
      const result = sanitizeJWTPayload(maliciousPayload);
      
      expect(result.username).not.toContain('<script>');
      expect(result.username).not.toContain('</script>');
      expect(result.bio).not.toContain('onerror=');
    });

    it('SQLインジェクション攻撃をサニタイズする', () => {
      const sqlInjectionPayload = {
        query: "'; DROP TABLE users; --",
        filter: "1 OR 1=1; DELETE FROM accounts;"
      };
      
      const result = sanitizeJWTPayload(sqlInjectionPayload);
      
      expect(result.query).not.toContain('DROP');
      expect(result.query).not.toContain(';');
      expect(result.filter).not.toContain('DELETE');
    });

    it('JWT標準クレームを保持する', () => {
      const payload = {
        username: '<script>test</script>',
        exp: 1234567890,
        iat: 1234567800,
        iss: 'test-issuer'
      };
      
      const result = sanitizeJWTPayload(payload);
      
      expect(result.exp).toBe(1234567890);
      expect(result.iat).toBe(1234567800);
      expect(result.iss).toBe('test-issuer');
    });

    it('ネストされたオブジェクトを再帰的にサニタイズする', () => {
      const nestedPayload = {
        user: {
          name: '<b>Test</b>',
          profile: {
            bio: '<script>alert(1)</script>'
          }
        }
      };
      
      const result = sanitizeJWTPayload(nestedPayload);
      
      expect(result.user.name).not.toContain('<b>');
      expect(result.user.profile.bio).not.toContain('<script>');
    });

    it('null値を正しく処理する', () => {
      expect(sanitizeJWTPayload(null)).toBeNull();
    });

    it('文字列以外の値を正しく処理する', () => {
      expect(sanitizeJWTPayload('string')).toBe('string');
      expect(sanitizeJWTPayload(123)).toBe(123);
    });
  });

  describe('sanitize', () => {
    it('HTMLエンティティをエスケープする', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitize(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('すべての特殊文字をエスケープする', () => {
      const input = '&<>"\'\/';
      const result = sanitize(input);
      
      expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
    });

    it('文字列以外の入力に空文字を返す', () => {
      expect(sanitize(null as any)).toBe('');
      expect(sanitize(undefined as any)).toBe('');
      expect(sanitize(123 as any)).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('有効なメールアドレスを検証する', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.jp')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
    });

    it('無効なメールアドレスを拒否する', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test..user@example.com')).toBe(false);
    });

    it('254文字を超えるメールアドレスを拒否する', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });

    it('文字列以外の入力を拒否する', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
    });
  });

  describe('sanitizeBio', () => {
    it('通常のバイオをサニタイズする', () => {
      const bio = 'Hello, I am a developer.\nI love coding!';
      const result = sanitizeBio(bio);
      
      expect(result).toBe('Hello, I am a developer.<br>I love coding!');
    });

    it('HTMLタグを含むバイオをサニタイズする', () => {
      const bio = 'I am <b>bold</b> and <script>alert("XSS")</script>';
      const result = sanitizeBio(bio);
      
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('<script>');
    });

    it('1000文字を超えるバイオを切り詰める', () => {
      const longBio = 'a'.repeat(1500);
      const result = sanitizeBio(longBio);
      
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('文字列以外の入力に空文字を返す', () => {
      expect(sanitizeBio(null as any)).toBe('');
      expect(sanitizeBio(undefined as any)).toBe('');
    });
  });

  describe('validateAndSanitizeUsername', () => {
    it('有効なユーザー名を検証する', () => {
      const result = validateAndSanitizeUsername('valid_user123');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('valid_user123');
    });

    it('無効なユーザー名を検証する', () => {
      const result = validateAndSanitizeUsername('user@name');
      
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('username');
    });

    it('短すぎるユーザー名を拒否する', () => {
      const result = validateAndSanitizeUsername('ab');
      
      expect(result.isValid).toBe(false);
    });

    it('長すぎるユーザー名を切り詰める', () => {
      const longUsername = 'a'.repeat(25);
      const result = validateAndSanitizeUsername(longUsername);
      
      expect(result.isValid).toBe(false);
      expect(result.sanitized.length).toBe(20);
    });

    it('文字列以外の入力を拒否する', () => {
      const result = validateAndSanitizeUsername(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('');
    });
  });

  describe('validatePasswordStrength', () => {
    it('強力なパスワードを受け入れる', () => {
      const result = validatePasswordStrength('Strong@Pass123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('弱いパスワードを拒否し、適切なエラーを返す', () => {
      const result = validatePasswordStrength('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは8文字以上である必要があります');
      expect(result.errors).toContain('大文字を含む必要があります');
      expect(result.errors).toContain('数字を含む必要があります');
      expect(result.errors).toContain('特殊文字を含む必要があります');
    });

    it('各要件を個別にチェックする', () => {
      // 大文字なし
      let result = validatePasswordStrength('lowercase123!');
      expect(result.errors).toContain('大文字を含む必要があります');
      
      // 小文字なし
      result = validatePasswordStrength('UPPERCASE123!');
      expect(result.errors).toContain('小文字を含む必要があります');
      
      // 数字なし
      result = validatePasswordStrength('NoNumbers!');
      expect(result.errors).toContain('数字を含む必要があります');
      
      // 特殊文字なし
      result = validatePasswordStrength('NoSpecial123');
      expect(result.errors).toContain('特殊文字を含む必要があります');
    });

    it('文字列以外の入力を拒否する', () => {
      const result = validatePasswordStrength(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは文字列である必要があります');
    });
  });
});