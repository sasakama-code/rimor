/**
 * DomainClusterer テスト
 * v0.9.0 - TDDアプローチ（RED→GREEN→REFACTOR）
 * 
 * t_wadaのTDD実践に従い、失敗するテストから開始
 */

import { DomainClusterer } from '../../src/domain-analysis/DomainClusterer';
import {
  DomainCluster,
  ClusteringConfig,
  TFIDFVector,
  KeywordInfo
} from '../../src/domain-analysis/types';

describe('DomainClusterer', () => {
  let clusterer: DomainClusterer;

  beforeEach(() => {
    clusterer = new DomainClusterer();
  });

  describe('TF-IDF計算', () => {
    it('単一ドキュメントのTF-IDFを計算できる', () => {
      const documents = new Map<string, string[]>([
        ['doc1', ['user', 'login', 'authentication', 'user', 'session']]
      ]);

      const vectors = clusterer.calculateTFIDF(documents);

      expect(vectors).toHaveLength(1);
      expect(vectors[0].documentId).toBe('doc1');
      expect(vectors[0].vector.get('user')).toBeGreaterThan(0);
      expect(vectors[0].vector.get('login')).toBeGreaterThan(0);
    });

    it('複数ドキュメントのTF-IDFを計算できる', () => {
      const documents = new Map<string, string[]>([
        ['doc1', ['user', 'login', 'authentication']],
        ['doc2', ['payment', 'transaction', 'billing']],
        ['doc3', ['user', 'profile', 'settings']]
      ]);

      const vectors = clusterer.calculateTFIDF(documents);

      expect(vectors).toHaveLength(3);
      
      // 'user'は2つのドキュメントに出現するのでIDFが低い
      const doc1Vector = vectors.find(v => v.documentId === 'doc1');
      const doc2Vector = vectors.find(v => v.documentId === 'doc2');
      
      expect(doc1Vector?.vector.get('user')).toBeDefined();
      expect(doc2Vector?.vector.get('payment')).toBeDefined();
      
      // 'payment'は1つのドキュメントにしか出現しないのでIDFが高い
      const paymentIDF = doc2Vector?.vector.get('payment') || 0;
      const userIDF = doc1Vector?.vector.get('user') || 0;
      expect(paymentIDF).toBeGreaterThan(userIDF);
    });

    it('空のドキュメントを適切に処理できる', () => {
      const documents = new Map<string, string[]>([
        ['doc1', []],
        ['doc2', ['keyword']]
      ]);

      const vectors = clusterer.calculateTFIDF(documents);

      expect(vectors).toHaveLength(2);
      const emptyDoc = vectors.find(v => v.documentId === 'doc1');
      expect(emptyDoc?.vector.size).toBe(0);
    });
  });

  describe('K-Meansクラスタリング', () => {
    it('指定されたK値でクラスタリングできる', () => {
      // TF-IDFベクトルを準備
      const vectors: TFIDFVector[] = [
        {
          documentId: 'doc1',
          vector: new Map([['user', 0.8], ['login', 0.6]])
        },
        {
          documentId: 'doc2',
          vector: new Map([['user', 0.7], ['profile', 0.5]])
        },
        {
          documentId: 'doc3',
          vector: new Map([['payment', 0.9], ['transaction', 0.7]])
        },
        {
          documentId: 'doc4',
          vector: new Map([['order', 0.8], ['checkout', 0.6]])
        }
      ];

      const clusters = clusterer.performKMeansClustering(vectors, 2);

      expect(clusters).toHaveLength(2);
      expect(clusters[0].keywords.length).toBeGreaterThan(0);
      expect(clusters[1].keywords.length).toBeGreaterThan(0);
      expect(clusters[0].files.length).toBeGreaterThan(0);
      expect(clusters[1].files.length).toBeGreaterThan(0);
    });

    it('クラスタに適切な名前を付ける', () => {
      const vectors: TFIDFVector[] = [
        {
          documentId: 'auth-service.ts',
          vector: new Map([['authentication', 0.9], ['login', 0.8], ['user', 0.7]])
        },
        {
          documentId: 'payment-service.ts',
          vector: new Map([['payment', 0.9], ['transaction', 0.8], ['billing', 0.7]])
        }
      ];

      const clusters = clusterer.performKMeansClustering(vectors, 2);

      // クラスタ名が関連キーワードを反映していることを確認
      const authCluster = clusters.find(c => 
        c.keywords.includes('authentication') || c.keywords.includes('login')
      );
      const paymentCluster = clusters.find(c => 
        c.keywords.includes('payment') || c.keywords.includes('transaction')
      );

      expect(authCluster).toBeDefined();
      expect(paymentCluster).toBeDefined();
    });

    it('単一クラスタの場合も処理できる', () => {
      const vectors: TFIDFVector[] = [
        {
          documentId: 'doc1',
          vector: new Map([['keyword1', 0.5]])
        },
        {
          documentId: 'doc2',
          vector: new Map([['keyword2', 0.6]])
        }
      ];

      const clusters = clusterer.performKMeansClustering(vectors, 1);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].files).toContain('doc1');
      expect(clusters[0].files).toContain('doc2');
    });
  });

  describe('クラスタ信頼度計算', () => {
    it('高い凝集度を持つクラスタに高い信頼度を付与する', () => {
      const tightCluster: DomainCluster = {
        id: 'cluster-1',
        name: 'authentication',
        keywords: ['login', 'auth', 'user', 'session', 'token'],
        confidence: 0,
        files: ['auth.ts', 'login.ts', 'session.ts'],
        centroid: ['auth', 'login', 'user']
      };

      const confidence = clusterer.calculateClusterConfidence(tightCluster);

      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('低い凝集度を持つクラスタに低い信頼度を付与する', () => {
      const looseCluster: DomainCluster = {
        id: 'cluster-2',
        name: 'mixed',
        keywords: ['user', 'payment', 'product', 'report', 'config'],
        confidence: 0,
        files: ['file1.ts'],
        centroid: ['mixed']
      };

      const confidence = clusterer.calculateClusterConfidence(looseCluster);

      // 5個のキーワードで1ファイルは低凝集度として扱われる
      expect(confidence).toBeLessThan(0.6);
      expect(confidence).toBeGreaterThanOrEqual(0);
    });

    it('空のクラスタに0の信頼度を付与する', () => {
      const emptyCluster: DomainCluster = {
        id: 'cluster-3',
        name: 'empty',
        keywords: [],
        confidence: 0,
        files: []
      };

      const confidence = clusterer.calculateClusterConfidence(emptyCluster);

      expect(confidence).toBe(0);
    });
  });

  describe('クラスタ数の最適化', () => {
    it('エルボー法を使用して最適なクラスタ数を推定できる', () => {
      const vectors: TFIDFVector[] = [
        // ユーザー管理関連
        { documentId: 'user1.ts', vector: new Map([['user', 0.9], ['profile', 0.8]]) },
        { documentId: 'user2.ts', vector: new Map([['user', 0.8], ['settings', 0.7]]) },
        // 支払い関連
        { documentId: 'pay1.ts', vector: new Map([['payment', 0.9], ['transaction', 0.8]]) },
        { documentId: 'pay2.ts', vector: new Map([['billing', 0.8], ['invoice', 0.7]]) },
        // 商品管理関連
        { documentId: 'prod1.ts', vector: new Map([['product', 0.9], ['inventory', 0.8]]) },
        { documentId: 'prod2.ts', vector: new Map([['item', 0.8], ['stock', 0.7]]) }
      ];

      const optimalK = clusterer.optimizeClusterCount(vectors);

      // 3つの明確なグループがあるので、最適なKは3付近になるはず
      expect(optimalK).toBeGreaterThanOrEqual(2);
      expect(optimalK).toBeLessThanOrEqual(4);
    });

    it('ベクトル数が少ない場合は最小クラスタ数を返す', () => {
      const vectors: TFIDFVector[] = [
        { documentId: 'doc1.ts', vector: new Map([['keyword', 0.5]]) }
      ];

      const optimalK = clusterer.optimizeClusterCount(vectors);

      expect(optimalK).toBe(1);
    });
  });

  describe('統合機能', () => {
    it('キーワード情報からドメインクラスタを生成できる', () => {
      const keywords = new Map<string, KeywordInfo>([
        ['authentication', { keyword: 'authentication', frequency: 10, files: ['auth.ts', 'login.ts'] }],
        ['login', { keyword: 'login', frequency: 8, files: ['login.ts'] }],
        ['payment', { keyword: 'payment', frequency: 12, files: ['payment.ts', 'billing.ts'] }],
        ['transaction', { keyword: 'transaction', frequency: 9, files: ['payment.ts'] }]
      ]);

      const config: ClusteringConfig = {
        k: 2,
        maxIterations: 100,
        tolerance: 0.001
      };

      const clusters = clusterer.clusterFromKeywords(keywords, config);

      expect(clusters).toHaveLength(2);
      expect(clusters.every(c => c.id)).toBeTruthy();
      expect(clusters.every(c => c.name)).toBeTruthy();
      expect(clusters.every(c => c.confidence > 0)).toBeTruthy();
    });

    it('設定パラメータを適切に反映する', () => {
      const keywords = new Map<string, KeywordInfo>([
        ['keyword1', { keyword: 'keyword1', frequency: 5, files: ['file1.ts'] }],
        ['keyword2', { keyword: 'keyword2', frequency: 3, files: ['file2.ts'] }]
      ]);

      const config: ClusteringConfig = {
        k: 1,
        maxIterations: 10,
        tolerance: 0.1
      };

      const clusters = clusterer.clusterFromKeywords(keywords, config);

      expect(clusters).toHaveLength(1);
    });
  });

  describe('エラーハンドリング', () => {
    it('空の入力を適切に処理する', () => {
      const documents = new Map<string, string[]>();
      const vectors = clusterer.calculateTFIDF(documents);

      expect(vectors).toHaveLength(0);
    });

    it('不正なK値を検証する', () => {
      const vectors: TFIDFVector[] = [
        { documentId: 'doc1', vector: new Map([['keyword', 0.5]]) }
      ];

      expect(() => {
        clusterer.performKMeansClustering(vectors, 0);
      }).toThrow('K must be greater than 0');

      expect(() => {
        clusterer.performKMeansClustering(vectors, -1);
      }).toThrow('K must be greater than 0');
    });

    it('K値がベクトル数より大きい場合にエラーを投げる', () => {
      const vectors: TFIDFVector[] = [
        { documentId: 'doc1', vector: new Map([['keyword', 0.5]]) }
      ];

      expect(() => {
        clusterer.performKMeansClustering(vectors, 2);
      }).toThrow('K cannot be greater than the number of documents');
    });
  });
});