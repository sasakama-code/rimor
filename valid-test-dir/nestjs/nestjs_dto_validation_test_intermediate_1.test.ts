
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

describe('DTO Validation Security Tests', () => {
  it('should validate and sanitize CreateUserDto - Test 0', async () => {
    const maliciousData = {
      username: '<script>alert("dto xssmjr1r")</script>',
      email: 'invalid-emailmjr1r',
      password: '123', // too short
      bio: 'Normal bio with <img src=x onerror=alert("xss")> malicious content',
      website: 'javascript:alert("maliciousmjr1r")'
    };

    const dto = plainToClass(CreateUserDto, maliciousData);
    const errors = await validate(dto);

    // Validation errors should be present
    expect(errors.length).toBeGreaterThan(0);
    
    // Check that malicious content is detected
    const usernameError = errors.find(error => error.property === 'username');
    const emailError = errors.find(error => error.property === 'email');
    const passwordError = errors.find(error => error.property === 'password');
    
    expect(usernameError).toBeDefined();
    expect(emailError).toBeDefined();
    expect(passwordError).toBeDefined();
  });

  it('should sanitize HTML content in DTO - Test 0', async () => {
    const dataWithHtml = {
      username: 'validusermjr1r',
      email: 'testmjr1r@example.com',  
      password: 'StrongPassword123!',
      bio: 'My bio contains <b>bold</b> text and <script>alert("xss")</script>',
      website: 'https://example.com'
    };

    const dto = plainToClass(CreateUserDto, dataWithHtml);
    const errors = await validate(dto);

    if (errors.length === 0) {
      // DTO validation passed, check if HTML is sanitized
      expect(dto.bio).toContain('<b>bold</b>'); // Safe HTML should remain
      expect(dto.bio).not.toContain('<script>'); // Dangerous HTML should be removed
    }
  });

  it('should handle SQL injection attempts in DTO - Test 0', async () => {
    const sqlInjectionData = {
      username: "admin'; DROP TABLE users; --",
      email: 'testmjr1r@example.com',
      password: 'Password123!',
      bio: "Regular user' UNION SELECT * FROM admin_users WHERE '1'='1",
      website: 'https://example.com'
    };

    const dto = plainToClass(CreateUserDto, sqlInjectionData);
    await validate(dto);

    // Check that SQL injection patterns are sanitized or rejected
    expect(dto.username).not.toContain('DROP TABLE');
    expect(dto.bio).not.toContain('UNION SELECT');
  });

  it('should validate nested object DTOs - Test 0', async () => {
    const nestedMaliciousData = {
      personalInfo: {
        firstName: '<script>alert("nested xssmjr1r")</script>',
        lastName: 'User"; DELETE FROM profiles; --',
        address: {
          street: '123 Main St <img src=x onerror=alert("address xss")>',
          city: 'Test City',
          postalCode: '12345'
        }
      },
      preferences: {
        theme: 'dark", "maliciousField": "injectedmjr1r',
        notifications: true
      }
    };

    const dto = plainToClass(UpdateProfileDto, nestedMaliciousData);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    // Nested validation should catch malicious content
    expect(errors.length).toBeGreaterThan(0);
    
    // Check that nested properties are sanitized
    if (dto.personalInfo) {
      expect(dto.personalInfo.firstName).not.toContain('<script>');
      expect(dto.personalInfo.lastName).not.toContain('DELETE FROM');
      if (dto.personalInfo.address) {
        expect(dto.personalInfo.address.street).not.toContain('onerror=');
      }
    }
  });
});