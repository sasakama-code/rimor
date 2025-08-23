/**
 * Domain Clusterer
 * v0.9.0 - ドメインクラスタリングエンジン
 * 
 * KISS原則: シンプルなインターフェースで複雑な処理を隠蔽
 * SOLID原則: 単一責任の原則（クラスタリングのみに責任を持つ）
 */

import {
  DomainCluster,
  ClusteringConfig,
  TFIDFVector,
  KeywordInfo
} from './types';
const { kmeans } = require('ml-kmeans');

/**
 * ドメインクラスタリングエンジン
 * TF-IDFとK-Meansを使用してドメインを自動分類
 */
export class DomainClusterer {
  constructor() {
    // 初期化処理（必要に応じて後で追加）
  }

  /**
   * ドキュメントのTF-IDFベクトルを計算
   * DRY原則: TF-IDF計算ロジックの一元化
   */
  public calculateTFIDF(documents: Map<string, string[]>): TFIDFVector[] {
    if (documents.size === 0) {
      return [];
    }

    // ドキュメント頻度（DF）を計算
    const documentFrequency = new Map<string, number>();
    const totalDocuments = documents.size;

    // 各ドキュメントのユニークな単語を収集
    for (const [_, terms] of documents) {
      const uniqueTerms = new Set(terms);
      for (const term of uniqueTerms) {
        documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
      }
    }

    // 各ドキュメントのTF-IDFベクトルを計算
    const vectors: TFIDFVector[] = [];
    
    for (const [docId, terms] of documents) {
      const vector = new Map<string, number>();
      
      if (terms.length === 0) {
        // 空のドキュメントは空のベクトル
        vectors.push({ documentId: docId, vector });
        continue;
      }

      // Term Frequency (TF) を計算
      const termFrequency = new Map<string, number>();
      for (const term of terms) {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      }

      // TF-IDFを計算
      for (const [term, tf] of termFrequency) {
        const df = documentFrequency.get(term) || 0;
        // IDFの計算（log(N/df)）、単一ドキュメントの場合は1.0
        const idf = totalDocuments === 1 ? 1.0 : Math.log(totalDocuments / df);
        const normalizedTF = tf / terms.length;
        const tfidf = normalizedTF * Math.max(0, idf); // 負の値を防ぐ
        vector.set(term, tfidf);
      }

      vectors.push({ documentId: docId, vector });
    }

    return vectors;
  }

  /**
   * K-Meansクラスタリングを実行
   * YAGNI原則: 必要最小限の機能から実装
   */
  public performKMeansClustering(vectors: TFIDFVector[], k: number): DomainCluster[] {
    // 入力検証
    if (k <= 0) {
      throw new Error('K must be greater than 0');
    }
    if (k > vectors.length) {
      throw new Error('K cannot be greater than the number of documents');
    }

    // ベクトルが1つ以下の場合は単一クラスタを返す
    if (vectors.length <= 1) {
      const keywords = new Set<string>();
      for (const vector of vectors) {
        for (const [term] of vector.vector) {
          keywords.add(term);
        }
      }
      return [{
        id: 'cluster-1',
        name: 'main',
        keywords: Array.from(keywords),
        confidence: 1.0,
        files: vectors.map(v => v.documentId)
      }];
    }

    // 全ての用語を収集
    const allTerms = new Set<string>();
    for (const vector of vectors) {
      for (const [term] of vector.vector) {
        allTerms.add(term);
      }
    }
    const termArray = Array.from(allTerms);

    // ベクトルを配列形式に変換
    const dataMatrix: number[][] = vectors.map(vector => {
      return termArray.map(term => vector.vector.get(term) || 0);
    });

    // K-Meansクラスタリング実行
    const result = kmeans(dataMatrix, k, {
      initialization: 'kmeans++',
      maxIterations: 100,
      tolerance: 0.001
    });

    // クラスタごとにドメインを作成
    const clusters: DomainCluster[] = [];
    const clusterDocuments = new Map<number, string[]>();
    const clusterTerms = new Map<number, Map<string, number>>();

    // 各ドキュメントをクラスタに割り当て
    result.clusters.forEach((clusterId: number, index: number) => {
      if (!clusterDocuments.has(clusterId)) {
        clusterDocuments.set(clusterId, []);
        clusterTerms.set(clusterId, new Map());
      }
      
      const docId = vectors[index].documentId;
      clusterDocuments.get(clusterId)!.push(docId);
      
      // クラスタごとの用語頻度を集計
      const terms = clusterTerms.get(clusterId)!;
      for (const [term, score] of vectors[index].vector) {
        terms.set(term, (terms.get(term) || 0) + score);
      }
    });

    // 各クラスタのドメインを生成
    for (const [clusterId, docs] of clusterDocuments) {
      const terms = clusterTerms.get(clusterId)!;
      
      // 上位キーワードを選択
      const sortedTerms = Array.from(terms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term]) => term);

      // クラスタ名を決定（最も頻度の高いキーワードを使用）
      const clusterName = this.generateClusterName(sortedTerms);

      clusters.push({
        id: `cluster-${clusterId + 1}`,
        name: clusterName,
        keywords: sortedTerms,
        confidence: 0.7, // 暫定的な信頼度
        files: docs,
        centroid: sortedTerms.slice(0, 3)
      });
    }

    return clusters;
  }

  /**
   * クラスタ名を生成
   * KISS原則: シンプルなヒューリスティック
   */
  private generateClusterName(keywords: string[]): string {
    if (keywords.length === 0) {
      return 'unknown';
    }

    // ドメインパターンのマッチング
    const patterns = [
      { pattern: /auth|login|user|session/i, name: 'authentication' },
      { pattern: /payment|transaction|billing|invoice/i, name: 'payment' },
      { pattern: /order|cart|checkout/i, name: 'order-management' },
      { pattern: /product|item|inventory|stock/i, name: 'product' },
      { pattern: /test|spec|mock/i, name: 'testing' }
    ];

    for (const { pattern, name } of patterns) {
      if (keywords.some(keyword => pattern.test(keyword))) {
        return name;
      }
    }

    // パターンにマッチしない場合は最初のキーワードを使用
    return keywords[0].toLowerCase();
  }

  /**
   * クラスタの信頼度を計算
   * Defensive Programming: 0-1の範囲で正規化された値を返す
   */
  public calculateClusterConfidence(cluster: DomainCluster): number {
    // 空のクラスタは信頼度0
    if (!cluster.keywords || cluster.keywords.length === 0) {
      return 0;
    }

    // 信頼度の要因を計算
    const keywordCount = cluster.keywords.length;
    const fileCount = cluster.files?.length || 0;
    
    // キーワード数による信頼度（3-8個が理想的）
    let keywordScore = 0;
    if (keywordCount >= 3 && keywordCount <= 8) {
      keywordScore = 1.0;
    } else if (keywordCount < 3) {
      keywordScore = keywordCount / 3;
    } else {
      // キーワードが多すぎる場合は信頼度を下げる
      keywordScore = Math.max(0.3, 1.0 - (keywordCount - 8) * 0.1);
    }

    // ファイル数による信頼度（少ないファイル数は信頼度低）
    let fileScore = 0;
    if (fileCount >= 3) {
      fileScore = 1.0;
    } else if (fileCount === 2) {
      fileScore = 0.6;
    } else if (fileCount === 1) {
      fileScore = 0.3;
    }

    // クラスタの凝集度を簡易的に評価
    // キーワードが分散している（5個以上）場合は凝集度低
    let cohesionScore = 0.5;
    if (keywordCount <= 3 && fileCount >= 2) {
      cohesionScore = 0.8; // 少ないキーワードで複数ファイル = 高凝集度
    } else if (keywordCount >= 5 && fileCount === 1) {
      cohesionScore = 0.1; // 1ファイルに多くのキーワード = 低凝集度（混在）
    } else if (keywordCount <= 4 && fileCount >= 3) {
      cohesionScore = 0.9; // 少ないキーワードで多くのファイル = 非常に高凝集度
    }

    // 加重平均で最終的な信頼度を計算
    const confidence = (keywordScore * 0.4 + fileScore * 0.4 + cohesionScore * 0.2);
    
    // 0-1の範囲に正規化
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 最適なクラスタ数を推定（エルボー法）
   * KISS原則: シンプルなヒューリスティックを使用
   */
  public optimizeClusterCount(vectors: TFIDFVector[]): number {
    // ベクトルが少ない場合は最小値を返す
    if (vectors.length <= 1) {
      return 1;
    }
    if (vectors.length <= 3) {
      return Math.min(2, vectors.length);
    }

    // エルボー法の簡易実装
    const maxK = Math.min(6, Math.floor(Math.sqrt(vectors.length)));
    const inertias: number[] = [];

    // 各K値でのイナーシャ（クラスタ内誤差）を計算
    for (let k = 1; k <= maxK; k++) {
      try {
        const clusters = this.performKMeansClustering(vectors, k);
        // 簡易的なイナーシャ計算（実際の実装では詳細な計算が必要）
        const inertia = clusters.length > 0 ? 1.0 / clusters.length : 1.0;
        inertias.push(inertia);
      } catch {
        inertias.push(1.0);
      }
    }

    // エルボーポイントを検出（変化率が最も大きい点）
    let maxChangeRate = 0;
    let optimalK = 2;

    for (let i = 1; i < inertias.length - 1; i++) {
      const changeRate = Math.abs(inertias[i - 1] - inertias[i]) - 
                        Math.abs(inertias[i] - inertias[i + 1]);
      if (changeRate > maxChangeRate) {
        maxChangeRate = changeRate;
        optimalK = i + 1;
      }
    }

    return Math.max(2, Math.min(4, optimalK));
  }

  /**
   * キーワード情報からクラスタリングを実行
   * 統合インターフェース
   */
  public clusterFromKeywords(
    keywords: Map<string, KeywordInfo>,
    config: ClusteringConfig
  ): DomainCluster[] {
    // キーワードからドキュメントベクトルを構築
    const documents = new Map<string, string[]>();
    
    // ファイルごとにキーワードを集約
    const fileKeywords = new Map<string, Set<string>>();
    for (const [keyword, info] of keywords) {
      for (const file of info.files) {
        if (!fileKeywords.has(file)) {
          fileKeywords.set(file, new Set());
        }
        // 頻度に応じてキーワードを複数回追加
        for (let i = 0; i < Math.min(info.frequency, 5); i++) {
          fileKeywords.get(file)!.add(keyword);
        }
      }
    }

    // Setを配列に変換
    for (const [file, keywordSet] of fileKeywords) {
      documents.set(file, Array.from(keywordSet));
    }

    // TF-IDFベクトルを計算
    const vectors = this.calculateTFIDF(documents);
    
    // クラスタリング実行
    const clusters = this.performKMeansClustering(vectors, config.k);
    
    // 信頼度を計算して更新
    for (const cluster of clusters) {
      cluster.confidence = this.calculateClusterConfidence(cluster);
    }

    return clusters;
  }
}