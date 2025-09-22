// Mock UpdateProfileDto for testing
class UpdateProfileDto {
  constructor() {
    this.bio = '';
    this.avatar = '';
    this.location = '';
    this.website = '';
  }
}

module.exports = { UpdateProfileDto };
module.exports.default = UpdateProfileDto;