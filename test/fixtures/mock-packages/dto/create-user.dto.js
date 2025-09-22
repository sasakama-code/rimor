// Mock CreateUserDto for testing
class CreateUserDto {
  constructor() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.age = 0;
  }
}

module.exports = { CreateUserDto };
module.exports.default = CreateUserDto;