
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

  it('should validate JWT token properly - Test 0', async () => {
    const validToken = jwt.sign(
      { userId: 'test-abgbf', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.userId).toBe('test-abgbf');
  });

  it('should reject invalid JWT token - Test 0', async () => {
    const invalidToken = 'invalid.jwt.tokenabgbf';

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });

  it('should handle JWT expiration - Test 0', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-abgbf' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should sanitize JWT payload data - Test 0', async () => {
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