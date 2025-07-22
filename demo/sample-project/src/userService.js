// ユーザー管理サービス（テスト不足のデモ用）
class UserService {
  constructor() {
    this.users = [];
  }
  
  createUser(userData) {
    const user = {
      id: Date.now(),
      ...userData,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }
  
  // この関数群は意図的にテストを作らない（デモで問題として検出される）
  deleteUser(userId) {
    this.users = this.users.filter(user => user.id !== userId);
  }
  
  updateUser(userId, updates) {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return this.users[userIndex];
    }
    return null;
  }
  
  getUserById(userId) {
    return this.users.find(user => user.id === userId);
  }
}

module.exports = UserService;