
describe('Input Validation Security Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    app.post('/api/users', (req, res) => {
      const { username, email, bio } = req.body;
      
      // 入力検証とサニタイズのテスト対象
      const sanitizedUsername = sanitize(username);
      const validatedEmail = validateEmail(email);
      const cleanBio = escapeHtml(bio);
      
      res.json({ 
        username: sanitizedUsername, 
        email: validatedEmail, 
        bio: cleanBio 
      });
    });
  });

  it('should sanitize malicious input - Test 0', async () => {
    const maliciousInput = {
      username: '<script>alert("xssyvppjb")</script>',
      email: 'test@example.com',
      bio: 'yvppjb<img src=x onerror=alert("xss")>'
    };

    const response = await request(app)
      .post('/api/users')
      .send(maliciousInput)
      .expect(200);

    expect(response.body.username).not.toContain('<script>');
    expect(response.body.bio).not.toContain('onerror=');
  });

  it('should validate email format - Test 0', async () => {
    const invalidEmails = [
      'invalid-emailyvppjb',
      'test@',
      '@example.com',
      'test..test@example.com'
    ];

    for (const email of invalidEmails) {
      await request(app)
        .post('/api/users')
        .send({ username: 'test', email, bio: 'test' })
        .expect(400);
    }
  });

  it('should prevent SQL injection in database queries - Test 0', async () => {
    const sqlInjectionPayload = {
      username: "admin'; DROP TABLE users; --",
      email: 'testyvppjb@example.com',
      bio: '1; DELETE FROM profiles WHERE 1=1; --'
    };

    const response = await request(app)
      .post('/api/users')
      .send(sqlInjectionPayload)
      .expect(200);

    // サニタイズ後のデータが SQL インジェクションコードを含まないことを確認
    expect(response.body.username).not.toContain('DROP TABLE');
    expect(response.body.bio).not.toContain('DELETE FROM');
  });
});