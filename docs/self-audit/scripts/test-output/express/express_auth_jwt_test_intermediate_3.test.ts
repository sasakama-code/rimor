
import express, { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ヘルパー関数のモック
const sanitizeJWTPayload = (payload: any) => {
  const sanitized = { ...payload };
  if (sanitized.userId && typeof sanitized.userId === 'string') {
    sanitized.userId = sanitized.userId.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
  if (sanitized.role && typeof sanitized.role === 'string') {
    sanitized.role = sanitized.role.replace(/DROP TABLE/gi, '');
  }
  return sanitized;
};

describe('JWT Authentication Security Tests', () => {
  let app: Express;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    server = app.listen(3001);
  });

  afterEach(() => {
    server.close();
  });

  it('should validate JWT token properly - Test 2', async () => {
    const validToken = jwt.sign(
      { userId: 'test-6uvqei', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.userId).toBe('test-6uvqei');
  });

  it('should reject invalid JWT token - Test 2', async () => {
    const invalidToken = 'invalid.jwt.token6uvqei';

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });

  it('should handle JWT expiration - Test 2', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-6uvqei' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should sanitize JWT payload data - Test 2', async () => {
    const maliciousPayload = {
      userId: '<script>alert("xss")</script>',
      role: 'admin"; DROP TABLE users; --'
    };

    const token = jwt.sign(maliciousPayload, process.env.JWT_SECRET || 'test-secret');
    
    // JWT検証後、ペイロードが適切にサニタイズされているかテスト
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
    const sanitized = sanitizeJWTPayload(decoded);
    
    expect(sanitized.userId).not.toContain('<script>');
    expect(sanitized.role).not.toContain('DROP TABLE');
  });
});