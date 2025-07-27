
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('Guard Security Tests', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        RolesGuard,
        Reflector
      ],
    }).compile();

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should validate JWT token in guard - Test 0', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0LXt7UkFORE9NX1ZBTFVFXX0iLCJyb2xlIjoidXNlciJ9.invalid-signature'
          },
          user: null
        })
      })
    } as ExecutionContext;

    // 無効なトークンシグネチャのテスト
    const result = await jwtAuthGuard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should enforce role-based access control - Test 0', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            userId: 'test-z9wg8h',
            role: 'user', // admin role required for protected route
            permissions: ['read']
          }
        })
      }),
      getHandler: () => ({}),
      getClass: () => ({})
    } as ExecutionContext;

    // Required roles: ['admin']
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    
    const result = await rolesGuard.canActivate(mockContext);
    expect(result).toBe(false); // user role should not access admin route
  });

  it('should sanitize user input in guard context - Test 0', async () => {
    const maliciousRequest = {
      headers: {
        authorization: 'Bearer valid.jwt.token',
        'x-forwarded-for': '<script>alert("header xssz9wg8h")</script>',
        'user-agent': 'Mozilla/5.0; DROP TABLE sessions; --'
      },
      user: {
        userId: 'z9wg8h',
        role: 'user'
      },
      body: {
        comment: '<img src=x onerror=alert("body xss")>',
        metadata: { source: 'client"; DELETE FROM logs; --' }
      }
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => maliciousRequest
      })
    } as ExecutionContext;

    // Guard should sanitize request data
    const sanitizedRequest = sanitizeGuardContext(mockContext);
    const request = sanitizedRequest.switchToHttp().getRequest();
    
    expect(request.headers['x-forwarded-for']).not.toContain('<script>');
    expect(request.headers['user-agent']).not.toContain('DROP TABLE');
    expect(request.body.comment).not.toContain('onerror=');
    expect(request.body.metadata.source).not.toContain('DELETE FROM');
  });
});