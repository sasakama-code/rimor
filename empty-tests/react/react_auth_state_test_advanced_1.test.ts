
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

describe('Authentication State Security Tests', () => {
  const TestComponent = () => {
    const { user, token, isAuthenticated } = useAuth();
    return (
      <div>
        <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
        <div data-testid="user-data">{JSON.stringify(user)}</div>
        <div data-testid="token-data">{token}</div>
      </div>
    );
  };

  it('should not expose sensitive data in unauthenticated state - Test 0', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('null');
    expect(screen.getByTestId('token-data')).toHaveTextContent('');
  });

  it('should sanitize user data from token - Test 0', async () => {
    const maliciousToken = btoa(JSON.stringify({
      userId: '<script>alert("token xss6i90bj")</script>',
      email: 'test@example.com',
      role: 'admin"; DROP TABLE users; --'
    }));

    const AuthProviderWithToken = ({ children }: { children: React.ReactNode }) => {
      React.useEffect(() => {
        // トークンからユーザーデータを取得する際のサニタイズテスト
        localStorage.setItem('authToken', maliciousToken);
      }, []);

      return <AuthProvider>{children}</AuthProvider>;
    };

    render(
      <AuthProviderWithToken>
        <TestComponent />
      </AuthProviderWithToken>
    );

    await waitFor(() => {
      const userData = screen.getByTestId('user-data').textContent;
      expect(userData).not.toContain('<script>');
      expect(userData).not.toContain('DROP TABLE');
    });
  });

  it('should protect routes based on authentication state - Test 0', () => {
    const ProtectedContent = () => <div data-testid="protected">Protected Content</div>;
    const LoginPrompt = () => <div data-testid="login">Please Login</div>;

    render(
      <AuthProvider>
        <ProtectedRoute 
          component={ProtectedContent}
          fallback={LoginPrompt}
        />
      </AuthProvider>
    );

    // 未認証状態ではログインプロンプトが表示される
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});