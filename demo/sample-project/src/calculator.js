// 基本的な計算機能
class Calculator {
  add(a, b) {
    return a + b;
  }
  
  multiply(a, b) {
    return a * b;
  }
  
  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
  
  // この関数は意図的にテストが存在しない（デモ用）
  complexCalculation(x, y, z) {
    return (x * y) + (z / 2);
  }
}

module.exports = Calculator;