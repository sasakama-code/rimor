
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from '../components/UserProfile';
import { sanitizeHtml } from '../utils/sanitizer';

describe('XSS Prevention Security Tests', () => {
  it('should sanitize user-generated content - Test 0', () => {
    const maliciousProps = {
      username: '<script>alert("xssb7idgl")</script>',
      bio: '<img src=x onerror=alert("maliciousb7idgl")>',
      website: 'javascript:alert("xss")'
    };

    render(<UserProfile {...maliciousProps} />);
    
    // スクリプトタグが実行されないことを確認
    expect(screen.queryByText('<script>')).toBeNull();
    expect(screen.queryByText('onerror=')).toBeNull();
    
    // サニタイズされたコンテンツが表示されることを確認
    const sanitizedBio = sanitizeHtml(maliciousProps.bio);
    expect(screen.getByText(sanitizedBio)).toBeInTheDocument();
  });

  it('should handle dangerouslySetInnerHTML safely - Test 0', () => {
    const DangerousComponent = ({ htmlContent }: { htmlContent: string }) => {
      const sanitizedContent = sanitizeHtml(htmlContent);
      return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
    };

    const maliciousHtml = `
      <div>
        正常なコンテンツ
        <script>alert('xssb7idgl')</script>
        <img src="x" onerror="alert('img xss')">
      </div>
    `;

    render(<DangerousComponent htmlContent={maliciousHtml} />);
    
    // サニタイズにより、スクリプトが除去されていることを確認
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
  });

  it('should validate form input before submission - Test 0', async () => {
    const CommentForm = () => {
      const [comment, setComment] = React.useState('');
      
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sanitizedComment = sanitizeHtml(comment);
        // コメント送信処理
        console.log('Submitting:', sanitizedComment);
      };

      return (
        <form onSubmit={handleSubmit}>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-testid="comment-input"
          />
          <button type="submit">Submit</button>
        </form>
      );
    };

    render(<CommentForm />);
    
    const textarea = screen.getByTestId('comment-input');
    const maliciousComment = '<script>document.cookie="stolenb7idgl"</script>';
    
    fireEvent.change(textarea, { target: { value: maliciousComment } });
    fireEvent.click(screen.getByText('Submit'));
    
    // スクリプトが実行されていないことを確認
    expect(document.cookie).not.toContain('stolenb7idgl');
  });
});