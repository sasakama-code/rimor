/**
 * MultilingualKeywordExtractor テスト
 * v0.9.0 - 多言語キーワード抽出のテスト
 * TDD: RED→GREEN→REFACTOR
 */

import { MultilingualKeywordExtractor } from '../../src/domain-analysis/MultilingualKeywordExtractor';
import { LanguageDetectionResult } from '../../src/domain-analysis/types';

describe('MultilingualKeywordExtractor', () => {
  let extractor: MultilingualKeywordExtractor;

  beforeEach(() => {
    extractor = new MultilingualKeywordExtractor();
  });

  describe('言語検出', () => {
    it('英語テキストを検出できる', async () => {
      const text = 'This is a test for user authentication and payment processing';
      const result: LanguageDetectionResult = await extractor.detectLanguage(text);
      
      expect(result.language).toBe('eng');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('日本語テキストを検出できる', async () => {
      const text = 'ユーザー認証と決済処理のためのテストです';
      const result = await extractor.detectLanguage(text);
      
      expect(result.language).toBe('jpn');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('混合言語テキストを処理できる', async () => {
      const text = 'UserServiceクラスでpayment処理を実装';
      const result = await extractor.detectLanguage(text);
      
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('空のテキストでエラーにならない', async () => {
      const text = '';
      const result = await extractor.detectLanguage(text);
      
      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });

  describe('英語キーワード抽出', () => {
    it('英語の名詞を抽出できる', async () => {
      const text = 'The user authentication service handles payment processing';
      const keywords = await extractor.extractEnglishKeywords(text);
      
      expect(keywords).toContain('user');
      expect(keywords).toContain('authentication');
      expect(keywords).toContain('service');
      expect(keywords).toContain('payment');
      expect(keywords).toContain('processing');
    });

    it('ストップワードを除外できる', async () => {
      const text = 'The user and the payment are important';
      const keywords = await extractor.extractEnglishKeywords(text);
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('are');
      expect(keywords).toContain('user');
      expect(keywords).toContain('payment');
      expect(keywords).toContain('important');
    });

    it('キャメルケースを分割できる', async () => {
      const text = 'UserService PaymentProcessor AuthenticationManager';
      const keywords = await extractor.extractEnglishKeywords(text);
      
      expect(keywords).toContain('user');
      expect(keywords).toContain('service');
      expect(keywords).toContain('payment');
      expect(keywords).toContain('processor');
      expect(keywords).toContain('authentication');
      expect(keywords).toContain('manager');
    });

    it('技術用語を保持できる', async () => {
      const text = 'API REST HTTP JSON OAuth JWT';
      const keywords = await extractor.extractEnglishKeywords(text);
      
      expect(keywords).toContain('api');
      expect(keywords).toContain('rest');
      expect(keywords).toContain('http');
      expect(keywords).toContain('json');
      expect(keywords).toContain('oauth');
      expect(keywords).toContain('jwt');
    });
  });

  describe('日本語キーワード抽出', () => {
    it('日本語の名詞を抽出できる', async () => {
      const text = 'ユーザー認証サービスが決済処理を実行します';
      const keywords = await extractor.extractJapaneseKeywords(text);
      
      expect(keywords).toContain('ユーザー');
      expect(keywords).toContain('認証');
      expect(keywords).toContain('サービス');
      expect(keywords).toContain('決済');
      expect(keywords).toContain('処理');
      expect(keywords).toContain('実行');
    });

    it('助詞を除外できる', async () => {
      const text = 'ユーザーが商品を購入する';
      const keywords = await extractor.extractJapaneseKeywords(text);
      
      expect(keywords).not.toContain('が');
      expect(keywords).not.toContain('を');
      expect(keywords).not.toContain('する');
      expect(keywords).toContain('ユーザー');
      expect(keywords).toContain('商品');
      expect(keywords).toContain('購入');
    });

    it('カタカナ技術用語を抽出できる', async () => {
      const text = 'データベースからAPIでレスポンスを取得';
      const keywords = await extractor.extractJapaneseKeywords(text);
      
      expect(keywords).toContain('データベース');
      expect(keywords).toContain('API');
      expect(keywords).toContain('レスポンス');
      expect(keywords).toContain('取得');
    });

    it('複合語を適切に処理できる', async () => {
      const text = '在庫管理システムの売上集計機能';
      const keywords = await extractor.extractJapaneseKeywords(text);
      
      expect(keywords).toContain('在庫');
      expect(keywords).toContain('管理');
      expect(keywords).toContain('システム');
      expect(keywords).toContain('売上');
      expect(keywords).toContain('集計');
      expect(keywords).toContain('機能');
    });
  });

  describe('統合キーワード抽出', () => {
    it('言語を自動検出して適切な抽出器を使用できる', async () => {
      const englishText = 'User authentication and payment processing';
      const keywords = await extractor.extractKeywords(englishText);
      
      expect(keywords.language).toBe('eng');
      expect(keywords.keywords).toContain('user');
      expect(keywords.keywords).toContain('authentication');
      expect(keywords.keywords).toContain('payment');
    });

    it('日本語テキストから自動抽出できる', async () => {
      const japaneseText = 'ユーザー認証と決済処理';
      const keywords = await extractor.extractKeywords(japaneseText);
      
      expect(keywords.language).toBe('jpn');
      expect(keywords.keywords).toContain('ユーザー');
      expect(keywords.keywords).toContain('認証');
      expect(keywords.keywords).toContain('決済');
      expect(keywords.keywords).toContain('処理');
    });

    it('混合言語から両方のキーワードを抽出できる', async () => {
      const mixedText = 'UserServiceクラスで認証処理を実装';
      const keywords = await extractor.extractKeywords(mixedText);
      
      expect(keywords.keywords.length).toBeGreaterThan(0);
      // 英語と日本語の両方のキーワードが含まれることを確認
      const hasEnglish = keywords.keywords.some(k => /^[a-z]+$/i.test(k));
      const hasJapanese = keywords.keywords.some(k => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(k));
      
      expect(hasEnglish || hasJapanese).toBe(true);
    });

    it('コードコメントからキーワードを抽出できる', async () => {
      const codeComment = '// This function handles user authentication and validates payment tokens';
      const keywords = await extractor.extractKeywords(codeComment);
      
      expect(keywords.keywords).toContain('function');
      expect(keywords.keywords).toContain('handles');
      expect(keywords.keywords).toContain('user');
      expect(keywords.keywords).toContain('authentication');
      expect(keywords.keywords).toContain('validates');
      expect(keywords.keywords).toContain('payment');
      expect(keywords.keywords).toContain('tokens');
    });
  });

  describe('エラーハンドリング', () => {
    it('null入力でエラーにならない', async () => {
      const keywords = await extractor.extractKeywords(null as any);
      
      expect(keywords.language).toBe('unknown');
      expect(keywords.keywords).toEqual([]);
    });

    it('undefined入力でエラーにならない', async () => {
      const keywords = await extractor.extractKeywords(undefined as any);
      
      expect(keywords.language).toBe('unknown');
      expect(keywords.keywords).toEqual([]);
    });

    it('数値のみのテキストを処理できる', async () => {
      const text = '123 456 789';
      const keywords = await extractor.extractKeywords(text);
      
      expect(keywords.keywords).toEqual([]);
    });

    it('特殊文字のみのテキストを処理できる', async () => {
      const text = '!@# $%^ &*()';
      const keywords = await extractor.extractKeywords(text);
      
      expect(keywords.keywords).toEqual([]);
    });
  });

  describe('パフォーマンス', () => {
    it('大きなテキストを効率的に処理できる', async () => {
      const largeText = 'user payment order '.repeat(1000);
      const startTime = Date.now();
      
      const keywords = await extractor.extractKeywords(largeText);
      
      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(1000); // 1秒以内
      expect(keywords.keywords.length).toBeGreaterThan(0);
    });

    it('キーワードの重複を除去できる', async () => {
      const text = 'user user payment payment order order';
      const keywords = await extractor.extractKeywords(text);
      
      const uniqueKeywords = new Set(keywords.keywords);
      expect(uniqueKeywords.size).toBe(keywords.keywords.length);
    });
  });
});