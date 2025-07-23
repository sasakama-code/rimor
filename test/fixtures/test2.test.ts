describe('Sample Test', () => {
  beforeEach(() => {
    // Setup code
  });
  
  it('should work correctly', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = input.toUpperCase();
    
    // Assert
    expect(result).toBe('TEST');
    expect(result).toHaveLength(4);
  });
  
  afterEach(() => {
    // Cleanup
  });
});