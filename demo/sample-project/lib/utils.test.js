// utils.js の部分的なテスト
const { formatDate, validateEmail } = require('./utils');

describe('Utils', () => {
  test('should format date correctly', () => {
    const date = new Date('2025-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('2025-01-15');
  });
  
  test('should validate email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
  
  // generateRandomId, capitalizeString, debounce のテストは存在しない
  // → TestExistencePlugin で検出される（部分的なテストカバー不足）
});