/**
 * Multilingual Keyword Extractor
 * v0.9.0 - 多言語対応キーワード抽出エンジン
 * 
 * KISS原則: 言語ごとに専用の処理を分離
 * DRY原則: 共通処理の抽象化
 */

import { LanguageDetectionResult } from './types';
import * as natural from 'natural';
const kuromoji = require('kuromoji');
import * as path from 'path';

/**
 * キーワード抽出結果
 */
export interface KeywordExtractionResult {
  language: string;
  keywords: string[];
  confidence?: number;
}

/**
 * 多言語キーワード抽出器
 * SOLID原則: 単一責任の原則（言語ごとに処理を分離）
 */
export class MultilingualKeywordExtractor {
  private englishTokenizer: any;
  private japaneseTokenizer: any = null;
  private japaneseTokenizerPromise: Promise<any> | null = null;
  private stopWords: Set<string>;

  constructor() {
    // 英語用トークナイザー初期化
    this.englishTokenizer = new natural.WordTokenizer();
    
    // 英語ストップワード
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
  }

  /**
   * 日本語トークナイザーの初期化（遅延読み込み）
   * YAGNI原則: 必要になるまで初期化しない
   */
  private async getJapaneseTokenizer(): Promise<any> {
    if (this.japaneseTokenizer) {
      return this.japaneseTokenizer;
    }

    if (!this.japaneseTokenizerPromise) {
      this.japaneseTokenizerPromise = new Promise((resolve, reject) => {
        // Kuromojiの辞書パスを設定
        const dicPath = path.join(
          __dirname, 
          '../../node_modules/kuromoji/dict'
        );
        
        kuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
          if (err) {
            console.warn('Failed to initialize kuromoji:', err);
            // エラー時は簡易的なトークナイザーを返す
            resolve({
              tokenize: (text: string) => {
                // 簡易的な日本語分割（スペースと句読点で分割）
                return text.split(/[\s、。！？]+/)
                  .filter(word => word.length > 0)
                  .map(word => ({ surface_form: word, pos: '名詞' }));
              }
            });
          } else {
            this.japaneseTokenizer = tokenizer;
            resolve(tokenizer);
          }
        });
      });
    }

    return this.japaneseTokenizerPromise;
  }

  /**
   * 言語を検出
   * Defensive Programming: エラーハンドリング
   * KISS原則: 簡易的な文字種ベース検出
   */
  public async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      return {
        language: 'unknown',
        confidence: 0
      };
    }

    try {
      // 文字種の割合を計算
      const totalChars = text.length;
      let japaneseChars = 0;
      let englishChars = 0;
      let otherChars = 0;

      for (const char of text) {
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(char)) {
          japaneseChars++;
        } else if (/[a-zA-Z]/.test(char)) {
          englishChars++;
        } else if (!/\s/.test(char)) {
          otherChars++;
        }
      }

      // 言語判定
      const japaneseRatio = japaneseChars / totalChars;
      const englishRatio = englishChars / totalChars;
      
      if (japaneseRatio > 0.3) {
        // 30%以上が日本語文字
        return {
          language: 'jpn',
          confidence: Math.min(0.95, 0.5 + japaneseRatio)
        };
      } else if (englishRatio > 0.5) {
        // 50%以上が英語文字
        return {
          language: 'eng',
          confidence: Math.min(0.95, 0.5 + englishRatio * 0.5)
        };
      } else if (japaneseChars > 0 && englishChars > 0) {
        // 混合
        return {
          language: japaneseRatio > englishRatio ? 'jpn' : 'eng',
          confidence: 0.6
        };
      }
      
      return {
        language: 'unknown',
        confidence: 0
      };
    } catch (error) {
      console.warn('Language detection failed:', error);
      return {
        language: 'unknown',
        confidence: 0
      };
    }
  }

  /**
   * 英語キーワード抽出
   * KISS原則: シンプルな実装
   */
  public async extractEnglishKeywords(text: string): Promise<string[]> {
    if (!text) return [];

    // キャメルケースを分割
    const expandedText = text.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // トークナイズ
    const tokens = this.englishTokenizer.tokenize(expandedText.toLowerCase());
    
    // キーワードフィルタリング
    const keywords = tokens
      .filter((token: string) => {
        // 2文字以上、ストップワードでない、英数字を含む
        return token.length >= 2 && 
               !this.stopWords.has(token) &&
               /[a-z0-9]/i.test(token);
      })
      .map((token: string) => token.toLowerCase());
    
    // 重複除去
    return Array.from(new Set(keywords));
  }

  /**
   * 日本語キーワード抽出
   * DRY原則: 共通処理の抽出
   */
  public async extractJapaneseKeywords(text: string): Promise<string[]> {
    if (!text) return [];

    try {
      const tokenizer = await this.getJapaneseTokenizer();
      const tokens = tokenizer.tokenize(text);
      
      // 名詞、動詞の語幹を抽出
      const keywords = tokens
        .filter((token: any) => {
          const pos = token.pos?.split(',')[0];
          const posDetail = token.pos?.split(',')[1];
          
          // 助詞、助動詞、非自立語を除外
          if (pos === '助詞' || pos === '助動詞' || posDetail === '非自立') {
            return false;
          }
          
          // 「する」などの汎用的な動詞を除外
          if (token.surface_form === 'する' || token.surface_form === 'なる' || 
              token.surface_form === 'ある' || token.surface_form === 'いる') {
            return false;
          }
          
          // 名詞、動詞（自立語のみ）、形容詞を抽出
          return pos === '名詞' || (pos === '動詞' && posDetail !== '非自立') || pos === '形容詞';
        })
        .map((token: any) => {
          // 動詞の場合は基本形を使用
          if (token.pos?.startsWith('動詞') && token.basic_form) {
            // 「する」などの汎用動詞の基本形も除外
            if (token.basic_form === 'する' || token.basic_form === 'なる' ||
                token.basic_form === 'ある' || token.basic_form === 'いる') {
              return null;
            }
            return token.basic_form;
          }
          return token.surface_form;
        })
        .filter((word: string | null) => {
          if (!word) return false;
          // 1文字の単語、ひらがなのみの短い単語を除外
          return word.length > 1 || /[\u30A0-\u30FF\u4E00-\u9FAF]/.test(word);
        });
      
      // 重複除去
      return Array.from(new Set(keywords));
    } catch (error) {
      console.warn('Japanese keyword extraction failed:', error);
      // フォールバック: 簡易的な抽出
      return text
        .split(/[\s、。！？]+/)
        .filter(word => word.length > 1);
    }
  }

  /**
   * 統合キーワード抽出
   * SOLID原則: オープン・クローズドの原則
   */
  public async extractKeywords(text: string): Promise<KeywordExtractionResult> {
    // null/undefined チェック
    if (!text) {
      return {
        language: 'unknown',
        keywords: []
      };
    }

    // 数値や特殊文字のみの場合
    if (!/[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return {
        language: 'unknown',
        keywords: []
      };
    }

    try {
      // 言語検出
      const languageResult = await this.detectLanguage(text);
      
      let keywords: string[] = [];
      
      // 言語に応じた抽出処理
      if (languageResult.language === 'jpn') {
        keywords = await this.extractJapaneseKeywords(text);
      } else if (languageResult.language === 'eng') {
        keywords = await this.extractEnglishKeywords(text);
      } else {
        // 混合または不明な場合は両方試す
        const englishKeywords = await this.extractEnglishKeywords(text);
        const japaneseKeywords = await this.extractJapaneseKeywords(text);
        
        // 両方の結果をマージ
        keywords = [...englishKeywords, ...japaneseKeywords];
        
        // 重複除去
        keywords = Array.from(new Set(keywords));
      }
      
      return {
        language: languageResult.language,
        keywords,
        confidence: languageResult.confidence
      };
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return {
        language: 'unknown',
        keywords: []
      };
    }
  }
}