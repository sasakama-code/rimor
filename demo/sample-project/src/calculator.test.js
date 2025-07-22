// 部分的なテスト（一部の機能のみカバー）
const Calculator = require('./calculator');

describe('Calculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new Calculator();
  });
  
  test('should add two numbers correctly', () => {
    expect(calculator.add(2, 3)).toBe(5);
  });
  
  test('should multiply two numbers correctly', () => {
    expect(calculator.multiply(4, 5)).toBe(20);
  });
  
  // divide と complexCalculation のテストは意図的に不完全
  // → AssertionExistsPlugin でアサーション不足として検出される予定
  test('divide method exists', () => {
    // アサーションなし（デモ用）
    calculator.divide(10, 2);
  });
});