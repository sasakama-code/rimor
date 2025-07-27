/**
 * セキュリティヘルパー関数
 * テストで使用されるセキュリティ関連のユーティリティ関数を提供
 */

/**
 * JWTペイロードをサニタイズする
 * XSSやSQLインジェクション対策として危険な文字列を除去
 */
export function sanitizeJWTPayload(payload: any): any {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }

  const sanitized: any = {};
  
  for (const key in payload) {
    if (payload.hasOwnProperty(key)) {
      const value = payload[key];
      
      if (typeof value === 'string') {
        // XSS対策: スクリプトタグとイベントハンドラを除去
        let cleaned = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        
        // SQLインジェクション対策: 危険なSQL文を除去
        cleaned = cleaned
          .replace(/(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/gi, '')
          .replace(/[;'"\\]/g, '');
        
        sanitized[key] = cleaned.trim();
      } else if (typeof value === 'object') {
        // ネストされたオブジェクトを再帰的にサニタイズ
        sanitized[key] = sanitizeJWTPayload(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  // JWT標準クレームは保持
  if (payload.exp) sanitized.exp = payload.exp;
  if (payload.iat) sanitized.iat = payload.iat;
  if (payload.iss) sanitized.iss = payload.iss;
  
  return sanitized;
}

/**
 * 一般的な入力値をサニタイズする
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTMLエンティティをエスケープ
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * メールアドレスの検証
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322準拠の簡易的なメールアドレス検証
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * バイオ（自己紹介文）をサニタイズする
 */
export function sanitizeBio(bio: string): string {
  if (typeof bio !== 'string') {
    return '';
  }
  
  // 基本的なサニタイズを行い、改行は保持
  return sanitize(bio)
    .replace(/\n/g, '<br>')
    .substring(0, 1000); // 最大1000文字に制限
}

/**
 * ユーザー名の検証とサニタイズ
 */
export function validateAndSanitizeUsername(username: string): { isValid: boolean; sanitized: string } {
  if (typeof username !== 'string') {
    return { isValid: false, sanitized: '' };
  }
  
  // ユーザー名の要件: 3-20文字、英数字とアンダースコアのみ
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const isValid = usernameRegex.test(username);
  
  // 危険な文字を除去
  const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
  
  return { isValid, sanitized };
}

/**
 * パスワードの強度を検証
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['パスワードは文字列である必要があります'] };
  }
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を含む必要があります');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('小文字を含む必要があります');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('数字を含む必要があります');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('特殊文字を含む必要があります');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}